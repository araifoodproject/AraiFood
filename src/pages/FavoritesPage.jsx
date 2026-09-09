import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { restaurantsData } from '../data/restaurantsData'

function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([])

  useEffect(() => {
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]')
    setFavorites(favIds)
    
    const restaurants = restaurantsData.filter((r) => favIds.includes(r.id))
    setFavoriteRestaurants(restaurants)
  }, [])

  const removeFavorite = (id) => {
    const updatedFavorites = favorites.filter((favId) => favId !== id)
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites))
    setFavorites(updatedFavorites)
    
    const updatedRestaurants = restaurantsData.filter((r) => updatedFavorites.includes(r.id))
    setFavoriteRestaurants(updatedRestaurants)
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="section-label">YOUR FAVORITES</span>
          <h1>Your Favorite Restaurants</h1>
          <p>Your personal list of beloved food spots in Araihazar.</p>
        </div>

        {favoriteRestaurants.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">❤️</div>
            <h2>No favorites yet!</h2>
            <p>Tap the heart icon on any restaurant to save it here.</p>
            <Link to="/restaurants" className="checkout-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="all-restaurants-grid">
            {favoriteRestaurants.map((restaurant) => (
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
                  <div className="favorite-actions">
                    <button className="restaurant-menu-button" onClick={() => { window.location.href = `/restaurant?id=${restaurant.id}` }}>
                      <span>View Menu</span>
                      <span>→</span>
                    </button>
                    <button className="remove-favorite-button" onClick={() => removeFavorite(restaurant.id)}>
                      Remove
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