// ============================================================
// src/utils/oneSignal.js
// V5 — Multi-collection support (users, restaurants, riders, pharmacies)
// ============================================================

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const ONESIGNAL_COLLECTION_MAP = {
  customer: 'users',
  restaurant: 'restaurants',
  rider: 'riders',
  pharmacy: 'pharmacies',
  admin: 'users',
}

/**
 * Get which collection to save fcmToken
 */
const getCollectionForRole = () => {
  if (typeof window === 'undefined') return 'users'
  const role = localStorage.getItem('userRole') || 'customer'
  return ONESIGNAL_COLLECTION_MAP[role] || 'users'
}

/**
 * Wait for OneSignal SDK
 */
export const waitForOneSignal = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)
    if (window.OneSignal && window.OneSignal.User) {
      return resolve(window.OneSignal)
    }

    window.OneSignalDeferred = window.OneSignalDeferred || []
    let resolved = false
    const done = (val) => {
      if (resolved) return
      resolved = true
      resolve(val)
    }

    window.OneSignalDeferred.push(async (OneSignal) => {
      done(OneSignal)
    })

    setTimeout(() => done(null), 8000)
  })
}

/**
 * Get browser permission
 */
export const getBrowserPermission = () => {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/**
 * Check subscription status
 */
export const getSubscriptionStatus = async () => {
  try {
    const os = await waitForOneSignal()
    if (!os) return { enabled: false, id: null }

    const sub = os.User?.PushSubscription
    const id = sub?.id
    const optedIn = sub?.optedIn
    const token = sub?.token

    return {
      enabled: Boolean(id && optedIn && token),
      id: id || null,
    }
  } catch (err) {
    console.error('getSubscriptionStatus error:', err)
    return { enabled: false, id: null }
  }
}

/**
 * Hard reset — clears OneSignal subscription completely
 */
export const hardResetSubscription = async () => {
  try {
    const os = await waitForOneSignal()
    if (!os) return { success: false, error: 'OneSignal not loaded' }

    try {
      await os.logout()
    } catch (e) {
      console.warn('Logout error:', e)
    }

    try {
      await os.User?.PushSubscription?.optOut?.()
    } catch (e) {
      console.warn('OptOut error:', e)
    }

    await new Promise((r) => setTimeout(r, 1500))
    return { success: true }
  } catch (err) {
    console.error('hardResetSubscription error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * ⭐ Save fcmToken to Firestore with role-aware collection
 * Creates document if it doesn't exist (merges)
 */
const saveFcmToken = async (uid, subscriptionId, enabled) => {
  const collection = getCollectionForRole()
  const docRef = doc(db, collection, uid)

  try {
    // Try getDoc first — if not exist, use setDoc with merge
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      console.warn(
        `⚠️ ${collection}/${uid} doesn't exist — creating minimal doc`
      )
      await setDoc(
        docRef,
        {
          fcmToken: enabled ? subscriptionId : null,
          fcmTokenUpdatedAt: serverTimestamp(),
          notificationEnabled: enabled,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    } else {
      await updateDoc(docRef, {
        fcmToken: enabled ? subscriptionId : null,
        fcmTokenUpdatedAt: serverTimestamp(),
        notificationEnabled: enabled,
      })
    }
    console.log(`✅ Saved fcmToken to ${collection}/${uid}`)
    return { success: true, collection }
  } catch (err) {
    console.error(`❌ Failed to save to ${collection}/${uid}:`, err)
    return { success: false, error: err.message, collection }
  }
}

/**
 * Enable push notifications
 */
export const enableNotifications = async (user) => {
  try {
    if (!user?.uid) {
      return { success: false, error: 'Please login first' }
    }

    if (!('Notification' in window)) {
      return {
        success: false,
        error: 'Notifications not supported in this browser',
      }
    }

    // Request permission
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied by user' }
    }

    const os = await waitForOneSignal()
    if (!os) {
      return {
        success: false,
        error: 'OneSignal SDK not loaded. Check index.html',
      }
    }

    // Check current state
    const currentState = {
      id: os.User?.PushSubscription?.id,
      optedIn: os.User?.PushSubscription?.optedIn,
      token: os.User?.PushSubscription?.token,
      externalId: os.User?.externalId,
    }

    // If token missing → hard reset
    const needsReset =
      currentState.id && (!currentState.token || !currentState.optedIn)

    if (needsReset) {
      console.log('🔧 Token missing — performing hard reset...')
      await hardResetSubscription()
    } else if (
      currentState.externalId &&
      currentState.externalId !== user.uid
    ) {
      console.log('🔄 Switching user:', currentState.externalId, '→', user.uid)
      try {
        await os.logout()
        await new Promise((r) => setTimeout(r, 600))
      } catch (e) {
        console.warn('Logout skipped:', e)
      }
    }

    // Login
    try {
      await os.login(user.uid)
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      const errStr = String(err?.message || err || '')
      if (
        err?.status === 409 ||
        errStr.includes('409') ||
        errStr.includes('Conflict')
      ) {
        console.warn('⚠️ 409 conflict ignored')
      } else {
        console.warn('Login error:', err)
      }
    }

    // Opt in
    try {
      if (!os.User?.PushSubscription?.optedIn) {
        if (os.User?.PushSubscription?.optIn) {
          await os.User.PushSubscription.optIn()
        }
      }
    } catch (err) {
      console.warn('optIn attempt failed:', err)
    }

    // Slidedown fallback
    await new Promise((r) => setTimeout(r, 800))
    if (!os.User?.PushSubscription?.token) {
      try {
        if (os.Slidedown?.promptPush) {
          await os.Slidedown.promptPush()
          await new Promise((r) => setTimeout(r, 1500))
        }
      } catch (err) {
        console.warn('Slidedown failed:', err)
      }
    }

    await new Promise((r) => setTimeout(r, 2500))

    const finalSub = os.User?.PushSubscription
    const subscriptionId = finalSub?.id
    const optedIn = finalSub?.optedIn
    const token = finalSub?.token

    if (!subscriptionId || !optedIn || !token) {
      return {
        success: false,
        error: `Subscription incomplete (ID: ${
          subscriptionId || 'none'
        }, OptedIn: ${optedIn}, Token: ${token ? 'yes' : 'no'})`,
      }
    }

    // Save to Firestore (role-aware)
    const saveResult = await saveFcmToken(user.uid, subscriptionId, true)
    if (!saveResult.success) {
      return {
        success: false,
        error: `Push enabled but save failed: ${saveResult.error}`,
      }
    }

    return { success: true, id: subscriptionId }
  } catch (err) {
    console.error('enableNotifications error:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Disable push notifications
 */
export const disableNotifications = async (user) => {
  try {
    const os = await waitForOneSignal()
    if (os) {
      try {
        await os.User?.PushSubscription?.optOut?.()
      } catch (err) {
        console.warn('optOut error:', err)
      }
    }

    if (user?.uid) {
      // Save with role-aware collection
      await saveFcmToken(user.uid, null, false)
    }

    return { success: true }
  } catch (err) {
    console.error('disableNotifications error:', err)
    return { success: false, error: err.message }
  }
}