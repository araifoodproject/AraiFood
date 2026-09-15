import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import {
  LayoutDashboard,
  Package,
  Store,
  UtensilsCrossed,
  Bike,
  Users,
  Wallet,
  Ticket,
  Megaphone,
  Star,
  LifeBuoy,
  MapPin,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react'

function AdminSidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 🎯 Admin Menu Items (আপনার দেওয়া List অনুযায়ী)
  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
    },
    {
      label: 'Orders',
      icon: Package,
      path: '/admin/orders',
    },
    {
      label: 'Restaurants',
      icon: Store,
      path: '/admin/restaurants',
    },
    {
      label: 'Food Menu',
      icon: UtensilsCrossed,
      path: '/admin/foods',
    },
    {
      label: 'Riders',
      icon: Bike,
      path: '/admin/riders',
    },
    {
      label: 'Customers',
      icon: Users,
      path: '/admin/customers',
    },
    {
      label: 'Finance',
      icon: Wallet,
      path: '/admin/finance',
    },
    {
      label: 'Coupons',
      icon: Ticket,
      path: '/admin/coupons',
    },
    {
      label: 'Marketing',
      icon: Megaphone,
      path: '/admin/marketing',
    },
    {
      label: 'Reviews',
      icon: Star,
      path: '/admin/reviews',
    },
    {
      label: 'Support',
      icon: LifeBuoy,
      path: '/admin/support',
    },
    {
      label: 'Delivery Zones',
      icon: MapPin,
      path: '/admin/zones',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
    },
    {
      label: 'Security',
      icon: Shield,
      path: '/admin/security',
    },
  ]

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="admin-sidebar-mobile-overlay" onClick={onMobileClose}></div>
      )}

      <aside
        className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Header */}
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <img src="/araifood-logo.png" alt="AraiFood" />
            </div>
            {!collapsed && (
              <div className="admin-sidebar-brand-text">
                <span className="admin-sidebar-title">ARAIFOOD</span>
                <small className="admin-sidebar-sub">Admin Panel</small>
              </div>
            )}
          </Link>

          {/* Collapse Button (Desktop) */}
          <button
            className="admin-sidebar-toggle desktop"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Close Button (Mobile) */}
          <button
            className="admin-sidebar-toggle mobile"
            onClick={onMobileClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onMobileClose}
                title={collapsed ? item.label : ''}
              >
                <IconComponent size={20} strokeWidth={2} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer — Logout */}
        <div className="admin-sidebar-footer">
          <button
            className="admin-sidebar-link logout"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={20} strokeWidth={2} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar