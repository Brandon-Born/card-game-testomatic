'use client'

import { Node, Edge } from '@xyflow/react'
import { createEventListener, createGameEvent } from '@/core/events'
import { 
  drawCards, playCard, moveCard, modifyStat, tapCard, untapCard,
  discardCard, shuffleZone, addCounter, removeCounter, setTurnPhase, viewZone
} from '@/core/actions'
import type { GameEvent, EventListener, Game } from '@/types'

export interface VisualRule {
  id: string
  name: string
  description: string
  trigger: Node
  actions: Node[]
  isActive: boolean
}

export interface CompiledRule {
  id: string
  eventListener: EventListener
  originalRule: VisualRule
}

/**
 * Compiles visual rules from React Flow into executable EventListeners
 */
export class RuleCompiler {
  /**
   * Extract visual rules from React Flow nodes and edges
   */
  static extractRules(nodes: Node[], edges: Edge[]): VisualRule[] {
    const rules: VisualRule[] = []
    
    // Find all trigger nodes
    const triggerNodes = nodes.filter(node => node.type === 'trigger')
    
    triggerNodes.forEach(trigger => {
      // Find all actions connected to this trigger
      const connectedActionIds = edges
        .filter(edge => edge.source === trigger.id)
        .map(edge => edge.target)
      
      const connectedActions = nodes.filter(node => 
        connectedActionIds.includes(node.id) && node.type === 'action'
      )
      
      if (connectedActions.length > 0) {
        rules.push({
          id: `rule-${trigger.id}`,
          name: trigger.data.label || 'Unnamed Rule',
          description: `${trigger.data.label} → ${connectedActions.map(a => a.data.label).join(', ')}`,
          trigger,
          actions: connectedActions,
          isActive: true
        })
      }
    })
    
    return rules
  }

  /**
   * Compile a visual rule into an executable EventListener
   */
  static compileRule(rule: VisualRule): CompiledRule {
    const { trigger, actions } = rule
    
    // Create the condition function from trigger data
    const condition = trigger.data.condition ? 
      new Function('event', `return ${trigger.data.condition}`) : 
      undefined

    // Create the callback function that executes all connected actions
    const callback = (event: GameEvent, game: Game): GameEvent[] => {
      const resultEvents: GameEvent[] = []
      
      actions.forEach(actionNode => {
        try {
          const actionEvent = this.executeAction(actionNode, event, game)
          if (actionEvent) {
            resultEvents.push(actionEvent)
          }
        } catch (error) {
          console.error(`Error executing action ${actionNode.data.actionType}:`, error)
          // Create error event
          resultEvents.push(createGameEvent({
            type: 'ACTION_ERROR',
            payload: { 
              actionId: actionNode.id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            }
          }))
        }
      })
      
      return resultEvents
    }

    // Create the EventListener
    const eventListener = createEventListener({
      id: rule.id,
      eventType: trigger.data.eventType,
      callback,
      condition,
      priority: trigger.data.priority || 1
    })
    
    // Override the auto-generated ID to match our rule ID
    eventListener.id = rule.id

    return {
      id: rule.id,
      eventListener,
      originalRule: rule
    }
  }

  /**
   * Execute a single action node and return the resulting game event
   */
  private static executeAction(actionNode: Node, triggerEvent: GameEvent, game: Game): GameEvent | null {
    const { actionType, parameters } = actionNode.data
    
    // Resolve parameter values (support for event context variables)
    const resolvedParams = this.resolveParameters(parameters, triggerEvent, game)
    
    switch (actionType) {
      case 'drawCards':
        return createGameEvent({
          type: 'DRAW_CARDS_REQUESTED',
          payload: {
            playerId: resolvedParams.playerId,
            count: parseInt(resolvedParams.count) || 1
          }
        })
        
      case 'playCard':
        return createGameEvent({
          type: 'PLAY_CARD_REQUESTED',
          payload: {
            cardId: resolvedParams.cardId,
            playerId: resolvedParams.playerId,
            targets: resolvedParams.targets ? resolvedParams.targets.split(',') : []
          }
        })
        
      case 'moveCard':
        return createGameEvent({
          type: 'MOVE_CARD_REQUESTED',
          payload: {
            cardId: resolvedParams.cardId,
            fromZone: resolvedParams.fromZone,
            toZone: resolvedParams.toZone,
            position: resolvedParams.position ? parseInt(resolvedParams.position) : undefined
          }
        })
        
      case 'modifyStat':
        return createGameEvent({
          type: 'MODIFY_STAT_REQUESTED',
          payload: {
            target: resolvedParams.target,
            stat: resolvedParams.stat,
            value: parseInt(resolvedParams.value) || 0
          }
        })
        
      case 'tapCard':
        return createGameEvent({
          type: 'TAP_CARD_REQUESTED',
          payload: { cardId: resolvedParams.cardId }
        })
        
      case 'untapCard':
        return createGameEvent({
          type: 'UNTAP_CARD_REQUESTED',
          payload: { cardId: resolvedParams.cardId }
        })
        
      case 'discardCard':
        return createGameEvent({
          type: 'DISCARD_CARD_REQUESTED',
          payload: {
            cardId: resolvedParams.cardId,
            playerId: resolvedParams.playerId
          }
        })
        
      case 'shuffleZone':
        return createGameEvent({
          type: 'SHUFFLE_ZONE_REQUESTED',
          payload: { zoneId: resolvedParams.zoneId }
        })
        
      case 'addCounter':
        return createGameEvent({
          type: 'ADD_COUNTER_REQUESTED',
          payload: {
            target: resolvedParams.target,
            counterType: resolvedParams.counterType
          }
        })
        
      case 'removeCounter':
        return createGameEvent({
          type: 'REMOVE_COUNTER_REQUESTED',
          payload: {
            target: resolvedParams.target,
            counterType: resolvedParams.counterType
          }
        })
        
      case 'setTurnPhase':
        return createGameEvent({
          type: 'SET_TURN_PHASE_REQUESTED',
          payload: { phaseName: resolvedParams.phaseName }
        })
        
      case 'viewZone':
        return createGameEvent({
          type: 'VIEW_ZONE_REQUESTED',
          payload: {
            playerId: resolvedParams.playerId,
            zoneId: resolvedParams.zoneId,
            count: parseInt(resolvedParams.count) || 1
          }
        })
        
      default:
        console.warn(`Unknown action type: ${actionType}`)
        return null
    }
  }

  /**
   * Resolve parameter values with support for event context variables
   */
  private static resolveParameters(
    parameters: Record<string, any>, 
    event: GameEvent, 
    game: Game
  ): Record<string, string> {
    const resolved: Record<string, string> = {}
    
    Object.entries(parameters).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Support event context variables
        resolved[key] = value
          .replace(/\$event\.payload\.(\w+)/g, (_, prop) => event.payload[prop] || '')
          .replace(/\$event\.triggeredBy/g, event.triggeredBy)
          .replace(/\$game\.currentPlayer/g, game.currentPlayer.value)
      } else {
        resolved[key] = String(value)
      }
    })
    
    return resolved
  }

  /**
   * Compile all visual rules from a React Flow diagram
   */
  static compileAllRules(nodes: Node[], edges: Edge[]): CompiledRule[] {
    const visualRules = this.extractRules(nodes, edges)
    return visualRules.map(rule => this.compileRule(rule))
  }

  /**
   * Generate TypeScript code for the compiled rules (for export/debugging)
   */
  static generateCode(compiledRules: CompiledRule[]): string {
    const imports = `
import { createEventListener, createGameEvent } from '@/core/events'
import type { Game, GameEvent } from '@/types'
`

    const ruleCode = compiledRules.map(rule => {
      const { trigger, actions } = rule.originalRule
      return `
// Rule: ${rule.originalRule.name}
// ${rule.originalRule.description}
const ${rule.id.replace(/-/g, '_')} = createEventListener({
  id: '${rule.id}',
  eventType: '${trigger.data.eventType}',
  priority: ${trigger.data.priority || 1},
  ${trigger.data.condition ? `condition: (event) => ${trigger.data.condition},` : ''}
  callback: (event, game) => {
    const events = []
    ${actions.map(action => `
    // Action: ${action.data.label}
    events.push(createGameEvent({
      type: '${action.data.actionType.replace(/([A-Z])/g, '_$1').toUpperCase()}_REQUESTED',
      payload: ${JSON.stringify(action.data.parameters, null, 6)}
    }))`).join('')}
    return events
  }
})
`
    }).join('\n')

    return imports + ruleCode + `
export const compiledRules = [
  ${compiledRules.map(rule => rule.id.replace(/-/g, '_')).join(',\n  ')}
]
`
  }
}

/**
 * Hook for integrating visual rules with the core framework
 */
export function useRuleIntegration() {
  const compileRules = (nodes: Node[], edges: Edge[]) => {
    return RuleCompiler.compileAllRules(nodes, edges)
  }

  const generateCode = (compiledRules: CompiledRule[]) => {
    return RuleCompiler.generateCode(compiledRules)
  }

  const testRule = (rule: CompiledRule, testEvent: GameEvent, game: Game) => {
    try {
      const result = rule.eventListener.callback(testEvent, game)
      return { success: true, events: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  return {
    compileRules,
    generateCode,
    testRule
  }
}