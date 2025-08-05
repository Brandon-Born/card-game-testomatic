/**
 * @fileoverview Modify Stat Action
 * Changes numerical properties on players or cards
 */

import { Game, ModifyStatAction, GameAction } from '@/types'
import { updateGame, getGamePlayer, getGameCard } from '@/core/primitives/game'
import { modifyPlayerResource } from '@/core/primitives/player'
import { setCardProperty, getCardProperty } from '@/core/primitives/card'

export interface ModifyStatParams {
  target: any // CardId or PlayerId
  stat: string
  value: number
}

export function modifyStat(params: ModifyStatParams): ModifyStatAction {
  return {
    type: 'MODIFY_STAT',
    payload: params
  }
}

export function handleModifyStat(game: Game, action: GameAction): Game {
  const { target, stat, value } = action.payload

  // Try to find target as player first
  const player = getGamePlayer(game, target)
  if (player) {
    const updatedPlayer = modifyPlayerResource(player, stat, value)
    return updateGame(game, {
      players: game.players.map(p => 
        p.id.value === target.value ? updatedPlayer : p
      )
    })
  }

  // Try to find target as card
  const card = getGameCard(game, target)
  if (card) {
    const currentValue = getCardProperty(card, stat) || 0
    const updatedCard = setCardProperty(card, stat, currentValue + value)
    return updateGame(game, {
      cards: game.cards.map(c => 
        c.id.value === target.value ? updatedCard : c
      )
    })
  }

  throw new Error('Target not found')
}

export function validateModifyStat(game: Game, action: GameAction): boolean {
  const { target, stat, value } = action.payload

  if (typeof value !== 'number') return false
  if (!stat || typeof stat !== 'string') return false

  // Check if target exists (either player or card)
  const player = getGamePlayer(game, target)
  const card = getGameCard(game, target)

  return !!(player || card)
}