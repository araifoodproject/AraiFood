// ============================================================
// src/components/Categories.jsx
// FULLY REAL-TIME — categories come from settings.categories.list
// (editable from Admin Panel)
// ============================================================

import { Link } from 'react-router-dom'
import useSettings from '../hooks/useSettings'

function Categories() {
  const { settings } = useSettings()
  const cat = settings.categories || {}
  const list = cat.list || []

  if (list.length === 0) return null

  return (
    <section className="aa-section">
      <div className="aa-section-header">
        <div>
          <h2 className="aa-section-title">{cat.title}</h2>
          <p className="aa-section-sub">{cat.subtitle}</p>
        </div>
      </div>

      <div className="aa-categories-grid">
        {list.map((category, idx) => (
          <Link
            key={`${category.name}-${idx}`}
            to={`/restaurants?category=${category.query}`}
            className={`aa-category-circle aa-cat-${category.color}`}
          >
            <div className="aa-category-icon">{category.emoji}</div>
            <p className="aa-category-name">{category.name}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Categories