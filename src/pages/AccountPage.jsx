// ============================================================
// src/pages/AccountPage.jsx
// V3 — With OneSignal Push Notifications
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { auth, db } from '../firebase'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import { toast } from 'react-toastify'
import {
  Camera,
  X,
  Wallet,
  Copy,
  Check,
  LogOut,
  Home as HomeIcon,
  Edit3,
  Bell,
  BellOff,
  BellRing,
} from 'lucide-react'
import {
  enableNotifications,
  disableNotifications,
  getSubscriptionStatus,
  getBrowserPermission,
} from '../utils/oneSignal'

function AccountPage() {
  const { settings } = useSettings()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [pointsHistory, setPointsHistory] = useState([])

  const [totalOrders, setTotalOrders] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)

  const [walletRequests, setWalletRequests] = useState([])
  const [showAddMoney, setShowAddMoney] = useState(false)

  const [editMode, setEditMode] = useState(false)

  // ============ NOTIFICATION STATE ============
  const [notifStatus, setNotifStatus] = useState('checking')
  // 'checking' | 'enabled' | 'disabled' | 'denied' | 'unsupported'
  const [notifLoading, setNotifLoading] = useState(false)

  const fileInputRef = useRef(null)

  // ============ AUTH ============
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const data = userDoc.data()
            localStorage.setItem('userRole', 'customer')

            setFullName(data.fullName || '')
            setPhone(data.phone || '')
            setAddress(data.address || '')
            setProfileImage(data.profileImage || '')
            setLoyaltyPoints(data.loyaltyPoints || 0)
            setWalletBalance(data.walletBalance || 0)
            setWalletTransactions(data.walletTransactions || [])
            setPointsHistory(data.pointsHistory || [])
          } else {
            await setDoc(userDocRef, {
              email: currentUser.email,
              fullName: '',
              phone: '',
              address: '',
              profileImage: '',
              role: 'customer',
              loyaltyPoints: 0,
              walletBalance: 0,
              walletTransactions: [],
              pointsHistory: [],
              createdAt: new Date(),
            })
            localStorage.setItem('userRole', 'customer')
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ============ LOAD ORDERS STATS ============
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data())
      setTotalOrders(list.length)
      setActiveOrders(
        list.filter((o) =>
          ['pending', 'preparing', 'delivering'].includes(o.status) ||
          !o.status
        ).length
      )
      setTotalSpent(
        list
          .filter((o) => o.status !== 'cancelled')
          .reduce((s, o) => s + (o.total || 0), 0)
      )
    })
    return () => unsub()
  }, [user])

  // ============ LOAD WALLET REQUESTS ============
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'walletRequests'),
      where('userId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime?.() || 0
        const bT = b.createdAt?.toDate?.()?.getTime?.() || 0
        return bT - aT
      })
      setWalletRequests(list)
    })
    return () => unsub()
  }, [user])

  // ============ NOTIFICATION STATUS CHECK ============
  useEffect(() => {
    if (!user) return

    const checkStatus = async () => {
      const permission = getBrowserPermission()

      if (permission === 'unsupported') {
        setNotifStatus('unsupported')
        return
      }
      if (permission === 'denied') {
        setNotifStatus('denied')
        return
      }

      const sub = await getSubscriptionStatus()
      setNotifStatus(sub.enabled ? 'enabled' : 'disabled')
    }

    checkStatus()
  }, [user])

  // ============ ENABLE / DISABLE NOTIFICATIONS ============
  const handleToggleNotifications = async () => {
    if (!user) return
    setNotifLoading(true)

    try {
      if (notifStatus === 'enabled') {
        const res = await disableNotifications(user)
        if (res.success) {
          toast.success('🔕 Notifications disabled')
          setNotifStatus('disabled')
        } else {
          toast.error(res.error || 'Failed to disable')
        }
      } else {
        const res = await enableNotifications(user)
        if (res.success) {
          toast.success('🔔 Notifications enabled!')
          setNotifStatus('enabled')
        } else {
          toast.error(res.error || 'Failed to enable')
          const perm = getBrowserPermission()
          if (perm === 'denied') setNotifStatus('denied')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setNotifLoading(false)
    }
  }

  // ============ IMAGE UPLOAD ============
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX_SIZE = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        setProfileImage(canvas.toDataURL('image/jpeg', 0.8))
        toast.success('📷 Photo ready! Click "Save".')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setProfileImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ============ SAVE PROFILE ============
  const saveProfile = async () => {
    if (!fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          profileImage: profileImage || '',
          email: user.email,
          role: 'customer',
          updatedAt: new Date(),
        },
        { merge: true }
      )
      setMessage('Profile saved successfully!')
      toast.success('✅ Profile saved!')
      setEditMode(false)
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ============ LOGOUT ============
  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userRole')
      window.location.href = '/login'
    } catch (error) {
      console.error(error)
    }
  }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="account-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading account...</p>
        </div>
      </div>
    )
  }

  // ============ NOT LOGGED IN ============
  if (!user) {
    return (
      <div className="account-page">
        <div className="account-card">
          <div className="account-icon">👤</div>
          <h1>Please Login</h1>
          <p>You need to login to view your account.</p>
          <button
            className="account-primary-button"
            onClick={() => {
              window.location.href = '/login'
            }}
          >
            Login →
          </button>
        </div>
      </div>
    )
  }

  // Reusable input style
  const fieldInputStyle = {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '14px',
    border: '1px solid var(--border-strong)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '14.5px',
    fontWeight: 600,
    fontFamily: 'var(--font-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const fieldIconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    pointerEvents: 'none',
    zIndex: 2,
    lineHeight: 1,
  }

  const fieldLabelStyle = {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  }

  // ============ MAIN ============
  return (
    <div className="account-page">
      <div className="account-container">
        <PageBackButton label="Back" fallback="/" />

        {/* Header */}
        <div className="account-header">
          <div className="account-header-top">
            <span className="account-header-badge">ARAIFOOD ACCOUNT</span>
          </div>
          <h1>
            Welcome back,
            <span> {fullName || 'Food Lover'}!</span>
          </h1>
          <p>Manage your profile, wallet, and rewards all in one place.</p>
        </div>

        {/* ============ HERO PROFILE CARD ============ */}
        <div className="account-card" style={{ marginBottom: '20px' }}>
          <div className="account-profile">
            <div className="profile-avatar-wrapper">
              <div
                className="account-avatar"
                style={{ overflow: 'hidden', padding: 0 }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>
              <div className="profile-online-dot"></div>
            </div>

            <div className="profile-main-info">
              <h2>{fullName || 'Food Lover'}</h2>
              <p>{user.email}</p>
              <div className="profile-status">
                <span className="profile-status-dot"></span>
                Active Customer Account
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="customer-profile-upload"
              />
              <label
                htmlFor="customer-profile-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}
              >
                <Camera size={14} />
                {profileImage ? 'Change Photo' : 'Add Photo'}
              </label>
              {profileImage && (
                <button
                  onClick={removeImage}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(220,38,38,0.12)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============ STATS GRID ============ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div className="reward-card" style={{ cursor: 'pointer' }}>
            <div className="reward-icon">📦</div>
            <div className="reward-info">
              <strong>{totalOrders}</strong>
              <small>Total Orders</small>
            </div>
          </div>
          <div className="reward-card" style={{ cursor: 'pointer' }}>
            <div className="reward-icon">⚡</div>
            <div className="reward-info">
              <strong>{activeOrders}</strong>
              <small>Active Now</small>
            </div>
          </div>
          <div className="reward-card" style={{ cursor: 'pointer' }}>
            <div className="reward-icon">💰</div>
            <div className="reward-info">
              <strong>৳{totalSpent.toFixed(0)}</strong>
              <small>Total Spent</small>
            </div>
          </div>
          <div className="reward-card" style={{ cursor: 'pointer' }}>
            <div className="reward-icon">⭐</div>
            <div className="reward-info">
              <strong>{loyaltyPoints}</strong>
              <small>Points</small>
            </div>
          </div>
        </div>

        {/* ============ NOTIFICATION SETTINGS ============ */}
        <div className="account-card" style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flex: 1,
                minWidth: '220px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background:
                    notifStatus === 'enabled'
                      ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)'
                      : notifStatus === 'denied'
                      ? 'linear-gradient(135deg, #FEE2E2, #FECACA)'
                      : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}
              >
                {notifStatus === 'enabled' ? (
                  <BellRing size={24} color="#047857" strokeWidth={2.4} />
                ) : notifStatus === 'denied' ? (
                  <BellOff size={24} color="#DC2626" strokeWidth={2.4} />
                ) : (
                  <Bell size={24} color="#D97706" strokeWidth={2.4} />
                )}
              </div>

              <div>
                <strong
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Push Notifications
                </strong>
                <span
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  {notifStatus === 'checking' && 'Checking...'}
                  {notifStatus === 'enabled' &&
                    "✅ Enabled — You'll get real-time updates"}
                  {notifStatus === 'disabled' &&
                    '🔔 Get instant updates about your orders'}
                  {notifStatus === 'denied' &&
                    '🚫 Blocked — Enable from browser settings'}
                  {notifStatus === 'unsupported' &&
                    'Not supported in this browser'}
                </span>
              </div>
            </div>

            {notifStatus !== 'unsupported' &&
              notifStatus !== 'checking' && (
                <button
                  onClick={handleToggleNotifications}
                  disabled={notifLoading || notifStatus === 'denied'}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '999px',
                    background:
                      notifStatus === 'enabled'
                        ? 'rgba(220,38,38,0.08)'
                        : notifStatus === 'denied'
                        ? 'var(--surface-soft)'
                        : 'linear-gradient(135deg, #059669, #047857)',
                    color:
                      notifStatus === 'enabled'
                        ? '#DC2626'
                        : notifStatus === 'denied'
                        ? 'var(--text-tertiary)'
                        : '#FFFFFF',
                    border:
                      notifStatus === 'enabled'
                        ? '1px solid rgba(220,38,38,0.25)'
                        : notifStatus === 'denied'
                        ? '1px solid var(--border)'
                        : 'none',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor:
                      notifLoading || notifStatus === 'denied'
                        ? 'not-allowed'
                        : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow:
                      notifStatus === 'disabled'
                        ? '0 4px 12px rgba(5,150,105,0.3)'
                        : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {notifLoading
                    ? '⏳ Loading...'
                    : notifStatus === 'enabled'
                    ? '🔕 Disable'
                    : notifStatus === 'denied'
                    ? '🚫 Blocked'
                    : '🔔 Enable'}
                </button>
              )}
          </div>
        </div>

        {/* ============ WALLET + REWARDS ============ */}
        <div className="account-card" style={{ marginBottom: '20px' }}>
          <div className="rewards-section">
            <div className="rewards-header">
              <span className="section-label">YOUR WALLET</span>
              <h3>Balance & Rewards</h3>
            </div>

            <div className="rewards-grid">
              <div className="reward-card loyalty-card">
                <div className="reward-icon">⭐</div>
                <div className="reward-info">
                  <strong>{loyaltyPoints} Points</strong>
                  <small>Loyalty Points</small>
                </div>
                <div className="reward-action">
                  <span>৳{(loyaltyPoints / 10).toFixed(0)} value</span>
                </div>
              </div>

              <div className="reward-card wallet-card">
                <div className="reward-icon">💳</div>
                <div className="reward-info">
                  <strong>৳{walletBalance.toFixed(2)}</strong>
                  <small>Wallet Balance</small>
                </div>
                <button
                  className="wallet-add-button"
                  onClick={() => setShowAddMoney(true)}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ PENDING REQUESTS ============ */}
        {walletRequests.filter((r) => r.status === 'pending').length > 0 && (
          <div className="account-card" style={{ marginBottom: '20px' }}>
            <div className="account-section-title">
              <div className="account-section-icon">⏳</div>
              <div>
                <h3>Pending Top-Up Requests</h3>
                <p>Being verified by admin</p>
              </div>
            </div>
            <div className="wallet-transaction-list">
              {walletRequests
                .filter((r) => r.status === 'pending')
                .slice(0, 3)
                .map((req) => (
                  <div
                    className="wallet-transaction-card"
                    key={req.firebaseId}
                  >
                    <div className="transaction-icon">
                      {req.method === 'bkash' ? '💳' : '💰'}
                    </div>
                    <div className="transaction-info">
                      <strong>
                        ৳{req.amount} via{' '}
                        {req.method === 'bkash' ? 'bKash' : 'Nagad'}
                      </strong>
                      <small>
                        ID: {req.transactionId} ·{' '}
                        {req.createdAt?.toDate?.()
                          ? req.createdAt.toDate().toLocaleString()
                          : 'Just now'}
                      </small>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: 'rgba(245,158,11,0.12)',
                        color: '#f59e0b',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      ⏳ Pending
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ============ WALLET TRANSACTIONS ============ */}
        <div className="account-card" style={{ marginBottom: '20px' }}>
          <div className="account-section-title">
            <div className="account-section-icon">💳</div>
            <div>
              <h3>Recent Transactions</h3>
              <p>Your wallet activity</p>
            </div>
          </div>

          <div className="wallet-transaction-list">
            {walletTransactions.length === 0 ? (
              <p className="no-transactions">
                No wallet transactions yet.
              </p>
            ) : (
              walletTransactions.slice(0, 5).map((transaction) => (
                <div
                  className="wallet-transaction-card"
                  key={transaction.id}
                >
                  <div className="transaction-icon">
                    {transaction.type === 'credit' ? '⬇️' : '⬆️'}
                  </div>
                  <div className="transaction-info">
                    <strong>
                      {transaction.type === 'credit'
                        ? 'Money Added'
                        : 'Payment Made'}
                    </strong>
                    <small>{transaction.date}</small>
                  </div>
                  <div
                    className={`transaction-amount ${
                      transaction.type === 'credit' ? 'credit' : 'debit'
                    }`}
                  >
                    <strong>৳{transaction.amount.toFixed(2)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============ POINTS HISTORY ============ */}
        {pointsHistory.length > 0 && (
          <div className="account-card" style={{ marginBottom: '20px' }}>
            <div className="account-section-title">
              <div className="account-section-icon">⭐</div>
              <div>
                <h3>Points History</h3>
                <p>How you earned your points</p>
              </div>
            </div>

            <div className="points-history-list">
              {pointsHistory.slice(0, 5).map((point) => (
                <div className="points-history-card" key={point.id}>
                  <div className="points-icon">⭐</div>
                  <div className="points-info">
                    <strong>Earned {point.amount} Points</strong>
                    <small>{point.date}</small>
                  </div>
                  <div className="points-amount">
                    <strong>+{point.amount}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ PERSONAL INFORMATION ============ */}
        <div className="account-card" style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '18px',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div
              className="account-section-title"
              style={{ marginBottom: 0 }}
            >
              <div className="account-section-icon">👤</div>
              <div>
                <h3>Personal Information</h3>
                <p>
                  {editMode
                    ? 'Edit and save your details'
                    : 'Your information'}
                </p>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
          </div>

          {editMode ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={fieldIconStyle}>👤</span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setMessage('')
                    }}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={fieldIconStyle}>📱</span>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setMessage('')
                    }}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Delivery Address</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      ...fieldIconStyle,
                      top: '20px',
                      transform: 'none',
                    }}
                  >
                    📍
                  </span>
                  <textarea
                    placeholder="House / Road / Area / Union / Upazila..."
                    rows="3"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      setMessage('')
                    }}
                    style={{
                      ...fieldInputStyle,
                      resize: 'vertical',
                      minHeight: '90px',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '8px',
                }}
              >
                <button
                  className="account-save-button"
                  onClick={saveProfile}
                  disabled={saving}
                  style={{ flex: 1, minWidth: '140px' }}
                >
                  {saving ? '⏳ Saving...' : '✓ Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false)
                    setMessage('')
                  }}
                  disabled={saving}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '999px',
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>

              {message && (
                <div
                  className={`account-message ${
                    message.includes('successfully')
                      ? 'success'
                      : 'error'
                  }`}
                  style={{ marginTop: '12px' }}
                >
                  <span>
                    {message.includes('successfully') ? '✓' : '⚠️'}
                  </span>
                  <span>{message}</span>
                </div>
              )}
            </>
          ) : (
            <div className="account-info-grid">
              <div className="account-info-item">
                <div className="account-info-icon">👤</div>
                <div className="account-info-content">
                  <span>Full Name</span>
                  <strong>{fullName || 'Not set'}</strong>
                </div>
              </div>

              <div className="account-info-item">
                <div className="account-info-icon">📱</div>
                <div className="account-info-content">
                  <span>Phone</span>
                  <strong>{phone || 'Not set'}</strong>
                </div>
              </div>

              <div
                className="account-info-item"
                style={{ gridColumn: '1 / -1' }}
              >
                <div className="account-info-icon">📍</div>
                <div className="account-info-content">
                  <span>Delivery Address</span>
                  <strong>{address || 'Not set'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============ ACCOUNT INFO ============ */}
        <div className="account-card" style={{ marginBottom: '20px' }}>
          <div className="account-section-title">
            <div className="account-section-icon">🛡️</div>
            <div>
              <h3>Account Information</h3>
              <p>Your AraiFood account details.</p>
            </div>
          </div>

          <div className="account-info-grid">
            <div className="account-info-item">
              <div className="account-info-icon">📧</div>
              <div className="account-info-content">
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-icon">👤</div>
              <div className="account-info-content">
                <span>Account Type</span>
                <strong>Customer</strong>
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-icon">🆔</div>
              <div className="account-info-content">
                <span>Account ID</span>
                <strong>{user.uid.substring(0, 12)}...</strong>
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-icon">📅</div>
              <div className="account-info-content">
                <span>Member Since</span>
                <strong>
                  {user.metadata?.creationTime
                    ? new Date(
                        user.metadata.creationTime
                      ).toLocaleDateString()
                    : 'N/A'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ============ QUICK ACTIONS ============ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <Link
            to="/order-history"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '18px 20px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))',
              border: '1px solid rgba(59,130,246,0.25)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, #3B82F6, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              }}
            >
              📦
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                My Orders
              </strong>
              <span
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                Track & review
              </span>
            </div>
            <span
              style={{
                fontSize: '18px',
                color: '#3B82F6',
                fontWeight: 800,
              }}
            >
              →
            </span>
          </Link>

          <Link
            to="/favorites"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '18px 20px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.05))',
              border: '1px solid rgba(236,72,153,0.25)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, #EC4899, #DB2777)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(236,72,153,0.3)',
              }}
            >
              ❤️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                Favorites
              </strong>
              <span
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                Saved items
              </span>
            </div>
            <span
              style={{
                fontSize: '18px',
                color: '#EC4899',
                fontWeight: 800,
              }}
            >
              →
            </span>
          </Link>
        </div>

        {/* ============ LOGOUT / HOME ============ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px 20px',
              borderRadius: '18px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#DC2626',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
            }}
          >
            <LogOut size={18} strokeWidth={2.4} />
            Logout
          </button>

          <button
            onClick={() => {
              window.location.href = '/'
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px 20px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
              fontFamily: 'var(--font-primary)',
            }}
          >
            <HomeIcon size={18} strokeWidth={2.4} />
            Back to Home
          </button>
        </div>
      </div>

      {showAddMoney && (
        <AddMoneyModal
          user={user}
          settings={settings}
          onClose={() => setShowAddMoney(false)}
        />
      )}
    </div>
  )
}

// ============================================================
// ADD MONEY MODAL
// ============================================================
function AddMoneyModal({ user, settings, onClose }) {
  const minAmount = settings.walletMinAmount || 50
  const maxAmount = settings.walletMaxAmount || 10000

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bkash')
  const [transactionId, setTransactionId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const paymentNumber =
    method === 'bkash'
      ? settings.walletBkashNumber || 'Not set'
      : settings.walletNagadNumber || 'Not set'

  const copyNumber = () => {
    if (paymentNumber === 'Not set') {
      toast.error('Payment number not configured')
      return
    }
    navigator.clipboard.writeText(paymentNumber)
    setCopied(true)
    toast.success('Number copied!', { autoClose: 1200 })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount < minAmount) {
      toast.error(`Minimum amount is ৳${minAmount}`)
      return
    }
    if (numAmount > maxAmount) {
      toast.error(`Maximum amount is ৳${maxAmount}`)
      return
    }
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID')
      return
    }
    if (paymentNumber === 'Not set') {
      toast.error('Payment number not set. Contact support.')
      return
    }

    setSubmitting(true)
    try {
      const requestId = `WR-${Math.floor(100000 + Math.random() * 900000)}`

      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      const userData = userDoc.exists() ? userDoc.data() : {}

      await addDoc(collection(db, 'walletRequests'), {
        requestId,
        userId: user.uid,
        userEmail: user.email || '',
        userName: userData.fullName || 'Customer',
        amount: numAmount,
        method,
        paymentNumber,
        transactionId: transactionId.trim(),
        status: 'pending',
        rejectReason: '',
        createdAt: serverTimestamp(),
      })

      toast.success(
        `✅ Request submitted! We'll verify within 5 minutes.`
      )
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="outside-area-modal"
      onClick={onClose}
      style={{ zIndex: 999999 }}
    >
      <div
        className="outside-area-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(249,115,22,0.06))',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px',
              }}
            >
              Wallet Top-Up
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Add Money to Wallet
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: '20px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px',
              fontSize: '12.5px',
              color: '#1D4ED8',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            💡 <strong>How it works:</strong> Send money to the bKash/Nagad
            number below, then submit the transaction ID. Admin will verify
            and add funds to your wallet within 5 minutes.
          </div>

          {/* Amount */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Amount (৳{minAmount} — ৳{maxAmount})
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginTop: '8px',
                flexWrap: 'wrap',
              }}
            >
              {[100, 200, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background:
                      amount === String(preset)
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface-soft)',
                    border:
                      amount === String(preset)
                        ? 'none'
                        : '1px solid var(--border)',
                    color:
                      amount === String(preset)
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ৳{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Payment Method
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setMethod('bkash')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    method === 'bkash'
                      ? 'linear-gradient(135deg, #E2136E, #B10F53)'
                      : 'var(--surface-soft)',
                  border:
                    method === 'bkash'
                      ? 'none'
                      : '1px solid var(--border)',
                  color:
                    method === 'bkash'
                      ? '#FFFFFF'
                      : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                💳 bKash
              </button>
              <button
                onClick={() => setMethod('nagad')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    method === 'nagad'
                      ? 'linear-gradient(135deg, #F58220, #C96615)'
                      : 'var(--surface-soft)',
                  border:
                    method === 'nagad'
                      ? 'none'
                      : '1px solid var(--border)',
                  color:
                    method === 'nagad'
                      ? '#FFFFFF'
                      : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                💰 Nagad
              </button>
            </div>
          </div>

          {/* Payment Number */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(5,150,105,0.08)',
              border: '1px dashed rgba(5,150,105,0.4)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '3px',
                }}
              >
                Send money to this{' '}
                {method === 'bkash' ? 'bKash' : 'Nagad'} number (Personal)
              </div>
              <strong
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 900,
                  color:
                    paymentNumber === 'Not set'
                      ? 'var(--text-tertiary)'
                      : 'var(--primary)',
                  letterSpacing: '0.5px',
                }}
              >
                {paymentNumber}
              </strong>
            </div>
            <button
              onClick={copyNumber}
              disabled={paymentNumber === 'Not set'}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                background:
                  paymentNumber === 'Not set'
                    ? 'var(--surface-soft)'
                    : 'var(--primary)',
                color:
                  paymentNumber === 'Not set'
                    ? 'var(--text-tertiary)'
                    : '#FFFFFF',
                border: 'none',
                cursor:
                  paymentNumber === 'Not set' ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
              }}
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>

          {/* Transaction ID */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g., 9F7D2K4LX8 (from SMS)"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '16px',
              borderRadius: '999px',
              background: submitting
                ? 'var(--surface-soft)'
                : 'linear-gradient(135deg, #059669, #047857)',
              color: submitting ? 'var(--text-tertiary)' : '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting
                ? 'none'
                : '0 6px 20px rgba(5,150,105,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Wallet size={18} />
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountPage