/**
 * @fileoverview Comprehensive tests for Action system
 * Following TDD approach - tests written first, implementation follows
 * Actions are the VERBS that manipulate game state immutably
 */

import { Game, Player, Card, GameId, PlayerId, CardId, ZoneId, Deck, Hand } from '@/types'
import { 
  moveCard,
  drawCards,
  playCard,
  modifyStat,
  tapCard as tapCardAction,
  untapCard as untapCardAction,
  discardCard,
  shuffleZone as shuffleZoneAction,
  addCounter as addCounterAction,
  removeCounter as removeCounterAction,
  setTurnPhase,
  createActionContext,
  executeAction,
  validateAction,
  canExecuteAction
} from '@/core/actions'
import { createGame } from '@/core/primitives/game'
import { createPlayer } from '@/core/primitives/player'
import { createCard } from '@/core/primitives/card'
import { createDeck, createHand, addCardToZone } from '@/core/primitives/zone'
import { createGameId, createPlayerId, createCardId, createZoneId } from '@/lib/utils'

describe('Action System - TDD Implementation', () => {
  let game: Game
  let player1: Player
  let player2: Player
  let card1: Card
  let card2: Card
  let card3: Card
  let deck: Deck
  let hand: Hand
  let gameId: GameId
  let player1Id: PlayerId
  let player2Id: PlayerId
  let card1Id: CardId
  let card2Id: CardId
  let card3Id: CardId
  let deckId: ZoneId
  let handId: ZoneId

  beforeEach(() => {
    // Create IDs
    gameId = createGameId()
    player1Id = createPlayerId()
    player2Id = createPlayerId()
    card1Id = createCardId()
    card2Id = createCardId()
    card3Id = createCardId()
    deckId = createZoneId()
    handId = createZoneId()

    // Create players
    player1 = createPlayer({
      id: player1Id,
      name: 'Player 1',
      resources: { life: 20, mana: 4 }
    })

    player2 = createPlayer({
      id: player2Id,
      name: 'Player 2',
      resources: { life: 20, mana: 2 }
    })

    // Create cards
    card1 = createCard({
      id: card1Id,
      name: 'Lightning Bolt',
      text: 'Deal 3 damage to any target',
      type: 'Instant',
      owner: player1Id,
      currentZone: deckId,
      properties: { manaCost: 1 }
    })

    card2 = createCard({
      id: card2Id,
      name: 'Grizzly Bears',
      text: '2/2 Creature',
      type: 'Creature',
      owner: player1Id,
      currentZone: handId,
      properties: { power: 2, toughness: 2, manaCost: 2 }
    })

    card3 = createCard({
      id: card3Id,
      name: 'Forest',
      text: 'Tap: Add G',
      type: 'Land',
      owner: player1Id,
      currentZone: deckId
    })

    // Create zones
    deck = addCardToZone(createDeck({ id: deckId, owner: player1Id }), card1Id) as Deck
    deck = addCardToZone(deck, card3Id) as Deck
    hand = addCardToZone(createHand({ id: handId, owner: player1Id }), card2Id) as Hand

    // Create game
    game = createGame({
      id: gameId,
      players: [player1, player2],
      zones: [deck, hand],
      cards: [card1, card2, card3],
      currentPlayer: player1Id,
      phase: 'main',
      turnNumber: 1
    })
  })

  describe('Move Card Action', () => {
    it('should move card between zones', () => {
      const action = moveCard({
        cardId: card1Id,
        fromZone: deckId,
        toZone: handId
      })

      const result = executeAction(game, action)

      // Card should be moved from deck to hand
      const updatedDeck = result.zones.find(z => z.id.value === deckId.value)!
      const updatedHand = result.zones.find(z => z.id.value === handId.value)!
      
      expect(updatedDeck.cards).not.toContain(card1Id)
      expect(updatedHand.cards).toContain(card1Id)

      // Card's currentZone should be updated
      const updatedCard = result.cards.find(c => c.id.value === card1Id.value)!
      expect(updatedCard.currentZone).toBe(handId)
    })

    it('should validate card exists in source zone', () => {
      const action = moveCard({
        cardId: card2Id, // Card is in hand, not deck
        fromZone: deckId,
        toZone: handId
      })

      expect(() => executeAction(game, action))
        .toThrow('Card not found in source zone')
    })

    it('should handle moving to specific position', () => {
      const action = moveCard({
        cardId: card1Id,
        fromZone: deckId,
        toZone: handId,
        position: 0
      })

      const result = executeAction(game, action)
      const updatedHand = result.zones.find(z => z.id.value === handId.value)!
      
      expect(updatedHand.cards[0]).toBe(card1Id)
    })

    it('should respect zone capacity limits', () => {
      const limitedHand = { ...hand, maxSize: 1 } // Hand already has 1 card
      const gameWithLimitedHand = {
        ...game,
        zones: game.zones.map(z => z.id.value === handId.value ? limitedHand : z)
      }

      const action = moveCard({
        cardId: card1Id,
        fromZone: deckId,
        toZone: handId
      })

      expect(() => executeAction(gameWithLimitedHand, action))
        .toThrow('Zone is at maximum capacity')
    })
  })

  describe('Draw Cards Action', () => {
    it('should draw cards from deck to hand', () => {
      const action = drawCards({
        playerId: player1Id,
        count: 1
      })

      const result = executeAction(game, action)
      
      const updatedDeck = result.zones.find(z => z.id.value === deckId.value)!
      const updatedHand = result.zones.find(z => z.id.value === handId.value)!
      
      expect(updatedDeck.cards).toHaveLength(1) // Was 2, now 1
      expect(updatedHand.cards).toHaveLength(2) // Was 1, now 2
    })

    it('should draw multiple cards', () => {
      const action = drawCards({
        playerId: player1Id,
        count: 2
      })

      const result = executeAction(game, action)
      
      const updatedDeck = result.zones.find(z => z.id.value === deckId.value)!
      const updatedHand = result.zones.find(z => z.id.value === handId.value)!
      
      expect(updatedDeck.cards).toHaveLength(0)
      expect(updatedHand.cards).toHaveLength(3)
    })

    it('should handle insufficient cards in deck', () => {
      const action = drawCards({
        playerId: player1Id,
        count: 5 // Only 2 cards in deck
      })

      expect(() => executeAction(game, action))
        .toThrow('Not enough cards in deck')
    })

    it('should validate player exists', () => {
      const nonExistentPlayerId = createPlayerId()
      const action = drawCards({
        playerId: nonExistentPlayerId,
        count: 1
      })

      expect(() => executeAction(game, action))
        .toThrow('Player not found')
    })
  })

  describe('Play Card Action', () => {
    it('should play card from hand to play area', () => {
      const action = playCard({
        cardId: card2Id,
        playerId: player1Id,
        targets: []
      })

      const result = executeAction(game, action)
      
      const updatedHand = result.zones.find(z => z.id.value === handId.value)!
      expect(updatedHand.cards).not.toContain(card2Id)

      // Should create or add to play area
      const playArea = result.zones.find(z => z.name === 'Play Area')
      expect(playArea).toBeDefined()
      expect(playArea!.cards).toContain(card2Id)
    })

    it('should validate player owns the card', () => {
      const action = playCard({
        cardId: card2Id,
        playerId: player2Id, // Player 2 doesn't own card2
        targets: []
      })

      expect(() => executeAction(game, action))
        .toThrow('Player does not own this card')
    })

    it('should validate card is in hand', () => {
      const action = playCard({
        cardId: card1Id, // Card is in deck, not hand
        playerId: player1Id,
        targets: []
      })

      expect(() => executeAction(game, action))
        .toThrow('Card not in hand')
    })

    it('should handle cards with targets', () => {
      const action = playCard({
        cardId: card2Id,
        playerId: player1Id,
        targets: [player2Id]
      })

      const result = executeAction(game, action)
      expect(result).toBeDefined()
      // Targeting validation would be handled by specific card logic
    })

    it('should check mana cost', () => {
      // Remove mana from player
      const poorPlayer = { ...player1, resources: { ...player1.resources, mana: 0 } }
      const gameWithPoorPlayer = {
        ...game,
        players: game.players.map(p => p.id.value === player1Id.value ? poorPlayer : p)
      }

      const action = playCard({
        cardId: card2Id, // Costs 2 mana
        playerId: player1Id,
        targets: []
      })

      expect(() => executeAction(gameWithPoorPlayer, action))
        .toThrow('Insufficient mana')
    })
  })

  describe('Modify Stat Action', () => {
    it('should modify player life', () => {
      const action = modifyStat({
        target: player1Id,
        stat: 'life',
        value: -3
      })

      const result = executeAction(game, action)
      const updatedPlayer = result.players.find(p => p.id.value === player1Id.value)!
      
      expect(updatedPlayer.resources.life).toBe(17)
    })

    it('should modify card properties', () => {
      const action = modifyStat({
        target: card2Id,
        stat: 'power',
        value: 2
      })

      const result = executeAction(game, action)
      const updatedCard = result.cards.find(c => c.id.value === card2Id.value)!
      
      expect(updatedCard.properties.power).toBe(4)
    })

    it('should handle new stats', () => {
      const action = modifyStat({
        target: player1Id,
        stat: 'energy',
        value: 5
      })

      const result = executeAction(game, action)
      const updatedPlayer = result.players.find(p => p.id.value === player1Id.value)!
      
      expect(updatedPlayer.resources.energy).toBe(5)
    })

    it('should validate target exists', () => {
      const nonExistentId = createCardId()
      const action = modifyStat({
        target: nonExistentId,
        stat: 'power',
        value: 1
      })

      expect(() => executeAction(game, action))
        .toThrow('Target not found')
    })
  })

  describe('Tap/Untap Actions', () => {
    it('should tap a card', () => {
      const action = tapCardAction({
        cardId: card2Id
      })

      const result = executeAction(game, action)
      const updatedCard = result.cards.find(c => c.id.value === card2Id.value)!
      
      expect(updatedCard.isTapped).toBe(true)
    })

    it('should untap a tapped card', () => {
      // First tap the card
      const tappedCard = { ...card2, isTapped: true }
      const gameWithTappedCard = {
        ...game,
        cards: game.cards.map(c => c.id.value === card2Id.value ? tappedCard : c)
      }

      const action = untapCardAction({
        cardId: card2Id
      })

      const result = executeAction(gameWithTappedCard, action)
      const updatedCard = result.cards.find(c => c.id.value === card2Id.value)!
      
      expect(updatedCard.isTapped).toBe(false)
    })
  })

  describe('Discard Action', () => {
    it('should discard card from hand to discard pile', () => {
      const action = discardCard({
        playerId: player1Id,
        cardId: card2Id
      })

      const result = executeAction(game, action)
      
      const updatedHand = result.zones.find(z => z.id.value === handId.value)!
      expect(updatedHand.cards).not.toContain(card2Id)

      // Should create or add to discard pile
      const discardPile = result.zones.find(z => z.name === 'Discard Pile')
      expect(discardPile).toBeDefined()
      expect(discardPile!.cards).toContain(card2Id)
    })

    it('should validate player owns the card', () => {
      const action = discardCard({
        playerId: player2Id,
        cardId: card2Id
      })

      expect(() => executeAction(game, action))
        .toThrow('Player does not own this card')
    })
  })

  describe('Shuffle Zone Action', () => {
    it('should shuffle cards in deck', () => {
      const action = shuffleZoneAction({
        zoneId: deckId
      })

      const result = executeAction(game, action)
      const updatedDeck = result.zones.find(z => z.id.value === deckId.value)!
      
      expect(updatedDeck.cards).toHaveLength(2)
      expect(updatedDeck.cards).toEqual(expect.arrayContaining([card1Id, card3Id]))
    })

    it('should not shuffle unordered zones', () => {
      const action = shuffleZoneAction({
        zoneId: handId // Hand is unordered
      })

      expect(() => executeAction(game, action))
        .toThrow('Cannot shuffle unordered zone')
    })
  })

  describe('Counter Actions', () => {
    it('should add counters to cards', () => {
      const action = addCounterAction({
        target: card2Id,
        counterType: '+1/+1',
        count: 2
      })

      const result = executeAction(game, action)
      const updatedCard = result.cards.find(c => c.id.value === card2Id.value)!
      
      expect(updatedCard.counters).toEqual([{ type: '+1/+1', count: 2 }])
    })

    it('should add counters to players', () => {
      const action = addCounterAction({
        target: player1Id,
        counterType: 'poison',
        count: 1
      })

      const result = executeAction(game, action)
      const updatedPlayer = result.players.find(p => p.id.value === player1Id.value)!
      
      expect(updatedPlayer.counters).toEqual([{ type: 'poison', count: 1 }])
    })

    it('should remove counters', () => {
      // First add a counter
      const cardWithCounter = { ...card2, counters: [{ type: '+1/+1', count: 3 }] }
      const gameWithCounters = {
        ...game,
        cards: game.cards.map(c => c.id.value === card2Id.value ? cardWithCounter : c)
      }

      const action = removeCounterAction({
        target: card2Id,
        counterType: '+1/+1',
        count: 1
      })

      const result = executeAction(gameWithCounters, action)
      const updatedCard = result.cards.find(c => c.id.value === card2Id.value)!
      
      expect(updatedCard.counters).toEqual([{ type: '+1/+1', count: 2 }])
    })
  })

  describe('Phase Actions', () => {
    it('should set turn phase', () => {
      const action = setTurnPhase({
        phase: 'combat'
      })

      const result = executeAction(game, action)
      expect(result.phase).toBe('combat')
    })
  })

  describe('Action Context and Validation', () => {
    it('should create action context with required information', () => {
      const context = createActionContext(game, player1Id)

      expect(context.game).toBe(game)
      expect(context.activePlayer).toBe(player1Id)
      expect(context.timestamp).toBeInstanceOf(Date)
    })

    it('should validate actions before execution', () => {
      const validAction = drawCards({
        playerId: player1Id,
        count: 1
      })

      expect(validateAction(game, validAction)).toBe(true)
      expect(canExecuteAction(game, validAction)).toBe(true)
    })

    it('should reject invalid actions', () => {
      const invalidAction = drawCards({
        playerId: createPlayerId(), // Non-existent player
        count: 1
      })

      expect(validateAction(game, invalidAction)).toBe(false)
      expect(canExecuteAction(game, invalidAction)).toBe(false)
    })

    it('should handle action prerequisites', () => {
      const playCardAction = playCard({
        cardId: card1Id, // Card in deck, not hand
        playerId: player1Id,
        targets: []
      })

      expect(canExecuteAction(game, playCardAction)).toBe(false)
    })
  })

  describe('Complex Action Sequences', () => {
    it('should handle multiple actions in sequence', () => {
      let currentGame = game

      // Draw a card
      const drawAction = drawCards({
        playerId: player1Id,
        count: 1
      })
      currentGame = executeAction(currentGame, drawAction)

      // Find what card was actually drawn (top card of deck)
      const hand = currentGame.zones.find(z => z.id.value === handId.value)!
      const drawnCardId = hand.cards.find(cId => cId.value !== card2Id.value)! // The newly drawn card

      // Play the drawn card
      const playAction = playCard({
        cardId: drawnCardId, // Use the actual drawn card
        playerId: player1Id,
        targets: []
      })
      currentGame = executeAction(currentGame, playAction)

      // Tap the played card
      const tapAction = tapCardAction({
        cardId: drawnCardId
      })
      currentGame = executeAction(currentGame, tapAction)

      const finalCard = currentGame.cards.find(c => c.id.value === drawnCardId.value)!
      expect(finalCard.isTapped).toBe(true)
      
      const playArea = currentGame.zones.find(z => z.name === 'Play Area')
      expect(playArea!.cards).toContain(drawnCardId)
    })

    it('should maintain game state consistency', () => {
      const action = moveCard({
        cardId: card1Id,
        fromZone: deckId,
        toZone: handId
      })

      const result = executeAction(game, action)

      // Verify all references are updated
      const movedCard = result.cards.find(c => c.id.value === card1Id.value)!
      const sourceDeck = result.zones.find(z => z.id.value === deckId.value)!
      const targetHand = result.zones.find(z => z.id.value === handId.value)!

      expect(movedCard.currentZone.value).toBe(handId.value)
      expect(sourceDeck.cards.find(cId => cId.value === card1Id.value)).toBeUndefined()
      expect(targetHand.cards.find(cId => cId.value === card1Id.value)).toBeDefined()
    })
  })
})