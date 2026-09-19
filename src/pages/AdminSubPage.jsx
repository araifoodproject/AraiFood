import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import AdminSidebar from '../components/AdminSidebar'
import { Menu } from 'lucide-react'

function AdminSubPage() {
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [counts, setCounts] = useState({
    orders: 0,
    restaurants: 0,
    riders: 0,
    foods: 0,
    customers: 0,
  })

  // Determine which sub-page
  const pageTitle = (() => {
    const path = location.pathname
    if (path === '/admin/orders') return 'Orders'
    if (path === '/admin/restaurants') return 'Restaurants'
    if (path === '/admin/foods') return 'Food Menu'
    if (path === '/admin/riders') return 'Riders'
    if (path === '/admin/customers') return 'Customers'
    if (path === '/admin/finance') return 'Finance'
    if (path === '/admin/coupons') return 'Coupons'
    if (path === '/admin/marketing') return 'Marketing'
    if (path === '/admin/reviews') return 'Reviews'
    if (path === '/admin/support') return 'Support'
    if (path === '/admin/zones') return 'Delivery Zones'
    if (path === '/admin/settings') return 'Settings'
    if (path === '/admin/security') return 'Security'
    return 'Admin'
  })()

  // Load counts for stats
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setCounts((c) => ({ ...c, orders: snap.size }))
    })
    const unsubRest = onSnapshot(collection(db, 'restaurants'), (snap) => {
      setCounts((c) => ({ ...c, restaurants: snap.size }))
    })
    const unsubRiders = onSnapshot(collection(db, 'riders'), (snap) => {
      setCounts((c) => ({ ...c, riders: snap.size }))
    })
    const unsubFoods = onSnapshot(collection(db, 'foods'), (snap) => {
      setCounts((c) => ({ ...c, foods: snap.size }))
    })
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setCounts((c) => ({ ...c, customers: snap.size }))
    })
    return () => {
      unsubOrders()
      unsubRest()
      unsubRiders()
      unsubFoods()
      unsubUsers()
    }
  }, [])

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

          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">{pageTitle}</h1>
            <p className="admin-page-sub">
              Manage {pageTitle.toLowerCase()} on AraiFood.
            </p>
          </div>
        </div>

        {/* Placeholder Card */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>{pageTitle} Management</h2>
            <p>This section is coming soon. Full features will be added next.</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '20px',
            }}
          >
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>📦</span>
              <div>
                <strong>{counts.orders}</strong>
                <span>Total Orders</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🏪</span>
              <div>
                <strong>{counts.restaurants}</strong>
                <span>Restaurants</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🛵</span>
              <div>
                <strong>{counts.riders}</strong>
                <span>Riders</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>🍔</span>
              <div>
                <strong>{counts.foods}</strong>
                <span>Food Items</span>
              </div>
            </div>
            <div className="admin-stat-mini">
              <span style={{ fontSize: '22px' }}>👥</span>
              <div>
                <strong>{counts.customers}</strong>
                <span>Customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div
          className="admin-section"
          style={{ textAlign: 'center', padding: '60px 24px' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚧</div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            {pageTitle} — Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            This admin section is under development.
          </p>
        </div>
      </main>
    </div>
  )
}

export default AdminSubPage