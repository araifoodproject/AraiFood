import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import PageBackButton from '../components/PageBackButton'

function OrderHistoryPage() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))

      list.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime
      })

      setOrders(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return (
      date.toLocaleDateString() +
      ' • ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: '#f59e0b', icon: '⏳' }
      case 'preparing':
        return { label: 'Preparing', color: '#3b82f6', icon: '👨‍🍳' }
      case 'delivering':
        return { label: 'On the Way', color: '#13a89e', icon: '🛵' }
      case 'delivered':
        return { label: 'Delivered', color: '#16a34a', icon: '✅' }
      case 'cancelled':
        return { label: 'Cancelled', color: '#dc2626', icon: '❌' }
      default:
        return { label: status || 'Pending', color: '#6b7280', icon: '📦' }
    }
  }

  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">YOUR ORDERS</span>
          <h1>Order History</h1>
          <p>Review your past orders and track them live.</p>
        </div>

        {!user ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔒</div>
            <h2>Please Login</h2>
            <p>You need to login to see your order history.</p>
            <Link
              to="/login"
              className="checkout-button"
              style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}
            >
              Login →
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">📦</div>
            <h2>No orders yet!</h2>
            <p>Place your first order to see it here.</p>
            <Link
              to="/restaurants"
              className="checkout-button"
              style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="order-history-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              return (
                <div className="order-history-card" key={order.firebaseId}>
                  <div className="order-history-header">
                    <div>
                      <strong>Order ID: {order.orderId}</strong>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>
                    <span
                      className="order-status-badge"
                      style={{
                        background: statusInfo.color + '20',
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  <div className="order-history-restaurant">
                    <div className="order-history-logo">
                      {order.restaurantLogo ? (
                        <img src={order.restaurantLogo} alt={order.restaurantName} />
                      ) : (
                        <span>🏪</span>
                      )}
                    </div>
                    <div>
                      <strong>{order.restaurantName}</strong>
                      <small>{order.items?.length || 0} item(s)</small>
                    </div>
                  </div>

                  <div className="order-history-items">
                    {order.items?.map((item, idx) => (
                      <div className="history-item" key={idx}>
                        <span>
                          {item.emoji} {item.name}
                        </span>
                        <span className="history-quantity">× {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-history-total">
                    <span>Total:</span>
                    <strong>৳{order.total}</strong>
                  </div>

                  <div className="order-history-actions">
                    <Link
                      to={`/track-order?id=${order.orderId}`}
                      className="track-order-button"
                    >
                      🛵 Track Order
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistoryPage