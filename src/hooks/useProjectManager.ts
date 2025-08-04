import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject, 
  ProjectData 
} from '@/lib/api/projects'

export interface ProjectManagerState {
  currentProject: ProjectData | null
  projects: ProjectData[]
  loading: boolean
  saving: boolean
  error: string | null
}

export function useProjectManager() {
  const { user } = useAuth()
  const [state, setState] = useState<ProjectManagerState>({
    currentProject: null,
    projects: [],
    loading: false,
    saving: false,
    error: null,
  })

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setSaving = useCallback((saving: boolean) => {
    setState(prev => ({ ...prev, saving }))
  }, [])

  /**
   * Load all projects for the current user
   */
  const loadProjects = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getProjects(user)
      if (response.error) {
        setError(response.error)
        return
      }

      setState(prev => ({
        ...prev,
        projects: response.data?.projects || [],
        loading: false,
      }))
    } catch (error) {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [user, setError, setLoading])

  /**
   * Load a specific project by ID
   */
  const loadProject = useCallback(async (id: string) => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getProject(id, user)
      if (response.error) {
        setError(response.error)
        return null
      }

      const project = response.data?.project || null
      setState(prev => ({
        ...prev,
        currentProject: project,
        loading: false,
      }))
      
      return project
    } catch (error) {
      setError('Failed to load project')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, setError, setLoading])

  /**
   * Save the current project (create or update)
   */
  const saveProject = useCallback(async (projectData: {
    name: string
    description: string
    cards: any[]
    rules: any[]
  }) => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    setSaving(true)
    setError(null)

    try {
      let response
      
      if (state.currentProject?.id) {
        // Update existing project
        response = await updateProject(state.currentProject.id, projectData, user)
      } else {
        // Create new project
        response = await createProject(projectData, user)
      }

      if (response.error) {
        setError(response.error)
        return null
      }

      const savedProject = response.data?.project
      if (savedProject) {
        setState(prev => ({
          ...prev,
          currentProject: savedProject,
          projects: state.currentProject?.id
            ? prev.projects.map(p => p.id === savedProject.id ? savedProject : p)
            : [...prev.projects, savedProject],
          saving: false,
        }))
      }

      return savedProject
    } catch (error) {
      setError('Failed to save project')
      return null
    } finally {
      setSaving(false)
    }
  }, [user, state.currentProject, setError, setSaving])

  /**
   * Create a new project (clears current project)
   */
  const newProject = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentProject: null,
      error: null,
    }))
  }, [])

  /**
   * Set the current project data (for auto-save scenarios)
   */
  const setCurrentProject = useCallback((project: ProjectData | null) => {
    setState(prev => ({
      ...prev,
      currentProject: project,
    }))
  }, [])

  /**
   * Delete a project
   */
  const removeProject = useCallback(async (id: string) => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await deleteProject(id, user)
      if (response.error) {
        setError(response.error)
        return false
      }

      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        currentProject: prev.currentProject?.id === id ? null : prev.currentProject,
        loading: false,
      }))

      return true
    } catch (error) {
      setError('Failed to delete project')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, setError, setLoading])

  return {
    ...state,
    loadProjects,
    loadProject,
    saveProject,
    newProject,
    setCurrentProject,
    removeProject,
    clearError: () => setError(null),
  }
}