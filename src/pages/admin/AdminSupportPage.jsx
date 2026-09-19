import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  LifeBuoy,
  Eye,
  Send,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'

function AdminSupportPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'supportTickets'),
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
        setTickets(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredTickets = useMemo(() => {
    let result = [...tickets]

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) =>
        `${t.subject || ''} ${t.message || ''} ${t.userName || ''} ${t.userEmail || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [tickets, statusFilter, search])

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in-progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    }
  }, [tickets])

  const updateStatus = async (firebaseId, newStatus) => {
    try {
      await updateDoc(doc(db, 'supportTickets', firebaseId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Ticket marked as ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const deleteTicket = async (firebaseId) => {
    if (!window.confirm('Delete this ticket permanently?')) return
    try {
      await deleteDoc(doc(db, 'supportTickets', firebaseId))
      toast.success('Ticket deleted')
      if (selected?.firebaseId === firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return
    setSendingReply(true)
    try {
      const reply = {
        text: replyText.trim(),
        from: 'admin',
        createdAt: new Date().toISOString(),
      }

      // Add reply to replies array
      const existingReplies = selected.replies || []
      await updateDoc(doc(db, 'supportTickets', selected.firebaseId), {
        replies: [...existingReplies, reply],
        status: 'in-progress',
        updatedAt: serverTimestamp(),
      })

      toast.success('Reply sent!')
      setReplyText('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      open: { label: 'Open', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', icon: '🔴' },
      'in-progress': { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🟡' },
      resolved: { label: 'Resolved', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', icon: '🟢' },
      closed: { label: 'Closed', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: '⚫' },
    }
    return map[status] || map.open
  }

  const getPriorityBadge = (priority) => {
    const map = {
      high: { label: 'High', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
      medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      low: { label: 'Low', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    }
    return map[priority] || map.medium
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
            <h1 className="admin-page-title">Support</h1>
            <p className="admin-page-sub">
              Respond to customer queries and support tickets.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <LifeBuoy size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Tickets</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <AlertCircle size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Open</span>
              <strong className="admin-stat-value">{stats.open}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Clock size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">In Progress</span>
              <strong className="admin-stat-value">{stats.inProgress}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Resolved</span>
              <strong className="admin-stat-value">{stats.resolved}</strong>
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
                placeholder="Search tickets..."
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
                { value: 'open', label: '🔴 Open' },
                { value: 'in-progress', label: '🟡 In Progress' },
                { value: 'resolved', label: '🟢 Resolved' },
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
            <p>Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎫</p>
            <h3>No support tickets</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'All caught up! No pending tickets.'}
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredTickets.map((t) => {
              const statusBadge = getStatusBadge(t.status)
              const priorityBadge = getPriorityBadge(t.priority)
              const hasReplies = (t.replies?.length || 0) > 0
              return (
                <div
                  key={t.firebaseId}
                  style={{
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: statusBadge.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}
                  >
                    🎫
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        marginBottom: '6px',
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
                        {t.subject || 'No Subject'}
                      </strong>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          fontSize: '11px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: priorityBadge.bg,
                          color: priorityBadge.color,
                          fontSize: '11px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {priorityBadge.label}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '4px 0 8px',
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {t.message || '—'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '11.5px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      <span>👤 {t.userName || 'User'}</span>
                      {t.userEmail && <span>📧 {t.userEmail}</span>}
                      <span>🕐 {formatDate(t.createdAt)}</span>
                      {hasReplies && (
                        <span>
                          💬 {t.replies.length} repl{t.replies.length === 1 ? 'y' : 'ies'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelected(t)}
                      title="View & Reply"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Eye size={14} />
                      View
                    </button>

                    {t.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(t.firebaseId, 'resolved')}
                        title="Mark Resolved"
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

                    <button
                      onClick={() => deleteTicket(t.firebaseId)}
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

      {/* Ticket Detail Modal with Reply */}
      {selected && (
        <div
          className="outside-area-modal"
          onClick={() => setSelected(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
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
                  Support Ticket
                </span>
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
                  {selected.subject || 'No Subject'}
                </h2>
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
            <div
              style={{
                padding: '20px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* User Info */}
              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>👤 From</span>
                  <strong>{selected.userName || 'User'}</strong>
                </div>
                {selected.userEmail && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📧 Email</span>
                    <strong style={{ wordBreak: 'break-all', textAlign: 'right' }}>
                      {selected.userEmail}
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🕐 Created</span>
                  <strong>{formatDate(selected.createdAt)}</strong>
                </div>
              </div>

              {/* Original Message */}
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
                  💬 Original Message
                </strong>
                <div
                  style={{
                    padding: '14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {selected.message || '—'}
                </div>
              </div>

              {/* Replies */}
              {selected.replies?.length > 0 && (
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
                    💬 Replies ({selected.replies.length})
                  </strong>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {selected.replies.map((rep, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 14px',
                          background:
                            rep.from === 'admin'
                              ? 'rgba(5,150,105,0.08)'
                              : 'var(--surface-soft)',
                          border:
                            rep.from === 'admin'
                              ? '1px solid rgba(5,150,105,0.2)'
                              : '1px solid var(--border)',
                          borderRadius: '12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color:
                              rep.from === 'admin' ? '#059669' : 'var(--text-tertiary)',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {rep.from === 'admin' ? '👑 Admin' : '👤 User'}
                        </div>
                        <div
                          style={{
                            fontSize: '13.5px',
                            color: 'var(--text-primary)',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {rep.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input */}
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
                  ✍️ Your Reply
                </strong>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'var(--font-primary)',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyText.trim()}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '14px',
                    borderRadius: '999px',
                    background:
                      sendingReply || !replyText.trim()
                        ? 'var(--surface-soft)'
                        : 'linear-gradient(135deg, #059669, #047857)',
                    color:
                      sendingReply || !replyText.trim()
                        ? 'var(--text-tertiary)'
                        : '#FFFFFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor:
                      sendingReply || !replyText.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow:
                      sendingReply || !replyText.trim()
                        ? 'none'
                        : '0 4px 12px rgba(5,150,105,0.3)',
                  }}
                >
                  <Send size={16} strokeWidth={2.4} />
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSupportPage