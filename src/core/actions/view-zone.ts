/**
 * @fileoverview View Zone Action
 * Allows viewing cards in zones (for future UI integration)
 */

import { Game, GameAction } from '@/types'
import { getGameZone, getGamePlayer } from '@/core/primitives/game'

export interface ViewZoneParams {
  playerId: any
  zoneId: any
  count?: number
}

export function viewZone(params: ViewZoneParams): GameAction {
  return {
    type: 'VIEW_ZONE',
    payload: params
  }
}

// Note: This action doesn't modify game state, just validates permission
export function handleViewZone(game: Game, action: GameAction): Game {
  const { playerId, zoneId, count } = action.payload

  const player = getGamePlayer(game, playerId)
  const zone = getGameZone(game, zoneId)

  if (!player || !zone) {
    throw new Error('Player or zone not found')
  }

  // Check if player can view this zone
  if (zone.visibility === 'private' && zone.owner?.value !== playerId.value) {
    throw new Error('Cannot view private zone')
  }

  // This action doesn't change game state, just validates access
  return game
}

export function validateViewZone(game: Game, action: GameAction): boolean {
  const { playerId, zoneId } = action.payload

  const player = getGamePlayer(game, playerId)
  const zone = getGameZone(game, zoneId)

  if (!player || !zone) return false

  // Check permission
  if (zone.visibility === 'private' && zone.owner?.value !== playerId.value) {
    return false
  }

  return true
}