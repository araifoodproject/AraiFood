// ============================================================
// src/pages/admin/AdminNotificationsPage.jsx
// V3 — Counts subscribers across ALL collections
// (users + restaurants + riders + pharmacies)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { auth, db } from '../../firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import {
  Bell,
  Send,
  Users,
  User,
  Megaphone,
  Store,
  Bike,
  Pill,
  Search,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-toastify'
import AdminSidebar from '../../components/AdminSidebar'
import NotificationPanel from '../../components/NotificationPanel'
import {
  sendPushNotification,
  saveInAppNotification,
} from '../../utils/sendNotification'
import { getSubscriptionStatus } from '../../utils/oneSignal'

// Collections to scan for subscribers
const SUBSCRIBER_COLLECTIONS = [
  { key: 'users', label: 'Customers', role: 'customer' },
  { key: 'restaurants', label: 'Restaurants', role: 'restaurant' },
  { key: 'riders', label: 'Riders', role: 'rider' },
  { key: 'pharmacies', label: 'Pharmacies', role: 'pharmacy' },
]

function AdminNotificationsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [clickUrl, setClickUrl] = useState('/')
  const [sending, setSending] = useState(false)

  // ⭐ All users across ALL collections
  const [allUsers, setAllUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const [myStatus, setMyStatus] = useState(null)

  // ============ LOAD ALL USERS FROM ALL COLLECTIONS ============
  useEffect(() => {
    const unsubscribers = []
    const collectionData = {
      users: [],
      restaurants: [],
      riders: [],
      pharmacies: [],
    }

    const mergeAndSet = () => {
      const merged = [
        ...collectionData.users,
        ...collectionData.restaurants,
        ...collectionData.riders,
        ...collectionData.pharmacies,
      ]
      setAllUsers(merged)
      setLoadingUsers(false)
    }

    SUBSCRIBER_COLLECTIONS.forEach(({ key, role }) => {
      const unsub = onSnapshot(
        collection(db, key),
        (snap) => {
          collectionData[key] = snap.docs.map((d) => {
            const data = d.data()
            return {
              uid: d.id,
              ...data,
              // Force role if not set
              role: data.role || role,
              // Standardize name field
              displayName:
                data.fullName ||
                data.restaurantName ||
                data.pharmacyName ||
                data.email ||
                'User',
              _collection: key,
            }
          })
          mergeAndSet()
        },
        (err) => {
          console.error(`${key} load error:`, err)
          collectionData[key] = []
          mergeAndSet()
        }
      )
      unsubscribers.push(unsub)
    })

    return () => unsubscribers.forEach((u) => u())
  }, [])

  // ============ LOAD HISTORY ============
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setHistory(list)
        setHistoryLoading(false)
      },
      () => {
        const unsub2 = onSnapshot(
          collection(db, 'notifications'),
          (snap) => {
            const list = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            setHistory(list.slice(0, 20))
            setHistoryLoading(false)
          }
        )
        return unsub2
      }
    )
    return () => unsub()
  }, [])

  // ============ MY SUBSCRIPTION ============
  useEffect(() => {
    const check = async () => {
      try {
        const sub = await getSubscriptionStatus()
        setMyStatus(sub)
      } catch (e) {
        console.warn('My subscription check failed:', e)
      }
    }
    check()
  }, [])

  // ============ FILTERED USERS ============
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers.slice(0, 15)
    const term = userSearch.toLowerCase().trim()
    return allUsers
      .filter((u) => {
        const name = (u.displayName || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        const phone = (u.phone || '').toLowerCase()
        return (
          name.includes(term) ||
          email.includes(term) ||
          phone.includes(term)
        )
      })
      .slice(0, 15)
  }, [userSearch, allUsers])

  // ============ COUNTS ============
  const counts = useMemo(() => {
    const c = {
      all: allUsers.length,
      customer: 0,
      restaurant: 0,
      rider: 0,
      pharmacy: 0,
      subscribed: 0,
    }
    allUsers.forEach((u) => {
      const r = u.role || 'customer'
      if (c[r] !== undefined) c[r]++
      if (u.notificationEnabled === true && u.fcmToken) c.subscribed++
    })
    return c
  }, [allUsers])

  const subscriberRate =
    counts.all > 0 ? Math.round((counts.subscribed / counts.all) * 100) : 0

  // ============ SEND HANDLER ============
  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!body.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (targetType === 'specific' && !selectedUser) {
      toast.error('Please select a user')
      return
    }

    setSending(true)

    try {
      let targetUsers = []

      if (targetType === 'all') {
        targetUsers = allUsers
      } else if (targetType === 'specific') {
        targetUsers = [selectedUser]
      } else {
        targetUsers = allUsers.filter(
          (u) => (u.role || 'customer') === targetType
        )
      }

      if (targetUsers.length === 0) {
        toast.warn('No users found for this target')
        setSending(false)
        return
      }

      // 1️⃣ Firestore in-app notification for each user
      for (const u of targetUsers) {
        await saveInAppNotification(
          u.uid,
          title.trim(),
          body.trim(),
          'admin',
          {
            url: clickUrl,
            imageUrl: imageUrl || null,
            sentBy: auth.currentUser?.uid || 'admin',
            sentByEmail: auth.currentUser?.email || '',
          }
        )
      }

      // 2️⃣ Push via OneSignal (send to all target UIDs at once)
      let pushResult
      const targetUids = targetUsers.map((u) => u.uid)

      if (targetType === 'all') {
        pushResult = await sendPushNotification({
          title: title.trim(),
          body: body.trim(),
          userIds: null, // Broadcast to all subscribed
          url: clickUrl || '/',
          imageUrl: imageUrl || null,
        })
      } else {
        pushResult = await sendPushNotification({
          title: title.trim(),
          body: body.trim(),
          userIds: targetUids,
          url: clickUrl || '/',
          imageUrl: imageUrl || null,
        })
      }

      if (pushResult.success) {
        const pushCount = pushResult.recipients || 0
        toast.success(
          `✅ Sent! In-app: ${targetUsers.length} · Push: ${
            pushCount > 0 ? pushCount : 'sent'
          }`
        )
        setTitle('')
        setBody('')
        setImageUrl('')
        setClickUrl('/')
        setSelectedUser(null)
        setUserSearch('')
      } else {
        toast.warn(
          `⚠️ In-app sent to ${targetUsers.length} users, but push failed. Check console.`
        )
        console.error('Push failed:', pushResult.error)
      }
    } catch (err) {
      console.error('Send error:', err)
      toast.error('Something went wrong. Check console.')
    } finally {
      setSending(false)
    }
  }

  // ============ TARGET OPTIONS ============
  const targetOptions = [
    {
      value: 'all',
      label: 'All Users',
      icon: Megaphone,
      count: counts.all,
      color: '#3B82F6',
    },
    {
      value: 'customer',
      label: 'Customers',
      icon: Users,
      count: counts.customer,
      color: '#10B981',
    },
    {
      value: 'restaurant',
      label: 'Restaurants',
      icon: Store,
      count: counts.restaurant,
      color: '#F59E0B',
    },
    {
      value: 'rider',
      label: 'Riders',
      icon: Bike,
      count: counts.rider,
      color: '#8B5CF6',
    },
    {
      value: 'pharmacy',
      label: 'Pharmacies',
      icon: Pill,
      count: counts.pharmacy,
      color: '#EC4899',
    },
    {
      value: 'specific',
      label: 'Specific User',
      icon: User,
      count: null,
      color: '#06B6D4',
    },
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="admin-topbar-search">
            <Search size={18} strokeWidth={2} />
            <input type="text" placeholder="Search..." readOnly />
          </div>
          <div className="admin-topbar-actions">
            <NotificationPanel />
            <div className="admin-topbar-profile">
              <div className="admin-topbar-avatar">👑</div>
              <div className="admin-topbar-profile-info">
                <strong>Admin</strong>
                <small>Super Admin</small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">MARKETING</span>
            <h1 className="admin-page-title">Push Notifications 🔔</h1>
            <p className="admin-page-sub">
              Send instant updates to your users. Notifications appear both
              in-app and as browser push.
            </p>
          </div>
        </div>

        {/* STATS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={22} color="#2563EB" strokeWidth={2.4} />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}
              >
                Total Users
              </span>
              <strong
                style={{
                  display: 'block',
                  fontSize: '24px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {counts.all}
              </strong>
            </div>
          </div>

          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
              border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
              }}
            >
              <Bell size={22} color="#fff" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}
              >
                Push Subscribers
              </span>
              <div
                style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}
              >
                <strong
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: '#047857',
                    lineHeight: 1,
                  }}
                >
                  {counts.subscribed}
                </strong>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#059669',
                  }}
                >
                  / {counts.all}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={22} color="#D97706" strokeWidth={2.4} />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}
              >
                Subscribe Rate
              </span>
              <strong
                style={{
                  display: 'block',
                  fontSize: '24px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  color: subscriberRate > 50 ? '#047857' : '#D97706',
                  lineHeight: 1,
                }}
              >
                {subscriberRate}%
              </strong>
            </div>
          </div>

          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Megaphone size={22} color="#7C3AED" strokeWidth={2.4} />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}
              >
                In-App Reach
              </span>
              <strong
                style={{
                  display: 'block',
                  fontSize: '24px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  color: '#7C3AED',
                  lineHeight: 1,
                }}
              >
                100%
              </strong>
            </div>
          </div>
        </div>

        {counts.subscribed < counts.all && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#92400E',
            }}
          >
            <AlertCircle size={20} color="#D97706" />
            <span>
              <strong>{counts.all - counts.subscribed} users</strong> haven't
              enabled push notifications yet. They'll receive in-app
              notifications but not push.
            </span>
          </div>
        )}

        {/* MAIN GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* LEFT */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                }}
              >
                <Bell size={22} color="#fff" strokeWidth={2.4} />
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '19px',
                    fontWeight: 800,
                  }}
                >
                  Compose Notification
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  Fill in the details and send instantly
                </p>
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 🎉 50% OFF Today Only!"
                maxLength={80}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-soft)',
                  color: 'var(--text-primary)',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                {title.length}/80
              </div>
            </div>

            {/* Body */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Message *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g., Order your favourite food now and get 50% discount on all items!"
                rows={4}
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-soft)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                {body.length}/200
              </div>
            </div>

            {/* Target */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Send To *
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                }}
              >
                {targetOptions.map((opt) => {
                  const Icon = opt.icon
                  const active = targetType === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTargetType(opt.value)}
                      type="button"
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: active
                          ? `linear-gradient(135deg, ${opt.color}, ${opt.color}dd)`
                          : 'var(--surface-soft)',
                        border: active
                          ? 'none'
                          : '1px solid var(--border)',
                        color: active ? '#fff' : 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'flex-start',
                        boxShadow: active
                          ? `0 4px 12px ${opt.color}55`
                          : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={16} strokeWidth={2.4} />
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        {opt.label}
                      </span>
                      {opt.count !== null && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            opacity: active ? 0.9 : 0.6,
                          }}
                        >
                          {opt.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Specific user */}
            {targetType === 'specific' && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(6,182,212,0.06)',
                  border: '1px solid rgba(6,182,212,0.25)',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#0891B2',
                    marginBottom: '8px',
                  }}
                >
                  Search User
                </label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {selectedUser && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <CheckCircle2 size={18} color="#059669" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#047857',
                        }}
                      >
                        {selectedUser.displayName}
                      </strong>
                      <span
                        style={{
                          fontSize: '11.5px',
                          color: '#047857',
                          fontWeight: 600,
                        }}
                      >
                        {selectedUser.email || selectedUser.uid} ·{' '}
                        {selectedUser.role}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#047857',
                        fontWeight: 800,
                        fontSize: '18px',
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {!selectedUser && (
                  <div
                    style={{
                      marginTop: '10px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {loadingUsers ? (
                      <p
                        style={{
                          padding: '12px',
                          fontSize: '12.5px',
                          color: 'var(--text-tertiary)',
                          textAlign: 'center',
                        }}
                      >
                        Loading users...
                      </p>
                    ) : filteredUsers.length === 0 ? (
                      <p
                        style={{
                          padding: '12px',
                          fontSize: '12.5px',
                          color: 'var(--text-tertiary)',
                          textAlign: 'center',
                        }}
                      >
                        No users found
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={`${u._collection}-${u.uid}`}
                          onClick={() => {
                            setSelectedUser(u)
                            setUserSearch('')
                          }}
                          type="button"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background:
                                'linear-gradient(135deg, #3B82F6, #2563EB)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {(u.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong
                              style={{
                                display: 'block',
                                fontSize: '12.5px',
                                fontWeight: 800,
                              }}
                            >
                              {u.displayName}
                            </strong>
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                fontWeight: 600,
                              }}
                            >
                              {u.email || u.phone || u.uid}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              alignItems: 'flex-end',
                            }}
                          >
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: 'var(--surface-soft)',
                                fontSize: '10px',
                                fontWeight: 800,
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {u.role}
                            </span>
                            {u.notificationEnabled && u.fcmToken ? (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: '#047857',
                                }}
                              >
                                🔔 On
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: '#9CA3AF',
                                }}
                              >
                                🔕 Off
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Optional fields */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <LinkIcon size={13} /> Click URL
                </label>
                <input
                  type="text"
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  placeholder="/orders"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-soft)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <ImageIcon size={13} /> Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-soft)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              style={{
                padding: '16px',
                borderRadius: '999px',
                background:
                  sending || !title.trim() || !body.trim()
                    ? 'var(--surface-soft)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color:
                  sending || !title.trim() || !body.trim()
                    ? 'var(--text-tertiary)'
                    : '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor:
                  sending || !title.trim() || !body.trim()
                    ? 'not-allowed'
                    : 'pointer',
                boxShadow:
                  sending || !title.trim() || !body.trim()
                    ? 'none'
                    : '0 6px 20px rgba(59,130,246,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontFamily: 'var(--font-primary)',
              }}
            >
              {sending ? (
                <>
                  <Loader2
                    size={18}
                    strokeWidth={2.5}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.5} />
                  Send Notification
                </>
              )}
            </button>
          </div>

          {/* RIGHT */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 14px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                👀 Live Preview
              </h3>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #1F2937, #111827)',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src="/araifood-logo.png"
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 800,
                        marginBottom: '2px',
                      }}
                    >
                      {title || 'Notification title'}
                    </strong>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500,
                        display: 'block',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {body || 'Your message will appear here...'}
                    </span>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt=""
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          borderRadius: '8px',
                          maxHeight: '120px',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    <span
                      style={{
                        display: 'block',
                        marginTop: '6px',
                        fontSize: '10.5px',
                        color: 'rgba(255,255,255,0.5)',
                        fontWeight: 600,
                      }}
                    >
                      AraiFood · now
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '12.5px',
                color: '#1D4ED8',
                fontWeight: 600,
                lineHeight: 1.6,
              }}
            >
              💡 <strong>Tip:</strong> Short titles and clear messages get
              more clicks. Use emojis to make notifications stand out.
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div
          style={{
            marginTop: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <Clock size={20} color="#6B7280" />
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: '16px',
                fontWeight: 800,
              }}
            >
              Recent Sent Notifications
            </h3>
          </div>

          {historyLoading ? (
            <p
              style={{
                color: 'var(--text-tertiary)',
                padding: '20px',
                textAlign: 'center',
                fontSize: '13px',
              }}
            >
              Loading history...
            </p>
          ) : history.length === 0 ? (
            <p
              style={{
                color: 'var(--text-tertiary)',
                padding: '20px',
                textAlign: 'center',
                fontSize: '13px',
              }}
            >
              No notifications sent yet. Your first send will appear here.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background:
                        'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={16} color="#2563EB" strokeWidth={2.4} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 800,
                        marginBottom: '3px',
                      }}
                    >
                      {h.title || '(No title)'}
                    </strong>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        display: 'block',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {h.body || '(No body)'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      To: {h.userId === 'all' ? 'All Users' : h.userId} ·{' '}
                      {h.createdAt?.toDate?.()
                        ? h.createdAt.toDate().toLocaleString()
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminNotificationsPage