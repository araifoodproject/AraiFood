// ============================================================
// src/utils/settlementHelpers.js
// V3 — COD vs Online separation (Rider flows)
// ============================================================

// ------------------------------------------------------------
// Period filter
// ------------------------------------------------------------
export function filterOrdersByPeriod(orders, period) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return orders.filter((order) => {
    let ts = null
    if (order.createdAt?.toDate) ts = order.createdAt.toDate()
    else if (order.createdAt) ts = new Date(order.createdAt)
    if (!ts) return false

    if (period === 'today') return ts >= today
    if (period === 'yesterday') {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return ts >= y && ts < today
    }
    if (period === 'week') {
      const w = new Date(today)
      w.setDate(w.getDate() - 7)
      return ts >= w
    }
    if (period === 'month') {
      const m = new Date(today)
      m.setDate(m.getDate() - 30)
      return ts >= m
    }
    return true
  })
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
export function isDelivered(order) {
  return order.status === 'delivered'
}

export function isCOD(order) {
  return (order.paymentMethod || '').toLowerCase() === 'cod'
}

export function isOnline(order) {
  return (
    isDelivered(order) &&
    (order.paymentMethod || '').toLowerCase() !== 'cod' &&
    !!order.paymentMethod
  )
}

// ------------------------------------------------------------
// Restaurant Settlement
// COD + Online both — restaurant doesn't care how customer paid
// ------------------------------------------------------------
export function calcRestaurantSettlement(orders, commissionPercent = 10) {
  const delivered = orders.filter(isDelivered)
  const grossSales = delivered.reduce(
    (sum, o) => sum + (Number(o.subtotal) || 0),
    0
  )
  const commission = Math.round((grossSales * commissionPercent) / 100)
  const payable = grossSales - commission

  return {
    orderCount: delivered.length,
    grossSales,
    commission,
    finalPayable: Math.max(payable, 0),
  }
}

// ------------------------------------------------------------
// 🅰️ Rider COD Settlement (Rider → Admin)
// Only COD delivered orders
// ------------------------------------------------------------
export function calcRiderCODSettlement(orders) {
  const deliveredCOD = orders.filter((o) => isDelivered(o) && isCOD(o))

  const cashCollected = deliveredCOD.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  )
  const codFee = deliveredCOD.reduce(
    (sum, o) =>
      sum + (Number(o.zoneDeliveryFee) || Number(o.deliveryFee) || 0),
    0
  )
  const toSendAdmin = Math.max(cashCollected - codFee, 0)

  return {
    codDeliveries: deliveredCOD.length,
    cashCollected,
    codFee,
    toSendAdmin,
  }
}

// ------------------------------------------------------------
// 🅱️ Rider Online Earnings (Admin → Rider)
// Only online delivered orders
// ------------------------------------------------------------
export function calcRiderOnlineSettlement(orders) {
  const deliveredOnline = orders.filter(
    (o) =>
      isDelivered(o) &&
      (o.paymentMethod || '').toLowerCase() !== 'cod' &&
      !!o.paymentMethod
  )

  const onlineDeliveries = deliveredOnline.length
  const onlineEarnings = deliveredOnline.reduce(
    (sum, o) =>
      sum + (Number(o.zoneDeliveryFee) || Number(o.deliveryFee) || 0),
    0
  )

  return {
    onlineDeliveries,
    onlineEarnings,
    finalPayable: onlineEarnings,
  }
}

// ------------------------------------------------------------
// Group by Restaurant / Rider / Pharmacy
// ------------------------------------------------------------
export function groupByRestaurant(orders) {
  const map = {}
  orders.forEach((o) => {
    if (!o.restaurantId) return
    if (!map[o.restaurantId]) {
      map[o.restaurantId] = {
        restaurantId: o.restaurantId,
        restaurantName: o.restaurantName || 'Unknown Restaurant',
        orders: [],
      }
    }
    map[o.restaurantId].orders.push(o)
  })
  return Object.values(map)
}

export function groupByRider(orders) {
  const map = {}
  orders.forEach((o) => {
    if (!o.riderId) return
    if (!map[o.riderId]) {
      map[o.riderId] = {
        riderId: o.riderId,
        riderName: o.riderName || 'Unknown Rider',
        riderPhone: o.riderPhone || '',
        orders: [],
      }
    }
    map[o.riderId].orders.push(o)
  })
  return Object.values(map)
}

export function groupByPharmacy(orders) {
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

// ------------------------------------------------------------
// Overview Cards
// ------------------------------------------------------------
export function calcOverview(orders, commissionPercent = 10) {
  const delivered = orders.filter(isDelivered)

  const totalSales = delivered.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  )
  const grossFood = delivered.reduce(
    (sum, o) => sum + (Number(o.subtotal) || 0),
    0
  )

  // Restaurant payable (all delivered)
  const restaurantPayable = Math.round(
    grossFood - (grossFood * commissionPercent) / 100
  )
  const araifoodRevenue = Math.round((grossFood * commissionPercent) / 100)

  // COD cash collected by riders
  const cashCollected = delivered
    .filter(isCOD)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const riderCODFee = delivered
    .filter(isCOD)
    .reduce(
      (sum, o) =>
        sum + (Number(o.zoneDeliveryFee) || Number(o.deliveryFee) || 0),
      0
    )
  const riderCashDue = Math.max(cashCollected - riderCODFee, 0)

  // Online rider earnings (admin owes)
  const riderOnlineEarnings = delivered
    .filter(
      (o) =>
        (o.paymentMethod || '').toLowerCase() !== 'cod' && !!o.paymentMethod
    )
    .reduce(
      (sum, o) =>
        sum + (Number(o.zoneDeliveryFee) || Number(o.deliveryFee) || 0),
      0
    )

  // Delivery charge total (both flows)
  const deliveryCharge = riderCODFee + riderOnlineEarnings

  return {
    totalSales,
    totalOrders: delivered.length,
    restaurantPayable,
    riderPayable: riderOnlineEarnings, // admin owes riders (online)
    araifoodRevenue,
    deliveryCharge,
    netProfit: araifoodRevenue,
    // New fields
    cashCollected,
    riderCashDue,
    riderOnlineEarnings,
    codOrders: delivered.filter(isCOD).length,
    onlineOrders: delivered.filter(
      (o) =>
        (o.paymentMethod || '').toLowerCase() !== 'cod' && !!o.paymentMethod
    ).length,
  }
}

// ------------------------------------------------------------
// Format helpers
// ------------------------------------------------------------
export function tk(n) {
  return `৳${Number(n || 0).toLocaleString('en-BD')}`
}

export function fmtDate(d) {
  if (!d) return '-'
  const date = d.toDate ? d.toDate() : new Date(d)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function genSettlementId() {
  return 'STL-' + Date.now().toString(36).toUpperCase()
}

// ------------------------------------------------------------
// Rider status compute (per-period, timestamp-based)
// ------------------------------------------------------------
export function computeStatus(orders, lastSettlementAt, orderTimeField) {
  if (!lastSettlementAt) return 'unpaid'

  const lastSettle = lastSettlementAt?.toDate
    ? lastSettlementAt.toDate()
    : new Date(lastSettlementAt)

  const hasNewer = orders.some((o) => {
    const raw = o[orderTimeField] || o.createdAt
    const t = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null
    return t && t > lastSettle
  })

  return hasNewer ? 'unpaid' : 'paid'
}