// ============================================================
// src/pages/CareersPage.jsx
// No openings currently message
// Bilingual (BN/EN)
// ============================================================

import { Link } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import { Briefcase, Mail, Heart } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function CareersPage() {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const siteName = settings.siteName || 'AraiFood'
  const contactEmail = settings.contactEmail || t('contact.defaultEmail')

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label={t('careers.back')} fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">{t('careers.badge')}</span>
          <h1>{t('careers.title')}</h1>
          <p>{t('careers.subtitle').replace('{siteName}', siteName)}</p>
        </div>

        <div
          className="account-card"
          style={{
            padding: '60px 32px',
            textAlign: 'center',
            background:
              'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.02))',
            border: '1px solid rgba(249,115,22,0.2)',
          }}
        >
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Briefcase size={40} color="#D97706" strokeWidth={2.2} />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            {t('careers.noVacancyTitle')}
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: '480px',
              margin: '0 auto 24px',
              fontWeight: 500,
            }}
          >
            {t('careers.noVacancyDesc')}
          </p>

          <div
            style={{
              display: 'inline-flex',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                t('careers.emailSubject')
              )}`}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Mail size={16} />
              {t('careers.sendCv')}
            </a>
            <Link
              to="/contact"
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                fontWeight: 800,
                textDecoration: 'none',
                border: '1px solid var(--border-strong)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Heart size={16} />
              {t('careers.contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CareersPage