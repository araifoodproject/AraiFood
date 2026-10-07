// ============================================================
// src/pages/admin/AdminSettingsPage.jsx
// V4 — FULL BILINGUAL (Bangla + English)
// PART 1/3 — Imports + Defaults + State + Load Logic
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
// Defaults — WITH Bangla (_bn) fields
// ------------------------------------------------------------
const DEFAULT_FEATURES = [
  {
    icon: '🚚', color: 'green',
    title: 'Fast Delivery', title_bn: 'দ্রুত ডেলিভারি',
    desc: '30-45 min to your door', desc_bn: '৩০-৪৫ মিনিটে আপনার দরজায়',
  },
  {
    icon: '📍', color: 'blue',
    title: 'Araihazar Focused', title_bn: 'আরাইহাজার কেন্দ্রিক',
    desc: 'Local sellers & services', desc_bn: 'স্থানীয় বিক্রেতা ও সেবা',
  },
  {
    icon: '🛡️', color: 'dark',
    title: 'Secure Payment', title_bn: 'নিরাপদ পেমেন্ট',
    desc: 'Safe & encrypted transactions', desc_bn: 'নিরাপদ ও এনক্রিপ্টেড লেনদেন',
  },
  {
    icon: '🎧', color: 'pink',
    title: 'Local Support', title_bn: 'স্থানীয় সহায়তা',
    desc: '24/7 friendly help nearby', desc_bn: '২৪/৭ কাছাকাছি বন্ধুত্বপূর্ণ সহায়তা',
  },
]

const DEFAULT_CATEGORIES = [
  { name: 'Biryani', name_bn: 'বিরিয়ানি', emoji: '🍛', color: 'biryani', query: 'biryani' },
  { name: 'Burger', name_bn: 'বার্গার', emoji: '🍔', color: 'burger', query: 'burger' },
  { name: 'Pizza', name_bn: 'পিজ্জা', emoji: '🍕', color: 'pizza', query: 'pizza' },
  { name: 'Chinese', name_bn: 'চাইনিজ', emoji: '🍜', color: 'chinese', query: 'chinese' },
  { name: 'Chicken', name_bn: 'চিকেন', emoji: '🍗', color: 'chicken', query: 'chicken' },
  { name: 'Snacks', name_bn: 'স্ন্যাকস', emoji: '🍟', color: 'snacks', query: 'snacks' },
  { name: 'Drinks', name_bn: 'ড্রিংকস', emoji: '🥤', color: 'drinks', query: 'drinks' },
  { name: 'Desserts', name_bn: 'ডেজার্ট', emoji: '🍰', color: 'desserts', query: 'dessert' },
]

const DEFAULT_COMPANY_LINKS = [
  { text: 'About Us', text_bn: 'আমাদের সম্পর্কে', url: '/about', isExternal: false },
  { text: 'Careers', text_bn: 'ক্যারিয়ার', url: '/careers', isExternal: false },
]

const DEFAULT_SUPPORT_LINKS = [
  { text: 'Help Center', text_bn: 'সহায়তা কেন্দ্র', url: '/help', isExternal: false },
  { text: 'Contact Us', text_bn: 'যোগাযোগ', url: '/contact', isExternal: false },
  { text: 'FAQs', text_bn: 'সাধারণ প্রশ্ন', url: '/help', isExternal: false },
]

const DEFAULT_WELCOME = {
  customer: {
    enabled: true,
    title: '🎉 Welcome to AraiFood!',
    title_bn: '🎉 AraiFood এ স্বাগতম!',
    body: 'Thanks for joining AraiFood. Start ordering your favourite food now!',
    body_bn: 'AraiFood এ যোগ দেওয়ার জন্য ধন্যবাদ। এখনই আপনার প্রিয় খাবার অর্ডার করুন!',
  },
  restaurant: {
    enabled: true,
    title: '🏪 Welcome to AraiFood Partner!',
    title_bn: '🏪 AraiFood পার্টনার স্বাগতম!',
    body: 'Your account is under review. You will be notified once approved.',
    body_bn: 'আপনার একাউন্ট রিভিউতে আছে। অনুমোদিত হলে জানানো হবে।',
  },
  rider: {
    enabled: true,
    title: '🛵 Welcome to AraiFood Riders!',
    title_bn: '🛵 AraiFood রাইডার স্বাগতম!',
    body: 'Your application is pending admin approval. Stay tuned!',
    body_bn: 'আপনার আবেদন এডমিন অনুমোদনের অপেক্ষায়। সাথে থাকুন!',
  },
  pharmacy: {
    enabled: true,
    title: '💊 Welcome to AraiFood Pharmacy!',
    title_bn: '💊 AraiFood ফার্মেসি স্বাগতম!',
    body: 'Your account is pending approval. We will notify you soon!',
    body_bn: 'আপনার একাউন্ট অনুমোদনের অপেক্ষায়। শীঘ্রই জানানো হবে!',
  },
}

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

  // ---------- PLATFORM STATE (English + Bangla) ----------
  const [state, setState] = useState({
    // Brand
    siteName: 'AraiFood',
    siteName_bn: 'AraiFood',
    tagline: 'Good Food, Good Mood',
    tagline_bn: 'ভালো খাবার, ভালো মুড',

    // Contact
    contactEmail: 'hello@araifood.com',
    contactPhone: '+880 1700-000000',
    address: 'Araihazar, Narayanganj',

    // Fees
    defaultDeliveryFee: '30',
    minOrderAmount: '100',
    commissionPercent: '10',
    riderEarningPerDelivery: '30',
    freeDeliveryThreshold: '500',

    // Hours
    openingTime: '10:00',
    closingTime: '22:00',

    // Social
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    whatsappNumber: '',
    appStoreUrl: '',
    playStoreUrl: '',

    // Payment numbers
    gamingBkashNumber: '01700000000',
    gamingNagadNumber: '01700000000',
    walletBkashNumber: '01700000000',
    walletNagadNumber: '01700000000',
    walletMinAmount: '50',
    walletMaxAmount: '10000',

    // Delivery
    defaultDeliveryTime: '30-40 min',
    deliveryAreaName: 'Araihazar Thana',
    deliverySlots: ['6-7pm', '7-8pm', '8-9pm', '9-10pm'],

    // Map
    mapDefaultLat: '23.78',
    mapDefaultLng: '90.64',
    mapDefaultZoom: '14',

    // Hero
    heroTitle1: 'App -',
    heroTitle1_bn: 'অ্যাপ -',
    heroTitle2: 'Food, Pharmacy & Gaming',
    heroTitle2_bn: 'খাবার, ফার্মেসি ও গেমিং',
    heroTitle3: 'in One Place',
    heroTitle3_bn: 'এক জায়গায়',
    heroSearchPlaceholder: 'Search food, medicine or games...',
    heroSearchPlaceholder_bn: 'খাবার, ঔষধ বা গেম খুঁজুন...',

    // Trust Bar
    trustText1: 'Trusted by 50k+ in Araihazar',
    trustText1_bn: 'আরাইহাজারে ৫০ হাজারের বেশি মানুষের বিশ্বাস',
    trustText2: '4.8★ Rating',
    trustText2_bn: '৪.৮★ রেটিং',
    trustText3: 'Updated Oct 2025',
    trustText3_bn: 'আপডেট অক্টোবর ২০২৫',

    // Features
    features: DEFAULT_FEATURES,

    // Home Section
    homePopularTitle: 'Popular Restaurants Near You',
    homePopularTitle_bn: 'আপনার কাছের জনপ্রিয় রেস্টুরেন্ট',
    homePopularSubtitle: 'Top-rated picks from Araihazar',
    homePopularSubtitle_bn: 'আরাইহাজারের সেরা পছন্দ',
    homePopularLimit: '6',

    // Categories
    categoriesTitle: 'Food Categories',
    categoriesTitle_bn: 'খাবারের ক্যাটাগরি',
    categoriesSubtitle: 'Browse by categories',
    categoriesSubtitle_bn: 'ক্যাটাগরি অনুযায়ী দেখুন',
    categoriesList: DEFAULT_CATEGORIES,

    // Delivery Areas
    deliveryAreasTitle: 'We Deliver Around Araihazar',
    deliveryAreasTitle_bn: 'আমরা আরাইহাজারে ডেলিভারি দিই',
    deliveryAreasSubtitle: 'Fast delivery across your locality',
    deliveryAreasSubtitle_bn: 'আপনার এলাকায় দ্রুত ডেলিভারি',

    // Partner CTA
    partnerSectionTitle: 'Become a Partner',
    partnerSectionTitle_bn: 'পার্টনার হোন',
    partnerSectionSubtitle: 'Grow with us in Araihazar',
    partnerSectionSubtitle_bn: 'আরাইহাজারে আমাদের সাথে বেড়ে উঠুন',

    partnerRestaurantTitle: 'Own a Restaurant?',
    partnerRestaurantTitle_bn: 'রেস্টুরেন্ট আছে?',
    partnerRestaurantSubtitle: 'Join AraiFood',
    partnerRestaurantSubtitle_bn: 'AraiFood এ যোগ দিন',
    partnerRestaurantDesc:
      'List your restaurant, reach 50k+ customers, hassle-free onboarding & higher sales',
    partnerRestaurantDesc_bn:
      'আপনার রেস্টুরেন্ট লিস্ট করুন, ৫০ হাজার+ কাস্টমারের কাছে পৌঁছান, ঝামেলামুক্ত অনবোর্ডিং এবং বেশি বিক্রয়',
    partnerRestaurantBtn: 'Partner with us',
    partnerRestaurantBtn_bn: 'পার্টনার হোন',
    partnerRestaurantPath: '/restaurant-signup',

    partnerRiderTitle: 'Want to Become a Rider?',
    partnerRiderTitle_bn: 'রাইডার হতে চান?',
    partnerRiderSubtitle: 'Deliver with AraiFood',
    partnerRiderSubtitle_bn: 'AraiFood এর সাথে ডেলিভারি করুন',
    partnerRiderDesc:
      'Flexible earnings, weekly payouts, support & safety gear provided',
    partnerRiderDesc_bn:
      'নমনীয় আয়, সাপ্তাহিক পেমেন্ট, সাপোর্ট ও সেফটি গিয়ার দেওয়া হয়',
    partnerRiderBtn: 'Ride with us',
    partnerRiderBtn_bn: 'রাইডার হোন',
    partnerRiderPath: '/rider-signup',

    // Footer
    footerTagline: 'Food, Pharmacy & Gaming in One Place',
    footerTagline_bn: 'খাবার, ফার্মেসি ও গেমিং এক জায়গায়',
    footerCompanyName: 'AraiFood Ltd.',
    footerCompanyLinks: DEFAULT_COMPANY_LINKS,
    footerSupportLinks: DEFAULT_SUPPORT_LINKS,
    footerAppsLabel: 'Available on',
    footerAppsLabel_bn: 'পাওয়া যাচ্ছে',

    // Live Chat
    liveChatTeamName: 'Support Team',
    liveChatTeamName_bn: 'সাপোর্ট টিম',
    liveChatStatus: 'Online Now',
    liveChatStatus_bn: 'এখন অনলাইন',
    liveChatAvatar: '👨‍💼',
    liveChatWelcome: 'Hello! 👋 How can we help you today?',
    liveChatWelcome_bn: 'হ্যালো! 👋 আজ আপনাকে কীভাবে সাহায্য করতে পারি?',
    liveChatAutoReply:
      'Thank you for your message! Our team will get back to you shortly. 😊',
    liveChatAutoReply_bn:
      'আপনার বার্তার জন্য ধন্যবাদ! আমাদের টিম শীঘ্রই যোগাযোগ করবে। 😊',
    liveChatPlaceholder: 'Type your message...',
    liveChatPlaceholder_bn: 'আপনার বার্তা লিখুন...',
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
        const snap = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID))
        if (snap.exists()) {
          const d = snap.data()
          setState((prev) => ({
            ...prev,
            // Brand
            siteName: d.siteName ?? prev.siteName,
            siteName_bn: d.siteName_bn ?? prev.siteName_bn,
            tagline: d.tagline ?? prev.tagline,
            tagline_bn: d.tagline_bn ?? prev.tagline_bn,
            // Contact
            contactEmail: d.contactEmail ?? prev.contactEmail,
            contactPhone: d.contactPhone ?? prev.contactPhone,
            address: d.address ?? prev.address,
            // Fees
            defaultDeliveryFee: String(d.defaultDeliveryFee ?? prev.defaultDeliveryFee),
            minOrderAmount: String(d.minOrderAmount ?? prev.minOrderAmount),
            commissionPercent: String(d.commissionPercent ?? prev.commissionPercent),
            riderEarningPerDelivery: String(
              d.riderEarningPerDelivery ?? prev.riderEarningPerDelivery
            ),
            freeDeliveryThreshold: String(
              d.freeDeliveryThreshold ?? prev.freeDeliveryThreshold
            ),
            // Hours
            openingTime: d.openingTime ?? prev.openingTime,
            closingTime: d.closingTime ?? prev.closingTime,
            // Social
            facebookUrl: d.facebookUrl ?? prev.facebookUrl,
            instagramUrl: d.instagramUrl ?? prev.instagramUrl,
            twitterUrl: d.twitterUrl ?? prev.twitterUrl,
            linkedinUrl: d.linkedinUrl ?? prev.linkedinUrl,
            whatsappNumber: d.whatsappNumber ?? prev.whatsappNumber,
            appStoreUrl: d.appStoreUrl ?? prev.appStoreUrl,
            playStoreUrl: d.playStoreUrl ?? prev.playStoreUrl,
            // Payment
            gamingBkashNumber: d.gamingBkashNumber ?? prev.gamingBkashNumber,
            gamingNagadNumber: d.gamingNagadNumber ?? prev.gamingNagadNumber,
            walletBkashNumber: d.walletBkashNumber ?? prev.walletBkashNumber,
            walletNagadNumber: d.walletNagadNumber ?? prev.walletNagadNumber,
            walletMinAmount: String(d.walletMinAmount ?? prev.walletMinAmount),
            walletMaxAmount: String(d.walletMaxAmount ?? prev.walletMaxAmount),
            // Delivery
            defaultDeliveryTime: d.defaultDeliveryTime ?? prev.defaultDeliveryTime,
            deliveryAreaName: d.deliveryAreaName ?? prev.deliveryAreaName,
            deliverySlots:
              Array.isArray(d.deliverySlots) && d.deliverySlots.length > 0
                ? d.deliverySlots
                : prev.deliverySlots,
            // Map
            mapDefaultLat: String(d.mapDefaultCenter?.lat ?? prev.mapDefaultLat),
            mapDefaultLng: String(d.mapDefaultCenter?.lng ?? prev.mapDefaultLng),
            mapDefaultZoom: String(d.mapDefaultZoom ?? prev.mapDefaultZoom),
            // Hero
            heroTitle1: d.hero?.title1 ?? prev.heroTitle1,
            heroTitle1_bn: d.hero?.title1_bn ?? prev.heroTitle1_bn,
            heroTitle2: d.hero?.title2 ?? prev.heroTitle2,
            heroTitle2_bn: d.hero?.title2_bn ?? prev.heroTitle2_bn,
            heroTitle3: d.hero?.title3 ?? prev.heroTitle3,
            heroTitle3_bn: d.hero?.title3_bn ?? prev.heroTitle3_bn,
            heroSearchPlaceholder:
              d.hero?.searchPlaceholder ?? prev.heroSearchPlaceholder,
            heroSearchPlaceholder_bn:
              d.hero?.searchPlaceholder_bn ?? prev.heroSearchPlaceholder_bn,
            // Trust Bar
            trustText1: d.trustBar?.text1 ?? prev.trustText1,
            trustText1_bn: d.trustBar?.text1_bn ?? prev.trustText1_bn,
            trustText2: d.trustBar?.text2 ?? prev.trustText2,
            trustText2_bn: d.trustBar?.text2_bn ?? prev.trustText2_bn,
            trustText3: d.trustBar?.text3 ?? prev.trustText3,
            trustText3_bn: d.trustBar?.text3_bn ?? prev.trustText3_bn,
            // Features
            features:
              Array.isArray(d.features) && d.features.length > 0
                ? d.features
                : prev.features,
            // Home
            homePopularTitle: d.home?.popularTitle ?? prev.homePopularTitle,
            homePopularTitle_bn: d.home?.popularTitle_bn ?? prev.homePopularTitle_bn,
            homePopularSubtitle:
              d.home?.popularSubtitle ?? prev.homePopularSubtitle,
            homePopularSubtitle_bn:
              d.home?.popularSubtitle_bn ?? prev.homePopularSubtitle_bn,
            homePopularLimit: String(d.home?.popularLimit ?? prev.homePopularLimit),
            // Categories
            categoriesTitle: d.categories?.title ?? prev.categoriesTitle,
            categoriesTitle_bn:
              d.categories?.title_bn ?? prev.categoriesTitle_bn,
            categoriesSubtitle:
              d.categories?.subtitle ?? prev.categoriesSubtitle,
            categoriesSubtitle_bn:
              d.categories?.subtitle_bn ?? prev.categoriesSubtitle_bn,
            categoriesList:
              Array.isArray(d.categories?.list) && d.categories.list.length > 0
                ? d.categories.list
                : prev.categoriesList,
            // Delivery Areas
            deliveryAreasTitle:
              d.deliveryAreas?.title ?? prev.deliveryAreasTitle,
            deliveryAreasTitle_bn:
              d.deliveryAreas?.title_bn ?? prev.deliveryAreasTitle_bn,
            deliveryAreasSubtitle:
              d.deliveryAreas?.subtitle ?? prev.deliveryAreasSubtitle,
            deliveryAreasSubtitle_bn:
              d.deliveryAreas?.subtitle_bn ?? prev.deliveryAreasSubtitle_bn,
            // Partner CTA
            partnerSectionTitle:
              d.partner?.sectionTitle ?? prev.partnerSectionTitle,
            partnerSectionTitle_bn:
              d.partner?.sectionTitle_bn ?? prev.partnerSectionTitle_bn,
            partnerSectionSubtitle:
              d.partner?.sectionSubtitle ?? prev.partnerSectionSubtitle,
            partnerSectionSubtitle_bn:
              d.partner?.sectionSubtitle_bn ?? prev.partnerSectionSubtitle_bn,
            partnerRestaurantTitle:
              d.partner?.restaurant?.title ?? prev.partnerRestaurantTitle,
            partnerRestaurantTitle_bn:
              d.partner?.restaurant?.title_bn ?? prev.partnerRestaurantTitle_bn,
            partnerRestaurantSubtitle:
              d.partner?.restaurant?.subtitle ?? prev.partnerRestaurantSubtitle,
            partnerRestaurantSubtitle_bn:
              d.partner?.restaurant?.subtitle_bn ??
              prev.partnerRestaurantSubtitle_bn,
            partnerRestaurantDesc:
              d.partner?.restaurant?.description ?? prev.partnerRestaurantDesc,
            partnerRestaurantDesc_bn:
              d.partner?.restaurant?.description_bn ??
              prev.partnerRestaurantDesc_bn,
            partnerRestaurantBtn:
              d.partner?.restaurant?.buttonText ?? prev.partnerRestaurantBtn,
            partnerRestaurantBtn_bn:
              d.partner?.restaurant?.buttonText_bn ?? prev.partnerRestaurantBtn_bn,
            partnerRestaurantPath:
              d.partner?.restaurant?.path ?? prev.partnerRestaurantPath,
            partnerRiderTitle:
              d.partner?.rider?.title ?? prev.partnerRiderTitle,
            partnerRiderTitle_bn:
              d.partner?.rider?.title_bn ?? prev.partnerRiderTitle_bn,
            partnerRiderSubtitle:
              d.partner?.rider?.subtitle ?? prev.partnerRiderSubtitle,
            partnerRiderSubtitle_bn:
              d.partner?.rider?.subtitle_bn ?? prev.partnerRiderSubtitle_bn,
            partnerRiderDesc:
              d.partner?.rider?.description ?? prev.partnerRiderDesc,
            partnerRiderDesc_bn:
              d.partner?.rider?.description_bn ?? prev.partnerRiderDesc_bn,
            partnerRiderBtn:
              d.partner?.rider?.buttonText ?? prev.partnerRiderBtn,
            partnerRiderBtn_bn:
              d.partner?.rider?.buttonText_bn ?? prev.partnerRiderBtn_bn,
            partnerRiderPath:
              d.partner?.rider?.path ?? prev.partnerRiderPath,
            // Footer
            footerTagline: d.footer?.tagline ?? prev.footerTagline,
            footerTagline_bn: d.footer?.tagline_bn ?? prev.footerTagline_bn,
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
            footerAppsLabel_bn:
              d.footer?.appsLabel_bn ?? prev.footerAppsLabel_bn,
            // Live Chat
            liveChatTeamName: d.liveChat?.teamName ?? prev.liveChatTeamName,
            liveChatTeamName_bn:
              d.liveChat?.teamName_bn ?? prev.liveChatTeamName_bn,
            liveChatStatus: d.liveChat?.statusText ?? prev.liveChatStatus,
            liveChatStatus_bn:
              d.liveChat?.statusText_bn ?? prev.liveChatStatus_bn,
            liveChatAvatar: d.liveChat?.avatarEmoji ?? prev.liveChatAvatar,
            liveChatWelcome:
              d.liveChat?.welcomeMessage ?? prev.liveChatWelcome,
            liveChatWelcome_bn:
              d.liveChat?.welcomeMessage_bn ?? prev.liveChatWelcome_bn,
            liveChatAutoReply: d.liveChat?.autoReply ?? prev.liveChatAutoReply,
            liveChatAutoReply_bn:
              d.liveChat?.autoReply_bn ?? prev.liveChatAutoReply_bn,
            liveChatPlaceholder:
              d.liveChat?.inputPlaceholder ?? prev.liveChatPlaceholder,
            liveChatPlaceholder_bn:
              d.liveChat?.inputPlaceholder_bn ?? prev.liveChatPlaceholder_bn,
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
        // Brand
        siteName: state.siteName.trim(),
        siteName_bn: state.siteName_bn.trim(),
        tagline: state.tagline.trim(),
        tagline_bn: state.tagline_bn.trim(),

        // Contact
        contactEmail: state.contactEmail.trim(),
        contactPhone: state.contactPhone.trim(),
        address: state.address.trim(),

        // Fees
        defaultDeliveryFee: parseFloat(state.defaultDeliveryFee) || 30,
        minOrderAmount: parseFloat(state.minOrderAmount) || 100,
        commissionPercent: parseFloat(state.commissionPercent) || 10,
        riderEarningPerDelivery:
          parseFloat(state.riderEarningPerDelivery) || 30,
        freeDeliveryThreshold:
          parseFloat(state.freeDeliveryThreshold) || 500,

        // Hours
        openingTime: state.openingTime,
        closingTime: state.closingTime,

        // Social
        facebookUrl: state.facebookUrl.trim(),
        instagramUrl: state.instagramUrl.trim(),
        twitterUrl: state.twitterUrl.trim(),
        linkedinUrl: state.linkedinUrl.trim(),
        whatsappNumber: state.whatsappNumber.trim(),
        appStoreUrl: state.appStoreUrl.trim(),
        playStoreUrl: state.playStoreUrl.trim(),

        // Payment
        gamingBkashNumber: state.gamingBkashNumber.trim(),
        gamingNagadNumber: state.gamingNagadNumber.trim(),
        walletBkashNumber: state.walletBkashNumber.trim(),
        walletNagadNumber: state.walletNagadNumber.trim(),
        walletMinAmount: parseFloat(state.walletMinAmount) || 50,
        walletMaxAmount: parseFloat(state.walletMaxAmount) || 10000,

        // Delivery
        defaultDeliveryTime: state.defaultDeliveryTime.trim(),
        deliveryAreaName: state.deliveryAreaName.trim(),
        deliverySlots: state.deliverySlots,

        // Map
        mapDefaultCenter: {
          lat: parseFloat(state.mapDefaultLat) || 23.78,
          lng: parseFloat(state.mapDefaultLng) || 90.64,
        },
        mapDefaultZoom: parseFloat(state.mapDefaultZoom) || 14,

        // Hero
        hero: {
          title1: state.heroTitle1.trim(),
          title1_bn: state.heroTitle1_bn.trim(),
          title2: state.heroTitle2.trim(),
          title2_bn: state.heroTitle2_bn.trim(),
          title3: state.heroTitle3.trim(),
          title3_bn: state.heroTitle3_bn.trim(),
          searchPlaceholder: state.heroSearchPlaceholder.trim(),
          searchPlaceholder_bn: state.heroSearchPlaceholder_bn.trim(),
        },

        // Trust Bar
        trustBar: {
          text1: state.trustText1.trim(),
          text1_bn: state.trustText1_bn.trim(),
          text2: state.trustText2.trim(),
          text2_bn: state.trustText2_bn.trim(),
          text3: state.trustText3.trim(),
          text3_bn: state.trustText3_bn.trim(),
        },

        // Features
        features: state.features,

        // Home
        home: {
          popularTitle: state.homePopularTitle.trim(),
          popularTitle_bn: state.homePopularTitle_bn.trim(),
          popularSubtitle: state.homePopularSubtitle.trim(),
          popularSubtitle_bn: state.homePopularSubtitle_bn.trim(),
          popularLimit: parseInt(state.homePopularLimit) || 6,
        },

        // Categories
        categories: {
          title: state.categoriesTitle.trim(),
          title_bn: state.categoriesTitle_bn.trim(),
          subtitle: state.categoriesSubtitle.trim(),
          subtitle_bn: state.categoriesSubtitle_bn.trim(),
          list: state.categoriesList,
        },

        // Delivery Areas
        deliveryAreas: {
          title: state.deliveryAreasTitle.trim(),
          title_bn: state.deliveryAreasTitle_bn.trim(),
          subtitle: state.deliveryAreasSubtitle.trim(),
          subtitle_bn: state.deliveryAreasSubtitle_bn.trim(),
        },

        // Partner CTA
        partner: {
          sectionTitle: state.partnerSectionTitle.trim(),
          sectionTitle_bn: state.partnerSectionTitle_bn.trim(),
          sectionSubtitle: state.partnerSectionSubtitle.trim(),
          sectionSubtitle_bn: state.partnerSectionSubtitle_bn.trim(),
          restaurant: {
            title: state.partnerRestaurantTitle.trim(),
            title_bn: state.partnerRestaurantTitle_bn.trim(),
            subtitle: state.partnerRestaurantSubtitle.trim(),
            subtitle_bn: state.partnerRestaurantSubtitle_bn.trim(),
            description: state.partnerRestaurantDesc.trim(),
            description_bn: state.partnerRestaurantDesc_bn.trim(),
            buttonText: state.partnerRestaurantBtn.trim(),
            buttonText_bn: state.partnerRestaurantBtn_bn.trim(),
            path: state.partnerRestaurantPath.trim(),
          },
          rider: {
            title: state.partnerRiderTitle.trim(),
            title_bn: state.partnerRiderTitle_bn.trim(),
            subtitle: state.partnerRiderSubtitle.trim(),
            subtitle_bn: state.partnerRiderSubtitle_bn.trim(),
            description: state.partnerRiderDesc.trim(),
            description_bn: state.partnerRiderDesc_bn.trim(),
            buttonText: state.partnerRiderBtn.trim(),
            buttonText_bn: state.partnerRiderBtn_bn.trim(),
            path: state.partnerRiderPath.trim(),
          },
        },

        // Footer
        footer: {
          tagline: state.footerTagline.trim(),
          tagline_bn: state.footerTagline_bn.trim(),
          companyName: state.footerCompanyName.trim(),
          companyLinks: state.footerCompanyLinks,
          supportLinks: state.footerSupportLinks,
          appsLabel: state.footerAppsLabel.trim(),
          appsLabel_bn: state.footerAppsLabel_bn.trim(),
        },

        // Live Chat
        liveChat: {
          teamName: state.liveChatTeamName.trim(),
          teamName_bn: state.liveChatTeamName_bn.trim(),
          statusText: state.liveChatStatus.trim(),
          statusText_bn: state.liveChatStatus_bn.trim(),
          avatarEmoji: state.liveChatAvatar.trim(),
          welcomeMessage: state.liveChatWelcome.trim(),
          welcomeMessage_bn: state.liveChatWelcome_bn.trim(),
          autoReply: state.liveChatAutoReply.trim(),
          autoReply_bn: state.liveChatAutoReply_bn.trim(),
          inputPlaceholder: state.liveChatPlaceholder.trim(),
          inputPlaceholder_bn: state.liveChatPlaceholder_bn.trim(),
        },

        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), payload, {
        merge: true,
      })

      // Save welcome notifications
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

      // Save legal pages
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
              <BiField
                labelEn="Site Name (English)"
                labelBn="Site Name (বাংলা)"
                valueEn={state.siteName}
                valueBn={state.siteName_bn}
                onChangeEn={(v) => set('siteName', v)}
                onChangeBn={(v) => set('siteName_bn', v)}
              />
              <BiField
                labelEn="Tagline (English)"
                labelBn="Tagline (বাংলা)"
                valueEn={state.tagline}
                valueBn={state.tagline_bn}
                onChangeEn={(v) => set('tagline', v)}
                onChangeBn={(v) => set('tagline_bn', v)}
              />
            </Section>

            {/* ==================== HERO ==================== */}
            <Section icon={<Layout size={20} />} title="Hero Section">
              <BiField
                labelEn="Title Part 1 (English)"
                labelBn="Title Part 1 (বাংলা)"
                valueEn={state.heroTitle1}
                valueBn={state.heroTitle1_bn}
                onChangeEn={(v) => set('heroTitle1', v)}
                onChangeBn={(v) => set('heroTitle1_bn', v)}
              />
              <BiField
                labelEn="Title Part 2 — Highlight (English)"
                labelBn="Title Part 2 — Highlight (বাংলা)"
                valueEn={state.heroTitle2}
                valueBn={state.heroTitle2_bn}
                onChangeEn={(v) => set('heroTitle2', v)}
                onChangeBn={(v) => set('heroTitle2_bn', v)}
              />
              <BiField
                labelEn="Title Part 3 (English)"
                labelBn="Title Part 3 (বাংলা)"
                valueEn={state.heroTitle3}
                valueBn={state.heroTitle3_bn}
                onChangeEn={(v) => set('heroTitle3', v)}
                onChangeBn={(v) => set('heroTitle3_bn', v)}
              />
              <BiField
                labelEn="Search Placeholder (English)"
                labelBn="Search Placeholder (বাংলা)"
                valueEn={state.heroSearchPlaceholder}
                valueBn={state.heroSearchPlaceholder_bn}
                onChangeEn={(v) => set('heroSearchPlaceholder', v)}
                onChangeBn={(v) => set('heroSearchPlaceholder_bn', v)}
              />
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
                    <Field label="Title (EN)">
                      <input
                        style={inputStyle}
                        value={f.title}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'title', e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Title (বাংলা)">
                      <input
                        style={inputStyle}
                        value={f.title_bn || ''}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'title_bn', e.target.value)
                        }
                      />
                    </Field>
                  </div>
                  <div style={gridTwo}>
                    <Field label="Description (EN)">
                      <input
                        style={inputStyle}
                        value={f.desc}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'desc', e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Description (বাংলা)">
                      <input
                        style={inputStyle}
                        value={f.desc_bn || ''}
                        onChange={(e) =>
                          updateArrayItem('features', idx, 'desc_bn', e.target.value)
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
                    title_bn: 'নতুন ফিচার',
                    desc: 'Description',
                    desc_bn: 'বিবরণ',
                  })
                }
              >
                <Plus size={14} /> Add Feature
              </button>
            </Section>

            {/* ==================== TRUST BAR ==================== */}
            <Section icon={<Sparkles size={20} />} title="Trust Bar">
              <BiField
                labelEn="Text 1 (English)"
                labelBn="Text 1 (বাংলা)"
                valueEn={state.trustText1}
                valueBn={state.trustText1_bn}
                onChangeEn={(v) => set('trustText1', v)}
                onChangeBn={(v) => set('trustText1_bn', v)}
              />
              <BiField
                labelEn="Text 2 (English)"
                labelBn="Text 2 (বাংলা)"
                valueEn={state.trustText2}
                valueBn={state.trustText2_bn}
                onChangeEn={(v) => set('trustText2', v)}
                onChangeBn={(v) => set('trustText2_bn', v)}
              />
              <BiField
                labelEn="Text 3 (English)"
                labelBn="Text 3 (বাংলা)"
                valueEn={state.trustText3}
                valueBn={state.trustText3_bn}
                onChangeEn={(v) => set('trustText3', v)}
                onChangeBn={(v) => set('trustText3_bn', v)}
              />
            </Section>
            {/* ==================== HOME ==================== */}
            <Section icon={<Home size={20} />} title="Home Section">
              <BiField
                labelEn="Popular Title (English)"
                labelBn="Popular Title (বাংলা)"
                valueEn={state.homePopularTitle}
                valueBn={state.homePopularTitle_bn}
                onChangeEn={(v) => set('homePopularTitle', v)}
                onChangeBn={(v) => set('homePopularTitle_bn', v)}
              />
              <BiField
                labelEn="Popular Subtitle (English)"
                labelBn="Popular Subtitle (বাংলা)"
                valueEn={state.homePopularSubtitle}
                valueBn={state.homePopularSubtitle_bn}
                onChangeEn={(v) => set('homePopularSubtitle', v)}
                onChangeBn={(v) => set('homePopularSubtitle_bn', v)}
              />
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
              <BiField
                labelEn="Title (English)"
                labelBn="Title (বাংলা)"
                valueEn={state.categoriesTitle}
                valueBn={state.categoriesTitle_bn}
                onChangeEn={(v) => set('categoriesTitle', v)}
                onChangeBn={(v) => set('categoriesTitle_bn', v)}
              />
              <BiField
                labelEn="Subtitle (English)"
                labelBn="Subtitle (বাংলা)"
                valueEn={state.categoriesSubtitle}
                valueBn={state.categoriesSubtitle_bn}
                onChangeEn={(v) => set('categoriesSubtitle', v)}
                onChangeBn={(v) => set('categoriesSubtitle_bn', v)}
              />

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
                  <div style={gridTwo}>
                    <Field label="Name (EN)">
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
                    <Field label="Name (বাংলা)">
                      <input
                        style={inputStyle}
                        value={c.name_bn || ''}
                        onChange={(e) =>
                          updateArrayItem(
                            'categoriesList',
                            idx,
                            'name_bn',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div style={gridThree}>
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
                    name_bn: 'নতুন',
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
              <BiField
                labelEn="Title (English)"
                labelBn="Title (বাংলা)"
                valueEn={state.deliveryAreasTitle}
                valueBn={state.deliveryAreasTitle_bn}
                onChangeEn={(v) => set('deliveryAreasTitle', v)}
                onChangeBn={(v) => set('deliveryAreasTitle_bn', v)}
              />
              <BiField
                labelEn="Subtitle (English)"
                labelBn="Subtitle (বাংলা)"
                valueEn={state.deliveryAreasSubtitle}
                valueBn={state.deliveryAreasSubtitle_bn}
                onChangeEn={(v) => set('deliveryAreasSubtitle', v)}
                onChangeBn={(v) => set('deliveryAreasSubtitle_bn', v)}
              />
            </Section>

            {/* ==================== PARTNER CTA ==================== */}
            <Section icon={<Handshake size={20} />} title="Partner CTA">
              <BiField
                labelEn="Section Title (English)"
                labelBn="Section Title (বাংলা)"
                valueEn={state.partnerSectionTitle}
                valueBn={state.partnerSectionTitle_bn}
                onChangeEn={(v) => set('partnerSectionTitle', v)}
                onChangeBn={(v) => set('partnerSectionTitle_bn', v)}
              />
              <BiField
                labelEn="Section Subtitle (English)"
                labelBn="Section Subtitle (বাংলা)"
                valueEn={state.partnerSectionSubtitle}
                valueBn={state.partnerSectionSubtitle_bn}
                onChangeEn={(v) => set('partnerSectionSubtitle', v)}
                onChangeBn={(v) => set('partnerSectionSubtitle_bn', v)}
              />

              <h4 style={subHeading}>Restaurant Card</h4>
              <BiField
                labelEn="Title (English)"
                labelBn="Title (বাংলা)"
                valueEn={state.partnerRestaurantTitle}
                valueBn={state.partnerRestaurantTitle_bn}
                onChangeEn={(v) => set('partnerRestaurantTitle', v)}
                onChangeBn={(v) => set('partnerRestaurantTitle_bn', v)}
              />
              <BiField
                labelEn="Subtitle (English)"
                labelBn="Subtitle (বাংলা)"
                valueEn={state.partnerRestaurantSubtitle}
                valueBn={state.partnerRestaurantSubtitle_bn}
                onChangeEn={(v) => set('partnerRestaurantSubtitle', v)}
                onChangeBn={(v) => set('partnerRestaurantSubtitle_bn', v)}
              />
              <BiField
                labelEn="Description (English)"
                labelBn="Description (বাংলা)"
                valueEn={state.partnerRestaurantDesc}
                valueBn={state.partnerRestaurantDesc_bn}
                onChangeEn={(v) => set('partnerRestaurantDesc', v)}
                onChangeBn={(v) => set('partnerRestaurantDesc_bn', v)}
                multiline
              />
              <BiField
                labelEn="Button Text (English)"
                labelBn="Button Text (বাংলা)"
                valueEn={state.partnerRestaurantBtn}
                valueBn={state.partnerRestaurantBtn_bn}
                onChangeEn={(v) => set('partnerRestaurantBtn', v)}
                onChangeBn={(v) => set('partnerRestaurantBtn_bn', v)}
              />
              <Field label="Button Path">
                <input
                  style={inputStyle}
                  value={state.partnerRestaurantPath}
                  onChange={(e) =>
                    set('partnerRestaurantPath', e.target.value)
                  }
                />
              </Field>

              <h4 style={subHeading}>Rider Card</h4>
              <BiField
                labelEn="Title (English)"
                labelBn="Title (বাংলা)"
                valueEn={state.partnerRiderTitle}
                valueBn={state.partnerRiderTitle_bn}
                onChangeEn={(v) => set('partnerRiderTitle', v)}
                onChangeBn={(v) => set('partnerRiderTitle_bn', v)}
              />
              <BiField
                labelEn="Subtitle (English)"
                labelBn="Subtitle (বাংলা)"
                valueEn={state.partnerRiderSubtitle}
                valueBn={state.partnerRiderSubtitle_bn}
                onChangeEn={(v) => set('partnerRiderSubtitle', v)}
                onChangeBn={(v) => set('partnerRiderSubtitle_bn', v)}
              />
              <BiField
                labelEn="Description (English)"
                labelBn="Description (বাংলা)"
                valueEn={state.partnerRiderDesc}
                valueBn={state.partnerRiderDesc_bn}
                onChangeEn={(v) => set('partnerRiderDesc', v)}
                onChangeBn={(v) => set('partnerRiderDesc_bn', v)}
                multiline
              />
              <BiField
                labelEn="Button Text (English)"
                labelBn="Button Text (বাংলা)"
                valueEn={state.partnerRiderBtn}
                valueBn={state.partnerRiderBtn_bn}
                onChangeEn={(v) => set('partnerRiderBtn', v)}
                onChangeBn={(v) => set('partnerRiderBtn_bn', v)}
              />
              <Field label="Button Path">
                <input
                  style={inputStyle}
                  value={state.partnerRiderPath}
                  onChange={(e) => set('partnerRiderPath', e.target.value)}
                />
              </Field>
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
            <Section icon={<DollarSign size={20} />} title="Fees & Commission">
              <div style={gridTwo}>
                <Field label="Default Delivery Fee (৳)" icon={<Truck size={14} />}>
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
                <Field label="Platform Commission (%)" icon={<Percent size={14} />}>
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
            <Section icon={<Truck size={20} />} title="Delivery / Checkout Settings">
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
            <Section icon={<Clock size={20} />} title="Platform Operating Hours">
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
              <BiField
                labelEn="Tagline (English)"
                labelBn="Tagline (বাংলা)"
                valueEn={state.footerTagline}
                valueBn={state.footerTagline_bn}
                onChangeEn={(v) => set('footerTagline', v)}
                onChangeBn={(v) => set('footerTagline_bn', v)}
              />
              <Field label="Company Name (©)">
                <input
                  style={inputStyle}
                  value={state.footerCompanyName}
                  onChange={(e) => set('footerCompanyName', e.target.value)}
                />
              </Field>
              <BiField
                labelEn="Apps Row Label (English)"
                labelBn="Apps Row Label (বাংলা)"
                valueEn={state.footerAppsLabel}
                valueBn={state.footerAppsLabel_bn}
                onChangeEn={(v) => set('footerAppsLabel', v)}
                onChangeBn={(v) => set('footerAppsLabel_bn', v)}
              />

              <h4 style={subHeading}>Company Links</h4>
              {state.footerCompanyLinks.map((l, idx) => (
                <div key={idx} style={arrayCard}>
                  <div style={arrayHeader}>
                    <strong>Link {idx + 1}</strong>
                    <button
                      style={deleteBtn}
                      onClick={() => removeArrayItem('footerCompanyLinks', idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={gridTwo}>
                    <Field label="Text (EN)">
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
                    <Field label="Text (বাংলা)">
                      <input
                        style={inputStyle}
                        value={l.text_bn || ''}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerCompanyLinks',
                            idx,
                            'text_bn',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div style={gridTwo}>
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
                    text_bn: 'নতুন লিংক',
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
                      onClick={() => removeArrayItem('footerSupportLinks', idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={gridTwo}>
                    <Field label="Text (EN)">
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
                    <Field label="Text (বাংলা)">
                      <input
                        style={inputStyle}
                        value={l.text_bn || ''}
                        onChange={(e) =>
                          updateArrayItem(
                            'footerSupportLinks',
                            idx,
                            'text_bn',
                            e.target.value
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div style={gridTwo}>
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
                    text_bn: 'নতুন লিংক',
                    url: '#',
                    isExternal: false,
                  })
                }
              >
                <Plus size={14} /> Add Support Link
              </button>
            </Section>

            {/* ==================== LEGAL PAGES ==================== */}
            <Section
              icon={<Scale size={20} />}
              title="Legal Pages"
              subtitle="Refund, Privacy & Terms content — যা লিখবেন সেটাই website এ show হবে"
            >
              <div style={legalCard}>
                <div style={legalHeader}>
                  <div style={legalIconWrap}>
                    <FileText size={18} color="#059669" strokeWidth={2.4} />
                  </div>
                  <div>
                    <strong style={legalTitle}>Refund Policy</strong>
                    <span style={legalSub}>Payment refund নিয়মাবলী</span>
                  </div>
                </div>
                <Field label="Page Title">
                  <input
                    type="text"
                    style={inputStyle}
                    value={legal.refundTitle}
                    onChange={(e) => setLegalField('refundTitle', e.target.value)}
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
                  />
                </Field>
              </div>

              <div style={legalCard}>
                <div style={legalHeader}>
                  <div style={legalIconWrap}>
                    <FileText size={18} color="#3B82F6" strokeWidth={2.4} />
                  </div>
                  <div>
                    <strong style={legalTitle}>Privacy Policy</strong>
                    <span style={legalSub}>User data এবং privacy সংক্রান্ত</span>
                  </div>
                </div>
                <Field label="Page Title">
                  <input
                    type="text"
                    style={inputStyle}
                    value={legal.privacyTitle}
                    onChange={(e) => setLegalField('privacyTitle', e.target.value)}
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
                  />
                </Field>
              </div>

              <div style={legalCard}>
                <div style={legalHeader}>
                  <div style={legalIconWrap}>
                    <FileText size={18} color="#F59E0B" strokeWidth={2.4} />
                  </div>
                  <div>
                    <strong style={legalTitle}>Terms & Conditions</strong>
                    <span style={legalSub}>Website ব্যবহারের শর্তাবলী</span>
                  </div>
                </div>
                <Field label="Page Title">
                  <input
                    type="text"
                    style={inputStyle}
                    value={legal.termsTitle}
                    onChange={(e) => setLegalField('termsTitle', e.target.value)}
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
                  />
                </Field>
              </div>
            </Section>

            {/* ==================== LIVE CHAT ==================== */}
            <Section icon={<MessageCircle size={20} />} title="Live Chat">
              <BiField
                labelEn="Team Name (English)"
                labelBn="Team Name (বাংলা)"
                valueEn={state.liveChatTeamName}
                valueBn={state.liveChatTeamName_bn}
                onChangeEn={(v) => set('liveChatTeamName', v)}
                onChangeBn={(v) => set('liveChatTeamName_bn', v)}
              />
              <BiField
                labelEn="Status Text (English)"
                labelBn="Status Text (বাংলা)"
                valueEn={state.liveChatStatus}
                valueBn={state.liveChatStatus_bn}
                onChangeEn={(v) => set('liveChatStatus', v)}
                onChangeBn={(v) => set('liveChatStatus_bn', v)}
              />
              <div style={gridTwo}>
                <Field label="Avatar Emoji">
                  <input
                    style={inputStyle}
                    value={state.liveChatAvatar}
                    onChange={(e) => set('liveChatAvatar', e.target.value)}
                  />
                </Field>
              </div>
              <BiField
                labelEn="Welcome Message (English)"
                labelBn="Welcome Message (বাংলা)"
                valueEn={state.liveChatWelcome}
                valueBn={state.liveChatWelcome_bn}
                onChangeEn={(v) => set('liveChatWelcome', v)}
                onChangeBn={(v) => set('liveChatWelcome_bn', v)}
                multiline
              />
              <BiField
                labelEn="Auto Reply (English)"
                labelBn="Auto Reply (বাংলা)"
                valueEn={state.liveChatAutoReply}
                valueBn={state.liveChatAutoReply_bn}
                onChangeEn={(v) => set('liveChatAutoReply', v)}
                onChangeBn={(v) => set('liveChatAutoReply_bn', v)}
                multiline
              />
              <BiField
                labelEn="Input Placeholder (English)"
                labelBn="Input Placeholder (বাংলা)"
                valueEn={state.liveChatPlaceholder}
                valueBn={state.liveChatPlaceholder_bn}
                onChangeEn={(v) => set('liveChatPlaceholder', v)}
                onChangeBn={(v) => set('liveChatPlaceholder_bn', v)}
              />
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

              <h4 style={subHeading}>Mobile App Links</h4>
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
// WELCOME CARD COMPONENT — WITH BILINGUAL
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
          <BiField
            labelEn="Title (English)"
            labelBn="Title (বাংলা)"
            valueEn={data.title || ''}
            valueBn={data.title_bn || ''}
            onChangeEn={(v) => onChange('title', v)}
            onChangeBn={(v) => onChange('title_bn', v)}
          />
          <BiField
            labelEn="Body / Message (English)"
            labelBn="Body / Message (বাংলা)"
            valueEn={data.body || ''}
            valueBn={data.body_bn || ''}
            onChangeEn={(v) => onChange('body', v)}
            onChangeBn={(v) => onChange('body_bn', v)}
            multiline
          />
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

// ✅ BiField — Dual input for English + Bangla
function BiField({
  labelEn,
  labelBn,
  valueEn,
  valueBn,
  onChangeEn,
  onChangeBn,
  multiline = false,
}) {
  const inputProps = {
    style: inputStyle,
    value: valueEn,
    onChange: (e) => onChangeEn(e.target.value),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={gridTwo}>
        <Field label={labelEn}>
          {multiline ? (
            <textarea {...inputProps} rows="3" />
          ) : (
            <input type="text" {...inputProps} />
          )}
        </Field>
        <Field label={labelBn}>
          {multiline ? (
            <textarea
              style={inputStyle}
              value={valueBn}
              onChange={(e) => onChangeBn(e.target.value)}
              rows="3"
            />
          ) : (
            <input
              type="text"
              style={inputStyle}
              value={valueBn}
              onChange={(e) => onChangeBn(e.target.value)}
            />
          )}
        </Field>
      </div>
    </div>
  )
}

export default AdminSettingsPage