function Hero() {
  return (
    <section className="arai-hero">

      <div className="arai-hero-bg-shape shape-one"></div>
      <div className="arai-hero-bg-shape shape-two"></div>

      <div className="arai-hero-container">

        {/* Left Content */}
        <div className="arai-hero-content">

          <div className="arai-hero-badge">
            <span>🔥</span>
            Fresh food, right at your door
          </div>

          <h1>
            Delicious Food.
            <br />
            <span>Delivered With Love.</span>
          </h1>

          <p className="arai-hero-description">
            Discover the best restaurants and local
            food around <strong>Araihazar</strong>.
            Order your favourite meals and enjoy
            fast delivery at your doorstep.
          </p>

          {/* Search */}
          <div className="arai-hero-search">

            <span className="arai-search-icon">
              📍
            </span>

            <input
              type="text"
              placeholder="What are you craving today?"
            />

            <button
              onClick={() => {
                window.location.href = '/restaurants'
              }}
            >
              Find Food
              <span>→</span>
            </button>

          </div>

          {/* Quick Features */}
          <div className="arai-hero-features">

            <div className="arai-hero-feature">
              <div>🚀</div>
              <span>
                <strong>Fast Delivery</strong>
                <small>At your doorstep</small>
              </span>
            </div>

            <div className="arai-feature-divider"></div>

            <div className="arai-hero-feature">
              <div>⭐</div>
              <span>
                <strong>Top Rated</strong>
                <small>Local restaurants</small>
              </span>
            </div>

            <div className="arai-feature-divider"></div>

            <div className="arai-hero-feature">
              <div>🛡️</div>
              <span>
                <strong>100% Safe</strong>
                <small>Secure ordering</small>
              </span>
            </div>

          </div>

        </div>

        {/* Right Visual */}
        <div className="arai-hero-visual">

          <div className="arai-food-glow"></div>

          <div className="arai-main-food-card">

            <div className="arai-food-image">
              🍛
            </div>

            <div className="arai-food-card-info">
              <span className="arai-food-category">
                CUSTOMER FAVOURITE
              </span>

              <h3>
                Special Chicken Biryani
              </h3>

              <div className="arai-food-bottom">

                <span className="arai-food-price">
                  ৳180
                </span>

                <span className="arai-food-rating">
                  ⭐ 4.9
                </span>

              </div>
            </div>

          </div>

          {/* Floating Card 1 */}
          <div className="arai-floating-card delivery-card">

            <div className="floating-icon">
              🚴
            </div>

            <div>
              <strong>On the way!</strong>
              <small>Your food is coming</small>
            </div>

          </div>

          {/* Floating Card 2 */}
          <div className="arai-floating-card rating-card">

            <div className="rating-stars">
              ⭐⭐⭐⭐⭐
            </div>

            <strong>4.9/5</strong>
            <small>Happy customers</small>

          </div>

          {/* Decorative Food Icons */}
          <div className="arai-food-bubble bubble-one">
            🍕
          </div>

          <div className="arai-food-bubble bubble-two">
            🍔
          </div>

          <div className="arai-food-bubble bubble-three">
            🍗
          </div>

        </div>

      </div>

      {/* Bottom Wave */}
      <div className="arai-hero-wave"></div>

    </section>
  )
}

export default Hero