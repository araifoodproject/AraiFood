import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function RiderPanel() {
  const [orders, setOrders] = useState([])
  const [riderEarnings, setRiderEarnings] = useState(0)

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]')
    setOrders(savedOrders)
    
    const savedEarnings = parseFloat(localStorage.getItem('riderEarnings') || '0')
    setRiderEarnings(savedEarnings)
  }, [])

  const acceptOrder = (orderId) => {
    const updatedOrders = orders.map((order) => 
      order.id === orderId ? { ...order, riderStatus: 'accepted' } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orderHistory', JSON.stringify(updatedOrders))
  }

  const completeDelivery = (orderId) => {
    const updatedOrders = orders.map((order) => 
      order.id === orderId ? { ...order, riderStatus: 'delivered', status: 'delivered' } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orderHistory', JSON.stringify(updatedOrders))
    
    const earnings = parseFloat(localStorage.getItem('riderEarnings') || '0') + 30
    localStorage.setItem('riderEarnings', JSON.stringify(earnings))
    setRiderEarnings(earnings)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/rider-login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Rider Data
  const completedDeliveries = orders.filter(o => o.riderStatus === 'delivered').length
  const activeDeliveries = orders.filter(o => o.riderStatus === 'accepted').length
  const availableOrders = orders.filter(o => o.riderStatus !== 'accepted' && o.riderStatus !== 'delivered').length

  // Earnings Chart Data
  const earningsChartData = [
    { name: 'Mon', amount: 120 },
    { name: 'Tue', amount: 150 },
    { name: 'Wed', amount: 90 },
    { name: 'Thu', amount: 200 },
    { name: 'Fri', amount: 180 },
    { name: 'Sat', amount: 250 },
    { name: 'Sun', amount: 220 },
  ]

  return (
    <div className="rider-panel">
      <div className="rider-header">
        <div className="rider-header-left">
          <div className="rider-logo">🛵</div>
          <div>
            <h1>Rider Panel</h1>
            <p>Manage your deliveries</p>
          </div>
        </div>
        <div className="rider-header-right">
          <Link to="/" className="rider-home-btn">← Home</Link>
          <button className="rider-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Rider Profile */}
      <div className="rider-profile-card">
        <div className="rider-profile-avatar">🛵</div>
        <div className="rider-profile-info">
          <strong>Rahim Uddin</strong>
          <small>📍 Araihazar, Bangladesh</small>
          <span>⭐ 4.9 Rating</span>
        </div>
      </div>

      {/* Rider Stats */}
      <div className="rider-stats">
        <div className="rider-stat">
          <strong>৳{riderEarnings.toFixed(2)}</strong>
          <span>Total Earnings</span>
        </div>
        <div className="rider-stat">
          <strong>{completedDeliveries}</strong>
          <span>Completed</span>
        </div>
        <div className="rider-stat">
          <strong>{activeDeliveries}</strong>
          <span>Active</span>
        </div>
        <div className="rider-stat">
          <strong>{availableOrders}</strong>
          <span>Available</span>
        </div>
      </div>

      {/* Rider Earnings Chart */}
      <div className="rider-chart-section">
        <h2>Weekly Earnings</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={earningsChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#f59e0b" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rider Orders */}
      <div className="rider-orders">
        <h2>Available Orders</h2>
        {orders.length === 0 ? (
          <p className="no-orders">No orders available.</p>
        ) : (
          <div className="rider-order-list">
            {orders.map((order) => (
              <div className="rider-order-card" key={order.id}>
                <div className="rider-order-header">
                  <strong>Order ID: {order.id}</strong>
                  <span>{order.date}</span>
                </div>
                <div className="rider-order-info">
                  <p>Delivery to: {order.address || 'Unknown address'}</p>
                  <p>Total: ৳{order.total}</p>
                </div>
                <div className="rider-order-actions">
                  {order.riderStatus !== 'accepted' && order.riderStatus !== 'delivered' ? (
                    <button className="accept-btn" onClick={() => acceptOrder(order.id)}>
                      Accept Order
                    </button>
                  ) : order.riderStatus === 'accepted' ? (
                    <button className="complete-btn" onClick={() => completeDelivery(order.id)}>
                      Complete Delivery
                    </button>
                  ) : (
                    <span className="delivered-label">✅ Delivered</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RiderPanel