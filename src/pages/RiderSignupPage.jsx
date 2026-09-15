import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'

function RiderSignupPage() {
  const [step, setStep] = useState(1)

  // Step 1: Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2: Personal
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [nidNumber, setNidNumber] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')

  // Step 3: Vehicle
  const [vehicleType, setVehicleType] = useState('Motorcycle')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [nidImage, setNidImage] = useState('')
  const [vehicleImage, setVehicleImage] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ============ IMAGE UPLOAD FUNCTION ============
  const handleImageUpload = (e, setImage, maxSize = 800) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Please select under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        let width = img.width
        let height = img.height

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setImage(compressed)
        toast.success(`📷 Image uploaded! (${width}x${height})`)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // ============ STEP HANDLERS ============
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
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!phone.trim()) { setError('Please enter your phone number.'); return }
    if (!nidNumber.trim()) { setError('Please enter your NID number.'); return }
    if (!dob) { setError('Please enter your date of birth.'); return }
    if (!address.trim()) { setError('Please enter your address.'); return }
    if (!profileImage) { setError('Please upload your profile photo.'); return }
    setStep(3)
  }

  const handleStep3 = () => {
    setError('')
    if (!vehicleType) { setError('Please select your vehicle type.'); return }
    if (!nidImage) { setError('Please upload your NID photo.'); return }
    if (!vehicleImage) { setError('Please upload your vehicle photo.'); return }
    setStep(4)
  }

  const handleFinalSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const userId = userCredential.user.uid

      await setDoc(doc(db, 'riders', userId), {
        uid: userId,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        nidNumber: nidNumber.trim(),
        dob: dob,
        address: address.trim(),
        profileImage: profileImage,

        vehicleType: vehicleType,
        vehicleNumber: vehicleNumber.trim() || 'N/A',
        licenseNumber: licenseNumber.trim() || 'N/A',
        nidImage: nidImage,
        vehicleImage: vehicleImage,

        status: 'pending',
        riderStatus: 'offline',
        rating: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        createdAt: serverTimestamp()
      })

      toast.success('✅ Rider Signup Successful! Waiting for Admin Approval.', { autoClose: 5000 })
      window.location.href = '/rider-login'
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setError('This email is already registered.')
      else if (error.code === 'auth/invalid-email') setError('Please enter a valid email address.')
      else if (error.code === 'auth/weak-password') setError('Password is too weak.')
      else setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="premium-login-page">
      <div className="premium-bg-circle circle-one"></div>
      <div className="premium-bg-circle circle-two"></div>
      <div className="floating-food food-one">🛵</div>
      <div className="floating-food food-two">📦</div>

      <div className="premium-login-card rider-signup-card">
        <div className="premium-login-logo">
          <img src="/araifood-logo.png" alt="AraiFood Logo" className="premium-logo-image" />
          <h1>RIDER SIGNUP</h1>
          <p>Join as a Delivery Partner</p>
        </div>

        {/* Step Indicator */}
        <div className="signup-steps">
          <div className={`signup-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`signup-step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`signup-step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`signup-step-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`signup-step ${step >= 4 ? 'active' : ''}`}>4</div>
        </div>

        {/* ==================== STEP 1 ==================== */}
        {step === 1 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 1 OF 4</span>
              <h2>Create Account</h2>
              <p>Your login credentials</p>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="rider@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}
            <button className="login-submit-button" onClick={handleStep1}>Next →</button>
          </>
        )}

        {/* ==================== STEP 2 ==================== */}
        {step === 2 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 2 OF 4</span>
              <h2>Personal Information</h2>
              <p>Tell us about yourself</p>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="e.g., Rahim Uddin" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>NID Number *</label>
              <input type="text" placeholder="e.g., 1234567890123" value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Address *</label>
              <textarea placeholder="House / Road / Area / Araihazar" rows="2" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
            </div>

            {/* Profile Photo Upload */}
            <div className="form-group">
              <label>Profile Photo *</label>
              <div className="image-upload-area">
                {profileImage ? (
                  <div className="image-preview-wrapper">
                    <img src={profileImage} alt="Profile" className="food-image-preview" />
                    <button className="remove-image-btn" onClick={() => setProfileImage('')}>✕</button>
                  </div>
                ) : (
                  <label className="image-upload-btn">
                    <span>📷 Upload Profile Photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProfileImage, 400)} />
                  </label>
                )}
              </div>
            </div>

            {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

            <div className="signup-btn-group">
              <button className="signup-back-btn" onClick={() => setStep(1)}>← Back</button>
              <button className="login-submit-button" onClick={handleStep2}>Next →</button>
            </div>
          </>
        )}

        {/* ==================== STEP 3 ==================== */}
        {step === 3 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 3 OF 4</span>
              <h2>Vehicle Information</h2>
              <p>What will you deliver with?</p>
            </div>

            <div className="form-group">
              <label>Vehicle Type *</label>
              <div className="vehicle-type-grid">
                <button
                  type="button"
                  className={`vehicle-type-btn ${vehicleType === 'Motorcycle' ? 'active' : ''}`}
                  onClick={() => setVehicleType('Motorcycle')}
                >
                  <span>🛵</span>
                  <small>Motorcycle / Bike</small>
                </button>
                <button
                  type="button"
                  className={`vehicle-type-btn ${vehicleType === 'Bicycle' ? 'active' : ''}`}
                  onClick={() => setVehicleType('Bicycle')}
                >
                  <span>🚲</span>
                  <small>Bicycle</small>
                </button>
                <button
                  type="button"
                  className={`vehicle-type-btn ${vehicleType === 'Scooter' ? 'active' : ''}`}
                  onClick={() => setVehicleType('Scooter')}
                >
                  <span>🛴</span>
                  <small>Scooter</small>
                </button>
                <button
                  type="button"
                  className={`vehicle-type-btn ${vehicleType === 'Electric Bike' ? 'active' : ''}`}
                  onClick={() => setVehicleType('Electric Bike')}
                >
                  <span>⚡🛵</span>
                  <small>Electric Bike</small>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Vehicle Number (Optional)</label>
              <input type="text" placeholder="e.g., Dhaka-LA-1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Driving License (Optional)</label>
              <input type="text" placeholder="License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </div>

            {/* NID Photo Upload */}
            <div className="form-group">
              <label>NID Photo *</label>
              <div className="image-upload-area">
                {nidImage ? (
                  <div className="image-preview-wrapper">
                    <img src={nidImage} alt="NID" className="food-image-preview" />
                    <button className="remove-image-btn" onClick={() => setNidImage('')}>✕</button>
                  </div>
                ) : (
                  <label className="image-upload-btn">
                    <span>📷 Upload NID Photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNidImage, 800)} />
                  </label>
                )}
              </div>
            </div>

            {/* Vehicle Photo Upload */}
            <div className="form-group">
              <label>Vehicle Photo *</label>
              <div className="image-upload-area">
                {vehicleImage ? (
                  <div className="image-preview-wrapper">
                    <img src={vehicleImage} alt="Vehicle" className="food-image-preview" />
                    <button className="remove-image-btn" onClick={() => setVehicleImage('')}>✕</button>
                  </div>
                ) : (
                  <label className="image-upload-btn">
                    <span>📷 Upload Vehicle Photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setVehicleImage, 800)} />
                  </label>
                )}
              </div>
            </div>

            {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

            <div className="signup-btn-group">
              <button className="signup-back-btn" onClick={() => setStep(2)}>← Back</button>
              <button className="login-submit-button" onClick={handleStep3}>Next →</button>
            </div>
          </>
        )}

        {/* ==================== STEP 4 ==================== */}
        {step === 4 && (
          <>
            <div className="premium-login-header">
              <span className="section-label">STEP 4 OF 4</span>
              <h2>Review & Submit</h2>
              <p>Check your information</p>
            </div>

            <div className="rider-review-card">
              <div className="rider-review-avatar">
                {profileImage ? <img src={profileImage} alt="Profile" /> : <span>👤</span>}
              </div>
              <h3>{fullName}</h3>
              <p>{email}</p>

              <div className="rider-review-grid">
                <div className="rider-review-item">
                  <span>Phone</span>
                  <strong>{phone}</strong>
                </div>
                <div className="rider-review-item">
                  <span>NID Number</span>
                  <strong>{nidNumber}</strong>
                </div>
                <div className="rider-review-item">
                  <span>Date of Birth</span>
                  <strong>{dob}</strong>
                </div>
                <div className="rider-review-item">
                  <span>Vehicle Type</span>
                  <strong>{vehicleType}</strong>
                </div>
                <div className="rider-review-item">
                  <span>Vehicle Number</span>
                  <strong>{vehicleNumber || 'N/A'}</strong>
                </div>
                <div className="rider-review-item">
                  <span>License</span>
                  <strong>{licenseNumber || 'N/A'}</strong>
                </div>
              </div>

              <div className="rider-review-item full">
                <span>Address</span>
                <strong>{address}</strong>
              </div>

              <div className="rider-documents-review">
                <div className="rider-doc-thumb">
                  <span>NID Photo</span>
                  {nidImage && <img src={nidImage} alt="NID" />}
                </div>
                <div className="rider-doc-thumb">
                  <span>Vehicle Photo</span>
                  {vehicleImage && <img src={vehicleImage} alt="Vehicle" />}
                </div>
              </div>
            </div>

            {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

            <div className="signup-btn-group">
              <button className="signup-back-btn" onClick={() => setStep(3)}>← Back</button>
              <button className="login-submit-button" onClick={handleFinalSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application →'}
              </button>
            </div>

            <p className="signup-note">📝 Your application will be reviewed by Admin. You'll get an email once approved.</p>
          </>
        )}

        <div className="login-footer">
          <p>Already a rider?</p>
          <button type="button" className="signup-link" onClick={() => { window.location.href = '/rider-login' }}>
            Rider Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default RiderSignupPage