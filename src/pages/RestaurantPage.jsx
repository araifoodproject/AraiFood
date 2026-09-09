import { useState } from 'react'
import Cart from '../components/Cart'

function RestaurantPage() {
  const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]')

  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    return items
  }

  const addToCart = (food) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === food.id
      )

      const updatedItems = existingItem
        ? currentItems.map((item) =>
            item.id === food.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [
            ...currentItems,
            {
              ...food,
              quantity: 1,
            },
          ]

      return saveCart(updatedItems)
    })
  }

  const increaseQuantity = (id) => {
    setCartItems((currentItems) => {
      const updatedItems = currentItems.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )

      return saveCart(updatedItems)
    })
  }

  const decreaseQuantity = (id) => {
    setCartItems((currentItems) => {
      const updatedItems = currentItems
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)

      return saveCart(updatedItems)
    })
  }

  return (
    <div className="restaurant-page">

      <div className="restaurant-page-header">
        <button onClick={() => window.history.back()}>
          ← Back
        </button>

        <div>
          <h1>Arai Biryani House</h1>
          <p>🍛 Biryani • Bangla Food</p>
          <span>⭐ 4.8 • 🚴 25-35 min</span>
        </div>
      </div>

      <div className="menu-section">

        <div className="menu-heading">
          <span className="section-label">MENU</span>
          <h2>Popular Items</h2>
          <p>Choose something delicious from our menu.</p>
        </div>

        <div className="food-grid">

          <div className="food-card">
            <div className="food-image">🍛</div>

            <div className="food-info">
              <h3>Chicken Biryani</h3>
              <p>
                Fragrant rice with tender chicken and special spices.
              </p>

              <div className="food-bottom">
                <strong>৳180</strong>

                <button
                  onClick={() =>
                    addToCart({
                      id: 1,
                      name: 'Chicken Biryani',
                      price: 180,
                      emoji: '🍛',
                    })
                  }
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div className="food-card">
            <div className="food-image">🍗</div>

            <div className="food-info">
              <h3>Chicken Roast</h3>
              <p>
                Juicy chicken roast with rich local spices.
              </p>

              <div className="food-bottom">
                <strong>৳150</strong>

                <button
                  onClick={() =>
                    addToCart({
                      id: 2,
                      name: 'Chicken Roast',
                      price: 150,
                      emoji: '🍗',
                    })
                  }
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div className="food-card">
            <div className="food-image">🍚</div>

            <div className="food-info">
              <h3>Plain Rice & Curry</h3>
              <p>
                Fresh rice served with delicious homemade curry.
              </p>

              <div className="food-bottom">
                <strong>৳120</strong>

                <button
                  onClick={() =>
                    addToCart({
                      id: 3,
                      name: 'Plain Rice & Curry',
                      price: 120,
                      emoji: '🍚',
                    })
                  }
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div className="food-card">
            <div className="food-image">🥤</div>

            <div className="food-info">
              <h3>Cold Drinks</h3>
              <p>
                Refreshing chilled drinks to complete your meal.
              </p>

              <div className="food-bottom">
                <strong>৳40</strong>

                <button
                  onClick={() =>
                    addToCart({
                      id: 4,
                      name: 'Cold Drinks',
                      price: 40,
                      emoji: '🥤',
                    })
                  }
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
{cartItems.length > 0 && (
  <button
    className="floating-cart-button"
    onClick={() => setCartOpen(true)}
  >
    🛒 Cart (
    {cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    )}
    )
  </button>
)}
      {cartOpen && (
        <Cart
          items={cartItems}
          onClose={() => setCartOpen(false)}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
        />
      )}

    </div>
  )
}

export default RestaurantPage
