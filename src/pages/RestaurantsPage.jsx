// ============================================================
// src/pages/RestaurantsPage.jsx
// V5 — Dish-First Category Design
// + Category click → Dish cards (image prominent)
// + Card click → Restaurant page
// + Add button → Direct cart
// + Emoji fallback for missing images
// + Distance badge + Location-aware sort
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { db, auth } from '../firebase'
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'
import { Star, Search, X, Plus, MapPin, Navigation, Flame } from 'lucide-react'
import { toast } from 'react-toastify'
import PageBackButton from '../components/PageBackButton'

// ============================================================
// Haversine Formula
// ============================================================
function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(km) {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// ============================================================
// Category display labels
// ============================================================
const CATEGORY_LABELS = {
  biriyani: { emoji: '🍛', label: 'Biriyani' },
  biryani: { emoji: '🍛', label: 'Biriyani' },
  burger: { emoji: '🍔', label: 'Burger' },
  pizza: { emoji: '🍕', label: 'Pizza' },
  chinese: { emoji: '🍜', label: 'Chinese' },
  chicken: { emoji: '🍗', label: 'Chicken' },
  snacks: { emoji: '🍟', label: 'Snacks' },
  drinks: { emoji: '🥤', label: 'Drinks' },
  desserts: { emoji: '🍰', label: 'Desserts' },
  dessert: { emoji: '🍰', label: 'Desserts' },
  pitha: { emoji: '🍥', label: 'Pitha' },
}

// ============================================================
// Mobile Responsive Styles
// ============================================================
const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .restaurants-page-container { padding: 14px 12px 30px !important; }
    .restaurants-page-header h1 { font-size: 22px !important; line-height: 1.3 !important; }
    .restaurants-page-header p { font-size: 13px !important; }
    .restaurant-page-stats {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    .restaurant-stat strong { font-size: 20px !important; }
    .restaurant-stat span { font-size: 11px !important; }
    .restaurant-filter-row { gap: 6px !important; }
    .restaurant-filter { padding: 6px 12px !important; font-size: 12px !important; }
    .glass-dish-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    .all-restaurants-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    .glass-dish-info h3 { font-size: 13.5px !important; }
    .glass-dish-info p { font-size: 11px !important; }
    .restaurant-title-row h2 { font-size: 15px !important; }
  }

  @media (max-width: 400px) {
    .restaurants-page-container { padding: 12px 10px 24px !important; }
    .restaurants-page-header h1 { font-size: 20px !important; }
    .glass-dish-grid {
      grid-template-columns: 1fr !important;
    }
    .restaurant-page-stats {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
`

function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialCategory = searchParams.get('category') || ''

  const [restaurants, setRestaurants] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('nearest')
  const [conflictModal, setConflictModal] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  const [activeCategory, setActiveCategory] = useState(initialCategory)

  // Customer location state
  const [customerLocation, setCustomerLocation] = useState(null)
  const [locationSource, setLocationSource] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)

  // ============================================================
  // Sync URL params → state
  // ============================================================
  useEffect(() => {
    const q = searchParams.get('search') || ''
    const c = searchParams.get('category') || ''
    setSearch(q)
    setActiveCategory(c)
  }, [searchParams])

  // ============================================================
  // Load customer location
  // ============================================================
  useEffect(() => {
    let isMounted = true

    const loadLocation = async () => {
      setLocationLoading(true)

      const currentUser = auth.currentUser
      if (currentUser?.uid) {
        setUser(currentUser)
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            if (data.location?.lat && data.location?.lng) {
              if (!isMounted) return
              setCustomerLocation({
                lat: data.location.lat,
                lng: data.location.lng,
              })
              setLocationSource('profile')
              setLocationLoading(false)
              return
            }
          }
        } catch (err) {
          console.warn('Location load error:', err.message)
        }
      }

      try {
        const stored = JSON.parse(
          localStorage.getItem('deliveryLocation') || 'null'
        )
        if (stored?.lat && stored?.lng) {
          if (!isMounted) return
          setCustomerLocation(stored)
          setLocationSource('localStorage')
          setLocationLoading(false)
          return
        }
      } catch (err) {
        // ignore
      }

      if (!isMounted) return
      setCustomerLocation(null)
      setLocationSource(null)
      setLocationLoading(false)
    }

    loadLocation()

    return () => {
      isMounted = false
    }
  }, [])

  // Load restaurants
  useEffect(() => {
    const restaurantQuery = query(
      collection(db, 'restaurants'),
      where('status', '==', 'approved')
    )
    const unsub = onSnapshot(restaurantQuery, (snap) => {
      setRestaurants(
        snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      )
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Load foods
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'foods'), (snap) => {
      setFoods(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // ============================================================
  // HELPERS
  // ============================================================
  const parseDeliveryTime = (timeStr) => {
    if (!timeStr) return 999
    const match = timeStr.match(/(\d+)/)
    return match ? parseInt(match[1]) : 999
  }

  const getDistanceToRestaurant = (restaurant) => {
    if (
      !customerLocation?.lat ||
      !customerLocation?.lng ||
      !restaurant.location?.lat ||
      !restaurant.location?.lng
    ) {
      return null
    }
    return calculateDistance(
      customerLocation.lat,
      customerLocation.lng,
      restaurant.location.lat,
      restaurant.location.lng
    )
  }

  const getDistanceToFood = (food) => {
    const rest = restaurants.find((r) => r.firebaseId === food.restaurantId)
    if (!rest) return null
    return getDistanceToRestaurant(rest)
  }

  // Category match — Option C
  const foodMatchesCategory = (food, catKey) => {
    if (!catKey) return true
    const key = catKey.toLowerCase().trim()

    const foodCat = (food.category || '').toLowerCase().trim()
    if (foodCat === key) return true

    const haystack = `${food.name || ''} ${food.category || ''} ${
      food.description || ''
    }`.toLowerCase()
    return haystack.includes(key)
  }

  // ============================================================
  // CATEGORY FOODS (dish-first list)
  // ============================================================
  const categoryFoods = useMemo(() => {
    if (!activeCategory) return []
    let result = foods.filter(
      (f) => f.available !== false && foodMatchesCategory(f, activeCategory)
    )

    // Sort by restaurant distance (nearest first)
    if (customerLocation && sort === 'nearest') {
      result.sort((a, b) => {
        const dA = getDistanceToFood(a)
        const dB = getDistanceToFood(b)
        if (dA == null && dB == null) return 0
        if (dA == null) return 1
        if (dB == null) return -1
        return dA - dB
      })
    } else if (sort === 'rating') {
      result.sort((a, b) => {
        const restA = restaurants.find((r) => r.firebaseId === a.restaurantId)
        const restB = restaurants.find((r) => r.firebaseId === b.restaurantId)
        return (restB?.rating || 0) - (restA?.rating || 0)
      })
    } else if (sort === 'cheapest') {
      result.sort(
        (a, b) =>
          (a.discountPrice || a.price || 999) -
          (b.discountPrice || b.price || 999)
      )
    } else if (sort === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return result
  }, [foods, activeCategory, customerLocation, sort, restaurants])

  // Restaurant IDs with category food
  const restaurantIdsInCategory = useMemo(() => {
    if (!activeCategory) return null
    const ids = new Set()
    categoryFoods.forEach((f) => {
      if (f.restaurantId) ids.add(f.restaurantId)
    })
    return ids
  }, [categoryFoods, activeCategory])

  // ============================================================
  // RESTAURANTS (for non-category view)
  // ============================================================
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]

    if (restaurantIdsInCategory) {
      result = result.filter((r) => restaurantIdsInCategory.has(r.firebaseId))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        `${r.restaurantName || ''} ${r.cuisine || ''} ${
          r.description || ''
        }`
          .toLowerCase()
          .includes(q)
      )
    }

    switch (filter) {
      case 'top-rated':
        result = result.filter((r) => (r.rating || 0) >= 4.5)
        break
      case 'open-now':
        result = result.filter((r) => r.restaurantStatus === 'online')
        break
      case 'budget':
        result = result.filter((r) => (r.deliveryFee || 0) <= 30)
        break
      case 'fast':
        result = result.filter(
          (r) => parseDeliveryTime(r.deliveryTime || r.delivery) <= 30
        )
        break
      case 'veg':
        result = result.filter((r) =>
          (r.cuisine || '').toLowerCase().includes('veg')
        )
        break
      case 'all':
      default:
        break
    }

    switch (sort) {
      case 'nearest':
        if (customerLocation) {
          result.sort((a, b) => {
            const distA = getDistanceToRestaurant(a)
            const distB = getDistanceToRestaurant(b)
            if (distA == null && distB == null) return 0
            if (distA == null) return 1
            if (distB == null) return -1
            return distA - distB
          })
        } else {
          result.sort((a, b) => {
            const aScore =
              (a.rating || 0) * 10 + (a.restaurantStatus === 'online' ? 5 : 0)
            const bScore =
              (b.rating || 0) * 10 + (b.restaurantStatus === 'online' ? 5 : 0)
            return bScore - aScore
          })
        }
        break
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'fastest':
        result.sort(
          (a, b) =>
            parseDeliveryTime(a.deliveryTime || a.delivery) -
            parseDeliveryTime(b.deliveryTime || b.delivery)
        )
        break
      case 'cheapest':
        result.sort(
          (a, b) => (a.deliveryFee || 999) - (b.deliveryFee || 999)
        )
        break
      case 'newest':
        result.sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime() || 0
          const bT = b.createdAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
        break
      case 'name':
        result.sort((a, b) =>
          (a.restaurantName || '').localeCompare(b.restaurantName || '')
        )
        break
      case 'recommended':
      default:
        result.sort((a, b) => {
          const aScore =
            (a.rating || 0) * 10 + (a.restaurantStatus === 'online' ? 5 : 0)
          const bScore =
            (b.rating || 0) * 10 + (b.restaurantStatus === 'online' ? 5 : 0)
          return bScore - aScore
        })
        break
    }

    return result
  }, [
    restaurants,
    search,
    filter,
    sort,
    customerLocation,
    restaurantIdsInCategory,
  ])

  // ============================================================
  // NEARBY vs FAR SPLIT (non-category view)
  // ============================================================
  const NEARBY_RADIUS_KM = 3

  const { nearbyRestaurants, farRestaurants } = useMemo(() => {
    if (!customerLocation || sort !== 'nearest' || activeCategory) {
      return { nearbyRestaurants: [], farRestaurants: filteredRestaurants }
    }

    const nearby = []
    const far = []

    filteredRestaurants.forEach((r) => {
      const dist = getDistanceToRestaurant(r)
      if (dist != null && dist <= NEARBY_RADIUS_KM) nearby.push(r)
      else far.push(r)
    })

    return { nearbyRestaurants: nearby, farRestaurants: far }
  }, [filteredRestaurants, customerLocation, sort, activeCategory])

  // ============================================================
  // SEARCH FOOD RESULTS (for search box)
  // ============================================================
  const matchingFoods = useMemo(() => {
    if (!search.trim() || activeCategory) return []
    const q = search.toLowerCase()

    let result = foods.filter(
      (f) =>
        f.available !== false &&
        `${f.name || ''} ${f.category || ''} ${f.description || ''}`
          .toLowerCase()
          .includes(q)
    )

    if (customerLocation && sort === 'nearest') {
      result.sort((a, b) => {
        const dA = getDistanceToFood(a)
        const dB = getDistanceToFood(b)
        if (dA == null && dB == null) return 0
        if (dA == null) return 1
        if (dB == null) return -1
        return dA - dB
      })
    }

    return result.slice(0, 12)
  }, [foods, search, restaurants, customerLocation, sort, activeCategory])

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => {
    const openCount = restaurants.filter(
      (r) => r.restaurantStatus === 'online'
    ).length
    const avgRating =
      restaurants.length > 0
        ? restaurants.reduce((s, r) => s + (r.rating || 0), 0) /
          restaurants.length
        : 0
    return {
      total: restaurants.length,
      foods: foods.length,
      open: openCount,
      avgRating: avgRating.toFixed(1),
    }
  }, [restaurants, foods])

  // ============================================================
  // CART
  // ============================================================
  const addToCartDirect = (food) => {
    const restaurant = restaurants.find(
      (r) => r.firebaseId === food.restaurantId
    )
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')

    const existingIndex = cartItems.findIndex((c) => c.id === food.firebaseId)

    let updatedCart
    if (existingIndex >= 0) {
      updatedCart = cartItems.map((c, i) =>
        i === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
      )
    } else {
      updatedCart = [
        ...cartItems,
        {
          id: food.firebaseId,
          name: food.name,
          price: food.discountPrice || food.price,
          emoji: food.emoji || '🍽️',
          image: food.image || '',
          quantity: 1,
          restaurantId: food.restaurantId,
          restaurantName:
            restaurant?.restaurantName || food.restaurantName || 'Restaurant',
          restaurantLogo: restaurant?.logo || '',
          deliveryFee: restaurant?.deliveryFee || 30,
          minimumOrder: restaurant?.minimumOrder || 100,
          deliveryTime: restaurant?.deliveryTime || '30-40 min',
        },
      ]
    }

    localStorage.setItem('cartItems', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
    toast.success(`${food.name} added to cart!`, { autoClose: 1500 })
  }

  const handleAddFood = (food, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    if (cartItems.length === 0) {
      addToCartDirect(food)
      return
    }
    if (cartItems[0].restaurantId === food.restaurantId) {
      addToCartDirect(food)
    } else {
      setConflictModal({
        food,
        currentRestaurant: cartItems[0].restaurantName,
      })
    }
  }

  const handleConflictConfirm = () => {
    if (!conflictModal) return
    localStorage.setItem('cartItems', JSON.stringify([]))
    addToCartDirect(conflictModal.food)
    setConflictModal(null)
  }

  // ============================================================
  // CLEAR CATEGORY
  // ============================================================
  const clearCategory = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('category')
    setSearchParams(newParams)
  }

  // ============================================================
  // FILTER OPTIONS
  // ============================================================
  const FILTERS = [
    { value: 'all', label: 'All', icon: '🍽️' },
    { value: 'top-rated', label: 'Top Rated', icon: '⭐' },
    { value: 'open-now', label: 'Open Now', icon: '🟢' },
    { value: 'fast', label: 'Fast Delivery', icon: '🚀' },
    { value: 'budget', label: 'Budget', icon: '💰' },
    { value: 'veg', label: 'Pure Veg', icon: '🥬' },
  ]

  if (loading) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
        <div className="restaurants-page">
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading restaurants...</p>
          </div>
        </div>
      </>
    )
  }

  const hasSearch = search.trim().length > 0
  const hasCategory = activeCategory.length > 0
  const hasLocation = customerLocation != null

  const catKey = activeCategory.toLowerCase().trim()
  const catInfo = CATEGORY_LABELS[catKey] || {
    emoji: '🍽️',
    label:
      activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1),
  }

  return (
    <>
      <style>{MOBILE_STYLES}</style>

      <div className="restaurants-page">
        <div className="restaurants-page-container">
          <PageBackButton label="Back" fallback="/" />

          {/* Header */}
          <div className="restaurants-page-header">
            <span className="glass-section-label">ARAIHAZAR LOCAL FOOD</span>
            <h1>
              {hasCategory ? (
                <>
                  {catInfo.emoji} <span>{catInfo.label}</span>
                </>
              ) : (
                <>
                  Find Your Next <span>Favourite Restaurant</span>
                </>
              )}
            </h1>
            <p>
              {hasCategory
                ? `${catInfo.label} — কাছের restaurant থেকে, কাছের আগে।`
                : 'Explore the best local restaurants around Araihazar and discover something delicious today.'}
            </p>
          </div>

          {/* Category chip */}
          {hasCategory && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                }}
              >
                <span style={{ fontSize: '16px' }}>{catInfo.emoji}</span>
                {catInfo.label}
                <button
                  onClick={clearCategory}
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    padding: 0,
                  }}
                  title="Clear category"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
              <span
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700,
                }}
              >
                {categoryFoods.length} টি {catInfo.label} আইটেম
              </span>
            </div>
          )}

          {/* Location Notice */}
          {hasLocation ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, rgba(5,150,105,0.1), rgba(16,185,129,0.05))',
                border: '1px solid rgba(5,150,105,0.25)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Navigation size={20} color="#047857" strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <strong
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#047857',
                    marginBottom: '2px',
                  }}
                >
                  📍 আপনার location দিয়ে কাছের আইটেম দেখানো হচ্ছে
                </strong>
                <span
                  style={{
                    fontSize: '12px',
                    color: '#065F46',
                    fontWeight: 600,
                  }}
                >
                  Location:{' '}
                  {locationSource === 'profile'
                    ? 'আপনার profile থেকে'
                    : locationSource === 'localStorage'
                    ? 'শেষ delivery address থেকে'
                    : 'GPS থেকে'}
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05))',
                border: '1px solid rgba(245,158,11,0.3)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '20px',
                }}
              >
                📍
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <strong
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#92400E',
                    marginBottom: '2px',
                  }}
                >
                  কাছের আইটেম দেখতে location set করুন
                </strong>
                <span
                  style={{
                    fontSize: '12px',
                    color: '#78350F',
                    fontWeight: 600,
                  }}
                >
                  Profile এ Map pin দিলে distance সহ দেখাবে
                </span>
              </div>
              <Link
                to="/account"
                style={{
                  padding: '9px 18px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                }}
              >
                Location Set →
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="restaurant-page-stats">
            <div className="restaurant-stat">
              <strong>{stats.total}+</strong>
              <span>Restaurants</span>
            </div>
            <div className="restaurant-stat">
              <strong>{stats.foods}+</strong>
              <span>Food Items</span>
            </div>
            <div className="restaurant-stat">
              <strong>{stats.open}</strong>
              <span>Open Now</span>
            </div>
            <div className="restaurant-stat">
              <strong>{stats.avgRating} ⭐</strong>
              <span>Avg Rating</span>
            </div>
          </div>

          {/* Controls */}
          <div className="restaurant-controls">
            <div className="restaurant-search">
              <Search size={18} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search food or restaurant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="clear-search"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="restaurant-filter-row">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={
                    filter === f.value
                      ? 'restaurant-filter active'
                      : 'restaurant-filter'
                  }
                  onClick={() => setFilter(f.value)}
                >
                  <span style={{ marginRight: '4px' }}>{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div className="restaurant-sort">
                <label htmlFor="restaurant-sort">Sort by</label>
                <select
                  id="restaurant-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {hasLocation && (
                    <option value="nearest">📍 Nearest First</option>
                  )}
                  <option value="recommended">✨ Recommended</option>
                  <option value="rating">⭐ Highest Rated</option>
                  <option value="fastest">🚀 Fastest Delivery</option>
                  <option value="cheapest">💰 Lowest Price</option>
                  <option value="newest">📅 Newest</option>
                  <option value="name">A-Z by Name</option>
                </select>
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                }}
              >
                {hasCategory
                  ? `${categoryFoods.length} item${
                      categoryFoods.length !== 1 ? 's' : ''
                    }`
                  : `${filteredRestaurants.length} restaurant${
                      filteredRestaurants.length !== 1 ? 's' : ''
                    }`}{' '}
                found
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CATEGORY VIEW → DISH CARDS (dish-first) */}
          {/* ============================================================ */}
          {hasCategory && (
            <div style={{ marginBottom: '40px' }}>
              <div className="restaurants-list-header">
                <div>
                  <span className="glass-section-label">
                    {catInfo.label.toUpperCase()} DISHES
                  </span>
                  <h2>
                    {catInfo.emoji} {catInfo.label} ({categoryFoods.length}{' '}
                    items)
                  </h2>
                </div>
              </div>

              {categoryFoods.length === 0 ? (
                <div className="restaurant-empty-state">
                  <div className="empty-icon">🔍</div>
                  <h2>
                    কোনো {catInfo.label} পাওয়া যায়নি
                  </h2>
                  <p>
                    এখনো কোনো restaurant এই category তে food যোগ করেনি। অন্য
                    category try করুন।
                  </p>
                  <button onClick={clearCategory}>← সব Restaurants</button>
                </div>
              ) : (
                <div className="glass-dish-grid">
                  {categoryFoods.map((food) => (
                    <DishCard
                      key={food.firebaseId}
                      food={food}
                      restaurant={restaurants.find(
                        (r) => r.firebaseId === food.restaurantId
                      )}
                      distance={getDistanceToFood(food)}
                      onAdd={(e) => handleAddFood(food, e)}
                      onCardClick={() =>
                        navigate(`/restaurant?id=${food.restaurantId}`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* SEARCH VIEW (no category) → FOOD SEARCH RESULTS */}
          {/* ============================================================ */}
          {hasSearch && !hasCategory && matchingFoods.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div className="restaurants-list-header">
                <div>
                  <span className="glass-section-label">FOOD MATCHES</span>
                  <h2>Foods for "{search}"</h2>
                </div>
                <span className="restaurant-count">
                  {matchingFoods.length} item(s)
                </span>
              </div>

              <div className="glass-dish-grid">
                {matchingFoods.map((food) => (
                  <DishCard
                    key={food.firebaseId}
                    food={food}
                    restaurant={restaurants.find(
                      (r) => r.firebaseId === food.restaurantId
                    )}
                    distance={getDistanceToFood(food)}
                    onAdd={(e) => handleAddFood(food, e)}
                    onCardClick={() =>
                      navigate(`/restaurant?id=${food.restaurantId}`)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* RESTAURANTS VIEW (no category OR search) */}
          {/* ============================================================ */}
          {!hasCategory && (
            <>
              <div className="restaurants-list-header">
                <div>
                  <span className="glass-section-label">
                    {hasSearch ? 'RESTAURANT MATCHES' : 'EXPLORE'}
                  </span>
                  <h2>
                    {hasSearch
                      ? `Restaurants for "${search}"`
                      : filter === 'all' && sort === 'nearest'
                      ? '📍 কাছের Restaurants'
                      : filter === 'all' && sort === 'recommended'
                      ? 'All Restaurants'
                      : `${
                          FILTERS.find((f) => f.value === filter)?.label
                        } Restaurants`}
                  </h2>
                </div>
                <span className="restaurant-count">
                  {filteredRestaurants.length} Result
                  {filteredRestaurants.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredRestaurants.length > 0 ? (
                <>
                  {/* Nearby section */}
                  {hasLocation &&
                    sort === 'nearest' &&
                    nearbyRestaurants.length > 0 && (
                      <>
                        <div
                          style={{
                            margin: '16px 0 12px',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            background:
                              'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
                            border: '1px solid rgba(5,150,105,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background:
                                'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <MapPin
                              size={16}
                              color="#047857"
                              strokeWidth={2.6}
                            />
                          </div>
                          <div>
                            <strong
                              style={{
                                display: 'block',
                                fontFamily: 'var(--font-heading)',
                                fontSize: '14px',
                                fontWeight: 800,
                                color: '#047857',
                                marginBottom: '2px',
                              }}
                            >
                              🎯 আপনার কাছের ({NEARBY_RADIUS_KM} km ভেতরে)
                            </strong>
                            <span
                              style={{
                                fontSize: '11.5px',
                                color: '#065F46',
                                fontWeight: 600,
                              }}
                            >
                              {nearbyRestaurants.length} restaurant পাওয়া গেছে
                            </span>
                          </div>
                        </div>
                        <div className="all-restaurants-grid">
                          {nearbyRestaurants.map((restaurant) => (
                            <RestaurantCard
                              key={restaurant.firebaseId}
                              restaurant={restaurant}
                              distance={getDistanceToRestaurant(restaurant)}
                              navigate={navigate}
                            />
                          ))}
                        </div>
                      </>
                    )}

                  {/* Far section */}
                  {hasLocation &&
                    sort === 'nearest' &&
                    farRestaurants.length > 0 && (
                      <>
                        {nearbyRestaurants.length > 0 && (
                          <div
                            style={{
                              margin: '24px 0 12px',
                              fontSize: '12px',
                              fontWeight: 800,
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <span
                              style={{
                                height: '1px',
                                flex: 1,
                                background: 'var(--border)',
                              }}
                            />
                            আরো দূরে
                            <span
                              style={{
                                height: '1px',
                                flex: 1,
                                background: 'var(--border)',
                              }}
                            />
                          </div>
                        )}
                        <div className="all-restaurants-grid">
                          {farRestaurants.map((restaurant) => (
                            <RestaurantCard
                              key={restaurant.firebaseId}
                              restaurant={restaurant}
                              distance={getDistanceToRestaurant(restaurant)}
                              navigate={navigate}
                            />
                          ))}
                        </div>
                      </>
                    )}

                  {/* Normal grid */}
                  {(!hasLocation || sort !== 'nearest') && (
                    <div className="all-restaurants-grid">
                      {filteredRestaurants.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.firebaseId}
                          restaurant={restaurant}
                          distance={getDistanceToRestaurant(restaurant)}
                          navigate={navigate}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="restaurant-empty-state">
                  <div className="empty-icon">🔍</div>
                  <h2>No results found</h2>
                  <p>
                    {search
                      ? `No restaurants match "${search}" with current filters.`
                      : 'Try a different filter or search.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearch('')
                      setFilter('all')
                      setSort('nearest')
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </>
          )}

          {/* Bottom CTA */}
          <div className="restaurants-bottom-cta">
            <div>
              <span
                className="glass-section-label"
                style={{ color: '#FFFFFF' }}
              >
                ARAIFOOD
              </span>
              <h2>Can't decide what to eat?</h2>
              <p>
                Explore our popular restaurants and find your next favourite
                meal.
              </p>
            </div>
            <button onClick={() => navigate('/')}>Explore Home →</button>
          </div>
        </div>

        {/* Conflict Modal */}
        {conflictModal && (
          <div
            className="outside-area-modal"
            onClick={() => setConflictModal(null)}
          >
            <div
              className="outside-area-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="outside-area-icon">⚠️</div>
              <h2>Clear Your Cart?</h2>
              <p>
                Your cart has items from{' '}
                <strong>{conflictModal.currentRestaurant}</strong>.
                <br />
                <br />
                Do you want to clear the cart and add{' '}
                <strong>{conflictModal.food.name}</strong>?
              </p>
              <div className="conflict-modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setConflictModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleConflictConfirm}
                >
                  Yes, Clear & Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ============================================================
// DISH CARD COMPONENT — Dish-first with big image
// ============================================================
function DishCard({ food, restaurant, distance, onAdd, onCardClick }) {
  const distText = formatDistance(distance)
  const hasImage = Boolean(food.image)

  return (
    <div
      className="glass-dish-card"
      onClick={onCardClick}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      <div className="glass-dish-image">
        {hasImage ? (
          <img
            src={food.image}
            alt={food.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          // Emoji fallback with gradient
          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(135deg, #FEF3C7, #FED7AA, #FBCFE8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '72px',
            }}
          >
            {food.emoji || '🍽️'}
          </div>
        )}

        {/* Hot badge */}
        <div className="glass-dish-hot">
          <Flame size={12} strokeWidth={0} fill="#FFFFFF" />
          Hot
        </div>

        {/* Distance badge */}
        {distText && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(5,150,105,0.95)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <MapPin size={11} strokeWidth={2.8} />
            {distText}
          </div>
        )}

        {/* Discount badge */}
        {food.discountPrice && food.price > food.discountPrice && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #DC2626, #991B1B)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
            }}
          >
            {Math.round(
              ((food.price - food.discountPrice) / food.price) * 100
            )}
            % OFF
          </div>
        )}
      </div>

      <div className="glass-dish-info">
        {/* Dish name */}
        <h3>{food.name}</h3>

        {/* Restaurant name (small) */}
        <p
          style={{
            fontSize: '11.5px',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            marginTop: '2px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          🏪 {restaurant?.restaurantName || 'Restaurant'}
        </p>

        {/* Bottom: Price + Add button */}
        <div className="glass-dish-bottom">
          <div className="glass-dish-price">
            <strong>৳{food.discountPrice || food.price}</strong>
            {food.discountPrice && food.price > food.discountPrice && (
              <del
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                }}
              >
                ৳{food.price}
              </del>
            )}
          </div>

          <button
            className="glass-dish-add orange"
            title="Add to cart"
            onClick={onAdd}
          >
            <Plus size={16} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// RESTAURANT CARD COMPONENT (for non-category view)
// ============================================================
function RestaurantCard({ restaurant, distance, navigate }) {
  const distText = formatDistance(distance)

  return (
    <div
      className="all-restaurant-card"
      onClick={() => navigate(`/restaurant?id=${restaurant.firebaseId}`)}
    >
      <div className="all-restaurant-image">
        {restaurant.logo ? (
          <img
            src={restaurant.logo}
            alt={restaurant.restaurantName}
            className="restaurant-logo-img"
          />
        ) : (
          <span className="restaurant-main-emoji">🏪</span>
        )}

        {restaurant.restaurantStatus === 'online' && (
          <div className="restaurant-badge online-badge">🟢 Open</div>
        )}
        {restaurant.restaurantStatus === 'busy' && (
          <div className="restaurant-badge busy-badge">🟡 Busy</div>
        )}

        <div className="all-restaurant-rating">
          <Star size={12} strokeWidth={0} fill="#F59E0B" />
          {restaurant.rating?.toFixed?.(1) || restaurant.rating || '4.5'}
        </div>

        {distText && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(5,150,105,0.95)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <MapPin size={11} strokeWidth={2.8} />
            {distText}
          </div>
        )}
      </div>

      <div className="all-restaurant-info">
        <div className="restaurant-title-row">
          <h2>{restaurant.restaurantName}</h2>
          <span className="restaurant-price">
            ৳{restaurant.deliveryFee || 30}
          </span>
        </div>
        <p className="restaurant-cuisine">{restaurant.cuisine}</p>
        <div className="all-restaurant-meta">
          <span>
            🕒{' '}
            {restaurant.deliveryTime ||
              `${restaurant.openingTime || '10:00'} - ${
                restaurant.closingTime || '22:00'
              }`}
          </span>
          <span>📦 Min ৳{restaurant.minimumOrder || 100}</span>
        </div>
        <button
          className="restaurant-menu-button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/restaurant?id=${restaurant.firebaseId}`)
          }}
        >
          <span>View Menu</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

export default RestaurantsPage