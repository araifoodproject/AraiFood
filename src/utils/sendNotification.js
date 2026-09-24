// ============================================================
// src/utils/sendNotification.js
// V2 — FIXED: OneSignal v16 response handling
// ============================================================

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// ⚠️ These MUST be in your .env file:
// VITE_ONESIGNAL_APP_ID=xxxx
// VITE_ONESIGNAL_REST_API_KEY=xxxx
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY

// ============================================================
// 1️⃣ FIRESTORE — in-app notification
// ============================================================
export const saveInAppNotification = async (
  userId,
  title,
  body,
  type = 'general',
  extra = {}
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      type,
      read: false,
      ...extra,
      createdAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('❌ Firestore notification error:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================
// 2️⃣ ONESIGNAL — push notification
// ============================================================

/**
 * Send push notification via OneSignal REST API
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.body
 * @param {string[]|null} options.userIds - Firebase UIDs (null = all users)
 * @param {string} options.url - Click korle kothay jabe
 * @param {string} options.imageUrl - Optional big picture
 */
export const sendPushNotification = async ({
  title,
  body,
  userIds = null,
  url = '/',
  imageUrl = null,
}) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('❌ OneSignal credentials missing in .env')
    return { success: false, error: 'Missing OneSignal credentials' }
  }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: body },
    url: url,
    chrome_web_icon: `${window.location.origin}/araifood-logo.png`,
    chrome_web_badge: `${window.location.origin}/araifood-logo.png`,
  }

  // Target: specific users OR all
  if (userIds && userIds.length > 0) {
    // OneSignal v16: use include_aliases with external_id
    payload.include_aliases = { external_id: userIds }
    payload.target_channel = 'push'
  } else {
    payload.included_segments = ['Subscribed Users']
  }

  if (imageUrl) {
    payload.big_picture = imageUrl
    payload.chrome_web_image = imageUrl
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    console.log('📨 OneSignal Response:', data)

    // ✅ FIXED: v16 doesn't always return `id`
    // Success indicators:
    //   - data.id exists (older API)
    //   - data.recipients >= 1 (means at least 1 device received)
    //   - No `errors` field
    // Failure indicators:
    //   - data.errors array has values
    //   - data.recipients === 0 AND errors mention "not subscribed"

    const hasErrors =
      data.errors &&
      (Array.isArray(data.errors)
        ? data.errors.length > 0
        : Object.keys(data.errors).length > 0)

    const hasRecipients =
      typeof data.recipients === 'number' && data.recipients > 0

    if (data.id || hasRecipients || !hasErrors) {
      console.log('✅ Push sent:', {
        id: data.id || 'N/A',
        recipients: data.recipients ?? 'unknown',
      })
      return {
        success: true,
        id: data.id || null,
        recipients: data.recipients ?? 0,
      }
    }

    // Real failure
    console.error('❌ OneSignal error:', data)
    return {
      success: false,
      error:
        (Array.isArray(data.errors) && data.errors[0]) ||
        (typeof data.errors === 'object' && Object.values(data.errors)[0]) ||
        'Push failed',
    }
  } catch (err) {
    console.error('❌ Network error:', err)
    return { success: false, error: err.message }
  }
}

// ============================================================
// 3️⃣ COMBINED — Firestore + Push
// ============================================================

/**
 * Send notification to a SINGLE user (in-app + push)
 */
export const sendNotification = async (
  userId,
  title,
  body,
  type = 'general',
  extra = {}
) => {
  await saveInAppNotification(userId, title, body, type, extra)

  const pushResult = await sendPushNotification({
    title,
    body,
    userIds: userId && userId !== 'all' ? [userId] : null,
    url: extra.url || '/',
  })

  return pushResult
}

/**
 * Send notification to MULTIPLE users (in-app + push)
 */
export const sendNotificationToMany = async (
  userIds,
  title,
  body,
  type = 'general',
  extra = {}
) => {
  for (const userId of userIds) {
    if (userId) {
      await saveInAppNotification(userId, title, body, type, extra)
    }
  }

  const pushResult = await sendPushNotification({
    title,
    body,
    userIds,
    url: extra.url || '/',
  })

  return pushResult
}

/**
 * Send notification to ALL users (broadcast)
 */
export const sendNotificationToAll = async (title, body, extra = {}) => {
  await saveInAppNotification('all', title, body, 'broadcast', extra)

  return await sendPushNotification({
    title,
    body,
    userIds: null,
    url: extra.url || '/',
  })
}