// ============================================================
// src/pages/PharmacyLoginPage.jsx
// ============================================================

import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'

function PharmacyLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await setPersistence(auth, browserLocalPersistence)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      const userId = userCredential.user.uid

      const pharmDoc = await getDoc(doc(db, 'pharmacies', userId))
      if (!pharmDoc.exists()) {
        setError('No pharmacy account found with this email.')
        setLoading(false)
        return
      }

      const data = pharmDoc.data()

      if (data.status === 'pending') {
        toast.warning(
          'Your account is pending approval. Please wait for Admin approval.'
        )
        setLoading(false)
        return
      }
      if (data.status === 'rejected') {
        setError(
          'Your pharmacy application was rejected. Please contact support.'
        )
        setLoading(false)
        return
      }

      if (data.status === 'approved') {
        toast.success(`Welcome back, ${data.pharmacyName}!`)
        localStorage.setItem('userRole', 'pharmacy')
        setTimeout(() => {
          window.location.href = '/pharmacy-panel'
        }, 500)
      }
    } catch (error) {
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.')
      } else {
        setError('Login failed. Please try again.')
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

      <div className="premium-login-card">
        <div className="premium-login-logo">
          <img
            src="/araifood-logo-transparent.png"
            alt="AraiFood Logo"
            className="premium-logo-image"
          />
          <h1>PHARMACY LOGIN</h1>
          <p>Partner With AraiFood</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">PHARMACY PARTNER</span>
          <h2>Login to Manage</h2>
          <p>Manage your pharmacy & medicines.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="pharmacy@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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
            {loading ? 'Logging in...' : 'Pharmacy Login →'}
          </button>
        </form>

        <div className="login-footer">
          <p>New Pharmacy?</p>
          <button
            type="button"
            className="signup-link"
            onClick={() => {
              window.location.href = '/pharmacy-signup'
            }}
          >
            Create Pharmacy Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default PharmacyLoginPage