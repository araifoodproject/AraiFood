import { useState, useEffect } from 'react'
import { Sparkles, Star, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { db, auth } from '../firebase'
import { collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore'

function ItemsYouLove() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const [conflictModal, setConflictModal] = useState(null)

  // Load foods from Firestore + their restaurants
  useEffect(() => {
    const loadItems = async () => {
      try {
        // Get first 4 foods from Firestore
        const foodsSnap = await getDocs(collection(db, 'foods'))
        const foodsList = foodsSnap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))

        // Enrich with restaurant data
        const enriched = await Promise.all(
          foodsList.slice(0, 4).map(async (food) => {
            try {
              const restRef = await getDocs(
                query(
                  collection(db, 'restaurants'),
                  where('__name__', '==', food.restaurantId)
                )
              )
              let restData = null
              if (!restRef.empty) {
                restData = restRef.docs[0].data()
              }
              return {
                ...food,
                restaurantData: restData,
              }
            } catch {
              return { ...food, restaurantData: null }
            }
          })
        )

        setItems(enriched.filter((f) => f.available !== false))
      } catch (err) {
        console.error('Failed to load items:', err)
      }
      setLoading(false)
    }
    loadItems()
  }, [])

  const addToCartDirect = (food) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    const restData = food.restaurantData || {}

    const existingIndex = cartItems.findIndex(
      (c) => c.id === food.firebaseId
    )

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
          restaurantName: restData.restaurantName || food.restaurantName || 'Restaurant',
          restaurantLogo: restData.logo || '',
          deliveryFee: restData.deliveryFee || 30,
          minimumOrder: restData.minimumOrder || 100,
        },
      ]
    }

    localStorage.setItem('cartItems', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
    toast.success(`${food.name} added to cart!`, { autoClose: 1500 })
  }

  const handleAddClick = (food) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')

    if (cartItems.length === 0) {
      addToCartDirect(food)
      return
    }

    const existingRestaurantId = cartItems[0].restaurantId
    if (existingRestaurantId === food.restaurantId) {
      addToCartDirect(food)
    } else {
      // Show conflict modal
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

  if (loading) {
    return (
      <section className="glass-section">
        <div className="glass-section-header">
          <div>
            <span className="glass-section-label">PICKED FOR YOU</span>
            <h2 className="glass-section-title">Items You'll Love</h2>
            <p className="glass-section-sub">Handpicked based on your taste</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading...
        </p>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="glass-section">
        <div className="glass-section-header">
          <div>
            <span className="glass-section-label">PICKED FOR YOU</span>
            <h2 className="glass-section-title">Items You'll Love</h2>
            <p className="glass-section-sub">Handpicked based on your taste</p>
          </div>
          <Link to="/restaurants" className="glass-view-all">
            Browse <span>→</span>
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>🍽️</p>
          <p>No items available yet. Check back soon!</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="glass-section">
        <div className="glass-section-header">
          <div>
            <span className="glass-section-label">PICKED FOR YOU</span>
            <h2 className="glass-section-title">Items You'll Love</h2>
            <p className="glass-section-sub">Handpicked based on your taste</p>
          </div>
          <Link to="/restaurants" className="glass-view-all">
            View All <span>→</span>
          </Link>
        </div>

        <div className="glass-dish-grid">
          {items.map((item) => {
            const restData = item.restaurantData || {}
            return (
              <div className="glass-dish-card" key={item.firebaseId}>
                <div className="glass-dish-image">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{item.emoji || '🍽️'}</span>
                  )}
                  <div className="glass-dish-hot purple">
                    <Sparkles size={12} strokeWidth={2.5} fill="#FFFFFF" />
                    Love
                  </div>
                </div>

                <div className="glass-dish-info">
                  <h3>{item.name}</h3>
                  <p>{restData.restaurantName || item.restaurantName || 'Restaurant'}</p>

                  <div className="glass-dish-bottom">
                    <div className="glass-dish-price">
                      <strong>৳{item.discountPrice || item.price}</strong>
                      {item.discountPrice && (
                        <del style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          ৳{item.price}
                        </del>
                      )}
                    </div>

                    <button
                      className="glass-dish-add orange"
                      title="Add to cart"
                      onClick={() => handleAddClick(item)}
                      disabled={addingId === item.firebaseId}
                    >
                      {addingId === item.firebaseId ? (
                        <span style={{ fontSize: '10px' }}>⏳</span>
                      ) : (
                        <Plus size={16} strokeWidth={2.8} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Conflict Modal */}
      {conflictModal && (
        <div className="outside-area-modal" onClick={() => setConflictModal(null)}>
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="outside-area-icon">⚠️</div>
            <h2>Clear Your Cart?</h2>
            <p>
              Your cart has items from <strong>{conflictModal.currentRestaurant}</strong>.
              <br />
              <br />
              Do you want to clear the cart and add <strong>{conflictModal.food.name}</strong>?
            </p>
            <div className="conflict-modal-buttons">
              <button className="cancel-btn" onClick={() => setConflictModal(null)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleConflictConfirm}>
                Yes, Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ItemsYouLove