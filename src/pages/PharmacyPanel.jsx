// ============================================================
// src/pages/PharmacyPanel.jsx — PREMIUM V1.2
// + Online Payment Filter (COD সবসময়, Online শুধু verified)
// + "PAID ONLINE" badge for verified online orders
// + Push Notification toggle in Dashboard + Settings + Profile
// + In-App Notification Bell in Topbar
// ============================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { sendNotification } from '../utils/sendNotification'
import { Camera, X, Search, Star } from 'lucide-react'
import MapPicker from '../components/MapPicker'
import PushToggleCard from '../components/PushToggleCard'
import NotificationPanel from '../components/NotificationPanel'

const MED_CATEGORIES = [
  { key: 'pain', label: 'Pain Relief' },
  { key: 'fever', label: 'Fever & Cold' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'antibiotics', label: 'Antibiotics' },
  { key: 'skin', label: 'Skin Care' },
  { key: 'oral', label: 'Oral Care' },
  { key: 'eye', label: 'Eye & Ear' },
  { key: 'baby', label: 'Baby Care' },
  { key: 'firstaid', label: 'First Aid' },
  { key: 'vitamins', label: 'Vitamins' },
  { key: 'other', label: 'Other' },
]

// Helper: COD order কিনা
const isCODOrder = (o) => {
  const m = (o.paymentMethod || 'cod').toLowerCase()
  return m === 'cod' || m === 'cash'
}

// Helper: Online order কিনা (COD নয়, method আছে)
const isOnlineOrder = (o) => {
  const m = (o.paymentMethod || '').toLowerCase()
  return m && m !== 'cod' && m !== 'cash'
}

function PharmacyPanel() {
  const [user, setUser] = useState(null)
  const [pharmacy, setPharmacy] = useState(null)
  const [orders, setOrders] = useState([])
  const [medicines, setMedicines] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('dashboard')

  const [showAddMed, setShowAddMed] = useState(false)
  const [medName, setMedName] = useState('')
  const [medGeneric, setMedGeneric] = useState('')
  const [medCompany, setMedCompany] = useState('')
  const [medCategory, setMedCategory] = useState('pain')
  const [medPrice, setMedPrice] = useState('')
  const [medDiscountPrice, setMedDiscountPrice] = useState('')
  const [medDescription, setMedDescription] = useState('')
  const [medImage, setMedImage] = useState('')
  const [medStock, setMedStock] = useState('100')
  const [medRequiresRx, setMedRequiresRx] = useState(false)
  const [medAvailable, setMedAvailable] = useState(true)
  const [editingMedId, setEditingMedId] = useState(null)

  const [openingTime, setOpeningTime] = useState('09:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [minimumOrder, setMinimumOrder] = useState('50')
  const [deliveryFee, setDeliveryFee] = useState('30')

  const [logo, setLogo] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [location, setLocation] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState('all')

  const [reviewRatingFilter, setReviewRatingFilter] = useState('all')
  const [lastViewedReviews, setLastViewedReviews] = useState(null)

  const logoInputRef = useRef(null)
  const authCheckedRef = useRef(false)

  // ============ AUTH ============
  useEffect(() => {
    let isMounted = true
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!isMounted) return
      if (authCheckedRef.current) return
      authCheckedRef.current = true

      if (!cu) {
        setTimeout(() => {
          if (isMounted && !auth.currentUser) {
            window.location.href = '/pharmacy-login'
          }
        }, 1500)
        return
      }

      setUser(cu)

      try {
        const snap = await getDoc(doc(db, 'pharmacies', cu.uid))
        if (!isMounted) return

        if (!snap.exists()) {
          setError('No pharmacy account found with this email.')
          setLoading(false)
          return
        }

        const data = snap.data()
        if (data.status === 'pending') {
          setError('⏳ Your account is pending Admin approval.')
          setLoading(false)
          return
        }
        if (data.status === 'rejected') {
          setError('❌ Your application was rejected. Please contact support.')
          setLoading(false)
          return
        }

        setPharmacy({ firebaseId: snap.id, ...data })
        setOpeningTime(data.openingTime || '09:00')
        setClosingTime(data.closingTime || '22:00')
        setMinimumOrder(String(data.minimumOrder || '50'))
        setDeliveryFee(String(data.deliveryFee || '30'))
        setLogo(data.logo || '')
        setPharmacyName(data.pharmacyName || '')
        setOwnerName(data.ownerName || '')
        setPhone(data.phone || '')
        setAddress(data.address || '')
        setDescription(data.description || '')
        setDeliveryTime(data.deliveryTime || '')
        setLocation(
          data.location?.lat && data.location?.lng ? data.location : null
        )
        if (data.lastViewedReviews?.toDate) {
          setLastViewedReviews(data.lastViewedReviews.toDate())
        }
        setError('')
        localStorage.setItem('userRole', 'pharmacy')
      } catch (err) {
        console.error(err)
        if (isMounted) setError('Failed to load pharmacy.')
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      unsub()
    }
  }, [])

  // ============ ORDERS ============
  // COD orders সবসময় দেখাবে। Online orders শুধু paymentStatus === 'verified' হলে।
  // (Restaurant Panel এর মতো একই rule)
  useEffect(() => {
    if (!pharmacy) return
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const all = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))

      const mine = all
        .filter(
          (o) =>
            o.pharmacyId === pharmacy.firebaseId ||
            (o.restaurantId === pharmacy.firebaseId &&
              o.orderType === 'pharmacy')
        )
        .filter((o) => {
          // COD → সবসময় দেখাবে
          if (isCODOrder(o)) return true
          // Online / Wallet → শুধু verified হলে দেখাবে
          return o.paymentStatus === 'verified'
        })
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })

      setOrders(mine)
    })
    return () => unsub()
  }, [pharmacy])

  // ============ MEDICINES ============
  useEffect(() => {
    if (!pharmacy) return
    const q = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', pharmacy.firebaseId)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMedicines(
        snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      )
    })
    return () => unsub()
  }, [pharmacy])

  // ============ REVIEWS ============
  useEffect(() => {
    if (!pharmacy) return
    const q = query(
      collection(db, 'reviews'),
      where('pharmacyId', '==', pharmacy.firebaseId)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ firebaseId: d.id, ...d.data() }))
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
      setReviews(list)
    })
    return () => unsub()
  }, [pharmacy])

  // ============ LOGO UPLOAD ============
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX = 500
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX) {
            h = Math.round((h * MAX) / w)
            w = MAX
          }
        } else if (h > MAX) {
          w = Math.round((w * MAX) / h)
          h = MAX
        }
        canvas.width = w
        canvas.height = h
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        setLogo(canvas.toDataURL('image/jpeg', 0.85))
        toast.success('Logo ready!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    if (!pharmacyName.trim()) {
      toast.error('Pharmacy name required')
      return
    }
    setSavingProfile(true)
    try {
      const data = {
        logo: logo || '',
        pharmacyName: pharmacyName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        description: description.trim(),
        deliveryTime: deliveryTime.trim() || '20-30 min',
        updatedAt: new Date(),
      }
      if (location?.lat && location?.lng) {
        data.location = { lat: location.lat, lng: location.lng }
      }
      await updateDoc(doc(db, 'pharmacies', pharmacy.firebaseId), data)
      setPharmacy((p) => ({ ...p, ...data }))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error('Failed to update')
    } finally {
      setSavingProfile(false)
    }
  }

  // ============ MEDICINE IMAGE ============
  const handleMedImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX = 800
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX) {
            h = Math.round((h * MAX) / w)
            w = MAX
          }
        } else if (h > MAX) {
          w = Math.round((w * MAX) / h)
          h = MAX
        }
        canvas.width = w
        canvas.height = h
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        setMedImage(canvas.toDataURL('image/jpeg', 0.85))
        toast.success('Image ready!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // ============ SAVE MEDICINE ============
  const saveMedicine = async () => {
    if (!medName.trim()) {
      toast.error('Name required')
      return
    }
    if (!medPrice || parseFloat(medPrice) <= 0) {
      toast.error('Valid price required')
      return
    }
    try {
      const data = {
        pharmacyId: pharmacy.firebaseId,
        pharmacyName: pharmacy.pharmacyName,
        name: medName.trim(),
        genericName: medGeneric.trim(),
        company: medCompany.trim(),
        category: medCategory,
        price: parseFloat(medPrice),
        discountPrice: medDiscountPrice
          ? parseFloat(medDiscountPrice)
          : null,
        description: medDescription.trim(),
        image: medImage,
        stock: parseInt(medStock) || 0,
        requiresPrescription: medRequiresRx,
        available: medAvailable,
        updatedAt: new Date(),
      }

      if (editingMedId) {
        await updateDoc(doc(db, 'medicines', editingMedId), data)
        toast.success('Medicine updated!')
      } else {
        await addDoc(collection(db, 'medicines'), {
          ...data,
          createdAt: new Date(),
        })
        toast.success('Medicine added!')
      }
      resetMedForm()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save')
    }
  }

  const resetMedForm = () => {
    setMedName('')
    setMedGeneric('')
    setMedCompany('')
    setMedCategory('pain')
    setMedPrice('')
    setMedDiscountPrice('')
    setMedDescription('')
    setMedImage('')
    setMedStock('100')
    setMedRequiresRx(false)
    setMedAvailable(true)
    setEditingMedId(null)
    setShowAddMed(false)
  }

  const editMedicine = (m) => {
    setMedName(m.name || '')
    setMedGeneric(m.genericName || '')
    setMedCompany(m.company || '')
    setMedCategory(m.category || 'pain')
    setMedPrice(String(m.price || ''))
    setMedDiscountPrice(m.discountPrice ? String(m.discountPrice) : '')
    setMedDescription(m.description || '')
    setMedImage(m.image || '')
    setMedStock(String(m.stock || 100))
    setMedRequiresRx(m.requiresPrescription || false)
    setMedAvailable(m.available !== false)
    setEditingMedId(m.firebaseId)
    setShowAddMed(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteMedicine = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteDoc(doc(db, 'medicines', id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const toggleMedAvailability = async (id, current) => {
    try {
      await updateDoc(doc(db, 'medicines', id), { available: !current })
    } catch (err) {
      console.error(err)
    }
  }

  // ============ ORDER ACTIONS ============
  const updateOrderStatus = async (id, newStatus, order) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus })
      if (order?.userId) {
        const msgs = {
          preparing: ['👨‍⚕️ Pharmacy Accepted!', `Order ${order.orderId} is being prepared.`],
          delivering: ['🛵 Ready for Pickup!', `Order ${order.orderId} is ready.`],
          delivered: ['✅ Delivered!', `Order ${order.orderId} delivered.`],
        }
        const [title, body] = msgs[newStatus] || ['Order Update', '']
        await sendNotification(order.userId, title, body, 'order', {
          orderId: order.orderId,
        })
      }
      toast.success(`Marked as ${newStatus}`)
    } catch (err) {
      console.error(err)
    }
  }

  const rejectOrder = async (order) => {
    const reason = window.prompt(
      'Rejection reason (customer will see this):',
      'Medicine unavailable'
    )
    if (reason === null) return
    if (!reason.trim()) {
      toast.error('Reason required')
      return
    }
    try {
      await updateDoc(doc(db, 'orders', order.firebaseId), {
        status: 'cancelled',
        cancelReason: reason.trim(),
        cancelledAt: new Date(),
        cancelledBy: 'pharmacy',
      })
      if (order.userId) {
        await sendNotification(
          order.userId,
          '❌ Order Cancelled',
          `Order ${order.orderId} cancelled. Reason: ${reason}`,
          'order',
          { orderId: order.orderId }
        )
      }
      toast.success('Cancelled')
    } catch (err) {
      toast.error('Failed')
    }
  }

  // ============ STATUS TOGGLE ============
  const changeStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'pharmacies', pharmacy.firebaseId), {
        pharmacyStatus: newStatus,
      })
      setPharmacy({ ...pharmacy, pharmacyStatus: newStatus })
      toast.success(`Pharmacy is now ${newStatus}`)
    } catch (err) {
      console.error(err)
    }
  }

  const updateSettings = async () => {
    try {
      await updateDoc(doc(db, 'pharmacies', pharmacy.firebaseId), {
        openingTime,
        closingTime,
        minimumOrder: parseFloat(minimumOrder),
        deliveryFee: parseFloat(deliveryFee),
      })
      toast.success('Settings updated!')
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userRole')
      window.location.href = '/pharmacy-login'
    } catch (err) {
      console.error(err)
    }
  }

  // ============ STATS ============
  const now = new Date()
  const todayStr = now.toLocaleDateString()
  const todayOrders = orders.filter(
    (o) => o.createdAt?.toDate?.()?.toLocaleDateString() === todayStr
  )
  const todaySales = todayOrders.reduce((s, o) => s + (o.total || 0), 0)
  const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0)

  const newOrders = orders.filter(
    (o) => (o.status === 'pending' || !o.status) && o.status !== 'cancelled'
  ).length
  const preparingOrders = orders.filter((o) => o.status === 'preparing').length
  const readyOrders = orders.filter((o) => o.status === 'delivering').length
  const completedOrders = orders.filter((o) => o.status === 'delivered').length

  const filteredOrders = useMemo(() => {
    let r = [...orders]
    if (orderFilter !== 'all') {
      if (orderFilter === 'new') {
        r = r.filter(
          (o) =>
            (o.status === 'pending' || !o.status) && o.status !== 'cancelled'
        )
      } else {
        r = r.filter((o) => o.status === orderFilter)
      }
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase()
      r = r.filter(
        (o) =>
          (o.orderId || '').toLowerCase().includes(q) ||
          (o.fullName || '').toLowerCase().includes(q) ||
          (o.phone || '').toLowerCase().includes(q)
      )
    }
    return r
  }, [orders, orderFilter, orderSearch])

  const visibleReviews = useMemo(
    () => reviews.filter((r) => r.hidden !== true),
    [reviews]
  )
  const reviewsStats = useMemo(() => {
    const total = visibleReviews.length
    const avg =
      total > 0
        ? visibleReviews.reduce((s, r) => s + (r.rating || 0), 0) / total
        : 0
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    visibleReviews.forEach((r) => {
      const s = Math.floor(r.rating || 0)
      if (s >= 1 && s <= 5) dist[s]++
    })
    return { total, avg, dist }
  }, [visibleReviews])

  const unreadReviewsCount = useMemo(() => {
    if (!lastViewedReviews) return visibleReviews.length
    return visibleReviews.filter((r) => {
      const t = r.createdAt?.toDate?.()
      return t && t > lastViewedReviews
    }).length
  }, [visibleReviews, lastViewedReviews])

  useEffect(() => {
    if (!pharmacy || view !== 'reviews') return
    if (unreadReviewsCount === 0) return
    const t = setTimeout(async () => {
      try {
        const nowT = new Date()
        await updateDoc(doc(db, 'pharmacies', pharmacy.firebaseId), {
          lastViewedReviews: nowT,
        })
        setLastViewedReviews(nowT)
      } catch (err) {
        console.error(err)
      }
    }, 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pharmacy?.firebaseId, reviews.length])

  const filteredReviews = useMemo(() => {
    if (reviewRatingFilter === 'all') return visibleReviews
    return visibleReviews.filter(
      (r) => Math.floor(r.rating || 0) === parseInt(reviewRatingFilter)
    )
  }, [visibleReviews, reviewRatingFilter])

  const renderStars = (value, size = 14) => {
    const rounded = Math.round(Number(value) || 0)
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            fill={i <= rounded ? '#F59E0B' : 'transparent'}
            color={i <= rounded ? '#F59E0B' : '#D1D5DB'}
            strokeWidth={2}
          />
        ))}
      </div>
    )
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // ============ GUARDS ============
  if (loading) {
    return (
      <div className="rest-v2">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your pharmacy...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rest-v2">
        <div className="panel-error-box">
          <div className="panel-error-icon">⚠️</div>
          <h2>Access Restricted</h2>
          <p>{error}</p>
          <div className="panel-error-actions">
            <button
              className="account-home-btn"
              onClick={() => (window.location.href = '/')}
            >
              ← Go Home
            </button>
            <button className="restaurant-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="rest-v2">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  const currentStatus = pharmacy.pharmacyStatus || 'offline'
  const isOnline = currentStatus === 'online' || currentStatus === 'busy'

  return (
    <div className="rest-v2">
      {/* TOP BAR */}
      <div className="rest-v2-topbar">
        <div className="rest-v2-topbar-left">
          <div className="rest-v2-avatar-wrap">
            <div className="rest-v2-avatar">
              {pharmacy.logo ? (
                <img src={pharmacy.logo} alt="" />
              ) : (
                <span>💊</span>
              )}
            </div>
            <span
              className={`rest-v2-avatar-pulse ${isOnline ? '' : 'offline'}`}
            />
          </div>
          <div>
            <strong className="rest-v2-name">
              {pharmacy.pharmacyName}
            </strong>
            <span className={`rest-v2-status ${isOnline ? 'online' : ''}`}>
              {currentStatus === 'online'
                ? '● Online'
                : currentStatus === 'busy'
                ? '● Busy'
                : '○ Offline'}
            </span>
          </div>
        </div>

        <div className="rest-v2-topbar-actions">
          {/* ✅ In-App Notification Bell */}
          <NotificationPanel targetUserId={user?.uid} />

          <button
            className={`rest-v2-pill-btn ${isOnline ? 'online' : 'offline'}`}
            onClick={() => changeStatus(isOnline ? 'offline' : 'online')}
          >
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </button>
          <button className="rest-v2-pill-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">📊 Dashboard</h2>

          {/* ✅ Push Notification Card */}
          <div style={{ marginBottom: '16px' }}>
            <PushToggleCard user={user} />
          </div>

          <div className="rest-v2-hero-card">
            <p className="rest-v2-hero-card-label">Today's Sales</p>
            <p className="rest-v2-hero-card-value">৳{todaySales.toFixed(0)}</p>
            <p className="rest-v2-hero-card-sub">
              From {todayOrders.length}{' '}
              {todayOrders.length === 1 ? 'order' : 'orders'} today
            </p>
          </div>

          <div className="rest-v2-stat-grid">
            <div className="rest-v2-stat-card">
              <div className="rest-v2-stat-icon orange">🆕</div>
              <div>
                <div className="rest-v2-stat-value">{newOrders}</div>
                <div className="rest-v2-stat-label">New Orders</div>
              </div>
            </div>
            <div className="rest-v2-stat-card">
              <div className="rest-v2-stat-icon blue">👨‍⚕️</div>
              <div>
                <div className="rest-v2-stat-value">{preparingOrders}</div>
                <div className="rest-v2-stat-label">Preparing</div>
              </div>
            </div>
            <div className="rest-v2-stat-card">
              <div className="rest-v2-stat-icon purple">🛵</div>
              <div>
                <div className="rest-v2-stat-value">{readyOrders}</div>
                <div className="rest-v2-stat-label">Ready</div>
              </div>
            </div>
            <div className="rest-v2-stat-card">
              <div className="rest-v2-stat-icon green">✅</div>
              <div>
                <div className="rest-v2-stat-value">{completedOrders}</div>
                <div className="rest-v2-stat-label">Completed</div>
              </div>
            </div>
          </div>

          <div className="rest-v2-view-title" style={{ fontSize: '18px' }}>
            💰 Earnings
          </div>
          <div className="rest-v2-earnings-grid">
            <div className="rest-v2-earnings-card">
              <span className="rest-v2-earnings-label">Today</span>
              <span className="rest-v2-earnings-value green">
                ৳{todaySales.toFixed(0)}
              </span>
            </div>
            <div className="rest-v2-earnings-card">
              <span className="rest-v2-earnings-label">All Time</span>
              <span className="rest-v2-earnings-value">
                ৳{totalSales.toFixed(0)}
              </span>
            </div>
            <div className="rest-v2-earnings-card">
              <span className="rest-v2-earnings-label">Medicines</span>
              <span className="rest-v2-earnings-value orange">
                {medicines.length}
              </span>
            </div>
            <div className="rest-v2-earnings-card">
              <span className="rest-v2-earnings-label">Rating</span>
              <span className="rest-v2-earnings-value blue">
                ⭐ {pharmacy.rating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {view === 'orders' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">
            📦 Orders ({orders.length})
          </h2>

          <div className="rest-v2-search-bar">
            <Search size={18} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search by ID, customer, phone..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
            {orderSearch && (
              <button
                onClick={() => setOrderSearch('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="rest-v2-filter-row">
            {[
              { value: 'all', label: 'All' },
              { value: 'new', label: `New (${newOrders})` },
              { value: 'preparing', label: 'Preparing' },
              { value: 'delivering', label: 'Ready' },
              { value: 'delivered', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ].map((f) => (
              <button
                key={f.value}
                className={`rest-v2-filter-btn ${
                  orderFilter === f.value ? 'active' : ''
                }`}
                onClick={() => setOrderFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rest-v2-empty">
              <div className="rest-v2-empty-icon">📭</div>
              <h3>No orders found</h3>
              <p>Orders will appear here</p>
            </div>
          ) : (
            <div className="rest-v2-order-list">
              {filteredOrders.map((order) => {
                const status = order.status || 'pending'
                const isCancelled = status === 'cancelled'
                const isNew = status === 'pending'
                const showPaidOnlineBadge =
                  order.paymentStatus === 'verified' && isOnlineOrder(order)

                return (
                  <div
                    className={`rest-v2-order ${isNew ? 'new-order' : ''}`}
                    key={order.firebaseId}
                  >
                    <div className="rest-v2-order-header">
                      <div className="rest-v2-order-info-block">
                        <strong>#{order.orderId}</strong>
                        <small>{order.userEmail || 'Customer'}</small>
                        {showPaidOnlineBadge && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(16,185,129,0.15)',
                              color: '#059669',
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.3px',
                            }}
                          >
                            💳 PAID ONLINE
                          </span>
                        )}
                      </div>
                      <span className={`rest-v2-order-status ${status}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="rest-v2-order-info">
                      <div className="rest-v2-info-row">
                        <span className="rest-v2-info-row-icon">👤</span>
                        <span className="rest-v2-info-row-text">
                          {order.fullName} · {order.phone}
                        </span>
                      </div>
                      <div className="rest-v2-info-row">
                        <span className="rest-v2-info-row-icon">📍</span>
                        <span className="rest-v2-info-row-text">
                          {order.address}
                        </span>
                      </div>
                      {order.zoneName && (
                        <div className="rest-v2-info-row">
                          <span className="rest-v2-info-row-icon">🗺️</span>
                          <span className="rest-v2-info-row-text">
                            Zone: {order.zoneName}
                          </span>
                        </div>
                      )}
                      {order.paymentTrxId && (
                        <div className="rest-v2-info-row">
                          <span className="rest-v2-info-row-icon">🧾</span>
                          <span className="rest-v2-info-row-text">
                            TrxID: {order.paymentTrxId}
                          </span>
                        </div>
                      )}
                      {order.cancelReason && (
                        <div className="rest-v2-info-row">
                          <span className="rest-v2-info-row-icon">❌</span>
                          <span
                            className="rest-v2-info-row-text"
                            style={{ color: '#DC2626' }}
                          >
                            Cancelled: {order.cancelReason}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="rest-v2-order-items">
                      {order.items?.map((item, idx) => (
                        <div className="rest-v2-order-item" key={idx}>
                          <span>
                            {item.emoji || '💊'} {item.name}
                          </span>
                          <strong>× {item.quantity}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="rest-v2-order-totals">
                      <div className="rest-v2-total-block">
                        <span className="rest-v2-total-label">Total</span>
                        <span className="rest-v2-total-value">
                          ৳{order.total}
                        </span>
                      </div>
                      <div className="rest-v2-total-block">
                        <span className="rest-v2-total-label">Payment</span>
                        <span
                          className="rest-v2-total-value"
                          style={{
                            fontSize: '14px',
                            textTransform: 'uppercase',
                            color: showPaidOnlineBadge ? '#059669' : undefined,
                          }}
                        >
                          {order.paymentMethod || 'COD'}
                        </span>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="rest-v2-order-actions">
                        {status === 'pending' && (
                          <>
                            <button
                              className="rest-v2-action-btn"
                              onClick={() =>
                                updateOrderStatus(
                                  order.firebaseId,
                                  'preparing',
                                  order
                                )
                              }
                            >
                              ✅ Accept
                            </button>
                            <button
                              className="rest-v2-action-btn red"
                              onClick={() => rejectOrder(order)}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {status === 'preparing' && (
                          <>
                            <button
                              className="rest-v2-action-btn blue"
                              onClick={() =>
                                updateOrderStatus(
                                  order.firebaseId,
                                  'delivering',
                                  order
                                )
                              }
                            >
                              🛵 Ready for Pickup
                            </button>
                            <button
                              className="rest-v2-action-btn red"
                              onClick={() => rejectOrder(order)}
                            >
                              ❌ Cancel
                            </button>
                          </>
                        )}
                        {status === 'delivering' && (
                          <button
                            className="rest-v2-action-btn purple"
                            onClick={() =>
                              updateOrderStatus(
                                order.firebaseId,
                                'delivered',
                                order
                              )
                            }
                          >
                            ✅ Mark Delivered
                          </button>
                        )}
                        {status === 'delivered' && (
                          <div
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '10px',
                              borderRadius: '999px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#059669',
                              fontSize: '12.5px',
                              fontWeight: 800,
                            }}
                          >
                            ✅ Completed
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MEDICINES */}
      {view === 'medicines' && (
        <div className="rest-v2-view">
          <div className="rest-v2-menu-header">
            <h2 className="rest-v2-view-title">
              💊 Medicines ({medicines.length})
            </h2>
            <button
              className="rest-v2-action-btn"
              style={{ flex: 'unset', padding: '10px 18px' }}
              onClick={() => {
                if (showAddMed) resetMedForm()
                else setShowAddMed(true)
              }}
            >
              {showAddMed ? '✕ Cancel' : '+ Add Medicine'}
            </button>
          </div>

          {showAddMed && (
            <div className="rest-v2-form">
              <div className="rest-v2-form-row">
                <div className="rest-v2-form-group">
                  <label>Medicine Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Napa"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                </div>
                <div className="rest-v2-form-group">
                  <label>Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Paracetamol"
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                  />
                </div>
              </div>

              <div className="rest-v2-form-row">
                <div className="rest-v2-form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    placeholder="e.g., Beximco"
                    value={medCompany}
                    onChange={(e) => setMedCompany(e.target.value)}
                  />
                </div>
                <div className="rest-v2-form-group">
                  <label>Category</label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value)}
                  >
                    {MED_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rest-v2-form-row">
                <div className="rest-v2-form-group">
                  <label>Price (৳) *</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={medPrice}
                    onChange={(e) => setMedPrice(e.target.value)}
                  />
                </div>
                <div className="rest-v2-form-group">
                  <label>Discount Price (৳)</label>
                  <input
                    type="number"
                    value={medDiscountPrice}
                    onChange={(e) => setMedDiscountPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="rest-v2-form-row">
                <div className="rest-v2-form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    value={medStock}
                    onChange={(e) => setMedStock(e.target.value)}
                  />
                </div>
                <div className="rest-v2-form-group">
                  <label>Prescription Required?</label>
                  <select
                    value={medRequiresRx ? 'yes' : 'no'}
                    onChange={(e) =>
                      setMedRequiresRx(e.target.value === 'yes')
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="rest-v2-form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={medDescription}
                  onChange={(e) => setMedDescription(e.target.value)}
                />
              </div>

              <div className="rest-v2-form-group">
                <label>Image</label>
                {medImage ? (
                  <div style={{ position: 'relative', maxWidth: '180px' }}>
                    <img
                      src={medImage}
                      alt=""
                      style={{ width: '100%', borderRadius: '12px' }}
                    />
                    <button
                      onClick={() => setMedImage('')}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-block',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      background: 'var(--surface-soft)',
                      border: '2px dashed var(--border-strong)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    📷 Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMedImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <button className="rest-v2-form-submit" onClick={saveMedicine}>
                {editingMedId ? '💾 Update Medicine' : '+ Add Medicine'}
              </button>
            </div>
          )}

          {medicines.length === 0 ? (
            <div className="rest-v2-empty">
              <div className="rest-v2-empty-icon">💊</div>
              <h3>No medicines yet</h3>
              <p>Add your first medicine</p>
            </div>
          ) : (
            <div className="rest-v2-menu-grid">
              {medicines.map((m) => (
                <div
                  className={`rest-v2-menu-item ${
                    !m.available ? 'unavailable' : ''
                  }`}
                  key={m.firebaseId}
                >
                  <div className="rest-v2-menu-img">
                    {m.image ? <img src={m.image} alt="" /> : '💊'}
                  </div>
                  <div className="rest-v2-menu-info">
                    <h4>{m.name}</h4>
                    <p>
                      {m.genericName && `${m.genericName} · `}
                      {m.company || '—'}
                    </p>
                    {m.requiresPrescription && (
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(220,38,38,0.1)',
                          color: '#DC2626',
                          fontSize: '10px',
                          fontWeight: 800,
                          marginBottom: '6px',
                        }}
                      >
                        ⚠️ Rx
                      </div>
                    )}
                    <div className="rest-v2-menu-price">
                      {m.discountPrice ? (
                        <>
                          <strong>৳{m.discountPrice}</strong>
                          <del>৳{m.price}</del>
                        </>
                      ) : (
                        <strong>৳{m.price}</strong>
                      )}
                    </div>
                    <div className="rest-v2-menu-actions">
                      <button
                        className={`avail-btn ${
                          m.available ? 'active' : ''
                        }`}
                        onClick={() =>
                          toggleMedAvailability(m.firebaseId, m.available)
                        }
                      >
                        {m.available ? '✓ Available' : '✗ Out'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => editMedicine(m)}
                        style={{
                          background: 'rgba(5,150,105,0.12)',
                          color: '#059669',
                          border: '1px solid rgba(5,150,105,0.3)',
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteMedicine(m.firebaseId, m.name)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS */}
      {view === 'reviews' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">
            ⭐ Reviews ({reviewsStats.total})
            {unreadReviewsCount > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: '#FFFFFF',
                  marginLeft: '8px',
                }}
              >
                {unreadReviewsCount} new
              </span>
            )}
          </h2>

          {reviewsStats.total > 0 && (
            <div
              style={{
                padding: '20px',
                borderRadius: '20px',
                background:
                  'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
                border: '1px solid rgba(245,158,11,0.25)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#D97706',
                    lineHeight: 1,
                  }}
                >
                  {reviewsStats.avg.toFixed(1)}
                </div>
                <div style={{ marginTop: '6px' }}>
                  {renderStars(reviewsStats.avg, 18)}
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    marginTop: '6px',
                  }}
                >
                  {reviewsStats.total} review
                  {reviewsStats.total !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewsStats.dist[star] || 0
                  const percent =
                    reviewsStats.total > 0
                      ? (count / reviewsStats.total) * 100
                      : 0
                  return (
                    <div
                      key={star}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        marginBottom: '5px',
                      }}
                    >
                      <span
                        style={{
                          minWidth: '24px',
                          fontWeight: 800,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {star}★
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '7px',
                          background: 'var(--surface-soft)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background:
                              star >= 4
                                ? '#16a34a'
                                : star === 3
                                ? '#f59e0b'
                                : '#dc2626',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          minWidth: '34px',
                          textAlign: 'right',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {filteredReviews.length === 0 ? (
            <div className="rest-v2-empty">
              <div className="rest-v2-empty-icon">📝</div>
              <h3>
                {reviewsStats.total === 0
                  ? 'No reviews yet'
                  : 'No reviews match filter'}
              </h3>
              <p>
                {reviewsStats.total === 0
                  ? 'Customer reviews will appear here'
                  : 'Try a different rating'}
              </p>
            </div>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {filteredReviews.map((r) => (
                <div
                  key={r.firebaseId}
                  style={{
                    padding: '18px',
                    borderRadius: '20px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#047857',
                      }}
                    >
                      {(r.customerName || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14.5px', fontWeight: 800 }}>
                        {r.customerName || 'Anonymous'}
                      </strong>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                      >
                        {renderStars(r.rating || 0, 14)}
                        <span
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {formatDate(r.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {r.comment && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        paddingLeft: '56px',
                      }}
                    >
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE */}
      {view === 'profile' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">🏪 Pharmacy Profile</h2>

          {/* ✅ Push Notification Card */}
          <div style={{ marginBottom: '16px' }}>
            <PushToggleCard user={user} />
          </div>

          <div className="rest-v2-profile-card">
            <div className="rest-v2-profile-avatar">
              {logo ? <img src={logo} alt="" /> : <span>💊</span>}
            </div>
            <h3 className="rest-v2-profile-name">
              {pharmacy.pharmacyName}
            </h3>
            <p className="rest-v2-profile-email">{pharmacy.email}</p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '12px',
                flexWrap: 'wrap',
              }}
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                id="pharm-logo-upload"
              />
              <label
                htmlFor="pharm-logo-upload"
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Camera size={16} />
                {logo ? 'Change Logo' : 'Upload Logo'}
              </label>
            </div>
          </div>

          <div className="rest-v2-form">
            <div className="rest-v2-form-row">
              <div className="rest-v2-form-group">
                <label>Pharmacy Name *</label>
                <input
                  type="text"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                />
              </div>
              <div className="rest-v2-form-group">
                <label>Owner Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>
            </div>

            <div className="rest-v2-form-row">
              <div className="rest-v2-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="rest-v2-form-group">
                <label>Delivery Time</label>
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="20-30 min"
                />
              </div>
            </div>

            <div className="rest-v2-form-group">
              <label>Address</label>
              <textarea
                rows="2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="rest-v2-form-group">
              <label>Description</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="rest-v2-form-group">
              <label>📍 Location</label>
              <MapPicker
                position={location}
                setPosition={setLocation}
                height={280}
              />
            </div>

            <button
              className="rest-v2-form-submit"
              onClick={saveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? '⏳ Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {view === 'settings' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">⚙️ Settings</h2>

          {/* ✅ Push Notification Card */}
          <div style={{ marginBottom: '16px' }}>
            <PushToggleCard user={user} />
          </div>

          <div className="rest-v2-form">
            <div className="rest-v2-form-row">
              <div className="rest-v2-form-group">
                <label>Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                />
              </div>
              <div className="rest-v2-form-group">
                <label>Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                />
              </div>
            </div>

            <div className="rest-v2-form-row">
              <div className="rest-v2-form-group">
                <label>Minimum Order (৳)</label>
                <input
                  type="number"
                  value={minimumOrder}
                  onChange={(e) => setMinimumOrder(e.target.value)}
                />
              </div>
              <div className="rest-v2-form-group">
                <label>Delivery Fee (৳)</label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
            </div>

            <button className="rest-v2-form-submit" onClick={updateSettings}>
              💾 Save Settings
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="rest-v2-botnav">
        <button
          className={`rest-v2-navbtn ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => setView('dashboard')}
        >
          <span className="rest-v2-navbtn-icon">📊</span>
          Dashboard
        </button>
        <button
          className={`rest-v2-navbtn ${view === 'orders' ? 'active' : ''}`}
          onClick={() => setView('orders')}
        >
          <span className="rest-v2-navbtn-icon">📦</span>
          Orders
          {newOrders > 0 && (
            <span className="rest-v2-navbadge">{newOrders}</span>
          )}
        </button>
        <button
          className={`rest-v2-navbtn ${view === 'medicines' ? 'active' : ''}`}
          onClick={() => setView('medicines')}
        >
          <span className="rest-v2-navbtn-icon">💊</span>
          Medicines
        </button>
        <button
          className={`rest-v2-navbtn ${view === 'reviews' ? 'active' : ''}`}
          onClick={() => setView('reviews')}
        >
          <span className="rest-v2-navbtn-icon">⭐</span>
          Reviews
          {unreadReviewsCount > 0 && view !== 'reviews' && (
            <span className="rest-v2-navbadge">{unreadReviewsCount}</span>
          )}
        </button>
        <button
          className={`rest-v2-navbtn ${view === 'profile' ? 'active' : ''}`}
          onClick={() => setView('profile')}
        >
          <span className="rest-v2-navbtn-icon">🏪</span>
          Profile
        </button>
        <button
          className={`rest-v2-navbtn ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          <span className="rest-v2-navbtn-icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  )
}

export default PharmacyPanel