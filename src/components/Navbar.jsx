import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
      }
    )

    return () => unsubscribe()
  }, [])

  const goToRestaurants = (e) => {
    e.preventDefault()

    window.history.pushState({}, '', '/restaurants')

    window.dispatchEvent(
      new PopStateEvent('popstate')
    )

    setMenuOpen(false)
  }

  const goToLogin = () => {
    setMenuOpen(false)
    window.location.href = '/login'
  }

  const goToSignup = () => {
    setMenuOpen(false)
    window.location.href = '/signup'
  }

  const goToAccount = () => {
    setMenuOpen(false)
    window.location.href = '/account'
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)

      setMenuOpen(false)

      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
      alert('Logout failed. Please try again.')
    }
  }

  return (
    <nav
      style={{
        width: '100%',
        minHeight: '70px',
        padding: '0 16px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        position: 'relative',
        zIndex: 99999,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >

      {/* Logo */}

      <button
        onClick={() => {
          setMenuOpen(false)
          window.location.href = '/'
        }}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
        }}
      >
        <h2
          style={{
            margin: 0,
            color: '#13a89e',
            fontSize: '28px',
            fontWeight: '800',
          }}
        >
          AraiFood
        </h2>
      </button>


      {/* Desktop Menu */}

      <div
        className="desktop-navbar-menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
        }}
      >

        <a
          href="/"
          style={navLink}
        >
          Home
        </a>

        <a
          href="/restaurants"
          onClick={goToRestaurants}
          style={navLink}
        >
          Restaurants
        </a>

        <a
          href="/offers"
          style={navLink}
        >
          Offers
        </a>

        <a
          href="/contact"
          style={navLink}
        >
          Contact
        </a>

      </div>


      {/* Desktop Authentication */}

      <div
        className="desktop-navbar-buttons"
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >

        {!user ? (
          <>
            <button
              onClick={goToLogin}
              style={outlineButton}
            >
              Login
            </button>

            <button
              onClick={goToSignup}
              style={primaryButton}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <button
              onClick={goToAccount}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #e1eeee',
                background: '#f7fbfb',
                padding: '8px 12px',
                borderRadius: '10px',
                color: '#172033',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                maxWidth: '190px',
              }}
            >
              <span
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#e8f7f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                👤
              </span>

              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </span>
            </button>

            <button
              onClick={handleLogout}
              style={outlineButton}
            >
              Logout
            </button>
          </>
        )}

      </div>


      {/* Mobile Menu Button */}

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'none',
          width: '44px',
          height: '44px',
          border: 'none',
          borderRadius: '10px',
          background: '#13a89e',
          color: '#fff',
          fontSize: '26px',
          cursor: 'pointer',
        }}
        className="mobile-navbar-button"
      >
        {menuOpen ? '×' : '☰'}
      </button>


      {/* Mobile Menu */}

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            left: 0,
            width: '100%',
            background: '#fff',
            padding: '15px 18px 20px',
            boxSizing: 'border-box',
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
            zIndex: 999999,
          }}
        >

          <a
            href="/"
            onClick={() => setMenuOpen(false)}
            style={mobileLink}
          >
            Home
          </a>

          <a
            href="/restaurants"
            onClick={goToRestaurants}
            style={mobileLink}
          >
            Restaurants
          </a>

          <a
            href="/offers"
            onClick={() => setMenuOpen(false)}
            style={mobileLink}
          >
            Offers
          </a>

          <a
            href="/contact"
            onClick={() => setMenuOpen(false)}
            style={mobileLink}
          >
            Contact
          </a>


          {/* Mobile Authentication */}

          <div
            style={{
              marginTop: '15px',
            }}
          >

            {!user ? (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                }}
              >

                <button
                  style={mobileButton}
                  onClick={goToLogin}
                >
                  Login
                </button>

                <button
                  style={{
                    ...mobileButton,
                    background: '#13a89e',
                    color: '#fff',
                    borderColor: '#13a89e',
                  }}
                  onClick={goToSignup}
                >
                  Sign Up
                </button>

              </div>
            ) : (
              <div>

                <button
                  onClick={goToAccount}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: '1px solid #e1eeee',
                    borderRadius: '10px',
                    background: '#f7fbfb',
                    color: '#172033',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >

                  <span
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#e8f7f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    👤
                  </span>

                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    My Account
                  </span>

                </button>


                <button
                  style={{
                    ...mobileButton,
                    width: '100%',
                    marginTop: '10px',
                    background: '#fff',
                    color: '#087f70',
                    borderColor: '#13a89e',
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>
      )}

    </nav>
  )
}


const navLink = {
  color: '#172033',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
}


const outlineButton = {
  padding: '10px 20px',
  borderRadius: '10px',
  border: '1px solid #13a89e',
  background: '#ffffff',
  color: '#087f70',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
}


const primaryButton = {
  padding: '10px 20px',
  borderRadius: '10px',
  border: '1px solid #13a89e',
  background: '#13a89e',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
}


const mobileLink = {
  display: 'block',
  padding: '15px 5px',
  borderBottom: '1px solid #eee',
  color: '#172033',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
}


const mobileButton = {
  flex: 1,
  height: '44px',
  border: '1px solid #d6dfdf',
  borderRadius: '9px',
  background: '#fff',
  color: '#172033',
  fontWeight: '700',
  cursor: 'pointer',
}


export default Navbar