import './App.css'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Categories from './components/Categories'
import RestaurantCard from './components/RestaurantCard'
import Offers from './components/Offers'
import Footer from './components/Footer'
import FavoritesPage from './pages/FavoritesPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import TrackOrderPage from './pages/TrackOrderPage'
import RiderLoginPage from './pages/RiderLoginPage'
import RestaurantLoginPage from './pages/RestaurantLoginPage'
import RestaurantPanel from './pages/RestaurantPanel'
import PharmacyPage from './pages/PharmacyPage'
import AdminPanel from './pages/AdminPanel'
import RiderPanel from './pages/RiderPanel'
import LiveChat from './components/LiveChat'

import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import RestaurantPage from './pages/RestaurantPage'
import RestaurantsPage from './pages/RestaurantsPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AccountPage from './pages/AccountPage'
import CartPage from './pages/CartPage'
import { restaurantsData } from './data/restaurantsData'

function HomePage() {
  return (
    <>
      <Categories />
      <Hero />
      
      <div className="delivery-stats">
        <div className="delivery-stat">
          <div className="delivery-stat-icon">🚴</div>
          <div>
            <strong>30 min</strong>
            <small>Average Delivery</small>
          </div>
        </div>
        <div className="delivery-stat">
          <div className="delivery-stat-icon">🕒</div>
          <div>
            <strong>10 AM - 10 PM</strong>
            <small>Working Hours</small>
          </div>
        </div>
        <div className="delivery-stat">
          <div className="delivery-stat-icon">💰</div>
          <div>
            <strong>৳30</strong>
            <small>Delivery Charge</small>
          </div>
        </div>
      </div>

      <section className="restaurants">
        <div className="restaurants-header">
          <div>
            <span className="section-label">LOCAL FAVOURITES</span>
            <h2>Popular Restaurants</h2>
            <p>Discover popular food spots around Araihazar.</p>
          </div>
          <button className="view-all" onClick={() => { window.location.href = '/restaurants' }}>
            View All →
          </button>
        </div>
        <div className="restaurant-grid">
          {restaurantsData.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </section>

      <Offers />
    </>
  )
}

function OffersPage() {
  return (
    <>
      <div className="restaurants-page">
        <div className="restaurants-page-container">
          <div className="restaurants-page-header">
            <span className="section-label">ARAIFOOD OFFERS</span>
            <h1>Special Offers</h1>
            <p>Enjoy delicious food with special offers from restaurants around Araihazar.</p>
          </div>
          <Offers />
        </div>
      </div>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <div className="restaurants-page">
        <div className="restaurants-page-container">
          <div className="restaurants-page-header">
            <span className="section-label">ABOUT ARAIFOOD</span>
            <h1>About AraiFood</h1>
            <p>Your local food delivery platform for Araihazar.</p>
          </div>
          <div className="account-card">
            <h2>Bringing Araihazar's Food Closer</h2>
            <p>AraiFood is a local food delivery platform created to make it easier for people around Araihazar to discover restaurants and order delicious food from their favourite local food spots.</p>
            <p>From biryani and traditional Bangladeshi meals to burgers, pizza, snacks and refreshing drinks, AraiFood brings local restaurants together in one convenient place.</p>
            <div className="account-divider"></div>
            <h3>Why AraiFood?</h3>
            <p>🍛 Discover local restaurants</p>
            <p>🚴 Convenient food delivery</p>
            <p>⭐ Find highly-rated food spots</p>
            <p>❤️ Support local businesses</p>
          </div>
        </div>
      </div>
    </>
  )
}

function App() {
  const location = useLocation()
  const isCheckout = location.pathname === '/checkout'
  const isAuth = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <>
      {!isCheckout && !isAuth && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurant" element={<RestaurantPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/rider-login" element={<RiderLoginPage />} />
        <Route path="/restaurant-login" element={<RestaurantLoginPage />} />
        <Route path="/restaurant-panel" element={<RestaurantPanel />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/order-history" element={<OrderHistoryPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/rider-panel" element={<RiderPanel />} />
      </Routes>

      {!isCheckout && !isAuth && <Footer />}

      <LiveChat />

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