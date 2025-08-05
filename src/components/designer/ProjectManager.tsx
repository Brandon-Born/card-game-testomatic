'use client'

import React, { useState, useEffect } from 'react'
import { useProjectManager } from '@/hooks/useProjectManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  FolderOpen, 
  Plus, 
  Trash2, 
  FileText, 
  Calendar,
  Loader2,
  AlertCircle,
  X 
} from 'lucide-react'
import type { ZoneTemplate } from '@/types'

interface ProjectManagerProps {
  currentCards: any[]
  currentRules: any[]
  currentZones: ZoneTemplate[]
  currentGameConfig?: any
  onProjectLoad: (project: { cards: any[], rules: any[], zones?: ZoneTemplate[], gameConfig?: any }) => void
  onNewProject: () => void
}

export function ProjectManager({ 
  currentCards, 
  currentRules, 
  currentZones,
  currentGameConfig,
  onProjectLoad, 
  onNewProject 
}: ProjectManagerProps) {
  const {
    currentProject,
    projects,
    loading,
    saving,
    error,
    loadProjects,
    loadProject,
    saveProject,
    newProject,
    removeProject,
    clearError,
  } = useProjectManager()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  // Load projects when component mounts
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Update form fields when current project changes
  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name)
      setProjectDescription(currentProject.description)
    } else {
      setProjectName('')
      setProjectDescription('')
    }
  }, [currentProject])

  const handleSave = async () => {
    if (!projectName.trim()) {
      return
    }

    const saved = await saveProject({
      name: projectName.trim(),
      description: projectDescription.trim(),
      cards: currentCards,
      rules: currentRules,
      zones: currentZones,
      gameConfig: currentGameConfig,
    })

    if (saved) {
      setShowSaveDialog(false)
    }
  }

  const handleLoad = async (projectId: string) => {
    const project = await loadProject(projectId)
    if (project) {
      onProjectLoad({
        cards: project.cards || [],
        rules: project.rules || [],
        zones: project.zones || [],
        gameConfig: project.gameConfig || null,
      })
      setShowLoadDialog(false)
    }
  }

  const handleNew = () => {
    newProject()
    onNewProject()
    setProjectName('')
    setProjectDescription('')
  }

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await removeProject(projectId)
    }
  }

  return (
    <>
      {/* Save/Load/New Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => setShowLoadDialog(true)} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          {loading ? 'Loading...' : 'Load Project'}
        </Button>
        
        <Button 
          onClick={() => setShowSaveDialog(true)} 
          size="sm"
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Project'}
        </Button>

        <Button 
          onClick={handleNew} 
          variant="outline" 
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Current Project Info */}
      {currentProject && (
        <div className="text-sm text-gray-600 ml-4">
          <span className="font-medium">{currentProject.name}</span>
          {currentProject.description && (
            <span className="ml-2 text-gray-500">• {currentProject.description}</span>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {currentProject ? 'Update Project' : 'Save New Project'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>
              
              <div>
                <Label htmlFor="projectDescription">Description (optional)</Label>
                <Input
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                />
              </div>

              <div className="text-sm text-gray-600">
                <p>• Cards: {currentCards.length}</p>
                <p>• Rules: {currentRules.length}</p>
                <p>• Zones: {currentZones.length}</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSaveDialog(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!projectName.trim() || saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Load Project</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects found</p>
                  <p className="text-sm">Create your first project by saving your current work</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.updatedAt || project.createdAt || '').toLocaleDateString()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {(project.cards?.length || 0)} cards
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {(project.rules?.length || 0)} rules
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleLoad(project.id!)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(project.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 justify-end mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLoadDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}