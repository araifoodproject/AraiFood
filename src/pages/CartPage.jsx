import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'

function CartPage() {
  const [cartItems, setCartItems] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
    setCartItems(items)
  }, [])

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    setCartItems(items)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const increaseQuantity = (id) => {
    const updatedItems = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    )
    saveCart(updatedItems)
  }

  const decreaseQuantity = (id) => {
    const updatedItems = cartItems
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0)
    saveCart(updatedItems)
  }

  const removeItem = (id) => {
    const updatedItems = cartItems.filter((item) => item.id !== id)
    saveCart(updatedItems)
  }

  const restaurant =
    cartItems.length > 0
      ? {
          restaurantId: cartItems[0].restaurantId,
          restaurantName: cartItems[0].restaurantName,
          restaurantLogo: cartItems[0].restaurantLogo || '',
          deliveryFee: cartItems[0].deliveryFee || 30,
          minimumOrder: cartItems[0].minimumOrder || 100,
        }
      : null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const deliveryFee = restaurant?.deliveryFee || 0
  const total = subtotal + deliveryFee

  const minimumOrderReached = subtotal >= (restaurant?.minimumOrder || 0)
  const amountNeeded = minimumOrderReached
    ? 0
    : restaurant?.minimumOrder - subtotal

  return (
    <div className="cart-page">
      <div className="cart-page-container">
        {/* Back Button */}
        <PageBackButton label="Back" fallback="/restaurants" />

        {/* Header */}
        <div className="cart-page-header">
          <span className="glass-section-label">YOUR ORDER</span>
          <h1>Your Cart</h1>
          <p>Review your items before checking out.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-page-empty">
            <div style={{ fontSize: '80px', marginBottom: '12px' }}>🛒</div>
            <h2
              style={{
                fontSize: '22px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Your cart is empty
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: '12px',
              }}
            >
              Add some delicious food to get started.
            </p>
            <Link to="/restaurants" className="cart-page-browse-btn">
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="cart-page-layout">
            {/* Left: Items */}
            <div className="cart-page-items-wrapper">
              {/* Restaurant Bar */}
              <div className="cart-page-restaurant">
                <div className="cart-page-restaurant-logo">
                  {restaurant.restaurantLogo ? (
                    <img
                      src={restaurant.restaurantLogo}
                      alt={restaurant.restaurantName}
                    />
                  ) : (
                    <span>🏪</span>
                  )}
                </div>
                <div className="cart-page-restaurant-info">
                  <h3>{restaurant.restaurantName}</h3>
                  <small>Delivery Fee: ৳{restaurant.deliveryFee}</small>
                </div>
                <span className="cart-page-item-count">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)} item(s)
                </span>
              </div>

              {/* Items List */}
              <div className="cart-page-items-list">
                {cartItems.map((item) => (
                  <div className="cart-page-item" key={item.id}>
                    <div className="cart-page-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>{item.emoji || '🍽️'}</span>
                      )}
                    </div>

                    <div className="cart-page-item-info">
                      <h4>{item.name}</h4>
                      <p className="cart-page-item-price">৳{item.price} each</p>
                      <div className="cart-page-qty">
                        <button onClick={() => decreaseQuantity(item.id)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)}>+</button>
                      </div>
                    </div>

                    <div className="cart-page-item-total">
                      ৳{item.price * item.quantity}
                    </div>

                    <button
                      className="cart-page-item-remove"
                      onClick={() => removeItem(item.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="cart-page-summary">
              <h3>Order Summary</h3>

              <div className="cart-page-summary-row">
                <span>Subtotal</span>
                <strong>৳{subtotal}</strong>
              </div>

              <div className="cart-page-summary-row">
                <span>Delivery Fee</span>
                <strong>৳{deliveryFee}</strong>
              </div>

              <div className="cart-page-summary-divider"></div>

              <div className="cart-page-summary-total">
                <span>Total</span>
                <strong>৳{total}</strong>
              </div>

              {!minimumOrderReached && (
                <div className="cart-page-min-warning">
                  ⚠️ Minimum order is ৳{restaurant.minimumOrder}. Add ৳
                  {amountNeeded} more.
                </div>
              )}

              {minimumOrderReached ? (
                <Link to="/checkout" className="cart-page-checkout-btn">
                  Proceed to Checkout →
                </Link>
              ) : (
                <button className="cart-page-checkout-btn disabled" disabled>
                  Add ৳{amountNeeded} More
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage