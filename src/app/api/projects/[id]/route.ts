import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase-admin/auth'

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
  { params }: { params: { id: string } }
) {
  try {
    const uid = await verifyToken(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get project from Firestore
    const projectRef = doc(db, 'projects', id)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = {
      id: projectSnap.id,
      ...projectSnap.data()
    }

    // Verify ownership
    if (project.ownerUid !== uid) {
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
  { params }: { params: { id: string } }
) {
  try {
    const uid = await verifyToken(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, description, cards, rules } = body

    // Update project in Firestore
    const projectRef = doc(db, 'projects', id)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectSnap.data()
    if (project?.ownerUid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {
      updatedAt: serverTimestamp(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (cards !== undefined) updateData.cards = cards
    if (rules !== undefined) updateData.rules = rules

    await updateDoc(projectRef, updateData)

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
  { params }: { params: { id: string } }
) {
  try {
    const uid = await verifyToken(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Delete project from Firestore
    const projectRef = doc(db, 'projects', id)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectSnap.data()
    if (project?.ownerUid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteDoc(projectRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}