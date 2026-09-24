// ============================================================
// src/components/Hero.jsx
// FULLY REAL-TIME — reads hero title, trust bar, and 4 features
// from settings.platform (nested structure).
// Services (Food / Pharmacy / Gaming) are fixed in code.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react'
import serviceFood from '../assets/images/service-food.png'
import servicePharmacy from '../assets/images/service-pharmacy.png'
import serviceGaming from '../assets/images/service-gaming.png'
import useSettings from '../hooks/useSettings'

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

  // ------------------------------------------------------------
  // Service cards — fixed (3 services: food, pharmacy, gaming)
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // Hero text + trust bar + features from settings
  // ------------------------------------------------------------
  const hero = settings.hero || {}
  const trustBar = settings.trustBar || {}
  const features = settings.features || []

  return (
    <>
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

      {/* FEATURE STRIP — from settings.features array */}
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

      {/* TRUST BAR — from settings.trustBar */}
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