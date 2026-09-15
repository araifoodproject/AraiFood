import { GoogleMap, Marker, useJsApiLoader, Polygon } from '@react-google-maps/api'
import { toast } from 'react-toastify'

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const deliveryZone = [
  { lat: 23.7681, lng: 90.6170 },
  { lat: 23.7923, lng: 90.6089 },
  { lat: 23.8120, lng: 90.6606 },
  { lat: 23.7976, lng: 90.6923 },
  { lat: 23.7762, lng: 90.6594 },
  { lat: 23.7598, lng: 90.6300 },
  { lat: 23.7681, lng: 90.6170 }
]

const isInsideDeliveryZone = (point) => {
  let isInside = false
  const lat = point.lat
  const lng = point.lng

  for (let i = 0, j = deliveryZone.length - 1; i < deliveryZone.length; j = i++) {
    const xi = deliveryZone[i].lat
    const yi = deliveryZone[i].lng
    const xj = deliveryZone[j].lat
    const yj = deliveryZone[j].lng

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)

    if (intersect) {
      isInside = !isInside
    }
  }

  return isInside
}

function MapPicker({ position, setPosition }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['places']
  })

  const defaultCenter = { lat: 23.78, lng: 90.64 }

  const onMapClick = (e) => {
    if (e.latLng) {
      const clickedLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() }

      if (isInsideDeliveryZone(clickedLocation)) {
        setPosition(clickedLocation)
      } else {
        toast.error('Location is outside our delivery area. Please select within Araihazar!', {
          position: 'top-right',
          autoClose: 3000,
        })
      }
    }
  }

  // Loading Skeleton
  if (!isLoaded && !loadError) {
    return (
      <div className="map-loading-skeleton">
        <div className="map-loading-spinner"></div>
        <p>🗺️ Loading Map...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="map-loading-skeleton error">
        <p>⚠️ Failed to load map. Please refresh.</p>
      </div>
    )
  }

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position || defaultCenter}
        zoom={13}
        onClick={onMapClick}
        options={{
          mapTypeControl: true,
          mapTypeControlOptions: { style: 2 },
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true
        }}
      >
        <Polygon
          paths={deliveryZone}
          options={{
            strokeColor: '#13a89e',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: '#13a89e',
            fillOpacity: 0.15
          }}
        />

        {position && <Marker position={position} />}
      </GoogleMap>

      {position && (
        <div className="selected-location-box">
          <strong>📍 Selected Location:</strong>
          <span>Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}</span>
        </div>
      )}
    </>
  )
}

export default MapPicker