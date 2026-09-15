import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { restaurantLocations } from '../utils/locationTracker'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
}

const riderIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#13a89e" opacity="0.9" stroke="#ffffff" stroke-width="4"/><text x="50" y="65" font-size="40" text-anchor="middle">🛵</text></svg>`
const customerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#dc2626" opacity="0.9" stroke="#ffffff" stroke-width="4"/><text x="50" y="65" font-size="40" text-anchor="middle">🏠</text></svg>`
const restaurantIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#f59e0b" opacity="0.9" stroke="#ffffff" stroke-width="4"/><text x="50" y="65" font-size="40" text-anchor="middle">🏪</text></svg>`

function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('id')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [riderLocation, setRiderLocation] = useState(null)
  const [restaurantLocation, setRestaurantLocation] = useState(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['places'],
  })

  // ============ LOAD ORDER FROM FIREBASE ============
  useEffect(() => {
    if (!orderIdParam) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('orderId', '==', orderIdParam)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      if (snapshot.empty) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const orderDoc = snapshot.docs[0]
      const orderData = { firebaseId: orderDoc.id, ...orderDoc.data() }
      setOrder(orderData)

      // Restaurant Location
      if (orderData.restaurantName) {
        const restLoc = restaurantLocations[orderData.restaurantName] || restaurantLocations.default
        setRestaurantLocation(restLoc)
      }

      // Rider Location
      if (orderData.riderLocation) {
        setRiderLocation(orderData.riderLocation)
      } else {
        setRiderLocation(null)
      }

      setNotFound(false)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orderIdParam])

  // ============ TRACKING STAGE ============
  const getTrackingStage = (order) => {
    if (!order) return 0

    // Stage 2: Delivered
    if (order.status === 'delivered' || order.riderStatus === 'delivered') {
      return 2
    }

    // Stage 1: On the Way (Rider Order Accept করলে)
    if ([
      'accepted',
      'going_to_restaurant',
      'arrived_at_restaurant',
      'picked_up',
      'going_to_customer'
    ].includes(order.riderStatus)) {
      return 1
    }

    // Stage 0: Preparing
    return 0
  }

  // ============ STATUS LABEL ============
  const getStatusLabel = (order) => {
    if (!order) return '⏳ Waiting for order...'

    // Rider Stage Priority
    if (order.riderStatus === 'delivered') return '✅ Your food has been delivered. Enjoy!'
    if (order.riderStatus === 'going_to_customer') return '🛵 Rider is on the way to you!'
    if (order.riderStatus === 'picked_up') return '📦 Food picked up. Heading to you!'
    if (order.riderStatus === 'arrived_at_restaurant') return '📍 Rider arrived at restaurant.'
    if (order.riderStatus === 'going_to_restaurant') return '🛵 Rider is going to the restaurant.'
    if (order.riderStatus === 'accepted') return '👤 Rider assigned. Waiting for food pickup.'

    // Restaurant Stage
    if (order.status === 'delivered') return '✅ Your food has been delivered. Enjoy!'
    if (order.status === 'delivering') return '🛵 Food is ready! Waiting for rider.'
    if (order.status === 'preparing') return '👨‍🍳 Restaurant is preparing your order...'
    if (order.status === 'pending') return '⏳ Waiting for restaurant confirmation...'
    if (order.status === 'cancelled') return '❌ This order was cancelled.'

    return '⏳ Processing your order...'
  }

  const trackingStage = getTrackingStage(order)
  const customerLoc = order?.location

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your order...</p>
        </div>
      </div>
    )
  }

  // ============ NOT FOUND ============
  if (notFound || !order) {
    return (
      <div className="restaurants-page">
        <div className="restaurants-page-container">
          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>Order not found!</h2>
            <p>The order you're looking for doesn't exist or has been removed.</p>
            <Link to="/order-history" className="checkout-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="section-label">ORDER TRACKING</span>
          <h1>Track Your Order</h1>
          <p>Order ID: <strong>{order.orderId}</strong></p>
        </div>

        <div className="order-success-container">
          <div className="order-success-icon">
            {trackingStage === 2 ? '✅' : trackingStage === 1 ? '🛵' : '👨‍🍳'}
          </div>
          <h1>
            {trackingStage === 2 ? 'Delivered!' :
             trackingStage === 1 ? 'On The Way!' :
             'Preparing Your Food!'}
          </h1>
          <p>From <strong>{order.restaurantName}</strong></p>

          {/* LIVE MAP */}
          <div className="track-map-section">
            <h2 style={{ marginBottom: '15px', marginTop: '25px', textAlign: 'center' }}>📍 Live Map</h2>

            {!isLoaded && !loadError && (
              <div className="map-loading-skeleton">
                <div className="map-loading-spinner"></div>
                <p>🗺️ Loading Map...</p>
              </div>
            )}

            {loadError && (
              <div className="map-loading-skeleton error">
                <p>⚠️ Failed to load map. Please refresh.</p>
              </div>
            )}

            {isLoaded && (
              <>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={riderLocation || customerLoc || { lat: 23.78, lng: 90.64 }}
                  zoom={13}
                  options={{
                    mapTypeControl: true,
                    mapTypeControlOptions: { style: 2 },
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                  }}
                >
                  {customerLoc && (
                    <Marker
                      position={customerLoc}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customerIconSvg),
                        scaledSize: { width: 55, height: 55 },
                      }}
                    />
                  )}

                  {restaurantLocation && (
                    <Marker
                      position={restaurantLocation}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(restaurantIconSvg),
                        scaledSize: { width: 55, height: 55 },
                      }}
                    />
                  )}

                  {riderLocation && (
                    <Marker
                      position={riderLocation}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(riderIconSvg),
                        scaledSize: { width: 60, height: 60 },
                      }}
                    />
                  )}
                </GoogleMap>

                <div className="map-legend">
                  <div className="map-legend-item">
                    <span className="map-legend-icon">🏪</span>
                    <span>Restaurant</span>
                  </div>
                  <div className="map-legend-item">
                    <span className="map-legend-icon">🛵</span>
                    <span>Rider {riderLocation ? '(Live)' : '(Waiting...)'}</span>
                  </div>
                  <div className="map-legend-item">
                    <span className="map-legend-icon">🏠</span>
                    <span>Your Location</span>
                  </div>
                </div>

                {!riderLocation && trackingStage >= 1 && (
                  <p className="map-note">⏳ Waiting for rider location...</p>
                )}
              </>
            )}
          </div>

          {/* TRACKING PROGRESS */}
          <div className="order-tracking-section">
            <h2 style={{ marginBottom: '20px', marginTop: '25px' }}>Live Status</h2>

            <div className="tracking-progress">
              <div className={`tracking-step ${trackingStage >= 0 ? 'active' : ''}`}>
                <div className="tracking-icon">👨‍🍳</div>
                <div className="tracking-text">
                  <strong>Preparing</strong>
                  <small>Restaurant</small>
                </div>
              </div>
              <div className={`tracking-line ${trackingStage >= 1 ? 'active' : ''}`}></div>
              <div className={`tracking-step ${trackingStage >= 1 ? 'active' : ''}`}>
                <div className="tracking-icon">🛵</div>
                <div className="tracking-text">
                  <strong>On the Way</strong>
                  <small>Rider</small>
                </div>
              </div>
              <div className={`tracking-line ${trackingStage >= 2 ? 'active' : ''}`}></div>
              <div className={`tracking-step ${trackingStage >= 2 ? 'active' : ''}`}>
                <div className="tracking-icon">🏠</div>
                <div className="tracking-text">
                  <strong>Delivered</strong>
                  <small>Enjoy!</small>
                </div>
              </div>
            </div>

            <p className="tracking-status-text">{getStatusLabel(order)}</p>
          </div>

          {/* RIDER INFO */}
          {(order.riderName || trackingStage >= 1) && (
            <div className="rider-profile-card">
              <div className="rider-avatar">🛵</div>
              <div className="rider-info">
                <strong>Rider: {order.riderName || 'Assigning...'}</strong>
                <small>{order.riderPhone ? `📞 ${order.riderPhone}` : '⏳ Waiting for rider'}</small>
              </div>
              {order.riderPhone && (
                <button className="call-rider-button" onClick={() => window.location.href = `tel:${order.riderPhone}`}>
                  📞 Call
                </button>
              )}
            </div>
          )}

          {/* ORDER DETAILS */}
          <div className="track-order-details">
            <div className="track-detail-section">
              <h3>🏪 Restaurant</h3>
              <div className="track-detail-row">
                <span>{order.restaurantName}</span>
              </div>
            </div>

            <div className="track-detail-section">
              <h3>📦 Items</h3>
              {order.items?.map((item, idx) => (
                <div className="track-detail-row" key={idx}>
                  <span>{item.emoji} {item.name}</span>
                  <span>× {item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="track-detail-section">
              <h3>📍 Delivery Address</h3>
              <div className="track-detail-row">
                <span>{order.address}</span>
              </div>
              <div className="track-detail-row">
                <span>📞 {order.phone}</span>
              </div>
            </div>

            <div className="track-detail-section">
              <h3>💰 Payment</h3>
              <div className="track-detail-row">
                <span>Subtotal</span>
                <strong>৳{order.subtotal}</strong>
              </div>
              <div className="track-detail-row">
                <span>Delivery Fee</span>
                <strong>৳{order.deliveryFee}</strong>
              </div>
              <div className="track-detail-row total-row">
                <span>Total</span>
                <strong>৳{order.total}</strong>
              </div>
            </div>
          </div>

          <div className="order-success-buttons">
            <Link to="/order-history" className="checkout-button" style={{ textDecoration: 'none' }}>
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackOrderPage