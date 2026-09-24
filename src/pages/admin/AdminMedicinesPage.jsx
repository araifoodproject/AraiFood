// ============================================================
// src/pages/admin/AdminMedicinesPage.jsx
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
import { Menu, Search, Plus, X, Pencil, Trash2, Save } from 'lucide-react'

const CATEGORIES = [
  { key: 'pain', label: 'Pain Relief' },
  { key: 'fever', label: 'Fever & Cold' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'antibiotics', label: 'Antibiotics' },
  { key: 'skin', label: 'Skin Care' },
  { key: 'oral', label: 'Oral Care' },
  { key: 'eye', label: 'Eye & Ear' },
  { key: 'baby', label: 'Baby Care' },
  { key: 'firstaid', label: 'First Aid' },
  { key: 'vitamins', label: 'Vitamins' },
  { key: 'other', label: 'Other' },
]

function AdminMedicinesPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [medicines, setMedicines] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPharmacy, setFilterPharmacy] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    genericName: '',
    company: '',
    category: 'pain',
    price: '',
    discountPrice: '',
    description: '',
    image: '',
    stock: '100',
    requiresPrescription: false,
    available: true,
    pharmacyId: '',
  })

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'medicines'), (snap) => {
      const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setMedicines(list)
      setLoading(false)
    })
    const unsub2 = onSnapshot(collection(db, 'pharmacies'), (snap) => {
      setPharmacies(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  const filtered = useMemo(() => {
    let r = [...medicines]
    if (filterPharmacy !== 'all') {
      r = r.filter((m) => m.pharmacyId === filterPharmacy)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      r = r.filter((m) =>
        `${m.name || ''} ${m.genericName || ''} ${m.company || ''}`
          .toLowerCase()
          .includes(s)
      )
    }
    return r
  }, [medicines, filterPharmacy, search])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      name: '',
      genericName: '',
      company: '',
      category: 'pain',
      price: '',
      discountPrice: '',
      description: '',
      image: '',
      stock: '100',
      requiresPrescription: false,
      available: true,
      pharmacyId: pharmacies[0]?.firebaseId || '',
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX = 800
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX) {
            h = Math.round((h * MAX) / w)
            w = MAX
          }
        } else if (h > MAX) {
          w = Math.round((w * MAX) / h)
          h = MAX
        }
        canvas.width = w
        canvas.height = h
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        setForm((f) => ({ ...f, image: canvas.toDataURL('image/jpeg', 0.85) }))
        toast.success('Image ready!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name required')
      return
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error('Valid price required')
      return
    }
    if (!form.pharmacyId) {
      toast.error('Select pharmacy')
      return
    }
    const pharm = pharmacies.find((p) => p.firebaseId === form.pharmacyId)
    if (!pharm) {
      toast.error('Pharmacy not found')
      return
    }

    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        genericName: form.genericName.trim(),
        company: form.company.trim(),
        category: form.category,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice
          ? parseFloat(form.discountPrice)
          : null,
        description: form.description.trim(),
        image: form.image,
        stock: parseInt(form.stock) || 0,
        requiresPrescription: form.requiresPrescription,
        available: form.available,
        pharmacyId: form.pharmacyId,
        pharmacyName: pharm.pharmacyName,
        updatedAt: serverTimestamp(),
      }

      if (editingId) {
        await updateDoc(doc(db, 'medicines', editingId), data)
        toast.success('Medicine updated!')
      } else {
        await addDoc(collection(db, 'medicines'), {
          ...data,
          createdAt: serverTimestamp(),
        })
        toast.success('Medicine added!')
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

  const openEdit = (m) => {
    setEditingId(m.firebaseId)
    setForm({
      name: m.name || '',
      genericName: m.genericName || '',
      company: m.company || '',
      category: m.category || 'pain',
      price: String(m.price || ''),
      discountPrice: m.discountPrice ? String(m.discountPrice) : '',
      description: m.description || '',
      image: m.image || '',
      stock: String(m.stock || 100),
      requiresPrescription: m.requiresPrescription || false,
      available: m.available !== false,
      pharmacyId: m.pharmacyId || pharmacies[0]?.firebaseId || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteMedicine = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteDoc(doc(db, 'medicines', id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
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
            <h1 className="admin-page-title">Medicines</h1>
            <p className="admin-page-sub">
              All medicines across pharmacies
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
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Medicine'}
          </button>
        </div>

        {showForm && (
          <div className="admin-section" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '18px' }}>
              {editingId ? '✏️ Edit Medicine' : '➕ Add Medicine'}
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
                  <label style={labelStyle}>Medicine Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="e.g., Napa"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Generic Name</label>
                  <input
                    type="text"
                    value={form.genericName}
                    onChange={(e) =>
                      setForm({ ...form, genericName: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="e.g., Paracetamol"
                  />
                </div>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="e.g., Beximco"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    style={inputStyle}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Pharmacy *</label>
                <select
                  value={form.pharmacyId}
                  onChange={(e) =>
                    setForm({ ...form, pharmacyId: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">— Select pharmacy —</option>
                  {pharmacies.map((p) => (
                    <option key={p.firebaseId} value={p.firebaseId}>
                      {p.pharmacyName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Price (৳) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Discount Price (৳)</label>
                  <input
                    type="number"
                    value={form.discountPrice}
                    onChange={(e) =>
                      setForm({ ...form, discountPrice: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={gridTwo}>
                <div>
                  <label style={labelStyle}>Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Requires Prescription?</label>
                  <select
                    value={form.requiresPrescription ? 'yes' : 'no'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        requiresPrescription: e.target.value === 'yes',
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Image</label>
                {form.image ? (
                  <div style={{ position: 'relative', maxWidth: '180px' }}>
                    <img
                      src={form.image}
                      alt=""
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                      }}
                    />
                    <button
                      onClick={() => setForm({ ...form, image: '' })}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-block',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      background: 'var(--surface-soft)',
                      border: '2px dashed var(--border-strong)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    📷 Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  padding: '14px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Save size={16} />{' '}
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Medicine'}
              </button>
            </div>
          </div>
        )}

        {/* Search + Filters */}
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
                placeholder="Search medicines..."
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
            <select
              value={filterPharmacy}
              onChange={(e) => setFilterPharmacy(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                fontSize: '13px',
                fontWeight: 700,
                outline: 'none',
              }}
            >
              <option value="all">All Pharmacies</option>
              {pharmacies.map((p) => (
                <option key={p.firebaseId} value={p.firebaseId}>
                  {p.pharmacyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>💊</p>
            <h3>No medicines yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Click "Add Medicine" to get started
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filtered.map((m) => (
              <div
                key={m.firebaseId}
                style={{
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  marginBottom: '10px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {m.image ? (
                    <img
                      src={m.image}
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

                <div style={{ flex: 1, minWidth: '180px' }}>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 800,
                    }}
                  >
                    {m.name}
                  </strong>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      marginTop: '2px',
                    }}
                  >
                    {m.genericName && `${m.genericName} · `}
                    {m.company || '—'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    🏪 {m.pharmacyName || '—'}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#059669',
                  }}
                >
                  ৳{m.discountPrice || m.price}
                </div>

                {m.requiresPrescription && (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(220,38,38,0.1)',
                      color: '#DC2626',
                      fontSize: '10.5px',
                      fontWeight: 800,
                    }}
                  >
                    ⚠️ Rx
                  </span>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openEdit(m)}
                    style={{
                      width: '34px',
                      height: '34px',
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
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteMedicine(m.firebaseId, m.name)}
                    style={{
                      width: '34px',
                      height: '34px',
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
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminMedicinesPage