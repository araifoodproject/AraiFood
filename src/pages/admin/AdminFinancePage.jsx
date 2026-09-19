import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import {
  Menu,
  DollarSign,
  TrendingUp,
  Package,
  Store,
  Calendar,
  ArrowUpRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

function AdminFinancePage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setOrders(list)
      setLoading(false)
    })
    const unsubRest = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setRestaurants(list)
    })
    return () => {
      unsubOrders()
      unsubRest()
    }
  }, [])

  // Filter orders by period (30/60/90 days)
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders
    const days = parseInt(period)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return orders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt)
      return t >= cutoff
    })
  }, [orders, period])

  const stats = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === 'delivered')
    const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0)
    const totalSubtotal = delivered.reduce((sum, o) => sum + (o.subtotal || 0), 0)
    const totalDelivery = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0)
    const commission = totalSubtotal * 0.1
    const cancelled = filteredOrders.filter((o) => o.status === 'cancelled').length
    const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0

    return {
      totalRevenue,
      totalSubtotal,
      totalDelivery,
      commission,
      totalOrders: filteredOrders.length,
      deliveredCount: delivered.length,
      cancelled,
      avgOrderValue,
    }
  }, [filteredOrders])

  // Daily sales chart (last 7 days)
  const chartData = useMemo(() => {
    const days = 7
    const arr = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString()
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' })

      const dayRevenue = orders
        .filter((o) => {
          if (o.status !== 'delivered') return false
          const t = o.createdAt?.toDate?.() || new Date(o.createdAt)
          return t.toLocaleDateString() === dateStr
        })
        .reduce((sum, o) => sum + (o.total || 0), 0)

      arr.push({ name: dayLabel, sales: Math.round(dayRevenue) })
    }
    return arr
  }, [orders])

  // Top restaurants by revenue
  const topRestaurants = useMemo(() => {
    const map = {}
    filteredOrders
      .filter((o) => o.status === 'delivered')
      .forEach((o) => {
        const id = o.restaurantId
        if (!id) return
        if (!map[id]) {
          map[id] = {
            id,
            name: o.restaurantName || 'Unknown',
            revenue: 0,
            orders: 0,
          }
        }
        map[id].revenue += o.total || 0
        map[id].orders += 1
      })

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

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
            <h1 className="admin-page-title">Finance</h1>
            <p className="admin-page-sub">
              Revenue, commission, and restaurant performance analytics.
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="admin-section" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '8px' }}>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Period:
            </span>
            {[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '60', label: 'Last 60 days' },
              { value: '90', label: 'Last 90 days' },
              { value: 'all', label: 'All time' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: period === opt.value
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : 'var(--surface)',
                  color: period === opt.value ? '#FFFFFF' : 'var(--text-secondary)',
                  border: period === opt.value ? 'none' : '1px solid var(--border-strong)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <DollarSign size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Revenue</span>
              <strong className="admin-stat-value">৳{stats.totalRevenue.toFixed(0)}</strong>
              <span className="admin-stat-trend up">
                <ArrowUpRight size={14} strokeWidth={2.5} /> {stats.deliveredCount} orders
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <TrendingUp size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Commission (10%)</span>
              <strong className="admin-stat-value">৳{stats.commission.toFixed(0)}</strong>
              <span className="admin-stat-trend">From subtotal</span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Package size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Avg Order Value</span>
              <strong className="admin-stat-value">৳{stats.avgOrderValue.toFixed(0)}</strong>
              <span className="admin-stat-trend">{stats.totalOrders} total orders</span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">🚚</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Delivery Fees</span>
              <strong className="admin-stat-value">৳{stats.totalDelivery.toFixed(0)}</strong>
              <span className="admin-stat-trend">{stats.cancelled} cancelled</span>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="admin-chart-card" style={{ marginBottom: '20px' }}>
          <div className="admin-chart-header">
            <div>
              <h3>Daily Sales (Last 7 Days)</h3>
              <p>Revenue trend over time</p>
            </div>
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              Loading chart...
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }} />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]} fill="url(#salesGradient)" />
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Restaurants */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Top Restaurants by Revenue</h2>
            <p>Best performing restaurants in this period</p>
          </div>

          {topRestaurants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              No revenue data yet.
            </p>
          ) : (
            <div className="admin-top-list">
              {topRestaurants.map((r, idx) => (
                <div className="admin-top-item" key={r.id}>
                  <div className="admin-top-rank">#{idx + 1}</div>
                  <div className="admin-top-logo">🏪</div>
                  <div className="admin-top-info">
                    <strong>{r.name}</strong>
                    <span>{r.orders} orders</span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>৳{r.revenue.toFixed(0)}</strong>
                      <span>Revenue</span>
                    </div>
                    <div className="admin-top-stat">
                      <strong>৳{(r.revenue * 0.1).toFixed(0)}</strong>
                      <span>Commission</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="admin-section" style={{ marginTop: '20px' }}>
          <div className="admin-section-header">
            <h2>Revenue Breakdown</h2>
            <p>How the revenue is distributed</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px' }}>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>💵</span>
              <div>
                <strong>৳{stats.totalSubtotal.toFixed(0)}</strong>
                <span>Food Subtotal</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🚚</span>
              <div>
                <strong>৳{stats.totalDelivery.toFixed(0)}</strong>
                <span>Delivery Fees</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>👑</span>
              <div>
                <strong>৳{stats.commission.toFixed(0)}</strong>
                <span>Platform Commission</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🏪</span>
              <div>
                <strong>৳{(stats.totalSubtotal - stats.commission).toFixed(0)}</strong>
                <span>Restaurant Payout</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminFinancePage