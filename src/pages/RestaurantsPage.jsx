import { useMemo, useState } from 'react'
import { restaurantsData } from '../data/restaurantsData'

function RestaurantsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recommended')
  const [isListening, setIsListening] = useState(false)

  // Voice Search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setSearch(transcript)
    }

    recognition.start()
  }

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurantsData]

    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter((restaurant) =>
        `${restaurant.name} ${restaurant.cuisine}`.toLowerCase().includes(query)
      )
    }

    if (filter === 'top-rated') {
      result = result.filter((restaurant) => restaurant.rating >= 4.8)
    }

    if (filter === 'fast-delivery') {
      result = result.filter((restaurant) => restaurant.deliveryMin <= 25)
    }

    if (filter === 'budget') {
      result = result.filter((restaurant) => restaurant.price === '৳')
    }

    if (sort === 'rating') {
      result.sort((a, b) => b.rating - a.rating)
    }

    if (sort === 'fastest') {
      result.sort((a, b) => a.deliveryMin - b.deliveryMin)
    }

    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [search, filter, sort])

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="section-label">ARAIHAZAR LOCAL FOOD</span>
          <h1>Find Your Next <span>Favourite Restaurant</span></h1>
          <p>Explore the best local restaurants around Araihazar and discover something delicious today.</p>
        </div>

        <div className="restaurant-page-stats">
          <div className="restaurant-stat"><strong>20+</strong><span>Local Restaurants</span></div>
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
            {isListening && <span className="listening-indicator">🎤</span>}
            {search && <button type="button" onClick={() => setSearch('')} className="clear-search">×</button>}
            <button type="button" className="voice-search-button" onClick={handleVoiceSearch}>
              🎤
            </button>
          </div>

          <div className="restaurant-filter-row">
            <button className={filter === 'all' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'top-rated' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('top-rated')}>⭐ Top Rated</button>
            <button className={filter === 'fast-delivery' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('fast-delivery')}>🚴 Fast Delivery</button>
            <button className={filter === 'budget' ? 'restaurant-filter active' : 'restaurant-filter'} onClick={() => setFilter('budget')}>💰 Budget</button>
          </div>

          <div className="restaurant-sort">
            <label htmlFor="restaurant-sort">Sort by</label>
            <select id="restaurant-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="fastest">Fastest Delivery</option>
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
              <div className="all-restaurant-card" key={restaurant.id}>
                <div className="all-restaurant-image">
                  <span className="restaurant-main-emoji">{restaurant.emoji}</span>
                  <div className="restaurant-badge">{restaurant.badge}</div>
                  <div className="all-restaurant-rating">⭐ {restaurant.rating}</div>
                </div>
                <div className="all-restaurant-info">
                  <div className="restaurant-title-row">
                    <h2>{restaurant.name}</h2>
                    <span className="restaurant-price">{restaurant.price}</span>
                  </div>
                  <p className="restaurant-cuisine">{restaurant.cuisine}</p>
                  <div className="all-restaurant-meta">
                    <span>🚴 {restaurant.delivery}</span>
                    <span>⚡ Fast Delivery</span>
                  </div>
                  <button className="restaurant-menu-button" onClick={() => { window.location.href = `/restaurant?id=${restaurant.id}` }}>
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