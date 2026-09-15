import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MapPicker from '../components/MapPicker'
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { toast } from 'react-toastify'
import { sendNotification } from '../utils/sendNotification'

const deliveryZone = [
  { lat: 23.7681, lng: 90.6170 },
  { lat: 23.7923, lng: 90.6089 },
  { lat: 23.8120, lng: 90.6606 },
  { lat: 23.7976, lng: 90.6923 },
  { lat: 23.7762, lng: 90.6594 },
  { lat: 23.7598, lng: 90.6300 },
  { lat: 23.7681, lng: 90.6170 }
]

function CheckoutPage() {
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

  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [usingPoints, setUsingPoints] = useState(false)
  const [usingWallet, setUsingWallet] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)

  const [freeDelivery, setFreeDelivery] = useState(false)
  const [mapPosition, setMapPosition] = useState(null)
  const [outsideArea, setOutsideArea] = useState(false)
  const [placing, setPlacing] = useState(false)

  // ============ LOAD USER DATA FROM FIREBASE ============
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
    setCartItems(items)

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

  const restaurant = cartItems.length > 0 ? {
    restaurantId: cartItems[0].restaurantId,
    restaurantName: cartItems[0].restaurantName,
    restaurantLogo: cartItems[0].restaurantLogo || '',
    deliveryFee: cartItems[0].deliveryFee || 30,
  } : null

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = restaurant?.deliveryFee || 0

  useEffect(() => {
    setFreeDelivery(subtotal >= 500)
  }, [subtotal])

  const finalDeliveryFee = freeDelivery ? 0 : deliveryFee

  const applyCoupon = () => {
    setCouponError('')
    const code = couponCode.trim().toUpperCase()

    if (code === 'SAVE10') {
      setCouponDiscount(Math.round(subtotal * 0.10))
      setCouponApplied(true)
    } else if (code === 'WELCOME20') {
      setCouponDiscount(Math.round(subtotal * 0.20))
      setCouponApplied(true)
    } else if (code === 'FREEDEL') {
      setCouponDiscount(finalDeliveryFee)
      setCouponApplied(true)
    } else {
      setCouponError('Invalid coupon code. Please try again.')
      setCouponApplied(false)
      setCouponDiscount(0)
    }
  }

  const pointsDiscount = usingPoints ? Math.min(loyaltyPoints / 10, subtotal) : 0
  const walletDiscount = usingWallet ? Math.min(walletBalance, subtotal - pointsDiscount - couponDiscount) : 0
  const total = subtotal + finalDeliveryFee - couponDiscount - pointsDiscount - walletDiscount

  const isInsideDeliveryZone = (point) => {
    let isInside = false
    const lat = point.lat
    const lng = point.lng
    for (let i = 0, j = deliveryZone.length - 1; i < deliveryZone.length; j = i++) {
      const xi = deliveryZone[i].lat
      const yi = deliveryZone[i].lng
      const xj = deliveryZone[j].lat
      const yj = deliveryZone[j].lng
      const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)
      if (intersect) isInside = !isInside
    }
    return isInside
  }

  const placeOrder = async () => {
    if (!fullName.trim()) { alert('Please enter your full name.'); return }
    if (!phone.trim()) { alert('Please enter your phone number.'); return }
    if (!address.trim()) { alert('Please enter your delivery address.'); return }
    if (cartItems.length === 0) { alert('Your cart is empty.'); return }
    if (mapPosition && !isInsideDeliveryZone(mapPosition)) { setOutsideArea(true); return }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      alert('Insufficient wallet balance.')
      return
    }

    setPlacing(true)

    if (saveAddress) {
      localStorage.setItem('savedAddress', JSON.stringify({ fullName, phone, address }))
    } else {
      localStorage.removeItem('savedAddress')
    }

    if (mapPosition) {
      localStorage.setItem('deliveryLocation', JSON.stringify(mapPosition))
    }

    const newOrderId = `AF-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderId(newOrderId)

    try {
      // ============ SAVE ORDER TO FIREBASE ============
      await addDoc(collection(db, 'orders'), {
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
        paymentMethod: paymentMethod,
        location: mapPosition,
        status: 'pending',
        riderStatus: 'available',
        deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp()
      })

      // ============ UPDATE USER WALLET & POINTS IN FIREBASE ============
      if (auth.currentUser?.uid) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          let newPoints = userData.loyaltyPoints || 0
          let newBalance = userData.walletBalance || 0
          const newTransactions = []

          // Deduct Points if used
          if (usingPoints) {
            const pointsUsed = pointsDiscount * 10
            newPoints = Math.max(0, newPoints - pointsUsed)
          }

          // Deduct Wallet if used (partial)
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

          // Full Wallet Payment
          if (paymentMethod === 'wallet') {
            const fullDeduction = total
            newBalance = Math.max(0, newBalance - fullDeduction)
            newTransactions.push({
              id: Date.now().toString() + '-fullwallet',
              type: 'debit',
              amount: fullDeduction,
              date: new Date().toLocaleDateString(),
              description: `Full payment for order ${newOrderId}`,
            })
          }

          // Earn Points (5% of total)
          const earnedPoints = Math.floor(total * 0.05)
          newPoints = newPoints + earnedPoints

          const pointsLogEntry = {
            id: Date.now().toString() + '-earned',
            amount: earnedPoints,
            date: new Date().toLocaleDateString(),
            description: `Earned from order ${newOrderId}`,
          }

          await updateDoc(userDocRef, {
            loyaltyPoints: newPoints,
            walletBalance: newBalance,
            walletTransactions: newTransactions.length > 0 ? arrayUnion(...newTransactions) : arrayUnion(),
            pointsHistory: arrayUnion(pointsLogEntry),
          })

          setLoyaltyPoints(newPoints)
          setWalletBalance(newBalance)
        }
      }

      // ============ SEND NOTIFICATIONS ============
      const customerId = auth.currentUser?.uid || 'guest'
      await sendNotification(customerId, '✅ Order Placed Successfully!', `Your order ${newOrderId} from ${restaurant.restaurantName} has been received.`, 'order', { orderId: newOrderId })
      await sendNotification(restaurant.restaurantId, '🔔 New Order Received!', `New order ${newOrderId} — ৳${total}`, 'restaurant', { orderId: newOrderId })
      await sendNotification('admin', '🆕 New Order Placed', `Order ${newOrderId} from ${restaurant.restaurantName} — ৳${total}`, 'order', { orderId: newOrderId })

      // ============ SAVE TO LOCALSTORAGE (Backup) ============
      const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]')
      orderHistory.unshift({
        id: newOrderId,
        date: new Date().toLocaleDateString(),
        restaurantName: restaurant.restaurantName,
        restaurantId: restaurant.restaurantId,
        restaurantLogo: restaurant.restaurantLogo,
        items: cartItems,
        total: total,
        status: 'pending',
        deliveryTime,
        timeSlot
      })
      localStorage.setItem('orderHistory', JSON.stringify(orderHistory))

      setOrderPlaced(true)
      setTrackingStage(0)
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
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [orderPlaced])

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="order-success-container">
          <div className="order-success-icon">✅</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order <strong>{orderId}</strong> has been received.</p>
          <p style={{ marginTop: '10px' }}>From: <strong>{restaurant.restaurantName}</strong></p>

          <div className="order-tracking-section">
            <h2 style={{ marginBottom: '20px', marginTop: '30px' }}>Track Your Order</h2>
            <div className="tracking-progress">
              <div className={`tracking-step ${trackingStage >= 0 ? 'active' : ''}`}>
                <div className="tracking-icon">👨‍🍳</div>
                <div className="tracking-text"><strong>Preparing</strong><small>Cooking</small></div>
              </div>
              <div className={`tracking-line ${trackingStage >= 1 ? 'active' : ''}`}></div>
              <div className={`tracking-step ${trackingStage >= 1 ? 'active' : ''}`}>
                <div className="tracking-icon">🛵</div>
                <div className="tracking-text"><strong>On the Way</strong><small>Rider coming</small></div>
              </div>
              <div className={`tracking-line ${trackingStage >= 2 ? 'active' : ''}`}></div>
              <div className={`tracking-step ${trackingStage >= 2 ? 'active' : ''}`}>
                <div className="tracking-icon">🏠</div>
                <div className="tracking-text"><strong>Delivered</strong><small>Enjoy!</small></div>
              </div>
            </div>

            {trackingStage >= 1 && (
              <div className="rider-profile-card">
                <div className="rider-avatar">🛵</div>
                <div className="rider-info">
                  <strong>Rider: Rahim Uddin</strong>
                  <small>⭐ 4.9 (200+ deliveries)</small>
                </div>
                <button className="call-rider-button" onClick={() => alert('Calling rider...')}>📞 Call</button>
              </div>
            )}

            <p className="tracking-status-text">
              {trackingStage === 0 && '⏳ Your order is being prepared...'}
              {trackingStage === 1 && '🛵 Your rider is on the way!'}
              {trackingStage === 2 && '✅ Your food has been delivered. Enjoy!'}
            </p>
          </div>

          <div className="order-success-buttons">
            <Link to="/track-order?id={orderId}" className="checkout-button" style={{ textDecoration: 'none', marginRight: '10px', background: '#13a89e' }}>🛵 Track Order</Link>
            <Link to="/" className="checkout-button" style={{ textDecoration: 'none' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <button className="checkout-back-button" onClick={() => window.history.back()}>← Back to Menu</button>
          <div className="checkout-title">
            <span className="section-label">CHECKOUT</span>
            <h1>Complete Your Order</h1>
            <p>Just a few details and your delicious food will be on its way.</p>
          </div>
        </div>

        <div className="checkout-content">
          <div className="delivery-form checkout-card">
            <div className="checkout-card-heading">
              <div className="checkout-icon">📍</div>
              <div><h2>Delivery Information</h2><p>Where should we deliver your order?</p></div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea placeholder="Enter your full delivery address" rows="4" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
            </div>

            <div className="map-selection-section">
              <h3>Choose Location on Map</h3>
              <MapPicker position={mapPosition} setPosition={setMapPosition} />
              {mapPosition && (
                <p className="selected-location">📍 Location: {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}</p>
              )}
            </div>

            <label className="save-address-option">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              <span>💾 Save this address for future orders</span>
            </label>

            <div className="delivery-time-section">
              <div className="checkout-icon-container">
                <div className="checkout-icon">⏰</div>
                <div><h2>Delivery Time</h2><p>When do you want your food?</p></div>
              </div>
              <div className="delivery-time-options">
                <label className={`delivery-time-option ${deliveryTime === 'asap' ? 'selected' : ''}`}>
                  <input type="radio" name="deliveryTime" checked={deliveryTime === 'asap'} onChange={() => setDeliveryTime('asap')} />
                  <div><strong>⚡ ASAP</strong><small>30-40 minutes</small></div>
                </label>
                <label className={`delivery-time-option ${deliveryTime === '1hour' ? 'selected' : ''}`}>
                  <input type="radio" name="deliveryTime" checked={deliveryTime === '1hour'} onChange={() => setDeliveryTime('1hour')} />
                  <div><strong>⏱️ 1 Hour</strong><small>Within 60 minutes</small></div>
                </label>
                <label className={`delivery-time-option ${deliveryTime === '2hours' ? 'selected' : ''}`}>
                  <input type="radio" name="deliveryTime" checked={deliveryTime === '2hours'} onChange={() => setDeliveryTime('2hours')} />
                  <div><strong>🕑 2 Hours</strong><small>Within 120 minutes</small></div>
                </label>
              </div>
            </div>

            {deliveryTime !== 'asap' && (
              <div className="time-slot-section">
                <label>Select Time Slot</label>
                <div className="time-slot-options">
                  <button className={`time-slot-btn ${timeSlot === '6-7pm' ? 'active' : ''}`} onClick={() => setTimeSlot('6-7pm')}>6-7 PM</button>
                  <button className={`time-slot-btn ${timeSlot === '7-8pm' ? 'active' : ''}`} onClick={() => setTimeSlot('7-8pm')}>7-8 PM</button>
                  <button className={`time-slot-btn ${timeSlot === '8-9pm' ? 'active' : ''}`} onClick={() => setTimeSlot('8-9pm')}>8-9 PM</button>
                  <button className={`time-slot-btn ${timeSlot === '9-10pm' ? 'active' : ''}`} onClick={() => setTimeSlot('9-10pm')}>9-10 PM</button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Order Note (Optional)</label>
              <textarea placeholder="Special instructions..." rows="3" value={orderNote} onChange={(e) => setOrderNote(e.target.value)}></textarea>
            </div>

            <div className="coupon-section-checkout">
              <h3>Apply Coupon</h3>
              <div className="coupon-input-group">
                <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); setCouponApplied(false); setCouponDiscount(0) }} />
                <button onClick={applyCoupon}>Apply</button>
              </div>
              {couponError && <p className="coupon-error">{couponError}</p>}
              {couponApplied && <p className="coupon-success">Coupon applied! You saved ৳{couponDiscount}</p>}
            </div>

            <div className="payment-rewards-section">
              <h3>Use Rewards</h3>
              <div className="reward-options">
                <label className={`reward-option ${usingPoints ? 'active' : ''}`}>
                  <input type="checkbox" checked={usingPoints} onChange={() => setUsingPoints(!usingPoints)} />
                  <div><strong>⭐ Use {loyaltyPoints} Points</strong><small>Get ৳{Math.min(loyaltyPoints / 10, subtotal).toFixed(0)} discount</small></div>
                </label>
                <label className={`reward-option ${usingWallet ? 'active' : ''}`}>
                  <input type="checkbox" checked={usingWallet} onChange={() => setUsingWallet(!usingWallet)} />
                  <div><strong>💳 Use ৳{walletBalance.toFixed(2)} Wallet</strong><small>Pay from wallet</small></div>
                </label>
              </div>
            </div>

            <div className="payment-section">
              <div className="payment-heading">
                <div className="checkout-icon">💳</div>
                <div><h2>Payment Method</h2><p>Choose how you want to pay.</p></div>
              </div>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div><strong>💵 Cash on Delivery</strong><small>Pay when food arrives</small></div>
                </label>
                <label className={`payment-option ${paymentMethod === 'mobile' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'mobile'} onChange={() => setPaymentMethod('mobile')} />
                  <div><strong>📱 Mobile Banking</strong><small>bKash / Nagad / Rocket</small></div>
                </label>
                <label className={`payment-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                  <div><strong>💳 Wallet Payment</strong><small>Pay using ৳{walletBalance.toFixed(2)}</small></div>
                </label>
              </div>
            </div>

            <button className="place-order-button" onClick={placeOrder} disabled={placing}>
              {placing ? 'Placing Order...' : 'Place Order →'}
            </button>
          </div>

          <div className="checkout-summary checkout-card">
            <span className="section-label">ORDER SUMMARY</span>
            <h2>Your Order</h2>

            {restaurant && (
              <div className="summary-restaurant">
                <div className="summary-restaurant-logo">
                  {restaurant.restaurantLogo ? <img src={restaurant.restaurantLogo} alt="logo" /> : <span>🏪</span>}
                </div>
                <div>
                  <strong>{restaurant.restaurantName}</strong>
                  <small>Delivery: {finalDeliveryFee === 0 ? 'FREE' : `৳${finalDeliveryFee}`}</small>
                </div>
              </div>
            )}

            <div className="summary-items">
              {cartItems.map((item) => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-with-image">
                    <div className="summary-item-image">
                      {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.emoji}</span>}
                    </div>
                    <div><span>{item.name}</span><small>Quantity × {item.quantity}</small></div>
                  </div>
                  <strong>৳{item.price * item.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item"><span>Subtotal</span><strong>৳{subtotal}</strong></div>
            <div className="summary-item">
              <span>Delivery Fee {freeDelivery && <small>(Free on ৳500+)</small>}</span>
              <strong>{finalDeliveryFee === 0 ? 'FREE' : `৳${finalDeliveryFee}`}</strong>
            </div>

            {couponApplied && <div className="summary-item discount-item"><span>Coupon Discount</span><strong>-৳{couponDiscount}</strong></div>}
            {usingPoints && <div className="summary-item discount-item"><span>Points Discount</span><strong>-৳{pointsDiscount}</strong></div>}
            {usingWallet && <div className="summary-item discount-item"><span>Wallet Discount</span><strong>-৳{walletDiscount}</strong></div>}

            <div className="summary-total"><span>Total</span><strong>৳{total}</strong></div>

            <div className="checkout-note">🔒 Your order information is secure.</div>
          </div>
        </div>
      </div>

      {outsideArea && (
        <div className="outside-area-modal">
          <div className="outside-area-modal-content">
            <div className="outside-area-icon">🚫</div>
            <h2>Outside Delivery Area</h2>
            <p>Sorry! We currently only deliver within <strong>Araihazar Thana</strong>.</p>
            <button className="outside-area-close-btn" onClick={() => setOutsideArea(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage