import { GoogleMap, Marker, useJsApiLoader, Polygon } from '@react-google-maps/api'
import { toast } from 'react-toastify'

const containerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Delivery zone polygon (Araihazar area)
const deliveryZone = [
  { lat: 23.7681, lng: 90.6170 },
  { lat: 23.7923, lng: 90.6089 },
  { lat: 23.8120, lng: 90.6606 },
  { lat: 23.7976, lng: 90.6923 },
  { lat: 23.7762, lng: 90.6594 },
  { lat: 23.7598, lng: 90.6300 },
  { lat: 23.7681, lng: 90.6170 },
]

// Ray casting point-in-polygon (correct lat/lng roles)
const isInsideDeliveryZone = (point) => {
  let isInside = false
  const { lat, lng } = point

  for (let i = 0, j = deliveryZone.length - 1; i < deliveryZone.length; j = i++) {
    const xi = deliveryZone[i].lng
    const yi = deliveryZone[i].lat
    const xj = deliveryZone[j].lng
    const yj = deliveryZone[j].lat

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (intersect) isInside = !isInside
  }

  return isInside
}

function MapPicker({ position, setPosition }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['places'],
  })

  const defaultCenter = { lat: 23.78, lng: 90.64 }

  const onMapClick = (e) => {
    if (!e.latLng) return

    const clickedLocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    }

    setPosition(clickedLocation)

    if (isInsideDeliveryZone(clickedLocation)) {
      toast.success('📍 Location selected!', { autoClose: 1500 })
    } else {
      toast.warning(
        '⚠️ Outside delivery area. We deliver within Araihazar only.',
        { autoClose: 3000 }
      )
    }
  }

  // Loading
  if (!isLoaded && !loadError) {
    return (
      <div
        style={{
          width: '100%',
          height: '450px',
          borderRadius: '16px',
          background:
            'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(249,115,22,0.08))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(5,150,105,0.2)',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spinPremium 1s linear infinite',
          }}
        />
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          🗺️ Loading Map...
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        style={{
          width: '100%',
          height: '450px',
          borderRadius: '16px',
          background: 'rgba(239,68,68,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#EF4444',
            margin: 0,
            textAlign: 'center',
            padding: '20px',
          }}
        >
          ⚠️ Failed to load map. Please refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position || defaultCenter}
        zoom={14}
        onClick={onMapClick}
        options={{
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: 2,
            position: 3,
          },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        }}
      >
        {/* Delivery Zone */}
        <Polygon
          paths={deliveryZone}
          options={{
            strokeColor: '#13a89e',
            strokeOpacity: 0.9,
            strokeWeight: 3,
            fillColor: '#13a89e',
            fillOpacity: 0.12,
            clickable: false,
          }}
        />

        {/* Marker */}
        {position && (
          <Marker
            position={position}
            animation={
              window.google?.maps?.Animation?.DROP ?? undefined
            }
          />
        )}
      </GoogleMap>

      {/* Selected Location Info */}
      {position ? (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(5,150,105,0.1)',
            border: '1px solid rgba(5,150,105,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>📍</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 800,
                color: '#059669',
                marginBottom: '2px',
              }}
            >
              Location Selected
            </strong>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
            </span>
          </div>
          <button
            onClick={() => setPosition(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(239,68,68,0.1)',
              color: '#EF4444',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            type="button"
          >
            Clear
          </button>
        </div>
      ) : (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--surface-soft)',
            border: '1px dashed var(--border-strong)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          👆 Click on the map to select your delivery location
        </div>
      )}
    </div>
  )
}

export default MapPicker