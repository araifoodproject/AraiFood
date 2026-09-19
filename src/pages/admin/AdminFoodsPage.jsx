import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Eye,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Trash2,
  Store,
} from 'lucide-react'

function AdminFoodsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [foods, setFoods] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  // Load foods
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'foods'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || new Date(a.createdAt).getTime?.() || 0
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || new Date(b.createdAt).getTime?.() || 0
          return bTime - aTime
        })
        setFoods(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Load restaurants (for name mapping)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setRestaurants(list)
    })
    return () => unsubscribe()
  }, [])

  const getRestaurantName = (restaurantId) => {
    const r = restaurants.find((x) => x.firebaseId === restaurantId)
    return r?.restaurantName || 'Unknown Restaurant'
  }

  const filteredFoods = useMemo(() => {
    let result = [...foods]

    if (restaurantFilter !== 'all') {
      result = result.filter((f) => f.restaurantId === restaurantFilter)
    }

    if (availabilityFilter === 'available') {
      result = result.filter((f) => f.available !== false)
    } else if (availabilityFilter === 'unavailable') {
      result = result.filter((f) => f.available === false)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((f) =>
        `${f.name || ''} ${f.category || ''} ${f.description || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [foods, restaurantFilter, availabilityFilter, search])

  const stats = useMemo(() => {
    return {
      total: foods.length,
      available: foods.filter((f) => f.available !== false).length,
      unavailable: foods.filter((f) => f.available === false).length,
      discounted: foods.filter((f) => f.discountPrice).length,
    }
  }, [foods])

  const toggleAvailability = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'foods', firebaseId), {
        available: !current,
      })
      toast.success(`Marked as ${!current ? 'available' : 'unavailable'}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteFood = async (firebaseId, name) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return
    try {
      await deleteDoc(doc(db, 'foods', firebaseId))
      toast.success(`"${name}" deleted`)
      if (selected?.firebaseId === firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
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
            <h1 className="admin-page-title">Food Menu</h1>
            <p className="admin-page-sub">
              Browse and manage every food item across all restaurants.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <UtensilsCrossed size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Foods</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Available</span>
              <strong className="admin-stat-value">{stats.available}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <XCircle size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Unavailable</span>
              <strong className="admin-stat-value">{stats.unavailable}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              💰
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Discounted</span>
              <strong className="admin-stat-value">{stats.discounted}</strong>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="admin-section" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border)',
              }}
            >
              <Search size={18} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search by name, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  minWidth: 0,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'var(--surface)',
                    border: 'none',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '180px',
              }}
            >
              <option value="all">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r.firebaseId} value={r.firebaseId}>
                  {r.restaurantName}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAvailabilityFilter(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background:
                      availabilityFilter === opt.value
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface)',
                    color:
                      availabilityFilter === opt.value ? '#FFFFFF' : 'var(--text-secondary)',
                    border:
                      availabilityFilter === opt.value
                        ? 'none'
                        : '1px solid var(--border-strong)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading foods...</p>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="admin-section" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🍔</p>
            <h3>No foods found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || restaurantFilter !== 'all' || availabilityFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'No food items yet.'}
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredFoods.map((f) => (
              <div
                key={f.firebaseId}
                style={{
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '18px',
                  marginBottom: '12px',
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #FFF7ED, #ECFDF5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={f.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    f.emoji || '🍽️'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <strong
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    {f.name}
                  </strong>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>🏷️ {f.category || 'General'}</span>
                    <span>
                      🏪 {getRestaurantName(f.restaurantId)}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div style={{ minWidth: '100px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#059669',
                    }}
                  >
                    ৳{f.discountPrice || f.price}
                  </div>
                  {f.discountPrice && (
                    <del
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      ৳{f.price}
                    </del>
                  )}
                </div>

                {/* Status */}
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background:
                        f.available !== false
                          ? 'rgba(22,163,74,0.12)'
                          : 'rgba(220,38,38,0.12)',
                      color: f.available !== false ? '#16a34a' : '#dc2626',
                      fontSize: '12px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.available !== false ? '✓ Available' : '✗ Out'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setSelected(f)}
                    title="View Details"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => toggleAvailability(f.firebaseId, f.available !== false)}
                    title={f.available !== false ? 'Mark Unavailable' : 'Mark Available'}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background:
                        f.available !== false
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(22,163,74,0.12)',
                      border:
                        f.available !== false
                          ? '1px solid rgba(245,158,11,0.3)'
                          : '1px solid rgba(22,163,74,0.3)',
                      color: f.available !== false ? '#f59e0b' : '#16a34a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {f.available !== false ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                  </button>

                  <button
                    onClick={() => deleteFood(f.firebaseId, f.name)}
                    title="Delete"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div
          className="outside-area-modal"
          onClick={() => setSelected(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              textAlign: 'left',
              padding: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 10,
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Food Details
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word',
                  }}
                >
                  {selected.name}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selected.image && (
                <img
                  src={selected.image}
                  alt={selected.name}
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '12px' }}
                />
              )}

              <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Row label="🏷️ Category" value={selected.category} />
                <Row label="🏪 Restaurant" value={getRestaurantName(selected.restaurantId)} />
                <Row label="💵 Price" value={`৳${selected.price}`} />
                {selected.discountPrice && (
                  <Row label="🎉 Discount Price" value={`৳${selected.discountPrice}`} />
                )}
                <Row label="✅ Status" value={selected.available !== false ? 'Available' : 'Unavailable'} />
              </div>

              {selected.description && (
                <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    📝 Description
                  </strong>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selected.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13.5px' }}>
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <strong style={{ color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-word' }}>{value || '—'}</strong>
    </div>
  )
}

export default AdminFoodsPage