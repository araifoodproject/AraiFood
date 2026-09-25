// ============================================================
// src/pages/SignupPage.jsx
// V4 — Customer signup + Welcome + Admin notify
// ============================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'
import { Eye, EyeOff } from 'lucide-react'
import { saveInAppNotification } from '../utils/sendNotification'
import { notifyAdminsOfSignup } from '../utils/notifyAdmin'

const DEFAULT_WELCOME = {
  enabled: true,
  title: '🎉 Welcome to AraiFood!',
  body: 'Thanks for joining AraiFood. Start ordering your favourite food now!',
}

function SignupPage() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (!phone.trim()) { setError('Please enter your mobile number.'); return }
    if (!/^01[0-9]{9}$/.test(phone.trim())) {
      setError('Please enter a valid 11-digit mobile number.')
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
    if (!acceptedTerms) {
      setError('Please accept the Terms & Privacy Policy.')
      return
    }

    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      const userCred = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      )
      const uid = userCred.user.uid

      await setDoc(doc(db, 'users', uid), {
        email: cleanEmail,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: '',
        profileImage: '',
        role: 'customer',
        loyaltyPoints: 0,
        walletBalance: 0,
        walletTransactions: [],
        pointsHistory: [],
        createdAt: new Date(),
      })

      // 🔔 Welcome Notification
      try {
        let welcome = DEFAULT_WELCOME
        const settingsRef = doc(db, 'settings', 'notifications')
        const settingsSnap = await getDoc(settingsRef)

        if (settingsSnap.exists()) {
          const data = settingsSnap.data()
          if (data.welcomeCustomer) {
            welcome = { ...DEFAULT_WELCOME, ...data.welcomeCustomer }
          }
        }

        if (welcome.enabled !== false) {
          await saveInAppNotification(
            uid,
            welcome.title || DEFAULT_WELCOME.title,
            welcome.body || DEFAULT_WELCOME.body,
            'promotion',
            { url: '/' }
          )
        }
      } catch (notifErr) {
        console.warn('Welcome notification skipped:', notifErr)
      }

      // 🔔 Notify Admin (in background, no await)
      notifyAdminsOfSignup('customer', fullName.trim(), { uid }).catch((err) =>
        console.warn('Admin notify failed:', err)
      )

      localStorage.setItem('userRole', 'customer')
      toast.success('🎉 Welcome to AraiFood!')
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
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
      <div className="premium-bg-circle circle-three"></div>
      <div className="floating-food food-one">🍕</div>
      <div className="floating-food food-two">🍔</div>
      <div className="floating-food food-three">🍛</div>
      <div className="floating-food food-four">🍗</div>

      <div className="premium-login-card">
        <div className="premium-login-logo">
          <img
            src="/araifood-logo.png"
            alt="AraiFood Logo"
            className="premium-logo-image"
          />
          <h1>ARAIFOOD</h1>
          <p>Good Food, Good Mood</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">JOIN US</span>
          <h2>Create Account</h2>
          <p>Sign up to start ordering delicious food.</p>
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setError('')
              }}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                setError('')
              }}
              autoComplete="tel"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                autoComplete="new-password"
                required
                style={{ paddingRight: '50px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '6px',
                  display: 'flex',
                }}
                aria-label="Toggle password"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              autoComplete="new-password"
              required
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--surface-soft)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked)
                setError('')
              }}
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#059669',
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
            <span>
              I agree to the{' '}
              <span style={{ color: '#059669', fontWeight: 800 }}>
                Terms & Conditions
              </span>{' '}
              and{' '}
              <span style={{ color: '#059669', fontWeight: 800 }}>
                Privacy Policy
              </span>
            </span>
          </label>

          {error && (
            <p className="login-error" style={{ marginBottom: '12px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account?</p>
          <Link
            to="/login"
            className="signup-link"
            style={{ textDecoration: 'none' }}
          >
            Login
          </Link>
        </div>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px dashed var(--border)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Want to partner with us?
          </p>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/restaurant-signup"
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(5,150,105,0.1)',
                border: '1px solid rgba(5,150,105,0.25)',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              🏪 Restaurant
            </Link>
            <Link
              to="/rider-signup"
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#2563EB',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              🛵 Rider
            </Link>
            <Link
              to="/pharmacy-signup"
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: '#7C3AED',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              💊 Pharmacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage