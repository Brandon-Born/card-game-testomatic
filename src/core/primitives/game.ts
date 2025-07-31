/**
 * @fileoverview Game primitive implementation
 * Master container that orchestrates all game state with immutable operations
 * Following TDD approach - the supreme commander of the framework!
 */

import { Game, Player, Card, Zone, Stack, GameId, PlayerId, CardId, ZoneId } from '@/types'
import { isValidId, createZoneId } from '@/lib/utils'
import { createStack } from './zone'
import { createEventManager } from '@/core/events/event-manager'

// Game creation and validation

export interface CreateGameParams {
  id: GameId
  players?: Player[]
  zones?: Zone[]
  cards?: Card[]
  currentPlayer?: PlayerId
  phase?: string
  turnNumber?: number
  globalProperties?: Record<string, any>
  eventManager?: any
}

export function createGame(params: CreateGameParams): Game {
  validateGameCreation(params)

  // Create the global stack if not provided
  const stack = createStack({ id: createZoneId() })

  const game: Game = {
    id: params.id,
    players: params.players || [],
    zones: params.zones || [],
    cards: params.cards || [],
    currentPlayer: params.currentPlayer,
    phase: params.phase || 'setup',
    turnNumber: params.turnNumber || 0,
    stack,
    globalProperties: params.globalProperties || {},
    eventManager: params.eventManager || createEventManager()
  }

  // Additional validation after game creation
  validateGameState(game)

  return game
}

export function validateGameCreation(params: CreateGameParams): void {
  if (!isValidId(params.id)) {
    throw new Error('Invalid game ID')
  }

  if (params.players) {
    // Check for duplicate player IDs
    const playerIds = new Set()
    params.players.forEach(player => {
      if (playerIds.has(player.id.value)) {
        throw new Error('Duplicate player ID')
      }
      playerIds.add(player.id.value)
    })
  }

  if (params.cards) {
    // Check for duplicate card IDs
    const cardIds = new Set()
    params.cards.forEach(card => {
      if (cardIds.has(card.id.value)) {
        throw new Error('Duplicate card ID')
      }
      cardIds.add(card.id.value)
    })
  }

  if (params.zones) {
    // Check for duplicate zone IDs
    const zoneIds = new Set()
    params.zones.forEach(zone => {
      if (zoneIds.has(zone.id.value)) {
        throw new Error('Duplicate zone ID')
      }
      zoneIds.add(zone.id.value)
    })
  }

  if (params.currentPlayer && params.players) {
    const playerExists = params.players.some(player => 
      player.id.value === params.currentPlayer!.value
    )
    if (!playerExists) {
      throw new Error('Current player not found in game')
    }
  }

  if (params.turnNumber !== undefined && params.turnNumber < 0) {
    throw new Error('Turn number cannot be negative')
  }
}

export function validateGameState(game: Game): void {
  if (game.currentPlayer) {
    const playerExists = game.players.some(player => 
      player.id.value === game.currentPlayer!.value
    )
    if (!playerExists) {
      throw new Error('Current player not found in game')
    }
  }
}

// Game updates (immutable)

export function updateGame(game: Game, updates: Partial<Omit<Game, 'id'>>): Game {
  const updatedGame = {
    ...game,
    ...updates
  }

  // Validate if currentPlayer was updated
  if (updates.currentPlayer !== undefined) {
    validateGameState(updatedGame)
  }

  return updatedGame
}

// Player management

export function addPlayerToGame(game: Game, player: Player): Game {
  // Check if player already exists
  const existingPlayer = game.players.find(p => p.id.value === player.id.value)
  if (existingPlayer) {
    throw new Error('Player already in game')
  }

  return updateGame(game, {
    players: [...game.players, player]
  })
}

export function removePlayerFromGame(game: Game, playerId: PlayerId): Game {
  const playerIndex = game.players.findIndex(p => p.id.value === playerId.value)
  if (playerIndex === -1) {
    throw new Error('Player not found in game')
  }

  const newPlayers = [...game.players]
  newPlayers.splice(playerIndex, 1)

  // Clear current player if it was the removed player
  const updates: Partial<Game> = { players: newPlayers }
  if (game.currentPlayer?.value === playerId.value) {
    updates.currentPlayer = undefined
  }

  return updateGame(game, updates)
}

export function getGamePlayer(game: Game, playerId: PlayerId): Player | undefined {
  return game.players.find(player => player.id.value === playerId.value)
}

export function getPlayerCount(game: Game): number {
  return game.players.length
}

// Current player management

export function setCurrentPlayer(game: Game, playerId: PlayerId): Game {
  const player = getGamePlayer(game, playerId)
  if (!player) {
    throw new Error('Player not found in game')
  }

  return updateGame(game, { currentPlayer: playerId })
}

export function nextPlayer(game: Game): Game {
  if (game.players.length === 0) {
    return game
  }

  if (game.players.length === 1) {
    return updateGame(game, { currentPlayer: game.players[0].id })
  }

  if (!game.currentPlayer) {
    // No current player, set to first player
    return updateGame(game, { currentPlayer: game.players[0].id })
  }

  const currentIndex = game.players.findIndex(p => 
    p.id.value === game.currentPlayer!.value
  )

  if (currentIndex === -1) {
    // Current player not found, set to first player
    return updateGame(game, { currentPlayer: game.players[0].id })
  }

  const nextIndex = (currentIndex + 1) % game.players.length
  return updateGame(game, { currentPlayer: game.players[nextIndex].id })
}

// Phase and turn management

const GAME_PHASES = ['upkeep', 'main', 'combat', 'end']

export function setGamePhase(game: Game, phase: string): Game {
  return updateGame(game, { phase })
}

export function advanceGamePhase(game: Game): Game {
  const currentPhaseIndex = GAME_PHASES.indexOf(game.phase)
  
  if (currentPhaseIndex === -1) {
    // Unknown phase, go to first phase
    return setGamePhase(game, GAME_PHASES[0])
  }

  const nextPhaseIndex = (currentPhaseIndex + 1) % GAME_PHASES.length
  return setGamePhase(game, GAME_PHASES[nextPhaseIndex])
}

export function incrementTurnNumber(game: Game): Game {
  if (game.turnNumber >= Number.MAX_SAFE_INTEGER) {
    throw new Error('Turn number overflow')
  }

  return updateGame(game, { turnNumber: game.turnNumber + 1 })
}

// Global properties

export function setGlobalProperty(game: Game, key: string, value: any): Game {
  return updateGame(game, {
    globalProperties: {
      ...game.globalProperties,
      [key]: value
    }
  })
}

export function getGlobalProperty(game: Game, key: string): any {
  return game.globalProperties[key]
}

export function removeGlobalProperty(game: Game, key: string): Game {
  const { [key]: removed, ...remainingProperties } = game.globalProperties
  return updateGame(game, { globalProperties: remainingProperties })
}

// Card management

export function addCardToGame(game: Game, card: Card): Game {
  // Check if card already exists
  const existingCard = game.cards.find(c => c.id.value === card.id.value)
  if (existingCard) {
    throw new Error('Card already in game')
  }

  return updateGame(game, {
    cards: [...game.cards, card]
  })
}

export function removeCardFromGame(game: Game, cardId: CardId): Game {
  const cardIndex = game.cards.findIndex(c => c.id.value === cardId.value)
  if (cardIndex === -1) {
    throw new Error('Card not found in game')
  }

  const newCards = [...game.cards]
  newCards.splice(cardIndex, 1)

  return updateGame(game, { cards: newCards })
}

export function getGameCard(game: Game, cardId: CardId): Card | undefined {
  return game.cards.find(card => card.id.value === cardId.value)
}

export function getCardCount(game: Game): number {
  return game.cards.length
}

// Zone management

export function addZoneToGame(game: Game, zone: Zone): Game {
  // Check if zone already exists
  const existingZone = game.zones.find(z => z.id.value === zone.id.value)
  if (existingZone) {
    throw new Error('Zone already in game')
  }

  return updateGame(game, {
    zones: [...game.zones, zone]
  })
}

export function removeZoneFromGame(game: Game, zoneId: ZoneId): Game {
  const zoneIndex = game.zones.findIndex(z => z.id.value === zoneId.value)
  if (zoneIndex === -1) {
    throw new Error('Zone not found in game')
  }

  const newZones = [...game.zones]
  newZones.splice(zoneIndex, 1)

  return updateGame(game, { zones: newZones })
}

export function getGameZone(game: Game, zoneId: ZoneId): Zone | undefined {
  return game.zones.find(zone => zone.id.value === zoneId.value)
}

export function getZoneCount(game: Game): number {
  return game.zones.length
}

// Game validation

export function validateGame(game: any): asserts game is Game {
  if (!game || typeof game !== 'object') {
    throw new Error('Game must be an object')
  }

  const requiredFields = ['id', 'players', 'zones', 'cards', 'phase', 'turnNumber', 'stack', 'globalProperties']
  
  for (const field of requiredFields) {
    if (!(field in game)) {
      if (field === 'stack') {
        throw new Error('Game must have a stack')
      }
      throw new Error(`Game missing required field: ${field}`)
    }
  }

  if (!isValidId(game.id)) {
    throw new Error('Invalid game ID')
  }

  if (!Array.isArray(game.players)) {
    throw new Error('Players must be an array')
  }

  if (!Array.isArray(game.zones)) {
    throw new Error('Zones must be an array')
  }

  if (!Array.isArray(game.cards)) {
    throw new Error('Cards must be an array')
  }

  if (typeof game.phase !== 'string') {
    throw new Error('Phase must be a string')
  }

  if (typeof game.turnNumber !== 'number' || game.turnNumber < 0) {
    throw new Error('Turn number must be a non-negative number')
  }

  if (!game.stack || typeof game.stack !== 'object') {
    throw new Error('Game must have a stack')
  }

  if (!game.globalProperties || typeof game.globalProperties !== 'object') {
    throw new Error('Global properties must be an object')
  }

  if (game.currentPlayer && !isValidId(game.currentPlayer)) {
    throw new Error('Invalid current player ID')
  }

  // Validate current player exists in players array
  if (game.currentPlayer) {
    const playerExists = game.players.some((player: any) => 
      player?.id?.value === game.currentPlayer.value
    )
    if (!playerExists) {
      throw new Error('Current player not found in players')
    }
  }
}

// Game state queries

export function isGameActive(game: Game): boolean {
  // Game is active if it has players, a current player, and is not in setup or ended phase
  if (game.players.length === 0) {
    return false
  }

  if (!game.currentPlayer) {
    return false
  }

  if (game.phase === 'setup' || game.phase === 'ended') {
    return false
  }

  return true
}

export function getCurrentPlayer(game: Game): Player | undefined {
  if (!game.currentPlayer) {
    return undefined
  }
  return getGamePlayer(game, game.currentPlayer)
}

export function isPlayerInGame(game: Game, playerId: PlayerId): boolean {
  return getGamePlayer(game, playerId) !== undefined
}

export function getPlayersInTurnOrder(game: Game): Player[] {
  // Return players starting from current player
  if (!game.currentPlayer || game.players.length === 0) {
    return [...game.players]
  }

  const currentIndex = game.players.findIndex(p => 
    p.id.value === game.currentPlayer!.value
  )

  if (currentIndex === -1) {
    return [...game.players]
  }

  // Rearrange to start from current player
  return [
    ...game.players.slice(currentIndex),
    ...game.players.slice(0, currentIndex)
  ]
}

// Utility functions

export function getGameSummary(game: Game): {
  playerCount: number
  cardCount: number
  zoneCount: number
  currentPhase: string
  turnNumber: number
  isActive: boolean
} {
  return {
    playerCount: getPlayerCount(game),
    cardCount: getCardCount(game),
    zoneCount: getZoneCount(game),
    currentPhase: game.phase,
    turnNumber: game.turnNumber,
    isActive: isGameActive(game)
  }
}

export function copyGame(game: Game, newId: GameId): Game {
  return {
    ...game,
    id: newId,
    players: [...game.players],
    zones: [...game.zones],
    cards: [...game.cards],
    stack: { ...game.stack },
    globalProperties: { ...game.globalProperties }
  }
}

export function resetGame(game: Game): Game {
  return {
    ...game,
    players: [],
    zones: [],
    cards: [],
    currentPlayer: undefined,
    phase: 'setup',
    turnNumber: 0,
    stack: createStack({ id: createZoneId() }),
    globalProperties: {}
  }
}

export function startGame(game: Game): Game {
  if (game.players.length === 0) {
    throw new Error('Cannot start game with no players')
  }

  return updateGame(game, {
    phase: 'main',
    turnNumber: 1,
    currentPlayer: game.players[0].id
  })
}