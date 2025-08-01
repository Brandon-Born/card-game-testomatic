'use client'

import React, { useState } from 'react'
import { RuleDesigner } from '@/components/designer'
import { CardDesigner } from '@/components/designer/CardDesigner'
import { ProjectManager } from '@/components/designer/ProjectManager'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export default function DesignerPage() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('rules')
  
  // Project state
  const [currentCards, setCurrentCards] = useState<any[]>([])
  const [currentRules, setCurrentRules] = useState<any[]>([])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProjectLoad = (project: { cards: any[], rules: any[] }) => {
    setCurrentCards(project.cards)
    setCurrentRules(project.rules)
  }

  const handleNewProject = () => {
    setCurrentCards([])
    setCurrentRules([])
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Card Game Designer</h1>
              <p className="text-sm text-gray-600">Visual Rules Engine - Phase 0</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                {user?.email}
              </div>
              
              {/* Project actions */}
              <div className="flex items-center gap-4">
                <ProjectManager
                  currentCards={currentCards}
                  currentRules={currentRules}
                  onProjectLoad={handleProjectLoad}
                  onNewProject={handleNewProject}
                />
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2 bg-white border-b">
              <TabsTrigger value="rules">Rules Designer</TabsTrigger>
              <TabsTrigger value="cards">Card Designer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rules" className="h-[calc(100vh-120px)] m-0">
              <RuleDesigner 
                rules={currentRules}
                onRulesChange={setCurrentRules}
              />
            </TabsContent>
            
            <TabsContent value="cards" className="h-[calc(100vh-120px)] m-0">
              <CardDesigner 
                cards={currentCards}
                onCardsChange={setCurrentCards}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}