import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const DEFAULT_SETTINGS = {
  siteName: 'AraiFood',
  tagline: 'Good Food, Good Mood',
  contactEmail: 'hello@araifood.com',
  contactPhone: '+880 1700-000000',
  address: 'Araihazar, Narayanganj',
  defaultDeliveryFee: 30,
  minOrderAmount: 100,
  commissionPercent: 10,
  riderEarningPerDelivery: 30,
  openingTime: '10:00',
  closingTime: '22:00',
  facebookUrl: '',
  instagramUrl: '',
  whatsappNumber: '',
  // Gaming
  gamingBkashNumber: '01700000000',
  gamingNagadNumber: '01700000000',
  gamingPopupEnabled: false,
  // Wallet Top-up
  walletBkashNumber: '01700000000',
  walletNagadNumber: '01700000000',
  walletMinAmount: 50,
  walletMaxAmount: 10000,
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() })
        }
        setLoading(false)
      },
      (err) => {
        console.error('Settings load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { settings, loading }
}

export default useSettings