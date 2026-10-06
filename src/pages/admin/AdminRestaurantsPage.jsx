// ============================================================
// src/pages/admin/AdminRestaurantsPage.jsx
// V2 — Location check before Approve
// + Location required warning in list
// + Approve button disabled if no location
// + Quick edit to add location
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import MapPicker from '../../components/MapPicker'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Store,
  Clock,
  Eye,
  Trash2,
  Pencil,
  Save,
  MapPin,
  AlertTriangle,
} from 'lucide-react'

function AdminRestaurantsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  // Edit state
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    rating: '',
    deliveryTime: '',
    isOpen: true,
    location: null,
    deliveryFee: '',
    minimumOrder: '',
  })

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'restaurants'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0
          return bTime - aTime
        })
        setRestaurants(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.restaurantName || ''} ${r.email || ''} ${r.phone || ''} ${
          r.cuisine || ''
        }`
          .toLowerCase()
          .includes(q)
      )
    }
    return result
  }, [restaurants, statusFilter, search])

  const stats = useMemo(() => {
    return {
      total: restaurants.length,
      pending: restaurants.filter((r) => r.status === 'pending').length,
      approved: restaurants.filter((r) => r.status === 'approved').length,
      rejected: restaurants.filter((r) => r.status === 'rejected').length,
      noLocation: restaurants.filter(
        (r) => !r.location?.lat || !r.location?.lng
      ).length,
    }
  }, [restaurants])

  // ============================================================
  // UPDATE STATUS — with location check for approve
  // ============================================================
  const updateStatus = async (firebaseId, newStatus, name, restaurant) => {
    // ✅ Approve করার আগে location check
    if (newStatus === 'approved') {
      const hasLocation = restaurant?.location?.lat && restaurant?.location?.lng
      if (!hasLocation) {
        const confirmed = window.confirm(
          `⚠️ "${name}" এর location set করা নেই!\n\n` +
            `Location ছাড়া customer কে কাছের restaurant হিসেবে দেখানো যাবে না।\n\n` +
            `আপনি কি location ছাড়াই approve করতে চান?\n\n` +
            `(Recommended: আগে Edit করে location set করুন)`
        )
        if (!confirmed) {
          // Edit modal খুলবো location set করার জন্য
          openEdit(restaurant)
          return
        }
      } else {
        if (!window.confirm(`Approve "${name}"?`)) return
      }
    } else if (newStatus === 'rejected') {
      if (!window.confirm(`Reject "${name}"?`)) return
    }

    try {
      await updateDoc(doc(db, 'restaurants', firebaseId), {
        status: newStatus,
      })
      toast.success(`"${name}" ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteRestaurant = async (firebaseId, name) => {
    if (
      !window.confirm(
        `Delete "${name}" permanently? This will NOT delete their food items or orders.`
      )
    )
      return
    try {
      await deleteDoc(doc(db, 'restaurants', firebaseId))
      toast.success(`"${name}" deleted`)
      if (selected?.firebaseId === firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  // ============================================================
  // Edit handlers
  // ============================================================
  const openEdit = (r) => {
    setEditing(r)
    setForm({
      rating: r.rating != null ? String(r.rating) : '',
      deliveryTime: r.deliveryTime || r.delivery || '',
      isOpen:
        r.isOpen != null
          ? r.isOpen
          : r.restaurantStatus === 'online' ||
            r.restaurantStatus === 'busy',
      location:
        r.location?.lat && r.location?.lng ? r.location : null,
      deliveryFee: r.deliveryFee != null ? String(r.deliveryFee) : '',
      minimumOrder: r.minimumOrder != null ? String(r.minimumOrder) : '',
    })
  }

  const closeEdit = () => {
    setEditing(null)
    setForm({
      rating: '',
      deliveryTime: '',
      isOpen: true,
      location: null,
      deliveryFee: '',
      minimumOrder: '',
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const updateData = {
        rating: form.rating !== '' ? parseFloat(form.rating) : 0,
        deliveryTime: form.deliveryTime.trim(),
        isOpen: form.isOpen,
        restaurantStatus: form.isOpen ? 'online' : 'offline',
        deliveryFee:
          form.deliveryFee !== '' ? parseFloat(form.deliveryFee) : 0,
        minimumOrder:
          form.minimumOrder !== '' ? parseFloat(form.minimumOrder) : 0,
      }
      if (form.location?.lat && form.location?.lng) {
        updateData.location = {
          lat: form.location.lat,
          lng: form.location.lng,
        }
      }
      await updateDoc(doc(db, 'restaurants', editing.firebaseId), updateData)
      toast.success('✅ Restaurant updated!')
      closeEdit()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
      },
      approved: {
        label: 'Approved',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.12)',
      },
      rejected: {
        label: 'Rejected',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.12)',
      },
    }
    return map[status] || map.pending
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString()
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-strong)',
    background: 'var(--surface)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  }
  const gridTwo = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
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
            <h1 className="admin-page-title">Restaurants</h1>
            <p className="admin-page-sub">
              Approve, reject, and manage all restaurant partners.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Store size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Restaurants</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Clock size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Pending Approval</span>
              <strong className="admin-stat-value">{stats.pending}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Approved</span>
              <strong className="admin-stat-value">{stats.approved}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <XCircle size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Rejected</span>
              <strong className="admin-stat-value">{stats.rejected}</strong>
            </div>
          </div>
        </div>

        {/* Location warning banner */}
        {stats.noLocation > 0 && (
          <div
            className="admin-section"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              background:
                'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(220,38,38,0.06))',
              border: '1px solid rgba(245,158,11,0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <AlertTriangle
                size={20}
                color="#F59E0B"
                strokeWidth={2.4}
                style={{ flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#92400E',
                    marginBottom: '2px',
                  }}
                >
                  ⚠️ {stats.noLocation} restaurant
                  {stats.noLocation !== 1 ? 's' : ''} without location
                </strong>
                <span
                  style={{
                    fontSize: '12.5px',
                    color: '#78350F',
                    fontWeight: 600,
                  }}
                >
                  Location ছাড়া customer কে কাছের restaurant হিসেবে দেখানো
                  যাবে না। Edit করে location set করুন।
                </span>
              </div>
            </div>
          </div>
        )}

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
                placeholder="Search by name, email, phone, cuisine..."
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

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background:
                      statusFilter === opt.value
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface)',
                    color:
                      statusFilter === opt.value
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    border:
                      statusFilter === opt.value
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
            <p>Loading restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏪</p>
            <h3>No restaurants found</h3>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredRestaurants.map((r) => {
              const badge = getStatusBadge(r.status)
              const hasLocation = r.location?.lat && r.location?.lng
              return (
                <div
                  key={r.firebaseId}
                  style={{
                    background: 'var(--surface-soft)',
                    border: hasLocation
                      ? '1px solid var(--border)'
                      : '1px solid rgba(220,38,38,0.4)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background:
                        'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {r.logo ? (
                      <img
                        src={r.logo}
                        alt={r.restaurantName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      '🏪'
                    )}
                  </div>

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
                      {r.restaurantName}
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
                      <span>🍽️ {r.cuisine || 'Restaurant'}</span>
                      <span>📧 {r.email}</span>
                      {r.rating != null && <span>⭐ {r.rating}</span>}
                      {r.deliveryTime && <span>🕐 {r.deliveryTime}</span>}
                    </div>
                    {!hasLocation ? (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#dc2626',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: 'rgba(220,38,38,0.1)',
                        }}
                      >
                        <AlertTriangle size={12} strokeWidth={2.6} />
                        Location missing
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin size={12} strokeWidth={2.6} />
                        Location set
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: '140px', fontSize: '12.5px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      📞 {r.phone || '—'}
                    </div>
                    <div
                      style={{
                        color: 'var(--text-tertiary)',
                        marginTop: '4px',
                      }}
                    >
                      Joined {formatDate(r.createdAt)}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEdit(r)}
                      title="Edit Details"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(5,150,105,0.12)',
                        border: '1px solid rgba(5,150,105,0.3)',
                        color: '#059669',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => setSelected(r)}
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

                    {r.status !== 'approved' && (
                      <button
                        onClick={() =>
                          updateStatus(
                            r.firebaseId,
                            'approved',
                            r.restaurantName,
                            r
                          )
                        }
                        title={
                          hasLocation
                            ? 'Approve'
                            : 'Approve (no location)'
                        }
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: hasLocation
                            ? 'rgba(22,163,74,0.12)'
                            : 'rgba(245,158,11,0.12)',
                          border: hasLocation
                            ? '1px solid rgba(22,163,74,0.3)'
                            : '1px solid rgba(245,158,11,0.3)',
                          color: hasLocation ? '#16a34a' : '#f59e0b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}

                    {r.status !== 'rejected' && (
                      <button
                        onClick={() =>
                          updateStatus(
                            r.firebaseId,
                            'rejected',
                            r.restaurantName,
                            r
                          )
                        }
                        title="Reject"
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
                        <XCircle size={16} />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        deleteRestaurant(r.firebaseId, r.restaurantName)
                      }
                      title="Delete"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(107,114,128,0.12)',
                        border: '1px solid rgba(107,114,128,0.3)',
                        color: '#6B7280',
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
              )
            })}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* VIEW DETAILS MODAL */}
      {/* ============================================================ */}
      {selected && (
        <div
          className="outside-area-modal"
          onClick={() => setSelected(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '560px', textAlign: 'left' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, textAlign: 'left' }}>
                {selected.restaurantName}
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {selected.logo && (
                <img
                  src={selected.logo}
                  alt={selected.restaurantName}
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                />
              )}

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  📧 EMAIL
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.email}</p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  👤 OWNER
                </strong>
                <p style={{ margin: '4px 0' }}>
                  {selected.ownerName || '—'}
                </p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  📞 PHONE
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.phone || '—'}</p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  🍽️ CUISINE
                </strong>
                <p style={{ margin: '4px 0' }}>
                  {selected.cuisine || '—'}
                </p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  📍 ADDRESS
                </strong>
                <p style={{ margin: '4px 0' }}>
                  {selected.address || '—'}
                </p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  🗺️ LOCATION
                </strong>
                <p style={{ margin: '4px 0' }}>
                  {selected.location?.lat && selected.location?.lng ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>
                      ✅ {selected.location.lat.toFixed(4)},{' '}
                      {selected.location.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      ⚠️ Not set — click Edit to add
                    </span>
                  )}
                </p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  🕐 HOURS
                </strong>
                <p style={{ margin: '4px 0' }}>
                  {selected.openingTime || '10:00'} -{' '}
                  {selected.closingTime || '22:00'}
                </p>
              </div>

              <div>
                <strong
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                >
                  📦 MIN ORDER / DELIVERY FEE
                </strong>
                <p style={{ margin: '4px 0' }}>
                  ৳{selected.minimumOrder || 100} / ৳
                  {selected.deliveryFee || 30}
                </p>
              </div>

              {selected.description && (
                <div>
                  <strong
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    📝 DESCRIPTION
                  </strong>
                  <p style={{ margin: '4px 0' }}>
                    {selected.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT MODAL */}
      {/* ============================================================ */}
      {editing && (
        <div className="outside-area-modal" onClick={closeEdit}>
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '720px',
              textAlign: 'left',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, textAlign: 'left' }}>
                  Edit {editing.restaurantName}
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Owner info cannot be edited here — owner edits via their
                  panel.
                </p>
              </div>
              <button
                onClick={closeEdit}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>⭐ Rating (0 - 5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value })
                    }
                    placeholder="4.5"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>🕐 Delivery Time</label>
                  <input
                    type="text"
                    value={form.deliveryTime}
                    onChange={(e) =>
                      setForm({ ...form, deliveryTime: e.target.value })
                    }
                    placeholder="30-40 min"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>🚚 Delivery Fee (৳)</label>
                  <input
                    type="number"
                    value={form.deliveryFee}
                    onChange={(e) =>
                      setForm({ ...form, deliveryFee: e.target.value })
                    }
                    placeholder="30"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>📦 Minimum Order (৳)</label>
                  <input
                    type="number"
                    value={form.minimumOrder}
                    onChange={(e) =>
                      setForm({ ...form, minimumOrder: e.target.value })
                    }
                    placeholder="100"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
                  style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '999px',
                    border: 'none',
                    background: form.isOpen ? '#059669' : '#cbd5e1',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: form.isOpen ? '23px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
                <div>
                  <strong
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      display: 'block',
                    }}
                  >
                    {form.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                  </strong>
                  <small
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Toggle to show the restaurant as open for customers
                  </small>
                </div>
              </div>

              {/* Location */}
              <div>
                <label style={labelStyle}>
                  📍 Restaurant Location{' '}
                  {!form.location?.lat && (
                    <span style={{ color: '#DC2626' }}>* Required</span>
                  )}
                </label>
                {!form.location?.lat && (
                  <p
                    style={{
                      fontSize: '11.5px',
                      color: '#DC2626',
                      fontWeight: 700,
                      marginBottom: '8px',
                      marginTop: '-2px',
                    }}
                  >
                    ⚠️ Location ছাড়া approve করা recommended না
                  </p>
                )}
                <MapPicker
                  position={form.location}
                  setPosition={(loc) => setForm({ ...form, location: loc })}
                  height={300}
                  helperText="👆 Click on the map to set the restaurant's exact location"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  marginTop: '6px',
                }}
              >
                <button                  onClick={closeEdit}
                  disabled={saving}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '999px',
                    background: 'var(--surface-soft)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '999px',
                    background: saving
                      ? 'var(--surface-soft)'
                      : 'linear-gradient(135deg, #059669, #047857)',
                    color: saving ? 'var(--text-tertiary)' : '#FFFFFF',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRestaurantsPage