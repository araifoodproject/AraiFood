// ============================================================
// src/pages/PharmacyCheckoutPage.jsx
// Pharmacy-specific checkout (separate from food)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MapPicker from '../components/MapPicker'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import {
  collection,
  addDoc,
  serverTimestamp,
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

function PharmacyCheckoutPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()

  const [cartItems, setCartItems] = useState([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const savedAddress = JSON.parse(localStorage.getItem('savedAddress') || 'null')

  const [fullName, setFullName] = useState(savedAddress?.fullName || '')
  const [phone, setPhone] = useState(savedAddress?.phone || '')
  const [address, setAddress] = useState(savedAddress?.address || '')
  const [saveAddress, setSaveAddress] = useState(Boolean(savedAddress))
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [usingWallet, setUsingWallet] = useState(false)
  const [usingPoints, setUsingPoints] = useState(false)

  const [mapPosition, setMapPosition] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [deliveryZones, setDeliveryZones] = useState([])
  const [selectedZoneId, setSelectedZoneId] = useState('')

  // Load pharmacy cart
  useEffect(() => {
    const items = JSON.parse(
      localStorage.getItem('pharmacyCartItems') || '[]'
    )
    setCartItems(items)

    const savedLoc = JSON.parse(
      localStorage.getItem('deliveryLocation') || 'null'
    )
    if (savedLoc?.lat && savedLoc?.lng) setMapPosition(savedLoc)

    const savedZone = localStorage.getItem('deliveryZoneId')
    if (savedZone) setSelectedZoneId(savedZone)

    // Load user data
    const loadUserData = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setLoyaltyPoints(data.loyaltyPoints || 0)
            setWalletBalance(data.walletBalance || 0)
          }
        } catch (err) {
          console.error('User load error:', err)
        }
      }
    }
    loadUserData()
  }, [])

  // Load zones
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'deliveryZones'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setDeliveryZones(list)
      }
    )
    return () => unsub()
  }, [])

  const selectedZone = useMemo(
    () => deliveryZones.find((z) => z.firebaseId === selectedZoneId) || null,
    [deliveryZones, selectedZoneId]
  )

  const pharmacy =
    cartItems.length > 0
      ? {
          pharmacyId: cartItems[0].pharmacyId,
          pharmacyName: cartItems[0].pharmacyName,
          pharmacyLogo: cartItems[0].pharmacyLogo || '',
          deliveryFee: cartItems[0].deliveryFee ?? null,
          deliveryTime: cartItems[0].deliveryTime || '20-30 min',
        }
      : null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // Delivery fee: zone fee > pharmacy fee > settings default
  const deliveryFee = useMemo(() => {
    if (selectedZone?.deliveryFee != null) return selectedZone.deliveryFee
    if (pharmacy?.deliveryFee != null) return pharmacy.deliveryFee
    return settings.defaultDeliveryFee || 30
  }, [selectedZone, pharmacy, settings.defaultDeliveryFee])

  const pointsDiscount = usingPoints
    ? Math.min(loyaltyPoints / 10, subtotal)
    : 0
  const walletDiscount = usingWallet
    ? Math.min(walletBalance, subtotal - pointsDiscount)
    : 0
  const total = subtotal + deliveryFee - pointsDiscount - walletDiscount

  // ============================================================
  // PLACE ORDER
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

    const newOrderId = `PH-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderId(newOrderId)

    try {
      await addDoc(collection(db, 'orders'), {
        orderId: newOrderId,
        orderType: 'pharmacy', // ← distinguish from food orders
        userId: auth.currentUser?.uid || 'guest',
        userEmail: auth.currentUser?.email || 'guest',

        // Pharmacy info
        pharmacyId: pharmacy.pharmacyId,
        pharmacyName: pharmacy.pharmacyName,
        pharmacyLogo: pharmacy.pharmacyLogo,
        // Also set restaurantId=pharmacyId for rider app compatibility
        restaurantId: pharmacy.pharmacyId,
        restaurantName: pharmacy.pharmacyName,
        restaurantLogo: pharmacy.pharmacyLogo,

        items: cartItems,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,
        fullName: fullName,
        phone: phone,
        address: address,
        orderNote: orderNote,
        paymentMethod: paymentMethod,
        location: mapPosition,
        zoneId: selectedZone?.firebaseId || null,
        zoneName: selectedZone?.name || null,
        zoneDeliveryFee: selectedZone?.deliveryFee || null,

        status: 'pending',
        riderStatus: 'available',
        riderId: null,
        riderName: null,
        riderPhone: null,
        riderRating: null,
        deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp(),
      })

      // Deduct wallet points if used
      if (auth.currentUser?.uid) {
        const userRef = doc(db, 'users', auth.currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          let newPoints = userData.loyaltyPoints || 0
          let newBalance = userData.walletBalance || 0
          const newTx = []

          if (usingPoints) {
            newPoints = Math.max(0, newPoints - pointsDiscount * 10)
          }
          if (usingWallet) {
            newBalance = Math.max(0, newBalance - walletDiscount)
            newTx.push({
              id: Date.now().toString() + '-pharmacy',
              type: 'debit',
              amount: walletDiscount,
              date: new Date().toLocaleDateString(),
              description: `Pharmacy order ${newOrderId}`,
            })
          }
          if (paymentMethod === 'wallet') {
            newBalance = Math.max(0, newBalance - total)
            newTx.push({
              id: Date.now().toString() + '-phfull',
              type: 'debit',
              amount: total,
              date: new Date().toLocaleDateString(),
              description: `Pharmacy full payment ${newOrderId}`,
            })
          }

          const earnedPoints = Math.floor(total * 0.05)
          newPoints += earnedPoints

          await updateDoc(userRef, {
            loyaltyPoints: newPoints,
            walletBalance: newBalance,
            walletTransactions:
              newTx.length > 0 ? arrayUnion(...newTx) : arrayUnion(),
            pointsHistory: arrayUnion({
              id: Date.now().toString() + '-phearned',
              amount: earnedPoints,
              date: new Date().toLocaleDateString(),
              description: `Pharmacy order ${newOrderId}`,
            }),
          })

          setLoyaltyPoints(newPoints)
          setWalletBalance(newBalance)
        }
      }

      // Notifications
      const customerId = auth.currentUser?.uid || 'guest'
      await sendNotification(
        customerId,
        '💊 Pharmacy Order Placed!',
        `Your order ${newOrderId} from ${pharmacy.pharmacyName} has been received.`,
        'order',
        { orderId: newOrderId }
      )
      await sendNotification(
        'admin',
        '🆕 New Pharmacy Order',
        `${pharmacy.pharmacyName} — ৳${total}`,
        'order',
        { orderId: newOrderId }
      )

      // Local history
      const history = JSON.parse(
        localStorage.getItem('orderHistory') || '[]'
      )
      history.unshift({
        id: newOrderId,
        date: new Date().toLocaleDateString(),
        restaurantName: pharmacy.pharmacyName,
        restaurantId: pharmacy.pharmacyId,
        restaurantLogo: pharmacy.pharmacyLogo,
        items: cartItems,
        total: total,
        status: 'pending',
        orderType: 'pharmacy',
      })
      localStorage.setItem('orderHistory', JSON.stringify(history))

      setOrderPlaced(true)
      localStorage.removeItem('pharmacyCartItems')
      window.dispatchEvent(new Event('pharmacyCartUpdated'))
      window.scrollTo(0, 0)
      toast.success('✅ Pharmacy order placed!')
    } catch (err) {
      console.error('Order error:', err)
      toast.error('Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="order-success-container">
          <PageBackButton label="Back to Home" fallback="/" />

          <div className="order-success-icon">💊</div>
          <h1>Order Placed Successfully!</h1>
          <p>
            Your order <strong>{orderId}</strong> has been received.
          </p>
          <p style={{ marginTop: '10px' }}>
            From: <strong>{pharmacy?.pharmacyName}</strong>
          </p>

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
      </div>
    )
  }

  // ============================================================
  // EMPTY CART
  // ============================================================
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <PageBackButton label="Back" fallback="/pharmacy" />
          <div className="restaurant-empty-state" style={{ marginTop: '40px' }}>
            <div className="empty-icon">💊</div>
            <h2>Your pharmacy cart is empty</h2>
            <p>Add medicines to continue</p>
            <Link
              to="/pharmacy"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              Browse Pharmacies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // FORM
  // ============================================================
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <PageBackButton label="Back" fallback="/pharmacy" />
          <div className="checkout-title">
            <span className="glass-section-label">PHARMACY CHECKOUT</span>
            <h1>Complete Your Order</h1>
            <p>Your medicines will be delivered to your doorstep.</p>
          </div>
        </div>

        <div className="checkout-content">
          {/* LEFT: FORM */}
          <div className="delivery-form checkout-card">
            <div className="checkout-card-heading">
              <div className="checkout-icon">📍</div>
              <div>
                <h2>Delivery Information</h2>
                <p>Where should we deliver?</p>
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

            {/* Zone */}
            <div className="zone-selection-section">
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
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
                onChange={(e) => setSelectedZoneId(e.target.value)}
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
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">— Select your area —</option>
                {deliveryZones.map((z) => (
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
                    background: 'rgba(5,150,105,0.1)',
                    border: '1px solid rgba(5,150,105,0.25)',
                    color: '#059669',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  ✅ {selectedZone.name} — Delivery ৳{selectedZone.deliveryFee}
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

            {/* Map */}
            <div className="map-selection-section">
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
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

            <div className="form-group">
              <label>Order Note (Optional)</label>
              <textarea
                placeholder="Special instructions..."
                rows="3"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              ></textarea>
            </div>

            {/* Wallet / Points */}
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

            {/* Payment */}
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
                  <small>Pay when medicines arrive</small>
                </label>
                <label
                  className={`payment-option ${
                    paymentMethod === 'mobile' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'mobile'}
                    onChange={() => setPaymentMethod('mobile')}
                  />
                  <strong>📱 Mobile Banking</strong>
                  <small>bKash / Nagad / Rocket</small>
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
            </div>

            <button
              className="place-order-button"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing Order...' : 'Place Order →'}
            </button>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="checkout-summary checkout-card">
            <span className="section-label">ORDER SUMMARY</span>
            <h2>Your Medicines</h2>

            {pharmacy && (
              <div className="summary-restaurant">
                <div className="summary-restaurant-logo">
                  {pharmacy.pharmacyLogo ? (
                    <img src={pharmacy.pharmacyLogo} alt="logo" />
                  ) : (
                    <span>💊</span>
                  )}
                </div>
                <div>
                  <strong>{pharmacy.pharmacyName}</strong>
                  <small>
                    Delivery: ৳{deliveryFee} · {pharmacy.deliveryTime}
                  </small>
                </div>
              </div>
            )}

            {selectedZone && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(5,150,105,0.08)',
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
                        <span>{item.emoji || '💊'}</span>
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
              <span>Delivery Fee</span>
              <strong>৳{deliveryFee}</strong>
            </div>

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

export default PharmacyCheckoutPage