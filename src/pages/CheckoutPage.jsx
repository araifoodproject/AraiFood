// ============================================================
// src/pages/CheckoutPage.jsx
// V7 — Online Payment (Manual) with proper "Payment" language
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MapPicker from '../components/MapPicker'
import PageBackButton from '../components/PageBackButton'
import OrderPushPrompt from '../components/OrderPushPrompt'
import useSettings from '../hooks/useSettings'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { toast } from 'react-toastify'
import { sendNotification } from '../utils/sendNotification'

function CheckoutPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()

  const [cartItems, setCartItems] = useState([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const [deliveryTime, setDeliveryTime] = useState('asap')
  const [timeSlot, setTimeSlot] = useState('')
  const [orderNote, setOrderNote] = useState('')
  const [trackingStage, setTrackingStage] = useState(0)

  const savedAddress = JSON.parse(localStorage.getItem('savedAddress') || 'null')

  const [fullName, setFullName] = useState(savedAddress?.fullName || '')
  const [phone, setPhone] = useState(savedAddress?.phone || '')
  const [address, setAddress] = useState(savedAddress?.address || '')
  const [saveAddress, setSaveAddress] = useState(Boolean(savedAddress))
  const [paymentMethod, setPaymentMethod] = useState('cod')

  // Online payment states
  const [onlineTrxId, setOnlineTrxId] = useState('')
  const [onlineMethodUsed, setOnlineMethodUsed] = useState('bKash')
  const [araifoodNumbers, setAraifoodNumbers] = useState(null)
  const [copiedKey, setCopiedKey] = useState('')

  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [usingPoints, setUsingPoints] = useState(false)
  const [usingWallet, setUsingWallet] = useState(false)

  const [availableCoupons, setAvailableCoupons] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)

  const [freeDelivery, setFreeDelivery] = useState(false)
  const [mapPosition, setMapPosition] = useState(null)
  const [placing, setPlacing] = useState(false)

  const [zones, setZones] = useState([])
  const [selectedZoneId, setSelectedZoneId] = useState('')

  const [showPushPrompt, setShowPushPrompt] = useState(false)

  // ============================================================
  // Load zones
  // ============================================================
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'deliveryZones'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setZones(list)
      },
      (err) => console.error('Zones load error:', err)
    )
    return () => unsub()
  }, [])

  const selectedZone = useMemo(
    () => zones.find((z) => z.firebaseId === selectedZoneId) || null,
    [zones, selectedZoneId]
  )

  // ============================================================
  // Load AraiFood payment numbers
  // ============================================================
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'araifood_payment_numbers'),
      (snap) => {
        if (snap.exists()) {
          setAraifoodNumbers(snap.data())
        } else {
          setAraifoodNumbers(null)
        }
      },
      (err) => console.warn('AraiFood numbers load:', err.message)
    )
    return () => unsub()
  }, [])

  // Active payment numbers list
  const activePaymentNumbers = useMemo(() => {
    if (!araifoodNumbers) return []
    const list = []
    if (araifoodNumbers.bkash?.active && araifoodNumbers.bkash?.number) {
      list.push({
        key: 'bkash',
        label: 'bKash',
        icon: '📱',
        number: araifoodNumbers.bkash.number,
      })
    }
    if (araifoodNumbers.nagad?.active && araifoodNumbers.nagad?.number) {
      list.push({
        key: 'nagad',
        label: 'Nagad',
        icon: '📱',
        number: araifoodNumbers.nagad.number,
      })
    }
    if (araifoodNumbers.rocket?.active && araifoodNumbers.rocket?.number) {
      list.push({
        key: 'rocket',
        label: 'Rocket',
        icon: '📱',
        number: araifoodNumbers.rocket.number,
      })
    }
    if (araifoodNumbers.bank?.active && araifoodNumbers.bank?.number) {
      list.push({
        key: 'bank',
        label: `Bank${
          araifoodNumbers.bank.bankName
            ? ' (' + araifoodNumbers.bank.bankName + ')'
            : ''
        }`,
        icon: '🏦',
        number: araifoodNumbers.bank.number,
      })
    }
    return list
  }, [araifoodNumbers])

  const handleCopyNumber = (key, number) => {
    navigator.clipboard.writeText(number)
    setCopiedKey(key)
    toast.success('📋 Copied!')
    setTimeout(() => setCopiedKey(''), 2000)
  }

  // ============================================================
  // Load cart + user data
  // ============================================================
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
    setCartItems(items)

    const savedLoc = JSON.parse(
      localStorage.getItem('deliveryLocation') || 'null'
    )
    if (savedLoc?.lat && savedLoc?.lng) setMapPosition(savedLoc)

    const savedZone = localStorage.getItem('deliveryZoneId')
    if (savedZone) setSelectedZoneId(savedZone)

    const loadUserData = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const data = userDoc.data()
            setLoyaltyPoints(data.loyaltyPoints || 0)
            setWalletBalance(data.walletBalance || 0)
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }
    }

    loadUserData()
  }, [])

  // ============================================================
  // Load coupons
  // ============================================================
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'coupons'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        setAvailableCoupons(list)
      },
      (err) => console.error('Coupons load error:', err)
    )
    return () => unsub()
  }, [])

  const restaurant =
    cartItems.length > 0
      ? {
          restaurantId: cartItems[0].restaurantId,
          restaurantName: cartItems[0].restaurantName,
          restaurantLogo: cartItems[0].restaurantLogo || '',
          deliveryFee: cartItems[0].deliveryFee ?? null,
          deliveryTime:
            cartItems[0].deliveryTime || settings.defaultDeliveryTime,
        }
      : null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const deliveryFee = useMemo(() => {
    if (selectedZone?.deliveryFee != null) return selectedZone.deliveryFee
    if (restaurant?.deliveryFee != null) return restaurant.deliveryFee
    return settings.defaultDeliveryFee
  }, [selectedZone, restaurant, settings.defaultDeliveryFee])

  useEffect(() => {
    const threshold = settings.freeDeliveryThreshold ?? 0
    setFreeDelivery(threshold > 0 && subtotal >= threshold)
  }, [subtotal, settings.freeDeliveryThreshold])

  const finalDeliveryFee = freeDelivery ? 0 : deliveryFee

  const applyCoupon = () => {
    setCouponError('')
    const code = couponCode.trim().toUpperCase()
    const coupon = availableCoupons.find((c) => c.code === code)
    if (!coupon) {
      setCouponError('Invalid coupon code. Please try again.')
      setCouponApplied(false)
      setCouponDiscount(0)
      return
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      setCouponError(
        `Minimum order ৳${coupon.minOrder} required for this coupon.`
      )
      setCouponApplied(false)
      setCouponDiscount(0)
      return
    }
    let discount = 0
    if (coupon.discountType === 'percent') {
      discount = Math.round((subtotal * coupon.discountValue) / 100)
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal)
    }
    setCouponDiscount(discount)
    setCouponApplied(true)
  }

  const pointsDiscount = usingPoints
    ? Math.min(loyaltyPoints / 10, subtotal)
    : 0
  const walletDiscount = usingWallet
    ? Math.min(walletBalance, subtotal - pointsDiscount - couponDiscount)
    : 0
  const total =
    subtotal +
    finalDeliveryFee -
    couponDiscount -
    pointsDiscount -
    walletDiscount

  // ============================================================
  // Place Order
  // ============================================================
  const placeOrder = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number.')
      return
    }
    if (!address.trim()) {
      toast.error('Please enter your delivery address.')
      return
    }
    if (!selectedZoneId) {
      toast.error('📍 Please select your area / zone.')
      const zoneSection = document.querySelector('.zone-selection-section')
      if (zoneSection) {
        zoneSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (!mapPosition) {
      toast.error('📍 Please drop a pin on the map for delivery location.')
      const mapSection = document.querySelector('.map-selection-section')
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.')
      return
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      toast.error('Insufficient wallet balance.')
      return
    }
    // Online payment validation
    if (paymentMethod === 'online') {
      if (activePaymentNumbers.length === 0) {
        toast.error(
          '⚠️ Online payment এখনো available না। অনুগ্রহ করে Cash on Delivery ব্যবহার করুন।'
        )
        return
      }
      if (!onlineTrxId.trim()) {
        toast.error('⚠️ অনুগ্রহ করে Transaction ID দিন')
        const el = document.getElementById('online-payment-section')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    setPlacing(true)

    if (saveAddress) {
      localStorage.setItem(
        'savedAddress',
        JSON.stringify({ fullName, phone, address })
      )
    } else {
      localStorage.removeItem('savedAddress')
    }

    if (mapPosition) {
      localStorage.setItem('deliveryLocation', JSON.stringify(mapPosition))
    }
    if (selectedZoneId) {
      localStorage.setItem('deliveryZoneId', selectedZoneId)
    }

    const newOrderId = `AF-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderId(newOrderId)

    let finalPaymentMethod = paymentMethod
    if (paymentMethod === 'mobile') finalPaymentMethod = 'online'

    try {
      const orderPayload = {
        orderId: newOrderId,
        userId: auth.currentUser?.uid || 'guest',
        userEmail: auth.currentUser?.email || 'guest',
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        restaurantLogo: restaurant.restaurantLogo,
        items: cartItems,
        subtotal: subtotal,
        deliveryFee: finalDeliveryFee,
        total: total,
        fullName: fullName,
        phone: phone,
        address: address,
        deliveryTime: deliveryTime,
        timeSlot: timeSlot,
        orderNote: orderNote,
        couponCode: couponCode,
        couponDiscount: couponDiscount,
        paymentMethod: finalPaymentMethod,
        location: mapPosition,
        zoneId: selectedZone.firebaseId,
        zoneName: selectedZone.name,
        zoneDeliveryFee: selectedZone.deliveryFee,
        status: 'pending',
        riderStatus: 'available',
        riderId: null,
        riderName: null,
        riderPhone: null,
        riderRating: null,
        deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: new Date(),
      }

      if (finalPaymentMethod === 'online') {
        orderPayload.paymentStatus = 'pending'
        orderPayload.paymentTrxId = onlineTrxId.trim()
        orderPayload.paymentMethodUsed = onlineMethodUsed
        orderPayload.paymentSubmittedAt = new Date()
      } else if (finalPaymentMethod === 'cod') {
        orderPayload.paymentStatus = 'cod'
      } else if (finalPaymentMethod === 'wallet') {
        orderPayload.paymentStatus = 'paid'
      }

      await addDoc(collection(db, 'orders'), orderPayload)

      if (auth.currentUser?.uid) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          let newPoints = userData.loyaltyPoints || 0
          let newBalance = userData.walletBalance || 0
          const newTransactions = []

          if (usingPoints) {
            const pointsUsed = pointsDiscount * 10
            newPoints = Math.max(0, newPoints - pointsUsed)
          }
          if (usingWallet) {
            newBalance = Math.max(0, newBalance - walletDiscount)
            newTransactions.push({
              id: Date.now().toString() + '-wallet',
              type: 'debit',
              amount: walletDiscount,
              date: new Date().toLocaleDateString(),
              description: `Wallet used for order ${newOrderId}`,
            })
          }
          if (paymentMethod === 'wallet') {
            newBalance = Math.max(0, newBalance - total)
            newTransactions.push({
              id: Date.now().toString() + '-fullwallet',
              type: 'debit',
              amount: total,
              date: new Date().toLocaleDateString(),
              description: `Full payment for order ${newOrderId}`,
            })
          }

          const earnedPoints = Math.floor(total * 0.05)
          newPoints += earnedPoints

          const pointsLogEntry = {
            id: Date.now().toString() + '-earned',
            amount: earnedPoints,
            date: new Date().toLocaleDateString(),
            description: `Earned from order ${newOrderId}`,
          }

          await updateDoc(userDocRef, {
            loyaltyPoints: newPoints,
            walletBalance: newBalance,
            walletTransactions:
              newTransactions.length > 0
                ? arrayUnion(...newTransactions)
                : arrayUnion(),
            pointsHistory: arrayUnion(pointsLogEntry),
          })

          setLoyaltyPoints(newPoints)
          setWalletBalance(newBalance)
        }
      }

      const customerId = auth.currentUser?.uid || 'guest'

      await sendNotification(
        customerId,
        '✅ Order Placed Successfully!',
        `Your order ${newOrderId} from ${restaurant.restaurantName} has been received.`,
        'order',
        {
          orderId: newOrderId,
          url: `/track-order?id=${newOrderId}`,
        }
      )

      await sendNotification(
        restaurant.restaurantId,
        '🔔 New Order Received!',
        `New order ${newOrderId} — ৳${total}. Please accept & prepare.`,
        'restaurant',
        {
          orderId: newOrderId,
          url: '/restaurant-panel',
        }
      )

      await sendNotification(
        'admin',
        '🆕 New Order Placed',
        `Order ${newOrderId} from ${restaurant.restaurantName} — ৳${total}${
          finalPaymentMethod === 'online' ? ' (Online Payment)' : ''
        }`,
        'order',
        {
          orderId: newOrderId,
          url: '/admin/orders',
        }
      )

      const orderHistory = JSON.parse(
        localStorage.getItem('orderHistory') || '[]'
      )
      orderHistory.unshift({
        id: newOrderId,
        date: new Date().toLocaleDateString(),
        restaurantName: restaurant.restaurantName,
        restaurantId: restaurant.restaurantId,
        restaurantLogo: restaurant.restaurantLogo,
        items: cartItems,
        total: total,
        status: 'pending',
        paymentMethod: finalPaymentMethod,
        deliveryTime,
        timeSlot,
      })
      localStorage.setItem('orderHistory', JSON.stringify(orderHistory))

      setOrderPlaced(true)
      setTrackingStage(0)
      setShowPushPrompt(true)
      localStorage.removeItem('cartItems')
      window.dispatchEvent(new Event('cartUpdated'))
      window.scrollTo(0, 0)
      toast.success('✅ Order Placed Successfully!')
    } catch (error) {
      console.error('Order placement error:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  useEffect(() => {
    if (!orderPlaced) return
    const t1 = setTimeout(() => setTrackingStage(1), 10000)
    const t2 = setTimeout(() => setTrackingStage(2), 20000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [orderPlaced])

  // ============================================================
  // Order Success Screen
  // ============================================================
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="order-success-container">
          <PageBackButton label="Back to Home" fallback="/" />
          <div className="order-success-icon">✅</div>
          <h1>Order Placed Successfully!</h1>
          <p>
            Your order <strong>{orderId}</strong> has been received.
          </p>
          <p style={{ marginTop: '10px' }}>
            From: <strong>{restaurant.restaurantName}</strong>
          </p>

          {paymentMethod === 'online' && onlineTrxId && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px 18px',
                borderRadius: '14px',
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                maxWidth: '400px',
                margin: '16px auto 0',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#92400E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                💳 Online Payment Pending Verification
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#92400E',
                  fontWeight: 600,
                }}
              >
                Method: <strong>{onlineMethodUsed}</strong>
                <br />
                TrxID:{' '}
                <strong style={{ fontFamily: 'monospace' }}>
                  {onlineTrxId}
                </strong>
                <br />
                Amount: <strong>৳{total}</strong>
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11.5px',
                  color: '#78350F',
                  fontStyle: 'italic',
                }}
              >
                Admin verify করার পর আপনার পেমেন্ট নিশ্চিত হবে।
              </div>
            </div>
          )}

          <div className="order-tracking-section">
            <h2 style={{ marginBottom: '20px', marginTop: '20px' }}>
              Track Your Order
            </h2>
            <div className="tracking-progress">
              <div
                className={`tracking-step ${
                  trackingStage >= 0 ? 'active' : ''
                }`}
              >
                <div className="tracking-icon">👨‍🍳</div>
                <div className="tracking-text">
                  <strong>Preparing</strong>
                  <small>Cooking</small>
                </div>
              </div>
              <div
                className={`tracking-line ${
                  trackingStage >= 1 ? 'active' : ''
                }`}
              ></div>
              <div
                className={`tracking-step ${
                  trackingStage >= 1 ? 'active' : ''
                }`}
              >
                <div className="tracking-icon">🛵</div>
                <div className="tracking-text">
                  <strong>On the Way</strong>
                  <small>Rider coming</small>
                </div>
              </div>
              <div
                className={`tracking-line ${
                  trackingStage >= 2 ? 'active' : ''
                }`}
              ></div>
              <div
                className={`tracking-step ${
                  trackingStage >= 2 ? 'active' : ''
                }`}
              >
                <div className="tracking-icon">🏠</div>
                <div className="tracking-text">
                  <strong>Delivered</strong>
                  <small>Enjoy!</small>
                </div>
              </div>
            </div>
            <p className="tracking-status-text">
              {trackingStage === 0 && '⏳ Your order is being prepared...'}
              {trackingStage === 1 && '🛵 Your rider is on the way!'}
              {trackingStage === 2 &&
                '✅ Your food has been delivered. Enjoy!'}
            </p>
          </div>

          <div className="order-success-buttons">
            <Link
              to={`/track-order?id=${orderId}`}
              className="checkout-button"
            >
              🛵 Track Order
            </Link>
            <Link to="/" className="checkout-button">
              Back to Home
            </Link>
          </div>
        </div>

        <OrderPushPrompt
          user={auth.currentUser}
          orderId={orderId}
          show={showPushPrompt}
        />
      </div>
    )
  }

  // ============================================================
  // Main Checkout UI
  // ============================================================
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <PageBackButton label="Back" fallback="/cart" />
          <div className="checkout-title">
            <span className="glass-section-label">CHECKOUT</span>
            <h1>Complete Your Order</h1>
            <p>
              Just a few details and your delicious food will be on its way.
            </p>
          </div>
        </div>

        <div className="checkout-content">
          <div className="delivery-form checkout-card">
            <div className="checkout-card-heading">
              <div className="checkout-icon">📍</div>
              <div>
                <h2>Delivery Information</h2>
                <p>Where should we deliver your order?</p>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="zone-selection-section">
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 10px',
                }}
              >
                📍 Select Your Area{' '}
                <span style={{ color: '#DC2626', fontSize: '12px' }}>
                  (Required)
                </span>
              </h3>
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectedZoneId(e.target.value)
                }}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  border: selectedZoneId
                    ? '2px solid #059669'
                    : '2px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-primary)',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">— Select your area —</option>
                {zones.map((z) => (
                  <option key={z.firebaseId} value={z.firebaseId}>
                    {z.name} — ৳{z.deliveryFee} delivery
                  </option>
                ))}
              </select>

              {selectedZone && (
                <p
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(16,185,129,0.08))',
                    border: '1px solid rgba(5,150,105,0.25)',
                    color: '#059669',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  ✅ {selectedZone.name} — Delivery ৳
                  {selectedZone.deliveryFee}
                </p>
              )}

              {!selectedZoneId && (
                <p
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ⚠️ Please select your area to continue
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Delivery Address (Details)</label>
              <textarea
                placeholder="House, road, landmark..."
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>

            <div className="map-selection-section">
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 10px',
                }}
              >
                🗺️ Drop Pin on Map{' '}
                <span style={{ color: '#DC2626', fontSize: '12px' }}>
                  (Required)
                </span>
              </h3>
              <MapPicker position={mapPosition} setPosition={setMapPosition} />
              {mapPosition ? (
                <p className="selected-location">
                  ✅ Location set: {mapPosition.lat.toFixed(4)},{' '}
                  {mapPosition.lng.toFixed(4)}
                </p>
              ) : (
                <p
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ⚠️ Please click on the map to set your delivery location
                </p>
              )}
            </div>

            <label className="save-address-option">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              <span>💾 Save this address for future orders</span>
            </label>

            <div className="delivery-time-section">
              <div className="checkout-icon-container">
                <div className="checkout-icon">⏰</div>
                <div>
                  <h2>Delivery Time</h2>
                  <p>When do you want your food?</p>
                </div>
              </div>
              <div className="delivery-time-options">
                <label
                  className={`delivery-time-option ${
                    deliveryTime === 'asap' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryTime"
                    checked={deliveryTime === 'asap'}
                    onChange={() => setDeliveryTime('asap')}
                  />
                  <div>
                    <strong>⚡ ASAP</strong>
                    <small>{restaurant?.deliveryTime}</small>
                  </div>
                </label>
                <label
                  className={`delivery-time-option ${
                    deliveryTime === '1hour' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryTime"
                    checked={deliveryTime === '1hour'}
                    onChange={() => setDeliveryTime('1hour')}
                  />
                  <div>
                    <strong>⏱️ 1 Hour</strong>
                    <small>Within 60 minutes</small>
                  </div>
                </label>
                <label
                  className={`delivery-time-option ${
                    deliveryTime === '2hours' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryTime"
                    checked={deliveryTime === '2hours'}
                    onChange={() => setDeliveryTime('2hours')}
                  />
                  <div>
                    <strong>🕑 2 Hours</strong>
                    <small>Within 120 minutes</small>
                  </div>
                </label>
              </div>
            </div>

            {deliveryTime !== 'asap' && (
              <div className="time-slot-section">
                <label>Select Time Slot</label>
                <div className="time-slot-options">
                  {(settings.deliverySlots || []).map((slot) => (
                    <button
                      key={slot}
                      className={`time-slot-btn ${
                        timeSlot === slot ? 'active' : ''
                      }`}
                      onClick={() => setTimeSlot(slot)}
                    >
                      {slot.toUpperCase().replace('PM', ' PM')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Order Note (Optional)</label>
              <textarea
                placeholder="Special instructions..."
                rows="3"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              ></textarea>
            </div>

            <div className="coupon-section-checkout">
              <h3>Apply Coupon</h3>
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value)
                    setCouponError('')
                    setCouponApplied(false)
                    setCouponDiscount(0)
                  }}
                />
                <button onClick={applyCoupon}>Apply</button>
              </div>
              {couponError && <p className="coupon-error">{couponError}</p>}
              {couponApplied && (
                <p className="coupon-success">
                  Coupon applied! You saved ৳{couponDiscount}
                </p>
              )}
              {availableCoupons.length > 0 && !couponApplied && (
                <div style={{ marginTop: '12px' }}>
                  <p
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      margin: '0 0 8px',
                    }}
                  >
                    Available Coupons
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {availableCoupons.slice(0, 5).map((c) => {
                      const isEligible =
                        !c.minOrder || subtotal >= c.minOrder
                      return (
                        <button
                          key={c.firebaseId}
                          onClick={() => {
                            setCouponCode(c.code)
                            setCouponError('')
                          }}
                          disabled={!isEligible}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: isEligible
                              ? 'rgba(5,150,105,0.1)'
                              : 'var(--surface-soft)',
                            border: isEligible
                              ? '1px dashed rgba(5,150,105,0.4)'
                              : '1px dashed var(--border-strong)',
                            color: isEligible
                              ? '#059669'
                              : 'var(--text-tertiary)',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            cursor: isEligible
                              ? 'pointer'
                              : 'not-allowed',
                            opacity: isEligible ? 1 : 0.6,
                          }}
                        >
                          🎟️ {c.code}
                          {c.minOrder > 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                marginLeft: '4px',
                                opacity: 0.8,
                              }}
                            >
                              ৳{c.minOrder}+
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="payment-rewards-section">
              <h3>Use Rewards</h3>
              <div className="reward-options">
                <label
                  className={`reward-option ${usingPoints ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={usingPoints}
                    onChange={() => setUsingPoints(!usingPoints)}
                  />
                  <div>
                    <strong>⭐ Use {loyaltyPoints} Points</strong>
                    <small>
                      Get ৳{Math.min(loyaltyPoints / 10, subtotal).toFixed(0)}{' '}
                      discount
                    </small>
                  </div>
                </label>
                <label
                  className={`reward-option ${usingWallet ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={usingWallet}
                    onChange={() => setUsingWallet(!usingWallet)}
                  />
                  <div>
                    <strong>💳 Use ৳{walletBalance.toFixed(2)} Wallet</strong>
                    <small>Pay from wallet</small>
                  </div>
                </label>
              </div>
            </div>

            {/* ============================================================
                PAYMENT SECTION
            ============================================================ */}
            <div className="payment-section">
              <div className="payment-heading">
                <div className="checkout-icon">💳</div>
                <div>
                  <h2>Payment Method</h2>
                  <p>Choose how you want to pay.</p>
                </div>
              </div>

              <div className="payment-options">
                <label
                  className={`payment-option ${
                    paymentMethod === 'cod' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <strong>💵 Cash on Delivery</strong>
                  <small>Pay when food arrives</small>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod === 'online' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                  />
                  <strong>📱 Online Payment</strong>
                  <small>bKash / Nagad / Rocket / Bank</small>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod === 'wallet' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                  />
                  <strong>💳 Wallet Payment</strong>
                  <small>Pay using ৳{walletBalance.toFixed(2)}</small>
                </label>
              </div>

              {/* Online Payment Section */}
              {paymentMethod === 'online' && (
                <div
                  id="online-payment-section"
                  style={{
                    marginTop: '16px',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    background:
                      'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                    border: '2px solid #F59E0B',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#92400E',
                      marginBottom: '4px',
                    }}
                  >
                    💳 Online Payment
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#78350F',
                      fontWeight: 600,
                      marginBottom: '14px',
                    }}
                  >
                    নিচের যেকোনো নম্বরে <strong>৳{total}</strong> পেমেন্ট করুন
                  </div>

                  {activePaymentNumbers.length === 0 ? (
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: '#FEE2E2',
                        border: '1px solid #DC2626',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#991B1B',
                        textAlign: 'center',
                      }}
                    >
                      ⚠️ Online payment এখনো available না
                      <br />
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>
                        Admin এখনো payment number সেট করেনি
                      </span>
                    </div>
                  ) : (
                    <>
                      {activePaymentNumbers.map((p) => (
                        <div
                          key={p.key}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background:
                              onlineMethodUsed === p.label
                                ? 'rgba(255, 255, 255, 0.95)'
                                : 'rgba(255, 255, 255, 0.7)',
                            border:
                              onlineMethodUsed === p.label
                                ? '2px solid #059669'
                                : '1px solid #FCD34D',
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => setOnlineMethodUsed(p.label)}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: '#92400E',
                              }}
                            >
                              {p.icon} {p.label}
                            </div>
                            <div
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                fontWeight: 800,
                                color: '#0F172A',
                                marginTop: '2px',
                              }}
                            >
                              {p.number}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyNumber(p.key, p.number)
                            }}
                            style={{
                              background:
                                copiedKey === p.key ? '#16A34A' : '#F59E0B',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {copiedKey === p.key ? '✅ Copied' : '📋 Copy'}
                          </button>
                        </div>
                      ))}

                      <div style={{ marginTop: '16px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#92400E',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '6px',
                          }}
                        >
                          Transaction ID{' '}
                          <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={onlineTrxId}
                          onChange={(e) => setOnlineTrxId(e.target.value)}
                          placeholder="e.g. 8N7A6B5C4D3E2F1G"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: onlineTrxId.trim()
                              ? '2px solid #059669'
                              : '2px solid #F59E0B',
                            background: '#FFFFFF',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0F172A',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <p
                          style={{
                            marginTop: '8px',
                            fontSize: '11.5px',
                            color: '#78350F',
                            fontWeight: 600,
                          }}
                        >
                          💡 পেমেন্ট করার পর bKash/Nagad app থেকে TrxID কপি
                          করে এখানে দিন
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              className="place-order-button"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing Order...' : 'Place Order →'}
            </button>
          </div>

          <div className="checkout-summary checkout-card">
            <span className="section-label">ORDER SUMMARY</span>
            <h2>Your Order</h2>

            {restaurant && (
              <div className="summary-restaurant">
                <div className="summary-restaurant-logo">
                  {restaurant.restaurantLogo ? (
                    <img src={restaurant.restaurantLogo} alt="logo" />
                  ) : (
                    <span>🏪</span>
                  )}
                </div>
                <div>
                  <strong>{restaurant.restaurantName}</strong>
                  <small>
                    Delivery:{' '}
                    {finalDeliveryFee === 0
                      ? 'FREE'
                      : `৳${finalDeliveryFee}`}
                    {' · '}
                    {restaurant.deliveryTime}
                  </small>
                </div>
              </div>
            )}

            {selectedZone && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.04))',
                  border: '1px solid rgba(5,150,105,0.2)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#059669',
                  marginBottom: '14px',
                }}
              >
                📍 Zone: {selectedZone.name}
              </div>
            )}

            <div className="summary-items">
              {cartItems.map((item) => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-with-image">
                    <div className="summary-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>{item.emoji}</span>
                      )}
                    </div>
                    <div>
                      <span>{item.name}</span>
                      <small>Quantity × {item.quantity}</small>
                    </div>
                  </div>
                  <strong>৳{item.price * item.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <span>Subtotal</span>
              <strong>৳{subtotal}</strong>
            </div>

            <div className="summary-item">
              <span>
                Delivery Fee{' '}
                {settings.freeDeliveryThreshold > 0 && (
                  <small>(Free on ৳{settings.freeDeliveryThreshold}+)</small>
                )}
              </span>
              <strong>
                {finalDeliveryFee === 0 ? 'FREE' : `৳${finalDeliveryFee}`}
              </strong>
            </div>

            {couponApplied && (
              <div className="summary-item discount-item">
                <span>Coupon Discount</span>
                <strong>-৳{couponDiscount}</strong>
              </div>
            )}
            {usingPoints && (
              <div className="summary-item discount-item">
                <span>Points Discount</span>
                <strong>-৳{pointsDiscount}</strong>
              </div>
            )}
            {usingWallet && (
              <div className="summary-item discount-item">
                <span>Wallet Discount</span>
                <strong>-৳{walletDiscount}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>Total</span>
              <strong>৳{total}</strong>
            </div>

            <div className="checkout-note">
              🔒 Your order information is secure.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage