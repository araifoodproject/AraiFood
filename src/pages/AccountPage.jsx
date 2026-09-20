import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import PageBackButton from '../components/PageBackButton'
import useSettings from '../hooks/useSettings'
import { toast } from 'react-toastify'
import {
  Camera,
  X,
  Wallet,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

function AccountPage() {
  const { settings } = useSettings()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('customer')
  const [profileImage, setProfileImage] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [pointsHistory, setPointsHistory] = useState([])

  // Wallet Requests
  const [walletRequests, setWalletRequests] = useState([])
  const [showAddMoney, setShowAddMoney] = useState(false)

  const fileInputRef = useRef(null)

  // ============ AUTH + LOAD ============
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const data = userDoc.data()
            const dbRole = 'customer'
            setRole(dbRole)
            localStorage.setItem('userRole', dbRole)

            setFullName(data.fullName || '')
            setPhone(data.phone || '')
            setAddress(data.address || '')
            setProfileImage(data.profileImage || '')
            setLoyaltyPoints(data.loyaltyPoints || 0)
            setWalletBalance(data.walletBalance || 0)
            setWalletTransactions(data.walletTransactions || [])
            setPointsHistory(data.pointsHistory || [])
          } else {
            await setDoc(userDocRef, {
              email: currentUser.email,
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
            setRole('customer')
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ============ LOAD MY WALLET REQUESTS ============
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'walletRequests'),
      where('userId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
      list.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime?.() || 0
        const bT = b.createdAt?.toDate?.()?.getTime?.() || 0
        return bT - aT
      })
      setWalletRequests(list)
    })
    return () => unsub()
  }, [user])

  // ============ IMAGE UPLOAD ============
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX_SIZE = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setProfileImage(compressed)
        toast.success('📷 Profile photo ready! Click "Save Profile".')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setProfileImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ============ SAVE PROFILE ============
  const saveProfile = async () => {
    if (!fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await setDoc(
        userDocRef,
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          profileImage: profileImage || '',
          email: user.email,
          role: 'customer',
          updatedAt: new Date(),
        },
        { merge: true }
      )
      setMessage('Profile saved successfully!')
      toast.success('✅ Profile saved!')
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ============ LOGOUT ============
  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userRole')
      window.location.href = '/login'
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="account-page">
        <div className="panel-loading">
          <div className="panel-loading-spinner"></div>
          <p>Loading account...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="account-page">
        <div className="account-card">
          <div className="account-icon">👤</div>
          <h1>Please Login</h1>
          <p>You need to login to view your account.</p>
          <button
            className="account-primary-button"
            onClick={() => {
              window.location.href = '/login'
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
        <PageBackButton label="Back" fallback="/" />

        <div className="account-header">
          <div className="account-header-top">
            <span className="account-header-badge">ARAIFOOD ACCOUNT</span>
          </div>

          <h1>
            Welcome back,
            <span> {fullName || 'Food Lover'}!</span>
          </h1>
          <p>Manage your profile, wallet, and rewards all in one place.</p>
        </div>

        <div className="account-card">
          {/* Profile */}
          <div className="account-profile">
            <div className="profile-avatar-wrapper">
              <div
                className="account-avatar"
                style={{ overflow: 'hidden', padding: 0 }}
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
              <div className="profile-online-dot"></div>
            </div>

            <div className="profile-main-info">
              <h2>{fullName || 'Food Lover'}</h2>
              <p>{user.email}</p>
              <div className="profile-status">
                <span className="profile-status-dot"></span>
                Active Customer Account
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="customer-profile-upload"
              />
              <label
                htmlFor="customer-profile-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}
              >
                <Camera size={14} />
                {profileImage ? 'Change Photo' : 'Add Photo'}
              </label>
              {profileImage && (
                <button
                  onClick={removeImage}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(220,38,38,0.12)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove Photo"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="account-divider"></div>

          {/* Rewards */}
          <div className="rewards-section">
            <div className="rewards-header">
              <span className="section-label">YOUR REWARDS</span>
              <h3>Loyalty Points & Wallet</h3>
            </div>

            <div className="rewards-grid">
              <div className="reward-card loyalty-card">
                <div className="reward-icon">⭐</div>
                <div className="reward-info">
                  <strong>{loyaltyPoints} Points</strong>
                  <small>Loyalty Points</small>
                </div>
                <div className="reward-action">
                  <span>৳{(loyaltyPoints / 10).toFixed(0)} value</span>
                </div>
              </div>

              <div className="reward-card wallet-card">
                <div className="reward-icon">💳</div>
                <div className="reward-info">
                  <strong>৳{walletBalance.toFixed(2)}</strong>
                  <small>Wallet Balance</small>
                </div>
                <button
                  className="wallet-add-button"
                  onClick={() => setShowAddMoney(true)}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Requests (Pending) */}
          {walletRequests.length > 0 && (
            <div className="wallet-transactions-section">
              <div className="account-section-title">
                <div className="account-section-icon">💰</div>
                <div>
                  <h3>Top-Up Requests</h3>
                  <p>Your wallet top-up requests</p>
                </div>
              </div>

              <div className="wallet-transaction-list">
                {walletRequests.slice(0, 5).map((req) => {
                  const statusMap = {
                    pending: {
                      label: 'Pending',
                      color: '#f59e0b',
                      bg: 'rgba(245,158,11,0.12)',
                      icon: '⏳',
                    },
                    approved: {
                      label: 'Approved',
                      color: '#16a34a',
                      bg: 'rgba(22,163,74,0.12)',
                      icon: '✅',
                    },
                    rejected: {
                      label: 'Rejected',
                      color: '#dc2626',
                      bg: 'rgba(220,38,38,0.12)',
                      icon: '❌',
                    },
                  }
                  const s = statusMap[req.status] || statusMap.pending
                  return (
                    <div
                      className="wallet-transaction-card"
                      key={req.firebaseId}
                    >
                      <div className="transaction-icon">
                        {req.method === 'bkash' ? '💳' : '💰'}
                      </div>
                      <div className="transaction-info">
                        <strong>
                          ৳{req.amount} via{' '}
                          {req.method === 'bkash' ? 'bKash' : 'Nagad'}
                        </strong>
                        <small>
                          {req.createdAt?.toDate?.()
                            ? req.createdAt
                                .toDate()
                                .toLocaleString()
                            : 'Just now'}
                        </small>
                        {req.status === 'rejected' && req.rejectReason && (
                          <small
                            style={{ color: '#dc2626', display: 'block' }}
                          >
                            Reason: {req.rejectReason}
                          </small>
                        )}
                      </div>
                      <div
                        className="transaction-amount"
                        style={{ color: s.color }}
                      >
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            background: s.bg,
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {s.icon} {s.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Wallet Transactions */}
          <div className="wallet-transactions-section">
            <div className="account-section-title">
              <div className="account-section-icon">💳</div>
              <div>
                <h3>Wallet Transactions</h3>
                <p>Your wallet activity</p>
              </div>
            </div>

            <div className="wallet-transaction-list">
              {walletTransactions.length === 0 ? (
                <p className="no-transactions">
                  No wallet transactions yet.
                </p>
              ) : (
                walletTransactions.slice(0, 5).map((transaction) => (
                  <div
                    className="wallet-transaction-card"
                    key={transaction.id}
                  >
                    <div className="transaction-icon">
                      {transaction.type === 'credit' ? '⬇️' : '⬆️'}
                    </div>
                    <div className="transaction-info">
                      <strong>
                        {transaction.type === 'credit'
                          ? 'Money Added'
                          : 'Payment Made'}
                      </strong>
                      <small>{transaction.date}</small>
                    </div>
                    <div
                      className={`transaction-amount ${
                        transaction.type === 'credit' ? 'credit' : 'debit'
                      }`}
                    >
                      <strong>৳{transaction.amount.toFixed(2)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Points History */}
          <div className="points-history-section">
            <div className="account-section-title">
              <div className="account-section-icon">⭐</div>
              <div>
                <h3>Loyalty Points History</h3>
                <p>How you earned your points</p>
              </div>
            </div>

            <div className="points-history-list">
              {pointsHistory.length === 0 ? (
                <p className="no-transactions">
                  No points history yet. Order food to earn points!
                </p>
              ) : (
                pointsHistory.slice(0, 5).map((point) => (
                  <div className="points-history-card" key={point.id}>
                    <div className="points-icon">⭐</div>
                    <div className="points-info">
                      <strong>Earned {point.amount} Points</strong>
                      <small>{point.date}</small>
                    </div>
                    <div className="points-amount">
                      <strong>+{point.amount}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="account-divider"></div>

          {/* Personal Info */}
          <div className="account-section-title">
            <div className="account-section-icon">👤</div>
            <div>
              <h3>Personal Information</h3>
              <p>Your information can be edited anytime.</p>
            </div>
          </div>

          <div className="form-group account-form-group">
            <label>Full Name</label>
            <div className="account-input-wrapper">
              <span className="account-input-icon">👤</span>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setMessage('')
                }}
              />
            </div>
          </div>

          <div className="form-group account-form-group">
            <label>Mobile Number</label>
            <div className="account-input-wrapper">
              <span className="account-input-icon">📱</span>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setMessage('')
                }}
              />
            </div>
          </div>

          <div className="form-group account-form-group">
            <label>Delivery Address</label>
            <div className="account-textarea-wrapper">
              <span className="account-textarea-icon">📍</span>
              <textarea
                placeholder="House / Road / Area / Union / Upazila..."
                rows="4"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setMessage('')
                }}
              ></textarea>
            </div>
          </div>

          <div className="save-profile-section">
            <button
              className="account-save-button"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="save-spinner">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Save Profile
                </>
              )}
            </button>

            {message && (
              <div
                className={`account-message ${
                  message.includes('successfully') ? 'success' : 'error'
                }`}
              >
                <span className="message-icon">
                  {message.includes('successfully') ? '✓' : '⚠️'}
                </span>
                <span>{message}</span>
              </div>
            )}
          </div>

          <div className="account-divider"></div>

          {/* Account Info */}
          <div className="account-information-card">
            <div className="account-section-title">
              <div className="account-section-icon">🛡️</div>
              <div>
                <h3>Account Information</h3>
                <p>Your AraiFood account details.</p>
              </div>
            </div>

            <div className="account-info-grid">
              <div className="account-info-item">
                <div className="account-info-icon">📧</div>
                <div className="account-info-content">
                  <span>Email</span>
                  <strong>{user.email}</strong>
                </div>
              </div>

              <div className="account-info-item">
                <div className="account-info-icon">👤</div>
                <div className="account-info-content">
                  <span>Account Type</span>
                  <strong>Customer</strong>
                </div>
              </div>

              <div className="account-info-item">
                <div className="account-info-icon">🆔</div>
                <div className="account-info-content">
                  <span>Account ID</span>
                  <strong>{user.uid.substring(0, 12)}...</strong>
                </div>
              </div>

              <div className="account-info-item">
                <div className="account-info-icon">📅</div>
                <div className="account-info-content">
                  <span>Member Since</span>
                  <strong>
                    {user.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString()
                      : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="account-actions">
            <button className="account-logout-button" onClick={handleLogout}>
              <span className="account-action-icon">🚪</span>
              <span>Logout</span>
            </button>

            <button
              className="account-home-button-large"
              onClick={() => {
                window.location.href = '/'
              }}
            >
              <span className="account-action-icon">🏠</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      {showAddMoney && (
        <AddMoneyModal
          user={user}
          settings={settings}
          onClose={() => setShowAddMoney(false)}
        />
      )}
    </div>
  )
}

// ============================================================
// ADD MONEY MODAL
// ============================================================
function AddMoneyModal({ user, settings, onClose }) {
  const minAmount = settings.walletMinAmount || 50
  const maxAmount = settings.walletMaxAmount || 10000

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bkash')
  const [transactionId, setTransactionId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const paymentNumber =
    method === 'bkash'
      ? settings.walletBkashNumber || 'Not set'
      : settings.walletNagadNumber || 'Not set'

  const copyNumber = () => {
    if (paymentNumber === 'Not set') {
      toast.error('Payment number not configured')
      return
    }
    navigator.clipboard.writeText(paymentNumber)
    setCopied(true)
    toast.success('Number copied!', { autoClose: 1200 })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount < minAmount) {
      toast.error(`Minimum amount is ৳${minAmount}`)
      return
    }
    if (numAmount > maxAmount) {
      toast.error(`Maximum amount is ৳${maxAmount}`)
      return
    }
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID')
      return
    }
    if (paymentNumber === 'Not set') {
      toast.error('Payment number not set. Contact support.')
      return
    }

    setSubmitting(true)
    try {
      const requestId = `WR-${Math.floor(100000 + Math.random() * 900000)}`

      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      const userData = userDoc.exists() ? userDoc.data() : {}

      await addDoc(collection(db, 'walletRequests'), {
        requestId,
        userId: user.uid,
        userEmail: user.email || '',
        userName: userData.fullName || 'Customer',
        amount: numAmount,
        method,
        paymentNumber,
        transactionId: transactionId.trim(),
        status: 'pending',
        rejectReason: '',
        createdAt: serverTimestamp(),
      })

      toast.success(
        `✅ Request submitted! We'll verify within 5 minutes.`
      )
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="outside-area-modal"
      onClick={onClose}
      style={{ zIndex: 999999 }}
    >
      <div
        className="outside-area-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(249,115,22,0.06))',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px',
              }}
            >
              Wallet Top-Up
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Add Money to Wallet
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: '20px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Info Banner */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px',
              fontSize: '12.5px',
              color: '#1D4ED8',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            💡 <strong>How it works:</strong> Send money to the bKash/Nagad
            number below, then submit the transaction ID. Admin will verify and
            add funds to your wallet within 5 minutes.
          </div>

          {/* Amount */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Amount (৳{minAmount} — ৳{maxAmount})
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginTop: '8px',
                flexWrap: 'wrap',
              }}
            >
              {[100, 200, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background:
                      amount === String(preset)
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface-soft)',
                    border:
                      amount === String(preset)
                        ? 'none'
                        : '1px solid var(--border)',
                    color:
                      amount === String(preset)
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ৳{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Payment Method
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setMethod('bkash')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    method === 'bkash'
                      ? 'linear-gradient(135deg, #E2136E, #B10F53)'
                      : 'var(--surface-soft)',
                  border:
                    method === 'bkash' ? 'none' : '1px solid var(--border)',
                  color:
                    method === 'bkash' ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                💳 bKash
              </button>
              <button
                onClick={() => setMethod('nagad')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    method === 'nagad'
                      ? 'linear-gradient(135deg, #F58220, #C96615)'
                      : 'var(--surface-soft)',
                  border:
                    method === 'nagad' ? 'none' : '1px solid var(--border)',
                  color:
                    method === 'nagad' ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                💰 Nagad
              </button>
            </div>
          </div>

          {/* Payment Number */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(5,150,105,0.08)',
              border: '1px dashed rgba(5,150,105,0.4)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '3px',
                }}
              >
                Send money to this {method === 'bkash' ? 'bKash' : 'Nagad'}{' '}
                number (Personal)
              </div>
              <strong
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 900,
                  color:
                    paymentNumber === 'Not set'
                      ? 'var(--text-tertiary)'
                      : 'var(--primary)',
                  letterSpacing: '0.5px',
                }}
              >
                {paymentNumber}
              </strong>
            </div>
            <button
              onClick={copyNumber}
              disabled={paymentNumber === 'Not set'}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                background:
                  paymentNumber === 'Not set'
                    ? 'var(--surface-soft)'
                    : 'var(--primary)',
                color:
                  paymentNumber === 'Not set'
                    ? 'var(--text-tertiary)'
                    : '#FFFFFF',
                border: 'none',
                cursor:
                  paymentNumber === 'Not set' ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
              }}
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>

          {/* Transaction ID */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g., 9F7D2K4LX8 (from SMS)"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '16px',
              borderRadius: '999px',
              background: submitting
                ? 'var(--surface-soft)'
                : 'linear-gradient(135deg, #059669, #047857)',
              color: submitting ? 'var(--text-tertiary)' : '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting
                ? 'none'
                : '0 6px 20px rgba(5,150,105,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Wallet size={18} />
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountPage