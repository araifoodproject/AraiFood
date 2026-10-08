// ============================================================
// src/pages/TermsPage.jsx
// Terms & Privacy Policy
// Bilingual (BN/EN)
// ============================================================

import { Link } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import {
  Shield,
  FileText,
  Lock,
  UserCheck,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const SECTIONS_META = [
  { icon: FileText, color: '#3B82F6', titleKey: 'terms.s1.title', bodyKey: 'terms.s1.body' },
  { icon: UserCheck, color: '#10B981', titleKey: 'terms.s2.title', bodyKey: 'terms.s2.body' },
  { icon: CreditCard, color: '#F59E0B', titleKey: 'terms.s3.title', bodyKey: 'terms.s3.body' },
  { icon: AlertTriangle, color: '#DC2626', titleKey: 'terms.s4.title', bodyKey: 'terms.s4.body' },
  { icon: Lock, color: '#8B5CF6', titleKey: 'terms.s5.title', bodyKey: 'terms.s5.body' },
  { icon: Shield, color: '#EC4899', titleKey: 'terms.s6.title', bodyKey: 'terms.s6.body' },
  { icon: FileText, color: '#06B6D4', titleKey: 'terms.s7.title', bodyKey: 'terms.s7.body' },
  { icon: AlertTriangle, color: '#F97316', titleKey: 'terms.s8.title', bodyKey: 'terms.s8.body' },
  { icon: UserCheck, color: '#059669', titleKey: 'terms.s9.title', bodyKey: 'terms.s9.body' },
  { icon: FileText, color: '#6B7280', titleKey: 'terms.s10.title', bodyKey: 'terms.s10.body' },
]

function TermsPage() {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const siteName = settings.siteName || 'AraiFood'

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label={t('terms.back')} fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">{t('terms.badge')}</span>
          <h1>{t('terms.title')}</h1>
          <p>
            {t('terms.subtitle').replace('{siteName}', siteName)}
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
            📅 {t('terms.lastUpdated')}{' '}
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Table of Contents */}
        <div
          className="account-card"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02))',
            border: '1px solid rgba(59,130,246,0.2)',
            marginBottom: '24px',
          }}
        >
          <div className="account-section-title">
            <div className="account-section-icon">📑</div>
            <div>
              <h3>{t('terms.tocTitle')}</h3>
              <p>{t('terms.tocSubtitle')}</p>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
            }}
          >
            {SECTIONS_META.map((s, idx) => (
              <a
                key={idx}
                href={`#section-${idx}`}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ color: s.color, fontWeight: 900 }}>
                  {idx + 1}
                </span>
                {t(s.titleKey).replace(/^\d+\.\s/, '')}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {SECTIONS_META.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={idx}
                id={`section-${idx}`}
                className="account-card"
                style={{ scrollMarginTop: '100px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `${s.color}18`,
                      color: s.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} strokeWidth={2.4} />
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-heading)',
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      paddingTop: '8px',
                    }}
                  >
                    {t(s.titleKey)}
                  </h2>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    fontWeight: 500,
                    paddingLeft: '58px',
                  }}
                >
                  {t(s.bodyKey)}
                </p>
              </div>
            )
          })}
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
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {t('terms.ctaTitle')}
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {t('terms.ctaSubtitle')}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/contact"
              style={{
                padding: '14px 28px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
              }}
            >
              {t('terms.ctaContact')}
            </Link>
            <Link
              to="/help"
              style={{
                padding: '14px 28px',
                borderRadius: '999px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 800,
                textDecoration: 'none',
                border: '1px solid var(--border-strong)',
              }}
            >
              {t('terms.ctaHelp')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage