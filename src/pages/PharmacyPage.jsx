// ============================================================
// src/pages/PharmacyPage.jsx
// V3 — Debug-friendly version
// Bilingual (BN/EN)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { X } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'
import { useLanguage } from '../i18n/LanguageContext'

function PharmacyPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [allPharmacies, setAllPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [error, setError] = useState('')

  // ============ LOAD ALL PHARMACIES ============
  useEffect(() => {
    console.log('🟢 PharmacyPage: Starting to load...')

    const unsub = onSnapshot(
      collection(db, 'pharmacies'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))

        console.log('🟢 Total pharmacies loaded:', list.length)
        list.forEach((p) => {
          console.log(
            `   → ${p.pharmacyName} | status: "${p.status}" | status type: ${typeof p.status}`
          )
        })

        const approved = list.filter((p) => p.status === 'approved')
        console.log('🟢 Approved pharmacies:', approved.length)

        setAllPharmacies(list)
        setLoading(false)
      },
      (err) => {
        console.error('🔴 Pharmacy load error:', err)
        setError(err.message || t('pharmacy.errorGeneric'))
        setLoading(false)
      }
    )

    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============ CLIENT-SIDE FILTER ============
  const pharmacies = useMemo(
    () => allPharmacies.filter((p) => p.status === 'approved'),
    [allPharmacies]
  )

  const filtered = useMemo(() => {
    let result = [...pharmacies]

    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter((p) =>
        `${p.pharmacyName || ''} ${p.address || ''}`
          .toLowerCase()
          .includes(s)
      )
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'delivery') {
      result.sort((a, b) => (a.deliveryFee || 0) - (b.deliveryFee || 0))
    } else if (sortBy === 'name') {
      result.sort((a, b) =>
        (a.pharmacyName || '').localeCompare(b.pharmacyName || '')
      )
    }

    return result
  }, [pharmacies, search, sortBy])

  const stats = useMemo(
    () => ({
      total: pharmacies.length,
      online: pharmacies.filter(
        (p) =>
          p.pharmacyStatus === 'online' || p.pharmacyStatus === 'busy'
      ).length,
    }),
    [pharmacies]
  )

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label={t('pharmacy.back')} fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">{t('pharmacy.badge')}</span>
          <h1>
            {t('pharmacy.heading1')}{' '}
            <span>{t('pharmacy.heading2')}</span>
          </h1>
          <p>{t('pharmacy.subtitle')}</p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="restaurant-page-stats">
            <div className="restaurant-stat">
              <strong>{stats.total}</strong>
              <span>{t('pharmacy.statTotal')}</span>
            </div>
            <div className="restaurant-stat">
              <strong>{stats.online}</strong>
              <span>{t('pharmacy.statOpen')}</span>
            </div>
            <div className="restaurant-stat">
              <strong>{t('pharmacy.statEmergencyValue')}</strong>
              <span>{t('pharmacy.statEmergency')}</span>
            </div>
            <div className="restaurant-stat">
              <strong>{t('pharmacy.statDeliveryValue')}</strong>
              <span>{t('pharmacy.statDelivery')}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="restaurant-controls">
          <div className="restaurant-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder={t('pharmacy.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="restaurant-sort">
            <label>{t('pharmacy.sortLabel')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">{t('pharmacy.sortRating')}</option>
              <option value="delivery">{t('pharmacy.sortDelivery')}</option>
              <option value="name">{t('pharmacy.sortName')}</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>{t('pharmacy.loading')}</p>
          </div>
        ) : error ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">⚠️</div>
            <h2>{t('pharmacy.errorTitle')}</h2>
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">💊</div>
            <h2>{t('pharmacy.emptyTitle')}</h2>
            <p>
              {search
                ? t('pharmacy.emptySearch')
                : allPharmacies.length === 0
                ? t('pharmacy.emptyDatabase')
                : pharmacies.length === 0
                ? t('pharmacy.emptyNoneApproved').replace(
                    '{n}',
                    allPharmacies.length
                  )
                : t('pharmacy.emptySoon')}
            </p>
          </div>
        ) : (
          <div className="all-restaurants-grid">
            {filtered.map((p) => {
              const isOpen =
                p.pharmacyStatus === 'online' ||
                p.pharmacyStatus === 'busy'
              return (
                <div
                  key={p.firebaseId}
                  className="all-restaurant-card"
                  onClick={() =>
                    navigate(`/pharmacy-detail?id=${p.firebaseId}`)
                  }
                >
                  <div className="all-restaurant-image">
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt={p.pharmacyName}
                        className="restaurant-logo-img"
                      />
                    ) : (
                      <span className="restaurant-main-emoji">💊</span>
                    )}
                    <div
                      className={`restaurant-badge ${
                        isOpen ? 'online-badge' : ''
                      }`}
                    >
                      {isOpen
                        ? t('pharmacy.badgeOpen')
                        : t('pharmacy.badgeClosed')}
                    </div>
                    {p.rating != null && (
                      <div className="all-restaurant-rating">
                        ⭐{' '}
                        {p.rating.toFixed ? p.rating.toFixed(1) : p.rating}
                      </div>
                    )}
                  </div>

                  <div className="all-restaurant-info">
                    <div className="restaurant-title-row">
                      <h2>{p.pharmacyName}</h2>
                      <span className="restaurant-price">
                        ৳{p.deliveryFee || 0}
                      </span>
                    </div>
                    <p className="restaurant-cuisine">
                      📍 {p.address || t('pharmacy.defaultAddress')}
                    </p>
                    <div className="all-restaurant-meta">
                      <span>
                        🕐{' '}
                        {p.deliveryTime || t('pharmacy.defaultDeliveryTime')}
                      </span>
                      <span>{t('pharmacy.medicinesTag')}</span>
                    </div>
                    <button className="restaurant-menu-button">
                      {t('pharmacy.browseMedicines')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PharmacyPage