// ============================================================
// src/components/DeliveryAreas.jsx
// V3 — Full zone name show (no auto-short)
// + Request Area button
// ============================================================

import { useEffect, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import useSettings from '../hooks/useSettings'
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
  const [zones, setZones] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)

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

  // ✅ Admin এ যা নাম দিবেন সেটাই show হবে
  // displayName থাকলে সেটা, নাহলে name পুরোটা
  const getDisplayName = (zone) => {
    if (zone.displayName) return zone.displayName
    return zone.name || 'Area'
  }

  const areas = settings.deliveryAreas || {}

  return (
    <>
      <section className="aa-section">
        <div className="aa-section-header">
          <div>
            <h2 className="aa-section-title">{areas.title}</h2>
            <p className="aa-section-sub">{areas.subtitle}</p>
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
                  whiteSpace: 'nowrap',  // ← line break হবে না
                }}
              >
                <MapPin size={14} strokeWidth={2.5} />
                {getDisplayName(zone)}
              </span>
            )
          })}

          {/* ✅ Request Area button */}
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
            আপনার এলাকা নেই?
          </button>
        </div>
      </section>

      {/* ✅ Request Modal */}
      <ZoneRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </>
  )
}

export default DeliveryAreas