// ============================================================
// src/components/settlement/OverviewCards.jsx
// V2 — COD & Online separated rider cards
// ============================================================
import {
  Wallet,
  Store,
  Bike,
  TrendingUp,
  Coins,
  Banknote,
  Smartphone,
} from 'lucide-react'
import { tk } from '../../utils/settlementHelpers'

const cards = [
  {
    key: 'totalSales',
    label: 'Total Sales',
    icon: Wallet,
    color: '#3b82f6',
    bg: '#eff6ff',
    sub: (o) => `${o.totalOrders || 0} delivered orders`,
  },
  {
    key: 'cashCollected',
    label: 'Rider COD Cash',
    icon: Banknote,
    color: '#10b981',
    bg: '#ecfdf5',
    sub: (o) => `${o.codOrders || 0} COD orders`,
  },
  {
    key: 'riderCashDue',
    label: 'Cash Due from Riders',
    icon: TrendingUp,
    color: '#f59e0b',
    bg: '#fffbeb',
    sub: () => 'Riders owe Admin (COD)',
  },
  {
    key: 'riderOnlineEarnings',
    label: 'Rider Online Earnings',
    icon: Smartphone,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    sub: (o) => `Admin owes riders · ${o.onlineOrders || 0} online`,
  },
  {
    key: 'restaurantPayable',
    label: 'Restaurant Payable',
    icon: Store,
    color: '#06b6d4',
    bg: '#ecfeff',
    sub: () => 'Food sales (90%)',
  },
  {
    key: 'araifoodRevenue',
    label: 'AraiFood Commission',
    icon: Coins,
    color: '#ec4899',
    bg: '#fdf2f8',
    sub: () => '10% of food sales',
  },
]

export default function OverviewCards({ overview }) {
  return (
    <div className="stl-cards-grid">
      {cards.map((c) => {
        const Icon = c.icon
        const value = overview[c.key] || 0
        const subText = c.sub ? c.sub(overview) : ''

        return (
          <div
            key={c.key}
            className="stl-card"
            style={{
              background: c.bg,
              borderLeft: `4px solid ${c.color}`,
            }}
          >
            <div className="stl-card-head">
              <div
                className="stl-card-icon"
                style={{ background: c.color + '20', color: c.color }}
              >
                <Icon size={20} />
              </div>
              <span className="stl-card-label">{c.label}</span>
            </div>
            <div className="stl-card-value">{tk(value)}</div>
            {subText && <div className="stl-card-sub">{subText}</div>}
          </div>
        )
      })}
    </div>
  )
}