function Offers() {
  return (
    <section className="offers">
      <div className="offers-content">
        <div className="offers-text">
          <span className="offer-label">SPECIAL OFFER</span>

          <h2>Get 20% Off Your First Order</h2>

          <p>
            Order your favourite food from local restaurants
            and enjoy a special discount on your first AraiFood order.
          </p>

          <button className="offer-button">
            Order Now →
          </button>
        </div>

        <div className="offer-visual">
          <div className="offer-circle">
            20%
          </div>

          <span className="offer-emoji emoji-one">🍔</span>
          <span className="offer-emoji emoji-two">🍕</span>
          <span className="offer-emoji emoji-three">🍗</span>
        </div>
      </div>
    </section>
  )
}

export default Offers