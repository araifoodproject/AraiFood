function RestaurantsPage() {
  const restaurants = [
    {
      id: 1,
      name: 'Arai Biriyani House',
      cuisine: 'Biriyani • Bangladeshi',
      rating: '4.9',
      delivery: '30–40 min',
      price: '৳৳',
      emoji: '🍛',
    },
    {
      id: 2,
      name: 'Araihazar Food Corner',
      cuisine: 'Fast Food • Snacks',
      rating: '4.7',
      delivery: '25–35 min',
      price: '৳',
      emoji: '🍔',
    },
    {
      id: 3,
      name: 'Digholdi Restaurant',
      cuisine: 'Bangladeshi • Curry',
      rating: '4.8',
      delivery: '30–45 min',
      price: '৳৳',
      emoji: '🍗',
    },
    {
      id: 4,
      name: 'Local Taste',
      cuisine: 'Rice • Curry • Drinks',
      rating: '4.6',
      delivery: '20–30 min',
      price: '৳',
      emoji: '🍚',
    },
  ]

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">

        <div className="restaurants-page-header">
          <span className="section-label">ARAIAZAR LOCAL FOOD</span>

          <h1>All Restaurants</h1>

          <p>
            Discover delicious food from restaurants around Araihazar.
          </p>
        </div>

        <div className="all-restaurants-grid">
          {restaurants.map((restaurant) => (
            <div className="all-restaurant-card" key={restaurant.id}>

              <div className="all-restaurant-image">
                <span>{restaurant.emoji}</span>

                <div className="all-restaurant-rating">
                  ⭐ {restaurant.rating}
                </div>
              </div>

              <div className="all-restaurant-info">
                <h2>{restaurant.name}</h2>

                <p>{restaurant.cuisine}</p>

                <div className="all-restaurant-meta">
                  <span>🚴 {restaurant.delivery}</span>
                  <span>{restaurant.price}</span>
                </div>

                <button
                  className="restaurant-menu-button"
                  onClick={() => {
                    window.location.href = '/restaurant'
                  }}
                >
                  View Menu →
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default RestaurantsPage