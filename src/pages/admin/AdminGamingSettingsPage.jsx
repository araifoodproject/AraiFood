import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import { Menu, Save, Camera, X } from 'lucide-react'

const GAMES_LIST = [
  { value: 'PUBG', label: 'PUBG Mobile', emoji: '🎯' },
  { value: 'Free Fire', label: 'Free Fire', emoji: '🔥' },
  { value: 'UNIPIN', label: 'UNIPIN Voucher', emoji: '🎟️' },
  { value: 'Level Up', label: 'Level Up Pass', emoji: '⭐' },
  { value: 'Genshin', label: 'Genshin Impact', emoji: '⚔️' },
  { value: 'Mobile Legends', label: 'Mobile Legends', emoji: '🛡️' },
  { value: 'Valorant', label: 'Valorant', emoji: '🔫' },
  { value: 'Other', label: 'Other', emoji: '🎮' },
]

function AdminGamingSettingsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'gamingSettings'),
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => {
          map[d.id] = { ...d.data(), gameKey: d.id }
        })
        setSettings(map)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const updateLocal = (gameKey, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [gameKey]: {
        ...(prev[gameKey] || {}),
        gameKey,
        [field]: value,
      },
    }))
  }

  const handleLogoUpload = (gameKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const MAX = 200
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX) {
            h = Math.round((h * MAX) / w)
            w = MAX
          }
        } else {
          if (h > MAX) {
            w = Math.round((w * MAX) / h)
            h = MAX
          }
        }
        canvas.width = w
        canvas.height = h
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        updateLocal(gameKey, 'logo', compressed)
        toast.success('Logo ready — click Save')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const saveGame = async (gameKey) => {
    const data = settings[gameKey] || {}
    try {
      await setDoc(
        doc(db, 'gamingSettings', gameKey),
        {
          gameKey,
          gameName: data.gameName || gameKey,
          logo: data.logo || '',
          bkashNumber: data.bkashNumber || '',
          nagadNumber: data.nagadNumber || '',
          description: data.description || '',
          active: data.active !== false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success(`✅ ${gameKey} settings saved!`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save')
    }
  }

  const saveAll = async () => {
    for (const game of GAMES_LIST) {
      const data = settings[game.value]
      if (data) {
        await setDoc(
          doc(db, 'gamingSettings', game.value),
          {
            gameKey: game.value,
            gameName: data.gameName || game.value,
            logo: data.logo || '',
            bkashNumber: data.bkashNumber || '',
            nagadNumber: data.nagadNumber || '',
            description: data.description || '',
            active: data.active !== false,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }
    }
    toast.success('✅ All settings saved!')
  }

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">Gaming Settings</h1>
            <p className="admin-page-sub">
              Configure logo, bKash/Nagad numbers, and details per game.
            </p>
          </div>
          <button
            onClick={saveAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            <Save size={16} /> Save All
          </button>
        </div>

        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {GAMES_LIST.map((game) => {
              const data = settings[game.value] || { gameKey: game.value }
              const isActive = data.active !== false
              return (
                <div
                  key={game.value}
                  className="admin-section"
                  style={{
                    padding: '22px',
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '14px',
                      borderBottom: '1px dashed var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '26px' }}>{game.emoji}</span>
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '16px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {game.label}
                      </strong>
                    </div>

                    <button
                      onClick={() =>
                        updateLocal(game.value, 'active', !isActive)
                      }
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: isActive
                          ? 'rgba(22,163,74,0.12)'
                          : 'rgba(220,38,38,0.12)',
                        border: isActive
                          ? '1px solid rgba(22,163,74,0.3)'
                          : '1px solid rgba(220,38,38,0.3)',
                        color: isActive ? '#16a34a' : '#dc2626',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {isActive ? '● Active' : '● Inactive'}
                    </button>
                  </div>

                  {/* Logo Upload */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, var(--green-100), var(--green-200))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--border)',
                      }}
                    >
                      {data.logo ? (
                        <img
                          src={data.logo}
                          alt={game.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        game.emoji
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '999px',
                          background: 'var(--surface-soft)',
                          border: '1px solid var(--border-strong)',
                          color: 'var(--text-primary)',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={12} />
                        {data.logo ? 'Change Logo' : 'Upload Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(game.value, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {data.logo && (
                        <button
                          onClick={() => updateLocal(game.value, 'logo', '')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '999px',
                            background: 'rgba(220,38,38,0.1)',
                            border: '1px solid rgba(220,38,38,0.3)',
                            color: '#dc2626',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: 'fit-content',
                          }}
                        >
                          <X size={10} /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* bKash Number */}
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      💳 bKash Number
                    </label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={data.bkashNumber || ''}
                      onChange={(e) =>
                        updateLocal(game.value, 'bkashNumber', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--surface)',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </div>

                  {/* Nagad Number */}
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      💰 Nagad Number
                    </label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={data.nagadNumber || ''}
                      onChange={(e) =>
                        updateLocal(game.value, 'nagadNumber', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--surface)',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '14px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      📝 Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Fast top-up within 5 min"
                      value={data.description || ''}
                      onChange={(e) =>
                        updateLocal(game.value, 'description', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--surface)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'var(--font-primary)',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => saveGame(game.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Save size={14} /> Save {game.value}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminGamingSettingsPage