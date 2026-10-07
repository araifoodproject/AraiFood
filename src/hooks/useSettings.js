// ============================================================
// src/hooks/useSettings.js
// V2 — Auto language-aware (BN/EN) settings
// Reads from Firestore settings/platform
// Auto-resolves _bn fields based on current language
// ============================================================

import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useLanguage } from '../i18n/LanguageContext'

// ------------------------------------------------------------
// DEFAULT SETTINGS (fallback when Firestore is empty/missing)
// ------------------------------------------------------------
const DEFAULT_SETTINGS = {
  // ---------- Brand ----------
  siteName: 'AraiFood',
  siteName_bn: 'AraiFood',
  tagline: 'Good Food, Good Mood',
  tagline_bn: 'ভালো খাবার, ভালো মুড',

  // ---------- Contact ----------
  contactEmail: 'hello@araifood.com',
  contactPhone: '+880 1700-000000',
  address: 'Araihazar, Narayanganj',

  // ---------- Fees ----------
  defaultDeliveryFee: 30,
  minOrderAmount: 100,
  commissionPercent: 10,
  riderEarningPerDelivery: 30,
  freeDeliveryThreshold: 500,

  // ---------- Hours ----------
  openingTime: '10:00',
  closingTime: '22:00',

  // ---------- Social ----------
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  whatsappNumber: '',
  appStoreUrl: '',
  playStoreUrl: '',

  // ---------- Gaming ----------
  gamingBkashNumber: '01700000000',
  gamingNagadNumber: '01700000000',
  gamingPopupEnabled: false,

  // ---------- Wallet ----------
  walletBkashNumber: '01700000000',
  walletNagadNumber: '01700000000',
  walletMinAmount: 50,
  walletMaxAmount: 10000,

  // ---------- Delivery ----------
  defaultDeliveryTime: '30-40 min',
  deliveryAreaName: 'Araihazar Thana',
  deliverySlots: ['6-7pm', '7-8pm', '8-9pm', '9-10pm'],
  mapDefaultCenter: { lat: 23.78, lng: 90.64 },
  mapDefaultZoom: 14,

  // ---------- Hero ----------
  hero: {
    title1: 'App -',
    title1_bn: 'অ্যাপ -',
    title2: 'Food, Pharmacy & Gaming',
    title2_bn: 'খাবার, ফার্মেসি ও গেমিং',
    title3: 'in One Place',
    title3_bn: 'এক জায়গায়',
    searchPlaceholder: 'Search food, medicine or games...',
    searchPlaceholder_bn: 'খাবার, ঔষধ বা গেম খুঁজুন...',
  },

  // ---------- Trust Bar ----------
  trustBar: {
    text1: 'Trusted by 50k+ in Araihazar',
    text1_bn: 'আরাইহাজারে ৫০ হাজারের বেশি মানুষের বিশ্বাস',
    text2: '4.8★ Rating',
    text2_bn: '৪.৮★ রেটিং',
    text3: 'Updated Oct 2025',
    text3_bn: 'আপডেট অক্টোবর ২০২৫',
  },

  // ---------- Feature Strip ----------
  features: [
    {
      icon: '🚚', color: 'green',
      title: 'Fast Delivery', title_bn: 'দ্রুত ডেলিভারি',
      desc: '30-45 min to your door', desc_bn: '৩০-৪৫ মিনিটে আপনার দরজায়',
    },
    {
      icon: '📍', color: 'blue',
      title: 'Araihazar Focused', title_bn: 'আরাইহাজার কেন্দ্রিক',
      desc: 'Local sellers & services', desc_bn: 'স্থানীয় বিক্রেতা ও সেবা',
    },
    {
      icon: '🛡️', color: 'dark',
      title: 'Secure Payment', title_bn: 'নিরাপদ পেমেন্ট',
      desc: 'Safe & encrypted transactions', desc_bn: 'নিরাপদ ও এনক্রিপ্টেড লেনদেন',
    },
    {
      icon: '🎧', color: 'pink',
      title: 'Local Support', title_bn: 'স্থানীয় সহায়তা',
      desc: '24/7 friendly help nearby', desc_bn: '২৪/৭ কাছাকাছি বন্ধুত্বপূর্ণ সহায়তা',
    },
  ],

  // ---------- Home ----------
  home: {
    popularTitle: 'Popular Restaurants Near You',
    popularTitle_bn: 'আপনার কাছের জনপ্রিয় রেস্টুরেন্ট',
    popularSubtitle: 'Top-rated picks from Araihazar',
    popularSubtitle_bn: 'আরাইহাজারের সেরা পছন্দ',
    popularLimit: 6,
  },

  // ---------- Categories ----------
  categories: {
    title: 'Food Categories',
    title_bn: 'খাবারের ক্যাটাগরি',
    subtitle: 'Browse by categories',
    subtitle_bn: 'ক্যাটাগরি অনুযায়ী দেখুন',
    list: [
      { name: 'Biryani', name_bn: 'বিরিয়ানি', emoji: '🍛', color: 'biryani', query: 'biryani' },
      { name: 'Burger', name_bn: 'বার্গার', emoji: '🍔', color: 'burger', query: 'burger' },
      { name: 'Pizza', name_bn: 'পিজ্জা', emoji: '🍕', color: 'pizza', query: 'pizza' },
      { name: 'Chinese', name_bn: 'চাইনিজ', emoji: '🍜', color: 'chinese', query: 'chinese' },
      { name: 'Chicken', name_bn: 'চিকেন', emoji: '🍗', color: 'chicken', query: 'chicken' },
      { name: 'Snacks', name_bn: 'স্ন্যাকস', emoji: '🍟', color: 'snacks', query: 'snacks' },
      { name: 'Drinks', name_bn: 'ড্রিংকস', emoji: '🥤', color: 'drinks', query: 'drinks' },
      { name: 'Desserts', name_bn: 'ডেজার্ট', emoji: '🍰', color: 'desserts', query: 'dessert' },
    ],
  },

  // ---------- Delivery Areas ----------
  deliveryAreas: {
    title: 'We Deliver Around Araihazar',
    title_bn: 'আমরা আরাইহাজারে ডেলিভারি দিই',
    subtitle: 'Fast delivery across your locality',
    subtitle_bn: 'আপনার এলাকায় দ্রুত ডেলিভারি',
  },

  // ---------- Partner CTA ----------
  partner: {
    sectionTitle: 'Become a Partner',
    sectionTitle_bn: 'পার্টনার হোন',
    sectionSubtitle: 'Grow with us in Araihazar',
    sectionSubtitle_bn: 'আরাইহাজারে আমাদের সাথে বেড়ে উঠুন',
    restaurant: {
      title: 'Own a Restaurant?',
      title_bn: 'রেস্টুরেন্ট আছে?',
      subtitle: 'Join AraiFood',
      subtitle_bn: 'AraiFood এ যোগ দিন',
      description:
        'List your restaurant, reach 50k+ customers, hassle-free onboarding & higher sales',
      description_bn:
        'আপনার রেস্টুরেন্ট লিস্ট করুন, ৫০ হাজার+ কাস্টমারের কাছে পৌঁছান, ঝামেলামুক্ত অনবোর্ডিং এবং বেশি বিক্রয়',
      buttonText: 'Partner with us',
      buttonText_bn: 'পার্টনার হোন',
      path: '/restaurant-signup',
    },
    rider: {
      title: 'Want to Become a Rider?',
      title_bn: 'রাইডার হতে চান?',
      subtitle: 'Deliver with AraiFood',
      subtitle_bn: 'AraiFood এর সাথে ডেলিভারি করুন',
      description:
        'Flexible earnings, weekly payouts, support & safety gear provided',
      description_bn:
        'নমনীয় আয়, সাপ্তাহিক পেমেন্ট, সাপোর্ট ও সেফটি গিয়ার দেওয়া হয়',
      buttonText: 'Ride with us',
      buttonText_bn: 'রাইডার হোন',
      path: '/rider-signup',
    },
  },

  // ---------- Footer ----------
  footer: {
    tagline: 'Food, Pharmacy & Gaming in One Place',
    tagline_bn: 'খাবার, ফার্মেসি ও গেমিং এক জায়গায়',
    companyName: 'AraiFood Ltd.',
    companyLinks: [
      { text: 'About Us', text_bn: 'আমাদের সম্পর্কে', url: '/about', isExternal: false },
      { text: 'Careers', text_bn: 'ক্যারিয়ার', url: '/careers', isExternal: false },
    ],
    supportLinks: [
      { text: 'Help Center', text_bn: 'সহায়তা কেন্দ্র', url: '/help', isExternal: false },
      { text: 'Contact Us', text_bn: 'যোগাযোগ', url: '/contact', isExternal: false },
      { text: 'FAQs', text_bn: 'সাধারণ প্রশ্ন', url: '/help', isExternal: false },
    ],
    appsLabel: 'Available on',
    appsLabel_bn: 'পাওয়া যাচ্ছে',
  },

  // ---------- Live Chat ----------
  liveChat: {
    teamName: 'Support Team',
    teamName_bn: 'সাপোর্ট টিম',
    statusText: 'Online Now',
    statusText_bn: 'এখন অনলাইন',
    avatarEmoji: '👨‍💼',
    welcomeMessage: 'Hello! 👋 How can we help you today?',
    welcomeMessage_bn: 'হ্যালো! 👋 আজ আপনাকে কীভাবে সাহায্য করতে পারি?',
    autoReply:
      'Thank you for your message! Our team will get back to you shortly. 😊',
    autoReply_bn:
      'আপনার বার্তার জন্য ধন্যবাদ! আমাদের টিম শীঘ্রই যোগাযোগ করবে। 😊',
    inputPlaceholder: 'Type your message...',
    inputPlaceholder_bn: 'আপনার বার্তা লিখুন...',
  },
}

// ------------------------------------------------------------
// DEEP MERGE
// ------------------------------------------------------------
function deepMerge(defaults, incoming) {
  if (incoming === null || incoming === undefined) return defaults
  if (Array.isArray(defaults) || Array.isArray(incoming)) {
    return Array.isArray(incoming) ? incoming : defaults
  }
  if (typeof defaults !== 'object' || typeof incoming !== 'object') {
    return incoming === undefined ? defaults : incoming
  }
  const result = { ...defaults }
  for (const key of Object.keys(incoming)) {
    result[key] = deepMerge(defaults[key], incoming[key])
  }
  return result
}

// ------------------------------------------------------------
// LANGUAGE RESOLVER — Recursively swaps `_bn` fields
// ------------------------------------------------------------
function resolveLang(obj, lang) {
  if (obj === null || obj === undefined) return obj

  // Array — resolve each item
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveLang(item, lang))
  }

  // Non-object — return as is
  if (typeof obj !== 'object') return obj

  // Object — resolve each key
  const result = {}
  for (const key of Object.keys(obj)) {
    // Skip *_bn keys themselves (they'll be applied below)
    if (key.endsWith('_bn')) {
      // Only keep if it's not being used (fallback stores both)
      if (lang === 'en') continue
      continue
    }

    const value = obj[key]
    const bnKey = `${key}_bn`

    // If lang is BN and there's a _bn version, use that
    if (lang === 'bn' && obj[bnKey] !== undefined) {
      result[key] = obj[bnKey]
    } else {
      // Recursively resolve nested objects/arrays
      result[key] = resolveLang(value, lang)
    }
  }

  return result
}

// ------------------------------------------------------------
// HOOK
// ------------------------------------------------------------
export function useSettings() {
  const { language } = useLanguage()
  const [rawSettings, setRawSettings] = useState(DEFAULT_SETTINGS)
  const [settings, setSettings] = useState(() =>
    resolveLang(DEFAULT_SETTINGS, language)
  )
  const [loading, setLoading] = useState(true)

  // Load from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        if (snap.exists()) {
          setRawSettings(deepMerge(DEFAULT_SETTINGS, snap.data()))
        } else {
          setRawSettings(DEFAULT_SETTINGS)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Settings load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // Re-resolve when language changes
  useEffect(() => {
    setSettings(resolveLang(rawSettings, language))
  }, [rawSettings, language])

  return { settings, loading, DEFAULT_SETTINGS }
}

export default useSettings