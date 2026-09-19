import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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
  restaurantLocations,
  getSimulatedLocation,
  getProgressFromStatus,
} from '../utils/locationTracker'

function RiderPanel() {
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

  // ============ AUTH LOADING (SINGLE CHECK) ============
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
            setError('No rider account found. Please sign up as a rider first.')
            setLoading(false)
            return
          }
        } else {
          data = riderDoc.data()
        }

        if (!isMounted) return

        if (data.status === 'pending') {
          setError('⏳ Your account is pending Admin approval. Please wait.')
          setLoading(false)
          return
        }

        if (data.status === 'rejected') {
          setError('❌ Your rider application was rejected. Please contact support.')
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

        // Sync role
        localStorage.setItem('userRole', 'rider')
      } catch (err) {
        console.error('Error loading rider:', err)
        if (isMounted) setError('Failed to load rider data. Please try again.')
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

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
          console.error('Error saving GPS location:', err)
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
      const allOrders = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      setOrders(allOrders)
    })
    return () => unsubscribe()
  }, [])

  // ============ MY ORDERS ============
  useEffect(() => {
    if (!user) return
    const myQuery = query(
      collection(db, 'orders'),
      where('riderId', '==', user.uid)
    )
    const unsubscribe = onSnapshot(myQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setMyOrders(list)
    })
    return () => unsubscribe()
  }, [user])

  // ============ TOGGLE GPS MODE ============
  const toggleGPSMode = async () => {
    if (!rider) return
    const newMode = gpsMode === 'real' ? 'simulated' : 'real'

    if (newMode === 'real') {
      try {
        const loc = await getCurrentLocation()
        setCurrentGPSLocation(loc)
      } catch (err) {
        toast.error('Location permission denied. Please allow location access.')
        return
      }
    }

    try {
      await updateDoc(doc(db, 'riders', rider.firebaseId), { gpsMode: newMode })
      setGpsMode(newMode)
      toast.success(
        `Switched to ${newMode === 'real' ? '📍 Real GPS' : '🎭 Simulated'} mode`
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
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large.')
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
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }
        canvas.width = width
        canvas.height = height
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setEditProfileImage(compressed)
        toast.success('📷 Profile photo ready!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // ============ SAVE PROFILE ============
  const saveProfile = async () => {
    if (!editPhone.trim()) {
      toast.error('Please enter phone number.')
      return
    }
    if (!editAddress.trim()) {
      toast.error('Please enter address.')
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
      toast.success('✅ Profile updated successfully!')
      setEditMode(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update profile!')
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

  // ============ TOGGLE ONLINE/OFFLINE ============
  const toggleOnlineStatus = async () => {
    if (!rider) return
    const newStatus = rider.riderStatus === 'online' ? 'offline' : 'online'
    try {
      const updateData = { riderStatus: newStatus }
      if (newStatus === 'online' && gpsMode === 'real') {
        try {
          const loc = await getCurrentLocation()
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
      console.error(error)
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
      const restaurantLoc =
        restaurantLocations[order.restaurantName] || restaurantLocations.default
      const updateData = {
        riderId: user.uid,
        riderName: rider.fullName,
        riderPhone: rider.phone,
        riderStatus: 'accepted',
        status: 'preparing',
        acceptedAt: new Date(),
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
          restaurantLocations[order.restaurantName] ||
          restaurantLocations.default
        const customerLoc = order.location || restaurantLoc
        const progress = getProgressFromStatus(newStatus)
        const simLoc = getSimulatedLocation(
          restaurantLoc,
          customerLoc,
          progress
        )
        updateData.riderLocation = simLoc
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
      console.error(error)
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
        updateData.riderLocation = order.location || {
          lat: 23.78,
          lng: 90.64,
        }
        updateData.simulationProgress = 1
      } else if (gpsMode === 'real' && currentGPSLocation) {
        updateData.riderLocation = {
          lat: currentGPSLocation.lat,
          lng: currentGPSLocation.lng,
        }
      }
      await updateDoc(doc(db, 'orders', order.firebaseId), updateData)

      const earnings = (rider.totalEarnings || 0) + 30
      const deliveries = (rider.totalDeliveries || 0) + 1
      await updateDoc(doc(db, 'riders', rider.firebaseId), {
        totalEarnings: earnings,
        totalDeliveries: deliveries,
      })
      setRider({ ...rider, totalEarnings: earnings, totalDeliveries: deliveries })

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
          `Order ${order.orderId} has been delivered successfully.`,
          'order',
          { orderId: order.orderId }
        )
      }
      setOtpInput('')
      toast.success('✅ Delivery Completed!')
    } catch (error) {
      console.error(error)
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
  const todayEarnings = todayDeliveries * 30
  const totalEarnings = rider?.totalEarnings || 0

  const availableOrders = orders.filter(
    (o) =>
      !o.riderId &&
      (o.riderStatus === 'available' || !o.riderStatus) &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled'
  )

  if (loading) {
    return (
      <div className="rider-panel">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rider-panel">
        <div className="panel-error-box">
          <div className="panel-error-icon">⚠️</div>
          <h2>Access Restricted</h2>
          <p>{error}</p>
          <div className="panel-error-actions">
            <button
              className="account-home-btn"
              onClick={() => {
                window.location.href = '/'
              }}
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
      <div className="rider-panel">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rider-panel">
      {/* ============ FIXED TOP BAR WITH LOGOUT ============ */}
      <div className="rider-top-bar">
        <div className="rider-top-bar-left">
          <div className="rider-top-bar-avatar">
            {rider.profileImage ? (
              <img src={rider.profileImage} alt="Profile" />
            ) : (
              <span>🛵</span>
            )}
          </div>
          <div>
            <strong>{rider.fullName}</strong>
            <small>
              <span className={`rider-status-dot ${rider.riderStatus}`}></span>
              {rider.riderStatus === 'online' ? 'Online' : 'Offline'}
            </small>
          </div>
        </div>

        <div className="rider-top-bar-right">
          <button
            className={`gps-mode-toggle ${gpsMode}`}
            onClick={toggleGPSMode}
          >
            {gpsMode === 'real' ? '📍 Real GPS' : '🎭 Simulated'}
          </button>

          <button
            className={`rider-online-toggle ${
              rider.riderStatus === 'online' ? 'online' : ''
            }`}
            onClick={toggleOnlineStatus}
          >
            {rider.riderStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
          </button>

          <button className="rider-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* GPS Error Banner */}
      {gpsError && (
        <div className="gps-error-banner">⚠️ GPS Error: {gpsError}</div>
      )}

      {/* View Toggle */}
      <div className="admin-view-toggle">
        <button
          className={view === 'dashboard' ? 'view-btn active' : 'view-btn'}
          onClick={() => setView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={view === 'available' ? 'view-btn active' : 'view-btn'}
          onClick={() => setView('available')}
        >
          📦 Available ({availableOrders.length})
        </button>
        <button
          className={view === 'my-orders' ? 'view-btn active' : 'view-btn'}
          onClick={() => setView('my-orders')}
        >
          🛵 My Deliveries ({myOrders.length})
        </button>
        <button
          className={view === 'profile' ? 'view-btn active' : 'view-btn'}
          onClick={() => setView('profile')}
        >
          👤 Profile
        </button>
      </div>

      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <div className="admin-dashboard">
          <div className="admin-stats">
            <div className="admin-stat">
              <strong>৳{todayEarnings}</strong>
              <span>Today's Earnings</span>
            </div>
            <div className="admin-stat">
              <strong>৳{totalEarnings}</strong>
              <span>Total Earnings</span>
            </div>
            <div className="admin-stat">
              <strong>{todayDeliveries}</strong>
              <span>Today's Deliveries</span>
            </div>
            <div className="admin-stat">
              <strong>{completedDeliveries}</strong>
              <span>Total Deliveries</span>
            </div>
          </div>

          <div className="admin-stats secondary">
            <div className="admin-stat">
              <strong>{activeDeliveries}</strong>
              <span>🛵 Active Now</span>
            </div>
            <div className="admin-stat">
              <strong>⭐ {rider.rating || 0}</strong>
              <span>Your Rating</span>
            </div>
            <div className="admin-stat">
              <strong>{rider.totalDeliveries || 0}</strong>
              <span>All Time</span>
            </div>
            <div className="admin-stat">
              <strong>{gpsMode === 'real' ? '📍' : '🎭'}</strong>
              <span>GPS Mode</span>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABLE ORDERS */}
      {view === 'available' && (
        <div className="admin-orders">
          <h2>
            Available Orders{' '}
            {rider.riderStatus !== 'online' && (
              <span style={{ fontSize: '13px', color: '#dc2626' }}>
                (Go Online to accept)
              </span>
            )}
          </h2>

          {availableOrders.length === 0 ? (
            <p className="no-orders">No available orders right now.</p>
          ) : (
            <div className="admin-order-list">
              {availableOrders.map((order) => (
                <div className="admin-order-card" key={order.firebaseId}>
                  <div className="admin-order-header">
                    <strong>Order ID: {order.orderId}</strong>
                    <span>{order.date || ''}</span>
                  </div>

                  <div className="admin-order-info" style={{ marginTop: '8px' }}>
                    <p>
                      🏪 <strong>{order.restaurantName}</strong>
                    </p>
                    <p>📍 {order.address}</p>
                    <p>📞 {order.phone}</p>
                    <p>👤 {order.fullName}</p>
                  </div>

                  <div className="admin-order-items">
                    {order.items?.map((item, idx) => (
                      <div key={idx}>
                        <span>
                          {item.emoji} {item.name}
                        </span>
                        <span>× {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="admin-order-total">
                    <span>Total:</span>
                    <strong>৳{order.total}</strong>
                  </div>

                  <div
                    className="admin-order-total"
                    style={{ marginTop: '5px' }}
                  >
                    <span>Your Earning:</span>
                    <strong style={{ color: '#16a34a' }}>৳30</strong>
                  </div>

                  <div className="admin-order-actions">
                    <button
                      className="accept-btn"
                      onClick={() => acceptOrder(order)}
                      disabled={rider.riderStatus !== 'online'}
                    >
                      ✅ Accept Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY ORDERS */}
      {view === 'my-orders' && (
        <div className="admin-orders">
          <h2>My Deliveries</h2>

          {myOrders.length === 0 ? (
            <p className="no-orders">You haven't accepted any order yet.</p>
          ) : (
            <div className="admin-order-list">
              {myOrders.map((order) => (
                <div className="admin-order-card" key={order.firebaseId}>
                  <div className="admin-order-header">
                    <strong>Order ID: {order.orderId}</strong>
                    <span
                      className={`status-badge ${
                        order.riderStatus === 'delivered'
                          ? 'approved'
                          : 'pending'
                      }`}
                    >
                      {order.riderStatus?.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="admin-order-info" style={{ marginTop: '8px' }}>
                    <p>
                      🏪 <strong>{order.restaurantName}</strong>
                    </p>
                    <p>📍 {order.address}</p>
                    <p>📞 {order.phone}</p>
                    <p>👤 {order.fullName}</p>
                  </div>

                  <div className="admin-order-items">
                    {order.items?.map((item, idx) => (
                      <div key={idx}>
                        <span>
                          {item.emoji} {item.name}
                        </span>
                        <span>× {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="admin-order-total">
                    <span>Total:</span>
                    <strong>৳{order.total}</strong>
                  </div>

                  {order.riderStatus !== 'delivered' && (
                    <div className="delivery-status-flow">
                      <div className="delivery-status-steps">
                        <div
                          className={`delivery-step ${
                            [
                              'accepted',
                              'going_to_restaurant',
                              'arrived_at_restaurant',
                              'picked_up',
                              'going_to_customer',
                              'delivered',
                            ].includes(order.riderStatus)
                              ? 'active'
                              : ''
                          }`}
                        >
                          ✅ Accepted
                        </div>
                        <div
                          className={`delivery-step ${
                            [
                              'going_to_restaurant',
                              'arrived_at_restaurant',
                              'picked_up',
                              'going_to_customer',
                              'delivered',
                            ].includes(order.riderStatus)
                              ? 'active'
                              : ''
                          }`}
                        >
                          🛵 Going to Restaurant
                        </div>
                        <div
                          className={`delivery-step ${
                            [
                              'arrived_at_restaurant',
                              'picked_up',
                              'going_to_customer',
                              'delivered',
                            ].includes(order.riderStatus)
                              ? 'active'
                              : ''
                          }`}
                        >
                          📍 Arrived
                        </div>
                        <div
                          className={`delivery-step ${
                            [
                              'picked_up',
                              'going_to_customer',
                              'delivered',
                            ].includes(order.riderStatus)
                              ? 'active'
                              : ''
                          }`}
                        >
                          📦 Picked Up
                        </div>
                        <div
                          className={`delivery-step ${
                            ['going_to_customer', 'delivered'].includes(
                              order.riderStatus
                            )
                              ? 'active'
                              : ''
                          }`}
                        >
                          🛵 Going to Customer
                        </div>
                      </div>

                      <div className="delivery-next-btn-wrap">
                        {order.riderStatus === 'accepted' && (
                          <button
                            className="complete-btn"
                            onClick={() =>
                              updateDeliveryStatus(order, 'going_to_restaurant')
                            }
                          >
                            Start → Going to Restaurant
                          </button>
                        )}
                        {order.riderStatus === 'going_to_restaurant' && (
                          <button
                            className="complete-btn"
                            onClick={() =>
                              updateDeliveryStatus(
                                order,
                                'arrived_at_restaurant'
                              )
                            }
                          >
                            Reached Restaurant
                          </button>
                        )}
                        {order.riderStatus === 'arrived_at_restaurant' && (
                          <button
                            className="complete-btn"
                            onClick={() =>
                              updateDeliveryStatus(order, 'picked_up')
                            }
                          >
                            Food Picked Up
                          </button>
                        )}
                        {order.riderStatus === 'picked_up' && (
                          <button
                            className="complete-btn"
                            onClick={() =>
                              updateDeliveryStatus(order, 'going_to_customer')
                            }
                          >
                            On the Way to Customer
                          </button>
                        )}
                        {order.riderStatus === 'going_to_customer' && (
                          <div className="otp-verification-box">
                            <label>🔐 Customer OTP</label>
                            <input
                              type="text"
                              placeholder="Enter 4-digit OTP"
                              value={otpInput}
                              onChange={(e) =>
                                setOtpInput(e.target.value.replace(/\D/g, ''))
                              }
                              maxLength={4}
                            />
                            <button
                              className="complete-btn"
                              onClick={() => completeDelivery(order)}
                            >
                              ✅ Complete Delivery
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {order.riderStatus === 'delivered' && (
                    <div className="delivered-label-wrap">
                      <span className="delivered-label">
                        ✅ Delivered — You earned ৳30
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE */}
      {view === 'profile' && (
        <div className="admin-orders">
          <div className="rider-profile-header-row">
            <h2>My Profile</h2>
            {!editMode && (
              <button
                className="edit-profile-btn"
                onClick={() => setEditMode(true)}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {editMode ? (
            <div className="rider-profile-view">
              <div className="profile-photo-edit">
                <div className="rider-profile-avatar-large">
                  {editProfileImage ? (
                    <img src={editProfileImage} alt="Profile" />
                  ) : (
                    <span>🛵</span>
                  )}
                </div>
                <label className="profile-photo-change-btn">
                  📷 Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                  />
                </label>
              </div>

              <h3>{rider.fullName}</h3>
              <p className="rider-profile-email">{rider.email}</p>
              <p className="rider-profile-locked">
                🔒 Name, Email, NID cannot be changed.
              </p>

              <div className="rider-profile-grid">
                <div className="rider-profile-item">
                  <span>📞 Phone</span>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="rider-profile-item">
                  <span>🎂 DOB</span>
                  <strong>{rider.dob} 🔒</strong>
                </div>
                <div className="rider-profile-item">
                  <span>🛵 Vehicle Type</span>
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
                <div className="rider-profile-item">
                  <span>🔢 Vehicle Number</span>
                  <input
                    type="text"
                    value={editVehicleNumber}
                    onChange={(e) => setEditVehicleNumber(e.target.value)}
                  />
                </div>
                <div className="rider-profile-item">
                  <span>🪪 License</span>
                  <input
                    type="text"
                    value={editLicenseNumber}
                    onChange={(e) => setEditLicenseNumber(e.target.value)}
                  />
                </div>
                <div className="rider-profile-item full">
                  <span>📍 Address</span>
                  <textarea
                    rows="2"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="rider-profile-edit-actions">
                <button className="cancel-btn" onClick={cancelEdit}>
                  Cancel
                </button>
                <button
                  className="save-btn"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '✅ Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rider-profile-view">
              <div className="rider-profile-avatar-large">
                {rider.profileImage ? (
                  <img src={rider.profileImage} alt="Profile" />
                ) : (
                  <span>🛵</span>
                )}
              </div>
              <h3>{rider.fullName}</h3>
              <p className="rider-profile-email">{rider.email}</p>

              <div className="rider-profile-grid">
                <div className="rider-profile-item">
                  <span>📞 Phone</span>
                  <strong>{rider.phone}</strong>
                </div>
                <div className="rider-profile-item">
                  <span>🆔 NID Number</span>
                  <strong>{rider.nidNumber}</strong>
                </div>
                <div className="rider-profile-item">
                  <span>🎂 Date of Birth</span>
                  <strong>{rider.dob}</strong>
                </div>
                <div className="rider-profile-item">
                  <span>🛵 Vehicle Type</span>
                  <strong>{rider.vehicleType}</strong>
                </div>
                <div className="rider-profile-item">
                  <span>🔢 Vehicle Number</span>
                  <strong>{rider.vehicleNumber || 'N/A'}</strong>
                </div>
                <div className="rider-profile-item">
                  <span>🪪 License</span>
                  <strong>{rider.licenseNumber || 'N/A'}</strong>
                </div>
                <div className="rider-profile-item full">
                  <span>📍 Address</span>
                  <strong>{rider.address}</strong>
                </div>
                <div className="rider-profile-item">
                  <span>⭐ Rating</span>
                  <strong>{rider.rating || 0}/5</strong>
                </div>
                <div className="rider-profile-item">
                  <span>📦 Total Deliveries</span>
                  <strong>{rider.totalDeliveries || 0}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RiderPanel