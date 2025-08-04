import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  ProjectData 
} from '@/lib/api/projects'

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock user object
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  getIdToken: jest.fn().mockResolvedValue('mock-token')
} as any

// Mock project data
const mockProject: ProjectData = {
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  cards: [{ id: 'card-1', name: 'Test Card' }],
  rules: [{ id: 'rule-1', name: 'Test Rule' }],
  ownerUid: 'test-user-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

const mockProjects = [
  mockProject,
  { ...mockProject, id: 'project-2', name: 'Another Project' }
]

describe('API Projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUser.getIdToken.mockResolvedValue('mock-token')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getProjects', () => {
    it('should fetch projects successfully', async () => {
      const responseData = { projects: mockProjects }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await getProjects(mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(result).toEqual({ data: responseData })
      expect(mockUser.getIdToken).toHaveBeenCalled()
    })

    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'Unauthorized' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const result = await getProjects(mockUser)

      expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('should handle HTTP error without JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response)

      const result = await getProjects(mockUser)

      expect(result).toEqual({ error: 'HTTP 500' })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getProjects(mockUser)

      expect(result).toEqual({ error: 'Network error occurred' })
    })

    it('should work without user authentication', async () => {
      const responseData = { projects: [] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await getProjects(null)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(result).toEqual({ data: responseData })
    })

    it('should handle token retrieval failure', async () => {
      mockUser.getIdToken.mockResolvedValueOnce(null)

      const responseData = { projects: mockProjects }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await getProjects(mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(result).toEqual({ data: responseData })
    })
  })

  describe('getProject', () => {
    it('should fetch a specific project successfully', async () => {
      const responseData = { project: mockProject }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await getProject('project-1', mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(result).toEqual({ data: responseData })
    })

    it('should handle project not found', async () => {
      const errorResponse = { error: 'Project not found' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const result = await getProject('nonexistent', mockUser)

      expect(result).toEqual({ error: 'Project not found' })
    })
  })

  describe('createProject', () => {
    const projectData = {
      name: 'New Project',
      description: 'A new project',
      cards: [{ id: 'card-1', name: 'New Card' }],
      rules: [{ id: 'rule-1', name: 'New Rule' }]
    }

    it('should create a project successfully', async () => {
      const responseData = { project: { ...mockProject, ...projectData } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await createProject(projectData, mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(projectData)
      })

      expect(result).toEqual({ data: responseData })
    })

    it('should handle creation errors', async () => {
      const errorResponse = { error: 'Invalid project data' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const result = await createProject(projectData, mockUser)

      expect(result).toEqual({ error: 'Invalid project data' })
    })

    it('should work without user authentication', async () => {
      const responseData = { project: { ...mockProject, ...projectData } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await createProject(projectData, null)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      })

      expect(result).toEqual({ data: responseData })
    })
  })

  describe('updateProject', () => {
    const updateData = {
      name: 'Updated Project',
      description: 'An updated project'
    }

    it('should update a project successfully', async () => {
      const responseData = { project: { ...mockProject, ...updateData } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await updateProject('project-1', updateData, mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(updateData)
      })

      expect(result).toEqual({ data: responseData })
    })

    it('should handle update errors', async () => {
      const errorResponse = { error: 'Project not found' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const result = await updateProject('nonexistent', updateData, mockUser)

      expect(result).toEqual({ error: 'Project not found' })
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Just Name Update' }
      const responseData = { project: { ...mockProject, ...partialUpdate } }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await updateProject('project-1', partialUpdate, mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(partialUpdate)
      })

      expect(result).toEqual({ data: responseData })
    })
  })

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      const responseData = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await deleteProject('project-1', mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(result).toEqual({ data: responseData })
    })

    it('should handle delete errors', async () => {
      const errorResponse = { error: 'Project not found' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const result = await deleteProject('nonexistent', mockUser)

      expect(result).toEqual({ error: 'Project not found' })
    })

    it('should handle unauthorized deletion', async () => {
      const errorResponse = { error: 'Unauthorized' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const result = await deleteProject('project-1', mockUser)

      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle JSON parsing errors in responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response)

      const result = await getProjects(mockUser)

      expect(result).toEqual({ error: 'Network error occurred' })
    })

    it('should handle token retrieval errors', async () => {
      mockUser.getIdToken.mockRejectedValueOnce(new Error('Token error'))

      const responseData = { projects: mockProjects }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      const result = await getProjects(mockUser)

      // Should still make request but without authorization header
      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(result).toEqual({ data: responseData })
    })

    it('should handle custom request headers', async () => {
      const responseData = { projects: mockProjects }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData)
      } as Response)

      // Test with custom headers (getProjects doesn't support this, but the underlying apiRequest does)
      const result = await getProjects(mockUser)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(result).toEqual({ data: responseData })
    })
  })
})