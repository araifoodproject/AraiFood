import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function TrackOrderPage() {
  const [trackingStage, setTrackingStage] = useState(0)
  const [orderId, setOrderId] = useState('')
  const [orderDetails, setOrderDetails] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    setOrderId(id || '')

    const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]')
    const foundOrder = orders.find((order) => order.id === id)
    setOrderDetails(foundOrder)

    if (foundOrder) {
      if (foundOrder.status === 'delivered') {
        setTrackingStage(2)
      } else if (foundOrder.status === 'delivering') {
        setTrackingStage(1)
      } else {
        setTrackingStage(0)
      }
    }
  }, [])

  useEffect(() => {
    if (!orderDetails) return

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
  }, [orderDetails])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY
  })

  // Customer এর location (Araihazar)
  const customerLocation = { lat: 23.7941, lng: 90.6575 }

  // Rider এর location (Araihazar-এর ভেতরেই)
  const riderLocation = trackingStage >= 2 ? customerLocation : { lat: 23.7925, lng: 90.6550 }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="section-label">ORDER TRACKING</span>
          <h1>Track Your Order</h1>
          <p>Order ID: <strong>{orderId}</strong></p>
        </div>

        {!orderDetails ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>Order not found!</h2>
            <p>This order does not exist in your history.</p>
            <Link to="/order-history" className="checkout-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>
              Back to Orders
            </Link>
          </div>
        ) : (
          <div className="order-success-container">
            <div className="order-success-icon">🛵</div>
            <h1>Order On The Way!</h1>
            <p>Your order <strong>{orderId}</strong> is being processed.</p>

            {/* Rider Location Map */}
            {trackingStage >= 1 && isLoaded && (
              <div className="rider-location-map">
                <h3>Rider Location</h3>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={customerLocation}
                  zoom={15}
                  options={{
                    // Map + Satellite দুটো বাটনই থাকবে
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                      style: 2
                    },
                    // Satellite View-তেও Labels (নাম) দেখা যাবে
                    streetViewControl: false,
                    fullscreenControl: false
                  }}
                >
                  {/* Rider Marker */}
                  <Marker
                    position={riderLocation}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="#13a89e" opacity="0.8"/>
                          <text x="50" y="65" font-size="40" text-anchor="middle">🛵</text>
                        </svg>
                      `),
                      scaledSize: { width: 60, height: 60 }
                    }}
                  />

                  {/* Customer Marker */}
                  <Marker
                    position={customerLocation}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="#dc2626" opacity="0.9"/>
                          <text x="50" y="65" font-size="40" text-anchor="middle">🏠</text>
                        </svg>
                      `),
                      scaledSize: { width: 50, height: 50 }
                    }}
                  />
                </GoogleMap>
                <p className="rider-location-text">
                  🛵 Rider is approaching your location!
                </p>
              </div>
            )}

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
              <Link to="/order-history" className="checkout-button" style={{ textDecoration: 'none' }}>Back to Orders</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackOrderPage