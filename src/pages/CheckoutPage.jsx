// ============================================================
// src/pages/CheckoutPage.jsx
// V9 — Bilingual (BN/EN) + Mobile Responsive
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MapPicker from '../components/MapPicker'
import PageBackButton from '../components/PageBackButton'
import OrderPushPrompt from '../components/OrderPushPrompt'
import useSettings from '../hooks/useSettings'
import { useLanguage } from '../i18n/LanguageContext'
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

// ============================================================
// MOBILE RESPONSIVE STYLES (page-scoped)
// ============================================================
const MOBILE_STYLES = `
  /* ---------- Base mobile (<=640px) ---------- */
  @media (max-width: 640px) {
    .checkout-page {
      padding-bottom: 100px !important;
    }
    .checkout-container {
      padding: 12px 12px 40px !important;
    }

    /* Header */
    .checkout-header {
      margin-bottom: 16px !important;
    }
    .checkout-title h1 {
      font-size: 22px !important;
      line-height: 1.25 !important;
      margin-bottom: 6px !important;
    }
    .checkout-title p {
      font-size: 13px !important;
      line-height: 1.5 !important;
    }

    /* Layout stack */
    .checkout-content {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }

    /* Cards */
    .checkout-card {
      padding: 16px !important;
      border-radius: 16px !important;
    }
    .checkout-card-heading {
      gap: 10px !important;
      margin-bottom: 14px !important;
    }
    .checkout-icon {
      width: 38px !important;
      height: 38px !important;
      font-size: 18px !important;
      border-radius: 12px !important;
    }
    .checkout-card-heading h2 {
      font-size: 16px !important;
    }
    .checkout-card-heading p {
      font-size: 12.5px !important;
    }

    /* Form inputs — bigger tap targets */
    .checkout-card .form-group {
      margin-bottom: 14px !important;
    }
    .checkout-card .form-group label {
      font-size: 12.5px !important;
      margin-bottom: 6px !important;
    }
    .checkout-card .form-group input,
    .checkout-card .form-group textarea,
    .checkout-card .form-group select {
      font-size: 15px !important;
      padding: 13px 14px !important;
      min-height: 48px !important;
      border-radius: 12px !important;
    }

    /* Delivery time options — stack */
    .delivery-time-options {
      grid-template-columns: 1fr !important;
      gap: 8px !important;
    }
    .delivery-time-option {
      padding: 12px 14px !important;
      min-height: 52px !important;
    }
    .delivery-time-option strong {
      font-size: 13.5px !important;
    }
    .delivery-time-option small {
      font-size: 11.5px !important;
    }

    /* Time slot buttons */
    .time-slot-options {
      gap: 8px !important;
    }
    .time-slot-btn {
      min-height: 42px !important;
      padding: 10px 14px !important;
      font-size: 12.5px !important;
    }

    /* Payment options — stack */
    .payment-options {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }
    .payment-option {
      padding: 14px !important;
      min-height: 60px !important;
      border-radius: 14px !important;
    }
    .payment-option strong {
      font-size: 14px !important;
    }
    .payment-option small {
      font-size: 12px !important;
    }

    /* Rewards */
    .reward-options {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }
    .reward-option {
      padding: 12px 14px !important;
      min-height: 58px !important;
    }

    /* Coupon input */
    .coupon-input-group {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .coupon-input-group input {
      min-height: 48px !important;
      font-size: 15px !important;
    }
    .coupon-input-group button {
      min-height: 46px !important;
      font-size: 14px !important;
      width: 100% !important;
    }

    /* Place order button */
    .place-order-button {
      min-height: 54px !important;
      font-size: 16px !important;
      padding: 16px !important;
      border-radius: 14px !important;
      width: 100% !important;
    }

    /* Summary card */
    .checkout-summary {
      padding: 16px !important;
      border-radius: 16px !important;
    }
    .checkout-summary h2 {
      font-size: 18px !important;
    }
    .summary-item {
      font-size: 13px !important;
      padding: 8px 0 !important;
    }
    .summary-item strong {
      font-size: 14px !important;
    }
    .summary-total {
      font-size: 16px !important;
      padding: 12px 0 !important;
    }
    .summary-total strong {
      font-size: 20px !important;
    }

    /* Order success screen */
    .order-success-container {
      padding: 20px 14px !important;
    }
    .order-success-container h1 {
      font-size: 22px !important;
      line-height: 1.3 !important;
    }
    .order-success-icon {
      font-size: 56px !important;
    }

    /* Tracking progress — mobile compact */
    .tracking-progress {
      gap: 6px !important;
    }
    .tracking-icon {
      width: 44px !important;
      height: 44px !important;
      font-size: 20px !important;
    }
    .tracking-text strong {
      font-size: 12px !important;
    }
    .tracking-text small {
      font-size: 10.5px !important;
    }
    .tracking-line {
      min-width: 12px !important;
    }

    /* Order success buttons — stack */
    .order-success-buttons {
      flex-direction: column !important;
      gap: 10px !important;
    }
    .order-success-buttons .checkout-button {
      width: 100% !important;
      min-height: 48px !important;
      font-size: 14px !important;
    }

    /* Sticky mobile place-order bar */
    .mobile-checkout-bar {
      display: flex !important;
    }
  }

  /* ---------- Small phones (<=400px) ---------- */
  @media (max-width: 400px) {
    .checkout-container {
      padding: 10px 10px 40px !important;
    }
    .checkout-title h1 {
      font-size: 20px !important;
    }
    .checkout-card {
      padding: 14px !important;
    }
    .checkout-icon {
      width: 34px !important;
      height: 34px !important;
      font-size: 16px !important;
    }
    .checkout-card .form-group input,
    .checkout-card .form-group textarea,
    .checkout-card .form-group select {
      font-size: 14.5px !important;
      padding: 12px 12px !important;
    }
    .checkout-summary h2 {
      font-size: 17px !important;
    }
  }

  /* ---------- Very small (<=360px) ---------- */
  @media (max-width: 360px) {
    .checkout-container {
      padding: 8px 8px 40px !important;
    }
    .checkout-title h1 {
      font-size: 18.5px !important;
    }
  }

  /* Mobile sticky checkout bar — hidden on desktop */
  .mobile-checkout-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 900;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--border, #e5e7eb);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
    align-items: center;
    gap: 12px;
  }
  .mobile-checkout-bar-info {
    flex: 1;
    min-width: 0;
  }
  .mobile-checkout-bar-info strong {
    display: block;
    font-family: var(--font-heading, inherit);
    font-size: 17px;
    font-weight: 900;
    color: var(--text-primary, #111);
    line-height: 1.2;
  }
  .mobile-checkout-bar-info span {
    display: block;
    font-size: 11.5px;
    color: var(--text-tertiary, #6b7280);
    font-weight: 600;
    margin-top: 2px;
  }
  .mobile-checkout-bar button {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #059669, #047857);
    color: #fff;
    font-family: var(--font-heading, inherit);
    font-size: 14.5px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .mobile-checkout-bar button:disabled {
    background: #9ca3af !important;
    box-shadow: none !important;
    cursor: not-allowed !important;
  }
  .mobile-checkout-bar button:active:not(:disabled) {
    transform: scale(0.97);
  }
`

function CheckoutPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { t } = useLanguage()

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
    toast.success(t('checkout.copiedToast'))
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
      setCouponError(t('checkout.couponInvalid'))
      setCouponApplied(false)
      setCouponDiscount(0)
      return
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      setCouponError(
        t('checkout.couponMinOrder').replace('{amount}', coupon.minOrder)
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
      toast.error(t('checkout.errFullName'))
      return
    }
    if (!phone.trim()) {
      toast.error(t('checkout.errPhone'))
      return
    }
    if (!address.trim()) {
      toast.error(t('checkout.errAddress'))
      return
    }
    if (!selectedZoneId) {
      toast.error(t('checkout.errZone'))
      const zoneSection = document.querySelector('.zone-selection-section')
      if (zoneSection) {
        zoneSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (!mapPosition) {
      toast.error(t('checkout.errMap'))
      const mapSection = document.querySelector('.map-selection-section')
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (cartItems.length === 0) {
      toast.error(t('checkout.errCartEmpty'))
      return
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      toast.error(t('checkout.errWalletInsufficient'))
      return
    }
    if (paymentMethod === 'online') {
      if (activePaymentNumbers.length === 0) {
        toast.error(t('checkout.errOnlineUnavailable'))
        return
      }
      if (!onlineTrxId.trim()) {
        toast.error(t('checkout.errTrxId'))
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
        t('checkout.notifOrderPlacedTitle'),
        t('checkout.notifOrderPlacedBody')
          .replace('{orderId}', newOrderId)
          .replace('{restaurant}', restaurant.restaurantName),
        'order',
        {
          orderId: newOrderId,
          url: `/track-order?id=${newOrderId}`,
        }
      )

      await sendNotification(
        restaurant.restaurantId,
        t('checkout.notifNewOrderTitle'),
        t('checkout.notifNewOrderBody')
          .replace('{orderId}', newOrderId)
          .replace('{total}', total),
        'restaurant',
        {
          orderId: newOrderId,
          url: '/restaurant-panel',
        }
      )

      await sendNotification(
        'admin',
        t('checkout.notifAdminTitle'),
        t('checkout.notifAdminBody')
          .replace('{orderId}', newOrderId)
          .replace('{restaurant}', restaurant.restaurantName)
          .replace('{total}', total) +
          (finalPaymentMethod === 'online'
            ? t('checkout.notifAdminOnlineTag')
            : ''),
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
      toast.success(t('checkout.successToast'))
    } catch (error) {
      console.error('Order placement error:', error)
      toast.error(t('checkout.errPlaceOrder'))
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
      <>
        <style>{MOBILE_STYLES}</style>
        <div className="checkout-page">
          <div className="order-success-container">
            <PageBackButton label={t('checkout.successBack')} fallback="/" />
            <div className="order-success-icon">✅</div>
            <h1>{t('checkout.success')}</h1>
            <p>
              {t('checkout.orderReceived')}{' '}
              <strong>{orderId}</strong>
            </p>
            <p style={{ marginTop: '10px' }}>
              {t('checkout.successFrom')}{' '}
              <strong>{restaurant.restaurantName}</strong>
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
                  {t('checkout.onlinePendingTitle')}
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#92400E',
                    fontWeight: 600,
                  }}
                >
                  {t('checkout.onlinePendingMethod')}{' '}
                  <strong>{onlineMethodUsed}</strong>
                  <br />
                  {t('checkout.onlinePendingTrxId')}{' '}
                  <strong style={{ fontFamily: 'monospace' }}>
                    {onlineTrxId}
                  </strong>
                  <br />
                  {t('checkout.onlinePendingAmount')}{' '}
                  <strong>৳{total}</strong>
                </div>
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '11.5px',
                    color: '#78350F',
                    fontStyle: 'italic',
                  }}
                >
                  {t('checkout.onlinePendingNote')}
                </div>
              </div>
            )}

            <div className="order-tracking-section">
              <h2 style={{ marginBottom: '20px', marginTop: '20px' }}>
                {t('checkout.trackYourOrder')}
              </h2>
              <div className="tracking-progress">
                <div
                  className={`tracking-step ${
                    trackingStage >= 0 ? 'active' : ''
                  }`}
                >
                  <div className="tracking-icon">👨‍🍳</div>
                  <div className="tracking-text">
                    <strong>{t('checkout.stagePreparing')}</strong>
                    <small>{t('checkout.stagePreparingDesc')}</small>
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
                    <strong>{t('checkout.stageOnWay')}</strong>
                    <small>{t('checkout.stageOnWayDesc')}</small>
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
                    <strong>{t('checkout.stageDelivered')}</strong>
                    <small>{t('checkout.stageDeliveredDesc')}</small>
                  </div>
                </div>
              </div>
              <p className="tracking-status-text">
                {trackingStage === 0 && t('checkout.stagePreparingText')}
                {trackingStage === 1 && t('checkout.stageOnWayText')}
                {trackingStage === 2 && t('checkout.stageDeliveredText')}
              </p>
            </div>

            <div className="order-success-buttons">
              <Link
                to={`/track-order?id=${orderId}`}
                className="checkout-button"
              >
                {t('checkout.trackOrderBtn')}
              </Link>
              <Link to="/" className="checkout-button">
                {t('checkout.backHomeBtn')}
              </Link>
            </div>
          </div>

          <OrderPushPrompt
            user={auth.currentUser}
            orderId={orderId}
            show={showPushPrompt}
          />
        </div>
      </>
    )
  }

  // ============================================================
  // Main Checkout UI
  // ============================================================
  return (
    <>
      <style>{MOBILE_STYLES}</style>
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-header">
            <PageBackButton label={t('checkout.back')} fallback="/cart" />
            <div className="checkout-title">
              <span className="glass-section-label">
                {t('checkout.badge')}
              </span>
              <h1>{t('checkout.title')}</h1>
              <p>{t('checkout.subtitle')}</p>
            </div>
          </div>

          <div className="checkout-content">
            <div className="delivery-form checkout-card">
              <div className="checkout-card-heading">
                <div className="checkout-icon">📍</div>
                <div>
                  <h2>{t('checkout.deliveryInfo')}</h2>
                  <p>{t('checkout.deliveryInfoDesc')}</p>
                </div>
              </div>

              <div className="form-group">
                <label>{t('checkout.fullName')}</label>
                <input
                  type="text"
                  placeholder={t('checkout.fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('checkout.phone')}</label>
                <input
                  type="tel"
                  placeholder={t('checkout.phonePlaceholder')}
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
                  {t('checkout.selectArea')}{' '}
                  <span style={{ color: '#DC2626', fontSize: '12px' }}>
                    {t('checkout.required')}
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
                  <option value="">{t('checkout.selectAreaPlaceholder')}</option>
                  {zones.map((z) => (
                    <option key={z.firebaseId} value={z.firebaseId}>
                      {z.name} — ৳{z.deliveryFee} {t('checkout.deliveryLabel')}
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
                    ✅ {selectedZone.name} — {t('checkout.deliveryLabel')} ৳
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
                    {t('checkout.selectAreaError')}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>{t('checkout.deliveryAddress')}</label>
                <textarea
                  placeholder={t('checkout.deliveryAddressPlaceholder')}
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
                  {t('checkout.dropPin')}{' '}
                  <span style={{ color: '#DC2626', fontSize: '12px' }}>
                    {t('checkout.required')}
                  </span>
                </h3>
                <MapPicker position={mapPosition} setPosition={setMapPosition} />
                {mapPosition ? (
                  <p className="selected-location">
                    {t('checkout.locationSet')}: {mapPosition.lat.toFixed(4)},{' '}
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
                    {t('checkout.selectLocation')}
                  </p>
                )}
              </div>

              <label className="save-address-option">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                <span>{t('checkout.saveAddress')}</span>
              </label>

              <div className="delivery-time-section">
                <div className="checkout-icon-container">
                  <div className="checkout-icon">⏰</div>
                  <div>
                    <h2>{t('checkout.deliveryTimeTitle')}</h2>
                    <p>{t('checkout.deliveryTimeDesc')}</p>
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
                      <strong>{t('checkout.asap')}</strong>
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
                      <strong>{t('checkout.oneHour')}</strong>
                      <small>{t('checkout.oneHourDesc')}</small>
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
                      <strong>{t('checkout.twoHours')}</strong>
                      <small>{t('checkout.twoHoursDesc')}</small>
                    </div>
                  </label>
                </div>
              </div>

              {deliveryTime !== 'asap' && (
                <div className="time-slot-section">
                  <label>{t('checkout.selectTimeSlot')}</label>
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
                <label>{t('checkout.orderNote')}</label>
                <textarea
                  placeholder={t('checkout.orderNotePlaceholder')}
                  rows="3"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                ></textarea>
              </div>

              <div className="coupon-section-checkout">
                <h3>{t('checkout.applyCoupon')}</h3>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder={t('checkout.couponPlaceholder')}
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value)
                      setCouponError('')
                      setCouponApplied(false)
                      setCouponDiscount(0)
                    }}
                  />
                  <button onClick={applyCoupon}>{t('checkout.apply')}</button>
                </div>
                {couponError && <p className="coupon-error">{couponError}</p>}
                {couponApplied && (
                  <p className="coupon-success">
                    {t('checkout.couponSuccess').replace(
                      '{amount}',
                      couponDiscount
                    )}
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
                      {t('checkout.availableCoupons')}
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
                <h3>{t('checkout.useRewards')}</h3>
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
                      <strong>
                        {t('checkout.usePoints').replace(
                          '{points}',
                          loyaltyPoints
                        )}
                      </strong>
                      <small>
                        {t('checkout.usePointsDesc').replace(
                          '{amount}',
                          Math.min(loyaltyPoints / 10, subtotal).toFixed(0)
                        )}
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
                      <strong>
                        {t('checkout.useWallet').replace(
                          '{amount}',
                          walletBalance.toFixed(2)
                        )}
                      </strong>
                      <small>{t('checkout.useWalletDesc')}</small>
                    </div>
                  </label>
                </div>
              </div>

              {/* PAYMENT SECTION */}
              <div className="payment-section">
                <div className="payment-heading">
                  <div className="checkout-icon">💳</div>
                  <div>
                    <h2>{t('checkout.paymentMethod')}</h2>
                    <p>{t('checkout.paymentMethodDesc')}</p>
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
                    <strong>{t('checkout.cod')}</strong>
                    <small>{t('checkout.codDesc')}</small>
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
                    <strong>{t('checkout.onlinePayment')}</strong>
                    <small>{t('checkout.onlinePaymentDesc')}</small>
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
                    <strong>{t('checkout.walletPayment')}</strong>
                    <small>
                      {t('checkout.walletPaymentDesc').replace(
                        '{amount}',
                        walletBalance.toFixed(2)
                      )}
                    </small>
                  </label>
                </div>

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
                      {t('checkout.onlinePayTitle')}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#78350F',
                        fontWeight: 600,
                        marginBottom: '14px',
                        dangerouslySetInnerHTML: {
                          __html: t('checkout.onlinePayDesc').replace(
                            '{amount}',
                            total
                          ),
                        },
                      }}
                    />

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
                        {t('checkout.onlineNotAvailable')}
                        <br />
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>
                          {t('checkout.onlineNotAvailableDesc')}
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
                              {copiedKey === p.key
                                ? t('checkout.copied')
                                : t('checkout.copy')}
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
                            {t('checkout.transactionId')}{' '}
                            <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={onlineTrxId}
                            onChange={(e) => setOnlineTrxId(e.target.value)}
                            placeholder={t('checkout.transactionIdPlaceholder')}
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
                            {t('checkout.transactionIdHint')}
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
                {placing ? t('checkout.placingOrder') : t('checkout.placeOrder')}
              </button>
            </div>

            <div className="checkout-summary checkout-card">
              <span className="section-label">
                {t('checkout.orderSummary')}
              </span>
              <h2>{t('checkout.yourOrder')}</h2>

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
                      {t('checkout.deliveryLabel')}{' '}
                      {finalDeliveryFee === 0
                        ? t('checkout.free')
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
                  {t('checkout.zoneLabel')} {selectedZone.name}
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
                        <small>
                          {t('checkout.quantityX').replace(
                            '{n}',
                            item.quantity
                          )}
                        </small>
                      </div>
                    </div>
                    <strong>৳{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-item">
                <span>{t('checkout.subtotal')}</span>
                <strong>৳{subtotal}</strong>
              </div>

              <div className="summary-item">
                <span>
                  {t('checkout.deliveryFee')}{' '}
                  {settings.freeDeliveryThreshold > 0 && (
                    <small>
                      {t('checkout.freeOn').replace(
                        '{amount}',
                        settings.freeDeliveryThreshold
                      )}
                    </small>
                  )}
                </span>
                <strong>
                  {finalDeliveryFee === 0
                    ? t('checkout.free')
                    : `৳${finalDeliveryFee}`}
                </strong>
              </div>

              {couponApplied && (
                <div className="summary-item discount-item">
                  <span>{t('checkout.couponDiscount')}</span>
                  <strong>-৳{couponDiscount}</strong>
                </div>
              )}
              {usingPoints && (
                <div className="summary-item discount-item">
                  <span>{t('checkout.pointsDiscount')}</span>
                  <strong>-৳{pointsDiscount}</strong>
                </div>
              )}
              {usingWallet && (
                <div className="summary-item discount-item">
                  <span>{t('checkout.walletDiscount')}</span>
                  <strong>-৳{walletDiscount}</strong>
                </div>
              )}

              <div className="summary-total">
                <span>{t('checkout.total')}</span>
                <strong>৳{total}</strong>
              </div>

              <div className="checkout-note">
                {t('checkout.secureNote')}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE STICKY PLACE ORDER BAR (hidden on desktop) */}
        {/* ============================================================ */}
        {cartItems.length > 0 && (
          <div className="mobile-checkout-bar">
            <div className="mobile-checkout-bar-info">
              <strong>৳{total}</strong>
              <span>
                {cartItems.reduce((s, i) => s + i.quantity, 0) === 1
                  ? t('checkout.mobileItemSingular').replace(
                      '{n}',
                      cartItems.reduce((s, i) => s + i.quantity, 0)
                    )
                  : t('checkout.mobileItemPlural').replace(
                      '{n}',
                      cartItems.reduce((s, i) => s + i.quantity, 0)
                    )}{' '}
                •{' '}
                {paymentMethod === 'cod'
                  ? t('checkout.mobileCOD')
                  : paymentMethod === 'online'
                  ? t('checkout.mobileOnline')
                  : t('checkout.mobileWallet')}
              </span>
            </div>
            <button onClick={placeOrder} disabled={placing}>
              {placing ? t('checkout.placing') : t('checkout.placeOrder')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default CheckoutPage