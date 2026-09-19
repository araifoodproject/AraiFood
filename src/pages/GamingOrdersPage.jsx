import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db, auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import PageBackButton from '../components/PageBackButton'
import { Copy, Check } from 'lucide-react'
import { toast } from 'react-toastify'

function GamingOrdersPage() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'gamingOrders'),
      where('userId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime?.() || 0
        const bT = b.createdAt?.toDate?.()?.getTime?.() || 0
        return bT - aT
      })
      setOrders(list)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copied!', { autoClose: 1200 })
    setTimeout(() => setCopied(null), 1500)
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: '⏳',
      },
      processing: {
        label: 'Processing',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
        icon: '⚙️',
      },
      delivered: {
        label: 'Delivered',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.12)',
        icon: '✅',
      },
      cancelled: {
        label: 'Cancelled',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.12)',
        icon: '❌',
      },
    }
    return map[status] || map.pending
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your gaming orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/gaming" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">GAMING ORDERS</span>
          <h1>My Game Top-Ups</h1>
          <p>Track your top-up orders and their status</p>
        </div>

        {!user ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔒</div>
            <h2>Please Login</h2>
            <p>Login to see your gaming order history</p>
            <Link
              to="/login"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              Login →
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🎮</div>
            <h2>No gaming orders yet</h2>
            <p>Place your first top-up order and it will show here.</p>
            <Link
              to="/gaming"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              Browse Games →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {orders.map((order) => {
              const badge = getStatusBadge(order.status)
              return (
                <div
                  key={order.firebaseId}
                  style={{
                    padding: '20px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      flexWrap: 'wrap',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        Order ID
                      </div>
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          display: 'block',
                          marginBottom: '4px',
                          wordBreak: 'break-all',
                        }}
                      >
                        {order.orderId}
                      </strong>
                      <span
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 600,
                        }}
                      >
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        🎮 Game
                      </div>
                      <strong
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                        }}
                      >
                        {order.game}
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        📦 Pack
                      </div>
                      <strong
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                        }}
                      >
                        {order.productName}
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        💰 Price
                      </div>
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '16px',
                          color: '#059669',
                          fontWeight: 900,
                        }}
                      >
                        ৳{order.price}
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        🆔 Player ID
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '13.5px',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            wordBreak: 'break-all',
                          }}
                        >
                          {order.playerId}
                        </strong>
                        <button
                          onClick={() =>
                            copyText(order.playerId, order.firebaseId + '-pid')
                          }
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {copied === order.firebaseId + '-pid' ? (
                            <Check size={10} />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'var(--surface-soft)',
                      borderRadius: '12px',
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      💳 {order.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} →{' '}
                      <strong>{order.paymentNumber}</strong>
                    </span>
                    <span>
                      🧾 TrxID → <strong>{order.transactionId}</strong>
                    </span>
                  </div>

                  {order.status === 'pending' && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '10px',
                        color: '#B45309',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      ⏳ We're verifying your payment. Top-up usually completes
                      within 5 minutes.
                    </div>
                  )}
                  {order.status === 'processing' && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '10px',
                        color: '#1D4ED8',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      ⚙️ Your top-up is being processed. Please wait.
                    </div>
                  )}
                  {order.status === 'delivered' && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(22,163,74,0.08)',
                        border: '1px solid rgba(22,163,74,0.2)',
                        borderRadius: '10px',
                        color: '#16a34a',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      ✅ Top-up delivered! Check your game account.
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(220,38,38,0.08)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        borderRadius: '10px',
                        color: '#dc2626',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      ❌ This order was cancelled.
                      {order.cancelReason && ` Reason: ${order.cancelReason}`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GamingOrdersPage