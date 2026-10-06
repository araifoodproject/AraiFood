// ============================================================
// src/pages/LegalPage.jsx
// Dynamic legal pages — Refund / Privacy / Terms
// URL: /legal?type=refund | privacy | terms
// ============================================================

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import PageBackButton from '../components/PageBackButton'
import {
  Scale,
  FileText,
  Shield,
  RefreshCw,
  Lock,
  AlertCircle,
} from 'lucide-react'

// Mapping for URL type → Firestore field + icon + fallback label
const TYPE_CONFIG = {
  refund: {
    titleField: 'refundTitle',
    contentField: 'refundContent',
    fallbackTitle: 'Refund Policy',
    icon: RefreshCw,
    color: '#10B981',
    emoji: '💰',
  },
  privacy: {
    titleField: 'privacyTitle',
    contentField: 'privacyContent',
    fallbackTitle: 'Privacy Policy',
    icon: Lock,
    color: '#3B82F6',
    emoji: '🔒',
  },
  terms: {
    titleField: 'termsTitle',
    contentField: 'termsContent',
    fallbackTitle: 'Terms & Conditions',
    icon: FileText,
    color: '#F59E0B',
    emoji: '📋',
  },
}

function LegalPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = (searchParams.get('type') || 'refund').toLowerCase()

  const [loading, setLoading] = useState(true)
  const [pageData, setPageData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const config = TYPE_CONFIG[type]

  useEffect(() => {
    // Invalid type
    if (!config) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'legal'))
        if (snap.exists()) {
          const data = snap.data()
          const title = data[config.titleField]?.trim() || config.fallbackTitle
          const content = data[config.contentField] || ''

          setPageData({ title, content })
        } else {
          setPageData({
            title: config.fallbackTitle,
            content: '',
          })
        }
      } catch (err) {
        console.error('Legal page load error:', err)
        setPageData({
          title: config.fallbackTitle,
          content: '',
        })
      }
      setLoading(false)
    }

    load()
  }, [type, config])

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="restaurants-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // ============ NOT FOUND ============
  if (notFound || !config) {
    return (
      <div className="restaurants-page">
        <div className="restaurants-page-container">
          <PageBackButton label="Back" fallback="/" />
          <div className="account-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Page not found
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
              }}
            >
              এই legal page টা পাওয়া যায়নি।
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const Icon = config.icon

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">LEGAL</span>
          <h1>
            {config.emoji} {pageData?.title || config.fallbackTitle}
          </h1>
          <p>
            Please read carefully. এই page এর সব কিছু Admin Panel থেকে
            control করা হয়।
          </p>
          <div
            style={{
              marginTop: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'var(--surface-soft)',
              border: '1px solid var(--border)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--text-tertiary)',
            }}
          >
            📅 Last updated: {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Content Card */}
        <div
          className="account-card"
          style={{
            padding: '32px 28px',
          }}
        >
          {pageData?.content?.trim() ? (
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: 1.8,
                color: 'var(--text-primary)',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {pageData.content}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                📝
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                Content এখনো যোগ করা হয়নি
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                  lineHeight: 1.6,
                }}
              >
                Admin Panel → Settings → Legal Pages এ এই page এর content
                যোগ করুন।
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  fontStyle: 'italic',
                }}
              >
                Admin can edit this at: /admin/settings → Legal Pages
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="account-card"
          style={{
            marginTop: '24px',
            background:
              'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.04))',
            border: '1px solid rgba(5,150,105,0.2)',
            textAlign: 'center',
            padding: '32px 24px',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            Questions about this?
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            আমরা সাহায্য করতে প্রস্তুত। যেকোনো প্রশ্নে যোগাযোগ করুন।
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/contact"
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
              }}
            >
              Contact Us →
            </a>
            <a
              href="/help"
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                fontWeight: 800,
                textDecoration: 'none',
                border: '1px solid var(--border-strong)',
              }}
            >
              Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LegalPage