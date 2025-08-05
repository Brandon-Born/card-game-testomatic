'use client'

import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play } from 'lucide-react'

interface ActionNodeData {
  label: string
  actionType: string
  description: string
  parameters: Record<string, any>
}

export function ActionNode({ data, selected }: NodeProps & { data: ActionNodeData }) {
  return (
    <Card className={`min-w-[200px] transition-all ${
      selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 rounded">
            <Play className="w-4 h-4 text-blue-600" />
          </div>
          <Badge variant="outline" className="text-xs">
            Action
          </Badge>
        </div>
        
        <h4 className="font-semibold text-sm mb-1">{data.label}</h4>
        <p className="text-xs text-gray-600 mb-2">{data.description}</p>
        
        <div className="text-xs text-gray-500">
          Action: <code className="bg-gray-100 px-1 rounded">{data.actionType}</code>
        </div>
        
        {Object.keys(data.parameters).length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Params: <code className="bg-gray-100 px-1 rounded">
              {JSON.stringify(data.parameters)}
            </code>
          </div>
        )}
      </CardContent>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </Card>
  )
}