function Categories() {
  const categories = [
    { icon: '🍔', name: 'Burger' },
    { icon: '🍕', name: 'Pizza' },
    { icon: '🍛', name: 'Biryani' },
    { icon: '🍗', name: 'Chicken' },
    { icon: '🥤', name: 'Drinks' },
    { icon: '🍰', name: 'Dessert' },
  ]

  return (
    <section className="categories">
      <div className="categories-header">
        <div>
          <span className="section-label">EXPLORE</span>
          <h2>What are you craving?</h2>
          <p>Choose your favourite food category</p>
        </div>

        <button className="view-all">View All →</button>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div className="category-card" key={category.name}>
            <div className="category-icon">
              {category.icon}
            </div>

            <h3>{category.name}</h3>
            <p>Explore food</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Categories