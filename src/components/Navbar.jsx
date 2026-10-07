// ============================================================
// src/components/Navbar.jsx
// V3 — Language Switcher + Bilingual (BN/EN)
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import NotificationPanel from './NotificationPanel'
import LanguageSwitcher from './LanguageSwitcher'
import useSettings from '../hooks/useSettings'
import { useLanguage } from '../i18n/LanguageContext'
import {
  Search,
  ShoppingBag,
  User,
  MapPin,
  ChevronDown,
  X,
  Menu,
} from 'lucide-react'

function Navbar() {
  const { settings } = useSettings()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState(null)
  const [profileImage, setProfileImage] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const updateCartCount = () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(totalItems)
  }

  useEffect(() => {
    let unsub = null
    let mounted = true

    const loadAuth = async () => {
      const { onAuthStateChanged } = await import('firebase/auth')
      const { auth, db } = await import('../firebase')
      const { doc, getDoc } = await import('firebase/firestore')

      unsub = onAuthStateChanged(auth, async (u) => {
        if (!mounted) return
        setUser(u)
        if (u) {
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid))
            if (userDoc.exists() && mounted) {
              setProfileImage(userDoc.data().profileImage || '')
            }
          } catch (e) {
            console.error(e)
          }
        } else {
          if (mounted) setProfileImage('')
        }
      })
    }
    loadAuth()

    return () => {
      mounted = false
      if (unsub) unsub()
    }
  }, [])

  useEffect(() => {
    updateCartCount()
    window.addEventListener('cartUpdated', updateCartCount)
    window.addEventListener('storage', updateCartCount)
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount)
      window.removeEventListener('storage', updateCartCount)
    }
  }, [location.pathname])

  const currentPath = location.pathname

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/order-history', label: t('nav.orders') },
    { path: '/offers', label: t('nav.offers') },
    { path: '/help', label: t('nav.help') },
  ]

  return (
    <>
      <header className="aa-navbar-pill">
        <div className="aa-navbar-pill-inner">
          <Link to="/" className="aa-nav-logo">
            <img
              src="/araifood-logo.png"
              alt={settings.siteName || 'AraiFood'}
            />
            <div className="aa-nav-logo-text">
              <span className="aa-nav-logo-title">
                Arai<span>Food</span>
              </span>
              <small className="aa-nav-logo-sub">
                {settings.tagline || 'Good Food, Good Mood'}
              </small>
            </div>
          </Link>

          <nav className="aa-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`aa-nav-link ${
                  currentPath === link.path ? 'active' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            className="aa-nav-location"
            title={t('nav.location')}
            type="button"
          >
            <MapPin size={14} strokeWidth={2.5} color="#F97316" />
            <span>Araihazar</span>
            <ChevronDown size={14} strokeWidth={2.5} />
          </button>

          <div className="aa-nav-actions">
            {/* Language Switcher — DESKTOP */}
            <div className="aa-nav-lang-desktop">
              <LanguageSwitcher />
            </div>

            <Link
              to="/restaurants"
              className="aa-nav-icon-btn"
              title="Search"
            >
              <Search size={18} strokeWidth={2.2} />
            </Link>

            <div className="aa-nav-notif-wrapper">
              <NotificationPanel />
            </div>

            <Link
              to="/cart"
              className="aa-nav-icon-btn"
              title={t('nav.cart')}
            >
              <ShoppingBag size={18} strokeWidth={2.2} />
              {cartCount > 0 && (
                <span className="aa-nav-cart-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              className="aa-nav-profile-btn"
              title={user ? t('nav.account') : t('nav.login')}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <User size={20} strokeWidth={2.2} />
              )}
            </Link>

            {/* Mobile hamburger — opens mobile menu */}
            <button
              className="aa-nav-mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              title={t('nav.menu')}
              type="button"
              aria-label={t('nav.menu')}
            >
              <Menu size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="glass-mobile-overlay"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="glass-mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-mobile-header">
              <span className="glass-mobile-title">{t('nav.menu')}</span>
              <button
                className="glass-icon-btn"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Language Switcher — MOBILE */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <LanguageSwitcher />
            </div>

            <div className="glass-mobile-links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`glass-mobile-link ${
                    currentPath === link.path ? 'active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="glass-mobile-divider"></div>
              <Link
                to="/favorites"
                className="glass-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {t('nav.favorites')}
              </Link>
              <Link
                to="/gaming"
                className="glass-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {t('nav.gaming')}
              </Link>
              <Link
                to="/account"
                className="glass-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {t('nav.account')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar