'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Zap, Play } from 'lucide-react'

interface NodeToolbarProps {
  onAddTrigger: () => void
  onAddAction: () => void
}

export function NodeToolbar({ onAddTrigger, onAddAction }: NodeToolbarProps) {
  return (
    <Card className="absolute top-4 left-4 p-4 bg-white/95 backdrop-blur-sm shadow-lg z-10">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Nodes</h4>
        
        <Button
          onClick={onAddTrigger}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Zap className="w-4 h-4" />
          Add Trigger
        </Button>
        
        <Button
          onClick={onAddAction}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Play className="w-4 h-4" />
          Add Action
        </Button>
      </div>
    </Card>
  )
}