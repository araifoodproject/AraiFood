// ============================================================
// src/components/DeliveryAreas.jsx
// FULLY REAL-TIME — delivery zones come from Firestore
// `deliveryZones` collection (active: true).
// Title/subtitle come from settings.deliveryAreas.
// ============================================================

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import useSettings from '../hooks/useSettings'

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

  // Short display name — prefer displayName, else first word of name
  const getDisplayName = (zone) => {
    if (zone.displayName) return zone.displayName
    if (!zone.name) return 'Area'
    // "Digholdi Union Parishad" → "Digholdi"
    return zone.name.split(' ')[0]
  }

  if (zones.length === 0) return null

  const areas = settings.deliveryAreas || {}

  return (
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
            <span key={zone.firebaseId} className={`aa-area-chip ${color}`}>
              <MapPin size={14} strokeWidth={2.5} />
              {getDisplayName(zone)}
            </span>
          )
        })}
      </div>
    </section>
  )
}

export default DeliveryAreas