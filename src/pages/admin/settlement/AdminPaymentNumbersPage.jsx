// ============================================================
// src/pages/admin/settlement/AdminPaymentNumbersPage.jsx
// V6 — Multi-method + Pharmacies
// ============================================================
import { useEffect, useState } from 'react'
import { db } from '../../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Store,
  Bike,
  Pill,
  Save,
  Search,
  Phone,
  CheckCircle,
} from 'lucide-react'

const METHODS = ['bKash', 'Nagad', 'Rocket', 'Bank', 'Cash']

const TABS = [
  {
    key: 'restaurants',
    label: 'Restaurants',
    icon: Store,
    nameField: 'restaurantName',
  },
  { key: 'riders', label: 'Riders', icon: Bike, nameField: 'fullName' },
  {
    key: 'pharmacies',
    label: 'Pharmacies',
    icon: Pill,
    nameField: 'pharmacyName',
  },
]

export default function AdminPaymentNumbersPage() {
  const [tab, setTab] = useState('restaurants')
  const [data, setData] = useState({
    restaurants: [],
    riders: [],
    pharmacies: [],
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsubs = TABS.map((t) =>
      onSnapshot(
        collection(db, t.key),
        (snap) => {
          setData((prev) => ({
            ...prev,
            [t.key]: snap.docs.map((d) => ({
              id: d.id,
              _type: t.key,
              ...d.data(),
            })),
          }))
          setLoading(false)
        },
        (err) => {
          console.error(`${t.key} load error:`, err)
          setLoading(false)
        }
      )
    )
    return () => unsubs.forEach((u) => u())
  }, [])

  const rows = data[tab] || []
  const filtered = rows.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (r.restaurantName || r.pharmacyName || r.fullName || r.name || '')
        .toLowerCase()
        .includes(s) || (r.phone || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="stl-page">
      <div className="stl-header">
        <div>
          <Link to="/admin/settlement" className="stl-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>💳 Payment Numbers</h1>
          <p>Manage multiple payment methods per user</p>
        </div>
      </div>

      <div className="stl-tabs">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              className={`stl-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={16} /> {t.label} ({data[t.key]?.length || 0})
            </button>
          )
        })}
      </div>

      <div className="stl-filter-bar">
        <div className="stl-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="stl-empty">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="stl-empty">No {tab} found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((r) => (
            <PaymentCard key={`${tab}-${r.id}`} entity={r} tab={tab} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   PAYMENT CARD
============================================================ */
function PaymentCard({ entity, tab }) {
  const name =
    entity.restaurantName ||
    entity.pharmacyName ||
    entity.fullName ||
    entity.name ||
    'Unnamed'
  const phone = entity.phone || ''

  const buildInitial = () => {
    const existing = entity.paymentMethods || {}
    const result = {}
    METHODS.forEach((m) => {
      result[m] = {
        number:
          existing[m]?.number ||
          (m === 'bKash' && entity.bkashNumber) ||
          (m === 'Nagad' && entity.nagadNumber) ||
          (m === 'Rocket' && entity.rocketNumber) ||
          (m === 'Bank' && entity.bankAccount) ||
          '',
        active:
          existing[m]?.active ??
          (!!(
            existing[m]?.number ||
            (m === 'bKash' && entity.bkashNumber) ||
            (m === 'Nagad' && entity.nagadNumber) ||
            (m === 'Rocket' && entity.rocketNumber) ||
            (m === 'Bank' && entity.bankAccount)
          ) ||
            m === 'Cash'),
      }
    })
    return result
  }

  const [methods, setMethods] = useState(buildInitial)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setMethods(buildInitial())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.paymentMethods])

  const updateField = (methodName, field, value) => {
    setMethods((prev) => ({
      ...prev,
      [methodName]: {
        ...prev[methodName],
        [field]: value,
        ...(field === 'number' && value ? { active: true } : {}),
      },
    }))
  }

  const toggleActive = (methodName) => {
    setMethods((prev) => ({
      ...prev,
      [methodName]: {
        ...prev[methodName],
        active: !prev[methodName].active,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const col = tab // 'restaurants' | 'riders' | 'pharmacies'
      const docRef = doc(db, col, entity.id)

      const legacy = {}
      METHODS.forEach((m) => {
        const val = methods[m]?.number?.trim() || ''
        if (m === 'bKash') legacy.bkashNumber = val
        if (m === 'Nagad') legacy.nagadNumber = val
        if (m === 'Rocket') legacy.rocketNumber = val
        if (m === 'Bank') legacy.bankAccount = val
      })

      await setDoc(
        docRef,
        {
          paymentMethods: methods,
          ...legacy,
          paymentNumberUpdatedAt: new Date(),
        },
        { merge: true }
      )

      const verify = await getDoc(docRef)
      if (verify.exists() && verify.data().paymentMethods) {
        console.log('✅ Saved:', verify.data().paymentMethods)
        toast.success('✅ Saved & verified')
        setSavedOk(true)
        setTimeout(() => setSavedOk(false), 2000)
      } else {
        toast.warning('⚠️ Saved but verification failed')
      }
    } catch (err) {
      console.error('❌ Save failed:', err)
      toast.error('Save failed: ' + err.message)
    }
    setSaving(false)
  }

  const activeCount = METHODS.filter((m) => methods[m]?.active).length

  return (
    <div className="stl-payment-card">
      <div className="stl-pc-head">
        <div>
          <div className="stl-pc-name">
            {name}
            <span className="stl-pc-badge">{activeCount} active</span>
          </div>
          <div className="stl-pc-meta">
            <Phone size={12} /> {phone || '—'}
            <span style={{ marginLeft: 12, color: '#94a3b8' }}>
              ID: {entity.id}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="stl-btn stl-btn-ghost sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide' : 'Edit'} ({activeCount})
          </button>
          <button
            className={`stl-btn sm ${
              savedOk ? 'stl-btn-success' : 'stl-btn-primary'
            }`}
            onClick={handleSave}
            disabled={saving}
          >
            {savedOk ? (
              <>
                <CheckCircle size={13} /> Saved
              </>
            ) : (
              <>
                <Save size={13} /> {saving ? '...' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="stl-pc-body">
          {METHODS.map((m) => (
            <div key={m} className="stl-pc-row">
              <label className="stl-pc-toggle">
                <input
                  type="checkbox"
                  checked={methods[m]?.active || false}
                  onChange={() => toggleActive(m)}
                />
                <span className={`stl-pc-dot stl-pc-${m.toLowerCase()}`} />
                <span className="stl-pc-method">{m}</span>
              </label>
              <input
                type="text"
                className="stl-input stl-pc-input"
                placeholder={
                  m === 'Cash'
                    ? 'Cash — no number needed'
                    : m === 'Bank'
                    ? 'Bank account number'
                    : `01XXXXXXXXX (${m})`
                }
                value={methods[m]?.number || ''}
                onChange={(e) => updateField(m, 'number', e.target.value)}
                disabled={m === 'Cash'}
              />
            </div>
          ))}
        </div>
      )}

      {!expanded && (
        <div className="stl-pc-preview">
          {METHODS.filter(
            (m) => methods[m]?.active && methods[m]?.number
          ).map((m) => (
            <div key={m} className="stl-pc-chip">
              <span className={`stl-pc-dot stl-pc-${m.toLowerCase()}`} />
              <strong>{m}:</strong> {methods[m].number}
            </div>
          ))}
          {activeCount === 0 && (
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              No payment methods set. Click Edit.
            </span>
          )}
        </div>
      )}
    </div>
  )
}