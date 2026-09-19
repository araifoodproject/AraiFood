import { Truck, Clock, Wallet } from 'lucide-react'
import useSettings from '../hooks/useSettings'

function DeliveryStats() {
  const { settings } = useSettings()

  const openingTime = settings.openingTime || '10:00'
  const closingTime = settings.closingTime || '22:00'

  const formatTime = (time) => {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}${minute !== '00' ? ':' + minute : ''} ${ampm}`
  }

  const stats = [
    {
      icon: Truck,
      value: '30 min',
      label: 'Average Delivery',
      color: 'green',
    },
    {
      icon: Clock,
      value: `${formatTime(openingTime)} - ${formatTime(closingTime)}`,
      label: 'Working Hours',
      color: 'orange',
    },
    {
      icon: Wallet,
      value: `৳${settings.defaultDeliveryFee ?? 30}`,
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
                <strong className="glass-delivery-stat-value">
                  {stat.value}
                </strong>
                <span className="glass-delivery-stat-label">
                  {stat.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default DeliveryStats