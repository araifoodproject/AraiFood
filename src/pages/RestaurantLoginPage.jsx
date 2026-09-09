import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

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
      await signInWithEmailAndPassword(auth, email.trim(), password)
      localStorage.setItem('userRole', 'restaurant')
      alert('Restaurant Login Successful!')
      window.location.href = '/'
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
      <div className="floating-food food-one">🍛</div>
      <div className="floating-food food-two">🏪</div>

      <div className="premium-login-card">
        <div className="premium-login-logo">
          <span className="premium-logo-icon">🏪</span>
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
            <input
              type="email"
              placeholder="restaurant@email.com"
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

          {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Restaurant Login →'}
          </button>
        </form>

        <div className="login-footer">
          <p>New Restaurant?</p>
          <button type="button" className="signup-link" onClick={() => { window.location.href = '/signup' }}>
            Create Restaurant Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantLoginPage