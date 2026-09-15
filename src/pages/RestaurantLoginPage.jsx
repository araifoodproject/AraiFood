import { useState } from 'react'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'

function RestaurantLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 🔐 Force persistence before login
      await setPersistence(auth, browserLocalPersistence)

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const userId = userCredential.user.uid

      const restaurantDoc = await getDoc(doc(db, 'restaurants', userId))

      if (!restaurantDoc.exists()) {
        setError('No restaurant account found with this email.')
        setLoading(false)
        return
      }

      const restaurantData = restaurantDoc.data()

      if (restaurantData.status === 'pending') {
        toast.warning('Your account is pending approval. Please wait for Admin approval.')
        setLoading(false)
        return
      }

      if (restaurantData.status === 'rejected') {
        setError('Your restaurant application was rejected. Please contact support.')
        setLoading(false)
        return
      }

      if (restaurantData.status === 'approved') {
        toast.success(`Welcome back, ${restaurantData.restaurantName}!`)
        localStorage.setItem('userRole', 'restaurant')
        setTimeout(() => {
          window.location.href = '/restaurant-panel'
        }, 500)
      }
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
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
      <div className="floating-food food-one">🏪</div>
      <div className="floating-food food-two">🍽️</div>

      <div className="premium-login-card">
        <div className="premium-login-logo">
          <img src="/araifood-logo.png" alt="AraiFood Logo" className="premium-logo-image" />
          <h1>RESTAURANT LOGIN</h1>
          <p>Partner With Us</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">PARTNER</span>
          <h2>Login to Manage</h2>
          <p>Manage your restaurant & orders.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="restaurant@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

          <button type="submit" className="login-submit-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Restaurant Login →'}
          </button>
        </form>

        <div className="login-footer">
          <p>New Restaurant?</p>
          <button type="button" className="signup-link" onClick={() => { window.location.href = '/restaurant-signup' }}>
            Create Restaurant Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantLoginPage