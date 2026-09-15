import { Truck, Clock, Wallet } from 'lucide-react'

function DeliveryStats() {
  const stats = [
    {
      icon: Truck,
      value: '30 min',
      label: 'Average Delivery',
      color: 'green',
    },
    {
      icon: Clock,
      value: '10 AM - 10 PM',
      label: 'Working Hours',
      color: 'orange',
    },
    {
      icon: Wallet,
      value: '৳30',
      label: 'Delivery Charge',
      color: 'green',
    },
  ]

  return (
    <section className="glass-delivery-stats">
      <div className="glass-delivery-stats-grid">
        {stats.map((stat, idx) => {
          const IconComponent = stat.icon
          return (
            <div
              key={idx}
              className={`glass-delivery-stat glass-delivery-stat-${stat.color}`}
            >
              <div className="glass-delivery-stat-icon">
                <IconComponent size={24} strokeWidth={2} />
              </div>
              <div className="glass-delivery-stat-content">
                <strong className="glass-delivery-stat-value">{stat.value}</strong>
                <span className="glass-delivery-stat-label">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default DeliveryStats