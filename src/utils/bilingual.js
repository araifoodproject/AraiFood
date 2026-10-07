// ============================================================
// src/utils/bilingual.js
// Helper for bilingual (BN/EN) Firestore fields
//
// Usage:
//   bi(restaurant, 'title', 'bn')  → restaurant.title_bn || restaurant.title
//   bi(restaurant, 'title', 'en')  → restaurant.title
//
// Fields in Firestore:
//   title     ← English
//   title_bn  ← Bangla
// ============================================================

/**
 * Get bilingual field from an object
 * @param {object} obj — Source object (from Firestore)
 * @param {string} key — Base field name (e.g. 'title')
 * @param {string} lang — 'bn' | 'en'
 * @param {string} fallback — Optional fallback if neither exists
 * @returns {string} — Field value
 */
export function bi(obj, key, lang, fallback = '') {
  if (!obj) return fallback

  const isBangla = lang === 'bn'
  const primaryKey = isBangla ? `${key}_bn` : key
  const secondaryKey = isBangla ? key : `${key}_bn`

  // Try primary (e.g. title_bn for bn), then secondary (title)
  return obj[primaryKey] || obj[secondaryKey] || fallback
}

/**
 * Get bilingual array (e.g. category list) — each item can have name + name_bn
 * @param {array} arr — Source array
 * @param {string} key — Field name inside each item (e.g. 'name')
 * @param {string} lang — 'bn' | 'en'
 * @returns {array} — Transformed array with resolved field
 */
export function biArray(arr, key, lang) {
  if (!Array.isArray(arr)) return []
  const isBangla = lang === 'bn'

  return arr.map((item) => {
    if (!item || typeof item !== 'object') return item
    const primaryKey = isBangla ? `${key}_bn` : key
    const secondaryKey = isBangla ? key : `${key}_bn`
    return {
      ...item,
      [key]: item[primaryKey] || item[secondaryKey] || item[key],
    }
  })
}

/**
 * React hook helper — returns a function that auto-applies current language
 * Usage inside component:
 *   const { t, language } = useLanguage()
 *   const b = useBi(language)  // helper bound to current language
 *   b(settings, 'hero', 'title')  → resolves with current lang
 */
export function createBiHelper(lang) {
  return (obj, key, fallback = '') => bi(obj, key, lang, fallback)
}