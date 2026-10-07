// ============================================================
// src/pages/CartPage.jsx
// V4 — Bilingual (BN/EN) + Mobile Responsive
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import { toast } from 'react-toastify'
import { useLanguage } from '../i18n/LanguageContext'
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
} from 'lucide-react'

// ============================================================
// MOBILE RESPONSIVE STYLES (page-scoped)
// ============================================================
const MOBILE_STYLES = `
  /* ---------- Base mobile (<=640px) ---------- */
  @media (max-width: 640px) {
    .cart-page {
      padding-bottom: 100px !important;
    }
    .cart-page-container {
      padding: 12px 12px 40px !important;
    }

    /* Header */
    .cart-page-header h1 {
      font-size: 22px !important;
      line-height: 1.25 !important;
    }
    .cart-page-header p {
      font-size: 13px !important;
    }

    /* Layout stack */
    .cart-page-layout {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    /* Restaurant bar */
    .cart-page-restaurant {
      padding: 12px 14px !important;
      gap: 10px !important;
      border-radius: 14px !important;
    }
    .cart-page-restaurant-logo {
      width: 44px !important;
      height: 44px !important;
      border-radius: 12px !important;
    }
    .cart-page-restaurant-logo img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 12px !important;
    }
    .cart-page-restaurant-info h3 {
      font-size: 14.5px !important;
    }
    .cart-page-restaurant-info small {
      font-size: 11.5px !important;
    }
    .cart-page-item-count {
      font-size: 11px !important;
      padding: 4px 10px !important;
    }

    /* Item card — compact layout */
    .cart-page-item {
      padding: 10px !important;
      gap: 10px !important;
      border-radius: 14px !important;
      grid-template-columns: 60px 1fr auto !important;
      grid-template-areas:
        "image info remove"
        "image total total" !important;
      align-items: start !important;
      position: relative !important;
    }
    .cart-page-item-image {
      grid-area: image !important;
      width: 60px !important;
      height: 60px !important;
      border-radius: 10px !important;
    }
    .cart-page-item-image img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 10px !important;
    }
    .cart-page-item-info {
      grid-area: info !important;
      padding: 0 !important;
      min-width: 0 !important;
    }
    .cart-page-item-info h4 {
      font-size: 13.5px !important;
      line-height: 1.3 !important;
      margin-bottom: 4px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .cart-page-item-price {
      font-size: 12px !important;
      margin-bottom: 6px !important;
    }
    .cart-page-qty {
      gap: 8px !important;
    }
    /* Big tap targets for qty */
    .cart-page-qty button {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
    }
    .cart-page-qty span {
      font-size: 14px !important;
      min-width: 22px !important;
    }
    .cart-page-item-total {
      grid-area: total !important;
      font-size: 14.5px !important;
      font-weight: 900 !important;
      padding: 0 !important;
      text-align: left !important;
      align-self: center !important;
    }
    .cart-page-item-remove {
      grid-area: remove !important;
      width: 32px !important;
      height: 32px !important;
      align-self: start !important;
    }

    /* Summary card */
    .cart-page-summary {
      padding: 16px !important;
      border-radius: 16px !important;
      position: static !important;
    }
    .cart-page-summary h3 {
      font-size: 16px !important;
      margin-bottom: 12px !important;
    }
    .cart-page-summary-row {
      font-size: 13px !important;
      padding: 6px 0 !important;
    }
    .cart-page-summary-total {
      font-size: 16px !important;
      padding: 10px 0 !important;
    }
    .cart-page-checkout-btn {
      min-height: 50px !important;
      font-size: 15px !important;
      padding: 14px 18px !important;
      border-radius: 14px !important;
      width: 100% !important;
    }

    /* Empty state */
    .cart-page-empty {
      padding: 40px 16px !important;
    }
    .cart-page-empty h2 {
      font-size: 20px !important;
    }
    .cart-page-empty p {
      font-size: 13.5px !important;
    }

    /* Clear cart button */
    .cart-page-items-wrapper > button {
      width: 100% !important;
    }

    /* Sticky mobile checkout bar */
    .mobile-cart-checkout-bar {
      display: flex !important;
    }
  }

  /* ---------- Small phones (<=400px) ---------- */
  @media (max-width: 400px) {
    .cart-page-container {
      padding: 10px 10px 40px !important;
    }
    .cart-page-header h1 {
      font-size: 20px !important;
    }
    .cart-page-item {
      grid-template-columns: 52px 1fr auto !important;
    }
    .cart-page-item-image {
      width: 52px !important;
      height: 52px !important;
    }
    .cart-page-item-info h4 {
      font-size: 13px !important;
    }
  }

  /* ---------- Very small (<=360px) ---------- */
  @media (max-width: 360px) {
    .cart-page-container {
      padding: 8px 8px 40px !important;
    }
    .cart-page-header h1 {
      font-size: 18.5px !important;
    }
  }

  /* Mobile sticky checkout bar — hidden on desktop */
  .mobile-cart-checkout-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 900;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--border, #e5e7eb);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
    align-items: center;
    gap: 12px;
  }
  .mobile-cart-checkout-info {
    flex: 1;
    min-width: 0;
  }
  .mobile-cart-checkout-info strong {
    display: block;
    font-family: var(--font-heading, inherit);
    font-size: 16px;
    font-weight: 900;
    color: var(--text-primary, #111);
    line-height: 1.2;
  }
  .mobile-cart-checkout-info span {
    display: block;
    font-size: 11.5px;
    color: var(--text-tertiary, #6b7280);
    font-weight: 600;
    margin-top: 2px;
  }
  .mobile-cart-checkout-bar a,
  .mobile-cart-checkout-bar button {
    min-height: 46px;
    padding: 0 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #059669, #047857);
    color: #fff;
    font-family: var(--font-heading, inherit);
    font-size: 14px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    white-space: nowrap;
  }
  .mobile-cart-checkout-bar button:disabled {
    background: #9ca3af !important;
    box-shadow: none !important;
    cursor: not-allowed !important;
  }
  .mobile-cart-checkout-bar button:active:not(:disabled),
  .mobile-cart-checkout-bar a:active {
    transform: scale(0.97);
  }
`

function CartPage() {
  const { t } = useLanguage()
  const [cartItems, setCartItems] = useState([])
  const [pharmacyCartCount, setPharmacyCartCount] = useState(0)
  const navigate = useNavigate()

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
    toast.success(t('cart.itemRemoved'), { autoClose: 1200 })
  }

  const clearCart = () => {
    if (!window.confirm(t('cart.confirmClear'))) return
    saveCart([])
    toast.success(t('cart.cartCleared'))
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
    <>
      <style>{MOBILE_STYLES}</style>
      <div className="cart-page">
        <div className="cart-page-container">
          <PageBackButton label={t('cart.back')} fallback="/restaurants" />

          {/* Header */}
          <div className="cart-page-header">
            <span className="glass-section-label">{t('cart.badge')}</span>
            <h1>
              {t('cart.heading1')} <span>{t('cart.heading2')}</span>
            </h1>
            <p>{t('cart.subtitle')}</p>
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
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '24px' }}>💊</div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  {pharmacyCartCount === 1
                    ? t('cart.pharmacyHintSingular').replace(
                        '{n}',
                        pharmacyCartCount
                      )
                    : t('cart.pharmacyHintPlural').replace(
                        '{n}',
                        pharmacyCartCount
                      )}
                </strong>
                <span
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  {t('cart.pharmacyHintDesc')}
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
                {t('cart.pharmacyBtn')}
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
                {t('cart.empty')}
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                  fontSize: '14.5px',
                }}
              >
                {t('cart.emptyDesc')}
              </p>
              <Link to="/restaurants" className="cart-page-browse-btn">
                {t('cart.browseRestaurants')}
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
                    {totalItems === 1
                      ? t('cart.itemCountSingular').replace('{n}', totalItems)
                      : t('cart.itemCountPlural').replace('{n}', totalItems)}
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
                        {t('cart.freeDeliveryProgress').replace(
                          '{amount}',
                          freeDeliveryRemaining
                        )}
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
                      {t('cart.freeDeliveryUnlocked')}
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
                        title={t('cart.removeTooltip')}
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
                  {t('cart.clearCart')}
                </button>
              </div>

              {/* ============ SUMMARY ============ */}
              <div className="cart-page-summary">
                <h3>
                  <ShoppingBag size={18} /> {t('cart.summary')}
                </h3>

                <div className="cart-page-summary-row">
                  <span>
                    {t('cart.subtotalWithItems').replace('{n}', totalItems)}
                  </span>
                  <strong>৳{subtotal}</strong>
                </div>

                <div className="cart-page-summary-row">
                  <span>{t('cart.deliveryFee')}</span>
                  <strong
                    style={{
                      color: freeDelivery ? '#059669' : 'inherit',
                    }}
                  >
                    {freeDelivery
                      ? t('cart.free')
                      : `৳${finalDeliveryFee}`}
                  </strong>
                </div>

                <div className="cart-page-summary-divider"></div>

                <div className="cart-page-summary-total">
                  <span>{t('cart.total')}</span>
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
                  {t('cart.applyCoupons')}
                </div>

                {!minimumOrderReached && (
                  <div className="cart-page-min-warning">
                    {t('cart.minOrderWarning')
                      .replace('{min}', restaurant.minimumOrder)
                      .replace('{amount}', amountNeeded)}
                  </div>
                )}

                {minimumOrderReached ? (
                  <Link to="/checkout" className="cart-page-checkout-btn">
                    {t('cart.proceedCheckout')} <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button className="cart-page-checkout-btn disabled" disabled>
                    {t('cart.addMoreAmount').replace('{amount}', amountNeeded)}
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
                    <Shield size={16} color="#059669" strokeWidth={2.4} />
                    <span>{t('cart.secure')}</span>
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
                    <Truck size={16} color="#059669" strokeWidth={2.4} />
                    <span>{t('cart.fast')}</span>
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
                    <Clock size={16} color="#059669" strokeWidth={2.4} />
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MOBILE STICKY CHECKOUT BAR (hidden on desktop) */}
        {/* ============================================================ */}
        {cartItems.length > 0 && (
          <div className="mobile-cart-checkout-bar">
            <div className="mobile-cart-checkout-info">
              <strong>৳{total}</strong>
              <span>
                {totalItems === 1
                  ? t('cart.itemCountSingular').replace('{n}', totalItems)
                  : t('cart.itemCountPlural').replace('{n}', totalItems)}{' '}
                •{' '}
                {freeDelivery
                  ? t('cart.mobileFree')
                  : t('cart.mobileDelivery').replace(
                      '{amount}',
                      finalDeliveryFee
                    )}
              </span>
            </div>
            {minimumOrderReached ? (
              <Link to="/checkout">
                {t('cart.checkoutMobile')} <ArrowRight size={16} />
              </Link>
            ) : (
              <button disabled>
                {t('cart.addMoreAmount').replace('{amount}', amountNeeded)}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default CartPage