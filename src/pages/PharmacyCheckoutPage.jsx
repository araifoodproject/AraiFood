// ============================================================
// src/pages/PharmacyCheckoutPage.jsx
// Pharmacy-specific checkout (separate from food)
// Bilingual (BN/EN)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MapPicker from '../components/MapPicker'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { toast } from 'react-toastify'
import { sendNotification } from '../utils/sendNotification'
import { useLanguage } from '../i18n/LanguageContext'

function PharmacyCheckoutPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { settings } = useSettings()

  const [cartItems, setCartItems] = useState([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const savedAddress = JSON.parse(localStorage.getItem('savedAddress') || 'null')

  const [fullName, setFullName] = useState(savedAddress?.fullName || '')
  const [phone, setPhone] = useState(savedAddress?.phone || '')
  const [address, setAddress] = useState(savedAddress?.address || '')
  const [saveAddress, setSaveAddress] = useState(Boolean(savedAddress))
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [usingWallet, setUsingWallet] = useState(false)
  const [usingPoints, setUsingPoints] = useState(false)

  const [mapPosition, setMapPosition] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [deliveryZones, setDeliveryZones] = useState([])
  const [selectedZoneId, setSelectedZoneId] = useState('')

  // Load pharmacy cart
  useEffect(() => {
    const items = JSON.parse(
      localStorage.getItem('pharmacyCartItems') || '[]'
    )
    setCartItems(items)

    const savedLoc = JSON.parse(
      localStorage.getItem('deliveryLocation') || 'null'
    )
    if (savedLoc?.lat && savedLoc?.lng) setMapPosition(savedLoc)

    const savedZone = localStorage.getItem('deliveryZoneId')
    if (savedZone) setSelectedZoneId(savedZone)

    const loadUserData = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setLoyaltyPoints(data.loyaltyPoints || 0)
            setWalletBalance(data.walletBalance || 0)
          }
        } catch (err) {
          console.error('User load error:', err)
        }
      }
    }
    loadUserData()
  }, [])

  // Load zones
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'deliveryZones'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setDeliveryZones(list)
      }
    )
    return () => unsub()
  }, [])

  const selectedZone = useMemo(
    () => deliveryZones.find((z) => z.firebaseId === selectedZoneId) || null,
    [deliveryZones, selectedZoneId]
  )

  const pharmacy =
    cartItems.length > 0
      ? {
          pharmacyId: cartItems[0].pharmacyId,
          pharmacyName: cartItems[0].pharmacyName,
          pharmacyLogo: cartItems[0].pharmacyLogo || '',
          deliveryFee: cartItems[0].deliveryFee ?? null,
          deliveryTime:
            cartItems[0].deliveryTime ||
            t('pharmacyDetail.defaultDeliveryTime'),
        }
      : null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // Delivery fee: zone fee > pharmacy fee > settings default
  const deliveryFee = useMemo(() => {
    if (selectedZone?.deliveryFee != null) return selectedZone.deliveryFee
    if (pharmacy?.deliveryFee != null) return pharmacy.deliveryFee
    return settings.defaultDeliveryFee || 30
  }, [selectedZone, pharmacy, settings.defaultDeliveryFee])

  const pointsDiscount = usingPoints
    ? Math.min(loyaltyPoints / 10, subtotal)
    : 0
  const walletDiscount = usingWallet
    ? Math.min(walletBalance, subtotal - pointsDiscount)
    : 0
  const total = subtotal + deliveryFee - pointsDiscount - walletDiscount

  // ============================================================
  // PLACE ORDER
  // ============================================================
  const placeOrder = async () => {
    if (!fullName.trim()) {
      toast.error(t('pharmacyCheckout.errFullName'))
      return
    }
    if (!phone.trim()) {
      toast.error(t('pharmacyCheckout.errPhone'))
      return
    }
    if (!address.trim()) {
      toast.error(t('pharmacyCheckout.errAddress'))
      return
    }
    if (!selectedZoneId) {
      toast.error(t('pharmacyCheckout.errZone'))
      const zoneSection = document.querySelector('.zone-selection-section')
      if (zoneSection) {
        zoneSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (!mapPosition) {
      toast.error(t('pharmacyCheckout.errMap'))
      const mapSection = document.querySelector('.map-selection-section')
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (cartItems.length === 0) {
      toast.error(t('pharmacyCheckout.errCartEmpty'))
      return
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      toast.error(t('pharmacyCheckout.errWalletInsufficient'))
      return
    }

    setPlacing(true)

    if (saveAddress) {
      localStorage.setItem(
        'savedAddress',
        JSON.stringify({ fullName, phone, address })
      )
    } else {
      localStorage.removeItem('savedAddress')
    }
    if (mapPosition) {
      localStorage.setItem('deliveryLocation', JSON.stringify(mapPosition))
    }
    if (selectedZoneId) {
      localStorage.setItem('deliveryZoneId', selectedZoneId)
    }

    const newOrderId = `PH-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderId(newOrderId)

    try {
      await addDoc(collection(db, 'orders'), {
        orderId: newOrderId,
        orderType: 'pharmacy',
        userId: auth.currentUser?.uid || 'guest',
        userEmail: auth.currentUser?.email || 'guest',

        pharmacyId: pharmacy.pharmacyId,
        pharmacyName: pharmacy.pharmacyName,
        pharmacyLogo: pharmacy.pharmacyLogo,
        restaurantId: pharmacy.pharmacyId,
        restaurantName: pharmacy.pharmacyName,
        restaurantLogo: pharmacy.pharmacyLogo,

        items: cartItems,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,
        fullName: fullName,
        phone: phone,
        address: address,
        orderNote: orderNote,
        paymentMethod: paymentMethod,
        location: mapPosition,
        zoneId: selectedZone?.firebaseId || null,
        zoneName: selectedZone?.name || null,
        zoneDeliveryFee: selectedZone?.deliveryFee || null,

        status: 'pending',
        riderStatus: 'available',
        riderId: null,
        riderName: null,
        riderPhone: null,
        riderRating: null,
        deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp(),
      })

      // Deduct wallet points if used
      if (auth.currentUser?.uid) {
        const userRef = doc(db, 'users', auth.currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          let newPoints = userData.loyaltyPoints || 0
          let newBalance = userData.walletBalance || 0
          const newTx = []

          if (usingPoints) {
            newPoints = Math.max(0, newPoints - pointsDiscount * 10)
          }
          if (usingWallet) {
            newBalance = Math.max(0, newBalance - walletDiscount)
            newTx.push({
              id: Date.now().toString() + '-pharmacy',
              type: 'debit',
              amount: walletDiscount,
              date: new Date().toLocaleDateString(),
              description: t('pharmacyCheckout.txPharmacyOrder').replace(
                '{orderId}',
                newOrderId
              ),
            })
          }
          if (paymentMethod === 'wallet') {
            newBalance = Math.max(0, newBalance - total)
            newTx.push({
              id: Date.now().toString() + '-phfull',
              type: 'debit',
              amount: total,
              date: new Date().toLocaleDateString(),
              description: t('pharmacyCheckout.txPharmacyFull').replace(
                '{orderId}',
                newOrderId
              ),
            })
          }

          const earnedPoints = Math.floor(total * 0.05)
          newPoints += earnedPoints

          await updateDoc(userRef, {
            loyaltyPoints: newPoints,
            walletBalance: newBalance,
            walletTransactions:
              newTx.length > 0 ? arrayUnion(...newTx) : arrayUnion(),
            pointsHistory: arrayUnion({
              id: Date.now().toString() + '-phearned',
              amount: earnedPoints,
              date: new Date().toLocaleDateString(),
              description: t('pharmacyCheckout.txPharmacyOrder').replace(
                '{orderId}',
                newOrderId
              ),
            }),
          })

          setLoyaltyPoints(newPoints)
          setWalletBalance(newBalance)
        }
      }

      // Notifications
      const customerId = auth.currentUser?.uid || 'guest'
      await sendNotification(
        customerId,
        t('pharmacyCheckout.notifCustomerTitle'),
        t('pharmacyCheckout.notifCustomerBody')
          .replace('{orderId}', newOrderId)
          .replace('{pharmacy}', pharmacy.pharmacyName),
        'order',
        { orderId: newOrderId }
      )
      await sendNotification(
        'admin',
        t('pharmacyCheckout.notifAdminTitle'),
        t('pharmacyCheckout.notifAdminBody')
          .replace('{pharmacy}', pharmacy.pharmacyName)
          .replace('{total}', total),
        'order',
        { orderId: newOrderId }
      )

      // Local history
      const history = JSON.parse(
        localStorage.getItem('orderHistory') || '[]'
      )
      history.unshift({
        id: newOrderId,
        date: new Date().toLocaleDateString(),
        restaurantName: pharmacy.pharmacyName,
        restaurantId: pharmacy.pharmacyId,
        restaurantLogo: pharmacy.pharmacyLogo,
        items: cartItems,
        total: total,
        status: 'pending',
        orderType: 'pharmacy',
      })
      localStorage.setItem('orderHistory', JSON.stringify(history))

      setOrderPlaced(true)
      localStorage.removeItem('pharmacyCartItems')
      window.dispatchEvent(new Event('pharmacyCartUpdated'))
      window.scrollTo(0, 0)
      toast.success(t('pharmacyCheckout.successToast'))
    } catch (err) {
      console.error('Order error:', err)
      toast.error(t('pharmacyCheckout.errorToast'))
    } finally {
      setPlacing(false)
    }
  }

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="order-success-container">
          <PageBackButton
            label={t('pharmacyCheckout.backHome')}
            fallback="/"
          />

          <div className="order-success-icon">💊</div>
          <h1>{t('pharmacyCheckout.successTitle')}</h1>
          <p>
            {t('pharmacyCheckout.successDesc').replace(
              '{orderId}',
              orderId
            )}
          </p>
          <p style={{ marginTop: '10px' }}>
            {t('pharmacyCheckout.successFrom')}{' '}
            <strong>{pharmacy?.pharmacyName}</strong>
          </p>

          <div className="order-success-buttons">
            <Link
              to={`/track-order?id=${orderId}`}
              className="checkout-button"
            >
              {t('pharmacyCheckout.trackOrder')}
            </Link>
            <Link to="/" className="checkout-button">
              {t('pharmacyCheckout.backHomeBtn')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // EMPTY CART
  // ============================================================
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <PageBackButton
            label={t('pharmacyCheckout.back')}
            fallback="/pharmacy"
          />
          <div
            className="restaurant-empty-state"
            style={{ marginTop: '40px' }}
          >
            <div className="empty-icon">💊</div>
            <h2>{t('pharmacyCheckout.emptyTitle')}</h2>
            <p>{t('pharmacyCheckout.emptyDesc')}</p>
            <Link
              to="/pharmacy"
              className="checkout-button"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
              }}
            >
              {t('pharmacyCheckout.browsePharmacies')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // FORM
  // ============================================================
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <PageBackButton
            label={t('pharmacyCheckout.back')}
            fallback="/pharmacy"
          />
          <div className="checkout-title">
            <span className="glass-section-label">
              {t('pharmacyCheckout.badge')}
            </span>
            <h1>{t('pharmacyCheckout.title')}</h1>
            <p>{t('pharmacyCheckout.subtitle')}</p>
          </div>
        </div>

        <div className="checkout-content">
          {/* LEFT: FORM */}
          <div className="delivery-form checkout-card">
            <div className="checkout-card-heading">
              <div className="checkout-icon">📍</div>
              <div>
                <h2>{t('pharmacyCheckout.deliveryInfo')}</h2>
                <p>{t('pharmacyCheckout.deliveryInfoDesc')}</p>
              </div>
            </div>

            <div className="form-group">
              <label>{t('pharmacyCheckout.fullName')}</label>
              <input
                type="text"
                placeholder={t('pharmacyCheckout.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{t('pharmacyCheckout.phone')}</label>
              <input
                type="tel"
                placeholder={t('pharmacyCheckout.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Zone */}
            <div className="zone-selection-section">
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  margin: '0 0 10px',
                }}
              >
                {t('pharmacyCheckout.selectArea')}{' '}
                <span style={{ color: '#DC2626', fontSize: '12px' }}>
                  {t('pharmacyCheckout.required')}
                </span>
              </h3>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  border: selectedZoneId
                    ? '2px solid #059669'
                    : '2px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">
                  {t('pharmacyCheckout.selectAreaPlaceholder')}
                </option>
                {deliveryZones.map((z) => (
                  <option key={z.firebaseId} value={z.firebaseId}>
                    {t('pharmacyCheckout.zoneOption')
                      .replace('{name}', z.name)
                      .replace('{fee}', z.deliveryFee)}
                  </option>
                ))}
              </select>
              {selectedZone && (
                <p
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(5,150,105,0.1)',
                    border: '1px solid rgba(5,150,105,0.25)',
                    color: '#059669',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  {t('pharmacyCheckout.zoneConfirmed')
                    .replace('{name}', selectedZone.name)
                    .replace('{fee}', selectedZone.deliveryFee)}
                </p>
              )}
            </div>

            <div className="form-group">
              <label>{t('pharmacyCheckout.deliveryAddress')}</label>
              <textarea
                placeholder={t(
                  'pharmacyCheckout.deliveryAddressPlaceholder'
                )}
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>

            {/* Map */}
            <div className="map-selection-section">
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  margin: '0 0 10px',
                }}
              >
                {t('pharmacyCheckout.dropPin')}{' '}
                <span style={{ color: '#DC2626', fontSize: '12px' }}>
                  {t('pharmacyCheckout.required')}
                </span>
              </h3>
              <MapPicker position={mapPosition} setPosition={setMapPosition} />
              {mapPosition ? (
                <p className="selected-location">
                  {t('pharmacyCheckout.locationSet')
                    .replace('{lat}', mapPosition.lat.toFixed(4))
                    .replace('{lng}', mapPosition.lng.toFixed(4))}
                </p>
              ) : (
                <p
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {t('pharmacyCheckout.selectLocation')}
                </p>
              )}
            </div>

            <label className="save-address-option">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              <span>{t('pharmacyCheckout.saveAddress')}</span>
            </label>

            <div className="form-group">
              <label>{t('pharmacyCheckout.orderNote')}</label>
              <textarea
                placeholder={t('pharmacyCheckout.orderNotePlaceholder')}
                rows="3"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              ></textarea>
            </div>

            {/* Wallet / Points */}
            <div className="payment-rewards-section">
              <h3>{t('pharmacyCheckout.useRewards')}</h3>
              <div className="reward-options">
                <label
                  className={`reward-option ${usingPoints ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={usingPoints}
                    onChange={() => setUsingPoints(!usingPoints)}
                  />
                  <div>
                    <strong>
                      {t('pharmacyCheckout.usePoints').replace(
                        '{points}',
                        loyaltyPoints
                      )}
                    </strong>
                    <small>
                      {t('pharmacyCheckout.usePointsDesc').replace(
                        '{amount}',
                        Math.min(loyaltyPoints / 10, subtotal).toFixed(0)
                      )}
                    </small>
                  </div>
                </label>
                <label
                  className={`reward-option ${usingWallet ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={usingWallet}
                    onChange={() => setUsingWallet(!usingWallet)}
                  />
                  <div>
                    <strong>
                      {t('pharmacyCheckout.useWallet').replace(
                        '{amount}',
                        walletBalance.toFixed(2)
                      )}
                    </strong>
                    <small>{t('pharmacyCheckout.useWalletDesc')}</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment */}
            <div className="payment-section">
              <div className="payment-heading">
                <div className="checkout-icon">💳</div>
                <div>
                  <h2>{t('pharmacyCheckout.paymentMethod')}</h2>
                  <p>{t('pharmacyCheckout.paymentMethodDesc')}</p>
                </div>
              </div>
              <div className="payment-options">
                <label
                  className={`payment-option ${
                    paymentMethod === 'cod' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <strong>{t('pharmacyCheckout.cod')}</strong>
                  <small>{t('pharmacyCheckout.codDesc')}</small>
                </label>
                <label
                  className={`payment-option ${
                    paymentMethod === 'mobile' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'mobile'}
                    onChange={() => setPaymentMethod('mobile')}
                  />
                  <strong>{t('pharmacyCheckout.mobileBanking')}</strong>
                  <small>{t('pharmacyCheckout.mobileBankingDesc')}</small>
                </label>
                <label
                  className={`payment-option ${
                    paymentMethod === 'wallet' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                  />
                  <strong>{t('pharmacyCheckout.walletPayment')}</strong>
                  <small>
                    {t('pharmacyCheckout.walletPaymentDesc').replace(
                      '{amount}',
                      walletBalance.toFixed(2)
                    )}
                  </small>
                </label>
              </div>
            </div>

            <button
              className="place-order-button"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing
                ? t('pharmacyCheckout.placingOrder')
                : t('pharmacyCheckout.placeOrder')}
            </button>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="checkout-summary checkout-card">
            <span className="section-label">
              {t('pharmacyCheckout.orderSummary')}
            </span>
            <h2>{t('pharmacyCheckout.yourMedicines')}</h2>

            {pharmacy && (
              <div className="summary-restaurant">
                <div className="summary-restaurant-logo">
                  {pharmacy.pharmacyLogo ? (
                    <img src={pharmacy.pharmacyLogo} alt="logo" />
                  ) : (
                    <span>💊</span>
                  )}
                </div>
                <div>
                  <strong>{pharmacy.pharmacyName}</strong>
                  <small>
                    {t('pharmacyCheckout.summaryDelivery')
                      .replace('{fee}', deliveryFee)
                      .replace('{time}', pharmacy.deliveryTime)}
                  </small>
                </div>
              </div>
            )}

            {selectedZone && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(5,150,105,0.08)',
                  border: '1px solid rgba(5,150,105,0.2)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#059669',
                  marginBottom: '14px',
                }}
              >
                {t('pharmacyCheckout.summaryZone').replace(
                  '{name}',
                  selectedZone.name
                )}
              </div>
            )}

            <div className="summary-items">
              {cartItems.map((item) => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-with-image">
                    <div className="summary-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>{item.emoji || '💊'}</span>
                      )}
                    </div>
                    <div>
                      <span>{item.name}</span>
                      <small>
                        {t('pharmacyCheckout.quantityX').replace(
                          '{n}',
                          item.quantity
                        )}
                      </small>
                    </div>
                  </div>
                  <strong>৳{item.price * item.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <span>{t('pharmacyCheckout.subtotal')}</span>
              <strong>৳{subtotal}</strong>
            </div>

            <div className="summary-item">
              <span>{t('pharmacyCheckout.deliveryFee')}</span>
              <strong>৳{deliveryFee}</strong>
            </div>

            {usingPoints && (
              <div className="summary-item discount-item">
                <span>{t('pharmacyCheckout.pointsDiscount')}</span>
                <strong>-৳{pointsDiscount}</strong>
              </div>
            )}
            {usingWallet && (
              <div className="summary-item discount-item">
                <span>{t('pharmacyCheckout.walletDiscount')}</span>
                <strong>-৳{walletDiscount}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>{t('pharmacyCheckout.total')}</span>
              <strong>৳{total}</strong>
            </div>

            <div className="checkout-note">
              {t('pharmacyCheckout.secureNote')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PharmacyCheckoutPage