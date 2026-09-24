// ============================================================
// src/components/PushBanner.jsx
// Small prominent banner to encourage push subscription
// ============================================================

import { useState, useEffect } from 'react'
import { Bell, X, ArrowRight } from 'lucide-react'
import {
  enableNotifications,
  getBrowserPermission,
  getSubscriptionStatus,
} from '../utils/oneSignal'
import { toast } from 'react-toastify'

const STORAGE_KEY = 'push_banner_dismissed_at'
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 // 1 day

function PushBanner({ user }) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const check = async () => {
      const permission = getBrowserPermission()
      if (permission === 'unsupported' || permission === 'denied') return

      if (permission === 'granted') {
        const sub = await getSubscriptionStatus()
        if (sub.enabled) return
      }

      const dismissedAt = localStorage.getItem(STORAGE_KEY)
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10)
        if (elapsed < DISMISS_COOLDOWN_MS) return
      }

      setVisible(true)
    }

    check()
  }, [user])

  const handleEnable = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await enableNotifications(user)
      if (res.success) {
        toast.success('🔔 Notifications enabled!')
        setVisible(false)
      } else {
        toast.error(res.error || 'Failed to enable')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'relative',
        padding: '14px 16px',
        borderRadius: '16px',
        background:
          'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(59,130,246,0.08))',
        border: '1px solid rgba(5,150,105,0.25)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'bannerSlide 0.4s ease',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #059669, #047857)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
        }}
      >
        <Bell size={20} color="#fff" strokeWidth={2.5} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <strong
          style={{
            display: 'block',
            fontSize: '13.5px',
            fontWeight: 800,
            color: 'var(--text-primary, #111827)',
            marginBottom: '2px',
          }}
        >
          Get instant order updates! 🔔
        </strong>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary, #6b7280)',
            fontWeight: 600,
          }}
        >
          Enable notifications to never miss an update
        </span>
      </div>

      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          padding: '8px 14px',
          borderRadius: '999px',
          background: loading
            ? 'var(--surface-soft, #f3f4f6)'
            : 'linear-gradient(135deg, #059669, #047857)',
          color: '#fff',
          border: 'none',
          fontSize: '12px',
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          boxShadow: loading ? 'none' : '0 4px 10px rgba(5,150,105,0.3)',
          fontFamily: 'inherit',
        }}
      >
        {loading ? '⏳' : (
          <>
            Enable <ArrowRight size={12} strokeWidth={3} />
          </>
        )}
      </button>

      <button
        onClick={handleDismiss}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary, #9ca3af)',
          flexShrink: 0,
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>

      <style>{`
        @keyframes bannerSlide {
          from { opacity: 0; transform: translateY(-10px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  )
}

export default PushBanner