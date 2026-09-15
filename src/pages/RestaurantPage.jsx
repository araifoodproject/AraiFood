import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Cart from '../components/Cart'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'

function RestaurantPage() {
  const params = new URLSearchParams(window.location.search)
  const restaurantId = params.get('id') || ''

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuSearch, setMenuSearch] = useState('')

  const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]')
  const [cartItems, setCartItems] = useState(savedCart)
  const [cartOpen, setCartOpen] = useState(false)

  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingFood, setPendingFood] = useState(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) { setLoading(false); return }
      try {
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId))
        if (restaurantDoc.exists()) {
          setRestaurant({ firebaseId: restaurantDoc.id, ...restaurantDoc.data() })
        } else {
          toast.error('Restaurant not found!')
        }
      } catch (error) { console.error(error) }
      setLoading(false)
    }
    fetchRestaurant()
  }, [restaurantId])

  useEffect(() => {
    if (!restaurantId) return
    const menuQuery = query(collection(db, 'foods'), where('restaurantId', '==', restaurantId))
    const unsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const menuList = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
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
      ? cartItems.map((item) => item.id === food.firebaseId ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cartItems, {
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
        }]

    saveCart(updatedItems)
    toast.success(`${food.name} added to cart!`, {
      position: "top-right",
      autoClose: 2000,
    })
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
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0)
    saveCart(updatedItems)
  }

  const filteredMenu = menuItems.filter((item) =>
    item.name?.toLowerCase().includes(menuSearch.toLowerCase())
  )
  const availableItems = filteredMenu.filter(item => item.available !== false)

  if (loading) return <div className="restaurant-page"><p style={{ padding: 40, textAlign: 'center' }}>Loading...</p></div>
  if (!restaurant) return <div className="restaurant-page"><div className="restaurant-page-header"><button onClick={() => window.history.back()}>← Back</button><div><h1>Restaurant Not Found</h1></div></div></div>

  return (
    <div className="restaurant-page">
      {/* Restaurant Header */}
      <div className="restaurant-page-header">
        <button className="restaurant-back-btn" onClick={() => window.history.back()}>← Back</button>

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
            <p>🍽️ {restaurant.cuisine}</p>
            <span>⭐ {restaurant.rating || '4.5'} • 🚴 30-40 min</span>
          </div>
        </div>

        <div className="restaurant-status-badge">
          <span className={`restaurant-status-dot ${restaurant.restaurantStatus}`}></span>
          {restaurant.restaurantStatus === 'online' ? 'Open' :
           restaurant.restaurantStatus === 'busy' ? 'Busy' : 'Closed'}
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-heading">
          <span className="section-label">MENU</span>
          <h2>Popular Items</h2>
          <p>Choose something delicious from {restaurant.restaurantName}.</p>
        </div>

        <div className="menu-search-bar">
          <span>🔎</span>
          <input type="text" placeholder="Search food items..." value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
          {menuSearch && <button type="button" onClick={() => setMenuSearch('')} className="clear-search">×</button>}
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
                  {item.image ? <img src={item.image} alt={item.name} /> : <span style={{ fontSize: '40px' }}>{item.emoji || '🍽️'}</span>}
                </div>
                <div className="food-info">
                  <h3>{item.name}</h3>
                  <p>{item.description || 'Delicious food item'}</p>
                  <div className="food-bottom">
                    <div className="food-price-box">
                      {item.discountPrice ? <><strong>৳{item.discountPrice}</strong><del>৳{item.price}</del></> : <strong>৳{item.price}</strong>}
                    </div>
                    <button onClick={() => checkCartConflict(item)}>+ Add</button>
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

      {/* Cart Conflict Modal */}
      {showConflictModal && (
        <div className="outside-area-modal">
          <div className="outside-area-modal-content">
            <div className="outside-area-icon">⚠️</div>
            <h2>Clear Your Cart?</h2>
            <p>
              Your cart has items from <strong>{cartItems[0]?.restaurantName}</strong>.
              <br /><br />
              Do you want to clear the cart and add items from <strong>{restaurant.restaurantName}</strong>?
            </p>
            <div className="conflict-modal-buttons">
              <button className="cancel-btn" onClick={() => { setShowConflictModal(false); setPendingFood(null) }}>
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