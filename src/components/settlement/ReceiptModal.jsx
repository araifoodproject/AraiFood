// ============================================================
// src/components/settlement/ReceiptModal.jsx
// ============================================================
import { X, Printer } from 'lucide-react'
import { tk, fmtDate } from '../../utils/settlementHelpers'

export default function ReceiptModal({ settlement, onClose }) {
  if (!settlement) return null

  const handlePrint = () => {
    const w = window.open('', '', 'width=800,height=900')
    w.document.write(`
      <html><head><title>Receipt ${settlement.settlementId}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#111}
        .head{text-align:center;border-bottom:2px dashed #999;padding-bottom:16px}
        .head h1{margin:0;color:#ef4444}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
        .total{font-size:20px;font-weight:bold;color:#ef4444;margin-top:16px}
        .foot{text-align:center;margin-top:40px;font-size:12px;color:#666}
      </style></head><body>
        <div class="head"><h1>ARAIFOOD</h1><p>Settlement Receipt</p></div>
        <div class="row"><span>Settlement ID:</span><strong>${settlement.settlementId}</strong></div>
        <div class="row"><span>Type:</span><strong>${settlement.type}</strong></div>
        <div class="row"><span>Entity:</span><strong>${settlement.entityName}</strong></div>
        <div class="row"><span>Date:</span><strong>${fmtDate(settlement.createdAt)}</strong></div>
        <div class="row"><span>Orders:</span><strong>${settlement.orderCount}</strong></div>
        <div class="row"><span>Gross Sales:</span><strong>${tk(settlement.grossSales)}</strong></div>
        <div class="row"><span>Commission:</span><strong>${tk(settlement.commission)}</strong></div>
        <div class="row"><span>Payment:</span><strong>${settlement.paymentMethod}</strong></div>
        <div class="row"><span>Trx ID:</span><strong>${settlement.transactionId}</strong></div>
        <div class="row total"><span>FINAL PAYABLE:</span><span>${tk(settlement.amount)}</span></div>
        <div class="foot">Thank you — AraiFood Settlement System</div>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div className="stl-modal-overlay" onClick={onClose}>
      <div
        className="stl-modal stl-receipt-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stl-modal-head">
          <h3>🧾 Settlement Receipt</h3>
          <button onClick={onClose} className="stl-icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="stl-receipt">
          <div className="stl-receipt-head">
            <h2>ARAIFOOD</h2>
            <p>Settlement Receipt</p>
          </div>
          <div className="stl-receipt-row">
            <span>Settlement ID</span>
            <strong>{settlement.settlementId}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Type</span>
            <strong>{settlement.type}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Entity</span>
            <strong>{settlement.entityName}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Date</span>
            <strong>{fmtDate(settlement.createdAt)}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Orders</span>
            <strong>{settlement.orderCount}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Gross Sales</span>
            <strong>{tk(settlement.grossSales)}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Commission</span>
            <strong>{tk(settlement.commission)}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Payment</span>
            <strong>{settlement.paymentMethod}</strong>
          </div>
          <div className="stl-receipt-row">
            <span>Trx ID</span>
            <strong>{settlement.transactionId}</strong>
          </div>
          <div className="stl-receipt-total">
            <span>Final Payable</span>
            <span>{tk(settlement.amount)}</span>
          </div>
        </div>

        <div className="stl-modal-actions">
          <button onClick={handlePrint} className="stl-btn stl-btn-ghost">
            <Printer size={16} /> Print / PDF
          </button>
          <button onClick={onClose} className="stl-btn stl-btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}