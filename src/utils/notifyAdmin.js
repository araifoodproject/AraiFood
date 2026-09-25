// ============================================================
// src/utils/notifyAdmin.js
// Notifies admin when new user/restaurant/rider/pharmacy signs up
// ============================================================

import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { saveInAppNotification, sendPushNotification } from './sendNotification'

/**
 * Get all admin UIDs from users collection
 */
const getAdminUids = async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.id)
  } catch (err) {
    console.error('Failed to get admin UIDs:', err)
    return []
  }
}

/**
 * Notify all admins about a new signup
 * @param {'customer'|'restaurant'|'rider'|'pharmacy'} type
 * @param {string} displayName
 * @param {object} extra - additional data like uid
 */
export const notifyAdminsOfSignup = async (type, displayName, extra = {}) => {
  try {
    const adminUids = await getAdminUids()

    if (adminUids.length === 0) {
      console.log('ℹ️ No admin users found')
      return { success: false, error: 'No admins' }
    }

    // Generate title & body based on type
    let title = ''
    let body = ''

    switch (type) {
      case 'customer':
        title = '🆕 New Customer Signed Up'
        body = `${displayName} just created a customer account on AraiFood.`
        break
      case 'restaurant':
        title = '🏪 New Restaurant Application'
        body = `${displayName} applied to join AraiFood. Review pending.`
        break
      case 'rider':
        title = '🛵 New Rider Application'
        body = `${displayName} applied to become a delivery rider. Review pending.`
        break
      case 'pharmacy':
        title = '💊 New Pharmacy Application'
        body = `${displayName} applied to join AraiFood Pharmacy. Review pending.`
        break
      default:
        title = '🆕 New Signup'
        body = `${displayName} signed up.`
    }

    // 1️⃣ Save in-app for each admin
    for (const uid of adminUids) {
      await saveInAppNotification(uid, title, body, 'admin', {
        url: type === 'customer' ? '/admin/customers' : `/admin/${type}s`,
        signupType: type,
        newUserId: extra.uid || null,
      })
    }

    // 2️⃣ Send push to admins
    const pushResult = await sendPushNotification({
      title,
      body,
      userIds: adminUids,
      url: type === 'customer' ? '/admin/customers' : `/admin/${type}s`,
    })

    console.log(`✅ Admin notified of ${type} signup`)
    return pushResult
  } catch (err) {
    console.error('notifyAdminsOfSignup error:', err)
    return { success: false, error: err.message }
  }
}