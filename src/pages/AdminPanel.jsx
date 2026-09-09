import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function AdminPanel() {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('dashboard') // dashboard or orders

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

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Dashboard Data
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const preparingOrders = orders.filter(o => o.status === 'preparing').length
  const activeOrders = orders.filter(o => o.status === 'delivering').length

  // Chart Data
  const chartData = [
    { name: 'Day 1', orders: 5 },
    { name: 'Day 2', orders: 8 },
    { name: 'Day 3', orders: 12 },
    { name: 'Day 4', orders: 7 },
    { name: 'Day 5', orders: 15 },
    { name: 'Day 6', orders: 10 },
    { name: 'Day 7', orders: 18 },
  ]

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">👨‍🍳</div>
          <div>
            <h1>Admin Panel</h1>
            <p>Manage all orders</p>
          </div>
        </div>
        <div className="admin-header-right">
          <Link to="/" className="admin-home-btn">← Home</Link>
          <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Dashboard / Orders Toggle Button */}
      <div className="admin-view-toggle">
        <button 
          className={view === 'dashboard' ? 'view-btn active' : 'view-btn'}
          onClick={() => setView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={view === 'orders' ? 'view-btn active' : 'view-btn'}
          onClick={() => setView('orders')}
        >
          📋 All Orders
        </button>
      </div>

      {view === 'dashboard' ? (
        <div className="admin-dashboard">
          {/* Stats Cards */}
          <div className="admin-stats">
            <div className="admin-stat">
              <strong>৳{totalRevenue.toFixed(2)}</strong>
              <span>Total Revenue</span>
            </div>
            <div className="admin-stat">
              <strong>{totalOrders}</strong>
              <span>Total Orders</span>
            </div>
            <div className="admin-stat">
              <strong>{deliveredOrders}</strong>
              <span>Delivered</span>
            </div>
            <div className="admin-stat">
              <strong>{preparingOrders + activeOrders}</strong>
              <span>Active Orders</span>
            </div>
          </div>

          {/* Charts Section */}
          <div className="admin-charts">
            <div className="chart-card">
              <h3>Weekly Orders</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#13a89e" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Delivery Status</h3>
              <div className="delivery-status-bars">
                <div className="status-bar-row">
                  <span>Delivered</span>
                  <div className="status-bar-container">
                    <div className="status-bar delivered" style={{ width: `${totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0}%` }}></div>
                  </div>
                  <strong>{deliveredOrders}</strong>
                </div>
                <div className="status-bar-row">
                  <span>Preparing</span>
                  <div className="status-bar-container">
                    <div className="status-bar preparing" style={{ width: `${totalOrders > 0 ? (preparingOrders / totalOrders) * 100 : 0}%` }}></div>
                  </div>
                  <strong>{preparingOrders}</strong>
                </div>
                <div className="status-bar-row">
                  <span>Delivering</span>
                  <div className="status-bar-container">
                    <div className="status-bar delivering" style={{ width: `${totalOrders > 0 ? (activeOrders / totalOrders) * 100 : 0}%` }}></div>
                  </div>
                  <strong>{activeOrders}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-orders">
          <h2>All Orders</h2>
          {orders.length === 0 ? (
            <p className="no-orders">No orders yet.</p>
          ) : (
            <div className="admin-order-list">
              {orders.map((order) => (
                <div className="admin-order-card" key={order.id}>
                  <div className="admin-order-header">
                    <strong>Order ID: {order.id}</strong>
                    <span>{order.date}</span>
                  </div>
                  <div className="admin-order-items">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <span>{item.emoji} {item.name}</span>
                        <span>× {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="admin-order-total">
                    <span>Total:</span>
                    <strong>৳{order.total}</strong>
                  </div>
                  <div className="admin-order-actions">
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
      )}
    </div>
  )
}

export default AdminPanel