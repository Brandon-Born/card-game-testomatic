/**
 * @fileoverview Tap/Untap Card Actions
 * Changes tapped state of cards
 */

import { Game, GameAction } from '@/types'
import { updateGame, getGameCard } from '@/core/primitives/game'
import { tapCard as tapCardPrimitive, untapCard as untapCardPrimitive } from '@/core/primitives/card'

export interface TapCardParams {
  cardId: any
}

export function tapCard(params: TapCardParams): GameAction {
  return {
    type: 'TAP_CARD',
    payload: params
  }
}

export function untapCard(params: TapCardParams): GameAction {
  return {
    type: 'UNTAP_CARD',
    payload: params
  }
}

export function handleTapCard(game: Game, action: GameAction): Game {
  const { cardId } = action.payload

  const card = getGameCard(game, cardId)
  if (!card) {
    throw new Error('Card not found')
  }

  const updatedCard = tapCardPrimitive(card)

  return updateGame(game, {
    cards: game.cards.map(c => 
      c.id.value === cardId.value ? updatedCard : c
    )
  })
}

export function handleUntapCard(game: Game, action: GameAction): Game {
  const { cardId } = action.payload

  const card = getGameCard(game, cardId)
  if (!card) {
    throw new Error('Card not found')
  }

  const updatedCard = untapCardPrimitive(card)

  return updateGame(game, {
    cards: game.cards.map(c => 
      c.id.value === cardId.value ? updatedCard : c
    )
  })
}

export function validateTapCard(game: Game, action: GameAction): boolean {
  const { cardId } = action.payload

  const card = getGameCard(game, cardId)
  return !!card
}