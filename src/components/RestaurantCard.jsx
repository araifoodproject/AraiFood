import { useState, useEffect } from 'react'

function RestaurantCard({ restaurant }) {
  // Favorites State
  const [isFavorite, setIsFavorite] = useState(false)

  // Check if this restaurant is in favorites
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(restaurant.id))
  }, [restaurant.id])

  // Toggle Favorite
  const toggleFavorite = (e) => {
    e.stopPropagation() // Card এ ক্লিক না হওয়ার জন্য
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    
    if (favorites.includes(restaurant.id)) {
      // Remove from favorites
      const updatedFavorites = favorites.filter((id) => id !== restaurant.id)
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites))
      setIsFavorite(false)
      // Toast Notification
      if (window.toast) window.toast(`${restaurant.name} removed from favorites`)
    } else {
      // Add to favorites
      const updatedFavorites = [...favorites, restaurant.id]
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites))
      setIsFavorite(true)
      // Toast Notification
      if (window.toast) window.toast(`${restaurant.name} added to favorites`)
    }
  }

  return (
    <div
      className="restaurant-card"
      onClick={() => {
        window.location.href = `/restaurant?id=${restaurant.id}`
      }}
    >
      <div className="restaurant-image">
        <span>{restaurant.emoji}</span>
        <div className="restaurant-rating">⭐ {restaurant.rating}</div>
        
        {/* Favorite Heart Button */}
        <button 
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

      </div>

      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.cuisine}</p>

        <div className="restaurant-meta">
          <span>🚴 {restaurant.delivery}</span>
          <span>৳ {restaurant.price}</span>
        </div>
      </div>
    </div>
  )
}

export default RestaurantCard