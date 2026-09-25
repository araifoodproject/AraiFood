// ============================================================
// src/pages/admin/settlement/AdminSettlementSettingsPage.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { db } from '../../../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminSettlementSettingsPage() {
  const [settings, setSettings] = useState({
    restaurantCommission: 10,
    riderDeliveryFee: 40,
    minSettlement: 500,
    cycle: 'Weekly',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'settlement_settings', 'config'))
        if (snap.exists()) setSettings((p) => ({ ...p, ...snap.data() }))
      } catch (e) {
        // ignore
      }
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settlement_settings', 'config'), {
        ...settings,
        updatedAt: new Date(),
      })
      toast.success('✅ Settings saved')
    } catch (e) {
      toast.error('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="stl-empty">Loading settings...</div>

  return (
    <div className="stl-page">
      <div className="stl-header">
        <div>
          <Link to="/admin/settlement" className="stl-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>⚙️ Settlement Settings</h1>
          <p>Configure commission & payout rules</p>
        </div>
      </div>

      <div className="stl-form-card">
        <div className="stl-form-group">
          <label>Restaurant Commission (%)</label>
          <input
            type="number"
            value={settings.restaurantCommission}
            onChange={(e) =>
              setSettings({
                ...settings,
                restaurantCommission: Number(e.target.value),
              })
            }
            className="stl-input"
          />
          <small>Restaurant will receive (100 − X)% of gross sales</small>
        </div>

        <div className="stl-form-group">
          <label>Rider Delivery Fee (৳ per delivery)</label>
          <input
            type="number"
            value={settings.riderDeliveryFee}
            onChange={(e) =>
              setSettings({
                ...settings,
                riderDeliveryFee: Number(e.target.value),
              })
            }
            className="stl-input"
          />
        </div>

        <div className="stl-form-group">
          <label>Minimum Settlement Amount (৳)</label>
          <input
            type="number"
            value={settings.minSettlement}
            onChange={(e) =>
              setSettings({
                ...settings,
                minSettlement: Number(e.target.value),
              })
            }
            className="stl-input"
          />
        </div>

        <div className="stl-form-group">
          <label>Settlement Cycle</label>
          <select
            value={settings.cycle}
            onChange={(e) => setSettings({ ...settings, cycle: e.target.value })}
            className="stl-input"
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>

        <button
          className="stl-btn stl-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}