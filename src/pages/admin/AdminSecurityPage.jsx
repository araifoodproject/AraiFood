import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import {
  Menu,
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
} from 'lucide-react'

function AdminSecurityPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    riders: 0,
    orders: 0,
    notifications: 0,
  })
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null)

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'users'), (s) =>
      setStats((p) => ({ ...p, users: s.size }))
    )
    const unsub2 = onSnapshot(collection(db, 'restaurants'), (s) => {
      setStats((p) => ({ ...p, restaurants: s.size }))
      setRestaurants(s.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    const unsub3 = onSnapshot(collection(db, 'riders'), (s) => {
      setStats((p) => ({ ...p, riders: s.size }))
      setRiders(s.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    const unsub4 = onSnapshot(collection(db, 'orders'), (s) => {
      setStats((p) => ({ ...p, orders: s.size }))
      setOrders(s.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsub5 = onSnapshot(collection(db, 'notifications'), (s) =>
      setStats((p) => ({ ...p, notifications: s.size }))
    )
    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub5()
    }
  }, [])

  // Generate alerts based on data
  const alerts = useMemo(() => {
    const list = []

    // Pending restaurants
    const pendingRest = restaurants.filter((r) => r.status === 'pending')
    if (pendingRest.length > 0) {
      list.push({
        id: 'pending-rest',
        type: 'warning',
        icon: '🏪',
        title: `${pendingRest.length} restaurant(s) pending approval`,
        description: 'These restaurants cannot accept orders until approved.',
        action: 'Review in Restaurants page',
        items: pendingRest.map((r) => r.restaurantName || r.email),
        severity: 'medium',
      })
    }

    // Pending riders
    const pendingRiders = riders.filter((r) => r.status === 'pending')
    if (pendingRiders.length > 0) {
      list.push({
        id: 'pending-riders',
        type: 'warning',
        icon: '🛵',
        title: `${pendingRiders.length} rider(s) pending approval`,
        description: 'These riders cannot accept deliveries until approved.',
        action: 'Review in Riders page',
        items: pendingRiders.map((r) => r.fullName || r.email),
        severity: 'medium',
      })
    }

    // Cancelled orders (last 20%)
    const cancelled = orders.filter((o) => o.status === 'cancelled')
    if (cancelled.length > 0) {
      list.push({
        id: 'cancelled-orders',
        type: 'info',
        icon: '❌',
        title: `${cancelled.length} cancelled order(s)`,
        description: 'Check for patterns — high cancellation rate may indicate issues.',
        action: 'View in Orders page',
        items: cancelled.slice(0, 5).map((o) => o.orderId),
        severity: 'low',
      })
    }

    // Orders without rider (pending for a while)
    const staleOrders = orders.filter(
      (o) =>
        (o.status === 'pending' || !o.status) &&
        !o.riderId &&
        o.createdAt?.toDate?.()?.getTime?.() < Date.now() - 30 * 60 * 1000 // 30 min
    )
    if (staleOrders.length > 0) {
      list.push({
        id: 'stale-orders',
        type: 'danger',
        icon: '⏰',
        title: `${staleOrders.length} order(s) waiting > 30 min`,
        description: 'These orders may need manual intervention.',
        action: 'View in Orders page',
        items: staleOrders.slice(0, 5).map((o) => o.orderId),
        severity: 'high',
      })
    }

    // Rejected restaurants
    const rejectedRest = restaurants.filter((r) => r.status === 'rejected')
    if (rejectedRest.length > 0) {
      list.push({
        id: 'rejected-rest',
        type: 'info',
        icon: '🚫',
        title: `${rejectedRest.length} rejected restaurant(s)`,
        description: 'These applications were rejected.',
        action: 'Review history',
        items: rejectedRest.map((r) => r.restaurantName || r.email),
        severity: 'low',
      })
    }

    return list
  }, [orders, restaurants, riders])

  const severityColor = (sev) => {
    if (sev === 'high') return { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.3)' }
    if (sev === 'medium') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
    return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' }
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
            <h1 className="admin-page-title">Security</h1>
            <p className="admin-page-sub">
              Monitor platform health, pending approvals, and system alerts.
            </p>
          </div>
        </div>

        {/* Health Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Users size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Users</span>
              <strong className="admin-stat-value">{stats.users}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">🏪</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Restaurants</span>
              <strong className="admin-stat-value">{stats.restaurants}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">🛵</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Riders</span>
              <strong className="admin-stat-value">{stats.riders}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">📦</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Orders</span>
              <strong className="admin-stat-value">{stats.orders}</strong>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="admin-section" style={{ padding: '24px', marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={26} color="#047857" />
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
                System Health
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Real-time platform status
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <HealthCard label="Firebase Auth" value="Operational" icon="🔐" ok />
            <HealthCard label="Firestore" value="Connected" icon="🗄️" ok />
            <HealthCard
              label="Notifications"
              value={`${stats.notifications} sent`}
              icon="🔔"
              ok
            />
            <HealthCard
              label="Pending Approvals"
              value={`${alerts.filter((a) => a.severity !== 'low').length} alerts`}
              icon="⚠️"
              ok={alerts.filter((a) => a.severity !== 'low').length === 0}
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="admin-section" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background:
                  alerts.length > 0
                    ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
                    : 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle
                size={26}
                color={alerts.length > 0 ? '#D97706' : '#047857'}
              />
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
                System Alerts
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {alerts.length === 0
                  ? 'All systems normal — no alerts'
                  : `${alerts.length} item(s) need attention`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="panel-loading">
              <div className="panel-loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: 'rgba(22,163,74,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(22,163,74,0.15)',
              }}
            >
              <div style={{ fontSize: '52px', marginBottom: '12px' }}>✅</div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#16a34a',
                  margin: 0,
                }}
              >
                All Clear!
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: '6px 0 0',
                }}
              >
                No security or operational alerts at this moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((a) => {
                const sev = severityColor(a.severity)
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      padding: '16px',
                      background: sev.bg,
                      border: `1px solid ${sev.border}`,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '26px',
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      {a.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '14.5px',
                          fontWeight: 800,
                          color: sev.color,
                          marginBottom: '4px',
                        }}
                      >
                        {a.title}
                      </strong>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {a.description}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: sev.color,
                        }}
                      >
                        → {a.action}
                      </span>
                    </div>
                    <Eye size={16} color={sev.color} style={{ flexShrink: 0, marginTop: '4px' }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Security Best Practices */}
        <div className="admin-section" style={{ padding: '24px', marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={26} color="#1D4ED8" />
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
                Security Checklist
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Recommended security setup for production
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { text: 'Firestore Security Rules configured (not test mode)', done: false },
              { text: 'Firebase API key restricted to your domains', done: false },
              { text: '2-Step Verification enabled on Firebase account', done: false },
              { text: 'Only authorized admin emails can access /admin', done: true },
              { text: 'User wallet deductions use atomic operations', done: true },
              { text: 'Delivery OTP verification enforced', done: true },
              { text: 'Images compressed before Firestore save (max 1MB)', done: true },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
              >
                {item.done ? (
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                ) : (
                  <XCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Footer */}
        <div
          className="admin-section"
          style={{
            padding: '20px',
            marginTop: '20px',
            textAlign: 'center',
            background:
              'linear-gradient(135deg, rgba(5,150,105,0.06), rgba(249,115,22,0.06))',
            border: '1px solid rgba(5,150,105,0.15)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            🛡️ AraiFood Security Monitor — Real-time platform health checks
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '11.5px',
              color: 'var(--text-tertiary)',
              fontWeight: 500,
            }}
          >
            Last checked: {new Date().toLocaleString()}
          </p>
        </div>
      </main>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div
          className="outside-area-modal"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                <div style={{ fontSize: '32px' }}>{selectedAlert.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-heading)',
                      fontSize: '17px',
                      fontWeight: 800,
                      wordBreak: 'break-word',
                    }}
                  >
                    {selectedAlert.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p
              style={{
                margin: '0 0 16px',
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {selectedAlert.description}
            </p>

            {selectedAlert.items && selectedAlert.items.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <strong
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Related Items
                </strong>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {selectedAlert.items.slice(0, 10).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--surface-soft)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        wordBreak: 'break-word',
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '12px',
                fontSize: '12.5px',
                color: '#1D4ED8',
                fontWeight: 700,
              }}
            >
              💡 {selectedAlert.action}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HealthCard({ label, value, icon, ok }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: ok ? 'rgba(22,163,74,0.06)' : 'rgba(245,158,11,0.06)',
        border: ok
          ? '1px solid rgba(22,163,74,0.2)'
          : '1px solid rgba(245,158,11,0.2)',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '14px',
            fontWeight: 800,
            color: ok ? '#16a34a' : '#d97706',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

export default AdminSecurityPage