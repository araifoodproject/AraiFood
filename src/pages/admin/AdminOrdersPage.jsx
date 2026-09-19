import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  Package,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Phone,
  User,
} from 'lucide-react'

function AdminOrdersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Real-time orders
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'orders'),
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
        setOrders(list)
        setLoading(false)
      },
      (error) => {
        console.error('Orders load error:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) =>
        `${o.orderId || ''} ${o.fullName || ''} ${o.phone || ''} ${o.restaurantName || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [orders, statusFilter, search])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'pending' || !o.status).length
    const preparing = orders.filter((o) => o.status === 'preparing').length
    const delivering = orders.filter((o) => o.status === 'delivering').length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    const cancelled = orders.filter((o) => o.status === 'cancelled').length
    const revenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    return { total, pending, preparing, delivering, delivered, cancelled, revenue }
  }, [orders])

  const updateOrderStatus = async (firebaseId, newStatus) => {
    if (!window.confirm(`Mark this order as "${newStatus}"?`)) return
    try {
      await updateDoc(doc(db, 'orders', firebaseId), {
        status: newStatus,
      })
      toast.success(`Order marked as ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const cancelOrder = async (firebaseId, orderId) => {
    if (!window.confirm(`Cancel order ${orderId}?`)) return
    try {
      await updateDoc(doc(db, 'orders', firebaseId), {
        status: 'cancelled',
      })
      toast.success(`Order ${orderId} cancelled`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to cancel order')
    }
  }

  const deleteOrder = async (firebaseId, orderId) => {
    if (!window.confirm(`Delete order ${orderId} permanently?`)) return
    try {
      await deleteDoc(doc(db, 'orders', firebaseId))
      toast.success(`Order ${orderId} deleted`)
      if (selectedOrder?.firebaseId === firebaseId) {
        setSelectedOrder(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete order')
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      preparing: { label: 'Preparing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
      delivering: { label: 'Delivering', color: '#13a89e', bg: 'rgba(19,168,158,0.12)' },
      delivered: { label: 'Delivered', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
      cancelled: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
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
            <h1 className="admin-page-title">All Orders</h1>
            <p className="admin-page-sub">
              Monitor and manage every order on AraiFood.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat green">
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
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Truck size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Delivering</span>
              <strong className="admin-stat-value">{stats.delivering}</strong>
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
                placeholder="Search by Order ID, name, phone, restaurant..."
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
                { value: 'preparing', label: 'Preparing' },
                { value: 'delivering', label: 'Delivering' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
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

        {/* Orders List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>📦</p>
            <h3>No orders found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'No orders yet.'}
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
                  <div style={{ minWidth: '140px', flex: '0 0 auto' }}>
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
                        fontSize: '14px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        display: 'block',
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <User size={13} color="#059669" />
                      <strong
                        style={{
                          fontSize: '13.5px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {order.fullName}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Phone size={12} />
                      {order.phone}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '160px' }}>
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
                      Restaurant
                    </div>
                    <strong
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        display: 'block',
                      }}
                    >
                      {order.restaurantName}
                    </strong>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {order.items?.length || 0} item(s)
                    </span>
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
                      Total
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#059669',
                      }}
                    >
                      ৳{order.total}
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
                      {badge.label}
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

                    {order.status !== 'delivered' &&
                      order.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() =>
                              updateOrderStatus(order.firebaseId, 'delivered')
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
                              cancelOrder(order.firebaseId, order.orderId)
                            }
                            title="Cancel Order"
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
                      title="Delete Order"
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
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ============ ORDER DETAIL MODAL ============ */}
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
              overflowX: 'hidden',
              textAlign: 'left',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
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
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
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
                  Order Details
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedOrder.orderId}
                </h2>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  {formatDate(selectedOrder.createdAt)}
                </span>
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
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              style={{
                padding: '20px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Customer */}
              <div>
                <strong
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  👤 Customer
                </strong>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {selectedOrder.fullName}
                  </p>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    📞 {selectedOrder.phone}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                    }}
                  >
                    📍 {selectedOrder.address}
                  </p>
                </div>
              </div>

              {/* Restaurant */}
              <div>
                <strong
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  🏪 Restaurant
                </strong>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {selectedOrder.restaurantName}
                </div>
              </div>

              {/* Items */}
              <div>
                <strong
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  📦 Items
                </strong>
                <div
                  style={{
                    padding: '8px 14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  {selectedOrder.items?.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13.5px',
                        padding: '8px 0',
                        borderBottom:
                          i < selectedOrder.items.length - 1
                            ? '1px dashed var(--border)'
                            : 'none',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.emoji} {item.name}
                      </span>
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div>
                <strong
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  💰 Payment
                </strong>
                <div
                  style={{
                    padding: '14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13.5px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Subtotal</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      ৳{selectedOrder.subtotal}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13.5px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Delivery Fee</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      ৳{selectedOrder.deliveryFee}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '16px',
                      paddingTop: '10px',
                      borderTop: '2px solid var(--border-strong)',
                    }}
                  >
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                      }}
                    >
                      Total
                    </strong>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#059669',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      ৳{selectedOrder.total}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(5,150,105,0.06)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5,150,105,0.15)',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>💳 Payment Method</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {selectedOrder.paymentMethod || 'cod'}
                  </strong>
                </div>
                {selectedOrder.deliveryOtp && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>🔐 Delivery OTP</span>
                    <strong
                      style={{
                        color: 'var(--text-primary)',
                        letterSpacing: '2px',
                      }}
                    >
                      {selectedOrder.deliveryOtp}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage