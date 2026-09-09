import { useState } from 'react'
import { toast } from 'react-toastify'
import Cart from '../components/Cart'
import { restaurantsData } from '../data/restaurantsData'

function RestaurantPage() {
  const params = new URLSearchParams(window.location.search)
  const restaurantId = Number(params.get('id')) || 1
  const restaurant = restaurantsData.find((item) => item.id === restaurantId) || restaurantsData[0]

  const [menuSearch, setMenuSearch] = useState('')

  const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]')
  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    window.dispatchEvent(new Event('cartUpdated'))
    return items
  }

  const addToCart = (food) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === food.id)
      const updatedItems = existingItem
        ? currentItems.map((item) => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...currentItems, { ...food, quantity: 1 }]

      toast.success(`${food.name} added to cart!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      return saveCart(updatedItems)
    })
  }

  const increaseQuantity = (id) => {
    setCartItems((currentItems) => {
      const updatedItems = currentItems.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
      return saveCart(updatedItems)
    })
  }

  const decreaseQuantity = (id) => {
    setCartItems((currentItems) => {
      const updatedItems = currentItems.map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0)
      return saveCart(updatedItems)
    })
  }

  const menuItems = [
    { id: `${restaurantId}-1`, name: 'Chicken Biryani', price: 180, emoji: '🍛', description: 'Fragrant rice with tender chicken and special spices.' },
    { id: `${restaurantId}-2`, name: 'Chicken Roast', price: 150, emoji: '🍗', description: 'Juicy chicken roast with rich local spices.' },
    { id: `${restaurantId}-3`, name: 'Plain Rice & Curry', price: 120, emoji: '🍚', description: 'Fresh rice served with delicious homemade curry.' },
    { id: `${restaurantId}-4`, name: 'Cold Drinks', price: 40, emoji: '🥤', description: 'Refreshing chilled drinks to complete your meal.' },
  ]

  const filteredMenu = menuItems.filter((item) =>
    item.name.toLowerCase().includes(menuSearch.toLowerCase())
  )

  return (
    <div className="restaurant-page">
      <div className="restaurant-page-header">
        <button onClick={() => window.history.back()}>← Back</button>
        <div>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.emoji} {restaurant.cuisine}</p>
          <span>⭐ {restaurant.rating} • 🚴 {restaurant.delivery}</span>
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-heading">
          <span className="section-label">MENU</span>
          <h2>Popular Items</h2>
          <p>Choose something delicious from {restaurant.name}.</p>
        </div>

        {/* Menu Search */}
        <div className="menu-search-bar">
          <span>🔎</span>
          <input
            type="text"
            placeholder="Search food items..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
          />
          {menuSearch && <button type="button" onClick={() => setMenuSearch('')} className="clear-search">×</button>}
        </div>

        <div className="food-grid">
          {filteredMenu.length === 0 ? (
            <p className="no-menu-items">No food items found. Try another search.</p>
          ) : (
            filteredMenu.map((item) => (
              <div className="food-card" key={item.id}>
                <div className="food-image">{item.emoji}</div>
                <div className="food-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="food-bottom">
                    <strong>৳{item.price}</strong>
                    <button onClick={() => addToCart(item)}>+ Add</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {cartItems.length > 0 && (
        <button className="floating-cart-button" onClick={() => setCartOpen(true)}>
          🛒 Cart ({cartItems.reduce((total, item) => total + item.quantity, 0)})
        </button>
      )}

      {cartOpen && (
        <Cart items={cartItems} onClose={() => setCartOpen(false)} onIncrease={increaseQuantity} onDecrease={decreaseQuantity} />
      )}
    </div>
  )
}

export default RestaurantPage