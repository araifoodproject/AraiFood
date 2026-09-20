import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import Cart from '../components/Cart'
import { db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore'
import { Search, X } from 'lucide-react'
import PageBackButton from '../components/PageBackButton'

function RestaurantPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const restaurantId = searchParams.get('id') || ''

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuSearch, setMenuSearch] = useState('')

  const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]')
  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)

  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingFood, setPendingFood] = useState(null)

  // Load Restaurant
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) {
        console.warn('No restaurant ID in URL')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching restaurant:', restaurantId)
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId))

        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data()
          console.log('Restaurant loaded:', data)
          setRestaurant({ firebaseId: restaurantDoc.id, ...data })
        } else {
          console.warn('Restaurant doc not found:', restaurantId)
          toast.error('Restaurant not found!')
        }
      } catch (error) {
        console.error('Restaurant fetch error:', error)
        toast.error('Failed to load restaurant')
      }
      setLoading(false)
    }
    fetchRestaurant()
  }, [restaurantId])

  // Load Menu (real-time)
  useEffect(() => {
    if (!restaurantId) return
    const menuQuery = query(
      collection(db, 'foods'),
      where('restaurantId', '==', restaurantId)
    )
    const unsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const menuList = snapshot.docs.map((d) => ({
        firebaseId: d.id,
        ...d.data(),
      }))
      console.log('Menu items loaded:', menuList.length)
      setMenuItems(menuList)
    })
    return () => unsubscribe()
  }, [restaurantId])

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    setCartItems(items)
    window.dispatchEvent(new Event('cartUpdated'))
    return items
  }

  const checkCartConflict = (food) => {
    if (cartItems.length === 0) {
      addToCartDirect(food)
      return
    }
    const existingRestaurantId = cartItems[0].restaurantId
    if (existingRestaurantId === restaurant.firebaseId) {
      addToCartDirect(food)
    } else {
      setPendingFood(food)
      setShowConflictModal(true)
    }
  }

  const addToCartDirect = (food) => {
    const existingItem = cartItems.find((item) => item.id === food.firebaseId)
    const updatedItems = existingItem
      ? cartItems.map((item) =>
          item.id === food.firebaseId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [
          ...cartItems,
          {
            id: food.firebaseId,
            name: food.name,
            price: food.discountPrice || food.price,
            emoji: food.emoji || '🍽️',
            image: food.image || '',
            quantity: 1,
            restaurantId: restaurant.firebaseId,
            restaurantName: restaurant.restaurantName,
            restaurantLogo: restaurant.logo || '',
            deliveryFee: restaurant.deliveryFee || 30,
            minimumOrder: restaurant.minimumOrder || 100,
          },
        ]

    saveCart(updatedItems)
    toast.success(`${food.name} added to cart!`, { autoClose: 2000 })
  }

  const handleClearAndAdd = () => {
    if (!pendingFood) return
    const newItem = {
      id: pendingFood.firebaseId,
      name: pendingFood.name,
      price: pendingFood.discountPrice || pendingFood.price,
      emoji: pendingFood.emoji || '🍽️',
      image: pendingFood.image || '',
      quantity: 1,
      restaurantId: restaurant.firebaseId,
      restaurantName: restaurant.restaurantName,
      restaurantLogo: restaurant.logo || '',
      deliveryFee: restaurant.deliveryFee || 30,
      minimumOrder: restaurant.minimumOrder || 100,
    }
    saveCart([newItem])
    toast.success(`Cart cleared! ${pendingFood.name} added.`)
    setShowConflictModal(false)
    setPendingFood(null)
  }

  const increaseQuantity = (id) => {
    const updatedItems = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    )
    saveCart(updatedItems)
  }

  const decreaseQuantity = (id) => {
    const updatedItems = cartItems
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0)
    saveCart(updatedItems)
  }

  const filteredMenu = menuItems.filter((item) =>
    item.name?.toLowerCase().includes(menuSearch.toLowerCase())
  )
  const availableItems = filteredMenu.filter(
    (item) => item.available !== false
  )

  if (loading) {
    return (
      <div className="restaurant-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading restaurant...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="restaurant-page">
        <div className="restaurant-empty-state">
          <div className="empty-icon">🏪</div>
          <h2>Restaurant Not Found</h2>
          <p>
            The restaurant you're looking for doesn't exist or has been
            removed.
          </p>
          <button onClick={() => navigate('/restaurants')}>
            Browse Restaurants
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurant-page">
      <PageBackButton label="Back" fallback="/restaurants" />

      {/* Header */}
      <div className="restaurant-page-header">
        <div className="restaurant-header-with-logo">
          <div className="restaurant-header-logo">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.restaurantName} />
            ) : (
              <span>🏪</span>
            )}
          </div>
          <div className="restaurant-header-info">
            <h1>{restaurant.restaurantName}</h1>
            <p>🍽️ {restaurant.cuisine || 'Restaurant'}</p>
            <span>
              ⭐ {restaurant.rating || '4.5'} • 🚴 30-40 min • 📦 Min ৳
              {restaurant.minimumOrder || 100}
            </span>
          </div>
        </div>

        <div className="restaurant-status-badge">
          <span
            className={`restaurant-status-dot ${
              restaurant.restaurantStatus || 'offline'
            }`}
          ></span>
          {restaurant.restaurantStatus === 'online'
            ? 'Open'
            : restaurant.restaurantStatus === 'busy'
            ? 'Busy'
            : 'Closed'}
        </div>
      </div>

      {/* Menu */}
      <div className="menu-section">
        <div className="menu-heading">
          <span className="glass-section-label">MENU</span>
          <h2>Popular Items</h2>
          <p>
            Choose something delicious from {restaurant.restaurantName}.
          </p>
        </div>

        <div className="menu-search-bar">
          <Search size={18} strokeWidth={2.2} />
          <input
            type="text"
            placeholder="Search food items..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
          />
          {menuSearch && (
            <button
              type="button"
              onClick={() => setMenuSearch('')}
              className="clear-search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {availableItems.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🍽️</div>
            <h2>No Food Items Found</h2>
            <p>This restaurant hasn't added any food items yet.</p>
          </div>
        ) : (
          <div className="food-grid">
            {availableItems.map((item) => (
              <div className="food-card" key={item.firebaseId}>
                <div className="food-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <span style={{ fontSize: '40px' }}>
                      {item.emoji || '🍽️'}
                    </span>
                  )}
                </div>
                <div className="food-info">
                  <h3>{item.name}</h3>
                  <p>{item.description || 'Delicious food item'}</p>
                  <div className="food-bottom">
                    <div className="food-price-box">
                      {item.discountPrice ? (
                        <>
                          <strong>৳{item.discountPrice}</strong>
                          <del>৳{item.price}</del>
                        </>
                      ) : (
                        <strong>৳{item.price}</strong>
                      )}
                    </div>
                    <button onClick={() => checkCartConflict(item)}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {cartOpen && (
        <Cart
          items={cartItems}
          onClose={() => setCartOpen(false)}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
        />
      )}

      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="outside-area-modal">
          <div className="outside-area-modal-content">
            <div className="outside-area-icon">⚠️</div>
            <h2>Clear Your Cart?</h2>
            <p>
              Your cart has items from{' '}
              <strong>{cartItems[0]?.restaurantName}</strong>.
              <br />
              <br />
              Do you want to clear the cart and add items from{' '}
              <strong>{restaurant.restaurantName}</strong>?
            </p>
            <div className="conflict-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowConflictModal(false)
                  setPendingFood(null)
                }}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleClearAndAdd}>
                Yes, Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantPage