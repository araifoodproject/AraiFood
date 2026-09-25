// ============================================================
// src/components/settlement/AdjustmentModal.jsx
// Bonus / Penalty / Refund / Cancel adjustment
// ============================================================
import { useState } from 'react'
import { db } from '../../firebase'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore'
import { X } from 'lucide-react'
import { tk } from '../../utils/settlementHelpers'
import { toast } from 'react-toastify'

const TYPES = [
  { key: 'bonus',   label: 'Bonus (+)',     sign: 1 },
  { key: 'penalty', label: 'Penalty (−)',   sign: -1 },
  { key: 'refund',  label: 'Refund (−)',    sign: -1 },
  { key: 'cancel',  label: 'Cancelled (−)', sign: -1 },
]

export default function AdjustmentModal({
  entity,
  type,
  onClose,
  onSuccess,
}) {
  const [adjType, setAdjType] = useState('bonus')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const name = entity.restaurantName || entity.riderName || entity.name
  const id = entity.restaurantId || entity.riderId

  const handleSubmit = async () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      toast.error('সঠিক amount দিন')
      return
    }
    setLoading(true)
    try {
      const found = TYPES.find((t) => t.key === adjType)
      const signedAmount = amt * (found?.sign || 1)

      await addDoc(collection(db, 'settlement_adjustments'), {
        entityId: id,
        entityName: name,
        type: adjType,
        amount: signedAmount,
        reason: reason.trim(),
        createdAt: new Date(),
        createdBy: 'Admin',
      })

      const colName = type === 'restaurant' ? 'restaurants' : 'riders'
      await updateDoc(doc(db, colName, id), {
        pendingAdjustment: increment(signedAmount),
      }).catch(() => {})

      toast.success('✅ Adjustment added')
      onSuccess?.()
      onClose()
    } catch (e) {
      toast.error('Failed: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="stl-modal-overlay" onClick={onClose}>
      <div className="stl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stl-modal-head">
          <h3>🧮 Manual Adjustment</h3>
          <button onClick={onClose} className="stl-icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="stl-modal-info">
          <p>
            <strong>
              {type === 'restaurant' ? 'Restaurant' : 'Rider'}:
            </strong>{' '}
            {name}
          </p>
          <p>
            <strong>Current Payable:</strong>{' '}
            {tk(entity.finalPayable || 0)}
          </p>
        </div>

        <div className="stl-form-group">
          <label>Adjustment Type</label>
          <div className="stl-method-pills">
            {TYPES.map((t) => (
              <button
                key={t.key}
                className={`stl-pill ${adjType === t.key ? 'active' : ''}`}
                onClick={() => setAdjType(t.key)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="stl-form-group">
          <label>Amount (৳)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100"
            className="stl-input"
          />
        </div>

        <div className="stl-form-group">
          <label>Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why this adjustment?"
            className="stl-input"
          />
        </div>

        <div className="stl-modal-actions">
          <button onClick={onClose} className="stl-btn stl-btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="stl-btn stl-btn-primary"
          >
            {loading ? 'Saving...' : 'Apply Adjustment'}
          </button>
        </div>
      </div>
    </div>
  )
}