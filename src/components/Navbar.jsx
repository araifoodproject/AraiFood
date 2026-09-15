import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import NotificationPanel from './NotificationPanel'
import {
  Search,
  Heart,
  Package,
  ShoppingBag,
  User,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Cart Count
  const updateCartCount = () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(totalItems)
  }

  useEffect(() => {
    updateCartCount()
    window.addEventListener('cartUpdated', updateCartCount)
    window.addEventListener('storage', updateCartCount)
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount)
      window.removeEventListener('storage', updateCartCount)
    }
  }, [location.pathname])

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const currentPath = location.pathname

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/restaurants', label: 'Restaurants' },
    { path: '/pharmacy', label: 'Pharmacy' },
    { path: '/offers', label: 'Offers' },
    { path: '/about', label: 'About' },
  ]

  return (
    <>
      <header className={`glass-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="glass-navbar-inner">
          
          {/* Logo */}
          <Link to="/" className="glass-logo">
            <div className="glass-logo-icon">
              <img src="/araifood-logo.png" alt="AraiFood" />
            </div>
            <div className="glass-logo-text">
              <span className="glass-logo-title">ARAIFOOD</span>
              <small className="glass-logo-sub">Good Food, Good Mood</small>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="glass-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`glass-nav-link ${currentPath === link.path ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="glass-nav-actions">
            
            {/* Search */}
            <Link to="/restaurants" className="glass-icon-btn" title="Search">
              <Search size={20} strokeWidth={1.8} />
            </Link>

            {/* Dark Mode Toggle */}
            <button
              className="glass-icon-btn dark-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
            </button>

            {/* Favorites */}
            <Link to="/favorites" className="glass-icon-btn" title="Favorites">
              <Heart size={20} strokeWidth={1.8} />
            </Link>

            {/* Order History */}
            <Link to="/order-history" className="glass-icon-btn" title="Orders">
              <Package size={20} strokeWidth={1.8} />
            </Link>

            {/* Notification */}
            <NotificationPanel />

            {/* Cart */}
            <Link to="/cart" className="glass-cart-btn" title="Cart">
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="glass-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>

            {/* Account */}
            <Link to="/account" className="glass-account-btn">
              <User size={18} strokeWidth={2} />
              <span>Account</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="glass-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
            >
              {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="glass-mobile-overlay" onClick={() => setMenuOpen(false)}>
          <div className="glass-mobile-menu" onClick={(e) => e.stopPropagation()}>
            
            <div className="glass-mobile-header">
              <span className="glass-mobile-title">Menu</span>
              <button className="glass-icon-btn" onClick={() => setMenuOpen(false)}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="glass-mobile-links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`glass-mobile-link ${currentPath === link.path ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="glass-mobile-divider"></div>

              <Link to="/favorites" className="glass-mobile-link" onClick={() => setMenuOpen(false)}>
                My Favorites
              </Link>
              <Link to="/order-history" className="glass-mobile-link" onClick={() => setMenuOpen(false)}>
                My Orders
              </Link>
              <Link to="/account" className="glass-mobile-link" onClick={() => setMenuOpen(false)}>
                My Account
              </Link>
              <Link to="/cart" className="glass-mobile-link" onClick={() => setMenuOpen(false)}>
                My Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar