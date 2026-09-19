import { useState, useEffect } from 'react'
import { Star, Truck, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function RestaurantCard({ restaurant }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const navigate = useNavigate()

  // Unique ID — Firestore doc ID (firebaseId) অথবা static id
  const restaurantId = restaurant.firebaseId || restaurant.id

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(restaurantId))
  }, [restaurantId])

  const toggleFavorite = (e) => {
    e.stopPropagation()
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')

    if (favorites.includes(restaurantId)) {
      const updated = favorites.filter((id) => id !== restaurantId)
      localStorage.setItem('favorites', JSON.stringify(updated))
      setIsFavorite(false)
    } else {
      const updated = [...favorites, restaurantId]
      localStorage.setItem('favorites', JSON.stringify(updated))
      setIsFavorite(true)
    }
  }

  const handleCardClick = () => {
    navigate(`/restaurant?id=${restaurantId}`)
  }

  // Display name — Firestore এ restaurantName, static এ name
  const displayName = restaurant.restaurantName || restaurant.name
  const displayCuisine = restaurant.cuisine || 'Restaurant'
  const displayEmoji = restaurant.emoji || '🏪'
  const displayRating = restaurant.rating || '4.5'
  const displayDelivery = restaurant.delivery || '30-40 min'
  const displayPrice = restaurant.price || `৳${restaurant.deliveryFee || 30}`

  return (
    <div className="glass-restaurant-card" onClick={handleCardClick}>
      {/* Image Area */}
      <div className="glass-restaurant-image">
        {restaurant.logo ? (
          <img
            src={restaurant.logo}
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span className="glass-restaurant-emoji">{displayEmoji}</span>
        )}

        {restaurant.badge && (
          <div className="glass-restaurant-badge">{restaurant.badge}</div>
        )}

        <div className="glass-restaurant-rating">
          <Star size={12} strokeWidth={0} fill="#F59E0B" />
          {displayRating}
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
        <h3 className="glass-restaurant-name">{displayName}</h3>
        <p className="glass-restaurant-cuisine">{displayCuisine}</p>

        <div className="glass-restaurant-meta">
          <span className="glass-restaurant-meta-item">
            <Truck size={13} strokeWidth={2.2} />
            {displayDelivery}
          </span>
          <span className="glass-restaurant-price">{displayPrice}</span>
        </div>
      </div>
    </div>
  )
}

export default RestaurantCard