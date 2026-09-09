import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBrjHtQo8PM9dNc7GBhS6tsNNdjJh7wFE4",
  authDomain: "araifood-3e9a0.firebaseapp.com",
  projectId: "araifood-3e9a0",
  storageBucket: "araifood-3e9a0.firebasestorage.app",
  messagingSenderId: "688524191064",
  appId: "1:688524191064:web:169aab06da035359d9712d"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)