import { useState, useEffect, useMemo } from 'react'
import { db, auth } from '../firebase'
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'
import { Search, X, Copy, Check, ShoppingBag, Package } from 'lucide-react'

function GamingPage() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [gamingSettings, setGamingSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeGame, setActiveGame] = useState('PUBG')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [copiedNumber, setCopiedNumber] = useState(null)

  // Load products
  useEffect(() => {
    const q = query(
      collection(db, 'gamingProducts'),
      where('active', '==', true)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => (a.order || 0) - (b.order || 0))
        setProducts(list)
        setLoading(false)
      },
      (err) => {
        console.error('Products load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // Load gaming settings (per-game)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'gamingSettings'),
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => {
          map[d.id] = d.data()
        })
        setGamingSettings(map)
      },
      (err) => console.error('Gaming settings load error:', err)
    )
    return () => unsub()
  }, [])

  const games = useMemo(() => {
    const set = new Set(products.map((p) => p.game))
    return Array.from(set)
  }, [products])

  useEffect(() => {
    if (games.length > 0 && !games.includes(activeGame)) {
      setActiveGame(games[0])
    }
  }, [games, activeGame])

  // Current game settings
  const currentGame = gamingSettings[activeGame] || {}
  const bkashNumber = currentGame.bkashNumber || 'Not set'
  const nagadNumber = currentGame.nagadNumber || 'Not set'
  const gameDescription = currentGame.description || ''
  const gameLogo = currentGame.logo || ''

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.game === activeGame)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        `${p.name || ''} ${p.price || ''}`.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, activeGame, search])

  const copyNumber = (num) => {
    navigator.clipboard.writeText(num)
    setCopiedNumber(num)
    toast.success('Number copied!', { autoClose: 1200 })
    setTimeout(() => setCopiedNumber(null), 2000)
  }

  const getGameLogo = (game) => {
    const map = {
      PUBG: '🎯',
      'Free Fire': '🔥',
      UNIPIN: '🎟️',
      'Level Up': '⭐',
      Genshin: '⚔️',
      'Mobile Legends': '🛡️',
      Valorant: '🔫',
    }
    return map[game] || '🎮'
  }

  const getGameColor = (game) => {
    const map = {
      PUBG: '#F97316',
      'Free Fire': '#EF4444',
      UNIPIN: '#8B5CF6',
      'Level Up': '#10B981',
      Genshin: '#3B82F6',
      'Mobile Legends': '#F59E0B',
      Valorant: '#EC4899',
    }
    return map[game] || '#059669'
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">ARAIFOOD GAMING</span>
          <h1>
            Top-Up <span>Game Currency</span>
          </h1>
          <p>
            Buy PUBG UC, Free Fire Diamonds, and more — instant top-up at the
            best price!
          </p>
        </div>

        {/* Current Game Info Banner */}
        {activeGame && (
          <div
            className="admin-section"
            style={{
              padding: '20px',
              marginBottom: '24px',
              background:
                'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(249,115,22,0.06))',
              border: '1px solid rgba(5,150,105,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid var(--border)',
                }}
              >
                {gameLogo ? (
                  <img
                    src={gameLogo}
                    alt={activeGame}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  getGameLogo(activeGame)
                )}
              </div>
              <div>
                <strong
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  {activeGame}
                </strong>
                {gameDescription && (
                  <span
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {gameDescription}
                  </span>
                )}
              </div>
            </div>

            {/* Payment Numbers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
                >
                  💳 bKash (Personal)
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <strong
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '17px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {bkashNumber}
                  </strong>
                  {currentGame.bkashNumber && (
                    <button
                      onClick={() => copyNumber(currentGame.bkashNumber)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '999px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {copiedNumber === currentGame.bkashNumber ? (
                        <>
                          <Check size={11} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
                >
                  💰 Nagad (Personal)
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <strong
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '17px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {nagadNumber}
                  </strong>
                  {currentGame.nagadNumber && (
                    <button
                      onClick={() => copyNumber(currentGame.nagadNumber)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '999px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {copiedNumber === currentGame.nagadNumber ? (
                        <>
                          <Check size={11} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  gridColumn: '1 / -1',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border)',
                }}
              >
                📌 <strong>How to order:</strong> Select a product → Enter your
                Player ID → Send money to above number → Submit transaction ID.
                Top-up within 5 minutes.
              </div>
            </div>
          </div>
        )}

        {/* My Orders Link */}
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <Link
            to="/gaming-orders"
            className="glass-view-all"
            style={{ display: 'inline-flex' }}
          >
            <Package size={14} />
            My Orders
            <span>→</span>
          </Link>
        </div>

        {/* Game Tabs */}
        {games.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '24px',
              overflowX: 'auto',
              paddingBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            {games.map((game) => {
              const isActive = activeGame === game
              const color = getGameColor(game)
              const gameSetting = gamingSettings[game] || {}
              return (
                <button
                  key={game}
                  onClick={() => {
                    setActiveGame(game)
                    setSearch('')
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 22px',
                    borderRadius: '999px',
                    background: isActive
                      ? `linear-gradient(135deg, ${color}, ${color}dd)`
                      : 'var(--glass-bg)',
                    border: isActive
                      ? 'none'
                      : '1px solid var(--glass-border)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    boxShadow: isActive
                      ? `0 8px 20px ${color}40`
                      : 'var(--shadow-soft)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {gameSetting.logo ? (
                    <img
                      src={gameSetting.logo}
                      alt={game}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '22px' }}>
                      {getGameLogo(game)}
                    </span>
                  )}
                  {game}
                </button>
              )
            })}
          </div>
        )}

        {/* Search */}
        {filteredProducts.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '999px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              maxWidth: '400px',
              marginBottom: '20px',
            }}
          >
            <Search size={18} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search packs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                minWidth: 0,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'var(--surface)',
                  border: 'none',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Products */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🎮</div>
            <h2>No products available yet</h2>
            <p>Check back soon — we're adding new top-up packs!</p>
            <Link
              to="/"
              className="checkout-button"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Back to Home
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No packs found</h2>
            <p>Try a different search.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredProducts.map((product) => {
              const color = getGameColor(product.game)
              return (
                <button
                  key={product.firebaseId}
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    padding: '20px 16px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-xl)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.25s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = `0 12px 32px ${color}40`
                    e.currentTarget.style.borderColor = color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: color,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '18px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '22px',
                      fontWeight: 900,
                      color: color,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ৳{product.price}
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '4px',
                    }}
                  >
                    <ShoppingBag size={12} />
                    Order Now
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          gameSettings={gamingSettings[selectedProduct.game] || {}}
          onClose={() => setSelectedProduct(null)}
          user={auth.currentUser}
        />
      )}
    </div>
  )
}

// ============================================================
// ORDER MODAL
// ============================================================
function OrderModal({ product, gameSettings, onClose, user }) {
  const navigate = useNavigate()
  const [playerId, setPlayerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bkash')
  const [transactionId, setTransactionId] = useState('')
  const [placing, setPlacing] = useState(false)
  const [copiedNumber, setCopiedNumber] = useState(null)

  const paymentNumber =
    paymentMethod === 'bkash'
      ? gameSettings.bkashNumber || 'Not set'
      : gameSettings.nagadNumber || 'Not set'

  const copyNumber = () => {
    if (paymentNumber === 'Not set') {
      toast.error('Payment number not configured for this game')
      return
    }
    navigator.clipboard.writeText(paymentNumber)
    setCopiedNumber(paymentNumber)
    toast.success('Number copied!', { autoClose: 1200 })
    setTimeout(() => setCopiedNumber(null), 2000)
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to place an order')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
      return
    }
    if (!playerId.trim()) {
      toast.error('Please enter your Player ID')
      return
    }
    if (!transactionId.trim()) {
      toast.error('Please enter the transaction ID')
      return
    }
    if (paymentNumber === 'Not set') {
      toast.error('Payment number not set. Please contact support.')
      return
    }

    setPlacing(true)
    try {
      const orderId = `GM-${Math.floor(100000 + Math.random() * 900000)}`

      await addDoc(collection(db, 'gamingOrders'), {
        orderId,
        userId: user.uid,
        userEmail: user.email || '',
        game: product.game,
        productName: product.name,
        price: product.price,
        playerId: playerId.trim(),
        paymentMethod,
        paymentNumber,
        transactionId: transactionId.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      toast.success(`✅ Order ${orderId} placed! We'll top-up within 5 min.`)
      onClose()
      navigate('/gaming-orders')
    } catch (err) {
      console.error(err)
      toast.error('Failed to place order')
    } finally {
      setPlacing(false)
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
              {product.game}
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
              {product.name} — ৳{product.price}
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
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              Step 1: Player ID
            </div>
            <input
              type="text"
              placeholder={`Enter your ${product.game} Player ID`}
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
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

          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              Step 2: Send ৳{product.price} to
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() => setPaymentMethod('bkash')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    paymentMethod === 'bkash'
                      ? 'linear-gradient(135deg, #E2136E, #B10F53)'
                      : 'var(--surface-soft)',
                  border:
                    paymentMethod === 'bkash'
                      ? 'none'
                      : '1px solid var(--border)',
                  color:
                    paymentMethod === 'bkash'
                      ? '#FFFFFF'
                      : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                💳 bKash
              </button>
              <button
                onClick={() => setPaymentMethod('nagad')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    paymentMethod === 'nagad'
                      ? 'linear-gradient(135deg, #F58220, #C96615)'
                      : 'var(--surface-soft)',
                  border:
                    paymentMethod === 'nagad'
                      ? 'none'
                      : '1px solid var(--border)',
                  color:
                    paymentMethod === 'nagad'
                      ? '#FFFFFF'
                      : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                💰 Nagad
              </button>
            </div>

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
                  {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} (Personal)
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
                {copiedNumber ? (
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
          </div>

          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              Step 3: Transaction ID
            </div>
            <input
              type="text"
              placeholder="e.g., 9F7D2K4LX8 (from bKash/Nagad SMS)"
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

          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#1D4ED8',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            ⚡ Top-up within <strong>5 minutes</strong> after payment
            confirmation.
          </div>

          <button
            onClick={handleSubmit}
            disabled={placing}
            style={{
              padding: '16px',
              borderRadius: '999px',
              background: placing
                ? 'var(--surface-soft)'
                : 'linear-gradient(135deg, #059669, #047857)',
              color: placing ? 'var(--text-tertiary)' : '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: placing ? 'not-allowed' : 'pointer',
              boxShadow: placing
                ? 'none'
                : '0 6px 20px rgba(5,150,105,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ShoppingBag size={18} />
            {placing ? 'Placing Order...' : `Place Order — ৳${product.price}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GamingPage