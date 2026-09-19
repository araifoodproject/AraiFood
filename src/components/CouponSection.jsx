import { useState, useEffect } from 'react'
import { Copy, Check, Ticket } from 'lucide-react'
import { toast } from 'react-toastify'
import { db } from '../firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

function CouponSection() {
  const [copied, setCopied] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'coupons'),
      where('active', '==', true)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        setCoupons(list.slice(0, 3))
        setLoading(false)
      },
      (err) => {
        console.error('Coupons load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success(`${code} copied to clipboard!`, { autoClose: 1500 })
    setTimeout(() => setCopied(null), 2000)
  }

  const getColorClass = (index) => {
    const colors = ['green', 'orange', 'pink']
    return colors[index % colors.length]
  }

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'percent') {
      return `${coupon.discountValue}% OFF`
    }
    return `৳${coupon.discountValue} OFF`
  }

  if (loading || coupons.length === 0) {
    return null // Don't show section if no coupons
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
        {coupons.map((coupon, idx) => (
          <div
            className={`glass-coupon-card glass-coupon-${getColorClass(idx)}`}
            key={coupon.firebaseId}
          >
            <div className="glass-coupon-ticket">
              <Ticket size={20} strokeWidth={2} />
            </div>

            <div className="glass-coupon-content">
              <span className="glass-coupon-discount">
                {formatDiscount(coupon)}
              </span>
              <span className="glass-coupon-desc">
                {coupon.description ||
                  (coupon.minOrder
                    ? `On orders above ৳${coupon.minOrder}`
                    : 'Limited time offer')}
              </span>

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