// ============================================================
// src/pages/RestaurantPage.jsx
// V3 — Mobile Responsive (inline styles, no global CSS touched)
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import Cart from '../components/Cart'
import { db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from 'firebase/firestore'
import { Search, X, Star, ShoppingBag } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'

// ============================================================
// MOBILE RESPONSIVE STYLES (page-scoped, no global CSS touched)
// ============================================================
const MOBILE_STYLES = `
  /* ---------- Base mobile tweaks (<=640px) ---------- */
  @media (max-width: 640px) {
    .restaurant-page {
      padding: 12px 12px 90px !important;
    }

    /* Header */
    .restaurant-page-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
      padding: 14px !important;
      border-radius: 18px !important;
    }
    .restaurant-header-with-logo {
      gap: 12px !important;
      align-items: flex-start !important;
    }
    .restaurant-header-logo {
      width: 64px !important;
      height: 64px !important;
      border-radius: 16px !important;
      flex-shrink: 0 !important;
    }
    .restaurant-header-logo img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 16px !important;
    }
    .restaurant-header-info h1 {
      font-size: 18px !important;
      line-height: 1.25 !important;
      margin-bottom: 4px !important;
    }
    .restaurant-header-info p {
      font-size: 12.5px !important;
      margin-bottom: 4px !important;
    }
    .restaurant-header-info > span {
      font-size: 11.5px !important;
      line-height: 1.5 !important;
      display: block !important;
    }
    .restaurant-status-badge {
      align-self: flex-start !important;
      font-size: 12px !important;
      padding: 6px 12px !important;
    }

    /* Menu section */
    .menu-section {
      padding: 0 !important;
    }
    .menu-heading h2 {
      font-size: 20px !important;
    }
    .menu-heading p {
      font-size: 13px !important;
    }

    /* Search bar — bigger tap target */
    .menu-search-bar {
      padding: 10px 14px !important;
      border-radius: 14px !important;
      margin-bottom: 16px !important;
    }
    .menu-search-bar input {
      font-size: 15px !important;
      padding: 6px 0 !important;
    }

    /* Food grid — 1 column on mobile */
    .food-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    /* Food card — horizontal layout for mobile */
    .food-card {
      flex-direction: row !important;
      align-items: stretch !important;
      padding: 10px !important;
      gap: 12px !important;
      border-radius: 16px !important;
    }
    .food-image {
      width: 92px !important;
      height: 92px !important;
      min-width: 92px !important;
      border-radius: 12px !important;
      flex-shrink: 0 !important;
    }
    .food-image img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 12px !important;
    }
    .food-info {
      padding: 0 !important;
      flex: 1 !important;
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
    }
    .food-info h3 {
      font-size: 14.5px !important;
      line-height: 1.3 !important;
      margin-bottom: 4px !important;
    }
    .food-info p {
      font-size: 12px !important;
      line-height: 1.4 !important;
      margin-bottom: 6px !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }
    .food-bottom {
      gap: 10px !important;
      margin-top: auto !important;
    }
    .food-price-box strong {
      font-size: 15px !important;
    }
    .food-price-box del {
      font-size: 12px !important;
    }
    /* Big tap target for Add button */
    .food-bottom button {
      min-width: 72px !important;
      min-height: 40px !important;
      padding: 8px 14px !important;
      font-size: 13px !important;
      border-radius: 10px !important;
    }

    /* ---------- Reviews modal ---------- */
    .outside-area-modal-content {
      max-height: 88vh !important;
      padding: 16px !important;
      border-radius: 20px !important;
      margin: 0 10px !important;
    }
    .conflict-modal-buttons {
      flex-direction: column-reverse !important;
      gap: 10px !important;
    }
    .conflict-modal-buttons button {
      width: 100% !important;
      min-height: 46px !important;
      font-size: 14px !important;
    }

    /* ---------- Sticky mobile cart bar ---------- */
    .mobile-cart-bar {
      display: flex !important;
    }
  }

  /* ---------- Smaller phones (<=400px) ---------- */
  @media (max-width: 400px) {
    .restaurant-page {
      padding: 10px 10px 90px !important;
    }
    .restaurant-header-logo {
      width: 56px !important;
      height: 56px !important;
    }
    .restaurant-header-info h1 {
      font-size: 16.5px !important;
    }
    .food-image {
      width: 78px !important;
      height: 78px !important;
      min-width: 78px !important;
    }
    .food-info h3 {
      font-size: 13.5px !important;
    }
  }

  /* ---------- Very small phones (<=360px) ---------- */
  @media (max-width: 360px) {
    .restaurant-page {
      padding: 8px 8px 86px !important;
    }
    .restaurant-header-logo {
      width: 50px !important;
      height: 50px !important;
    }
    .restaurant-header-info h1 {
      font-size: 15.5px !important;
    }
    .food-image {
      width: 70px !important;
      height: 70px !important;
      min-width: 70px !important;
    }
  }

  /* Mobile cart bar — hidden on desktop */
  .mobile-cart-bar {
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
    gap: 10px;
  }
  .mobile-cart-bar-info {
    flex: 1;
    min-width: 0;
  }
  .mobile-cart-bar-info strong {
    display: block;
    font-family: var(--font-heading, inherit);
    font-size: 15px;
    font-weight: 900;
    color: var(--text-primary, #111);
    line-height: 1.2;
  }
  .mobile-cart-bar-info span {
    display: block;
    font-size: 11.5px;
    color: var(--text-tertiary, #6b7280);
    font-weight: 600;
    margin-top: 2px;
  }
  .mobile-cart-bar button {
    min-height: 46px;
    padding: 0 22px;
    border-radius: 12px;
    background: linear-gradient(135deg, #F59E0B, #D97706);
    color: #fff;
    font-family: var(--font-heading, inherit);
    font-size: 14px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .mobile-cart-bar button:active {
    transform: scale(0.97);
  }
`

function RestaurantPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const restaurantId = searchParams.get('id') || ''
  const { settings } = useSettings()

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuSearch, setMenuSearch] = useState('')

  // ✅ Reviews
  const [reviews, setReviews] = useState([])
  const [showReviewsModal, setShowReviewsModal] = useState(false)

  const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]')
  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)

  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingFood, setPendingFood] = useState(null)

  // ------------------------------------------------------------
  // Load restaurant (live)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      doc(db, 'restaurants', restaurantId),
      (snap) => {
        if (snap.exists()) {
          setRestaurant({ firebaseId: snap.id, ...snap.data() })
        } else {
          toast.error('Restaurant not found!')
          setRestaurant(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Restaurant load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [restaurantId])

  // ------------------------------------------------------------
  // Load menu items (live)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!restaurantId) return
    const menuQuery = query(
      collection(db, 'foods'),
      where('restaurantId', '==', restaurantId)
    )
    const unsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const menuList = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      setMenuItems(menuList)
    })
    return () => unsubscribe()
  }, [restaurantId])

  // ------------------------------------------------------------
  // ✅ Load reviews (live) — only visible
  // ------------------------------------------------------------
  useEffect(() => {
    if (!restaurantId) return
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('restaurantId', '==', restaurantId)
    )
    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ firebaseId: d.id, ...d.data() }))
        .filter((r) => r.hidden !== true)
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
      setReviews(list)
    })
    return () => unsubscribe()
  }, [restaurantId])

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    setCartItems(items)
    window.dispatchEvent(new Event('cartUpdated'))
    return items
  }

  const getResolvedRestaurantValues = () => {
    if (!restaurant) return {}
    return {
      rating: restaurant.rating ?? null,
      deliveryTime:
        restaurant.deliveryTime ||
        restaurant.delivery ||
        settings.defaultDeliveryTime,
      deliveryFee:
        restaurant.deliveryFee != null
          ? restaurant.deliveryFee
          : settings.defaultDeliveryFee,
      minimumOrder:
        restaurant.minimumOrder != null
          ? restaurant.minimumOrder
          : settings.minOrderAmount,
      cuisine: restaurant.cuisine || 'Restaurant',
    }
  }

  const checkCartConflict = (food) => {
    if (cartItems.length === 0) {
      addToCartDirect(food)
      return
    }
    const existingRestaurantId = cartItems[0].restaurantId
    if (existingRestaurantId === restaurant.firebaseId) {
      addToCartDirect(food)
    } else {
      setPendingFood(food)
      setShowConflictModal(true)
    }
  }

  const buildCartItem = (food) => {
    const vals = getResolvedRestaurantValues()
    return {
      id: food.firebaseId,
      name: food.name,
      price: food.discountPrice || food.price,
      emoji: food.emoji || '🍽️',
      image: food.image || '',
      quantity: 1,
      restaurantId: restaurant.firebaseId,
      restaurantName: restaurant.restaurantName,
      restaurantLogo: restaurant.logo || '',
      deliveryFee: vals.deliveryFee,
      minimumOrder: vals.minimumOrder,
      deliveryTime: vals.deliveryTime,
    }
  }

  const addToCartDirect = (food) => {
    const existingItem = cartItems.find((item) => item.id === food.firebaseId)
    const updatedItems = existingItem
      ? cartItems.map((item) =>
          item.id === food.firebaseId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...cartItems, buildCartItem(food)]

    saveCart(updatedItems)
    toast.success(`${food.name} added to cart!`, { autoClose: 2000 })
  }

  const handleClearAndAdd = () => {
    if (!pendingFood) return
    saveCart([buildCartItem(pendingFood)])
    toast.success(`Cart cleared! ${pendingFood.name} added.`)
    setShowConflictModal(false)
    setPendingFood(null)
  }

  const increaseQuantity = (id) => {
    const updatedItems = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    )
    saveCart(updatedItems)
  }

  const decreaseQuantity = (id) => {
    const updatedItems = cartItems
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0)
    saveCart(updatedItems)
  }

  const filteredMenu = menuItems.filter((item) =>
    item.name?.toLowerCase().includes(menuSearch.toLowerCase())
  )
  const availableItems = filteredMenu.filter(
    (item) => item.available !== false
  )

  const formatTime = (time24) => {
    if (!time24) return '10 AM'
    try {
      const [h, m] = time24.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}${m === '00' ? '' : ':' + m} ${ampm}`
    } catch (e) {
      return '10 AM'
    }
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Render stars (read-only)
  const renderReadOnlyStars = (value, size = 14) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            fill={i <= value ? '#F59E0B' : 'transparent'}
            color={i <= value ? '#F59E0B' : '#D1D5DB'}
            strokeWidth={2}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
        <div className="restaurant-page">
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading restaurant...</p>
          </div>
        </div>
      </>
    )
  }

  if (!restaurant) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
        <div className="restaurant-page">
          <div className="restaurant-empty-state">
            <div className="empty-icon">🏪</div>
            <h2>Restaurant Not Found</h2>
            <p>
              The restaurant you're looking for doesn't exist or has been
              removed.
            </p>
            <button onClick={() => navigate('/restaurants')}>
              Browse Restaurants
            </button>
          </div>
        </div>
      </>
    )
  }

  const vals = getResolvedRestaurantValues()
  const isOpen =
    restaurant.restaurantStatus === 'online' ||
    restaurant.restaurantStatus === 'busy'

  // Rating distribution for display
  const ratingCount = reviews.length
  const avgFromReviews =
    ratingCount > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
      : 0
  const displayRating = restaurant.rating ?? avgFromReviews

  // Mobile cart bar data
  const totalCartQty = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartSubtotal = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  )
  const showMobileCartBar = totalCartQty > 0 && !cartOpen

  return (
    <>
      <style>{MOBILE_STYLES}</style>
      <div className="restaurant-page">
        <PageBackButton label="Back" fallback="/restaurants" />

        <div className="restaurant-page-header">
          <div className="restaurant-header-with-logo">
            <div className="restaurant-header-logo">
              {restaurant.logo ? (
                <img src={restaurant.logo} alt={restaurant.restaurantName} />
              ) : (
                <span>🏪</span>
              )}
            </div>
            <div className="restaurant-header-info">
              <h1>{restaurant.restaurantName}</h1>
              <p>🍽️ {vals.cuisine}</p>
              <span>
                {displayRating > 0 && `⭐ ${displayRating.toFixed(1)} • `}
                🕐 {vals.deliveryTime} • 🚚 ৳{vals.deliveryFee} • 📦 Min ৳
                {vals.minimumOrder}
              </span>
            </div>
          </div>

          <div className="restaurant-status-badge">
            <span
              className={`restaurant-status-dot ${
                restaurant.restaurantStatus || 'offline'
              }`}
            ></span>
            {isOpen
              ? 'Open Now'
              : `Closed · Opens ${formatTime(restaurant.openingTime)}`}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RATING SUMMARY */}
        {/* ============================================================ */}
        {ratingCount > 0 && (
          <div
            onClick={() => setShowReviewsModal(true)}
            style={{
              marginBottom: '24px',
              padding: '18px 20px',
              borderRadius: '20px',
              background:
                'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
              border: '1px solid rgba(245,158,11,0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow =
                '0 8px 24px rgba(245,158,11,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                minWidth: '80px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '36px',
                  fontWeight: 900,
                  color: '#D97706',
                  lineHeight: 1,
                }}
              >
                {displayRating.toFixed(1)}
              </span>
              {renderReadOnlyStars(Math.round(displayRating), 16)}
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  marginTop: '2px',
                }}
              >
                {ratingCount} review{ratingCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <strong
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                ⭐ Customer Reviews
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                See what customers say about this restaurant →
              </p>
            </div>

            <div
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              View All →
            </div>
          </div>
        )}

        <div className="menu-section">
          <div className="menu-heading">
            <span className="glass-section-label">MENU</span>
            <h2>Popular Items</h2>
            <p>
              Choose something delicious from {restaurant.restaurantName}.
            </p>
          </div>

          <div className="menu-search-bar">
            <Search size={18} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search food items..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
            />
            {menuSearch && (
              <button
                type="button"
                onClick={() => setMenuSearch('')}
                className="clear-search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {availableItems.length === 0 ? (
            <div className="restaurant-empty-state">
              <div className="empty-icon">🍽️</div>
              <h2>No Food Items Found</h2>
              <p>This restaurant hasn't added any food items yet.</p>
            </div>
          ) : (
            <div className="food-grid">
              {availableItems.map((item) => (
                <div className="food-card" key={item.firebaseId}>
                  <div className="food-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span style={{ fontSize: '40px' }}>
                        {item.emoji || '🍽️'}
                      </span>
                    )}
                  </div>
                  <div className="food-info">
                    <h3>{item.name}</h3>
                    <p>{item.description || 'Delicious food item'}</p>
                    <div className="food-bottom">
                      <div className="food-price-box">
                        {item.discountPrice ? (
                          <>
                            <strong>৳{item.discountPrice}</strong>
                            <del>৳{item.price}</del>
                          </>
                        ) : (
                          <strong>৳{item.price}</strong>
                        )}
                      </div>
                      <button onClick={() => checkCartConflict(item)}>
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartOpen && (
          <Cart
            items={cartItems}
            onClose={() => setCartOpen(false)}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
          />
        )}

        {showConflictModal && (
          <div className="outside-area-modal">
            <div className="outside-area-modal-content">
              <div className="outside-area-icon">⚠️</div>
              <h2>Clear Your Cart?</h2>
              <p>
                Your cart has items from{' '}
                <strong>{cartItems[0]?.restaurantName}</strong>.
                <br />
                <br />
                Do you want to clear the cart and add items from{' '}
                <strong>{restaurant.restaurantName}</strong>?
              </p>
              <div className="conflict-modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowConflictModal(false)
                    setPendingFood(null)
                  }}
                >
                  Cancel
                </button>
                <button className="confirm-btn" onClick={handleClearAndAdd}>
                  Yes, Clear & Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* REVIEWS MODAL */}
        {/* ============================================================ */}
        {showReviewsModal && (
          <div
            className="outside-area-modal"
            onClick={() => setShowReviewsModal(false)}
          >
            <div
              className="outside-area-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '560px',
                width: '100%',
                maxHeight: '85vh',
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
                  alignItems: 'center',
                  marginBottom: '16px',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--glass-bg-strong)',
                  paddingBottom: '12px',
                  borderBottom: '1px dashed var(--border)',
                  zIndex: 2,
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
                    ⭐ Reviews
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '12.5px',
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                    }}
                  >
                    {ratingCount} review{ratingCount !== 1 ? 's' : ''} for{' '}
                    {restaurant.restaurantName}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewsModal(false)}
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

              {/* Average card */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background:
                    'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
                  border: '1px solid rgba(245,158,11,0.25)',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    minWidth: '80px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '42px',
                      fontWeight: 900,
                      color: '#D97706',
                      lineHeight: 1,
                    }}
                  >
                    {displayRating.toFixed(1)}
                  </div>
                  {renderReadOnlyStars(Math.round(displayRating), 16)}
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(
                      (r) => Math.floor(r.rating || 0) === star
                    ).length
                    const percent =
                      ratingCount > 0 ? (count / ratingCount) * 100 : 0
                    return (
                      <div
                        key={star}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            minWidth: '22px',
                            fontWeight: 800,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {star}★
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: 'var(--surface-soft)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background:
                                star >= 4
                                  ? '#16a34a'
                                  : star === 3
                                  ? '#f59e0b'
                                  : '#dc2626',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            minWidth: '30px',
                            textAlign: 'right',
                            color: 'var(--text-tertiary)',
                            fontWeight: 700,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                    📝
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>
                    No reviews yet
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {reviews.map((r) => (
                    <div
                      key={r.firebaseId}
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'var(--surface-soft)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 900,
                            color: '#047857',
                            fontFamily: 'var(--font-heading)',
                            flexShrink: 0,
                          }}
                        >
                          {(r.customerName || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong
                            style={{
                              display: 'block',
                              fontFamily: 'var(--font-heading)',
                              fontSize: '13.5px',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {r.customerName || 'Anonymous'}
                          </strong>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '2px',
                            }}
                          >
                            {renderReadOnlyStars(r.rating || 0, 12)}
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                fontWeight: 600,
                              }}
                            >
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {r.comment && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            fontWeight: 500,
                          }}
                        >
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MOBILE STICKY CART BAR (only on mobile, hidden on desktop) */}
      {/* ============================================================ */}
      {showMobileCartBar && (
        <div className="mobile-cart-bar">
          <div className="mobile-cart-bar-info">
            <strong>{totalCartQty} item{totalCartQty !== 1 ? 's' : ''}</strong>
            <span>Subtotal ৳{cartSubtotal}</span>
          </div>
          <button onClick={() => setCartOpen(true)}>
            <ShoppingBag size={16} strokeWidth={2.5} />
            View Cart
          </button>
        </div>
      )}
    </>
  )
}

export default RestaurantPage