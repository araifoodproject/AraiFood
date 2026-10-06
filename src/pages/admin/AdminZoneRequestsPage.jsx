// ============================================================
// src/pages/admin/AdminZoneRequestsPage.jsx
// Zone Requests — grouped by demand
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
import {
  Menu,
  MapPin,
  Users,
  CheckCircle,
  Trash2,
  Search,
  X,
  Phone,
  Mail,
  TrendingUp,
  Clock,
} from 'lucide-react'

function AdminZoneRequestsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | pending | reviewed
  const [expandedGroup, setExpandedGroup] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'zoneRequests'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
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

  // Group by zone name
  const groupedRequests = useMemo(() => {
    const groups = {}
    requests.forEach((r) => {
      const key = (r.zoneName || '').toLowerCase().trim()
      if (!key) return
      if (!groups[key]) {
        groups[key] = {
          zoneName: r.zoneName,
          zoneNameLower: key,
          requests: [],
          count: 0,
          pendingCount: 0,
          reviewedCount: 0,
          latestAt: 0,
        }
      }
      groups[key].requests.push(r)
      groups[key].count += 1
      if (r.status === 'reviewed') groups[key].reviewedCount += 1
      else groups[key].pendingCount += 1
      const t = r.createdAt?.toDate?.()?.getTime() || 0
      if (t > groups[key].latestAt) groups[key].latestAt = t
    })

    let result = Object.values(groups)

    // Filter
    if (filter === 'pending') {
      result = result.filter((g) => g.pendingCount > 0)
    } else if (filter === 'reviewed') {
      result = result.filter((g) => g.reviewedCount === g.count)
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((g) =>
        g.zoneName.toLowerCase().includes(q)
      )
    }

    // Sort by count DESC
    result.sort((a, b) => b.count - a.count)

    return result
  }, [requests, search, filter])

  // Stats
  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((r) => r.status !== 'reviewed').length
    const reviewed = requests.filter((r) => r.status === 'reviewed').length
    const uniqueZones = new Set(
      requests.map((r) => (r.zoneName || '').toLowerCase().trim())
    ).size
    return { total, pending, reviewed, uniqueZones }
  }, [requests])

  // Actions
  const markGroupReviewed = async (group) => {
    if (
      !window.confirm(
        `Mark all ${group.count} requests for "${group.zoneName}" as Reviewed?`
      )
    )
      return
    try {
      const pendingReqs = group.requests.filter(
        (r) => r.status !== 'reviewed'
      )
      for (const r of pendingReqs) {
        await updateDoc(doc(db, 'zoneRequests', r.firebaseId), {
          status: 'reviewed',
          reviewedAt: new Date(),
        })
      }
      toast.success(`✅ ${pendingReqs.length} request Reviewed marked`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to mark reviewed')
    }
  }

  const deleteRequest = async (firebaseId) => {
    if (!window.confirm('Delete this request?')) return
    try {
      await deleteDoc(doc(db, 'zoneRequests', firebaseId))
      toast.success('Deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const deleteGroup = async (group) => {
    if (
      !window.confirm(
        `Delete ALL ${group.count} requests for "${group.zoneName}"?`
      )
    )
      return
    try {
      for (const r of group.requests) {
        await deleteDoc(doc(db, 'zoneRequests', r.firebaseId))
      }
      toast.success(`Deleted ${group.count} requests`)
      if (expandedGroup === group.zoneNameLower) setExpandedGroup(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed')
    }
  }

  const formatTime = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString()
  }

  const getDemandLevel = (count) => {
    if (count >= 5)
      return { label: '🔥 High', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' }
    if (count >= 2)
      return { label: '💡 Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
    return { label: '🌱 Low', color: '#10B981', bg: 'rgba(16,185,129,0.1)' }
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
            <h1 className="admin-page-title">Zone Requests</h1>
            <p className="admin-page-sub">
              নতুন এলাকার চাহিদা — যত বেশি request সেই এলাকা আগে।
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
              <CheckCircle size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Reviewed</span>
              <strong className="admin-stat-value">{stats.reviewed}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <TrendingUp size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Unique Zones</span>
              <strong className="admin-stat-value">{stats.uniqueZones}</strong>
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
                placeholder="Search zone..."
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
                { value: 'reviewed', label: 'Reviewed' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background:
                      filter === opt.value
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface)',
                    color:
                      filter === opt.value
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    border:
                      filter === opt.value
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
            <p>Loading requests...</p>
          </div>
        ) : groupedRequests.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>📍</p>
            <h3>No requests yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Customers যেহেতু request করবে, সেগুলো এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {groupedRequests.map((group) => {
              const demand = getDemandLevel(group.count)
              const isExpanded = expandedGroup === group.zoneNameLower

              return (
                <div
                  key={group.zoneNameLower}
                  style={{
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Group header */}
                  <div
                    style={{
                      padding: '18px',
                      display: 'flex',
                      gap: '14px',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background:
                          'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
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
                          fontSize: '16px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          display: 'block',
                          marginBottom: '4px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {group.zoneName}
                      </strong>
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          flexWrap: 'wrap',
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: demand.bg,
                            color: demand.color,
                            fontWeight: 800,
                            fontSize: '11.5px',
                          }}
                        >
                          {demand.label}
                        </span>
                        <span>👥 {group.count} requests</span>
                        {group.pendingCount > 0 && (
                          <span style={{ color: '#F59E0B', fontWeight: 800 }}>
                            ⏳ {group.pendingCount} pending
                          </span>
                        )}
                        {group.reviewedCount > 0 && (
                          <span style={{ color: '#16A34A', fontWeight: 800 }}>
                            ✅ {group.reviewedCount} reviewed
                          </span>
                        )}
                        <span>🕐 {formatTime({ toDate: () => new Date(group.latestAt) })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : group.zoneNameLower)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '999px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border-strong)',
                          color: 'var(--text-secondary)',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? '▲ Hide' : '▼ View All'}
                      </button>

                      {group.pendingCount > 0 && (
                        <button
                          onClick={() => markGroupReviewed(group)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '999px',
                            background:
                              'linear-gradient(135deg, #059669, #047857)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                          }}
                        >
                          <CheckCircle size={14} />
                          Mark Reviewed
                        </button>
                      )}

                      <button
                        onClick={() => deleteGroup(group)}
                        title="Delete all"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(220,38,38,0.1)',
                          border: '1px solid rgba(220,38,38,0.3)',
                          color: '#DC2626',
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

                  {/* Expanded individual requests */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 18px 18px',
                        borderTop: '1px dashed var(--border)',
                        paddingTop: '14px',
                      }}
                    >
                      {group.requests.map((r) => (
                        <div
                          key={r.firebaseId}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            marginBottom: '8px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            opacity: r.status === 'reviewed' ? 0.6 : 1,
                          }}
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(5,150,105,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '15px',
                              fontWeight: 900,
                              color: '#047857',
                              flexShrink: 0,
                            }}
                          >
                            {(r.customerName || 'A')[0].toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: '160px' }}>
                            <strong
                              style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                display: 'block',
                                marginBottom: '2px',
                              }}
                            >
                              {r.customerName || 'Anonymous'}
                            </strong>
                            <div
                              style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                                fontSize: '11.5px',
                                color: 'var(--text-tertiary)',
                                fontWeight: 600,
                              }}
                            >
                              {r.customerPhone && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Phone size={11} /> {r.customerPhone}
                                </span>
                              )}
                              {r.customerEmail && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Mail size={11} /> {r.customerEmail}
                                </span>
                              )}
                              <span>🕐 {formatTime(r.createdAt)}</span>
                            </div>
                            {r.notes && (
                              <p
                                style={{
                                  margin: '6px 0 0',
                                  fontSize: '12px',
                                  color: 'var(--text-secondary)',
                                  fontStyle: 'italic',
                                }}
                              >
                                "{r.notes}"
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {r.status === 'reviewed' ? (
                              <span
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(22,163,74,0.12)',
                                  color: '#16A34A',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                }}
                              >
                                ✅ Reviewed
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(245,158,11,0.12)',
                                  color: '#F59E0B',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                }}
                              >
                                ⏳ Pending
                              </span>
                            )}
                            <button
                              onClick={() => deleteRequest(r.firebaseId)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'rgba(220,38,38,0.1)',
                                border: '1px solid rgba(220,38,38,0.25)',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminZoneRequestsPage