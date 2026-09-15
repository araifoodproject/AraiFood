import { Link } from 'react-router-dom'
import {
  Sandwich,
  Pizza,
  Soup,
  Drumstick,
  Coffee,
  IceCream,
} from 'lucide-react'

function Categories() {
  const categories = [
    { icon: Sandwich, name: 'Burger', color: 'green' },
    { icon: Pizza, name: 'Pizza', color: 'orange' },
    { icon: Soup, name: 'Biryani', color: 'green' },
    { icon: Drumstick, name: 'Chicken', color: 'orange' },
    { icon: Coffee, name: 'Drinks', color: 'green' },
    { icon: IceCream, name: 'Dessert', color: 'orange' },
  ]

  return (
    <section className="glass-categories">
      <div className="glass-categories-header">
        <div>
          <span className="glass-section-label">EXPLORE</span>
          <h2 className="glass-categories-title">What are you craving?</h2>
          <p className="glass-categories-sub">Choose your favourite food category</p>
        </div>

        <Link to="/restaurants" className="glass-view-all">
          View All
          <span>→</span>
        </Link>
      </div>

      <div className="glass-category-grid">
        {categories.map((category, idx) => {
          const IconComponent = category.icon
          return (
            <Link
              key={idx}
              to={`/restaurants?category=${category.name.toLowerCase()}`}
              className={`glass-category-card glass-category-${category.color}`}
            >
              <div className="glass-category-icon">
                <IconComponent size={28} strokeWidth={1.8} />
              </div>
              <h3 className="glass-category-name">{category.name}</h3>
              <p className="glass-category-desc">Explore food</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default Categories