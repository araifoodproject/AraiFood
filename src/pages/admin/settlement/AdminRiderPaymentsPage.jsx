// ============================================================
// src/pages/admin/settlement/AdminRiderPaymentsPage.jsx
// Rider এর পাঠানো payment verify করো
// ============================================================
import { useEffect, useState } from 'react'
import { db } from '../../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  User,
  Phone,
  Copy,
  Send,
  Info,
} from 'lucide-react'
import { tk, fmtDate, genSettlementId } from '../../../utils/settlementHelpers'

const FILTERS = [
  { key: 'pending',  label: '⏳ Pending',  color: '#F59E0B' },
  { key: 'verified', label: '✅ Verified', color: '#16A34A' },
  { key: 'rejected', label: '❌ Rejected', color: '#DC2626' },
  { key: 'all',      label: '📋 All',      color: '#64748B' },
]

export default function AdminRiderPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [verifyingId, setVerifyingId] = useState(null)

  // Load all rider payments (realtime)
  useEffect(() => {
    const q = query(
      collection(db, 'riderPayments'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPayments(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
        setLoading(false)
      },
      (err) => {
        console.error('Rider payments load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // Filter + search
  const filtered = payments.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        (p.riderName || '').toLowerCase().includes(s) ||
        (p.riderPhone || '').toLowerCase().includes(s) ||
        (p.transactionId || '').toLowerCase().includes(s)
      )
    }
    return true
  })

  // Stats
  const stats = {
    pending:  payments.filter((p) => p.status === 'pending').length,
    verified: payments.filter((p) => p.status === 'verified').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
    pendingAmount: payments
      .filter((p) => p.status === 'pending')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    verifiedAmount: payments
      .filter((p) => p.status === 'verified')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
  }

  // Verify payment
  const handleVerify = async (payment) => {
    if (!payment?.id) return
    const confirmed = window.confirm(
      `Verify payment?\n\n` +
        `Rider: ${payment.riderName}\n` +
        `Amount: ${tk(payment.amount)}\n` +
        `Method: ${payment.method}\n` +
        `TrxID: ${payment.transactionId}\n\n` +
        `এটা verify করলে Rider এর Settlement হয়ে যাবে।`
    )
    if (!confirmed) return

    setVerifyingId(payment.id)
    try {
      const now = new Date()

      // 1. Update rider payment status
      await updateDoc(doc(db, 'riderPayments', payment.id), {
        status: 'verified',
        verifiedAt: now,
        verifiedBy: 'Admin',
      })

      // 2. Create a settlement record for history
      const sid = genSettlementId()
      await addDoc(collection(db, 'settlements'), {
        settlementId: sid,
        type: 'rider-cash-payment',
        entityId: payment.riderId,
        entityName: payment.riderName || 'Unknown Rider',
        amount: Number(payment.amount) || 0,
        paymentMethod: payment.method || 'Cash',
        transactionId: payment.transactionId || '',
        paymentNumber: payment.paymentNumber || '',
        note: payment.note || '',
        status: 'paid',
        paidBy: 'Rider (Cash Transfer)',
        verifiedBy: 'Admin',
        createdAt: now,
        riderPaymentId: payment.id,
      })

      // 3. Update rider's lastSettlementAt
      try {
        await updateDoc(doc(db, 'riders', payment.riderId), {
          lastSettlementAt: now,
          settlementStatus: 'paid',
        })
      } catch (e) {
        console.warn('Rider doc update failed:', e)
      }

      toast.success('✅ Payment verified!')
    } catch (err) {
      console.error('Verify error:', err)
      toast.error('Verify failed: ' + err.message)
    } finally {
      setVerifyingId(null)
    }
  }

  // Reject payment
  const handleReject = async (payment) => {
    const reason = window.prompt(
      'Why are you rejecting this payment?\n(Rider এই কারণ দেখতে পাবে)',
      'Transaction ID invalid'
    )
    if (reason === null) return
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error('Reason দিন')
      return
    }

    setVerifyingId(payment.id)
    try {
      await updateDoc(doc(db, 'riderPayments', payment.id), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedReason: trimmed,
        rejectedBy: 'Admin',
      })
      toast.success('Payment rejected')
    } catch (err) {
      console.error('Reject error:', err)
      toast.error('Reject failed: ' + err.message)
    } finally {
      setVerifyingId(null)
    }
  }

  const handleCopy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied')
  }

  return (
    <div className="stl-page">
      {/* HEADER */}
      <div className="stl-header">
        <div>
          <Link to="/admin/settlement" className="stl-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>💸 Rider Payments</h1>
          <p>Rider এর পাঠানো payment verify করো</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            borderLeft: '4px solid #F59E0B',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#92400E',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            ⏳ Pending Verification
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#B45309',
              lineHeight: 1,
            }}
          >
            {tk(stats.pendingAmount)}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#92400E',
              fontWeight: 600,
              marginTop: '6px',
            }}
          >
            {stats.pending} request{stats.pending !== 1 ? 's' : ''}
          </div>
        </div>

        <div
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
            borderLeft: '4px solid #16A34A',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#166534',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            ✅ Verified
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#15803D',
              lineHeight: 1,
            }}
          >
            {tk(stats.verifiedAmount)}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#166534',
              fontWeight: 600,
              marginTop: '6px',
            }}
          >
            {stats.verified} verified
          </div>
        </div>

        <div
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
            borderLeft: '4px solid #DC2626',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#991B1B',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            ❌ Rejected
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#B91C1C',
              lineHeight: 1,
            }}
          >
            {stats.rejected}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#991B1B',
              fontWeight: 600,
              marginTop: '6px',
            }}
          >
            request{stats.rejected !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* INFO */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: '#EFF6FF',
          border: '1px solid #3B82F6',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          fontSize: '13px',
          color: '#1E40AF',
          fontWeight: 600,
        }}
      >
        <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          Rider দের পাঠানো payment verify করার আগে <strong>তোমার bKash/Nagad
          account এ টাকা এসেছে কিনা</strong> check করো। Verify করলে Rider এর
          settlement হয়ে যাবে।
        </div>
      </div>

      {/* FILTER + SEARCH */}
      <div className="stl-filter-bar">
        <div className="stl-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by rider name / phone / TrxID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="stl-period-bar" style={{ marginBottom: 0 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`stl-period-btn ${
                filter === f.key ? 'active' : ''
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="stl-empty">Loading payments...</div>
      ) : filtered.length === 0 ? (
        <div className="stl-empty">
          No {filter === 'all' ? '' : filter} payments found.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {filtered.map((p) => {
            const isPending = p.status === 'pending'
            const isVerified = p.status === 'verified'
            const isRejected = p.status === 'rejected'

            return (
              <div
                key={p.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  border: `2px solid ${
                    isPending
                      ? '#F59E0B'
                      : isVerified
                      ? '#16A34A'
                      : '#DC2626'
                  }`,
                  opacity: verifyingId === p.id ? 0.6 : 1,
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
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <User size={16} />
                      {p.riderName || 'Unknown Rider'}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        fontWeight: 600,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Phone size={12} />
                      {p.riderPhone || '—'} · {fmtDate(p.createdAt)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: isPending
                        ? '#FEF3C7'
                        : isVerified
                        ? '#DCFCE7'
                        : '#FEE2E2',
                      color: isPending
                        ? '#92400E'
                        : isVerified
                        ? '#15803D'
                        : '#B91C1C',
                    }}
                  >
                    {isPending && '⏳ '}
                    {isVerified && '✅ '}
                    {isRejected && '❌ '}
                    {p.status}
                  </div>
                </div>

                {/* Amount + Details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
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
                      Amount Sent
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#15803D',
                      }}
                    >
                      {tk(p.amount)}
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
                      {p.method || 'Cash'}
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
                      Transaction ID
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      <span style={{ wordBreak: 'break-all' }}>
                        {p.transactionId || '—'}
                      </span>
                      {p.transactionId && (
                        <button
                          onClick={() => handleCopy(p.transactionId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            padding: 0,
                            flexShrink: 0,
                          }}
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {p.deliveryCount != null && (
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
                        Deliveries
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#0F172A',
                        }}
                      >
                        {p.deliveryCount}
                      </div>
                    </div>
                  )}
                </div>

                {/* Note */}
                {p.note && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#FFFBEB',
                      border: '1px solid #FCD34D',
                      marginBottom: '14px',
                      fontSize: '12.5px',
                      color: '#92400E',
                      fontWeight: 600,
                    }}
                  >
                    📝 <strong>Note:</strong> {p.note}
                  </div>
                )}

                {/* Rejection reason */}
                {isRejected && p.rejectedReason && (
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
                    ❌ <strong>Reason:</strong> {p.rejectedReason}
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
                    ✅ Verified by {p.verifiedBy || 'Admin'} on{' '}
                    {fmtDate(p.verifiedAt)}
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
                      onClick={() => handleVerify(p)}
                      disabled={verifyingId === p.id}
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor:
                          verifyingId === p.id
                            ? 'not-allowed'
                            : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: verifyingId === p.id ? 0.6 : 1,
                      }}
                    >
                      <CheckCircle size={16} />
                      {verifyingId === p.id
                        ? 'Verifying...'
                        : 'Verify Payment'}
                    </button>

                    <button
                      onClick={() => handleReject(p)}
                      disabled={verifyingId === p.id}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: '1.5px solid #DC2626',
                        background: '#FFFFFF',
                        color: '#DC2626',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor:
                          verifyingId === p.id
                            ? 'not-allowed'
                            : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}