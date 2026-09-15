import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

function AccountPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('customer')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Firebase Data
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [pointsHistory, setPointsHistory] = useState([])

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        const savedRole = localStorage.getItem('userRole') || 'customer'
        setRole(savedRole)

        try {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const data = userDoc.data()
            setFullName(data.fullName || '')
            setPhone(data.phone || '')
            setAddress(data.address || '')
            setLoyaltyPoints(data.loyaltyPoints || 0)
            setWalletBalance(data.walletBalance || 0)
            setWalletTransactions(data.walletTransactions || [])
            setPointsHistory(data.pointsHistory || [])
          } else {
            // Create new user document
            await setDoc(userDocRef, {
              email: currentUser.email,
              fullName: '',
              phone: '',
              address: '',
              role: savedRole,
              loyaltyPoints: 0,
              walletBalance: 0,
              walletTransactions: [],
              pointsHistory: [],
              createdAt: new Date(),
            })
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Save Profile
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
          email: user.email,
          role: role,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      setMessage('Profile saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Add Money to Wallet
  const addMoneyToWallet = async () => {
    const amount = prompt('Enter amount to add (minimum ৳50):')
    if (!amount) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 50) {
      alert('Minimum amount is ৳50')
      return
    }

    try {
      const newBalance = walletBalance + numAmount
      const transaction = {
        id: Date.now().toString(),
        type: 'credit',
        amount: numAmount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      }

      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        walletBalance: newBalance,
        walletTransactions: arrayUnion(transaction),
      })

      setWalletBalance(newBalance)
      setWalletTransactions([transaction, ...walletTransactions])

      alert(`৳${numAmount} added to wallet!`)
    } catch (error) {
      console.error('Add money error:', error)
      alert('Failed to add money. Please try again.')
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
          <button className="account-primary-button" onClick={() => { window.location.href = '/login' }}>
            Login →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="account-page">
      <div className="account-container">
        {/* Header */}
        <div className="account-header">
          <div className="account-header-top">
            <button className="account-home-button" onClick={() => { window.location.href = '/' }}>
              ← Home
            </button>
            <span className="account-header-badge">ARAIFOOD ACCOUNT</span>
          </div>

          <h1>
            Welcome back,<span> {fullName || 'Food Lover'}!</span>
          </h1>
          <p>Manage your profile, wallet, and rewards all in one place.</p>
        </div>

        <div className="account-card">
          {/* Profile */}
          <div className="account-profile">
            <div className="profile-avatar-wrapper">
              <div className="account-avatar">
                {role === 'rider' ? '🛵' : role === 'restaurant' ? '🏪' : '👤'}
              </div>
              <div className="profile-online-dot"></div>
            </div>

            <div className="profile-main-info">
              <h2>{fullName || 'Food Lover'}</h2>
              <p>{user.email}</p>
              <div className="profile-status">
                <span className="profile-status-dot"></span>
                Active {role === 'rider' ? 'Rider' : role === 'restaurant' ? 'Restaurant' : 'Customer'} Account
              </div>
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
                <button className="wallet-add-button" onClick={addMoneyToWallet}>
                  + Add
                </button>
              </div>
            </div>
          </div>

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
                <p className="no-transactions">No wallet transactions yet. Add money to your wallet!</p>
              ) : (
                walletTransactions.slice(0, 5).map((transaction) => (
                  <div className="wallet-transaction-card" key={transaction.id}>
                    <div className="transaction-icon">
                      {transaction.type === 'credit' ? '⬇️' : '⬆️'}
                    </div>
                    <div className="transaction-info">
                      <strong>{transaction.type === 'credit' ? 'Money Added' : 'Payment Made'}</strong>
                      <small>{transaction.date}</small>
                    </div>
                    <div className={`transaction-amount ${transaction.type === 'credit' ? 'credit' : 'debit'}`}>
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
                <p className="no-transactions">No points history yet. Order food to earn points!</p>
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
                onChange={(e) => { setFullName(e.target.value); setMessage('') }}
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
                onChange={(e) => { setPhone(e.target.value); setMessage('') }}
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
                onChange={(e) => { setAddress(e.target.value); setMessage('') }}
              ></textarea>
            </div>
          </div>

          <div className="save-profile-section">
            <button className="account-save-button" onClick={saveProfile} disabled={saving}>
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
              <div className={`account-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                <span className="message-icon">{message.includes('successfully') ? '✓' : '⚠️'}</span>
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
                <div className="account-info-icon">🛵</div>
                <div className="account-info-content">
                  <span>Account Type</span>
                  <strong>{role === 'rider' ? 'Delivery Rider' : role === 'restaurant' ? 'Restaurant' : 'Customer'}</strong>
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
            <button
              className="account-logout-button"
              onClick={async () => {
                try {
                  await signOut(auth)
                  window.location.href = '/login'
                } catch (error) { console.error(error) }
              }}
            >
              <span className="account-action-icon">🚪</span>
              <span>Logout</span>
            </button>

            <button
              className="account-home-button-large"
              onClick={() => { window.location.href = '/' }}
            >
              <span className="account-action-icon">🏠</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage