// ============================================================
// src/pages/TrackOrderPage.jsx
// V2 — + Payment status visibility + prominent OTP display
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from 'firebase/firestore'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const containerStyle = {
  width: '100%',
  height: '420px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
}

const riderIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#13a89e" opacity="0.9" stroke="#ffffff" stroke-width="4"/><text x="50" y="65" font-size="40" text-anchor="middle">🛵</text></svg>`
const customerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#dc2626" opacity="0.9" stroke="#ffffff" stroke-width="4"/><text x="50" y="65" font-size="40" text-anchor="middle">🏠</text></svg>`
const restaurantIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#f59e0b" opacity="0.9" stroke="#ffffff" stroke-width="4"/><text x="50" y="65" font-size="40" text-anchor="middle">🏪</text></svg>`

function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('id')
  const { settings } = useSettings()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [riderLocation, setRiderLocation] = useState(null)
  const [restaurantLocation, setRestaurantLocation] = useState(null)
  const [rider, setRider] = useState(null)

  const mapRef = useRef(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['places'],
  })

  // Load order (live)
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

  // Load restaurant doc
  useEffect(() => {
    if (!order?.restaurantId) return

    const unsub = onSnapshot(
      doc(db, 'restaurants', order.restaurantId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (data.location?.lat && data.location?.lng) {
            setRestaurantLocation(data.location)
          } else {
            setRestaurantLocation(settings.mapDefaultCenter || null)
          }
        }
      },
      (err) => console.error('Restaurant load error:', err)
    )
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.restaurantId])

  // Load rider doc
  useEffect(() => {
    if (!order?.riderId) {
      setRider(null)
      return
    }

    const unsub = onSnapshot(
      doc(db, 'riders', order.riderId),
      (snap) => {
        if (snap.exists()) setRider({ firebaseId: snap.id, ...snap.data() })
      },
      (err) => console.error('Rider load error:', err)
    )
    return () => unsub()
  }, [order?.riderId])

  // Auto-fit map bounds
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const points = [restaurantLocation, riderLocation, order?.location].filter(
      (p) => p && p.lat && p.lng
    )
    if (points.length < 2) return
    try {
      const bounds = new window.google.maps.LatLngBounds()
      points.forEach((p) => bounds.extend(p))
      mapRef.current.fitBounds(bounds, { padding: 60 })
    } catch (e) {
      // ignore
    }
  }, [restaurantLocation, riderLocation, order?.location, isLoaded])

  // Tracking stage
  const getTrackingStage = (ord) => {
    if (!ord) return 0
    if (ord.status === 'delivered' || ord.riderStatus === 'delivered') return 2
    if (
      [
        'accepted',
        'going_to_restaurant',
        'arrived_at_restaurant',
        'picked_up',
        'going_to_customer',
      ].includes(ord.riderStatus)
    ) {
      return 1
    }
    return 0
  }

  // ============================================================
  // UPDATED: Status label with payment awareness
  // ============================================================
  const getStatusLabel = (ord) => {
    if (!ord) return '⏳ Waiting for order...'

    // Cancelled
    if (ord.status === 'cancelled') {
      return `❌ This order was cancelled.${
        ord.cancelReason ? ` Reason: ${ord.cancelReason}` : ''
      }`
    }

    // Payment rejected
    if (ord.paymentStatus === 'rejected') {
      return `❌ Payment rejected. ${
        ord.paymentRejectReason ? `Reason: ${ord.paymentRejectReason}` : ''
      }`
    }

    // Online payment pending Admin verification
    if (
      ord.paymentMethod === 'online' &&
      ord.paymentStatus === 'pending' &&
      ord.status === 'pending'
    ) {
      return '💳 Waiting for Admin to verify your payment...'
    }

    // Payment verified but restaurant not yet accepted
    if (
      ord.paymentMethod === 'online' &&
      ord.paymentStatus === 'verified' &&
      ord.status === 'pending'
    ) {
      return '⏳ Waiting for restaurant to accept your order...'
    }

    // COD pending
    if (ord.paymentMethod === 'cod' && ord.status === 'pending') {
      return '⏳ Waiting for restaurant to accept your order...'
    }

    // Rider status flow
    if (ord.riderStatus === 'delivered')
      return '✅ Your food has been delivered. Enjoy!'
    if (ord.riderStatus === 'going_to_customer')
      return '🛵 Rider is on the way to you!'
    if (ord.riderStatus === 'picked_up')
      return '📦 Food picked up. Heading to you!'
    if (ord.riderStatus === 'arrived_at_restaurant')
      return '📍 Rider arrived at restaurant.'
    if (ord.riderStatus === 'going_to_restaurant')
      return '🛵 Rider is going to the restaurant.'
    if (ord.riderStatus === 'accepted')
      return '👤 Rider assigned. Waiting for food pickup.'

    // Order status flow
    if (ord.status === 'delivered')
      return '✅ Your food has been delivered. Enjoy!'
    if (ord.status === 'delivering')
      return '🛵 Food is ready! Waiting for rider.'
    if (ord.status === 'preparing')
      return '👨‍🍳 Restaurant is preparing your order...'

    return '⏳ Processing your order...'
  }

  const trackingStage = getTrackingStage(order)

  const mapCenter = useMemo(() => {
    return (
      riderLocation ||
      order?.location ||
      restaurantLocation ||
      settings.mapDefaultCenter || { lat: 23.78, lng: 90.64 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLocation, order?.location, restaurantLocation, settings.mapDefaultCenter])

  // Loading
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

  // Not found
  if (notFound || !order) {
    return (
      <div className="restaurants-page">
        <div className="restaurants-page-container">
          <PageBackButton label="Back" fallback="/order-history" />

          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>Order not found!</h2>
            <p>
              The order you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/order-history"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Rider info
  const riderName = rider?.fullName || order.riderName || 'Assigning...'
  const riderPhone = rider?.phone || order.riderPhone || ''
  const riderRating = rider?.rating ?? order.riderRating ?? null
  const riderTotal = rider?.totalDeliveries ?? null

  // Payment status flags
  const isOnlinePayment = (order.paymentMethod || '').toLowerCase() === 'online'
  const isPaymentPending = isOnlinePayment && order.paymentStatus === 'pending'
  const isPaymentVerified = isOnlinePayment && order.paymentStatus === 'verified'
  const isPaymentRejected = isOnlinePayment && order.paymentStatus === 'rejected'

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/order-history" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">ORDER TRACKING</span>
          <h1>Track Your Order</h1>
          <p>
            Order ID: <strong>{order.orderId}</strong>
          </p>
        </div>

        <div className="order-success-container">
          {/* ============================================================
              💳 PAYMENT STATUS — PROMINENT
          ============================================================ */}
          {isPaymentPending && (
            <div
              style={{
                padding: '18px 22px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                border: '2px solid #F59E0B',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '28px' }}>💳</span>
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: '#92400E',
                    }}
                  >
                    Payment Pending Verification
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#A16207',
                    }}
                  >
                    Admin আপনার পেমেন্ট verify করছে
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12.5px',
                  color: '#92400E',
                  fontWeight: 600,
                  lineHeight: 1.6,
                }}
              >
                {order.paymentMethodUsed && (
                  <>
                    <strong>Method:</strong> {order.paymentMethodUsed}
                    <br />
                  </>
                )}
                {order.paymentTrxId && (
                  <>
                    <strong>TrxID:</strong>{' '}
                    <span style={{ fontFamily: 'monospace' }}>
                      {order.paymentTrxId}
                    </span>
                    <br />
                  </>
                )}
                <strong>Amount:</strong> ৳{order.total}
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11.5px',
                  color: '#78350F',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                ⏳ Admin verify করার পর restaurant আপনার order accept করবে
              </div>
            </div>
          )}

          {isPaymentRejected && (
            <div
              style={{
                padding: '18px 22px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                border: '2px solid #DC2626',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '28px' }}>❌</span>
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: '#991B1B',
                    }}
                  >
                    Payment Rejected
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#B91C1C',
                    }}
                  >
                    আপনার পেমেন্ট verify করা হয়নি
                  </div>
                </div>
              </div>
              {order.paymentRejectReason && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12.5px',
                    color: '#991B1B',
                    fontWeight: 600,
                  }}
                >
                  <strong>কারণ:</strong> {order.paymentRejectReason}
                </div>
              )}
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11.5px',
                  color: '#7F1D1D',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                💬 Support এ যোগাযোগ করুন অথবা নতুন order দিন
              </div>
            </div>
          )}

          {isPaymentVerified && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
                border: '2px solid #16A34A',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '22px' }}>✅</span>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#166534',
                  }}
                >
                  Payment Verified
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#15803D',
                  }}
                >
                  ৳{order.total} · {order.paymentMethodUsed || 'Online'}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              🔐 DELIVERY OTP — PROMINENT
          ============================================================ */}
          {order.deliveryOtp && !isPaymentRejected && order.status !== 'cancelled' && (
            <div
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                background:
                  'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                border: '2px dashed #2563EB',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#1E40AF',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                }}
              >
                🔐 Your Delivery OTP
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '42px',
                  fontWeight: 900,
                  color: '#1E3A8A',
                  letterSpacing: '12px',
                  lineHeight: 1,
                  marginBottom: '10px',
                }}
              >
                {order.deliveryOtp}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1E40AF',
                  lineHeight: 1.5,
                }}
              >
                🛵 Rider কে food দেওয়ার আগে এই OTP টা বলুন
                <br />
                <span style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.8 }}>
                  Rider এই OTP দিয়ে delivery confirm করবে
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Order Icon + Title */}
          <div className="order-success-icon">
            {isPaymentPending
              ? '💳'
              : isPaymentRejected
              ? '❌'
              : trackingStage === 2
              ? '✅'
              : trackingStage === 1
              ? '🛵'
              : '👨‍🍳'}
          </div>
          <h1>
            {isPaymentPending
              ? 'Verifying Payment...'
              : isPaymentRejected
              ? 'Payment Rejected'
              : trackingStage === 2
              ? 'Delivered!'
              : trackingStage === 1
              ? 'On The Way!'
              : 'Preparing Your Food!'}
          </h1>
          <p>
            From <strong>{order.restaurantName}</strong>
          </p>

          {/* MAP */}
          <div className="track-map-section">
            <h2>📍 Live Map</h2>

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
                  center={mapCenter}
                  zoom={settings.mapDefaultZoom || 14}
                  onLoad={(map) => {
                    mapRef.current = map
                  }}
                  options={{
                    mapTypeControl: true,
                    mapTypeControlOptions: { style: 2, position: 3 },
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    gestureHandling: 'greedy',
                    clickableIcons: false,
                  }}
                >
                  {order.location && (
                    <Marker
                      position={order.location}
                      icon={{
                        url:
                          'data:image/svg+xml;charset=UTF-8,' +
                          encodeURIComponent(customerIconSvg),
                        scaledSize: { width: 55, height: 55 },
                      }}
                    />
                  )}

                  {restaurantLocation && (
                    <Marker
                      position={restaurantLocation}
                      icon={{
                        url:
                          'data:image/svg+xml;charset=UTF-8,' +
                          encodeURIComponent(restaurantIconSvg),
                        scaledSize: { width: 55, height: 55 },
                      }}
                    />
                  )}

                  {riderLocation && (
                    <Marker
                      position={riderLocation}
                      icon={{
                        url:
                          'data:image/svg+xml;charset=UTF-8,' +
                          encodeURIComponent(riderIconSvg),
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
                    <span>
                      Rider {riderLocation ? '(Live)' : '(Waiting...)'}
                    </span>
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
            <h2>Live Status</h2>

            <div className="tracking-progress">
              <div
                className={`tracking-step ${
                  trackingStage >= 0 ? 'active' : ''
                }`}
              >
                <div className="tracking-icon">👨‍🍳</div>
                <div className="tracking-text">
                  <strong>Preparing</strong>
                  <small>Restaurant</small>
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
                  <small>Rider</small>
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

            <p className="tracking-status-text">{getStatusLabel(order)}</p>
          </div>

          {/* RIDER INFO */}
          {(riderName !== 'Assigning...' || trackingStage >= 1) && (
            <div className="rider-profile-card">
              <div className="rider-avatar">
                {rider?.profileImage ? (
                  <img
                    src={rider.profileImage}
                    alt={riderName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  '🛵'
                )}
              </div>
              <div className="rider-info">
                <strong>Rider: {riderName}</strong>
                <small>
                  {riderRating != null && (
                    <span>
                      ⭐ {Number(riderRating).toFixed(1)}
                      {riderTotal != null && ` (${riderTotal}+ deliveries)`}
                    </span>
                  )}
                  {riderRating == null && riderPhone && `📞 ${riderPhone}`}
                  {riderRating == null && !riderPhone && '⏳ Waiting for rider'}
                </small>
              </div>
              {riderPhone && (
                <button
                  className="call-rider-button"
                  onClick={() => (window.location.href = `tel:${riderPhone}`)}
                >
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
                  <span>
                    {item.emoji} {item.name}
                  </span>
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
              {order.zoneName && (
                <div className="track-detail-row">
                  <span>🗺️ Zone</span>
                  <strong>{order.zoneName}</strong>
                </div>
              )}
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
              <div
                className="track-detail-row"
                style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '8px' }}
              >
                <span>Method</span>
                <strong style={{ textTransform: 'uppercase' }}>
                  {order.paymentMethod || 'cod'}
                </strong>
              </div>
              {isOnlinePayment && (
                <div className="track-detail-row">
                  <span>Payment Status</span>
                  <strong
                    style={{
                      color: isPaymentVerified
                        ? '#16A34A'
                        : isPaymentRejected
                        ? '#DC2626'
                        : '#F59E0B',
                      textTransform: 'uppercase',
                    }}
                  >
                    {order.paymentStatus || 'pending'}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="order-success-buttons">
            <Link
              to="/order-history"
              className="checkout-button"
              style={{ textDecoration: 'none' }}
            >
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackOrderPage