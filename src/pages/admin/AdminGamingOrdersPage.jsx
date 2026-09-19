import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { sendNotification } from '../../utils/sendNotification'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Gamepad2,
  Copy,
  Check,
  Trash2,
  Package,
} from 'lucide-react'

function AdminGamingOrdersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'gamingOrders'),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        list.sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime?.() || 0
          const bT = b.createdAt?.toDate?.()?.getTime?.() || 0
          return bT - aT
        })
        setOrders(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filteredOrders = useMemo(() => {
    let list = [...orders]
    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((o) =>
        `${o.orderId || ''} ${o.game || ''} ${o.playerId || ''} ${
          o.transactionId || ''
        } ${o.userEmail || ''}`
          .toLowerCase()
          .includes(q)
      )
    }
    return list
  }, [orders, statusFilter, search])

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      revenue: orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.price || 0), 0),
    }
  }, [orders])

  const updateStatus = async (firebaseId, newStatus, order) => {
    if (
      !window.confirm(
        `Mark order ${order.orderId} as "${newStatus.toUpperCase()}"?`
      )
    )
      return
    try {
      await updateDoc(doc(db, 'gamingOrders', firebaseId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      // Send notification to customer
      if (order.userId) {
        let title = ''
        let body = ''
        if (newStatus === 'processing') {
          title = '⚙️ Top-Up Processing'
          body = `Your ${order.productName} order is being processed.`
        } else if (newStatus === 'delivered') {
          title = '✅ Top-Up Delivered!'
          body = `Your ${order.productName} has been added to ${order.playerId}. Enjoy!`
        } else if (newStatus === 'cancelled') {
          title = '❌ Order Cancelled'
          body = `Your ${order.productName} order was cancelled.`
        }
        try {
          await sendNotification(order.userId, title, body, 'order', {
            orderId: order.orderId,
          })
        } catch (e) {
          console.error('Notification failed:', e)
        }
      }

      toast.success(`Order marked as ${newStatus}`)
      if (selectedOrder?.firebaseId === firebaseId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const deleteOrder = async (firebaseId, orderId) => {
    if (!window.confirm(`Delete order ${orderId} permanently?`)) return
    try {
      await deleteDoc(doc(db, 'gamingOrders', firebaseId))
      toast.success('Order deleted')
      if (selectedOrder?.firebaseId === firebaseId) setSelectedOrder(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copied!', { autoClose: 1200 })
    setTimeout(() => setCopied(null), 1500)
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: '⏳',
      },
      processing: {
        label: 'Processing',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
        icon: '⚙️',
      },
      delivered: {
        label: 'Delivered',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.12)',
        icon: '✅',
      },
      cancelled: {
        label: 'Cancelled',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.12)',
        icon: '❌',
      },
    }
    return map[status] || map.pending
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
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
            <h1 className="admin-page-title">Gaming Orders</h1>
            <p className="admin-page-sub">
              Manage all top-up orders from customers.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Package size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Orders</span>
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
              <span className="admin-stat-label">Delivered</span>
              <strong className="admin-stat-value">{stats.delivered}</strong>
              <span className="admin-stat-trend up">
                ৳{stats.revenue.toFixed(0)} revenue
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <XCircle size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Cancelled</span>
              <strong className="admin-stat-value">{stats.cancelled}</strong>
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
                placeholder="Search by Order ID, Player ID, TrxID, Email..."
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
                { value: 'pending', label: '⏳ Pending' },
                { value: 'processing', label: '⚙️ Processing' },
                { value: 'delivered', label: '✅ Delivered' },
                { value: 'cancelled', label: '❌ Cancelled' },
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
            <p>Loading gaming orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</p>
            <h3>No gaming orders found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'No top-up orders yet.'}
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status)
              return (
                <div
                  key={order.firebaseId}
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
                  <div style={{ minWidth: '130px' }}>
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
                      Order ID
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        display: 'block',
                        wordBreak: 'break-all',
                      }}
                    >
                      {order.orderId}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: '180px' }}>
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
                      Game / Pack
                    </div>
                    <strong
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        display: 'block',
                      }}
                    >
                      {order.game} — {order.productName}
                    </strong>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      🆔 {order.playerId}
                    </span>
                  </div>

                  <div style={{ minWidth: '120px' }}>
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
                      Payment
                    </div>
                    <strong
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-primary)',
                        display: 'block',
                        textTransform: 'capitalize',
                      }}
                    >
                      {order.paymentMethod}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      TrxID: {order.transactionId}
                    </span>
                  </div>

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
                      Price
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '17px',
                        fontWeight: 900,
                        color: '#059669',
                      }}
                    >
                      ৳{order.price}
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
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedOrder(order)}
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

                    {order.status === 'pending' && (
                      <button
                        onClick={() =>
                          updateStatus(order.firebaseId, 'processing', order)
                        }
                        title="Mark Processing"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(59,130,246,0.12)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Clock size={16} />
                      </button>
                    )}

                    {(order.status === 'pending' ||
                      order.status === 'processing') && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(order.firebaseId, 'delivered', order)
                          }
                          title="Mark Delivered"
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
                        <button
                          onClick={() =>
                            updateStatus(order.firebaseId, 'cancelled', order)
                          }
                          title="Cancel"
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
                      </>
                    )}

                    <button
                      onClick={() =>
                        deleteOrder(order.firebaseId, order.orderId)
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

      {/* Detail Modal */}
      {selectedOrder && (
        <div
          className="outside-area-modal"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 0,
            }}
          >
            {/* Sticky Header */}
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
                  Gaming Order
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedOrder.orderId}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
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
            <div
              style={{
                padding: '20px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13.5px',
                }}
              >
                <Row label="🎮 Game" value={selectedOrder.game} />
                <Row label="📦 Pack" value={selectedOrder.productName} />
                <Row label="💰 Price" value={`৳${selectedOrder.price}`} />
              </div>

              <div
                style={{
                  padding: '14px',
                  background: 'rgba(5,150,105,0.06)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5,150,105,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#059669',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  🆔 Player ID (Copy to Game)
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '20px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.5px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedOrder.playerId}
                  </strong>
                  <button
                    onClick={() =>
                      copyText(selectedOrder.playerId, 'modal-pid')
                    }
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {copied === 'modal-pid' ? (
                      <>
                        <Check size={13} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy ID
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13.5px',
                }}
              >
                <Row
                  label="👤 Customer"
                  value={selectedOrder.userEmail}
                />
                <Row
                  label="💳 Method"
                  value={selectedOrder.paymentMethod?.toUpperCase()}
                />
                <Row
                  label="📞 Paid To"
                  value={selectedOrder.paymentNumber}
                />
                <Row
                  label="🧾 Transaction ID"
                  value={selectedOrder.transactionId}
                />
                <Row
                  label="📅 Ordered"
                  value={formatDate(selectedOrder.createdAt)}
                />
              </div>

              {selectedOrder.status !== 'delivered' &&
                selectedOrder.status !== 'cancelled' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() =>
                          updateStatus(
                            selectedOrder.firebaseId,
                            'processing',
                            selectedOrder
                          )
                        }
                        style={{
                          padding: '12px',
                          borderRadius: '999px',
                          background:
                            'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          gridColumn: '1 / -1',
                          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                        }}
                      >
                        ⚙️ Mark as Processing
                      </button>
                    )}
                    <button
                      onClick={() =>
                        updateStatus(
                          selectedOrder.firebaseId,
                          'delivered',
                          selectedOrder
                        )
                      }
                      style={{
                        padding: '12px',
                        borderRadius: '999px',
                        background:
                          'linear-gradient(135deg, #16a34a, #059669)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                      }}
                    >
                      ✅ Delivered
                    </button>
                    <button
                      onClick={() =>
                        updateStatus(
                          selectedOrder.firebaseId,
                          'cancelled',
                          selectedOrder
                        )
                      }
                      style={{
                        padding: '12px',
                        borderRadius: '999px',
                        background:
                          'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                      }}
                    >
                      ❌ Cancel
                    </button>
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
        {label}
      </span>
      <strong
        style={{
          color: 'var(--text-primary)',
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value || '—'}
      </strong>
    </div>
  )
}

export default AdminGamingOrdersPage