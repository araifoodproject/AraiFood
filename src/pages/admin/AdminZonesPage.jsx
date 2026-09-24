// ============================================================
// src/pages/admin/AdminZonesPage.jsx
// SIMPLIFIED — no polygon, just zone name + delivery fee
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
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Power,
} from 'lucide-react'

function AdminZonesPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [zoneName, setZoneName] = useState('')
  const [zoneFee, setZoneFee] = useState('30')
  const [zoneDescription, setZoneDescription] = useState('')
  const [zoneActive, setZoneActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'deliveryZones'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          const aTime =
            a.createdAt?.toDate?.()?.getTime?.() ||
            new Date(a.createdAt).getTime?.() ||
            0
          const bTime =
            b.createdAt?.toDate?.()?.getTime?.() ||
            new Date(b.createdAt).getTime?.() ||
            0
          return bTime - aTime
        })
        setZones(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredZones = useMemo(() => {
    if (!search.trim()) return zones
    const q = search.toLowerCase()
    return zones.filter((z) =>
      `${z.name || ''} ${z.description || ''}`.toLowerCase().includes(q)
    )
  }, [zones, search])

  const stats = useMemo(
    () => ({
      total: zones.length,
      active: zones.filter((z) => z.active !== false).length,
      inactive: zones.filter((z) => z.active === false).length,
    }),
    [zones]
  )

  const resetForm = () => {
    setEditingId(null)
    setZoneName('')
    setZoneFee('30')
    setZoneDescription('')
    setZoneActive(true)
  }

  const handleSubmit = async () => {
    if (!zoneName.trim()) {
      toast.error('Please enter a zone name')
      return
    }
    if (!zoneFee || parseFloat(zoneFee) < 0) {
      toast.error('Please enter a valid delivery fee')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'deliveryZones', editingId), {
          name: zoneName.trim(),
          deliveryFee: parseFloat(zoneFee),
          description: zoneDescription.trim(),
          active: zoneActive,
          updatedAt: serverTimestamp(),
        })
        toast.success('Zone updated!')
      } else {
        await addDoc(collection(db, 'deliveryZones'), {
          name: zoneName.trim(),
          deliveryFee: parseFloat(zoneFee),
          description: zoneDescription.trim(),
          active: zoneActive,
          createdAt: serverTimestamp(),
        })
        toast.success('Zone created!')
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save zone')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (zone) => {
    setEditingId(zone.firebaseId)
    setZoneName(zone.name || '')
    setZoneFee(String(zone.deliveryFee || 30))
    setZoneDescription(zone.description || '')
    setZoneActive(zone.active !== false)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleActive = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'deliveryZones', firebaseId), {
        active: !current,
      })
      toast.success(`Zone ${!current ? 'activated' : 'deactivated'}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteZone = async (firebaseId, name) => {
    if (!window.confirm(`Delete zone "${name}"?`)) return
    try {
      await deleteDoc(doc(db, 'deliveryZones', firebaseId))
      toast.success('Zone deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
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
            <h1 className="admin-page-title">Delivery Zones</h1>
            <p className="admin-page-sub">
              Manage delivery areas and fees. Customer will select their zone
              at checkout.
            </p>
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
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Zone'}
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <MapPin size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Zones</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">🟢</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Active</span>
              <strong className="admin-stat-value">{stats.active}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">🔴</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Inactive</span>
              <strong className="admin-stat-value">{stats.inactive}</strong>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div
          className="admin-section"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            background:
              'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
            border: '1px solid rgba(5,150,105,0.2)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            💡 <strong>How it works:</strong> Add zones with their delivery
            fees. Customers will pick their zone at checkout, then drop a
            pin on the map. Riders see the zone + location and decide to
            accept.
          </p>
        </div>

        {/* Form */}
        {showForm && (
          <div
            className="admin-section"
            style={{ padding: '24px', marginBottom: '20px' }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '17px',
                fontWeight: 800,
                marginBottom: '18px',
                color: 'var(--text-primary)',
              }}
            >
              {editingId ? '✏️ Edit Zone' : '➕ Create New Zone'}
            </h3>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '14px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Digholdi Union Parishad"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Delivery Fee (৳) *
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={zoneFee}
                    onChange={(e) => setZoneFee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief description about this zone..."
                  value={zoneDescription}
                  onChange={(e) => setZoneDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'var(--font-primary)',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                <input
                  type="checkbox"
                  checked={zoneActive}
                  onChange={(e) => setZoneActive(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#059669',
                  }}
                />
                Active (available for orders)
              </label>

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
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                  ? '✅ Update Zone'
                  : '✅ Create Zone'}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="admin-section" style={{ padding: '16px 20px' }}>
          <div
            style={{
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
              placeholder="Search zones..."
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
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading zones...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</p>
            <h3>No delivery zones yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Click "New Zone" to create your first delivery area.
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredZones.map((z) => {
              const isActive = z.active !== false
              return (
                <div
                  key={z.firebaseId}
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
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: isActive
                        ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)'
                        : 'linear-gradient(135deg, #E5E7EB, #D1D5DB)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}
                  >
                    📍
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
                      {z.name}
                    </strong>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>💰 ৳{z.deliveryFee || 0} delivery</span>
                      <span>📅 {formatDate(z.createdAt)}</span>
                    </div>
                    {z.description && (
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: '12.5px',
                          color: 'var(--text-tertiary)',
                          fontStyle: 'italic',
                        }}
                      >
                        {z.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: isActive
                          ? 'rgba(22,163,74,0.12)'
                          : 'rgba(220,38,38,0.12)',
                        color: isActive ? '#16a34a' : '#dc2626',
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleEdit(z)}
                      title="Edit"
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
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => toggleActive(z.firebaseId, isActive)}
                      title={isActive ? 'Deactivate' : 'Activate'}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isActive
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(22,163,74,0.12)',
                        border: isActive
                          ? '1px solid rgba(245,158,11,0.3)'
                          : '1px solid rgba(22,163,74,0.3)',
                        color: isActive ? '#f59e0b' : '#16a34a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Power size={16} />
                    </button>

                    <button
                      onClick={() => deleteZone(z.firebaseId, z.name)}
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
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminZonesPage