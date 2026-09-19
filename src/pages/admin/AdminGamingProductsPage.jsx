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
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
} from 'lucide-react'

const GAMES = [
  { value: 'PUBG', label: 'PUBG Mobile', icon: '🎯' },
  { value: 'Free Fire', label: 'Free Fire', icon: '🔥' },
  { value: 'UNIPIN', label: 'UNIPIN Voucher', icon: '🎟️' },
  { value: 'Level Up', label: 'Level Up Pass', icon: '⭐' },
  { value: 'Genshin', label: 'Genshin Impact', icon: '⚔️' },
  { value: 'Mobile Legends', label: 'Mobile Legends', icon: '🛡️' },
  { value: 'Valorant', label: 'Valorant', icon: '🔫' },
  { value: 'Other', label: 'Other', icon: '🎮' },
]

function AdminGamingProductsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Form state
  const [formGame, setFormGame] = useState('PUBG')
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formOrder, setFormOrder] = useState('0')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'gamingProducts'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          if (a.game !== b.game) return a.game.localeCompare(b.game)
          return (a.order || 0) - (b.order || 0)
        })
        setProducts(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (gameFilter !== 'all') {
      list = list.filter((p) => p.game === gameFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        `${p.game || ''} ${p.name || ''}`.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, gameFilter, search])

  const stats = useMemo(() => {
    const byGame = {}
    products.forEach((p) => {
      byGame[p.game] = (byGame[p.game] || 0) + 1
    })
    return {
      total: products.length,
      active: products.filter((p) => p.active !== false).length,
      inactive: products.filter((p) => p.active === false).length,
      byGame,
    }
  }, [products])

  const resetForm = () => {
    setEditingId(null)
    setFormGame('PUBG')
    setFormName('')
    setFormPrice('')
    setFormCategory('')
    setFormOrder('0')
    setFormActive(true)
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Please enter product name')
      return
    }
    if (!formPrice || parseFloat(formPrice) <= 0) {
      toast.error('Please enter valid price')
      return
    }

    setSaving(true)
    try {
      const data = {
        game: formGame,
        name: formName.trim(),
        price: parseFloat(formPrice),
        category: formCategory.trim() || 'default',
        order: parseInt(formOrder) || 0,
        active: formActive,
        updatedAt: serverTimestamp(),
      }

      if (editingId) {
        await updateDoc(doc(db, 'gamingProducts', editingId), data)
        toast.success('✅ Product updated!')
      } else {
        await addDoc(collection(db, 'gamingProducts'), {
          ...data,
          createdAt: serverTimestamp(),
        })
        toast.success('✅ Product added!')
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.firebaseId)
    setFormGame(product.game || 'PUBG')
    setFormName(product.name || '')
    setFormPrice(String(product.price || ''))
    setFormCategory(product.category || '')
    setFormOrder(String(product.order || 0))
    setFormActive(product.active !== false)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleActive = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'gamingProducts', firebaseId), {
        active: !current,
      })
      toast.success(`Product ${!current ? 'activated' : 'deactivated'}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteProduct = async (firebaseId, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteDoc(doc(db, 'gamingProducts', firebaseId))
      toast.success('Product deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const getGameIcon = (game) => {
    const found = GAMES.find((g) => g.value === game)
    return found?.icon || '🎮'
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
            <h1 className="admin-page-title">Gaming Products</h1>
            <p className="admin-page-sub">
              Manage PUBG UC, Free Fire Diamonds, and other gaming packs.
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
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Gamepad2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Products</span>
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
            <div className="admin-stat-icon">🎮</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Games</span>
              <strong className="admin-stat-value">
                {Object.keys(stats.byGame).length}
              </strong>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="admin-section" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '17px',
                fontWeight: 800,
                marginBottom: '18px',
                color: 'var(--text-primary)',
              }}
            >
              {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
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
                    Game *
                  </label>
                  <select
                    value={formGame}
                    onChange={(e) => setFormGame(e.target.value)}
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
                    {GAMES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.icon} {g.label}
                      </option>
                    ))}
                  </select>
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 60 UC, 25 Diamond, Weekly"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    placeholder="120"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
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
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., uc, diamond, voucher"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
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
                    Display Order
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
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
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#059669' }}
                />
                Active (visible to customers)
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Save size={16} />
                {saving
                  ? 'Saving...'
                  : editingId
                  ? 'Update Product'
                  : 'Add Product'}
              </button>
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
                placeholder="Search products..."
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
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
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
              }}
            >
              <option value="all">All Games</option>
              {GAMES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.icon} {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-section" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</p>
            <h3>No products yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Click "Add Product" to add your first gaming pack.
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredProducts.map((p) => {
              const isActive = p.active !== false
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
                    opacity: isActive ? 1 : 0.55,
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
                    {getGameIcon(p.game)}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {p.name}
                      </strong>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: 'rgba(59,130,246,0.12)',
                          color: '#3b82f6',
                          fontSize: '10.5px',
                          fontWeight: 800,
                        }}
                      >
                        {p.game}
                      </span>
                    </div>
                    {p.category && p.category !== 'default' && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 600,
                        }}
                      >
                        📁 {p.category}
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: '100px' }}>
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
                      Price
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#059669',
                      }}
                    >
                      ৳{p.price}
                    </strong>
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
                      onClick={() => handleEdit(p)}
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
                      onClick={() => toggleActive(p.firebaseId, isActive)}
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
                      onClick={() => deleteProduct(p.firebaseId, p.name)}
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

export default AdminGamingProductsPage