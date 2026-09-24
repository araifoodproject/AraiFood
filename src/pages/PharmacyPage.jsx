// ============================================================
// src/pages/PharmacyPage.jsx
// Pharmacy listing page
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Search, X } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'

function PharmacyPage() {
  const navigate = useNavigate()
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rating')

  useEffect(() => {
    const q = query(
      collection(db, 'pharmacies'),
      where('status', '==', 'approved')
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setPharmacies(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

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
      result.sort(
        (a, b) => (a.deliveryFee || 0) - (b.deliveryFee || 0)
      )
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
        <PageBackButton label="Back" fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">ARAIFOOD PHARMACY</span>
          <h1>
            Order <span>Medicines</span>
          </h1>
          <p>
            Get medicines and health essentials delivered to your doorstep.
          </p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="restaurant-page-stats">
            <div className="restaurant-stat">
              <strong>{stats.total}</strong>
              <span>Pharmacies</span>
            </div>
            <div className="restaurant-stat">
              <strong>{stats.online}</strong>
              <span>Open Now</span>
            </div>
            <div className="restaurant-stat">
              <strong>24/7</strong>
              <span>Emergency</span>
            </div>
            <div className="restaurant-stat">
              <strong>Fast</strong>
              <span>Delivery</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="restaurant-controls">
          <div className="restaurant-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search pharmacies by name or area..."
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
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Top Rated</option>
              <option value="delivery">Lowest Fee</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading pharmacies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">💊</div>
            <h2>No pharmacies found</h2>
            <p>
              {search
                ? 'Try a different search term'
                : 'Pharmacies will appear here soon'}
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
                      {isOpen ? '● Open' : '● Closed'}
                    </div>
                    {p.rating != null && (
                      <div className="all-restaurant-rating">
                        ⭐ {p.rating.toFixed ? p.rating.toFixed(1) : p.rating}
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
                      📍 {p.address || 'Araihazar'}
                    </p>
                    <div className="all-restaurant-meta">
                      <span>🕐 {p.deliveryTime || '20-30 min'}</span>
                      <span>💊 Medicines</span>
                    </div>
                    <button className="restaurant-menu-button">
                      Browse Medicines →
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