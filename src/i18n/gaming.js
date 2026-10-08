// ============================================================
// src/i18n/gaming.js
// Gaming pages — main page + order modal + orders page
// V2 — + gamingOrders page keys (statuses, cards, banners)
// ============================================================

export const gaming = {
  en: {
    // -------- MAIN PAGE --------
    'gaming.back': 'Back',
    'gaming.badge': 'ARAIFOOD GAMING',
    'gaming.heading1': 'Top-Up',
    'gaming.heading2': 'Game Currency',
    'gaming.subtitle': 'Buy PUBG UC, Free Fire Diamonds, and more — instant top-up at the best price!',

    'gaming.bkashLabel': '💳 bKash (Personal)',
    'gaming.nagadLabel': '💰 Nagad (Personal)',
    'gaming.notSet': 'Not set',
    'gaming.copied': 'Copied',
    'gaming.copy': 'Copy',
    'gaming.howToOrderTitle': 'How to order:',
    'gaming.howToOrderText': 'Select a product → Enter your Player ID → Send money to above number → Submit transaction ID. Top-up within 5 minutes.',

    'gaming.myOrders': 'My Orders',
    'gaming.searchPlaceholder': 'Search packs...',

    'gaming.loading': 'Loading products...',
    'gaming.emptyNoProducts': 'No products available yet',
    'gaming.emptyNoProductsDesc': "Check back soon — we're adding new top-up packs!",
    'gaming.emptyNoPacks': 'No packs found',
    'gaming.emptyNoPacksDesc': 'Try a different search.',
    'gaming.backToHome': 'Back to Home',
    'gaming.orderNow': 'Order Now',

    'gaming.toastNumberCopied': 'Number copied!',
    'gaming.toastPaymentNotConfigured': 'Payment number not configured for this game',

    // -------- ORDER MODAL --------
    'gaming.modalStep1': 'Step 1: Player ID',
    'gaming.modalPlayerIdPlaceholder': 'Enter your {game} Player ID',
    'gaming.modalStep2': 'Step 2: Send ৳{price} to',
    'gaming.modalMethodBkash': '💳 bKash',
    'gaming.modalMethodNagad': '💰 Nagad',
    'gaming.modalMethodBkashLabel': 'bKash',
    'gaming.modalMethodNagadLabel': 'Nagad',
    'gaming.modalPersonal': '(Personal)',
    'gaming.modalStep3': 'Step 3: Transaction ID',
    'gaming.modalTrxPlaceholder': 'e.g., 9F7D2K4LX8 (from bKash/Nagad SMS)',
    'gaming.modalInfo': '⚡ Top-up within <strong>5 minutes</strong> after payment confirmation.',
    'gaming.modalPlaceOrder': 'Place Order — ৳{price}',
    'gaming.modalPlacing': 'Placing Order...',

    'gaming.errLoginRequired': 'Please login to place an order',
    'gaming.errPlayerId': 'Please enter your Player ID',
    'gaming.errTrxId': 'Please enter the transaction ID',
    'gaming.errPaymentNotSet': 'Payment number not set. Please contact support.',
    'gaming.successOrderPlaced': '✅ Order {orderId} placed! We\'ll top-up within 5 min.',
    'gaming.errOrderFailed': 'Failed to place order',

    // -------- GAMING ORDERS PAGE --------
    'gamingOrders.loading': 'Loading your gaming orders...',
    'gamingOrders.back': 'Back',
    'gamingOrders.badge': 'GAMING ORDERS',
    'gamingOrders.title': 'My Game Top-Ups',
    'gamingOrders.subtitle': 'Track your top-up orders and their status',

    'gamingOrders.pleaseLogin': 'Please Login',
    'gamingOrders.pleaseLoginDesc': 'Login to see your gaming order history',
    'gamingOrders.loginBtn': 'Login →',

    'gamingOrders.empty': 'No gaming orders yet',
    'gamingOrders.emptyDesc': 'Place your first top-up order and it will show here.',
    'gamingOrders.browseGames': 'Browse Games →',

    // Card labels
    'gamingOrders.orderIdLabel': 'Order ID',
    'gamingOrders.gameLabel': '🎮 Game',
    'gamingOrders.packLabel': '📦 Pack',
    'gamingOrders.priceLabel': '💰 Price',
    'gamingOrders.playerIdLabel': '🆔 Player ID',
    'gamingOrders.paymentInfo': '💳 {method} →',
    'gamingOrders.trxLabel': '🧾 TrxID →',

    // Statuses
    'gamingOrders.statusPending': 'Pending',
    'gamingOrders.statusProcessing': 'Processing',
    'gamingOrders.statusDelivered': 'Delivered',
    'gamingOrders.statusCancelled': 'Cancelled',

    // Status messages
    'gamingOrders.pendingMsg': "⏳ We're verifying your payment. Top-up usually completes within 5 minutes.",
    'gamingOrders.processingMsg': '⚙️ Your top-up is being processed. Please wait.',
    'gamingOrders.deliveredMsg': '✅ Top-up delivered! Check your game account.',
    'gamingOrders.cancelledMsg': '❌ This order was cancelled.',
    'gamingOrders.cancelledReason': ' Reason: {reason}',

    // Toast
    'gamingOrders.copiedToast': 'Copied!',
    'gamingOrders.dateEmpty': '—',
  },

  bn: {
    // -------- MAIN PAGE --------
    'gaming.back': 'পিছনে',
    'gaming.badge': 'আরাইফুড গেমিং',
    'gaming.heading1': 'টপ-আপ',
    'gaming.heading2': 'গেম কারেন্সি',
    'gaming.subtitle': 'PUBG UC, ফ্রি ফায়ার ডায়মন্ড এবং আরও অনেক কিছু — সেরা দামে তাৎক্ষণিক টপ-আপ!',

    'gaming.bkashLabel': '💳 বিকাশ (পার্সোনাল)',
    'gaming.nagadLabel': '💰 নগদ (পার্সোনাল)',
    'gaming.notSet': 'সেট করা হয়নি',
    'gaming.copied': 'কপি হয়েছে',
    'gaming.copy': 'কপি',
    'gaming.howToOrderTitle': 'কীভাবে অর্ডার করবেন:',
    'gaming.howToOrderText': 'একটি প্যাক বেছে নিন → আপনার প্লেয়ার আইডি লিখুন → উপরের নম্বরে টাকা পাঠান → ট্রানজেকশন আইডি জমা দিন। ৫ মিনিটের মধ্যে টপ-আপ।',

    'gaming.myOrders': 'আমার অর্ডার',
    'gaming.searchPlaceholder': 'প্যাক খুঁজুন...',

    'gaming.loading': 'প্রোডাক্ট লোড হচ্ছে...',
    'gaming.emptyNoProducts': 'এখনো কোনো প্রোডাক্ট নেই',
    'gaming.emptyNoProductsDesc': 'শীঘ্রই আসছে — নতুন টপ-আপ প্যাক যোগ করা হচ্ছে!',
    'gaming.emptyNoPacks': 'কোনো প্যাক পাওয়া যায়নি',
    'gaming.emptyNoPacksDesc': 'অন্য কিছু খুঁজুন।',
    'gaming.backToHome': 'হোমে ফিরুন',
    'gaming.orderNow': 'এখনই অর্ডার করুন',

    'gaming.toastNumberCopied': 'নম্বর কপি হয়েছে!',
    'gaming.toastPaymentNotConfigured': 'এই গেমের জন্য পেমেন্ট নম্বর সেট করা হয়নি',

    // -------- ORDER MODAL --------
    'gaming.modalStep1': 'ধাপ ১: প্লেয়ার আইডি',
    'gaming.modalPlayerIdPlaceholder': 'আপনার {game} প্লেয়ার আইডি লিখুন',
    'gaming.modalStep2': 'ধাপ ২: ৳{price} পাঠান এই নম্বরে',
    'gaming.modalMethodBkash': '💳 বিকাশ',
    'gaming.modalMethodNagad': '💰 নগদ',
    'gaming.modalMethodBkashLabel': 'বিকাশ',
    'gaming.modalMethodNagadLabel': 'নগদ',
    'gaming.modalPersonal': '(পার্সোনাল)',
    'gaming.modalStep3': 'ধাপ ৩: ট্রানজেকশন আইডি',
    'gaming.modalTrxPlaceholder': 'যেমন: 9F7D2K4LX8 (বিকাশ/নগদ SMS থেকে)',
    'gaming.modalInfo': '⚡ পেমেন্ট কনফার্ম হওয়ার পর <strong>৫ মিনিটের মধ্যে</strong> টপ-আপ।',
    'gaming.modalPlaceOrder': 'অর্ডার করুন — ৳{price}',
    'gaming.modalPlacing': 'অর্ডার হচ্ছে...',

    'gaming.errLoginRequired': 'অর্ডার দিতে লগইন করুন',
    'gaming.errPlayerId': 'আপনার প্লেয়ার আইডি লিখুন',
    'gaming.errTrxId': 'ট্রানজেকশন আইডি লিখুন',
    'gaming.errPaymentNotSet': 'পেমেন্ট নম্বর সেট করা হয়নি। সাপোর্টে যোগাযোগ করুন।',
    'gaming.successOrderPlaced': '✅ অর্ডার {orderId} দেওয়া হয়েছে! ৫ মিনিটের মধ্যে টপ-আপ করা হবে।',
    'gaming.errOrderFailed': 'অর্ডার দিতে ব্যর্থ',

    // -------- GAMING ORDERS PAGE --------
    'gamingOrders.loading': 'আপনার গেমিং অর্ডার লোড হচ্ছে...',
    'gamingOrders.back': 'পিছনে',
    'gamingOrders.badge': 'গেমিং অর্ডার',
    'gamingOrders.title': 'আমার গেম টপ-আপ',
    'gamingOrders.subtitle': 'আপনার টপ-আপ অর্ডার ও স্টেটাস ট্র্যাক করুন',

    'gamingOrders.pleaseLogin': 'অনুগ্রহ করে লগইন করুন',
    'gamingOrders.pleaseLoginDesc': 'গেমিং অর্ডার হিস্টরি দেখতে লগইন করুন',
    'gamingOrders.loginBtn': 'লগইন →',

    'gamingOrders.empty': 'এখনো কোনো গেমিং অর্ডার নেই',
    'gamingOrders.emptyDesc': 'আপনার প্রথম টপ-আপ অর্ডার দিন, এখানে দেখা যাবে।',
    'gamingOrders.browseGames': 'গেম ব্রাউজ করুন →',

    // Card labels
    'gamingOrders.orderIdLabel': 'অর্ডার আইডি',
    'gamingOrders.gameLabel': '🎮 গেম',
    'gamingOrders.packLabel': '📦 প্যাক',
    'gamingOrders.priceLabel': '💰 দাম',
    'gamingOrders.playerIdLabel': '🆔 প্লেয়ার আইডি',
    'gamingOrders.paymentInfo': '💳 {method} →',
    'gamingOrders.trxLabel': '🧾 ট্রানজেকশন আইডি →',

    // Statuses
    'gamingOrders.statusPending': 'অপেক্ষমাণ',
    'gamingOrders.statusProcessing': 'প্রসেসিং',
    'gamingOrders.statusDelivered': 'ডেলিভারড',
    'gamingOrders.statusCancelled': 'বাতিল',

    // Status messages
    'gamingOrders.pendingMsg': '⏳ আমরা আপনার পেমেন্ট যাচাই করছি। সাধারণত ৫ মিনিটের মধ্যে টপ-আপ সম্পন্ন হয়।',
    'gamingOrders.processingMsg': '⚙️ আপনার টপ-আপ প্রসেস হচ্ছে। অপেক্ষা করুন।',
    'gamingOrders.deliveredMsg': '✅ টপ-আপ ডেলিভারি হয়েছে! আপনার গেম অ্যাকাউন্ট চেক করুন।',
    'gamingOrders.cancelledMsg': '❌ এই অর্ডার বাতিল করা হয়েছে।',
    'gamingOrders.cancelledReason': ' কারণ: {reason}',

    // Toast
    'gamingOrders.copiedToast': 'কপি হয়েছে!',
    'gamingOrders.dateEmpty': '—',
  },
}