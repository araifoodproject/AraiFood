// ============================================================
// src/pages/CartPage.jsx
// V2 — Premium redesign with better UX
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import { toast } from 'react-toastify'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Shield,
  Truck,
  Clock,
  Tag,
  X,
} from 'lucide-react'

function CartPage() {
  const [cartItems, setCartItems] = useState([])
  const [pharmacyCartCount, setPharmacyCartCount] = useState(0)
  const navigate = useNavigate()

  // Load cart on mount + listen for updates
  useEffect(() => {
    const loadCart = () => {
      const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
      setCartItems(items)
      const pharmItems = JSON.parse(
        localStorage.getItem('pharmacyCartItems') || '[]'
      )
      setPharmacyCartCount(
        pharmItems.reduce((s, i) => s + (i.quantity || 0), 0)
      )
    }
    loadCart()

    window.addEventListener('cartUpdated', loadCart)
    window.addEventListener('pharmacyCartUpdated', loadCart)
    return () => {
      window.removeEventListener('cartUpdated', loadCart)
      window.removeEventListener('pharmacyCartUpdated', loadCart)
    }
  }, [])

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    setCartItems(items)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const increaseQuantity = (id) => {
    saveCart(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  const decreaseQuantity = (id) => {
    saveCart(
      cartItems
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (id) => {
    saveCart(cartItems.filter((item) => item.id !== id))
    toast.success('Item removed', { autoClose: 1200 })
  }

  const clearCart = () => {
    if (!window.confirm('Clear entire cart?')) return
    saveCart([])
    toast.success('Cart cleared')
  }

  // ============ CALCULATIONS ============
  const restaurant =
    cartItems.length > 0
      ? {
          restaurantId: cartItems[0].restaurantId,
          restaurantName: cartItems[0].restaurantName,
          restaurantLogo: cartItems[0].restaurantLogo || '',
          deliveryFee: cartItems[0].deliveryFee ?? 30,
          minimumOrder: cartItems[0].minimumOrder || 100,
          deliveryTime: cartItems[0].deliveryTime || '30-40 min',
        }
      : null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const deliveryFee = restaurant?.deliveryFee || 0
  const freeDeliveryThreshold = 500
  const freeDelivery = subtotal >= freeDeliveryThreshold
  const finalDeliveryFee = freeDelivery ? 0 : deliveryFee
  const total = subtotal + finalDeliveryFee

  const minimumOrderReached = subtotal >= (restaurant?.minimumOrder || 0)
  const amountNeeded = minimumOrderReached
    ? 0
    : restaurant?.minimumOrder - subtotal

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0)

  const freeDeliveryRemaining = freeDelivery
    ? 0
    : freeDeliveryThreshold - subtotal

  return (
    <div className="cart-page">
      <div className="cart-page-container">
        <PageBackButton label="Back" fallback="/restaurants" />

        {/* Header */}
        <div className="cart-page-header">
          <span className="glass-section-label">YOUR ORDER</span>
          <h1>
            Your <span>Cart</span>
          </h1>
          <p>Review your items before checking out.</p>
        </div>

        {/* Pharmacy Cart Hint */}
        {pharmacyCartCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '16px',
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.04))',
              border: '1px solid rgba(59,130,246,0.2)',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '24px' }}>💊</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                You also have {pharmacyCartCount} medicine
                {pharmacyCartCount !== 1 ? 's' : ''} in pharmacy cart
              </strong>
              <span
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                Pharmacy orders have separate checkout
              </span>
            </div>
            <Link
              to="/pharmacy-checkout"
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                flexShrink: 0,
              }}
            >
              Pharmacy Cart →
            </Link>
          </div>
        )}

        {cartItems.length === 0 ? (
          /* ============ EMPTY STATE ============ */
          <div className="cart-page-empty">
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(16,185,129,0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                marginBottom: '20px',
              }}
            >
              🛒
            </div>
            <h2
              style={{
                fontSize: '24px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 800,
              }}
            >
              Your cart is empty
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                fontSize: '14.5px',
              }}
            >
              Add some delicious food to get started.
            </p>
            <Link to="/restaurants" className="cart-page-browse-btn">
              🍽️ Browse Restaurants
            </Link>
          </div>
        ) : (
          /* ============ CART WITH ITEMS ============ */
          <div className="cart-page-layout">
            <div className="cart-page-items-wrapper">
              {/* Restaurant Bar */}
              <div className="cart-page-restaurant">
                <div className="cart-page-restaurant-logo">
                  {restaurant.restaurantLogo ? (
                    <img
                      src={restaurant.restaurantLogo}
                      alt={restaurant.restaurantName}
                    />
                  ) : (
                    <span>🏪</span>
                  )}
                </div>
                <div className="cart-page-restaurant-info">
                  <h3>{restaurant.restaurantName}</h3>
                  <small>
                    🚚 ৳{restaurant.deliveryFee} · 🕐 {restaurant.deliveryTime}
                  </small>
                </div>
                <span className="cart-page-item-count">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Free Delivery Progress */}
              {!freeDelivery && freeDeliveryRemaining > 0 && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background:
                      'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))',
                    border: '1px solid rgba(245,158,11,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>🚚</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: '#D97706',
                        marginBottom: '6px',
                      }}
                    >
                      Add ৳{freeDeliveryRemaining} more for FREE delivery!
                    </strong>
                    <div
                      style={{
                        height: '6px',
                        background: 'rgba(245,158,11,0.2)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(
                            100,
                            (subtotal / freeDeliveryThreshold) * 100
                          )}%`,
                          background:
                            'linear-gradient(90deg, #F59E0B, #D97706)',
                          borderRadius: '999px',
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {freeDelivery && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background:
                      'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
                    border: '1px solid rgba(5,150,105,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>✅</div>
                  <strong
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#059669',
                    }}
                  >
                    You've unlocked FREE delivery!
                  </strong>
                </div>
              )}

              {/* Items List */}
              <div className="cart-page-items-list">
                {cartItems.map((item) => (
                  <div className="cart-page-item" key={item.id}>
                    <div className="cart-page-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>{item.emoji || '🍽️'}</span>
                      )}
                    </div>

                    <div className="cart-page-item-info">
                      <h4>{item.name}</h4>
                      <p className="cart-page-item-price">
                        ৳{item.price} × {item.quantity}
                      </p>
                      <div className="cart-page-qty">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          aria-label="Decrease"
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          aria-label="Increase"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    <div className="cart-page-item-total">
                      ৳{item.price * item.quantity}
                    </div>

                    <button
                      className="cart-page-item-remove"
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Clear Cart */}
              <button
                onClick={clearCart}
                style={{
                  padding: '12px',
                  borderRadius: '999px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#DC2626',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  alignSelf: 'flex-start',
                }}
              >
                <Trash2 size={14} />
                Clear Cart
              </button>
            </div>

            {/* ============ SUMMARY ============ */}
            <div className="cart-page-summary">
              <h3>
                <ShoppingBag size={18} /> Order Summary
              </h3>

              <div className="cart-page-summary-row">
                <span>Subtotal ({totalItems} items)</span>
                <strong>৳{subtotal}</strong>
              </div>

              <div className="cart-page-summary-row">
                <span>Delivery Fee</span>
                <strong
                  style={{
                    color: freeDelivery ? '#059669' : 'inherit',
                  }}
                >
                  {freeDelivery ? 'FREE' : `৳${finalDeliveryFee}`}
                </strong>
              </div>

              <div className="cart-page-summary-divider"></div>

              <div className="cart-page-summary-total">
                <span>Total</span>
                <strong>৳{total}</strong>
              </div>

              {/* Coupon hint */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px dashed rgba(139,92,246,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#7C3AED',
                }}
              >
                <Tag size={14} />
                Apply coupons at checkout
              </div>

              {!minimumOrderReached && (
                <div className="cart-page-min-warning">
                  ⚠️ Minimum order is ৳{restaurant.minimumOrder}. Add ৳
                  {amountNeeded} more.
                </div>
              )}

              {minimumOrderReached ? (
                <Link to="/checkout" className="cart-page-checkout-btn">
                  Proceed to Checkout <ArrowRight size={16} />
                </Link>
              ) : (
                <button className="cart-page-checkout-btn disabled" disabled>
                  Add ৳{amountNeeded} More
                </button>
              )}

              {/* Trust badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: '8px',
                  paddingTop: '14px',
                  borderTop: '1px dashed var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                  }}
                >
                  <Shield
                    size={16}
                    color="#059669"
                    strokeWidth={2.4}
                  />
                  <span>Secure</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                  }}
                >
                  <Truck
                    size={16}
                    color="#059669"
                    strokeWidth={2.4}
                  />
                  <span>Fast</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                  }}
                >
                  <Clock
                    size={16}
                    color="#059669"
                    strokeWidth={2.4}
                  />
                  <span>{restaurant.deliveryTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage