import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

function PartnerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Force persistence before login
      await setPersistence(auth, browserLocalPersistence)

      // 1. Sign in with Firebase Auth
      const userCred = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      )
      const uid = userCred.user.uid

      // 2. Check if this user is in managementMembers
      // First try with UID as doc ID
      let memberDoc = await getDoc(doc(db, 'managementMembers', uid))

      // If not found by UID, we need a workaround — but our system saves
      // with auto-generated doc IDs, so we search by firebaseUid field
      if (!memberDoc.exists()) {
        // Query by firebaseUid — but rules might not allow
        // Use the fact that we stored it — try direct check
        // For safety, we'll query by email using a subquery
        const { collection, query, where, getDocs } = await import(
          'firebase/firestore'
        )
        const q = query(
          collection(db, 'managementMembers'),
          where('firebaseUid', '==', uid)
        )
        const snap = await getDocs(q)

        if (snap.empty) {
          // Try by email as fallback
          const q2 = query(
            collection(db, 'managementMembers'),
            where('email', '==', email.trim().toLowerCase())
          )
          const snap2 = await getDocs(q2)

          if (snap2.empty) {
            await auth.signOut()
            setError('No management account found with this email.')
            setLoading(false)
            return
          }

          memberDoc = snap2.docs[0]
        } else {
          memberDoc = snap.docs[0]
        }
      }

      const member = memberDoc.data()

      // 3. Check status
      if (member.status !== 'active') {
        await auth.signOut()
        setError('Your account is inactive. Please contact admin.')
        setLoading(false)
        return
      }

      // 4. Save role + permissions to localStorage
      localStorage.setItem('userRole', 'admin') // treat partner as admin-level user
      localStorage.setItem('managementRole', member.role || 'partner')
      localStorage.setItem('managementId', member.memberId || '')
      localStorage.setItem(
        'managementPermissions',
        JSON.stringify(member.permissions || {})
      )
      localStorage.setItem('managementName', member.fullName || '')
      localStorage.setItem('isPartner', 'true')

      // 5. Update lastLogin
      try {
        await updateDoc(doc(db, 'managementMembers', memberDoc.id), {
          lastLogin: serverTimestamp(),
        })
      } catch (e) {
        console.error('Failed to update lastLogin:', e)
      }

      // 6. Redirect to /admin
      window.location.href = '/admin'
    } catch (err) {
      console.error('Login error:', err)

      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.')
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
      <div className="premium-bg-circle circle-three"></div>
      <div className="floating-food food-one">👑</div>
      <div className="floating-food food-two">🤝</div>
      <div className="floating-food food-three">🏪</div>
      <div className="floating-food food-four">🎮</div>

      <div className="premium-login-card">
        <div className="premium-login-logo">
          <img
            src="/araifood-logo.png"
            alt="AraiFood Logo"
            className="premium-logo-image"
          />
          <h1>ARAIFOOD PARTNER</h1>
          <p>Management Team Portal</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">MANAGEMENT LOGIN</span>
          <h2>Welcome to Admin Panel</h2>
          <p>Login with your management credentials.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="member@araifood.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
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
                  fontSize: '18px',
                  padding: '5px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
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
            {loading ? 'Verifying...' : '🔐 Login to Admin Panel →'}
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            padding: '14px',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#1D4ED8',
            fontWeight: 600,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          💡 Only management members can login here. If you don't have an
          account, contact the super admin.
        </div>

        <div className="login-footer">
          <p>Regular customer?</p>
          <button
            type="button"
            className="signup-link"
            onClick={() => {
              window.location.href = '/login'
            }}
          >
            Go to Customer Login →
          </button>
        </div>
      </div>
    </div>
  )
}

export default PartnerLoginPage