import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Heart } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa'
import useSettings from '../hooks/useSettings'

function Footer() {
  const { settings } = useSettings()

  return (
    <footer className="glass-footer">
      <div className="glass-footer-content">
        {/* Brand */}
        <div className="glass-footer-brand">
          <Link to="/" className="glass-footer-logo">
            <img src="/araifood-logo.png" alt="AraiFood" />
            <div>
              <span className="glass-footer-title">
                {(settings.siteName || 'ARAIFOOD').toUpperCase()}
              </span>
              <small className="glass-footer-sub">
                {settings.tagline || 'Good Food, Good Mood'}
              </small>
            </div>
          </Link>

          <p className="glass-footer-desc">
            Your local food delivery platform for Araihazar. Discover great
            food from your favourite local restaurants.
          </p>

          <div className="glass-footer-social">
            <a
              href={settings.facebookUrl || '#'}
              target={settings.facebookUrl ? '_blank' : undefined}
              rel="noreferrer"
              className="glass-footer-social-btn"
              title="Facebook"
            >
              <FaFacebookF size={16} />
            </a>
            <a
              href={settings.instagramUrl || '#'}
              target={settings.instagramUrl ? '_blank' : undefined}
              rel="noreferrer"
              className="glass-footer-social-btn"
              title="Instagram"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href={
                settings.whatsappNumber
                  ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`
                  : '#'
              }
              target={settings.whatsappNumber ? '_blank' : undefined}
              rel="noreferrer"
              className="glass-footer-social-btn"
              title="WhatsApp"
            >
              <FaWhatsapp size={18} />
            </a>
          </div>
        </div>

        {/* Explore */}
        <div className="glass-footer-column">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/about">About Us</Link>
        </div>

        {/* Help */}
        <div className="glass-footer-column">
          <h3>Help</h3>
          <a href="#">Contact Us</a>
          <a href="#">Delivery Information</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
        </div>

        {/* Contact */}
        <div className="glass-footer-column">
          <h3>Contact</h3>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="glass-footer-contact"
          >
            <Mail size={14} strokeWidth={2} />
            {settings.contactEmail}
          </a>
          <a
            href={`tel:${settings.contactPhone?.replace(/\s/g, '')}`}
            className="glass-footer-contact"
          >
            <Phone size={14} strokeWidth={2} />
            {settings.contactPhone}
          </a>
          <a href="#" className="glass-footer-contact">
            <MapPin size={14} strokeWidth={2} />
            {settings.address}
          </a>
        </div>
      </div>

      <div className="glass-footer-bottom">
        <p>
          © {new Date().getFullYear()}{' '}
          {settings.siteName || 'AraiFood'}. Made with{' '}
          <Heart
            size={12}
            strokeWidth={0}
            fill="#EF4444"
            style={{ display: 'inline', verticalAlign: 'middle' }}
          />{' '}
          for Araihazar.
        </p>
      </div>
    </footer>
  )
}

export default Footer