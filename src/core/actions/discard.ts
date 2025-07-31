/**
 * @fileoverview Discard Card Action
 * Moves cards from hand to discard pile
 */

import { Game, GameAction } from '@/types'
import { updateGame, getGamePlayer, getGameCard, addZoneToGame } from '@/core/primitives/game'
import { updateCard } from '@/core/primitives/card'
import { createDiscardPile, addCardToZone, removeCardFromZone } from '@/core/primitives/zone'
import { createZoneId } from '@/lib/utils'

export interface DiscardCardParams {
  playerId: any
  cardId: any
}

export function discardCard(params: DiscardCardParams): GameAction {
  return {
    type: 'DISCARD_CARD',
    payload: params
  }
}

export function handleDiscardCard(game: Game, action: GameAction): Game {
  const { playerId, cardId } = action.payload

  const player = getGamePlayer(game, playerId)
  const card = getGameCard(game, cardId)

  if (!player || !card) {
    throw new Error('Player or card not found')
  }

  if (card.owner.value !== playerId.value) {
    throw new Error('Player does not own this card')
  }

  // Find player's hand
  const hand = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'hand'
  )

  if (!hand) {
    throw new Error('Player hand not found')
  }

  // Find or create discard pile
  let discardPile = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'discard'
  )

  let updatedGame = game

  if (!discardPile) {
    discardPile = createDiscardPile({
      id: createZoneId(),
      owner: playerId
    })
    updatedGame = addZoneToGame(updatedGame, discardPile)
  }

  // Remove card from hand
  const updatedHand = removeCardFromZone(hand, cardId)

  // Add card to discard pile
  const updatedDiscardPile = addCardToZone(discardPile, cardId)

  // Update card's current zone
  const updatedCard = updateCard(card, { currentZone: discardPile.id })

  return updateGame(updatedGame, {
    zones: updatedGame.zones.map(zone => {
      if (zone.id.value === hand.id.value) return updatedHand
      if (zone.id.value === discardPile.id.value) return updatedDiscardPile
      return zone
    }),
    cards: updatedGame.cards.map(c => 
      c.id.value === cardId.value ? updatedCard : c
    )
  })
}

export function validateDiscardCard(game: Game, action: GameAction): boolean {
  const { playerId, cardId } = action.payload

  const player = getGamePlayer(game, playerId)
  const card = getGameCard(game, cardId)

  if (!player || !card) return false
  if (card.owner.value !== playerId.value) return false

  const hand = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'hand'
  )

  if (!hand) return false
  if (!hand.cards.find(cId => cId.value === cardId.value)) return false

  return true
}