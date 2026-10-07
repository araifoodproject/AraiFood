// ============================================================
// src/components/GamingBanner.jsx
// V2 — Bilingual (BN/EN)
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { useLanguage } from '../i18n/LanguageContext'
import pubgImg from '../assets/images/game-pubg.png'
import freefireImg from '../assets/images/game-freefire.png'

function GamingBanner() {
  const { language } = useLanguage()
  const isBn = language === 'bn'

  const [pubgProducts, setPubgProducts] = useState([])
  const [ffProducts, setFFProducts] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gamingProducts'), (snap) => {
      const all = snap.docs
        .map((d) => ({ firebaseId: d.id, ...d.data() }))
        .filter((p) => p.active !== false)

      const pubg = all
        .filter((p) => p.game === 'PUBG')
        .sort((a, b) => (a.price || 0) - (b.price || 0))

      const ff = all
        .filter((p) => p.game === 'Free Fire')
        .sort((a, b) => (a.price || 0) - (b.price || 0))

      setPubgProducts(pubg)
      setFFProducts(ff)
    })
    return () => unsub()
  }, [])

  const getMinPrice = (products) => {
    if (products.length === 0) return 0
    return Math.min(...products.map((p) => p.price || 0))
  }

  const getTopChips = (products) => {
    if (products.length === 0) return []
    if (products.length <= 3) return products
    return [
      products[0],
      products[Math.floor(products.length / 2)],
      products[products.length - 1],
    ]
  }

  return (
    <section className="aa-section">
      <div className="aa-section-header">
        <div>
          <h2 className="aa-section-title">
            {isBn ? 'টপ-আপ ও গেম কারেন্সি' : 'Top-Ups & Game Currency'}
          </h2>
          <p className="aa-section-sub">
            {isBn
              ? 'আপনার গেম একাউন্টে সাথে সাথে ডেলিভারি'
              : 'Instant delivery to your game account'}
          </p>
        </div>
        <Link to="/gaming" className="aa-section-link">
          {isBn ? 'সব গেম দেখুন' : 'Explore all games'} <span>→</span>
        </Link>
      </div>

      <div className="aa-gaming-grid">
        {/* PUBG Card */}
        <Link to="/gaming" className="aa-gaming-card pubg">
          <img
            src={pubgImg}
            alt="PUBG UC"
            className="aa-gaming-card-image"
          />
          <div className="aa-gaming-card-overlay" />
          <div className="aa-gaming-content">
            <h3 className="aa-gaming-title">PUBG UC</h3>
            <p className="aa-gaming-desc">
              {isBn
                ? 'সাথে সাথে PUBG Unknown Cash টপ-আপ'
                : 'Instant PUBG Unknown Cash top-up'}
            </p>
            <div className="aa-gaming-prices">
              {getTopChips(pubgProducts).map((p) => (
                <span
                  key={p.firebaseId}
                  className="aa-gaming-price-chip"
                >
                  {p.name}
                </span>
              ))}
              {pubgProducts.length === 0 && (
                <>
                  <span className="aa-gaming-price-chip">60 UC</span>
                  <span className="aa-gaming-price-chip">325 UC</span>
                  <span className="aa-gaming-price-chip">1800 UC</span>
                </>
              )}
            </div>
            <div className="aa-gaming-bottom">
              <span className="aa-gaming-from">
                {isBn ? 'শুরু' : 'From'} ৳
                {getMinPrice(pubgProducts) || 100}
              </span>
              <span className="aa-gaming-btn">
                {isBn ? 'টপ-আপ' : 'Top-Up'}{' '}
                <ArrowRight size={14} strokeWidth={2.8} />
              </span>
            </div>
          </div>
        </Link>

        {/* Free Fire Card */}
        <Link to="/gaming" className="aa-gaming-card freefire">
          <img
            src={freefireImg}
            alt="Free Fire Diamonds"
            className="aa-gaming-card-image"
          />
          <div className="aa-gaming-card-overlay" />
          <div className="aa-gaming-content">
            <h3 className="aa-gaming-title">Free Fire Diamonds</h3>
            <p className="aa-gaming-desc">
              {isBn
                ? 'Free Fire এর জন্য সাথে সাথে ডায়মন্ড পান'
                : 'Get diamonds instantly for Free Fire'}
            </p>
            <div className="aa-gaming-prices">
              {getTopChips(ffProducts).map((p) => (
                <span
                  key={p.firebaseId}
                  className="aa-gaming-price-chip"
                >
                  {p.name}
                </span>
              ))}
              {ffProducts.length === 0 && (
                <>
                  <span className="aa-gaming-price-chip">100 💎</span>
                  <span className="aa-gaming-price-chip">500 💎</span>
                  <span className="aa-gaming-price-chip">1000 💎</span>
                </>
              )}
            </div>
            <div className="aa-gaming-bottom">
              <span className="aa-gaming-from">
                {isBn ? 'শুরু' : 'From'} ৳
                {getMinPrice(ffProducts) || 80}
              </span>
              <span className="aa-gaming-btn">
                {isBn ? 'টপ-আপ' : 'Top-Up'}{' '}
                <ArrowRight size={14} strokeWidth={2.8} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}

export default GamingBanner