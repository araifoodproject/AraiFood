// ============================================================
// src/pages/AccountPage.jsx
// V8 — Zone badge spacing fix + Zone + Location required
// + Mobile responsive (inline style)
// + Full Bangla comments where helpful
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
import MapPicker from '../components/MapPicker'
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
  Save,
  MapPin,
} from 'lucide-react'
import {
  enableNotifications,
  disableNotifications,
  getSubscriptionStatus,
  getBrowserPermission,
} from '../utils/oneSignal'

// ============================================================
// Mobile Responsive Styles — inline <style> tag
// ============================================================
const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .account-container { padding: 14px 12px 110px !important; }
    .account-header h1 { font-size: 22px !important; line-height: 1.3 !important; }
    .account-header p { font-size: 13px !important; }
    .account-card { padding: 16px 14px !important; border-radius: 16px !important; }
    .account-profile { flex-direction: column !important; text-align: center !important; gap: 14px !important; align-items: center !important; }
    .profile-avatar-wrapper { margin: 0 auto !important; }
    .profile-main-info { text-align: center !important; width: 100% !important; }
    .profile-main-info h2 { font-size: 18px !important; }
    .profile-main-info p { font-size: 12.5px !important; word-break: break-all !important; }
    .account-avatar { width: 84px !important; height: 84px !important; font-size: 32px !important; }
    .account-info-item { padding: 12px 14px !important; }
    .account-info-content strong { font-size: 13.5px !important; word-break: break-word !important; }
    .account-edit-header { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
    .account-edit-header-actions { width: 100% !important; justify-content: stretch !important; }
    .account-edit-header-actions button { flex: 1 !important; }
    .account-sticky-save-bar { bottom: 84px !important; padding: 12px 14px !important; flex-direction: column !important; gap: 8px !important; }
    .account-sticky-save-bar button { width: 100% !important; }
    .reward-card { padding: 12px 14px !important; }
    .reward-icon { font-size: 22px !important; }
    .reward-info strong { font-size: 15px !important; }
    .reward-info small { font-size: 11px !important; }
    .notification-card-inner { flex-direction: column !important; align-items: stretch !important; }
    .notification-toggle-btn { width: 100% !important; justify-content: center !important; }
  }

  @media (max-width: 400px) {
    .account-container { padding: 12px 10px 100px !important; }
    .account-header h1 { font-size: 19px !important; }
    .account-card { padding: 14px 12px !important; border-radius: 14px !important; }
    .account-avatar { width: 72px !important; height: 72px !important; font-size: 28px !important; }
    .profile-main-info h2 { font-size: 16px !important; }
    .reward-card { padding: 10px 12px !important; }
    .reward-info strong { font-size: 14px !important; }
    .account-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .account-quick-actions { grid-template-columns: 1fr !important; }
  }
`

function AccountPage() {
  const { settings } = useSettings()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')

  // Zone + Location
  const [zoneId, setZoneId] = useState('')
  const [zoneName, setZoneName] = useState('')
  const [location, setLocation] = useState(null)
  const [zones, setZones] = useState([])
  const [zonesLoading, setZonesLoading] = useState(true)

  // Original — cancel এ revert
  const [originalData, setOriginalData] = useState({
    fullName: '',
    phone: '',
    address: '',
    profileImage: '',
    zoneId: '',
    zoneName: '',
    location: null,
  })

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

  // Notification state
  const [notifStatus, setNotifStatus] = useState('checking')
  const [notifLoading, setNotifLoading] = useState(false)

  const fileInputRef = useRef(null)
  const editSectionRef = useRef(null)
  const zoneSectionRef = useRef(null)
  const mapSectionRef = useRef(null)

  // ============ LOAD ZONES ============
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'deliveryZones'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setZones(list)
        setZonesLoading(false)
      },
      (err) => {
        console.error('Zones load error:', err)
        setZonesLoading(false)
      }
    )
    return () => unsub()
  }, [])

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

            const initial = {
              fullName: data.fullName || '',
              phone: data.phone || '',
              address: data.address || '',
              profileImage: data.profileImage || '',
              zoneId: data.zoneId || '',
              zoneName: data.zoneName || '',
              location:
                data.location?.lat && data.location?.lng
                  ? data.location
                  : null,
            }

            setFullName(initial.fullName)
            setPhone(initial.phone)
            setAddress(initial.address)
            setProfileImage(initial.profileImage)
            setZoneId(initial.zoneId)
            setZoneName(initial.zoneName)
            setLocation(initial.location)
            setOriginalData(initial)

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
              zoneId: '',
              zoneName: '',
              location: null,
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
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data())
      setTotalOrders(list.length)
      setActiveOrders(
        list.filter(
          (o) =>
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

  // ============ NOTIFICATION STATUS ============
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
        setEditMode(true)
        toast.success('📷 Photo ready! Click "Save Changes" below.')
        setTimeout(() => {
          editSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 200)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setProfileImage('')
    setEditMode(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.info('Photo removed. Click "Save Changes" to confirm.')
  }

  // ============ SAVE PROFILE ============
  const saveProfile = async () => {
    if (!fullName.trim()) {
      setMessage('Please enter your full name.')
      toast.error('Full name is required')
      editSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      return
    }

    // ✅ Zone required
    if (!zoneId) {
      setMessage('Please select your area / zone.')
      toast.error('📍 Please select your area / zone')
      zoneSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    // ✅ Location required
    if (!location?.lat || !location?.lng) {
      setMessage('Please set your location on the map.')
      toast.error('📍 Map এ আপনার location set করুন')
      mapSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    setSaving(true)
    setMessage('')
    try {
      const selectedZoneObj = zones.find((z) => z.firebaseId === zoneId)
      const dataToSave = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        profileImage: profileImage || '',
        zoneId: zoneId,
        zoneName: selectedZoneObj?.name || zoneName || '',
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        email: user.email,
        role: 'customer',
        updatedAt: new Date(),
      }

      await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true })

      setOriginalData({
        fullName: dataToSave.fullName,
        phone: dataToSave.phone,
        address: dataToSave.address,
        profileImage: dataToSave.profileImage,
        zoneId: dataToSave.zoneId,
        zoneName: dataToSave.zoneName,
        location: dataToSave.location,
      })

      setZoneName(dataToSave.zoneName)
      setMessage('Profile saved successfully!')
      toast.success('✅ Profile saved!')
      setEditMode(false)
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Could not save profile. Please try again.')
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // ============ CANCEL EDIT ============
  const cancelEdit = () => {
    const hasChanges =
      fullName !== originalData.fullName ||
      phone !== originalData.phone ||
      address !== originalData.address ||
      profileImage !== originalData.profileImage ||
      zoneId !== originalData.zoneId ||
      JSON.stringify(location) !== JSON.stringify(originalData.location)

    if (hasChanges) {
      const confirm = window.confirm(
        'আপনার পরিবর্তনগুলো save করা হয়নি। Cancel করলে সব মুছে যাবে। আপনি কি নিশ্চিত?'
      )
      if (!confirm) return
    }

    setFullName(originalData.fullName)
    setPhone(originalData.phone)
    setAddress(originalData.address)
    setProfileImage(originalData.profileImage)
    setZoneId(originalData.zoneId)
    setZoneName(originalData.zoneName)
    setLocation(originalData.location)
    setMessage('')
    setEditMode(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const enterEditMode = () => {
    setEditMode(true)
    setMessage('')
    setTimeout(() => {
      editSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

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
      <>
        <style>{MOBILE_STYLES}</style>
        <div className="account-page">
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading account...</p>
          </div>
        </div>
      </>
    )
  }

  // ============ NOT LOGGED IN ============
  if (!user) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
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
      </>
    )
  }

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

  const selectedZoneDisplay = zones.find((z) => z.firebaseId === zoneId)
  const canSave = Boolean(zoneId && location?.lat && location?.lng)

  return (
    <>
      <style>{MOBILE_STYLES}</style>

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

                {/* ✅ FIXED: Zone badge + status — proper spacing */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginTop: '10px',
                  }}
                >
                  <div
                    className="profile-status"
                    style={{ margin: 0 }}
                  >
                    <span className="profile-status-dot"></span>
                    Active Customer Account
                  </div>

                  {selectedZoneDisplay && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '999px',
                        background: 'rgba(5,150,105,0.1)',
                        color: '#047857',
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <MapPin size={12} strokeWidth={2.6} />
                      {selectedZoneDisplay.name}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
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
            className="account-stats-grid"
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
              className="notification-card-inner"
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
                    className="notification-toggle-btn"
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
                  <div className="wallet-transaction-card" key={transaction.id}>
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
          <div
            className="account-card"
            ref={editSectionRef}
            style={{
              marginBottom: '20px',
              border: editMode ? '2px solid rgba(5,150,105,0.5)' : undefined,
              boxShadow: editMode
                ? '0 0 0 4px rgba(5,150,105,0.08)'
                : undefined,
              transition: 'all 0.3s',
            }}
          >
            <div
              className="account-edit-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '18px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div className="account-section-title" style={{ marginBottom: 0 }}>
                <div className="account-section-icon">👤</div>
                <div>
                  <h3>
                    Personal Information
                    {editMode && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: 'rgba(5,150,105,0.15)',
                          color: '#047857',
                          verticalAlign: 'middle',
                        }}
                      >
                        EDITING
                      </span>
                    )}
                  </h3>
                  <p>
                    {editMode
                      ? 'Zone + Map location — both required'
                      : 'Your information'}
                  </p>
                </div>
              </div>

              {!editMode ? (
                <button
                  onClick={enterEditMode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                  }}
                >
                  <Edit3 size={14} />
                  Edit Profile
                </button>
              ) : (
                <div
                  className="account-edit-header-actions"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '999px',
                      background: 'var(--surface-soft)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 20px',
                      borderRadius: '999px',
                      background: saving
                        ? 'var(--surface-soft)'
                        : 'linear-gradient(135deg, #059669, #047857)',
                      color: saving ? 'var(--text-tertiary)' : '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: saving
                        ? 'none'
                        : '0 4px 12px rgba(5,150,105,0.3)',
                    }}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
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

                {/* Zone Selector — REQUIRED */}
                <div
                  style={{ marginBottom: '16px' }}
                  ref={zoneSectionRef}
                >
                  <label style={fieldLabelStyle}>
                    📍 Your Area / Zone{' '}
                    <span style={{ color: '#DC2626' }}>* Required</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={zoneId}
                      onChange={(e) => {
                        setZoneId(e.target.value)
                        setMessage('')
                      }}
                      disabled={zonesLoading}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: zoneId
                          ? '2px solid #059669'
                          : '2px solid #DC2626',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '14.5px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-primary)',
                        outline: 'none',
                        cursor: zonesLoading ? 'wait' : 'pointer',
                        boxSizing: 'border-box',
                        appearance: 'auto',
                      }}
                    >
                      <option value="">
                        {zonesLoading
                          ? '— Loading zones —'
                          : '— Select your area (required) —'}
                      </option>
                      {zones.map((z) => (
                        <option key={z.firebaseId} value={z.firebaseId}>
                          {z.name} — ৳{z.deliveryFee} delivery
                        </option>
                      ))}
                    </select>
                  </div>
                  {zoneId && selectedZoneDisplay ? (
                    <p
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(5,150,105,0.08)',
                        border: '1px solid rgba(5,150,105,0.25)',
                        color: '#059669',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      ✅ {selectedZoneDisplay.name} — Delivery ৳
                      {selectedZoneDisplay.deliveryFee}
                    </p>
                  ) : (
                    <p
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        color: '#DC2626',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ আপনার এলাকা select করা বাধ্যতামূলক
                    </p>
                  )}
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

                {/* MapPicker — REQUIRED */}
                <div
                  style={{ marginBottom: '16px' }}
                  ref={mapSectionRef}
                >
                  <label style={fieldLabelStyle}>
                    🗺️ Your Location on Map{' '}
                    <span style={{ color: '#DC2626' }}>* Required</span>
                  </label>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                      marginBottom: '10px',
                      marginTop: '-4px',
                    }}
                  >
                    👆 কাছের restaurant দেখাতে সাহায্য করে
                  </p>
                  <MapPicker
                    position={location}
                    setPosition={(loc) => {
                      setLocation(loc)
                      setMessage('')
                    }}
                    height={280}
                    helperText="👆 Map এ click করে আপনার location set করুন (required)"
                  />
                  {location?.lat && location?.lng ? (
                    <p
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(5,150,105,0.08)',
                        border: '1px solid rgba(5,150,105,0.25)',
                        color: '#059669',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      ✅ Location set: {location.lat.toFixed(4)},{' '}
                      {location.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        color: '#DC2626',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ Map এ location set করা বাধ্যতামূলক
                    </p>
                  )}
                </div>

                {/* Sticky Save Bar */}
                <div
                  className="account-sticky-save-bar"
                  style={{
                    position: 'sticky',
                    bottom: '12px',
                    marginTop: '20px',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: 'var(--surface)',
                    border: canSave
                      ? '2px solid rgba(5,150,105,0.4)'
                      : '2px solid rgba(220,38,38,0.4)',
                    boxShadow: canSave
                      ? '0 10px 30px rgba(5,150,105,0.2), 0 0 0 4px rgba(5,150,105,0.06)'
                      : '0 10px 30px rgba(220,38,38,0.15)',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    zIndex: 10,
                  }}
                >
                  <button
                    className="account-save-button"
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: canSave ? 1 : 0.7,
                    }}
                  >
                    <Save size={16} />
                    {saving
                      ? '⏳ Saving...'
                      : canSave
                      ? '✓ Save Changes'
                      : '⚠️ Zone + Location Required'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '999px',
                      background: 'var(--surface-soft)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {message && (
                  <div
                    className={`account-message ${
                      message.includes('successfully') ? 'success' : 'error'
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

                <div className="account-info-item">
                  <div className="account-info-icon">📍</div>
                  <div className="account-info-content">
                    <span>Your Area</span>
                    <strong>
                      {selectedZoneDisplay?.name ||
                        zoneName ||
                        'Not set — Edit to add'}
                    </strong>
                  </div>
                </div>

                <div
                  className="account-info-item"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <div className="account-info-icon">🏠</div>
                  <div className="account-info-content">
                    <span>Delivery Address</span>
                    <strong>{address || 'Not set'}</strong>
                  </div>
                </div>

                <div
                  className="account-info-item"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <div className="account-info-icon">🗺️</div>
                  <div className="account-info-content">
                    <span>Map Location</span>
                    <strong>
                      {location?.lat && location?.lng
                        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : 'Not set — Edit to add'}
                    </strong>
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
            className="account-quick-actions"
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
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
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
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
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
                background: 'linear-gradient(135deg, #059669, #047857)',
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
    </>
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

      toast.success(`✅ Request submitted! We'll verify within 5 minutes.`)
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
                    method === 'bkash' ? 'none' : '1px solid var(--border)',
                  color:
                    method === 'bkash' ? '#FFFFFF' : 'var(--text-primary)',
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
                    method === 'nagad' ? 'none' : '1px solid var(--border)',
                  color:
                    method === 'nagad' ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                💰 Nagad
              </button>
            </div>
          </div>

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
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
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
                  wordBreak: 'break-all',
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