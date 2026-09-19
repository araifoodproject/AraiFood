import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Eye,
  Users,
  Wallet,
  Star,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react'

function AdminCustomersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('customer')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
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
        setCustomers(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    if (roleFilter !== 'all') {
      result = result.filter((c) => (c.role || 'customer') === roleFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        `${c.fullName || ''} ${c.email || ''} ${c.phone || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [customers, roleFilter, search])

  const stats = useMemo(() => {
    return {
      total: customers.length,
      customer: customers.filter((c) => !c.role || c.role === 'customer').length,
      withWallet: customers.filter((c) => (c.walletBalance || 0) > 0).length,
      totalWallet: customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0),
    }
  }, [customers])

  const deleteCustomer = async (firebaseId, name) => {
    if (
      !window.confirm(
        `Delete "${name}"? This will remove their user record (orders remain).`
      )
    )
      return
    try {
      await deleteDoc(doc(db, 'users', firebaseId))
      toast.success(`"${name}" deleted`)
      if (selected?.firebaseId === firebaseId) setSelected(null)
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

  const getInitials = (name) => {
    if (!name) return '👤'
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
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
            <h1 className="admin-page-title">Customers</h1>
            <p className="admin-page-sub">
              Manage all customers and their wallet balances.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Users size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Users</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">👤</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Customers</span>
              <strong className="admin-stat-value">{stats.customer}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Wallet size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">With Wallet</span>
              <strong className="admin-stat-value">{stats.withWallet}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Wallet</span>
              <strong className="admin-stat-value">
                ৳{stats.totalWallet.toFixed(0)}
              </strong>
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
                placeholder="Search by name, email, phone..."
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
                { value: 'customer', label: 'Customers' },
                { value: 'rider', label: 'Riders' },
                { value: 'restaurant', label: 'Restaurant' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoleFilter(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background:
                      roleFilter === opt.value
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface)',
                    color:
                      roleFilter === opt.value
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    border:
                      roleFilter === opt.value
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
            <p>Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="admin-section" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>👥</p>
            <h3>No customers found</h3>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredCustomers.map((c) => (
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
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#047857',
                    fontFamily: 'var(--font-heading)',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(c.fullName)}
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
                    {c.fullName || 'Unnamed User'}
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
                    <span>📧 {c.email}</span>
                    {c.phone && <span>📞 {c.phone}</span>}
                  </div>
                </div>

                {/* Role */}
                <div style={{ minWidth: '110px' }}>
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
                    Role
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(59,130,246,0.12)',
                      color: '#3b82f6',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      textTransform: 'capitalize',
                    }}
                  >
                    {c.role || 'customer'}
                  </span>
                </div>

                {/* Wallet */}
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
                    Wallet
                  </div>
                  <strong
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#059669',
                    }}
                  >
                    ৳{(c.walletBalance || 0).toFixed(0)}
                  </strong>
                </div>

                {/* Points */}
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
                    Points
                  </div>
                  <strong
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#f59e0b',
                    }}
                  >
                    ⭐ {c.loyaltyPoints || 0}
                  </strong>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setSelected(c)}
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
                    onClick={() => deleteCustomer(c.firebaseId, c.fullName || c.email)}
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
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: 0 }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#047857',
                    fontFamily: 'var(--font-heading)',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(selected.fullName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-heading)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {selected.fullName || 'Unnamed'}
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
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Row label="👤 Full Name" value={selected.fullName} />
                <Row label="📧 Email" value={selected.email} />
                <Row label="📞 Phone" value={selected.phone} />
                <Row label="📍 Address" value={selected.address} />
                <Row
                  label="🎭 Role"
                  value={selected.role || 'customer'}
                />
              </div>

              <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Row
                  label="💰 Wallet Balance"
                  value={`৳${(selected.walletBalance || 0).toFixed(2)}`}
                />
                <Row
                  label="⭐ Loyalty Points"
                  value={`${selected.loyaltyPoints || 0} points`}
                />
                <Row
                  label="🎁 Points Value"
                  value={`৳${((selected.loyaltyPoints || 0) / 10).toFixed(0)}`}
                />
              </div>

              <div style={{ padding: '14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Row label="🆔 User ID" value={selected.firebaseId} />
                <Row
                  label="📅 Joined"
                  value={formatDate(selected.createdAt)}
                />
              </div>

              {/* Wallet Transactions */}
              {selected.walletTransactions?.length > 0 && (
                <div>
                  <strong style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                    💳 Recent Transactions
                  </strong>
                  <div style={{ padding: '8px 14px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    {selected.walletTransactions.slice(0, 5).map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          padding: '8px 0',
                          borderBottom:
                            i < Math.min(selected.walletTransactions.length, 5) - 1
                              ? '1px dashed var(--border)'
                              : 'none',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {t.type === 'credit' ? '⬇️' : '⬆️'} {t.description || t.type}
                        </span>
                        <strong
                          style={{
                            color: t.type === 'credit' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {t.type === 'credit' ? '+' : '-'}৳{t.amount}
                        </strong>
                      </div>
                    ))}
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

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13.5px' }}>
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <strong style={{ color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-word' }}>{value || '—'}</strong>
    </div>
  )
}

export default AdminCustomersPage