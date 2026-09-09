import { useState } from 'react'

function CheckoutPage() {
  const cartItems = JSON.parse(
    localStorage.getItem('cartItems') || '[]'
  )

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const deliveryFee = cartItems.length > 0 ? 30 : 0
  const total = subtotal + deliveryFee

  const savedAddress = JSON.parse(
    localStorage.getItem('savedAddress') || 'null'
  )

  const [fullName, setFullName] = useState(
    savedAddress?.fullName || ''
  )

  const [phone, setPhone] = useState(
    savedAddress?.phone || ''
  )

  const [address, setAddress] = useState(
    savedAddress?.address || ''
  )

  const [saveAddress, setSaveAddress] = useState(
    Boolean(savedAddress)
  )

  const placeOrder = () => {
    if (!fullName.trim()) {
      alert('Please enter your full name.')
      return
    }

    if (!phone.trim()) {
      alert('Please enter your phone number.')
      return
    }

    if (!address.trim()) {
      alert('Please enter your delivery address.')
      return
    }

    if (saveAddress) {
      localStorage.setItem(
        'savedAddress',
        JSON.stringify({
          fullName,
          phone,
          address,
        })
      )
    } else {
      localStorage.removeItem('savedAddress')
    }

    alert('Order placed successfully!')

    localStorage.removeItem('cartItems')

    window.location.href = '/'
  }

  return (
    <div className="checkout-page">

      <div className="checkout-container">

        {/* Header */}

        <div className="checkout-header">

          <button
            className="checkout-back-button"
            onClick={() => window.history.back()}
          >
            ← Back to Menu
          </button>

          <div className="checkout-title">

            <span className="section-label">
              CHECKOUT
            </span>

            <h1>Complete Your Order</h1>

            <p>
              Just a few details and your delicious food
              will be on its way.
            </p>

          </div>

        </div>


        <div className="checkout-content">

          {/* =========================
              DELIVERY INFORMATION
          ========================== */}

          <div className="delivery-form checkout-card">

            <div className="checkout-card-heading">

              <div className="checkout-icon">
                📍
              </div>

              <div>
                <h2>Delivery Information</h2>

                <p>
                  Where should we deliver your order?
                </p>
              </div>

            </div>


            {/* Full Name */}

            <div className="form-group">

              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
              />

            </div>


            {/* Phone */}

            <div className="form-group">

              <label>Phone Number</label>

              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />

            </div>


            {/* Address */}

            <div className="form-group">

              <label>Delivery Address</label>

              <textarea
                placeholder="Enter your full delivery address"
                rows="4"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
              ></textarea>

            </div>


            {/* Save Address */}

            <label className="save-address-option">

              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) =>
                  setSaveAddress(e.target.checked)
                }
              />

              <span>
                💾 Save this address for future orders
              </span>

            </label>


            {/* =========================
                MAP - COMING SOON
            ========================== */}

            <div className="map-coming-soon">

              <div className="map-coming-icon">
                🗺️
              </div>

              <div className="map-coming-content">

                <div className="map-coming-title-row">

                  <h3>
                    Choose Address from Map
                  </h3>

                  <span className="coming-soon-badge">
                    Coming Soon
                  </span>

                </div>

                <p>
                  Soon you will be able to select your
                  exact delivery location directly from
                  the map of Araihazar.
                </p>

              </div>

            </div>


            {/* =========================
                PAYMENT
            ========================== */}

            <div className="payment-section">

              <div className="payment-heading">

                <div className="checkout-icon">
                  💳
                </div>

                <div>

                  <h2>Payment Method</h2>

                  <p>
                    Choose how you want to pay.
                  </p>

                </div>

              </div>


              <div className="payment-options">

                {/* Cash */}

                <label className="payment-option">

                  <input
                    type="radio"
                    name="payment"
                    defaultChecked
                  />

                  <div>

                    <strong>
                      💵 Cash on Delivery
                    </strong>

                    <small>
                      Pay when your food arrives
                    </small>

                  </div>

                </label>


                {/* Mobile Banking */}

                <label className="payment-option">

                  <input
                    type="radio"
                    name="payment"
                  />

                  <div>

                    <strong>
                      📱 Mobile Banking
                    </strong>

                    <small>
                      bKash / Nagad / Rocket
                    </small>

                  </div>

                </label>

              </div>

            </div>


            {/* Place Order */}

            <button
              className="place-order-button"
              onClick={placeOrder}
            >
              Place Order →
            </button>

          </div>


          {/* =========================
              ORDER SUMMARY
          ========================== */}

          <div className="checkout-summary checkout-card">

            <span className="section-label">
              ORDER SUMMARY
            </span>

            <h2>Your Order</h2>


            <div className="summary-restaurant">

              <span>🍛</span>

              <div>

                <strong>
                  Arai Biryani House
                </strong>

                <small>
                  Your selected items
                </small>

              </div>

            </div>


            <div className="summary-items">

              {cartItems.length === 0 ? (

                <p>
                  Your cart is empty.
                </p>

              ) : (

                cartItems.map((item) => (

                  <div
                    className="summary-item"
                    key={item.id}
                  >

                    <div>

                      <span>
                        {item.emoji} {item.name}
                      </span>

                      <small>
                        Quantity × {item.quantity}
                      </small>

                    </div>

                    <strong>
                      ৳{item.price * item.quantity}
                    </strong>

                  </div>

                ))

              )}

            </div>


            <div className="summary-divider"></div>


            <div className="summary-item">

              <span>
                Subtotal
              </span>

              <strong>
                ৳{subtotal}
              </strong>

            </div>


            <div className="summary-item">

              <span>
                Delivery Fee
              </span>

              <strong>
                ৳{deliveryFee}
              </strong>

            </div>


            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                ৳{total}
              </strong>

            </div>


            <div className="checkout-note">
              🔒 Your order information is secure.
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default CheckoutPage