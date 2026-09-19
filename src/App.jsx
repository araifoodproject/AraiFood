import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Firebase
import { db } from './firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

// Hooks
import useSettings from './hooks/useSettings'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Categories from './components/Categories'
import DeliveryStats from './components/DeliveryStats'
import RestaurantCard from './components/RestaurantCard'
import TrendingDishes from './components/TrendingDishes'
import ItemsYouLove from './components/ItemsYouLove'
import CouponSection from './components/CouponSection'
import Offers from './components/Offers'
import LiveChat from './components/LiveChat'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'

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
import GamingPage from './pages/GamingPage'
import GamingOrdersPage from './pages/GamingOrdersPage'
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

// ============================================================
// HOME PAGE
// ============================================================
function HomePage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

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
      setRestaurants(list.slice(0, 4))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <>
      <Categories />
      <Hero />
      <DeliveryStats />

      <section className="glass-restaurants-section">
        <div className="glass-restaurants-header">
          <div>
            <span className="glass-section-label">LOCAL FAVOURITES</span>
            <h2 className="glass-restaurants-header-title">
              Popular Restaurants
            </h2>
            <p className="glass-restaurants-header-sub">
              Discover popular food spots around Araihazar.
            </p>
          </div>
          <Link to="/restaurants" className="glass-view-all">
            View All <span>→</span>
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Loading restaurants...
          </p>
        ) : restaurants.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No restaurants available yet.
          </p>
        ) : (
          <div className="glass-restaurants-grid">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.firebaseId}
                restaurant={restaurant}
              />
            ))}
          </div>
        )}
      </section>

      <TrendingDishes />
      <ItemsYouLove />
      <CouponSection />
      <Offers />
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
          <p>
            Enjoy delicious food with special offers from restaurants around
            Araihazar.
          </p>
        </div>
        <Offers />
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

  const isCheckout = path === '/checkout'
  const isAuth =
    path === '/login' ||
    path === '/signup' ||
    path === '/restaurant-login' ||
    path === '/restaurant-signup' ||
    path === '/rider-login' ||
    path === '/rider-signup'
  const isPanel =
    path.startsWith('/admin') ||
    path.startsWith('/restaurant-panel') ||
    path.startsWith('/rider-panel')

  const showNavbarAndFooter = !isCheckout && !isAuth && !isPanel

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
        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/gaming" element={<GamingPage />} />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/restaurant-login" element={<RestaurantLoginPage />} />
        <Route path="/restaurant-signup" element={<RestaurantSignupPage />} />
        <Route path="/rider-login" element={<RiderLoginPage />} />
        <Route path="/rider-signup" element={<RiderSignupPage />} />

        {/* CUSTOMER PROTECTED */}
        <Route
          path="/account"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/track-order"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <TrackOrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gaming-orders"
          element={
            <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
              <GamingOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* RESTAURANT */}
        <Route
          path="/restaurant-panel"
          element={
            <ProtectedRoute
              allowedRoles={['restaurant']}
              redirectTo="/restaurant-login"
            >
              <RestaurantPanel />
            </ProtectedRoute>
          }
        />

        {/* RIDER */}
        <Route
          path="/rider-panel"
          element={
            <ProtectedRoute allowedRoles={['rider']} redirectTo="/rider-login">
              <RiderPanel />
            </ProtectedRoute>
          }
        />

        {/* ADMIN — Main */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/restaurants"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminRestaurantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/foods"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminFoodsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/riders"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminRidersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminCustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminFinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminCouponsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/marketing"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminMarketingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminSupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/zones"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminZonesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminSecurityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gaming-products"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminGamingProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gaming-orders"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminGamingOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gaming-settings"
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
              <AdminGamingSettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      {showNavbarAndFooter && <Footer />}
      {!isPanel && <LiveChat />}

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