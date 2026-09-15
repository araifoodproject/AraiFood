import { useState } from 'react'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'

function RiderLoginPage() {
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

      const riderDoc = await getDoc(doc(db, 'riders', userId))

      if (!riderDoc.exists()) {
        setError('No rider account found with this email.')
        setLoading(false)
        return
      }

      const riderData = riderDoc.data()

      if (riderData.status === 'pending') {
        toast.warning('Your account is pending approval. Please wait for Admin approval.')
        setLoading(false)
        return
      }

      if (riderData.status === 'rejected') {
        setError('Your rider application was rejected. Please contact support.')
        setLoading(false)
        return
      }

      if (riderData.status === 'approved') {
        toast.success(`Welcome back, ${riderData.fullName}!`)
        localStorage.setItem('userRole', 'rider')
        // Wait a bit for persistence to save
        setTimeout(() => {
          window.location.href = '/rider-panel'
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
      <div className="floating-food food-one">🛵</div>
      <div className="floating-food food-two">📦</div>

      <div className="premium-login-card">
        <div className="premium-login-logo">
          <img src="/araifood-logo.png" alt="AraiFood Logo" className="premium-logo-image" />
          <h1>RIDER LOGIN</h1>
          <p>Delivery Partner Portal</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">RIDER</span>
          <h2>Login to Deliver</h2>
          <p>Start earning by delivering food.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="rider@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="login-error" style={{ marginBottom: '12px' }}>{error}</p>}

          <button type="submit" className="login-submit-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Rider Login →'}
          </button>
        </form>

        <div className="login-footer">
          <p>New Rider?</p>
          <button type="button" className="signup-link" onClick={() => { window.location.href = '/rider-signup' }}>
            Create Rider Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default RiderLoginPage