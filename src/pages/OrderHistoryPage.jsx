// ============================================================
// src/pages/OrderHistoryPage.jsx
// V2.1 — Fixed: separate restaurant/rider star state
// Order history with Rate Order modal (restaurant + rider rating)
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Star, X } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'

function OrderHistoryPage() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [myReviews, setMyReviews] = useState({}) // { orderId: reviewData }

  // Rating modal
  const [ratingOrder, setRatingOrder] = useState(null)
  const [restaurantRating, setRestaurantRating] = useState(0)
  const [restaurantHover, setRestaurantHover] = useState(0)
  const [riderRating, setRiderRating] = useState(0)
  const [riderHover, setRiderHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Load orders
  useEffect(() => {
    if (!user) return

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))

      list.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime
      })

      setOrders(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Load my reviews
  useEffect(() => {
    if (!user) return

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('customerId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const map = {}
      snapshot.docs.forEach((d) => {
        const data = d.data()
        if (data.orderId) map[data.orderId] = { firebaseId: d.id, ...data }
      })
      setMyReviews(map)
    })

    return () => unsubscribe()
  }, [user])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return (
      date.toLocaleDateString() +
      ' • ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: '#f59e0b', icon: '⏳' }
      case 'preparing':
        return { label: 'Preparing', color: '#3b82f6', icon: '👨‍🍳' }
      case 'delivering':
        return { label: 'On the Way', color: '#13a89e', icon: '🛵' }
      case 'delivered':
        return { label: 'Delivered', color: '#16a34a', icon: '✅' }
      case 'cancelled':
        return { label: 'Cancelled', color: '#dc2626', icon: '❌' }
      default:
        return { label: status || 'Pending', color: '#6b7280', icon: '📦' }
    }
  }

  // ============================================================
  // OPEN RATING MODAL
  // ============================================================
  const openRatingModal = (order) => {
    setRatingOrder(order)
    setRestaurantRating(0)
    setRestaurantHover(0)
    setRiderRating(0)
    setRiderHover(0)
    setComment('')
  }

  const closeRatingModal = () => {
    if (submitting) return
    setRatingOrder(null)
  }

  // ============================================================
  // SUBMIT RATING
  // ============================================================
  const submitRating = async () => {
    if (!ratingOrder) return
    if (restaurantRating === 0) {
      toast.error('Please rate the restaurant.')
      return
    }

    setSubmitting(true)
    try {
      if (myReviews[ratingOrder.orderId]) {
        toast.error('You already reviewed this order.')
        setSubmitting(false)
        return
      }

      const reviewData = {
        orderId: ratingOrder.orderId,
        restaurantId: ratingOrder.restaurantId,
        restaurantName: ratingOrder.restaurantName,
        customerId: user.uid,
        customerName:
          ratingOrder.fullName || user.displayName || 'Anonymous',
        customerPhoto: user.photoURL || '',
        rating: restaurantRating,
        comment: comment.trim(),
        riderId: ratingOrder.riderId || null,
        riderName: ratingOrder.riderName || null,
        riderRating: riderRating > 0 ? riderRating : null,
        flagged: false,
        hidden: false,
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'reviews'), reviewData)

      // Update restaurant's average rating
      await updateRestaurantAverageRating(ratingOrder.restaurantId)

      // Update rider's average rating (if given)
      if (ratingOrder.riderId && riderRating > 0) {
        await updateRiderAverageRating(ratingOrder.riderId)
      }

      toast.success('⭐ Thanks for your review!')
      closeRatingModal()
    } catch (err) {
      console.error('Rating submit error:', err)
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Recalculate restaurant average rating
  const updateRestaurantAverageRating = async (restaurantId) => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId)
      )
      const snap = await new Promise((resolve) => {
        const unsub = onSnapshot(reviewsQuery, (s) => {
          unsub()
          resolve(s)
        })
      })

      const visible = snap.docs
        .map((d) => d.data())
        .filter((r) => r.hidden !== true && typeof r.rating === 'number')

      if (visible.length === 0) return

      const avg =
        visible.reduce((sum, r) => sum + r.rating, 0) / visible.length

      await updateDoc(doc(db, 'restaurants', restaurantId), {
        rating: Math.round(avg * 10) / 10,
        reviewCount: visible.length,
      })
    } catch (err) {
      console.error('Avg rating calc error:', err)
    }
  }

  // Recalculate rider average rating
  const updateRiderAverageRating = async (riderId) => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('riderId', '==', riderId)
      )
      const snap = await new Promise((resolve) => {
        const unsub = onSnapshot(reviewsQuery, (s) => {
          unsub()
          resolve(s)
        })
      })

      const withRating = snap.docs
        .map((d) => d.data())
        .filter(
          (r) =>
            r.hidden !== true &&
            typeof r.riderRating === 'number' &&
            r.riderRating > 0
        )

      if (withRating.length === 0) return

      const avg =
        withRating.reduce((sum, r) => sum + r.riderRating, 0) /
        withRating.length

      await updateDoc(doc(db, 'riders', riderId), {
        rating: Math.round(avg * 10) / 10,
      })
    } catch (err) {
      console.error('Rider avg rating calc error:', err)
    }
  }

  // ============================================================
  // RENDER STARS — SEPARATE FUNCTIONS (FIX)
  // ============================================================
  const renderRestaurantStars = () => {
    return (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const active = (restaurantHover || restaurantRating) >= i
          return (
            <Star
              key={i}
              size={30}
              fill={active ? '#F59E0B' : 'transparent'}
              color={active ? '#F59E0B' : '#D1D5DB'}
              strokeWidth={2}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s',
                transform: active && restaurantHover === i ? 'scale(1.15)' : 'scale(1)',
              }}
              onMouseEnter={() => setRestaurantHover(i)}
              onMouseLeave={() => setRestaurantHover(0)}
              onClick={() => setRestaurantRating(i)}
            />
          )
        })}
      </div>
    )
  }

  const renderRiderStars = () => {
    return (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const active = (riderHover || riderRating) >= i
          return (
            <Star
              key={i}
              size={30}
              fill={active ? '#F59E0B' : 'transparent'}
              color={active ? '#F59E0B' : '#D1D5DB'}
              strokeWidth={2}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s',
                transform: active && riderHover === i ? 'scale(1.15)' : 'scale(1)',
              }}
              onMouseEnter={() => setRiderHover(i)}
              onMouseLeave={() => setRiderHover(0)}
              onClick={() => setRiderRating(i)}
            />
          )
        })}
      </div>
    )
  }

  // ============================================================
  // LOADING / EMPTY
  // ============================================================
  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">YOUR ORDERS</span>
          <h1>Order History</h1>
          <p>Review your past orders and track them live.</p>
        </div>

        {!user ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔒</div>
            <h2>Please Login</h2>
            <p>You need to login to see your order history.</p>
            <Link
              to="/login"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              Login →
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>No orders yet!</h2>
            <p>Place your first order to see it here.</p>
            <Link
              to="/restaurants"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="order-history-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const review = myReviews[order.orderId]
              const canRate = order.status === 'delivered'

              return (
                <div className="order-history-card" key={order.firebaseId}>
                  <div className="order-history-header">
                    <div>
                      <strong>Order ID: {order.orderId}</strong>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>
                    <span
                      className="order-status-badge"
                      style={{
                        background: statusInfo.color + '20',
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  <div className="order-history-restaurant">
                    <div className="order-history-logo">
                      {order.restaurantLogo ? (
                        <img
                          src={order.restaurantLogo}
                          alt={order.restaurantName}
                        />
                      ) : (
                        <span>🏪</span>
                      )}
                    </div>
                    <div>
                      <strong>{order.restaurantName}</strong>
                      <small>{order.items?.length || 0} item(s)</small>
                    </div>
                  </div>

                  <div className="order-history-items">
                    {order.items?.map((item, idx) => (
                      <div className="history-item" key={idx}>
                        <span>
                          {item.emoji} {item.name}
                        </span>
                        <span className="history-quantity">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-history-total">
                    <span>Total:</span>
                    <strong>৳{order.total}</strong>
                  </div>

                  {review && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      ✅ You rated {review.rating}⭐
                      {review.comment && (
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          · "{review.comment.slice(0, 40)}
                          {review.comment.length > 40 ? '...' : ''}"
                        </span>
                      )}
                    </div>
                  )}

                  <div className="order-history-actions">
                    {canRate && !review && (
                      <button
                        onClick={() => openRatingModal(order)}
                        style={{
                          padding: '12px 22px',
                          borderRadius: '999px',
                          background:
                            'linear-gradient(135deg, #F59E0B, #D97706)',
                          color: '#FFFFFF',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                        }}
                      >
                        ⭐ Rate Order
                      </button>
                    )}

                    {canRate && review && (
                      <button
                        disabled
                        style={{
                          padding: '12px 22px',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          cursor: 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        ✅ Rated
                      </button>
                    )}

                    <Link
                      to={`/track-order?id=${order.orderId}`}
                      className="track-order-button"
                    >
                      🛵 Track Order
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* RATING MODAL */}
      {/* ============================================================ */}
      {ratingOrder && (
        <div className="outside-area-modal" onClick={closeRatingModal}>
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: '28px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: 800,
                  }}
                >
                  Rate Your Order
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  Order #{ratingOrder.orderId} · {ratingOrder.restaurantName}
                </p>
              </div>
              <button
                onClick={closeRatingModal}
                disabled={submitting}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Restaurant rating */}
            <div
              style={{
                padding: '18px',
                borderRadius: '16px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border)',
                marginBottom: '14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px',
                }}
              >
                🏪 How was the food?
              </div>
              {renderRestaurantStars()}
              {restaurantRating > 0 && (
                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#059669',
                  }}
                >
                  {restaurantRating === 5
                    ? '😍 Excellent!'
                    : restaurantRating === 4
                    ? '😊 Good'
                    : restaurantRating === 3
                    ? '😐 OK'
                    : restaurantRating === 2
                    ? '😕 Not great'
                    : '😞 Terrible'}
                </p>
              )}
            </div>

            {/* Rider rating (only if rider assigned) */}
            {ratingOrder.riderId && ratingOrder.riderName && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                  marginBottom: '14px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    marginBottom: '10px',
                  }}
                >
                  🛵 Rate your rider ({ratingOrder.riderName})
                </div>
                {renderRiderStars()}
                {riderRating > 0 && (
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#059669',
                    }}
                  >
                    {riderRating === 5
                      ? '🌟 Amazing!'
                      : riderRating === 4
                      ? '👍 Good'
                      : riderRating === 3
                      ? '😐 OK'
                      : riderRating === 2
                      ? '👎 Not great'
                      : '😞 Bad'}
                  </p>
                )}
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  Optional — skip if you prefer
                </p>
              </div>
            )}

            {/* Comment */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                💬 Add a comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                maxLength={500}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-primary)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                {comment.length}/500
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={submitRating}
              disabled={submitting || restaurantRating === 0}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '999px',
                background:
                  submitting || restaurantRating === 0
                    ? 'var(--surface-soft)'
                    : 'linear-gradient(135deg, #F59E0B, #D97706)',
                color:
                  submitting || restaurantRating === 0
                    ? 'var(--text-tertiary)'
                    : '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 900,
                border: 'none',
                cursor:
                  submitting || restaurantRating === 0
                    ? 'not-allowed'
                    : 'pointer',
                boxShadow:
                  submitting || restaurantRating === 0
                    ? 'none'
                    : '0 6px 20px rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {submitting ? '⏳ Submitting...' : '⭐ Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistoryPage