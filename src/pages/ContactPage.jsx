// ============================================================
// src/pages/ContactPage.jsx
// Contact Us — form + info
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

function ContactPage() {
  const { settings } = useSettings()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const subjects = [
    { value: 'general', label: '💬 General Inquiry' },
    { value: 'order', label: '📦 Order Issue' },
    { value: 'refund', label: '💰 Refund Request' },
    { value: 'partner', label: '🤝 Partnership' },
    { value: 'technical', label: '🔧 Technical Support' },
    { value: 'feedback', label: '⭐ Feedback' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSending(true)

    // Simulate sending — in real app you'd send to Firebase or email service
    setTimeout(() => {
      toast.success(
        "✅ Message sent! We'll get back to you within 24 hours."
      )
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
      label: 'Email',
      value: settings.contactEmail || 'hello@araifood.com',
      href: `mailto:${settings.contactEmail || 'hello@araifood.com'}`,
    },
    {
      icon: Phone,
      color: '#10B981',
      label: 'Phone',
      value: settings.contactPhone || '+880 1700-000000',
      href: `tel:${(settings.contactPhone || '+8801700000000').replace(
        /\s/g,
        ''
      )}`,
    },
    {
      icon: MapPin,
      color: '#F59E0B',
      label: 'Address',
      value: settings.address || 'Araihazar, Narayanganj',
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        settings.address || 'Araihazar'
      )}`,
    },
    {
      icon: Clock,
      color: '#8B5CF6',
      label: 'Hours',
      value: `${settings.openingTime || '10:00'} - ${
        settings.closingTime || '22:00'
      } (Daily)`,
      href: null,
    },
  ]

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">CONTACT</span>
          <h1>Get in Touch 📬</h1>
          <p>
            Have a question, feedback, or partnership inquiry? We'd love to
            hear from you.
          </p>
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
                  <h3>Contact Information</h3>
                  <p>Reach us anytime</p>
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
                Need instant help?
              </h3>
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                Chat with our support team live
              </p>
              <button
                onClick={() => {
                  const chatBtn = document.querySelector(
                    '.live-chat-button, [class*="chat"] button, .lc-toggle'
                  )
                  if (chatBtn) chatBtn.click()
                  else toast.info('Live Chat button এর জন্য page scroll করুন')
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
                Open Live Chat
              </button>
            </div>
          </div>

          {/* RIGHT — Contact Form */}
          <div className="account-card">
            <div className="account-section-title">
              <div className="account-section-icon">✉️</div>
              <div>
                <h3>Send Us a Message</h3>
                <p>We typically reply within 24 hours</p>
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
                    <User size={12} /> Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Mail size={12} /> Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                    <Phone size={12} /> Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>📌 Subject</label>
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
                <label style={labelStyle}>💬 Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help..."
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} strokeWidth={2.5} />
                    Send Message
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
                🔒 Your information is secure and will never be shared
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
                Help Center
              </strong>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                FAQs & guides
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
                Terms & Privacy
              </strong>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                Legal info
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
                About Us
              </strong>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                Our story
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