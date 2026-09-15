// =========================================
// REAL GPS LOCATION TRACKER
// =========================================

let watchId = null

/**
 * Start watching rider's real GPS location
 * @param {string} riderId - Rider's UID
 * @param {function} onLocationUpdate - Callback with {lat, lng}
 * @param {function} onError - Callback with error
 */
export const startLocationTracking = (riderId, onLocationUpdate, onError) => {
  if (!navigator.geolocation) {
    if (onError) onError('Geolocation not supported by this browser.')
    return null
  }

  // Stop existing watch
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      }
      if (onLocationUpdate) onLocationUpdate(location)
    },
    (error) => {
      let errorMsg = 'Location error'
      if (error.code === 1) errorMsg = 'Location permission denied.'
      else if (error.code === 2) errorMsg = 'Location unavailable.'
      else if (error.code === 3) errorMsg = 'Location request timed out.'
      if (onError) onError(errorMsg)
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  )

  return watchId
}

/**
 * Stop watching location
 */
export const stopLocationTracking = () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

/**
 * Get current location once (no continuous watch)
 * @returns {Promise<{lat, lng}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation not supported.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        let errorMsg = 'Location error'
        if (error.code === 1) errorMsg = 'Location permission denied.'
        else if (error.code === 2) errorMsg = 'Location unavailable.'
        else if (error.code === 3) errorMsg = 'Location request timed out.'
        reject(errorMsg)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    )
  })
}

// =========================================
// SIMULATED LOCATION (for testing)
// =========================================

// Restaurant Locations (Araihazar area)
export const restaurantLocations = {
  'Arai Biriyani House': { lat: 23.7791, lng: 90.6405 },
  'Araihazar Food Corner': { lat: 23.7725, lng: 90.6543 },
  'Digholdi Restaurant': { lat: 23.7855, lng: 90.6620 },
  'Local Taste': { lat: 23.7680, lng: 90.6350 },
  default: { lat: 23.78, lng: 90.64 },
}

/**
 * Get a simulated location between two points based on progress (0-1)
 * @param {{lat, lng}} start - Restaurant location
 * @param {{lat, lng}} end - Customer location
 * @param {number} progress - 0 to 1
 */
export const getSimulatedLocation = (start, end, progress) => {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  return {
    lat: start.lat + (end.lat - start.lat) * clampedProgress,
    lng: start.lng + (end.lng - start.lng) * clampedProgress,
  }
}

/**
 * Map riderStatus to simulated progress
 * @param {string} riderStatus
 */
export const getProgressFromStatus = (riderStatus) => {
  switch (riderStatus) {
    case 'accepted': return 0
    case 'going_to_restaurant': return 0.2
    case 'arrived_at_restaurant': return 0.3
    case 'picked_up': return 0.5
    case 'going_to_customer': return 0.75
    case 'delivered': return 1
    default: return 0
  }
}