// ============================================================
// src/pages/HelpPage.jsx
// Help Center — FAQ + Contact + Live Chat
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

const FAQS = [
  {
    icon: ShoppingBag,
    color: '#3B82F6',
    q: 'How do I place an order?',
    a: 'Browse restaurants from the home page, add items to your cart, and click "Checkout". Fill in your delivery details, select your area on the map, and confirm. Your order will be sent to the restaurant immediately.',
  },
  {
    icon: Truck,
    color: '#10B981',
    q: 'How long does delivery take?',
    a: 'Most orders are delivered within 30-45 minutes depending on your location and restaurant preparation time. You can track your order live from the "My Orders" section.',
  },
  {
    icon: Wallet,
    color: '#F59E0B',
    q: 'How do I add money to my AraiWallet?',
    a: 'Go to your Account page → AraiWallet section → click "Add Money". Send money to our bKash/Nagad number and submit the transaction ID. Admin will verify within 5 minutes.',
  },
  {
    icon: User,
    color: '#8B5CF6',
    q: 'How do I reset my password?',
    a: 'On the login page, click "Forgot Password" and enter your email. You will receive a reset link within a few minutes. Check your spam folder if you don\'t see it.',
  },
  {
    icon: Shield,
    color: '#DC2626',
    q: 'Is my payment information secure?',
    a: 'Yes. We use industry-standard encryption. We never store your card details on our servers. Cash on Delivery, Mobile Banking, and AraiWallet are all secure options.',
  },
  {
    icon: Truck,
    color: '#EC4899',
    q: 'Can I cancel my order?',
    a: 'You can cancel your order for free if the restaurant hasn\'t accepted it yet. Once accepted, contact the restaurant directly via the order details page.',
  },
  {
    icon: HelpCircle,
    color: '#06B6D4',
    q: 'How do I become a partner?',
    a: 'We welcome restaurants, riders, and pharmacies. Visit the signup pages from the footer or click "Partner with us" on the home page.',
  },
  {
    icon: Wallet,
    color: '#059669',
    q: 'What if I have a problem with my order?',
    a: 'Contact the restaurant directly or reach out to our support team via Live Chat (bottom right corner). We typically respond within 5 minutes.',
  },
]

function HelpPage() {
  const { settings } = useSettings()
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">
            HELP CENTER
          </span>
          <h1>How can we help you? 👋</h1>
          <p>
            Find quick answers to common questions. Still need help? Our
            support team is just a click away.
          </p>
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
            title="Live Chat"
            subtitle="Instant support"
            action="Chat Now"
            onClick={() => {
              const chatBtn = document.querySelector(
                '.live-chat-button, [class*="chat"] button, .lc-toggle'
              )
              if (chatBtn) chatBtn.click()
              else alert('Live Chat button এর জন্য scroll down করুন')
            }}
            color="#3B82F6"
          />
          <ContactCard
            icon={<Mail size={22} color="#fff" strokeWidth={2.4} />}
            title="Email Us"
            subtitle={settings.contactEmail || 'hello@araifood.com'}
            action="Send Email"
            href={`mailto:${settings.contactEmail || 'hello@araifood.com'}`}
            color="#10B981"
          />
          <ContactCard
            icon={<Phone size={22} color="#fff" strokeWidth={2.4} />}
            title="Call Us"
            subtitle={settings.contactPhone || '+880 1700-000000'}
            action="Call Now"
            href={`tel:${(settings.contactPhone || '+8801700000000').replace(
              /\s/g,
              ''
            )}`}
            color="#F59E0B"
          />
          <ContactCard
            icon={<MapPin size={22} color="#fff" strokeWidth={2.4} />}
            title="Visit Us"
            subtitle={settings.address || 'Araihazar, Narayanganj'}
            action="See Map"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              settings.address || 'Araihazar'
            )}`}
            color="#EC4899"
          />
        </div>

        {/* FAQ Section */}
        <div className="account-card" style={{ marginBottom: '24px' }}>
          <div className="account-section-title">
            <div className="account-section-icon">❓</div>
            <div>
              <h3>Frequently Asked Questions</h3>
              <p>{FAQS.length} common questions answered</p>
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {FAQS.map((faq, idx) => {
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
                      {faq.q}
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
                      {faq.a}
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
            Still need help?
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
            Our support team is available 24/7. Reach out and we'll respond
            within minutes.
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
              Contact Us
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
              ← Back to Home
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