import { Link } from 'react-router-dom'
import {
  MapPin,
  Search,
  ArrowRight,
  Rocket,
  Star,
  ShieldCheck,
  Bike,
  Award,
} from 'lucide-react'

function Hero() {
  return (
    <section className="glass-hero">
      <div className="glass-hero-container">

        {/* Left Content */}
        <div className="glass-hero-content">

          <div className="glass-hero-badge">
            <span className="glass-hero-badge-icon">
              <Rocket size={14} strokeWidth={2.5} />
            </span>
            <span>Fresh food, right at your door</span>
          </div>

          <h1 className="glass-hero-title">
            Delicious Food.
            <br />
            <span className="glass-hero-title-highlight">Delivered With Love.</span>
          </h1>

          <p className="glass-hero-description">
            Discover the best restaurants and local food around <strong>Araihazar</strong>. Order your favourite meals and enjoy fast delivery at your doorstep.
          </p>

          {/* Search Bar */}
          <div className="glass-hero-search">
            <span className="glass-hero-search-icon">
              <MapPin size={18} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="What are you craving today?"
            />
            <button
              onClick={() => { window.location.href = '/restaurants' }}
              className="glass-hero-search-btn"
            >
              <Search size={16} strokeWidth={2.5} />
              Find Food
            </button>
          </div>

          {/* Features */}
          <div className="glass-hero-features">

            <div className="glass-hero-feature">
              <div className="glass-hero-feature-icon green">
                <Rocket size={18} strokeWidth={2} />
              </div>
              <div className="glass-hero-feature-text">
                <strong>Fast Delivery</strong>
                <small>At your doorstep</small>
              </div>
            </div>

            <div className="glass-hero-feature-divider"></div>

            <div className="glass-hero-feature">
              <div className="glass-hero-feature-icon orange">
                <Star size={18} strokeWidth={2} />
              </div>
              <div className="glass-hero-feature-text">
                <strong>Top Rated</strong>
                <small>Local restaurants</small>
              </div>
            </div>

            <div className="glass-hero-feature-divider"></div>

            <div className="glass-hero-feature">
              <div className="glass-hero-feature-icon green">
                <ShieldCheck size={18} strokeWidth={2} />
              </div>
              <div className="glass-hero-feature-text">
                <strong>100% Safe</strong>
                <small>Secure ordering</small>
              </div>
            </div>

          </div>
        </div>

        {/* Right Visual */}
        <div className="glass-hero-visual">

          <div className="glass-hero-visual-shape shape-1"></div>
          <div className="glass-hero-visual-shape shape-2"></div>

          {/* Main Food Card */}
          <div className="glass-food-card">
            <div className="glass-food-card-glow"></div>

            <div className="glass-food-image">
              🍛
            </div>

            <div className="glass-food-info">
              <span className="glass-food-category">CUSTOMER FAVOURITE</span>
              <h3>Special Chicken Biryani</h3>

              <div className="glass-food-bottom">
                <span className="glass-food-price">৳180</span>
                <span className="glass-food-rating">
                  <Star size={12} strokeWidth={2.5} fill="#F59E0B" />
                  4.9
                </span>
              </div>
            </div>
          </div>

          {/* Floating Card 1 - Delivery */}
          <div className="glass-floating-card glass-floating-delivery">
            <div className="glass-floating-icon green">
              <Bike size={20} strokeWidth={2} />
            </div>
            <div>
              <strong>On the way!</strong>
              <small>Your food is coming</small>
            </div>
          </div>

          {/* Floating Card 2 - Rating */}
          <div className="glass-floating-card glass-floating-rating">
            <div className="glass-floating-stars">
              <Star size={12} strokeWidth={0} fill="#F59E0B" />
              <Star size={12} strokeWidth={0} fill="#F59E0B" />
              <Star size={12} strokeWidth={0} fill="#F59E0B" />
              <Star size={12} strokeWidth={0} fill="#F59E0B" />
              <Star size={12} strokeWidth={0} fill="#F59E0B" />
            </div>
            <strong>4.9/5</strong>
            <small>Happy customers</small>
          </div>

          {/* Floating Food Bubbles */}
          <div className="glass-food-bubble bubble-1">🍕</div>
          <div className="glass-food-bubble bubble-2">🍔</div>
          <div className="glass-food-bubble bubble-3">🍗</div>

          {/* Award Badge */}
          <div className="glass-award-badge">
            <Award size={16} strokeWidth={2.2} />
            <span>#1 in Araihazar</span>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero