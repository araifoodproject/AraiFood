// ============================================================
// src/pages/admin/AdminCustomersPage.jsx
// V3 — Merges users + pharmacies + restaurants + riders
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Eye,
  Users,
  Wallet,
  Trash2,
  Download,
  Plus,
  Minus,
  Bell,
  Ban,
  CheckCircle2,
  ShoppingBag,
  Coins,
  Store,
  Bike,
  Pill,
} from 'lucide-react'

// Role → collection mapping
const ROLE_CONFIG = {
  customer: {
    label: 'Customer',
    icon: '👤',
    color: '#3B82F6',
    collection: 'users',
  },
  rider: {
    label: 'Rider',
    icon: '🛵',
    color: '#EC4899',
    collection: 'riders',
  },
  restaurant: {
    label: 'Restaurant',
    icon: '🏪',
    color: '#F59E0B',
    collection: 'restaurants',
  },
  pharmacy: {
    label: 'Pharmacy',
    icon: '💊',
    color: '#8B5CF6',
    collection: 'pharmacies',
  },
}

function AdminCustomersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [riders, setRiders] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('customer')
  const [sortBy, setSortBy] = useState('newest')
  const [selected, setSelected] = useState(null)

  // Action modal states
  const [showWalletAction, setShowWalletAction] = useState(false)
  const [showPointsAction, setShowPointsAction] = useState(false)
  const [showNotifAction, setShowNotifAction] = useState(false)
  const [actionAmount, setActionAmount] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [actionType, setActionType] = useState('add')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')

  // ============ LIVE DATA — MULTIPLE COLLECTIONS ============
  useEffect(() => {
    let pendingCount = 5
    const checkDone = () => {
      pendingCount -= 1
      if (pendingCount <= 0) setLoading(false)
    }

    // Users (customers + any role in users doc)
    const unsub1 = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
        checkDone()
      },
      (err) => {
        console.error('Users error:', err)
        checkDone()
      }
    )

    // Pharmacies
    const unsub2 = onSnapshot(
      collection(db, 'pharmacies'),
      (snap) => {
        setPharmacies(
          snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
        checkDone()
      },
      (err) => {
        console.error('Pharmacies error:', err)
        checkDone()
      }
    )

    // Restaurants
    const unsub3 = onSnapshot(
      collection(db, 'restaurants'),
      (snap) => {
        setRestaurants(
          snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))
        )
        checkDone()
      },
      (err) => {
        console.error('Restaurants error:', err)
        checkDone()
      }
    )

    // Riders
    const unsub4 = onSnapshot(
      collection(db, 'riders'),
      (snap) => {
        setRiders(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
        checkDone()
      },
      (err) => {
        console.error('Riders error:', err)
        checkDone()
      }
    )

    // Orders (for stats)
    const unsub5 = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() })))
        checkDone()
      },
      (err) => {
        console.error('Orders error:', err)
        checkDone()
      }
    )

    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub5()
    }
  }, [])

  // ============ NORMALIZE ALL DATA WITH ROLE ============
  const allPeople = useMemo(() => {
    const list = []

    // Users (customers mostly)
    users.forEach((u) => {
      list.push({
        ...u,
        _source: 'users',
        _role: u.role || 'customer',
      })
    })

    // Pharmacies
    pharmacies.forEach((p) => {
      list.push({
        firebaseId: p.firebaseId,
        fullName: p.pharmacyName || p.ownerName || 'Unnamed Pharmacy',
        email: p.email || '',
        phone: p.phone || '',
        address: p.address || '',
        profileImage: p.logo || '',
        walletBalance: 0,
        loyaltyPoints: 0,
        createdAt: p.createdAt,
        status: p.status,
        _source: 'pharmacies',
        _role: 'pharmacy',
        _extra: {
          pharmacyStatus: p.pharmacyStatus,
          rating: p.rating,
          deliveryFee: p.deliveryFee,
          ownerName: p.ownerName,
          drugLicenseNumber: p.drugLicenseNumber,
        },
      })
    })

    // Restaurants
    restaurants.forEach((r) => {
      list.push({
        firebaseId: r.firebaseId,
        fullName: r.restaurantName || r.ownerName || 'Unnamed Restaurant',
        email: r.email || '',
        phone: r.phone || '',
        address: r.address || '',
        profileImage: r.logo || '',
        walletBalance: 0,
        loyaltyPoints: 0,
        createdAt: r.createdAt,
        status: r.status,
        _source: 'restaurants',
        _role: 'restaurant',
        _extra: {
          restaurantStatus: r.restaurantStatus,
          rating: r.rating,
          deliveryFee: r.deliveryFee,
          ownerName: r.ownerName,
          cuisine: r.cuisine,
        },
      })
    })

    // Riders
    riders.forEach((r) => {
      list.push({
        firebaseId: r.firebaseId,
        fullName: r.fullName || 'Unnamed Rider',
        email: r.email || '',
        phone: r.phone || '',
        address: r.address || '',
        profileImage: r.profileImage || '',
        walletBalance: 0,
        loyaltyPoints: 0,
        createdAt: r.createdAt,
        status: r.status,
        _source: 'riders',
        _role: 'rider',
        _extra: {
          riderStatus: r.riderStatus,
          rating: r.rating,
          totalDeliveries: r.totalDeliveries,
          vehicleType: r.vehicleType,
        },
      })
    })

    // Sort by createdAt desc
    list.sort((a, b) => {
      const aT =
        a.createdAt?.toDate?.()?.getTime?.() ||
        new Date(a.createdAt).getTime?.() ||
        0
      const bT =
        b.createdAt?.toDate?.()?.getTime?.() ||
        new Date(b.createdAt).getTime?.() ||
        0
      return bT - aT
    })

    return list
  }, [users, pharmacies, restaurants, riders])

  // ============ ORDERS STATS PER USER ============
  const orderStats = useMemo(() => {
    const map = {}
    orders.forEach((o) => {
      const uid = o.userId || o.riderId || o.restaurantId || o.pharmacyId
      if (!uid) return
      if (!map[uid]) map[uid] = { count: 0, spent: 0 }
      map[uid].count += 1
      if (o.status !== 'cancelled') {
        map[uid].spent += Number(o.total) || 0
      }
    })
    return map
  }, [orders])

  // ============ FILTER + SORT ============
  const filteredPeople = useMemo(() => {
    let result = [...allPeople]

    if (roleFilter !== 'all') {
      result = result.filter((c) => c._role === roleFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        `${c.fullName || ''} ${c.email || ''} ${c.phone || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    if (sortBy === 'orders') {
      result.sort(
        (a, b) =>
          (orderStats[b.firebaseId]?.count || 0) -
          (orderStats[a.firebaseId]?.count || 0)
      )
    } else if (sortBy === 'wallet') {
      result.sort(
        (a, b) => (b.walletBalance || 0) - (a.walletBalance || 0)
      )
    } else if (sortBy === 'spent') {
      result.sort(
        (a, b) =>
          (orderStats[b.firebaseId]?.spent || 0) -
          (orderStats[a.firebaseId]?.spent || 0)
      )
    }

    return result
  }, [allPeople, roleFilter, search, sortBy, orderStats])

  // ============ STATS ============
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString()
    return {
      total: allPeople.length,
      customer: allPeople.filter((c) => c._role === 'customer').length,
      rider: allPeople.filter((c) => c._role === 'rider').length,
      restaurant: allPeople.filter((c) => c._role === 'restaurant').length,
      pharmacy: allPeople.filter((c) => c._role === 'pharmacy').length,
      withWallet: allPeople.filter((c) => (c.walletBalance || 0) > 0).length,
      totalWallet: allPeople.reduce(
        (sum, c) => sum + (c.walletBalance || 0),
        0
      ),
      newToday: allPeople.filter(
        (c) =>
          c.createdAt?.toDate?.()?.toLocaleDateString() === today
      ).length,
    }
  }, [allPeople])

  // ============ ACTIONS ============
  const deletePerson = async (person) => {
    const collectionName = person._source
    const displayName = person.fullName
    if (
      !window.confirm(
        `Delete "${displayName}" from ${collectionName}? This cannot be undone.`
      )
    )
      return
    try {
      await deleteDoc(doc(db, collectionName, person.firebaseId))
      toast.success(`"${displayName}" deleted`)
      if (selected?.firebaseId === person.firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const handleWalletAction = async () => {
    if (!selected || selected._source !== 'users') {
      toast.error('Wallet only available for customers')
      return
    }
    const amount = parseFloat(actionAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter valid amount')
      return
    }

    try {
      const currentBalance = selected.walletBalance || 0
      const newBalance =
        actionType === 'add'
          ? currentBalance + amount
          : Math.max(0, currentBalance - amount)

      const transaction = {
        id: Date.now().toString(),
        type: actionType === 'add' ? 'credit' : 'debit',
        amount,
        date: new Date().toLocaleDateString(),
        description:
          actionReason.trim() ||
          (actionType === 'add'
            ? 'Added by admin'
            : 'Deducted by admin'),
      }

      await updateDoc(doc(db, 'users', selected.firebaseId), {
        walletBalance: newBalance,
        walletTransactions: [
          ...(selected.walletTransactions || []),
          transaction,
        ],
      })

      toast.success(
        `৳${amount} ${
          actionType === 'add' ? 'added to' : 'deducted from'
        } wallet`
      )
      setShowWalletAction(false)
      setActionAmount('')
      setActionReason('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update wallet')
    }
  }

  const handlePointsAction = async () => {
    if (!selected || selected._source !== 'users') {
      toast.error('Points only available for customers')
      return
    }
    const amount = parseInt(actionAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter valid amount')
      return
    }

    try {
      const currentPoints = selected.loyaltyPoints || 0
      const newPoints =
        actionType === 'add'
          ? currentPoints + amount
          : Math.max(0, currentPoints - amount)

      const logEntry = {
        id: Date.now().toString(),
        amount: actionType === 'add' ? amount : -amount,
        date: new Date().toLocaleDateString(),
        description:
          actionReason.trim() ||
          (actionType === 'add'
            ? 'Added by admin'
            : 'Deducted by admin'),
      }

      await updateDoc(doc(db, 'users', selected.firebaseId), {
        loyaltyPoints: newPoints,
        pointsHistory: [...(selected.pointsHistory || []), logEntry],
      })

      toast.success(
        `${amount} points ${
          actionType === 'add' ? 'added' : 'deducted'
        }`
      )
      setShowPointsAction(false)
      setActionAmount('')
      setActionReason('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update points')
    }
  }

  const handleSendNotification = async () => {
    if (!selected || !notifTitle.trim()) {
      toast.error('Enter notification title')
      return
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: selected.firebaseId,
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: 'admin',
        read: false,
        createdAt: serverTimestamp(),
      })

      toast.success('Notification sent!')
      setShowNotifAction(false)
      setNotifTitle('')
      setNotifBody('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to send notification')
    }
  }

  const toggleSuspend = async () => {
    if (!selected) return
    const isSuspended = selected.suspended === true
    const collectionName = selected._source
    if (
      !window.confirm(
        isSuspended
          ? `Activate "${selected.fullName}"?`
          : `Suspend "${selected.fullName}"?`
      )
    )
      return

    try {
      await updateDoc(doc(db, collectionName, selected.firebaseId), {
        suspended: !isSuspended,
      })
      toast.success(isSuspended ? 'Account activated' : 'Account suspended')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update')
    }
  }

  const exportCSV = () => {
    if (filteredPeople.length === 0) {
      toast.error('No records to export')
      return
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Wallet',
      'Points',
      'Orders',
      'Total Spent',
      'Joined',
    ]

    const rows = filteredPeople.map((c) => {
      const s = orderStats[c.firebaseId] || { count: 0, spent: 0 }
      return [
        c.fullName || '',
        c.email || '',
        c.phone || '',
        c._role,
        c.status || 'active',
        (c.walletBalance || 0).toFixed(2),
        c.loyaltyPoints || 0,
        s.count,
        s.spent.toFixed(2),
        c.createdAt?.toDate?.()?.toLocaleDateString() || '',
      ]
    })

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `araifood-people-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredPeople.length} records`)
  }

  // ============ HELPERS ============
  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString()
  }

  const getInitials = (name) => {
    if (!name) return '👤'
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // ============ RENDER ============
  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">People</h1>
            <p className="admin-page-sub">
              All users, riders, restaurants, and pharmacies.
            </p>
          </div>
          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Users size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total People</span>
              <strong className="admin-stat-value">{stats.total}</strong>
              <span className="admin-stat-trend up">
                +{stats.newToday} today
              </span>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">👤</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Customers</span>
              <strong className="admin-stat-value">{stats.customer}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">🏪</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Restaurants</span>
              <strong className="admin-stat-value">{stats.restaurant}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">🛵</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Riders</span>
              <strong className="admin-stat-value">{stats.rider}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat purple">
            <div className="admin-stat-icon">💊</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Pharmacies</span>
              <strong className="admin-stat-value">{stats.pharmacy}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Wallet</span>
              <strong className="admin-stat-value">
                ৳{stats.totalWallet.toFixed(0)}
              </strong>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="admin-section" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border)',
              }}
            >
              <Search size={18} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  minWidth: 0,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'var(--surface)',
                    border: 'none',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="newest">📅 Newest</option>
              <option value="orders">📦 Most Orders</option>
              <option value="wallet">💰 Highest Wallet</option>
              <option value="spent">💸 Top Spender</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: `All (${stats.total})` },
              { value: 'customer', label: `Customers (${stats.customer})` },
              { value: 'rider', label: `Riders (${stats.rider})` },
              {
                value: 'restaurant',
                label: `Restaurants (${stats.restaurant})`,
              },
              {
                value: 'pharmacy',
                label: `Pharmacies (${stats.pharmacy})`,
              },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background:
                    roleFilter === opt.value
                      ? 'linear-gradient(135deg, #059669, #047857)'
                      : 'var(--surface)',
                  color:
                    roleFilter === opt.value
                      ? '#FFFFFF'
                      : 'var(--text-secondary)',
                  border:
                    roleFilter === opt.value
                      ? 'none'
                      : '1px solid var(--border-strong)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            margin: '0 0 12px 4px',
          }}
        >
          {filteredPeople.length} result
          {filteredPeople.length !== 1 ? 's' : ''}
        </div>

        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>👥</p>
            <h3>No results found</h3>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredPeople.map((c) => {
              const s = orderStats[c.firebaseId] || { count: 0, spent: 0 }
              const isSuspended = c.suspended === true
              const roleConf = ROLE_CONFIG[c._role] || ROLE_CONFIG.customer

              return (
                <div
                  key={`${c._source}-${c.firebaseId}`}
                  style={{
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    opacity: isSuspended ? 0.6 : 1,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: `${roleConf.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 900,
                      color: roleConf.color,
                      fontFamily: 'var(--font-heading)',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {c.profileImage ? (
                      <img
                        src={c.profileImage}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      getInitials(c.fullName)
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {c.fullName || 'Unnamed'}
                      </strong>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '999px',
                          background: `${roleConf.color}15`,
                          color: roleConf.color,
                          fontSize: '10.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {roleConf.icon} {roleConf.label}
                      </span>
                      {isSuspended && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(220,38,38,0.15)',
                            color: '#dc2626',
                            fontSize: '10.5px',
                            fontWeight: 800,
                          }}
                        >
                          🚫 Suspended
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {c.email && <span>📧 {c.email}</span>}
                      {c.phone && <span>📞 {c.phone}</span>}
                    </div>
                  </div>

                  {/* Orders */}
                  <div style={{ minWidth: '90px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                      }}
                    >
                      Orders
                    </div>
                    <strong
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '15px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {s.count}
                    </strong>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                      }}
                    >
                      ৳{s.spent.toFixed(0)} spent
                    </div>
                  </div>

                  {/* Wallet — only for customers */}
                  {c._role === 'customer' && (
                    <div style={{ minWidth: '90px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        Wallet
                      </div>
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '15px',
                          fontWeight: 900,
                          color: '#059669',
                        }}
                      >
                        ৳{(c.walletBalance || 0).toFixed(0)}
                      </strong>
                    </div>
                  )}

                  {/* Rating/Status for non-customers */}
                  {c._role !== 'customer' && c._extra && (
                    <div style={{ minWidth: '90px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        Rating
                      </div>
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '15px',
                          fontWeight: 900,
                          color: '#f59e0b',
                        }}
                      >
                        ⭐{' '}
                        {typeof c._extra.rating === 'number'
                          ? c._extra.rating.toFixed(1)
                          : '—'}
                      </strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setSelected(c)}
                      title="View Details"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => deletePerson(c)}
                      title="Delete"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(220,38,38,0.12)',
                        border: '1px solid rgba(220,38,38,0.3)',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div
          className="outside-area-modal"
          onClick={() => setSelected(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 0,
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 10,
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: `${
                      (ROLE_CONFIG[selected._role] || ROLE_CONFIG.customer)
                        .color
                    }15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 900,
                    color: (ROLE_CONFIG[selected._role] || ROLE_CONFIG.customer)
                      .color,
                    fontFamily: 'var(--font-heading)',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {selected.profileImage ? (
                    <img
                      src={selected.profileImage}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    getInitials(selected.fullName)
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-heading)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {selected.fullName || 'Unnamed'}
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selected.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '20px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <Row label="👤 Name" value={selected.fullName} />
                <Row label="📧 Email" value={selected.email} />
                <Row label="📞 Phone" value={selected.phone} />
                <Row label="📍 Address" value={selected.address} />
                <Row
                  label="🎭 Role"
                  value={
                    (ROLE_CONFIG[selected._role] || ROLE_CONFIG.customer).label
                  }
                />
                {selected.status && (
                  <Row label="📋 Status" value={selected.status} />
                )}
              </div>

              {/* Extra info for non-customers */}
              {selected._extra && (
                <div
                  style={{
                    padding: '14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {selected._extra.ownerName && (
                    <Row label="👤 Owner" value={selected._extra.ownerName} />
                  )}
                  {selected._extra.pharmacyStatus && (
                    <Row
                      label="💊 Pharmacy Status"
                      value={selected._extra.pharmacyStatus}
                    />
                  )}
                  {selected._extra.restaurantStatus && (
                    <Row
                      label="🏪 Restaurant Status"
                      value={selected._extra.restaurantStatus}
                    />
                  )}
                  {selected._extra.riderStatus && (
                    <Row
                      label="🛵 Rider Status"
                      value={selected._extra.riderStatus}
                    />
                  )}
                  {selected._extra.vehicleType && (
                    <Row
                      label="🛵 Vehicle"
                      value={selected._extra.vehicleType}
                    />
                  )}
                  {selected._extra.cuisine && (
                    <Row label="🍽️ Cuisine" value={selected._extra.cuisine} />
                  )}
                  {selected._extra.drugLicenseNumber && (
                    <Row
                      label="💊 Drug License"
                      value={selected._extra.drugLicenseNumber}
                    />
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                }}
              >
                <StatBox
                  icon={<ShoppingBag size={18} />}
                  label="Orders"
                  value={orderStats[selected.firebaseId]?.count || 0}
                  color="#3B82F6"
                />
                <StatBox
                  icon={<Coins size={18} />}
                  label="Spent"
                  value={`৳${(
                    orderStats[selected.firebaseId]?.spent || 0
                  ).toFixed(0)}`}
                  color="#059669"
                />
                {selected._role === 'customer' && (
                  <>
                    <StatBox
                      icon={<Wallet size={18} />}
                      label="Wallet"
                      value={`৳${(selected.walletBalance || 0).toFixed(0)}`}
                      color="#F59E0B"
                    />
                    <StatBox
                      icon="⭐"
                      label="Points"
                      value={selected.loyaltyPoints || 0}
                      color="#EC4899"
                    />
                  </>
                )}
              </div>

              {/* Actions — only for users collection */}
              {selected._source === 'users' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '8px',
                  }}
                >
                  <ActionBtn
                    icon={<Bell size={16} />}
                    label="Notify"
                    color="#3B82F6"
                    onClick={() => setShowNotifAction(true)}
                  />
                  <ActionBtn
                    icon={<Plus size={16} />}
                    label="Wallet"
                    color="#059669"
                    onClick={() => {
                      setActionType('add')
                      setShowWalletAction(true)
                    }}
                  />
                  <ActionBtn
                    icon="⭐"
                    label="Points"
                    color="#F59E0B"
                    onClick={() => {
                      setActionType('add')
                      setShowPointsAction(true)
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                }}
              >
                <ActionBtn
                  icon={
                    selected.suspended ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Ban size={16} />
                    )
                  }
                  label={selected.suspended ? 'Activate' : 'Suspend'}
                  color={selected.suspended ? '#16a34a' : '#DC2626'}
                  onClick={toggleSuspend}
                />
              </div>

              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <Row label="🆔 ID" value={selected.firebaseId} />
                <Row label="📁 Source" value={selected._source} />
                <Row
                  label="📅 Joined"
                  value={formatDate(selected.createdAt)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALLET MODAL */}
      {showWalletAction && selected && (
        <div
          className="outside-area-modal"
          onClick={() => setShowWalletAction(false)}
          style={{ zIndex: 999999 }}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                💰 Wallet Action
              </h2>
              <button
                onClick={() => setShowWalletAction(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Current balance:{' '}
              <strong style={{ color: '#059669' }}>
                ৳{(selected.walletBalance || 0).toFixed(2)}
              </strong>
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <button
                onClick={() => setActionType('add')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    actionType === 'add'
                      ? 'linear-gradient(135deg, #16a34a, #15803d)'
                      : 'var(--surface-soft)',
                  color:
                    actionType === 'add' ? '#FFFFFF' : 'var(--text-primary)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add
              </button>
              <button
                onClick={() => setActionType('deduct')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    actionType === 'deduct'
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                      : 'var(--surface-soft)',
                  color:
                    actionType === 'deduct'
                      ? '#FFFFFF'
                      : 'var(--text-primary)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Minus size={14} /> Deduct
              </button>
            </div>

            <input
              type="number"
              placeholder="Amount"
              value={actionAmount}
              onChange={(e) => setActionAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                marginBottom: '14px',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="text"
              placeholder="Reason (optional)"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />

            <button
              onClick={handleWalletAction}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '999px',
                background:
                  actionType === 'add'
                    ? 'linear-gradient(135deg, #16a34a, #15803d)'
                    : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* POINTS MODAL */}
      {showPointsAction && selected && (
        <div
          className="outside-area-modal"
          onClick={() => setShowPointsAction(false)}
          style={{ zIndex: 999999 }}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                ⭐ Points Action
              </h2>
              <button
                onClick={() => setShowPointsAction(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Current points:{' '}
              <strong style={{ color: '#f59e0b' }}>
                ⭐ {selected.loyaltyPoints || 0}
              </strong>
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <button
                onClick={() => setActionType('add')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    actionType === 'add'
                      ? 'linear-gradient(135deg, #16a34a, #15803d)'
                      : 'var(--surface-soft)',
                  color:
                    actionType === 'add' ? '#FFFFFF' : 'var(--text-primary)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add
              </button>
              <button
                onClick={() => setActionType('deduct')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background:
                    actionType === 'deduct'
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                      : 'var(--surface-soft)',
                  color:
                    actionType === 'deduct'
                      ? '#FFFFFF'
                      : 'var(--text-primary)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Minus size={14} /> Deduct
              </button>
            </div>

            <input
              type="number"
              placeholder="Points"
              value={actionAmount}
              onChange={(e) => setActionAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />

            <button
              onClick={handlePointsAction}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '999px',
                background:
                  actionType === 'add'
                    ? 'linear-gradient(135deg, #16a34a, #15803d)'
                    : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATION MODAL */}
      {showNotifAction && selected && (
        <div
          className="outside-area-modal"
          onClick={() => setShowNotifAction(false)}
          style={{ zIndex: 999999 }}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                🔔 Notification
              </h2>
              <button
                onClick={() => setShowNotifAction(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                marginBottom: '14px',
                boxSizing: 'border-box',
              }}
            />

            <textarea
              placeholder="Message..."
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-primary)',
              }}
            />

            <button
              onClick={handleSendNotification}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================
function Row({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13.5px',
      }}
    >
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
        {label}
      </span>
      <strong
        style={{
          color: 'var(--text-primary)',
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value || '—'}
      </strong>
    </div>
  )
}

function StatBox({ icon, label, value, color }) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}15`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '10.5px',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </div>
        <strong
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 900,
            color: 'var(--text-primary)',
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px',
        borderRadius: '12px',
        background: `${color}10`,
        border: `1px solid ${color}30`,
        color,
        fontSize: '12.5px',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

export default AdminCustomersPage