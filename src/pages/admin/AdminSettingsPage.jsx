// ============================================================
// src/pages/admin/AdminSettingsPage.jsx
// V3 — + Legal Pages editor (Refund / Privacy / Terms)
// ============================================================

import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Save,
  Globe,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Clock,
  Percent,
  Truck,
  Wallet,
  Sparkles,
  Layout,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Home,
  Layers,
  MessageCircle,
  Handshake,
  Bell,
  User,
  Store,
  Bike,
  Pill,
  Scale,
  FileText,
} from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from 'react-icons/fa'

const SETTINGS_DOC_ID = 'platform'
const NOTIFICATION_DOC_ID = 'notifications'
const LEGAL_DOC_ID = 'legal'

// ------------------------------------------------------------
// Defaults
// ------------------------------------------------------------
const DEFAULT_FEATURES = [
  { icon: '🚚', color: 'green', title: 'Fast Delivery', desc: '30-45 min to your door' },
  { icon: '📍', color: 'blue', title: 'Araihazar Focused', desc: 'Local sellers & services' },
  { icon: '🛡️', color: 'dark', title: 'Secure Payment', desc: 'Safe & encrypted transactions' },
  { icon: '🎧', color: 'pink', title: 'Local Support', desc: '24/7 friendly help nearby' },
]

const DEFAULT_CATEGORIES = [
  { name: 'Biryani', emoji: '🍛', color: 'biryani', query: 'biryani' },
  { name: 'Burger', emoji: '🍔', color: 'burger', query: 'burger' },
  { name: 'Pizza', emoji: '🍕', color: 'pizza', query: 'pizza' },
  { name: 'Chinese', emoji: '🍜', color: 'chinese', query: 'chinese' },
  { name: 'Chicken', emoji: '🍗', color: 'chicken', query: 'chicken' },
  { name: 'Snacks', emoji: '🍟', color: 'snacks', query: 'snacks' },
  { name: 'Drinks', emoji: '🥤', color: 'drinks', query: 'drinks' },
  { name: 'Desserts', emoji: '🍰', color: 'desserts', query: 'dessert' },
]

const DEFAULT_COMPANY_LINKS = [
  { text: 'About Us', url: '/about', isExternal: false },
  { text: 'Careers', url: '/careers', isExternal: false },
]

const DEFAULT_SUPPORT_LINKS = [
  { text: 'Help Center', url: '/help', isExternal: false },
  { text: 'Contact Us', url: '/contact', isExternal: false },
  { text: 'FAQs', url: '/help', isExternal: false },
]

// ------------------------------------------------------------
// Welcome Notification Defaults
// ------------------------------------------------------------
const DEFAULT_WELCOME = {
  customer: {
    enabled: true,
    title: '🎉 Welcome to AraiFood!',
    body: 'Thanks for joining AraiFood. Start ordering your favourite food now!',
  },
  restaurant: {
    enabled: true,
    title: '🏪 Welcome to AraiFood Partner!',
    body: 'Your account is under review. You will be notified once approved.',
  },
  rider: {
    enabled: true,
    title: '🛵 Welcome to AraiFood Riders!',
    body: 'Your application is pending admin approval. Stay tuned!',
  },
  pharmacy: {
    enabled: true,
    title: '💊 Welcome to AraiFood Pharmacy!',
    body: 'Your account is pending approval. We will notify you soon!',
  },
}

// ------------------------------------------------------------
// Legal Pages Defaults
// ------------------------------------------------------------
const DEFAULT_LEGAL = {
  refundTitle: 'Refund Policy',
  refundContent: '',
  privacyTitle: 'Privacy Policy',
  privacyContent: '',
  termsTitle: 'Terms & Conditions',
  termsContent: '',
}

function AdminSettingsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ---------- PLATFORM STATE ----------
  const [state, setState] = useState({
    siteName: 'AraiFood',
    tagline: 'Good Food, Good Mood',
    contactEmail: 'hello@araifood.com',
    contactPhone: '+880 1700-000000',
    address: 'Araihazar, Narayanganj',
    defaultDeliveryFee: '30',
    minOrderAmount: '100',
    commissionPercent: '10',
    riderEarningPerDelivery: '30',
    freeDeliveryThreshold: '500',
    openingTime: '10:00',
    closingTime: '22:00',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    whatsappNumber: '',
    appStoreUrl: '',
    playStoreUrl: '',
    gamingBkashNumber: '01700000000',
    gamingNagadNumber: '01700000000',
    walletBkashNumber: '01700000000',
    walletNagadNumber: '01700000000',
    walletMinAmount: '50',
    walletMaxAmount: '10000',
    defaultDeliveryTime: '30-40 min',
    deliveryAreaName: 'Araihazar Thana',
    deliverySlots: ['6-7pm', '7-8pm', '8-9pm', '9-10pm'],
    mapDefaultLat: '23.78',
    mapDefaultLng: '90.64',
    mapDefaultZoom: '14',
    heroTitle1: 'App -',
    heroTitle2: 'Food, Pharmacy & Gaming',
    heroTitle3: 'in One Place',
    heroSearchPlaceholder: 'Search food, medicine or games...',
    trustText1: 'Trusted by 50k+ in Araihazar',
    trustText2: '4.8★ Rating',
    trustText3: 'Updated Oct 2025',
    features: DEFAULT_FEATURES,
    homePopularTitle: 'Popular Restaurants Near You',
    homePopularSubtitle: 'Top-rated picks from Araihazar',
    homePopularLimit: '6',
    categoriesTitle: 'Food Categories',
    categoriesSubtitle: 'Browse by categories',
    categoriesList: DEFAULT_CATEGORIES,
    deliveryAreasTitle: 'We Deliver Around Araihazar',
    deliveryAreasSubtitle: 'Fast delivery across your locality',
    partnerSectionTitle: 'Become a Partner',
    partnerSectionSubtitle: 'Grow with us in Araihazar',
    partnerRestaurantTitle: 'Own a Restaurant?',
    partnerRestaurantSubtitle: 'Join AraiFood',
    partnerRestaurantDesc:
      'List your restaurant, reach 50k+ customers, hassle-free onboarding & higher sales',
    partnerRestaurantBtn: 'Partner with us',
    partnerRestaurantPath: '/restaurant-signup',
    partnerRiderTitle: 'Want to Become a Rider?',
    partnerRiderSubtitle: 'Deliver with AraiFood',
    partnerRiderDesc:
      'Flexible earnings, weekly payouts, support & safety gear provided',
    partnerRiderBtn: 'Ride with us',
    partnerRiderPath: '/rider-signup',
    footerTagline: 'Food, Pharmacy & Gaming in One Place',
    footerCompanyName: 'AraiFood Ltd.',
    footerCompanyLinks: DEFAULT_COMPANY_LINKS,
    footerSupportLinks: DEFAULT_SUPPORT_LINKS,
    footerAppsLabel: 'Available on',
    liveChatTeamName: 'Support Team',
    liveChatStatus: 'Online Now',
    liveChatAvatar: '👨‍💼',
    liveChatWelcome: 'Hello! 👋 How can we help you today?',
    liveChatAutoReply:
      'Thank you for your message! Our team will get back to you shortly. 😊',
    liveChatPlaceholder: 'Type your message...',
  })

  // ---------- WELCOME NOTIFICATION STATE ----------
  const [welcome, setWelcome] = useState(DEFAULT_WELCOME)

  // ---------- LEGAL PAGES STATE ----------
  const [legal, setLegal] = useState(DEFAULT_LEGAL)

  const set = (key, value) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const setWelcomeField = (role, field, value) => {
    setWelcome((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }))
  }

  const setLegalField = (field, value) => {
    setLegal((prev) => ({ ...prev, [field]: value }))
  }

  // ---------- LOAD ----------
  useEffect(() => {
    const load = async () => {
      try {
        // Load platform settings
        const snap = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID))
        if (snap.exists()) {
          const d = snap.data()
          setState((prev) => ({
            ...prev,
            siteName: d.siteName ?? prev.siteName,
            tagline: d.tagline ?? prev.tagline,
            contactEmail: d.contactEmail ?? prev.contactEmail,
            contactPhone: d.contactPhone ?? prev.contactPhone,
            address: d.address ?? prev.address,
            defaultDeliveryFee: String(d.defaultDeliveryFee ?? prev.defaultDeliveryFee),
            minOrderAmount: String(d.minOrderAmount ?? prev.minOrderAmount),
            commissionPercent: String(d.commissionPercent ?? prev.commissionPercent),
            riderEarningPerDelivery: String(
              d.riderEarningPerDelivery ?? prev.riderEarningPerDelivery
            ),
            freeDeliveryThreshold: String(
              d.freeDeliveryThreshold ?? prev.freeDeliveryThreshold
            ),
            openingTime: d.openingTime ?? prev.openingTime,
            closingTime: d.closingTime ?? prev.closingTime,
            facebookUrl: d.facebookUrl ?? prev.facebookUrl,
            instagramUrl: d.instagramUrl ?? prev.instagramUrl,
            twitterUrl: d.twitterUrl ?? prev.twitterUrl,
            linkedinUrl: d.linkedinUrl ?? prev.linkedinUrl,
            whatsappNumber: d.whatsappNumber ?? prev.whatsappNumber,
            appStoreUrl: d.appStoreUrl ?? prev.appStoreUrl,
            playStoreUrl: d.playStoreUrl ?? prev.playStoreUrl,
            gamingBkashNumber: d.gamingBkashNumber ?? prev.gamingBkashNumber,
            gamingNagadNumber: d.gamingNagadNumber ?? prev.gamingNagadNumber,
            walletBkashNumber: d.walletBkashNumber ?? prev.walletBkashNumber,
            walletNagadNumber: d.walletNagadNumber ?? prev.walletNagadNumber,
            walletMinAmount: String(d.walletMinAmount ?? prev.walletMinAmount),
            walletMaxAmount: String(d.walletMaxAmount ?? prev.walletMaxAmount),
            defaultDeliveryTime: d.defaultDeliveryTime ?? prev.defaultDeliveryTime,
            deliveryAreaName: d.deliveryAreaName ?? prev.deliveryAreaName,
            deliverySlots:
              Array.isArray(d.deliverySlots) && d.deliverySlots.length > 0
                ? d.deliverySlots
                : prev.deliverySlots,
            mapDefaultLat: String(d.mapDefaultCenter?.lat ?? prev.mapDefaultLat),
            mapDefaultLng: String(d.mapDefaultCenter?.lng ?? prev.mapDefaultLng),
            mapDefaultZoom: String(d.mapDefaultZoom ?? prev.mapDefaultZoom),
            heroTitle1: d.hero?.title1 ?? d.heroTitle1 ?? prev.heroTitle1,
            heroTitle2: d.hero?.title2 ?? d.heroTitle2 ?? prev.heroTitle2,
            heroTitle3: d.hero?.title3 ?? d.heroTitle3 ?? prev.heroTitle3,
            heroSearchPlaceholder:
              d.hero?.searchPlaceholder ??
              d.heroSearchPlaceholder ??
              prev.heroSearchPlaceholder,
            trustText1: d.trustBar?.text1 ?? d.trustText1 ?? prev.trustText1,
            trustText2: d.trustBar?.text2 ?? d.trustText2 ?? prev.trustText2,
            trustText3: d.trustBar?.text3 ?? d.trustText3 ?? prev.trustText3,
            features:
              Array.isArray(d.features) && d.features.length > 0
                ? d.features
                : prev.features,
            homePopularTitle: d.home?.popularTitle ?? prev.homePopularTitle,
            homePopularSubtitle: d.home?.popularSubtitle ?? prev.homePopularSubtitle,
            homePopularLimit: String(d.home?.popularLimit ?? prev.homePopularLimit),
            categoriesTitle: d.categories?.title ?? prev.categoriesTitle,
            categoriesSubtitle: d.categories?.subtitle ?? prev.categoriesSubtitle,
            categoriesList:
              Array.isArray(d.categories?.list) && d.categories.list.length > 0
                ? d.categories.list
                : prev.categoriesList,
            deliveryAreasTitle: d.deliveryAreas?.title ?? prev.deliveryAreasTitle,
            deliveryAreasSubtitle:
              d.deliveryAreas?.subtitle ?? prev.deliveryAreasSubtitle,
            partnerSectionTitle: d.partner?.sectionTitle ?? prev.partnerSectionTitle,
            partnerSectionSubtitle:
              d.partner?.sectionSubtitle ?? prev.partnerSectionSubtitle,
            partnerRestaurantTitle:
              d.partner?.restaurant?.title ?? prev.partnerRestaurantTitle,
            partnerRestaurantSubtitle:
              d.partner?.restaurant?.subtitle ?? prev.partnerRestaurantSubtitle,
            partnerRestaurantDesc:
              d.partner?.restaurant?.description ?? prev.partnerRestaurantDesc,
            partnerRestaurantBtn:
              d.partner?.restaurant?.buttonText ?? prev.partnerRestaurantBtn,
            partnerRestaurantPath:
              d.partner?.restaurant?.path ?? prev.partnerRestaurantPath,
            partnerRiderTitle: d.partner?.rider?.title ?? prev.partnerRiderTitle,
            partnerRiderSubtitle:
              d.partner?.rider?.subtitle ?? prev.partnerRiderSubtitle,
            partnerRiderDesc:
              d.partner?.rider?.description ?? prev.partnerRiderDesc,
            partnerRiderBtn: d.partner?.rider?.buttonText ?? prev.partnerRiderBtn,
            partnerRiderPath: d.partner?.rider?.path ?? prev.partnerRiderPath,
            footerTagline: d.footer?.tagline ?? prev.footerTagline,
            footerCompanyName: d.footer?.companyName ?? prev.footerCompanyName,
            footerCompanyLinks:
              Array.isArray(d.footer?.companyLinks) &&
              d.footer.companyLinks.length > 0
                ? d.footer.companyLinks
                : prev.footerCompanyLinks,
            footerSupportLinks:
              Array.isArray(d.footer?.supportLinks) &&
              d.footer.supportLinks.length > 0
                ? d.footer.supportLinks
                : prev.footerSupportLinks,
            footerAppsLabel: d.footer?.appsLabel ?? prev.footerAppsLabel,
            liveChatTeamName: d.liveChat?.teamName ?? prev.liveChatTeamName,
            liveChatStatus: d.liveChat?.statusText ?? prev.liveChatStatus,
            liveChatAvatar: d.liveChat?.avatarEmoji ?? prev.liveChatAvatar,
            liveChatWelcome:
              d.liveChat?.welcomeMessage ?? prev.liveChatWelcome,
            liveChatAutoReply: d.liveChat?.autoReply ?? prev.liveChatAutoReply,
            liveChatPlaceholder:
              d.liveChat?.inputPlaceholder ?? prev.liveChatPlaceholder,
          }))
        }

        // Load welcome notifications
        const notifSnap = await getDoc(
          doc(db, 'settings', NOTIFICATION_DOC_ID)
        )
        if (notifSnap.exists()) {
          const n = notifSnap.data()
          setWelcome({
            customer: {
              ...DEFAULT_WELCOME.customer,
              ...(n.welcomeCustomer || {}),
            },
            restaurant: {
              ...DEFAULT_WELCOME.restaurant,
              ...(n.welcomeRestaurant || {}),
            },
            rider: {
              ...DEFAULT_WELCOME.rider,
              ...(n.welcomeRider || {}),
            },
            pharmacy: {
              ...DEFAULT_WELCOME.pharmacy,
              ...(n.welcomePharmacy || {}),
            },
          })
        }

        // Load legal pages
        const legalSnap = await getDoc(doc(db, 'settings', LEGAL_DOC_ID))
        if (legalSnap.exists()) {
          const l = legalSnap.data()
          setLegal({
            refundTitle: l.refundTitle ?? DEFAULT_LEGAL.refundTitle,
            refundContent: l.refundContent ?? DEFAULT_LEGAL.refundContent,
            privacyTitle: l.privacyTitle ?? DEFAULT_LEGAL.privacyTitle,
            privacyContent: l.privacyContent ?? DEFAULT_LEGAL.privacyContent,
            termsTitle: l.termsTitle ?? DEFAULT_LEGAL.termsTitle,
            termsContent: l.termsContent ?? DEFAULT_LEGAL.termsContent,
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast.error('Failed to load settings')
      }
      setLoading(false)
    }
    load()
  }, [])

  // ---------- SAVE ----------
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        siteName: state.siteName.trim(),
        tagline: state.tagline.trim(),
        contactEmail: state.contactEmail.trim(),
        contactPhone: state.contactPhone.trim(),
        address: state.address.trim(),
        defaultDeliveryFee: parseFloat(state.defaultDeliveryFee) || 30,
        minOrderAmount: parseFloat(state.minOrderAmount) || 100,
        commissionPercent: parseFloat(state.commissionPercent) || 10,
        riderEarningPerDelivery:
          parseFloat(state.riderEarningPerDelivery) || 30,
        freeDeliveryThreshold:
          parseFloat(state.freeDeliveryThreshold) || 500,
        openingTime: state.openingTime,
        closingTime: state.closingTime,
        facebookUrl: state.facebookUrl.trim(),
        instagramUrl: state.instagramUrl.trim(),
        twitterUrl: state.twitterUrl.trim(),
        linkedinUrl: state.linkedinUrl.trim(),
        whatsappNumber: state.whatsappNumber.trim(),
        appStoreUrl: state.appStoreUrl.trim(),
        playStoreUrl: state.playStoreUrl.trim(),
        gamingBkashNumber: state.gamingBkashNumber.trim(),
        gamingNagadNumber: state.gamingNagadNumber.trim(),
        walletBkashNumber: state.walletBkashNumber.trim(),
        walletNagadNumber: state.walletNagadNumber.trim(),
        walletMinAmount: parseFloat(state.walletMinAmount) || 50,
        walletMaxAmount: parseFloat(state.walletMaxAmount) || 10000,
        defaultDeliveryTime: state.defaultDeliveryTime.trim(),
        deliveryAreaName: state.deliveryAreaName.trim(),
        deliverySlots: state.deliverySlots,
        mapDefaultCenter: {
          lat: parseFloat(state.mapDefaultLat) || 23.78,
          lng: parseFloat(state.mapDefaultLng) || 90.64,
        },
        mapDefaultZoom: parseFloat(state.mapDefaultZoom) || 14,
        hero: {
          title1: state.heroTitle1.trim(),
          title2: state.heroTitle2.trim(),
          title3: state.heroTitle3.trim(),
          searchPlaceholder: state.heroSearchPlaceholder.trim(),
        },
        trustBar: {
          text1: state.trustText1.trim(),
          text2: state.trustText2.trim(),
          text3: state.trustText3.trim(),
        },
        features: state.features,
        home: {
          popularTitle: state.homePopularTitle.trim(),
          popularSubtitle: state.homePopularSubtitle.trim(),
          popularLimit: parseInt(state.homePopularLimit) || 6,
        },
        categories: {
          title: state.categoriesTitle.trim(),
          subtitle: state.categoriesSubtitle.trim(),
          list: state.categoriesList,
        },
        deliveryAreas: {
          title: state.deliveryAreasTitle.trim(),
          subtitle: state.deliveryAreasSubtitle.trim(),
        },
        partner: {
          sectionTitle: state.partnerSectionTitle.trim(),
          sectionSubtitle: state.partnerSectionSubtitle.trim(),
          restaurant: {
            title: state.partnerRestaurantTitle.trim(),
            subtitle: state.partnerRestaurantSubtitle.trim(),
            description: state.partnerRestaurantDesc.trim(),
            buttonText: state.partnerRestaurantBtn.trim(),
            path: state.partnerRestaurantPath.trim(),
          },
          rider: {
            title: state.partnerRiderTitle.trim(),
            subtitle: state.partnerRiderSubtitle.trim(),
            description: state.partnerRiderDesc.trim(),
            buttonText: state.partnerRiderBtn.trim(),
            path: state.partnerRiderPath.trim(),
          },
        },
        footer: {
          tagline: state.footerTagline.trim(),
          companyName: state.footerCompanyName.trim(),
          companyLinks: state.footerCompanyLinks,
          supportLinks: state.footerSupportLinks,
          appsLabel: state.footerAppsLabel.trim(),
        },
        liveChat: {
          teamName: state.liveChatTeamName.trim(),
          statusText: state.liveChatStatus.trim(),
          avatarEmoji: state.liveChatAvatar.trim(),
          welcomeMessage: state.liveChatWelcome.trim(),
          autoReply: state.liveChatAutoReply.trim(),
          inputPlaceholder: state.liveChatPlaceholder.trim(),
        },
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), payload, {
        merge: true,
      })

      // Save welcome notifications to separate doc
      await setDoc(
        doc(db, 'settings', NOTIFICATION_DOC_ID),
        {
          welcomeCustomer: welcome.customer,
          welcomeRestaurant: welcome.restaurant,
          welcomeRider: welcome.rider,
          welcomePharmacy: welcome.pharmacy,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // ✅ Save legal pages to separate doc
      await setDoc(
        doc(db, 'settings', LEGAL_DOC_ID),
        {
          refundTitle: legal.refundTitle.trim() || 'Refund Policy',
          refundContent: legal.refundContent,
          privacyTitle: legal.privacyTitle.trim() || 'Privacy Policy',
          privacyContent: legal.privacyContent,
          termsTitle: legal.termsTitle.trim() || 'Terms & Conditions',
          termsContent: legal.termsContent,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      toast.success('✅ Settings saved!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ---------- ARRAY HELPERS ----------
  const updateArrayItem = (key, idx, field, value) => {
    setState((prev) => {
      const arr = [...prev[key]]
      arr[idx] = { ...arr[idx], [field]: value }
      return { ...prev, [key]: arr }
    })
  }
  const addArrayItem = (key, template) => {
    setState((prev) => ({ ...prev, [key]: [...prev[key], template] }))
  }
  const removeArrayItem = (key, idx) => {
    setState((prev) => {
      const arr = prev[key].filter((_, i) => i !== idx)
      return { ...prev, [key]: arr }
    })
  }

  // ---------- RENDER ----------
  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">Settings</h1>
            <p className="admin-page-sub">
              Configure everything — brand, fees, home sections, footer, chat.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={saveBtnStyle(saving)}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ==================== WELCOME NOTIFICATIONS ==================== */}
            <Section
              icon={<Bell size={20} />}
              title="Welcome Notifications"
              subtitle="Auto-send when new users signup (in-app notification)"
            >
              <WelcomeCard
                role="customer"
                icon={<User size={18} />}
                label="Customer Signup"
                color="#3B82F6"
                data={welcome.customer}
                onChange={(field, value) =>
                  setWelcomeField('customer', field, value)
                }
              />
              <WelcomeCard
                role="restaurant"
                icon={<Store size={18} />}
                label="Restaurant Signup"
                color="#F59E0B"
                data={welcome.restaurant}
                onChange={(field, value) =>
                  setWelcomeField('restaurant', field, value)
                }
              />
              <WelcomeCard
                role="rider"
                icon={<Bike size={18} />}
                label="Rider Signup"
                color="#8B5CF6"
                data={welcome.rider}
                onChange={(field, value) =>
                  setWelcomeField('rider', field, value)
                }
              />
              <WelcomeCard
                role="pharmacy"
                icon={<Pill size={18} />}
                label="Pharmacy Signup"
                color="#EC4899"
                data={welcome.pharmacy}
                onChange={(field, value) =>
                  setWelcomeField('pharmacy', field, value)
                }
              />
            </Section>

            {/* ==================== BRAND ==================== */}
            <Section icon={<Globe size={20} />} title="Brand Information">
              <div style={gridTwo}>
                <Field label="Site Name">
                  <input
                    style={inputStyle}
                    value={state.siteName}
                    onChange={(e) => set('siteName', e.target.value)}
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    style={inputStyle}
                    value={state.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== HERO ==================== */}
            <Section icon={<Layout size={20} />} title="Hero Section">
              <div style={gridThree}>
                <Field label="Title Part 1">
                  <input
                    style={inputStyle}
                    value={state.heroTitle1}
                    onChange={(e) => set('heroTitle1', e.target.value)}
                  />
                </Field>
                <Field label="Title Part 2 (Highlight)">
                  <input
                    style={inputStyle}
                    value={state.heroTitle2}
                    onChange={(e) => set('heroTitle2', e.target.value)}
                  />
                </Field>
                <Field label="Title Part 3">
                  <input
                    style={inputStyle}
                    value={state.heroTitle3}
                    onChange={(e) => set('heroTitle3', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Search Placeholder">
                <input
                  style={inputStyle}
                  value={state.heroSearchPlaceholder}
                  onChange={(e) =>
                    set('heroSearchPlaceholder', e.target.value)
                  }
                />
              </Field>
            </Section>

            {/* ==================== FEATURES ==================== */}
            <Section
              icon={<Sparkles size={20} />}
              title="Feature Strip"
              subtitle="4 features below service cards"
            >
              {state.features.map((f, idx) => (
                <div key={idx} style={arrayCard}>
                  <div style={arrayHeader}>
                    <strong>Feature {idx + 1}</strong>
                    {state.features.length > 1 && (
                      <button
                        style={deleteBtn}
                        onClick={() => removeArrayItem('features', idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div style={gridFour}>
                    <Field label="Icon (emoji)">
                      <input
                        style={inputStyle}
                        value={f.icon}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'icon', e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Color">
                      <select
                        style={inputStyle}
                        value={f.color}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'color', e.target.value)
                        }
                      >
                        <option value="green">green</option>
                        <option value="blue">blue</option>
                        <option value="dark">dark</option>
                        <option value="pink">pink</option>
                      </select>
                    </Field>
                    <Field label="Title">
                      <input
                        style={inputStyle}
                        value={f.title}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'title', e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Description">
                      <input
                        style={inputStyle}
                        value={f.desc}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'desc', e.target.value)
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                style={addBtn}
                onClick={() =>
                  addArrayItem('features', {
                    icon: '⭐',
                    color: 'green',
                    title: 'New Feature',
                    desc: 'Description',
                  })
                }
              >
                <Plus size={14} /> Add Feature
              </button>
            </Section>

            {/* ==================== TRUST BAR ==================== */}
            <Section icon={<Sparkles size={20} />} title="Trust Bar">
              <div style={gridThree}>
                <Field label="Text 1">
                  <input
                    style={inputStyle}
                    value={state.trustText1}
                    onChange={(e) => set('trustText1', e.target.value)}
                  />
                </Field>
                <Field label="Text 2">
                  <input
                    style={inputStyle}
                    value={state.trustText2}
                    onChange={(e) => set('trustText2', e.target.value)}
                  />
                </Field>
                <Field label="Text 3">
                  <input
                    style={inputStyle}
                    value={state.trustText3}
                    onChange={(e) => set('trustText3', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== HOME ==================== */}
            <Section icon={<Home size={20} />} title="Home Section">
              <div style={gridTwo}>
                <Field label="Popular Restaurants Title">
                  <input
                    style={inputStyle}
                    value={state.homePopularTitle}
                    onChange={(e) => set('homePopularTitle', e.target.value)}
                  />
                </Field>
                <Field label="Popular Restaurants Subtitle">
                  <input
                    style={inputStyle}
                    value={state.homePopularSubtitle}
                    onChange={(e) =>
                      set('homePopularSubtitle', e.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Popular Restaurants Count (limit)">
                <input
                  type="number"
                  style={inputStyle}
                  value={state.homePopularLimit}
                  onChange={(e) => set('homePopularLimit', e.target.value)}
                />
              </Field>
            </Section>

            {/* ==================== CATEGORIES ==================== */}
            <Section icon={<Layers size={20} />} title="Categories Section">
              <div style={gridTwo}>
                <Field label="Title">
                  <input
                    style={inputStyle}
                    value={state.categoriesTitle}
                    onChange={(e) => set('categoriesTitle', e.target.value)}
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    style={inputStyle}
                    value={state.categoriesSubtitle}
                    onChange={(e) =>
                      set('categoriesSubtitle', e.target.value)
                    }
                  />
                </Field>
              </div>

              {state.categoriesList.map((c, idx) => (
                <div key={idx} style={arrayCard}>
                  <div style={arrayHeader}>
                    <strong>Category {idx + 1}</strong>
                    <button
                      style={deleteBtn}
                      onClick={() => removeArrayItem('categoriesList', idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={gridFour}>
                    <Field label="Name">
                      <input
                        style={inputStyle}
                        value={c.name}
                        onChange={(e) =>
                          updateArrayItem(
                            'categoriesList',
                            idx,
                            'name',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="Emoji">
                      <input
                        style={inputStyle}
                        value={c.emoji}
                        onChange={(e) =>
                          updateArrayItem(
                            'categoriesList',
                            idx,
                            'emoji',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="Color">
                      <input
                        style={inputStyle}
                        value={c.color}
                        onChange={(e) =>
                          updateArrayItem(
                            'categoriesList',
                            idx,
                            'color',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="Query">
                      <input
                        style={inputStyle}
                        value={c.query}
                        onChange={(e) =>
                          updateArrayItem(
                            'categoriesList',
                            idx,
                            'query',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                style={addBtn}
                onClick={() =>
                  addArrayItem('categoriesList', {
                    name: 'New',
                    emoji: '🍽️',
                    color: 'green',
                    query: 'new',
                  })
                }
              >
                <Plus size={14} /> Add Category
              </button>
            </Section>

            {/* ==================== DELIVERY AREAS ==================== */}
            <Section icon={<MapPin size={20} />} title="Delivery Areas Section">
              <div style={gridTwo}>
                <Field label="Title">
                  <input
                    style={inputStyle}
                    value={state.deliveryAreasTitle}
                    onChange={(e) =>
                      set('deliveryAreasTitle', e.target.value)
                    }
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    style={inputStyle}
                    value={state.deliveryAreasSubtitle}
                    onChange={(e) =>
                      set('deliveryAreasSubtitle', e.target.value)
                    }
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== PARTNER CTA ==================== */}
            <Section icon={<Handshake size={20} />} title="Partner CTA">
              <div style={gridTwo}>
                <Field label="Section Title">
                  <input
                    style={inputStyle}
                    value={state.partnerSectionTitle}
                    onChange={(e) =>
                      set('partnerSectionTitle', e.target.value)
                    }
                  />
                </Field>
                <Field label="Section Subtitle">
                  <input
                    style={inputStyle}
                    value={state.partnerSectionSubtitle}
                    onChange={(e) =>
                      set('partnerSectionSubtitle', e.target.value)
                    }
                  />
                </Field>
              </div>

              <h4 style={subHeading}>Restaurant Card</h4>
              <div style={gridTwo}>
                <Field label="Title">
                  <input
                    style={inputStyle}
                    value={state.partnerRestaurantTitle}
                    onChange={(e) =>
                      set('partnerRestaurantTitle', e.target.value)
                    }
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    style={inputStyle}
                    value={state.partnerRestaurantSubtitle}
                    onChange={(e) =>
                      set('partnerRestaurantSubtitle', e.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows="2"
                  style={inputStyle}
                  value={state.partnerRestaurantDesc}
                  onChange={(e) =>
                    set('partnerRestaurantDesc', e.target.value)
                  }
                />
              </Field>
              <div style={gridTwo}>
                <Field label="Button Text">
                  <input
                    style={inputStyle}
                    value={state.partnerRestaurantBtn}
                    onChange={(e) =>
                      set('partnerRestaurantBtn', e.target.value)
                    }
                  />
                </Field>
                <Field label="Button Path">
                  <input
                    style={inputStyle}
                    value={state.partnerRestaurantPath}
                    onChange={(e) =>
                      set('partnerRestaurantPath', e.target.value)
                    }
                  />
                </Field>
              </div>

              <h4 style={subHeading}>Rider Card</h4>
              <div style={gridTwo}>
                <Field label="Title">
                  <input
                    style={inputStyle}
                    value={state.partnerRiderTitle}
                    onChange={(e) => set('partnerRiderTitle', e.target.value)}
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    style={inputStyle}
                    value={state.partnerRiderSubtitle}
                    onChange={(e) =>
                      set('partnerRiderSubtitle', e.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows="2"
                  style={inputStyle}
                  value={state.partnerRiderDesc}
                  onChange={(e) => set('partnerRiderDesc', e.target.value)}
                />
              </Field>
              <div style={gridTwo}>
                <Field label="Button Text">
                  <input
                    style={inputStyle}
                    value={state.partnerRiderBtn}
                    onChange={(e) => set('partnerRiderBtn', e.target.value)}
                  />
                </Field>
                <Field label="Button Path">
                  <input
                    style={inputStyle}
                    value={state.partnerRiderPath}
                    onChange={(e) => set('partnerRiderPath', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== CONTACT ==================== */}
            <Section icon={<Phone size={20} />} title="Contact Information">
              <div style={gridTwo}>
                <Field label="Contact Email" icon={<Mail size={14} />}>
                  <input
                    type="email"
                    style={inputStyle}
                    value={state.contactEmail}
                    onChange={(e) => set('contactEmail', e.target.value)}
                  />
                </Field>
                <Field label="Contact Phone" icon={<Phone size={14} />}>
                  <input
                    type="tel"
                    style={inputStyle}
                    value={state.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Business Address" icon={<MapPin size={14} />}>
                <input
                  style={inputStyle}
                  value={state.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </Field>
            </Section>

            {/* ==================== FEES ==================== */}
            <Section
              icon={<DollarSign size={20} />}
              title="Fees & Commission"
            >
              <div style={gridTwo}>
                <Field
                  label="Default Delivery Fee (৳)"
                  icon={<Truck size={14} />}
                >
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.defaultDeliveryFee}
                    onChange={(e) => set('defaultDeliveryFee', e.target.value)}
                  />
                </Field>
                <Field label="Minimum Order Amount (৳)">
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.minOrderAmount}
                    onChange={(e) => set('minOrderAmount', e.target.value)}
                  />
                </Field>
                <Field
                  label="Platform Commission (%)"
                  icon={<Percent size={14} />}
                >
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.commissionPercent}
                    onChange={(e) => set('commissionPercent', e.target.value)}
                  />
                </Field>
                <Field label="Rider Earning per Delivery (৳)">
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.riderEarningPerDelivery}
                    onChange={(e) =>
                      set('riderEarningPerDelivery', e.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Free Delivery Threshold (৳)">
                <input
                  type="number"
                  style={inputStyle}
                  value={state.freeDeliveryThreshold}
                  onChange={(e) =>
                    set('freeDeliveryThreshold', e.target.value)
                  }
                />
              </Field>
            </Section>

            {/* ==================== DELIVERY SETTINGS ==================== */}
            <Section
              icon={<Truck size={20} />}
              title="Delivery / Checkout Settings"
            >
              <div style={gridTwo}>
                <Field label="Default Delivery Time (text)">
                  <input
                    style={inputStyle}
                    value={state.defaultDeliveryTime}
                    onChange={(e) =>
                      set('defaultDeliveryTime', e.target.value)
                    }
                  />
                </Field>
                <Field label="Delivery Area Name">
                  <input
                    style={inputStyle}
                    value={state.deliveryAreaName}
                    onChange={(e) => set('deliveryAreaName', e.target.value)}
                  />
                </Field>
              </div>

              <Field
                label="Delivery Time Slots (comma separated)"
                icon={<Clock size={14} />}
              >
                <input
                  style={inputStyle}
                  value={state.deliverySlots.join(', ')}
                  onChange={(e) =>
                    set(
                      'deliverySlots',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </Field>

              <div style={gridThree}>
                <Field label="Map Default Lat">
                  <input
                    type="number"
                    step="0.0001"
                    style={inputStyle}
                    value={state.mapDefaultLat}
                    onChange={(e) => set('mapDefaultLat', e.target.value)}
                  />
                </Field>
                <Field label="Map Default Lng">
                  <input
                    type="number"
                    step="0.0001"
                    style={inputStyle}
                    value={state.mapDefaultLng}
                    onChange={(e) => set('mapDefaultLng', e.target.value)}
                  />
                </Field>
                <Field label="Map Default Zoom">
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.mapDefaultZoom}
                    onChange={(e) => set('mapDefaultZoom', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== HOURS ==================== */}
            <Section
              icon={<Clock size={20} />}
              title="Platform Operating Hours"
            >
              <div style={gridTwo}>
                <Field label="Opening Time">
                  <input
                    type="time"
                    style={inputStyle}
                    value={state.openingTime}
                    onChange={(e) => set('openingTime', e.target.value)}
                  />
                </Field>
                <Field label="Closing Time">
                  <input
                    type="time"
                    style={inputStyle}
                    value={state.closingTime}
                    onChange={(e) => set('closingTime', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== WALLET ==================== */}
            <Section icon={<Wallet size={20} />} title="Wallet Top-Up">
              <div style={gridTwo}>
                <Field label="Wallet bKash Number">
                  <input
                    style={inputStyle}
                    value={state.walletBkashNumber}
                    onChange={(e) => set('walletBkashNumber', e.target.value)}
                  />
                </Field>
                <Field label="Wallet Nagad Number">
                  <input
                    style={inputStyle}
                    value={state.walletNagadNumber}
                    onChange={(e) => set('walletNagadNumber', e.target.value)}
                  />
                </Field>
                <Field label="Minimum Top-Up (৳)">
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.walletMinAmount}
                    onChange={(e) => set('walletMinAmount', e.target.value)}
                  />
                </Field>
                <Field label="Maximum Top-Up (৳)">
                  <input
                    type="number"
                    style={inputStyle}
                    value={state.walletMaxAmount}
                    onChange={(e) => set('walletMaxAmount', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== GAMING ==================== */}
            <Section
              icon={<SettingsIcon size={20} />}
              title="Gaming Payment Numbers"
            >
              <div style={gridTwo}>
                <Field label="Gaming bKash">
                  <input
                    style={inputStyle}
                    value={state.gamingBkashNumber}
                    onChange={(e) => set('gamingBkashNumber', e.target.value)}
                  />
                </Field>
                <Field label="Gaming Nagad">
                  <input
                    style={inputStyle}
                    value={state.gamingNagadNumber}
                    onChange={(e) => set('gamingNagadNumber', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== FOOTER ==================== */}
            <Section icon={<Layout size={20} />} title="Footer">
              <div style={gridTwo}>
                <Field label="Tagline">
                  <input
                    style={inputStyle}
                    value={state.footerTagline}
                    onChange={(e) => set('footerTagline', e.target.value)}
                  />
                </Field>
                <Field label="Company Name (©)">
                  <input
                    style={inputStyle}
                    value={state.footerCompanyName}
                    onChange={(e) => set('footerCompanyName', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Apps Row Label">
                <input
                  style={inputStyle}
                  value={state.footerAppsLabel}
                  onChange={(e) => set('footerAppsLabel', e.target.value)}
                />
              </Field>

              <h4 style={subHeading}>Company Links</h4>
              {state.footerCompanyLinks.map((l, idx) => (
                <div key={idx} style={arrayCard}>
                  <div style={arrayHeader}>
                    <strong>Link {idx + 1}</strong>
                    <button
                      style={deleteBtn}
                      onClick={() =>
                        removeArrayItem('footerCompanyLinks', idx)
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={gridThree}>
                    <Field label="Text">
                      <input
                        style={inputStyle}
                        value={l.text}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerCompanyLinks',
                            idx,
                            'text',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="URL">
                      <input
                        style={inputStyle}
                        value={l.url}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerCompanyLinks',
                            idx,
                            'url',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="External?">
                      <select
                        style={inputStyle}
                        value={l.isExternal ? 'yes' : 'no'}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerCompanyLinks',
                            idx,
                            'isExternal',
                            e.target.value === 'yes'
                          )
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
              <button
                style={addBtn}
                onClick={() =>
                  addArrayItem('footerCompanyLinks', {
                    text: 'New Link',
                    url: '#',
                    isExternal: false,
                  })
                }
              >
                <Plus size={14} /> Add Company Link
              </button>

              <h4 style={subHeading}>Support Links</h4>
              {state.footerSupportLinks.map((l, idx) => (
                <div key={idx} style={arrayCard}>
                  <div style={arrayHeader}>
                    <strong>Link {idx + 1}</strong>
                    <button
                      style={deleteBtn}
                      onClick={() =>
                        removeArrayItem('footerSupportLinks', idx)
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={gridThree}>
                    <Field label="Text">
                      <input
                        style={inputStyle}
                        value={l.text}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerSupportLinks',
                            idx,
                            'text',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="URL">
                      <input
                        style={inputStyle}
                        value={l.url}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerSupportLinks',
                            idx,
                            'url',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                    <Field label="External?">
                      <select
                        style={inputStyle}
                        value={l.isExternal ? 'yes' : 'no'}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerSupportLinks',
                            idx,
                            'isExternal',
                            e.target.value === 'yes'
                          )
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
              <button
                style={addBtn}
                onClick={() =>
                  addArrayItem('footerSupportLinks', {
                    text: 'New Link',
                    url: '#',
                    isExternal: false,
                  })
                }
              >
                <Plus size={14} /> Add Support Link
              </button>
            </Section>

            {/* ==================== ✅ LEGAL PAGES (NEW) ==================== */}
            <Section
              icon={<Scale size={20} />}
              title="Legal Pages"
              subtitle="Refund, Privacy & Terms content — যা লিখবেন সেটাই website এ show হবে"
            >
              {/* Refund Policy */}
              <div style={legalCard}>
                <div style={legalHeader}>
                  <div style={legalIconWrap}>
                    <FileText size={18} color="#059669" strokeWidth={2.4} />
                  </div>
                  <div>
                    <strong style={legalTitle}>Refund Policy</strong>
                    <span style={legalSub}>
                      Payment refund নিয়মাবলী
                    </span>
                  </div>
                </div>
                <Field label="Page Title">
                  <input
                    type="text"
                    style={inputStyle}
                    value={legal.refundTitle}
                    onChange={(e) =>
                      setLegalField('refundTitle', e.target.value)
                    }
                    placeholder="Refund Policy"
                  />
                </Field>
                <Field label="Content (পুরো নিয়ম লিখুন)">
                  <textarea
                    rows="8"
                    style={legalTextarea}
                    value={legal.refundContent}
                    onChange={(e) =>
                      setLegalField('refundContent', e.target.value)
                    }
                    placeholder="এখানে আপনার Refund Policy এর পুরো লেখা দিন..."
                  />
                </Field>
              </div>

              {/* Privacy Policy */}
              <div style={legalCard}>
                <div style={legalHeader}>
                  <div style={legalIconWrap}>
                    <FileText size={18} color="#3B82F6" strokeWidth={2.4} />
                  </div>
                  <div>
                    <strong style={legalTitle}>Privacy Policy</strong>
                    <span style={legalSub}>
                      User data এবং privacy সংক্রান্ত
                    </span>
                  </div>
                </div>
                <Field label="Page Title">
                  <input
                    type="text"
                    style={inputStyle}
                    value={legal.privacyTitle}
                    onChange={(e) =>
                      setLegalField('privacyTitle', e.target.value)
                    }
                    placeholder="Privacy Policy"
                  />
                </Field>
                <Field label="Content (পুরো নিয়ম লিখুন)">
                  <textarea
                    rows="8"
                    style={legalTextarea}
                    value={legal.privacyContent}
                    onChange={(e) =>
                      setLegalField('privacyContent', e.target.value)
                    }
                    placeholder="এখানে আপনার Privacy Policy এর পুরো লেখা দিন..."
                  />
                </Field>
              </div>

              {/* Terms & Conditions */}
              <div style={legalCard}>
                <div style={legalHeader}>
                  <div style={legalIconWrap}>
                    <FileText size={18} color="#F59E0B" strokeWidth={2.4} />
                  </div>
                  <div>
                    <strong style={legalTitle}>Terms & Conditions</strong>
                    <span style={legalSub}>
                      Website ব্যবহারের শর্তাবলী
                    </span>
                  </div>
                </div>
                <Field label="Page Title">
                  <input
                    type="text"
                    style={inputStyle}
                    value={legal.termsTitle}
                    onChange={(e) =>
                      setLegalField('termsTitle', e.target.value)
                    }
                    placeholder="Terms & Conditions"
                  />
                </Field>
                <Field label="Content (পুরো নিয়ম লিখুন)">
                  <textarea
                    rows="8"
                    style={legalTextarea}
                    value={legal.termsContent}
                    onChange={(e) =>
                      setLegalField('termsContent', e.target.value)
                    }
                    placeholder="এখানে আপনার Terms & Conditions এর পুরো লেখা দিন..."
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== LIVE CHAT ==================== */}
            <Section icon={<MessageCircle size={20} />} title="Live Chat">
              <div style={gridTwo}>
                <Field label="Team Name">
                  <input
                    style={inputStyle}
                    value={state.liveChatTeamName}
                    onChange={(e) => set('liveChatTeamName', e.target.value)}
                  />
                </Field>
                <Field label="Status Text">
                  <input
                    style={inputStyle}
                    value={state.liveChatStatus}
                    onChange={(e) => set('liveChatStatus', e.target.value)}
                  />
                </Field>
              </div>
              <div style={gridTwo}>
                <Field label="Avatar Emoji">
                  <input
                    style={inputStyle}
                    value={state.liveChatAvatar}
                    onChange={(e) => set('liveChatAvatar', e.target.value)}
                  />
                </Field>
                <Field label="Input Placeholder">
                  <input
                    style={inputStyle}
                    value={state.liveChatPlaceholder}
                    onChange={(e) =>
                      set('liveChatPlaceholder', e.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Welcome Message">
                <textarea
                  rows="2"
                  style={inputStyle}
                  value={state.liveChatWelcome}
                  onChange={(e) => set('liveChatWelcome', e.target.value)}
                />
              </Field>
              <Field label="Auto Reply">
                <textarea
                  rows="2"
                  style={inputStyle}
                  value={state.liveChatAutoReply}
                  onChange={(e) => set('liveChatAutoReply', e.target.value)}
                />
              </Field>
            </Section>

            {/* ==================== SOCIAL ==================== */}
            <Section icon={<SettingsIcon size={20} />} title="Social Media">
              <div style={gridTwo}>
                <Field label="Facebook URL" icon={<FaFacebookF size={14} />}>
                  <input
                    style={inputStyle}
                    value={state.facebookUrl}
                    onChange={(e) => set('facebookUrl', e.target.value)}
                  />
                </Field>
                <Field label="Instagram URL" icon={<FaInstagram size={14} />}>
                  <input
                    style={inputStyle}
                    value={state.instagramUrl}
                    onChange={(e) => set('instagramUrl', e.target.value)}
                  />
                </Field>
                <Field label="Twitter URL" icon={<FaTwitter size={14} />}>
                  <input
                    style={inputStyle}
                    value={state.twitterUrl}
                    onChange={(e) => set('twitterUrl', e.target.value)}
                  />
                </Field>
                <Field label="LinkedIn URL" icon={<FaLinkedinIn size={14} />}>
                  <input
                    style={inputStyle}
                    value={state.linkedinUrl}
                    onChange={(e) => set('linkedinUrl', e.target.value)}
                  />
                </Field>
                <Field label="WhatsApp Number">
                  <input
                    style={inputStyle}
                    value={state.whatsappNumber}
                    onChange={(e) => set('whatsappNumber', e.target.value)}
                  />
                </Field>
              </div>

              <h4 style={subHeading}>Mobile App Links (Coming Soon if empty)</h4>
              <div style={gridTwo}>
                <Field label="App Store URL">
                  <input
                    style={inputStyle}
                    value={state.appStoreUrl}
                    onChange={(e) => set('appStoreUrl', e.target.value)}
                  />
                </Field>
                <Field label="Google Play URL">
                  <input
                    style={inputStyle}
                    value={state.playStoreUrl}
                    onChange={(e) => set('playStoreUrl', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* BOTTOM SAVE */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '16px',
                borderRadius: '999px',
                background: saving
                  ? 'var(--surface-soft)'
                  : 'linear-gradient(135deg, #059669, #047857)',
                color: saving ? 'var(--text-tertiary)' : '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ============================================================
// WELCOME CARD COMPONENT
// ============================================================
function WelcomeCard({ role, icon, label, color, data, onChange }) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '14px',
        border: data.enabled
          ? `1px solid ${color}40`
          : '1px dashed var(--border-strong)',
        background: data.enabled ? `${color}08` : 'var(--surface-soft)',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: `${color}18`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <strong
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {label}
          </strong>
          <span
            style={{
              fontSize: '11.5px',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
            }}
          >
            {data.enabled ? '✅ Enabled — will send on signup' : '🔕 Disabled'}
          </span>
        </div>

        <label
          style={{
            position: 'relative',
            width: '46px',
            height: '26px',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => onChange('enabled', e.target.checked)}
            style={{ display: 'none' }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '999px',
              background: data.enabled ? color : '#D1D5DB',
              transition: 'all 0.2s',
            }}
          />
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: data.enabled ? '23px' : '3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
            }}
          />
        </label>
      </div>

      {data.enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Notification title"
              maxLength={80}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              Body / Message
            </label>
            <textarea
              value={data.body}
              onChange={(e) => onChange('body', e.target.value)}
              placeholder="Welcome message"
              rows={2}
              maxLength={200}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '60px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// STYLES
// ============================================================
const saveBtnStyle = (saving) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '999px',
  background: saving
    ? 'var(--surface-soft)'
    : 'linear-gradient(135deg, #059669, #047857)',
  color: saving ? 'var(--text-tertiary)' : '#FFFFFF',
  border: 'none',
  fontSize: '13.5px',
  fontWeight: 800,
  cursor: saving ? 'not-allowed' : 'pointer',
})

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const legalTextarea = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: '13.5px',
  fontWeight: 500,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.6,
  minHeight: '160px',
}

const legalCard = {
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid var(--border)',
  background: 'var(--surface-soft)',
  marginBottom: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
}

const legalHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingBottom: '12px',
  borderBottom: '1px dashed var(--border)',
}

const legalIconWrap = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'var(--surface)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: '1px solid var(--border)',
}

const legalTitle = {
  display: 'block',
  fontFamily: 'var(--font-heading)',
  fontSize: '15px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: '2px',
}

const legalSub = {
  fontSize: '12px',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
}

const gridTwo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}
const gridThree = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '14px',
}
const gridFour = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
}

const arrayCard = {
  padding: '14px',
  border: '1px dashed var(--border-strong)',
  borderRadius: '12px',
  background: 'var(--surface-soft)',
  marginBottom: '10px',
}

const arrayHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
}

const deleteBtn = {
  background: 'rgba(220,38,38,0.1)',
  border: '1px solid rgba(220,38,38,0.3)',
  color: '#dc2626',
  borderRadius: '8px',
  padding: '4px 8px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  fontWeight: 700,
}

const addBtn = {
  marginTop: '8px',
  padding: '10px 16px',
  borderRadius: '10px',
  border: '1px dashed rgba(5,150,105,0.5)',
  background: 'rgba(5,150,105,0.08)',
  color: '#059669',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
}

const subHeading = {
  fontSize: '13px',
  fontWeight: 800,
  color: 'var(--text-secondary)',
  margin: '10px 0 6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

// ============================================================
// HELPERS
// ============================================================
function Section({ icon, title, subtitle, children }) {
  return (
    <div className="admin-section" style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
          paddingBottom: '16px',
          borderBottom: '1px dashed var(--border)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12.5px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

export default AdminSettingsPage