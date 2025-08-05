/**
 * @fileoverview Comprehensive tests for Event System
 * Following TDD approach - tests written first, implementation follows
 * Events are the LOGIC that connects actions to reactive triggers
 */

import { Game, Player, Card, GameEvent, EventManager } from '@/types'
import { 
  createEventManager,
  publishEvent,
  subscribeToEvent,
  unsubscribeFromEvent,
  processEvents,
  createEventListener,
  addEventListenerToGame,
  removeEventListenerFromGame,
  getActiveListeners,
  clearAllListeners,
  createGameEvent,
  validateEventListener
} from '@/core/events'
import { createGame } from '@/core/primitives/game'
import { createPlayer } from '@/core/primitives/player'
import { createCard } from '@/core/primitives/card'
import { createDeck, createHand } from '@/core/primitives/zone'
import { createGameId, createPlayerId, createCardId, createZoneId } from '@/lib/utils'

describe('Event System - TDD Implementation', () => {
  let game: Game
  let player1: Player
  let player2: Player
  let card1: Card
  let card2: Card
  let eventManager: EventManager

  beforeEach(() => {
    // Set up basic game state
    const gameId = createGameId()
    const player1Id = createPlayerId()
    const player2Id = createPlayerId()
    const card1Id = createCardId()
    const card2Id = createCardId()
    const deckId = createZoneId()
    const handId = createZoneId()

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

    card1 = createCard({
      id: card1Id,
      name: 'Lightning Bolt',
      text: 'Deal 3 damage to any target',
      type: 'Instant',
      owner: player1Id,
      currentZone: handId,
      properties: { manaCost: 1, damage: 3 }
    })

    card2 = createCard({
      id: card2Id,
      name: 'Healing Potion',
      text: 'Gain 5 life',
      type: 'Sorcery',
      owner: player1Id,
      currentZone: deckId,
      properties: { manaCost: 2, healing: 5 }
    })

    const deck = createDeck({ id: deckId, owner: player1Id })
    const hand = createHand({ id: handId, owner: player1Id })

    game = createGame({
      id: gameId,
      players: [player1, player2],
      zones: [deck, hand],
      cards: [card1, card2],
      currentPlayer: player1Id,
      phase: 'main',
      turnNumber: 1
    })

    eventManager = createEventManager()
  })

  describe('Event Manager Creation', () => {
    it('should create an event manager with empty state', () => {
      const manager = createEventManager()

      expect(manager.listeners).toEqual([])
      expect(manager.eventQueue).toEqual([])
      expect(manager.isProcessing).toBe(false)
    })

    it('should allow configuration of event manager', () => {
      const manager = createEventManager({
        maxQueueSize: 100,
        enableLogging: true
      })

      expect(manager.maxQueueSize).toBe(100)
      expect(manager.enableLogging).toBe(true)
    })
  })

  describe('Event Creation', () => {
    it('should create game events with required properties', () => {
      const event = createGameEvent({
        type: 'CARD_PLAYED',
        payload: {
          cardId: card1.id,
          playerId: player1.id
        },
        triggeredBy: player1.id
      })

      expect(event.type).toBe('CARD_PLAYED')
      expect(event.payload.cardId).toBe(card1.id)
      expect(event.payload.playerId).toBe(player1.id)
      expect(event.triggeredBy).toBe(player1.id)
      expect(event.timestamp).toBeInstanceOf(Date)
    })

    it('should create system events without triggeredBy', () => {
      const event = createGameEvent({
        type: 'TURN_START',
        payload: { playerId: player1.id }
      })

      expect(event.triggeredBy).toBe('system')
    })

    it('should include unique event ID', () => {
      const event1 = createGameEvent({
        type: 'TEST_EVENT',
        payload: {}
      })

      const event2 = createGameEvent({
        type: 'TEST_EVENT',
        payload: {}
      })

      expect(event1.id).toBeDefined()
      expect(event2.id).toBeDefined()
      expect(event1.id).not.toBe(event2.id)
    })
  })

  describe('Event Listener Creation', () => {
    it('should create event listeners with callback functions', () => {
      const callback = jest.fn()
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback,
        priority: 1
      })

      expect(listener.eventType).toBe('CARD_PLAYED')
      expect(listener.callback).toBe(callback)
      expect(listener.priority).toBe(1)
      expect(listener.id).toBeDefined()
    })

    it('should create listeners with conditions', () => {
      const condition = (event: GameEvent) => event.payload.damage > 2
      const callback = jest.fn()
      
      const listener = createEventListener({
        eventType: 'DAMAGE_DEALT',
        condition,
        callback
      })

      expect(listener.condition).toBe(condition)
    })

    it('should validate listener configuration', () => {
      expect(() => createEventListener({
        eventType: '',
        callback: jest.fn()
      })).toThrow('Event type cannot be empty')

      expect(() => createEventListener({
        eventType: 'VALID_EVENT',
        callback: null as any
      })).toThrow('Callback must be a function')
    })

    it('should assign default priority if not provided', () => {
      const listener = createEventListener({
        eventType: 'TEST_EVENT',
        callback: jest.fn()
      })

      expect(listener.priority).toBe(0)
    })
  })

  describe('Event Subscription', () => {
    it('should add listeners to event manager', () => {
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      const updatedManager = subscribeToEvent(eventManager, listener)

      expect(updatedManager.listeners).toContain(listener)
      expect(eventManager.listeners).not.toContain(listener) // Original unchanged
    })

    it('should prevent duplicate listener IDs', () => {
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      const manager = subscribeToEvent(eventManager, listener)
      
      expect(() => subscribeToEvent(manager, listener))
        .toThrow('Listener with this ID already exists')
    })

    it('should sort listeners by priority', () => {
      const listener1 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn(),
        priority: 3
      })

      const listener2 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn(),
        priority: 1
      })

      const listener3 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn(),
        priority: 2
      })

      let manager = subscribeToEvent(eventManager, listener1)
      manager = subscribeToEvent(manager, listener2)
      manager = subscribeToEvent(manager, listener3)

      const cardPlayedListeners = manager.listeners.filter(l => l.eventType === 'CARD_PLAYED')
      expect(cardPlayedListeners[0].priority).toBe(1)
      expect(cardPlayedListeners[1].priority).toBe(2)
      expect(cardPlayedListeners[2].priority).toBe(3)
    })
  })

  describe('Event Unsubscription', () => {
    it('should remove listeners by ID', () => {
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      let manager = subscribeToEvent(eventManager, listener)
      manager = unsubscribeFromEvent(manager, listener.id)

      expect(manager.listeners).not.toContain(listener)
    })

    it('should handle removing non-existent listeners', () => {
      expect(() => unsubscribeFromEvent(eventManager, 'non-existent-id'))
        .toThrow('Listener not found')
    })

    it('should clear all listeners', () => {
      const listener1 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      const listener2 = createEventListener({
        eventType: 'DAMAGE_DEALT',
        callback: jest.fn()
      })

      let manager = subscribeToEvent(eventManager, listener1)
      manager = subscribeToEvent(manager, listener2)
      manager = clearAllListeners(manager)

      expect(manager.listeners).toEqual([])
    })
  })

  describe('Event Publishing', () => {
    it('should add events to the queue', () => {
      const event = createGameEvent({
        type: 'CARD_PLAYED',
        payload: { cardId: card1.id }
      })

      const updatedManager = publishEvent(eventManager, event)

      expect(updatedManager.eventQueue).toContain(event)
    })

    it('should handle queue overflow', () => {
      const smallQueueManager = createEventManager({ maxQueueSize: 2 })
      
      const event1 = createGameEvent({ type: 'EVENT_1', payload: {} })
      const event2 = createGameEvent({ type: 'EVENT_2', payload: {} })
      const event3 = createGameEvent({ type: 'EVENT_3', payload: {} })

      let manager = publishEvent(smallQueueManager, event1)
      manager = publishEvent(manager, event2)

      expect(() => publishEvent(manager, event3))
        .toThrow('Event queue is full')
    })
  })

  describe('Event Processing', () => {
    it('should execute matching listeners for events', () => {
      const callback = jest.fn()
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback
      })

      let manager = subscribeToEvent(eventManager, listener)

      const event = createGameEvent({
        type: 'CARD_PLAYED',
        payload: { cardId: card1.id }
      })

      manager = publishEvent(manager, event)
      const result = processEvents(manager, game)

      expect(callback).toHaveBeenCalledWith(event, game)
      expect(result.manager.eventQueue).toEqual([]) // Queue should be empty after processing
    })

    it('should execute listeners in priority order', () => {
      const callOrder: number[] = []

      const listener1 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: () => { callOrder.push(1); return []; },
        priority: 3
      })

      const listener2 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: () => { callOrder.push(2); return []; },
        priority: 1
      })

      const listener3 = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: () => { callOrder.push(3); return []; },
        priority: 2
      })

      let manager = subscribeToEvent(eventManager, listener1)
      manager = subscribeToEvent(manager, listener2)
      manager = subscribeToEvent(manager, listener3)

      const event = createGameEvent({
        type: 'CARD_PLAYED',
        payload: { cardId: card1.id }
      })

      manager = publishEvent(manager, event)
      processEvents(manager, game)

      expect(callOrder).toEqual([2, 3, 1]) // Priority 1, 2, 3
    })

    it('should apply conditions before executing callbacks', () => {
      const callback = jest.fn()
      const condition = (event: GameEvent) => event.payload.damage > 5

      const listener = createEventListener({
        eventType: 'DAMAGE_DEALT',
        condition,
        callback
      })

      let manager = subscribeToEvent(eventManager, listener)

      // Event that should not trigger (damage <= 5)
      const lowDamageEvent = createGameEvent({
        type: 'DAMAGE_DEALT',
        payload: { damage: 3 }
      })

      manager = publishEvent(manager, lowDamageEvent)
      processEvents(manager, game)

      expect(callback).not.toHaveBeenCalled()

      // Event that should trigger (damage > 5)
      const highDamageEvent = createGameEvent({
        type: 'DAMAGE_DEALT',
        payload: { damage: 8 }
      })

      manager = publishEvent(manager, highDamageEvent)
      processEvents(manager, game)

      expect(callback).toHaveBeenCalledWith(highDamageEvent, game)
    })

    it('should handle errors in callbacks gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error')
      })
      
      const successCallback = jest.fn()

      const errorListener = createEventListener({
        eventType: 'TEST_EVENT',
        callback: errorCallback,
        priority: 1
      })

      const successListener = createEventListener({
        eventType: 'TEST_EVENT',
        callback: successCallback,
        priority: 2
      })

      let manager = subscribeToEvent(eventManager, errorListener)
      manager = subscribeToEvent(manager, successListener)

      const event = createGameEvent({
        type: 'TEST_EVENT',
        payload: {}
      })

      manager = publishEvent(manager, event)
      const result = processEvents(manager, game)

      expect(errorCallback).toHaveBeenCalled()
      expect(successCallback).toHaveBeenCalled() // Should still execute
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Callback error')
    })
  })

  describe('Game Integration', () => {
    it('should add event listeners to game state', () => {
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      const updatedGame = addEventListenerToGame(game, listener)

      expect(updatedGame.eventManager.listeners).toContain(listener)
    })

    it('should remove event listeners from game state', () => {
      const listener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      let updatedGame = addEventListenerToGame(game, listener)
      updatedGame = removeEventListenerFromGame(updatedGame, listener.id)

      expect(updatedGame.eventManager.listeners).not.toContain(listener)
    })

    it('should get active listeners for specific event types', () => {
      const cardListener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      const damageListener = createEventListener({
        eventType: 'DAMAGE_DEALT',
        callback: jest.fn()
      })

      let updatedGame = addEventListenerToGame(game, cardListener)
      updatedGame = addEventListenerToGame(updatedGame, damageListener)

      const cardListeners = getActiveListeners(updatedGame, 'CARD_PLAYED')
      expect(cardListeners).toEqual([cardListener])

      const allListeners = getActiveListeners(updatedGame)
      expect(allListeners).toHaveLength(2)
    })
  })

  describe('Built-in Event Types', () => {
    it('should define standard event types', () => {
      const eventTypes = [
        'TURN_START',
        'TURN_END',
        'CARD_PLAYED',
        'CARD_DRAWN',
        'CARD_ENTERS_ZONE',
        'DAMAGE_DEALT',
        'TARGET_SELECTED',
        'COMBAT_PHASE_START',
        'MANA_SPENT',
        'COUNTER_ADDED',
        'PLAYER_ELIMINATED'
      ]

      eventTypes.forEach(eventType => {
        const event = createGameEvent({
          type: eventType,
          payload: {}
        })
        expect(event.type).toBe(eventType)
      })
    })
  })

  describe('Complex Event Scenarios', () => {
    it('should handle cascading events', () => {
      const cascadeCallback = jest.fn((event: GameEvent) => {
        // When a card is played, deal damage to a player
        if (event.type === 'CARD_PLAYED') {
          return [
            createGameEvent({
              type: 'DAMAGE_DEALT',
              payload: {
                target: player2.id,
                amount: 3,
                source: event.payload.cardId
              }
            })
          ]
        }
        return []
      })

      const damageCallback = jest.fn()

      const cascadeListener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: cascadeCallback
      })

      const damageListener = createEventListener({
        eventType: 'DAMAGE_DEALT',
        callback: damageCallback
      })

      let manager = subscribeToEvent(eventManager, cascadeListener)
      manager = subscribeToEvent(manager, damageListener)

      const cardPlayedEvent = createGameEvent({
        type: 'CARD_PLAYED',
        payload: { cardId: card1.id, playerId: player1.id }
      })

      manager = publishEvent(manager, cardPlayedEvent)
      processEvents(manager, game)

      expect(cascadeCallback).toHaveBeenCalled()
      expect(damageCallback).toHaveBeenCalled()
    })

    it('should prevent infinite event loops', () => {
      const loopCallback = jest.fn((event: GameEvent) => {
        // This would create an infinite loop if not prevented
        return [
          createGameEvent({
            type: 'LOOP_EVENT',
            payload: { count: (event.payload.count || 0) + 1 }
          })
        ]
      })

      const listener = createEventListener({
        eventType: 'LOOP_EVENT',
        callback: loopCallback
      })

      let manager = subscribeToEvent(eventManager, listener)

      const initialEvent = createGameEvent({
        type: 'LOOP_EVENT',
        payload: { count: 1 }
      })

      manager = publishEvent(manager, initialEvent)
      const result = processEvents(manager, game)

      // Should stop after max recursion depth
      expect(loopCallback).toHaveBeenCalledTimes(10) // Assuming max depth of 10
      expect(result.errors).toContain('Maximum event recursion depth reached')
    })

    it('should handle multiple events of the same type', () => {
      const callback = jest.fn()
      const listener = createEventListener({
        eventType: 'DAMAGE_DEALT',
        callback
      })

      let manager = subscribeToEvent(eventManager, listener)

      // Multiple damage events
      const damage1 = createGameEvent({
        type: 'DAMAGE_DEALT',
        payload: { amount: 2 }
      })

      const damage2 = createGameEvent({
        type: 'DAMAGE_DEALT',
        payload: { amount: 3 }
      })

      manager = publishEvent(manager, damage1)
      manager = publishEvent(manager, damage2)
      processEvents(manager, game)

      expect(callback).toHaveBeenCalledTimes(2)
    })
  })

  describe('Event Validation', () => {
    it('should validate event listener structure', () => {
      const validListener = createEventListener({
        eventType: 'CARD_PLAYED',
        callback: jest.fn()
      })

      expect(validateEventListener(validListener)).toBe(true)

      const invalidListener = {
        eventType: 'CARD_PLAYED'
        // Missing callback
      } as any

      expect(validateEventListener(invalidListener)).toBe(false)
    })

    it('should validate event structure', () => {
      const validEvent = createGameEvent({
        type: 'CARD_PLAYED',
        payload: { cardId: card1.id }
      })

      expect(validEvent.type).toBeDefined()
      expect(validEvent.payload).toBeDefined()
      expect(validEvent.timestamp).toBeInstanceOf(Date)
    })
  })
})