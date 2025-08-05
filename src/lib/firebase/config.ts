import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// connectAuthEmulator and connectFirestoreEmulator reserved for development setup

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}

// Default configuration for development/demo
const defaultConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo-app-id',
}

const firebaseConfig = isFirebaseConfigured() ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} : defaultConfig

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// If using demo config, connect to emulators (for development)
if (!isFirebaseConfigured() && typeof window !== 'undefined') {
  console.warn('⚠️ Firebase not configured. Using demo mode. Please set up Firebase configuration in .env.local')
  
  // Note: In a real app, you'd connect to Firebase emulators here
  // For now, we'll just log the warning
}

export { isFirebaseConfigured }
export default app