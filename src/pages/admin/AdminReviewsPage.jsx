import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Star,
  Eye,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Flag,
} from 'lucide-react'

function AdminReviewsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'reviews'),
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
        setReviews(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredReviews = useMemo(() => {
    let result = [...reviews]

    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter)
      result = result.filter((r) => Math.floor(r.rating || 0) === rating)
    }

    if (statusFilter === 'flagged') {
      result = result.filter((r) => r.flagged === true)
    } else if (statusFilter === 'visible') {
      result = result.filter((r) => r.hidden !== true)
    } else if (statusFilter === 'hidden') {
      result = result.filter((r) => r.hidden === true)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.customerName || ''} ${r.comment || ''} ${r.restaurantName || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [reviews, ratingFilter, statusFilter, search])

  const stats = useMemo(() => {
    const total = reviews.length
    const avgRating =
      total > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total
        : 0
    const flagged = reviews.filter((r) => r.flagged === true).length
    const hidden = reviews.filter((r) => r.hidden === true).length

    // Rating distribution
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const star = Math.floor(r.rating || 0)
      if (star >= 1 && star <= 5) dist[star]++
    })

    return { total, avgRating, flagged, hidden, dist }
  }, [reviews])

  const toggleFlag = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'reviews', firebaseId), {
        flagged: !current,
      })
      toast.success(`Review ${!current ? 'flagged' : 'unflagged'}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const toggleHidden = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'reviews', firebaseId), {
        hidden: !current,
      })
      toast.success(`Review ${!current ? 'hidden' : 'visible'}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const deleteReview = async (firebaseId) => {
    if (!window.confirm('Delete this review permanently?')) return
    try {
      await deleteDoc(doc(db, 'reviews', firebaseId))
      toast.success('Review deleted')
      if (selected?.firebaseId === firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
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

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          fill={i <= rating ? '#F59E0B' : 'transparent'}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={2}
        />
      )
    }
    return <div style={{ display: 'flex', gap: '2px' }}>{stars}</div>
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
            <h1 className="admin-page-title">Reviews</h1>
            <p className="admin-page-sub">
              Moderate customer reviews and ratings.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <MessageSquare size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Reviews</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <Star size={24} strokeWidth={2.2} fill="#FFFFFF" />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Average Rating</span>
              <strong className="admin-stat-value">
                {stats.avgRating.toFixed(1)} ⭐
              </strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Flag size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Flagged</span>
              <strong className="admin-stat-value">{stats.flagged}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <X size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Hidden</span>
              <strong className="admin-stat-value">{stats.hidden}</strong>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {stats.total > 0 && (
          <div className="admin-section" style={{ padding: '20px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 14px',
              }}
            >
              ⭐ Rating Distribution
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.dist[star] || 0
                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div
                    key={star}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                    }}
                  >
                    <span
                      style={{
                        minWidth: '40px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {star} ⭐
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '8px',
                        background: 'var(--surface-soft)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background:
                            star >= 4
                              ? 'linear-gradient(90deg, #16a34a, #059669)'
                              : star === 3
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                              : 'linear-gradient(90deg, #dc2626, #b91c1c)',
                          borderRadius: '999px',
                          transition: 'width 0.5s',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        minWidth: '60px',
                        textAlign: 'right',
                        color: 'var(--text-tertiary)',
                        fontWeight: 700,
                      }}
                    >
                      {count} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                )
              })}
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
                placeholder="Search by customer, comment, restaurant..."
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
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
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
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'visible', label: '👁️ Visible' },
                { value: 'flagged', label: '🚩 Flagged' },
                { value: 'hidden', label: '❌ Hidden' },
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
            <p>Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</p>
            <h3>No reviews found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || ratingFilter !== 'all' || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'No customer reviews yet.'}
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredReviews.map((r) => {
              const isHidden = r.hidden === true
              const isFlagged = r.flagged === true
              return (
                <div
                  key={r.firebaseId}
                  style={{
                    background: 'var(--surface-soft)',
                    border: isFlagged
                      ? '1px solid rgba(245,158,11,0.4)'
                      : '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    opacity: isHidden ? 0.55 : 1,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#047857',
                      fontFamily: 'var(--font-heading)',
                      flexShrink: 0,
                    }}
                  >
                    {(r.customerName || 'U')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
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
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {r.customerName || 'Anonymous'}
                      </strong>
                      {renderStars(r.rating || 0)}
                      {isFlagged && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(245,158,11,0.15)',
                            color: '#d97706',
                            fontSize: '10.5px',
                            fontWeight: 800,
                          }}
                        >
                          🚩 Flagged
                        </span>
                      )}
                      {isHidden && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(220,38,38,0.15)',
                            color: '#dc2626',
                            fontSize: '10.5px',
                            fontWeight: 800,
                          }}
                        >
                          ❌ Hidden
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '4px 0 8px',
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {r.comment || '—'}
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
                      <span>🏪 {r.restaurantName || 'Unknown'}</span>
                      <span>🕐 {formatDate(r.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelected(r)}
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
                      onClick={() => toggleFlag(r.firebaseId, isFlagged)}
                      title={isFlagged ? 'Unflag' : 'Flag as inappropriate'}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isFlagged
                          ? 'rgba(245,158,11,0.2)'
                          : 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#d97706',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Flag size={16} fill={isFlagged ? '#d97706' : 'none'} />
                    </button>

                    <button
                      onClick={() => toggleHidden(r.firebaseId, isHidden)}
                      title={isHidden ? 'Show review' : 'Hide review'}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isHidden
                          ? 'rgba(22,163,74,0.12)'
                          : 'rgba(220,38,38,0.12)',
                        border: isHidden
                          ? '1px solid rgba(22,163,74,0.3)'
                          : '1px solid rgba(220,38,38,0.3)',
                        color: isHidden ? '#16a34a' : '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isHidden ? <CheckCircle2 size={16} /> : <X size={16} />}
                    </button>

                    <button
                      onClick={() => deleteReview(r.firebaseId)}
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
      {selected && (
        <div
          className="outside-area-modal"
          onClick={() => setSelected(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              textAlign: 'left',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                Review Details
              </h2>
              <button
                onClick={() => setSelected(null)}
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

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#047857',
                    fontFamily: 'var(--font-heading)',
                    margin: '0 auto 10px',
                  }}
                >
                  {(selected.customerName || 'U')[0].toUpperCase()}
                </div>
                <strong
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {selected.customerName || 'Anonymous'}
                </strong>
                <div style={{ marginTop: '8px' }}>
                  {renderStars(selected.rating || 0)}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selected.comment || '—'}
                </p>
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
                  fontSize: '13px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    🏪 Restaurant
                  </span>
                  <strong>{selected.restaurantName || '—'}</strong>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    🕐 Created
                  </span>
                  <strong>{formatDate(selected.createdAt)}</strong>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    ⭐ Rating
                  </span>
                  <strong>{selected.rating || 0} / 5</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage