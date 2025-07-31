/**
 * @fileoverview Shuffle Zone Action
 * Randomizes card order in zones
 */

import { Game, GameAction } from '@/types'
import { updateGame, getGameZone } from '@/core/primitives/game'
import { shuffleZone as shuffleZonePrimitive } from '@/core/primitives/zone'

export interface ShuffleZoneParams {
  zoneId: any
}

export function shuffleZone(params: ShuffleZoneParams): GameAction {
  return {
    type: 'SHUFFLE_ZONE',
    payload: params
  }
}

export function handleShuffleZone(game: Game, action: GameAction): Game {
  const { zoneId } = action.payload

  const zone = getGameZone(game, zoneId)
  if (!zone) {
    throw new Error('Zone not found')
  }

  const shuffledZone = shuffleZonePrimitive(zone)

  return updateGame(game, {
    zones: game.zones.map(z => 
      z.id.value === zoneId.value ? shuffledZone : z
    )
  })
}

export function validateShuffleZone(game: Game, action: GameAction): boolean {
  const { zoneId } = action.payload

  const zone = getGameZone(game, zoneId)
  if (!zone) return false

  // Can only shuffle ordered zones
  if (zone.order !== 'ordered') return false

  return true
}