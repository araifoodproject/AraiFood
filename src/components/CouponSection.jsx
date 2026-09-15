import { useState } from 'react'
import { Copy, Check, Ticket } from 'lucide-react'
import { toast } from 'react-toastify'

function CouponSection() {
  const [copied, setCopied] = useState(null)

  const coupons = [
    { id: 1, code: 'SAVE10', discount: '10% OFF', description: 'On your first order', color: 'green' },
    { id: 2, code: 'WELCOME20', discount: '20% OFF', description: 'On orders above ৳300', color: 'orange' },
    { id: 3, code: 'FREEDEL', discount: 'FREE Delivery', description: 'On orders above ৳500', color: 'pink' },
  ]

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success(`${code} copied to clipboard!`)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <section className="glass-section">
      <div className="glass-section-header">
        <div>
          <span className="glass-section-label">DEALS & OFFERS</span>
          <h2 className="glass-section-title">Coupons & Vouchers</h2>
          <p className="glass-section-sub">Save more on your next order</p>
        </div>
      </div>

      <div className="glass-coupon-grid">
        {coupons.map((coupon) => (
          <div className={`glass-coupon-card glass-coupon-${coupon.color}`} key={coupon.id}>
            <div className="glass-coupon-ticket">
              <Ticket size={20} strokeWidth={2} />
            </div>

            <div className="glass-coupon-content">
              <span className="glass-coupon-discount">{coupon.discount}</span>
              <span className="glass-coupon-desc">{coupon.description}</span>

              <button
                className="glass-coupon-code"
                onClick={() => copyCoupon(coupon.code)}
              >
                <span>{coupon.code}</span>
                {copied === coupon.code ? (
                  <Check size={14} strokeWidth={2.8} />
                ) : (
                  <Copy size={14} strokeWidth={2.2} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default CouponSection