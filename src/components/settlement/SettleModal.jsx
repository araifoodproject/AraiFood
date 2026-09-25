// ============================================================
// src/components/settlement/SettleModal.jsx
// V10 — PERMANENT: update lastSettlementAt (not settlementStatus)
// ============================================================
import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { X, Loader } from 'lucide-react'
import { tk, genSettlementId } from '../../utils/settlementHelpers'
import { toast } from 'react-toastify'

const METHODS = ['bKash', 'Nagad', 'Rocket', 'Bank', 'Cash']

function resolveTypeConfig(type) {
  if (type === 'restaurant')
    return {
      collection: 'restaurants',
      nameField: 'restaurantName',
      idField: 'restaurantId',
      label: 'Restaurant',
    }
  if (type === 'pharmacy')
    return {
      collection: 'pharmacies',
      nameField: 'pharmacyName',
      idField: 'pharmacyId',
      label: 'Pharmacy',
    }
  return {
    collection: 'riders',
    nameField: 'fullName',
    idField: 'riderId',
    label: 'Rider',
  }
}

export default function SettleModal({ entity, type, onClose, onSuccess }) {
  const cfg = resolveTypeConfig(type)

  const [method, setMethod] = useState('bKash')
  const [trxId, setTrxId] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [entityDoc, setEntityDoc] = useState(null)
  const [resolvedId, setResolvedId] = useState(null)
  const [payNumber, setPayNumber] = useState('—')

  const name =
    entity.riderName ||
    entity.restaurantName ||
    entity.pharmacyName ||
    entity.name ||
    entity.entityName ||
    'Unknown'

  const payable = entity.finalPayable ?? entity.payable ?? 0

  // Fetch full entity doc
  useEffect(() => {
    let cancelled = false

    const fetchEntityDoc = async () => {
      const { collection: colName, nameField, idField } = cfg
      const initialId = entity[idField] || entity.id

      let docData = null
      let finalId = initialId

      // Try 1: by ID
      if (initialId) {
        try {
          const snap = await getDoc(doc(db, colName, initialId))
          if (snap.exists()) {
            docData = snap.data()
            finalId = initialId
          }
        } catch (e) {
          console.error('Try 1 failed:', e.message)
        }
      }

      // Try 2: by name (for duplicate IDs)
      if (!docData && name && name !== 'Unknown') {
        try {
          const q = query(
            collection(db, colName),
            where(nameField, '==', name)
          )
          const snap = await getDocs(q)
          if (!snap.empty) {
            const first = snap.docs[0]
            docData = first.data()
            finalId = first.id
          }
        } catch (e) {
          console.error('Try 2 failed:', e.message)
        }
      }

      if (cancelled) return

      if (docData) {
        setEntityDoc(docData)
        setResolvedId(finalId)
      } else {
        setEntityDoc(null)
      }
      setFetching(false)
    }

    fetchEntityDoc()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, type, name])

  // Recompute payNumber on method change
  useEffect(() => {
    if (!entityDoc) {
      setPayNumber('—')
      return
    }
    const paymentMethods = entityDoc.paymentMethods || {}
    const methodData = paymentMethods[method]

    let num = ''
    if (method === 'Cash') {
      num = 'Cash payment'
    } else if (methodData?.number) {
      num = methodData.number
    } else {
      if (method === 'bKash') num = entityDoc.bkashNumber || ''
      if (method === 'Nagad') num = entityDoc.nagadNumber || ''
      if (method === 'Rocket') num = entityDoc.rocketNumber || ''
      if (method === 'Bank') num = entityDoc.bankAccount || ''
    }
    if (!num && entityDoc.phone) num = entityDoc.phone
    setPayNumber(num || '—')
  }, [method, entityDoc])

  const handleSubmit = async () => {
    if (method !== 'Cash' && !trxId.trim()) {
      toast.error('Transaction ID দিন')
      return
    }
    if (method !== 'Cash' && payNumber === '—') {
      const ok = window.confirm(
        `⚠️ "${method}" এর number save করা নেই। তবুও চালিয়ে যাবেন?`
      )
      if (!ok) return
    }

    setLoading(true)
    try {
      const sid = genSettlementId()
      const { collection: colName, idField } = cfg
      const finalId = resolvedId || entity[idField]

      // ✅ Save settlement record
      await addDoc(collection(db, 'settlements'), {
        settlementId: sid,
        type,
        entityId: finalId,
        entityName: name,
        amount: payable,
        grossSales: entity.grossSales || 0,
        commission: entity.commission || 0,
        orderCount: entity.orderCount || entity.deliveries || 0,
        paymentMethod: method,
        transactionId: trxId.trim() || 'CASH',
        paymentNumber: payNumber,
        note: note.trim(),
        status: 'paid',
        paidBy: 'Admin',
        createdAt: new Date(),
      })

      // ✅ PERMANENT: update lastSettlementAt (timestamp based)
      // Also keep settlementStatus for backward compat
      if (finalId) {
        await updateDoc(doc(db, colName, finalId), {
          lastSettlementAt: new Date(),
          settlementStatus: 'paid',
        }).catch((e) =>
          console.warn('settlementStatus update failed:', e)
        )
      }

      toast.success('✅ Settlement successful!')
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Settlement failed: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="stl-modal-overlay" onClick={onClose}>
      <div className="stl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stl-modal-head">
          <h3>💰 Settle Payment</h3>
          <button onClick={onClose} className="stl-icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="stl-modal-info">
          <p>
            <strong>{cfg.label}:</strong> {name}
          </p>
          <p>
            <strong>Payable:</strong>{' '}
            <span className="stl-amount">{tk(payable)}</span>
          </p>
          <p>
            <strong>Payment Number ({method}):</strong>{' '}
            {fetching ? (
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                <Loader
                  size={12}
                  style={{
                    verticalAlign: 'middle',
                    animation: 'spin 1s linear infinite',
                  }}
                />{' '}
                Loading...
              </span>
            ) : (
              <span className="stl-pay-number">{payNumber}</span>
            )}
          </p>
        </div>

        <div className="stl-form-group">
          <label>Payment Method</label>
          <div className="stl-method-pills">
            {METHODS.map((m) => (
              <button
                key={m}
                className={`stl-pill ${method === m ? 'active' : ''}`}
                onClick={() => setMethod(m)}
                type="button"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {method !== 'Cash' && (
          <div className="stl-form-group">
            <label>Transaction ID</label>
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="e.g. TRX123456"
              className="stl-input"
            />
          </div>
        )}

        <div className="stl-form-group">
          <label>Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any notes..."
            className="stl-input"
          />
        </div>

        <div className="stl-modal-actions">
          <button onClick={onClose} className="stl-btn stl-btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || fetching}
            className="stl-btn stl-btn-primary"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}