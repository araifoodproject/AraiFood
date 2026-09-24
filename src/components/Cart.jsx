// ============================================================
// src/components/Cart.jsx
// FULLY REAL-TIME — delivery fee comes from settings when missing.
// Reads: settings/platform (via useSettings)
// ============================================================

import { createPortal } from 'react-dom'
import useSettings from '../hooks/useSettings'

function Cart({ items, onClose, onIncrease, onDecrease }) {
  const { settings } = useSettings()

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const goToCheckout = () => {
    window.location.href = '/checkout'
  }

  // Restaurant from first item
  const restaurant = items.length > 0 ? items[0] : null

  // Resolved delivery fee — item's own fee wins, else settings default
  const resolvedDeliveryFee =
    restaurant?.deliveryFee != null
      ? restaurant.deliveryFee
      : settings.defaultDeliveryFee

  const S = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 99999,
      display: 'flex',
      justifyContent: 'flex-end',
      margin: 0,
      padding: 0,
    },
    panel: {
      width: '100%',
      maxWidth: '420px',
      height: '100vh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-5px 0 25px rgba(0,0,0,0.15)',
      margin: 0,
      padding: 0,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e2e8f0',
      background: '#ffffff',
      flexShrink: 0,
    },
    label: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#13a89e',
      letterSpacing: '1px',
      display: 'block',
      marginBottom: '4px',
    },
    headerTitle: {
      fontSize: '22px',
      color: '#1a202c',
      margin: 0,
      fontWeight: 800,
    },
    closeBtn: {
      background: '#f8fafc',
      border: 'none',
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#1a202c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    restaurantBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      background: '#e6f7f6',
      borderBottom: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    logoBox: {
      width: '45px',
      height: '45px',
      minWidth: '45px',
      maxWidth: '45px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      flexShrink: 0,
    },
    logoImg: {
      width: '45px',
      height: '45px',
      objectFit: 'cover',
      display: 'block',
    },
    restName: {
      fontSize: '15px',
      color: '#1a202c',
      marginBottom: '3px',
      fontWeight: 800,
      display: 'block',
    },
    restSub: {
      fontSize: '12px',
      color: '#13a89e',
      fontWeight: 600,
      display: 'block',
    },
    itemsArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 20px',
    },
    itemRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 0',
      borderBottom: '1px solid #e2e8f0',
      width: '100%',
    },
    foodImgBox: {
      width: '65px',
      height: '65px',
      minWidth: '65px',
      maxWidth: '65px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#e6f7f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      flexShrink: 0,
    },
    foodImg: {
      width: '65px',
      height: '65px',
      objectFit: 'cover',
      display: 'block',
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      overflow: 'hidden',
    },
    foodName: {
      fontSize: '14px',
      fontWeight: 800,
      color: '#1a202c',
      lineHeight: 1.3,
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: '100%',
      display: 'block',
      minHeight: '18px',
    },
    eachPrice: {
      fontSize: '11px',
      color: '#4a5568',
      margin: 0,
      padding: 0,
      fontWeight: 600,
      display: 'block',
      minHeight: '14px',
    },
    qtyBox: {
      display: 'flex',
      alignItems: 'center',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '30px',
      width: 'fit-content',
      marginTop: '2px',
      overflow: 'hidden',
      height: '28px',
    },
    qtyBtn: {
      background: 'transparent',
      border: 'none',
      width: '28px',
      height: '28px',
      fontSize: '15px',
      fontWeight: 800,
      color: '#13a89e',
      cursor: 'pointer',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1,
    },
    qtyNum: {
      padding: '0 10px',
      fontSize: '13px',
      fontWeight: 800,
      color: '#1a202c',
      minWidth: '24px',
      textAlign: 'center',
      display: 'block',
      lineHeight: '28px',
    },
    itemTotal: {
      fontSize: '15px',
      color: '#13a89e',
      fontWeight: 800,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      minWidth: '70px',
      textAlign: 'right',
    },
    totalBar: {
      padding: '18px 20px',
      borderTop: '2px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
      background: '#ffffff',
    },
    totalLabel: {
      fontSize: '15px',
      fontWeight: 600,
      color: '#4a5568',
    },
    totalValue: {
      fontSize: '22px',
      color: '#1a202c',
      fontWeight: 900,
    },
    checkoutBtn: {
      background: 'linear-gradient(135deg, #13a89e, #0e7f78)',
      color: '#ffffff',
      border: 'none',
      margin: '0 20px 20px',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: 800,
      cursor: 'pointer',
      boxShadow: '0 6px 18px rgba(19,168,158,0.35)',
      flexShrink: 0,
    },
    emptyBox: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
  }

  const cartContent = (
    <div style={S.overlay}>
      <div style={S.panel}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <span style={S.label}>YOUR ORDER</span>
            <h2 style={S.headerTitle}>Your Cart</h2>
          </div>
          <button style={S.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛒</div>
            <h3
              style={{
                fontSize: '18px',
                color: '#1a202c',
                marginBottom: '8px',
              }}
            >
              Your cart is empty
            </h3>
            <p style={{ color: '#4a5568' }}>
              Add some delicious food to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Restaurant Bar */}
            {restaurant?.restaurantName && (
              <div style={S.restaurantBar}>
                <div style={S.logoBox}>
                  {restaurant.restaurantLogo ? (
                    <img
                      src={restaurant.restaurantLogo}
                      alt="logo"
                      style={S.logoImg}
                    />
                  ) : (
                    <span>🏪</span>
                  )}
                </div>
                <div>
                  <span style={S.restName}>{restaurant.restaurantName}</span>
                  <span style={S.restSub}>
                    Delivery:{' '}
                    {resolvedDeliveryFee === 0
                      ? 'FREE'
                      : `৳${resolvedDeliveryFee}`}
                    {restaurant.deliveryTime &&
                      ` · ${restaurant.deliveryTime}`}
                  </span>
                </div>
              </div>
            )}

            {/* Items */}
            <div style={S.itemsArea}>
              {items.map((item) => (
                <div key={item.id} style={S.itemRow}>
                  <div style={S.foodImgBox}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={S.foodImg}
                      />
                    ) : (
                      <span>{item.emoji || '🍽️'}</span>
                    )}
                  </div>

                  <div style={S.infoCol}>
                    <span style={S.foodName}>{item.name}</span>
                    <span style={S.eachPrice}>৳{item.price} each</span>
                    <div style={S.qtyBox}>
                      <button
                        style={S.qtyBtn}
                        onClick={() => onDecrease(item.id)}
                      >
                        −
                      </button>
                      <span style={S.qtyNum}>{item.quantity}</span>
                      <button
                        style={S.qtyBtn}
                        onClick={() => onIncrease(item.id)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={S.itemTotal}>
                    ৳{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Bar */}
            <div style={S.totalBar}>
              <span style={S.totalLabel}>Total</span>
              <strong style={S.totalValue}>৳{total}</strong>
            </div>

            <button style={S.checkoutBtn} onClick={goToCheckout}>
              Proceed to Checkout →
            </button>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(cartContent, document.body)
}

export default Cart