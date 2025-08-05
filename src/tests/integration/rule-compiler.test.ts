import { RuleCompiler } from '@/components/designer/RuleCompiler'
import { createGameEvent } from '@/core/events'
import { GameEvent } from '@/types'
import type { Node, Edge } from '@xyflow/react'

describe('Rule Compiler Integration', () => {
  // Mock React Flow nodes
  const mockTriggerNode: Node = {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 0, y: 0 },
    data: {
      label: 'Card Played',
      eventType: 'CARD_PLAYED',
      condition: "event.payload.cardName === 'Lightning Bolt'",
      priority: 1,
      description: 'Triggers when Lightning Bolt is played'
    }
  }

  const mockActionNode: Node = {
    id: 'action-1',
    type: 'action',
    position: { x: 200, y: 0 },
    data: {
      label: 'Deal Damage',
      actionType: 'modifyStat',
      parameters: {
        target: 'opponent',
        stat: 'life',
        value: '-3'
      },
      description: 'Deal 3 damage to opponent'
    }
  }

  const mockEdge: Edge = {
    id: 'edge-1',
    source: 'trigger-1',
    target: 'action-1'
  }

  it('should extract visual rules from nodes and edges', () => {
    const nodes = [mockTriggerNode, mockActionNode]
    const edges = [mockEdge]

    const visualRules = RuleCompiler.extractRules(nodes, edges)

    expect(visualRules).toHaveLength(1)
    expect(visualRules[0].id).toBe('rule-trigger-1')
    expect(visualRules[0].name).toBe('Card Played')
    expect(visualRules[0].trigger.id).toBe('trigger-1')
    expect(visualRules[0].actions).toHaveLength(1)
    expect(visualRules[0].actions[0].id).toBe('action-1')
  })

  it('should compile visual rules into executable EventListeners', () => {
    const nodes = [mockTriggerNode, mockActionNode]
    const edges = [mockEdge]

    const compiledRules = RuleCompiler.compileAllRules(nodes, edges)

    expect(compiledRules).toHaveLength(1)
    
    const rule = compiledRules[0]
    expect(rule.id).toBe('rule-trigger-1')
    expect(rule.eventListener.id).toBe('rule-trigger-1')
    expect(rule.eventListener.eventType).toBe('CARD_PLAYED')
    expect(rule.eventListener.priority).toBe(1)
    expect(typeof rule.eventListener.callback).toBe('function')
    expect(typeof rule.eventListener.condition).toBe('function')
  })

  it('should execute compiled rules correctly', () => {
    const nodes = [mockTriggerNode, mockActionNode]
    const edges = [mockEdge]

    const compiledRules = RuleCompiler.compileAllRules(nodes, edges)
    const rule = compiledRules[0]

    // Test event that should trigger the rule
    const triggerEvent = createGameEvent({
      type: 'CARD_PLAYED',
      payload: { cardName: 'Lightning Bolt', playerId: 'player1' }
    })

    // Mock game state
    const mockGame = {
      id: { value: 'test-game' },
      currentPlayer: { value: 'player1' },
      phase: 'main',
      turnNumber: 1
    } as any

    // Execute the rule
    const resultEvents = rule.eventListener.callback(triggerEvent, mockGame)

    expect(resultEvents).toHaveLength(1)
    expect((resultEvents as GameEvent[])[0].type).toBe('MODIFY_STAT_REQUESTED')
    expect((resultEvents as GameEvent[])[0].payload).toEqual({
      target: 'opponent',
      stat: 'life',
      value: -3
    })
  })

  it('should not trigger rules when condition is not met', () => {
    const nodes = [mockTriggerNode, mockActionNode]
    const edges = [mockEdge]

    const compiledRules = RuleCompiler.compileAllRules(nodes, edges)
    const rule = compiledRules[0]

    // Test event that should NOT trigger the rule
    const triggerEvent = createGameEvent({
      type: 'CARD_PLAYED',
      payload: { cardName: 'Forest', playerId: 'player1' }
    })

    // Check if condition evaluates to false
    const shouldTrigger = rule.eventListener.condition?.(triggerEvent)
    expect(shouldTrigger).toBe(false)
  })

  it('should generate TypeScript code from compiled rules', () => {
    const nodes = [mockTriggerNode, mockActionNode]
    const edges = [mockEdge]

    const compiledRules = RuleCompiler.compileAllRules(nodes, edges)
    const generatedCode = RuleCompiler.generateCode(compiledRules)

    expect(generatedCode).toContain('import { createEventListener, createGameEvent }')
    expect(generatedCode).toContain('rule_trigger_1')
    expect(generatedCode).toContain('CARD_PLAYED')
    expect(generatedCode).toContain('Lightning Bolt')
    expect(generatedCode).toContain('MODIFY_STAT_REQUESTED')
  })

  it('should support event context variables in parameters', () => {
    const actionWithVariables: Node = {
      ...mockActionNode,
      data: {
        ...mockActionNode.data,
        parameters: {
          target: '$event.triggeredBy',
          stat: 'life',
          value: '-1'
        }
      }
    }

    const nodes = [mockTriggerNode, actionWithVariables]
    const edges = [mockEdge]

    const compiledRules = RuleCompiler.compileAllRules(nodes, edges)
    const rule = compiledRules[0]

    const triggerEvent = createGameEvent({
      type: 'CARD_PLAYED',
      payload: { cardName: 'Lightning Bolt', playerId: 'player1' },
      triggeredBy: 'player2'
    })

    const mockGame = {
      id: { value: 'test-game' },
      currentPlayer: { value: 'player1' }
    } as any

    const resultEvents = rule.eventListener.callback(triggerEvent, mockGame)

    expect((resultEvents as GameEvent[])[0].payload.target).toBe('player2')
  })
})