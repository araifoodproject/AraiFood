// ============================================================
// src/i18n/LanguageContext.jsx
// AraiFood — Language Provider + useLanguage() hook
// - Bangla (bn) / English (en) toggle
// - localStorage persist
// - Auto-update <html lang="..."> attribute
// V2 — Uses split modules via ./index instead of ./translations
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation } from './index'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'araifood_language'
const DEFAULT_LANGUAGE = 'en' // English default

export function LanguageProvider({ children }) {
  // Initialize from localStorage or default
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'bn' || saved === 'en') return saved
    } catch (e) {
      console.warn('Language storage read error:', e)
    }
    return DEFAULT_LANGUAGE
  })

  // Persist to localStorage + update <html lang>
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch (e) {
      console.warn('Language storage write error:', e)
    }
    // Update HTML lang attribute (SEO + accessibility)
    document.documentElement.lang = language
  }, [language])

  // Set language + optional immediate persist
  const setLanguage = (lang) => {
    if (lang !== 'bn' && lang !== 'en') return
    setLanguageState(lang)
  }

  // Toggle between bn <-> en
  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'bn' : 'en'))
  }

  // Translation helper: t('nav.home') → "Home" / "হোম"
  const t = (key, fallback) => {
    if (!key) return ''
    const value = getTranslation(language, key)
    return value || fallback || key
  }

  const value = {
    language,        // 'en' | 'bn'
    setLanguage,     // (lang) => void
    toggleLanguage,  // () => void — quick toggle
    t,               // (key, fallback?) => string
    isBangla: language === 'bn',
    isEnglish: language === 'en',
    translations: translations[language] || translations.en,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// ============================================================
// useLanguage() — Hook to consume context
// Usage: const { t, language, toggleLanguage } = useLanguage()
// ============================================================
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Fallback — prevents crash if used outside Provider
    console.warn(
      '⚠️ useLanguage() called outside <LanguageProvider>. Using fallback.'
    )
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key, fallback) => fallback || key,
      isBangla: false,
      isEnglish: true,
      translations: translations.en,
    }
  }
  return ctx
}

export default LanguageContext