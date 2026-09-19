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
  const [addingId, setAddingId] = useState(null)
  const [conflictModal, setConflictModal] = useState(null)
  const navigate = useNavigate()

  // Update search if URL param changes
  useEffect(() => {
    const q = searchParams.get('search') || ''
    setSearch(q)
  }, [searchParams])

  // Load approved restaurants
  useEffect(() => {
    const restaurantQuery = query(
      collection(db, 'restaurants'),
      where('status', '==', 'approved')
    )
    const unsubscribe = onSnapshot(restaurantQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      setRestaurants(list)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Load all foods
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'foods'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      setFoods(list)
    })
    return () => unsubscribe()
  }, [])

  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.restaurantName || ''} ${r.cuisine || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    if (filter === 'top-rated') {
      result = result.filter((r) => (r.rating || 0) >= 4.5)
    }

    if (filter === 'fast-delivery') {
      result = result.filter((r) => r.restaurantStatus === 'online')
    }

    if (filter === 'budget') {
      result = result.filter((r) => (r.deliveryFee || 0) <= 30)
    }

    if (sort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    if (sort === 'name') {
      result.sort((a, b) =>
        (a.restaurantName || '').localeCompare(b.restaurantName || '')
      )
    }

    return result
  }, [restaurants, search, filter, sort])

  // Filter foods by search
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

  // ============ ADD TO CART ============
  const addToCartDirect = (food) => {
    const restaurant = restaurants.find((r) => r.firebaseId === food.restaurantId)
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
            <strong>{restaurants.length}+</strong>
            <span>Local Restaurants</span>
          </div>
          <div className="restaurant-stat">
            <strong>{foods.length}+</strong>
            <span>Food Items</span>
          </div>
          <div className="restaurant-stat">
            <strong>4.8 ⭐</strong>
            <span>Average Rating</span>
          </div>
          <div className="restaurant-stat">
            <strong>30 min</strong>
            <span>Average Delivery</span>
          </div>
        </div>

        {/* Controls */}
        <div className="restaurant-controls">
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

          <div className="restaurant-filter-row">
            <button
              className={
                filter === 'all'
                  ? 'restaurant-filter active'
                  : 'restaurant-filter'
              }
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={
                filter === 'top-rated'
                  ? 'restaurant-filter active'
                  : 'restaurant-filter'
              }
              onClick={() => setFilter('top-rated')}
            >
              ⭐ Top Rated
            </button>
            <button
              className={
                filter === 'fast-delivery'
                  ? 'restaurant-filter active'
                  : 'restaurant-filter'
              }
              onClick={() => setFilter('fast-delivery')}
            >
              🟢 Open Now
            </button>
            <button
              className={
                filter === 'budget'
                  ? 'restaurant-filter active'
                  : 'restaurant-filter'
              }
              onClick={() => setFilter('budget')}
            >
              💰 Budget
            </button>
          </div>

          <div className="restaurant-sort">
            <label htmlFor="restaurant-sort">Sort by</label>
            <select
              id="restaurant-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A–Z</option>
            </select>
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
                          disabled={addingId === food.firebaseId}
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
                : 'Restaurants Near You'}
            </h2>
          </div>
          <span className="restaurant-count">
            {filteredRestaurants.length} Restaurants
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
                    {restaurant.rating || '4.5'}
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
                      🕒 {restaurant.openingTime || '10:00'} -{' '}
                      {restaurant.closingTime || '22:00'}
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
            <h2>No results for "{search}"</h2>
            <p>Try another search or choose a different filter.</p>
            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
                setSort('recommended')
              }}
            >
              Reset Search
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