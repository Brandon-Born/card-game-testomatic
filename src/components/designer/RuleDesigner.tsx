'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
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
import { RuleCompiler, useRuleIntegration, type CompiledRule } from './RuleCompiler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Code, Play } from 'lucide-react'

// Define custom node types
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

// Start with an empty canvas
const initialNodes: any[] = []

const initialEdges: Edge[] = []

interface RuleDesignerProps {
  rules?: any[]
  onRulesChange?: (rules: any[]) => void
}

export function RuleDesigner({ rules, onRulesChange }: RuleDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [compiledRules, setCompiledRules] = useState<CompiledRule[]>([])
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [showRulePanel, setShowRulePanel] = useState(false)
  
  // Track if we're in the initial load phase to prevent save loop
  const isInitialLoadRef = useRef(true)
  const hasLoadedRef = useRef(false)
  
  const { compileRules, generateCode, testRule } = useRuleIntegration()

  // Initialize the component - set initial load flag to false after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Load rules when the prop changes
  useEffect(() => {
    if (rules && Array.isArray(rules) && rules.length > 0) {
      // Assume rules are stored as { nodes, edges }
      const ruleData = rules[0] // For now, assume single rule set
      if (ruleData && ruleData.nodes && ruleData.edges) {
        isInitialLoadRef.current = true // Set flag to prevent save
        setNodes(ruleData.nodes)
        setEdges(ruleData.edges)
        hasLoadedRef.current = true
        // Reset flag after state updates complete
        setTimeout(() => {
          isInitialLoadRef.current = false
        }, 150)
      }
    }
  }, [rules, setNodes, setEdges])

  // Save rules when nodes or edges change (but not during initial load)
  useEffect(() => {
    // Only save if:
    // 1. We're not in initial load
    // 2. onRulesChange callback is provided
    // 3. We have either nodes or edges
    // 4. We've actually loaded data before (to prevent empty saves)
    if (!isInitialLoadRef.current && onRulesChange && hasLoadedRef.current) {
      const ruleData = { nodes, edges }
      onRulesChange([ruleData])
    }
  }, [nodes, edges, onRulesChange])

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

  const handleCompileRules = useCallback(() => {
    const compiled = compileRules(nodes, edges)
    setCompiledRules(compiled)
    setGeneratedCode(generateCode(compiled))
    setShowRulePanel(true)
  }, [nodes, edges, compileRules, generateCode])

  const handleTestRule = useCallback((rule: CompiledRule) => {
    // Create a test event and game state for demonstration
    const testEvent = {
      id: 'test-event',
      type: (rule.originalRule.trigger.data as any).eventType,
      payload: { cardName: 'Test Card', playerId: 'player1' },
      timestamp: new Date(),
      triggeredBy: 'system' as const
    }
    
    const mockGame = {
      id: { value: 'test-game' },
      currentPlayer: { value: 'player1' },
      phase: 'main',
      turnNumber: 1
    } as any
    
    const result = testRule(rule, testEvent, mockGame)
    console.log('Rule test result:', result)
    return result
  }, [testRule])

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

        {/* Rule compilation toolbar */}
        <Card className="absolute top-4 right-4 p-3 bg-white/95 backdrop-blur-sm shadow-lg z-10">
          <div className="flex gap-2">
            <Button 
              onClick={handleCompileRules} 
              size="sm" 
              variant="outline"
              className="gap-2"
            >
              <Code className="w-4 h-4" />
              Compile Rules ({RuleCompiler.extractRules(nodes, edges).length})
            </Button>
            <Button 
              onClick={() => setShowRulePanel(!showRulePanel)} 
              size="sm" 
              variant={showRulePanel ? "default" : "outline"}
            >
              View Rules
            </Button>
          </div>
        </Card>
      </div>

      {/* Side panel - Node configuration or compiled rules */}
      {(selectedNode || showRulePanel) && (
        <div className="w-96 bg-white border-l border-gray-200">
          {selectedNode && !showRulePanel ? (
            <div className="p-4">
              <NodeConfigPanel
                nodeId={selectedNode}
                nodeData={nodes.find(n => n.id === selectedNode)?.data || {}}
                onUpdateNode={updateNodeData}
                onDeleteNode={deleteNode}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          ) : showRulePanel && (
            <div className="h-full overflow-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Compiled Rules</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowRulePanel(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="rules" className="h-full">
                <TabsList className="grid w-full grid-cols-2 m-4 mb-2">
                  <TabsTrigger value="rules">Rules ({compiledRules.length})</TabsTrigger>
                  <TabsTrigger value="code">Generated Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="rules" className="px-4 space-y-3">
                  {compiledRules.length === 0 ? (
                    <Card>
                      <CardContent className="p-4 text-center text-gray-500">
                        <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No rules compiled yet. Connect trigger and action nodes, then click &quot;Compile Rules&quot;.
                      </CardContent>
                    </Card>
                  ) : (
                    compiledRules.map((rule) => (
                      <Card key={rule.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{rule.originalRule.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              Priority: {(rule.originalRule.trigger.data as any).priority || 1}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-gray-600 mb-3">{rule.originalRule.description}</p>
                          
                          <div className="space-y-2">
                            <div className="text-xs">
                              <strong>Trigger:</strong> {(rule.originalRule.trigger.data as any).eventType}
                              {(rule.originalRule.trigger.data as any).condition && (
                                <div className="mt-1 font-mono text-xs bg-gray-100 p-1 rounded">
                                  {(rule.originalRule.trigger.data as any).condition}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs">
                              <strong>Actions:</strong>
                              <ul className="mt-1 space-y-1">
                                {rule.originalRule.actions.map((action, idx) => (
                                  <li key={idx} className="flex items-center gap-1">
                                    <Play className="w-3 h-3" />
                                    {(action.data as any).label} ({(action.data as any).actionType})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full gap-2"
                              onClick={() => handleTestRule(rule)}
                            >
                              <Play className="w-3 h-3" />
                              Test Rule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="code" className="px-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Generated TypeScript</h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(generatedCode)}
                      >
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      value={generatedCode}
                      readOnly
                      rows={20}
                      className="font-mono text-xs"
                      placeholder="Compile rules to see generated code..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  )
}