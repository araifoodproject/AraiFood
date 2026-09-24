// ============================================================
// src/components/PharmacyCart.jsx
// Pharmacy cart drawer — separate from food cart
// ============================================================

import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

function PharmacyCart({ items, onClose, onIncrease, onDecrease }) {
  const navigate = useNavigate()

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const pharmacy = items.length > 0 ? items[0] : null

  const goToCheckout = () => {
    // Navigate to checkout with pharmacy flag
    window.location.href = '/pharmacy-checkout'
  }

  const S = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 99999,
      display: 'flex',
      justifyContent: 'flex-end',
    },
    panel: {
      width: '100%',
      maxWidth: '420px',
      height: '100vh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-5px 0 25px rgba(0,0,0,0.15)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    label: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#059669',
      letterSpacing: '1px',
      display: 'block',
      marginBottom: '4px',
    },
    title: {
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
    },
    pharmacyBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      background: '#ecfdf5',
      borderBottom: '1px solid #e2e8f0',
    },
    itemsArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 20px',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 0',
      borderBottom: '1px solid #e2e8f0',
    },
    itemImg: {
      width: '65px',
      height: '65px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#ecfdf5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      flexShrink: 0,
    },
    qtyBox: {
      display: 'flex',
      alignItems: 'center',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '30px',
      width: 'fit-content',
      height: '28px',
      marginTop: '4px',
    },
    qtyBtn: {
      background: 'transparent',
      border: 'none',
      width: '28px',
      height: '28px',
      fontSize: '15px',
      fontWeight: 800,
      color: '#059669',
      cursor: 'pointer',
    },
    qtyNum: {
      padding: '0 10px',
      fontSize: '13px',
      fontWeight: 800,
      color: '#1a202c',
    },
    totalBar: {
      padding: '18px 20px',
      borderTop: '2px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    checkoutBtn: {
      background: 'linear-gradient(135deg, #059669, #047857)',
      color: '#ffffff',
      border: 'none',
      margin: '0 20px 20px',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: 800,
      cursor: 'pointer',
      boxShadow: '0 6px 18px rgba(5,150,105,0.35)',
    },
  }

  const content = (
    <div style={S.overlay}>
      <div style={S.panel}>
        <div style={S.header}>
          <div>
            <span style={S.label}>YOUR PHARMACY ORDER</span>
            <h2 style={S.title}>Medicines Cart</h2>
          </div>
          <button style={S.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>
              💊
            </div>
            <h3>Your cart is empty</h3>
            <p style={{ color: '#4a5568' }}>
              Add medicines to get started
            </p>
          </div>
        ) : (
          <>
            {pharmacy?.pharmacyName && (
              <div style={S.pharmacyBar}>
                <div style={S.itemImg}>
                  {pharmacy.pharmacyLogo ? (
                    <img
                      src={pharmacy.pharmacyLogo}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span>💊</span>
                  )}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px' }}>
                    {pharmacy.pharmacyName}
                  </strong>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#059669',
                      fontWeight: 600,
                    }}
                  >
                    Delivery: ৳{pharmacy.deliveryFee || 0}
                    {pharmacy.deliveryTime &&
                      ` · ${pharmacy.deliveryTime}`}
                  </span>
                </div>
              </div>
            )}

            <div style={S.itemsArea}>
              {items.map((item) => (
                <div key={item.id} style={S.item}>
                  <div style={S.itemImg}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span>{item.emoji || '💊'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#1a202c',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#4a5568',
                        fontWeight: 600,
                      }}
                    >
                      ৳{item.price} each
                    </span>
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
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#059669',
                      flexShrink: 0,
                    }}
                  >
                    ৳{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div style={S.totalBar}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#4a5568',
                }}
              >
                Total
              </span>
              <strong
                style={{
                  fontSize: '22px',
                  color: '#1a202c',
                  fontWeight: 900,
                }}
              >
                ৳{total}
              </strong>
            </div>

            <button style={S.checkoutBtn} onClick={goToCheckout}>
              Proceed to Checkout →
            </button>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default PharmacyCart