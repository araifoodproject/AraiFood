// ============================================================
// src/components/AdminSidebar.jsx
// V8 — + Zone Requests menu item
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, onSnapshot } from 'firebase/firestore'
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
  Gamepad2,
  UserCog,
  Pill,
  Briefcase,
  Bell,
  HandCoins,
  CreditCard,
  Building2,
  Inbox,
  TrendingUp,
} from 'lucide-react'

const SIDEBAR_SCROLL_KEY = 'adminSidebarScrollTop'

function AdminSidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const [counts, setCounts] = useState({
    orders: 0,
    restaurants: 0,
    riders: 0,
    walletRequests: 0,
    gamingOrders: 0,
    support: 0,
    reviews: 0,
    pharmacies: 0,
    riderPayments: 0,
    zoneRequests: 0,
  })

  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const isFirstMount = useRef(true)

  const isPartner = localStorage.getItem('isPartner') === 'true'
  const managementRole = localStorage.getItem('managementRole') || 'partner'
  let permissions = {}
  try {
    permissions = JSON.parse(
      localStorage.getItem('managementPermissions') || '{}'
    )
  } catch (e) {
    permissions = {}
  }

  const isSuperAdmin = !isPartner || managementRole === 'admin'

  const canAccess = (key) => {
    if (isSuperAdmin) return true
    return permissions[key] === true
  }

  useEffect(() => {
    if (!menuRef.current) return
    const saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY)
    if (saved) {
      const val = parseInt(saved, 10)
      if (!isNaN(val) && val > 0) {
        requestAnimationFrame(() => {
          if (menuRef.current) {
            menuRef.current.scrollTop = val
          }
        })
      }
    }
    isFirstMount.current = false
  }, [])

  const handleMenuScroll = (e) => {
    if (!menuRef.current) return
    sessionStorage.setItem(
      SIDEBAR_SCROLL_KEY,
      String(e.target.scrollTop)
    )
  }

  const handleLinkClick = () => {
    if (menuRef.current) {
      sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(menuRef.current.scrollTop)
      )
    }
    if (onMobileClose) onMobileClose()
  }

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'orders'), (snap) => {
      const pending = snap.docs.filter((d) => {
        const s = d.data().status
        return !s || s === 'pending'
      }).length
      setCounts((c) => ({ ...c, orders: pending }))
    })

    const unsub2 = onSnapshot(collection(db, 'restaurants'), (snap) => {
      const pending = snap.docs.filter(
        (d) => d.data().status === 'pending'
      ).length
      setCounts((c) => ({ ...c, restaurants: pending }))
    })

    const unsub3 = onSnapshot(collection(db, 'riders'), (snap) => {
      const pending = snap.docs.filter(
        (d) => d.data().status === 'pending'
      ).length
      setCounts((c) => ({ ...c, riders: pending }))
    })

    const unsub4 = onSnapshot(collection(db, 'walletRequests'), (snap) => {
      const pending = snap.docs.filter(
        (d) => d.data().status === 'pending'
      ).length
      setCounts((c) => ({ ...c, walletRequests: pending }))
    })

    const unsub5 = onSnapshot(collection(db, 'gamingOrders'), (snap) => {
      const pending = snap.docs.filter(
        (d) => d.data().status === 'pending'
      ).length
      setCounts((c) => ({ ...c, gamingOrders: pending }))
    })

    const unsub6 = onSnapshot(collection(db, 'supportTickets'), (snap) => {
      const open = snap.docs.filter((d) => d.data().status === 'open').length
      setCounts((c) => ({ ...c, support: open }))
    })

    const unsub7 = onSnapshot(collection(db, 'reviews'), (snap) => {
      const flagged = snap.docs.filter(
        (d) => d.data().flagged === true
      ).length
      setCounts((c) => ({ ...c, reviews: flagged }))
    })

    const unsub8 = onSnapshot(collection(db, 'pharmacies'), (snap) => {
      const pending = snap.docs.filter(
        (d) => d.data().status === 'pending'
      ).length
      setCounts((c) => ({ ...c, pharmacies: pending }))
    })

    const unsub9 = onSnapshot(
      collection(db, 'riderPayments'),
      (snap) => {
        const pending = snap.docs.filter(
          (d) => d.data().status === 'pending'
        ).length
        setCounts((c) => ({ ...c, riderPayments: pending }))
      },
      (err) => {
        console.warn('riderPayments listener:', err.message)
      }
    )

    // ✅ NEW: Zone Requests count (pending only)
    const unsub10 = onSnapshot(
      collection(db, 'zoneRequests'),
      (snap) => {
        const pending = snap.docs.filter(
          (d) => d.data().status !== 'reviewed'
        ).length
        setCounts((c) => ({ ...c, zoneRequests: pending }))
      },
      (err) => {
        console.warn('zoneRequests listener:', err.message)
      }
    )

    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub5()
      unsub6()
      unsub7()
      unsub8()
      unsub9()
      unsub10()
    }
  }, [])

  const allMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', key: null },
    {
      label: 'Orders',
      icon: Package,
      path: '/admin/orders',
      badge: counts.orders,
      badgeClass: 'orange',
      key: 'orders',
    },
    {
      label: 'Restaurants',
      icon: Store,
      path: '/admin/restaurants',
      badge: counts.restaurants,
      badgeClass: 'blue',
      key: 'restaurants',
    },
    {
      label: 'Food Menu',
      icon: UtensilsCrossed,
      path: '/admin/foods',
      key: 'foods',
    },
    {
      label: 'Pharmacies',
      icon: Pill,
      path: '/admin/pharmacies',
      badge: counts.pharmacies,
      badgeClass: 'green',
      key: 'restaurants',
    },
    {
      label: 'Medicines',
      icon: Briefcase,
      path: '/admin/medicines',
      key: 'foods',
    },
    {
      label: 'Riders',
      icon: Bike,
      path: '/admin/riders',
      badge: counts.riders,
      badgeClass: 'blue',
      key: 'riders',
    },
    {
      label: 'Customers',
      icon: Users,
      path: '/admin/customers',
      key: 'customers',
    },
    {
      label: 'Finance',
      icon: Wallet,
      path: '/admin/finance',
      key: 'finance',
    },
    {
      label: 'Settlement',
      icon: HandCoins,
      path: '/admin/settlement',
      key: 'finance',
    },
    {
      label: 'Payment Numbers',
      icon: CreditCard,
      path: '/admin/settlement/payment-numbers',
      key: 'finance',
    },
    {
      label: 'AraiFood Numbers',
      icon: Building2,
      path: '/admin/settlement/araifood-numbers',
      key: 'finance',
    },
    {
      label: 'Rider Payments',
      icon: Inbox,
      path: '/admin/settlement/rider-payments',
      badge: counts.riderPayments,
      badgeClass: 'red',
      key: 'finance',
    },
    {
      label: 'Coupons',
      icon: Ticket,
      path: '/admin/coupons',
      key: 'coupons',
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      key: 'marketing',
    },
    {
      label: 'Marketing',
      icon: Megaphone,
      path: '/admin/marketing',
      key: 'marketing',
    },
    {
      label: 'Reviews',
      icon: Star,
      path: '/admin/reviews',
      badge: counts.reviews,
      badgeClass: 'yellow',
      key: 'reviews',
    },
    {
      label: 'Support',
      icon: LifeBuoy,
      path: '/admin/support',
      badge: counts.support,
      badgeClass: 'red',
      key: 'support',
    },
    {
      label: 'Delivery Zones',
      icon: MapPin,
      path: '/admin/zones',
      key: 'zones',
    },
    {
      // ✅ NEW: Zone Requests
      label: 'Zone Requests',
      icon: TrendingUp,
      path: '/admin/zone-requests',
      badge: counts.zoneRequests,
      badgeClass: 'orange',
      key: 'zones',
    },
    {
      label: 'Wallet Requests',
      icon: Wallet,
      path: '/admin/wallet-requests',
      badge: counts.walletRequests,
      badgeClass: 'green',
      key: 'walletRequests',
    },
    {
      label: 'Gaming Products',
      icon: Gamepad2,
      path: '/admin/gaming-products',
      key: 'gamingProducts',
    },
    {
      label: 'Gaming Orders',
      icon: Package,
      path: '/admin/gaming-orders',
      badge: counts.gamingOrders,
      badgeClass: 'purple',
      key: 'gamingOrders',
    },
    {
      label: 'Gaming Settings',
      icon: Settings,
      path: '/admin/gaming-settings',
      key: 'gamingSettings',
    },
    {
      label: 'Management Team',
      icon: UserCog,
      path: '/admin/management',
      key: 'management',
      superAdminOnly: true,
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      key: 'settings',
    },
    {
      label: 'Security',
      icon: Shield,
      path: '/admin/security',
      key: 'security',
    },
  ]

  const menuItems = allMenuItems.filter((item) => {
    if (item.key === null) return true
    if (item.superAdminOnly && !isSuperAdmin) return false
    return canAccess(item.key)
  })

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userRole')
      localStorage.removeItem('isPartner')
      localStorage.removeItem('managementRole')
      localStorage.removeItem('managementPermissions')
      localStorage.removeItem('managementName')
      localStorage.removeItem('managementId')
      sessionStorage.removeItem(SIDEBAR_SCROLL_KEY)
      navigate('/login')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="admin-sidebar-mobile-overlay"
          onClick={onMobileClose}
        ></div>
      )}

      <aside
        className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${
          mobileOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <img src="/araifood-logo.png" alt="AraiFood" />
            </div>
            {!collapsed && (
              <div className="admin-sidebar-brand-text">
                <span className="admin-sidebar-title">ARAIFOOD</span>
                <small className="admin-sidebar-sub">
                  {isSuperAdmin ? 'Admin Panel' : 'Partner Panel'}
                </small>
              </div>
            )}
          </Link>

          <button
            className="admin-sidebar-toggle desktop"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>

          <button
            className="admin-sidebar-toggle mobile"
            onClick={onMobileClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="admin-sidebar-menu"
          ref={menuRef}
          onScroll={handleMenuScroll}
        >
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = location.pathname === item.path
            const showBadge =
              typeof item.badge === 'number' && item.badge > 0

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
                title={collapsed ? item.label : ''}
              >
                <IconComponent size={20} strokeWidth={2} />
                {!collapsed && <span>{item.label}</span>}

                {showBadge && (
                  <span
                    className={`admin-sidebar-badge ${
                      item.badgeClass || 'red'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

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