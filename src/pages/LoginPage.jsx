import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email.trim().toLowerCase())
    console.log('Password length:', password.length)

    setError('')
    setMessage('')
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    try {
      // ============================================================
      // STEP 1: FORCE SIGN OUT any existing session
      // ============================================================
      try {
        if (auth.currentUser) {
          console.log('Signing out existing user:', auth.currentUser.email)
          await signOut(auth)
        }
      } catch (signOutErr) {
        console.warn('Sign out warning:', signOutErr)
      }

      // ============================================================
      // STEP 2: CLEAR all role-related localStorage
      // ============================================================
      localStorage.removeItem('userRole')
      localStorage.removeItem('isPartner')
      localStorage.removeItem('managementRole')
      localStorage.removeItem('managementPermissions')
      localStorage.removeItem('managementName')
      localStorage.removeItem('managementId')

      // ============================================================
      // STEP 3: SET persistence
      // ============================================================
      await setPersistence(auth, browserLocalPersistence)

      // ============================================================
      // STEP 4: Sign in
      // ============================================================
      const userCred = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      )

      const uid = userCred.user.uid

      console.log('=== LOGIN SUCCESS ===')
      console.log('Logged in as:', userCred.user.email)
      console.log('UID:', uid)

      // ============================================================
      // STEP 5: Determine role
      // ============================================================

      // 5a. Admin email check
      if (cleanEmail === 'admin@araifood.com') {
        console.log('Role: ADMIN (email match)')
        localStorage.setItem('userRole', 'admin')
        window.location.href = '/admin'
        return
      }

      // 5b. Partner check
      try {
        let memberData = null

        const partnerQuery = query(
          collection(db, 'managementMembers'),
          where('firebaseUid', '==', uid)
        )
        const partnerSnap = await getDocs(partnerQuery)

        if (!partnerSnap.empty) {
          memberData = partnerSnap.docs[0].data()
        } else {
          const emailQuery = query(
            collection(db, 'managementMembers'),
            where('email', '==', cleanEmail)
          )
          const emailSnap = await getDocs(emailQuery)
          if (!emailSnap.empty) {
            memberData = emailSnap.docs[0].data()
          }
        }

        if (memberData && memberData.status === 'active') {
          console.log('Role: ADMIN (partner)')
          localStorage.setItem('userRole', 'admin')
          localStorage.setItem('isPartner', 'true')
          localStorage.setItem(
            'managementRole',
            memberData.role || 'partner'
          )
          localStorage.setItem(
            'managementPermissions',
            JSON.stringify(memberData.permissions || {})
          )
          localStorage.setItem(
            'managementName',
            memberData.fullName || ''
          )
          localStorage.setItem(
            'managementId',
            memberData.memberId || ''
          )
          window.location.href = '/admin'
          return
        }
      } catch (partnerErr) {
        console.error('Partner check error:', partnerErr)
      }

      // 5c. Firestore users/{uid} doc check
      try {
        const userDocRef = doc(db, 'users', uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          const realRole = data.role || 'customer'
          console.log('Role: from Firestore users doc:', realRole)

          localStorage.setItem('userRole', realRole)

          if (!data.email) {
            await setDoc(
              userDocRef,
              {
                email: cleanEmail,
                role: realRole,
              },
              { merge: true }
            )
          }
        } else {
          console.log('Role: CUSTOMER (new user doc created)')
          await setDoc(userDocRef, {
            email: cleanEmail,
            fullName: '',
            phone: '',
            address: '',
            profileImage: '',
            role: 'customer',
            loyaltyPoints: 0,
            walletBalance: 0,
            walletTransactions: [],
            pointsHistory: [],
            createdAt: new Date(),
          })
          localStorage.setItem('userRole', 'customer')
        }
      } catch (userDocErr) {
        console.error('User doc check error:', userDocErr)
        localStorage.setItem('userRole', 'customer')
      }

      // ============================================================
      // STEP 6: Redirect to Home
      // ============================================================
      console.log('Redirecting to home...')
      window.location.href = '/'
    } catch (err) {
      console.error('=== LOGIN FAILED ===')
      console.error('Code:', err.code)
      console.error('Message:', err.message)

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

  const handlePasswordReset = async () => {
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage('Password reset email sent. Please check your inbox.')
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else {
        setError('Could not send reset email. Please try again.')
      }
    } finally {
      setResetLoading(false)
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
          <span className="section-label">WELCOME BACK</span>
          <h2>Login to Continue</h2>
          <p>Your delicious food is waiting for you.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setMessage('')
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

          <div
            style={{
              textAlign: 'right',
              marginTop: '-8px',
              marginBottom: '15px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowForgot(!showForgot)
                setError('')
                setMessage('')
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#13a89e',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Forgot Password?
            </button>
          </div>

          {showForgot && (
            <div
              style={{
                background: 'rgba(19, 168, 158, 0.1)',
                border: '1px solid rgba(19, 168, 158, 0.3)',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '18px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#13a89e',
                  marginBottom: '6px',
                }}
              >
                Reset your password
              </strong>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: '12px',
                  fontSize: '13px',
                }}
              >
                Enter your email above and we'll send you a reset link.
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '9px',
                  background: '#13a89e',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          )}

          {error && (
            <p className="login-error" style={{ marginBottom: '12px' }}>
              {error}
            </p>
          )}
          {message && (
            <p
              style={{
                marginBottom: '12px',
                color: '#13a89e',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account?</p>
          <button
            type="button"
            className="signup-link"
            onClick={() => {
              window.location.href = '/signup'
            }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage