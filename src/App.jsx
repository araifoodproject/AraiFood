// ============================================================
// src/App.jsx
// V3 — With Push Subscribe Prompt (Modal + Banner)
// ============================================================

import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Firebase
import { db, auth } from './firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

// Hooks
import useSettings from './hooks/useSettings'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Categories from './components/Categories'
import GamingBanner from './components/GamingBanner'
import PartnerCTA from './components/PartnerCTA'
import DeliveryAreas from './components/DeliveryAreas'
import LiveChat from './components/LiveChat'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import SubscribePromptModal from './components/SubscribePromptModal' // ✅ NEW

// Pages
import RestaurantsPage from './pages/RestaurantsPage'
import RestaurantPage from './pages/RestaurantPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import TrackOrderPage from './pages/TrackOrderPage'
import PharmacyPage from './pages/PharmacyPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'
import PharmacyCheckoutPage from './pages/PharmacyCheckoutPage'
import PharmacyLoginPage from './pages/PharmacyLoginPage'
import PharmacySignupPage from './pages/PharmacySignupPage'
import PharmacyPanel from './pages/PharmacyPanel'
import GamingPage from './pages/GamingPage'
import GamingOrdersPage from './pages/GamingOrdersPage'
import PartnerLoginPage from './pages/PartnerLoginPage'
import AdminPanel from './pages/AdminPanel'
import RestaurantPanel from './pages/RestaurantPanel'
import RiderPanel from './pages/RiderPanel'
import RestaurantLoginPage from './pages/RestaurantLoginPage'
import RestaurantSignupPage from './pages/RestaurantSignupPage'
import RiderLoginPage from './pages/RiderLoginPage'
import RiderSignupPage from './pages/RiderSignupPage'

// Admin Pages
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminRestaurantsPage from './pages/admin/AdminRestaurantsPage'
import AdminRidersPage from './pages/admin/AdminRidersPage'
import AdminFoodsPage from './pages/admin/AdminFoodsPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminFinancePage from './pages/admin/AdminFinancePage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'
import AdminMarketingPage from './pages/admin/AdminMarketingPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminZonesPage from './pages/admin/AdminZonesPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminSecurityPage from './pages/admin/AdminSecurityPage'
import AdminGamingProductsPage from './pages/admin/AdminGamingProductsPage'
import AdminGamingOrdersPage from './pages/admin/AdminGamingOrdersPage'
import AdminGamingSettingsPage from './pages/admin/AdminGamingSettingsPage'
import AdminWalletRequestsPage from './pages/admin/AdminWalletRequestsPage'
import AdminManagementPage from './pages/admin/AdminManagementPage'
import AdminPharmaciesPage from './pages/admin/AdminPharmaciesPage'
import AdminMedicinesPage from './pages/admin/AdminMedicinesPage'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage'

// ============================================================
// HOME PAGE — Restaurant Card Component
// ============================================================
function RestaurantCardHome({ restaurant }) {
  const navigate = useNavigate()
  const { settings } = useSettings()

  const rating = restaurant.rating ?? null
  const isOpen =
    restaurant.restaurantStatus === 'online' ||
    restaurant.restaurantStatus === 'busy'

  const deliveryTime =
    restaurant.deliveryTime ||
    restaurant.delivery ||
    settings.defaultDeliveryTime

  const deliveryFee =
    restaurant.deliveryFee != null
      ? restaurant.deliveryFee
      : settings.defaultDeliveryFee

  const formatTime = (time24) => {
    if (!time24) return '10 AM'
    try {
      const [h, m] = time24.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}${m === '00' ? '' : ':' + m} ${ampm}`
    } catch (e) {
      return '10 AM'
    }
  }

  const getStatusMessage = () => {
    if (isOpen) return 'Open · Now'
    if (restaurant.openingTime) {
      return `Closed · Opens ${formatTime(restaurant.openingTime)}`
    }
    return 'Closed'
  }

  const getCuisineEmoji = (cuisine) => {
    if (!cuisine) return '🍽️'
    const c = cuisine.toLowerCase()
    if (c.includes('biryani') || c.includes('biriyani')) return '🍛'
    if (c.includes('burger')) return '🍔'
    if (c.includes('pizza')) return '🍕'
    if (c.includes('chinese')) return '🍜'
    if (c.includes('chicken')) return '🍗'
    if (c.includes('snack')) return '🍟'
    if (c.includes('drink') || c.includes('beverage')) return '🥤'
    if (c.includes('dessert') || c.includes('sweet')) return '🍰'
    if (c.includes('rice') || c.includes('curry')) return '🍚'
    return '🍽️'
  }

  return (
    <div
      className="aa-restaurant-card"
      onClick={() => navigate(`/restaurant?id=${restaurant.firebaseId}`)}
    >
      <div className="aa-restaurant-image">
        {restaurant.logo ? (
          <img src={restaurant.logo} alt={restaurant.restaurantName} />
        ) : (
          <span>{getCuisineEmoji(restaurant.cuisine)}</span>
        )}
        {rating != null && (
          <div className="aa-restaurant-rating">⭐ {rating}</div>
        )}
      </div>

      <div className="aa-restaurant-info">
        <h3 className="aa-restaurant-name">{restaurant.restaurantName}</h3>
        <p className="aa-restaurant-cuisine">
          {rating != null && `⭐ ${rating} · `}
          {restaurant.cuisine || 'Restaurant'}
        </p>

        <div className="aa-restaurant-meta">
          <span>🕐 {deliveryTime}</span>
          <span>🚚 ৳{deliveryFee}</span>
          <span className={`aa-status-badge ${isOpen ? 'open' : 'closed'}`}>
            {getStatusMessage()}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// HOME PAGE
// ============================================================
function HomePage() {
  const { settings } = useSettings()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  const home = settings.home || {}
  const popularLimit = home.popularLimit || 6

  useEffect(() => {
    const restaurantQuery = query(
      collection(db, 'restaurants'),
      where('status', '==', 'approved')
    )

    const unsubscribe = onSnapshot(restaurantQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      setRestaurants(list.slice(0, popularLimit))
      setLoading(false)
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popularLimit])

  return (
    <>
      <Hero />
      <Categories />

      <section className="aa-section">
        <div className="aa-section-header">
          <div>
            <h2 className="aa-section-title">{home.popularTitle}</h2>
            <p className="aa-section-sub">{home.popularSubtitle}</p>
          </div>
          <Link to="/restaurants" className="aa-section-link">
            See all <span>→</span>
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
            Loading restaurants...
          </p>
        ) : restaurants.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
            No restaurants available yet.
          </p>
        ) : (
          <div className="aa-restaurant-grid">
            {restaurants.map((restaurant) => (
              <RestaurantCardHome
                key={restaurant.firebaseId}
                restaurant={restaurant}
              />
            ))}
          </div>
        )}
      </section>

      <GamingBanner />
      <PartnerCTA />
      <DeliveryAreas />
    </>
  )
}

// ============================================================
// OFFERS PAGE
// ============================================================
function OffersPage() {
  const { settings } = useSettings()
  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="glass-section-label">
            {(settings.siteName || 'ARAIFOOD').toUpperCase()} OFFERS
          </span>
          <h1>Special Offers</h1>
          <p>Enjoy delicious food with special offers from restaurants around Araihazar.</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ABOUT PAGE
// ============================================================
function AboutPage() {
  const { settings } = useSettings()
  const siteName = settings.siteName || 'AraiFood'

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <div className="restaurants-page-header">
          <span className="glass-section-label">
            ABOUT {(siteName || 'ARAIFOOD').toUpperCase()}
          </span>
          <h1>About {siteName}</h1>
          <p>Your local food delivery platform for Araihazar.</p>
        </div>
        <div className="account-card">
          <h2>Bringing Araihazar's Food Closer</h2>
          <p>
            {siteName} is a local food delivery platform created to make it
            easier for people around Araihazar to discover restaurants and
            order delicious food from their favourite local food spots.
          </p>
          <div className="account-divider"></div>
          <h3>Why {siteName}?</h3>
          <p>🍛 Discover local restaurants</p>
          <p>🚴 Convenient food delivery</p>
          <p>⭐ Find highly-rated food spots</p>
          <p>❤️ Support local businesses</p>
          <div className="account-divider"></div>
          <h3>Get in Touch</h3>
          <p>📧 {settings.contactEmail}</p>
          <p>📞 {settings.contactPhone}</p>
          <p>📍 {settings.address}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// APP
// ============================================================
function App() {
  const location = useLocation()
  const path = location.pathname
  const [currentUser, setCurrentUser] = useState(null)

  // Track auth state for the subscribe prompt
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u))
    return () => unsub()
  }, [])

  const isCheckout = path === '/checkout' || path === '/pharmacy-checkout'
  const isAuth =
    path === '/login' ||
    path === '/signup' ||
    path === '/restaurant-login' ||
    path === '/restaurant-signup' ||
    path === '/rider-login' ||
    path === '/rider-signup' ||
    path === '/partner-login' ||
    path === '/pharmacy-login' ||
    path === '/pharmacy-signup'
  const isPanel =
    path.startsWith('/admin') ||
    path.startsWith('/restaurant-panel') ||
    path.startsWith('/rider-panel') ||
    path.startsWith('/pharmacy-panel')

  const showNavbarAndFooter = !isCheckout && !isAuth && !isPanel

  // Show subscribe prompt only on customer-facing pages
  const showSubscribePrompt =
    currentUser && !isAuth && !isPanel && !isCheckout

  return (
    <>
      <ScrollToTop />

      {showNavbarAndFooter && <Navbar />}

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurant" element={<RestaurantPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* PHARMACY */}
        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/pharmacy-detail" element={<PharmacyDetailPage />} />

        {/* GAMING */}
        <Route path="/gaming" element={<GamingPage />} />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/partner-login" element={<PartnerLoginPage />} />
        <Route path="/restaurant-login" element={<RestaurantLoginPage />} />
        <Route path="/restaurant-signup" element={<RestaurantSignupPage />} />
        <Route path="/rider-login" element={<RiderLoginPage />} />
        <Route path="/rider-signup" element={<RiderSignupPage />} />
        <Route path="/pharmacy-login" element={<PharmacyLoginPage />} />
        <Route path="/pharmacy-signup" element={<PharmacySignupPage />} />

        {/* CUSTOMER PROTECTED */}
        <Route path="/account" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><AccountPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><CheckoutPage /></ProtectedRoute>} />
        <Route path="/pharmacy-checkout" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><PharmacyCheckoutPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><FavoritesPage /></ProtectedRoute>} />
        <Route path="/order-history" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/track-order" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><TrackOrderPage /></ProtectedRoute>} />
        <Route path="/gaming-orders" element={<ProtectedRoute allowedRoles={['customer']} redirectTo="/login"><GamingOrdersPage /></ProtectedRoute>} />

        {/* RESTAURANT PANEL */}
        <Route path="/restaurant-panel" element={<ProtectedRoute allowedRoles={['restaurant']} redirectTo="/restaurant-login"><RestaurantPanel /></ProtectedRoute>} />

        {/* RIDER PANEL */}
        <Route path="/rider-panel" element={<ProtectedRoute allowedRoles={['rider']} redirectTo="/rider-login"><RiderPanel /></ProtectedRoute>} />

        {/* PHARMACY PANEL */}
        <Route path="/pharmacy-panel" element={<ProtectedRoute allowedRoles={['pharmacy']} redirectTo="/pharmacy-login"><PharmacyPanel /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="orders" redirectTo="/login"><AdminOrdersPage /></ProtectedRoute>} />
        <Route path="/admin/restaurants" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="restaurants" redirectTo="/login"><AdminRestaurantsPage /></ProtectedRoute>} />
        <Route path="/admin/foods" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="foods" redirectTo="/login"><AdminFoodsPage /></ProtectedRoute>} />
        <Route path="/admin/pharmacies" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="restaurants" redirectTo="/login"><AdminPharmaciesPage /></ProtectedRoute>} />
        <Route path="/admin/medicines" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="foods" redirectTo="/login"><AdminMedicinesPage /></ProtectedRoute>} />
        <Route path="/admin/riders" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="riders" redirectTo="/login"><AdminRidersPage /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="customers" redirectTo="/login"><AdminCustomersPage /></ProtectedRoute>} />
        <Route path="/admin/finance" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminFinancePage /></ProtectedRoute>} />
        <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="coupons" redirectTo="/login"><AdminCouponsPage /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="marketing" redirectTo="/login"><AdminNotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/marketing" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="marketing" redirectTo="/login"><AdminMarketingPage /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="reviews" redirectTo="/login"><AdminReviewsPage /></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="support" redirectTo="/login"><AdminSupportPage /></ProtectedRoute>} />
        <Route path="/admin/zones" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="zones" redirectTo="/login"><AdminZonesPage /></ProtectedRoute>} />
        <Route path="/admin/wallet-requests" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="walletRequests" redirectTo="/login"><AdminWalletRequestsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="settings" redirectTo="/login"><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="security" redirectTo="/login"><AdminSecurityPage /></ProtectedRoute>} />
        <Route path="/admin/gaming-products" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="gamingProducts" redirectTo="/login"><AdminGamingProductsPage /></ProtectedRoute>} />
        <Route path="/admin/gaming-orders" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="gamingOrders" redirectTo="/login"><AdminGamingOrdersPage /></ProtectedRoute>} />
        <Route path="/admin/gaming-settings" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="gamingSettings" redirectTo="/login"><AdminGamingSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/management" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="management" redirectTo="/login"><AdminManagementPage /></ProtectedRoute>} />
      </Routes>

      {showNavbarAndFooter && <Footer />}
      {!isPanel && <LiveChat />}

      {/* ✅ NEW: Subscribe Prompt Modal (global) */}
      {showSubscribePrompt && (
        <SubscribePromptModal user={currentUser} />
      )}

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default App