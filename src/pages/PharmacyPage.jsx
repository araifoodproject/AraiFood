import { Link } from 'react-router-dom'
import PageBackButton from '../components/PageBackButton'

function PharmacyPage() {
  return (
    <div className="restaurants-page">
      <div className="restaurants-page-container">
        <PageBackButton label="Back" fallback="/" />

        <div className="restaurants-page-header">
          <span className="glass-section-label">ARAIFOOD PHARMACY</span>
          <h1>Pharmacy</h1>
          <p>Get your medicines delivered to your doorstep.</p>
        </div>

        <div className="coming-soon-card">
          <div className="coming-soon-icon">💊</div>
          <h2>Pharmacy is Coming Soon!</h2>
          <p>
            We are working hard to bring pharmacy services to Araihazar. Stay
            tuned!
          </p>
          <Link
            to="/"
            className="checkout-button"
            style={{
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '20px',
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PharmacyPage