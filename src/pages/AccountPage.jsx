import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

function AccountPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [phoneVerification, setPhoneVerification] =
    useState(false)

  const [verificationId, setVerificationId] =
    useState('')

  const [otp, setOtp] = useState('')

  const [sendingOtp, setSendingOtp] =
    useState(false)

  const [verifyingOtp, setVerifyingOtp] =
    useState(false)

  const [phoneVerified, setPhoneVerified] =
    useState(false)


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)

        if (currentUser) {
          try {
            const userRef = doc(
              db,
              'users',
              currentUser.uid
            )

            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
              const data = userSnap.data()

              setFullName(data.fullName || '')
              setPhone(data.phone || '')
              setAddress(data.address || '')
              setProfileImage(
                data.profileImage || ''
              )
            }

            setPhoneVerified(
              !!currentUser.phoneNumber
            )

          } catch (error) {
            console.error(
              'Error loading profile:',
              error
            )
          }
        }

        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])


  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        return window.recaptchaVerifier
      }

      const verifier =
        new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'normal',
            callback: () => {},
            'expired-callback': () => {
              setMessage(
                'reCAPTCHA expired. Please try again.'
              )
            },
          }
        )

      window.recaptchaVerifier = verifier

      return verifier

    } catch (error) {
      console.error(
        'reCAPTCHA setup error:',
        error
      )

      setMessage(
        'Could not load security verification.'
      )

      return null
    }
  }


  const formatBangladeshPhone = (
    value
  ) => {
    let cleaned =
      value.replace(/\D/g, '')

    if (
      cleaned.startsWith('00880')
    ) {
      cleaned =
        cleaned.substring(2)
    }

    if (
      cleaned.startsWith('880')
    ) {
      return `+${cleaned}`
    }

    if (
      cleaned.startsWith('01') &&
      cleaned.length === 11
    ) {
      return `+88${cleaned}`
    }

    return value.trim()
  }


  const sendPhoneOtp = async () => {
    setMessage('')

    if (!user) {
      setMessage(
        'Please login first.'
      )
      return
    }

    if (!phone.trim()) {
      setMessage(
        'Please enter your phone number first.'
      )
      return
    }

    const formattedPhone =
      formatBangladeshPhone(phone)

    if (
      !formattedPhone.startsWith('+') ||
      formattedPhone.length < 10
    ) {
      setMessage(
        'Please enter a valid phone number.'
      )
      return
    }

    setSendingOtp(true)

    try {
      const verifier =
        setupRecaptcha()

      if (!verifier) {
        setSendingOtp(false)
        return
      }

      const provider =
        new PhoneAuthProvider(auth)

      const verification =
        await provider.verifyPhoneNumber(
          {
            phoneNumber:
              formattedPhone,
            session: user,
          },
          verifier
        )

      setVerificationId(
        verification
      )

      setPhoneVerification(true)

      setMessage(
        'OTP sent successfully. Check your phone.'
      )

    } catch (error) {
      console.error('SEND OTP ERROR:', error)

      setMessage(
        `OTP Error: ${error.code || 'unknown'} — ${
          error.message || 'Unknown error'
        }`
      )

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
        } catch (e) {
          console.error(e)
        }

        window.recaptchaVerifier = null
      }

    } finally {
      setSendingOtp(false)
    }
  }
  const verifyPhoneOtp = async () => {
    setMessage('')

    if (!otp.trim()) {
      setMessage(
        'Please enter the OTP.'
      )
      return
    }

    if (!verificationId) {
      setMessage(
        'Please request a new OTP.'
      )
      return
    }

    if (!user) return

    setVerifyingOtp(true)

    try {
      const credential =
        PhoneAuthProvider.credential(
          verificationId,
          otp.trim()
        )

      await linkWithCredential(
        user,
        credential
      )

      setPhoneVerified(true)
      setPhoneVerification(false)

      await setDoc(
        doc(db, 'users', user.uid),
        {
          phone:
            formatBangladeshPhone(
              phone
            ),
          phoneVerified: true,
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      )

      setOtp('')
      setVerificationId('')

      setMessage(
        'Phone number verified successfully!'
      )

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
        } catch (error) {
          console.error(error)
        }

        window.recaptchaVerifier = null
      }

    } catch (error) {
      console.error(
        'OTP verification error:',
        error
      )

      if (
        error.code ===
        'auth/invalid-verification-code'
      ) {
        setMessage(
          'Invalid OTP. Please check the code.'
        )
      } else if (
        error.code ===
        'auth/credential-already-in-use'
      ) {
        setMessage(
          'This phone number is already linked to another account.'
        )
      } else if (
        error.code ===
        'auth/provider-already-linked'
      ) {
        setPhoneVerified(true)
        setPhoneVerification(false)

        setMessage(
          'This phone number is already verified.'
        )
      } else {
        setMessage(
          'Could not verify phone number. Please try again.'
        )
      }

    } finally {
      setVerifyingOtp(false)
    }
  }


  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage(
        'Please select an image file.'
      )
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas =
          document.createElement(
            'canvas'
          )

        const maxSize = 400

        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height =
              height *
              (maxSize / width)

            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width =
              width *
              (maxSize / height)

            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        const context =
          canvas.getContext('2d')

        context.drawImage(
          img,
          0,
          0,
          width,
          height
        )

        const compressedImage =
          canvas.toDataURL(
            'image/jpeg',
            0.7
          )

        setProfileImage(
          compressedImage
        )

        setMessage('')
      }

      img.src =
        event.target.result
    }

    reader.readAsDataURL(file)
  }


  const saveProfile = async () => {
    if (!fullName.trim()) {
      setMessage(
        'Please enter your full name.'
      )
      return
    }

    if (!phone.trim()) {
      setMessage(
        'Please enter your phone number.'
      )
      return
    }

    if (!address.trim()) {
      setMessage(
        'Please enter your delivery address.'
      )
      return
    }

    if (!user) return

    setSaving(true)
    setMessage('')

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          fullName:
            fullName.trim(),

          phone:
            formatBangladeshPhone(
              phone
            ),

          address:
            address.trim(),

          email: user.email,

          profileImage:
            profileImage,

          phoneVerified:
            phoneVerified,

          updatedAt:
            new Date(),
        },
        {
          merge: true,
        }
      )

      setMessage(
        'Profile saved successfully!'
      )

    } catch (error) {
      console.error(
        'Error saving profile:',
        error
      )

      setMessage(
        'Could not save profile. Please try again.'
      )

    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="account-page">
        <div className="account-card">
          <p>
            Loading account...
          </p>
        </div>
      </div>
    )
  }


  if (!user) {
    return (
      <div className="account-page">
        <div className="account-card">

          <div className="account-icon">
            👤
          </div>

          <h1>
            Please Login
          </h1>

          <p>
            You need to login to
            view your account.
          </p>

          <button
            className="account-primary-button"
            onClick={() => {
              window.location.href =
                '/login'
            }}
          >
            Login →
          </button>

        </div>
      </div>
    )
  }


  return (
    <div className="account-page">

      <div className="account-container">

        <div className="account-header">

          <span className="section-label">
            ARAIFOOD
          </span>

          <h1>
            My Account
          </h1>

          <p>
            Manage your AraiFood account
            and delivery information.
          </p>

        </div>

        <div className="account-card">
          {/* Profile */}

          <div
            className="account-profile"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >

            <div
              className="account-avatar"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e8f7f5',
                fontSize: '42px',
              }}
            >

              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                '👤'
              )}

            </div>


            <label
              style={{
                marginTop: '12px',
                padding: '9px 16px',
                borderRadius: '9px',
                background: '#13a89e',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              📷 Choose Photo

              <input
                type="file"
                accept="image/*"
                style={{
                  display: 'none',
                }}
                onChange={
                  handlePhotoChange
                }
              />

            </label>


            <div
              style={{
                width: '100%',
                marginTop: '15px',
              }}
            >

              <h2>
                {fullName ||
                  'Welcome back!'}
              </h2>

              <p>
                {user.email}
              </p>

            </div>

          </div>


          <div className="account-divider"></div>


          {/* Full Name */}

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(
                  e.target.value
                )
                setMessage('')
              }}
            />

          </div>


          {/* Phone */}

          <div className="form-group">

            <label>
              Phone Number
            </label>

            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => {
                setPhone(
                  e.target.value
                )

                setPhoneVerified(false)
                setMessage('')
              }}
            />


            {phoneVerified ? (
              <p
                style={{
                  marginTop: '8px',
                  color: '#087f70',
                  fontSize: '13px',
                  fontWeight: '700',
                }}
              >
                ✓ Phone number verified
              </p>
            ) : (
              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={sendingOtp}
                style={{
                  marginTop: '10px',
                  padding: '9px 14px',
                  borderRadius: '9px',
                  border:
                    '1px solid #13a89e',
                  background: '#fff',
                  color: '#087f70',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {sendingOtp
                  ? 'Sending OTP...'
                  : 'Verify Phone'}
              </button>
            )}

          </div>


          {/* OTP */}

          {phoneVerification && (
            <div
              style={{
                marginBottom: '18px',
                padding: '15px',
                borderRadius: '12px',
                background: '#f4fbfa',
                border:
                  '1px solid #d9efec',
              }}
            >

              <strong>
                Enter OTP
              </strong>

              <p
                style={{
                  fontSize: '13px',
                  color: '#65727e',
                }}
              >
                We sent a verification
                code to your phone.
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(
                      /\D/g,
                      ''
                    )
                  )
                }
              />

              <button
                type="button"
                onClick={verifyPhoneOtp}
                disabled={verifyingOtp}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '11px',
                  border: 'none',
                  borderRadius: '9px',
                  background: '#13a89e',
                  color: '#fff',
                  fontWeight: '700',
                }}
              >
                {verifyingOtp
                  ? 'Verifying...'
                  : 'Verify OTP'}
              </button>

            </div>
          )}


          {/* reCAPTCHA */}

          <div
            id="recaptcha-container"
            style={{
              marginTop: '10px',
              marginBottom: '10px',
            }}
          ></div>


          {/* Address */}

          <div className="form-group">

            <label>
              Delivery Address
            </label>

            <textarea
              placeholder="Enter your full delivery address"
              rows="4"
              value={address}
              onChange={(e) => {
                setAddress(
                  e.target.value
                )
                setMessage('')
              }}
            ></textarea>

          </div>


          {/* Save */}

          <button
            className="account-primary-button"
            onClick={saveProfile}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save Profile'}
          </button>


          {message && (
            <p
              style={{
                marginTop: '12px',
                color:
                  message.includes(
                    'successfully'
                  )
                    ? '#087f70'
                    : '#d93025',
                fontWeight: '600',
              }}
            >
              {message}
            </p>
          )}


          <div className="account-divider"></div>


          {/* Account Information */}

          <div className="account-info">

            <div className="account-info-item">
              <span>
                📧 Email
              </span>

              <strong>
                {user.email}
              </strong>
            </div>


            <div className="account-info-item">
              <span>
                📱 Phone
              </span>

              <strong>
                {phoneVerified
                  ? '✓ Verified'
                  : 'Not verified'}
              </strong>
            </div>


            <div className="account-info-item">
              <span>
                🆔 Account ID
              </span>

              <strong>
                {user.uid.substring(
                  0,
                  12
                )}
                ...
              </strong>
            </div>


            <div className="account-info-item">
              <span>
                📅 Account Created
              </span>

              <strong>
                {user.metadata
                  ?.creationTime
                  ? new Date(
                      user.metadata.creationTime
                    ).toLocaleDateString()
                  : 'N/A'}
              </strong>
            </div>

          </div>


          {/* Logout */}

          <button
            className="account-back-button"
            onClick={async () => {
              try {
                await signOut(auth)

                window.location.href =
                  '/login'

              } catch (error) {
                console.error(
                  'Logout error:',
                  error
                )
              }
            }}
            style={{
              marginTop: '15px',
              marginBottom: '10px',
              color: '#d93025',
              borderColor: '#d93025',
            }}
          >
            Logout
          </button>


          {/* Back Home */}

          <button
            className="account-back-button"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            ← Back to Home
          </button>

        </div>

      </div>

    </div>
  )
}

export default AccountPage
