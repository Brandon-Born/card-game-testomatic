'use client'

import React, { useCallback, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TriggerNode } from './nodes/TriggerNode'
import { ActionNode } from './nodes/ActionNode'
import { NodeToolbar } from './NodeToolbar'
import { NodeConfigPanel, TRIGGER_TYPES, ACTION_TYPES } from './NodeConfigPanel'

// Define custom node types
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

// Initial nodes for demonstration
const initialNodes = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Card Played',
      eventType: 'CARD_PLAYED',
      description: 'Triggers when any card is played'
    },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Draw Cards',
      actionType: 'drawCards',
      parameters: { count: 1 },
      description: 'Draw a specified number of cards'
    },
  },
]

const initialEdges: Edge[] = []

export function RuleDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node.id)
  }, [])

  const addTriggerNode = useCallback(() => {
    const firstTriggerType = Object.keys(TRIGGER_TYPES)[0]
    const triggerInfo = TRIGGER_TYPES[firstTriggerType as keyof typeof TRIGGER_TYPES]
    
    const newNode = {
      id: `trigger-${Date.now()}`,
      type: 'trigger',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: triggerInfo.label,
        eventType: firstTriggerType,
        description: triggerInfo.description,
        priority: 1
      },
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const addActionNode = useCallback(() => {
    const firstActionType = Object.keys(ACTION_TYPES)[0]
    const actionInfo = ACTION_TYPES[firstActionType as keyof typeof ACTION_TYPES]
    
    const newNode = {
      id: `action-${Date.now()}`,
      type: 'action',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: actionInfo.label,
        actionType: firstActionType,
        parameters: {},
        description: actionInfo.description
      },
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const updateNodeData = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    )
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  return (
    <div className="w-full h-screen flex">
      {/* Main canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          className="bg-gray-50"
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {/* Floating toolbar */}
        <NodeToolbar 
          onAddTrigger={addTriggerNode}
          onAddAction={addActionNode}
        />
      </div>

      {/* Side panel for node configuration */}
      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <NodeConfigPanel
            nodeId={selectedNode}
            nodeData={nodes.find(n => n.id === selectedNode)?.data || {}}
            onUpdateNode={updateNodeData}
            onDeleteNode={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  )
}