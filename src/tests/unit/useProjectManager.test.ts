import { renderHook, act } from '@testing-library/react'
import { useProjectManager } from '@/hooks/useProjectManager'
import { useAuth } from '@/contexts/AuthContext'
import * as projectsApi from '@/lib/api/projects'

// Mock Firebase completely before any imports
jest.mock('firebase/auth', () => ({
  sendSignInLinkToEmail: jest.fn(),
  isSignInWithEmailLink: jest.fn(),
  signInWithEmailLink: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))

jest.mock('@/lib/firebase/auth', () => ({
  onAuthStateChange: jest.fn(),
  sendMagicLink: jest.fn(),
  completeMagicLinkSignIn: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  isSignInLink: jest.fn(),
}))

jest.mock('@/lib/firebase/config', () => ({
  auth: {},
  isFirebaseConfigured: jest.fn(() => true)
}))

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock the API functions
jest.mock('@/lib/api/projects')
const mockGetProjects = projectsApi.getProjects as jest.MockedFunction<typeof projectsApi.getProjects>
const mockGetProject = projectsApi.getProject as jest.MockedFunction<typeof projectsApi.getProject>
const mockCreateProject = projectsApi.createProject as jest.MockedFunction<typeof projectsApi.createProject>
const mockUpdateProject = projectsApi.updateProject as jest.MockedFunction<typeof projectsApi.updateProject>
const mockDeleteProject = projectsApi.deleteProject as jest.MockedFunction<typeof projectsApi.deleteProject>

// Mock user object
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  getIdToken: jest.fn().mockResolvedValue('mock-token')
} as any

// Mock project data
const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  cards: [{ id: 'card-1', name: 'Test Card' }],
  rules: [{ id: 'rule-1', name: 'Test Rule' }],
  ownerUid: 'test-user-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

const mockProjects = [mockProject, { ...mockProject, id: 'project-2', name: 'Another Project' }]

describe('useProjectManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn()
    })
  })

  describe('Initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useProjectManager())

      expect(result.current.currentProject).toBeNull()
      expect(result.current.projects).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useProjectManager())

      expect(typeof result.current.loadProjects).toBe('function')
      expect(typeof result.current.loadProject).toBe('function')
      expect(typeof result.current.saveProject).toBe('function')
      expect(typeof result.current.newProject).toBe('function')
      expect(typeof result.current.removeProject).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('loadProjects', () => {
    it('should load projects successfully', async () => {
      mockGetProjects.mockResolvedValueOnce({
        data: { projects: mockProjects }
      })

      const { result } = renderHook(() => useProjectManager())

      await act(async () => {
        await result.current.loadProjects()
      })

      expect(mockGetProjects).toHaveBeenCalledWith(mockUser)
      expect(result.current.projects).toEqual(mockProjects)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle API error responses', async () => {
      mockGetProjects.mockResolvedValueOnce({
        error: 'Failed to fetch projects'
      })

      const { result } = renderHook(() => useProjectManager())

      await act(async () => {
        await result.current.loadProjects()
      })

      expect(result.current.projects).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to fetch projects')
    })

    it('should handle network errors', async () => {
      mockGetProjects.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useProjectManager())

      await act(async () => {
        await result.current.loadProjects()
      })

      expect(result.current.projects).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to load projects')
    })

    it('should set error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn()
      })

      const { result } = renderHook(() => useProjectManager())

      await act(async () => {
        await result.current.loadProjects()
      })

      expect(mockGetProjects).not.toHaveBeenCalled()
      expect(result.current.error).toBe('User not authenticated')
    })

    it('should set loading state during operation', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockGetProjects.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useProjectManager())

      act(() => {
        result.current.loadProjects()
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolvePromise!({ data: { projects: mockProjects } })
        await pendingPromise
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('loadProject', () => {
    it('should load a specific project successfully', async () => {
      mockGetProject.mockResolvedValueOnce({
        data: { project: mockProject }
      })

      const { result } = renderHook(() => useProjectManager())

      let loadedProject: any
      await act(async () => {
        loadedProject = await result.current.loadProject('project-1')
      })

      expect(mockGetProject).toHaveBeenCalledWith('project-1', mockUser)
      expect(result.current.currentProject).toEqual(mockProject)
      expect(loadedProject).toEqual(mockProject)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle project not found', async () => {
      mockGetProject.mockResolvedValueOnce({
        error: 'Project not found'
      })

      const { result } = renderHook(() => useProjectManager())

      let loadedProject: any
      await act(async () => {
        loadedProject = await result.current.loadProject('nonexistent')
      })

      expect(result.current.currentProject).toBeNull()
      expect(loadedProject).toBeNull()
      expect(result.current.error).toBe('Project not found')
    })

    it('should return null when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn()
      })

      const { result } = renderHook(() => useProjectManager())

      let loadedProject: any
      await act(async () => {
        loadedProject = await result.current.loadProject('project-1')
      })

      expect(mockGetProject).not.toHaveBeenCalled()
      expect(loadedProject).toBeNull()
      expect(result.current.error).toBe('User not authenticated')
    })
  })

  describe('saveProject', () => {
    const projectData = {
      name: 'New Project',
      description: 'A new project',
      cards: [{ id: 'card-1', name: 'New Card' }],
      rules: [{ id: 'rule-1', name: 'New Rule' }]
    }

    it('should create a new project when no current project', async () => {
      const newProject = { ...mockProject, ...projectData }
      mockCreateProject.mockResolvedValueOnce({
        data: { project: newProject }
      })

      const { result } = renderHook(() => useProjectManager())

      let savedProject: any
      await act(async () => {
        savedProject = await result.current.saveProject(projectData)
      })

      expect(mockCreateProject).toHaveBeenCalledWith(projectData, mockUser)
      expect(result.current.currentProject).toEqual(newProject)
      expect(result.current.projects).toContain(newProject)
      expect(savedProject).toEqual(newProject)
    })

    it('should update existing project when current project exists', async () => {
      const updatedProject = { ...mockProject, ...projectData }
      mockUpdateProject.mockResolvedValueOnce({
        data: { project: updatedProject }
      })

      const { result } = renderHook(() => useProjectManager())

      // Set current project first
      act(() => {
        result.current.setCurrentProject(mockProject)
      })

      let savedProject: any
      await act(async () => {
        savedProject = await result.current.saveProject(projectData)
      })

      expect(mockUpdateProject).toHaveBeenCalledWith(mockProject.id, projectData, mockUser)
      expect(result.current.currentProject).toEqual(updatedProject)
      expect(savedProject).toEqual(updatedProject)
    })

    it('should handle save errors', async () => {
      mockCreateProject.mockResolvedValueOnce({
        error: 'Failed to save project'
      })

      const { result } = renderHook(() => useProjectManager())

      let savedProject: any
      await act(async () => {
        savedProject = await result.current.saveProject(projectData)
      })

      expect(savedProject).toBeNull()
      expect(result.current.error).toBe('Failed to save project')
    })

    it('should return null when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn()
      })

      const { result } = renderHook(() => useProjectManager())

      let savedProject: any
      await act(async () => {
        savedProject = await result.current.saveProject(projectData)
      })

      expect(mockCreateProject).not.toHaveBeenCalled()
      expect(savedProject).toBeNull()
      expect(result.current.error).toBe('User not authenticated')
    })
  })

  describe('removeProject', () => {
    it('should delete project successfully', async () => {
      mockDeleteProject.mockResolvedValueOnce({
        data: { success: true }
      })

      // First load projects to populate the list
      mockGetProjects.mockResolvedValueOnce({
        data: { projects: mockProjects }
      })

      const { result } = renderHook(() => useProjectManager())

      // Load projects first
      await act(async () => {
        await result.current.loadProjects()
      })

      let success: boolean
      await act(async () => {
        success = await result.current.removeProject('project-1')
      })

      expect(mockDeleteProject).toHaveBeenCalledWith('project-1', mockUser)
      expect(success).toBe(true)
      expect(result.current.projects).not.toContain(
        expect.objectContaining({ id: 'project-1' })
      )
    })

    it('should clear current project if it matches deleted project', async () => {
      mockDeleteProject.mockResolvedValueOnce({
        data: { success: true }
      })

      const { result } = renderHook(() => useProjectManager())

      // Set current project
      act(() => {
        result.current.setCurrentProject(mockProject)
      })

      await act(async () => {
        await result.current.removeProject(mockProject.id!)
      })

      expect(result.current.currentProject).toBeNull()
    })

    it('should handle delete errors', async () => {
      mockDeleteProject.mockResolvedValueOnce({
        error: 'Failed to delete project'
      })

      const { result } = renderHook(() => useProjectManager())

      let success: boolean
      await act(async () => {
        success = await result.current.removeProject('project-1')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Failed to delete project')
    })
  })

  describe('newProject', () => {
    it('should clear current project and error state', async () => {
      const { result } = renderHook(() => useProjectManager())

      // Set initial state
      act(() => {
        result.current.setCurrentProject(mockProject)
      })

      // Trigger an error state first
      mockGetProjects.mockResolvedValueOnce({
        error: 'Test error'
      })

      await act(async () => {
        await result.current.loadProjects()
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.newProject()
      })

      expect(result.current.currentProject).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useProjectManager())

      // Trigger an error first
      mockGetProjects.mockResolvedValueOnce({
        error: 'Test error'
      })

      await act(async () => {
        await result.current.loadProjects()
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('setCurrentProject', () => {
    it('should set current project', () => {
      const { result } = renderHook(() => useProjectManager())

      act(() => {
        result.current.setCurrentProject(mockProject)
      })

      expect(result.current.currentProject).toEqual(mockProject)
    })

    it('should set current project to null', () => {
      const { result } = renderHook(() => useProjectManager())

      // Set project first
      act(() => {
        result.current.setCurrentProject(mockProject)
      })

      // Then clear it
      act(() => {
        result.current.setCurrentProject(null)
      })

      expect(result.current.currentProject).toBeNull()
    })
  })
})