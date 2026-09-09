import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import NotificationPanel from './NotificationPanel'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const location = useLocation()

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Cart Count আপডেট করার ফাংশন
  const updateCartCount = () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(totalItems)
  }

  // Cart Count লোড এবং ইভেন্ট শোনা
  useEffect(() => {
    updateCartCount()
    window.addEventListener('cartUpdated', updateCartCount)
    window.addEventListener('storage', updateCartCount)
    updateCartCount()

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount)
      window.removeEventListener('storage', updateCartCount)
    }
  }, [location.pathname])

  return (
    <header className="arai-navbar">
      <div className="arai-navbar-inner">

        {/* Logo */}
        <Link to="/" className="arai-logo">
          <div className="arai-logo-icon">
            <span className="logo-ring"></span>
            <span className="logo-main">👨‍🍳</span>
          </div>
          <div className="arai-logo-text">
            <span className="logo-title">ARAIFOOD</span>
            <small className="logo-subtitle">Good Food, Good Mood</small>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="arai-nav-links">
          <Link to="/" className="active">Home</Link>
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/pharmacy">Pharmacy</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/about">About Us</Link>
        </nav>

        {/* Right Side - সব button আছে */}
        <div className="arai-nav-actions">
          <Link to="/restaurants" className="arai-nav-icon" title="Search">🔍</Link>
          <Link to="/favorites" className="arai-nav-icon" title="Favorites">❤️</Link>
          <Link to="/order-history" className="arai-nav-icon" title="Order History">📦</Link>
          <Link to="/cart" className="arai-cart-button" title="Cart">
            🛒
            <span className="arai-cart-badge">{cartCount}</span>
          </Link>
          <NotificationPanel />
          <Link to="/account" className="arai-account-button">
            <span className="arai-account-icon">👤</span>
            <span className="arai-account-text">Account</span>
          </Link>
          <button className="arai-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="arai-mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
          <Link to="/restaurants" onClick={() => setMenuOpen(false)}>🍽️ Restaurants</Link>
          <Link to="/pharmacy" onClick={() => setMenuOpen(false)}>💊 Pharmacy</Link>
          <Link to="/offers" onClick={() => setMenuOpen(false)}>🎁 Offers</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>ℹ️ About Us</Link>
          <Link to="/favorites" onClick={() => setMenuOpen(false)}>❤️ My Favorites</Link>
          <Link to="/order-history" onClick={() => setMenuOpen(false)}>📦 My Orders</Link>
          <Link to="/account" onClick={() => setMenuOpen(false)}>👤 My Account</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>🛒 My Cart</Link>
        </div>
      )}
    </header>
  )
}

export default Navbar