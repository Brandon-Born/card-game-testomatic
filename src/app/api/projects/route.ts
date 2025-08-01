import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Production: use service account
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } else {
      // Development: use project ID only (requires Firebase emulator or reduced security)
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

/**
 * Verify the Firebase ID token from the request
 */
async function verifyToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split('Bearer ')[1]
    
    try {
      const adminAuth = getAuth()
      const decodedToken = await adminAuth.verifyIdToken(token)
      return decodedToken.uid
    } catch (adminError) {
      // If admin verification fails in development, fall back to client-side approach
      if (process.env.NODE_ENV === 'development') {
        console.warn('Admin token verification failed, using development mode')
        return 'dev-user-' + Math.random().toString(36).substr(2, 9)
      }
      throw adminError
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

/**
 * GET /api/projects - Get all projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const uid = await verifyToken(request)
    
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query Firestore for user's projects
    const projectsRef = collection(db, 'projects')
    const q = query(projectsRef, where('ownerUid', '==', uid))
    const querySnapshot = await getDocs(q)
    
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/projects - Create a new project for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const uid = await verifyToken(request)
    
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, cards = [], rules = [] } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const projectData = {
      name,
      description: description || '',
      cards,
      rules,
      ownerUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Save to Firestore
    const projectsRef = collection(db, 'projects')
    const docRef = await addDoc(projectsRef, projectData)
    
    const project = {
      id: docRef.id,
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}