import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function CartPage() {
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
    setCartItems(items)
  }, [])

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    setCartItems(items)
    
    // Navbar update করার জন্য ইভেন্ট পাঠাচ্ছি
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
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0)
    saveCart(updatedItems)
  }

  const removeItem = (id) => {
    const updatedItems = cartItems.filter((item) => item.id !== id)
    saveCart(updatedItems)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = cartItems.length > 0 ? 30 : 0
  const total = subtotal + deliveryFee

  const goToCheckout = () => {
    window.location.href = '/checkout'
  }

  return (
    <div className="cart-page">
      <div className="cart-page-container">
        
        <div className="cart-page-header">
          <span className="section-label">YOUR ORDER</span>
          <h1>Your Cart</h1>
          <p>Review your items before checking out.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart" style={{ padding: '60px 20px' }}>
            <div>🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some delicious food to get started.</p>
            <Link to="/restaurants" className="checkout-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="cart-page-content">
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-icon">{item.emoji}</div>
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <div className="cart-quantity">
                      <button onClick={() => decreaseQuantity(item.id)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQuantity(item.id)}>+</button>
                    </div>
                  </div>
                  <strong>৳{item.price * item.quantity}</strong>
                  <button className="remove-item" onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-item">
                <span>Subtotal</span>
                <strong>৳{subtotal}</strong>
              </div>

              <div className="summary-item">
                <span>Delivery Fee</span>
                <strong>৳{deliveryFee}</strong>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <strong>৳{total}</strong>
              </div>
              
              <button className="checkout-button" onClick={goToCheckout}>
                Proceed to Checkout →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default CartPage