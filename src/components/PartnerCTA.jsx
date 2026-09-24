// ============================================================
// src/components/PartnerCTA.jsx — V2 (with Pharmacy)
// ============================================================

import { Link } from 'react-router-dom'
import { ArrowRight, Store, Bike, Pill } from 'lucide-react'
import useSettings from '../hooks/useSettings'

function PartnerCTA() {
  const { settings } = useSettings()
  const partner = settings.partner || {}
  const restaurant = partner.restaurant || {}
  const rider = partner.rider || {}

  // Pharmacy defaults (until admin panel controls it)
  const pharmacy = {
    title: 'Own a Pharmacy?',
    subtitle: 'Partner with AraiFood',
    description:
      'Register your pharmacy, deliver medicines to customers nearby',
    buttonText: 'Join as Pharmacy',
    path: '/pharmacy-signup',
  }

  return (
    <section className="aa-section">
      <div className="aa-section-header">
        <div>
          <h2 className="aa-section-title">
            {partner.sectionTitle || 'Become a Partner'}
          </h2>
          <p className="aa-section-sub">
            {partner.sectionSubtitle || 'Grow with us in Araihazar'}
          </p>
        </div>
      </div>

      <div
        className="aa-partner-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {/* Restaurant */}
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

        {/* Rider */}
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

        {/* Pharmacy (NEW) */}
        <div className="aa-partner-card restaurant">
          <div className="aa-partner-content">
            <div className="aa-partner-icon-circle">
              <Pill size={28} strokeWidth={2.2} />
            </div>
            <h3 className="aa-partner-title">{pharmacy.title}</h3>
            <p className="aa-partner-sub">{pharmacy.subtitle}</p>
            <p className="aa-partner-desc">{pharmacy.description}</p>
            <Link to={pharmacy.path} className="aa-partner-btn">
              {pharmacy.buttonText}
              <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
          </div>
          <div className="aa-partner-visual">💊</div>
        </div>
      </div>
    </section>
  )
}

export default PartnerCTA