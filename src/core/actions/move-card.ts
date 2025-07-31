/**
 * @fileoverview Move Card Action
 * Moves cards between zones with full validation
 */

import { Game, MoveCardAction, GameAction } from '@/types'
import { updateGame, getGameCard, getGameZone } from '@/core/primitives/game'
import { updateCard } from '@/core/primitives/card'
import { addCardToZone, removeCardFromZone } from '@/core/primitives/zone'

export interface MoveCardParams {
  cardId: any
  fromZone: any
  toZone: any
  position?: number
}

export function moveCard(params: MoveCardParams): MoveCardAction {
  return {
    type: 'MOVE_CARD',
    payload: params
  }
}

export function handleMoveCard(game: Game, action: GameAction): Game {
  const { cardId, fromZone, toZone, position } = action.payload

  // Get the card and zones
  const card = getGameCard(game, cardId)
  const sourceZone = getGameZone(game, fromZone)
  const targetZone = getGameZone(game, toZone)

  if (!card || !sourceZone || !targetZone) {
    throw new Error('Card or zone not found')
  }

  // Verify card is in source zone
  if (!sourceZone.cards.find(cId => cId.value === cardId.value)) {
    throw new Error('Card not found in source zone')
  }

  // Update zones
  const updatedSourceZone = removeCardFromZone(sourceZone, cardId)
  const updatedTargetZone = addCardToZone(targetZone, cardId, position)

  // Update card's current zone
  const updatedCard = updateCard(card, { currentZone: toZone })

  // Update game
  return updateGame(game, {
    zones: game.zones.map(zone => {
      if (zone.id.value === fromZone.value) return updatedSourceZone
      if (zone.id.value === toZone.value) return updatedTargetZone
      return zone
    }),
    cards: game.cards.map(c => 
      c.id.value === cardId.value ? updatedCard : c
    )
  })
}

export function validateMoveCard(game: Game, action: GameAction): boolean {
  const { cardId, fromZone, toZone } = action.payload

  // Check if card and zones exist
  const card = getGameCard(game, cardId)
  const sourceZone = getGameZone(game, fromZone)
  const targetZone = getGameZone(game, toZone)

  if (!card || !sourceZone || !targetZone) {
    return false
  }

  // Check if card is in source zone
  const cardInSource = sourceZone.cards.find(cId => cId.value === cardId.value)
  if (!cardInSource) {
    return false
  }

  // Check target zone capacity
  if (targetZone.maxSize && targetZone.cards.length >= targetZone.maxSize) {
    return false
  }

  return true
}