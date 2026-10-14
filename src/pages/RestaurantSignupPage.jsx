// ============================================================
// src/pages/RestaurantSignupPage.jsx
// V3 — + Welcome Notification + Admin Push Notify
// ============================================================

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'
import { saveInAppNotification } from '../utils/sendNotification'
import { notifyAdminsOfSignup } from '../utils/notifyAdmin'

const DEFAULT_WELCOME = {
  enabled: true,
  title: '🏪 Welcome to AraiFood Partner!',
  body: 'Your account is under review. You will be notified once approved.',
}

function RestaurantSignupPage() {
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [description, setDescription] = useState('')

  const [address, setAddress] = useState('')
  const [openingTime, setOpeningTime] = useState('10:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [minimumOrder, setMinimumOrder] = useState('100')
  const [deliveryFee, setDeliveryFee] = useState('30')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStep1 = () => {
    setError('')
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (!password.trim()) { setError('Please enter your password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setStep(2)
  }

  const handleStep2 = () => {
    setError('')
    if (!restaurantName.trim()) { setError('Please enter restaurant name.'); return }
    if (!ownerName.trim()) { setError('Please enter owner name.'); return }
    if (!phone.trim()) { setError('Please enter your phone number.'); return }
    if (!cuisine.trim()) { setError('Please enter your cuisine type.'); return }
    setStep(3)
  }

  const handleFinalSubmit = async () => {
    setError('')
    if (!address.trim()) { setError('Please enter your address.'); return }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      const userId = userCredential.user.uid

      await setDoc(doc(db, 'restaurants', userId), {
        ownerId: userId,
        email: email.trim(),
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        address: address.trim(),
        openingTime: openingTime,
        closingTime: closingTime,
        minimumOrder: parseFloat(minimumOrder),
        deliveryFee: parseFloat(deliveryFee),
        status: 'pending',
        restaurantStatus: 'offline',
        rating: 0,
        totalOrders: 0,
        totalRevenue: 0,
        logo: '',
        createdAt: serverTimestamp(),
      })

      // 🔔 Welcome Notification to Restaurant
      try {
        let welcome = DEFAULT_WELCOME
        const settingsRef = doc(db, 'settings', 'notifications')
        const settingsSnap = await getDoc(settingsRef)

        if (settingsSnap.exists()) {
          const data = settingsSnap.data()
          if (data.welcomeRestaurant) {
            welcome = { ...DEFAULT_WELCOME, ...data.welcomeRestaurant }
          }
        }

        if (welcome.enabled !== false) {
          await saveInAppNotification(
            userId,
            welcome.title || DEFAULT_WELCOME.title,
            welcome.body || DEFAULT_WELCOME.body,
            'restaurant',
            { url: '/restaurant-panel' }
          )
          console.log('✅ Welcome notification sent to restaurant:', userId)
        }
      } catch (notifErr) {
        console.warn('Welcome notification skipped:', notifErr)
      }

      // 🔔 Notify Admin (in background, no await)
      notifyAdminsOfSignup('restaurant', restaurantName.trim(), {
        uid: userId,
      }).catch((err) => console.warn('Admin notify failed:', err))

      toast.success(
        'Restaurant Signup Successful! Waiting for Admin Approval.',
        { autoClose: 5000 }
      )
      window.location.href = '/restaurant-panel'
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak.')
      } else {
        setError('Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="premium-login-page">
      <div className="premium-bg-circle circle-one"></div>
      <div className="premium-bg-circle circle-two"></div>
      <div className="floating-food food-one">🏪</div>
      <div className="floating-food food-two">🍽️</div>

      <div className="premium-login-card restaurant-signup-card">
        <div className="premium-login-logo">
          <img
            src="/araifood-logo-transparent.png"
            alt="AraiFood Logo"
            className="premium-logo-image"
          />
          <h1>RESTAURANT SIGNUP</h1>
          <p>Partner With AraiFood</p>
        </div>

        <div className="signup-steps">
          <div className={`signup-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`signup-step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`signup-step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {step === 1 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 1 OF 3</span>
              <h2>Create Account</h2>
              <p>Your login credentials</p>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="restaurant@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="login-error" style={{ marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <button className="login-submit-button" onClick={handleStep1}>
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 2 OF 3</span>
              <h2>Restaurant Information</h2>
              <p>Tell us about your restaurant</p>
            </div>

            <div className="form-group">
              <label>Restaurant Name</label>
              <input
                type="text"
                placeholder="e.g., Arai Biriyani House"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                placeholder="e.g., Rahim Uddin"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Cuisine Type</label>
              <input
                type="text"
                placeholder="e.g., Biriyani • Bangladeshi"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                placeholder="Short description about your restaurant"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {error && (
              <p className="login-error" style={{ marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <div className="signup-btn-group">
              <button className="signup-back-btn" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="login-submit-button" onClick={handleStep2}>
                Next →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 3 OF 3</span>
              <h2>Location & Hours</h2>
              <p>Where are you located?</p>
            </div>

            <div className="form-group">
              <label>Full Address</label>
              <textarea
                placeholder="House / Road / Area / Araihazar"
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>

            <div className="signup-row">
              <div className="form-group">
                <label>Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                />
              </div>
            </div>

            <div className="signup-row">
              <div className="form-group">
                <label>Minimum Order (৳)</label>
                <input
                  type="number"
                  value={minimumOrder}
                  onChange={(e) => setMinimumOrder(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Delivery Fee (৳)</label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="login-error" style={{ marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <div className="signup-btn-group">
              <button className="signup-back-btn" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                className="login-submit-button"
                onClick={handleFinalSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application →'}
              </button>
            </div>

            <p className="signup-note">
              📝 Your application will be reviewed by Admin. You'll get an
              email once approved.
            </p>
          </>
        )}

        <div className="login-footer">
          <p>Already a partner?</p>
          <button
            type="button"
            className="signup-link"
            onClick={() => {
              window.location.href = '/restaurant-login'
            }}
          >
            Restaurant Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantSignupPage