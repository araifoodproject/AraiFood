// ============================================================
// src/pages/admin/AdminNotificationsPage.jsx
// V4 — + Templates, Analytics, Smart User Filtering
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { auth, db } from '../../firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
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
  FileText,
  BarChart3,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Target,
  MousePointerClick,
} from 'lucide-react'
import { toast } from 'react-toastify'
import AdminSidebar from '../../components/AdminSidebar'
import NotificationPanel from '../../components/NotificationPanel'
import {
  sendPushNotification,
  saveInAppNotification,
} from '../../utils/sendNotification'
import { getSubscriptionStatus } from '../../utils/oneSignal'

// Collections to scan
const SUBSCRIBER_COLLECTIONS = [
  { key: 'users', label: 'Customers', role: 'customer' },
  { key: 'restaurants', label: 'Restaurants', role: 'restaurant' },
  { key: 'riders', label: 'Riders', role: 'rider' },
  { key: 'pharmacies', label: 'Pharmacies', role: 'pharmacy' },
]

// ✅ Default starter templates
const DEFAULT_TEMPLATES = [
  {
    name: '🎉 Welcome Offer',
    title: '🎉 Welcome to AraiFood!',
    body: 'Thanks for joining! Get your first order at special discounts.',
    clickUrl: '/',
  },
  {
    name: '🏷️ Weekend Discount',
    title: '🏷️ Weekend Special!',
    body: 'Enjoy exclusive weekend discounts on all orders. Order now!',
    clickUrl: '/offers',
  },
  {
    name: '🎁 Festival Sale',
    title: '🎁 Festival Mega Sale!',
    body: 'Celebrate with special discounts on your favourite food. Limited time!',
    clickUrl: '/offers',
  },
  {
    name: '🚚 Free Delivery',
    title: '🚚 Free Delivery Today!',
    body: 'No delivery charges on orders above ৳500. Order now!',
    clickUrl: '/',
  },
  {
    name: '⚡ Flash Sale',
    title: '⚡ Flash Sale Alert!',
    body: 'Hurry! Special discounts for the next 2 hours only.',
    clickUrl: '/offers',
  },
]

function AdminNotificationsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('compose') // compose | templates | analytics

  // Compose state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [clickUrl, setClickUrl] = useState('/')
  const [sending, setSending] = useState(false)

  // Data
  const [allUsers, setAllUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [myStatus, setMyStatus] = useState(null)

  // Templates
  const [customTemplates, setCustomTemplates] = useState([])
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [templateUrl, setTemplateUrl] = useState('/')
  const [savingTemplate, setSavingTemplate] = useState(false)

  // ============ LOAD ALL USERS ============
  useEffect(() => {
    const unsubscribers = []
    const collectionData = {
      users: [],
      restaurants: [],
      riders: [],
      pharmacies: [],
    }

    const mergeAndSet = () => {
      // ✅ SMART FILTERING:
      // - Exclude admins (role === 'admin')
      // - Exclude non-approved status (restaurants/riders/pharmacies)
      // - Users collection has no status field — include all non-admin
      const filtered = [
        ...collectionData.users.filter((u) => u.role !== 'admin'),
        ...collectionData.restaurants.filter(
          (r) => !r.status || r.status === 'approved'
        ),
        ...collectionData.riders.filter(
          (r) => !r.status || r.status === 'approved'
        ),
        ...collectionData.pharmacies.filter(
          (p) => !p.status || p.status === 'approved'
        ),
      ]
      setAllUsers(filtered)
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
              role: data.role || role,
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
      limit(100)
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
            setHistory(list.slice(0, 100))
            setHistoryLoading(false)
          }
        )
        return unsub2
      }
    )
    return () => unsub()
  }, [])

  // ============ LOAD CUSTOM TEMPLATES ============
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'notificationTemplates'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setCustomTemplates(list)
      },
      (err) => console.error('Templates load error:', err)
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

  // ============ ANALYTICS ============
  const analytics = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now)
    monthStart.setDate(now.getDate() - 30)

    let todayCount = 0
    let weekCount = 0
    let monthCount = 0
    let totalCount = 0

    const typeCounts = {}

    history.forEach((h) => {
      totalCount++
      const t = h.createdAt?.toDate?.()
      if (!t) return

      if (t >= todayStart) todayCount++
      if (t >= weekStart) weekCount++
      if (t >= monthStart) monthCount++

      const type = h.type || 'general'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    return {
      todayCount,
      weekCount,
      monthCount,
      totalCount,
      typeCounts,
      avgPerDay: monthCount > 0 ? (monthCount / 30).toFixed(1) : 0,
    }
  }, [history])

  // ============ SEND ============
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

      // 1️⃣ Save in-app
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

      // 2️⃣ Push
      let pushResult
      const targetUids = targetUsers.map((u) => u.uid)

      if (targetType === 'all') {
        pushResult = await sendPushNotification({
          title: title.trim(),
          body: body.trim(),
          userIds: null,
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
            pushCount > 0 ? pushCount : 'skipped'
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
          `⚠️ In-app sent to ${targetUsers.length} users, but push failed.`
        )
      }
    } catch (err) {
      console.error('Send error:', err)
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  // ============ TEMPLATE ACTIONS ============
  const applyTemplate = (tpl) => {
    setTitle(tpl.title || '')
    setBody(tpl.body || '')
    setClickUrl(tpl.clickUrl || '/')
    setActiveTab('compose')
    toast.success(`Template applied: ${tpl.name}`)
  }

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Template name required')
      return
    }
    if (!templateTitle.trim() || !templateBody.trim()) {
      toast.error('Title & body required')
      return
    }

    setSavingTemplate(true)
    try {
      await addDoc(collection(db, 'notificationTemplates'), {
        name: templateName.trim(),
        title: templateTitle.trim(),
        body: templateBody.trim(),
        clickUrl: templateUrl.trim() || '/',
        createdAt: serverTimestamp(),
      })
      toast.success('✅ Template saved!')
      setTemplateName('')
      setTemplateTitle('')
      setTemplateBody('')
      setTemplateUrl('/')
      setShowAddTemplate(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const deleteTemplate = async (id, name) => {
    if (!window.confirm(`Delete template "${name}"?`)) return
    try {
      await deleteDoc(doc(db, 'notificationTemplates', id))
      toast.success('Template deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const saveCurrentAsTemplate = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Fill in title and body first')
      return
    }
    const name = window.prompt('Template name:')
    if (!name?.trim()) return

    try {
      await addDoc(collection(db, 'notificationTemplates'), {
        name: name.trim(),
        title: title.trim(),
        body: body.trim(),
        clickUrl: clickUrl.trim() || '/',
        createdAt: serverTimestamp(),
      })
      toast.success('✅ Saved as template!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save')
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

  // ============ TABS ============
  const tabs = [
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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
              Send instant updates. Templates speed up your workflow.
            </p>
          </div>
        </div>

        {/* TABS */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '6px',
            borderRadius: '14px',
            background: 'var(--surface-soft)',
            border: '1px solid var(--border)',
            marginBottom: '20px',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '1 1 auto',
                  minWidth: '120px',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  background: active
                    ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                    : 'transparent',
                  border: 'none',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'inherit',
                  boxShadow: active
                    ? '0 4px 12px rgba(59,130,246,0.3)'
                    : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={16} strokeWidth={2.4} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* STATS — Always visible */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <StatCard
            icon={<Users size={22} color="#2563EB" strokeWidth={2.4} />}
            label="Total Users"
            value={counts.all}
            bg="linear-gradient(135deg, #DBEAFE, #BFDBFE)"
          />
          <StatCard
            icon={<Bell size={22} color="#fff" strokeWidth={2.4} />}
            label="Push Subscribers"
            value={`${counts.subscribed} / ${counts.all}`}
            bg="linear-gradient(135deg, #10B981, #047857)"
            valueColor="#047857"
            highlight
          />
          <StatCard
            icon={<TrendingUp size={22} color="#D97706" strokeWidth={2.4} />}
            label="Subscribe Rate"
            value={`${subscriberRate}%`}
            bg="linear-gradient(135deg, #FEF3C7, #FDE68A)"
            valueColor={subscriberRate > 50 ? '#047857' : '#D97706'}
          />
          <StatCard
            icon={
              <Megaphone size={22} color="#7C3AED" strokeWidth={2.4} />
            }
            label="Total Sent"
            value={analytics.totalCount}
            bg="linear-gradient(135deg, #EDE9FE, #DDD6FE)"
            valueColor="#7C3AED"
          />
        </div>

        {counts.subscribed < counts.all && activeTab === 'compose' && (
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
              enabled push notifications yet. They'll receive in-app only.
            </span>
          </div>
        )}

        {/* ==================== COMPOSE TAB ==================== */}
        {activeTab === 'compose' && (
          <>
            {/* Quick Templates Row */}
            {(DEFAULT_TEMPLATES.length > 0 ||
              customTemplates.length > 0) && (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <Sparkles size={16} color="#D97706" />
                  <strong
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Quick Templates
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                  }}
                >
                  {[...DEFAULT_TEMPLATES, ...customTemplates].map((tpl, i) => (
                    <button
                      key={tpl.id || `default-${i}`}
                      onClick={() => applyTemplate(tpl)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--surface-soft)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FileText size={13} />
                      {tpl.name}
                    </button>
                  ))}
                </div>
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
              {/* LEFT — COMPOSE */}
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
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background:
                        'linear-gradient(135deg, #3B82F6, #2563EB)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                    }}
                  >
                    <Bell size={22} color="#fff" strokeWidth={2.4} />
                  </div>
                  <div style={{ flex: 1 }}>
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
                  {(title.trim() || body.trim()) && (
                    <button
                      onClick={saveCurrentAsTemplate}
                      title="Save as template"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        background: 'rgba(217,119,6,0.1)',
                        border: '1px solid rgba(217,119,6,0.3)',
                        color: '#D97706',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Save size={13} />
                      Save as Template
                    </button>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 🎉 50% OFF Today Only!"
                    maxLength={80}
                    style={inputStyle}
                  />
                  <div style={counterStyle}>{title.length}/80</div>
                </div>

                {/* Body */}
                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    maxLength={200}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' }}
                  />
                  <div style={counterStyle}>{body.length}/200</div>
                </div>

                {/* Target */}
                <div>
                  <label style={labelStyle}>Send To *</label>
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
                            fontFamily: 'inherit',
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

                {/* Specific User Search */}
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
                      style={inputStyle}
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
                          <p style={emptyTextStyle}>Loading users...</p>
                        ) : filteredUsers.length === 0 ? (
                          <p style={emptyTextStyle}>No users found</p>
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
                                fontFamily: 'inherit',
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
                                {(u.displayName || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
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
                        ...labelStyle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <LinkIcon size={13} /> Click URL
                    </label>
                    <input
                      type="text"
                      value={clickUrl}
                      onChange={(e) => setClickUrl(e.target.value)}
                      placeholder="/orders"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        ...labelStyle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ImageIcon size={13} /> Image URL
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      style={inputStyle}
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
                    fontFamily: 'inherit',
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

              {/* RIGHT — Preview */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <PreviewCard title={title} body={body} imageUrl={imageUrl} />
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
                  more clicks. Use emojis to make them stand out.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== TEMPLATES TAB ==================== */}
        {activeTab === 'templates' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px',
                    fontWeight: 800,
                  }}
                >
                  📝 Notification Templates
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  Reusable templates to speed up your campaigns
                </p>
              </div>
              <button
                onClick={() => setShowAddTemplate(!showAddTemplate)}
                style={{
                  padding: '12px 22px',
                  borderRadius: '999px',
                  background: showAddTemplate
                    ? 'var(--surface-soft)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  color: showAddTemplate
                    ? 'var(--text-secondary)'
                    : '#FFFFFF',
                  border: showAddTemplate
                    ? '1px solid var(--border)'
                    : 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: showAddTemplate
                    ? 'none'
                    : '0 4px 12px rgba(5,150,105,0.3)',
                  fontFamily: 'inherit',
                }}
              >
                {showAddTemplate ? <Trash2 size={16} /> : <Plus size={16} />}
                {showAddTemplate ? 'Cancel' : 'New Template'}
              </button>
            </div>

            {/* Add form */}
            {showAddTemplate && (
              <div
                style={{
                  padding: '20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={labelStyle}>Template Name *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., 🎉 Friday Sale"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input
                    type="text"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    placeholder="Notification title"
                    maxLength={80}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder="Notification body"
                    rows={3}
                    maxLength={200}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Click URL</label>
                  <input
                    type="text"
                    value={templateUrl}
                    onChange={(e) => setTemplateUrl(e.target.value)}
                    placeholder="/offers"
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={saveTemplate}
                  disabled={savingTemplate}
                  style={{
                    padding: '14px',
                    borderRadius: '999px',
                    background: savingTemplate
                      ? 'var(--surface-soft)'
                      : 'linear-gradient(135deg, #059669, #047857)',
                    color: savingTemplate ? 'var(--text-tertiary)' : '#FFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: savingTemplate ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'inherit',
                  }}
                >
                  {savingTemplate ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Template
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Default Templates */}
            <div>
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '10px',
                }}
              >
                ⭐ Starter Templates
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                }}
              >
                {DEFAULT_TEMPLATES.map((tpl, i) => (
                  <TemplateCard
                    key={i}
                    tpl={tpl}
                    onUse={() => applyTemplate(tpl)}
                  />
                ))}
              </div>
            </div>

            {/* Custom Templates */}
            {customTemplates.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                  }}
                >
                  📁 Your Templates ({customTemplates.length})
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {customTemplates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      tpl={tpl}
                      onUse={() => applyTemplate(tpl)}
                      onDelete={() => deleteTemplate(tpl.id, tpl.name)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ANALYTICS TAB ==================== */}
        {activeTab === 'analytics' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                📊 Push Analytics
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                Track your notification performance over time
              </p>
            </div>

            {/* Analytics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <AnalyticsCard
                label="Today"
                value={analytics.todayCount}
                sub="notifications sent"
                color="#3B82F6"
              />
              <AnalyticsCard
                label="Last 7 Days"
                value={analytics.weekCount}
                sub="notifications sent"
                color="#10B981"
              />
              <AnalyticsCard
                label="Last 30 Days"
                value={analytics.monthCount}
                sub="notifications sent"
                color="#F59E0B"
              />
              <AnalyticsCard
                label="Daily Average"
                value={analytics.avgPerDay}
                sub="per day (30d)"
                color="#8B5CF6"
              />
            </div>

            {/* Subscriber Overview */}
            <div
              style={{
                padding: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                }}
              >
                🎯 Subscriber Overview
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                }}
              >
                <MiniStat
                  label="Total Users"
                  value={counts.all}
                  icon={<Users size={18} />}
                />
                <MiniStat
                  label="Subscribed"
                  value={counts.subscribed}
                  icon={<Bell size={18} />}
                  color="#059669"
                />
                <MiniStat
                  label="Not Subscribed"
                  value={counts.all - counts.subscribed}
                  icon={<AlertCircle size={18} />}
                  color="#D97706"
                />
                <MiniStat
                  label="Rate"
                  value={`${subscriberRate}%`}
                  icon={<Target size={18} />}
                  color="#7C3AED"
                />
              </div>
            </div>

            {/* Audience Breakdown */}
            <div
              style={{
                padding: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                }}
              >
                👥 Audience Breakdown
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                }}
              >
                <AudienceCard
                  label="Customers"
                  value={counts.customer}
                  icon={<Users size={16} />}
                  color="#10B981"
                />
                <AudienceCard
                  label="Restaurants"
                  value={counts.restaurant}
                  icon={<Store size={16} />}
                  color="#F59E0B"
                />
                <AudienceCard
                  label="Riders"
                  value={counts.rider}
                  icon={<Bike size={16} />}
                  color="#8B5CF6"
                />
                <AudienceCard
                  label="Pharmacies"
                  value={counts.pharmacy}
                  icon={<Pill size={16} />}
                  color="#EC4899"
                />
              </div>
            </div>

            {/* Recent Activity List */}
            <div
              style={{
                padding: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                }}
              >
                🕐 Recent Sent ({history.length})
              </h3>
              {history.length === 0 ? (
                <p style={emptyTextStyle}>No notifications sent yet</p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {history.slice(0, 20).map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '12px 14px',
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
          </div>
        )}
      </main>
    </div>
  )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({ icon, label, value, bg, valueColor, highlight }) {
  return (
    <div
      style={{
        padding: '18px',
        borderRadius: '16px',
        background: highlight
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))'
          : 'var(--surface)',
        border: highlight
          ? '1px solid rgba(16,185,129,0.25)'
          : '1px solid var(--border)',
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
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: highlight
            ? '0 4px 12px rgba(16,185,129,0.35)'
            : 'none',
        }}
      >
        {icon}
      </div>
      <div>
        <span
          style={{
            display: 'block',
            fontSize: '11.5px',
            fontWeight: 800,
            color: highlight ? '#047857' : 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '2px',
          }}
        >
          {label}
        </span>
        <strong
          style={{
            display: 'block',
            fontSize: '22px',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: valueColor || 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  )
}

function PreviewCard({ title, body, imageUrl }) {
  return (
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
          style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
  )
}

function TemplateCard({ tpl, onUse, onDelete }) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <strong
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            flex: 1,
          }}
        >
          {tpl.name}
        </strong>
        {onDelete && (
          <button
            onClick={onDelete}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#DC2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div
        style={{
          fontSize: '12.5px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>{tpl.title}</strong>
        <br />
        <span style={{ color: 'var(--text-tertiary)' }}>{tpl.body}</span>
      </div>
      <button
        onClick={onUse}
        style={{
          padding: '10px',
          borderRadius: '10px',
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))',
          border: '1px solid rgba(59,130,246,0.3)',
          color: '#2563EB',
          fontSize: '12.5px',
          fontWeight: 800,
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <Send size={13} />
        Use This Template
      </button>
    </div>
  )
}

function AnalyticsCard({ label, value, sub, color }) {
  return (
    <div
      style={{
        padding: '18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: '11.5px',
          fontWeight: 800,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '6px',
        }}
      >
        {label}
      </span>
      <strong
        style={{
          display: 'block',
          fontSize: '28px',
          fontWeight: 900,
          fontFamily: 'var(--font-heading)',
          color: color,
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {value}
      </strong>
      <span
        style={{
          fontSize: '11.5px',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
        }}
      >
        {sub}
      </span>
    </div>
  )
}

function MiniStat({ label, value, icon, color }) {
  return (
    <div
      style={{
        padding: '14px',
        background: 'var(--surface-soft)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color || 'var(--text-secondary)'}18`,
          color: color || 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <strong
          style={{
            display: 'block',
            fontSize: '18px',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: color || 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </strong>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function AudienceCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        padding: '14px',
        background: 'var(--surface-soft)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}18`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <strong
        style={{
          fontSize: '20px',
          fontWeight: 900,
          fontFamily: 'var(--font-heading)',
          color: color,
          lineHeight: 1,
        }}
      >
        {value}
      </strong>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ============================================================
// STYLES
// ============================================================
const labelStyle = {
  display: 'block',
  fontSize: '12.5px',
  fontWeight: 800,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-soft)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
}

const counterStyle = {
  marginTop: '6px',
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
  textAlign: 'right',
}

const emptyTextStyle = {
  padding: '12px',
  fontSize: '12.5px',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
}

export default AdminNotificationsPage