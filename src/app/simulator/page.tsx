'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProjectManager } from '@/hooks/useProjectManager'
import { GameBoard } from '@/components/game'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Play, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function SimulatorPage() {
  const { user } = useAuth()
  const { projects, loadProjects, loadProject } = useProjectManager()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load projects when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user, loadProjects])

  const handleLoadProject = async () => {
    if (!selectedProjectId) return

    setIsLoading(true)
    try {
      const project = await loadProject(selectedProjectId)
      setCurrentProject(project)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSimulator = () => {
    setCurrentProject(null)
    setSelectedProjectId('')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            Please sign in to access the game simulator.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/designer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Designer
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Game Simulator</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Signed in as {user.email}
          </div>
        </div>
      </div>

      {/* Project Selector */}
      {!currentProject && (
        <div className="p-8">
          <Card className="max-w-2xl mx-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Select a Project to Simulate</h2>
            <p className="text-muted-foreground mb-6">
              Choose one of your saved projects to start a local pass-and-play game session.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Projects
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project to simulate" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(project => project.id).map(project => (
                      <SelectItem key={project.id!} value={project.id!}>
                        <div className="flex justify-between items-center w-full">
                          <span>{project.name}</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {project.cards?.length || 0} cards, {project.rules?.length || 0} rules
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {projects.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have any saved projects yet.
                  </p>
                  <Link href="/designer">
                    <Button>
                      Create Your First Project
                    </Button>
                  </Link>
                </div>
              )}

              {projects.length > 0 && (
                <Button 
                  onClick={handleLoadProject}
                  disabled={!selectedProjectId || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Loading...' : 'Start Simulation'}
                </Button>
              )}
            </div>

            {/* Project Preview */}
            {selectedProjectId && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                {(() => {
                  const project = projects.find(p => p.id === selectedProjectId)
                  return project ? (
                    <div>
                      <h3 className="font-medium mb-2">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {project.description || 'No description'}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span>Cards: <strong>{project.cards?.length || 0}</strong></span>
                        <span>Rules: <strong>{project.rules?.length || 0}</strong></span>
                        <span>Updated: <strong>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}</strong></span>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Game Board */}
      {currentProject && (
        <div className="relative">
          {/* Game Controls */}
          <div className="absolute top-4 right-4 z-10">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetSimulator}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Game
            </Button>
          </div>

          {/* Game Board Component */}
          <GameBoard projectData={currentProject} />
        </div>
      )}
    </div>
  )
}