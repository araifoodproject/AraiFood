// ============================================================
// src/components/SubscribePromptModal.jsx
// First-login Push Notification Prompt
// ============================================================

import { useState, useEffect } from 'react'
import { Bell, X, Sparkles, Clock, Tag } from 'lucide-react'
import {
  enableNotifications,
  getBrowserPermission,
  getSubscriptionStatus,
} from '../utils/oneSignal'
import { toast } from 'react-toastify'

const STORAGE_KEY = 'push_prompt_dismissed_at'
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3 // 3 days

function SubscribePromptModal({ user }) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if we should show the modal
  useEffect(() => {
    if (!user?.uid) return

    const check = async () => {
      // Don't show if browser doesn't support
      const permission = getBrowserPermission()
      if (permission === 'unsupported') return

      // Don't show if already granted
      if (permission === 'granted') {
        const sub = await getSubscriptionStatus()
        if (sub.enabled) return
      }

      // Check dismiss cooldown
      const dismissedAt = localStorage.getItem(STORAGE_KEY)
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10)
        if (elapsed < DISMISS_COOLDOWN_MS) return
      }

      // Show after 3 seconds
      setTimeout(() => setVisible(true), 3000)
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
        toast.error(res.error || 'Failed to enable notifications')
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
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 999998,
          animation: 'fadeIn 0.25s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '440px',
          background: 'var(--surface, #fff)',
          borderRadius: '24px',
          padding: '28px 24px 24px',
          zIndex: 999999,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--surface-soft, #f3f4f6)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #6b7280)',
          }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Bell Icon with Gradient */}
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 20px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(5,150,105,0.35)',
            position: 'relative',
          }}
        >
          <Bell size={36} color="#fff" strokeWidth={2.4} />
          {/* Sparkle */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.5)',
            }}
          >
            <Sparkles size={14} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            margin: '0 0 8px',
            textAlign: 'center',
            fontFamily: 'var(--font-heading, inherit)',
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-primary, #111827)',
            lineHeight: 1.2,
          }}
        >
          Never Miss an Update! 🔔
        </h2>

        {/* Subtitle */}
        <p
          style={{
            margin: '0 0 20px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-secondary, #6b7280)',
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          Enable notifications to get instant updates about your orders and
          exclusive offers.
        </p>

        {/* Benefits List */}
        <div
          style={{
            background: 'rgba(5,150,105,0.06)',
            border: '1px solid rgba(5,150,105,0.2)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-primary, #111827)',
            }}
          >
            <Clock size={16} color="#059669" strokeWidth={2.5} />
            Real-time order status updates
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-primary, #111827)',
            }}
          >
            <Tag size={16} color="#059669" strokeWidth={2.5} />
            Exclusive deals & discounts
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-primary, #111827)',
            }}
          >
            <Sparkles size={16} color="#059669" strokeWidth={2.5} />
            Special offers from your favourite restaurants
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <button
            onClick={handleEnable}
            disabled={loading}
            style={{
              padding: '14px 20px',
              borderRadius: '999px',
              background: loading
                ? 'var(--surface-soft, #f3f4f6)'
                : 'linear-gradient(135deg, #059669, #047857)',
              color: loading ? 'var(--text-tertiary, #9ca3af)' : '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading
                ? 'none'
                : '0 8px 20px rgba(5,150,105,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              '⏳ Enabling...'
            ) : (
              <>
                <Bell size={18} strokeWidth={2.5} />
                Enable Notifications
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            style={{
              padding: '12px 20px',
              borderRadius: '999px',
              background: 'transparent',
              color: 'var(--text-secondary, #6b7280)',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -40%) }
          to { opacity: 1; transform: translate(-50%, -50%) }
        }
      `}</style>
    </>
  )
}

export default SubscribePromptModal