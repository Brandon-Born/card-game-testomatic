import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './config'

// Magic link authentication settings
const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback',
  // This must be true.
  handleCodeInApp: true,
}

/**
 * Send a magic link to the user's email
 */
export const sendMagicLink = async (email: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not configured. Please set up Firebase configuration in .env.local')
  }
  
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    // Save the email locally to complete the sign-in process
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email)
    }
  } catch (error) {
    console.error('Error sending magic link:', error)
    throw new Error('Failed to send magic link. Please try again.')
  }
}

/**
 * Complete the magic link sign-in process
 */
export const completeMagicLinkSignIn = async (emailLink: string): Promise<User> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not configured. Please set up Firebase configuration in .env.local')
  }
  
  try {
    if (!isSignInWithEmailLink(auth, emailLink)) {
      throw new Error('Invalid sign-in link')
    }

    // Get the email from localStorage or prompt the user
    let email = typeof window !== 'undefined' ? window.localStorage.getItem('emailForSignIn') : null
    
    if (!email) {
      // If the email is not available, prompt the user for it
      email = window.prompt('Please provide your email for confirmation') || ''
    }

    if (!email) {
      throw new Error('Email is required to complete sign-in')
    }

    // Complete the sign-in
    const result = await signInWithEmailLink(auth, email, emailLink)
    
    // Clear the email from localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('emailForSignIn')
    }

    return result.user
  } catch (error) {
    console.error('Error completing magic link sign-in:', error)
    throw new Error('Failed to complete sign-in. Please try again.')
  }
}

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw new Error('Failed to sign out. Please try again.')
  }
}

/**
 * Get the current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

/**
 * Listen for authentication state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Check if the current URL is a sign-in link
 */
export const isSignInLink = (url: string): boolean => {
  return isSignInWithEmailLink(auth, url)
}