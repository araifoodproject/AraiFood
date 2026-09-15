import { useState, useEffect } from 'react'
import { Star, Truck, Heart } from 'lucide-react'

function RestaurantCard({ restaurant }) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(restaurant.id))
  }, [restaurant.id])

  const toggleFavorite = (e) => {
    e.stopPropagation()
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')

    if (favorites.includes(restaurant.id)) {
      const updated = favorites.filter((id) => id !== restaurant.id)
      localStorage.setItem('favorites', JSON.stringify(updated))
      setIsFavorite(false)
    } else {
      const updated = [...favorites, restaurant.id]
      localStorage.setItem('favorites', JSON.stringify(updated))
      setIsFavorite(true)
    }
  }

  return (
    <div
      className="glass-restaurant-card"
      onClick={() => {
        window.location.href = `/restaurant?id=${restaurant.id}`
      }}
    >
      {/* Image Area */}
      <div className="glass-restaurant-image">
        <span className="glass-restaurant-emoji">{restaurant.emoji}</span>

        {restaurant.badge && (
          <div className="glass-restaurant-badge">{restaurant.badge}</div>
        )}

        <div className="glass-restaurant-rating">
          <Star size={12} strokeWidth={0} fill="#F59E0B" />
          {restaurant.rating}
        </div>

        <button
          className={`glass-restaurant-fav ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={16}
            strokeWidth={2.2}
            fill={isFavorite ? '#EF4444' : 'transparent'}
            color={isFavorite ? '#EF4444' : '#6B7280'}
          />
        </button>
      </div>

      {/* Info Area */}
      <div className="glass-restaurant-info">
        <h3 className="glass-restaurant-name">{restaurant.name}</h3>
        <p className="glass-restaurant-cuisine">{restaurant.cuisine}</p>

        <div className="glass-restaurant-meta">
          <span className="glass-restaurant-meta-item">
            <Truck size={13} strokeWidth={2.2} />
            {restaurant.delivery}
          </span>
          <span className="glass-restaurant-price">{restaurant.price}</span>
        </div>
      </div>
    </div>
  )
}

export default RestaurantCard