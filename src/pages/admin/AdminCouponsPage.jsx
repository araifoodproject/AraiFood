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
  Ticket,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

function AdminCouponsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState(null)

  // Form state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'coupons'),
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
        setCoupons(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredCoupons = useMemo(() => {
    if (!search.trim()) return coupons
    const q = search.toLowerCase()
    return coupons.filter(
      (c) =>
        `${c.code || ''} ${c.description || ''}`.toLowerCase().includes(q)
    )
  }, [coupons, search])

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter((c) => c.active !== false).length,
      inactive: coupons.filter((c) => c.active === false).length,
    }
  }, [coupons])

  const resetForm = () => {
    setCode('')
    setDiscountType('percent')
    setDiscountValue('')
    setMinOrder('')
    setMaxDiscount('')
    setDescription('')
  }

  const createCoupon = async () => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('Please enter a valid discount value')
      return
    }

    const upperCode = code.trim().toUpperCase()

    // Check for duplicate
    if (coupons.some((c) => c.code === upperCode)) {
      toast.error('This coupon code already exists')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'coupons'), {
        code: upperCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        description: description.trim() || '',
        active: true,
        usedCount: 0,
        createdAt: serverTimestamp(),
      })
      toast.success(`Coupon "${upperCode}" created!`)
      resetForm()
      setShowForm(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'coupons', firebaseId), {
        active: !current,
      })
      toast.success(`Coupon ${!current ? 'activated' : 'deactivated'}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteCoupon = async (firebaseId, couponCode) => {
    if (!window.confirm(`Delete coupon "${couponCode}"?`)) return
    try {
      await deleteDoc(doc(db, 'coupons', firebaseId))
      toast.success(`Coupon "${couponCode}" deleted`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const copyCode = (codeToCopy) => {
    navigator.clipboard.writeText(codeToCopy)
    setCopied(codeToCopy)
    toast.success(`${codeToCopy} copied!`, { autoClose: 1200 })
    setTimeout(() => setCopied(null), 1500)
  }

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'percent') {
      return `${coupon.discountValue}% OFF`
    }
    return `৳${coupon.discountValue} OFF`
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
            <h1 className="admin-page-title">Coupons</h1>
            <p className="admin-page-sub">
              Create and manage discount coupons for customers.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              resetForm()
            }}
            className="admin-page-action"
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
            {showForm ? 'Cancel' : 'New Coupon'}
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Ticket size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Coupons</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Active</span>
              <strong className="admin-stat-value">{stats.active}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <XCircle size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Inactive</span>
              <strong className="admin-stat-value">{stats.inactive}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">🎟️</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Used</span>
              <strong className="admin-stat-value">
                {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
              </strong>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="admin-section" style={{ padding: '24px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                marginBottom: '18px',
                color: 'var(--text-primary)',
              }}
            >
              ➕ Create New Coupon
            </h3>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SAVE10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface)',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '1px',
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
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
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
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
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
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    placeholder={discountType === 'percent' ? '10' : '50'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
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
                    Min Order (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 300"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
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
                    Max Discount (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 100"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
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
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., On your first order"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={createCoupon}
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
                  marginTop: '8px',
                }}
              >
                {saving ? 'Creating...' : '✅ Create Coupon'}
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
              placeholder="Search coupons..."
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
            <p>Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎟️</p>
            <h3>No coupons yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Click "New Coupon" to create your first discount.
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredCoupons.map((c) => {
              const isActive = c.active !== false
              return (
                <div
                  key={c.firebaseId}
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
                    opacity: isActive ? 1 : 0.55,
                  }}
                >
                  {/* Ticket Icon */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: isActive
                        ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)'
                        : 'linear-gradient(135deg, #E5E7EB, #D1D5DB)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      flexShrink: 0,
                    }}
                  >
                    🎟️
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '17px',
                          fontWeight: 900,
                          color: 'var(--text-primary)',
                          letterSpacing: '1px',
                        }}
                      >
                        {c.code}
                      </strong>
                      <button
                        onClick={() => copyCode(c.code)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {copied === c.code ? (
                          <>
                            <Check size={11} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>🎁 {formatDiscount(c)}</span>
                      {c.minOrder > 0 && <span>📦 Min ৳{c.minOrder}</span>}
                      {c.maxDiscount && <span>🔒 Max ৳{c.maxDiscount}</span>}
                    </div>
                    {c.description && (
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: '12.5px',
                          color: 'var(--text-tertiary)',
                          fontStyle: 'italic',
                        }}
                      >
                        {c.description}
                      </p>
                    )}
                  </div>

                  {/* Used count */}
                  <div style={{ minWidth: '90px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                      }}
                    >
                      Used
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '16px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {c.usedCount || 0}
                    </strong>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        marginTop: '2px',
                      }}
                    >
                      {formatDate(c.createdAt)}
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

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => toggleActive(c.firebaseId, isActive)}
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
                      {isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    </button>

                    <button
                      onClick={() => deleteCoupon(c.firebaseId, c.code)}
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

export default AdminCouponsPage