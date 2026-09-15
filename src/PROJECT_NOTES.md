# 🍔 AraiFood — Project Notes

## 🔧 Tech Stack
- Vite + React 18
- react-router-dom (BrowserRouter)
- Firebase: Auth + Firestore
- lucide-react + react-icons (icons)
- react-toastify (notifications)
- react-easy-crop (image crop)
- @react-google-maps/api (maps)
- recharts (charts)
- Google Maps JS API + Browser Geolocation API

## 📁 Folder Structure
src/
├── components/ (16)
│   ├── AdminSidebar.jsx
│   ├── Cart.jsx
│   ├── Categories.jsx
│   ├── CouponSection.jsx
│   ├── DeliveryStats.jsx
│   ├── Footer.jsx
│   ├── Hero.jsx
│   ├── ImageCropper.jsx
│   ├── ItemsYouLove.jsx
│   ├── LiveChat.jsx
│   ├── MapPicker.jsx
│   ├── Navbar.jsx
│   ├── NotificationPanel.jsx
│   ├── Offers.jsx
│   ├── RestaurantCard.jsx
│   └── TrendingDishes.jsx
├── pages/ (18)
│   ├── AccountPage.jsx
│   ├── AdminPanel.jsx
│   ├── CartPage.jsx
│   ├── CheckoutPage.jsx
│   ├── FavoritesPage.jsx
│   ├── LoginPage.jsx
│   ├── OrderHistoryPage.jsx
│   ├── PharmacyPage.jsx
│   ├── RestaurantLoginPage.jsx
│   ├── RestaurantPage.jsx
│   ├── RestaurantPanel.jsx
│   ├── RestaurantSignupPage.jsx
│   ├── RestaurantsPage.jsx
│   ├── RiderLoginPage.jsx
│   ├── RiderPanel.jsx
│   ├── RiderSignupPage.jsx
│   ├── SignupPage.jsx
│   └── TrackOrderPage.jsx
├── data/
│   ├── restaurants.js (dead code)
│   └── restaurantsData.js (used in HomePage + FavoritesPage)
├── utils/
│   ├── locationTracker.js
│   └── sendNotification.js
├── styles/
│   └── premium.css
├── App.jsx (all routing here)
├── main.jsx
├── index.css
├── firebase.js (⚠️ keys hard-coded - need .env)
├── RestaurantCard.css (dead code)
└── App.css.backup (dead code)

## 🔥 Firestore Collections (6)
1. **users** — Account, wallet, loyalty points
2. **restaurants** — Restaurant info (status: pending/approved/rejected)
3. **riders** — Rider info + GPS location
4. **orders** — All orders (~28 fields)
5. **foods** — Menu items per restaurant
6. **notifications** — User notifications

## 🗺️ Routes (in App.jsx)
- `/` — HomePage (inline in App.jsx)
- `/restaurants` — All restaurants (Firestore live, approved only)
- `/restaurant?id=XXX` — Single restaurant
- `/offers` — OffersPage (inline in App.jsx)
- `/about` — AboutPage (inline in App.jsx)
- `/cart` — CartPage
- `/checkout` — CheckoutPage (no navbar/footer)
- `/login`, `/signup` — Customer auth
- `/restaurant-login`, `/restaurant-signup`
- `/rider-login`, `/rider-signup`
- `/restaurant-panel` — Restaurant dashboard
- `/rider-panel` — Rider dashboard
- `/admin` — Admin dashboard
- `/account`, `/favorites`, `/order-history`
- `/track-order?id=XXX`
- `/pharmacy` — Coming Soon

## 🎨 Design System (premium.css)
- Font: Inter + Plus Jakarta Sans
- Primary: #059669 (green)
- Accent: #F97316 (orange)
- Glassmorphism: backdrop-filter blur 20-30px
- Dark mode: `.dark` class on html
- CSS prefixes: `glass-*`, `admin-*`, `account-*`, `cart-page-*`, `checkout-*`, `premium-*`, `restaurant-*`

## 📍 localStorage Keys
- `theme` — 'dark' | 'light'
- `cartItems` — Cart array
- `userRole` — 'customer' | 'restaurant' | 'rider'
- `favorites` — Restaurant IDs
- `savedAddress` — Delivery address
- `deliveryLocation` — Map coords
- `orderHistory` — Order backups

## 🚨 Known Bugs (High Priority)
1. Admin sub-routes missing — AdminSidebar-এ ১৪টা link কিন্তু App.jsx-এ শুধু `/admin` route (১৩টা 404 দেবে)
2. Popular Restaurants bug — HomePage-এ restaurant.id=1,2,3,4 (Number) কিন্তু Firestore-এ doc ID = Firebase UID → `/restaurant?id=1` → Not Found
3. FavoritesPage bug — একই সমস্যা (restaurantsData.js static)
4. SignupPage role selector — Rider/Restaurant role select করলে Firestore doc create হয় না
5. LoginPage missing — setPersistence + userRole='customer' নেই
6. Logout doesn't clear userRole — localStorage cleanup নেই
7. CheckoutPage-এ Track Order link bug — `/track-order?id={orderId}` (literal string, interpolate হচ্ছে না)
8. Route protection নেই — /admin, /restaurant-panel, /rider-panel open
9. Coupon minimum order — SAVE10/WELCOME20/FREEDEL-এ min check নেই
10. Firebase keys hard-coded — .env-এ move করতে হবে
11. Firestore rules — verify করো (allow read, write: if true; না আছে)

## 🟡 Medium Priority
- Hero search functionality
- Home add-to-cart (ItemsYouLove, TrendingDishes)
- window.location.href → useNavigate (everywhere)
- LiveChat auto-scroll
- MapPicker lat/lng swap cleanup
- Images in Firestore (dataURL) — 1MB limit → Firebase Storage move
- Common utilities (order status mapping duplicate)

## 🟢 Low Priority
- 404 page
- Refactor: ItemsYouLove + TrendingDishes → common DishCard
- Delete dead code: restaurants.js, RestaurantCard.css, App.css.backup
- Card design duplicate: glass-restaurant-card vs all-restaurant-card
- Add StrictMode in main.jsx

## 📌 Next Steps (Priority Order)
1. Firebase API key restrictions (Firebase Console)
2. Firestore Security Rules verify
3. Move Firebase config to .env + update firebase.js
4. Admin sub-pages banao (১৪টা)
5. Popular Restaurants + Favorites bug fix (Firestore live data)
6. Route protection for panels
7. Home add-to-cart functionality
8. Fix SignupPage role selector
9. Fix LoginPage userRole set
10. Cleanup dead code

## 🔐 Environment Variables (.env)
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID
- VITE_GOOGLE_MAPS_API_KEY
- ⚠️ .env NEVER commit to Git!

## 🎯 Project Summary
AraiFood হলো Araihazar (Narayanganj) এর জন্য একটা local food delivery platform। এতে আছে:
- ৩ ধরনের user: Customer, Restaurant, Rider
- Real-time order tracking (Google Maps + GPS)
- Firestore-based backend
- Glassmorphism design
- Dark mode
- Loyalty points + wallet system
- Multi-role dashboard (Admin, Restaurant, Rider)