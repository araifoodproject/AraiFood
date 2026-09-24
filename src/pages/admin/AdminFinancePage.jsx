// ============================================================
// src/pages/admin/AdminFinancePage.jsx
// V2 — Full financial analytics with settings-based commission
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import useSettings from '../../hooks/useSettings'
import { toast } from 'react-toastify'
import {
  Menu,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  ArrowUpRight,
  Download,
  Truck,
  Wallet,
  Store,
  Pill,
  Bike,
} from 'lucide-react'
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

function AdminFinancePage() {
  const { settings } = useSettings()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  // ============ SETTINGS ============
  const commissionPercent = settings.commissionPercent || 10
  const riderEarningPerDelivery = settings.riderEarningPerDelivery || 30

  // ============ LIVE DATA ============
  useEffect(() => {
    let pending = 4
    const done = () => {
      pending -= 1
      if (pending <= 0) setLoading(false)
    }

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
        done()
      },
      (err) => {
        console.error(err)
        done()
      }
    )
    const unsubRest = onSnapshot(
      collection(db, 'restaurants'),
      (snapshot) => {
        setRestaurants(
          snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
        done()
      },
      (err) => {
        console.error(err)
        done()
      }
    )
    const unsubPharm = onSnapshot(
      collection(db, 'pharmacies'),
      (snapshot) => {
        setPharmacies(
          snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
        done()
      },
      (err) => {
        console.error(err)
        done()
      }
    )
    const unsubRiders = onSnapshot(
      collection(db, 'riders'),
      (snapshot) => {
        setRiders(
          snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
        done()
      },
      (err) => {
        console.error(err)
        done()
      }
    )

    return () => {
      unsubOrders()
      unsubRest()
      unsubPharm()
      unsubRiders()
    }
  }, [])

  // ============ FILTER BY PERIOD ============
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders
    if (period === 'today') {
      const today = new Date().toLocaleDateString()
      return orders.filter(
        (o) => o.createdAt?.toDate?.()?.toLocaleDateString() === today
      )
    }
    const days = parseInt(period)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return orders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt)
      return t >= cutoff
    })
  }, [orders, period])

  // ============ FINANCIAL STATS ============
  const stats = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === 'delivered')

    const totalRevenue = delivered.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    )
    const totalSubtotal = delivered.reduce(
      (sum, o) => sum + Number(o.subtotal || 0),
      0
    )
    const totalDelivery = delivered.reduce(
      (sum, o) => sum + Number(o.deliveryFee || 0),
      0
    )
    const totalCouponDiscount = delivered.reduce(
      (sum, o) => sum + Number(o.couponDiscount || 0),
      0
    )

    // Platform commission from subtotal
    const commission = (totalSubtotal * commissionPercent) / 100

    // Rider payouts
    const riderPayouts = delivered.length * riderEarningPerDelivery

    // Restaurant + Pharmacy payouts
    const restaurantPayouts = totalSubtotal - commission

    const cancelled = filteredOrders.filter(
      (o) => o.status === 'cancelled'
    ).length

    const avgOrderValue =
      delivered.length > 0 ? totalRevenue / delivered.length : 0

    return {
      totalRevenue,
      totalSubtotal,
      totalDelivery,
      totalCouponDiscount,
      commission,
      riderPayouts,
      restaurantPayouts,
      totalOrders: filteredOrders.length,
      deliveredCount: delivered.length,
      cancelled,
      avgOrderValue,
    }
  }, [filteredOrders, commissionPercent, riderEarningPerDelivery])

  // ============ DAILY CHART (last 7 days) ============
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
        .reduce((sum, o) => sum + Number(o.total || 0), 0)

      arr.push({ name: dayLabel, sales: Math.round(dayRevenue) })
    }
    return arr
  }, [orders])

  // ============ PAYMENT METHOD PIE ============
  const paymentPie = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === 'delivered')
    const map = { cod: 0, mobile: 0, wallet: 0 }
    delivered.forEach((o) => {
      const m = o.paymentMethod || 'cod'
      if (map[m] !== undefined) map[m] += 1
      else map.cod += 1
    })
    const data = [
      { name: 'COD', value: map.cod, color: '#F59E0B' },
      { name: 'Mobile', value: map.mobile, color: '#3B82F6' },
      { name: 'Wallet', value: map.wallet, color: '#8B5CF6' },
    ].filter((d) => d.value > 0)

    if (data.length === 0) {
      return [{ name: 'No Data', value: 1, color: '#E5E7EB' }]
    }
    return data
  }, [filteredOrders])

  // ============ TOP RESTAURANTS ============
  const topRestaurants = useMemo(() => {
    const map = {}
    filteredOrders
      .filter((o) => o.status === 'delivered' && o.orderType !== 'pharmacy')
      .forEach((o) => {
        const id = o.restaurantId
        if (!id) return
        if (!map[id]) {
          map[id] = {
            id,
            name: o.restaurantName || 'Unknown',
            logo: o.restaurantLogo || '',
            revenue: 0,
            orders: 0,
          }
        }
        map[id].revenue += Number(o.total || 0)
        map[id].orders += 1
      })
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

  // ============ TOP PHARMACIES ============
  const topPharmacies = useMemo(() => {
    const map = {}
    filteredOrders
      .filter((o) => o.status === 'delivered' && o.orderType === 'pharmacy')
      .forEach((o) => {
        const id = o.pharmacyId || o.restaurantId
        if (!id) return
        if (!map[id]) {
          map[id] = {
            id,
            name: o.pharmacyName || o.restaurantName || 'Unknown',
            revenue: 0,
            orders: 0,
          }
        }
        map[id].revenue += Number(o.total || 0)
        map[id].orders += 1
      })
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

  // ============ TOP RIDERS ============
  const topRiders = useMemo(() => {
    const map = {}
    filteredOrders
      .filter((o) => o.status === 'delivered' && o.riderId)
      .forEach((o) => {
        const id = o.riderId
        if (!id) return
        if (!map[id]) {
          map[id] = {
            id,
            name: o.riderName || 'Unknown',
            deliveries: 0,
            earnings: 0,
          }
        }
        map[id].deliveries += 1
        map[id].earnings += riderEarningPerDelivery
      })
    return Object.values(map)
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5)
  }, [filteredOrders, riderEarningPerDelivery])

  // ============ EXPORT CSV ============
  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export')
      return
    }
    const delivered = filteredOrders.filter((o) => o.status === 'delivered')
    const headers = [
      'Order ID',
      'Date',
      'Vendor',
      'Customer',
      'Subtotal',
      'Delivery',
      'Total',
      'Payment',
      'Status',
    ]
    const rows = delivered.map((o) => [
      o.orderId || '',
      o.createdAt?.toDate?.()?.toLocaleString() || '',
      o.restaurantName || o.pharmacyName || '',
      o.fullName || '',
      o.subtotal || 0,
      o.deliveryFee || 0,
      o.total || 0,
      o.paymentMethod || 'cod',
      o.status || '',
    ])
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `araifood-finance-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${delivered.length} orders`)
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
            <h1 className="admin-page-title">Finance</h1>
            <p className="admin-page-sub">
              Revenue, commission, payouts, and performance analytics.
            </p>
          </div>
          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>

        {/* Period Filter */}
        <div className="admin-section" style={{ padding: '14px 18px' }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginRight: '8px',
              }}
            >
              <Calendar
                size={14}
                style={{ verticalAlign: 'middle', marginRight: '6px' }}
              />
              Period:
            </span>
            {[
              { value: 'today', label: 'Today' },
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: 'all', label: 'All time' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background:
                    period === opt.value
                      ? 'linear-gradient(135deg, #059669, #047857)'
                      : 'var(--surface)',
                  color:
                    period === opt.value
                      ? '#FFFFFF'
                      : 'var(--text-secondary)',
                  border:
                    period === opt.value
                      ? 'none'
                      : '1px solid var(--border-strong)',
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
              <strong className="admin-stat-value">
                ৳{stats.totalRevenue.toFixed(0)}
              </strong>
              <span className="admin-stat-trend up">
                <ArrowUpRight size={14} strokeWidth={2.5} />{' '}
                {stats.deliveredCount} delivered
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <TrendingUp size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">
                Commission ({commissionPercent}%)
              </span>
              <strong className="admin-stat-value">
                ৳{stats.commission.toFixed(0)}
              </strong>
              <span className="admin-stat-trend">From subtotal</span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Package size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Avg Order</span>
              <strong className="admin-stat-value">
                ৳{stats.avgOrderValue.toFixed(0)}
              </strong>
              <span className="admin-stat-trend">
                {stats.totalOrders} total
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <Truck size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Rider Payouts</span>
              <strong className="admin-stat-value">
                ৳{stats.riderPayouts.toFixed(0)}
              </strong>
              <span className="admin-stat-trend">
                @৳{riderEarningPerDelivery}/delivery
              </span>
            </div>
          </div>
        </div>

        {/* Chart + Payment Pie */}
        <div className="admin-charts-grid">
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3>Daily Sales (Last 7 Days)</h3>
                <p>Revenue trend over time</p>
              </div>
            </div>
            {loading ? (
              <p
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-tertiary)',
                }}
              >
                Loading chart...
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartData}
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
                  <Bar
                    dataKey="sales"
                    radius={[8, 8, 0, 0]}
                    fill="url(#finSalesGradient)"
                  />
                  <defs>
                    <linearGradient
                      id="finSalesGradient"
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
            )}
          </div>

          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <div>
                <h3>Payment Methods</h3>
                <p>Order distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentPie.map((entry, index) => (
                    <Cell
                      key={index}
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

        {/* Revenue Breakdown */}
        <div className="admin-section" style={{ marginBottom: '20px' }}>
          <div className="admin-section-header">
            <h2>💰 Revenue Breakdown</h2>
            <p>How the money is distributed</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '20px',
            }}
          >
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
                <strong>৳{stats.restaurantPayouts.toFixed(0)}</strong>
                <span>Restaurant Payout</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🛵</span>
              <div>
                <strong>৳{stats.riderPayouts.toFixed(0)}</strong>
                <span>Rider Payouts</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🎟️</span>
              <div>
                <strong>৳{stats.totalCouponDiscount.toFixed(0)}</strong>
                <span>Coupon Discounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="admin-section" style={{ marginBottom: '20px' }}>
          <div className="admin-section-header">
            <div>
              <h2>
                <Store
                  size={18}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: '6px',
                  }}
                />
                Top Restaurants
              </h2>
              <p>Best performing by revenue</p>
            </div>
          </div>
          {topRestaurants.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                padding: '30px',
                color: 'var(--text-tertiary)',
              }}
            >
              No restaurant revenue yet.
            </p>
          ) : (
            <div className="admin-top-list">
              {topRestaurants.map((r, idx) => (
                <div className="admin-top-item" key={r.id}>
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
                    <strong>{r.name}</strong>
                    <span>{r.orders} orders</span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>৳{r.revenue.toFixed(0)}</strong>
                      <span>Revenue</span>
                    </div>
                    <div className="admin-top-stat">
                      <strong>
                        ৳
                        {(
                          (r.revenue * commissionPercent) /
                          100
                        ).toFixed(0)}
                      </strong>
                      <span>Commission</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pharmacies */}
        {topPharmacies.length > 0 && (
          <div className="admin-section" style={{ marginBottom: '20px' }}>
            <div className="admin-section-header">
              <div>
                <h2>
                  <Pill
                    size={18}
                    style={{
                      verticalAlign: 'middle',
                      marginRight: '6px',
                    }}
                  />
                  Top Pharmacies
                </h2>
                <p>Best performing by revenue</p>
              </div>
            </div>
            <div className="admin-top-list">
              {topPharmacies.map((p, idx) => (
                <div className="admin-top-item" key={p.id}>
                  <div className="admin-top-rank">#{idx + 1}</div>
                  <div className="admin-top-logo">💊</div>
                  <div className="admin-top-info">
                    <strong>{p.name}</strong>
                    <span>{p.orders} orders</span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>৳{p.revenue.toFixed(0)}</strong>
                      <span>Revenue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Riders */}
        {topRiders.length > 0 && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2>
                  <Bike
                    size={18}
                    style={{
                      verticalAlign: 'middle',
                      marginRight: '6px',
                    }}
                  />
                  Top Riders
                </h2>
                <p>Most deliveries in period</p>
              </div>
            </div>
            <div className="admin-top-list">
              {topRiders.map((r, idx) => (
                <div className="admin-top-item" key={r.id}>
                  <div className="admin-top-rank">#{idx + 1}</div>
                  <div className="admin-top-logo">🛵</div>
                  <div className="admin-top-info">
                    <strong>{r.name}</strong>
                    <span>{r.deliveries} deliveries</span>
                  </div>
                  <div className="admin-top-stats">
                    <div className="admin-top-stat">
                      <strong>৳{r.earnings.toFixed(0)}</strong>
                      <span>Earned</span>
                    </div>
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

export default AdminFinancePage