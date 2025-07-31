/**
 * @fileoverview Phase Actions
 * Manage game phases and turns
 */

import { Game, GameAction } from '@/types'
import { updateGame } from '@/core/primitives/game'

export interface SetTurnPhaseParams {
  phase: string
}

export function setTurnPhase(params: SetTurnPhaseParams): GameAction {
  return {
    type: 'SET_TURN_PHASE',
    payload: params
  }
}

export function handleSetTurnPhase(game: Game, action: GameAction): Game {
  const { phase } = action.payload

  return updateGame(game, { phase })
}

export function validateSetTurnPhase(game: Game, action: GameAction): boolean {
  const { phase } = action.payload

  return typeof phase === 'string' && phase.length > 0
}