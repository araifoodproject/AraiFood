// ============================================================
// src/pages/ContactPage.jsx
// Contact Us — form + info
// Bilingual (BN/EN)
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import { toast } from 'react-toastify'
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  User,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

function ContactPage() {
  const { t } = useLanguage()
  const { settings } = useSettings()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const subjects = [
    { value: 'general', label: t('contact.subjectGeneral') },
    { value: 'order', label: t('contact.subjectOrder') },
    { value: 'refund', label: t('contact.subjectRefund') },
    { value: 'partner', label: t('contact.subjectPartner') },
    { value: 'technical', label: t('contact.subjectTechnical') },
    { value: 'feedback', label: t('contact.subjectFeedback') },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t('contact.toastFillRequired'))
      return
    }

    setSending(true)

    // Simulate sending — in real app you'd send to Firebase or email service
    setTimeout(() => {
      toast.success(t('contact.toastSuccess'))
      setName('')
      setEmail('')
      setPhone('')
      setSubject('general')
      setMessage('')
      setSending(false)
    }, 1500)
  }

  const contactInfo = [
    {
      icon: Mail,
      color: '#3B82F6',
      label: t('contact.labelEmail'),
      value: settings.contactEmail || t('contact.defaultEmail'),
      href: `mailto:${settings.contactEmail || t('contact.defaultEmail')}`,
    },
    {
      icon: Phone,
      color: '#10B981',
      label: t('contact.labelPhone'),
      value: settings.contactPhone || t('contact.defaultPhone'),
      href: `tel:${(
        settings.contactPhone || t('contact.defaultPhone')
      ).replace(/\s/g, '')}`,
    },
    {
      icon: MapPin,
      color: '#F59E0B',
      label: t('contact.labelAddress'),
      value: settings.address || t('contact.defaultAddress'),
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        settings.address || t('contact.defaultAddress')
      )}`,
    },
    {
      icon: Clock,
      color: '#8B5CF6',
      label: t('contact.labelHours'),
      value: `${settings.openingTime || t('contact.defaultOpening')} - ${
        settings.closingTime || t('contact.defaultClosing')
      } ${t('contact.hoursSuffix')}`,
      href: null,
    },
  ]

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label={t('contact.back')} fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">{t('contact.badge')}</span>
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* LEFT — Contact Info */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div className="account-card">
              <div className="account-section-title">
                <div className="account-section-icon">📞</div>
                <div>
                  <h3>{t('contact.infoTitle')}</h3>
                  <p>{t('contact.infoSubtitle')}</p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {contactInfo.map((info, idx) => {
                  const Icon = info.icon
                  const content = (
                    <>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: `${info.color}18`,
                          color: info.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} strokeWidth={2.4} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: 'var(--text-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '2px',
                          }}
                        >
                          {info.label}
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {info.value}
                        </strong>
                      </div>
                    </>
                  )

                  if (info.href) {
                    return (
                      <a
                        key={idx}
                        href={info.href}
                        target={
                          info.href.startsWith('http')
                            ? '_blank'
                            : undefined
                        }
                        rel="noreferrer"
                        style={{
                          padding: '12px',
                          borderRadius: '14px',
                          background: 'var(--surface-soft)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        {content}
                      </a>
                    )
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: 'var(--surface-soft)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {content}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Live Chat CTA */}
            <div
              className="account-card"
              style={{
                background:
                  'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.04))',
                border: '1px solid rgba(5,150,105,0.2)',
                textAlign: 'center',
                padding: '24px',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {t('contact.chatTitle')}
              </h3>
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                {t('contact.chatSubtitle')}
              </p>
              <button
                onClick={() => {
                  const chatBtn = document.querySelector(
                    '.live-chat-button, [class*="chat"] button, .lc-toggle'
                  )
                  if (chatBtn) chatBtn.click()
                  else toast.info(t('contact.chatNotFound'))
                }}
                style={{
                  padding: '12px 22px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'inherit',
                }}
              >
                <MessageCircle size={16} strokeWidth={2.4} />
                {t('contact.chatBtn')}
              </button>
            </div>
          </div>

          {/* RIGHT — Contact Form */}
          <div className="account-card">
            <div className="account-section-title">
              <div className="account-section-icon">✉️</div>
              <div>
                <h3>{t('contact.formTitle')}</h3>
                <p>{t('contact.formSubtitle')}</p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={labelStyle}>
                    <User size={12} /> {t('contact.nameLabel')}{' '}
                    {t('contact.requiredStar')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('contact.namePlaceholder')}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Mail size={12} /> {t('contact.emailLabel')}{' '}
                    {t('contact.requiredStar')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('contact.emailPlaceholder')}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={labelStyle}>
                    <Phone size={12} /> {t('contact.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('contact.phonePlaceholder')}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t('contact.subjectLabel')}</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={inputStyle}
                  >
                    {subjects.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t('contact.messageLabel')}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('contact.messagePlaceholder')}
                  rows={6}
                  required
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: '140px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: '16px',
                  borderRadius: '999px',
                  background: sending
                    ? 'var(--surface-soft)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  color: sending ? 'var(--text-tertiary)' : '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  boxShadow: sending
                    ? 'none'
                    : '0 6px 20px rgba(5,150,105,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontFamily: 'inherit',
                }}
              >
                {sending ? (
                  <>
                    <Loader2
                      size={18}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    {t('contact.sendingBtn')}
                  </>
                ) : (
                  <>
                    <Send size={18} strokeWidth={2.5} />
                    {t('contact.sendBtn')}
                  </>
                )}
              </button>

              <p
                style={{
                  margin: 0,
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                {t('contact.secureNote')}
              </p>
            </form>
          </div>
        </div>

        {/* Related Pages */}
        <div
          style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <Link
            to="/help"
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '28px' }}>❓</span>
            <div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                {t('contact.relatedHelpTitle')}
              </strong>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                {t('contact.relatedHelpDesc')}
              </span>
            </div>
          </Link>

          <Link
            to="/terms"
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '28px' }}>📋</span>
            <div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                {t('contact.relatedTermsTitle')}
              </strong>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                {t('contact.relatedTermsDesc')}
              </span>
            </div>
          </Link>

          <Link
            to="/about"
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '28px' }}>ℹ️</span>
            <div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                {t('contact.relatedAboutTitle')}
              </strong>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                {t('contact.relatedAboutDesc')}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12.5px',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
}

const inputStyle = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: '12px',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-soft)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
}

export default ContactPage