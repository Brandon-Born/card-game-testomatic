/**
 * @fileoverview Core Action System
 * The foundational framework for all game actions
 */

import { Game, GameAction, PlayerId, GameEvent } from '@/types'

// Action Context
export interface ActionContext {
  game: Game
  activePlayer?: PlayerId
  timestamp: Date
  metadata?: Record<string, any>
}

// Action Result
export interface ActionResult {
  success: boolean
  game: Game
  error?: string
  events?: GameEvent[]
}

// GameEvent is now imported from @/types

// Core action functions

export function createActionContext(game: Game, activePlayer?: PlayerId): ActionContext {
  return {
    game,
    activePlayer,
    timestamp: new Date(),
    metadata: {}
  }
}

export function executeAction(game: Game, action: GameAction): Game {
  // Route to specific action handler (let each handler do detailed validation)
  switch (action.type) {
    case 'MOVE_CARD':
      return handleMoveCard(game, action)
    case 'DRAW_CARDS':
      return handleDrawCards(game, action)
    case 'PLAY_CARD':
      return handlePlayCard(game, action)
    case 'MODIFY_STAT':
      return handleModifyStat(game, action)
    case 'TAP_CARD':
      return handleTapCard(game, action)
    case 'UNTAP_CARD':
      return handleUntapCard(game, action)
    case 'DISCARD_CARD':
      return handleDiscardCard(game, action)
    case 'SHUFFLE_ZONE':
      return handleShuffleZone(game, action)
    case 'ADD_COUNTER':
      return handleAddCounter(game, action)
    case 'REMOVE_COUNTER':
      return handleRemoveCounter(game, action)
    case 'SET_TURN_PHASE':
      return handleSetTurnPhase(game, action)
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

export function validateAction(game: Game, action: GameAction): boolean {
  try {
    // Basic validation
    if (!action || !action.type) {
      return false
    }

    // Route to specific validator
    switch (action.type) {
      case 'MOVE_CARD':
        return validateMoveCard(game, action)
      case 'DRAW_CARDS':
        return validateDrawCards(game, action)
      case 'PLAY_CARD':
        return validatePlayCard(game, action)
      case 'MODIFY_STAT':
        return validateModifyStat(game, action)
      case 'TAP_CARD':
      case 'UNTAP_CARD':
        return validateTapCard(game, action)
      case 'DISCARD_CARD':
        return validateDiscardCard(game, action)
      case 'SHUFFLE_ZONE':
        return validateShuffleZone(game, action)
      case 'ADD_COUNTER':
      case 'REMOVE_COUNTER':
        return validateCounterAction(game, action)
      case 'SET_TURN_PHASE':
        return validateSetTurnPhase(game, action)
      default:
        return false
    }
  } catch {
    return false
  }
}

export function canExecuteAction(game: Game, action: GameAction): boolean {
  return validateAction(game, action)
}

// Import handlers (will be implemented in separate files)
import { 
  handleMoveCard, 
  validateMoveCard 
} from './move-card'

import { 
  handleDrawCards, 
  validateDrawCards 
} from './draw-cards'

import { 
  handlePlayCard, 
  validatePlayCard 
} from './play-card'

import { 
  handleModifyStat, 
  validateModifyStat 
} from './modify-stat'

import { 
  handleTapCard, 
  handleUntapCard, 
  validateTapCard 
} from './tap-untap'

import { 
  handleDiscardCard, 
  validateDiscardCard 
} from './discard'

import { 
  handleShuffleZone, 
  validateShuffleZone 
} from './shuffle'

import { 
  handleAddCounter, 
  handleRemoveCounter, 
  validateCounterAction 
} from './counter-actions'

import { 
  handleSetTurnPhase, 
  validateSetTurnPhase 
} from './phase-actions'