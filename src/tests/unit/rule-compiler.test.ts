import { Node, Edge } from '@xyflow/react'
import { RuleCompiler, useRuleIntegration, VisualRule, CompiledRule } from '@/components/designer/RuleCompiler'
import { createEventListener, createGameEvent } from '@/core/events'
import { renderHook } from '@testing-library/react'

// Mock the core events
jest.mock('@/core/events')
const mockCreateEventListener = createEventListener as jest.MockedFunction<typeof createEventListener>
const mockCreateGameEvent = createGameEvent as jest.MockedFunction<typeof createGameEvent>

// Mock the core actions (they're imported but not used in the current implementation)
jest.mock('@/core/actions')

// Mock data
const mockTriggerNode: Node = {
  id: 'trigger-1',
  type: 'trigger',
  position: { x: 0, y: 0 },
  data: {
    label: 'Card Played',
    eventType: 'CARD_PLAYED',
    description: 'When a card is played',
    priority: 1,
    condition: 'event.payload.cardName === "Lightning Bolt"'
  }
}

const mockActionNode1: Node = {
  id: 'action-1',
  type: 'action',
  position: { x: 200, y: 0 },
  data: {
    label: 'Deal Damage',
    actionType: 'modifyStat',
    description: 'Deal 3 damage',
    parameters: {
      target: '$event.payload.playerId',
      stat: 'life',
      value: '-3'
    }
  }
}

const mockActionNode2: Node = {
  id: 'action-2',
  type: 'action',
  position: { x: 200, y: 100 },
  data: {
    label: 'Draw Card',
    actionType: 'drawCards',
    description: 'Draw a card',
    parameters: {
      playerId: '$game.currentPlayer',
      count: '1'
    }
  }
}

const mockEdge: Edge = {
  id: 'edge-1',
  source: 'trigger-1',
  target: 'action-1'
}

const mockEdge2: Edge = {
  id: 'edge-2',
  source: 'trigger-1',
  target: 'action-2'
}

const mockEvent = {
  id: 'test-event',
  type: 'CARD_PLAYED',
  payload: { cardName: 'Lightning Bolt', playerId: 'player1' },
  timestamp: new Date(),
  triggeredBy: 'system' as const
}

const mockGame = {
  id: { value: 'test-game' },
  currentPlayer: { value: 'player1' },
  phase: 'main',
  turnNumber: 1
} as any

const mockEventListener = {
  id: 'rule-trigger-1',
  eventType: 'CARD_PLAYED',
  callback: jest.fn(),
  condition: jest.fn(),
  priority: 1
}

describe('RuleCompiler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateEventListener.mockReturnValue(mockEventListener)
    mockCreateGameEvent.mockImplementation((data) => ({
      id: 'mock-event',
      ...data,
      timestamp: new Date(),
      triggeredBy: 'system'
    }))
  })

  describe('extractRules', () => {
    it('should extract rules from nodes and edges', () => {
      const nodes = [mockTriggerNode, mockActionNode1, mockActionNode2]
      const edges = [mockEdge, mockEdge2]

      const rules = RuleCompiler.extractRules(nodes, edges)

      expect(rules).toHaveLength(1)
      expect(rules[0]).toEqual({
        id: 'rule-trigger-1',
        name: 'Card Played',
        description: 'Card Played → Deal Damage, Draw Card',
        trigger: mockTriggerNode,
        actions: [mockActionNode1, mockActionNode2],
        isActive: true
      })
    })

    it('should handle triggers with no connected actions', () => {
      const nodes = [mockTriggerNode, mockActionNode1]
      const edges: Edge[] = [] // No connections

      const rules = RuleCompiler.extractRules(nodes, edges)

      expect(rules).toHaveLength(0)
    })

    it('should handle multiple triggers', () => {
      const trigger2: Node = {
        ...mockTriggerNode,
        id: 'trigger-2',
        data: { ...mockTriggerNode.data, label: 'Turn Start', eventType: 'TURN_START' }
      }

      const nodes = [mockTriggerNode, trigger2, mockActionNode1, mockActionNode2]
      const edges = [
        mockEdge, // trigger-1 → action-1
        { id: 'edge-3', source: 'trigger-2', target: 'action-2' } // trigger-2 → action-2
      ]

      const rules = RuleCompiler.extractRules(nodes, edges)

      expect(rules).toHaveLength(2)
      expect(rules[0].trigger.id).toBe('trigger-1')
      expect(rules[1].trigger.id).toBe('trigger-2')
    })

    it('should ignore non-action nodes connected to triggers', () => {
      const nonActionNode: Node = {
        id: 'other-1',
        type: 'other',
        position: { x: 0, y: 0 },
        data: {}
      }

      const nodes = [mockTriggerNode, mockActionNode1, nonActionNode]
      const edges = [
        mockEdge, // trigger-1 → action-1
        { id: 'edge-3', source: 'trigger-1', target: 'other-1' } // trigger-1 → other-1
      ]

      const rules = RuleCompiler.extractRules(nodes, edges)

      expect(rules).toHaveLength(1)
      expect(rules[0].actions).toHaveLength(1)
      expect(rules[0].actions[0].id).toBe('action-1')
    })

    it('should handle empty nodes and edges arrays', () => {
      const rules = RuleCompiler.extractRules([], [])
      expect(rules).toHaveLength(0)
    })
  })

  describe('compileRule', () => {
    it('should compile a visual rule into a CompiledRule', () => {
      const visualRule: VisualRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [mockActionNode1],
        isActive: true
      }

      const compiledRule = RuleCompiler.compileRule(visualRule)

      expect(compiledRule.id).toBe('rule-1')
      expect(compiledRule.originalRule).toBe(visualRule)
      expect(compiledRule.eventListener).toBe(mockEventListener)

      expect(mockCreateEventListener).toHaveBeenCalledWith({
        id: 'rule-1',
        eventType: 'CARD_PLAYED',
        callback: expect.any(Function),
        condition: expect.any(Function),
        priority: 1
      })
    })

    it('should handle triggers without conditions', () => {
      const triggerWithoutCondition: Node = {
        ...mockTriggerNode,
        data: { ...mockTriggerNode.data, condition: undefined }
      }

      const visualRule: VisualRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: triggerWithoutCondition,
        actions: [mockActionNode1],
        isActive: true
      }

      RuleCompiler.compileRule(visualRule)

      expect(mockCreateEventListener).toHaveBeenCalledWith({
        id: 'rule-1',
        eventType: 'CARD_PLAYED',
        callback: expect.any(Function),
        condition: undefined,
        priority: 1
      })
    })

    it('should create condition function from trigger condition string', () => {
      const visualRule: VisualRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [mockActionNode1],
        isActive: true
      }

      RuleCompiler.compileRule(visualRule)

      const conditionFn = mockCreateEventListener.mock.calls[0][0].condition
      expect(typeof conditionFn).toBe('function')
      
      // Test the condition function
      const testEvent = { payload: { cardName: 'Lightning Bolt' } }
      expect(conditionFn?.({ ...testEvent, id: 'test', type: 'TEST_EVENT', timestamp: new Date(), triggeredBy: 'system' })).toBe(true)
      
      const testEvent2 = { payload: { cardName: 'Fireball' } }
      expect(conditionFn?.({ ...testEvent2, id: 'test2', type: 'TEST_EVENT', timestamp: new Date(), triggeredBy: 'system' })).toBe(false)
    })

    it('should use default priority when not specified', () => {
      const triggerWithoutPriority: Node = {
        ...mockTriggerNode,
        data: { ...mockTriggerNode.data, priority: undefined }
      }

      const visualRule: VisualRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: triggerWithoutPriority,
        actions: [mockActionNode1],
        isActive: true
      }

      RuleCompiler.compileRule(visualRule)

      expect(mockCreateEventListener).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 1 })
      )
    })
  })

  describe('callback function (executeAction integration)', () => {
    it('should execute all connected actions', () => {
      const visualRule: VisualRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [mockActionNode1, mockActionNode2],
        isActive: true
      }

      RuleCompiler.compileRule(visualRule)

      const callback = mockCreateEventListener.mock.calls[0][0].callback
      const result = callback(mockEvent, mockGame)

      expect(mockCreateGameEvent).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })

    it('should handle action execution errors gracefully', () => {
      const invalidActionNode: Node = {
        id: 'action-invalid',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Invalid Action',
          actionType: 'unknownAction',
          parameters: {}
        }
      }

      const visualRule: VisualRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [invalidActionNode],
        isActive: true
      }

      RuleCompiler.compileRule(visualRule)

      const callback = mockCreateEventListener.mock.calls[0][0].callback
      const result = callback(mockEvent, mockGame)

      // Should not throw an error, but also won't create any valid events
      expect(result).toHaveLength(0)
    })

    describe('action type handling', () => {
      const testActionType = (actionType: string, expectedEventType: string, parameters: any = {}) => {
        const actionNode: Node = {
          id: 'action-test',
          type: 'action',
          position: { x: 0, y: 0 },
          data: {
            label: 'Test Action',
            actionType,
            parameters
          }
        }

        const visualRule: VisualRule = {
          id: 'rule-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: mockTriggerNode,
          actions: [actionNode],
          isActive: true
        }

        RuleCompiler.compileRule(visualRule)
        const callback = mockCreateEventListener.mock.calls[0][0].callback
        callback(mockEvent, mockGame)

        expect(mockCreateGameEvent).toHaveBeenCalledWith({
          type: expectedEventType,
          payload: expect.any(Object)
        })
      }

      it('should handle drawCards action', () => {
        testActionType('drawCards', 'DRAW_CARDS_REQUESTED', {
          playerId: 'player1',
          count: '2'
        })
      })

      it('should handle playCard action', () => {
        testActionType('playCard', 'PLAY_CARD_REQUESTED', {
          cardId: 'card1',
          playerId: 'player1',
          targets: 'target1,target2'
        })
      })

      it('should handle moveCard action', () => {
        testActionType('moveCard', 'MOVE_CARD_REQUESTED', {
          cardId: 'card1',
          fromZone: 'hand',
          toZone: 'play',
          position: '0'
        })
      })

      it('should handle modifyStat action', () => {
        testActionType('modifyStat', 'MODIFY_STAT_REQUESTED', {
          target: 'player1',
          stat: 'life',
          value: '-3'
        })
      })

      it('should handle tapCard action', () => {
        testActionType('tapCard', 'TAP_CARD_REQUESTED', {
          cardId: 'card1'
        })
      })

      it('should handle untapCard action', () => {
        testActionType('untapCard', 'UNTAP_CARD_REQUESTED', {
          cardId: 'card1'
        })
      })

      it('should handle discardCard action', () => {
        testActionType('discardCard', 'DISCARD_CARD_REQUESTED', {
          cardId: 'card1',
          playerId: 'player1'
        })
      })

      it('should handle shuffleZone action', () => {
        testActionType('shuffleZone', 'SHUFFLE_ZONE_REQUESTED', {
          zoneId: 'deck1'
        })
      })

      it('should handle addCounter action', () => {
        testActionType('addCounter', 'ADD_COUNTER_REQUESTED', {
          target: 'card1',
          counterType: '+1/+1'
        })
      })

      it('should handle removeCounter action', () => {
        testActionType('removeCounter', 'REMOVE_COUNTER_REQUESTED', {
          target: 'card1',
          counterType: '+1/+1'
        })
      })

      it('should handle setTurnPhase action', () => {
        testActionType('setTurnPhase', 'SET_TURN_PHASE_REQUESTED', {
          phaseName: 'combat'
        })
      })

      it('should handle viewZone action', () => {
        testActionType('viewZone', 'VIEW_ZONE_REQUESTED', {
          playerId: 'player1',
          zoneId: 'deck1',
          count: '3'
        })
      })
    })

    describe('parameter resolution', () => {
      it('should resolve event context variables', () => {
        const actionNode: Node = {
          id: 'action-1',
          type: 'action',
          position: { x: 0, y: 0 },
          data: {
            label: 'Dynamic Action',
            actionType: 'modifyStat',
            parameters: {
              target: '$event.payload.playerId',
              stat: 'life',
              value: '-3'
            }
          }
        }

        const visualRule: VisualRule = {
          id: 'rule-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: mockTriggerNode,
          actions: [actionNode],
          isActive: true
        }

        RuleCompiler.compileRule(visualRule)
        const callback = mockCreateEventListener.mock.calls[0][0].callback
        callback(mockEvent, mockGame)

        expect(mockCreateGameEvent).toHaveBeenCalledWith({
          type: 'MODIFY_STAT_REQUESTED',
          payload: {
            target: 'player1', // Resolved from $event.payload.playerId
            stat: 'life',
            value: -3
          }
        })
      })

      it('should resolve game context variables', () => {
        const actionNode: Node = {
          id: 'action-1',
          type: 'action',
          position: { x: 0, y: 0 },
          data: {
            label: 'Dynamic Action',
            actionType: 'drawCards',
            parameters: {
              playerId: '$game.currentPlayer',
              count: '1'
            }
          }
        }

        const visualRule: VisualRule = {
          id: 'rule-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: mockTriggerNode,
          actions: [actionNode],
          isActive: true
        }

        RuleCompiler.compileRule(visualRule)
        const callback = mockCreateEventListener.mock.calls[0][0].callback
        callback(mockEvent, mockGame)

        expect(mockCreateGameEvent).toHaveBeenCalledWith({
          type: 'DRAW_CARDS_REQUESTED',
          payload: {
            playerId: 'player1', // Resolved from $game.currentPlayer
            count: 1
          }
        })
      })

      it('should handle missing context variables gracefully', () => {
        const actionNode: Node = {
          id: 'action-1',
          type: 'action',
          position: { x: 0, y: 0 },
          data: {
            label: 'Dynamic Action',
            actionType: 'modifyStat',
            parameters: {
              target: '$event.payload.missingProperty',
              stat: 'life',
              value: '-3'
            }
          }
        }

        const visualRule: VisualRule = {
          id: 'rule-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: mockTriggerNode,
          actions: [actionNode],
          isActive: true
        }

        RuleCompiler.compileRule(visualRule)
        const callback = mockCreateEventListener.mock.calls[0][0].callback
        callback(mockEvent, mockGame)

        expect(mockCreateGameEvent).toHaveBeenCalledWith({
          type: 'MODIFY_STAT_REQUESTED',
          payload: {
            target: '', // Empty string for missing property
            stat: 'life',
            value: -3
          }
        })
      })

      it('should convert non-string parameters to strings', () => {
        const actionNode: Node = {
          id: 'action-1',
          type: 'action',
          position: { x: 0, y: 0 },
          data: {
            label: 'Number Action',
            actionType: 'modifyStat',
            parameters: {
              target: 'player1',
              stat: 'life',
              value: -5 // Number instead of string
            }
          }
        }

        const visualRule: VisualRule = {
          id: 'rule-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: mockTriggerNode,
          actions: [actionNode],
          isActive: true
        }

        RuleCompiler.compileRule(visualRule)
        const callback = mockCreateEventListener.mock.calls[0][0].callback
        callback(mockEvent, mockGame)

        expect(mockCreateGameEvent).toHaveBeenCalledWith({
          type: 'MODIFY_STAT_REQUESTED',
          payload: {
            target: 'player1',
            stat: 'life',
            value: -5
          }
        })
      })
    })
  })

  describe('compileAllRules', () => {
    it('should compile all rules from nodes and edges', () => {
      const nodes = [mockTriggerNode, mockActionNode1]
      const edges = [mockEdge]

      const compiledRules = RuleCompiler.compileAllRules(nodes, edges)

      expect(compiledRules).toHaveLength(1)
      expect(compiledRules[0].id).toBe('rule-trigger-1')
      expect(compiledRules[0].eventListener).toBe(mockEventListener)
    })

    it('should handle empty inputs', () => {
      const compiledRules = RuleCompiler.compileAllRules([], [])
      expect(compiledRules).toHaveLength(0)
    })
  })

  describe('generateCode', () => {
    it('should generate TypeScript code for compiled rules', () => {
      const compiledRule: CompiledRule = {
        id: 'rule-trigger-1',
        eventListener: mockEventListener,
        originalRule: {
          id: 'rule-trigger-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: mockTriggerNode,
          actions: [mockActionNode1],
          isActive: true
        }
      }

      const code = RuleCompiler.generateCode([compiledRule])

      expect(code).toContain('import { createEventListener, createGameEvent }')
      expect(code).toContain('// Rule: Test Rule')
      expect(code).toContain('// A test rule')
      expect(code).toContain('const rule_trigger_1 = createEventListener')
      expect(code).toContain("eventType: 'CARD_PLAYED'")
      expect(code).toContain('priority: 1')
      expect(code).toContain('condition: (event) => event.payload.cardName === "Lightning Bolt"')
      expect(code).toContain('export const compiledRules')
    })

    it('should handle rules without conditions', () => {
      const triggerWithoutCondition: Node = {
        ...mockTriggerNode,
        data: { ...mockTriggerNode.data, condition: undefined }
      }

      const compiledRule: CompiledRule = {
        id: 'rule-trigger-1',
        eventListener: mockEventListener,
        originalRule: {
          id: 'rule-trigger-1',
          name: 'Test Rule',
          description: 'A test rule',
          trigger: triggerWithoutCondition,
          actions: [mockActionNode1],
          isActive: true
        }
      }

      const code = RuleCompiler.generateCode([compiledRule])

      expect(code).not.toContain('condition:')
    })

    it('should handle empty rules array', () => {
      const code = RuleCompiler.generateCode([])

      expect(code).toContain('import { createEventListener, createGameEvent }')
      expect(code).toContain('export const compiledRules = [')
      expect(code).toContain(']')
    })
  })
})

describe('useRuleIntegration', () => {
  it('should provide all required methods', () => {
    const { result } = renderHook(() => useRuleIntegration())

    expect(typeof result.current.compileRules).toBe('function')
    expect(typeof result.current.generateCode).toBe('function')
    expect(typeof result.current.testRule).toBe('function')
  })

  it('should compile rules correctly', () => {
    const { result } = renderHook(() => useRuleIntegration())
    
    const nodes = [mockTriggerNode, mockActionNode1]
    const edges = [mockEdge]

    const compiledRules = result.current.compileRules(nodes, edges)

    expect(compiledRules).toHaveLength(1)
    expect(compiledRules[0].id).toBe('rule-trigger-1')
  })

  it('should generate code correctly', () => {
    const { result } = renderHook(() => useRuleIntegration())
    
    const compiledRule: CompiledRule = {
      id: 'rule-trigger-1',
      eventListener: mockEventListener,
      originalRule: {
        id: 'rule-trigger-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [mockActionNode1],
        isActive: true
      }
    }

    const code = result.current.generateCode([compiledRule])

    expect(code).toContain('createEventListener')
    expect(code).toContain('Test Rule')
  })

  it('should test rules successfully', () => {
    const { result } = renderHook(() => useRuleIntegration())
    
    const mockCallback = jest.fn().mockReturnValue([{ type: 'TEST_EVENT' }])
    const compiledRule: CompiledRule = {
      id: 'rule-trigger-1',
      eventListener: { ...mockEventListener, callback: mockCallback },
      originalRule: {
        id: 'rule-trigger-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [mockActionNode1],
        isActive: true
      }
    }

    const testResult = result.current.testRule(compiledRule, mockEvent, mockGame)

    expect(testResult.success).toBe(true)
    expect(testResult.events).toEqual([{ type: 'TEST_EVENT' }])
    expect(mockCallback).toHaveBeenCalledWith(mockEvent, mockGame)
  })

  it('should handle test rule errors', () => {
    const { result } = renderHook(() => useRuleIntegration())
    
    const mockCallback = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const compiledRule: CompiledRule = {
      id: 'rule-trigger-1',
      eventListener: { ...mockEventListener, callback: mockCallback },
      originalRule: {
        id: 'rule-trigger-1',
        name: 'Test Rule',
        description: 'A test rule',
        trigger: mockTriggerNode,
        actions: [mockActionNode1],
        isActive: true
      }
    }

    const testResult = result.current.testRule(compiledRule, mockEvent, mockGame)

    expect(testResult.success).toBe(false)
    expect(testResult.error).toBe('Test error')
  })
})