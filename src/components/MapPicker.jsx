import { GoogleMap, Marker, useJsApiLoader, Polygon } from '@react-google-maps/api'
import { toast } from 'react-toastify'

const containerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// আপনার নতুন ৬টি পয়েন্ট
const deliveryZone = [
  { lat: 23.7681, lng: 90.6170 },  // 1
  { lat: 23.7923, lng: 90.6089 },  // 2
  { lat: 23.8120, lng: 90.6606 },  // 3
  { lat: 23.7976, lng: 90.6923 },  // 4
  { lat: 23.7762, lng: 90.6594 },  // 5
  { lat: 23.7598, lng: 90.6300 },  // 6
  { lat: 23.7681, lng: 90.6170 }   // 7 (বন্ধ)
]

// Point in Polygon চেক করার ফাংশন
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
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY
  })

  const defaultCenter = { lat: 23.78, lng: 90.64 }

  // Map-এ ক্লিক করলে (Polygon-এর বাইরে)
  const onMapClick = (e) => {
    if (e.latLng) {
      const clickedLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() }

      if (isInsideDeliveryZone(clickedLocation)) {
        setPosition(clickedLocation)
      } else {
        toast.error('Location is outside our delivery area. Please select within Araihazar!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      }
    }
  }

  // Polygon-এর ভেতরে ক্লিক করলে সরাসরি Pin বসবে
  const onPolygonClick = (e) => {
    if (e.latLng) {
      setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    }
  }

  if (!isLoaded) return <div className="loading-map">Loading Google Maps...</div>

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
        {/* Araihazar Thana-র Delivery Zone Polygon */}
        <Polygon
          paths={deliveryZone}
          onClick={onPolygonClick}
          options={{
            strokeColor: '#13a89e',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: '#13a89e',
            fillOpacity: 0.15
          }}
        />

        {/* Selected Location Marker */}
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