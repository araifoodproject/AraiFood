// ============================================================
// src/components/DeliveryAreas.jsx
// V4 — Bilingual (BN/EN) + Request Area button
// ============================================================

import { useEffect, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import useSettings from '../hooks/useSettings'
import { useLanguage } from '../i18n/LanguageContext'
import ZoneRequestModal from './ZoneRequestModal'

const COLOR_CYCLE = [
  'green',
  'blue',
  'purple',
  'teal',
  'orange',
  'pink',
  'amber',
]

function DeliveryAreas() {
  const { settings } = useSettings()
  const { t, language } = useLanguage()
  const [zones, setZones] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)

  const isBn = language === 'bn'

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'deliveryZones'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        setZones(list)
      },
      (err) => console.error('Delivery zones load error:', err)
    )
    return () => unsub()
  }, [])

  const getDisplayName = (zone) => {
    if (zone.displayName) return zone.displayName
    return zone.name || 'Area'
  }

  const areas = settings.deliveryAreas || {}

  // Fallback title/subtitle — translated
  const sectionTitle =
    areas.title || (isBn ? 'আমরা ডেলিভারি দিই' : 'We Deliver To')
  const sectionSubtitle =
    areas.subtitle ||
    (isBn ? 'আপনার এলাকায় ডেলিভারি আছে কিনা দেখুন' : 'Check if we deliver to your area')

  return (
    <>
      <section className="aa-section">
        <div className="aa-section-header">
          <div>
            <h2 className="aa-section-title">{sectionTitle}</h2>
            <p className="aa-section-sub">{sectionSubtitle}</p>
          </div>
        </div>

        <div className="aa-delivery-areas">
          {zones.map((zone, idx) => {
            const color = zone.color || COLOR_CYCLE[idx % COLOR_CYCLE.length]
            return (
              <span
                key={zone.firebaseId}
                className={`aa-area-chip ${color}`}
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                <MapPin size={14} strokeWidth={2.5} />
                {getDisplayName(zone)}
              </span>
            )
          })}

          {/* Request Area button — TRANSLATED */}
          <button
            onClick={() => setShowRequestModal(true)}
            className="aa-area-chip"
            style={{
              cursor: 'pointer',
              background:
                'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))',
              border: '1.5px dashed rgba(249,115,22,0.5)',
              color: '#EA580C',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} strokeWidth={2.8} />
            {isBn ? 'আপনার এলাকা নেই?' : "Don't see your area?"}
          </button>
        </div>
      </section>

      {/* Request Modal */}
      <ZoneRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </>
  )
}

export default DeliveryAreas