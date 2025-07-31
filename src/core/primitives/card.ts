/**
 * @fileoverview Card primitive implementation
 * Core card object with immutable operations following TDD approach
 */

import { Card, Counter, CardId, PlayerId, ZoneId } from '@/types'
import { isValidId } from '@/lib/utils'

// Card creation and validation

export interface CreateCardParams {
  id: CardId
  name: string
  text: string
  type: string
  owner: PlayerId
  currentZone: ZoneId
  properties?: Record<string, any>
  counters?: Counter[]
  isTapped?: boolean
}

export function createCard(params: CreateCardParams): Card {
  validateCardCreation(params)

  return {
    id: params.id,
    name: params.name,
    text: params.text,
    type: params.type,
    owner: params.owner,
    currentZone: params.currentZone,
    properties: params.properties || {},
    counters: params.counters || [],
    isTapped: params.isTapped || false
  }
}

export function validateCardCreation(params: CreateCardParams): void {
  if (!isValidId(params.id)) {
    throw new Error('Invalid card ID')
  }
  
  if (!params.name || params.name.trim() === '') {
    throw new Error('Card name cannot be empty')
  }
  
  if (!isValidId(params.owner)) {
    throw new Error('Invalid owner ID')
  }
  
  if (!isValidId(params.currentZone)) {
    throw new Error('Invalid zone ID')
  }

  if (params.counters) {
    params.counters.forEach(counter => {
      if (!counter.type || typeof counter.count !== 'number' || counter.count < 0) {
        throw new Error('Invalid counter structure')
      }
    })
  }
}

// Card updates (immutable)

export function updateCard(card: Card, updates: Partial<Omit<Card, 'id'>>): Card {
  return {
    ...card,
    ...updates
  }
}

// Counter operations

export function addCounter(card: Card, counter: Counter): Card {
  if (counter.count < 0) {
    throw new Error('Counter count cannot be negative')
  }

  const existingCounterIndex = card.counters.findIndex(c => c.type === counter.type)
  
  if (existingCounterIndex >= 0) {
    // Update existing counter
    const updatedCounters = [...card.counters]
    updatedCounters[existingCounterIndex] = {
      type: counter.type,
      count: updatedCounters[existingCounterIndex].count + counter.count
    }
    
    return updateCard(card, { counters: updatedCounters })
  } else {
    // Add new counter
    return updateCard(card, { 
      counters: [...card.counters, counter] 
    })
  }
}

export function removeCounter(card: Card, counter: Counter): Card {
  const existingCounterIndex = card.counters.findIndex(c => c.type === counter.type)
  
  if (existingCounterIndex === -1) {
    throw new Error('Cannot remove counters that do not exist')
  }

  const existingCounter = card.counters[existingCounterIndex]
  
  if (existingCounter.count < counter.count) {
    throw new Error('Cannot remove more counters than exist')
  }

  const newCount = existingCounter.count - counter.count
  const updatedCounters = [...card.counters]

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

  return updateCard(card, { counters: updatedCounters })
}

// Tap/Untap operations

export function tapCard(card: Card): Card {
  return updateCard(card, { isTapped: true })
}

export function untapCard(card: Card): Card {
  return updateCard(card, { isTapped: false })
}

// Property operations

export function setCardProperty(card: Card, key: string, value: any): Card {
  return updateCard(card, {
    properties: {
      ...card.properties,
      [key]: value
    }
  })
}

export function getCardProperty(card: Card, key: string): any {
  return card.properties[key]
}

export function removeCardProperty(card: Card, key: string): Card {
  const { [key]: removed, ...remainingProperties } = card.properties
  return updateCard(card, { properties: remainingProperties })
}

// Card validation

export function validateCard(card: any): asserts card is Card {
  if (!card || typeof card !== 'object') {
    throw new Error('Card must be an object')
  }

  const requiredFields = ['id', 'name', 'text', 'type', 'owner', 'currentZone', 'properties', 'counters', 'isTapped']
  
  for (const field of requiredFields) {
    if (!(field in card)) {
      throw new Error(`Card missing required field: ${field}`)
    }
  }

  if (!isValidId(card.id)) {
    throw new Error('Invalid card ID')
  }

  if (typeof card.name !== 'string' || card.name.trim() === '') {
    throw new Error('Card name must be a non-empty string')
  }

  if (typeof card.text !== 'string') {
    throw new Error('Card text must be a string')
  }

  if (typeof card.type !== 'string' || card.type.trim() === '') {
    throw new Error('Card type must be a non-empty string')
  }

  if (!isValidId(card.owner)) {
    throw new Error('Invalid owner ID')
  }

  if (!isValidId(card.currentZone)) {
    throw new Error('Invalid zone ID')
  }

  if (!Array.isArray(card.counters)) {
    throw new Error('Counters must be an array')
  }

  card.counters.forEach((counter: any, index: number) => {
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

  if (typeof card.properties !== 'object' || card.properties === null) {
    throw new Error('Properties must be an object')
  }

  if (typeof card.isTapped !== 'boolean') {
    throw new Error('isTapped must be a boolean')
  }
}

// Utility functions

export function isCardTapped(card: Card): boolean {
  return card.isTapped
}

export function getCounterOfType(card: Card, counterType: string): Counter | undefined {
  return card.counters.find(counter => counter.type === counterType)
}

export function getCounterCount(card: Card, counterType: string): number {
  const counter = getCounterOfType(card, counterType)
  return counter ? counter.count : 0
}

export function hasCounter(card: Card, counterType: string): boolean {
  return getCounterCount(card, counterType) > 0
}

export function getCardPower(card: Card): number {
  const basePower = getCardProperty(card, 'power') || 0
  const powerCounters = getCounterCount(card, '+1/+1')
  return basePower + powerCounters
}

export function getCardToughness(card: Card): number {
  const baseToughness = getCardProperty(card, 'toughness') || 0
  const toughnessCounters = getCounterCount(card, '+1/+1')
  return baseToughness + toughnessCounters
}

export function isCardType(card: Card, type: string): boolean {
  return card.type.toLowerCase().includes(type.toLowerCase())
}

export function copyCard(card: Card, newId: CardId): Card {
  return {
    ...card,
    id: newId,
    counters: [...card.counters],
    properties: { ...card.properties }
  }
}