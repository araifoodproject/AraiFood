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
  Bike,
  Clock,
  Eye,
  Phone,
  Mail,
  Trash2,
  Star,
} from 'lucide-react'

function AdminRidersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'riders'),
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
        setRiders(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredRiders = useMemo(() => {
    let result = [...riders]
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.fullName || ''} ${r.email || ''} ${r.phone || ''} ${r.nidNumber || ''}`
          .toLowerCase()
          .includes(q)
      )
    }
    return result
  }, [riders, statusFilter, search])

  const stats = useMemo(() => {
    return {
      total: riders.length,
      pending: riders.filter((r) => r.status === 'pending').length,
      approved: riders.filter((r) => r.status === 'approved').length,
      rejected: riders.filter((r) => r.status === 'rejected').length,
    }
  }, [riders])

  const updateStatus = async (firebaseId, newStatus, name) => {
    if (!window.confirm(`${newStatus === 'approved' ? 'Approve' : 'Reject'} "${name}"?`)) return
    try {
      await updateDoc(doc(db, 'riders', firebaseId), {
        status: newStatus,
      })
      toast.success(`"${name}" ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteRider = async (firebaseId, name) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return
    try {
      await deleteDoc(doc(db, 'riders', firebaseId))
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
            <h1 className="admin-page-title">Riders</h1>
            <p className="admin-page-sub">
              Approve, reject, and manage delivery riders.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Bike size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Riders</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Clock size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Pending</span>
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
                placeholder="Search by name, email, phone, NID..."
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
            <p>Loading riders...</p>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="admin-section" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🛵</p>
            <h3>No riders found</h3>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredRiders.map((r) => {
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
                  {/* Avatar */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {r.profileImage ? (
                      <img
                        src={r.profileImage}
                        alt={r.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      '🛵'
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
                      {r.fullName}
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
                      <span>📧 {r.email}</span>
                      <span>📞 {r.phone}</span>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div style={{ minWidth: '140px', fontSize: '12.5px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      🛵 {r.vehicleType || 'Motorcycle'}
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
                        onClick={() => updateStatus(r.firebaseId, 'approved', r.fullName)}
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
                        onClick={() => updateStatus(r.firebaseId, 'rejected', r.fullName)}
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
                      onClick={() => deleteRider(r.firebaseId, r.fullName)}
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
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: 0 }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {selected.profileImage ? (
                    <img
                      src={selected.profileImage}
                      alt={selected.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    '🛵'
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
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
                    {selected.fullName}
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selected.email}
                  </p>
                </div>
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
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Personal Info */}
              <div>
                <strong style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  👤 Personal Info
                </strong>
                <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Row label="📞 Phone" value={selected.phone} />
                  <Row label="🆔 NID Number" value={selected.nidNumber} />
                  <Row label="🎂 Date of Birth" value={selected.dob} />
                  <Row label="📍 Address" value={selected.address} />
                </div>
              </div>

              {/* Vehicle */}
              <div>
                <strong style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  🛵 Vehicle
                </strong>
                <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Row label="🚗 Vehicle Type" value={selected.vehicleType} />
                  <Row label="🔢 Vehicle Number" value={selected.vehicleNumber} />
                  <Row label="🪪 License" value={selected.licenseNumber} />
                </div>
              </div>

              {/* Stats */}
              <div>
                <strong style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  📊 Performance
                </strong>
                <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Row label="⭐ Rating" value={`${selected.rating || 0} / 5`} />
                  <Row label="📦 Total Deliveries" value={selected.totalDeliveries || 0} />
                  <Row label="💰 Total Earnings" value={`৳${selected.totalEarnings || 0}`} />
                </div>
              </div>

              {/* Documents */}
              {(selected.nidImage || selected.vehicleImage) && (
                <div>
                  <strong style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                    📎 Documents
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {selected.nidImage && (
                      <div style={{ padding: '10px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>NID</span>
                        <img src={selected.nidImage} alt="NID" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    )}
                    {selected.vehicleImage && (
                      <div style={{ padding: '10px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Vehicle</span>
                        <img src={selected.vehicleImage} alt="Vehicle" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Small helper for rows
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13.5px' }}>
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <strong style={{ color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-word' }}>{value || '—'}</strong>
    </div>
  )
}

export default AdminRidersPage