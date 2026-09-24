// ============================================================
// src/hooks/useSettings.js
// Central settings hook — reads from Firestore settings/platform
// All site-wide editable values come from here.
// Nested structure with deep-merge fallback.
// ============================================================

import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'

// ------------------------------------------------------------
// DEFAULT SETTINGS (fallback when Firestore is empty/missing)
// Every editable value on the site has a safe default here.
// ------------------------------------------------------------
const DEFAULT_SETTINGS = {
  // ---------- Brand ----------
  siteName: 'AraiFood',
  tagline: 'Good Food, Good Mood',

  // ---------- Contact ----------
  contactEmail: 'hello@araifood.com',
  contactPhone: '+880 1700-000000',
  address: 'Araihazar, Narayanganj',

  // ---------- Fees ----------
  defaultDeliveryFee: 30,
  minOrderAmount: 100,
  commissionPercent: 10,
  riderEarningPerDelivery: 30,
  freeDeliveryThreshold: 500, // ৳ — above this subtotal = free delivery

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
    title2: 'Food, Pharmacy & Gaming',
    title3: 'in One Place',
    searchPlaceholder: 'Search food, medicine or games...',
  },

  // ---------- Trust Bar ----------
  trustBar: {
    text1: 'Trusted by 50k+ in Araihazar',
    text2: '4.8★ Rating',
    text3: 'Updated Oct 2025',
  },

  // ---------- Feature Strip (4 features on home) ----------
  features: [
    {
      icon: '🚚',
      color: 'green',
      title: 'Fast Delivery',
      desc: '30-45 min to your door',
    },
    {
      icon: '📍',
      color: 'blue',
      title: 'Araihazar Focused',
      desc: 'Local sellers & services',
    },
    {
      icon: '🛡️',
      color: 'dark',
      title: 'Secure Payment',
      desc: 'Safe & encrypted transactions',
    },
    {
      icon: '🎧',
      color: 'pink',
      title: 'Local Support',
      desc: '24/7 friendly help nearby',
    },
  ],

  // ---------- Home Sections ----------
  home: {
    popularTitle: 'Popular Restaurants Near You',
    popularSubtitle: 'Top-rated picks from Araihazar',
    popularLimit: 6,
  },

  // ---------- Categories ----------
  categories: {
    title: 'Food Categories',
    subtitle: 'Browse by categories',
    list: [
      { name: 'Biryani', emoji: '🍛', color: 'biryani', query: 'biryani' },
      { name: 'Burger', emoji: '🍔', color: 'burger', query: 'burger' },
      { name: 'Pizza', emoji: '🍕', color: 'pizza', query: 'pizza' },
      { name: 'Chinese', emoji: '🍜', color: 'chinese', query: 'chinese' },
      { name: 'Chicken', emoji: '🍗', color: 'chicken', query: 'chicken' },
      { name: 'Snacks', emoji: '🍟', color: 'snacks', query: 'snacks' },
      { name: 'Drinks', emoji: '🥤', color: 'drinks', query: 'drinks' },
      { name: 'Desserts', emoji: '🍰', color: 'desserts', query: 'dessert' },
    ],
  },

  // ---------- Delivery Areas ----------
  deliveryAreas: {
    title: 'We Deliver Around Araihazar',
    subtitle: 'Fast delivery across your locality',
  },

  // ---------- Partner CTA ----------
  partner: {
    sectionTitle: 'Become a Partner',
    sectionSubtitle: 'Grow with us in Araihazar',
    restaurant: {
      title: 'Own a Restaurant?',
      subtitle: 'Join AraiFood',
      description:
        'List your restaurant, reach 50k+ customers, hassle-free onboarding & higher sales',
      buttonText: 'Partner with us',
      path: '/restaurant-signup',
    },
    rider: {
      title: 'Want to Become a Rider?',
      subtitle: 'Deliver with AraiFood',
      description:
        'Flexible earnings, weekly payouts, support & safety gear provided',
      buttonText: 'Ride with us',
      path: '/rider-signup',
    },
  },

  // ---------- Footer ----------
  footer: {
    tagline: 'Food, Pharmacy & Gaming in One Place',
    companyName: 'AraiFood Ltd.',
    companyLinks: [
      { text: 'About Us', url: '/about', isExternal: false },
      { text: 'Careers', url: '#', isExternal: false },
      { text: 'Press', url: '#', isExternal: false },
      { text: 'Blog', url: '#', isExternal: false },
    ],
    supportLinks: [
      { text: 'Help Center', url: '#', isExternal: false },
      { text: 'Contact Us', url: '#', isExternal: false },
      { text: 'FAQs', url: '#', isExternal: false },
      { text: 'Terms & Privacy', url: '#', isExternal: false },
    ],
    appsLabel: 'Available on',
  },

  // ---------- Live Chat ----------
  liveChat: {
    teamName: 'Support Team',
    statusText: 'Online Now',
    avatarEmoji: '👨‍💼',
    welcomeMessage: 'Hello! 👋 How can we help you today?',
    autoReply:
      'Thank you for your message! Our team will get back to you shortly. 😊',
    inputPlaceholder: 'Type your message...',
  },
}

// ------------------------------------------------------------
// DEEP MERGE — combines Firestore data over defaults, so nested
// objects (footer, hero, liveChat, partner...) don't lose keys.
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
// HOOK
// ------------------------------------------------------------
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        if (snap.exists()) {
          setSettings(deepMerge(DEFAULT_SETTINGS, snap.data()))
        } else {
          setSettings(DEFAULT_SETTINGS)
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

  return { settings, loading, DEFAULT_SETTINGS }
}

export default useSettings