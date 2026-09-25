// ============================================================
// src/pages/admin/settlement/AdminSettlementPage.jsx
// V8 — PERMANENT: period-aware pending (no settlementStatus dependency)
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { db } from '../../../firebase'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { toast } from 'react-toastify'
import {
  Store,
  Bike,
  Pill,
  Settings as SettingsIcon,
  History,
  Zap,
  CreditCard,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import OverviewCards from '../../../components/settlement/OverviewCards'
import UnsettledAlert from '../../../components/settlement/UnsettledAlert'
import SettleModal from '../../../components/settlement/SettleModal'
import SettleAllModal from '../../../components/settlement/SettleAllModal'
import AdjustmentModal from '../../../components/settlement/AdjustmentModal'

import {
  filterOrdersByPeriod,
  calcOverview,
  calcRestaurantSettlement,
  calcRiderSettlement,
  groupByRestaurant,
  groupByRider,
  tk,
} from '../../../utils/settlementHelpers'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
]

// ============================================================
// groupByPharmacy
// ============================================================
function groupByPharmacy(orders) {
  const map = {}
  orders.forEach((o) => {
    if (!o.pharmacyId) return
    if (!map[o.pharmacyId]) {
      map[o.pharmacyId] = {
        pharmacyId: o.pharmacyId,
        pharmacyName: o.pharmacyName || 'Unknown Pharmacy',
        orders: [],
      }
    }
    map[o.pharmacyId].orders.push(o)
  })
  return Object.values(map)
}

// ============================================================
// PERMANENT: compute settlement status from timestamps
// Returns 'paid' only if all orders are BEFORE lastSettlementAt
// ============================================================
function computeStatus(orders, lastSettlementAt, orderTimeField) {
  // If no settlement ever done → unpaid
  if (!lastSettlementAt) return 'unpaid'

  const lastSettle = lastSettlementAt?.toDate
    ? lastSettlementAt.toDate()
    : new Date(lastSettlementAt)

  // Check if any order was created AFTER last settlement
  const hasNewer = orders.some((o) => {
    const raw = o[orderTimeField] || o.createdAt
    const t = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null
    return t && t > lastSettle
  })

  return hasNewer ? 'unpaid' : 'paid'
}

export default function AdminSettlementPage() {
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState({})
  const [riders, setRiders] = useState({})
  const [pharmacies, setPharmacies] = useState({})
  const [settings, setSettings] = useState({
    restaurantCommission: 10,
    riderDeliveryFee: 40,
    minSettlement: 500,
  })
  const [period, setPeriod] = useState('month')
  const [tab, setTab] = useState('restaurants')
  const [loading, setLoading] = useState(true)

  const [selectedEntity, setSelectedEntity] = useState(null)
  const [settleType, setSettleType] = useState(null)
  const [showSettleAll, setShowSettleAll] = useState(false)
  const [adjustEntity, setAdjustEntity] = useState(null)
  const [adjustType, setAdjustType] = useState(null)

  // Load settings
  useEffect(() => {
    ;(async () => {
      try {
        const s = await getDoc(doc(db, 'settlement_settings', 'config'))
        if (s.exists()) {
          setSettings((prev) => ({ ...prev, ...s.data() }))
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  // Load orders
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Orders load error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // Load restaurants / riders / pharmacies
  useEffect(() => {
    const u1 = onSnapshot(
      collection(db, 'restaurants'),
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }))
        setRestaurants(map)
      },
      (err) => console.error('Restaurants load error:', err)
    )
    const u2 = onSnapshot(
      collection(db, 'riders'),
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }))
        setRiders(map)
      },
      (err) => console.error('Riders load error:', err)
    )
    const u3 = onSnapshot(
      collection(db, 'pharmacies'),
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }))
        setPharmacies(map)
      },
      (err) => console.error('Pharmacies load error:', err)
    )
    return () => {
      u1()
      u2()
      u3()
    }
  }, [])

  const filteredOrders = useMemo(
    () => filterOrdersByPeriod(orders, period),
    [orders, period]
  )

  const overview = useMemo(
    () =>
      calcOverview(
        filteredOrders,
        settings.restaurantCommission,
        settings.riderDeliveryFee
      ),
    [filteredOrders, settings]
  )

  // ---------- RESTAURANT ROWS ----------
  const restaurantRows = useMemo(() => {
    const groups = groupByRestaurant(filteredOrders)
    return groups.map((g) => {
      const calc = calcRestaurantSettlement(
        g.orders,
        settings.restaurantCommission
      )
      const doc = restaurants[g.restaurantId] || {}
      const status = computeStatus(
        g.orders,
        doc.lastSettlementAt,
        'createdAt'
      )
      return {
        ...g,
        ...calc,
        bkashNumber: doc.bkashNumber || doc.paymentNumber || '',
        phone: doc.phone || '',
        email: doc.email || '',
        computedStatus: status,
      }
    })
  }, [filteredOrders, settings, restaurants])

  // ---------- RIDER ROWS (PERMANENT — merge duplicate IDs by name) ----------
  const riderRows = useMemo(() => {
    const groups = groupByRider(filteredOrders)

    // ✅ Merge groups with the same rider name (fix duplicate Sohag)
    const merged = {}
    groups.forEach((g) => {
      const key = (g.riderName || '').toLowerCase().trim() || g.riderId
      if (!merged[key]) {
        merged[key] = {
          ...g,
          riderId: g.riderId, // keep first
          riderIds: [g.riderId], // track all
        }
      } else {
        merged[key].orders = [...merged[key].orders, ...g.orders]
        if (g.riderId && !merged[key].riderIds.includes(g.riderId)) {
          merged[key].riderIds.push(g.riderId)
        }
      }
    })

    return Object.values(merged).map((g) => {
      const calc = calcRiderSettlement(
        g.orders,
        settings.riderDeliveryFee
      )

      // ✅ Find rider doc — try firebaseId first, then by name match
      let doc = riders[g.riderId]
      if (!doc) {
        // fallback: search by name
        const found = Object.values(riders).find(
          (r) =>
            (r.fullName || '').toLowerCase().trim() ===
            (g.riderName || '').toLowerCase().trim()
        )
        doc = found || {}
      }

      const status = computeStatus(
        g.orders,
        doc.lastSettlementAt,
        'acceptedAt'
      )

      return {
        ...g,
        ...calc,
        bkashNumber: doc.bkashNumber || doc.paymentNumber || '',
        phone: doc.phone || g.riderPhone || '',
        email: doc.email || '',
        resolvedDocId: doc.id || g.riderId, // ✅ use correct doc id
        computedStatus: status,
      }
    })
  }, [filteredOrders, settings, riders])

  // ---------- PHARMACY ROWS ----------
  const pharmacyRows = useMemo(() => {
    const groups = groupByPharmacy(filteredOrders)
    return groups.map((g) => {
      const calc = calcRestaurantSettlement(
        g.orders,
        settings.restaurantCommission
      )
      const doc = pharmacies[g.pharmacyId] || {}
      const status = computeStatus(
        g.orders,
        doc.lastSettlementAt,
        'createdAt'
      )
      return {
        ...g,
        ...calc,
        bkashNumber: doc.bkashNumber || doc.paymentNumber || '',
        phone: doc.phone || '',
        email: doc.email || '',
        computedStatus: status,
      }
    })
  }, [filteredOrders, settings, pharmacies])

  // ---------- PENDING LISTS (for Settle All) ----------
  const pendingRestaurants = useMemo(
    () => restaurantRows.filter((r) => r.computedStatus !== 'paid'),
    [restaurantRows]
  )
  const pendingRiders = useMemo(
    () => riderRows.filter((r) => r.computedStatus !== 'paid'),
    [riderRows]
  )
  const pendingPharmacies = useMemo(
    () => pharmacyRows.filter((r) => r.computedStatus !== 'paid'),
    [pharmacyRows]
  )

  const openSettle = (entity, type) => {
    setSelectedEntity(entity)
    setSettleType(type)
  }
  const openAdjust = (entity, type) => {
    setAdjustEntity(entity)
    setAdjustType(type)
  }

  return (
    <div className="stl-page">
      <div className="stl-header">
        <div>
          <Link to="/admin" className="stl-back">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>💰 Settlement Center</h1>
          <p>Manage restaurant, rider & pharmacy payouts</p>
        </div>
        <div className="stl-header-actions">
          <button
            className="stl-btn stl-btn-ghost"
            onClick={() => setShowSettleAll(true)}
            disabled={
              pendingRestaurants.length +
                pendingRiders.length +
                pendingPharmacies.length ===
              0
            }
          >
            <Zap size={16} /> Settle All
          </button>
          <Link
            to="/admin/settlement/payment-numbers"
            className="stl-btn stl-btn-ghost"
          >
            <CreditCard size={16} /> Payment Numbers
          </Link>
          <Link
            to="/admin/settlement/history"
            className="stl-btn stl-btn-ghost"
          >
            <History size={16} /> History
          </Link>
          <Link
            to="/admin/settlement/settings"
            className="stl-btn stl-btn-ghost"
          >
            <SettingsIcon size={16} /> Settings
          </Link>
        </div>
      </div>

      <div className="stl-period-bar">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`stl-period-btn ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <OverviewCards overview={overview} />

      <UnsettledAlert
        restaurantRows={restaurantRows}
        riderRows={riderRows}
        restaurants={restaurants}
        riders={riders}
      />

      <div className="stl-tabs">
        <button
          className={`stl-tab ${tab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setTab('restaurants')}
        >
          <Store size={16} /> Restaurants ({restaurantRows.length})
        </button>
        <button
          className={`stl-tab ${tab === 'riders' ? 'active' : ''}`}
          onClick={() => setTab('riders')}
        >
          <Bike size={16} /> Riders ({riderRows.length})
        </button>
        <button
          className={`stl-tab ${tab === 'pharmacies' ? 'active' : ''}`}
          onClick={() => setTab('pharmacies')}
        >
          <Pill size={16} /> Pharmacies ({pharmacyRows.length})
        </button>
      </div>

      {loading ? (
        <div className="stl-empty">Loading orders...</div>
      ) : tab === 'restaurants' ? (
        <RestaurantTable
          rows={restaurantRows}
          onSettle={(e) => openSettle(e, 'restaurant')}
          onAdjust={(e) => openAdjust(e, 'restaurant')}
        />
      ) : tab === 'riders' ? (
        <RiderTable
          rows={riderRows}
          onSettle={(e) => openSettle(e, 'rider')}
          onAdjust={(e) => openAdjust(e, 'rider')}
        />
      ) : (
        <PharmacyTable
          rows={pharmacyRows}
          onSettle={(e) => openSettle(e, 'pharmacy')}
          onAdjust={(e) => openAdjust(e, 'pharmacy')}
        />
      )}

      {selectedEntity && (
        <SettleModal
          entity={selectedEntity}
          type={settleType}
          onClose={() => setSelectedEntity(null)}
          onSuccess={() => toast.success('Settlement complete')}
        />
      )}

      {showSettleAll && (
        <SettleAllModal
          restaurantRows={pendingRestaurants}
          riderRows={pendingRiders}
          onClose={() => setShowSettleAll(false)}
          onSuccess={() => toast.success('Bulk settlement complete')}
        />
      )}

      {adjustEntity && (
        <AdjustmentModal
          entity={adjustEntity}
          type={adjustType}
          onClose={() => setAdjustEntity(null)}
          onSuccess={() => toast.success('Adjustment applied')}
        />
      )}
    </div>
  )
}

/* ============================================================
   RESTAURANT TABLE
============================================================ */
function RestaurantTable({ rows, onSettle, onAdjust }) {
  if (rows.length === 0) {
    return (
      <div className="stl-empty">No restaurant orders in this period.</div>
    )
  }
  return (
    <div className="stl-table-wrap">
      <table className="stl-table">
        <thead>
          <tr>
            <th>Restaurant</th>
            <th>Orders</th>
            <th>Gross Sales</th>
            <th>Commission</th>
            <th>Payable</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = r.computedStatus
            return (
              <tr key={r.restaurantId}>
                <td className="stl-td-name">{r.restaurantName}</td>
                <td>{r.orderCount}</td>
                <td>{tk(r.grossSales)}</td>
                <td className="stl-td-red">-{tk(r.commission)}</td>
                <td className="stl-td-bold">{tk(r.finalPayable)}</td>
                <td>
                  <span
                    className={`stl-badge ${
                      status === 'paid' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="stl-btn stl-btn-primary sm"
                      onClick={() => onSettle(r)}
                      disabled={status === 'paid'}
                    >
                      Settle
                    </button>
                    <button
                      className="stl-btn stl-btn-ghost sm"
                      onClick={() => onAdjust(r)}
                    >
                      ± Adjust
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ============================================================
   RIDER TABLE
============================================================ */
function RiderTable({ rows, onSettle, onAdjust }) {
  if (rows.length === 0) {
    return (
      <div className="stl-empty">No rider deliveries in this period.</div>
    )
  }
  return (
    <div className="stl-table-wrap">
      <table className="stl-table">
        <thead>
          <tr>
            <th>Rider</th>
            <th>Deliveries</th>
            <th>Earnings</th>
            <th>Bonus</th>
            <th>Payable</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = r.computedStatus
            return (
              <tr key={r.riderId}>
                <td className="stl-td-name">{r.riderName}</td>
                <td>{r.deliveries}</td>
                <td>{tk(r.earnings)}</td>
                <td className="stl-td-green">+{tk(r.bonus)}</td>
                <td className="stl-td-bold">{tk(r.finalPayable)}</td>
                <td>
                  <span
                    className={`stl-badge ${
                      status === 'paid' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="stl-btn stl-btn-primary sm"
                      onClick={() => onSettle(r)}
                      disabled={status === 'paid'}
                    >
                      Settle
                    </button>
                    <button
                      className="stl-btn stl-btn-ghost sm"
                      onClick={() => onAdjust(r)}
                    >
                      ± Adjust
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ============================================================
   PHARMACY TABLE
============================================================ */
function PharmacyTable({ rows, onSettle, onAdjust }) {
  if (rows.length === 0) {
    return (
      <div className="stl-empty">No pharmacy orders in this period.</div>
    )
  }
  return (
    <div className="stl-table-wrap">
      <table className="stl-table">
        <thead>
          <tr>
            <th>Pharmacy</th>
            <th>Orders</th>
            <th>Gross Sales</th>
            <th>Commission</th>
            <th>Payable</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = r.computedStatus
            return (
              <tr key={r.pharmacyId}>
                <td className="stl-td-name">{r.pharmacyName}</td>
                <td>{r.orderCount}</td>
                <td>{tk(r.grossSales)}</td>
                <td className="stl-td-red">-{tk(r.commission)}</td>
                <td className="stl-td-bold">{tk(r.finalPayable)}</td>
                <td>
                  <span
                    className={`stl-badge ${
                      status === 'paid' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="stl-btn stl-btn-primary sm"
                      onClick={() => onSettle(r)}
                      disabled={status === 'paid'}
                    >
                      Settle
                    </button>
                    <button
                      className="stl-btn stl-btn-ghost sm"
                      onClick={() => onAdjust(r)}
                    >
                      ± Adjust
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}