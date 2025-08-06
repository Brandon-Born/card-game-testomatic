'use client'

import React, { useState } from 'react'
import { RuleDesigner, GameConfigPanel } from '@/components/designer'
import { CardDesigner } from '@/components/designer/CardDesigner'
import { ZoneDesigner } from '@/components/designer/ZoneDesigner'
import type { ZoneTemplate, GameConfiguration } from '@/types'
import { ProjectManager } from '@/components/designer/ProjectManager'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, User, Play } from 'lucide-react'
import Link from 'next/link'

export default function DesignerPage() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('rules')
  
  // Project state
  const [currentCards, setCurrentCards] = useState<any[]>([])
  const [currentRules, setCurrentRules] = useState<any[]>([])
  const [currentZones, setCurrentZones] = useState<ZoneTemplate[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfiguration>({
    playerCount: { min: 2, max: 2 },
    initialSetup: {
      dealingRules: { enabled: false, handSize: 7 },
    },
  })

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProjectLoad = (project: { cards: any[], rules: any[], zones?: ZoneTemplate[], gameConfig?: GameConfiguration }) => {
    setCurrentCards(project.cards)
    setCurrentRules(project.rules)
    setCurrentZones(project.zones || [])
    setGameConfig(project.gameConfig || { playerCount: { min: 2, max: 2 }, initialSetup: { dealingRules: { enabled: false, handSize: 7 } } })
  }

  const handleNewProject = () => {
    setCurrentCards([])
    setCurrentRules([])
    setCurrentZones([])
    setGameConfig({ playerCount: { min: 2, max: 2 }, initialSetup: { dealingRules: { enabled: false, handSize: 7 } } })
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
                  currentZones={currentZones}
                  gameConfig={gameConfig}
                  onProjectLoad={handleProjectLoad}
                  onNewProject={handleNewProject}
                />
                <Link href="/simulator">
                  <Button variant="default" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Test Game
                  </Button>
                </Link>
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
            <TabsList className="grid w-full grid-cols-4 bg-white border-b">
              <TabsTrigger value="rules">Rules Designer</TabsTrigger>
              <TabsTrigger value="cards">Card Designer</TabsTrigger>
              <TabsTrigger value="zones">Zone Designer</TabsTrigger>
              <TabsTrigger value="config">Game Configuration</TabsTrigger>
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
            
            <TabsContent value="zones" className="h-[calc(100vh-120px)] m-0">
              <ZoneDesigner 
                zones={currentZones}
                onZonesChange={setCurrentZones}
              />
            </TabsContent>

            <TabsContent value="config" className="h-[calc(100vh-120px)] m-0 p-6 bg-gray-100 overflow-y-auto">
              <GameConfigPanel
                gameConfig={gameConfig}
                onConfigChange={setGameConfig}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}