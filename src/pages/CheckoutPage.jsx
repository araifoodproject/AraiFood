import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MapPicker from '../components/MapPicker'

// Araihazar Thana-র সঠিক সিরিয়ালে ১৭টা পয়েন্ট
const deliveryZone = [
  { lat: 23.7591, lng: 90.6203 },  // 1
  { lat: 23.7801, lng: 90.6146 },  // 2
  { lat: 23.7922, lng: 90.6088 },  // 3
  { lat: 23.8008, lng: 90.6234 },  // 4
  { lat: 23.8040, lng: 90.6335 },  // 5
  { lat: 23.8035, lng: 90.6339 },  // 6 (নতুন)
  { lat: 23.8118, lng: 90.6604 },  // 7 (নতুন)
  { lat: 23.7986, lng: 90.6799 },  // 8 (নতুন)
  { lat: 23.7842, lng: 90.6710 },  // 9 (নতুন)
  { lat: 23.8050, lng: 90.6717 },  // 10
  { lat: 23.7997, lng: 90.6630 },  // 11
  { lat: 23.7984, lng: 90.6524 },  // 12
  { lat: 23.7972, lng: 90.6348 },  // 13
  { lat: 23.7889, lng: 90.6623 },  // 14
  { lat: 23.7821, lng: 90.6569 },  // 15
  { lat: 23.7737, lng: 90.6499 },  // 16
  { lat: 23.7609, lng: 90.6224 }   // 17
]

function CheckoutPage() {
  const [cartItems, setCartItems] = useState([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  
  // Delivery Time State
  const [deliveryTime, setDeliveryTime] = useState('asap')
  const [timeSlot, setTimeSlot] = useState('')

  // Order Note State
  const [orderNote, setOrderNote] = useState('')

  // Tracking Stage State
  const [trackingStage, setTrackingStage] = useState(0)

  // Auto-fill Address from localStorage
  const savedAddress = JSON.parse(localStorage.getItem('savedAddress') || 'null')

  const [fullName, setFullName] = useState(savedAddress?.fullName || '')
  const [phone, setPhone] = useState(savedAddress?.phone || '')
  const [address, setAddress] = useState(savedAddress?.address || '')
  const [saveAddress, setSaveAddress] = useState(Boolean(savedAddress))
  const [paymentMethod, setPaymentMethod] = useState('cod')

  // Loyalty Points & Wallet
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [usingPoints, setUsingPoints] = useState(false)
  const [usingWallet, setUsingWallet] = useState(false)

  // Coupon Code
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)

  // Free Delivery Threshold (৳500+)
  const [freeDelivery, setFreeDelivery] = useState(false)

  // Map Location
  const [mapPosition, setMapPosition] = useState(null)

  // Outside Service Area Modal
  const [outsideArea, setOutsideArea] = useState(false)

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
    setCartItems(items)

    // Load Loyalty Points
    const savedPoints = parseInt(localStorage.getItem('loyaltyPoints') || '0', 10)
    setLoyaltyPoints(savedPoints)

    // Load Wallet Balance
    const savedWallet = parseFloat(localStorage.getItem('walletBalance') || '0')
    setWalletBalance(savedWallet)
  }, [])

  // Calculate Subtotal & Delivery Fee
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  // Free Delivery on ৳500+
  const deliveryFee = subtotal >= 500 ? 0 : 30
  useEffect(() => {
    setFreeDelivery(subtotal >= 500)
  }, [subtotal])

  // Coupon Discount Calculation
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
      setCouponDiscount(deliveryFee)
      setCouponApplied(true)
    } else {
      setCouponError('Invalid coupon code. Please try again.')
      setCouponApplied(false)
      setCouponDiscount(0)
    }
  }

  // Final Calculations
  const pointsDiscount = usingPoints ? Math.min(loyaltyPoints / 10, subtotal) : 0
  const walletDiscount = usingWallet ? Math.min(walletBalance, subtotal - pointsDiscount - couponDiscount) : 0
  const total = subtotal + deliveryFee - couponDiscount - pointsDiscount - walletDiscount

  // Point in Polygon Check
  const isInsideDeliveryZone = (point) => {
    let isInside = false
    const lat = point.lat
    const lng = point.lng

    for (let i = 0, j = deliveryZone.length - 1; i < deliveryZone.length; j = i++) {
      const xi = deliveryZone[i].lat
      const yi = deliveryZone[i].lng
      const xj = deliveryZone[j].lat
      const yj = deliveryZone[j].lng

      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)

      if (intersect) {
        isInside = !isInside
      }
    }

    return isInside
  }

  const placeOrder = () => {
    if (!fullName.trim()) {
      alert('Please enter your full name.')
      return
    }

    if (!phone.trim()) {
      alert('Please enter your phone number.')
      return
    }

    if (!address.trim()) {
      alert('Please enter your delivery address.')
      return
    }

    // Outside Service Area Check
    if (mapPosition && !isInsideDeliveryZone(mapPosition)) {
      setOutsideArea(true)
      return
    }

    // Wallet Payment Check
    if (paymentMethod === 'wallet' && walletBalance < total) {
      alert('Insufficient wallet balance. Please add money to your wallet.')
      return
    }

    if (saveAddress) {
      localStorage.setItem('savedAddress', JSON.stringify({
        fullName,
        phone,
        address,
      }))
    } else {
      localStorage.removeItem('savedAddress')
    }

    // Save Map Location
    if (mapPosition) {
      localStorage.setItem('deliveryLocation', JSON.stringify(mapPosition))
    }

    // Generate Random Order ID
    const newOrderId = `AF-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderId(newOrderId)

    // Save Delivery Time & Time Slot
    localStorage.setItem('deliveryTime', deliveryTime)
    localStorage.setItem('timeSlot', timeSlot)

    // Save Order Note
    localStorage.setItem('orderNote', orderNote)

    // Coupon Code Save
    localStorage.setItem('couponCode', couponCode)

    // Points & Wallet Update
    if (usingPoints) {
      const newPoints = loyaltyPoints - (pointsDiscount * 10)
      localStorage.setItem('loyaltyPoints', JSON.stringify(newPoints))
      setLoyaltyPoints(newPoints)
    }

    if (usingWallet) {
      const newBalance = walletBalance - walletDiscount
      localStorage.setItem('walletBalance', JSON.stringify(newBalance))
      setWalletBalance(newBalance)
    }

    // Wallet Payment
    if (paymentMethod === 'wallet') {
      const newBalance = walletBalance - total
      localStorage.setItem('walletBalance', JSON.stringify(newBalance))
      setWalletBalance(newBalance)
    }

    // Earn new loyalty points (5% of total)
    const newEarnedPoints = Math.floor(total * 0.05)
    const finalPoints = parseInt(localStorage.getItem('loyaltyPoints') || '0', 10) + newEarnedPoints
    localStorage.setItem('loyaltyPoints', JSON.stringify(finalPoints))

    // Save Order History
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]')
    const newOrder = {
      id: newOrderId,
      date: new Date().toLocaleDateString(),
      items: cartItems,
      total: total,
      deliveryTime: deliveryTime,
      timeSlot: timeSlot,
      couponCode: couponCode,
      couponDiscount: couponDiscount,
      freeDelivery: freeDelivery,
      paymentMethod: paymentMethod,
      location: mapPosition
    }
    orderHistory.unshift(newOrder)
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory))

    // Push Notification
    const notification = {
      title: 'Order Placed Successfully!',
      body: `Your order ${newOrderId} has been received. Tracking your food!`,
      time: new Date().toLocaleTimeString()
    }
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    notifications.unshift(notification)
    localStorage.setItem('notifications', JSON.stringify(notifications))
    window.dispatchEvent(new Event('newNotification'))

    // Order Placed Successfully
    setOrderPlaced(true)
    setTrackingStage(0)

    // Remove items from cart
    localStorage.removeItem('cartItems')

    // Update Navbar Cart Count
    window.dispatchEvent(new Event('cartUpdated'))

    // Scroll to top
    window.scrollTo(0, 0)
  }

  // Effect to automatically progress tracking status
  useEffect(() => {
    if (!orderPlaced) return

    const stage1Timer = setTimeout(() => {
      setTrackingStage(1)
    }, 10000)

    const stage2Timer = setTimeout(() => {
      setTrackingStage(2)
    }, 20000)

    return () => {
      clearTimeout(stage1Timer)
      clearTimeout(stage2Timer)
    }
  }, [orderPlaced])

  // If Order is placed, show success screen with tracking
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="order-success-container">
          <div className="order-success-icon">✅</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order <strong>{orderId}</strong> has been received.</p>
          <p style={{ marginTop: '10px' }}>Our delivery partner will reach you soon. Bon Appétit! 🍽️</p>
          
          {/* Order Tracking Section */}
          <div className="order-tracking-section">
            <h2 style={{ marginBottom: '20px', marginTop: '30px' }}>Track Your Order</h2>
            
            <div className="tracking-progress">
              <div className={`tracking-step ${trackingStage >= 0 ? 'active' : ''}`}>
                <div className="tracking-icon">👨‍🍳</div>
                <div className="tracking-text">
                  <strong>Preparing</strong>
                  <small>Your food is being cooked</small>
                </div>
              </div>

              <div className={`tracking-line ${trackingStage >= 1 ? 'active' : ''}`}></div>

              <div className={`tracking-step ${trackingStage >= 1 ? 'active' : ''}`}>
                <div className="tracking-icon">🛵</div>
                <div className="tracking-text">
                  <strong>On the Way</strong>
                  <small>Rider is coming to you</small>
                </div>
              </div>

              <div className={`tracking-line ${trackingStage >= 2 ? 'active' : ''}`}></div>

              <div className={`tracking-step ${trackingStage >= 2 ? 'active' : ''}`}>
                <div className="tracking-icon">🏠</div>
                <div className="tracking-text">
                  <strong>Delivered</strong>
                  <small>Enjoy your meal!</small>
                </div>
              </div>
            </div>

            {/* Rider Profile Section */}
            {trackingStage >= 1 && (
              <div className="rider-profile-card">
                <div className="rider-avatar">🛵</div>
                <div className="rider-info">
                  <strong>Rider: Rahim Uddin</strong>
                  <small>⭐ 4.9 (200+ deliveries)</small>
                </div>
                <button className="call-rider-button" onClick={() => alert('Calling rider...')}>
                  📞 Call
                </button>
              </div>
            )}

            <p className="tracking-status-text">
              {trackingStage === 0 && '⏳ Your order is being prepared...'}
              {trackingStage === 1 && '🛵 Your rider is on the way!'}
              {trackingStage === 2 && '✅ Your food has been delivered. Enjoy!'}
            </p>
          </div>

          <div className="order-success-buttons">
            <Link to="/" className="checkout-button" style={{ textDecoration: 'none' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* Header */}
        <div className="checkout-header">
          <button className="checkout-back-button" onClick={() => window.history.back()}>
            ← Back to Menu
          </button>

          <div className="checkout-title">
            <span className="section-label">CHECKOUT</span>
            <h1>Complete Your Order</h1>
            <p>Just a few details and your delicious food will be on its way.</p>
          </div>
        </div>

        <div className="checkout-content">

          {/* Delivery Information */}
          <div className="delivery-form checkout-card">
            <div className="checkout-card-heading">
              <div className="checkout-icon">📍</div>
              <div>
                <h2>Delivery Information</h2>
                <p>Where should we deliver your order?</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                placeholder="Enter your full delivery address"
                rows="4"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>

            {/* Map Selection */}
            <div className="map-selection-section">
              <h3>Choose Location on Map</h3>
              <MapPicker position={mapPosition} setPosition={setMapPosition} />
              {mapPosition && (
                <p className="selected-location">
                  📍 Selected Location: {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Save Address */}
            <label className="save-address-option">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              <span>💾 Save this address for future orders</span>
            </label>

            {/* Delivery Time & Time Slot */}
            <div className="delivery-time-section">
              <div className="checkout-icon-container">
                <div className="checkout-icon">⏰</div>
                <div>
                  <h2>Delivery Time</h2>
                  <p>When do you want your food?</p>
                </div>
              </div>
              
              <div className="delivery-time-options">
                <label className={`delivery-time-option ${deliveryTime === 'asap' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryTime"
                    checked={deliveryTime === 'asap'}
                    onChange={() => setDeliveryTime('asap')}
                  />
                  <div>
                    <strong>⚡ ASAP</strong>
                    <small>Delivery within 30-40 minutes</small>
                  </div>
                </label>

                <label className={`delivery-time-option ${deliveryTime === '1hour' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryTime"
                    checked={deliveryTime === '1hour'}
                    onChange={() => setDeliveryTime('1hour')}
                  />
                  <div>
                    <strong>⏱️ 1 Hour</strong>
                    <small>Delivery within 60 minutes</small>
                  </div>
                </label>

                <label className={`delivery-time-option ${deliveryTime === '2hours' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryTime"
                    checked={deliveryTime === '2hours'}
                    onChange={() => setDeliveryTime('2hours')}
                  />
                  <div>
                    <strong>🕑 2 Hours</strong>
                    <small>Delivery within 120 minutes</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Time Slot Selection */}
            {deliveryTime !== 'asap' && (
              <div className="time-slot-section">
                <label>Select Time Slot</label>
                <div className="time-slot-options">
                  <button 
                    className={`time-slot-btn ${timeSlot === '6-7pm' ? 'active' : ''}`}
                    onClick={() => setTimeSlot('6-7pm')}
                  >
                    6-7 PM
                  </button>
                  <button 
                    className={`time-slot-btn ${timeSlot === '7-8pm' ? 'active' : ''}`}
                    onClick={() => setTimeSlot('7-8pm')}
                  >
                    7-8 PM
                  </button>
                  <button 
                    className={`time-slot-btn ${timeSlot === '8-9pm' ? 'active' : ''}`}
                    onClick={() => setTimeSlot('8-9pm')}
                  >
                    8-9 PM
                  </button>
                  <button 
                    className={`time-slot-btn ${timeSlot === '9-10pm' ? 'active' : ''}`}
                    onClick={() => setTimeSlot('9-10pm')}
                  >
                    9-10 PM
                  </button>
                </div>
              </div>
            )}

            {/* Coupon Code */}
            <div className="coupon-section-checkout">
              <h3>Apply Coupon</h3>
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code (SAVE10, WELCOME20, FREEDEL)"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); setCouponApplied(false); setCouponDiscount(0) }}
                />
                <button onClick={applyCoupon}>Apply</button>
              </div>
              {couponError && <p className="coupon-error">{couponError}</p>}
              {couponApplied && <p className="coupon-success">Coupon applied! You saved ৳{couponDiscount}</p>}
            </div>

            {/* Loyalty Points & Wallet */}
            <div className="payment-rewards-section">
              <h3>Use Rewards</h3>
              <div className="reward-options">
                <label className={`reward-option ${usingPoints ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={usingPoints}
                    onChange={() => setUsingPoints(!usingPoints)}
                  />
                  <div>
                    <strong>⭐ Use {loyaltyPoints} Points</strong>
                    <small>Get ৳{loyaltyPoints / 10} discount</small>
                  </div>
                </label>

                <label className={`reward-option ${usingWallet ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={usingWallet}
                    onChange={() => setUsingWallet(!usingWallet)}
                  />
                  <div>
                    <strong>💳 Use ৳{walletBalance.toFixed(2)} Wallet</strong>
                    <small>Pay from your wallet balance</small>
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
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <div>
                    <strong>💵 Cash on Delivery</strong>
                    <small>Pay when your food arrives</small>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'mobile' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'mobile'}
                    onChange={() => setPaymentMethod('mobile')}
                  />
                  <div>
                    <strong>📱 Mobile Banking</strong>
                    <small>bKash / Nagad / Rocket</small>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                  />
                  <div>
                    <strong>💳 Wallet Payment</strong>
                    <small>Pay using ৳{walletBalance.toFixed(2)} wallet balance</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Place Order */}
            <button className="place-order-button" onClick={placeOrder}>
              Place Order →
            </button>
          </div>

          {/* Order Summary */}
          <div className="checkout-summary checkout-card">
            <span className="section-label">ORDER SUMMARY</span>
            <h2>Your Order</h2>

            <div className="summary-restaurant">
              <span>🍛</span>
              <div>
                <strong>Arai Biryani House</strong>
                <small>Your selected items</small>
              </div>
            </div>

            <div className="summary-items">
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div className="summary-item" key={item.id}>
                    <div>
                      <span>{item.emoji} {item.name}</span>
                      <small>Quantity × {item.quantity}</small>
                    </div>
                    <strong>৳{item.price * item.quantity}</strong>
                  </div>
                ))
              )}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <span>Subtotal</span>
              <strong>৳{subtotal}</strong>
            </div>

            <div className="summary-item">
              <span>Delivery Fee</span>
              <strong>{deliveryFee === 0 ? 'FREE' : `৳${deliveryFee}`}</strong>
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

            <div className="checkout-note">🔒 Your order information is secure.</div>
          </div>

        </div>
      </div>

      {/* Outside Service Area Modal */}
      {outsideArea && (
        <div className="outside-area-modal">
          <div className="outside-area-modal-content">
            <div className="outside-area-icon">🚫</div>
            <h2>Outside Delivery Area</h2>
            <p>
              Sorry! We currently only deliver within <strong>Araihazar Thana</strong> and its surrounding areas. 
              We are working hard to expand our service to other areas soon. 
              Thank you for your interest!
            </p>
            <button 
              className="outside-area-close-btn"
              onClick={() => setOutsideArea(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage