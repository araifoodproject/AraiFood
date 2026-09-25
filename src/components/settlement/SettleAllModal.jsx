// ============================================================
// src/components/settlement/SettleAllModal.jsx
// Bulk settlement (Restaurants + Riders)
// ============================================================
import { useState } from 'react'
import { db } from '../../firebase'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { X, AlertTriangle } from 'lucide-react'
import { tk, genSettlementId } from '../../utils/settlementHelpers'
import { toast } from 'react-toastify'

export default function SettleAllModal({
  restaurantRows,
  riderRows,
  onClose,
  onSuccess,
}) {
  const [method, setMethod] = useState('bKash')
  const [loading, setLoading] = useState(false)

  const totalRestaurant = restaurantRows.reduce(
    (s, r) => s + (r.finalPayable || 0),
    0
  )
  const totalRider = riderRows.reduce((s, r) => s + (r.finalPayable || 0), 0)
  const grandTotal = totalRestaurant + totalRider
  const totalCount = restaurantRows.length + riderRows.length

  const handleConfirm = async () => {
    if (totalCount === 0) {
      toast.warning('No pending settlements')
      return
    }
    setLoading(true)
    try {
      const now = new Date()
      const promises = []

      // Restaurants
      restaurantRows.forEach((r) => {
        const sid = genSettlementId()
        promises.push(
          addDoc(collection(db, 'settlements'), {
            settlementId: sid,
            type: 'restaurant',
            entityId: r.restaurantId,
            entityName: r.restaurantName,
            amount: r.finalPayable,
            grossSales: r.grossSales,
            commission: r.commission,
            orderCount: r.orderCount,
            paymentMethod: method,
            transactionId: 'BULK-' + sid,
            status: 'paid',
            paidBy: 'Admin (Bulk)',
            createdAt: now,
          })
        )
        promises.push(
          updateDoc(doc(db, 'restaurants', r.restaurantId), {
            settlementStatus: 'paid',
            lastSettlementAt: now,
          }).catch(() => {})
        )
      })

      // Riders
      riderRows.forEach((r) => {
        const sid = genSettlementId()
        promises.push(
          addDoc(collection(db, 'settlements'), {
            settlementId: sid,
            type: 'rider',
            entityId: r.riderId,
            entityName: r.riderName,
            amount: r.finalPayable,
            orderCount: r.deliveries,
            paymentMethod: method,
            transactionId: 'BULK-' + sid,
            status: 'paid',
            paidBy: 'Admin (Bulk)',
            createdAt: now,
          })
        )
        promises.push(
          updateDoc(doc(db, 'riders', r.riderId), {
            settlementStatus: 'paid',
            lastSettlementAt: now,
          }).catch(() => {})
        )
      })

      await Promise.all(promises)
      toast.success(`✅ ${totalCount} settlements completed`)
      onSuccess?.()
      onClose()
    } catch (e) {
      console.error(e)
      toast.error('Bulk settlement failed: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="stl-modal-overlay" onClick={onClose}>
      <div className="stl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stl-modal-head">
          <h3>💰 Settle All</h3>
          <button onClick={onClose} className="stl-icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="stl-warning">
          <AlertTriangle size={20} />
          <p>Are you sure? This will settle all pending payouts.</p>
        </div>

        <div className="stl-modal-info">
          <p>
            <strong>🏪 Restaurants:</strong> {restaurantRows.length} —{' '}
            {tk(totalRestaurant)}
          </p>
          <p>
            <strong>🛵 Riders:</strong> {riderRows.length} — {tk(totalRider)}
          </p>
          <div className="stl-divider" />
          <p className="stl-grand-total">
            <strong>Total:</strong> {tk(grandTotal)}
          </p>
        </div>

        <div className="stl-form-group">
          <label>Payment Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="stl-input"
          >
            <option>bKash</option>
            <option>Nagad</option>
            <option>Rocket</option>
            <option>Bank</option>
            <option>Cash</option>
          </select>
        </div>

        <div className="stl-modal-actions">
          <button onClick={onClose} className="stl-btn stl-btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || totalCount === 0}
            className="stl-btn stl-btn-danger"
          >
            {loading ? 'Processing...' : `Confirm ${totalCount} Settlements`}
          </button>
        </div>
      </div>
    </div>
  )
}