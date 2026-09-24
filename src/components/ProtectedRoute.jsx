import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

function ProtectedRoute({
  allowedRoles = [],
  requiredPermission = null,
  redirectTo = '/login',
  children,
}) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isPartner, setIsPartner] = useState(false)
  const [permissions, setPermissions] = useState({})
  const [managementRole, setManagementRole] = useState(null)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return

      // ============================================================
      // Debug logs
      // ============================================================
      console.log('=== ProtectedRoute Auth Check ===')
      console.log('User:', currentUser?.email || 'NO USER')
      console.log('UID:', currentUser?.uid || 'NO UID')
      console.log('localStorage userRole:', localStorage.getItem('userRole'))
      console.log('localStorage isPartner:', localStorage.getItem('isPartner'))

      if (!currentUser) {
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }

      setUser(currentUser)

      // ============================================================
      // STEP 1: Admin email check FIRST
      // ============================================================
      if (currentUser.email === 'admin@araifood.com') {
        console.log('ROLE DETECTED: admin (email)')
        if (!isMounted) return
        setRole('admin')
        setIsPartner(false)
        setPermissions({})
        setManagementRole(null)
        localStorage.setItem('userRole', 'admin')
        localStorage.removeItem('isPartner')
        localStorage.removeItem('managementRole')
        localStorage.removeItem('managementPermissions')
        setLoading(false)
        return
      }

      // ============================================================
      // STEP 2: Partner (management member) check
      // ============================================================
      try {
        let memberData = null

        const partnerQuery = query(
          collection(db, 'managementMembers'),
          where('firebaseUid', '==', currentUser.uid)
        )
        const partnerSnap = await getDocs(partnerQuery)

        if (!partnerSnap.empty) {
          memberData = partnerSnap.docs[0].data()
        } else {
          const emailQuery = query(
            collection(db, 'managementMembers'),
            where('email', '==', currentUser.email?.toLowerCase())
          )
          const emailSnap = await getDocs(emailQuery)
          if (!emailSnap.empty) {
            memberData = emailSnap.docs[0].data()
          }
        }

        if (memberData) {
          if (memberData.status !== 'active') {
            console.log('Partner is inactive — signing out')
            await auth.signOut()
            if (!isMounted) return
            setUser(null)
            setRole(null)
            setLoading(false)
            return
          }

          console.log('ROLE DETECTED: admin (partner)')
          if (!isMounted) return
          setRole('admin')
          setIsPartner(true)
          setPermissions(memberData.permissions || {})
          setManagementRole(memberData.role || 'partner')

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
          localStorage.setItem('managementId', memberData.memberId || '')
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Partner check error:', err)
      }

      // ============================================================
      // STEP 3: users/{uid} doc check
      // ============================================================
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          const userRole = data.role || 'customer'
          console.log('ROLE DETECTED from users doc:', userRole)

          if (
            userRole === 'customer' ||
            userRole === 'restaurant' ||
            userRole === 'rider'
          ) {
            if (!isMounted) return
            setRole(userRole)
            setIsPartner(false)
            setPermissions({})
            setManagementRole(null)
            localStorage.setItem('userRole', userRole)
            localStorage.removeItem('isPartner')
            localStorage.removeItem('managementRole')
            localStorage.removeItem('managementPermissions')
            setLoading(false)
            return
          }
        } else {
          console.log('No users doc found — defaulting to customer')
        }
      } catch (err) {
        console.error('users doc check error:', err)
      }

      // ============================================================
      // STEP 4: Default — customer
      // ============================================================
      console.log('ROLE DETECTED: customer (default)')
      if (!isMounted) return
      setRole('customer')
      setIsPartner(false)
      setPermissions({})
      setManagementRole(null)
      localStorage.setItem('userRole', 'customer')
      localStorage.removeItem('isPartner')
      localStorage.removeItem('managementRole')
      localStorage.removeItem('managementPermissions')
      setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="panel-loading">
        <div className="panel-loading-spinner"></div>
        <p>Checking access...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  // Role check
  if (!allowedRoles.includes(role)) {
    console.log('Access denied for role:', role, '— redirecting')
    if (role === 'restaurant') {
      return <Navigate to="/restaurant-panel" replace />
    }
    if (role === 'rider') {
      return <Navigate to="/rider-panel" replace />
    }
    if (role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  // Permission check for partners
  if (
    requiredPermission &&
    isPartner &&
    managementRole !== 'admin' &&
    !permissions[requiredPermission]
  ) {
    return (
      <div
        className="admin-layout"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '40px 32px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-glass)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}
          >
            Access Denied
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
              lineHeight: 1.6,
            }}
          >
            You don't have permission to access this section. Please contact
            your admin.
          </p>
          <button
            onClick={() => {
              window.location.href = '/admin'
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute