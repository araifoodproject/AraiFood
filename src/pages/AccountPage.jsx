import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'

function AccountPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('customer')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Loyalty Points & Wallet State
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [pointsHistory, setPointsHistory] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        const savedRole = localStorage.getItem('userRole') || 'customer'
        setRole(savedRole)
        
        const savedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null')
        if (savedProfile) {
          setFullName(savedProfile.fullName || '')
          setPhone(savedProfile.phone || '')
          setAddress(savedProfile.address || '')
        }

        // Load Loyalty Points
        const savedPoints = parseInt(localStorage.getItem('loyaltyPoints') || '0', 10)
        setLoyaltyPoints(savedPoints)

        // Load Wallet Balance
        const savedWallet = parseFloat(localStorage.getItem('walletBalance') || '0')
        setWalletBalance(savedWallet)

        // Load Wallet Transactions
        const savedTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]')
        setWalletTransactions(savedTransactions)

        // Load Points History
        const savedPointsHistory = JSON.parse(localStorage.getItem('pointsHistory') || '[]')
        setPointsHistory(savedPointsHistory)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const saveProfile = () => {
    if (!fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }

    setSaving(true)
    setMessage('')

    const profileData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      email: user?.email,
      role: role,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem('userProfile', JSON.stringify(profileData))
    setSaving(false)
    setMessage('Profile saved successfully!')
  }

  const addMoneyToWallet = () => {
    const amount = prompt('Enter amount to add to wallet (minimum ৳50):')
    if (!amount) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 50) {
      alert('Minimum amount is ৳50')
      return
    }

    const newBalance = walletBalance + numAmount
    setWalletBalance(newBalance)
    localStorage.setItem('walletBalance', JSON.stringify(newBalance))

    // Add transaction to history
    const newTransaction = {
      id: Date.now(),
      type: 'credit',
      amount: numAmount,
      date: new Date().toLocaleDateString()
    }
    const updatedTransactions = [newTransaction, ...walletTransactions]
    setWalletTransactions(updatedTransactions)
    localStorage.setItem('walletTransactions', JSON.stringify(updatedTransactions))

    alert(`৳${numAmount} added to your wallet successfully!`)
  }

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-card">
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
        <div className="account-header">
          <div className="account-header-top">
            <button className="account-home-button" onClick={() => { window.location.href = '/' }}>
              ← Home
            </button>
            <span className="account-header-badge">
              ARAIFOOD ACCOUNT
            </span>
          </div>

          <h1>
            Welcome back,
            <span> {fullName || 'Food Lover'}!</span>
          </h1>
          <p>
            Manage your profile, delivery details,
            and account settings all in one place.
          </p>
        </div>

        <div className="account-card">
          {/* Profile Section */}
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

          {/* Loyalty Points & Wallet Section */}
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
                  <span>৳{loyaltyPoints / 10} value</span>
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
                walletTransactions.map((transaction) => (
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

          {/* Loyalty Points History */}
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
                pointsHistory.map((point) => (
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

          {/* Personal Information */}
          <div className="account-section-title">
            <div className="account-section-icon">👤</div>
            <div>
              <h3>Personal Information</h3>
              <p>Your information can be edited anytime.</p>
            </div>
          </div>

          <div className="form-group account-form-group">
            <label htmlFor="account-full-name">Full Name</label>
            <div className="account-input-wrapper">
              <span className="account-input-icon">👤</span>
              <input
                id="account-full-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setMessage('') }}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group account-form-group">
            <label htmlFor="account-phone">Mobile Number</label>
            <div className="account-input-wrapper">
              <span className="account-input-icon">📱</span>
              <input
                id="account-phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setMessage('') }}
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="form-group account-form-group">
            <label htmlFor="account-address">Delivery Address</label>
            <div className="account-textarea-wrapper">
              <span className="account-textarea-icon">📍</span>
              <textarea
                id="account-address"
                placeholder="House / Road / Area / Union / Upazila..."
                rows="4"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setMessage('') }}
              ></textarea>
            </div>
          </div>

          {/* Save Profile */}
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
                <span className="message-icon">
                  {message.includes('successfully') ? '✓' : '⚠️'}
                </span>
                <span>{message}</span>
              </div>
            )}
          </div>

          <div className="account-divider"></div>

          {/* Account Information */}
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
                  <span>Email Address</span>
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

          {/* Account Actions */}
          <div className="account-actions">
            <button
              className="account-logout-button"
              onClick={async () => {
                try {
                  await signOut(auth)
                  window.location.href = '/login'
                } catch (error) {
                  console.error('Logout error:', error)
                }
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