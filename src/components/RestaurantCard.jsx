function RestaurantCard({ restaurant }) {
  return (
    <div
  className="restaurant-card"
  onClick={() => alert(`Opening ${restaurant.name}`)}
>
      <div className="restaurant-image">
        <span>{restaurant.emoji}</span>
        <div className="restaurant-rating">
          ⭐ {restaurant.rating}
        </div>
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