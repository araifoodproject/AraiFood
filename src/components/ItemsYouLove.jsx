import { Sparkles, Star, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

function ItemsYouLove() {
  const items = [
    { id: 1, name: 'Cold Drinks', price: 40, emoji: '🥤', restaurant: 'Local Taste', rating: 4.6 },
    { id: 2, name: 'Plain Rice & Curry', price: 120, emoji: '🍚', restaurant: 'Digholdi Restaurant', rating: 4.7 },
    { id: 3, name: 'Chicken Roast', price: 150, emoji: '🍗', restaurant: 'Araihazar Food Corner', rating: 4.8 },
    { id: 4, name: 'Dessert', price: 80, emoji: '🍰', restaurant: 'Arai Biriyani House', rating: 4.9 },
  ]

  return (
    <section className="glass-section">
      <div className="glass-section-header">
        <div>
          <span className="glass-section-label">PICKED FOR YOU</span>
          <h2 className="glass-section-title">Items You'll Love</h2>
          <p className="glass-section-sub">Handpicked based on your taste</p>
        </div>
        <Link to="/restaurants" className="glass-view-all">
          View All
          <span>→</span>
        </Link>
      </div>

      <div className="glass-dish-grid">
        {items.map((item) => (
          <div className="glass-dish-card" key={item.id}>
            <div className="glass-dish-image">
              <span>{item.emoji}</span>
              <div className="glass-dish-hot purple">
                <Sparkles size={12} strokeWidth={2.5} fill="#FFFFFF" />
                Love
              </div>
            </div>

            <div className="glass-dish-info">
              <h3>{item.name}</h3>
              <p>{item.restaurant}</p>

              <div className="glass-dish-bottom">
                <div className="glass-dish-price">
                  <strong>৳{item.price}</strong>
                  <span className="glass-dish-rating">
                    <Star size={11} strokeWidth={0} fill="#F59E0B" />
                    {item.rating}
                  </span>
                </div>

                <button className="glass-dish-add orange" title="Add to cart">
                  <Plus size={16} strokeWidth={2.8} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ItemsYouLove