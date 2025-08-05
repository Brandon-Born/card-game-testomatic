/**
 * @fileoverview Counter Actions
 * Add/remove counters from cards and players
 */

import { Game, GameAction } from '@/types'
import { updateGame, getGamePlayer, getGameCard } from '@/core/primitives/game'
import { addPlayerCounter, removePlayerCounter } from '@/core/primitives/player'
import { addCounter as addCardCounter, removeCounter as removeCardCounter } from '@/core/primitives/card'

export interface CounterActionParams {
  target: any // CardId or PlayerId
  counterType: string
  count: number
}

export function addCounter(params: CounterActionParams): GameAction {
  return {
    type: 'ADD_COUNTER',
    payload: params
  }
}

export function removeCounter(params: CounterActionParams): GameAction {
  return {
    type: 'REMOVE_COUNTER',
    payload: params
  }
}

export function handleAddCounter(game: Game, action: GameAction): Game {
  const { target, counterType, count } = action.payload

  // Try player first
  const player = getGamePlayer(game, target)
  if (player) {
    const updatedPlayer = addPlayerCounter(player, { type: counterType, count })
    return updateGame(game, {
      players: game.players.map(p => 
        p.id.value === target.value ? updatedPlayer : p
      )
    })
  }

  // Try card
  const card = getGameCard(game, target)
  if (card) {
    const updatedCard = addCardCounter(card, { type: counterType, count })
    return updateGame(game, {
      cards: game.cards.map(c => 
        c.id.value === target.value ? updatedCard : c
      )
    })
  }

  throw new Error('Target not found')
}

export function handleRemoveCounter(game: Game, action: GameAction): Game {
  const { target, counterType, count } = action.payload

  // Try player first
  const player = getGamePlayer(game, target)
  if (player) {
    const updatedPlayer = removePlayerCounter(player, { type: counterType, count })
    return updateGame(game, {
      players: game.players.map(p => 
        p.id.value === target.value ? updatedPlayer : p
      )
    })
  }

  // Try card
  const card = getGameCard(game, target)
  if (card) {
    const updatedCard = removeCardCounter(card, { type: counterType, count })
    return updateGame(game, {
      cards: game.cards.map(c => 
        c.id.value === target.value ? updatedCard : c
      )
    })
  }

  throw new Error('Target not found')
}

export function validateCounterAction(game: Game, action: GameAction): boolean {
  const { target, counterType, count } = action.payload

  if (typeof count !== 'number' || count < 0) return false
  if (!counterType || typeof counterType !== 'string') return false

  // Check if target exists
  const player = getGamePlayer(game, target)
  const card = getGameCard(game, target)

  return !!(player || card)
}