// ============================================================
// src/pages/admin/AdminPharmaciesPage.jsx
// With Documents Review Modal (License + NID)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import MapPicker from '../../components/MapPicker'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Eye,
} from 'lucide-react'

function AdminPharmaciesPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState(null)

  const [form, setForm] = useState({
    pharmacyName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    description: '',
    deliveryFee: '0',
    minimumOrder: '0',
    deliveryTime: '20-30 min',
    openingTime: '09:00',
    closingTime: '22:00',
    location: null,
    status: 'approved',
    pharmacyStatus: 'offline',
    rating: '',
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pharmacies'), (snap) => {
      const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime() || 0
        const bT = b.createdAt?.toDate?.()?.getTime() || 0
        return bT - aT
      })
      setPharmacies(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    let r = [...pharmacies]
    if (statusFilter !== 'all') {
      r = r.filter((p) => p.status === statusFilter)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      r = r.filter((p) =>
        `${p.pharmacyName || ''} ${p.email || ''} ${p.phone || ''} ${
          p.address || ''
        }`
          .toLowerCase()
          .includes(s)
      )
    }
    return r
  }, [pharmacies, statusFilter, search])

  const stats = useMemo(
    () => ({
      total: pharmacies.length,
      approved: pharmacies.filter((p) => p.status === 'approved').length,
      pending: pharmacies.filter((p) => p.status === 'pending').length,
      rejected: pharmacies.filter((p) => p.status === 'rejected').length,
    }),
    [pharmacies]
  )

  const resetForm = () => {
    setEditingId(null)
    setForm({
      pharmacyName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      logo: '',
      description: '',
      deliveryFee: '0',
      minimumOrder: '0',
      deliveryTime: '20-30 min',
      openingTime: '09:00',
      closingTime: '22:00',
      location: null,
      status: 'approved',
      pharmacyStatus: 'offline',
      rating: '',
    })
  }

  const handleSubmit = async () => {
    if (!form.pharmacyName.trim()) {
      toast.error('Pharmacy name required')
      return
    }
    setSaving(true)
    try {
      const data = {
        pharmacyName: form.pharmacyName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        logo: form.logo,
        description: form.description.trim(),
        deliveryFee: parseFloat(form.deliveryFee) || 0,
        minimumOrder: parseFloat(form.minimumOrder) || 0,
        deliveryTime: form.deliveryTime.trim(),
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        status: form.status,
        pharmacyStatus: form.pharmacyStatus,
        rating: form.rating ? parseFloat(form.rating) : 0,
        updatedAt: serverTimestamp(),
      }
      if (form.location?.lat && form.location?.lng) {
        data.location = {
          lat: form.location.lat,
          lng: form.location.lng,
        }
      }

      if (editingId) {
        await updateDoc(doc(db, 'pharmacies', editingId), data)
        toast.success('Pharmacy updated!')
      } else {
        await addDoc(collection(db, 'pharmacies'), {
          ...data,
          reviewCount: 0,
          createdAt: serverTimestamp(),
        })
        toast.success('Pharmacy created!')
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (p) => {
    setEditingId(p.firebaseId)
    setForm({
      pharmacyName: p.pharmacyName || '',
      ownerName: p.ownerName || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      logo: p.logo || '',
      description: p.description || '',
      deliveryFee: String(p.deliveryFee || 0),
      minimumOrder: String(p.minimumOrder || 0),
      deliveryTime: p.deliveryTime || '20-30 min',
      openingTime: p.openingTime || '09:00',
      closingTime: p.closingTime || '22:00',
      location: p.location?.lat && p.location?.lng ? p.location : null,
      status: p.status || 'approved',
      pharmacyStatus: p.pharmacyStatus || 'offline',
      rating: p.rating != null ? String(p.rating) : '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deletePharmacy = async (id, name) => {
    if (
      !window.confirm(
        `Delete "${name}" permanently? This will NOT delete its medicines.`
      )
    )
      return
    try {
      await deleteDoc(doc(db, 'pharmacies', id))
      toast.success('Pharmacy deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const updateStatus = async (id, newStatus, name) => {
    if (!window.confirm(`Set "${name}" as ${newStatus}?`)) return
    try {
      await updateDoc(doc(db, 'pharmacies', id), { status: newStatus })
      toast.success(`"${name}" marked as ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
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
            <Menu size={22} />
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
            <h1 className="admin-page-title">Pharmacies</h1>
            <p className="admin-page-sub">Manage pharmacy partners</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              resetForm()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Pharmacy'}
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-content">
              <span className="admin-stat-label">Approved</span>
              <strong className="admin-stat-value">{stats.approved}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-content">
              <span className="admin-stat-label">Pending</span>
              <strong className="admin-stat-value">{stats.pending}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-content">
              <span className="admin-stat-label">Rejected</span>
              <strong className="admin-stat-value">{stats.rejected}</strong>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="admin-section" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '18px' }}>
              {editingId ? '✏️ Edit Pharmacy' : '➕ New Pharmacy'}
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Pharmacy Name *</label>
                  <input
                    type="text"
                    value={form.pharmacyName}
                    onChange={(e) =>
                      setForm({ ...form, pharmacyName: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="e.g., Arai Pharmacy"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Owner Name</label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) =>
                      setForm({ ...form, ownerName: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Delivery Fee (৳)</label>
                  <input
                    type="number"
                    value={form.deliveryFee}
                    onChange={(e) =>
                      setForm({ ...form, deliveryFee: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Minimum Order (৳)</label>
                  <input
                    type="number"
                    value={form.minimumOrder}
                    onChange={(e) =>
                      setForm({ ...form, minimumOrder: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Delivery Time</label>
                  <input
                    type="text"
                    value={form.deliveryTime}
                    onChange={(e) =>
                      setForm({ ...form, deliveryTime: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="20-30 min"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Rating (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Opening Time</label>
                  <input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) =>
                      setForm({ ...form, openingTime: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Closing Time</label>
                  <input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) =>
                      setForm({ ...form, closingTime: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  📍 Location (click map to set)
                </label>
                <MapPicker
                  position={form.location}
                  setPosition={(loc) =>
                    setForm({ ...form, location: loc })
                  }
                  height={300}
                  helperText="👆 Click map to set pharmacy location"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  padding: '14px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Save size={16} />{' '}
                {saving
                  ? 'Saving...'
                  : editingId
                  ? 'Update Pharmacy'
                  : 'Create Pharmacy'}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="admin-section" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
              <Search size={18} />
              <input
                type="text"
                placeholder="Search pharmacies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  minWidth: 0,
                }}
              />
            </div>
            {['all', 'approved', 'pending', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background:
                    statusFilter === s
                      ? 'linear-gradient(135deg, #059669, #047857)'
                      : 'var(--surface)',
                  color:
                    statusFilter === s
                      ? '#FFFFFF'
                      : 'var(--text-secondary)',
                  border:
                    statusFilter === s
                      ? 'none'
                      : '1px solid var(--border-strong)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading pharmacies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>💊</p>
            <h3>No pharmacies yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Click "New Pharmacy" to add one
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filtered.map((p) => {
              const badgeMap = {
                approved: {
                  color: '#16a34a',
                  bg: 'rgba(22,163,74,0.12)',
                  label: 'Approved',
                },
                pending: {
                  color: '#f59e0b',
                  bg: 'rgba(245,158,11,0.12)',
                  label: 'Pending',
                },
                rejected: {
                  color: '#dc2626',
                  bg: 'rgba(220,38,38,0.12)',
                  label: 'Rejected',
                },
              }
              const badge = badgeMap[p.status] || badgeMap.pending
              return (
                <div
                  key={p.firebaseId}
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
                    }}
                  >
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      '💊'
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: 800,
                        marginBottom: '4px',
                      }}
                    >
                      {p.pharmacyName}
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
                      <span>📍 {p.address || '—'}</span>
                      <span>📧 {p.email || '—'}</span>
                      <span>🚚 ৳{p.deliveryFee || 0}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    📞 {p.phone || '—'}
                    <div
                      style={{
                        color: 'var(--text-tertiary)',
                        marginTop: '4px',
                        fontSize: '11.5px',
                      }}
                    >
                      Joined {formatDate(p.createdAt)}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: badge.bg,
                      color: badge.color,
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {badge.label}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setViewing(p)}
                      title="View Documents & Details"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: '#2563EB',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => openEdit(p)}
                      title="Edit"
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

                    {p.status !== 'approved' && (
                      <button
                        onClick={() =>
                          updateStatus(
                            p.firebaseId,
                            'approved',
                            p.pharmacyName
                          )
                        }
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

                    {p.status !== 'rejected' && (
                      <button
                        onClick={() =>
                          updateStatus(
                            p.firebaseId,
                            'rejected',
                            p.pharmacyName
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
                        deletePharmacy(p.firebaseId, p.pharmacyName)
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
      {/* VIEW DETAILS MODAL — Documents Review */}
      {/* ============================================================ */}
      {viewing && (
        <div
          className="outside-area-modal"
          onClick={() => setViewing(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: '24px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px dashed var(--border)',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: 800,
                  }}
                >
                  {viewing.pharmacyName}
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  Application Documents Review
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Pharmacy Info */}
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                🏪 Pharmacy Information
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                }}
              >
                <InfoRow label="Pharmacy" value={viewing.pharmacyName} />
                <InfoRow label="Owner" value={viewing.ownerName} />
                <InfoRow label="Email" value={viewing.email} />
                <InfoRow label="Phone" value={viewing.phone} />
                <InfoRow label="Address" value={viewing.address} />
                <InfoRow
                  label="Delivery Fee"
                  value={`৳${viewing.deliveryFee || 0}`}
                />
                <InfoRow
                  label="Minimum Order"
                  value={`৳${viewing.minimumOrder || 0}`}
                />
                <InfoRow
                  label="Status"
                  value={viewing.status?.toUpperCase()}
                />
              </div>
            </div>

            {/* Documents */}
            <div
              style={{
                padding: '18px',
                borderRadius: '16px',
                background:
                  'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',
                border: '1px solid rgba(245,158,11,0.25)',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#D97706',
                  margin: '0 0 14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                📄 Required Documents
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Drug License */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong style={{ fontSize: '13px', fontWeight: 800 }}>
                      💊 Drug License
                    </strong>
                    {viewing.drugLicenseNumber && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          background: 'var(--surface)',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                        }}
                      >
                        {viewing.drugLicenseNumber}
                      </span>
                    )}
                  </div>
                  {viewing.drugLicenseImage ? (
                    <img
                      src={viewing.drugLicenseImage}
                      alt="Drug License"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        cursor: 'zoom-in',
                      }}
                      onClick={() =>
                        window.open(viewing.drugLicenseImage, '_blank')
                      }
                    />
                  ) : (
                    <div
                      style={{
                        padding: '30px',
                        textAlign: 'center',
                        background: 'var(--surface)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ No license image uploaded
                    </div>
                  )}
                </div>

                {/* Owner NID */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong style={{ fontSize: '13px', fontWeight: 800 }}>
                      🪪 Owner NID
                    </strong>
                    {viewing.ownerNidNumber && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          background: 'var(--surface)',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                        }}
                      >
                        {viewing.ownerNidNumber}
                      </span>
                    )}
                  </div>
                  {viewing.ownerNidImage ? (
                    <img
                      src={viewing.ownerNidImage}
                      alt="Owner NID"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        cursor: 'zoom-in',
                      }}
                      onClick={() =>
                        window.open(viewing.ownerNidImage, '_blank')
                      }
                    />
                  ) : (
                    <div
                      style={{
                        padding: '30px',
                        textAlign: 'center',
                        background: 'var(--surface)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ No NID image uploaded
                    </div>
                  )}
                </div>
              </div>

              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                }}
              >
                💡 Click on images to view full size
              </p>
            </div>

            {/* Actions */}
            {viewing.status !== 'approved' && (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => {
                    updateStatus(
                      viewing.firebaseId,
                      'approved',
                      viewing.pharmacyName
                    )
                    setViewing(null)
                  }}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '14px',
                    borderRadius: '999px',
                    background:
                      'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  }}
                >
                  ✅ Approve Pharmacy
                </button>
                <button
                  onClick={() => {
                    updateStatus(
                      viewing.firebaseId,
                      'rejected',
                      viewing.pharmacyName
                    )
                    setViewing(null)
                  }}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '14px',
                    borderRadius: '999px',
                    background: 'rgba(220,38,38,0.1)',
                    color: '#DC2626',
                    border: '1px solid rgba(220,38,38,0.3)',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ❌ Reject
                </button>
              </div>
            )}

            {viewing.status === 'approved' && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '999px',
                  background: 'rgba(22,163,74,0.1)',
                  color: '#16a34a',
                  textAlign: 'center',
                  fontSize: '13.5px',
                  fontWeight: 800,
                }}
              >
                ✅ Already Approved
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Info row helper component
function InfoRow({ label, value }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontSize: '10.5px',
          fontWeight: 800,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '3px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '13.5px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          wordBreak: 'break-word',
        }}
      >
        {value || '—'}
      </div>
    </div>
  )
}

export default AdminPharmaciesPage