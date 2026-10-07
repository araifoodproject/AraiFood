// ============================================================
// src/components/PartnerCTA.jsx
// V3 — Bilingual (BN/EN) with Pharmacy
// ============================================================

import { Link } from 'react-router-dom'
import { ArrowRight, Store, Bike, Pill } from 'lucide-react'
import useSettings from '../hooks/useSettings'
import { useLanguage } from '../i18n/LanguageContext'

function PartnerCTA() {
  const { settings } = useSettings()
  const { language } = useLanguage()
  const isBn = language === 'bn'

  const partner = settings.partner || {}
  const restaurant = partner.restaurant || {}
  const rider = partner.rider || {}

  // ✅ Restaurant card — with translated fallback
  const restaurantData = {
    title: restaurant.title || (isBn ? 'রেস্টুরেন্ট আছে?' : 'Own a Restaurant?'),
    subtitle:
      restaurant.subtitle || (isBn ? 'AraiFood এর সাথে পার্টনার হোন' : 'Partner with AraiFood'),
    description:
      restaurant.description ||
      (isBn
        ? 'আপনার রেস্টুরেন্ট রেজিস্টার করুন এবং কাস্টমার এর অর্ডার পান'
        : 'Register your restaurant and receive orders from customers'),
    buttonText:
      restaurant.buttonText ||
      (isBn ? 'রেস্টুরেন্ট হিসেবে যোগ দিন' : 'Join as Restaurant'),
    path: restaurant.path || '/restaurant-signup',
  }

  // ✅ Rider card — with translated fallback
  const riderData = {
    title: rider.title || (isBn ? 'রাইডার হতে চান?' : 'Want to be a Rider?'),
    subtitle:
      rider.subtitle || (isBn ? 'AraiFood এর সাথে পার্টনার হোন' : 'Partner with AraiFood'),
    description:
      rider.description ||
      (isBn
        ? 'ডেলিভারি করুন এবং প্রতিটি অর্ডারে আয় করুন'
        : 'Deliver orders and earn on every delivery'),
    buttonText:
      rider.buttonText || (isBn ? 'রাইডার হিসেবে যোগ দিন' : 'Join as Rider'),
    path: rider.path || '/rider-signup',
  }

  // ✅ Pharmacy card — TRANSLATED (hardcoded)
  const pharmacy = {
    title: isBn ? 'ফার্মেসি আছে?' : 'Own a Pharmacy?',
    subtitle: isBn ? 'AraiFood এর সাথে পার্টনার হোন' : 'Partner with AraiFood',
    description: isBn
      ? 'আপনার ফার্মেসি রেজিস্টার করুন, কাছাকাছি কাস্টমার দের ঔষধ ডেলিভারি করুন'
      : 'Register your pharmacy, deliver medicines to customers nearby',
    buttonText: isBn ? 'ফার্মেসি হিসেবে যোগ দিন' : 'Join as Pharmacy',
    path: '/pharmacy-signup',
  }

  return (
    <section className="aa-section">
      <div className="aa-section-header">
        <div>
          <h2 className="aa-section-title">
            {partner.sectionTitle ||
              (isBn ? 'পার্টনার হোন' : 'Become a Partner')}
          </h2>
          <p className="aa-section-sub">
            {partner.sectionSubtitle ||
              (isBn ? 'আরাইহাজারে আমাদের সাথে বেড়ে উঠুন' : 'Grow with us in Araihazar')}
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
            <h3 className="aa-partner-title">{restaurantData.title}</h3>
            <p className="aa-partner-sub">{restaurantData.subtitle}</p>
            <p className="aa-partner-desc">{restaurantData.description}</p>
            <Link to={restaurantData.path} className="aa-partner-btn">
              {restaurantData.buttonText}
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
            <h3 className="aa-partner-title">{riderData.title}</h3>
            <p className="aa-partner-sub">{riderData.subtitle}</p>
            <p className="aa-partner-desc">{riderData.description}</p>
            <Link to={riderData.path} className="aa-partner-btn">
              {riderData.buttonText}
              <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
          </div>
          <div className="aa-partner-visual">🛵</div>
        </div>

        {/* Pharmacy */}
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