// ============================================================
// src/pages/PharmacyDetailPage.jsx
// Pharmacy detail + medicines listing
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import PharmacyCart from '../components/PharmacyCart'
import { db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from 'firebase/firestore'
import { Search, X } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '💊' },
  { key: 'pain', label: 'Pain Relief', icon: '💊' },
  { key: 'fever', label: 'Fever & Cold', icon: '🌡️' },
  { key: 'diabetes', label: 'Diabetes', icon: '🩺' },
  { key: 'antibiotics', label: 'Antibiotics', icon: '💉' },
  { key: 'skin', label: 'Skin Care', icon: '🧴' },
  { key: 'oral', label: 'Oral Care', icon: '🦷' },
  { key: 'eye', label: 'Eye & Ear', icon: '👁️' },
  { key: 'baby', label: 'Baby Care', icon: '🍼' },
  { key: 'firstaid', label: 'First Aid', icon: '🩹' },
  { key: 'vitamins', label: 'Vitamins', icon: '💪' },
  { key: 'other', label: 'Other', icon: '🧪' },
]

function PharmacyDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pharmacyId = searchParams.get('id') || ''

  const [pharmacy, setPharmacy] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const savedCart = JSON.parse(
    localStorage.getItem('pharmacyCartItems') || '[]'
  )
  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [conflictMed, setConflictMed] = useState(null)
  const [showConflict, setShowConflict] = useState(false)

  // Load pharmacy
  useEffect(() => {
    if (!pharmacyId) {
      setLoading(false)
      return
    }
    const unsub = onSnapshot(
      doc(db, 'pharmacies', pharmacyId),
      (snap) => {
        if (snap.exists()) {
          setPharmacy({ firebaseId: snap.id, ...snap.data() })
        } else {
          toast.error('Pharmacy not found!')
        }
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [pharmacyId])

  // Load medicines
  useEffect(() => {
    if (!pharmacyId) return
    const q = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', pharmacyId)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMedicines(
        snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      )
    })
    return () => unsub()
  }, [pharmacyId])

  const saveCart = (items) => {
    localStorage.setItem('pharmacyCartItems', JSON.stringify(items))
    setCartItems(items)
    window.dispatchEvent(new Event('pharmacyCartUpdated'))
    return items
  }

  const checkConflict = (med) => {
    if (cartItems.length === 0) {
      addDirect(med)
      return
    }
    if (cartItems[0].pharmacyId === pharmacy.firebaseId) {
      addDirect(med)
    } else {
      setConflictMed(med)
      setShowConflict(true)
    }
  }

  const buildCartItem = (med) => ({
    id: med.firebaseId,
    name: med.name,
    price: med.discountPrice || med.price,
    emoji: med.emoji || '💊',
    image: med.image || '',
    quantity: 1,
    pharmacyId: pharmacy.firebaseId,
    pharmacyName: pharmacy.pharmacyName,
    pharmacyLogo: pharmacy.logo || '',
    deliveryFee: pharmacy.deliveryFee || 0,
    minimumOrder: pharmacy.minimumOrder || 0,
    deliveryTime: pharmacy.deliveryTime || '20-30 min',
  })

  const addDirect = (med) => {
    const existing = cartItems.find((i) => i.id === med.firebaseId)
    const updated = existing
      ? cartItems.map((i) =>
          i.id === med.firebaseId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      : [...cartItems, buildCartItem(med)]

    saveCart(updated)
    toast.success(`${med.name} added to cart!`, { autoClose: 1500 })
  }

  const clearAndAdd = () => {
    if (!conflictMed) return
    saveCart([buildCartItem(conflictMed)])
    toast.success(`Cart cleared! ${conflictMed.name} added.`)
    setShowConflict(false)
    setConflictMed(null)
  }

  const increase = (id) => {
    saveCart(
      cartItems.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      )
    )
  }

  const decrease = (id) => {
    saveCart(
      cartItems
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const filtered = useMemo(() => {
    let result = medicines.filter((m) => m.available !== false)
    if (category !== 'all') {
      result = result.filter((m) => m.category === category)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter((m) =>
        `${m.name || ''} ${m.genericName || ''} ${m.company || ''}`
          .toLowerCase()
          .includes(s)
      )
    }
    return result
  }, [medicines, category, search])

  if (loading) {
    return (
      <div className="restaurant-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading pharmacy...</p>
        </div>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="restaurant-page">
        <div className="restaurant-empty-state">
          <div className="empty-icon">💊</div>
          <h2>Pharmacy Not Found</h2>
          <p>This pharmacy doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/pharmacy')}>
            Browse Pharmacies
          </button>
        </div>
      </div>
    )
  }

  const isOpen =
    pharmacy.pharmacyStatus === 'online' ||
    pharmacy.pharmacyStatus === 'busy'

  const formatTime = (time24) => {
    if (!time24) return '10 AM'
    try {
      const [h, m] = time24.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}${m === '00' ? '' : ':' + m} ${ampm}`
    } catch {
      return '10 AM'
    }
  }

  return (
    <div className="restaurant-page">
      <PageBackButton label="Back" fallback="/pharmacy" />

      <div className="restaurant-page-header">
        <div className="restaurant-header-with-logo">
          <div className="restaurant-header-logo">
            {pharmacy.logo ? (
              <img src={pharmacy.logo} alt={pharmacy.pharmacyName} />
            ) : (
              <span>💊</span>
            )}
          </div>
          <div className="restaurant-header-info">
            <h1>{pharmacy.pharmacyName}</h1>
            <p>📍 {pharmacy.address || 'Araihazar'}</p>
            <span>
              {pharmacy.rating != null &&
                `⭐ ${pharmacy.rating.toFixed(1)} • `}
              🕐 {pharmacy.deliveryTime || '20-30 min'} • 🚚 ৳
              {pharmacy.deliveryFee || 0}
            </span>
          </div>
        </div>

        <div className="restaurant-status-badge">
          <span
            className={`restaurant-status-dot ${
              pharmacy.pharmacyStatus || 'offline'
            }`}
          ></span>
          {isOpen
            ? 'Open Now'
            : `Closed · Opens ${formatTime(pharmacy.openingTime)}`}
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-heading">
          <span className="glass-section-label">MEDICINES</span>
          <h2>Browse Medicines</h2>
          <p>Choose from {medicines.length} items</p>
        </div>

        {/* Search */}
        <div className="menu-search-bar">
          <Search size={18} strokeWidth={2.2} />
          <input
            type="text"
            placeholder="Search medicines, brand, generic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch('')}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '12px 4px',
            marginBottom: '16px',
            scrollbarWidth: 'thin',
          }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                background:
                  category === c.key
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : 'var(--surface)',
                color:
                  category === c.key
                    ? '#FFFFFF'
                    : 'var(--text-secondary)',
                border:
                  category === c.key
                    ? 'none'
                    : '1px solid var(--border-strong)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Medicines grid */}
        {filtered.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">💊</div>
            <h2>No medicines found</h2>
            <p>
              {search || category !== 'all'
                ? 'Try a different search or category'
                : 'This pharmacy hasn\'t added medicines yet'}
            </p>
          </div>
        ) : (
          <div className="food-grid">
            {filtered.map((m) => (
              <div className="food-card" key={m.firebaseId}>
                <div className="food-image">
                  {m.image ? (
                    <img src={m.image} alt={m.name} />
                  ) : (
                    <span style={{ fontSize: '40px' }}>💊</span>
                  )}
                </div>
                <div className="food-info">
                  <h3>{m.name}</h3>
                  <p style={{ fontSize: '11.5px', marginBottom: '4px' }}>
                    {m.genericName && (
                      <span>🩺 {m.genericName}</span>
                    )}
                  </p>
                  <p style={{ fontSize: '11.5px', marginBottom: '4px' }}>
                    {m.company && <span>🏭 {m.company}</span>}
                  </p>
                  {m.requiresPrescription && (
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(220,38,38,0.1)',
                        color: '#DC2626',
                        fontSize: '10px',
                        fontWeight: 800,
                        marginBottom: '8px',
                      }}
                    >
                      ⚠️ Prescription Required
                    </div>
                  )}
                  <div className="food-bottom">
                    <div className="food-price-box">
                      {m.discountPrice ? (
                        <>
                          <strong>৳{m.discountPrice}</strong>
                          <del>৳{m.price}</del>
                        </>
                      ) : (
                        <strong>৳{m.price}</strong>
                      )}
                    </div>
                    <button onClick={() => checkConflict(m)}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            zIndex: 9998,
            minWidth: '56px',
            height: '56px',
            padding: '0 20px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🛒 {cartItems.reduce((s, i) => s + i.quantity, 0)} · ৳
          {cartItems.reduce((s, i) => s + i.price * i.quantity, 0)}
        </button>
      )}

      {cartOpen && (
        <PharmacyCart
          items={cartItems}
          onClose={() => setCartOpen(false)}
          onIncrease={increase}
          onDecrease={decrease}
        />
      )}

      {showConflict && (
        <div className="outside-area-modal">
          <div className="outside-area-modal-content">
            <div className="outside-area-icon">⚠️</div>
            <h2>Clear Your Cart?</h2>
            <p>
              Your cart has medicines from{' '}
              <strong>{cartItems[0]?.pharmacyName}</strong>.
              <br />
              <br />
              Do you want to clear and add from{' '}
              <strong>{pharmacy.pharmacyName}</strong>?
            </p>
            <div className="conflict-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowConflict(false)
                  setConflictMed(null)
                }}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={clearAndAdd}>
                Yes, Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PharmacyDetailPage