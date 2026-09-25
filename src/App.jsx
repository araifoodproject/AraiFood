// ============================================================
// src/App.jsx
// V8 — AraiFood Payment Numbers + Rider Payments routes
// ============================================================

import { useState, useEffect, lazy, Suspense } from 'react'
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
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import SubscribePromptModal from './components/SubscribePromptModal'
import Hero from './components/Hero'
import Categories from './components/Categories'
import GamingBanner from './components/GamingBanner'
import PartnerCTA from './components/PartnerCTA'
import DeliveryAreas from './components/DeliveryAreas'
import LiveChat from './components/LiveChat'

// Public Pages
const RestaurantsPage = lazy(() => import('./pages/RestaurantsPage'))
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'))
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'))
const PharmacyPage = lazy(() => import('./pages/PharmacyPage'))
const PharmacyDetailPage = lazy(() => import('./pages/PharmacyDetailPage'))
const PharmacyCheckoutPage = lazy(() => import('./pages/PharmacyCheckoutPage'))
const PharmacyLoginPage = lazy(() => import('./pages/PharmacyLoginPage'))
const PharmacySignupPage = lazy(() => import('./pages/PharmacySignupPage'))
const PharmacyPanel = lazy(() => import('./pages/PharmacyPanel'))
const GamingPage = lazy(() => import('./pages/GamingPage'))
const GamingOrdersPage = lazy(() => import('./pages/GamingOrdersPage'))
const PartnerLoginPage = lazy(() => import('./pages/PartnerLoginPage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const RestaurantPanel = lazy(() => import('./pages/RestaurantPanel'))
const RiderPanel = lazy(() => import('./pages/RiderPanel'))
const RestaurantLoginPage = lazy(() => import('./pages/RestaurantLoginPage'))
const RestaurantSignupPage = lazy(() => import('./pages/RestaurantSignupPage'))
const RiderLoginPage = lazy(() => import('./pages/RiderLoginPage'))
const RiderSignupPage = lazy(() => import('./pages/RiderSignupPage'))

// Static pages
const HelpPage = lazy(() => import('./pages/HelpPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))

// Admin Pages
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminRestaurantsPage = lazy(() => import('./pages/admin/AdminRestaurantsPage'))
const AdminRidersPage = lazy(() => import('./pages/admin/AdminRidersPage'))
const AdminFoodsPage = lazy(() => import('./pages/admin/AdminFoodsPage'))
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'))
const AdminFinancePage = lazy(() => import('./pages/admin/AdminFinancePage'))
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'))
const AdminMarketingPage = lazy(() => import('./pages/admin/AdminMarketingPage'))
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'))
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'))
const AdminZonesPage = lazy(() => import('./pages/admin/AdminZonesPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))
const AdminSecurityPage = lazy(() => import('./pages/admin/AdminSecurityPage'))
const AdminGamingProductsPage = lazy(() => import('./pages/admin/AdminGamingProductsPage'))
const AdminGamingOrdersPage = lazy(() => import('./pages/admin/AdminGamingOrdersPage'))
const AdminGamingSettingsPage = lazy(() => import('./pages/admin/AdminGamingSettingsPage'))
const AdminWalletRequestsPage = lazy(() => import('./pages/admin/AdminWalletRequestsPage'))
const AdminManagementPage = lazy(() => import('./pages/admin/AdminManagementPage'))
const AdminPharmaciesPage = lazy(() => import('./pages/admin/AdminPharmaciesPage'))
const AdminMedicinesPage = lazy(() => import('./pages/admin/AdminMedicinesPage'))
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage'))

// Settlement
const AdminSettlementPage = lazy(() => import('./pages/admin/settlement/AdminSettlementPage'))
const AdminSettlementSettingsPage = lazy(() => import('./pages/admin/settlement/AdminSettlementSettingsPage'))
const AdminSettlementHistoryPage = lazy(() => import('./pages/admin/settlement/AdminSettlementHistoryPage'))
const AdminPaymentNumbersPage = lazy(() => import('./pages/admin/settlement/AdminPaymentNumbersPage'))
const AdminAraiFoodPaymentNumbersPage = lazy(() => import('./pages/admin/settlement/AdminAraiFoodPaymentNumbersPage'))
const AdminRiderPaymentsPage = lazy(() => import('./pages/admin/settlement/AdminRiderPaymentsPage'))

// ============================================================
// PAGE LOADER
// ============================================================
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '40px 20px',
      }}
    >
      <div className="panel-loading-spinner"></div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px', fontWeight: 600 }}>
        Loading...
      </p>
    </div>
  )
}

// ============================================================
// HOME PAGE — Restaurant Card
// ============================================================
function RestaurantCardHome({ restaurant }) {
  const navigate = useNavigate()
  const { settings } = useSettings()

  const rating = restaurant.rating ?? null
  const isOpen =
    restaurant.restaurantStatus === 'online' ||
    restaurant.restaurantStatus === 'busy'

  const deliveryTime =
    restaurant.deliveryTime || restaurant.delivery || settings.defaultDeliveryTime

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
          <p>
            From biryani and traditional Bangladeshi meals to burgers, pizza,
            snacks and refreshing drinks, {siteName} brings local restaurants
            together in one convenient place.
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
  const showSubscribePrompt = currentUser && !isAuth && !isPanel && !isCheckout

  return (
    <>
      <ScrollToTop />

      {showNavbarAndFooter && <Navbar />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />

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

          {/* SETTLEMENT */}
          <Route path="/admin/settlement" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminSettlementPage /></ProtectedRoute>} />
          <Route path="/admin/settlement/settings" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminSettlementSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/settlement/history" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminSettlementHistoryPage /></ProtectedRoute>} />
          <Route path="/admin/settlement/payment-numbers" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminPaymentNumbersPage /></ProtectedRoute>} />
          <Route path="/admin/settlement/araifood-numbers" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminAraiFoodPaymentNumbersPage /></ProtectedRoute>} />
          <Route path="/admin/settlement/rider-payments" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="finance" redirectTo="/login"><AdminRiderPaymentsPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>

      {showNavbarAndFooter && <Footer />}
      {!isPanel && <LiveChat />}

      {showSubscribePrompt && <SubscribePromptModal user={currentUser} />}

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