'use client'

import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

interface TriggerNodeData {
  label: string
  eventType: string
  description: string
  condition?: string
}

export function TriggerNode({ data, selected }: NodeProps & { data: TriggerNodeData }) {
  return (
    <Card className={`min-w-[200px] transition-all ${
      selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-yellow-100 rounded">
            <Zap className="w-4 h-4 text-yellow-600" />
          </div>
          <Badge variant="secondary" className="text-xs">
            Trigger
          </Badge>
        </div>
        
        <h4 className="font-semibold text-sm mb-1">{data.label}</h4>
        <p className="text-xs text-gray-600 mb-2">{data.description}</p>
        
        <div className="text-xs text-gray-500">
          Event: <code className="bg-gray-100 px-1 rounded">{data.eventType}</code>
        </div>
        
        {data.condition && (
          <div className="text-xs text-gray-500 mt-1">
            Condition: <code className="bg-gray-100 px-1 rounded">{data.condition}</code>
          </div>
        )}
      </CardContent>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
    </Card>
  )
}