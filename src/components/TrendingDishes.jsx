import { Flame, Star, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

function TrendingDishes() {
  const dishes = [
    { id: 1, name: 'Chicken Biryani', price: 180, emoji: '🍛', restaurant: 'Arai Biriyani House', rating: 4.9 },
    { id: 2, name: 'Beef Burger', price: 150, emoji: '🍔', restaurant: 'Arai Burger Lab', rating: 4.8 },
    { id: 3, name: 'Chicken Pizza', price: 350, emoji: '🍕', restaurant: 'Arai Pizza Corner', rating: 4.7 },
    { id: 4, name: 'Grilled Chicken', price: 220, emoji: '🍗', restaurant: 'Araihazar Grill', rating: 4.9 },
  ]

  return (
    <section className="glass-section">
      <div className="glass-section-header">
        <div>
          <span className="glass-section-label">TRENDING NOW</span>
          <h2 className="glass-section-title">Trending Dishes</h2>
          <p className="glass-section-sub">What everyone is ordering right now</p>
        </div>
        <Link to="/restaurants" className="glass-view-all">
          View All
          <span>→</span>
        </Link>
      </div>

      <div className="glass-dish-grid">
        {dishes.map((dish) => (
          <div className="glass-dish-card" key={dish.id}>
            <div className="glass-dish-image">
              <span>{dish.emoji}</span>
              <div className="glass-dish-hot">
                <Flame size={12} strokeWidth={2.5} fill="#FFFFFF" />
                Hot
              </div>
            </div>

            <div className="glass-dish-info">
              <h3>{dish.name}</h3>
              <p>{dish.restaurant}</p>

              <div className="glass-dish-bottom">
                <div className="glass-dish-price">
                  <strong>৳{dish.price}</strong>
                  <span className="glass-dish-rating">
                    <Star size={11} strokeWidth={0} fill="#F59E0B" />
                    {dish.rating}
                  </span>
                </div>

                <button className="glass-dish-add" title="Add to cart">
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

export default TrendingDishes