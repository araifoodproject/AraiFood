import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { sendNotification } from '../../utils/sendNotification'
import { toast } from 'react-toastify'
import {
  Menu,
  Megaphone,
  Send,
  Users,
  Bell,
  TrendingUp,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react'

function AdminMarketingPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('notification')

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRestaurants: 0,
    deliveredOrders: 0,
  })

  // Broadcast form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all')
  const [sending, setSending] = useState(false)

  // Recent broadcasts
  const [recentBroadcasts, setRecentBroadcasts] = useState([])

  // Load stats
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'users'), (s) =>
      setStats((p) => ({ ...p, totalUsers: s.size }))
    )
    const unsub2 = onSnapshot(collection(db, 'orders'), (s) => {
      const orders = s.docs.map((d) => d.data())
      setStats((p) => ({
        ...p,
        totalOrders: s.size,
        deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
      }))
    })
    const unsub3 = onSnapshot(collection(db, 'restaurants'), (s) =>
      setStats((p) => ({ ...p, totalRestaurants: s.size }))
    )
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  // Load recent broadcasts (notifications with type='promotion')
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((n) => n.type === 'promotion')
      setRecentBroadcasts(list)
    })
    return () => unsub()
  }, [])

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in title and message')
      return
    }

    setSending(true)
    try {
      // Get target users
      let userIds = []

      if (target === 'all') {
        const usersSnap = await new Promise((resolve) => {
          const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            resolve(snap.docs.map((d) => d.id))
            unsub()
          })
        })
        userIds = usersSnap
      } else if (target === 'customers') {
        const usersSnap = await new Promise((resolve) => {
          const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const custs = snap.docs
              .filter((d) => !d.data().role || d.data().role === 'customer')
              .map((d) => d.id)
            resolve(custs)
            unsub()
          })
        })
        userIds = usersSnap
      } else if (target === 'riders') {
        const snap = await new Promise((resolve) => {
          const unsub = onSnapshot(collection(db, 'riders'), (s) => {
            resolve(s.docs.map((d) => d.id))
            unsub()
          })
        })
        userIds = snap
      } else if (target === 'restaurants') {
        const snap = await new Promise((resolve) => {
          const unsub = onSnapshot(collection(db, 'restaurants'), (s) => {
            resolve(s.docs.map((d) => d.id))
            unsub()
          })
        })
        userIds = snap
      }

      if (userIds.length === 0) {
        toast.error('No recipients found')
        setSending(false)
        return
      }

      toast.info(`Sending to ${userIds.length} users...`)

      // Send in batches (fire and forget - don't await all for UX)
      let successCount = 0
      for (const uid of userIds) {
        try {
          await sendNotification(uid, title.trim(), body.trim(), 'promotion', {})
          successCount++
        } catch (err) {
          console.error('Failed to send to', uid, err)
        }
      }

      toast.success(`✅ Sent to ${successCount} users!`)
      setTitle('')
      setBody('')
    } catch (err) {
      console.error(err)
      toast.error('Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">Marketing</h1>
            <p className="admin-page-sub">
              Send push notifications and manage promotions.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Users size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Users</span>
              <strong className="admin-stat-value">{stats.totalUsers}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <TrendingUp size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Orders</span>
              <strong className="admin-stat-value">{stats.totalOrders}</strong>
              <span className="admin-stat-trend up">
                {stats.deliveredOrders} delivered
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Bell size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Broadcasts Sent</span>
              <strong className="admin-stat-value">
                {recentBroadcasts.length}
              </strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">🏪</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Restaurants</span>
              <strong className="admin-stat-value">{stats.totalRestaurants}</strong>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="admin-section"
          style={{ padding: '10px', marginBottom: '20px' }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { value: 'notification', label: '📢 Push Notification' },
              { value: 'history', label: '📜 Broadcast History' },
              { value: 'tips', label: '💡 Marketing Tips' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setActiveTab(t.value)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background:
                    activeTab === t.value
                      ? 'linear-gradient(135deg, #059669, #047857)'
                      : 'transparent',
                  color:
                    activeTab === t.value ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Push Notification */}
        {activeTab === 'notification' && (
          <div className="admin-section" style={{ padding: '28px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                }}
              >
                📢
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  Send Push Notification
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: '4px 0 0',
                  }}
                >
                  Broadcast a message to selected users instantly.
                </p>
              </div>
            </div>

            {/* Target Selection */}
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '10px',
              }}
            >
              Audience
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {[
                { value: 'all', label: '👥 Everyone', desc: 'All users' },
                { value: 'customers', label: '🛒 Customers', desc: 'Buyers only' },
                { value: 'riders', label: '🛵 Riders', desc: 'Delivery partners' },
                { value: 'restaurants', label: '🏪 Restaurants', desc: 'Partners' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background:
                      target === opt.value
                        ? 'linear-gradient(135deg, rgba(5,150,105,0.15), rgba(5,150,105,0.08))'
                        : 'var(--surface-soft)',
                    border:
                      target === opt.value
                        ? '2px solid #059669'
                        : '2px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '13.5px',
                      color:
                        target === opt.value
                          ? '#059669'
                          : 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                    }}
                  >
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Title */}
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Notification Title *
            </label>
            <input
              type="text"
              placeholder="e.g., 🎉 Weekend Special — 20% Off!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '18px',
              }}
            />

            {/* Body */}
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Message *
            </label>
            <textarea
              placeholder="Write your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={300}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'var(--font-primary)',
                boxSizing: 'border-box',
                marginBottom: '8px',
                lineHeight: 1.5,
              }}
            />
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--text-tertiary)',
                textAlign: 'right',
                marginBottom: '20px',
                fontWeight: 600,
              }}
            >
              {body.length} / 300 characters
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={sending || !title.trim() || !body.trim()}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '999px',
                background: sending
                  ? 'var(--surface-soft)'
                  : 'linear-gradient(135deg, #059669, #047857)',
                color: sending ? 'var(--text-tertiary)' : '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: sending ? 'none' : '0 6px 20px rgba(5,150,105,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Send size={18} strokeWidth={2.4} />
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="admin-section" style={{ padding: '20px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 16px',
              }}
            >
              📜 Recent Broadcasts
            </h3>

            {recentBroadcasts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--text-tertiary)',
                }}
              >
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>📭</p>
                <p>No broadcasts sent yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentBroadcasts.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: 'var(--surface-soft)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      📢
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          marginBottom: '4px',
                          wordBreak: 'break-word',
                        }}
                      >
                        {b.title}
                      </strong>
                      <p
                        style={{
                          margin: '0 0 6px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}
                      >
                        {b.body}
                      </p>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={11} />
                        To: {b.userId === 'all' ? 'Everyone' : b.userId?.slice(0, 10) + '...'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Tips */}
        {activeTab === 'tips' && (
          <div className="admin-section" style={{ padding: '28px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 20px',
              }}
            >
              💡 Marketing Tips
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                {
                  icon: '🎯',
                  title: 'Target the right audience',
                  desc: 'Send customer-focused offers to customers and partner updates to restaurants.',
                },
                {
                  icon: '⏰',
                  title: 'Peak hours work best',
                  desc: 'Send notifications during meal times (12-2 PM, 6-9 PM) for higher engagement.',
                },
                {
                  icon: '🎁',
                  title: 'Pair with a coupon',
                  desc: 'Create a discount coupon first, then announce it via push notification.',
                },
                {
                  icon: '📊',
                  title: 'Keep it short & punchy',
                  desc: 'Titles under 50 characters get higher open rates.',
                },
                {
                  icon: '🔥',
                  title: 'Use urgency',
                  desc: 'Words like "Today only", "Last chance" drive more clicks.',
                },
              ].map((tip, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px',
                    background: 'var(--surface-soft)',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{tip.icon}</div>
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      {tip.title}
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {tip.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminMarketingPage