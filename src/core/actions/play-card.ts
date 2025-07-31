/**
 * @fileoverview Play Card Action
 * Moves cards from hand to play area
 */

import { Game, PlayCardAction, GameAction } from '@/types'
import { updateGame, getGamePlayer, getGameCard, addZoneToGame } from '@/core/primitives/game'
import { updatePlayer, getPlayerResource, modifyPlayerResource } from '@/core/primitives/player'
import { updateCard, getCardProperty } from '@/core/primitives/card'
import { createPlayArea, addCardToZone, removeCardFromZone } from '@/core/primitives/zone'
import { createZoneId } from '@/lib/utils'

export interface PlayCardParams {
  cardId: any
  playerId: any
  targets: any[]
}

export function playCard(params: PlayCardParams): PlayCardAction {
  return {
    type: 'PLAY_CARD',
    payload: params
  }
}

export function handlePlayCard(game: Game, action: GameAction): Game {
  const { cardId, playerId, targets } = action.payload

  // Get player and card
  const player = getGamePlayer(game, playerId)
  const card = getGameCard(game, cardId)

  if (!player || !card) {
    throw new Error('Player or card not found')
  }

  // Validate ownership
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

  // Verify card is in hand
  if (!hand.cards.find(cId => cId.value === cardId.value)) {
    throw new Error('Card not in hand')
  }

  // Check mana cost
  const manaCost = getCardProperty(card, 'manaCost') || 0
  const playerMana = getPlayerResource(player, 'mana') || 0
  
  if (playerMana < manaCost) {
    throw new Error('Insufficient mana')
  }

  // Find or create play area
  let playArea = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'playarea'
  )

  let updatedGame = game

  if (!playArea) {
    playArea = createPlayArea({
      id: createZoneId(),
      owner: playerId
    })
    updatedGame = addZoneToGame(updatedGame, playArea)
  }

  // Remove card from hand
  const updatedHand = removeCardFromZone(hand, cardId)

  // Add card to play area
  const updatedPlayArea = addCardToZone(playArea, cardId)

  // Update card's current zone
  const updatedCard = updateCard(card, { currentZone: playArea.id })

  // Pay mana cost
  const updatedPlayer = modifyPlayerResource(player, 'mana', -manaCost)

  // Update game
  return updateGame(updatedGame, {
    players: updatedGame.players.map(p => 
      p.id.value === playerId.value ? updatedPlayer : p
    ),
    zones: updatedGame.zones.map(zone => {
      if (zone.id.value === hand.id.value) return updatedHand
      if (zone.id.value === playArea.id.value) return updatedPlayArea
      return zone
    }),
    cards: updatedGame.cards.map(c => 
      c.id.value === cardId.value ? updatedCard : c
    )
  })
}

export function validatePlayCard(game: Game, action: GameAction): boolean {
  const { cardId, playerId, targets } = action.payload

  const player = getGamePlayer(game, playerId)
  const card = getGameCard(game, cardId)

  if (!player || !card) return false
  if (card.owner.value !== playerId.value) return false

  // Check if card is in hand
  const hand = game.zones.find(zone => 
    zone.owner?.value === playerId.value && 
    'type' in zone && (zone as any).type === 'hand'
  )

  if (!hand) return false
  if (!hand.cards.find(cId => cId.value === cardId.value)) return false

  // Check mana cost
  const manaCost = getCardProperty(card, 'manaCost') || 0
  const playerMana = getPlayerResource(player, 'mana') || 0
  
  if (playerMana < manaCost) return false

  return true
}