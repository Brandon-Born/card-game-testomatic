/**
 * @fileoverview Framework Integration Tests
 * Tests the complete framework working together: Primitives + Actions + Events
 * Demonstrates real game scenarios and complex interactions
 */

import { Game, Card, Zone, GameEvent } from '@/types'
import { 
  createGame, 
  // addPlayerToGame, 
  // addCardToGame, 
  // addZoneToGame - Reserved for future game modification features
} from '@/core/primitives/game'
import { createPlayer } from '@/core/primitives/player'
import { createCard } from '@/core/primitives/card'
import { createDeck, createHand, addCardToZone } from '@/core/primitives/zone'
import { 
  // moveCard, - Reserved for future manual card movement features 
  drawCards, 
  playCard, 
  modifyStat, 
  tapCard, 
  executeAction 
} from '@/core/actions'
import { 
  createEventListener, 
  createGameEvent, 
  publishEvent,
  processEvents as processEventQueue,
  addEventListenerToGame
} from '@/core/events'
import { createGameId, createPlayerId, createCardId, createZoneId } from '@/lib/utils'

describe('Framework Integration Tests', () => {
  describe('Complete Game Setup and Basic Gameplay', () => {
    it('should create a complete two-player game with cards and zones', () => {
      // Create players
      const player1Id = createPlayerId()
      const player2Id = createPlayerId()
      
      const player1 = createPlayer({
        id: player1Id,
        name: 'Alice',
        resources: { life: 20, mana: 5 }
      })
      
      const player2 = createPlayer({
        id: player2Id,
        name: 'Bob',
        resources: { life: 20, mana: 3 }
      })

      // Create zones for each player
      const player1DeckId = createZoneId()
      const player1HandId = createZoneId()
      const player2DeckId = createZoneId()
      const player2HandId = createZoneId()

      const player1Deck = createDeck({ id: player1DeckId, owner: player1Id })
      const player1Hand = createHand({ id: player1HandId, owner: player1Id })
      const player2Deck = createDeck({ id: player2DeckId, owner: player2Id })
      const player2Hand = createHand({ id: player2HandId, owner: player2Id })

      // Create cards
      const lightningBolt = createCard({
        id: createCardId(),
        name: 'Lightning Bolt',
        text: 'Deal 3 damage to any target',
        type: 'Instant',
        owner: player1Id,
        currentZone: player1DeckId,
        properties: { manaCost: 1, damage: 3 }
      })

      const healingPotion = createCard({
        id: createCardId(),
        name: 'Healing Potion',
        text: 'Gain 5 life',
        type: 'Sorcery',
        owner: player2Id,
        currentZone: player2DeckId,
        properties: { manaCost: 2, healing: 5 }
      })

      // Add cards to decks
      const deckWithBolt = addCardToZone(player1Deck, lightningBolt.id)
      const deckWithPotion = addCardToZone(player2Deck, healingPotion.id)

      // Create game and add all components
      const game = createGame({
        id: createGameId(),
        players: [player1, player2],
        zones: [deckWithBolt, player1Hand, deckWithPotion, player2Hand],
        cards: [lightningBolt, healingPotion],
        currentPlayer: player1Id,
        phase: 'main',
        turnNumber: 1
      })

      // Verify complete game state
      expect(game.players).toHaveLength(2)
      expect(game.zones.length).toBeGreaterThanOrEqual(4) // At least the 4 player zones
      expect(game.cards).toHaveLength(2)
      expect(game.currentPlayer).toBe(player1Id)
      expect(game.eventManager).toBeDefined()
      expect(game.eventManager.listeners).toHaveLength(0)
      
      // Verify the stack exists (it's the game.stack property)
      expect(game.stack).toBeDefined()
      expect(game.stack.name).toBe('Stack')
      
      // Verify player zones exist
      const player1Zones = game.zones.filter(z => z.owner?.value === player1Id.value)
      const player2Zones = game.zones.filter(z => z.owner?.value === player2Id.value)
      expect(player1Zones).toHaveLength(2) // deck and hand
      expect(player2Zones).toHaveLength(2) // deck and hand
    })
  })

  describe('Card Play with Event Triggers', () => {
    let game: Game
    let player1Id: any
    let player2Id: any
    let lightningBoltId: any
    let handId: any

    beforeEach(() => {
      // Setup complete game scenario
      player1Id = createPlayerId()
      player2Id = createPlayerId()
      lightningBoltId = createCardId()
      handId = createZoneId()
      const deckId = createZoneId()

      const player1 = createPlayer({
        id: player1Id,
        name: 'Player 1',
        resources: { life: 20, mana: 5 }
      })

      const player2 = createPlayer({
        id: player2Id,
        name: 'Player 2',
        resources: { life: 20, mana: 3 }
      })

      const lightningBolt = createCard({
        id: lightningBoltId,
        name: 'Lightning Bolt',
        text: 'Deal 3 damage to any target',
        type: 'Instant',
        owner: player1Id,
        currentZone: handId,
        properties: { manaCost: 1, damage: 3 }
      })

      const deck = createDeck({ id: deckId, owner: player1Id })
      const hand = addCardToZone(createHand({ id: handId, owner: player1Id }), lightningBoltId)

      game = createGame({
        id: createGameId(),
        players: [player1, player2],
        zones: [deck, hand],
        cards: [lightningBolt],
        currentPlayer: player1Id,
        phase: 'main',
        turnNumber: 1
      })
    })

    it('should play a card and trigger damage events', () => {
      // Add event listener for card plays that deal damage
      const damageListener = createEventListener({
        eventType: 'CARD_PLAYED',
        condition: (event: GameEvent) => {
          return event.payload.cardName === 'Lightning Bolt'
        },
        callback: (event: GameEvent, _gameState: Game) => {
          // When Lightning Bolt is played, deal damage to target
          return [
            createGameEvent({
              type: 'DAMAGE_DEALT',
              payload: {
                target: player2Id,
                amount: 3,
                source: lightningBoltId
              },
              triggeredBy: event.triggeredBy
            })
          ]
        },
        priority: 1
      })

      // Add listener for damage events to modify player life
      const lifeModifierListener = createEventListener({
        eventType: 'DAMAGE_DEALT',
        callback: (_event: GameEvent, _gameState: Game) => {
          // This would normally be handled by the action system
          // but we're demonstrating the event flow
          return []
        },
        priority: 2
      })

      // Add listeners to game
      game = addEventListenerToGame(game, damageListener)
      game = addEventListenerToGame(game, lifeModifierListener)

      // Play the Lightning Bolt
      const playAction = playCard({
        cardId: lightningBoltId,
        playerId: player1Id,
        targets: [player2Id]
      })

      const gameAfterPlay = executeAction(game, playAction)

      // Manually trigger the card played event (in real implementation, 
      // this would be automatic)
      const cardPlayedEvent = createGameEvent({
        type: 'CARD_PLAYED',
        payload: {
          cardId: lightningBoltId,
          cardName: 'Lightning Bolt',
          playerId: player1Id,
          targets: [player2Id]
        },
        triggeredBy: player1Id
      })

      const gameWithEvent = {
        ...gameAfterPlay,
        eventManager: publishEvent(gameAfterPlay.eventManager, cardPlayedEvent)
      }

      // Process events
      const result = processEventQueue(gameWithEvent.eventManager, gameWithEvent)

      // Verify event processing (includes original + generated events)
      expect(result.processedEvents).toHaveLength(2) // CARD_PLAYED + DAMAGE_DEALT
      expect(result.generatedEvents).toHaveLength(1) // Only DAMAGE_DEALT was generated
      expect(result.generatedEvents[0].type).toBe('DAMAGE_DEALT')
      expect(result.generatedEvents[0].payload.target).toBe(player2Id)
      expect(result.generatedEvents[0].payload.amount).toBe(3)
    })
  })

  describe('Complex Multi-Turn Gameplay', () => {
    let game: Game
    let player1Id: any
    let player2Id: any
    const cards: { [key: string]: any } = {}
    const zones: { [key: string]: any } = {}

    beforeEach(() => {
      // Create comprehensive game setup
      player1Id = createPlayerId()
      player2Id = createPlayerId()

      const player1 = createPlayer({
        id: player1Id,
        name: 'Alice',
        resources: { life: 20, mana: 4 }
      })

      const player2 = createPlayer({
        id: player2Id,
        name: 'Bob',
        resources: { life: 20, mana: 4 }
      })

      // Create zones
      zones.player1Deck = createDeck({ id: createZoneId(), owner: player1Id })
      zones.player1Hand = createHand({ id: createZoneId(), owner: player1Id })
      zones.player2Deck = createDeck({ id: createZoneId(), owner: player2Id })
      zones.player2Hand = createHand({ id: createZoneId(), owner: player2Id })

      // Create diverse cards
      cards.creature = createCard({
        id: createCardId(),
        name: 'Grizzly Bears',
        text: '2/2 Creature',
        type: 'Creature',
        owner: player1Id,
        currentZone: zones.player1Deck.id,
        properties: { power: 2, toughness: 2, manaCost: 2 }
      })

      cards.instant = createCard({
        id: createCardId(),
        name: 'Lightning Bolt',
        text: 'Deal 3 damage',
        type: 'Instant',
        owner: player1Id,
        currentZone: zones.player1Deck.id,
        properties: { damage: 3, manaCost: 1 }
      })

      cards.land = createCard({
        id: createCardId(),
        name: 'Forest',
        text: 'Tap: Add G',
        type: 'Land',
        owner: player2Id,
        currentZone: zones.player2Deck.id,
        properties: { manaType: 'green' }
      })

      // Add cards to decks
      zones.player1Deck = addCardToZone(zones.player1Deck, cards.creature.id)
      zones.player1Deck = addCardToZone(zones.player1Deck, cards.instant.id)
      zones.player2Deck = addCardToZone(zones.player2Deck, cards.land.id)

      game = createGame({
        id: createGameId(),
        players: [player1, player2],
        zones: Object.values(zones),
        cards: Object.values(cards),
        currentPlayer: player1Id,
        phase: 'main',
        turnNumber: 1
      })
    })

    it('should handle a complete turn cycle with multiple actions', () => {
      // 1. Player 1 draws a card
      let currentGame = executeAction(game, drawCards({
        playerId: player1Id,
        count: 1
      }))

      // Verify card was drawn
      const hand = currentGame.zones.find(z => 
        z.owner?.value === player1Id.value && 
        'type' in z && (z as any).type === 'hand'
      )
      expect(hand?.cards).toHaveLength(1)

      // 2. Player 1 plays the creature
      const drawnCardId = hand!.cards[0]
      currentGame = executeAction(currentGame, playCard({
        cardId: drawnCardId,
        playerId: player1Id,
        targets: []
      }))

      // Verify creature is in play area
      const playArea = currentGame.zones.find(z => z.name === 'Play Area')
      expect(playArea?.cards).toContain(drawnCardId)

      // 3. Player 1 taps the creature
      currentGame = executeAction(currentGame, tapCard({
        cardId: drawnCardId
      }))

      // Verify creature is tapped
      const tappedCreature = currentGame.cards.find(c => c.id.value === drawnCardId.value)
      expect(tappedCreature?.isTapped).toBe(true)

      // 4. Verify mana was spent (check the card's mana cost)
      const drawnCard = currentGame.cards.find(c => c.id.value === drawnCardId.value)
      const manaCost = drawnCard?.properties.manaCost || 0
      
      const updatedPlayer1 = currentGame.players.find(p => p.id.value === player1Id.value)
      expect(updatedPlayer1?.resources.mana).toBe(4 - manaCost) // Started with 4, spent manaCost
    })

    it('should handle cascading events across multiple cards', () => {
      // Setup event listener for creature enters play
      const creatureEntersListener = createEventListener({
        eventType: 'CARD_PLAYED',
        condition: (event: GameEvent) => event.payload.cardType === 'Creature',
        callback: (event: GameEvent, _gameState: Game) => [
          createGameEvent({
            type: 'CREATURE_ENTERS_BATTLEFIELD',
            payload: {
              creatureId: event.payload.cardId,
              playerId: event.payload.playerId
            }
          })
        ],
        priority: 1
      })

      // Setup triggered ability for when creatures enter
      const triggeredAbilityListener = createEventListener({
        eventType: 'CREATURE_ENTERS_BATTLEFIELD',
        callback: (_event: GameEvent, _gameState: Game) => [
          createGameEvent({
            type: 'DAMAGE_DEALT',
            payload: {
              target: player2Id,
              amount: 1,
              source: 'triggered_ability'
            }
          })
        ],
        priority: 2
      })

      // Add listeners to game
      let gameWithEvents = addEventListenerToGame(game, creatureEntersListener)
      gameWithEvents = addEventListenerToGame(gameWithEvents, triggeredAbilityListener)

      // Draw and play creature
      let currentGame = executeAction(gameWithEvents, drawCards({
        playerId: player1Id,
        count: 1
      }))

      const hand = currentGame.zones.find(z => 
        z.owner?.value === player1Id.value && 
        'type' in z && (z as any).type === 'hand'
      )
      const drawnCardId = hand!.cards[0]

      currentGame = executeAction(currentGame, playCard({
        cardId: drawnCardId,
        playerId: player1Id,
        targets: []
      }))

      // Trigger card played event
      const cardPlayedEvent = createGameEvent({
        type: 'CARD_PLAYED',
        payload: {
          cardId: drawnCardId,
          cardType: 'Creature',
          playerId: player1Id
        }
      })

      const gameWithEvent = {
        ...currentGame,
        eventManager: publishEvent(currentGame.eventManager, cardPlayedEvent)
      }

      // Process cascading events
      const result = processEventQueue(gameWithEvent.eventManager, gameWithEvent)

      // Verify event cascade
      expect(result.processedEvents).toHaveLength(3) // Original + 2 generated
      expect(result.processedEvents.map(e => e.type)).toEqual([
        'CARD_PLAYED',
        'CREATURE_ENTERS_BATTLEFIELD', 
        'DAMAGE_DEALT'
      ])
    })
  })

  describe('Advanced Game State Management', () => {
    it('should maintain state consistency through complex operations', () => {
      // Create a complex scenario with multiple players, zones, and cards
      const player1Id = createPlayerId()
      const player2Id = createPlayerId()
      const player3Id = createPlayerId()

      const players = [
        createPlayer({ id: player1Id, name: 'Alice', resources: { life: 30, mana: 10 } }),
        createPlayer({ id: player2Id, name: 'Bob', resources: { life: 25, mana: 8 } }),
        createPlayer({ id: player3Id, name: 'Charlie', resources: { life: 20, mana: 12 } })
      ]

      // Create zones for all players
      const zones: Zone[] = []
      const cards: Card[] = []

      players.forEach((player, index) => {
        let deck = createDeck({ id: createZoneId(), owner: player.id })
        const hand = createHand({ id: createZoneId(), owner: player.id })
        
        // Add cards to each player's deck
        for (let i = 0; i < 3; i++) {
          const card = createCard({
            id: createCardId(),
            name: `Card ${index}-${i}`,
            text: `Player ${index + 1}'s card ${i + 1}`,
            type: 'Spell',
            owner: player.id,
            currentZone: deck.id,
            properties: { manaCost: i + 1 }
          })
          cards.push(card)
          // Add the card to the deck zone
          deck = addCardToZone(deck, card.id) as any
        }
        
        zones.push(deck, hand)
      })

      const game = createGame({
        id: createGameId(),
        players,
        zones,
        cards,
        currentPlayer: player1Id,
        phase: 'main',
        turnNumber: 1
      })

      // Perform multiple operations and verify consistency
      const operations = [
        () => executeAction(game, drawCards({ playerId: player1Id, count: 2 })),
        (g: Game) => executeAction(g, drawCards({ playerId: player2Id, count: 1 })),
        (g: Game) => executeAction(g, modifyStat({ target: player1Id, stat: 'life', value: -5 })),
        (g: Game) => executeAction(g, modifyStat({ target: player2Id, stat: 'mana', value: -3 }))
      ]

      let currentGame = game
      operations.forEach((operation, _index) => {
        const previousGame = currentGame
        currentGame = operation(currentGame)

        // Verify immutability
        expect(currentGame).not.toBe(previousGame)
        
        // Verify basic invariants
        expect(currentGame.players).toHaveLength(3)
        expect(currentGame.cards).toHaveLength(9)
        expect(currentGame.zones.length).toBeGreaterThanOrEqual(6) // At least 6 player zones
        
        // Verify IDs are preserved
        expect(currentGame.id).toBe(game.id)
        expect(currentGame.players.map(p => p.id)).toEqual(game.players.map(p => p.id))
      })

      // Verify final state
      const finalPlayer1 = currentGame.players.find(p => p.id.value === player1Id.value)!
      const finalPlayer2 = currentGame.players.find(p => p.id.value === player2Id.value)!

      expect(finalPlayer1.resources.life).toBe(25) // 30 - 5
      expect(finalPlayer2.resources.mana).toBe(5)  // 8 - 3

      // Verify cards were moved correctly
      const player1Hand = currentGame.zones.find(z => 
        z.owner?.value === player1Id.value && 
        'type' in z && (z as any).type === 'hand'
      )!
      const player2Hand = currentGame.zones.find(z => 
        z.owner?.value === player2Id.value && 
        'type' in z && (z as any).type === 'hand'
      )!

      expect(player1Hand.cards).toHaveLength(2)
      expect(player2Hand.cards).toHaveLength(1)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle invalid operations gracefully without corrupting state', () => {
      const player1Id = createPlayerId()
      const nonExistentCardId = createCardId()
      const nonExistentPlayerId = createPlayerId()

      const player1 = createPlayer({
        id: player1Id,
        name: 'Player 1',
        resources: { life: 20, mana: 2 }
      })

      const game = createGame({
        id: createGameId(),
        players: [player1],
        zones: [],
        cards: [],
        currentPlayer: player1Id,
        phase: 'main',
        turnNumber: 1
      })

      const originalGame = game

      // Try invalid operations
      const invalidOperations = [
        () => executeAction(game, drawCards({ playerId: nonExistentPlayerId, count: 1 })),
        () => executeAction(game, playCard({ cardId: nonExistentCardId, playerId: player1Id, targets: [] })),
        () => executeAction(game, tapCard({ cardId: nonExistentCardId })),
        () => executeAction(game, modifyStat({ target: nonExistentCardId, stat: 'power', value: 2 }))
      ]

      invalidOperations.forEach((operation) => {
        expect(() => operation()).toThrow()
        
        // Verify game state wasn't corrupted
        expect(game).toBe(originalGame)
        expect(game.players).toHaveLength(1)
        expect(game.cards).toHaveLength(0)
      })
    })

    it('should handle event listener errors without breaking event processing', () => {
      const player1Id = createPlayerId()
      const game = createGame({
        id: createGameId(),
        players: [createPlayer({ id: player1Id, name: 'Player 1' })],
        zones: [],
        cards: [],
        currentPlayer: player1Id
      })

      // Add listeners that will throw errors
      const errorListener = createEventListener({
        eventType: 'TEST_EVENT',
        callback: () => {
          throw new Error('Listener error')
        },
        priority: 1
      })

      const successListener = createEventListener({
        eventType: 'TEST_EVENT',
        callback: () => {
          return [createGameEvent({ type: 'SUCCESS_EVENT', payload: {} })]
        },
        priority: 2
      })

      let gameWithListeners = addEventListenerToGame(game, errorListener)
      gameWithListeners = addEventListenerToGame(gameWithListeners, successListener)

      // Publish test event
      const testEvent = createGameEvent({
        type: 'TEST_EVENT',
        payload: { test: true }
      })

      const gameWithEvent = {
        ...gameWithListeners,
        eventManager: publishEvent(gameWithListeners.eventManager, testEvent)
      }

      // Process events - should handle error gracefully
      const result = processEventQueue(gameWithEvent.eventManager, gameWithEvent)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Listener error')
      expect(result.processedEvents).toHaveLength(2) // Original + generated success
      expect(result.generatedEvents).toHaveLength(1)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large game states efficiently', () => {
      const startTime = Date.now()

      // Create large game state
      const playerCount = 10
      const cardsPerPlayer = 50

      const players = Array.from({ length: playerCount }, (_, i) => 
        createPlayer({
          id: createPlayerId(),
          name: `Player ${i + 1}`,
          resources: { life: 20, mana: 5 }
        })
      )

      const zones: Zone[] = []
      const cards: Card[] = []

      players.forEach((player, playerIndex) => {
        let deck = createDeck({ id: createZoneId(), owner: player.id })
        const hand = createHand({ id: createZoneId(), owner: player.id })
        
        // Add many cards
        for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex++) {
          const card = createCard({
            id: createCardId(),
            name: `Card ${playerIndex}-${cardIndex}`,
            text: `Card text ${cardIndex}`,
            type: 'Spell',
            owner: player.id,
            currentZone: deck.id,
            properties: { manaCost: (cardIndex % 5) + 1 }
          })
          cards.push(card)
          deck = addCardToZone(deck, card.id) as any
        }
        
        zones.push(deck, hand)
      })

      const game = createGame({
        id: createGameId(),
        players,
        zones,
        cards,
        currentPlayer: players[0].id,
        phase: 'main',
        turnNumber: 1
      })

      const setupTime = Date.now() - startTime

      // Perform operations on large state
      const operationStart = Date.now()
      
      let currentGame = game
      for (let i = 0; i < 10; i++) {
        const playerId = players[i % playerCount].id
        currentGame = executeAction(currentGame, drawCards({ playerId, count: 1 }))
      }

      const operationTime = Date.now() - operationStart

      // Verify performance is reasonable (adjust thresholds as needed)
      expect(setupTime).toBeLessThan(1000) // 1 second for setup
      expect(operationTime).toBeLessThan(500) // 0.5 seconds for operations

      // Verify correctness with large state
      expect(currentGame.players).toHaveLength(playerCount)
      expect(currentGame.cards).toHaveLength(playerCount * cardsPerPlayer)
      expect(currentGame.zones.length).toBeGreaterThanOrEqual(playerCount * 2) // At least 2 zones per player

      // Verify some cards were moved to hands
      const totalCardsInHands = currentGame.zones
        .filter(z => 'type' in z && (z as any).type === 'hand')
        .reduce((sum, zone) => sum + zone.cards.length, 0)
      
      expect(totalCardsInHands).toBe(10) // 10 draw operations
    })
  })
})