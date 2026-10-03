// ============================================================
// src/pages/admin/AdminOrdersPage.jsx
// V3 — + Online Payments tab (verify/reject with distribution)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import { sendNotification } from '../../utils/sendNotification'
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
  Copy,
  Download,
  Pill,
  Gamepad2,
  MapPin,
  AlertCircle,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'

function AdminOrdersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  // ============ LIVE DATA ============
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

  // ============ ONLINE PAYMENT ORDERS ============
  const onlinePaymentOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.paymentMethod || '').toLowerCase() === 'online' &&
        o.paymentStatus
    )
  }, [orders])

  const onlinePaymentStats = useMemo(() => {
    const pending = onlinePaymentOrders.filter(
      (o) => o.paymentStatus === 'pending'
    )
    const verified = onlinePaymentOrders.filter(
      (o) => o.paymentStatus === 'verified'
    )
    const rejected = onlinePaymentOrders.filter(
      (o) => o.paymentStatus === 'rejected'
    )
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, o) => s + (Number(o.total) || 0), 0),
      verifiedCount: verified.length,
      verifiedAmount: verified.reduce(
        (s, o) => s + (Number(o.total) || 0),
        0
      ),
      rejectedCount: rejected.length,
    }
  }, [onlinePaymentOrders])

  // ============ FILTER ============
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // ✅ NEW: If Online Payments tab selected, filter to only online payments
    if (statusFilter === 'online-payments') {
      result = result.filter(
        (o) =>
          (o.paymentMethod || '').toLowerCase() === 'online' &&
          o.paymentStatus
      )
      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter((o) =>
          `${o.orderId || ''} ${o.fullName || ''} ${o.phone || ''} ${
            o.paymentTrxId || ''
          } ${o.restaurantName || ''}`
            .toLowerCase()
            .includes(q)
        )
      }
      return result
    }

    if (statusFilter !== 'all') {
      result = result.filter((o) => (o.status || 'pending') === statusFilter)
    }

    if (typeFilter !== 'all') {
      if (typeFilter === 'food') {
        result = result.filter(
          (o) => o.orderType !== 'pharmacy' && o.orderType !== 'gaming'
        )
      } else if (typeFilter === 'pharmacy') {
        result = result.filter((o) => o.orderType === 'pharmacy')
      } else if (typeFilter === 'gaming') {
        result = result.filter((o) => o.orderType === 'gaming')
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) =>
        `${o.orderId || ''} ${o.fullName || ''} ${o.phone || ''} ${
          o.restaurantName || ''
        } ${o.pharmacyName || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [orders, statusFilter, typeFilter, search])

  // ============ STATS ============
  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter(
      (o) => o.status === 'pending' || !o.status
    ).length
    const preparing = orders.filter(
      (o) => o.status === 'preparing'
    ).length
    const delivering = orders.filter(
      (o) => o.status === 'delivering'
    ).length
    const delivered = orders.filter(
      (o) => o.status === 'delivered'
    ).length
    const cancelled = orders.filter(
      (o) => o.status === 'cancelled'
    ).length
    const revenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const today = new Date().toLocaleDateString()
    const todayCount = orders.filter(
      (o) => o.createdAt?.toDate?.()?.toLocaleDateString() === today
    ).length
    return {
      total,
      pending,
      preparing,
      delivering,
      delivered,
      cancelled,
      revenue,
      todayCount,
    }
  }, [orders])

  // ============ ACTIONS ============
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
    const reason = window.prompt(
      `Cancel order ${orderId}? Reason:`,
      'Cancelled by admin'
    )
    if (reason === null) return
    try {
      await updateDoc(doc(db, 'orders', firebaseId), {
        status: 'cancelled',
        cancelReason: reason.trim() || 'Cancelled by admin',
        cancelledAt: new Date(),
        cancelledBy: 'admin',
      })
      toast.success(`Order ${orderId} cancelled`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to cancel order')
    }
  }

  const deleteOrder = async (firebaseId, orderId) => {
    if (
      !window.confirm(
        `Delete order ${orderId} permanently? This cannot be undone.`
      )
    )
      return
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

  // ============================================================
  // ONLINE PAYMENT VERIFY / REJECT
  // ============================================================
  const verifyPayment = async (order) => {
    const confirmed = window.confirm(
      `Verify online payment?\n\n` +
        `Order: ${order.orderId}\n` +
        `Amount: ৳${order.total}\n` +
        `Method: ${order.paymentMethodUsed || 'Unknown'}\n` +
        `TrxID: ${order.paymentTrxId || '—'}\n\n` +
        `✅ Verify করলে Rider ও Restaurant এর account এ distribution হবে।`
    )
    if (!confirmed) return

    setProcessingId(order.firebaseId)
    try {
      await updateDoc(doc(db, 'orders', order.firebaseId), {
        paymentStatus: 'verified',
        paymentVerifiedAt: new Date(),
        paymentVerifiedBy: 'admin',
      })

      // Notify customer
      if (order.userId) {
        await sendNotification(
          order.userId,
          '✅ Payment Verified!',
          `Your payment for order ${order.orderId} has been verified.`,
          'order',
          { orderId: order.orderId }
        ).catch(() => {})
      }

      toast.success('✅ Payment verified!')
    } catch (err) {
      console.error('Verify error:', err)
      toast.error('Failed to verify: ' + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const rejectPayment = async (order) => {
    const reason = window.prompt(
      `Reject payment for ${order.orderId}?\n\nReason (customer দেখবে):`,
      'Transaction ID invalid'
    )
    if (reason === null) return
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error('Reason দিন')
      return
    }

    setProcessingId(order.firebaseId)
    try {
      await updateDoc(doc(db, 'orders', order.firebaseId), {
        paymentStatus: 'rejected',
        paymentRejectReason: trimmed,
        paymentRejectedAt: new Date(),
        paymentRejectedBy: 'admin',
      })

      // Notify customer
      if (order.userId) {
        await sendNotification(
          order.userId,
          '❌ Payment Rejected',
          `Your payment for order ${order.orderId} was rejected. Reason: ${trimmed}. Please contact support or pay again.`,
          'order',
          { orderId: order.orderId }
        ).catch(() => {})
      }

      toast.success('Payment rejected')
    } catch (err) {
      console.error('Reject error:', err)
      toast.error('Failed to reject: ' + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId)
    toast.success('Order ID copied!', { autoClose: 1200 })
  }

  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export')
      return
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Phone',
      'Vendor',
      'Items',
      'Subtotal',
      'Delivery Fee',
      'Total',
      'Status',
      'Payment',
      'Payment Status',
      'TrxID',
    ]

    const rows = filteredOrders.map((o) => [
      o.orderId || '',
      o.createdAt?.toDate?.()?.toLocaleString() || '',
      o.fullName || '',
      o.phone || '',
      o.restaurantName || o.pharmacyName || '',
      (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(' | '),
      o.subtotal || 0,
      o.deliveryFee || 0,
      o.total || 0,
      o.status || 'pending',
      o.paymentMethod || 'cod',
      o.paymentStatus || '',
      o.paymentTrxId || '',
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `araifood-orders-${
      new Date().toISOString().split('T')[0]
    }.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredOrders.length} orders`)
  }

  // ============ HELPERS ============
  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: '⏳',
      },
      preparing: {
        label: 'Preparing',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
        icon: '👨‍🍳',
      },
      delivering: {
        label: 'Delivering',
        color: '#13a89e',
        bg: 'rgba(19,168,158,0.12)',
        icon: '🛵',
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

  const getPaymentStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: '⏳',
      },
      verified: {
        label: 'Verified',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.12)',
        icon: '✅',
      },
      rejected: {
        label: 'Rejected',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.12)',
        icon: '❌',
      },
      cod: {
        label: 'COD',
        color: '#64748b',
        bg: 'rgba(100,116,139,0.12)',
        icon: '💵',
      },
    }
    return map[status] || map.cod
  }

  const getOrderType = (order) => {
    if (order.orderType === 'pharmacy') {
      return { icon: '💊', label: 'Pharmacy', color: '#3B82F6' }
    }
    if (order.orderType === 'gaming') {
      return { icon: '🎮', label: 'Gaming', color: '#8B5CF6' }
    }
    return { icon: '🍽️', label: 'Food', color: '#059669' }
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

  const timeAgo = (ts) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMs / 3600000)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffDay < 7) return `${diffDay}d ago`
    return d.toLocaleDateString()
  }

  // ============ IS ONLINE PAYMENTS MODE ============
  const isOnlinePaymentsMode = statusFilter === 'online-payments'

  // ============================================================
  // RENDER
  // ============================================================
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
              Monitor and manage every order on AraiFood — real-time.
            </p>
          </div>
          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
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
            <Download size={16} />
            Export CSV
          </button>
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
              <span className="admin-stat-trend up">
                +{stats.todayCount} today
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Clock size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Pending</span>
              <strong className="admin-stat-value">{stats.pending}</strong>
              <span className="admin-stat-trend">
                {stats.preparing} preparing
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
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

        {/* ============ ONLINE PAYMENTS SUMMARY ============ */}
        {(onlinePaymentStats.pendingCount > 0 || isOnlinePaymentsMode) && (
          <div
            className="admin-section"
            style={{
              padding: '16px 20px',
              marginBottom: '14px',
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              border: '2px solid #F59E0B',
              borderRadius: '14px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 800,
                color: '#92400E',
              }}
            >
              <DollarSign size={18} />
              Online Payments:
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                ⏳ {onlinePaymentStats.pendingCount} pending · ৳
                {onlinePaymentStats.pendingAmount}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: '#DCFCE7',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#15803D',
                }}
              >
                ✅ {onlinePaymentStats.verifiedCount} verified
              </span>
              {onlinePaymentStats.rejectedCount > 0 && (
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: '#FEE2E2',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#B91C1C',
                  }}
                >
                  ❌ {onlinePaymentStats.rejectedCount} rejected
                </span>
              )}
            </div>
            {onlinePaymentStats.pendingCount > 0 && !isOnlinePaymentsMode && (
              <button
                onClick={() => setStatusFilter('online-payments')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                View Online Payments →
              </button>
            )}
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
              marginBottom: '16px',
            }}
          >
            {/* Search */}
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
                placeholder={
                  isOnlinePaymentsMode
                    ? 'Search order ID, customer, phone, TrxID...'
                    : 'Search order ID, name, phone, vendor...'
                }
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

            {/* Order Type Filter — Hidden in Online Payments mode */}
            {!isOnlinePaymentsMode && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  padding: '4px',
                  borderRadius: '999px',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                }}
              >
                {[
                  { value: 'all', label: 'All', icon: '📋' },
                  { value: 'food', label: 'Food', icon: '🍽️' },
                  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
                  { value: 'gaming', label: 'Gaming', icon: '🎮' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTypeFilter(t.value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background:
                        typeFilter === t.value
                          ? 'linear-gradient(135deg, #059669, #047857)'
                          : 'transparent',
                      color:
                        typeFilter === t.value
                          ? '#FFFFFF'
                          : 'var(--text-secondary)',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: `Pending (${stats.pending})` },
              { value: 'preparing', label: 'Preparing' },
              { value: 'delivering', label: 'Delivering' },
              { value: 'delivered', label: `Delivered (${stats.delivered})` },
              { value: 'cancelled', label: `Cancelled (${stats.cancelled})` },
              // ✅ NEW TAB
              {
                value: 'online-payments',
                label: `💰 Online Payments${
                  onlinePaymentStats.pendingCount > 0
                    ? ` (${onlinePaymentStats.pendingCount})`
                    : ''
                }`,
                highlight: true,
              },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background:
                    statusFilter === opt.value
                      ? opt.value === 'online-payments'
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : 'linear-gradient(135deg, #059669, #047857)'
                      : opt.highlight &&
                        onlinePaymentStats.pendingCount > 0
                      ? 'rgba(245,158,11,0.12)'
                      : 'var(--surface)',
                  color:
                    statusFilter === opt.value
                      ? '#FFFFFF'
                      : opt.highlight &&
                        onlinePaymentStats.pendingCount > 0
                      ? '#92400E'
                      : 'var(--text-secondary)',
                  border:
                    statusFilter === opt.value
                      ? 'none'
                      : opt.highlight &&
                        onlinePaymentStats.pendingCount > 0
                      ? '1px solid rgba(245,158,11,0.3)'
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

        {/* Results count */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            margin: '0 0 12px 4px',
          }}
        >
          {filteredOrders.length} order
          {filteredOrders.length !== 1 ? 's' : ''} found
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
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>
              {isOnlinePaymentsMode ? '💰' : '📦'}
            </p>
            <h3>
              {isOnlinePaymentsMode
                ? 'No online payments'
                : 'No orders found'}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'No orders yet.'}
            </p>
          </div>
        ) : isOnlinePaymentsMode ? (
          // ============================================================
          // ONLINE PAYMENTS LIST
          // ============================================================
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredOrders.map((order) => {
              const paymentBadge = getPaymentStatusBadge(
                order.paymentStatus
              )
              const isPending = order.paymentStatus === 'pending'
              const isVerified = order.paymentStatus === 'verified'
              const isRejected = order.paymentStatus === 'rejected'
              const isProcessing = processingId === order.firebaseId

              return (
                <div
                  key={order.firebaseId}
                  style={{
                    background: 'var(--surface-soft)',
                    border: `2px solid ${
                      isPending
                        ? '#F59E0B'
                        : isVerified
                        ? '#16A34A'
                        : '#DC2626'
                    }`,
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '12px',
                    opacity: isProcessing ? 0.6 : 1,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <strong
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '16px',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {order.orderId}
                        </strong>
                        <button
                          onClick={() => copyOrderId(order.orderId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            padding: 0,
                            display: 'flex',
                          }}
                        >
                          <Copy size={13} />
                        </button>
                        <span
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--text-tertiary)',
                            fontWeight: 600,
                          }}
                        >
                          · {timeAgo(order.createdAt)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        👤 {order.fullName} · 📞 {order.phone}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: paymentBadge.bg,
                        color: paymentBadge.color,
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {paymentBadge.icon} {paymentBadge.label}
                    </span>
                  </div>

                  {/* Payment info grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '10px',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#F0FDF4',
                        border: '1px solid #86EFAC',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#166534',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Amount
                      </div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          color: '#15803D',
                        }}
                      >
                        ৳{order.total}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Method
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#0F172A',
                        }}
                      >
                        {order.paymentMethodUsed || '—'}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        TrxID
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0F172A',
                          wordBreak: 'break-all',
                        }}
                      >
                        {order.paymentTrxId || '—'}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Order Status
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0F172A',
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.status || 'pending'}
                      </div>
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {isRejected && order.paymentRejectReason && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        marginBottom: '14px',
                        fontSize: '12.5px',
                        color: '#991B1B',
                        fontWeight: 600,
                      }}
                    >
                      ❌ <strong>Rejected:</strong> {order.paymentRejectReason}
                    </div>
                  )}

                  {/* Verified info */}
                  {isVerified && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#F0FDF4',
                        border: '1px solid #86EFAC',
                        marginBottom: '14px',
                        fontSize: '12.5px',
                        color: '#166534',
                        fontWeight: 600,
                      }}
                    >
                      ✅ Verified · {formatDate(order.paymentVerifiedAt)}
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        onClick={() => verifyPayment(order)}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          minWidth: '140px',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: isProcessing ? 0.6 : 1,
                        }}
                      >
                        <ShieldCheck size={16} />
                        {isProcessing ? 'Verifying...' : 'Verify Payment'}
                      </button>
                      <button
                        onClick={() => rejectPayment(order)}
                        disabled={isProcessing}
                        style={{
                          padding: '12px 20px',
                          borderRadius: '10px',
                          border: '1.5px solid #DC2626',
                          background: '#FFFFFF',
                          color: '#DC2626',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '12px 18px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border-strong)',
                          background: 'var(--surface)',
                          color: 'var(--text-secondary)',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={14} /> Details
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          // ============================================================
          // NORMAL ORDERS LIST (unchanged from V2)
          // ============================================================
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status)
              const orderType = getOrderType(order)
              const vendorName =
                order.restaurantName || order.pharmacyName || 'Vendor'
              const hasRider = order.riderId && order.riderName
              const isOnlinePayment = order.paymentMethod === 'online'

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
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: `${orderType.color}15`,
                      border: `1px solid ${orderType.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    {orderType.icon}
                  </div>

                  <div style={{ minWidth: '140px', flex: '0 0 auto' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {order.orderId}
                      </strong>
                      <button
                        onClick={() => copyOrderId(order.orderId)}
                        title="Copy"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-tertiary)',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        <Copy size={12} />
                      </button>
                      {isOnlinePayment && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background:
                              order.paymentStatus === 'verified'
                                ? '#DCFCE7'
                                : order.paymentStatus === 'rejected'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                            color:
                              order.paymentStatus === 'verified'
                                ? '#15803D'
                                : order.paymentStatus === 'rejected'
                                ? '#B91C1C'
                                : '#92400E',
                            textTransform: 'uppercase',
                          }}
                        >
                          💳 {order.paymentStatus || 'pending'}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      {timeAgo(order.createdAt)}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: '160px' }}>
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

                  <div style={{ flex: 1, minWidth: '140px' }}>
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
                      {orderType.label}
                    </div>
                    <strong
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        display: 'block',
                        marginBottom: '2px',
                      }}
                    >
                      {vendorName}
                    </strong>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {order.items?.length || 0} item(s)
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

                    {order.status !== 'delivered' &&
                      order.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() =>
                              updateOrderStatus(
                                order.firebaseId,
                                'delivered'
                              )
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
                  {getOrderType(selectedOrder).icon}{' '}
                  {getOrderType(selectedOrder).label} Order
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

            <div
              style={{
                padding: '20px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: getStatusBadge(selectedOrder.status).bg,
                  color: getStatusBadge(selectedOrder.status).color,
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '18px' }}>
                  {getStatusBadge(selectedOrder.status).icon}
                </span>
                Status: {getStatusBadge(selectedOrder.status).label}
                {selectedOrder.cancelReason && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      marginLeft: 'auto',
                    }}
                  >
                    · {selectedOrder.cancelReason}
                  </span>
                )}
              </div>

              {/* Payment status badge */}
              {selectedOrder.paymentMethod === 'online' && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: getPaymentStatusBadge(
                      selectedOrder.paymentStatus
                    ).bg,
                    color: getPaymentStatusBadge(selectedOrder.paymentStatus)
                      .color,
                    fontSize: '14px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus).icon}
                  </span>
                  Payment:{' '}
                  {getPaymentStatusBadge(selectedOrder.paymentStatus).label}
                  {selectedOrder.paymentRejectReason && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        marginLeft: 'auto',
                      }}
                    >
                      · {selectedOrder.paymentRejectReason}
                    </span>
                  )}
                </div>
              )}

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

              {/* Rider */}
              {selectedOrder.riderName && (
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
                    🛵 Assigned Rider
                  </strong>
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(19,168,158,0.08)',
                      borderRadius: '12px',
                      border: '1px solid rgba(19,168,158,0.2)',
                    }}
                  >
                    <strong
                      style={{
                        fontSize: '14px',
                        color: '#0D9488',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {selectedOrder.riderName}
                    </strong>
                    {selectedOrder.riderPhone && (
                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        📞 {selectedOrder.riderPhone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor */}
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
                  {getOrderType(selectedOrder).icon}{' '}
                  {getOrderType(selectedOrder).label}
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
                  {selectedOrder.restaurantName ||
                    selectedOrder.pharmacyName ||
                    '—'}
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
                  📦 Items ({selectedOrder.items?.length || 0})
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
                  {selectedOrder.couponDiscount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13.5px',
                        color: '#059669',
                      }}
                    >
                      <span>Coupon ({selectedOrder.couponCode})</span>
                      <strong>-৳{selectedOrder.couponDiscount}</strong>
                    </div>
                  )}
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
                  <strong
                    style={{
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedOrder.paymentMethod || 'cod'}
                  </strong>
                </div>
                {selectedOrder.paymentMethodUsed && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>🏦 Payment Via</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {selectedOrder.paymentMethodUsed}
                    </strong>
                  </div>
                )}
                {selectedOrder.paymentTrxId && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>🧾 TrxID</span>
                    <strong
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    >
                      {selectedOrder.paymentTrxId}
                    </strong>
                  </div>
                )}
                {selectedOrder.zoneName && (
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>
                      <MapPin size={12} /> Zone
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {selectedOrder.zoneName}
                    </strong>
                  </div>
                )}
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

              {/* No rider warning */}
              {!selectedOrder.riderId &&
                selectedOrder.status !== 'delivered' &&
                selectedOrder.status !== 'cancelled' && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#D97706',
                    }}
                  >
                    <AlertCircle size={16} />
                    No rider assigned yet — waiting for rider to accept
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage