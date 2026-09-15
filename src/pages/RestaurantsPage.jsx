import { useState, useEffect, useMemo } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recommended')

  // Firebase Live Restaurants (শুধু Approved)
  useEffect(() => {
    const restaurantQuery = query(
      collection(db, 'restaurants'),
      where('status', '==', 'approved')
    )

    const unsubscribe = onSnapshot(restaurantQuery, (snapshot) => {
      const restaurantList = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data()
      }))
      setRestaurants(restaurantList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.restaurantName} ${r.cuisine}`.toLowerCase().includes(q)
      )
    }

    // Filter
    if (filter === 'top-rated') {
      result = result.filter((r) => (r.rating || 0) >= 4.8)
    }

    if (filter === 'fast-delivery') {
      result = result.filter((r) => r.restaurantStatus === 'online')
    }

    if (filter === 'budget') {
      result = result.filter((r) => (r.deliveryFee || 0) <= 30)
    }

    // Sort
    if (sort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    if (sort === 'name') {
      result.sort((a, b) => (a.restaurantName || '').localeCompare(b.restaurantName || ''))
    }

    return result
  }, [restaurants, search, filter, sort])

  if (loading) {
    return (
      <div className="restaurants-page">
        <p style={{ padding: 40, textAlign: 'center' }}>Loading restaurants...</p>
      </div>
    )
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="section-label">ARAIHAZAR LOCAL FOOD</span>
          <h1>Find Your Next <span>Favourite Restaurant</span></h1>
          <p>Explore the best local restaurants around Araihazar and discover something delicious today.</p>
        </div>

        <div className="restaurant-page-stats">
          <div className="restaurant-stat"><strong>{restaurants.length}+</strong><span>Local Restaurants</span></div>
          <div className="restaurant-stat"><strong>100+</strong><span>Food Items</span></div>
          <div className="restaurant-stat"><strong>4.8 ⭐</strong><span>Average Rating</span></div>
          <div className="restaurant-stat"><strong>30 min</strong><span>Average Delivery</span></div>
        </div>

        <div className="restaurant-controls">
          <div className="restaurant-search">
            <span>🔎</span>
            <input
              type="text"
              placeholder="Search restaurants or food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button type="button" onClick={() => setSearch('')} className="clear-search">×</button>}
          </div>

          <div className="restaurant-filter-row">
            <button className={filter === 'all' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'top-rated' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('top-rated')}>⭐ Top Rated</button>
            <button className={filter === 'fast-delivery' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('fast-delivery')}>🟢 Open Now</button>
            <button className={filter === 'budget' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('budget')}>💰 Budget</button>
          </div>

          <div className="restaurant-sort">
            <label htmlFor="restaurant-sort">Sort by</label>
            <select id="restaurant-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="restaurants-list-header">
          <div>
            <span className="section-label">EXPLORE</span>
            <h2>Restaurants Near You</h2>
          </div>
          <span className="restaurant-count">{filteredRestaurants.length} Restaurants</span>
        </div>

        {filteredRestaurants.length > 0 ? (
          <div className="all-restaurants-grid">
            {filteredRestaurants.map((restaurant) => (
              <div className="all-restaurant-card" key={restaurant.firebaseId}>
                <div className="all-restaurant-image">
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.restaurantName} className="restaurant-logo-img" />
                  ) : (
                    <span className="restaurant-main-emoji">🏪</span>
                  )}
                  {restaurant.restaurantStatus === 'online' && (
                    <div className="restaurant-badge online-badge">🟢 Open</div>
                  )}
                  {restaurant.restaurantStatus === 'busy' && (
                    <div className="restaurant-badge busy-badge">🟡 Busy</div>
                  )}
                  <div className="all-restaurant-rating">⭐ {restaurant.rating || '4.5'}</div>
                </div>
                <div className="all-restaurant-info">
                  <div className="restaurant-title-row">
                    <h2>{restaurant.restaurantName}</h2>
                    <span className="restaurant-price">৳{restaurant.deliveryFee || 30}</span>
                  </div>
                  <p className="restaurant-cuisine">{restaurant.cuisine}</p>
                  <div className="all-restaurant-meta">
                    <span>🕒 {restaurant.openingTime} - {restaurant.closingTime}</span>
                    <span>📦 Min ৳{restaurant.minimumOrder || 100}</span>
                  </div>
                  <button className="restaurant-menu-button" onClick={() => { window.location.href = `/restaurant?id=${restaurant.firebaseId}` }}>
                    <span>View Menu</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No restaurants found</h2>
            <p>Try another search or choose a different filter.</p>
            <button onClick={() => { setSearch(''); setFilter('all'); setSort('recommended') }}>Reset Search</button>
          </div>
        )}

        <div className="restaurants-bottom-cta">
          <div>
            <span className="section-label">ARAIFOOD</span>
            <h2>Can't decide what to eat?</h2>
            <p>Explore our popular restaurants and find your next favourite meal.</p>
          </div>
          <button onClick={() => { window.location.href = '/' }}>Explore Home →</button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantsPage