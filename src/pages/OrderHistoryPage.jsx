// ============================================================
// src/pages/OrderHistoryPage.jsx
// V3 — Premium redesign with filters, search, detail modal
// Bilingual (BN/EN) — inline styles preserved
// ============================================================

import { useState, useEffect, useMemo } from 'react'
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
import { Star, X, Search, Eye } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'
import { useLanguage } from '../i18n/LanguageContext'

function OrderHistoryPage() {
  const { t } = useLanguage()

  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [myReviews, setMyReviews] = useState({})

  // Filters
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Modals
  const [ratingOrder, setRatingOrder] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)

  // Rating modal state
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

  // ============ HELPERS ============
  const formatDate = (timestamp) => {
    if (!timestamp) return t('orderHistory.justNow')
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
        return {
          label: t('orderHistory.statusPending'),
          color: '#f59e0b',
          icon: '⏳',
          key: 'active',
        }
      case 'preparing':
        return {
          label: t('orderHistory.statusPreparing'),
          color: '#3b82f6',
          icon: '👨‍🍳',
          key: 'active',
        }
      case 'delivering':
        return {
          label: t('orderHistory.statusDelivering'),
          color: '#13a89e',
          icon: '🛵',
          key: 'active',
        }
      case 'delivered':
        return {
          label: t('orderHistory.statusDelivered'),
          color: '#16a34a',
          icon: '✅',
          key: 'delivered',
        }
      case 'cancelled':
        return {
          label: t('orderHistory.statusCancelled'),
          color: '#dc2626',
          icon: '❌',
          key: 'cancelled',
        }
      default:
        return {
          label: status || t('orderHistory.statusPending'),
          color: '#6b7280',
          icon: '📦',
          key: 'active',
        }
    }
  }

  // ============ STATS ============
  const stats = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    const active = orders.filter((o) =>
      ['pending', 'preparing', 'delivering', ''].includes(o.status || '')
    ).length
    const totalSpent = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + (o.total || 0), 0)
    return { total, delivered, active, totalSpent }
  }, [orders])

  // ============ FILTER + SEARCH ============
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (filter !== 'all') {
      if (filter === 'active') {
        result = result.filter((o) =>
          ['pending', 'preparing', 'delivering'].includes(o.status) ||
          !o.status
        )
      } else if (filter === 'delivered') {
        result = result.filter((o) => o.status === 'delivered')
      } else if (filter === 'cancelled') {
        result = result.filter((o) => o.status === 'cancelled')
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          (o.orderId || '').toLowerCase().includes(q) ||
          (o.restaurantName || '').toLowerCase().includes(q) ||
          (o.pharmacyName || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [orders, filter, search])

  // ============ RATING MODAL ============
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

  const submitRating = async () => {
    if (!ratingOrder) return
    if (restaurantRating === 0) {
      toast.error(t('orderHistory.toastRateRestaurant'))
      return
    }

    setSubmitting(true)
    try {
      if (myReviews[ratingOrder.orderId]) {
        toast.error(t('orderHistory.toastAlreadyReviewed'))
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

      if (ratingOrder.restaurantId) {
        await updateRestaurantAverageRating(ratingOrder.restaurantId)
      }
      if (ratingOrder.riderId && riderRating > 0) {
        await updateRiderAverageRating(ratingOrder.riderId)
      }

      toast.success(t('orderHistory.toastThanksReview'))
      closeRatingModal()
    } catch (err) {
      console.error('Rating submit error:', err)
      toast.error(t('orderHistory.toastReviewFailed'))
    } finally {
      setSubmitting(false)
    }
  }

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

  const getRatingText = (value) => {
    if (value === 5) return t('orderHistory.ratingExcellent')
    if (value === 4) return t('orderHistory.ratingGood')
    if (value === 3) return t('orderHistory.ratingOK')
    if (value === 2) return t('orderHistory.ratingNotGreat')
    return t('orderHistory.ratingTerrible')
  }

  const getRiderRatingText = (value) => {
    if (value === 5) return t('orderHistory.riderAmazing')
    if (value === 4) return t('orderHistory.riderGood')
    if (value === 3) return t('orderHistory.riderOK')
    if (value === 2) return t('orderHistory.riderNotGreat')
    return t('orderHistory.riderBad')
  }

  const renderRestaurantStars = () => (
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
              transform:
                active && restaurantHover === i ? 'scale(1.15)' : 'scale(1)',
            }}
            onMouseEnter={() => setRestaurantHover(i)}
            onMouseLeave={() => setRestaurantHover(0)}
            onClick={() => setRestaurantRating(i)}
          />
        )
      })}
    </div>
  )

  const renderRiderStars = () => (
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
              transform:
                active && riderHover === i ? 'scale(1.15)' : 'scale(1)',
            }}
            onMouseEnter={() => setRiderHover(i)}
            onMouseLeave={() => setRiderHover(0)}
            onClick={() => setRiderRating(i)}
          />
        )
      })}
    </div>
  )

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>{t('orderHistory.loading')}</p>
        </div>
      </div>
    )
  }

  // ============ RENDER ============
  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label={t('checkout.back')} fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">{t('orderHistory.badge')}</span>
          <h1>
            {t('orderHistory.heading1')}{' '}
            <span>{t('orderHistory.heading2')}</span>
          </h1>
          <p>{t('orderHistory.subtitle')}</p>
        </div>

        {!user ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔒</div>
            <h2>{t('orderHistory.pleaseLogin')}</h2>
            <p>{t('orderHistory.pleaseLoginDesc')}</p>
            <Link
              to="/login"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              {t('orderHistory.loginBtn')}
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>{t('orderHistory.noOrders')}</h2>
            <p>{t('orderHistory.noOrdersDesc')}</p>
            <Link
              to="/restaurants"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              {t('orderHistory.browseRestaurants')}
            </Link>
          </div>
        ) : (
          <>
            {/* ============ STATS ============ */}
            <div className="restaurant-page-stats">
              <div className="restaurant-stat">
                <strong>{stats.total}</strong>
                <span>{t('orderHistory.statTotal')}</span>
              </div>
              <div className="restaurant-stat">
                <strong>{stats.active}</strong>
                <span>{t('orderHistory.statActive')}</span>
              </div>
              <div className="restaurant-stat">
                <strong>{stats.delivered}</strong>
                <span>{t('orderHistory.statDelivered')}</span>
              </div>
              <div className="restaurant-stat">
                <strong>৳{stats.totalSpent.toFixed(0)}</strong>
                <span>{t('orderHistory.statSpent')}</span>
              </div>
            </div>

            {/* ============ CONTROLS ============ */}
            <div className="restaurant-controls">
              <div className="restaurant-search">
                <Search size={18} strokeWidth={2.2} />
                <input
                  type="text"
                  placeholder={t('orderHistory.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearch('')}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              <div className="restaurant-filter-row">
                {[
                  {
                    value: 'all',
                    label: t('orderHistory.filterAll'),
                    icon: '📦',
                  },
                  {
                    value: 'active',
                    label: t('orderHistory.filterActive'),
                    icon: '⏳',
                  },
                  {
                    value: 'delivered',
                    label: t('orderHistory.filterDelivered'),
                    icon: '✅',
                  },
                  {
                    value: 'cancelled',
                    label: t('orderHistory.filterCancelled'),
                    icon: '❌',
                  },
                ].map((f) => (
                  <button
                    key={f.value}
                    className={
                      filter === f.value
                        ? 'restaurant-filter active'
                        : 'restaurant-filter'
                    }
                    onClick={() => setFilter(f.value)}
                  >
                    <span style={{ marginRight: '4px' }}>{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ============ ORDER LIST ============ */}
            {filteredOrders.length === 0 ? (
              <div className="restaurant-empty-state">
                <div className="empty-icon">🔍</div>
                <h2>{t('orderHistory.noFound')}</h2>
                <p>
                  {search
                    ? `${t('orderHistory.noFoundSearch')} "${search}"`
                    : t('orderHistory.noFoundFilter')}
                </p>
                <button
                  onClick={() => {
                    setSearch('')
                    setFilter('all')
                  }}
                >
                  {t('orderHistory.resetFilters')}
                </button>
              </div>
            ) : (
              <div className="order-history-list">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status)
                  const review = myReviews[order.orderId]
                  const canRate = order.status === 'delivered'
                  const isPharmacy = order.orderType === 'pharmacy'
                  const vendorName =
                    order.restaurantName || order.pharmacyName || 'Vendor'

                  return (
                    <div className="order-history-card" key={order.firebaseId}>
                      {/* Header */}
                      <div className="order-history-header">
                        <div>
                          <strong>
                            {t('orderHistory.orderLabel')}
                            {order.orderId}
                          </strong>
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

                      {/* Restaurant/Pharmacy */}
                      <div className="order-history-restaurant">
                        <div className="order-history-logo">
                          {order.restaurantLogo || order.pharmacyLogo ? (
                            <img
                              src={order.restaurantLogo || order.pharmacyLogo}
                              alt={vendorName}
                            />
                          ) : (
                            <span>{isPharmacy ? '💊' : '🏪'}</span>
                          )}
                        </div>
                        <div>
                          <strong>{vendorName}</strong>
                          <small>
                            {order.items?.length || 0}{' '}
                            {(order.items?.length || 0) !== 1
                              ? t('orderHistory.itemsLabel')
                              : t('orderHistory.itemLabel')}
                            {isPharmacy && ` · 💊 ${t('nav.pharmacy')}`}
                          </small>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="order-history-items">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div className="history-item" key={idx}>
                            <span>
                              {item.emoji || '🍽️'} {item.name}
                            </span>
                            <span className="history-quantity">
                              × {item.quantity}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <div
                            className="history-item"
                            style={{
                              color: 'var(--text-tertiary)',
                              fontStyle: 'italic',
                              justifyContent: 'center',
                            }}
                          >
                            + {order.items.length - 3}{' '}
                            {order.items.length - 3 !== 1
                              ? t('orderHistory.moreItemsPlural')
                              : t('orderHistory.moreItems')}
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="order-history-total">
                        <span>{t('orderHistory.totalLabel')}</span>
                        <strong>৳{order.total}</strong>
                      </div>

                      {/* Rated badge */}
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
                          ✅ {t('orderHistory.youRated')} {review.rating}⭐
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

                      {/* Actions */}
                      <div className="order-history-actions">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="track-order-button"
                          style={{
                            background: 'var(--surface-soft)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)',
                          }}
                        >
                          <Eye size={14} strokeWidth={2.4} />
                          {t('orderHistory.detailsBtn')}
                        </button>

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
                              boxShadow:
                                '0 4px 12px rgba(245, 158, 11, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            ⭐ {t('orderHistory.rateBtn')}
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
                            ✅ {t('orderHistory.ratedBtn')}
                          </button>
                        )}

                        {order.status !== 'cancelled' &&
                          order.status !== 'delivered' && (
                            <Link
                              to={`/track-order?id=${order.orderId}`}
                              className="track-order-button"
                            >
                              🛵 {t('orderHistory.trackBtn')}
                            </Link>
                          )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
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
                  {t('orderHistory.rateTitle')}
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  {t('orderHistory.orderLabel')}
                  {ratingOrder.orderId} · {ratingOrder.restaurantName}
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
                {t('orderHistory.rateFoodQ')}
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
                  {getRatingText(restaurantRating)}
                </p>
              )}
            </div>

            {/* Rider rating */}
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
                  {t('orderHistory.rateRiderQ')} ({ratingOrder.riderName})
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
                    {getRiderRatingText(riderRating)}
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
                  {t('orderHistory.rateRiderOptional')}
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
                {t('orderHistory.commentLabel')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('orderHistory.commentPlaceholder')}
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
              {submitting
                ? t('orderHistory.submitting')
                : t('orderHistory.submitReview')}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ORDER DETAIL MODAL */}
      {/* ============================================================ */}
      {detailOrder && (
        <div
          className="outside-area-modal"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: '24px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px dashed var(--border)',
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
                  {t('orderHistory.orderLabel')}
                  {detailOrder.orderId}
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  {formatDate(detailOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Status */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: getStatusInfo(detailOrder.status).color + '12',
                border: `1px solid ${getStatusInfo(detailOrder.status).color}30`,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 800,
                color: getStatusInfo(detailOrder.status).color,
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {getStatusInfo(detailOrder.status).icon}
              </span>
              {getStatusInfo(detailOrder.status).label}
              {detailOrder.cancelReason && (
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginLeft: 'auto',
                  }}
                >
                  · {detailOrder.cancelReason}
                </span>
              )}
            </div>

            {/* Vendor */}
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: 'var(--surface-soft)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  overflow: 'hidden',
                }}
              >
                {detailOrder.restaurantLogo ? (
                  <img
                    src={detailOrder.restaurantLogo}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  '🏪'
                )}
              </div>
              <div>
                <strong style={{ fontSize: '14.5px', fontWeight: 800 }}>
                  {detailOrder.restaurantName}
                </strong>
                {detailOrder.zoneName && (
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                    }}
                  >
                    📍 {detailOrder.zoneName}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <h3
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '16px 0 10px',
              }}
            >
              {t('orderHistory.detailItems')} ({detailOrder.items?.length || 0})
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--surface-soft)',
              }}
            >
              {detailOrder.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {item.emoji || '🍽️'} {item.name}
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    × {item.quantity} · ৳{(item.price || 0) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <h3
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '16px 0 10px',
              }}
            >
              {t('orderHistory.detailDelivery')}
            </h3>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--surface-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {detailOrder.fullName}
                </strong>{' '}
                · {detailOrder.phone}
              </div>
              <div>📌 {detailOrder.address}</div>
              {detailOrder.orderNote && (
                <div style={{ fontStyle: 'italic' }}>
                  📝 {detailOrder.orderNote}
                </div>
              )}
            </div>

            {/* Payment */}
            <h3
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '16px 0 10px',
              }}
            >
              {t('orderHistory.detailPayment')}
            </h3>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--surface-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('orderHistory.detailSubtotal')}
                </span>
                <strong>৳{detailOrder.subtotal}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('orderHistory.detailDeliveryFee')}
                </span>
                <strong>৳{detailOrder.deliveryFee}</strong>
              </div>
              {detailOrder.couponDiscount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#059669',
                  }}
                >
                  <span>
                    {t('orderHistory.detailCoupon')} (
                    {detailOrder.couponCode})
                  </span>
                  <strong>-৳{detailOrder.couponDiscount}</strong>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  marginTop: '4px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '15px',
                }}
              >
                <span style={{ fontWeight: 800 }}>
                  {t('orderHistory.detailTotal')}
                </span>
                <strong style={{ color: '#059669', fontSize: '17px' }}>
                  ৳{detailOrder.total}
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700,
                }}
              >
                <span>{t('orderHistory.detailPaymentMethod')}</span>
                <span style={{ textTransform: 'uppercase' }}>
                  {detailOrder.paymentMethod || 'COD'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              {detailOrder.status !== 'cancelled' &&
                detailOrder.status !== 'delivered' && (
                  <Link
                    to={`/track-order?id=${detailOrder.orderId}`}
                    className="track-order-button"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    🛵 {t('orderHistory.trackBtn')}
                  </Link>
                )}
              {detailOrder.status === 'delivered' &&
                !myReviews[detailOrder.orderId] && (
                  <button
                    onClick={() => {
                      const o = detailOrder
                      setDetailOrder(null)
                      setTimeout(() => openRatingModal(o), 100)
                    }}
                    style={{
                      flex: 1,
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
                    }}
                  >
                    ⭐ {t('orderHistory.rateBtn')}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistoryPage