/**
 * @fileoverview Comprehensive tests for Game object
 * Following TDD approach - tests written first, implementation follows
 * The Game object is the master container that orchestrates all game state
 */

import { Game, Player, Card, GameId, PlayerId, CardId, ZoneId, Deck, Hand } from '@/types'
import { 
  createGame,
  updateGame,
  addPlayerToGame,
  removePlayerFromGame,
  addCardToGame,
  removeCardFromGame,
  addZoneToGame,
  removeZoneFromGame,
  setCurrentPlayer,
  nextPlayer,
  setGamePhase,
  advanceGamePhase,
  incrementTurnNumber,
  setGlobalProperty,
  getGlobalProperty,
  validateGame,
  getGamePlayer,
  getGameCard,
  getGameZone,
  isGameActive,
  getPlayerCount,
  getCardCount,
  getZoneCount
} from '@/core/primitives/game'
import { createPlayer } from '@/core/primitives/player'
import { createCard } from '@/core/primitives/card'
import { createDeck, createHand } from '@/core/primitives/zone'
import { createGameId, createPlayerId, createCardId, createZoneId } from '@/lib/utils'

describe('Game Object - TDD Implementation', () => {
  let mockGameId: GameId
  let mockPlayerId1: PlayerId
  let mockPlayerId2: PlayerId
  let mockCardId1: CardId
  let mockCardId2: CardId
  let mockZoneId1: ZoneId
  let mockZoneId2: ZoneId
  let testPlayer1: Player
  let testPlayer2: Player
  let testCard1: Card
  let testCard2: Card
  let testDeck: Deck
  let testHand: Hand

  beforeEach(() => {
    mockGameId = createGameId()
    mockPlayerId1 = createPlayerId()
    mockPlayerId2 = createPlayerId()
    mockCardId1 = createCardId()
    mockCardId2 = createCardId()
    mockZoneId1 = createZoneId()
    mockZoneId2 = createZoneId()

    testPlayer1 = createPlayer({
      id: mockPlayerId1,
      name: 'Player 1',
      resources: { life: 20, mana: 0 }
    })

    testPlayer2 = createPlayer({
      id: mockPlayerId2,
      name: 'Player 2',
      resources: { life: 20, mana: 0 }
    })

    testCard1 = createCard({
      id: mockCardId1,
      name: 'Lightning Bolt',
      text: 'Deal 3 damage',
      type: 'Instant',
      owner: mockPlayerId1,
      currentZone: mockZoneId1
    })

    testCard2 = createCard({
      id: mockCardId2,
      name: 'Grizzly Bears',
      text: '2/2 Creature',
      type: 'Creature',
      owner: mockPlayerId2,
      currentZone: mockZoneId2,
      properties: { power: 2, toughness: 2 }
    })

    testDeck = createDeck({
      id: mockZoneId1,
      owner: mockPlayerId1
    })

    testHand = createHand({
      id: mockZoneId2,
      owner: mockPlayerId1
    })
  })

  describe('Game Creation', () => {
    it('should create a game with all required properties', () => {
      const game = createGame({
        id: mockGameId,
        players: [testPlayer1, testPlayer2],
        zones: [testDeck, testHand],
        cards: [testCard1, testCard2],
        currentPlayer: mockPlayerId1,
        phase: 'main',
        turnNumber: 1
      })

      expect(game).toEqual({
        id: mockGameId,
        players: [testPlayer1, testPlayer2],
        zones: [testDeck, testHand],
        cards: [testCard1, testCard2],
        currentPlayer: mockPlayerId1,
        phase: 'main',
        turnNumber: 1,
        stack: expect.any(Object),
        globalProperties: {},
        eventManager: expect.any(Object)
      })

      // Verify stack is created
      expect(game.stack.type).toBe('stack')
      expect(game.stack.name).toBe('Stack')
      expect(game.stack.owner).toBeNull()
    })

    it('should create a minimal game with defaults', () => {
      const game = createGame({
        id: mockGameId
      })

      expect(game.players).toEqual([])
      expect(game.zones).toEqual([])
      expect(game.cards).toEqual([])
      expect(game.currentPlayer).toBeUndefined()
      expect(game.phase).toBe('setup')
      expect(game.turnNumber).toBe(0)
      expect(game.globalProperties).toEqual({})
    })

    it('should create game with initial global properties', () => {
      const game = createGame({
        id: mockGameId,
        globalProperties: { maxHandSize: 7, startingLife: 20 }
      })

      expect(game.globalProperties).toEqual({ maxHandSize: 7, startingLife: 20 })
    })

    it('should validate game creation parameters', () => {
      expect(() => createGame({
        id: { value: '' } as GameId // Invalid ID
      })).toThrow('Invalid game ID')
    })

    it('should ensure all players have unique IDs', () => {
      const duplicatePlayer = createPlayer({
        id: mockPlayerId1, // Same ID as testPlayer1
        name: 'Duplicate Player'
      })

      expect(() => createGame({
        id: mockGameId,
        players: [testPlayer1, duplicatePlayer]
      })).toThrow('Duplicate player ID')
    })

    it('should ensure all cards have unique IDs', () => {
      const duplicateCard = createCard({
        id: mockCardId1, // Same ID as testCard1
        name: 'Duplicate Card',
        text: 'Duplicate',
        type: 'Instant',
        owner: mockPlayerId1,
        currentZone: mockZoneId1
      })

      expect(() => createGame({
        id: mockGameId,
        cards: [testCard1, duplicateCard]
      })).toThrow('Duplicate card ID')
    })

    it('should ensure all zones have unique IDs', () => {
      const duplicateZone = createHand({
        id: mockZoneId1, // Same ID as testDeck
        owner: mockPlayerId1
      })

      expect(() => createGame({
        id: mockGameId,
        zones: [testDeck, duplicateZone]
      })).toThrow('Duplicate zone ID')
    })

    it('should validate current player exists in game', () => {
      const nonExistentPlayerId = createPlayerId()

      expect(() => createGame({
        id: mockGameId,
        players: [testPlayer1],
        currentPlayer: nonExistentPlayerId
      })).toThrow('Current player not found in game')
    })
  })

  describe('Game Immutability', () => {
    let originalGame: Game

    beforeEach(() => {
      originalGame = createGame({
        id: mockGameId,
        players: [testPlayer1],
        zones: [testDeck],
        cards: [testCard1],
        currentPlayer: mockPlayerId1,
        phase: 'main',
        turnNumber: 1,
        globalProperties: { maxHandSize: 7 }
      })
    })

    it('should return new game instance when updating properties', () => {
      const updatedGame = updateGame(originalGame, {
        phase: 'combat'
      })

      expect(updatedGame).not.toBe(originalGame) // Different instances
      expect(originalGame.phase).toBe('main') // Original unchanged
      expect(updatedGame.phase).toBe('combat') // New instance updated
      expect(updatedGame.id).toBe(originalGame.id) // ID preserved
    })

    it('should not mutate original arrays when updating', () => {
      const originalPlayers = [...originalGame.players]
      
      updateGame(originalGame, {
        players: [testPlayer1, testPlayer2]
      })

      expect(originalGame.players).toEqual(originalPlayers)
    })

    it('should preserve all unchanged properties during updates', () => {
      const updatedGame = updateGame(originalGame, {
        turnNumber: 2
      })

      expect(updatedGame.players).toBe(originalGame.players) // Reference equality for unchanged
      expect(updatedGame.zones).toBe(originalGame.zones)
      expect(updatedGame.cards).toBe(originalGame.cards)
      expect(updatedGame.phase).toBe(originalGame.phase)
      expect(updatedGame.globalProperties).toBe(originalGame.globalProperties)
    })
  })

  describe('Player Management', () => {
    let game: Game

    beforeEach(() => {
      game = createGame({
        id: mockGameId,
        players: [testPlayer1]
      })
    })

    it('should add players to game', () => {
      const updatedGame = addPlayerToGame(game, testPlayer2)

      expect(updatedGame.players).toEqual([testPlayer1, testPlayer2])
      expect(game.players).toEqual([testPlayer1]) // Original unchanged
    })

    it('should not add duplicate players', () => {
      expect(() => addPlayerToGame(game, testPlayer1))
        .toThrow('Player already in game')
    })

    it('should remove players from game', () => {
      const gameWithTwoPlayers = addPlayerToGame(game, testPlayer2)
      const updatedGame = removePlayerFromGame(gameWithTwoPlayers, mockPlayerId1)

      expect(updatedGame.players).toEqual([testPlayer2])
    })

    it('should handle removing non-existent player', () => {
      expect(() => removePlayerFromGame(game, mockPlayerId2))
        .toThrow('Player not found in game')
    })

    it('should get player by ID', () => {
      const player = getGamePlayer(game, mockPlayerId1)
      expect(player).toBe(testPlayer1)

      const nonExistentPlayer = getGamePlayer(game, mockPlayerId2)
      expect(nonExistentPlayer).toBeUndefined()
    })

    it('should get player count', () => {
      expect(getPlayerCount(game)).toBe(1)

      const gameWithTwoPlayers = addPlayerToGame(game, testPlayer2)
      expect(getPlayerCount(gameWithTwoPlayers)).toBe(2)
    })
  })

  describe('Current Player Management', () => {
    let game: Game

    beforeEach(() => {
      game = createGame({
        id: mockGameId,
        players: [testPlayer1, testPlayer2],
        currentPlayer: mockPlayerId1
      })
    })

    it('should set current player', () => {
      const updatedGame = setCurrentPlayer(game, mockPlayerId2)

      expect(updatedGame.currentPlayer).toBe(mockPlayerId2)
      expect(game.currentPlayer).toBe(mockPlayerId1) // Original unchanged
    })

    it('should validate current player exists', () => {
      const nonExistentPlayerId = createPlayerId()

      expect(() => setCurrentPlayer(game, nonExistentPlayerId))
        .toThrow('Player not found in game')
    })

    it('should advance to next player', () => {
      const updatedGame = nextPlayer(game)

      expect(updatedGame.currentPlayer).toBe(mockPlayerId2)
    })

    it('should wrap around to first player', () => {
      const gameWithPlayer2Current = setCurrentPlayer(game, mockPlayerId2)
      const updatedGame = nextPlayer(gameWithPlayer2Current)

      expect(updatedGame.currentPlayer).toBe(mockPlayerId1)
    })

    it('should handle single player game', () => {
      const singlePlayerGame = createGame({
        id: mockGameId,
        players: [testPlayer1],
        currentPlayer: mockPlayerId1
      })

      const updatedGame = nextPlayer(singlePlayerGame)
      expect(updatedGame.currentPlayer).toBe(mockPlayerId1)
    })

    it('should handle no current player', () => {
      const noCurrentPlayerGame = createGame({
        id: mockGameId,
        players: [testPlayer1, testPlayer2]
      })

      const updatedGame = nextPlayer(noCurrentPlayerGame)
      expect(updatedGame.currentPlayer).toBe(mockPlayerId1) // First player
    })
  })

  describe('Phase and Turn Management', () => {
    let game: Game

    beforeEach(() => {
      game = createGame({
        id: mockGameId,
        players: [testPlayer1],
        phase: 'main',
        turnNumber: 1
      })
    })

    it('should set game phase', () => {
      const updatedGame = setGamePhase(game, 'combat')

      expect(updatedGame.phase).toBe('combat')
      expect(game.phase).toBe('main') // Original unchanged
    })

    it('should advance through predefined phases', () => {
      let currentGame = setGamePhase(game, 'upkeep')

      // Advance through each phase
      currentGame = advanceGamePhase(currentGame)
      expect(currentGame.phase).toBe('main')

      currentGame = advanceGamePhase(currentGame)
      expect(currentGame.phase).toBe('combat')

      currentGame = advanceGamePhase(currentGame)
      expect(currentGame.phase).toBe('end')

      // Should wrap around
      currentGame = advanceGamePhase(currentGame)
      expect(currentGame.phase).toBe('upkeep')
    })

    it('should increment turn number', () => {
      const updatedGame = incrementTurnNumber(game)

      expect(updatedGame.turnNumber).toBe(2)
      expect(game.turnNumber).toBe(1) // Original unchanged
    })

    it('should handle turn number overflow', () => {
      const highTurnGame = updateGame(game, { turnNumber: Number.MAX_SAFE_INTEGER })
      
      expect(() => incrementTurnNumber(highTurnGame))
        .toThrow('Turn number overflow')
    })
  })

  describe('Global Properties', () => {
    let game: Game

    beforeEach(() => {
      game = createGame({
        id: mockGameId,
        globalProperties: { maxHandSize: 7, startingLife: 20 }
      })
    })

    it('should set global properties', () => {
      const updatedGame = setGlobalProperty(game, 'maxDeckSize', 60)

      expect(updatedGame.globalProperties.maxDeckSize).toBe(60)
      expect(updatedGame.globalProperties.maxHandSize).toBe(7) // Existing preserved
      expect(game.globalProperties.maxDeckSize).toBeUndefined() // Original unchanged
    })

    it('should get global properties', () => {
      expect(getGlobalProperty(game, 'maxHandSize')).toBe(7)
      expect(getGlobalProperty(game, 'nonexistent')).toBeUndefined()
    })

    it('should handle complex property values', () => {
      const complexValue = { rules: ['flying', 'trample'], costs: { white: 1, blue: 2 } }
      const updatedGame = setGlobalProperty(game, 'abilities', complexValue)

      expect(updatedGame.globalProperties.abilities).toEqual(complexValue)
    })
  })

  describe('Card and Zone Management', () => {
    let game: Game

    beforeEach(() => {
      game = createGame({
        id: mockGameId,
        cards: [testCard1],
        zones: [testDeck]
      })
    })

    it('should add cards to game', () => {
      const updatedGame = addCardToGame(game, testCard2)

      expect(updatedGame.cards).toEqual([testCard1, testCard2])
      expect(game.cards).toEqual([testCard1]) // Original unchanged
    })

    it('should not add duplicate cards', () => {
      expect(() => addCardToGame(game, testCard1))
        .toThrow('Card already in game')
    })

    it('should remove cards from game', () => {
      const updatedGame = removeCardFromGame(game, mockCardId1)

      expect(updatedGame.cards).toEqual([])
    })

    it('should handle removing non-existent card', () => {
      expect(() => removeCardFromGame(game, mockCardId2))
        .toThrow('Card not found in game')
    })

    it('should add zones to game', () => {
      const updatedGame = addZoneToGame(game, testHand)

      expect(updatedGame.zones).toEqual([testDeck, testHand])
    })

    it('should remove zones from game', () => {
      const updatedGame = removeZoneFromGame(game, mockZoneId1)

      expect(updatedGame.zones).toEqual([])
    })

    it('should get card by ID', () => {
      const card = getGameCard(game, mockCardId1)
      expect(card).toBe(testCard1)
    })

    it('should get zone by ID', () => {
      const zone = getGameZone(game, mockZoneId1)
      expect(zone).toBe(testDeck)
    })

    it('should get counts', () => {
      expect(getCardCount(game)).toBe(1)
      expect(getZoneCount(game)).toBe(1)
    })
  })

  describe('Game Validation', () => {
    it('should validate correct game structure', () => {
      const validGame = createGame({
        id: mockGameId,
        players: [testPlayer1],
        zones: [testDeck],
        cards: [testCard1]
      })

      expect(() => validateGame(validGame)).not.toThrow()
    })

    it('should reject games with invalid structure', () => {
      const invalidGame = {
        id: mockGameId,
        // Missing required fields
      } as any

      expect(() => validateGame(invalidGame)).toThrow()
    })

    it('should validate stack is present', () => {
      const gameWithoutStack = {
        id: mockGameId,
        players: [],
        zones: [],
        cards: [],
        currentPlayer: undefined,
        phase: 'setup',
        turnNumber: 0,
        globalProperties: {}
        // Missing stack
      } as any

      expect(() => validateGame(gameWithoutStack)).toThrow('Game must have a stack')
    })
  })

  describe('Game State Queries', () => {
    let game: Game

    beforeEach(() => {
      game = createGame({
        id: mockGameId,
        players: [testPlayer1, testPlayer2],
        currentPlayer: mockPlayerId1,
        phase: 'main',
        turnNumber: 5
      })
    })

    it('should check if game is active', () => {
      expect(isGameActive(game)).toBe(true)

      const setupGame = setGamePhase(game, 'setup')
      expect(isGameActive(setupGame)).toBe(false)

      const endedGame = setGamePhase(game, 'ended')
      expect(isGameActive(endedGame)).toBe(false)
    })

    it('should handle game with no players', () => {
      const emptyGame = createGame({ id: mockGameId })
      expect(isGameActive(emptyGame)).toBe(false)
    })

    it('should handle game with no current player', () => {
      const noCurrentPlayerGame = updateGame(game, { currentPlayer: undefined })
      expect(isGameActive(noCurrentPlayerGame)).toBe(false)
    })
  })
})