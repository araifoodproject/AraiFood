// ============================================================
// src/utils/settlementHelpers.js
// V2 — Zone-based rider fee
// ============================================================

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

export function isDelivered(order) {
  return order.status === 'delivered'
}

/**
 * ✅ Restaurant Settlement
 * grossSales = food subtotal
 * commission = food subtotal × rate%
 * finalPayable = grossSales - commission
 */
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

/**
 * ✅ Rider Settlement (ZONE-BASED FEE)
 * Collects zoneDeliveryFee per order (falls back to deliveryFee)
 */
export function calcRiderSettlement(orders) {
  const delivered = orders.filter(isDelivered)

  const totalDeliveryFee = delivered.reduce(
    (sum, o) =>
      sum + (Number(o.zoneDeliveryFee) || Number(o.deliveryFee) || 0),
    0
  )

  // Cash collected from customer (order total on COD)
  const codOrders = delivered.filter(
    (o) => (o.paymentMethod || '').toLowerCase() === 'cod'
  )
  const cashCollected = codOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  )

  // Rider keeps delivery fee, sends rest to admin
  const dueToAdmin = cashCollected - totalDeliveryFee

  return {
    deliveries: delivered.length,
    earnings: totalDeliveryFee, // rider's fee
    totalDeliveryFee,
    cashCollected, // COD collected
    dueToAdmin: Math.max(dueToAdmin, 0), // what rider sends to admin
    bonus: 0,
    penalty: 0,
    finalPayable: totalDeliveryFee, // what admin owes rider (fee)
  }
}

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

/**
 * Overview cards
 * totalSales = SUM(total)
 * restaurantPayable = SUM(subtotal) × (1 - commission%)
 * riderPayable = SUM(zoneDeliveryFee)
 * araifoodRevenue = SUM(subtotal) × commission%
 * cashCollected = SUM(total) where COD
 * riderCashDue = cashCollected - riderPayable
 */
export function calcOverview(orders, commissionPercent = 10, riderFee = 40) {
  const delivered = orders.filter(isDelivered)

  const totalSales = delivered.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  )
  const grossFood = delivered.reduce(
    (sum, o) => sum + (Number(o.subtotal) || 0),
    0
  )
  const riderPayable = delivered
    .filter((o) => o.riderId)
    .reduce(
      (sum, o) =>
        sum + (Number(o.zoneDeliveryFee) || Number(o.deliveryFee) || 0),
      0
    )

  const restaurantPayable = Math.round(
    grossFood - (grossFood * commissionPercent) / 100
  )
  const araifoodRevenue = Math.round((grossFood * commissionPercent) / 100)

  // COD cash collected by riders
  const cashCollected = delivered
    .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cod')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  const riderCashDue = cashCollected - riderPayable
  const netProfit = araifoodRevenue

  return {
    totalSales,
    totalOrders: delivered.length,
    restaurantPayable,
    riderPayable,
    araifoodRevenue,
    deliveryCharge: riderPayable,
    netProfit,
    cashCollected,
    riderCashDue: Math.max(riderCashDue, 0),
  }
}

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