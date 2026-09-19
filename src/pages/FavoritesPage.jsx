import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import PageBackButton from '../components/PageBackButton'

function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState([])
  const [allRestaurants, setAllRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Load favorites from localStorage
  useEffect(() => {
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]')
    setFavoriteIds(favIds)
  }, [])

  // Load approved restaurants from Firestore
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
      setAllRestaurants(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter favorite restaurants
  const favoriteRestaurants = allRestaurants.filter((r) =>
    favoriteIds.includes(r.firebaseId)
  )

  const removeFavorite = (firebaseId) => {
    const updated = favoriteIds.filter((id) => id !== firebaseId)
    localStorage.setItem('favorites', JSON.stringify(updated))
    setFavoriteIds(updated)
  }

  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">YOUR FAVORITES</span>
          <h1>
            Your Favorite <span>Restaurants</span>
          </h1>
          <p>Your personal list of beloved food spots in Araihazar.</p>
        </div>

        {favoriteRestaurants.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">❤️</div>
            <h2>No favorites yet!</h2>
            <p>Tap the heart icon on any restaurant to save it here.</p>
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
          <div className="all-restaurants-grid">
            {favoriteRestaurants.map((restaurant) => (
              <div className="all-restaurant-card" key={restaurant.firebaseId}>
                <div
                  className="all-restaurant-image"
                  onClick={() =>
                    navigate(`/restaurant?id=${restaurant.firebaseId}`)
                  }
                  style={{ cursor: 'pointer' }}
                >
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
                    <div className="restaurant-badge online-badge">🟢 Open</div>
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

                  <div className="favorite-actions">
                    <button
                      className="restaurant-menu-button"
                      onClick={() =>
                        navigate(`/restaurant?id=${restaurant.firebaseId}`)
                      }
                    >
                      <span>View Menu</span>
                      <span>→</span>
                    </button>
                    <button
                      className="remove-favorite-button"
                      onClick={() => removeFavorite(restaurant.firebaseId)}
                      title="Remove from favorites"
                    >
                      ❤️ Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage