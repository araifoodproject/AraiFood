function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">

        <div className="footer-brand">
          <h2>AraiFood</h2>
          <p>
            Your local food delivery platform for Araihazar.
            Discover great food from your favourite local restaurants.
          </p>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <a href="#">Home</a>
          <a href="#">Restaurants</a>
          <a href="#">Categories</a>
          <a href="#">Offers</a>
        </div>

        <div className="footer-column">
          <h3>Help</h3>
          <a href="#">Contact Us</a>
          <a href="#">Delivery Information</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
        </div>

        <div className="footer-column">
          <h3>Follow Us</h3>
          <a href="#">Facebook</a>
          <a href="#">Instagram</a>
          <a href="#">WhatsApp</a>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 AraiFood. Made for Araihazar.</p>
      </div>
    </footer>
  )
}

export default Footer