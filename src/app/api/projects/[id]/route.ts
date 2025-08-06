import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK (if not already initialized)
if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Production: use service account
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      
      // Fix newlines in private_key if they're escaped
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
      }
      
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

// Get Firestore instance from Admin SDK
const adminDb = getFirestore()

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
      // If admin verification fails in development, fall back to development mode
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
 * GET /api/projects/[id] - Get a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await verifyToken(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get project from Firestore using Admin SDK
    const projectRef = adminDb.collection('projects').doc(id)
    const projectSnap = await projectRef.get()

    if (!projectSnap.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const projectData = projectSnap.data()
    const project = {
      id: projectSnap.id,
      ...projectData
    }

    // Verify ownership
    if ((project as any).ownerUid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/projects/[id] - Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await verifyToken(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, cards, rules, zones, gameConfig } = body

    // Update project in Firestore using Admin SDK
    const projectRef = adminDb.collection('projects').doc(id)
    const projectSnap = await projectRef.get()

    if (!projectSnap.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectSnap.data()
    if (project?.ownerUid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (cards !== undefined) updateData.cards = cards
    if (rules !== undefined) updateData.rules = rules
    if (zones !== undefined) updateData.zones = zones
    if (gameConfig !== undefined) updateData.gameConfig = gameConfig

    await projectRef.update(updateData)

    const updatedProject = {
      id,
      ...project,
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/projects/[id] - Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await verifyToken(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete project from Firestore using Admin SDK
    const projectRef = adminDb.collection('projects').doc(id)
    const projectSnap = await projectRef.get()

    if (!projectSnap.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectSnap.data()
    if (project?.ownerUid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await projectRef.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}