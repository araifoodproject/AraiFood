import './App.css'
import Navbar from './components/Navbar'
import Categories from './components/Categories'
import RestaurantCard from './components/RestaurantCard'
import restaurants from './data/restaurants'
import Offers from './components/Offers'
import Footer from './components/Footer'
import RestaurantPage from './pages/RestaurantPage'
import CheckoutPage from './pages/CheckoutPage'
import RestaurantsPage from './pages/RestaurantsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AccountPage from './pages/AccountPage'
function App() {
  const path = window.location.pathname
if (path === '/checkout') {
  return <CheckoutPage />
}
if (path === '/login') {
  return <LoginPage />
}
if (path === '/signup') {
  return <SignupPage />
}
if (path === '/account') {
  return <AccountPage />
}
if (path === '/restaurants') {
  return <RestaurantsPage />
}

if (path === '/restaurant') {
  return <RestaurantPage />
}

  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">
              🍽️ Araihazar's Local Food Delivery
            </span>

            <h1>
              Your Favourite Food,
              <span> Delivered Fresh.</span>
            </h1>

            <p>
              Discover delicious food from restaurants around Araihazar
              and get it delivered right to your doorstep.
            </p>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search food or restaurant..."
              />

              <button>Find Food</button>
            </div>

            <div className="hero-info">
              <div>
                <strong>100+</strong>
                <small>Food Items</small>
              </div>

              <div>
                <strong>20+</strong>
                <small>Local Restaurants</small>
              </div>

              <div>
                <strong>Fast</strong>
                <small>Local Delivery</small>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="food-circle">
              🍔
            </div>

            <div className="floating-card card-one">
              ⭐ 4.9 Rating
            </div>

            <div className="floating-card card-two">
              🚴 Fast Delivery
            </div>
          </div>
        </div>
      </section>

      <Categories />
      <section className="restaurants">
  <div className="restaurants-header">
    <div>
      <span className="section-label">LOCAL FAVOURITES</span>
      <h2>Popular Restaurants</h2>
      <p>Discover popular food spots around Araihazar.</p>
    </div>

    <button
  className="view-all"
  onClick={() => {
    window.location.href = '/restaurant'
  }}
>
  View All →
</button>
  </div>

  <div className="restaurant-grid">
    {restaurants.map((restaurant) => (
      <RestaurantCard
        key={restaurant.id}
        restaurant={restaurant}
      />
    ))}
  </div>
</section>
<Offers />
<Footer />
    </>
  )
}

export default App