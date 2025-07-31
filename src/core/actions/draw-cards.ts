/**
 * @fileoverview Draw Cards Action
 * Moves cards from deck to hand
 */

import { Game, DrawCardsAction, GameAction } from '@/types'
import { updateGame, getGamePlayer } from '@/core/primitives/game'
import { drawCardsFromZone } from '@/core/primitives/zone'

export interface DrawCardsParams {
  playerId: any
  count: number
}

export function drawCards(params: DrawCardsParams): DrawCardsAction {
  return {
    type: 'DRAW_CARDS',
    payload: params
  }
}

export function handleDrawCards(game: Game, action: GameAction): Game {
  const { playerId, count } = action.payload

  // Get player
  const player = getGamePlayer(game, playerId)
  if (!player) {
    throw new Error('Player not found')
  }

  // Find player's deck and hand
  const deck = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'deck'
  )
  
  const hand = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'hand'
  )

  if (!deck || !hand) {
    throw new Error('Player deck or hand not found')
  }

  if (deck.cards.length < count) {
    throw new Error('Not enough cards in deck')
  }

  // Draw cards from top of deck
  const { drawnCards, updatedZone: updatedDeck } = drawCardsFromZone(deck, count, true)

  // Add cards to hand
  let updatedHand = hand
  drawnCards.forEach(cardId => {
    updatedHand = { ...updatedHand, cards: [...updatedHand.cards, cardId] }
  })

  // Update card current zones
  const updatedCards = game.cards.map(card => {
    if (drawnCards.find(cId => cId.value === card.id.value)) {
      return { ...card, currentZone: hand.id }
    }
    return card
  })

  return updateGame(game, {
    zones: game.zones.map(zone => {
      if (zone.id.value === deck.id.value) return updatedDeck
      if (zone.id.value === hand.id.value) return updatedHand
      return zone
    }),
    cards: updatedCards
  })
}

export function validateDrawCards(game: Game, action: GameAction): boolean {
  const { playerId, count } = action.payload

  if (count < 0) return false

  const player = getGamePlayer(game, playerId)
  if (!player) return false

  const deck = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'deck'
  )

  if (!deck) return false
  if (deck.cards.length < count) return false

  return true
}