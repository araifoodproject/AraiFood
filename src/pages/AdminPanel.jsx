import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
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
  Users,
} from 'lucide-react'

function AdminPanel() {
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [riders, setRiders] = useState([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'restaurants'),
      (snapshot) => {
        setRestaurants(
          snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
      }
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'riders'), (snapshot) => {
      setRiders(snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    return () => unsubscribe()
  }, [])

  const totalOrders = orders.length
  const today = new Date().toLocaleDateString()
  const todayOrders = orders.filter(
    (o) => o.createdAt?.toDate?.()?.toLocaleDateString() === today
  ).length
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || !o.status
  ).length
  const preparingOrders = orders.filter((o) => o.status === 'preparing').length
  const deliveringOrders = orders.filter((o) => o.status === 'delivering').length
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  const approvedRestaurants = restaurants.filter(
    (r) => r.status === 'approved'
  ).length
  const pendingRestaurants = restaurants.filter(
    (r) => r.status === 'pending'
  ).length

  const approvedRiders = riders.filter((r) => r.status === 'approved').length
  const pendingRiders = riders.filter((r) => r.status === 'pending').length

  const salesChartData = [
    { name: 'Mon', sales: 4500 },
    { name: 'Tue', sales: 6200 },
    { name: 'Wed', sales: 5100 },
    { name: 'Thu', sales: 7800 },
    { name: 'Fri', sales: 9200 },
    { name: 'Sat', sales: 11500 },
    { name: 'Sun', sales: 8900 },
  ]

  const orderStatusData = [
    {
      name: 'Delivered',
      value: deliveredOrders || 1,
      color: '#10B981',
    },
    {
      name: 'Preparing',
      value: preparingOrders || 1,
      color: '#F59E0B',
    },
    {
      name: 'Delivering',
      value: deliveringOrders || 1,
      color: '#3B82F6',
    },
    {
      name: 'Cancelled',
      value: cancelledOrders || 1,
      color: '#EF4444',
    },
  ]

  const topRestaurants = restaurants
    .map((r) => ({
      ...r,
      orderCount: orders.filter((o) => o.restaurantId === r.firebaseId).length,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5)

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        {/* Top Bar */}
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
            {/* Notification Panel — Same as customer/restaurant */}
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
            <h1 className="admin-page-title">Welcome back, Admin! 👑</h1>
            <p className="admin-page-sub">
              Here's what's happening with AraiFood today.
            </p>
          </div>
          <button className="admin-page-action">
            <TrendingUp size={16} strokeWidth={2.5} />
            View Report
          </button>
        </div>

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
                +12.5% today
              </span>
            </div>
          </div>

          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <ShoppingBag size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Orders</span>
              <strong className="admin-stat-value">{totalOrders}</strong>
              <span className="admin-stat-trend up">
                <ArrowUpRight size={14} strokeWidth={2.5} />
                +{todayOrders} today
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

        {/* Mini Stats */}
        <div className="admin-stats-grid-small">
          <div className="admin-stat-mini">
            <Clock size={18} strokeWidth={2.2} />
            <div>
              <strong>{pendingOrders}</strong>
              <span>Pending</span>
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
            <Star size={18} strokeWidth={2.2} />
            <div>
              <strong>4.8</strong>
              <span>Rating</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="admin-charts-grid">
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3>Weekly Sales</h3>
                <p>Revenue overview for the past 7 days</p>
              </div>
              <span className="admin-chart-badge">
                ৳{totalRevenue.toFixed(0)}
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
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                />
                <Bar
                  dataKey="sales"
                  radius={[8, 8, 0, 0]}
                  fill="url(#salesGradient)"
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
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3>Order Status</h3>
                <p>Distribution of all orders</p>
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
              <h2>Top Restaurants</h2>
              <p>Best performing restaurants this week</p>
            </div>
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
                  <div className="admin-top-logo">🏪</div>
                  <div className="admin-top-info">
                    <strong>{r.restaurantName}</strong>
                    <span>{r.cuisine}</span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>{r.orderCount}</strong>
                      <span>Orders</span>
                    </div>
                    <div className="admin-top-stat">
                      <strong>⭐ {r.rating || 4.5}</strong>
                      <span>Rating</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPanel