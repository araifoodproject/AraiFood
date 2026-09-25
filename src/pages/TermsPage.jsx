// ============================================================
// src/pages/TermsPage.jsx
// Terms & Privacy Policy
// ============================================================

import { Link } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import { Shield, FileText, Lock, UserCheck, CreditCard, AlertTriangle } from 'lucide-react'

const SECTIONS = [
  {
    icon: FileText,
    color: '#3B82F6',
    title: '1. Acceptance of Terms',
    body: 'By accessing or using AraiFood, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all users including customers, restaurants, riders, and pharmacies.',
  },
  {
    icon: UserCheck,
    color: '#10B981',
    title: '2. User Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must provide accurate and complete information when creating an account.',
  },
  {
    icon: CreditCard,
    color: '#F59E0B',
    title: '3. Orders & Payments',
    body: 'All orders are subject to acceptance by the restaurant. Prices are displayed in Bangladeshi Taka (৳). We accept Cash on Delivery, Mobile Banking (bKash/Nagad), and AraiWallet payments. Refunds are processed within 3-5 business days.',
  },
  {
    icon: AlertTriangle,
    color: '#DC2626',
    title: '4. Cancellation & Refunds',
    body: 'Orders can be cancelled for free before restaurant acceptance. Once accepted, cancellations may be subject to fees. Refunds for cancelled orders are processed automatically. If you receive incorrect or damaged items, contact support within 24 hours.',
  },
  {
    icon: Lock,
    color: '#8B5CF6',
    title: '5. Privacy & Data',
    body: 'We collect minimal personal data necessary to provide our service: name, phone, delivery address, and order history. We never sell your personal information to third parties. Your data is encrypted and stored securely on Firebase servers.',
  },
  {
    icon: Shield,
    color: '#EC4899',
    title: '6. Delivery Policy',
    body: 'Delivery times are estimates and may vary based on weather, traffic, and demand. We partner with independent riders who are not our employees. Delivery fees are calculated based on your zone and displayed at checkout.',
  },
  {
    icon: FileText,
    color: '#06B6D4',
    title: '7. Restaurant & Partner Terms',
    body: 'Restaurants are independent businesses. AraiFood acts as a platform connecting customers with restaurants and riders. We charge a commission on orders as agreed during onboarding. Partners must maintain required licenses and hygiene standards.',
  },
  {
    icon: AlertTriangle,
    color: '#F97316',
    title: '8. Limitation of Liability',
    body: 'AraiFood is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our maximum liability is limited to the amount you paid for the specific order in question.',
  },
  {
    icon: UserCheck,
    color: '#059669',
    title: '9. Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use of AraiFood after changes constitutes acceptance of new terms. We will notify users of significant changes via email or in-app notification.',
  },
  {
    icon: FileText,
    color: '#6B7280',
    title: '10. Contact Information',
    body: 'For questions about these Terms, contact us at hello@araifood.com or through the Contact page. Our legal team will respond within 3 business days.',
  },
]

function TermsPage() {
  const { settings } = useSettings()
  const siteName = settings.siteName || 'AraiFood'

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        {/* Header */}
        <div className="restaurants-page-header">
          <span className="glass-section-label">
            LEGAL
          </span>
          <h1>Terms & Privacy Policy 📋</h1>
          <p>
            Please read these terms carefully before using {siteName}. They
            explain your rights and responsibilities.
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
              <h3>Quick Navigation</h3>
              <p>Jump to any section</p>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
            }}
          >
            {SECTIONS.map((s, idx) => (
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
                {s.title.replace(/^\d+\.\s/, '')}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {SECTIONS.map((s, idx) => {
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
                    {s.title}
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
                  {s.body}
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
            Questions about our terms?
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            We're happy to clarify anything. Reach out to our team anytime.
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
              Contact Us →
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
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage