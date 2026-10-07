// ============================================================
// src/components/MapPicker.jsx
// V3 — Network-resilient + Manual fallback + Mobile responsive
// - Retry on script load failure
// - QUIC-bypass hints
// - Manual lat/lng input if map fails
// - Mobile-friendly layout
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Stable reference — prevents "reloaded unintentionally" warning
const LIBRARIES = ['places']

// Detect small screen once (for default height + tap targets)
const isSmallScreen = () =>
  typeof window !== 'undefined' && window.innerWidth <= 640

function MapPicker({
  position,
  setPosition,
  height,
  defaultCenter = { lat: 23.78, lng: 90.64 },
  defaultZoom = 14,
  helperText = '👆 Click on the map to select your location',
}) {
  // Responsive height — override if not provided
  const effectiveHeight =
    height ?? (isSmallScreen() ? 280 : 450)

  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const timeoutRef = useRef(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
    // Retry by changing id — @react-google-maps/api re-injects script
    ...(retryKey > 0 && { id: `google-map-script-retry-${retryKey}` }),
  })

  // ---------- Timeout detection (12s) ----------
  useEffect(() => {
    if (isLoaded || loadError) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }
    timeoutRef.current = setTimeout(() => {
      setLoadTimedOut(true)
      setShowManualInput(true)
    }, 12000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isLoaded, loadError])

  // ---------- Map click ----------
  const onMapClick = useCallback(
    (e) => {
      if (!e.latLng) return
      setPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      })
    },
    [setPosition]
  )

  // ---------- Retry ----------
  const handleRetry = () => {
    setLoadTimedOut(false)
    setShowManualInput(false)
    setRetryKey((k) => k + 1)
  }

  // ---------- Manual input save ----------
  const handleManualSave = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      alert('❌ Invalid coordinates. Lat: -90..90, Lng: -180..180')
      return
    }
    setPosition({ lat, lng })
    setShowManualInput(false)
    setManualLat('')
    setManualLng('')
  }

  const containerStyle = {
    width: '100%',
    height: `${effectiveHeight}px`,
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  }

  // ============================================================
  // 1. Loading (or timed out → fallback)
  // ============================================================
  if (!isLoaded && !loadError && !loadTimedOut) {
    return (
      <div
        style={{
          width: '100%',
          height: `${effectiveHeight}px`,
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

  // ============================================================
  // 2. Error OR timeout → Fallback with retry + manual input
  // ============================================================
  if (loadError || loadTimedOut) {
    return (
      <div
        style={{
          width: '100%',
          borderRadius: '16px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          padding: '18px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <span style={{ fontSize: '28px', lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong
              style={{
                display: 'block',
                fontSize: '14.5px',
                fontWeight: 800,
                color: '#B91C1C',
                marginBottom: '4px',
              }}
            >
              Map couldn't load
            </strong>
            <span
              style={{
                fontSize: '12.5px',
                color: '#7F1D1D',
                fontWeight: 600,
                lineHeight: 1.5,
                display: 'block',
              }}
            >
              Network বা API issue — চিন্তা নেই। নিচে <b>Retry</b> করুন, অথবা
              নিজে <b>coordinates</b> দিন।
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: showManualInput ? '14px' : 0,
          }}
        >
          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              minHeight: '40px',
            }}
          >
            🔄 Retry
          </button>
          <button
            type="button"
            onClick={() => setShowManualInput((v) => !v)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'transparent',
              color: '#B91C1C',
              border: '1.5px solid rgba(185,28,28,0.4)',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              minHeight: '40px',
            }}
          >
            {showManualInput ? '✕ Cancel' : '✏️ Manual Input'}
          </button>
        </div>

        {/* Manual input form */}
        {showManualInput && (
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#fff',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#7F1D1D',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              📍 Enter Coordinates
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '10px',
              }}
            >
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-strong)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-strong)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleManualSave}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#fff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              ✅ Save Location
            </button>
            <p
              style={{
                marginTop: '10px',
                marginBottom: 0,
                fontSize: '11.5px',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              💡 Google Maps app এ আপনার বাসার address এ long press করলে
              lat/lng কপি করা যাবে। অথবা{' '}
              <a
                href="https://www.latlong.net/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#059669', fontWeight: 800 }}
              >
                latlong.net
              </a>{' '}
              থেকে নিতে পারেন।
            </p>
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // 3. Loaded — show map
  // ============================================================
  return (
    <div style={{ width: '100%' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position || defaultCenter}
        zoom={defaultZoom}
        onClick={onMapClick}
        options={{
          mapTypeControl: !isSmallScreen(),
          mapTypeControlOptions: {
            style: 2,
            position: 3,
          },
          streetViewControl: false,
          fullscreenControl: !isSmallScreen(),
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        }}
      >
        {position && (
          <Marker
            position={position}
            animation={
              window.google?.maps?.Animation?.DROP ?? undefined
            }
          />
        )}
      </GoogleMap>

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
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '16px' }}>📍</span>
          <div style={{ flex: 1, minWidth: '140px' }}>
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
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(239,68,68,0.1)',
              color: '#EF4444',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '36px',
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
          {helperText}
        </div>
      )}
    </div>
  )
}

export default MapPicker