// ============================================================
// src/pages/admin/settlement/AdminSettlementHistoryPage.jsx
// V2 — Error handling added
// ============================================================
import { useEffect, useState } from 'react'
import { db } from '../../../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, Search } from 'lucide-react'
import { tk, fmtDate } from '../../../utils/settlementHelpers'
import ReceiptModal from '../../../components/settlement/ReceiptModal'

export default function AdminSettlementHistoryPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const q = query(
      collection(db, 'settlements'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Settlement history error:', err)
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filtered = rows.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        r.entityName?.toLowerCase().includes(s) ||
        r.settlementId?.toLowerCase().includes(s) ||
        r.transactionId?.toLowerCase().includes(s)
      )
    }
    return true
  })

  return (
    <div className="stl-page">
      <div className="stl-header">
        <div>
          <Link to="/admin/settlement" className="stl-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>📜 Settlement History</h1>
          <p>All past settlements</p>
        </div>
      </div>

      <div className="stl-filter-bar">
        <div className="stl-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name / ID / TrxID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="stl-period-bar">
          {['all', 'restaurant', 'rider'].map((f) => (
            <button
              key={f}
              className={`stl-period-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="stl-empty">Loading history...</div>
      ) : error ? (
        <div className="stl-empty">
          ⚠️ Error loading history: {error}
          <br />
          <br />
          <small>
            Check Firestore rules for `settlements` collection.
          </small>
        </div>
      ) : filtered.length === 0 ? (
        <div className="stl-empty">No settlements found.</div>
      ) : (
        <div className="stl-table-wrap">
          <table className="stl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Entity</th>
                <th>Amount</th>
                <th>Method</th>
                <th>TrxID</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="stl-td-mono">{r.settlementId}</td>
                  <td>{fmtDate(r.createdAt)}</td>
                  <td>
                    <span
                      className={`stl-badge ${
                        r.type === 'restaurant' ? 'blue' : 'purple'
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="stl-td-name">{r.entityName}</td>
                  <td className="stl-td-bold">{tk(r.amount)}</td>
                  <td>{r.paymentMethod}</td>
                  <td className="stl-td-mono">{r.transactionId}</td>
                  <td>
                    <span className="stl-badge paid">paid</span>
                  </td>
                  <td>
                    <button
                      className="stl-icon-btn"
                      onClick={() => setSelected(r)}
                      title="View Receipt"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReceiptModal
          settlement={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}