// ============================================================
// src/components/Categories.jsx
// V2 — Bilingual fallback for title/subtitle
// (Category items still come from Admin panel settings)
// ============================================================

import { Link } from 'react-router-dom'
import useSettings from '../hooks/useSettings'
import { useLanguage } from '../i18n/LanguageContext'

function Categories() {
  const { settings } = useSettings()
  const { t, language } = useLanguage()
  const cat = settings.categories || {}
  const list = cat.list || []

  if (list.length === 0) return null

  const isBn = language === 'bn'

  // Fallback section header — translated
  const sectionTitle =
    cat.title || (isBn ? 'ক্যাটাগরি অনুযায়ী দেখুন' : 'Browse by Category')
  const sectionSubtitle =
    cat.subtitle || (isBn ? 'আজ কী খেতে চান?' : 'What are you craving today?')

  return (
    <section className="aa-section">
      <div className="aa-section-header">
        <div>
          <h2 className="aa-section-title">{sectionTitle}</h2>
          <p className="aa-section-sub">{sectionSubtitle}</p>
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