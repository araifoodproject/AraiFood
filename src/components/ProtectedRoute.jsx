import { useEffect, useState, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

function ProtectedRoute({ allowedRoles = [], redirectTo = '/login', children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const checkedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return

      if (!currentUser) {
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }

      // 🔥 Already checked once — don't re-run Firestore reads
      if (checkedRef.current) {
        setUser(currentUser)
        setLoading(false)
        return
      }

      setUser(currentUser)

      let detectedRole = 'customer'

      try {
        // Admin email check FIRST
        if (currentUser.email === 'admin@araifood.com') {
          detectedRole = 'admin'
        } else {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const data = userDoc.data()
            detectedRole = data.role || 'customer'
          } else {
            const restDoc = await getDoc(doc(db, 'restaurants', currentUser.uid))
            if (restDoc.exists()) {
              detectedRole = 'restaurant'
            } else {
              const riderDoc = await getDoc(doc(db, 'riders', currentUser.uid))
              if (riderDoc.exists()) {
                detectedRole = 'rider'
              } else {
                detectedRole = 'customer'
              }
            }
          }
        }
      } catch (error) {
        console.error('Role detection error:', error)
        detectedRole = localStorage.getItem('userRole') || 'customer'
      }

      if (!isMounted) return

      checkedRef.current = true
      setRole(detectedRole)
      localStorage.setItem('userRole', detectedRole)
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

  if (allowedRoles.includes(role)) {
    return children
  }

  // Redirect based on role
  if (role === 'restaurant') return <Navigate to="/restaurant-panel" replace />
  if (role === 'rider') return <Navigate to="/rider-panel" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/" replace />
}

export default ProtectedRoute