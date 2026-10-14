// ============================================================
// src/pages/LoginPage.jsx
// V3 — Bilingual (BN/EN)
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useLanguage } from '../i18n/LanguageContext'
import { Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const { t } = useLanguage()
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

    const cleanEmail = email.trim().toLowerCase()

    try {
      try {
        if (auth.currentUser) await signOut(auth)
      } catch (err) {
        console.warn('Sign out warning:', err)
      }

      localStorage.removeItem('userRole')
      localStorage.removeItem('isPartner')
      localStorage.removeItem('managementRole')
      localStorage.removeItem('managementPermissions')
      localStorage.removeItem('managementName')
      localStorage.removeItem('managementId')

      await setPersistence(auth, browserLocalPersistence)

      const userCred = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      )
      const uid = userCred.user.uid

      // Admin email
      if (cleanEmail === 'admin@araifood.com') {
        localStorage.setItem('userRole', 'admin')
        window.location.href = '/admin'
        return
      }

      // Management member
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
          if (!emailSnap.empty) memberData = emailSnap.docs[0].data()
        }

        if (memberData && memberData.status === 'active') {
          localStorage.setItem('userRole', 'admin')
          localStorage.setItem('isPartner', 'true')
          localStorage.setItem('managementRole', memberData.role || 'partner')
          localStorage.setItem(
            'managementPermissions',
            JSON.stringify(memberData.permissions || {})
          )
          localStorage.setItem('managementName', memberData.fullName || '')
          localStorage.setItem('managementId', memberData.memberId || '')
          window.location.href = '/admin'
          return
        }
      } catch (err) {
        console.error('Partner check error:', err)
      }

      // Pharmacy
      try {
        const pharmDoc = await getDoc(doc(db, 'pharmacies', uid))
        if (pharmDoc.exists()) {
          localStorage.setItem('userRole', 'pharmacy')
          window.location.href = '/pharmacy-panel'
          return
        }
      } catch (err) {
        console.error('Pharmacy check error:', err)
      }

      // Restaurant
      try {
        const restDoc = await getDoc(doc(db, 'restaurants', uid))
        if (restDoc.exists()) {
          localStorage.setItem('userRole', 'restaurant')
          window.location.href = '/restaurant-panel'
          return
        }
      } catch (err) {
        console.error('Restaurant check error:', err)
      }

      // Rider
      try {
        const riderDoc = await getDoc(doc(db, 'riders', uid))
        if (riderDoc.exists()) {
          localStorage.setItem('userRole', 'rider')
          window.location.href = '/rider-panel'
          return
        }
      } catch (err) {
        console.error('Rider check error:', err)
      }

      // Customer
      try {
        const userDocRef = doc(db, 'users', uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          const realRole = data.role || 'customer'
          localStorage.setItem('userRole', realRole)
          if (!data.email) {
            await setDoc(
              userDocRef,
              { email: cleanEmail, role: realRole },
              { merge: true }
            )
          }
        } else {
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
      } catch (err) {
        console.error('User doc check error:', err)
        localStorage.setItem('userRole', 'customer')
      }

      window.location.href = '/'
    } catch (err) {
      console.error('Login failed:', err)
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError(t('login.errInvalid'))
      } else if (err.code === 'auth/invalid-email') {
        setError(t('login.errInvalidEmail'))
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('login.errTooMany'))
      } else {
        setError(t('login.errGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError(t('login.errEnterEmail'))
      return
    }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage(t('login.resetSent'))
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setError(t('login.errInvalidEmail'))
      } else if (error.code === 'auth/user-not-found') {
        setError(t('login.errNoAccount'))
      } else {
        setError(t('login.errResetFailed'))
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
            src="/araifood-logo-transparent.png"
            alt="AraiFood Logo"
            className="premium-logo-image"
          />
          <h1>ARAIFOOD</h1>
          <p>Good Food, Good Mood</p>
        </div>

        <div className="premium-login-header">
          <span className="section-label">{t('login.welcomeBack')}</span>
          <h2>{t('login.title')}</h2>
          <p>{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>{t('login.emailLabel')}</label>
            <input
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setMessage('')
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('login.passwordLabel')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                autoComplete="current-password"
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
                color: '#059669',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              {t('login.forgotPassword')}
            </button>
          </div>

          {showForgot && (
            <div
              style={{
                background: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.25)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#059669',
                  marginBottom: '6px',
                  fontSize: '14px',
                }}
              >
                {t('login.resetTitle')}
              </strong>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {t('login.resetDesc')}
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                style={{
                  width: '100%',
                  padding: '11px',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  opacity: resetLoading ? 0.7 : 1,
                }}
              >
                {resetLoading ? t('login.sending') : t('login.sendReset')}
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
                color: '#059669',
                fontWeight: 600,
                fontSize: '13.5px',
              }}
            >
              ✓ {message}
            </p>
          )}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? t('login.submitting') : t('login.submit') + ' →'}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('login.noAccount')}</p>
          <Link
            to="/signup"
            className="signup-link"
            style={{ textDecoration: 'none' }}
          >
            {t('login.createAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage