import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Send a notification to a specific user
 * @param {string} userId - The user ID to send the notification to (uid or 'admin' or 'all')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - 'order' | 'restaurant' | 'rider' | 'general'
 * @param {object} extra - Any extra data (orderId, etc.)
 */
export const sendNotification = async (userId, title, body, type = 'general', extra = {}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: userId,
      title: title,
      body: body,
      type: type,
      read: false,
      ...extra,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

/**
 * Send notification to multiple users
 */
export const sendNotificationToMany = async (userIds, title, body, type = 'general', extra = {}) => {
  for (const userId of userIds) {
    if (userId) {
      await sendNotification(userId, title, body, type, extra)
    }
  }
}