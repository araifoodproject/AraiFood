import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase'

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

    setError('')
    setMessage('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      window.location.href = '/'
    } catch (error) {
      console.error('Login error:', error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.')
      } else if (
        error.code === 'auth/invalid-email'
      ) {
        setError(
          'Please enter a valid email address.'
        )
      } else if (
        error.code === 'auth/too-many-requests'
      ) {
        setError(
          'Too many login attempts. Please try again later.'
        )
      } else {
        setError(
          'Login failed. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }


  const handlePasswordReset = async () => {
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError(
        'Enter your email address first.'
      )
      return
    }

    setResetLoading(true)

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      )

      setMessage(
        'Password reset email sent. Please check your inbox.'
      )
    } catch (error) {
      console.error(
        'Password reset error:',
        error
      )

      if (
        error.code === 'auth/invalid-email'
      ) {
        setError(
          'Please enter a valid email address.'
        )
      } else if (
        error.code === 'auth/user-not-found'
      ) {
        setError(
          'No account found with this email.'
        )
      } else {
        setError(
          'Could not send reset email. Please try again.'
        )
      }
    } finally {
      setResetLoading(false)
    }
  }


  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-header">

          <span className="section-label">
            ARAIFOOD
          </span>

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to continue ordering
            your favorite food.
          </p>

        </div>


        <form
          onSubmit={handleLogin}
          autoComplete="on"
        >

          {/* Email */}

          <div className="form-group">

            <label htmlFor="login-email">
              Email Address
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setMessage('')
              }}
              autoComplete="username"
              required
            />

          </div>


          {/* Password */}

          <div className="form-group">

            <label htmlFor="login-password">
              Password
            </label>

            <div
              style={{
                position: 'relative',
              }}
            >

              <input
                id="login-password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingRight: '50px',
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '5px',
                }}
              >
                {showPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

          </div>


          {/* Forgot Password */}

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
                setShowForgot(
                  !showForgot
                )
                setError('')
                setMessage('')
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#087f70',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Forgot Password?
            </button>

          </div>


          {/* Forgot Password Box */}

          {showForgot && (
            <div
              style={{
                background: '#f4fbfa',
                border:
                  '1px solid #d9efec',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '18px',
              }}
            >

              <strong
                style={{
                  display: 'block',
                  color: '#172033',
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
                  color: '#65727e',
                  lineHeight: 1.5,
                }}
              >
                Enter your email above and
                we'll send you a password
                reset link.
              </p>

              <button
                type="button"
                onClick={
                  handlePasswordReset
                }
                disabled={resetLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '9px',
                  background: '#13a89e',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: resetLoading
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                {resetLoading
                  ? 'Sending...'
                  : 'Send Reset Email'}
              </button>

            </div>
          )}


          {/* Error */}

          {error && (
            <p
              className="login-error"
              style={{
                marginBottom: '12px',
              }}
            >
              {error}
            </p>
          )}


          {/* Success */}

          {message && (
            <p
              style={{
                marginBottom: '12px',
                color: '#087f70',
                fontWeight: '600',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          )}


          {/* Login */}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? 'Logging in...'
              : 'Login →'}
          </button>

        </form>


        {/* Footer */}

        <div className="login-footer">

          <p>
            Don't have an account?
          </p>

          <button
            type="button"
            className="signup-link"
            onClick={() => {
              window.location.href =
                '/signup'
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