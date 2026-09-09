import { Link } from 'react-router-dom'

function Categories() {
  const categories = [
    { icon: '🍔', name: 'Burger', link: '/restaurants' },
    { icon: '🍕', name: 'Pizza', link: '/restaurants' },
    { icon: '🍛', name: 'Biryani', link: '/restaurants' },
    { icon: '🍗', name: 'Chicken', link: '/restaurants' },
    { icon: '🥤', name: 'Drinks', link: '/restaurants' },
    { icon: '🍰', name: 'Dessert', link: '/restaurants' },
  ]

  return (
    <section className="categories">
      <div className="categories-header">
        <div>
          <span className="section-label">EXPLORE</span>
          <h2>What are you craving?</h2>
          <p>Choose your favourite food category</p>
        </div>

        <button className="view-all" onClick={() => { window.location.href = '/restaurants' }}>
          View All →
        </button>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <Link to={category.link} className="category-card" key={category.name}>
            <div className="category-icon">
              {category.icon}
            </div>

            <h3>{category.name}</h3>
            <p>Explore food</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Categories