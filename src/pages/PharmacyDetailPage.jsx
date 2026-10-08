// ============================================================
// src/pages/PharmacyDetailPage.jsx
// V2 — Debug-friendly version with detailed console logs
// Bilingual (BN/EN)
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
import { useLanguage } from '../i18n/LanguageContext'

const CATEGORIES = [
  { key: 'all', labelKey: 'pharmacyDetail.catAll', icon: '💊' },
  { key: 'pain', labelKey: 'pharmacyDetail.catPain', icon: '💊' },
  { key: 'fever', labelKey: 'pharmacyDetail.catFever', icon: '🌡️' },
  { key: 'diabetes', labelKey: 'pharmacyDetail.catDiabetes', icon: '🩺' },
  { key: 'antibiotics', labelKey: 'pharmacyDetail.catAntibiotics', icon: '💉' },
  { key: 'skin', labelKey: 'pharmacyDetail.catSkin', icon: '🧴' },
  { key: 'oral', labelKey: 'pharmacyDetail.catOral', icon: '🦷' },
  { key: 'eye', labelKey: 'pharmacyDetail.catEye', icon: '👁️' },
  { key: 'baby', labelKey: 'pharmacyDetail.catBaby', icon: '🍼' },
  { key: 'firstaid', labelKey: 'pharmacyDetail.catFirstaid', icon: '🩹' },
  { key: 'vitamins', labelKey: 'pharmacyDetail.catVitamins', icon: '💪' },
  { key: 'other', labelKey: 'pharmacyDetail.catOther', icon: '🧪' },
]

function PharmacyDetailPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pharmacyId = (searchParams.get('id') || '').trim()

  const [pharmacy, setPharmacy] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const savedCart = JSON.parse(
    localStorage.getItem('pharmacyCartItems') || '[]'
  )
  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [conflictMed, setConflictMed] = useState(null)
  const [showConflict, setShowConflict] = useState(false)

  // ============ LOAD PHARMACY ============
  useEffect(() => {
    if (!pharmacyId) {
      console.log('🔴 No pharmacyId in URL')
      setLoading(false)
      setError(t('pharmacyDetail.noIdProvided'))
      return
    }

    console.log('🔵 Attempting to load pharmacy')
    console.log('   ID:', pharmacyId)
    console.log('   ID length:', pharmacyId.length)
    console.log('   Doc path: pharmacies/' + pharmacyId)

    const unsub = onSnapshot(
      doc(db, 'pharmacies', pharmacyId),
      (snap) => {
        console.log('🟢 Snapshot received')
        console.log('   Exists:', snap.exists())
        console.log('   Doc ID:', snap.id)
        if (snap.exists()) {
          const data = snap.data()
          console.log('   Pharmacy name:', data.pharmacyName)
          console.log('   Status:', data.status)
          setPharmacy({ firebaseId: snap.id, ...data })
          setError('')
        } else {
          console.log('🔴 Pharmacy does NOT exist at path')
          setPharmacy(null)
          setError(t('pharmacyDetail.notFoundDesc'))
          toast.error(t('pharmacyDetail.toastPharmacyNotFound'))
        }
        setLoading(false)
      },
      (err) => {
        console.error('🔴 Pharmacy load error:', err)
        console.error('   Error code:', err.code)
        console.error('   Error message:', err.message)
        setPharmacy(null)
        setError(err.message || 'Failed to load pharmacy')
        setLoading(false)
      }
    )
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId])

  // ============ LOAD MEDICINES ============
  useEffect(() => {
    if (!pharmacyId) return

    console.log('🔵 Loading medicines for pharmacy:', pharmacyId)

    const q = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', pharmacyId)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        console.log('🟢 Medicines found:', list.length)
        list.forEach((m) => {
          console.log(
            `   → ${m.name} | available: ${m.available} | category: ${m.category}`
          )
        })
        setMedicines(list)
      },
      (err) => {
        console.error('🔴 Medicines load error:', err)
        console.error('   Code:', err.code)
      }
    )
    return () => unsub()
  }, [pharmacyId])

  // ============ CART HELPERS ============
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
    deliveryTime:
      pharmacy.deliveryTime || t('pharmacyDetail.defaultDeliveryTime'),
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
    toast.success(
      t('pharmacyDetail.toastAdded').replace('{name}', med.name),
      { autoClose: 1500 }
    )
  }

  const clearAndAdd = () => {
    if (!conflictMed) return
    saveCart([buildCartItem(conflictMed)])
    toast.success(
      t('pharmacyDetail.toastCartCleared').replace(
        '{name}',
        conflictMed.name
      )
    )
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

  const formatTime = (time24) => {
    if (!time24) return t('pharmacyDetail.statusOpensDefault')
    try {
      const [h, m] = time24.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}${m === '00' ? '' : ':' + m} ${ampm}`
    } catch {
      return t('pharmacyDetail.statusOpensDefault')
    }
  }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="restaurant-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>{t('pharmacyDetail.loading')}</p>
        </div>
      </div>
    )
  }

  // ============ NOT FOUND ============
  if (!pharmacy) {
    return (
      <div className="restaurant-page">
        <div className="restaurant-empty-state">
          <div className="empty-icon">💊</div>
          <h2>{t('pharmacyDetail.notFoundTitle')}</h2>
          <p>{error || t('pharmacyDetail.notFoundDesc')}</p>
          {pharmacyId && (
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                fontFamily: 'monospace',
                marginTop: '8px',
                wordBreak: 'break-all',
                maxWidth: '400px',
                margin: '8px auto 0',
              }}
            >
              {t('pharmacyDetail.notFoundIdLabel')} {pharmacyId}
            </p>
          )}
          <button onClick={() => navigate('/pharmacy')}>
            {t('pharmacyDetail.browsePharmacies')}
          </button>
        </div>
      </div>
    )
  }

  const isOpen =
    pharmacy.pharmacyStatus === 'online' ||
    pharmacy.pharmacyStatus === 'busy'

  return (
    <div className="restaurant-page">
      <PageBackButton
        label={t('pharmacy.back')}
        fallback="/pharmacy"
      />

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
            <p>
              📍{' '}
              {pharmacy.address || t('pharmacyDetail.defaultAddress')}
            </p>
            <span>
              {pharmacy.rating != null &&
                `⭐ ${Number(pharmacy.rating).toFixed(1)} • `}
              🕐{' '}
              {pharmacy.deliveryTime ||
                t('pharmacyDetail.defaultDeliveryTime')}{' '}
              • 🚚 ৳{pharmacy.deliveryFee || 0}
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
            ? t('pharmacyDetail.statusOpenNow')
            : t('pharmacyDetail.statusClosedOpens').replace(
                '{time}',
                formatTime(pharmacy.openingTime)
              )}
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-heading">
          <span className="glass-section-label">
            {t('pharmacyDetail.menuBadge')}
          </span>
          <h2>{t('pharmacyDetail.menuTitle')}</h2>
          <p>
            {t('pharmacyDetail.menuCount').replace(
              '{n}',
              medicines.length
            )}
          </p>
        </div>

        {/* Search */}
        <div className="menu-search-bar">
          <Search size={18} strokeWidth={2.2} />
          <input
            type="text"
            placeholder={t('pharmacyDetail.searchPlaceholder')}
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
              {t(c.labelKey)}
            </button>
          ))}
        </div>

        {/* Medicines grid */}
        {filtered.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">💊</div>
            <h2>{t('pharmacyDetail.emptyTitle')}</h2>
            <p>
              {search || category !== 'all'
                ? t('pharmacyDetail.emptySearch')
                : medicines.length === 0
                ? t('pharmacyDetail.emptyNoItems')
                : t('pharmacyDetail.emptyNoAvailable')}
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
                    {m.genericName && <span>🩺 {m.genericName}</span>}
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
                      {t('pharmacyDetail.prescriptionRequired')}
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
                      {t('pharmacyDetail.addBtn')}
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
            <h2>{t('pharmacyDetail.conflictTitle')}</h2>
            <p>
              {t('pharmacyDetail.conflictFrom')}{' '}
              <strong>{cartItems[0]?.pharmacyName}</strong>.
              <br />
              <br />
              {t('pharmacyDetail.conflictAsk')}{' '}
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
                {t('pharmacyDetail.conflictCancel')}
              </button>
              <button className="confirm-btn" onClick={clearAndAdd}>
                {t('pharmacyDetail.conflictConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PharmacyDetailPage