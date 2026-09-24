// ============================================================
// src/components/PartnerCTA.jsx
// FULLY REAL-TIME — all text from settings.partner
// ============================================================

import { Link } from 'react-router-dom'
import { ArrowRight, Store, Bike } from 'lucide-react'
import useSettings from '../hooks/useSettings'

function PartnerCTA() {
  const { settings } = useSettings()
  const partner = settings.partner || {}
  const restaurant = partner.restaurant || {}
  const rider = partner.rider || {}

  return (
    <section className="aa-section">
      <div className="aa-section-header">
        <div>
          <h2 className="aa-section-title">{partner.sectionTitle}</h2>
          <p className="aa-section-sub">{partner.sectionSubtitle}</p>
        </div>
      </div>

      <div className="aa-partner-grid">
        {/* Restaurant Partner */}
        <div className="aa-partner-card restaurant">
          <div className="aa-partner-content">
            <div className="aa-partner-icon-circle">
              <Store size={28} strokeWidth={2.2} />
            </div>
            <h3 className="aa-partner-title">{restaurant.title}</h3>
            <p className="aa-partner-sub">{restaurant.subtitle}</p>
            <p className="aa-partner-desc">{restaurant.description}</p>
            <Link to={restaurant.path} className="aa-partner-btn">
              {restaurant.buttonText}
              <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
          </div>
          <div className="aa-partner-visual">🏪</div>
        </div>

        {/* Rider Partner */}
        <div className="aa-partner-card rider">
          <div className="aa-partner-content">
            <div className="aa-partner-icon-circle">
              <Bike size={28} strokeWidth={2.2} />
            </div>
            <h3 className="aa-partner-title">{rider.title}</h3>
            <p className="aa-partner-sub">{rider.subtitle}</p>
            <p className="aa-partner-desc">{rider.description}</p>
            <Link to={rider.path} className="aa-partner-btn">
              {rider.buttonText}
              <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
          </div>
          <div className="aa-partner-visual">🛵</div>
        </div>
      </div>
    </section>
  )
}

export default PartnerCTA