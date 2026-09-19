import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
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
  MapPin,
  Phone,
  Mail,
  Trash2,
} from 'lucide-react'

function AdminRestaurantsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

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
        `${r.restaurantName || ''} ${r.email || ''} ${r.phone || ''} ${r.cuisine || ''}`
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
    }
  }, [restaurants])

  const updateStatus = async (firebaseId, newStatus, name) => {
    if (!window.confirm(`${newStatus === 'approved' ? 'Approve' : 'Reject'} "${name}"?`)) return
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
    if (!window.confirm(`Delete "${name}" permanently? This will NOT delete their food items or orders.`)) return
    try {
      await deleteDoc(doc(db, 'restaurants', firebaseId))
      toast.success(`"${name}" deleted`)
      if (selected?.firebaseId === firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      approved: { label: 'Approved', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
      rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    }
    return map[status] || map.pending
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString()
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
                      statusFilter === opt.value ? '#FFFFFF' : 'var(--text-secondary)',
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
          <div className="admin-section" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏪</p>
            <h3>No restaurants found</h3>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredRestaurants.map((r) => {
              const badge = getStatusBadge(r.status)
              return (
                <div
                  key={r.firebaseId}
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
                  {/* Logo/Emoji */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
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
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      '🏪'
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
                    </div>
                  </div>

                  {/* Contact */}
                  <div style={{ minWidth: '140px', fontSize: '12.5px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      📞 {r.phone || '—'}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Joined {formatDate(r.createdAt)}
                    </div>
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

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
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
                        onClick={() => updateStatus(r.firebaseId, 'approved', r.restaurantName)}
                        title="Approve"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(22,163,74,0.12)',
                          border: '1px solid rgba(22,163,74,0.3)',
                          color: '#16a34a',
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
                        onClick={() => updateStatus(r.firebaseId, 'rejected', r.restaurantName)}
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
                      onClick={() => deleteRestaurant(r.firebaseId, r.restaurantName)}
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

      {/* Detail Modal */}
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
              <h2 style={{ margin: 0, textAlign: 'left' }}>{selected.restaurantName}</h2>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  📧 EMAIL
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.email}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  👤 OWNER
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.ownerName || '—'}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  📞 PHONE
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.phone || '—'}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  🍽️ CUISINE
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.cuisine || '—'}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  📍 ADDRESS
                </strong>
                <p style={{ margin: '4px 0' }}>{selected.address || '—'}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  🕐 HOURS
                </strong>
                <p style={{ margin: '4px 0' }}>
                  {selected.openingTime || '10:00'} - {selected.closingTime || '22:00'}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  📦 MIN ORDER / DELIVERY FEE
                </strong>
                <p style={{ margin: '4px 0' }}>
                  ৳{selected.minimumOrder || 100} / ৳{selected.deliveryFee || 30}
                </p>
              </div>

              {selected.description && (
                <div>
                  <strong style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    📝 DESCRIPTION
                  </strong>
                  <p style={{ margin: '4px 0' }}>{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRestaurantsPage