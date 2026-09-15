import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Package,
  Store,
  Bike,
  Gift,
  Check,
  X,
} from 'lucide-react'

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('customer')
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastNotificationId, setLastNotificationId] = useState(null)
  const [flash, setFlash] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      const role = localStorage.getItem('userRole') || 'customer'
      setUserRole(role)
    })
    return () => unsubscribe()
  }, [])

  // Load Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    let userIds = [user.uid]
    if (userRole === 'admin') userIds = ['admin']

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', 'in', userIds)
    )

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime
      })

      const latestId = list[0]?.firebaseId
      if (latestId && lastNotificationId && latestId !== lastNotificationId) {
        setFlash(true)
        setTimeout(() => setFlash(false), 2000)
      }
      setLastNotificationId(latestId)

      setNotifications(list)
      setUnreadCount(list.filter((n) => !n.read).length)
    })

    return () => unsubscribe()
  }, [user, userRole, lastNotificationId])

  // Close on Outside Click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const markAsRead = async (id) => {
    try { await updateDoc(doc(db, 'notifications', id), { read: true }) } catch (e) { console.error(e) }
  }

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db)
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, 'notifications', n.firebaseId), { read: true })
      })
      await batch.commit()
    } catch (e) { console.error(e) }
  }

  const deleteNotification = async (id) => {
    try { await deleteDoc(doc(db, 'notifications', id)) } catch (e) { console.error(e) }
  }

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return
    try {
      const batch = writeBatch(db)
      notifications.forEach((n) => {
        batch.delete(doc(db, 'notifications', n.firebaseId))
      })
      await batch.commit()
    } catch (e) { console.error(e) }
  }

  const handleClick = (notification) => {
    markAsRead(notification.firebaseId)
    if (notification.orderId) {
      navigate(`/track-order?id=${notification.orderId}`)
      setIsOpen(false)
      return
    }
    if (userRole === 'admin') navigate('/admin')
    else if (userRole === 'restaurant') navigate('/restaurant-panel')
    else if (userRole === 'rider') navigate('/rider-panel')
    else navigate('/order-history')
    setIsOpen(false)
  }

  const formatTime = (ts) => {
    if (!ts) return 'Just now'
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = new Date() - date
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    if (hours < 24) return `${hours} hr ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getIconComponent = (type) => {
    switch (type) {
      case 'order': return Package
      case 'restaurant': return Store
      case 'rider': return Bike
      case 'promotion': return Gift
      default: return Bell
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case 'order': return 'icon-blue'
      case 'restaurant': return 'icon-green'
      case 'rider': return 'icon-orange'
      case 'promotion': return 'icon-pink'
      default: return 'icon-gray'
    }
  }

  if (!user) return null

  return (
    <div className="glass-notification-wrapper" ref={panelRef}>
      {/* Notification Button */}
      <button
        className={`glass-icon-btn glass-notification-btn ${isOpen ? 'active' : ''} ${flash ? 'flash' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="glass-notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="glass-notification-box">
          {/* Header */}
          <div className="glass-notification-header">
            <div className="glass-notification-header-left">
              <div className="glass-notification-header-icon">
                <Bell size={18} strokeWidth={2} />
              </div>
              <div>
                <span className="glass-notification-title">Notifications</span>
                <span className="glass-notification-subtitle">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </span>
              </div>
            </div>
            <div className="glass-notification-header-actions">
              {unreadCount > 0 && (
                <button className="glass-notification-action-btn" onClick={markAllAsRead} title="Mark all read">
                  <Check size={14} strokeWidth={2.5} />
                </button>
              )}
              {notifications.length > 0 && (
                <button className="glass-notification-action-btn danger" onClick={clearAll} title="Clear all">
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="glass-notification-list">
            {notifications.length === 0 ? (
              <div className="glass-notification-empty">
                <div className="glass-notification-empty-icon">
                  <Bell size={40} strokeWidth={1.5} />
                </div>
                <span className="glass-notification-empty-title">No notifications yet</span>
                <span className="glass-notification-empty-sub">You'll see updates here</span>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const IconComponent = getIconComponent(n.type)
                return (
                  <div
                    key={n.firebaseId}
                    className={`glass-notification-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className={`glass-notification-icon ${getIconColor(n.type)}`}>
                      <IconComponent size={18} strokeWidth={2} />
                    </div>
                    <div className="glass-notification-content">
                      <span className="glass-notification-item-title">{n.title}</span>
                      <p className="glass-notification-item-body">{n.body}</p>
                      <span className="glass-notification-item-time">{formatTime(n.createdAt)}</span>
                    </div>
                    <div className="glass-notification-item-actions" onClick={(e) => e.stopPropagation()}>
                      {!n.read && (
                        <button
                          className="glass-notif-action-btn read"
                          onClick={() => markAsRead(n.firebaseId)}
                          title="Mark as read"
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                      )}
                      <button
                        className="glass-notif-action-btn delete"
                        onClick={() => deleteNotification(n.firebaseId)}
                        title="Delete"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="glass-notification-footer">
              Showing latest {Math.min(20, notifications.length)} of {notifications.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationPanel