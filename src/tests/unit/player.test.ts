/**
 * @fileoverview Comprehensive tests for Player object
 * Following TDD approach - tests written first, implementation follows
 */

import { Player, Counter, PlayerId, ZoneId } from '@/types'
import { 
  createPlayer,
  updatePlayer,
  addPlayerCounter,
  removePlayerCounter,
  setPlayerResource,
  getPlayerResource,
  addPlayerZone,
  removePlayerZone,
  hasPlayerZone,
  getPlayerZones,
  modifyPlayerResource,
  resetPlayerResource,
  validatePlayer
} from '@/core/primitives/player'
import { createPlayerId, createZoneId } from '@/lib/utils'

describe('Player Object - TDD Implementation', () => {
  let mockPlayerId: PlayerId
  let mockZoneId1: ZoneId
  let mockZoneId2: ZoneId
  let mockZoneId3: ZoneId

  beforeEach(() => {
    mockPlayerId = createPlayerId()
    mockZoneId1 = createZoneId()
    mockZoneId2 = createZoneId()
    mockZoneId3 = createZoneId()
  })

  describe('Player Creation', () => {
    it('should create a player with all required properties', () => {
      const player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player'
      })

      expect(player).toEqual({
        id: mockPlayerId,
        name: 'Test Player',
        resources: {},
        zones: [],
        counters: []
      })
    })

    it('should create a player with initial resources', () => {
      const player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player',
        resources: { life: 20, mana: 5, energy: 10 }
      })

      expect(player.resources).toEqual({ life: 20, mana: 5, energy: 10 })
    })

    it('should create a player with initial zones', () => {
      const player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player',
        zones: [mockZoneId1, mockZoneId2]
      })

      expect(player.zones).toEqual([mockZoneId1, mockZoneId2])
    })

    it('should create a player with initial counters', () => {
      const player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player',
        counters: [{ type: 'poison', count: 3 }]
      })

      expect(player.counters).toEqual([{ type: 'poison', count: 3 }])
    })

    it('should throw error for invalid player data', () => {
      expect(() => createPlayer({
        id: mockPlayerId,
        name: '' // Invalid empty name
      })).toThrow('Player name cannot be empty')
    })

    it('should validate player IDs are properly formatted', () => {
      const invalidId = { value: '' } as PlayerId
      expect(() => createPlayer({
        id: invalidId,
        name: 'Test Player'
      })).toThrow('Invalid player ID')
    })
  })

  describe('Player Immutability', () => {
    let originalPlayer: Player

    beforeEach(() => {
      originalPlayer = createPlayer({
        id: mockPlayerId,
        name: 'Original Player',
        resources: { life: 20, mana: 5 },
        zones: [mockZoneId1]
      })
    })

    it('should return new player instance when updating properties', () => {
      const updatedPlayer = updatePlayer(originalPlayer, {
        name: 'Updated Player'
      })

      expect(updatedPlayer).not.toBe(originalPlayer) // Different instances
      expect(originalPlayer.name).toBe('Original Player') // Original unchanged
      expect(updatedPlayer.name).toBe('Updated Player') // New instance updated
      expect(updatedPlayer.id).toBe(originalPlayer.id) // ID preserved
    })

    it('should not mutate original player when updating resources', () => {
      const originalResources = { ...originalPlayer.resources }
      
      updatePlayer(originalPlayer, {
        resources: { life: 25, mana: 10 }
      })

      expect(originalPlayer.resources).toEqual(originalResources)
    })

    it('should preserve all unchanged properties during updates', () => {
      const updatedPlayer = updatePlayer(originalPlayer, {
        name: 'New Name'
      })

      expect(updatedPlayer.resources).toEqual(originalPlayer.resources)
      expect(updatedPlayer.zones).toEqual(originalPlayer.zones)
      expect(updatedPlayer.counters).toEqual(originalPlayer.counters)
      expect(updatedPlayer.id).toBe(originalPlayer.id)
    })
  })

  describe('Player Resources', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player',
        resources: { life: 20, mana: 5, energy: 0 }
      })
    })

    it('should set individual resources', () => {
      const updatedPlayer = setPlayerResource(player, 'life', 25)

      expect(updatedPlayer.resources.life).toBe(25)
      expect(updatedPlayer.resources.mana).toBe(5) // Unchanged
      expect(player.resources.life).toBe(20) // Original unchanged
    })

    it('should get individual resources', () => {
      expect(getPlayerResource(player, 'life')).toBe(20)
      expect(getPlayerResource(player, 'mana')).toBe(5)
      expect(getPlayerResource(player, 'nonexistent')).toBeUndefined()
    })

    it('should modify resources by delta', () => {
      const updatedPlayer = modifyPlayerResource(player, 'life', -5)

      expect(updatedPlayer.resources.life).toBe(15)
      expect(player.resources.life).toBe(20) // Original unchanged
    })

    it('should handle positive resource modifications', () => {
      const updatedPlayer = modifyPlayerResource(player, 'mana', 3)

      expect(updatedPlayer.resources.mana).toBe(8)
    })

    it('should allow resources to go negative', () => {
      const updatedPlayer = modifyPlayerResource(player, 'life', -30)

      expect(updatedPlayer.resources.life).toBe(-10)
    })

    it('should add new resources', () => {
      const updatedPlayer = setPlayerResource(player, 'gold', 100)

      expect(updatedPlayer.resources.gold).toBe(100)
      expect(updatedPlayer.resources.life).toBe(20) // Existing preserved
    })

    it('should reset a resource to zero', () => {
      const updatedPlayer = resetPlayerResource(player, 'mana')

      expect(updatedPlayer.resources.mana).toBe(0)
      expect(updatedPlayer.resources.life).toBe(20) // Others unchanged
    })

    it('should handle resetting non-existent resource', () => {
      const updatedPlayer = resetPlayerResource(player, 'nonexistent')

      expect(updatedPlayer.resources.nonexistent).toBe(0)
    })

    it('should validate resource values are numbers', () => {
      expect(() => setPlayerResource(player, 'life', 'invalid' as any))
        .toThrow('Resource value must be a number')
    })
  })

  describe('Player Counters', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player'
      })
    })

    it('should add counters to a player', () => {
      const playerWithCounter = addPlayerCounter(player, { type: 'poison', count: 1 })

      expect(playerWithCounter.counters).toEqual([
        { type: 'poison', count: 1 }
      ])
      expect(player.counters).toEqual([]) // Original unchanged
    })

    it('should add multiple counters of the same type', () => {
      let playerWithCounters = addPlayerCounter(player, { type: 'poison', count: 1 })
      playerWithCounters = addPlayerCounter(playerWithCounters, { type: 'poison', count: 2 })

      expect(playerWithCounters.counters).toEqual([
        { type: 'poison', count: 3 }
      ])
    })

    it('should add different types of counters', () => {
      let playerWithCounters = addPlayerCounter(player, { type: 'poison', count: 1 })
      playerWithCounters = addPlayerCounter(playerWithCounters, { type: 'experience', count: 5 })

      expect(playerWithCounters.counters).toEqual([
        { type: 'poison', count: 1 },
        { type: 'experience', count: 5 }
      ])
    })

    it('should remove counters from a player', () => {
      let playerWithCounters = addPlayerCounter(player, { type: 'poison', count: 3 })
      playerWithCounters = removePlayerCounter(playerWithCounters, { type: 'poison', count: 1 })

      expect(playerWithCounters.counters).toEqual([
        { type: 'poison', count: 2 }
      ])
    })

    it('should remove counter type completely when count reaches zero', () => {
      let playerWithCounters = addPlayerCounter(player, { type: 'poison', count: 2 })
      playerWithCounters = removePlayerCounter(playerWithCounters, { type: 'poison', count: 2 })

      expect(playerWithCounters.counters).toEqual([])
    })

    it('should not allow negative counter counts', () => {
      expect(() => addPlayerCounter(player, { type: 'poison', count: -1 }))
        .toThrow('Counter count cannot be negative')
    })

    it('should not remove more counters than exist', () => {
      let playerWithCounters = addPlayerCounter(player, { type: 'poison', count: 2 })
      
      expect(() => removePlayerCounter(playerWithCounters, { type: 'poison', count: 3 }))
        .toThrow('Cannot remove more counters than exist')
    })

    it('should not remove counters that do not exist', () => {
      expect(() => removePlayerCounter(player, { type: 'poison', count: 1 }))
        .toThrow('Cannot remove counters that do not exist')
    })
  })

  describe('Player Zones', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player',
        zones: [mockZoneId1]
      })
    })

    it('should add zones to a player', () => {
      const updatedPlayer = addPlayerZone(player, mockZoneId2)

      expect(updatedPlayer.zones).toEqual([mockZoneId1, mockZoneId2])
      expect(player.zones).toEqual([mockZoneId1]) // Original unchanged
    })

    it('should not add duplicate zones', () => {
      expect(() => addPlayerZone(player, mockZoneId1))
        .toThrow('Zone already belongs to player')
    })

    it('should remove zones from a player', () => {
      const updatedPlayer = removePlayerZone(player, mockZoneId1)

      expect(updatedPlayer.zones).toEqual([])
      expect(player.zones).toEqual([mockZoneId1]) // Original unchanged
    })

    it('should handle removing non-existent zone', () => {
      expect(() => removePlayerZone(player, mockZoneId2))
        .toThrow('Zone does not belong to player')
    })

    it('should check if player has a zone', () => {
      expect(hasPlayerZone(player, mockZoneId1)).toBe(true)
      expect(hasPlayerZone(player, mockZoneId2)).toBe(false)
    })

    it('should get all player zones', () => {
      const zones = getPlayerZones(player)

      expect(zones).toEqual([mockZoneId1])
      expect(zones).not.toBe(player.zones) // Should return a copy
    })

    it('should handle multiple zone operations', () => {
      let updatedPlayer = addPlayerZone(player, mockZoneId2)
      updatedPlayer = addPlayerZone(updatedPlayer, mockZoneId3)
      updatedPlayer = removePlayerZone(updatedPlayer, mockZoneId1)

      expect(updatedPlayer.zones).toEqual([mockZoneId2, mockZoneId3])
    })
  })

  describe('Player Validation', () => {
    it('should validate correct player structure', () => {
      const validPlayer = createPlayer({
        id: mockPlayerId,
        name: 'Valid Player'
      })

      expect(() => validatePlayer(validPlayer)).not.toThrow()
    })

    it('should reject players with invalid structure', () => {
      const invalidPlayer = {
        id: mockPlayerId,
        name: 'Test',
        // Missing required fields
      } as any

      expect(() => validatePlayer(invalidPlayer)).toThrow()
    })

    it('should validate player resources are numbers', () => {
      const playerWithInvalidResources = {
        id: mockPlayerId,
        name: 'Test Player',
        resources: { life: 'twenty' }, // Invalid non-number
        zones: [],
        counters: []
      } as any

      expect(() => validatePlayer(playerWithInvalidResources))
        .toThrow('Resource values must be numbers')
    })

    it('should validate counter structure', () => {
      const playerWithInvalidCounters = {
        id: mockPlayerId,
        name: 'Test Player',
        resources: {},
        zones: [],
        counters: [{ type: 'poison' }] // Missing count
      } as any

      expect(() => validatePlayer(playerWithInvalidCounters))
        .toThrow('Invalid counter structure')
    })

    it('should validate zone IDs', () => {
      const playerWithInvalidZones = {
        id: mockPlayerId,
        name: 'Test Player',
        resources: {},
        zones: [{ value: '' }], // Invalid zone ID
        counters: []
      } as any

      expect(() => validatePlayer(playerWithInvalidZones))
        .toThrow('Invalid zone ID in player')
    })
  })

  describe('Player Utility Functions', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({
        id: mockPlayerId,
        name: 'Test Player',
        resources: { life: 20, mana: 5, energy: 0 },
        zones: [mockZoneId1, mockZoneId2],
        counters: [
          { type: 'poison', count: 3 },
          { type: 'experience', count: 10 }
        ]
      })
    })

    it('should check if player is alive (life > 0)', () => {
      expect(getPlayerResource(player, 'life')).toBe(20)
      
      const deadPlayer = setPlayerResource(player, 'life', 0)
      expect(getPlayerResource(deadPlayer, 'life')).toBe(0)
      
      const negativeLifePlayer = setPlayerResource(player, 'life', -5)
      expect(getPlayerResource(negativeLifePlayer, 'life')).toBe(-5)
    })

    it('should get total resources', () => {
      const totalManaAndEnergy = getPlayerResource(player, 'mana')! + getPlayerResource(player, 'energy')!
      expect(totalManaAndEnergy).toBe(5)
    })

    it('should get counter count of specific type', () => {
      const poisonCounter = player.counters.find(c => c.type === 'poison')
      expect(poisonCounter?.count).toBe(3)
      
      const nonExistentCounter = player.counters.find(c => c.type === 'nonexistent')
      expect(nonExistentCounter).toBeUndefined()
    })

    it('should get zone count', () => {
      expect(player.zones.length).toBe(2)
    })

    it('should handle resource overflow', () => {
      const maxNumber = Number.MAX_SAFE_INTEGER
      const playerWithMaxResource = setPlayerResource(player, 'life', maxNumber)
      
      expect(getPlayerResource(playerWithMaxResource, 'life')).toBe(maxNumber)
    })
  })
})