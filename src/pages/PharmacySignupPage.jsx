// ============================================================
// src/pages/PharmacySignupPage.jsx
// 4-step signup: credentials → info → license/NID → location
// ============================================================

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'
import MapPicker from '../components/MapPicker'

function PharmacySignupPage() {
  const [step, setStep] = useState(1)

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2
  const [pharmacyName, setPharmacyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')

  // Step 3
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('')
  const [drugLicenseImage, setDrugLicenseImage] = useState('')
  const [ownerNidNumber, setOwnerNidNumber] = useState('')
  const [ownerNidImage, setOwnerNidImage] = useState('')

  // Step 4
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState(null)
  const [openingTime, setOpeningTime] = useState('09:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [minimumOrder, setMinimumOrder] = useState('50')
  const [deliveryFee, setDeliveryFee] = useState('30')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ============ IMAGE UPLOAD HELPER ============
  const handleImageUpload = (e, setter) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX = 900
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX) {
            h = Math.round((h * MAX) / w)
            w = MAX
          }
        } else if (h > MAX) {
          w = Math.round((w * MAX) / h)
          h = MAX
        }
        canvas.width = w
        canvas.height = h
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        setter(canvas.toDataURL('image/jpeg', 0.8))
        toast.success('Image ready!')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleStep1 = () => {
    setError('')
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setStep(2)
  }

  const handleStep2 = () => {
    setError('')
    if (!pharmacyName.trim()) {
      setError('Please enter pharmacy name.')
      return
    }
    if (!ownerName.trim()) {
      setError('Please enter owner name.')
      return
    }
    if (!phone.trim()) {
      setError('Please enter phone number.')
      return
    }
    setStep(3)
  }

  const handleStep3 = () => {
    setError('')
    if (!drugLicenseNumber.trim()) {
      setError('Please enter drug license number.')
      return
    }
    if (!drugLicenseImage) {
      setError('Please upload your drug license image.')
      return
    }
    if (!ownerNidNumber.trim()) {
      setError('Please enter owner NID number.')
      return
    }
    if (!ownerNidImage) {
      setError('Please upload owner NID image.')
      return
    }
    setStep(4)
  }

  const handleFinalSubmit = async () => {
    setError('')
    if (!address.trim()) {
      setError('Please enter your address.')
      return
    }
    if (!location?.lat || !location?.lng) {
      setError('Please pin your pharmacy location on the map.')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      const userId = userCredential.user.uid

      await setDoc(doc(db, 'pharmacies', userId), {
        ownerId: userId,
        email: email.trim(),
        pharmacyName: pharmacyName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        description: description.trim(),
        drugLicenseNumber: drugLicenseNumber.trim(),
        drugLicenseImage,
        ownerNidNumber: ownerNidNumber.trim(),
        ownerNidImage,
        address: address.trim(),
        location: { lat: location.lat, lng: location.lng },
        openingTime,
        closingTime,
        minimumOrder: parseFloat(minimumOrder),
        deliveryFee: parseFloat(deliveryFee),
        status: 'pending',
        pharmacyStatus: 'offline',
        rating: 0,
        reviewCount: 0,
        totalOrders: 0,
        totalRevenue: 0,
        logo: '',
        createdAt: serverTimestamp(),
      })

      toast.success(
        'Pharmacy Signup Successful! Waiting for Admin Approval.',
        { autoClose: 5000 }
      )
      window.location.href = '/pharmacy-panel'
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
      <div className="floating-food food-one">💊</div>
      <div className="floating-food food-two">🩺</div>
      <div className="floating-food food-three">💉</div>
      <div className="floating-food food-four">🧪</div>

      <div className="premium-login-card restaurant-signup-card">
        <div className="premium-login-logo">
          <img
            src="/araifood-logo.png"
            alt="AraiFood Logo"
            className="premium-logo-image"
          />
          <h1>PHARMACY SIGNUP</h1>
          <p>Partner With AraiFood</p>
        </div>

        {/* Steps */}
        <div className="signup-steps">
          <div className={`signup-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`signup-step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`signup-step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`signup-step-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 4 ? 'active' : ''}`}>4</div>
        </div>

        {/* ============ STEP 1 ============ */}
        {step === 1 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 1 OF 4</span>
              <h2>Create Account</h2>
              <p>Your login credentials</p>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="pharmacy@email.com"
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

        {/* ============ STEP 2 ============ */}
        {step === 2 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 2 OF 4</span>
              <h2>Pharmacy Information</h2>
              <p>Tell us about your pharmacy</p>
            </div>

            <div className="form-group">
              <label>Pharmacy Name</label>
              <input
                type="text"
                placeholder="e.g., Arai Pharmacy"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
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
              <label>Description (Optional)</label>
              <textarea
                placeholder="Short description about your pharmacy"
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

        {/* ============ STEP 3: LICENSE + NID ============ */}
        {step === 3 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 3 OF 4</span>
              <h2>Documents Required</h2>
              <p>Drug License & Owner NID</p>
            </div>

            {/* Drug License */}
            <div className="form-group">
              <label>💊 Drug License Number *</label>
              <input
                type="text"
                placeholder="e.g., DL-XXXX-XXXXXX"
                value={drugLicenseNumber}
                onChange={(e) => setDrugLicenseNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📷 Drug License Image *</label>
              {drugLicenseImage ? (
                <div style={{ position: 'relative', maxWidth: '220px' }}>
                  <img
                    src={drugLicenseImage}
                    alt="License"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      display: 'block',
                    }}
                  />
                  <button
                    onClick={() => setDrugLicenseImage('')}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="image-upload-btn">
                  📷 Upload Drug License Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setDrugLicenseImage)}
                  />
                </label>
              )}
            </div>

            {/* Owner NID */}
            <div className="form-group">
              <label>🪪 Owner NID Number *</label>
              <input
                type="text"
                placeholder="e.g., 8718577268"
                value={ownerNidNumber}
                onChange={(e) => setOwnerNidNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📷 Owner NID Image *</label>
              {ownerNidImage ? (
                <div style={{ position: 'relative', maxWidth: '220px' }}>
                  <img
                    src={ownerNidImage}
                    alt="NID"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      display: 'block',
                    }}
                  />
                  <button
                    onClick={() => setOwnerNidImage('')}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="image-upload-btn">
                  📷 Upload NID Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setOwnerNidImage)}
                  />
                </label>
              )}
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
              <button className="login-submit-button" onClick={handleStep3}>
                Next →
              </button>
            </div>
          </>
        )}

        {/* ============ STEP 4 ============ */}
        {step === 4 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 4 OF 4</span>
              <h2>Location & Hours</h2>
              <p>Where is your pharmacy?</p>
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

            <div className="form-group">
              <label>📍 Pin Location on Map *</label>
              <MapPicker
                position={location}
                setPosition={setLocation}
                height={280}
                helperText="👆 Click on the map to pin your pharmacy location"
              />
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
              <button className="signup-back-btn" onClick={() => setStep(3)}>
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
              📝 Your application will be reviewed by Admin. You'll be
              notified once approved.
            </p>
          </>
        )}

        <div className="login-footer">
          <p>Already a pharmacy partner?</p>
          <button
            type="button"
            className="signup-link"
            onClick={() => {
              window.location.href = '/pharmacy-login'
            }}
          >
            Pharmacy Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default PharmacySignupPage