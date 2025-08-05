/**
 * @fileoverview Player primitive implementation
 * Core player object with immutable operations following TDD approach
 */

import { Player, Counter, PlayerId, ZoneId } from '@/types'
import { isValidId } from '@/lib/utils'

// Player creation and validation

export interface CreatePlayerParams {
  id: PlayerId
  name: string
  resources?: Record<string, number>
  zones?: ZoneId[]
  counters?: Counter[]
}

export function createPlayer(params: CreatePlayerParams): Player {
  validatePlayerCreation(params)

  return {
    id: params.id,
    name: params.name,
    resources: params.resources || {},
    zones: params.zones || [],
    counters: params.counters || []
  }
}

export function validatePlayerCreation(params: CreatePlayerParams): void {
  if (!isValidId(params.id)) {
    throw new Error('Invalid player ID')
  }
  
  if (!params.name || params.name.trim() === '') {
    throw new Error('Player name cannot be empty')
  }
  
  if (params.resources) {
    Object.entries(params.resources).forEach(([_key, value]) => {
      if (typeof value !== 'number') {
        throw new Error('Resource values must be numbers')
      }
    })
  }

  if (params.zones) {
    params.zones.forEach(zoneId => {
      if (!isValidId(zoneId)) {
        throw new Error('Invalid zone ID in player')
      }
    })
  }

  if (params.counters) {
    params.counters.forEach(counter => {
      if (!counter.type || typeof counter.count !== 'number' || counter.count < 0) {
        throw new Error('Invalid counter structure')
      }
    })
  }
}

// Player updates (immutable)

export function updatePlayer(player: Player, updates: Partial<Omit<Player, 'id'>>): Player {
  return {
    ...player,
    ...updates
  }
}

// Resource operations

export function setPlayerResource(player: Player, resourceName: string, value: number): Player {
  if (typeof value !== 'number') {
    throw new Error('Resource value must be a number')
  }

  return updatePlayer(player, {
    resources: {
      ...player.resources,
      [resourceName]: value
    }
  })
}

export function getPlayerResource(player: Player, resourceName: string): number | undefined {
  return player.resources[resourceName]
}

export function modifyPlayerResource(player: Player, resourceName: string, delta: number): Player {
  const currentValue = getPlayerResource(player, resourceName) || 0
  return setPlayerResource(player, resourceName, currentValue + delta)
}

export function resetPlayerResource(player: Player, resourceName: string): Player {
  return setPlayerResource(player, resourceName, 0)
}

export function hasPlayerResource(player: Player, resourceName: string): boolean {
  return resourceName in player.resources
}

export function getAllPlayerResources(player: Player): Record<string, number> {
  return { ...player.resources }
}

// Counter operations

export function addPlayerCounter(player: Player, counter: Counter): Player {
  if (counter.count < 0) {
    throw new Error('Counter count cannot be negative')
  }

  const existingCounterIndex = player.counters.findIndex(c => c.type === counter.type)
  
  if (existingCounterIndex >= 0) {
    // Update existing counter
    const updatedCounters = [...player.counters]
    updatedCounters[existingCounterIndex] = {
      type: counter.type,
      count: updatedCounters[existingCounterIndex].count + counter.count
    }
    
    return updatePlayer(player, { counters: updatedCounters })
  } else {
    // Add new counter
    return updatePlayer(player, { 
      counters: [...player.counters, counter] 
    })
  }
}

export function removePlayerCounter(player: Player, counter: Counter): Player {
  const existingCounterIndex = player.counters.findIndex(c => c.type === counter.type)
  
  if (existingCounterIndex === -1) {
    throw new Error('Cannot remove counters that do not exist')
  }

  const existingCounter = player.counters[existingCounterIndex]
  
  if (existingCounter.count < counter.count) {
    throw new Error('Cannot remove more counters than exist')
  }

  const newCount = existingCounter.count - counter.count
  const updatedCounters = [...player.counters]

  if (newCount === 0) {
    // Remove counter type completely
    updatedCounters.splice(existingCounterIndex, 1)
  } else {
    // Update counter count
    updatedCounters[existingCounterIndex] = {
      type: counter.type,
      count: newCount
    }
  }

  return updatePlayer(player, { counters: updatedCounters })
}

export function getPlayerCounterOfType(player: Player, counterType: string): Counter | undefined {
  return player.counters.find(counter => counter.type === counterType)
}

export function getPlayerCounterCount(player: Player, counterType: string): number {
  const counter = getPlayerCounterOfType(player, counterType)
  return counter ? counter.count : 0
}

export function hasPlayerCounter(player: Player, counterType: string): boolean {
  return getPlayerCounterCount(player, counterType) > 0
}

// Zone operations

export function addPlayerZone(player: Player, zoneId: ZoneId): Player {
  if (!isValidId(zoneId)) {
    throw new Error('Invalid zone ID')
  }

  if (hasPlayerZone(player, zoneId)) {
    throw new Error('Zone already belongs to player')
  }

  return updatePlayer(player, {
    zones: [...player.zones, zoneId]
  })
}

export function removePlayerZone(player: Player, zoneId: ZoneId): Player {
  const zoneIndex = player.zones.findIndex(id => id.value === zoneId.value)
  
  if (zoneIndex === -1) {
    throw new Error('Zone does not belong to player')
  }

  const newZones = [...player.zones]
  newZones.splice(zoneIndex, 1)

  return updatePlayer(player, { zones: newZones })
}

export function hasPlayerZone(player: Player, zoneId: ZoneId): boolean {
  return player.zones.some(id => id.value === zoneId.value)
}

export function getPlayerZones(player: Player): ZoneId[] {
  return [...player.zones]
}

export function getPlayerZoneCount(player: Player): number {
  return player.zones.length
}

// Player validation

export function validatePlayer(player: any): asserts player is Player {
  if (!player || typeof player !== 'object') {
    throw new Error('Player must be an object')
  }

  const requiredFields = ['id', 'name', 'resources', 'zones', 'counters']
  
  for (const field of requiredFields) {
    if (!(field in player)) {
      throw new Error(`Player missing required field: ${field}`)
    }
  }

  if (!isValidId(player.id)) {
    throw new Error('Invalid player ID')
  }

  if (typeof player.name !== 'string' || player.name.trim() === '') {
    throw new Error('Player name must be a non-empty string')
  }

  if (!player.resources || typeof player.resources !== 'object') {
    throw new Error('Resources must be an object')
  }

  Object.entries(player.resources).forEach(([_key, value]) => {
    if (typeof value !== 'number') {
      throw new Error('Resource values must be numbers')
    }
  })

  if (!Array.isArray(player.zones)) {
    throw new Error('Zones must be an array')
  }

  player.zones.forEach((zoneId: any, index: number) => {
    if (!isValidId(zoneId)) {
      throw new Error(`Invalid zone ID in player at index ${index}`)
    }
  })

  if (!Array.isArray(player.counters)) {
    throw new Error('Counters must be an array')
  }

  player.counters.forEach((counter: any, index: number) => {
    if (!counter || typeof counter !== 'object') {
      throw new Error(`Counter at index ${index} must be an object`)
    }
    if (!counter.type || typeof counter.type !== 'string') {
      throw new Error('Invalid counter structure')
    }
    if (typeof counter.count !== 'number' || counter.count < 0) {
      throw new Error('Invalid counter structure')
    }
  })
}

// Utility functions

export function isPlayerAlive(player: Player): boolean {
  const life = getPlayerResource(player, 'life')
  return life === undefined || life > 0
}

export function getPlayerLife(player: Player): number {
  return getPlayerResource(player, 'life') || 0
}

export function setPlayerLife(player: Player, life: number): Player {
  return setPlayerResource(player, 'life', life)
}

export function healPlayer(player: Player, amount: number): Player {
  return modifyPlayerResource(player, 'life', Math.abs(amount))
}

export function damagePlayer(player: Player, amount: number): Player {
  return modifyPlayerResource(player, 'life', -Math.abs(amount))
}

export function getPlayerMana(player: Player): number {
  return getPlayerResource(player, 'mana') || 0
}

export function setPlayerMana(player: Player, mana: number): Player {
  return setPlayerResource(player, 'mana', mana)
}

export function spendPlayerMana(player: Player, amount: number): Player {
  const currentMana = getPlayerMana(player)
  if (currentMana < amount) {
    throw new Error('Insufficient mana')
  }
  return modifyPlayerResource(player, 'mana', -amount)
}

export function addPlayerMana(player: Player, amount: number): Player {
  return modifyPlayerResource(player, 'mana', Math.abs(amount))
}

export function getTotalPlayerCounters(player: Player): number {
  return player.counters.reduce((total, counter) => total + counter.count, 0)
}

export function copyPlayer(player: Player, newId: PlayerId): Player {
  return {
    ...player,
    id: newId,
    resources: { ...player.resources },
    zones: [...player.zones],
    counters: [...player.counters]
  }
}

export function resetAllPlayerCounters(player: Player): Player {
  return updatePlayer(player, { counters: [] })
}

export function resetAllPlayerResources(player: Player): Player {
  return updatePlayer(player, { resources: {} })
}

export function getPlayerSummary(player: Player): {
  name: string
  life: number
  mana: number
  zoneCount: number
  counterCount: number
} {
  return {
    name: player.name,
    life: getPlayerLife(player),
    mana: getPlayerMana(player),
    zoneCount: getPlayerZoneCount(player),
    counterCount: getTotalPlayerCounters(player)
  }
}