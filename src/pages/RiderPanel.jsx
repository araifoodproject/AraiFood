// ============================================================
// src/pages/RiderPanel.jsx — PREMIUM V2.2
// Full rebuild — bottom nav, distance/ETA, zone display
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
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { sendNotification } from '../utils/sendNotification'
import {
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
  getSimulatedLocation,
  getProgressFromStatus,
} from '../utils/locationTracker'
import useSettings from '../hooks/useSettings'

// ------------------------------------------------------------
// Distance helper — Haversine
// ------------------------------------------------------------
const calculateDistanceKm = (a, b) => {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// ETA: 10 km/h → 6 min per km
const calculateEtaMin = (km) => {
  if (km == null) return null
  return Math.max(1, Math.round(km * 6))
}

function RiderPanel() {
  const { settings } = useSettings()

  const [user, setUser] = useState(null)
  const [rider, setRider] = useState(null)
  const [orders, setOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('dashboard')
  const [otpInput, setOtpInput] = useState('')

  const [gpsMode, setGpsMode] = useState('simulated')
  const [currentGPSLocation, setCurrentGPSLocation] = useState(null)
  const [gpsError, setGpsError] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)

  // Restaurant location cache
  const [restaurantLocCache, setRestaurantLocCache] = useState({})

  // Profile edit
  const [editMode, setEditMode] = useState(false)
  const [editProfileImage, setEditProfileImage] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editVehicleType, setEditVehicleType] = useState('')
  const [editVehicleNumber, setEditVehicleNumber] = useState('')
  const [editLicenseNumber, setEditLicenseNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const watchIdRef = useRef(null)
  const authCheckedRef = useRef(false)

  // ------------------------------------------------------------
  // Restaurant location fetch (with cache)
  // ------------------------------------------------------------
  const getRestaurantLocation = async (restaurantId) => {
    if (!restaurantId) return settings.mapDefaultCenter || null
    if (restaurantLocCache[restaurantId]) return restaurantLocCache[restaurantId]
    try {
      const snap = await getDoc(doc(db, 'restaurants', restaurantId))
      if (snap.exists()) {
        const data = snap.data()
        if (data.location?.lat && data.location?.lng) {
          setRestaurantLocCache((prev) => ({
            ...prev,
            [restaurantId]: data.location,
          }))
          return data.location
        }
      }
    } catch (err) {
      console.error('Restaurant location error:', err)
    }
    return settings.mapDefaultCenter || null
  }

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
            window.location.href = '/rider-login'
          }
        }, 1500)
        return
      }

      setUser(currentUser)

      try {
        let riderDoc = await getDoc(doc(db, 'riders', currentUser.uid))
        let data = null
        let actualRiderId = currentUser.uid

        if (!riderDoc.exists()) {
          const emailQuery = query(
            collection(db, 'riders'),
            where('email', '==', currentUser.email)
          )
          const emailSnapshot = await getDocs(emailQuery)

          if (!emailSnapshot.empty) {
            const foundDoc = emailSnapshot.docs[0]
            data = foundDoc.data()
            actualRiderId = foundDoc.id
          } else {
            setError('No rider account found.')
            setLoading(false)
            return
          }
        } else {
          data = riderDoc.data()
        }

        if (!isMounted) return

        if (data.status === 'pending') {
          setError('⏳ Your account is pending Admin approval.')
          setLoading(false)
          return
        }
        if (data.status === 'rejected') {
          setError('❌ Your rider application was rejected.')
          setLoading(false)
          return
        }

        setRider({ firebaseId: actualRiderId, ...data })
        setEditProfileImage(data.profileImage || '')
        setEditPhone(data.phone || '')
        setEditAddress(data.address || '')
        setEditVehicleType(data.vehicleType || 'Motorcycle')
        setEditVehicleNumber(data.vehicleNumber || '')
        setEditLicenseNumber(data.licenseNumber || '')
        setGpsMode(data.gpsMode || 'simulated')
        setError('')
        localStorage.setItem('userRole', 'rider')
      } catch (err) {
        console.error('Error loading rider:', err)
        if (isMounted) setError('Failed to load rider data.')
      }
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // ============ AUTO-REQUEST GPS (real mode) ============
  useEffect(() => {
    if (!rider || gpsMode !== 'real') return
    if (currentGPSLocation) return

    const autoFetch = async () => {
      setGpsLoading(true)
      try {
        const loc = await getCurrentLocation()
        setCurrentGPSLocation(loc)
        setGpsError('')
      } catch (err) {
        setGpsError(err || 'Location permission denied.')
      } finally {
        setGpsLoading(false)
      }
    }
    autoFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.firebaseId, gpsMode])

  // ============ GPS TRACKING ============
  useEffect(() => {
    if (!rider || gpsMode !== 'real') {
      if (watchIdRef.current) {
        stopLocationTracking()
        watchIdRef.current = null
      }
      return
    }
    if (rider.riderStatus !== 'online') {
      if (watchIdRef.current) {
        stopLocationTracking()
        watchIdRef.current = null
      }
      return
    }

    watchIdRef.current = startLocationTracking(
      rider.firebaseId,
      async (location) => {
        setCurrentGPSLocation(location)
        setGpsError('')
        try {
          await updateDoc(doc(db, 'riders', rider.firebaseId), {
            currentLocation: {
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              updatedAt: new Date(),
            },
          })
        } catch (err) {
          console.error('Save GPS error:', err)
        }
      },
      (errMsg) => {
        setGpsError(errMsg)
        console.error('GPS Error:', errMsg)
      }
    )

    return () => {
      if (watchIdRef.current) {
        stopLocationTracking()
        watchIdRef.current = null
      }
    }
  }, [rider?.riderStatus, gpsMode, rider?.firebaseId])

  // ============ LIVE ORDERS ============
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime() || 0
        const bT = b.createdAt?.toDate?.()?.getTime() || 0
        return bT - aT
      })
      setOrders(list)
    })
    return () => unsubscribe()
  }, [])

  // ============ AUTO-FETCH restaurant locations for available orders ============
  const availableOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          !o.riderId &&
          (o.riderStatus === 'available' || !o.riderStatus) &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled'
      ),
    [orders]
  )

  useEffect(() => {
    if (availableOrders.length === 0) return
    availableOrders.forEach((order) => {
      if (
        order.restaurantId &&
        !order.restaurantLocation &&
        !restaurantLocCache[order.restaurantId]
      ) {
        getRestaurantLocation(order.restaurantId)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableOrders])

  // ============ MY ORDERS ============
  useEffect(() => {
    if (!user) return
    const myQuery = query(
      collection(db, 'orders'),
      where('riderId', '==', user.uid)
    )
    const unsubscribe = onSnapshot(myQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aActive = [
          'accepted',
          'going_to_restaurant',
          'arrived_at_restaurant',
          'picked_up',
          'going_to_customer',
        ].includes(a.riderStatus)
          ? 1
          : 0
        const bActive = [
          'accepted',
          'going_to_restaurant',
          'arrived_at_restaurant',
          'picked_up',
          'going_to_customer',
        ].includes(b.riderStatus)
          ? 1
          : 0
        if (aActive !== bActive) return bActive - aActive
        const aT = a.acceptedAt?.toDate?.()?.getTime() || 0
        const bT = b.acceptedAt?.toDate?.()?.getTime() || 0
        return bT - aT
      })
      setMyOrders(list)
    })
    return () => unsubscribe()
  }, [user])

  // ============ TOGGLE GPS MODE ============
  const toggleGPSMode = async () => {
    if (!rider) return
    const newMode = gpsMode === 'real' ? 'simulated' : 'real'
    if (newMode === 'real') {
      setGpsLoading(true)
      try {
        const loc = await getCurrentLocation()
        setCurrentGPSLocation(loc)
        setGpsError('')
      } catch (err) {
        toast.error('Location permission denied.')
        setGpsLoading(false)
        return
      }
      setGpsLoading(false)
    }
    try {
      await updateDoc(doc(db, 'riders', rider.firebaseId), { gpsMode: newMode })
      setGpsMode(newMode)
      toast.success(
        `Switched to ${newMode === 'real' ? '📍 Real GPS' : '🎭 Simulated'}`
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to update GPS mode')
    }
  }

  // ============ PROFILE IMAGE UPLOAD ============
  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const maxSize = 400
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        canvas.width = width
        canvas.height = height
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        setEditProfileImage(canvas.toDataURL('image/jpeg', 0.8))
        toast.success('📷 Photo ready!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // ============ SAVE PROFILE ============
  const saveProfile = async () => {
    if (!editPhone.trim()) {
      toast.error('Phone required.')
      return
    }
    if (!editAddress.trim()) {
      toast.error('Address required.')
      return
    }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'riders', rider.firebaseId), {
        profileImage: editProfileImage,
        phone: editPhone.trim(),
        address: editAddress.trim(),
        vehicleType: editVehicleType,
        vehicleNumber: editVehicleNumber.trim() || 'N/A',
        licenseNumber: editLicenseNumber.trim() || 'N/A',
      })
      setRider({
        ...rider,
        profileImage: editProfileImage,
        phone: editPhone.trim(),
        address: editAddress.trim(),
        vehicleType: editVehicleType,
        vehicleNumber: editVehicleNumber.trim() || 'N/A',
        licenseNumber: editLicenseNumber.trim() || 'N/A',
      })
      toast.success('✅ Profile updated!')
      setEditMode(false)
    } catch (error) {
      toast.error('Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditProfileImage(rider.profileImage || '')
    setEditPhone(rider.phone || '')
    setEditAddress(rider.address || '')
    setEditVehicleType(rider.vehicleType || 'Motorcycle')
    setEditVehicleNumber(rider.vehicleNumber || '')
    setEditLicenseNumber(rider.licenseNumber || '')
    setEditMode(false)
  }

  // ============ TOGGLE ONLINE ============
  const toggleOnlineStatus = async () => {
    if (!rider) return
    const newStatus = rider.riderStatus === 'online' ? 'offline' : 'online'
    try {
      const updateData = { riderStatus: newStatus }
      if (newStatus === 'online' && gpsMode === 'real' && !currentGPSLocation) {
        try {
          const loc = await getCurrentLocation()
          setCurrentGPSLocation(loc)
          updateData.currentLocation = {
            lat: loc.lat,
            lng: loc.lng,
            updatedAt: new Date(),
          }
        } catch (err) {
          console.error(err)
        }
      }
      await updateDoc(doc(db, 'riders', rider.firebaseId), updateData)
      setRider({ ...rider, riderStatus: newStatus })
      toast.success(`You are now ${newStatus}!`)
    } catch (error) {
      toast.error('Failed to update status!')
    }
  }

  // ============ ACCEPT ORDER ============
  const acceptOrder = async (order) => {
    if (!user) return
    if (rider.riderStatus !== 'online') {
      toast.error('Please go Online first!')
      return
    }
    try {
      const restaurantLoc = await getRestaurantLocation(order.restaurantId)
      const updateData = {
        riderId: user.uid,
        riderName: rider.fullName,
        riderPhone: rider.phone,
        riderRating: rider.rating || 0,
        riderStatus: 'accepted',
        status: 'preparing',
        acceptedAt: new Date(),
        restaurantLocation: restaurantLoc,
        riderLocation: restaurantLoc,
        riderLocationUpdatedAt: new Date(),
        simulationProgress: 0,
      }
      if (gpsMode === 'real' && currentGPSLocation) {
        updateData.riderLocation = {
          lat: currentGPSLocation.lat,
          lng: currentGPSLocation.lng,
        }
      }
      await updateDoc(doc(db, 'orders', order.firebaseId), updateData)

      if (order.userId) {
        await sendNotification(
          order.userId,
          '🛵 Rider Assigned!',
          `Your order ${order.orderId} is being delivered by ${rider.fullName}.`,
          'rider',
          { orderId: order.orderId }
        )
      }
      if (order.restaurantId) {
        await sendNotification(
          order.restaurantId,
          '🛵 Rider Assigned to Order',
          `${rider.fullName} will pick up Order ${order.orderId}.`,
          'rider',
          { orderId: order.orderId }
        )
      }
      toast.success('✅ Order Accepted!')
      setView('my-orders')
    } catch (error) {
      console.error(error)
      toast.error('Failed to accept order!')
    }
  }

  // ============ UPDATE DELIVERY STATUS ============
  const updateDeliveryStatus = async (order, newStatus) => {
    try {
      const updateData = { riderStatus: newStatus }
      if (gpsMode === 'simulated') {
        const restaurantLoc =
          order.restaurantLocation ||
          (await getRestaurantLocation(order.restaurantId))
        const customerLoc = order.location || restaurantLoc
        const progress = getProgressFromStatus(newStatus)
        updateData.riderLocation = getSimulatedLocation(
          restaurantLoc,
          customerLoc,
          progress
        )
        updateData.riderLocationUpdatedAt = new Date()
        updateData.simulationProgress = progress
      } else if (gpsMode === 'real' && currentGPSLocation) {
        updateData.riderLocation = {
          lat: currentGPSLocation.lat,
          lng: currentGPSLocation.lng,
        }
        updateData.riderLocationUpdatedAt = new Date()
      }
      await updateDoc(doc(db, 'orders', order.firebaseId), updateData)
      toast.success(`Status: ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update status!')
    }
  }

  // ============ COMPLETE DELIVERY ============
  const completeDelivery = async (order) => {
    const correctOtp = order.deliveryOtp || '1234'
    if (otpInput !== correctOtp) {
      toast.error('Invalid OTP!')
      return
    }
    try {
      const updateData = {
        riderStatus: 'delivered',
        status: 'delivered',
        deliveredAt: new Date(),
      }
      if (gpsMode === 'simulated') {
        updateData.riderLocation =
          order.location ||
          settings.mapDefaultCenter || { lat: 23.78, lng: 90.64 }
        updateData.simulationProgress = 1
      } else if (gpsMode === 'real' && currentGPSLocation) {
        updateData.riderLocation = {
          lat: currentGPSLocation.lat,
          lng: currentGPSLocation.lng,
        }
      }
      await updateDoc(doc(db, 'orders', order.firebaseId), updateData)

      const earnings =
        (rider.totalEarnings || 0) + (settings.riderEarningPerDelivery || 30)
      const deliveries = (rider.totalDeliveries || 0) + 1
      await updateDoc(doc(db, 'riders', rider.firebaseId), {
        totalEarnings: earnings,
        totalDeliveries: deliveries,
      })
      setRider({
        ...rider,
        totalEarnings: earnings,
        totalDeliveries: deliveries,
      })

      if (order.userId) {
        await sendNotification(
          order.userId,
          '✅ Order Delivered!',
          `Order ${order.orderId} has been delivered. Enjoy!`,
          'order',
          { orderId: order.orderId }
        )
      }
      if (order.restaurantId) {
        await sendNotification(
          order.restaurantId,
          '✅ Order Delivered',
          `Order ${order.orderId} has been delivered.`,
          'order',
          { orderId: order.orderId }
        )
      }
      setOtpInput('')
      toast.success('✅ Delivery Completed!')
    } catch (error) {
      toast.error('Failed to complete delivery!')
    }
  }

  // ============ LOGOUT ============
  const handleLogout = async () => {
    if (watchIdRef.current) stopLocationTracking()
    try {
      await signOut(auth)
      localStorage.removeItem('userRole')
      window.location.href = '/rider-login'
    } catch (error) {
      console.error(error)
    }
  }

  // ============ STATS ============
  const today = new Date().toLocaleDateString()
  const todayDeliveries = myOrders.filter(
    (o) =>
      o.riderStatus === 'delivered' &&
      o.deliveredAt?.toDate?.()?.toLocaleDateString() === today
  ).length
  const activeDeliveries = myOrders.filter((o) =>
    [
      'accepted',
      'going_to_restaurant',
      'arrived_at_restaurant',
      'picked_up',
      'going_to_customer',
    ].includes(o.riderStatus)
  ).length
  const completedDeliveries = myOrders.filter(
    (o) => o.riderStatus === 'delivered'
  ).length
  const todayEarnings =
    todayDeliveries * (settings.riderEarningPerDelivery || 30)
  const totalEarnings = rider?.totalEarnings || 0
  const rating = rider?.rating || 0

  const myLocation =
    gpsMode === 'real' && currentGPSLocation
      ? currentGPSLocation
      : rider?.currentLocation || null

  // ============ RENDER GUARDS ============
  if (loading) {
    return (
      <div className="rider-v2">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rider-v2">
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

  if (!rider) {
    return (
      <div className="rider-v2">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="rider-v2">
      {/* ============ TOP BAR ============ */}
      <div className="rider-v2-topbar">
        <div className="rider-v2-topbar-left">
          <div className="rider-v2-avatar-wrap">
            <div className="rider-v2-avatar">
              {rider.profileImage ? (
                <img src={rider.profileImage} alt="Profile" />
              ) : (
                <span>🛵</span>
              )}
            </div>
            <span
              className={`rider-v2-avatar-pulse ${
                rider.riderStatus === 'online' ? '' : 'offline'
              }`}
            />
          </div>
          <div>
            <strong className="rider-v2-name">{rider.fullName}</strong>
            <span
              className={`rider-v2-status ${
                rider.riderStatus === 'online' ? 'online' : ''
              }`}
            >
              {rider.riderStatus === 'online' ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>

        <div className="rider-v2-topbar-actions">
          <button
            className={`rider-v2-pill-btn gps ${
              gpsMode === 'real' ? 'real' : 'simulated'
            }`}
            onClick={toggleGPSMode}
            disabled={gpsLoading}
          >
            {gpsLoading
              ? '⏳ Loading'
              : gpsMode === 'real'
              ? '📍 Real'
              : '🎭 Sim'}
          </button>
          <button
            className={`rider-v2-pill-btn ${
              rider.riderStatus === 'online' ? 'online' : 'offline'
            }`}
            onClick={toggleOnlineStatus}
          >
            {rider.riderStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
          </button>
          <button className="rider-v2-pill-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {gpsError && <div className="rider-v2-gps-error">⚠️ {gpsError}</div>}

      {/* ============ DASHBOARD ============ */}
      {view === 'dashboard' && (
        <div className="rider-v2-view">
          <h2 className="rider-v2-view-title">📊 Dashboard</h2>

          <div className="rider-v2-hero-card">
            <p className="rider-v2-hero-card-label">Today's Earnings</p>
            <p className="rider-v2-hero-card-value">
              ৳{todayEarnings.toFixed(0)}
            </p>
            <p className="rider-v2-hero-card-sub">
              From {todayDeliveries}{' '}
              {todayDeliveries === 1 ? 'delivery' : 'deliveries'} today
            </p>
          </div>

          <div className="rider-v2-stat-grid">
            <div className="rider-v2-stat-card">
              <div className="rider-v2-stat-icon green">💰</div>
              <div>
                <div className="rider-v2-stat-value">
                  ৳{totalEarnings.toFixed(0)}
                </div>
                <div className="rider-v2-stat-label">Total Earnings</div>
              </div>
            </div>
            <div className="rider-v2-stat-card">
              <div className="rider-v2-stat-icon orange">🛵</div>
              <div>
                <div className="rider-v2-stat-value">{activeDeliveries}</div>
                <div className="rider-v2-stat-label">Active Now</div>
              </div>
            </div>
            <div className="rider-v2-stat-card">
              <div className="rider-v2-stat-icon blue">📦</div>
              <div>
                <div className="rider-v2-stat-value">
                  {completedDeliveries}
                </div>
                <div className="rider-v2-stat-label">Total Deliveries</div>
              </div>
            </div>
            <div className="rider-v2-stat-card">
              <div className="rider-v2-stat-icon purple">⭐</div>
              <div>
                <div className="rider-v2-stat-value">{rating.toFixed(1)}</div>
                <div className="rider-v2-stat-label">Your Rating</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ AVAILABLE ORDERS ============ */}
      {view === 'available' && (
        <div className="rider-v2-view">
          <h2 className="rider-v2-view-title">
            📦 Available Orders
            {rider.riderStatus !== 'online' && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#DC2626',
                  marginLeft: 'auto',
                }}
              >
                (Go Online to accept)
              </span>
            )}
          </h2>

          {availableOrders.length === 0 ? (
            <div className="rider-v2-empty">
              <div className="rider-v2-empty-icon">📭</div>
              <h3>No orders right now</h3>
              <p>New orders will appear here automatically</p>
            </div>
          ) : (
            <div className="rider-v2-order-list">
              {availableOrders.map((order) => {
                const restLoc =
                  order.restaurantLocation ||
                  restaurantLocCache[order.restaurantId] ||
                  null
                const distanceKm = restLoc
                  ? calculateDistanceKm(myLocation, restLoc)
                  : null
                const etaMin = calculateEtaMin(distanceKm)

                return (
                  <div
                    className="rider-v2-order new-order"
                    key={order.firebaseId}
                  >
                    {/* Header */}
                    <div className="rider-v2-order-header">
                      <div className="rider-v2-order-thumb">
                        {order.restaurantLogo ? (
                          <img src={order.restaurantLogo} alt="" />
                        ) : (
                          '🏪'
                        )}
                      </div>
                      <div className="rider-v2-order-title">
                        <strong>
                          {order.restaurantName || 'Restaurant'}
                        </strong>
                        <small>Order #{order.orderId}</small>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="rider-v2-order-info">
                      {order.zoneName && (
                        <div className="rider-v2-info-row">
                          <span className="rider-v2-info-row-icon">🗺️</span>
                          <span className="rider-v2-info-row-text">
                            <strong>Zone:</strong> {order.zoneName}
                            {order.zoneDeliveryFee != null &&
                              ` · Delivery ৳${order.zoneDeliveryFee}`}
                          </span>
                        </div>
                      )}
                      <div className="rider-v2-info-row">
                        <span className="rider-v2-info-row-icon">📍</span>
                        <span className="rider-v2-info-row-text">
                          {order.address}
                        </span>
                      </div>
                      <div className="rider-v2-info-row">
                        <span className="rider-v2-info-row-icon">👤</span>
                        <span className="rider-v2-info-row-text">
                          {order.fullName} · {order.phone}
                        </span>
                      </div>
                    </div>

                    {/* Distance / ETA */}
                    {distanceKm != null && (
                      <div className="rider-v2-distance-badge">
                        <span className="rider-v2-distance-chip">
                          📏 {distanceKm.toFixed(1)} km
                        </span>
                        <span className="rider-v2-distance-chip orange">
                          ⏱️ ~{etaMin} min
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <div className="rider-v2-order-items">
                        {order.items.map((item, idx) => (
                          <div className="rider-v2-order-item" key={idx}>
                            <span>
                              {item.emoji || '🍽️'} {item.name}
                            </span>
                            <strong>×{item.quantity}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="rider-v2-order-totals">
                      <div className="rider-v2-total-block">
                        <span className="rider-v2-total-label">
                          Order Total
                        </span>
                        <span className="rider-v2-total-value">
                          ৳{order.total}
                        </span>
                      </div>
                      <div className="rider-v2-total-block">
                        <span className="rider-v2-total-label">You Earn</span>
                        <span className="rider-v2-total-value earning">
                          ৳{settings.riderEarningPerDelivery || 30}
                        </span>
                      </div>
                    </div>

                    {/* Accept */}
                    <button
                      className="rider-v2-action-btn"
                      onClick={() => acceptOrder(order)}
                      disabled={rider.riderStatus !== 'online'}
                    >
                      ✅ Accept Order
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ MY DELIVERIES ============ */}
      {view === 'my-orders' && (
        <div className="rider-v2-view">
          <h2 className="rider-v2-view-title">🛵 My Deliveries</h2>

          {myOrders.length === 0 ? (
            <div className="rider-v2-empty">
              <div className="rider-v2-empty-icon">🚴</div>
              <h3>No deliveries yet</h3>
              <p>Accept an order to get started</p>
            </div>
          ) : (
            <div className="rider-v2-order-list">
              {myOrders.map((order) => {
                const isActive = [
                  'accepted',
                  'going_to_restaurant',
                  'arrived_at_restaurant',
                  'picked_up',
                  'going_to_customer',
                ].includes(order.riderStatus)
                const isDelivered = order.riderStatus === 'delivered'

                const distToCustomer =
                  isActive && order.location && myLocation
                    ? calculateDistanceKm(myLocation, order.location)
                    : null
                const etaToCustomer = calculateEtaMin(distToCustomer)

                const steps = [
                  {
                    key: 'accepted',
                    label: 'Accepted',
                    sub: 'Waiting for pickup',
                    icon: '✅',
                  },
                  {
                    key: 'going_to_restaurant',
                    label: 'Going to Restaurant',
                    sub: 'On the way',
                    icon: '🛵',
                  },
                  {
                    key: 'arrived_at_restaurant',
                    label: 'Arrived',
                    sub: 'At restaurant',
                    icon: '📍',
                  },
                  {
                    key: 'picked_up',
                    label: 'Picked Up',
                    sub: 'Food collected',
                    icon: '📦',
                  },
                  {
                    key: 'going_to_customer',
                    label: 'Going to Customer',
                    sub: 'On the way',
                    icon: '🚴',
                  },
                ]
                const stageOrder = [
                  'accepted',
                  'going_to_restaurant',
                  'arrived_at_restaurant',
                  'picked_up',
                  'going_to_customer',
                  'delivered',
                ]
                const currentIdx = stageOrder.indexOf(order.riderStatus)

                return (
                  <div
                    className={`rider-v2-order ${
                      isActive ? 'new-order' : ''
                    }`}
                    key={order.firebaseId}
                  >
                    {/* Header */}
                    <div className="rider-v2-order-header">
                      <div className="rider-v2-order-thumb">
                        {order.restaurantLogo ? (
                          <img src={order.restaurantLogo} alt="" />
                        ) : (
                          '🏪'
                        )}
                      </div>
                      <div className="rider-v2-order-title">
                        <strong>
                          {order.restaurantName || 'Restaurant'}
                        </strong>
                        <small>Order #{order.orderId}</small>
                      </div>
                      <span
                        className={`rider-v2-order-status ${
                          isDelivered ? 'delivered' : 'active'
                        }`}
                      >
                        {order.riderStatus?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="rider-v2-order-info">
                      {order.zoneName && (
                        <div className="rider-v2-info-row">
                          <span className="rider-v2-info-row-icon">🗺️</span>
                          <span className="rider-v2-info-row-text">
                            <strong>Zone:</strong> {order.zoneName}
                          </span>
                        </div>
                      )}
                      <div className="rider-v2-info-row">
                        <span className="rider-v2-info-row-icon">📍</span>
                        <span className="rider-v2-info-row-text">
                          {order.address}
                        </span>
                      </div>
                      <div className="rider-v2-info-row">
                        <span className="rider-v2-info-row-icon">👤</span>
                        <span className="rider-v2-info-row-text">
                          {order.fullName} · {order.phone}
                        </span>
                      </div>
                    </div>

                    {/* Distance to customer */}
                    {distToCustomer != null && (
                      <div className="rider-v2-distance-badge">
                        <span className="rider-v2-distance-chip orange">
                          📏 {distToCustomer.toFixed(1)} km to customer
                        </span>
                        <span className="rider-v2-distance-chip orange">
                          ⏱️ ~{etaToCustomer} min
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <div className="rider-v2-order-items">
                        {order.items.map((item, idx) => (
                          <div className="rider-v2-order-item" key={idx}>
                            <span>
                              {item.emoji || '🍽️'} {item.name}
                            </span>
                            <strong>×{item.quantity}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="rider-v2-order-totals">
                      <div className="rider-v2-total-block">
                        <span className="rider-v2-total-label">
                          Order Total
                        </span>
                        <span className="rider-v2-total-value">
                          ৳{order.total}
                        </span>
                      </div>
                      <div className="rider-v2-total-block">
                        <span className="rider-v2-total-label">
                          You Earn
                        </span>
                        <span className="rider-v2-total-value earning">
                          ৳{settings.riderEarningPerDelivery || 30}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {isActive && (
                      <div className="rider-v2-timeline">
                        {steps.map((step, idx) => (
                          <div
                            className={`rider-v2-step ${
                              idx <= currentIdx ? 'active' : ''
                            }`}
                            key={step.key}
                          >
                            <span className="rider-v2-step-marker">
                              {step.icon}
                            </span>
                            {idx < steps.length - 1 && (
                              <span className="rider-v2-step-line" />
                            )}
                            <div className="rider-v2-step-text">
                              <strong>{step.label}</strong>
                              <small>{step.sub}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    {order.riderStatus === 'accepted' && (
                      <button
                        className="rider-v2-action-btn"
                        onClick={() =>
                          updateDeliveryStatus(
                            order,
                            'going_to_restaurant'
                          )
                        }
                      >
                        🛵 Start → Going to Restaurant
                      </button>
                    )}
                    {order.riderStatus === 'going_to_restaurant' && (
                      <button
                        className="rider-v2-action-btn"
                        onClick={() =>
                          updateDeliveryStatus(
                            order,
                            'arrived_at_restaurant'
                          )
                        }
                      >
                        📍 Reached Restaurant
                      </button>
                    )}
                    {order.riderStatus === 'arrived_at_restaurant' && (
                      <button
                        className="rider-v2-action-btn"
                        onClick={() =>
                          updateDeliveryStatus(order, 'picked_up')
                        }
                      >
                        📦 Food Picked Up
                      </button>
                    )}
                    {order.riderStatus === 'picked_up' && (
                      <button
                        className="rider-v2-action-btn"
                        onClick={() =>
                          updateDeliveryStatus(order, 'going_to_customer')
                        }
                      >
                        🚴 On the Way to Customer
                      </button>
                    )}

                    {/* OTP */}
                    {order.riderStatus === 'going_to_customer' && (
                      <div className="rider-v2-otp-box">
                        <label className="rider-v2-otp-label">
                          🔐 Customer OTP
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="rider-v2-otp-input"
                          placeholder="4-digit"
                          value={otpInput}
                          onChange={(e) =>
                            setOtpInput(
                              e.target.value.replace(/\D/g, '')
                            )
                          }
                          maxLength={4}
                        />
                        <button
                          className="rider-v2-otp-submit"
                          onClick={() => completeDelivery(order)}
                        >
                          ✅ Complete Delivery
                        </button>
                      </div>
                    )}

                    {isDelivered && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '12px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#059669',
                        }}
                      >
                        ✅ Delivered — You earned ৳
                        {settings.riderEarningPerDelivery || 30}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ PROFILE ============ */}
      {view === 'profile' && (
        <div className="rider-v2-view">
          <h2 className="rider-v2-view-title">👤 Profile</h2>

          <div className="rider-v2-profile-card">
            <div className="rider-v2-profile-avatar">
              {editMode ? (
                editProfileImage ? (
                  <img src={editProfileImage} alt="Profile" />
                ) : (
                  <span>🛵</span>
                )
              ) : rider.profileImage ? (
                <img src={rider.profileImage} alt="Profile" />
              ) : (
                <span>🛵</span>
              )}
            </div>

            <h3 className="rider-v2-profile-name">{rider.fullName}</h3>
            <p className="rider-v2-profile-email">{rider.email}</p>

            <div className="rider-v2-profile-stats">
              <div className="rider-v2-profile-stat">
                <span className="rider-v2-profile-stat-value">
                  ⭐ {rating.toFixed(1)}
                </span>
                <span className="rider-v2-profile-stat-label">Rating</span>
              </div>
              <div className="rider-v2-profile-stat">
                <span className="rider-v2-profile-stat-value">
                  {rider.totalDeliveries || 0}
                </span>
                <span className="rider-v2-profile-stat-label">
                  Deliveries
                </span>
              </div>
              <div className="rider-v2-profile-stat">
                <span className="rider-v2-profile-stat-value">
                  ৳{totalEarnings.toFixed(0)}
                </span>
                <span className="rider-v2-profile-stat-label">Earned</span>
              </div>
            </div>

            <div className="rider-v2-profile-actions">
              {!editMode ? (
                <button
                  className="rider-v2-btn-primary"
                  onClick={() => setEditMode(true)}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <>
                  <button
                    className="rider-v2-btn-secondary"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="rider-v2-btn-primary"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : '✅ Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {editMode ? (
            <div className="rider-v2-profile-card">
              <div className="rider-v2-form">
                <div className="rider-v2-form-group">
                  <label>📷 Profile Photo</label>
                  <label
                    className="rider-v2-btn-secondary"
                    style={{ padding: '12px', cursor: 'pointer' }}
                  >
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <div className="rider-v2-form-group">
                  <label>📞 Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="rider-v2-form-group">
                  <label>🛵 Vehicle Type</label>
                  <select
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Bike">Electric Bike</option>
                  </select>
                </div>
                <div className="rider-v2-form-group">
                  <label>🔢 Vehicle Number</label>
                  <input
                    type="text"
                    value={editVehicleNumber}
                    onChange={(e) => setEditVehicleNumber(e.target.value)}
                  />
                </div>
                <div className="rider-v2-form-group">
                  <label>🪪 License</label>
                  <input
                    type="text"
                    value={editLicenseNumber}
                    onChange={(e) =>
                      setEditLicenseNumber(e.target.value)
                    }
                  />
                </div>
                <div className="rider-v2-form-group">
                  <label>📍 Address</label>
                  <textarea
                    rows="2"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rider-v2-profile-card">
              <div className="rider-v2-profile-info">
                <div className="rider-v2-profile-row">
                  <span className="rider-v2-profile-row-label">
                    📞 Phone
                  </span>
                  <span className="rider-v2-profile-row-value">
                    {rider.phone || '—'}
                  </span>
                </div>
                <div className="rider-v2-profile-row">
                  <span className="rider-v2-profile-row-label">🎂 DOB</span>
                  <span className="rider-v2-profile-row-value">
                    {rider.dob || '—'}
                  </span>
                </div>
                <div className="rider-v2-profile-row">
                  <span className="rider-v2-profile-row-label">
                    🆔 NID Number
                  </span>
                  <span className="rider-v2-profile-row-value">
                    {rider.nidNumber || '—'}
                  </span>
                </div>
                <div className="rider-v2-profile-row">
                  <span className="rider-v2-profile-row-label">
                    🛵 Vehicle Type
                  </span>
                  <span className="rider-v2-profile-row-value">
                    {rider.vehicleType || '—'}
                  </span>
                </div>
                <div className="rider-v2-profile-row">
                  <span className="rider-v2-profile-row-label">
                    🔢 Vehicle Number
                  </span>
                  <span className="rider-v2-profile-row-value">
                    {rider.vehicleNumber || 'N/A'}
                  </span>
                </div>
                <div className="rider-v2-profile-row">
                  <span className="rider-v2-profile-row-label">
                    🪪 License
                  </span>
                  <span className="rider-v2-profile-row-value">
                    {rider.licenseNumber || 'N/A'}
                  </span>
                </div>
                <div
                  className="rider-v2-profile-row"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <span className="rider-v2-profile-row-label">
                    📍 Address
                  </span>
                  <span className="rider-v2-profile-row-value">
                    {rider.address || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ BOTTOM NAV ============ */}
      <div className="rider-v2-botnav">
        <button
          className={`rider-v2-navbtn ${
            view === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setView('dashboard')}
        >
          <span className="rider-v2-navbtn-icon">📊</span>
          Dashboard
        </button>
        <button
          className={`rider-v2-navbtn ${
            view === 'available' ? 'active' : ''
          }`}
          onClick={() => setView('available')}
        >
          <span className="rider-v2-navbtn-icon">📦</span>
          Available
          {availableOrders.length > 0 && (
            <span className="rider-v2-navbadge">
              {availableOrders.length}
            </span>
          )}
        </button>
        <button
          className={`rider-v2-navbtn ${
            view === 'my-orders' ? 'active' : ''
          }`}
          onClick={() => setView('my-orders')}
        >
          <span className="rider-v2-navbtn-icon">🛵</span>
          Deliveries
          {activeDeliveries > 0 && (
            <span className="rider-v2-navbadge">{activeDeliveries}</span>
          )}
        </button>
        <button
          className={`rider-v2-navbtn ${
            view === 'profile' ? 'active' : ''
          }`}
          onClick={() => setView('profile')}
        >
          <span className="rider-v2-navbtn-icon">👤</span>
          Profile
        </button>
      </div>
    </div>
  )
}

export default RiderPanel