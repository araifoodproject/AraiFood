// ============================================================
// src/i18n/index.js
// Merges all translation modules into one flat structure
// ============================================================

import { common } from './common'
import { home } from './home'
import { cart } from './cart'
import { orders } from './orders'
import { pharmacy } from './pharmacy'
import { gaming } from './gaming'
import { contact } from './contact'
import { about } from './about'

export const translations = {
  en: {
    ...common.en,
    ...home.en,
    ...cart.en,
    ...orders.en,
    ...pharmacy.en,
    ...gaming.en,
    ...contact.en,
    ...about.en,
  },
  bn: {
    ...common.bn,
    ...home.bn,
    ...cart.bn,
    ...orders.bn,
    ...pharmacy.bn,
    ...gaming.bn,
    ...contact.bn,
    ...about.bn,
  },
}

// ============================================================
// Helper — get translation by key
// ============================================================
export function getTranslation(language, key) {
  return translations[language]?.[key] || translations.en[key] || key
}