import { User } from 'firebase/auth'

export interface ProjectData {
  id?: string
  name: string
  description: string
  cards: any[]
  rules: any[]
  ownerUid?: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

/**
 * Get the current user's ID token for API authentication
 */
async function getIdToken(user: User | null): Promise<string | null> {
  if (!user) return null
  
  try {
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  user: User | null = null
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authentication header if user is provided
    if (user) {
      const token = await getIdToken(user)
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('API request error:', error)
    return { error: 'Network error occurred' }
  }
}

/**
 * Fetch all projects for the current user
 */
export async function getProjects(user: User | null): Promise<ApiResponse<{ projects: ProjectData[] }>> {
  return apiRequest<{ projects: ProjectData[] }>('/api/projects', { method: 'GET' }, user)
}

/**
 * Fetch a specific project by ID
 */
export async function getProject(id: string, user: User | null): Promise<ApiResponse<{ project: ProjectData }>> {
  return apiRequest<{ project: ProjectData }>(`/api/projects/${id}`, { method: 'GET' }, user)
}

/**
 * Create a new project
 */
export async function createProject(
  projectData: Omit<ProjectData, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>,
  user: User | null
): Promise<ApiResponse<{ project: ProjectData }>> {
  return apiRequest<{ project: ProjectData }>(
    '/api/projects',
    {
      method: 'POST',
      body: JSON.stringify(projectData),
    },
    user
  )
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  projectData: Partial<Omit<ProjectData, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>>,
  user: User | null
): Promise<ApiResponse<{ project: ProjectData }>> {
  return apiRequest<{ project: ProjectData }>(
    `/api/projects/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(projectData),
    },
    user
  )
}

/**
 * Delete a project
 */
export async function deleteProject(id: string, user: User | null): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }, user)
}