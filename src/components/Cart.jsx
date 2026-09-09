function Cart({ items, onClose, onIncrease, onDecrease }) {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const goToCheckout = () => {
    window.location.href = '/checkout'
  }

  return (
    <div className="cart-overlay">
      <div className="cart-panel">

        <div className="cart-header">
          <div>
            <span className="section-label">YOUR ORDER</span>
            <h2>Your Cart</h2>
          </div>

          <button
            className="cart-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <div>🛒</div>

            <h3>Your cart is empty</h3>

            <p>
              Add some delicious food to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="cart-items">

              {items.map((item) => (
                <div
                  className="cart-item"
                  key={item.id}
                >

                  <div className="cart-item-icon">
                    {item.emoji}
                  </div>

                  <div className="cart-item-info">

                    <h3>{item.name}</h3>

                    <div className="cart-quantity">

                      <button
                        onClick={() =>
                          onDecrease(item.id)
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          onIncrease(item.id)
                        }
                      >
                        +
                      </button>

                    </div>

                  </div>

                  <strong>
                    ৳{item.price * item.quantity}
                  </strong>

                </div>
              ))}

            </div>

            <div className="cart-total">
              <span>Total</span>

              <strong>
                ৳{total}
              </strong>
            </div>

            <button
              className="checkout-button"
              onClick={goToCheckout}
            >
              Proceed to Checkout →
            </button>

          </>
        )}

      </div>
    </div>
  )
}

export default Cart