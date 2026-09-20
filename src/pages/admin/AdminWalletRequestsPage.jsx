import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  increment,
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
  Wallet,
  Trash2,
} from 'lucide-react'

function AdminWalletRequestsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'walletRequests'),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        list.sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime?.() || 0
          const bT = b.createdAt?.toDate?.()?.getTime?.() || 0
          return bT - aT
        })
        setRequests(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filteredRequests = useMemo(() => {
    let list = [...requests]
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) =>
        `${r.requestId || ''} ${r.userName || ''} ${r.userEmail || ''} ${
          r.transactionId || ''
        }`
          .toLowerCase()
          .includes(q)
      )
    }
    return list
  }, [requests, statusFilter, search])

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      approvedAmount: requests
        .filter((r) => r.status === 'approved')
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    }
  }, [requests])

  // ============ APPROVE (SIMPLIFIED - NO getDoc) ============
  const handleApprove = async (request) => {
    if (
      !window.confirm(
        `Approve ৳${request.amount} for ${request.userName}? This will add money to their wallet.`
      )
    )
      return

    try {
      const transaction = {
        id: Date.now().toString() + '-topup',
        type: 'credit',
        amount: request.amount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        description: `Wallet top-up via ${request.method} (${request.requestId})`,
      }

      // Atomic increment — no need to read user doc
      const userDocRef = doc(db, 'users', request.userId)
      await updateDoc(userDocRef, {
        walletBalance: increment(request.amount),
        walletTransactions: arrayUnion(transaction),
      })

      // Update request status
      await updateDoc(doc(db, 'walletRequests', request.firebaseId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: 'admin',
      })

      // Send notification (fire-and-forget)
      try {
        await sendNotification(
          request.userId,
          '✅ Wallet Top-Up Approved!',
          `৳${request.amount} has been added to your wallet.`,
          'order',
          {}
        )
      } catch (e) {
        console.error('Notification failed:', e)
      }

      toast.success(`✅ ৳${request.amount} added to ${request.userName}'s wallet!`)

      if (selectedRequest?.firebaseId === request.firebaseId) {
        setSelectedRequest({ ...selectedRequest, status: 'approved' })
      }
    } catch (err) {
      console.error('Approve error:', err)
      toast.error('Failed to approve: ' + (err?.message || 'Unknown error'))
    }
  }

  // ============ REJECT ============
  const openRejectModal = (request) => {
    setRejectModal(request)
    setRejectReason('')
  }

  const handleReject = async () => {
    if (!rejectModal) return
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason')
      return
    }

    try {
      await updateDoc(doc(db, 'walletRequests', rejectModal.firebaseId), {
        status: 'rejected',
        rejectReason: rejectReason.trim(),
        rejectedAt: serverTimestamp(),
        rejectedBy: 'admin',
      })

      try {
        await sendNotification(
          rejectModal.userId,
          '❌ Wallet Top-Up Rejected',
          `Your ৳${rejectModal.amount} top-up request was rejected. Reason: ${rejectReason.trim()}`,
          'order',
          {}
        )
      } catch (e) {
        console.error('Notification failed:', e)
      }

      toast.success('Request rejected')
      setRejectModal(null)
      setRejectReason('')

      if (selectedRequest?.firebaseId === rejectModal.firebaseId) {
        setSelectedRequest({
          ...selectedRequest,
          status: 'rejected',
          rejectReason: rejectReason.trim(),
        })
      }
    } catch (err) {
      console.error('Reject error:', err)
      toast.error('Failed to reject')
    }
  }

  const deleteRequest = async (firebaseId, requestId) => {
    if (!window.confirm(`Delete request ${requestId}?`)) return
    try {
      await deleteDoc(doc(db, 'walletRequests', firebaseId))
      toast.success('Request deleted')
      if (selectedRequest?.firebaseId === firebaseId) {
        setSelectedRequest(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: '⏳',
      },
      approved: {
        label: 'Approved',
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
            <h1 className="admin-page-title">Wallet Requests</h1>
            <p className="admin-page-sub">
              Approve or reject customer wallet top-up requests.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Wallet size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Requests</span>
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
              <span className="admin-stat-trend up">
                ৳{stats.approvedAmount.toFixed(0)} added
              </span>
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
                placeholder="Search by ID, name, email, TrxID..."
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
                { value: 'approved', label: '✅ Approved' },
                { value: 'rejected', label: '❌ Rejected' },
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
            <p>Loading wallet requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>💰</p>
            <h3>No wallet requests</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'Customers will submit top-up requests here.'}
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredRequests.map((r) => {
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
                      Request ID
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
                      {r.requestId}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(r.createdAt)}
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
                      Customer
                    </div>
                    <strong
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        display: 'block',
                      }}
                    >
                      {r.userName}
                    </strong>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {r.userEmail}
                    </span>
                  </div>

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
                      {r.method}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      TrxID: {r.transactionId}
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
                      Amount
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#059669',
                      }}
                    >
                      ৳{r.amount}
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
                      onClick={() => setSelectedRequest(r)}
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

                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(r)}
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
                        <button
                          onClick={() => openRejectModal(r)}
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
                      </>
                    )}

                    <button
                      onClick={() => deleteRequest(r.firebaseId, r.requestId)}
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

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div
          className="outside-area-modal"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 0,
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
                  Wallet Request
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
                  {selectedRequest.requestId}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
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
                <Row label="👤 Customer" value={selectedRequest.userName} />
                <Row label="📧 Email" value={selectedRequest.userEmail} />
                <Row label="💰 Amount" value={`৳${selectedRequest.amount}`} />
                <Row
                  label="💳 Method"
                  value={selectedRequest.method?.toUpperCase()}
                />
                <Row
                  label="📞 Paid To"
                  value={selectedRequest.paymentNumber}
                />
                <Row
                  label="🧾 Transaction ID"
                  value={selectedRequest.transactionId}
                />
                <Row
                  label="📅 Requested"
                  value={formatDate(selectedRequest.createdAt)}
                />
              </div>

              {selectedRequest.status === 'rejected' &&
                selectedRequest.rejectReason && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: '12px',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    ❌ Rejected: {selectedRequest.rejectReason}
                  </div>
                )}

              {selectedRequest.status === 'approved' && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.2)',
                    borderRadius: '12px',
                    color: '#16a34a',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ✅ Approved — money added to customer's wallet
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    style={{
                      padding: '14px',
                      borderRadius: '999px',
                      background:
                        'linear-gradient(135deg, #16a34a, #059669)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => {
                      openRejectModal(selectedRequest)
                      setSelectedRequest(null)
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '999px',
                      background:
                        'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div
          className="outside-area-modal"
          onClick={() => setRejectModal(null)}
          style={{ zIndex: 9999999 }}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', width: '100%', padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                ❌ Reject Request
              </h2>
              <button
                onClick={() => setRejectModal(null)}
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

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '14px',
                lineHeight: 1.5,
              }}
            >
              Rejecting <strong>৳{rejectModal.amount}</strong> request from{' '}
              <strong>{rejectModal.userName}</strong>
            </p>

            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Reason *
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Transaction ID not found, Invalid payment"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '13.5px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-primary)',
                boxSizing: 'border-box',
                resize: 'vertical',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '999px',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                }}
              >
                Confirm Reject
              </button>
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

export default AdminWalletRequestsPage