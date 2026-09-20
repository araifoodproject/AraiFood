import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Save,
  Globe,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Clock,
  Percent,
  Truck,
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'

const SETTINGS_DOC_ID = 'platform'

function AdminSettingsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Brand
  const [siteName, setSiteName] = useState('AraiFood')
  const [tagline, setTagline] = useState('Good Food, Good Mood')

  // Contact
  const [contactEmail, setContactEmail] = useState('hello@araifood.com')
  const [contactPhone, setContactPhone] = useState('+880 1700-000000')
  const [address, setAddress] = useState('Araihazar, Narayanganj')

  // Fees
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState('30')
  const [minOrderAmount, setMinOrderAmount] = useState('100')
  const [commissionPercent, setCommissionPercent] = useState('10')
  const [riderEarningPerDelivery, setRiderEarningPerDelivery] = useState('30')

  // Hours
  const [openingTime, setOpeningTime] = useState('10:00')
  const [closingTime, setClosingTime] = useState('22:00')

  // Social
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  // Gaming
  const [gamingBkashNumber, setGamingBkashNumber] = useState('01700000000')
  const [gamingNagadNumber, setGamingNagadNumber] = useState('01700000000')

  // Wallet Top-up
  const [walletBkashNumber, setWalletBkashNumber] = useState('01700000000')
  const [walletNagadNumber, setWalletNagadNumber] = useState('01700000000')
  const [walletMinAmount, setWalletMinAmount] = useState('50')
  const [walletMaxAmount, setWalletMaxAmount] = useState('10000')

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID))
        if (snap.exists()) {
          const d = snap.data()
          setSiteName(d.siteName || 'AraiFood')
          setTagline(d.tagline || 'Good Food, Good Mood')
          setContactEmail(d.contactEmail || 'hello@araifood.com')
          setContactPhone(d.contactPhone || '+880 1700-000000')
          setAddress(d.address || 'Araihazar, Narayanganj')
          setDefaultDeliveryFee(String(d.defaultDeliveryFee ?? 30))
          setMinOrderAmount(String(d.minOrderAmount ?? 100))
          setCommissionPercent(String(d.commissionPercent ?? 10))
          setRiderEarningPerDelivery(String(d.riderEarningPerDelivery ?? 30))
          setOpeningTime(d.openingTime || '10:00')
          setClosingTime(d.closingTime || '22:00')
          setFacebookUrl(d.facebookUrl || '')
          setInstagramUrl(d.instagramUrl || '')
          setWhatsappNumber(d.whatsappNumber || '')
          setGamingBkashNumber(d.gamingBkashNumber || '01700000000')
          setGamingNagadNumber(d.gamingNagadNumber || '01700000000')
          setWalletBkashNumber(d.walletBkashNumber || '01700000000')
          setWalletNagadNumber(d.walletNagadNumber || '01700000000')
          setWalletMinAmount(String(d.walletMinAmount ?? 50))
          setWalletMaxAmount(String(d.walletMaxAmount ?? 10000))
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'settings', SETTINGS_DOC_ID),
        {
          siteName: siteName.trim(),
          tagline: tagline.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          address: address.trim(),
          defaultDeliveryFee: parseFloat(defaultDeliveryFee) || 30,
          minOrderAmount: parseFloat(minOrderAmount) || 100,
          commissionPercent: parseFloat(commissionPercent) || 10,
          riderEarningPerDelivery: parseFloat(riderEarningPerDelivery) || 30,
          openingTime,
          closingTime,
          facebookUrl: facebookUrl.trim(),
          instagramUrl: instagramUrl.trim(),
          whatsappNumber: whatsappNumber.trim(),
          gamingBkashNumber: gamingBkashNumber.trim(),
          gamingNagadNumber: gamingNagadNumber.trim(),
          walletBkashNumber: walletBkashNumber.trim(),
          walletNagadNumber: walletNagadNumber.trim(),
          walletMinAmount: parseFloat(walletMinAmount) || 50,
          walletMaxAmount: parseFloat(walletMaxAmount) || 10000,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success('✅ Settings saved!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">Settings</h1>
            <p className="admin-page-sub">
              Configure platform settings, fees, and contact information.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '999px',
              background: saving
                ? 'var(--surface-soft)'
                : 'linear-gradient(135deg, #059669, #047857)',
              color: saving ? 'var(--text-tertiary)' : '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Brand */}
            <Section
              icon={<Globe size={20} />}
              title="Brand Information"
              subtitle="Site name, tagline, and identity"
            >
              <div style={gridTwo}>
                <Field label="Site Name">
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </Section>

            {/* Contact */}
            <Section
              icon={<Phone size={20} />}
              title="Contact Information"
              subtitle="How customers can reach you"
            >
              <div style={gridTwo}>
                <Field label="Contact Email" icon={<Mail size={14} />}>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Contact Phone" icon={<Phone size={14} />}>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="Business Address" icon={<MapPin size={14} />}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </Section>

            {/* Fees */}
            <Section
              icon={<DollarSign size={20} />}
              title="Fees & Commission"
              subtitle="Default charges and platform economics"
            >
              <div style={gridTwo}>
                <Field
                  label="Default Delivery Fee (৳)"
                  icon={<Truck size={14} />}
                >
                  <input
                    type="number"
                    value={defaultDeliveryFee}
                    onChange={(e) => setDefaultDeliveryFee(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Minimum Order Amount (৳)">
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field
                  label="Platform Commission (%)"
                  icon={<Percent size={14} />}
                >
                  <input
                    type="number"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Rider Earning per Delivery (৳)">
                  <input
                    type="number"
                    value={riderEarningPerDelivery}
                    onChange={(e) => setRiderEarningPerDelivery(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </Section>

            {/* Hours */}
            <Section
              icon={<Clock size={20} />}
              title="Platform Operating Hours"
              subtitle="When orders can be placed"
            >
              <div style={gridTwo}>
                <Field label="Opening Time">
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Closing Time">
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </Section>

            {/* Wallet Top-Up */}
            <Section
              icon={<Wallet size={20} />}
              title="Wallet Top-Up Numbers"
              subtitle="Customers send money to these numbers to add wallet balance"
            >
              <div style={gridTwo}>
                <Field label="Wallet bKash Number" icon={<Phone size={14} />}>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={walletBkashNumber}
                    onChange={(e) => setWalletBkashNumber(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Wallet Nagad Number" icon={<Phone size={14} />}>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={walletNagadNumber}
                    onChange={(e) => setWalletNagadNumber(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={gridTwo}>
                <Field label="Minimum Top-Up (৳)">
                  <input
                    type="number"
                    placeholder="50"
                    value={walletMinAmount}
                    onChange={(e) => setWalletMinAmount(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Maximum Top-Up (৳)">
                  <input
                    type="number"
                    placeholder="10000"
                    value={walletMaxAmount}
                    onChange={(e) => setWalletMaxAmount(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </Section>

            {/* Gaming */}
            <Section
              icon={<SettingsIcon size={20} />}
              title="Gaming Payment Numbers (Default)"
              subtitle="Fallback numbers if per-game settings not set"
            >
              <div style={gridTwo}>
                <Field label="Gaming bKash" icon={<Phone size={14} />}>
                  <input
                    type="text"
                    value={gamingBkashNumber}
                    onChange={(e) => setGamingBkashNumber(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Gaming Nagad" icon={<Phone size={14} />}>
                  <input
                    type="text"
                    value={gamingNagadNumber}
                    onChange={(e) => setGamingNagadNumber(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </Section>

            {/* Social */}
            <Section
              icon={<SettingsIcon size={20} />}
              title="Social Media"
              subtitle="Connect your social profiles"
            >
              <div style={gridTwo}>
                <Field label="Facebook URL" icon={<FaFacebookF size={14} />}>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Instagram URL" icon={<FaInstagram size={14} />}>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="WhatsApp Number">
                <input
                  type="tel"
                  placeholder="+880 17XX-XXXXXX"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </Section>

            {/* Save Button (bottom) */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '16px',
                borderRadius: '999px',
                background: saving
                  ? 'var(--surface-soft)'
                  : 'linear-gradient(135deg, #059669, #047857)',
                color: saving ? 'var(--text-tertiary)' : '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: saving ? 'none' : '0 6px 20px rgba(5,150,105,0.35)',
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// Helpers
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const gridTwo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

function Section({ icon, title, subtitle, children }) {
  return (
    <div className="admin-section" style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
          paddingBottom: '16px',
          borderBottom: '1px dashed var(--border)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12.5px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

export default AdminSettingsPage