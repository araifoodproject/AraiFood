// ============================================================
// src/pages/AdminPanel.jsx
// V2.2 — Fixed Users import
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import AdminSidebar from '../components/AdminSidebar'
import NotificationPanel from '../components/NotificationPanel'
import {
  Menu,
  Search,
  TrendingUp,
  ShoppingBag,
  Store,
  Bike,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  ArrowUpRight,
  Pill,
  Gamepad2,
  Wallet,
  AlertCircle,
  Users,
} from 'lucide-react'

function AdminPanel() {
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [riders, setRiders] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [gamingOrders, setGamingOrders] = useState([])
  const [walletRequests, setWalletRequests] = useState([])
  const [customers, setCustomers] = useState([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ============ LIVE DATA ============
  useEffect(() => {
    const unsubs = []

    try {
      unsubs.push(
        onSnapshot(collection(db, 'orders'), (snapshot) => {
          setOrders(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )

      unsubs.push(
        onSnapshot(collection(db, 'restaurants'), (snapshot) => {
          setRestaurants(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )

      unsubs.push(
        onSnapshot(collection(db, 'riders'), (snapshot) => {
          setRiders(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )

      unsubs.push(
        onSnapshot(collection(db, 'pharmacies'), (snapshot) => {
          setPharmacies(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )

      unsubs.push(
        onSnapshot(collection(db, 'gamingOrders'), (snapshot) => {
          setGamingOrders(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )

      unsubs.push(
        onSnapshot(collection(db, 'walletRequests'), (snapshot) => {
          setWalletRequests(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )

      unsubs.push(
        onSnapshot(collection(db, 'users'), (snapshot) => {
          setCustomers(
            snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
          )
        })
      )
    } catch (err) {
      console.error('Snapshot setup error:', err)
    }

    return () =>
      unsubs.forEach((u) => {
        try {
          u()
        } catch (e) {}
      })
  }, [])

  // ============ ORDERS STATS ============
  const today = new Date().toLocaleDateString()

  const todayOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.createdAt?.toDate?.()?.toLocaleDateString() === today
      ),
    [orders, today]
  )

  const todayRevenue = useMemo(
    () =>
      todayOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + (Number(o.total) || 0), 0),
    [todayOrders]
  )

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + (Number(o.total) || 0), 0),
    [orders]
  )

  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || !o.status
  ).length
  const preparingOrders = orders.filter(
    (o) => o.status === 'preparing'
  ).length
  const deliveringOrders = orders.filter(
    (o) => o.status === 'delivering'
  ).length
  const deliveredOrders = orders.filter(
    (o) => o.status === 'delivered'
  ).length
  const cancelledOrders = orders.filter(
    (o) => o.status === 'cancelled'
  ).length

  // ============ RESTAURANTS / RIDERS / PHARMACIES ============
  const approvedRestaurants = restaurants.filter(
    (r) => r.status === 'approved'
  ).length
  const pendingRestaurants = restaurants.filter(
    (r) => r.status === 'pending'
  ).length

  const approvedRiders = riders.filter((r) => r.status === 'approved').length
  const pendingRiders = riders.filter((r) => r.status === 'pending').length

  const approvedPharmacies = pharmacies.filter(
    (p) => p.status === 'approved'
  ).length
  const pendingPharmacies = pharmacies.filter(
    (p) => p.status === 'pending'
  ).length

  const pendingGamingOrders = gamingOrders.filter(
    (o) => o.status === 'pending' || !o.status
  ).length

  const pendingWalletRequests = walletRequests.filter(
    (r) => r.status === 'pending'
  ).length

  // ============ AVERAGE RATING (safe) ============
  const avgRating = useMemo(() => {
    const withRating = restaurants.filter(
      (r) => typeof r.rating === 'number' && r.rating > 0
    )
    if (withRating.length === 0) return '—'
    const sum = withRating.reduce((s, r) => s + r.rating, 0)
    return (sum / withRating.length).toFixed(1)
  }, [restaurants])

  // ============ CHART — LAST 7 DAYS ============
  const salesChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const todayDate = new Date()
    const result = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate)
      d.setDate(todayDate.getDate() - i)
      const dayStr = d.toLocaleDateString()

      const daySales = orders
        .filter(
          (o) =>
            o.createdAt?.toDate?.()?.toLocaleDateString() === dayStr &&
            o.status !== 'cancelled'
        )
        .reduce((s, o) => s + (Number(o.total) || 0), 0)

      result.push({
        name: days[d.getDay()],
        sales: Math.round(daySales),
        fullDate: dayStr,
      })
    }

    return result
  }, [orders])

  // ============ ORDER STATUS PIE ============
  const orderStatusData = useMemo(() => {
    const data = [
      { name: 'Delivered', value: deliveredOrders, color: '#10B981' },
      { name: 'Preparing', value: preparingOrders, color: '#F59E0B' },
      { name: 'Delivering', value: deliveringOrders, color: '#3B82F6' },
      { name: 'Pending', value: pendingOrders, color: '#8B5CF6' },
      { name: 'Cancelled', value: cancelledOrders, color: '#EF4444' },
    ].filter((d) => d.value > 0)

    if (data.length === 0) {
      return [{ name: 'No Data', value: 1, color: '#E5E7EB' }]
    }
    return data
  }, [
    deliveredOrders,
    preparingOrders,
    deliveringOrders,
    pendingOrders,
    cancelledOrders,
  ])

  // ============ TOP RESTAURANTS ============
  const topRestaurants = useMemo(() => {
    return restaurants
      .map((r) => {
        const restaurantOrders = orders.filter(
          (o) => o.restaurantId === r.firebaseId && o.status !== 'cancelled'
        )
        return {
          ...r,
          orderCount: restaurantOrders.length,
          revenue: restaurantOrders.reduce(
            (s, o) => s + (Number(o.total) || 0),
            0
          ),
        }
      })
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)
  }, [restaurants, orders])

  // ============ TOP RIDERS ============
  const topRiders = useMemo(() => {
    return riders
      .filter((r) => r.status === 'approved')
      .map((r) => {
        const riderOrders = orders.filter(
          (o) => o.riderId === r.firebaseId && o.status === 'delivered'
        )
        return {
          ...r,
          deliveryCount: riderOrders.length,
        }
      })
      .sort((a, b) => b.deliveryCount - a.deliveryCount)
      .slice(0, 5)
  }, [riders, orders])

  // ============ RECENT ACTIVITY ============
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
        .slice(0, 8),
    [orders]
  )

  // ============ HELPERS ============
  const getStatusColor = (status) => {
    const map = {
      pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
      preparing: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
      delivering: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
      delivered: { color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
      cancelled: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    }
    return map[status] || map.pending
  }

  const timeAgo = (ts) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMs / 3600000)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffDay < 7) return `${diffDay}d ago`
    return d.toLocaleDateString()
  }

  const totalPendingActions =
    pendingRestaurants +
    pendingRiders +
    pendingPharmacies +
    pendingWalletRequests +
    pendingGamingOrders

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        {/* Topbar */}
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <div className="admin-topbar-search">
            <Search size={18} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search orders, restaurants, riders..."
            />
          </div>

          <div className="admin-topbar-actions">
            <NotificationPanel />
            <div className="admin-topbar-profile">
              <div className="admin-topbar-avatar">👑</div>
              <div className="admin-topbar-profile-info">
                <strong>Admin</strong>
                <small>Super Admin</small>
              </div>
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">DASHBOARD</span>
            <h1 className="admin-page-title">
              Welcome back, Admin! 👑
            </h1>
            <p className="admin-page-sub">
              Real-time overview of your entire platform.
            </p>
          </div>
          <Link
            to="/admin/finance"
            className="admin-page-action"
            style={{ textDecoration: 'none' }}
          >
            <TrendingUp size={16} strokeWidth={2.5} />
            View Reports
          </Link>
        </div>

        {/* Pending Alerts */}
        {totalPendingActions > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05))',
              border: '1px solid rgba(245,158,11,0.3)',
              marginBottom: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <AlertCircle size={24} color="#D97706" />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <strong
                style={{
                  display: 'block',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: '#D97706',
                  marginBottom: '2px',
                }}
              >
                {totalPendingActions} pending action
                {totalPendingActions !== 1 ? 's' : ''} need your attention
              </strong>
              <span
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                {pendingRestaurants > 0 &&
                  `${pendingRestaurants} restaurant${
                    pendingRestaurants > 1 ? 's' : ''
                  }`}
                {pendingRiders > 0 &&
                  ` · ${pendingRiders} rider${pendingRiders > 1 ? 's' : ''}`}
                {pendingPharmacies > 0 &&
                  ` · ${pendingPharmacies} pharmac${
                    pendingPharmacies > 1 ? 'ies' : 'y'
                  }`}
                {pendingWalletRequests > 0 &&
                  ` · ${pendingWalletRequests} wallet request${
                    pendingWalletRequests > 1 ? 's' : ''
                  }`}
                {pendingGamingOrders > 0 &&
                  ` · ${pendingGamingOrders} gaming order${
                    pendingGamingOrders > 1 ? 's' : ''
                  }`}
              </span>
            </div>
            <Link
              to="/admin/orders"
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                flexShrink: 0,
              }}
            >
              View All →
            </Link>
          </div>
        )}

        {/* Primary Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <DollarSign size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Revenue</span>
              <strong className="admin-stat-value">
                ৳{totalRevenue.toFixed(0)}
              </strong>
              <span className="admin-stat-trend up">
                <ArrowUpRight size={14} strokeWidth={2.5} />
                ৳{todayRevenue.toFixed(0)} today
              </span>
            </div>
          </div>

          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <ShoppingBag size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Orders</span>
              <strong className="admin-stat-value">{orders.length}</strong>
              <span className="admin-stat-trend up">
                <ArrowUpRight size={14} strokeWidth={2.5} />
                {todayOrders.length} today
              </span>
            </div>
          </div>

          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Store size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Restaurants</span>
              <strong className="admin-stat-value">
                {approvedRestaurants}
              </strong>
              <span className="admin-stat-trend">
                {pendingRestaurants > 0
                  ? `${pendingRestaurants} pending`
                  : 'All approved'}
              </span>
            </div>
          </div>

          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <Bike size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Riders</span>
              <strong className="admin-stat-value">{approvedRiders}</strong>
              <span className="admin-stat-trend">
                {pendingRiders > 0
                  ? `${pendingRiders} pending`
                  : 'All approved'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="admin-stats-grid-small">
          <div className="admin-stat-mini">
            <Clock size={18} strokeWidth={2.2} />
            <div>
              <strong>{pendingOrders}</strong>
              <span>Pending Orders</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <CheckCircle2 size={18} strokeWidth={2.2} />
            <div>
              <strong>{deliveredOrders}</strong>
              <span>Delivered</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <XCircle size={18} strokeWidth={2.2} />
            <div>
              <strong>{cancelledOrders}</strong>
              <span>Cancelled</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <Pill size={18} strokeWidth={2.2} />
            <div>
              <strong>{approvedPharmacies}</strong>
              <span>Pharmacies</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <Gamepad2 size={18} strokeWidth={2.2} />
            <div>
              <strong>{gamingOrders.length}</strong>
              <span>Gaming Orders</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <Wallet size={18} strokeWidth={2.2} />
            <div>
              <strong>{pendingWalletRequests}</strong>
              <span>Wallet Requests</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <Users size={18} strokeWidth={2.2} />
            <div>
              <strong>{customers.length}</strong>
              <span>Customers</span>
            </div>
          </div>
          <div className="admin-stat-mini">
            <Star size={18} strokeWidth={2.2} />
            <div>
              <strong>{avgRating}</strong>
              <span>Avg Rating</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="admin-charts-grid">
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3>Weekly Sales</h3>
                <p>Revenue — last 7 days</p>
              </div>
              <span className="admin-chart-badge">
                ৳
                {salesChartData
                  .reduce((s, d) => s + d.sales, 0)
                  .toFixed(0)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={salesChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                  formatter={(v) => [`৳${v}`, 'Sales']}
                />
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="sales"
                  radius={[8, 8, 0, 0]}
                  fill="url(#salesGradient)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3>Order Status</h3>
                <p>Live distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2>🏆 Top Restaurants</h2>
              <p>Best performing by orders</p>
            </div>
            <Link
              to="/admin/restaurants"
              style={{
                color: '#059669',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              View All →
            </Link>
          </div>
          <div className="admin-top-list">
            {topRestaurants.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-tertiary)',
                  padding: '20px',
                }}
              >
                No data yet
              </p>
            ) : (
              topRestaurants.map((r, idx) => (
                <div className="admin-top-item" key={r.firebaseId}>
                  <div className="admin-top-rank">#{idx + 1}</div>
                  <div className="admin-top-logo">
                    {r.logo ? (
                      <img
                        src={r.logo}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      '🏪'
                    )}
                  </div>
                  <div className="admin-top-info">
                    <strong>{r.restaurantName}</strong>
                    <span>
                      {r.cuisine} · ৳{r.revenue.toFixed(0)} revenue
                    </span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>{r.orderCount}</strong>
                      <span>Orders</span>
                    </div>
                    <div className="admin-top-stat">
                      <strong>
                        ⭐{' '}
                        {typeof r.rating === 'number'
                          ? r.rating.toFixed(1)
                          : '—'}
                      </strong>
                      <span>Rating</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Riders */}
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2>🛵 Top Riders</h2>
              <p>Most deliveries completed</p>
            </div>
            <Link
              to="/admin/riders"
              style={{
                color: '#059669',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              View All →
            </Link>
          </div>
          <div className="admin-top-list">
            {topRiders.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-tertiary)',
                  padding: '20px',
                }}
              >
                No riders yet
              </p>
            ) : (
              topRiders.map((r, idx) => (
                <div className="admin-top-item" key={r.firebaseId}>
                  <div className="admin-top-rank">#{idx + 1}</div>
                  <div className="admin-top-logo">
                    {r.profileImage ? (
                      <img
                        src={r.profileImage}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      '🛵'
                    )}
                  </div>
                  <div className="admin-top-info">
                    <strong>{r.fullName}</strong>
                    <span>
                      {r.vehicleType || 'Motorcycle'} · ৳
                      {(Number(r.totalEarnings) || 0).toFixed(0)} earned
                    </span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>{r.deliveryCount}</strong>
                      <span>Delivered</span>
                    </div>
                    <div className="admin-top-stat">
                      <strong>
                        ⭐{' '}
                        {typeof r.rating === 'number'
                          ? r.rating.toFixed(1)
                          : '—'}
                      </strong>
                      <span>Rating</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2>🕐 Recent Orders</h2>
              <p>Latest orders across the platform</p>
            </div>
            <Link
              to="/admin/orders"
              style={{
                color: '#059669',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              View All →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p
              style={{
                color: 'var(--text-tertiary)',
                padding: '20px',
              }}
            >
              No orders yet
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {recentOrders.map((o) => {
                const statusStyle = getStatusColor(o.status)
                const vendor =
                  o.restaurantName || o.pharmacyName || 'Vendor'
                const isPharmacy = o.orderType === 'pharmacy'
                return (
                  <div
                    key={o.firebaseId}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'var(--surface-soft)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background:
                          'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      {isPharmacy ? '💊' : '🏪'}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          marginBottom: '2px',
                        }}
                      >
                        #{o.orderId} · {vendor}
                      </strong>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 600,
                        }}
                      >
                        {o.fullName || 'Customer'} · ৳{o.total} ·{' '}
                        {timeAgo(o.createdAt)}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: '5px 12px',
                        borderRadius: '999px',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '11.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {o.status || 'pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminPanel