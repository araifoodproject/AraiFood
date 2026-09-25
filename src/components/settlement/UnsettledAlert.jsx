// ============================================================
// src/components/settlement/UnsettledAlert.jsx
// V2 — Uses computedStatus from parent (period-aware)
// ============================================================
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { tk } from '../../utils/settlementHelpers'

export default function UnsettledAlert({
  restaurantRows,
  riderRows,
  restaurants,
  riders,
}) {
  // ✅ Use computedStatus from parent, not raw settlementStatus
  const unpaidRest = restaurantRows.filter(
    (r) => r.computedStatus !== 'paid'
  )
  const unpaidRider = riderRows.filter(
    (r) => r.computedStatus !== 'paid'
  )

  const unsettledAmount =
    unpaidRest.reduce((s, r) => s + (r.finalPayable || 0), 0) +
    unpaidRider.reduce((s, r) => s + (r.finalPayable || 0), 0)

  const totalAmount =
    restaurantRows.reduce((s, r) => s + (r.finalPayable || 0), 0) +
    riderRows.reduce((s, r) => s + (r.finalPayable || 0), 0)

  const settledAmount = totalAmount - unsettledAmount

  return (
    <div className="stl-alert-row">
      <div className="stl-alert red">
        <div className="stl-alert-icon">
          <AlertCircle size={22} />
        </div>
        <div>
          <p className="stl-alert-label">🔴 Unsettled</p>
          <p className="stl-alert-value">{tk(unsettledAmount)}</p>
          <p className="stl-alert-sub">
            {unpaidRest.length} Restaurants · {unpaidRider.length} Riders
          </p>
        </div>
      </div>
      <div className="stl-alert green">
        <div className="stl-alert-icon">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <p className="stl-alert-label">🟢 Settled</p>
          <p className="stl-alert-value">{tk(settledAmount)}</p>
          <p className="stl-alert-sub">
            {restaurantRows.length - unpaidRest.length} Restaurants ·{' '}
            {riderRows.length - unpaidRider.length} Riders
          </p>
        </div>
      </div>
    </div>
  )
}