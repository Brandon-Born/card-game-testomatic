'use client'

import React, { useState } from 'react'
import { RuleDesigner } from '@/components/designer'
import { CardDesigner } from '@/components/designer/CardDesigner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Save, FolderOpen } from 'lucide-react'

export default function DesignerPage() {
  const [activeTab, setActiveTab] = useState('rules')
  
  const handleSaveProject = () => {
    // TODO: Implement project saving
    console.log('Saving project...')
  }
  
  const handleLoadProject = () => {
    // TODO: Implement project loading
    console.log('Loading project...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Card Game Designer</h1>
            <p className="text-sm text-gray-600">Visual Rules Engine - Phase 0</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleLoadProject} variant="outline" size="sm">
              <FolderOpen className="w-4 h-4 mr-2" />
              Load Project
            </Button>
            <Button onClick={handleSaveProject} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Project
            </Button>
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
            <RuleDesigner />
          </TabsContent>
          
          <TabsContent value="cards" className="h-[calc(100vh-120px)] m-0">
            <CardDesigner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}