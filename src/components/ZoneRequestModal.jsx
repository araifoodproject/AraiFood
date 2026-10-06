// ============================================================
// src/components/ZoneRequestModal.jsx
// Customer → Zone Request Form (anonymous allowed)
// ============================================================

import { useState, useEffect } from 'react'
import { db, auth } from '../firebase'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { X, MapPin, Send, Users, CheckCircle } from 'lucide-react'

function ZoneRequestModal({ open, onClose }) {
  const [zoneName, setZoneName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [topRequests, setTopRequests] = useState([])

  // Load top requested zones
  useEffect(() => {
    if (!open) return
    const loadTop = async () => {
      try {
        const snap = await getDocs(collection(db, 'zoneRequests'))
        const counts = {}
        snap.docs.forEach((d) => {
          const data = d.data()
          if (data.status === 'reviewed') return // skip already reviewed
          const key = (data.zoneName || '').toLowerCase().trim()
          if (!key) return
          counts[key] = (counts[key] || 0) + 1
        })
        const sorted = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
        setTopRequests(sorted)
      } catch (err) {
        // silent
      }
    }
    loadTop()
  }, [open])

  const handleSubmit = async () => {
    if (!zoneName.trim()) {
      toast.error('এলাকার নাম লিখুন')
      return
    }
    if (!customerPhone.trim()) {
      toast.error('ফোন নাম্বার দিন (verification এর জন্য)')
      return
    }

    setSubmitting(true)
    try {
      const currentUser = auth.currentUser
      const normalizedZone = zoneName.trim()
      const normalizedPhone = customerPhone.trim()

      // ✅ Duplicate check — same zone + same phone/user
      const dupQuery = query(
        collection(db, 'zoneRequests'),
        where('zoneNameLower', '==', normalizedZone.toLowerCase())
      )
      const dupSnap = await getDocs(dupQuery)

      const isDuplicate = dupSnap.docs.some((d) => {
        const data = d.data()
        if (normalizedPhone && data.customerPhone === normalizedPhone)
          return true
        if (currentUser?.uid && data.userId === currentUser.uid) return true
        return false
      })

      if (isDuplicate) {
        toast.error(
          '❌ এই এলাকার জন্য আপনি আগেই request করেছেন!'
        )
        setSubmitting(false)
        return
      }

      await addDoc(collection(db, 'zoneRequests'), {
        zoneName: normalizedZone,
        zoneNameLower: normalizedZone.toLowerCase(),
        customerName: customerName.trim() || 'Anonymous',
        customerPhone: normalizedPhone,
        customerEmail: currentUser?.email || '',
        userId: currentUser?.uid || '',
        notes: notes.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      toast.success('✅ Request submit হয়েছে!')
      // Reset form
      setTimeout(() => {
        setZoneName('')
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

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
        {/* Header */}
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
              Delivery Request
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
              📍 আপনার এলাকা নেই?
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

        {/* Success state */}
        {success ? (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={36} color="#047857" strokeWidth={2.4} />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Request Submit হয়েছে! 🎉
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}
            >
              আমরা আপনার এলাকায় delivery শুরু করার জন্য কাজ করছি। যত বেশি
              request আসবে, তত তাড়াতাড়ি শুরু হবে!
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '20px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Info banner */}
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
              💡 আমাদের বলুন — কোন এলাকায় delivery চান। যত বেশি request আসবে,
              তত তাড়াতাড়ি আপনার এলাকায় পৌঁছাবো!
            </div>

            {/* Top requested zones */}
            {topRequests.length > 0 && (
              <div
                style={{
                  padding: '12px 14px',
                  background:
                    'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))',
                  border: '1px solid rgba(249,115,22,0.25)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: '#EA580C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                  }}
                >
                  <Users size={12} strokeWidth={2.6} />
                  🔥 Most Requested Areas
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {topRequests.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(249,115,22,0.25)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#92400E',
                      }}
                    >
                      {r.name} · {r.count} 👥
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone name */}
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
                এলাকার নাম * <span style={{ color: '#DC2626' }}>Required</span>
              </label>
              <input
                type="text"
                placeholder="যেমন: Borodi Union, Bishnandi, Noapara..."
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: zoneName.trim()
                    ? '2px solid #059669'
                    : '2px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phone */}
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
                ফোন নাম্বার *{' '}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  (duplicate রোধে)
                </span>
              </label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: customerPhone.trim()
                    ? '2px solid #059669'
                    : '2px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Customer name */}
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
                আপনার নাম (optional)
              </label>
              <input
                type="text"
                placeholder="Md. Rony Rahman"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Notes */}
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
                অতিরিক্ত তথ্য (optional)
              </label>
              <textarea
                placeholder="আমার বাসা এই এলাকায়, frequently delivery দরকার..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-primary)',
                  resize: 'vertical',
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
              <Send size={18} />
              {submitting ? 'Submitting...' : 'Request Submit করুন'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ZoneRequestModal