import { useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function FixMapSize() {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300)

    return () => clearTimeout(timer)
  }, [map])

  return null
}

function LocationPicker({ onLocationSelect }) {
  const [position, setPosition] = useState(null)

  useMapEvents({
    click(e) {
      const selectedPosition = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      }

      setPosition(selectedPosition)
      onLocationSelect(selectedPosition)
    },
  })

  return position ? (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={10}
      pathOptions={{
        color: '#13a89e',
        fillColor: '#13a89e',
        fillOpacity: 0.9,
        weight: 3,
      }}
    />
  ) : null
}

function MapPicker({ onClose, onLocationSelect }) {
  const araihazarCenter = [23.7925, 90.6535]

  const [selectedPosition, setSelectedPosition] = useState(null)

  const handleLocationSelect = (location) => {
    setSelectedPosition(location)
    onLocationSelect(location)
  }

  const handleConfirm = () => {
    if (!selectedPosition) {
      alert('Please select a location on the map first.')
      return
    }

    onClose()
  }

  // Araihazar delivery zone
  const araihazarZone = [
    [23.855, 90.585],
    [23.865, 90.635],
    [23.850, 90.700],
    [23.815, 90.735],
    [23.755, 90.735],
    [23.720, 90.690],
    [23.710, 90.625],
    [23.735, 90.580],
    [23.795, 90.565],
    [23.855, 90.585],
  ]

  return (
    <div className="map-picker-overlay">

      <div className="map-picker">

        {/* Header */}

        <div className="map-picker-header">

          <div>
            <span className="section-label">
              DELIVERY LOCATION
            </span>

            <h2>Select Your Location</h2>

            <p>
              Tap on the satellite map to choose your
              delivery location.
            </p>
          </div>

          <button
            className="map-close-button"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {/* MAP */}

        <div
          className="map-container"
          style={{
            width: '100%',
            height: '400px',
            minHeight: '400px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '14px',
          }}
        >

          <MapContainer
            center={araihazarCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{
              width: '100%',
              height: '100%',
            }}
          >

            {/* 1. SATELLITE IMAGE */}

            <TileLayer
              attribution="Sources: Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />


            {/* 2. ROAD + PLACE LABELS */}

            <TileLayer
              attribution="Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={1}
            />


            {/* 3. TRANSPORTATION / ROAD INFORMATION */}

            <TileLayer
              attribution="Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.9}
            />


            <FixMapSize />


            {/* DELIVERY ZONE */}

            <Polygon
              positions={araihazarZone}
              pathOptions={{
                color: '#13a89e',
                weight: 3,
                fillColor: '#13a89e',
                fillOpacity: 0.06,
              }}
            />


            {/* LOCATION MARKER */}

            <LocationPicker
              onLocationSelect={handleLocationSelect}
            />

          </MapContainer>

        </div>


        {/* FOOTER */}

        <div className="map-picker-footer">

          <p>
            📍 Select your location inside the
            Araihazar delivery area.
          </p>

          {selectedPosition && (
            <small>
              📌 Selected location:{' '}
              {selectedPosition.lat.toFixed(5)},
              {' '}
              {selectedPosition.lng.toFixed(5)}
            </small>
          )}

          <button
            type="button"
            className="map-confirm-button"
            onClick={handleConfirm}
          >
            Confirm Location
          </button>

        </div>

      </div>

    </div>
  )
}

export default MapPicker
