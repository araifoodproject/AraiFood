// ============================================================
// src/utils/sendNotification.js
// V3 — Multi-collection + Notify All Riders
// ============================================================

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

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
    chrome_web_icon: `${window.location.origin}/araifood-logo-transparent.png`,
    chrome_web_badge: `${window.location.origin}/araifood-logo-transparent.png`,
  }

  if (userIds && userIds.length > 0) {
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
    userIds: userId && userId !== 'all' && userId !== 'admin' ? [userId] : null,
    url: extra.url || '/',
    imageUrl: extra.imageUrl || null,
  })

  return pushResult
}

// ============================================================
// 4️⃣ NOTIFY ALL RIDERS — when new order is available
// ============================================================
export const notifyAllRiders = async (title, body, extra = {}) => {
  try {
    const ridersQuery = query(
      collection(db, 'riders'),
      where('status', '==', 'approved')
    )
    const snap = await getDocs(ridersQuery)
    const riderUids = snap.docs.map((d) => d.id)

    if (riderUids.length === 0) {
      console.log('⚠️ No approved riders found')
      return { success: false, error: 'No riders available' }
    }

    console.log(`📢 Notifying ${riderUids.length} riders...`)

    // 1️⃣ In-app notifications for each rider
    for (const uid of riderUids) {
      await saveInAppNotification(uid, title, body, 'rider', extra)
    }

    // 2️⃣ Push in one batch
    const pushResult = await sendPushNotification({
      title,
      body,
      userIds: riderUids,
      url: extra.url || '/rider-panel',
      imageUrl: extra.imageUrl || null,
    })

    return pushResult
  } catch (err) {
    console.error('notifyAllRiders error:', err)
    return { success: false, error: err.message }
  }
}

// ============================================================
// 5️⃣ NOTIFY ALL RESTAURANTS — for admin broadcast
// ============================================================
export const notifyAllRestaurants = async (title, body, extra = {}) => {
  try {
    const q = query(
      collection(db, 'restaurants'),
      where('status', '==', 'approved')
    )
    const snap = await getDocs(q)
    const uids = snap.docs.map((d) => d.id)

    if (uids.length === 0) return { success: false, error: 'No restaurants' }

    for (const uid of uids) {
      await saveInAppNotification(uid, title, body, 'restaurant', extra)
    }

    return await sendPushNotification({
      title,
      body,
      userIds: uids,
      url: extra.url || '/restaurant-panel',
      imageUrl: extra.imageUrl || null,
    })
  } catch (err) {
    console.error('notifyAllRestaurants error:', err)
    return { success: false, error: err.message }
  }
}

// ============================================================
// 6️⃣ NOTIFY ALL PHARMACIES — for admin broadcast
// ============================================================
export const notifyAllPharmacies = async (title, body, extra = {}) => {
  try {
    const q = query(
      collection(db, 'pharmacies'),
      where('status', '==', 'approved')
    )
    const snap = await getDocs(q)
    const uids = snap.docs.map((d) => d.id)

    if (uids.length === 0) return { success: false, error: 'No pharmacies' }

    for (const uid of uids) {
      await saveInAppNotification(uid, title, body, 'pharmacy', extra)
    }

    return await sendPushNotification({
      title,
      body,
      userIds: uids,
      url: extra.url || '/pharmacy-panel',
      imageUrl: extra.imageUrl || null,
    })
  } catch (err) {
    console.error('notifyAllPharmacies error:', err)
    return { success: false, error: err.message }
  }
}

// ============================================================
// 7️⃣ NOTIFY ALL CUSTOMERS — for admin broadcast
// ============================================================
export const notifyAllCustomers = async (title, body, extra = {}) => {
  try {
    const q = query(collection(db, 'users'))
    const snap = await getDocs(q)
    const uids = snap.docs.map((d) => d.id)

    if (uids.length === 0) return { success: false, error: 'No customers' }

    for (const uid of uids) {
      await saveInAppNotification(uid, title, body, 'promotion', extra)
    }

    return await sendPushNotification({
      title,
      body,
      userIds: uids,
      url: extra.url || '/',
      imageUrl: extra.imageUrl || null,
    })
  } catch (err) {
    console.error('notifyAllCustomers error:', err)
    return { success: false, error: err.message }
  }
}