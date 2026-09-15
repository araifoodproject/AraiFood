import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import {
  doc, getDoc, updateDoc, collection, onSnapshot,
  addDoc, deleteDoc, query, where
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { sendNotification } from '../utils/sendNotification'

function RestaurantPanel() {
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('dashboard')

  const [showAddFood, setShowAddFood] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [foodCategory, setFoodCategory] = useState('Biryani')
  const [foodPrice, setFoodPrice] = useState('')
  const [foodDiscountPrice, setFoodDiscountPrice] = useState('')
  const [foodDescription, setFoodDescription] = useState('')
  const [foodImage, setFoodImage] = useState('')
  const [foodAvailable, setFoodAvailable] = useState(true)

  const [openingTime, setOpeningTime] = useState('10:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [minimumOrder, setMinimumOrder] = useState('100')
  const [deliveryFee, setDeliveryFee] = useState('30')

  // ============ FIXED AUTH LOADING ============
  useEffect(() => {
    let isMounted = true
    let hasChecked = false

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return
      if (hasChecked) return
      hasChecked = true

      if (!currentUser) {
        setTimeout(() => {
          if (isMounted && !auth.currentUser) {
            window.location.href = '/restaurant-login'
          }
        }, 1500)
        return
      }

      setUser(currentUser)

      try {
        const restaurantDoc = await getDoc(doc(db, 'restaurants', currentUser.uid))
        if (!isMounted) return

        if (!restaurantDoc.exists()) {
          setError('No restaurant account found with this email.')
          setLoading(false)
          return
        }

        const data = restaurantDoc.data()

        if (data.status === 'pending') {
          setError('⏳ Your account is pending Admin approval. Please wait.')
          setLoading(false)
          return
        }

        if (data.status === 'rejected') {
          setError('❌ Your restaurant application was rejected. Please contact support.')
          setLoading(false)
          return
        }

        setRestaurant({ firebaseId: restaurantDoc.id, ...data })
        setOpeningTime(data.openingTime || '10:00')
        setClosingTime(data.closingTime || '22:00')
        setMinimumOrder(data.minimumOrder || '100')
        setDeliveryFee(data.deliveryFee || '30')
        setError('')
      } catch (err) {
        console.error('Error loading restaurant:', err)
        if (isMounted) setError('Failed to load restaurant data. Please try again.')
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Live Orders
  useEffect(() => {
    if (!restaurant) return
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const allOrders = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      const restaurantOrders = allOrders.filter((order) => order.restaurantId === restaurant.firebaseId)
      setOrders(restaurantOrders)
    })
    return () => unsubscribe()
  }, [restaurant])

  // Live Menu
  useEffect(() => {
    if (!restaurant) return
    const menuQuery = query(collection(db, 'foods'), where('restaurantId', '==', restaurant.firebaseId))
    const unsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const menuList = snapshot.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      setMenuItems(menuList)
    })
    return () => unsubscribe()
  }, [restaurant])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image is too large. Please select under 5MB.'); return }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 1000
        let width = img.width
        let height = img.height
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          } else {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.9)
        setFoodImage(compressed)
        toast.success(`📷 Image uploaded! (${width}x${height})`)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const updateOrderStatus = async (firebaseId, newStatus, order) => {
    try {
      await updateDoc(doc(db, 'orders', firebaseId), { status: newStatus })
      if (order?.userId) {
        let title = '', body = ''
        if (newStatus === 'preparing') { title = '👨‍🍳 Restaurant Accepted Your Order!'; body = `Your order ${order.orderId} is being prepared.` }
        else if (newStatus === 'delivering') { title = '🛵 Order Ready for Pickup!'; body = `Your order ${order.orderId} is ready for pickup.` }
        else if (newStatus === 'delivered') { title = '✅ Order Delivered!'; body = `Order ${order.orderId} has been delivered. Enjoy!` }
        await sendNotification(order.userId, title, body, 'order', { orderId: order.orderId })
      }
      toast.success(`Order marked as ${newStatus}!`)
    } catch (error) { console.error(error) }
  }

  const changeRestaurantStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.firebaseId), { restaurantStatus: newStatus })
      setRestaurant({ ...restaurant, restaurantStatus: newStatus })
      toast.success(`Restaurant is now ${newStatus}!`)
    } catch (error) { console.error(error) }
  }

  const addFood = async () => {
    if (!foodName.trim()) { toast.error('Please enter food name!'); return }
    if (!foodPrice || parseFloat(foodPrice) <= 0) { toast.error('Please enter valid price!'); return }
    try {
      await addDoc(collection(db, 'foods'), {
        restaurantId: restaurant.firebaseId,
        restaurantName: restaurant.restaurantName,
        name: foodName.trim(),
        category: foodCategory,
        price: parseFloat(foodPrice),
        discountPrice: foodDiscountPrice ? parseFloat(foodDiscountPrice) : null,
        description: foodDescription.trim(),
        image: foodImage,
        available: foodAvailable,
        createdAt: new Date()
      })
      toast.success('✅ Food added successfully!')
      setFoodName(''); setFoodPrice(''); setFoodDiscountPrice(''); setFoodDescription(''); setFoodImage(''); setShowAddFood(false)
    } catch (error) { console.error(error); toast.error('Failed to add food!') }
  }

  const deleteFood = async (foodId) => {
    if (!window.confirm('Delete this food?')) return
    try {
      await deleteDoc(doc(db, 'foods', foodId))
      toast.success('🗑️ Food deleted!')
    } catch (error) { console.error(error) }
  }

  const toggleFoodAvailability = async (foodId, current) => {
    try { await updateDoc(doc(db, 'foods', foodId), { available: !current }) } catch (error) { console.error(error) }
  }

  const updateSettings = async () => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.firebaseId), {
        openingTime, closingTime,
        minimumOrder: parseFloat(minimumOrder),
        deliveryFee: parseFloat(deliveryFee)
      })
      toast.success('✅ Settings updated!')
    } catch (error) { console.error(error) }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/restaurant-login'
    } catch (error) { console.error(error) }
  }

  const today = new Date().toLocaleDateString()
  const todayOrders = orders.filter((o) => o.createdAt?.toDate?.()?.toLocaleDateString() === today)
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const newOrders = orders.filter(o => o.status === 'pending' || !o.status).length
  const preparingOrders = orders.filter(o => o.status === 'preparing').length
  const readyOrders = orders.filter(o => o.status === 'delivering').length
  const completedOrders = orders.filter(o => o.status === 'delivered').length

  if (loading) {
    return (
      <div className="restaurant-panel">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="restaurant-panel">
        <div className="panel-error-box">
          <div className="panel-error-icon">⚠️</div>
          <h2>Access Restricted</h2>
          <p>{error}</p>
          <div className="panel-error-actions">
            <button className="account-home-btn" onClick={() => { window.location.href = '/' }}>← Go Home</button>
            <button className="restaurant-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="restaurant-panel">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurant-panel">
      {/* Header */}
      <div className="restaurant-panel-header">
        <div className="restaurant-panel-left">
          <div className="restaurant-panel-logo">🏪</div>
          <div>
            <h1>{restaurant.restaurantName}</h1>
            <p>
              <span className={`restaurant-status-dot ${restaurant.restaurantStatus}`}></span>
              {restaurant.restaurantStatus === 'online' ? 'Online' : restaurant.restaurantStatus === 'busy' ? 'Busy' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="restaurant-panel-right">
          <button className={`status-toggle-btn ${restaurant.restaurantStatus === 'online' ? 'online' : ''}`} onClick={() => changeRestaurantStatus(restaurant.restaurantStatus === 'online' ? 'offline' : 'online')}>
            {restaurant.restaurantStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
          </button>
          <Link to="/" className="restaurant-home-btn">← Home</Link>
          <button className="restaurant-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="admin-view-toggle">
        <button className={view === 'dashboard' ? 'view-btn active' : 'view-btn'} onClick={() => setView('dashboard')}>📊 Dashboard</button>
        <button className={view === 'orders' ? 'view-btn active' : 'view-btn'} onClick={() => setView('orders')}>
          📦 Orders ({orders.length}){newOrders > 0 && <span className="pending-badge">{newOrders}</span>}
        </button>
        <button className={view === 'menu' ? 'view-btn active' : 'view-btn'} onClick={() => setView('menu')}>🍔 Menu ({menuItems.length})</button>
        <button className={view === 'settings' ? 'view-btn active' : 'view-btn'} onClick={() => setView('settings')}>⚙️ Settings</button>
      </div>

      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <div className="admin-dashboard">
          <div className="admin-stats">
            <div className="admin-stat"><strong>৳{todaySales.toFixed(2)}</strong><span>Today's Sales</span></div>
            <div className="admin-stat"><strong>৳{totalSales.toFixed(2)}</strong><span>Total Sales</span></div>
            <div className="admin-stat"><strong>{todayOrders.length}</strong><span>Today's Orders</span></div>
            <div className="admin-stat"><strong>{orders.length}</strong><span>Total Orders</span></div>
          </div>
          <div className="admin-stats secondary">
            <div className="admin-stat"><strong>{newOrders}</strong><span>🆕 New</span></div>
            <div className="admin-stat"><strong>{preparingOrders}</strong><span>👨‍🍳 Preparing</span></div>
            <div className="admin-stat"><strong>{readyOrders}</strong><span>🛵 Ready</span></div>
            <div className="admin-stat"><strong>{completedOrders}</strong><span>✅ Completed</span></div>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {view === 'orders' && (
        <div className="admin-orders">
          <h2>Live Orders</h2>
          {orders.length === 0 ? <p className="no-orders">No orders yet.</p> : (
            <div className="admin-order-list">
              {orders.map((order) => (
                <div className="admin-order-card" key={order.firebaseId}>
                  <div className="admin-order-header"><strong>Order ID: {order.orderId}</strong><span>{order.userEmail}</span></div>
                  <div className="admin-order-items">
                    {order.items?.map((item, idx) => (<div key={idx}><span>{item.emoji} {item.name}</span><span>× {item.quantity}</span></div>))}
                  </div>
                  <div className="admin-order-info"><p>📍 {order.address}</p><p>📞 {order.phone}</p></div>
                  <div className="admin-order-total"><span>Total:</span><strong>৳{order.total}</strong></div>
                  <div className="admin-order-actions">
                    <button className={order.status === 'preparing' ? 'status-btn active' : 'status-btn'} onClick={() => updateOrderStatus(order.firebaseId, 'preparing', order)}>Preparing</button>
                    <button className={order.status === 'delivering' ? 'status-btn active' : 'status-btn'} onClick={() => updateOrderStatus(order.firebaseId, 'delivering', order)}>Ready</button>
                    <button className={order.status === 'delivered' ? 'status-btn active' : 'status-btn'} onClick={() => updateOrderStatus(order.firebaseId, 'delivered', order)}>Delivered</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MENU */}
      {view === 'menu' && (
        <div className="admin-orders">
          <div className="menu-header-row">
            <h2>Your Menu ({menuItems.length})</h2>
            <button className="add-menu-item-btn" onClick={() => setShowAddFood(!showAddFood)}>{showAddFood ? '✕ Cancel' : '+ Add New Food'}</button>
          </div>
          {showAddFood && (
            <div className="add-food-form">
              <div className="form-row">
                <div className="form-group"><label>Food Name *</label><input type="text" placeholder="e.g., Chicken Biryani" value={foodName} onChange={(e) => setFoodName(e.target.value)} /></div>
                <div className="form-group"><label>Category</label>
                  <select value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)}>
                    <option>Biryani</option><option>Burger</option><option>Pizza</option><option>Chicken</option>
                    <option>Drinks</option><option>Dessert</option><option>Rice & Curry</option><option>Snacks</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price (৳) *</label><input type="number" placeholder="180" value={foodPrice} onChange={(e) => setFoodPrice(e.target.value)} /></div>
                <div className="form-group"><label>Discount Price (Optional)</label><input type="number" placeholder="150" value={foodDiscountPrice} onChange={(e) => setFoodDiscountPrice(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label>Food Image (Full Picture)</label>
                <div className="image-upload-area">
                  {foodImage ? (
                    <div className="image-preview-wrapper">
                      <img src={foodImage} alt="Food Preview" className="food-image-preview" />
                      <button className="remove-image-btn" onClick={() => setFoodImage('')}>✕</button>
                    </div>
                  ) : (
                    <label className="image-upload-btn">
                      <span>📷 Upload Image (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>
              <div className="form-group"><label>Description</label><textarea placeholder="Short description" rows="2" value={foodDescription} onChange={(e) => setFoodDescription(e.target.value)}></textarea></div>
              <button className="add-food-btn" onClick={addFood}>+ Add Food</button>
            </div>
          )}
          {menuItems.length === 0 ? <p className="no-orders">No food items yet.</p> : (
            <div className="menu-grid">
              {menuItems.map((item) => (
                <div className={`menu-item-card ${!item.available ? 'unavailable' : ''}`} key={item.firebaseId}>
                  <div className="menu-item-image">{item.image ? <img src={item.image} alt={item.name} /> : <div className="no-food-image">🍽️</div>}</div>
                  <div className="menu-item-info">
                    <h4>{item.name}</h4><p>{item.category}</p>
                    <div className="menu-item-price">
                      {item.discountPrice ? <><strong>৳{item.discountPrice}</strong><del>৳{item.price}</del></> : <strong>৳{item.price}</strong>}
                    </div>
                  </div>
                  <div className="menu-item-actions">
                    <button className={item.available ? 'avail-btn active' : 'avail-btn'} onClick={() => toggleFoodAvailability(item.firebaseId, item.available)}>{item.available ? '✓ Available' : '✗ Out'}</button>
                    <button className="delete-btn" onClick={() => deleteFood(item.firebaseId)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {view === 'settings' && (
        <div className="admin-orders">
          <h2>Restaurant Settings</h2>
          <div className="settings-card">
            <div className="signup-row">
              <div className="form-group"><label>Opening Time</label><input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} /></div>
              <div className="form-group"><label>Closing Time</label><input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} /></div>
            </div>
            <div className="signup-row">
              <div className="form-group"><label>Minimum Order (৳)</label><input type="number" value={minimumOrder} onChange={(e) => setMinimumOrder(e.target.value)} /></div>
              <div className="form-group"><label>Delivery Fee (৳)</label><input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></div>
            </div>
            <button className="add-food-btn" onClick={updateSettings}>💾 Save Settings</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantPanel