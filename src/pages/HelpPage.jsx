// ============================================================
// src/pages/HelpPage.jsx
// Help Center — FAQ + Contact + Live Chat
// Bilingual (BN/EN)
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import {
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Truck,
  ShoppingBag,
  Wallet,
  User,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const FAQS_META = [
  { icon: ShoppingBag, color: '#3B82F6', qKey: 'help.faq1.q', aKey: 'help.faq1.a' },
  { icon: Truck, color: '#10B981', qKey: 'help.faq2.q', aKey: 'help.faq2.a' },
  { icon: Wallet, color: '#F59E0B', qKey: 'help.faq3.q', aKey: 'help.faq3.a' },
  { icon: User, color: '#8B5CF6', qKey: 'help.faq4.q', aKey: 'help.faq4.a' },
  { icon: Shield, color: '#DC2626', qKey: 'help.faq5.q', aKey: 'help.faq5.a' },
  { icon: Truck, color: '#EC4899', qKey: 'help.faq6.q', aKey: 'help.faq6.a' },
  { icon: HelpCircle, color: '#06B6D4', qKey: 'help.faq7.q', aKey: 'help.faq7.a' },
  { icon: Wallet, color: '#059669', qKey: 'help.faq8.q', aKey: 'help.faq8.a' },
]

function HelpPage() {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label={t('help.back')} fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">{t('help.badge')}</span>
          <h1>{t('help.title')}</h1>
          <p>{t('help.subtitle')}</p>
        </div>

        {/* Quick Contact Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '32px',
          }}
        >
          <ContactCard
            icon={<MessageCircle size={22} color="#fff" strokeWidth={2.4} />}
            title={t('help.chatCardTitle')}
            subtitle={t('help.chatCardSubtitle')}
            action={t('help.chatCardAction')}
            onClick={() => {
              const chatBtn = document.querySelector(
                '.live-chat-button, [class*="chat"] button, .lc-toggle'
              )
              if (chatBtn) chatBtn.click()
              else alert(t('help.chatCardNotFound'))
            }}
            color="#3B82F6"
          />
          <ContactCard
            icon={<Mail size={22} color="#fff" strokeWidth={2.4} />}
            title={t('help.emailCardTitle')}
            subtitle={settings.contactEmail || t('contact.defaultEmail')}
            action={t('help.emailCardAction')}
            href={`mailto:${settings.contactEmail || t('contact.defaultEmail')}`}
            color="#10B981"
          />
          <ContactCard
            icon={<Phone size={22} color="#fff" strokeWidth={2.4} />}
            title={t('help.phoneCardTitle')}
            subtitle={settings.contactPhone || t('contact.defaultPhone')}
            action={t('help.phoneCardAction')}
            href={`tel:${(
              settings.contactPhone || t('contact.defaultPhone')
            ).replace(/\s/g, '')}`}
            color="#F59E0B"
          />
          <ContactCard
            icon={<MapPin size={22} color="#fff" strokeWidth={2.4} />}
            title={t('help.visitCardTitle')}
            subtitle={settings.address || t('contact.defaultAddress')}
            action={t('help.visitCardAction')}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              settings.address || t('contact.defaultAddress')
            )}`}
            color="#EC4899"
          />
        </div>

        {/* FAQ Section */}
        <div className="account-card" style={{ marginBottom: '24px' }}>
          <div className="account-section-title">
            <div className="account-section-icon">❓</div>
            <div>
              <h3>{t('help.faqTitle')}</h3>
              <p>
                {t('help.faqCount').replace('{n}', FAQS_META.length)}
              </p>
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {FAQS_META.map((faq, idx) => {
              const Icon = faq.icon
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: '14px',
                    border: isOpen
                      ? '1px solid rgba(5,150,105,0.3)'
                      : '1px solid var(--border)',
                    background: isOpen
                      ? 'rgba(5,150,105,0.04)'
                      : 'var(--surface-soft)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: `${faq.color}18`,
                        color: faq.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} strokeWidth={2.4} />
                    </div>
                    <strong
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {t(faq.qKey)}
                    </strong>
                    <ChevronDown
                      size={18}
                      strokeWidth={2.4}
                      color="var(--text-tertiary)"
                      style={{
                        transform: isOpen
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 18px 18px 70px',
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        fontWeight: 500,
                      }}
                    >
                      {t(faq.aKey)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Still Need Help CTA */}
        <div
          className="account-card"
          style={{
            background:
              'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(59,130,246,0.05))',
            border: '1px solid rgba(5,150,105,0.2)',
            textAlign: 'center',
            padding: '36px 24px',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>💬</div>
          <h2
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {t('help.ctaTitle')}
          </h2>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {t('help.ctaSubtitle')}
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Mail size={16} />
              {t('help.ctaContact')}
            </Link>
            <Link
              to="/"
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
              {t('help.ctaBackHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENT
// ============================================================
function ContactCard({ icon, title, subtitle, action, onClick, href, color }) {
  const inner = (
    <>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${color}40`,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <strong
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}
        >
          {title}
        </strong>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            fontWeight: 600,
            wordBreak: 'break-word',
          }}
        >
          {subtitle}
        </span>
      </div>
      <span
        style={{
          fontSize: '11.5px',
          fontWeight: 800,
          color: color,
          padding: '6px 12px',
          borderRadius: '999px',
          background: `${color}18`,
          flexShrink: 0,
        }}
      >
        {action} →
      </span>
    </>
  )

  const baseStyle = {
    padding: '18px',
    borderRadius: '18px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        style={baseStyle}
      >
        {inner}
      </a>
    )
  }

  return (
    <button onClick={onClick} style={{ ...baseStyle, fontFamily: 'inherit' }}>
      {inner}
    </button>
  )
}

export default HelpPage