// ============================================================
// src/components/Footer.jsx
// V5 — Legal links dynamic from settings/legal
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

const TEXT_ROUTE_MAP = {
  'about': '/about',
  'about us': '/about',
  'our story': '/about',
  'careers': '/careers',
  'career': '/careers',
  'jobs': '/careers',
  'help': '/help',
  'help center': '/help',
  'support': '/help',
  'faqs': '/help',
  'faq': '/help',
  'contact': '/contact',
  'contact us': '/contact',
  'refund': '/legal?type=refund',
  'refund policy': '/legal?type=refund',
  'privacy': '/legal?type=privacy',
  'privacy policy': '/legal?type=privacy',
  'terms': '/legal?type=terms',
  'terms & conditions': '/legal?type=terms',
  'terms and conditions': '/legal?type=terms',
}

function resolvePath(text, url) {
  if (url && url !== '#' && url.startsWith('/')) {
    return { href: url, external: false }
  }
  if (url && /^https?:\/\//i.test(url)) {
    return { href: url, external: true }
  }
  const key = (text || '').toLowerCase().trim()
  if (TEXT_ROUTE_MAP[key]) {
    return { href: TEXT_ROUTE_MAP[key], external: false }
  }
  for (const [k, v] of Object.entries(TEXT_ROUTE_MAP)) {
    if (key.includes(k) || k.includes(key)) {
      return { href: v, external: false }
    }
  }
  return { href: '/help', external: false }
}

function Footer() {
  const { settings } = useSettings()
  const [user, setUser] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [legal, setLegal] = useState(null)
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

  // ✅ Load legal settings from Firestore
  useEffect(() => {
    const loadLegal = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'legal'))
        if (snap.exists()) {
          setLegal(snap.data())
        }
      } catch (e) {
        console.error('Legal settings load error:', e)
      }
    }
    loadLegal()
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
    const { href, external } = resolvePath(item.text, item.url)

    if (external) {
      return (
        <a key={idx} href={href} target="_blank" rel="noreferrer">
          {item.text}
        </a>
      )
    }
    return (
      <Link key={idx} to={href}>
        {item.text}
      </Link>
    )
  }

  // ✅ Legal links from settings
  const legalLinks = []
  if (legal?.refundTitle?.trim()) {
    legalLinks.push({
      label: legal.refundTitle.trim(),
      href: '/legal?type=refund',
    })
  }
  if (legal?.privacyTitle?.trim()) {
    legalLinks.push({
      label: legal.privacyTitle.trim(),
      href: '/legal?type=privacy',
    })
  }
  if (legal?.termsTitle?.trim()) {
    legalLinks.push({
      label: legal.termsTitle.trim(),
      href: '/legal?type=terms',
    })
  }

  // Fallback যদি legal doc না থাকে (default English labels)
  const finalLegalLinks =
    legalLinks.length > 0
      ? legalLinks
      : [
          { label: 'Refund Policy', href: '/legal?type=refund' },
          { label: 'Privacy Policy', href: '/legal?type=privacy' },
          { label: 'Terms & Conditions', href: '/legal?type=terms' },
        ]

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
          {companyLinks.length > 0 ? (
            companyLinks.map(renderLink)
          ) : (
            <>
              <Link to="/about">About Us</Link>
              <Link to="/careers">Careers</Link>
            </>
          )}
        </div>

        {/* Support Column */}
        <div className="aa-footer-col">
          <h4>Support</h4>
          {supportLinks.length > 0 ? (
            supportLinks.map(renderLink)
          ) : (
            <>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact Us</Link>
            </>
          )}
        </div>

        {/* ✅ Legal Column — Dynamic from settings */}
        {finalLegalLinks.length > 0 && (
          <div className="aa-footer-col">
            <h4>Legal</h4>
            {finalLegalLinks.map((l, idx) => (
              <Link key={idx} to={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        )}

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

            <Link to="/help" className="aa-help-btn">
              <Headphones size={14} strokeWidth={2.4} />
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="aa-footer-bottom">
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

        <div className="aa-footer-apps">
          <span>{appsLabel}</span>

          {hasAppStore ? (
            <a href={settings.appStoreUrl} target="_blank" rel="noreferrer">
              App Store
            </a>
          ) : (
            <span style={comingSoonStyle}>App Store · Coming Soon</span>
          )}

          <span>•</span>

          {hasPlayStore ? (
            <a href={settings.playStoreUrl} target="_blank" rel="noreferrer">
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