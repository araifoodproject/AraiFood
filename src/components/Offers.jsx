import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, ShoppingBag } from 'lucide-react'

function Offers() {
  return (
    <section className="glass-offer-banner">
      <div className="glass-offer-content">

        <div className="glass-offer-text">
          <div className="glass-offer-badge">
            <Sparkles size={14} strokeWidth={2.5} />
            Special Offer
          </div>

          <h2 className="glass-offer-title">
            Get <span>20% Off</span> Your First Order
          </h2>

          <p className="glass-offer-desc">
            Order your favourite food from local restaurants and enjoy a special discount on your first AraiFood order.
          </p>

          <Link to="/restaurants" className="glass-offer-btn">
            <ShoppingBag size={18} strokeWidth={2.4} />
            Order Now
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        <div className="glass-offer-visual">
          <div className="glass-offer-circle">
            <span className="glass-offer-circle-value">20%</span>
            <span className="glass-offer-circle-label">Discount</span>
          </div>

          <div className="glass-offer-food bubble-one">🍔</div>
          <div className="glass-offer-food bubble-two">🍕</div>
          <div className="glass-offer-food bubble-three">🍗</div>
        </div>

      </div>
    </section>
  )
}

export default Offers