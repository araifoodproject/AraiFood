// ============================================================
// src/components/settlement/OverviewCards.jsx
// ============================================================
import { Wallet, Store, Bike, TrendingUp, Truck, Coins } from 'lucide-react'
import { tk } from '../../utils/settlementHelpers'

const cards = [
  { key: 'totalSales',        label: 'Total Sales',         icon: Wallet,     color: '#3b82f6', bg: '#eff6ff' },
  { key: 'restaurantPayable', label: 'Restaurant Payable',  icon: Store,      color: '#10b981', bg: '#ecfdf5' },
  { key: 'riderPayable',      label: 'Rider Payable',       icon: Bike,       color: '#f59e0b', bg: '#fffbeb' },
  { key: 'araifoodRevenue',   label: 'AraiFood Commission', icon: Coins,      color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'deliveryCharge',    label: 'Delivery Charge',     icon: Truck,      color: '#06b6d4', bg: '#ecfeff' },
  { key: 'netProfit',         label: 'Net Profit',          icon: TrendingUp, color: '#ef4444', bg: '#fef2f2' },
]

export default function OverviewCards({ overview }) {
  return (
    <div className="stl-cards-grid">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className="stl-card"
            style={{ background: c.bg, borderLeft: `4px solid ${c.color}` }}
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
            <div className="stl-card-value">{tk(overview[c.key])}</div>
            {c.key === 'totalSales' && (
              <div className="stl-card-sub">
                {overview.totalOrders || 0} delivered orders
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}