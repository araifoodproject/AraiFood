// ============================================================
// src/components/Footer.jsx
// FULLY REAL-TIME — footer content from settings.footer + socials
// Apps row auto-detects: URL present → link, else → Coming Soon
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useSettings from '../hooks/useSettings'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from 'react-icons/fa'
import { Moon, Sun, Headphones } from 'lucide-react'

function Footer() {
  const { settings } = useSettings()
  const [user, setUser] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Load user + wallet balance
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            setWalletBalance(userDoc.data().walletBalance || 0)
          }
        } catch (e) {
          console.error('Wallet load error:', e)
        }
      } else {
        setWalletBalance(0)
      }
    })
    return () => unsub()
  }, [])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const formatBalance = (num) =>
    Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  const footer = settings.footer || {}
  const companyLinks = footer.companyLinks || []
  const supportLinks = footer.supportLinks || []

  // ------------------------------------------------------------
  // Apps row auto-detect
  // ------------------------------------------------------------
  const hasAppStore = Boolean(settings.appStoreUrl?.trim())
  const hasPlayStore = Boolean(settings.playStoreUrl?.trim())
  const anyAppAvailable = hasAppStore || hasPlayStore
  const appsLabel = anyAppAvailable
    ? footer.appsLabel || 'Available on'
    : 'Coming Soon on'

  const comingSoonStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-tertiary, #94a3b8)',
    cursor: 'default',
    opacity: 0.85,
    fontStyle: 'italic',
  }

  const renderLink = (item, idx) => {
    if (!item?.text) return null
    const isExternal =
      item.isExternal || (item.url && /^https?:\/\//i.test(item.url))
    if (isExternal) {
      return (
        <a
          key={idx}
          href={item.url || '#'}
          target="_blank"
          rel="noreferrer"
        >
          {item.text}
        </a>
      )
    }
    return (
      <Link key={idx} to={item.url || '#'}>
        {item.text}
      </Link>
    )
  }

  return (
    <footer className="aa-footer">
      <div className="aa-footer-grid">
        {/* Brand Column */}
        <div className="aa-footer-brand">
          <Link to="/" className="aa-footer-brand-logo">
            <img
              src="/araifood-logo.png"
              alt={settings.siteName || 'AraiFood'}
            />
            <span className="aa-footer-brand-title">
              Arai<span style={{ color: '#F97316' }}>Food</span>
            </span>
          </Link>

          <p className="aa-footer-brand-desc">{footer.tagline}</p>

          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
              margin: '12px 0 0',
            }}
          >
            © {new Date().getFullYear()} {footer.companyName}. All rights
            reserved.
          </p>
        </div>

        {/* Company Column */}
        <div className="aa-footer-col">
          <h4>Company</h4>
          {companyLinks.map(renderLink)}
        </div>

        {/* Support Column */}
        <div className="aa-footer-col">
          <h4>Support</h4>
          {supportLinks.map(renderLink)}
        </div>

        {/* AraiWallet Column */}
        <div className="aa-footer-col">
          <h4>AraiWallet</h4>

          <div className="aa-wallet-box">
            {user ? (
              <>
                <p className="aa-wallet-balance">
                  Balance: <strong>৳{formatBalance(walletBalance)}</strong>
                </p>

                <Link
                  to="/account"
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#059669',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Recharge →
                </Link>
              </>
            ) : (
              <>
                <p className="aa-wallet-balance">
                  Login to view your <strong>wallet</strong>
                </p>

                <Link
                  to="/login"
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#059669',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Login →
                </Link>
              </>
            )}

            {/* Dark Mode Toggle */}
            <div className="aa-dark-toggle-row">
              <span>
                {darkMode ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Moon size={14} /> Dark Mode
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sun size={14} /> Light / Dark
                  </span>
                )}
              </span>
              <button
                onClick={toggleDarkMode}
                className={`aa-toggle-switch ${darkMode ? 'on' : ''}`}
                title="Toggle theme"
              />
            </div>

            {/* Help Button */}
            <a href="#" className="aa-help-btn">
              <Headphones size={14} strokeWidth={2.4} />
              Help
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="aa-footer-bottom">
        {/* Social Icons */}
        <div className="aa-footer-social">
          <a
            href={settings.facebookUrl || '#'}
            target={settings.facebookUrl ? '_blank' : undefined}
            rel="noreferrer"
            title="Facebook"
          >
            <FaFacebookF size={16} />
          </a>
          <a
            href={settings.instagramUrl || '#'}
            target={settings.instagramUrl ? '_blank' : undefined}
            rel="noreferrer"
            title="Instagram"
          >
            <FaInstagram size={16} />
          </a>
          <a
            href={settings.twitterUrl || '#'}
            target={settings.twitterUrl ? '_blank' : undefined}
            rel="noreferrer"
            title="Twitter"
          >
            <FaTwitter size={16} />
          </a>
          <a
            href={settings.linkedinUrl || '#'}
            target={settings.linkedinUrl ? '_blank' : undefined}
            rel="noreferrer"
            title="LinkedIn"
          >
            <FaLinkedinIn size={16} />
          </a>
        </div>

        {/* Apps Row — Coming Soon auto-detect */}
        <div className="aa-footer-apps">
          <span>{appsLabel}</span>

          {hasAppStore ? (
            <a
              href={settings.appStoreUrl}
              target="_blank"
              rel="noreferrer"
            >
              App Store
            </a>
          ) : (
            <span style={comingSoonStyle}>App Store · Coming Soon</span>
          )}

          <span>•</span>

          {hasPlayStore ? (
            <a
              href={settings.playStoreUrl}
              target="_blank"
              rel="noreferrer"
            >
              Google Play
            </a>
          ) : (
            <span style={comingSoonStyle}>
              Google Play · Coming Soon
            </span>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer