// ============================================================
// src/components/PushToggleCard.jsx
// Universal Push Notification Toggle Card
// Use in: RestaurantPanel, RiderPanel, PharmacyPanel, AdminPanel
// ============================================================

import { useState, useEffect } from 'react'
import { Bell, BellRing, BellOff, Loader2 } from 'lucide-react'
import {
  enableNotifications,
  disableNotifications,
  getSubscriptionStatus,
  getBrowserPermission,
} from '../utils/oneSignal'
import { toast } from 'react-toastify'

function PushToggleCard({ user, compact = false }) {
  const [notifStatus, setNotifStatus] = useState('checking')
  // 'checking' | 'enabled' | 'disabled' | 'denied' | 'unsupported'
  const [loading, setLoading] = useState(false)

  // ============ CHECK STATUS ============
  useEffect(() => {
    if (!user?.uid) {
      setNotifStatus('disabled')
      return
    }

    const check = async () => {
      const permission = getBrowserPermission()

      if (permission === 'unsupported') {
        setNotifStatus('unsupported')
        return
      }
      if (permission === 'denied') {
        setNotifStatus('denied')
        return
      }

      const sub = await getSubscriptionStatus()
      setNotifStatus(sub.enabled ? 'enabled' : 'disabled')
    }

    check()
  }, [user])

  // ============ TOGGLE ============
  const handleToggle = async () => {
    if (!user) return
    setLoading(true)

    try {
      if (notifStatus === 'enabled') {
        const res = await disableNotifications(user)
        if (res.success) {
          toast.success('🔕 Notifications disabled')
          setNotifStatus('disabled')
        } else {
          toast.error(res.error || 'Failed to disable')
        }
      } else {
        const res = await enableNotifications(user)
        if (res.success) {
          toast.success('🔔 Notifications enabled!')
          setNotifStatus('enabled')
        } else {
          toast.error(res.error || 'Failed to enable')
          const perm = getBrowserPermission()
          if (perm === 'denied') setNotifStatus('denied')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // ============ STATUS CONFIG ============
  const getStatusConfig = () => {
    switch (notifStatus) {
      case 'enabled':
        return {
          icon: <BellRing size={22} color="#047857" strokeWidth={2.4} />,
          bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
          title: 'Push Notifications',
          status: '✅ Enabled — You will get real-time alerts',
          buttonText: '🔕 Disable',
          buttonStyle: {
            background: 'rgba(220,38,38,0.08)',
            color: '#DC2626',
            border: '1px solid rgba(220,38,38,0.25)',
          },
          disabled: false,
        }
      case 'disabled':
        return {
          icon: <Bell size={22} color="#D97706" strokeWidth={2.4} />,
          bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          title: 'Push Notifications',
          status: '🔔 Get instant updates about your orders',
          buttonText: '🔔 Enable',
          buttonStyle: {
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: '#FFFFFF',
            border: 'none',
          },
          disabled: false,
        }
      case 'denied':
        return {
          icon: <BellOff size={22} color="#DC2626" strokeWidth={2.4} />,
          bg: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
          title: 'Push Notifications',
          status: '🚫 Blocked — Enable from browser settings',
          buttonText: '🚫 Blocked',
          buttonStyle: {
            background: 'var(--surface-soft)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border)',
          },
          disabled: true,
        }
      case 'unsupported':
        return {
          icon: <BellOff size={22} color="#6B7280" strokeWidth={2.4} />,
          bg: 'var(--surface-soft)',
          title: 'Push Notifications',
          status: 'Not supported in this browser',
          buttonText: 'N/A',
          buttonStyle: {
            background: 'var(--surface-soft)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border)',
          },
          disabled: true,
        }
      default:
        return {
          icon: <Bell size={22} color="#6B7280" strokeWidth={2.4} />,
          bg: 'var(--surface-soft)',
          title: 'Push Notifications',
          status: 'Checking...',
          buttonText: '⏳ Loading...',
          buttonStyle: {
            background: 'var(--surface-soft)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border)',
          },
          disabled: true,
        }
    }
  }

  const config = getStatusConfig()

  // ============ COMPACT MODE (for topbar dropdown) ============
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 800,
              marginBottom: '2px',
            }}
          >
            {config.title}
          </strong>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
            }}
          >
            {config.status}
          </span>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading || config.disabled}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            ...config.buttonStyle,
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: loading || config.disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
        >
          {loading ? (
            <>
              <Loader2
                size={12}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              ...
            </>
          ) : (
            config.buttonText
          )}
        </button>
      </div>
    )
  }

  // ============ FULL CARD MODE ============
  return (
    <div
      style={{
        padding: '18px 20px',
        borderRadius: '18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flex: 1,
          minWidth: '220px',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>

        <div>
          <strong
            style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            {config.title}
          </strong>
          <span
            style={{
              fontSize: '12.5px',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
            }}
          >
            {config.status}
          </span>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading || config.disabled}
        style={{
          padding: '12px 22px',
          borderRadius: '999px',
          ...config.buttonStyle,
          fontSize: '13.5px',
          fontWeight: 800,
          cursor: loading || config.disabled ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <>
            <Loader2
              size={14}
              style={{ animation: 'spin 1s linear infinite' }}
            />
            Loading...
          </>
        ) : (
          config.buttonText
        )}
      </button>
    </div>
  )
}

export default PushToggleCard