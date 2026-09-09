import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function OrderHistoryPage() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]')
    setOrders(savedOrders)
  }, [])

  const removeOrder = (orderId) => {
    const updatedOrders = orders.filter((order) => order.id !== orderId)
    localStorage.setItem('orderHistory', JSON.stringify(updatedOrders))
    setOrders(updatedOrders)
  }

  const reorder = (order) => {
    const items = order.items
    localStorage.setItem('cartItems', JSON.stringify(items))
    window.dispatchEvent(new Event('cartUpdated'))
    window.location.href = '/checkout'
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="section-label">YOUR ORDERS</span>
          <h1>Order History</h1>
          <p>Review your past orders and order again with one click.</p>
        </div>

        {orders.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>No orders yet!</h2>
            <p>Place your first order to see it here.</p>
            <Link to="/restaurants" className="checkout-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="order-history-list">
            {orders.map((order) => (
              <div className="order-history-card" key={order.id}>
                <div className="order-history-header">
                  <strong>Order ID: {order.id}</strong>
                  <small>{order.date}</small>
                </div>
                <div className="order-history-items">
                  {order.items.map((item) => (
                    <div className="history-item" key={item.id}>
                      <span>{item.emoji} {item.name}</span>
                      <span className="history-quantity">× {item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="order-history-total">
                  <span>Total:</span>
                  <strong>৳{order.total}</strong>
                </div>
                <div className="order-history-actions">
                  <Link to={`/track-order?id=${order.id}`} className="track-order-button">
                    🛵 Track Order
                  </Link>
                  <button className="reorder-button" onClick={() => reorder(order)}>
                    🔄 Order Again
                  </button>
                  <button className="remove-order-button" onClick={() => removeOrder(order.id)}>
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistoryPage