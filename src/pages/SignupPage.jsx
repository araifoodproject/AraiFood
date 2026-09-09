import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

function SignupPage() {
  const [role, setRole] = useState('customer') // customer, rider, restaurant
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      localStorage.setItem('userRole', role)
      alert(`Account created successfully as ${role}!`)
      window.location.href = '/'
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak.')
      } else {
        setError('Sign up failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="premium-login-page">
      {/* Animated Background Elements */}
      <div className="premium-bg-circle circle-one"></div>
      <div className="premium-bg-circle circle-two"></div>
      <div className="premium-bg-circle circle-three"></div>
      
      {/* Floating Food Emojis */}
      <div className="floating-food food-one">🍕</div>
      <div className="floating-food food-two">🍔</div>
      <div className="floating-food food-three">🍛</div>
      <div className="floating-food food-four">🍗</div>

      {/* Glass Card */}
      <div className="premium-login-card">
        <div className="premium-login-logo">
          <span className="premium-logo-icon">👨‍🍳</span>
          <h1>ARAIFOOD</h1>
          <p>Good Food, Good Mood</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">JOIN US</span>
          <h2>Create Account</h2>
          <p>Sign up to start your journey.</p>
        </div>

        {/* Role Selection */}
        <div className="role-selection">
          <button 
            type="button"
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            👤 Customer
          </button>
          <button 
            type="button"
            className={`role-btn ${role === 'rider' ? 'active' : ''}`}
            onClick={() => setRole('rider')}
          >
            🛵 Delivery Rider
          </button>
          <button 
            type="button"
            className={`role-btn ${role === 'restaurant' ? 'active' : ''}`}
            onClick={() => setRole('restaurant')}
          >
            🏪 Restaurant
          </button>
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : `Create ${role} Account →`}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account?</p>
          <button type="button" className="signup-link" onClick={() => { window.location.href = '/login' }}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignupPage