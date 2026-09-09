import { useState } from 'react'

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const notifications = [
    { id: 1, title: '🍕 20% OFF on Pizza!', description: 'Order any pizza from Arai Pizza Corner and get 20% off. Use code: PIZZA20', time: '2 mins ago' },
    { id: 2, title: '🎉 Free Delivery!', description: 'Get FREE delivery on orders above ৳500. Limited time offer!', time: '1 hour ago' },
    { id: 3, title: '⭐ New Restaurant Added!', description: 'Araihazar Grill is now live. Try their delicious Chicken Roast!', time: '3 hours ago' },
    { id: 4, title: '🔥 Trending Now!', description: 'Chicken Biryani is trending in Araihazar right now. Order yours!', time: 'Yesterday' },
    { id: 5, title: '🎁 Loyalty Rewards!', description: 'You have earned 50 loyalty points. Redeem them on your next order!', time: '2 days ago' },
  ]

  return (
    <>
      {/* Navbar Notification Button */}
      <button 
        className={`arai-nav-icon nav-notification-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        <span className="notification-badge">3</span>
      </button>

      {/* Notification Box */}
      {isOpen && (
        <div className="nav-notification-box">
          <div className="notification-header">
            <strong>Notifications</strong>
            <span className="notification-time">Latest Updates</span>
          </div>

          <div className="notification-list">
            {notifications.map((notification) => (
              <div className="notification-item" key={notification.id}>
                <div className="notification-content">
                  <strong>{notification.title}</strong>
                  <p>{notification.description}</p>
                  <small>{notification.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationPanel