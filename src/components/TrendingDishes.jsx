import { useState, useEffect } from 'react'
import { Flame, Star, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { db } from '../firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

function TrendingDishes() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const [conflictModal, setConflictModal] = useState(null)

  useEffect(() => {
    const loadDishes = async () => {
      try {
        const foodsSnap = await getDocs(collection(db, 'foods'))
        const foodsList = foodsSnap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))

        // Take a different slice (offset by 4) or shuffle
        const shuffled = [...foodsList].sort(() => Math.random() - 0.5)

        const enriched = await Promise.all(
          shuffled.slice(0, 4).map(async (food) => {
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
              return { ...food, restaurantData: restData }
            } catch {
              return { ...food, restaurantData: null }
            }
          })
        )

        setDishes(enriched.filter((f) => f.available !== false))
      } catch (err) {
        console.error('Failed to load trending dishes:', err)
      }
      setLoading(false)
    }
    loadDishes()
  }, [])

  const addToCartDirect = (food) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
    const restData = food.restaurantData || {}

    const existingIndex = cartItems.findIndex((c) => c.id === food.firebaseId)

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
            <span className="glass-section-label">TRENDING NOW</span>
            <h2 className="glass-section-title">Trending Dishes</h2>
            <p className="glass-section-sub">What everyone is ordering right now</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading...
        </p>
      </section>
    )
  }

  if (dishes.length === 0) {
    return (
      <section className="glass-section">
        <div className="glass-section-header">
          <div>
            <span className="glass-section-label">TRENDING NOW</span>
            <h2 className="glass-section-title">Trending Dishes</h2>
            <p className="glass-section-sub">What everyone is ordering right now</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔥</p>
          <p>No trending dishes yet. Check back soon!</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="glass-section">
        <div className="glass-section-header">
          <div>
            <span className="glass-section-label">TRENDING NOW</span>
            <h2 className="glass-section-title">Trending Dishes</h2>
            <p className="glass-section-sub">What everyone is ordering right now</p>
          </div>
          <Link to="/restaurants" className="glass-view-all">
            View All <span>→</span>
          </Link>
        </div>

        <div className="glass-dish-grid">
          {dishes.map((dish) => {
            const restData = dish.restaurantData || {}
            return (
              <div className="glass-dish-card" key={dish.firebaseId}>
                <div className="glass-dish-image">
                  {dish.image ? (
                    <img
                      src={dish.image}
                      alt={dish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{dish.emoji || '🍽️'}</span>
                  )}
                  <div className="glass-dish-hot">
                    <Flame size={12} strokeWidth={2.5} fill="#FFFFFF" />
                    Hot
                  </div>
                </div>

                <div className="glass-dish-info">
                  <h3>{dish.name}</h3>
                  <p>{restData.restaurantName || dish.restaurantName || 'Restaurant'}</p>

                  <div className="glass-dish-bottom">
                    <div className="glass-dish-price">
                      <strong>৳{dish.discountPrice || dish.price}</strong>
                      {dish.discountPrice && (
                        <del style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          ৳{dish.price}
                        </del>
                      )}
                    </div>

                    <button
                      className="glass-dish-add"
                      title="Add to cart"
                      onClick={() => handleAddClick(dish)}
                      disabled={addingId === dish.firebaseId}
                    >
                      {addingId === dish.firebaseId ? (
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

export default TrendingDishes