// ============================================================
// src/pages/admin/settlement/AdminAraiFoodPaymentNumbersPage.jsx
// Admin এর নিজের Payment Numbers (Rider কে টাকা পাঠানোর জন্য)
// ============================================================
import { useEffect, useState } from 'react'
import { db } from '../../../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Copy,
  Building2,
  Smartphone,
  Info,
} from 'lucide-react'

const METHODS = [
  { key: 'bkash',  label: 'bKash',  icon: '📱', color: '#E2136E' },
  { key: 'nagad',  label: 'Nagad',  icon: '📱', color: '#EE3124' },
  { key: 'rocket', label: 'Rocket', icon: '📱', color: '#8B3A8B' },
  { key: 'bank',   label: 'Bank',   icon: '🏦', color: '#0F766E' },
]

export default function AdminAraiFoodPaymentNumbersPage() {
  const [numbers, setNumbers] = useState({
    bkash:  { number: '', active: false },
    nagad:  { number: '', active: false },
    rocket: { number: '', active: false },
    bank:   { number: '', active: false, accountName: '', bankName: '' },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Load existing
  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDoc(
          doc(db, 'settings', 'araifood_payment_numbers')
        )
        if (snap.exists()) {
          const data = snap.data()
          setNumbers((prev) => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.warn('Load failed:', e)
      }
      setLoading(false)
    })()
  }, [])

  const updateField = (methodKey, field, value) => {
    setNumbers((prev) => ({
      ...prev,
      [methodKey]: { ...prev[methodKey], [field]: value },
    }))
  }

  const toggleActive = (methodKey) => {
    setNumbers((prev) => ({
      ...prev,
      [methodKey]: {
        ...prev[methodKey],
        active: !prev[methodKey].active,
      },
    }))
  }

  const handleSave = async () => {
    // Validate
    const active = METHODS.filter((m) => numbers[m.key]?.active)
    if (active.length === 0) {
      toast.error('কমপক্ষে একটা number active করো')
      return
    }
    for (const m of active) {
      if (!numbers[m.key]?.number?.trim()) {
        toast.error(`${m.label} এর number দাও`)
        return
      }
    }

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'settings', 'araifood_payment_numbers'),
        {
          ...numbers,
          updatedAt: new Date(),
        },
        { merge: true }
      )
      toast.success('✅ Saved & verified')
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (err) {
      console.error('❌ Save failed:', err)
      toast.error('Save failed: ' + err.message)
    }
    setSaving(false)
  }

  const handleCopy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied!')
  }

  if (loading) {
    return (
      <div className="stl-page">
        <div className="stl-empty">Loading...</div>
      </div>
    )
  }

  return (
    <div className="stl-page">
      {/* HEADER */}
      <div className="stl-header">
        <div>
          <Link to="/admin/settlement" className="stl-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>🏦 AraiFood Payment Numbers</h1>
          <p>Rider যেসব number এ টাকা পাঠাবে (তোমার নিজের account)</p>
        </div>
      </div>

      {/* INFO BOX */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: '#EFF6FF',
          border: '1px solid #3B82F6',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <Info size={20} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>
          <strong>কিভাবে কাজ করে:</strong>
          <br />
          Rider কে COD এ cash collect করার পর নিজের delivery fee বাদে বাকি টাকা
          এই numbers এ পাঠাবে। তুমি verify করলে সেটা Rider এর settlement হয়ে যাবে।
        </div>
      </div>

      {/* METHODS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {METHODS.map((m) => {
          const data = numbers[m.key] || {}
          const isBank = m.key === 'bank'

          return (
            <div
              key={m.key}
              style={{
                background: '#FFFFFF',
                border: `2px solid ${data.active ? m.color : '#E2E8F0'}`,
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.2s',
              }}
            >
              {/* HEAD */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: m.color + '20',
                      color: m.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#0F172A',
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: data.active ? m.color : '#94A3B8',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {data.active ? '● Active' : '○ Inactive'}
                    </div>
                  </div>
                </div>

                {/* TOGGLE */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!data.active}
                    onChange={() => toggleActive(m.key)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: m.color,
                    }}
                  />
                </label>
              </div>

              {/* BANK EXTRA FIELDS */}
              {isBank && (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Bank Name
                    </label>
                    <input
                      type="text"
                      className="stl-input"
                      placeholder="e.g., Dutch Bangla Bank"
                      value={data.bankName || ''}
                      onChange={(e) =>
                        updateField('bank', 'bankName', e.target.value)
                      }
                      disabled={!data.active}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Account Holder
                    </label>
                    <input
                      type="text"
                      className="stl-input"
                      placeholder="e.g., AraiFood Ltd."
                      value={data.accountName || ''}
                      onChange={(e) =>
                        updateField('bank', 'accountName', e.target.value)
                      }
                      disabled={!data.active}
                    />
                  </div>
                </>
              )}

              {/* NUMBER FIELD */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  {isBank ? 'Account Number' : 'Mobile Number'}
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <input
                    type="text"
                    className="stl-input"
                    placeholder={
                      isBank ? '1234567890' : '01XXXXXXXXX'
                    }
                    value={data.number || ''}
                    onChange={(e) =>
                      updateField(m.key, 'number', e.target.value)
                    }
                    disabled={!data.active}
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  />
                  {data.number && (
                    <button
                      onClick={() => handleCopy(data.number)}
                      title="Copy"
                      style={{
                        background: '#F1F5F9',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#475569',
                        flexShrink: 0,
                      }}
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`stl-btn ${
          savedOk ? 'stl-btn-success' : 'stl-btn-primary'
        }`}
        style={{ minWidth: '220px', padding: '14px 24px' }}
      >
        {savedOk ? (
          <>
            <CheckCircle size={18} /> Saved Successfully
          </>
        ) : (
          <>
            <Save size={18} /> {saving ? 'Saving...' : 'Save All Numbers'}
          </>
        )}
      </button>
    </div>
  )
}