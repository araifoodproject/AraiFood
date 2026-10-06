// ============================================================
// src/components/Hero.jsx
// V2 — Compact Feature Strip (4 columns everywhere)
// + Inline style overrides for .aa-features
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react'
import serviceFood from '../assets/images/service-food.png'
import servicePharmacy from '../assets/images/service-pharmacy.png'
import serviceGaming from '../assets/images/service-gaming.png'
import useSettings from '../hooks/useSettings'

// ============================================================
// Compact Feature Strip CSS — 4 columns everywhere
// ============================================================
const FEATURE_STYLES = `
  /* Feature strip — super compact */
  .aa-features {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 10px !important;
    margin: 16px 0 !important;
    padding: 0 !important;
  }

  .aa-feature-item {
    padding: 10px 6px !important;
    border-radius: 12px !important;
    text-align: center !important;
    min-height: unset !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
  }

  .aa-feature-icon {
    width: 38px !important;
    height: 38px !important;
    min-width: 38px !important;
    min-height: 38px !important;
    font-size: 18px !important;
    margin: 0 auto 6px !important;
    border-radius: 10px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
  }

  .aa-feature-title {
    font-size: 12px !important;
    font-weight: 800 !important;
    margin: 0 0 2px !important;
    line-height: 1.2 !important;
    color: var(--text-primary) !important;
  }

  .aa-feature-desc {
    font-size: 10px !important;
    margin: 0 !important;
    line-height: 1.25 !important;
    color: var(--text-tertiary) !important;
    font-weight: 600 !important;
  }

  /* Tablet */
  @media (max-width: 768px) {
    .aa-features { gap: 8px !important; }
    .aa-feature-item { padding: 9px 5px !important; }
    .aa-feature-icon {
      width: 34px !important;
      height: 34px !important;
      min-width: 34px !important;
      min-height: 34px !important;
      font-size: 16px !important;
    }
    .aa-feature-title { font-size: 11px !important; }
    .aa-feature-desc { font-size: 9.5px !important; }
  }

  /* Mobile — still 4 columns, super tight */
  @media (max-width: 480px) {
    .aa-features {
      gap: 5px !important;
      margin: 10px 0 !important;
    }
    .aa-feature-item {
      padding: 8px 3px !important;
      border-radius: 10px !important;
    }
    .aa-feature-icon {
      width: 30px !important;
      height: 30px !important;
      min-width: 30px !important;
      min-height: 30px !important;
      font-size: 15px !important;
      margin-bottom: 4px !important;
      border-radius: 8px !important;
    }
    .aa-feature-title {
      font-size: 10px !important;
      line-height: 1.15 !important;
    }
    .aa-feature-desc {
      font-size: 8.5px !important;
      line-height: 1.15 !important;
    }
  }

  /* Tiny phones — hide description to fit */
  @media (max-width: 360px) {
    .aa-feature-desc {
      display: none !important;
    }
    .aa-feature-title {
      font-size: 9.5px !important;
      margin: 0 !important;
    }
    .aa-feature-icon {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
      min-height: 28px !important;
      font-size: 14px !important;
      margin-bottom: 3px !important;
    }
  }
`

function Hero() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { settings } = useSettings()

  const handleSearch = () => {
    const q = query.trim()
    if (q) {
      navigate(`/restaurants?search=${encodeURIComponent(q)}`)
    } else {
      navigate('/restaurants')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  // Service cards — fixed
  const services = [
    {
      key: 'food',
      title: 'Food',
      subtitle: 'Restaurants & Groceries',
      image: serviceFood,
      button: 'Order Food',
      path: '/restaurants',
    },
    {
      key: 'pharmacy',
      title: 'Pharmacy',
      subtitle: 'Medicines & Wellness',
      image: servicePharmacy,
      button: 'Shop Pharmacy',
      path: '/pharmacy',
    },
    {
      key: 'gaming',
      title: 'Gaming',
      subtitle: 'Games & Entertainment',
      image: serviceGaming,
      button: 'Play Games',
      path: '/gaming',
    },
  ]

  const hero = settings.hero || {}
  const trustBar = settings.trustBar || {}
  const features = settings.features || []

  return (
    <>
      {/* ✅ Compact Feature Strip CSS */}
      <style>{FEATURE_STYLES}</style>

      {/* HERO SECTION */}
      <section className="aa-hero">
        <h1 className="aa-hero-title">
          {hero.title1}{' '}
          <span className="aa-hero-title-highlight">{hero.title2}</span>{' '}
          {hero.title3}
        </h1>

        {/* Search Bar */}
        <div className="aa-hero-search">
          <Search size={22} strokeWidth={2.2} color="#059669" />
          <input
            type="text"
            placeholder={hero.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="aa-hero-search-btn"
            onClick={handleSearch}
            title="Search"
          >
            <SlidersHorizontal size={20} strokeWidth={2.2} />
          </button>
        </div>
      </section>

      {/* SERVICE CARDS */}
      <div className="aa-services">
        {services.map((service) => (
          <div
            key={service.key}
            className={`aa-service-card ${service.key}`}
          >
            <div className="aa-service-image">
              <img src={service.image} alt={service.title} />
            </div>
            <h3 className="aa-service-title">{service.title}</h3>
            <p className="aa-service-desc">{service.subtitle}</p>
            <button
              className="aa-service-btn"
              onClick={() => navigate(service.path)}
            >
              {service.button}
              <ArrowRight size={14} strokeWidth={2.8} />
            </button>
          </div>
        ))}
      </div>

      {/* FEATURE STRIP — 4 columns compact */}
      <div className="aa-features">
        {features.map((feature, idx) => (
          <div className="aa-feature-item" key={idx}>
            <div className={`aa-feature-icon ${feature.color || ''}`}>
              {feature.icon}
            </div>
            <h4 className="aa-feature-title">{feature.title}</h4>
            <p className="aa-feature-desc">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* TRUST BAR */}
      <div className="aa-trust-bar">
        <span>{trustBar.text1}</span>
        <span>•</span>
        <span>{trustBar.text2}</span>
        <span>•</span>
        <span>{trustBar.text3}</span>
      </div>
    </>
  )
}

export default Hero