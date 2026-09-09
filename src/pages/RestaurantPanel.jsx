import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

function RestaurantPanel() {
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Chicken Biryani', price: 180, emoji: '🍛' },
    { id: 2, name: 'Chicken Roast', price: 150, emoji: '🍗' },
    { id: 3, name: 'Plain Rice & Curry', price: 120, emoji: '🍚' },
    { id: 4, name: 'Cold Drinks', price: 40, emoji: '🥤' },
  ])

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]')
    setOrders(savedOrders)
  }, [])

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) => 
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orderHistory', JSON.stringify(updatedOrders))
  }

  const addMenuItem = () => {
    const name = prompt('Enter new menu item name:')
    if (!name) return

    const price = prompt('Enter price:')
    if (!price) return

    const newItem = {
      id: Date.now(),
      name: name,
      price: parseFloat(price),
      emoji: '🍽️'
    }
    setMenuItems([...menuItems, newItem])
  }

  const removeMenuItem = (id) => {
    const updatedItems = menuItems.filter((item) => item.id !== id)
    setMenuItems(updatedItems)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/restaurant-login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="restaurant-panel">
      <div className="restaurant-panel-header">
        <div className="restaurant-panel-left">
          <div className="restaurant-panel-logo">🏪</div>
          <div>
            <h1>Restaurant Panel</h1>
            <p>Manage your restaurant</p>
          </div>
        </div>
        <div className="restaurant-panel-right">
          <Link to="/" className="restaurant-home-btn">← Home</Link>
          <button className="restaurant-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Menu Management Section */}
      <div className="restaurant-menu-section">
        <h2>Your Menu</h2>
        <button className="add-menu-item-btn" onClick={addMenuItem}>+ Add New Item</button>

        <div className="restaurant-menu-grid">
          {menuItems.map((item) => (
            <div className="restaurant-menu-card" key={item.id}>
              <div className="restaurant-menu-emoji">{item.emoji}</div>
              <div className="restaurant-menu-info">
                <strong>{item.name}</strong>
                <span>৳{item.price}</span>
              </div>
              <button className="remove-menu-item" onClick={() => removeMenuItem(item.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Order Management Section */}
      <div className="restaurant-orders-section">
        <h2>Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="no-orders">No orders yet.</p>
        ) : (
          <div className="restaurant-order-list">
            {orders.map((order) => (
              <div className="restaurant-order-card" key={order.id}>
                <div className="restaurant-order-header">
                  <strong>Order ID: {order.id}</strong>
                  <span>{order.date}</span>
                </div>
                <div className="restaurant-order-items">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      <span>{item.emoji} {item.name}</span>
                      <span>× {item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="restaurant-order-total">
                  <span>Total:</span>
                  <strong>৳{order.total}</strong>
                </div>
                <div className="restaurant-order-actions">
                  <button 
                    className={order.status === 'preparing' ? 'status-btn active' : 'status-btn'}
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    Preparing
                  </button>
                  <button 
                    className={order.status === 'delivering' ? 'status-btn active' : 'status-btn'}
                    onClick={() => updateOrderStatus(order.id, 'delivering')}
                  >
                    Delivering
                  </button>
                  <button 
                    className={order.status === 'delivered' ? 'status-btn active' : 'status-btn'}
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                  >
                    Delivered
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

export default RestaurantPanel