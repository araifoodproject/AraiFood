// ============================================================
// src/pages/RestaurantPanel.jsx — PREMIUM V2
// Full rebuild with bottom nav, top dishes, earnings breakdown,
// search/filter orders, reject with reason, location picker
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
import { Camera, X, Search } from 'lucide-react'
import MapPicker from '../components/MapPicker'

function RestaurantPanel() {
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('dashboard')

  // Menu form
  const [showAddFood, setShowAddFood] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [foodCategory, setFoodCategory] = useState('Biryani')
  const [foodPrice, setFoodPrice] = useState('')
  const [foodDiscountPrice, setFoodDiscountPrice] = useState('')
  const [foodDescription, setFoodDescription] = useState('')
  const [foodImage, setFoodImage] = useState('')
  const [foodAvailable, setFoodAvailable] = useState(true)

  // Settings form
  const [openingTime, setOpeningTime] = useState('10:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [minimumOrder, setMinimumOrder] = useState('100')
  const [deliveryFee, setDeliveryFee] = useState('30')

  // Profile edit
  const [logo, setLogo] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [description, setDescription] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [location, setLocation] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Orders search/filter
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState('all')

  const logoInputRef = useRef(null)
  const authCheckedRef = useRef(false)

  // ============ AUTH LOADING ============
  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return
      if (authCheckedRef.current) return
      authCheckedRef.current = true

      if (!currentUser) {
        setTimeout(() => {
          if (isMounted && !auth.currentUser) {
            window.location.href = '/restaurant-login'
          }
        }, 1500)
        return
      }

      setUser(currentUser)

      try {
        const restaurantDoc = await getDoc(
          doc(db, 'restaurants', currentUser.uid)
        )
        if (!isMounted) return

        if (!restaurantDoc.exists()) {
          setError('No restaurant account found with this email.')
          setLoading(false)
          return
        }

        const data = restaurantDoc.data()

        if (data.status === 'pending') {
          setError('⏳ Your account is pending Admin approval. Please wait.')
          setLoading(false)
          return
        }

        if (data.status === 'rejected') {
          setError(
            '❌ Your restaurant application was rejected. Please contact support.'
          )
          setLoading(false)
          return
        }

        setRestaurant({ firebaseId: restaurantDoc.id, ...data })

        setOpeningTime(data.openingTime || '10:00')
        setClosingTime(data.closingTime || '22:00')
        setMinimumOrder(String(data.minimumOrder || '100'))
        setDeliveryFee(String(data.deliveryFee || '30'))

        setLogo(data.logo || '')
        setRestaurantName(data.restaurantName || '')
        setOwnerName(data.ownerName || '')
        setPhone(data.phone || '')
        setAddress(data.address || '')
        setCuisine(data.cuisine || '')
        setDescription(data.description || '')
        setDeliveryTime(data.deliveryTime || '')
        setLocation(
          data.location?.lat && data.location?.lng ? data.location : null
        )

        setError('')
        localStorage.setItem('userRole', 'restaurant')
      } catch (err) {
        console.error('Error loading restaurant:', err)
        if (isMounted) setError('Failed to load restaurant data.')
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // ============ LIVE ORDERS ============
  useEffect(() => {
    if (!restaurant) return
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const allOrders = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      const restaurantOrders = allOrders
        .filter((order) => order.restaurantId === restaurant.firebaseId)
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
      setOrders(restaurantOrders)
    })
    return () => unsubscribe()
  }, [restaurant])

  // ============ LIVE MENU ============
  useEffect(() => {
    if (!restaurant) return
    const menuQuery = query(
      collection(db, 'foods'),
      where('restaurantId', '==', restaurant.firebaseId)
    )
    const unsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const menuList = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      setMenuItems(menuList)
    })
    return () => unsubscribe()
  }, [restaurant])

  // ============ LOGO UPLOAD ============
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX_SIZE = 500
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

        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        setLogo(compressed)
        toast.success('📷 Logo ready! Click "Save Profile".')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogo('')
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  // ============ SAVE PROFILE ============
  const saveProfile = async () => {
    if (!restaurantName.trim()) {
      toast.error('Restaurant name is required.')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone is required.')
      return
    }
    if (!address.trim()) {
      toast.error('Address is required.')
      return
    }

    setSavingProfile(true)
    try {
      const updateData = {
        logo: logo || '',
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        deliveryTime: deliveryTime.trim() || '30-40 min',
        updatedAt: new Date(),
      }
      if (location?.lat && location?.lng) {
        updateData.location = {
          lat: location.lat,
          lng: location.lng,
        }
      }

      await updateDoc(
        doc(db, 'restaurants', restaurant.firebaseId),
        updateData
      )

      setRestaurant((prev) => ({ ...prev, ...updateData }))
      toast.success('✅ Profile updated!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // ============ IMAGE UPLOAD (Food) ============
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Please select under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 1000
        let width = img.width
        let height = img.height
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          } else {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.9)
        setFoodImage(compressed)
        toast.success('📷 Image uploaded!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // ============ UPDATE ORDER STATUS ============
  const updateOrderStatus = async (firebaseId, newStatus, order) => {
    try {
      await updateDoc(doc(db, 'orders', firebaseId), { status: newStatus })
      if (order?.userId) {
        let title = ''
        let body = ''
        if (newStatus === 'preparing') {
          title = '👨‍🍳 Restaurant Accepted Your Order!'
          body = `Your order ${order.orderId} is being prepared.`
        } else if (newStatus === 'delivering') {
          title = '🛵 Order Ready for Pickup!'
          body = `Your order ${order.orderId} is ready for pickup.`
        } else if (newStatus === 'delivered') {
          title = '✅ Order Delivered!'
          body = `Order ${order.orderId} has been delivered. Enjoy!`
        }
        await sendNotification(order.userId, title, body, 'order', {
          orderId: order.orderId,
        })
      }
      toast.success(`Order marked as ${newStatus}!`)
    } catch (error) {
      console.error(error)
    }
  }

  // ============ REJECT ORDER ============
  const rejectOrder = async (order) => {
    const reason = window.prompt(
      'Why are you rejecting this order? (Customer will see this)',
      'Item unavailable'
    )
    if (reason === null) return
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error('Reason is required.')
      return
    }

    try {
      await updateDoc(doc(db, 'orders', order.firebaseId), {
        status: 'cancelled',
        cancelReason: trimmed,
        cancelledAt: new Date(),
        cancelledBy: 'restaurant',
      })

      if (order.userId) {
        await sendNotification(
          order.userId,
          '❌ Order Cancelled',
          `Your order ${order.orderId} was cancelled by the restaurant. Reason: ${trimmed}`,
          'order',
          { orderId: order.orderId }
        )
      }
      toast.success('Order cancelled.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to cancel')
    }
  }

  // ============ CHANGE RESTAURANT STATUS ============
  const changeRestaurantStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.firebaseId), {
        restaurantStatus: newStatus,
      })
      setRestaurant({ ...restaurant, restaurantStatus: newStatus })
      toast.success(`Restaurant is now ${newStatus}!`)
    } catch (error) {
      console.error(error)
    }
  }

  // ============ ADD FOOD ============
  const addFood = async () => {
    if (!foodName.trim()) {
      toast.error('Please enter food name!')
      return
    }
    if (!foodPrice || parseFloat(foodPrice) <= 0) {
      toast.error('Please enter valid price!')
      return
    }
    try {
      await addDoc(collection(db, 'foods'), {
        restaurantId: restaurant.firebaseId,
        restaurantName: restaurant.restaurantName,
        name: foodName.trim(),
        category: foodCategory,
        price: parseFloat(foodPrice),
        discountPrice: foodDiscountPrice
          ? parseFloat(foodDiscountPrice)
          : null,
        description: foodDescription.trim(),
        image: foodImage,
        available: foodAvailable,
        createdAt: new Date(),
      })
      toast.success('✅ Food added successfully!')
      setFoodName('')
      setFoodPrice('')
      setFoodDiscountPrice('')
      setFoodDescription('')
      setFoodImage('')
      setShowAddFood(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add food!')
    }
  }

  const deleteFood = async (foodId) => {
    if (!window.confirm('Delete this food?')) return
    try {
      await deleteDoc(doc(db, 'foods', foodId))
      toast.success('🗑️ Food deleted!')
    } catch (error) {
      console.error(error)
    }
  }

  const toggleFoodAvailability = async (foodId, current) => {
    try {
      await updateDoc(doc(db, 'foods', foodId), { available: !current })
    } catch (error) {
      console.error(error)
    }
  }

  // ============ UPDATE SETTINGS ============
  const updateSettings = async () => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.firebaseId), {
        openingTime,
        closingTime,
        minimumOrder: parseFloat(minimumOrder),
        deliveryFee: parseFloat(deliveryFee),
      })
      toast.success('✅ Settings updated!')
    } catch (error) {
      console.error(error)
    }
  }

  // ============ LOGOUT ============
  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userRole')
      window.location.href = '/restaurant-login'
    } catch (error) {
      console.error(error)
    }
  }

  // ============ STATS ============
  const now = new Date()
  const todayStr = now.toLocaleDateString()

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayOrders = orders.filter(
    (o) => o.createdAt?.toDate?.()?.toLocaleDateString() === todayStr
  )
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  const weekOrders = orders.filter((o) => {
    const t = o.createdAt?.toDate?.()
    return t && t >= startOfWeek
  })
  const weekSales = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  const monthOrders = orders.filter((o) => {
    const t = o.createdAt?.toDate?.()
    return t && t >= startOfMonth
  })
  const monthSales = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  const newOrders = orders.filter(
    (o) => (o.status === 'pending' || !o.status) && o.status !== 'cancelled'
  ).length
  const preparingOrders = orders.filter(
    (o) => o.status === 'preparing'
  ).length
  const readyOrders = orders.filter((o) => o.status === 'delivering').length
  const completedOrders = orders.filter(
    (o) => o.status === 'delivered'
  ).length

  // ============ TOP DISHES ============
  const topDishes = useMemo(() => {
    const counts = {}
    orders.forEach((order) => {
      if (order.status === 'cancelled') return
      order.items?.forEach((item) => {
        const key = item.id || item.name
        if (!key) return
        if (!counts[key]) {
          counts[key] = {
            name: item.name,
            emoji: item.emoji || '🍽️',
            image: item.image || '',
            count: 0,
            revenue: 0,
          }
        }
        counts[key].count += item.quantity || 1
        counts[key].revenue += (item.price || 0) * (item.quantity || 1)
      })
    })
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [orders])

  // ============ FILTERED ORDERS ============
  const filteredOrders = useMemo(() => {
    let result = [...orders]
    if (orderFilter !== 'all') {
      if (orderFilter === 'new') {
        result = result.filter(
          (o) => (o.status === 'pending' || !o.status) && o.status !== 'cancelled'
        )
      } else {
        result = result.filter((o) => o.status === orderFilter)
      }
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase()
      result = result.filter(
        (o) =>
          (o.orderId || '').toLowerCase().includes(q) ||
          (o.fullName || '').toLowerCase().includes(q) ||
          (o.phone || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [orders, orderFilter, orderSearch])

  // ============ GUARDS ============
  if (loading) {
    return (
      <div className="rest-v2">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your dashboard...</p>
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

  if (!restaurant) {
    return (
      <div className="rest-v2">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  const currentStatus = restaurant.restaurantStatus || 'offline'
  const isOnline = currentStatus === 'online' || currentStatus === 'busy'

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="rest-v2">
      {/* ============ TOP BAR ============ */}
      <div className="rest-v2-topbar">
        <div className="rest-v2-topbar-left">
          <div className="rest-v2-avatar-wrap">
            <div className="rest-v2-avatar">
              {restaurant.logo ? (
                <img src={restaurant.logo} alt="" />
              ) : (
                <span>🏪</span>
              )}
            </div>
            <span
              className={`rest-v2-avatar-pulse ${
                isOnline ? '' : 'offline'
              }`}
            />
          </div>
          <div>
            <strong className="rest-v2-name">
              {restaurant.restaurantName}
            </strong>
            <span
              className={`rest-v2-status ${isOnline ? 'online' : ''}`}
            >
              {currentStatus === 'online'
                ? '● Online'
                : currentStatus === 'busy'
                ? '● Busy'
                : '○ Offline'}
            </span>
          </div>
        </div>

        <div className="rest-v2-topbar-actions">
          <button
            className={`rest-v2-pill-btn ${
              isOnline ? 'online' : 'offline'
            }`}
            onClick={() =>
              changeRestaurantStatus(isOnline ? 'offline' : 'online')
            }
          >
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </button>
          <button
            className="rest-v2-pill-btn logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ============ DASHBOARD ============ */}
      {view === 'dashboard' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">📊 Dashboard</h2>

          <div className="rest-v2-hero-card">
            <p className="rest-v2-hero-card-label">Today's Sales</p>
            <p className="rest-v2-hero-card-value">
              ৳{todaySales.toFixed(0)}
            </p>
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
              <div className="rest-v2-stat-icon blue">👨‍🍳</div>
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
                <div className="rest-v2-stat-value">
                  {completedOrders}
                </div>
                <div className="rest-v2-stat-label">Completed</div>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
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
              <span className="rest-v2-earnings-label">Last 7 Days</span>
              <span className="rest-v2-earnings-value blue">
                ৳{weekSales.toFixed(0)}
              </span>
            </div>
            <div className="rest-v2-earnings-card">
              <span className="rest-v2-earnings-label">This Month</span>
              <span className="rest-v2-earnings-value orange">
                ৳{monthSales.toFixed(0)}
              </span>
            </div>
            <div className="rest-v2-earnings-card">
              <span className="rest-v2-earnings-label">All Time</span>
              <span className="rest-v2-earnings-value">
                ৳{totalSales.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Top Dishes */}
          <div className="rest-v2-top-dishes">
            <h3 className="rest-v2-top-dishes-title">
              🏆 Top Selling Items
            </h3>
            {topDishes.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                No sales yet
              </p>
            ) : (
              topDishes.map((dish, idx) => (
                <div className="rest-v2-dish-row" key={idx}>
                  <div
                    className={`rest-v2-dish-rank ${
                      idx === 0 ? 'gold' : ''
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="rest-v2-dish-img">
                    {dish.image ? (
                      <img src={dish.image} alt="" />
                    ) : (
                      dish.emoji
                    )}
                  </div>
                  <div className="rest-v2-dish-info">
                    <strong>{dish.name}</strong>
                    <small>৳{dish.revenue.toFixed(0)} revenue</small>
                  </div>
                  <div className="rest-v2-dish-count">
                    ×{dish.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ ORDERS ============ */}
      {view === 'orders' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">
            📦 Orders ({orders.length})
          </h2>

          {/* Search */}
          <div className="rest-v2-search-bar">
            <Search size={18} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search by order ID, customer, phone..."
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

          {/* Filters */}
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

          {/* List */}
          {filteredOrders.length === 0 ? (
            <div className="rest-v2-empty">
              <div className="rest-v2-empty-icon">📭</div>
              <h3>No orders found</h3>
              <p>
                {orderSearch
                  ? 'Try a different search term'
                  : 'Orders will appear here'}
              </p>
            </div>
          ) : (
            <div className="rest-v2-order-list">
              {filteredOrders.map((order) => {
                const status = order.status || 'pending'
                const isCancelled = status === 'cancelled'
                const isNew = status === 'pending'

                return (
                  <div
                    className={`rest-v2-order ${
                      isNew ? 'new-order' : ''
                    }`}
                    key={order.firebaseId}
                  >
                    <div className="rest-v2-order-header">
                      <div className="rest-v2-order-info-block">
                        <strong>#{order.orderId}</strong>
                        <small>{order.userEmail || 'Customer'}</small>
                      </div>
                      <span
                        className={`rest-v2-order-status ${status}`}
                      >
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
                          <span className="rest-v2-info-row-icon">
                            🗺️
                          </span>
                          <span className="rest-v2-info-row-text">
                            Zone: {order.zoneName}
                          </span>
                        </div>
                      )}
                      {order.orderNote && (
                        <div className="rest-v2-info-row">
                          <span className="rest-v2-info-row-icon">
                            📝
                          </span>
                          <span className="rest-v2-info-row-text">
                            {order.orderNote}
                          </span>
                        </div>
                      )}
                      {order.cancelReason && (
                        <div className="rest-v2-info-row">
                          <span className="rest-v2-info-row-icon">
                            ❌
                          </span>
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
                            {item.emoji || '🍽️'} {item.name}
                          </span>
                          <strong>× {item.quantity}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="rest-v2-order-totals">
                      <div className="rest-v2-total-block">
                        <span className="rest-v2-total-label">
                          Order Total
                        </span>
                        <span className="rest-v2-total-value">
                          ৳{order.total}
                        </span>
                      </div>
                      <div className="rest-v2-total-block">
                        <span className="rest-v2-total-label">
                          Payment
                        </span>
                        <span
                          className="rest-v2-total-value"
                          style={{
                            fontSize: '14px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {order.paymentMethod || 'COD'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
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
                              👨‍🍳 Accept
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

      {/* ============ MENU ============ */}
      {view === 'menu' && (
        <div className="rest-v2-view">
          <div className="rest-v2-menu-header">
            <h2 className="rest-v2-view-title">
              🍔 Menu ({menuItems.length})
            </h2>
            <button
              className="rest-v2-action-btn"
              style={{ flex: 'unset', padding: '10px 18px' }}
              onClick={() => setShowAddFood(!showAddFood)}
            >
              {showAddFood ? '✕ Cancel' : '+ Add Food'}
            </button>
          </div>

          {showAddFood && (
            <div className="rest-v2-form">
              <div className="rest-v2-form-row">
                <div className="rest-v2-form-group">
                  <label>Food Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Chicken Biryani"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                  />
                </div>
                <div className="rest-v2-form-group">
                  <label>Category</label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                  >
                    <option>Biryani</option>
                    <option>Burger</option>
                    <option>Pizza</option>
                    <option>Chicken</option>
                    <option>Drinks</option>
                    <option>Dessert</option>
                    <option>Rice & Curry</option>
                    <option>Snacks</option>
                  </select>
                </div>
              </div>

              <div className="rest-v2-form-row">
                <div className="rest-v2-form-group">
                  <label>Price (৳) *</label>
                  <input
                    type="number"
                    placeholder="180"
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                  />
                </div>
                <div className="rest-v2-form-group">
                  <label>Discount Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={foodDiscountPrice}
                    onChange={(e) => setFoodDiscountPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="rest-v2-form-group">
                <label>Food Image</label>
                {foodImage ? (
                  <div
                    style={{
                      position: 'relative',
                      maxWidth: '200px',
                    }}
                  >
                    <img
                      src={foodImage}
                      alt="Food Preview"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        display: 'block',
                      }}
                    />
                    <button
                      onClick={() => setFoodImage('')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 900,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '28px 20px',
                      borderRadius: '14px',
                      background: 'var(--surface-soft)',
                      border: '2px dashed var(--border-strong)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    📷 Upload Image (Max 5MB)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <div className="rest-v2-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Short description"
                  rows="2"
                  value={foodDescription}
                  onChange={(e) => setFoodDescription(e.target.value)}
                />
              </div>

              <button
                className="rest-v2-form-submit"
                onClick={addFood}
              >
                + Add Food
              </button>
            </div>
          )}

          {menuItems.length === 0 ? (
            <div className="rest-v2-empty">
              <div className="rest-v2-empty-icon">🍽️</div>
              <h3>No food items yet</h3>
              <p>Add your first dish to get started</p>
            </div>
          ) : (
            <div className="rest-v2-menu-grid">
              {menuItems.map((item) => (
                <div
                  className={`rest-v2-menu-item ${
                    !item.available ? 'unavailable' : ''
                  }`}
                  key={item.firebaseId}
                >
                  <div className="rest-v2-menu-img">
                    {item.image ? (
                      <img src={item.image} alt="" />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  <div className="rest-v2-menu-info">
                    <h4>{item.name}</h4>
                    <p>{item.category}</p>
                    <div className="rest-v2-menu-price">
                      {item.discountPrice ? (
                        <>
                          <strong>৳{item.discountPrice}</strong>
                          <del>৳{item.price}</del>
                        </>
                      ) : (
                        <strong>৳{item.price}</strong>
                      )}
                    </div>
                    <div className="rest-v2-menu-actions">
                      <button
                        className={`avail-btn ${
                          item.available ? 'active' : ''
                        }`}
                        onClick={() =>
                          toggleFoodAvailability(
                            item.firebaseId,
                            item.available
                          )
                        }
                      >
                        {item.available ? '✓ Available' : '✗ Out'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteFood(item.firebaseId)}
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

      {/* ============ PROFILE ============ */}
      {view === 'profile' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">🏪 Profile</h2>

          <div className="rest-v2-profile-card">
            <div className="rest-v2-profile-avatar">
              {logo ? <img src={logo} alt="" /> : <span>🏪</span>}
            </div>
            <h3 className="rest-v2-profile-name">
              {restaurant.restaurantName}
            </h3>
            <p className="rest-v2-profile-email">{restaurant.email}</p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                id="rest-logo-upload"
              />
              <label
                htmlFor="rest-logo-upload"
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(135deg, #059669, #047857)',
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
              {logo && (
                <button
                  onClick={removeLogo}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '999px',
                    background: 'rgba(220,38,38,0.1)',
                    color: '#DC2626',
                    border: '1px solid rgba(220,38,38,0.25)',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Remove
                </button>
              )}
            </div>
          </div>

          <div className="rest-v2-form">
            <div className="rest-v2-form-row">
              <div className="rest-v2-form-group">
                <label>Restaurant Name *</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
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
                <label>Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="rest-v2-form-group">
                <label>Cuisine</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g., Biriyani • Bangladeshi"
                />
              </div>
            </div>

            <div className="rest-v2-form-group">
              <label>Delivery Time Range</label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g., 25-35 min"
              />
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  marginTop: '2px',
                }}
              >
                💡 Example: "25-35 min" or "30-45 min"
              </div>
            </div>

            <div className="rest-v2-form-group">
              <label>Address *</label>
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

            <div
              className="rest-v2-form-group"
              style={{
                paddingTop: '12px',
                borderTop: '1px dashed var(--border)',
              }}
            >
              <label>📍 Restaurant Location</label>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  marginBottom: '10px',
                  fontStyle: 'italic',
                }}
              >
                💡 Click on the map to set your restaurant's exact
                location. This helps riders find you.
              </div>
              <MapPicker
                position={location}
                setPosition={setLocation}
                height={300}
                helperText="👆 Click on the map to set your restaurant's location"
              />
            </div>

            <div className="rest-v2-form-group">
              <label style={{ opacity: 0.6 }}>
                Email (locked)
              </label>
              <input
                type="email"
                value={restaurant.email || ''}
                disabled
                style={{
                  background: 'var(--surface-soft)',
                  cursor: 'not-allowed',
                  opacity: 0.7,
                }}
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

      {/* ============ SETTINGS ============ */}
      {view === 'settings' && (
        <div className="rest-v2-view">
          <h2 className="rest-v2-view-title">⚙️ Settings</h2>

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

            <button
              className="rest-v2-form-submit"
              onClick={updateSettings}
            >
              💾 Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ============ BOTTOM NAV ============ */}
      <div className="rest-v2-botnav">
        <button
          className={`rest-v2-navbtn ${
            view === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setView('dashboard')}
        >
          <span className="rest-v2-navbtn-icon">📊</span>
          Dashboard
        </button>
        <button
          className={`rest-v2-navbtn ${
            view === 'orders' ? 'active' : ''
          }`}
          onClick={() => setView('orders')}
        >
          <span className="rest-v2-navbtn-icon">📦</span>
          Orders
          {newOrders > 0 && (
            <span className="rest-v2-navbadge">{newOrders}</span>
          )}
        </button>
        <button
          className={`rest-v2-navbtn ${
            view === 'menu' ? 'active' : ''
          }`}
          onClick={() => setView('menu')}
        >
          <span className="rest-v2-navbtn-icon">🍔</span>
          Menu
        </button>
        <button
          className={`rest-v2-navbtn ${
            view === 'profile' ? 'active' : ''
          }`}
          onClick={() => setView('profile')}
        >
          <span className="rest-v2-navbtn-icon">🏪</span>
          Profile
        </button>
        <button
          className={`rest-v2-navbtn ${
            view === 'settings' ? 'active' : ''
          }`}
          onClick={() => setView('settings')}
        >
          <span className="rest-v2-navbtn-icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  )
}

export default RestaurantPanel