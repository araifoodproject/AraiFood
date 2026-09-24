// ============================================================
// src/pages/RestaurantsPage.jsx
// V2 — Enhanced filters + sort + stats + food search
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Star, Search, X, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import PageBackButton from '../components/PageBackButton'

function RestaurantsPage() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [restaurants, setRestaurants] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recommended')
  const [conflictModal, setConflictModal] = useState(null)
  const navigate = useNavigate()

  // Sync search from URL
  useEffect(() => {
    const q = searchParams.get('search') || ''
    setSearch(q)
  }, [searchParams])

  // Load restaurants
  useEffect(() => {
    const restaurantQuery = query(
      collection(db, 'restaurants'),
      where('status', '==', 'approved')
    )
    const unsub = onSnapshot(restaurantQuery, (snap) => {
      setRestaurants(
        snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      )
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Load foods
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'foods'), (snap) => {
      setFoods(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // ============ HELPERS ============
  const parseDeliveryTime = (timeStr) => {
    if (!timeStr) return 999
    const match = timeStr.match(/(\d+)/)
    return match ? parseInt(match[1]) : 999
  }

  // ============ FILTER + SORT ============
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.restaurantName || ''} ${r.cuisine || ''} ${
          r.description || ''
        }`
          .toLowerCase()
          .includes(q)
      )
    }

    // Filter
    switch (filter) {
      case 'top-rated':
        result = result.filter((r) => (r.rating || 0) >= 4.5)
        break
      case 'open-now':
        result = result.filter((r) => r.restaurantStatus === 'online')
        break
      case 'budget':
        result = result.filter((r) => (r.deliveryFee || 0) <= 30)
        break
      case 'fast':
        result = result.filter(
          (r) => parseDeliveryTime(r.deliveryTime || r.delivery) <= 30
        )
        break
      case 'veg':
        result = result.filter((r) =>
          (r.cuisine || '').toLowerCase().includes('veg')
        )
        break
      case 'all':
      default:
        break
    }

    // Sort
    switch (sort) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'fastest':
        result.sort(
          (a, b) =>
            parseDeliveryTime(a.deliveryTime || a.delivery) -
            parseDeliveryTime(b.deliveryTime || b.delivery)
        )
        break
      case 'cheapest':
        result.sort(
          (a, b) => (a.deliveryFee || 999) - (b.deliveryFee || 999)
        )
        break
      case 'newest':
        result.sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
        break
      case 'name':
        result.sort((a, b) =>
          (a.restaurantName || '').localeCompare(b.restaurantName || '')
        )
        break
      case 'recommended':
      default:
        // Recommended: higher rating first, then open ones
        result.sort((a, b) => {
          const aScore =
            (a.rating || 0) * 10 + (a.restaurantStatus === 'online' ? 5 : 0)
          const bScore =
            (b.rating || 0) * 10 + (b.restaurantStatus === 'online' ? 5 : 0)
          return bScore - aScore
        })
        break
    }

    return result
  }, [restaurants, search, filter, sort])

  // Food search
  const matchingFoods = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return foods
      .filter(
        (f) =>
          f.available !== false &&
          `${f.name || ''} ${f.category || ''} ${f.description || ''}`
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 12)
  }, [foods, search])

  // ============ STATS ============
  const stats = useMemo(() => {
    const openCount = restaurants.filter(
      (r) => r.restaurantStatus === 'online'
    ).length
    const avgRating =
      restaurants.length > 0
        ? restaurants.reduce((s, r) => s + (r.rating || 0), 0) /
          restaurants.length
        : 0
    return {
      total: restaurants.length,
      foods: foods.length,
      open: openCount,
      avgRating: avgRating.toFixed(1),
    }
  }, [restaurants, foods])

  // ============ CART ============
  const addToCartDirect = (food) => {
    const restaurant = restaurants.find(
      (r) => r.firebaseId === food.restaurantId
    )
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')

    const existingIndex = cartItems.findIndex((c) => c.id === food.firebaseId)

    let updatedCart
    if (existingIndex >= 0) {
      updatedCart = cartItems.map((c, i) =>
        i === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
      )
    } else {
      updatedCart = [
        ...cartItems,
        {
          id: food.firebaseId,
          name: food.name,
          price: food.discountPrice || food.price,
          emoji: food.emoji || '🍽️',
          image: food.image || '',
          quantity: 1,
          restaurantId: food.restaurantId,
          restaurantName:
            restaurant?.restaurantName || food.restaurantName || 'Restaurant',
          restaurantLogo: restaurant?.logo || '',
          deliveryFee: restaurant?.deliveryFee || 30,
          minimumOrder: restaurant?.minimumOrder || 100,
          deliveryTime: restaurant?.deliveryTime || '30-40 min',
        },
      ]
    }

    localStorage.setItem('cartItems', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
    toast.success(`${food.name} added to cart!`, { autoClose: 1500 })
  }

  const handleAddFood = (food) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    if (cartItems.length === 0) {
      addToCartDirect(food)
      return
    }
    if (cartItems[0].restaurantId === food.restaurantId) {
      addToCartDirect(food)
    } else {
      setConflictModal({
        food,
        currentRestaurant: cartItems[0].restaurantName,
      })
    }
  }

  const handleConflictConfirm = () => {
    if (!conflictModal) return
    localStorage.setItem('cartItems', JSON.stringify([]))
    addToCartDirect(conflictModal.food)
    setConflictModal(null)
  }

  // ============ FILTER OPTIONS ============
  const FILTERS = [
    { value: 'all', label: 'All', icon: '🍽️' },
    { value: 'top-rated', label: 'Top Rated', icon: '⭐' },
    { value: 'open-now', label: 'Open Now', icon: '🟢' },
    { value: 'fast', label: 'Fast Delivery', icon: '🚀' },
    { value: 'budget', label: 'Budget', icon: '💰' },
    { value: 'veg', label: 'Pure Veg', icon: '🥬' },
  ]

  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading restaurants...</p>
        </div>
      </div>
    )
  }

  const hasSearch = search.trim().length > 0

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">ARAIHAZAR LOCAL FOOD</span>
          <h1>
            Find Your Next <span>Favourite Restaurant</span>
          </h1>
          <p>
            Explore the best local restaurants around Araihazar and discover
            something delicious today.
          </p>
        </div>

        {/* Stats */}
        <div className="restaurant-page-stats">
          <div className="restaurant-stat">
            <strong>{stats.total}+</strong>
            <span>Restaurants</span>
          </div>
          <div className="restaurant-stat">
            <strong>{stats.foods}+</strong>
            <span>Food Items</span>
          </div>
          <div className="restaurant-stat">
            <strong>{stats.open}</strong>
            <span>Open Now</span>
          </div>
          <div className="restaurant-stat">
            <strong>{stats.avgRating} ⭐</strong>
            <span>Avg Rating</span>
          </div>
        </div>

        {/* Controls */}
        <div className="restaurant-controls">
          {/* Search */}
          <div className="restaurant-search">
            <Search size={18} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search food or restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="clear-search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="restaurant-filter-row">
            {FILTERS.map((f) => (
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

          {/* Sort + Results */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div className="restaurant-sort">
              <label htmlFor="restaurant-sort">Sort by</label>
              <select
                id="restaurant-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="rating">⭐ Highest Rated</option>
                <option value="fastest">🚀 Fastest Delivery</option>
                <option value="cheapest">💰 Lowest Fee</option>
                <option value="newest">📅 Newest</option>
                <option value="name">A-Z by Name</option>
              </select>
            </div>

            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
              }}
            >
              {filteredRestaurants.length} restaurant
              {filteredRestaurants.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* ============ FOOD SEARCH RESULTS ============ */}
        {hasSearch && matchingFoods.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div className="restaurants-list-header">
              <div>
                <span className="glass-section-label">FOOD MATCHES</span>
                <h2>Foods for "{search}"</h2>
              </div>
              <span className="restaurant-count">
                {matchingFoods.length} item(s)
              </span>
            </div>

            <div className="glass-dish-grid">
              {matchingFoods.map((food) => {
                const rest = restaurants.find(
                  (r) => r.firebaseId === food.restaurantId
                )
                return (
                  <div className="glass-dish-card" key={food.firebaseId}>
                    <div className="glass-dish-image">
                      {food.image ? (
                        <img
                          src={food.image}
                          alt={food.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <span>{food.emoji || '🍽️'}</span>
                      )}
                      <div className="glass-dish-hot">
                        <Star size={12} strokeWidth={0} fill="#FFFFFF" />
                        Hot
                      </div>
                    </div>

                    <div className="glass-dish-info">
                      <h3>{food.name}</h3>
                      <p>{rest?.restaurantName || 'Restaurant'}</p>

                      <div className="glass-dish-bottom">
                        <div className="glass-dish-price">
                          <strong>৳{food.discountPrice || food.price}</strong>
                          {food.discountPrice && (
                            <del
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                              }}
                            >
                              ৳{food.price}
                            </del>
                          )}
                        </div>

                        <button
                          className="glass-dish-add orange"
                          title="Add to cart"
                          onClick={() => handleAddFood(food)}
                        >
                          <Plus size={16} strokeWidth={2.8} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ============ RESTAURANTS ============ */}
        <div className="restaurants-list-header">
          <div>
            <span className="glass-section-label">
              {hasSearch ? 'RESTAURANT MATCHES' : 'EXPLORE'}
            </span>
            <h2>
              {hasSearch
                ? `Restaurants for "${search}"`
                : filter === 'all' && sort === 'recommended'
                ? 'All Restaurants'
                : `${FILTERS.find((f) => f.value === filter)?.label} Restaurants`}
            </h2>
          </div>
          <span className="restaurant-count">
            {filteredRestaurants.length} Result
            {filteredRestaurants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredRestaurants.length > 0 ? (
          <div className="all-restaurants-grid">
            {filteredRestaurants.map((restaurant) => (
              <div
                className="all-restaurant-card"
                key={restaurant.firebaseId}
                onClick={() =>
                  navigate(`/restaurant?id=${restaurant.firebaseId}`)
                }
              >
                <div className="all-restaurant-image">
                  {restaurant.logo ? (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.restaurantName}
                      className="restaurant-logo-img"
                    />
                  ) : (
                    <span className="restaurant-main-emoji">🏪</span>
                  )}

                  {restaurant.restaurantStatus === 'online' && (
                    <div className="restaurant-badge online-badge">
                      🟢 Open
                    </div>
                  )}
                  {restaurant.restaurantStatus === 'busy' && (
                    <div className="restaurant-badge busy-badge">🟡 Busy</div>
                  )}

                  <div className="all-restaurant-rating">
                    <Star size={12} strokeWidth={0} fill="#F59E0B" />
                    {restaurant.rating?.toFixed?.(1) ||
                      restaurant.rating ||
                      '4.5'}
                  </div>
                </div>

                <div className="all-restaurant-info">
                  <div className="restaurant-title-row">
                    <h2>{restaurant.restaurantName}</h2>
                    <span className="restaurant-price">
                      ৳{restaurant.deliveryFee || 30}
                    </span>
                  </div>
                  <p className="restaurant-cuisine">{restaurant.cuisine}</p>
                  <div className="all-restaurant-meta">
                    <span>
                      🕒{' '}
                      {restaurant.deliveryTime ||
                        `${restaurant.openingTime || '10:00'} - ${
                          restaurant.closingTime || '22:00'
                        }`}
                    </span>
                    <span>📦 Min ৳{restaurant.minimumOrder || 100}</span>
                  </div>
                  <button
                    className="restaurant-menu-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/restaurant?id=${restaurant.firebaseId}`)
                    }}
                  >
                    <span>View Menu</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : hasSearch && matchingFoods.length > 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: 'var(--text-tertiary)',
              background: 'var(--surface-soft)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p style={{ fontSize: '14px', margin: 0 }}>
              No restaurants match "<strong>{search}</strong>" — but we found{' '}
              <strong>{matchingFoods.length} food item(s)</strong> above! 👆
            </p>
          </div>
        ) : (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No results found</h2>
            <p>
              {search
                ? `No restaurants match "${search}" with current filters.`
                : 'Try a different filter or search.'}
            </p>
            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
                setSort('recommended')
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="restaurants-bottom-cta">
          <div>
            <span
              className="glass-section-label"
              style={{ color: '#FFFFFF' }}
            >
              ARAIFOOD
            </span>
            <h2>Can't decide what to eat?</h2>
            <p>
              Explore our popular restaurants and find your next favourite
              meal.
            </p>
          </div>
          <button onClick={() => navigate('/')}>Explore Home →</button>
        </div>
      </div>

      {/* Conflict Modal */}
      {conflictModal && (
        <div
          className="outside-area-modal"
          onClick={() => setConflictModal(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="outside-area-icon">⚠️</div>
            <h2>Clear Your Cart?</h2>
            <p>
              Your cart has items from{' '}
              <strong>{conflictModal.currentRestaurant}</strong>.
              <br />
              <br />
              Do you want to clear the cart and add{' '}
              <strong>{conflictModal.food.name}</strong>?
            </p>
            <div className="conflict-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setConflictModal(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleConflictConfirm}
              >
                Yes, Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantsPage