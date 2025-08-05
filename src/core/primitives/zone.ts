/**
 * @fileoverview Zone primitive implementation
 * Core zone objects with immutable operations following TDD approach
 */

import { Zone, Deck, Hand, DiscardPile, PlayArea, Stack, CardId, PlayerId, ZoneId } from '@/types'
import { isValidId, shuffleArray, insertIntoArray } from '@/lib/utils'

// Base Zone creation and validation

export interface CreateZoneParams {
  id: ZoneId
  name: string
  owner: PlayerId | null
  visibility: 'public' | 'private'
  order: 'ordered' | 'unordered'
  maxSize?: number
  cards?: CardId[]
}

export function createZone(params: CreateZoneParams): Zone {
  validateZoneCreation(params)

  return {
    id: params.id,
    name: params.name,
    owner: params.owner,
    cards: params.cards || [],
    visibility: params.visibility,
    order: params.order,
    maxSize: params.maxSize
  }
}

export function validateZoneCreation(params: CreateZoneParams): void {
  if (!isValidId(params.id)) {
    throw new Error('Invalid zone ID')
  }
  
  if (!params.name || params.name.trim() === '') {
    throw new Error('Zone name cannot be empty')
  }
  
  if (params.owner && !isValidId(params.owner)) {
    throw new Error('Invalid owner ID')
  }

  if (params.visibility !== 'public' && params.visibility !== 'private') {
    throw new Error('Invalid visibility value')
  }

  if (params.order !== 'ordered' && params.order !== 'unordered') {
    throw new Error('Invalid order value')
  }

  if (params.maxSize !== undefined && (params.maxSize < 0 || !Number.isInteger(params.maxSize))) {
    throw new Error('Invalid max size')
  }

  if (params.cards) {
    params.cards.forEach(cardId => {
      if (!isValidId(cardId)) {
        throw new Error('Invalid card ID in zone')
      }
    })
  }
}

// Zone subclass creation

export interface CreateDeckParams {
  id: ZoneId
  owner: PlayerId
  cards?: CardId[]
  maxSize?: number
}

export function createDeck(params: CreateDeckParams): Deck {
  const deck = createZone({
    id: params.id,
    name: 'Deck',
    owner: params.owner,
    visibility: 'private',
    order: 'ordered',
    cards: params.cards,
    maxSize: params.maxSize
  }) as Deck

  return {
    ...deck,
    type: 'deck'
  }
}

export interface CreateHandParams {
  id: ZoneId
  owner: PlayerId
  cards?: CardId[]
  maxSize?: number
}

export function createHand(params: CreateHandParams): Hand {
  const hand = createZone({
    id: params.id,
    name: 'Hand',
    owner: params.owner,
    visibility: 'private',
    order: 'unordered',
    cards: params.cards,
    maxSize: params.maxSize
  }) as Hand

  return {
    ...hand,
    type: 'hand'
  }
}

export interface CreateDiscardPileParams {
  id: ZoneId
  owner: PlayerId
  cards?: CardId[]
}

export function createDiscardPile(params: CreateDiscardPileParams): DiscardPile {
  const discardPile = createZone({
    id: params.id,
    name: 'Discard Pile',
    owner: params.owner,
    visibility: 'public',
    order: 'ordered',
    cards: params.cards
  }) as DiscardPile

  return {
    ...discardPile,
    type: 'discard'
  }
}

export interface CreatePlayAreaParams {
  id: ZoneId
  owner: PlayerId
  cards?: CardId[]
}

export function createPlayArea(params: CreatePlayAreaParams): PlayArea {
  const playArea = createZone({
    id: params.id,
    name: 'Play Area',
    owner: params.owner,
    visibility: 'public',
    order: 'unordered',
    cards: params.cards
  }) as PlayArea

  return {
    ...playArea,
    type: 'playarea'
  }
}

export interface CreateStackParams {
  id: ZoneId
  cards?: CardId[]
}

export function createStack(params: CreateStackParams): Stack {
  const stack = createZone({
    id: params.id,
    name: 'Stack',
    owner: null,
    visibility: 'public',
    order: 'ordered',
    cards: params.cards
  }) as Stack

  return {
    ...stack,
    type: 'stack'
  }
}

// Zone card operations

export function addCardToZone(zone: Zone, cardId: CardId, position?: number): Zone {
  if (zone.maxSize && zone.cards.length >= zone.maxSize) {
    throw new Error('Zone is at maximum capacity')
  }

  if (!isValidId(cardId)) {
    throw new Error('Invalid card ID')
  }

  const newCards = position !== undefined 
    ? insertIntoArray(zone.cards, cardId, position)
    : [...zone.cards, cardId]

  return {
    ...zone,
    cards: newCards
  }
}

export function removeCardFromZone(zone: Zone, cardId: CardId): Zone {
  const cardIndex = zone.cards.findIndex(id => id.value === cardId.value)
  
  if (cardIndex === -1) {
    throw new Error('Card not found in zone')
  }

  const newCards = [...zone.cards]
  newCards.splice(cardIndex, 1)

  return {
    ...zone,
    cards: newCards
  }
}

export function moveCardInZone(zone: Zone, cardId: CardId, newPosition: number): Zone {
  const currentIndex = zone.cards.findIndex(id => id.value === cardId.value)
  
  if (currentIndex === -1) {
    throw new Error('Card not found in zone')
  }

  if (newPosition < 0 || newPosition >= zone.cards.length) {
    throw new Error('Invalid position')
  }

  const newCards = [...zone.cards]
  const [movedCard] = newCards.splice(currentIndex, 1)
  newCards.splice(newPosition, 0, movedCard)

  return {
    ...zone,
    cards: newCards
  }
}

// Zone utility functions

export function getZoneSize(zone: Zone): number {
  return zone.cards.length
}

export function isZoneEmpty(zone: Zone): boolean {
  return zone.cards.length === 0
}

export function getCardAt(zone: Zone, index: number): CardId | undefined {
  return zone.cards[index]
}

export function findCardInZone(zone: Zone, cardId: CardId): number {
  return zone.cards.findIndex(id => id.value === cardId.value)
}

export function getTopCard(zone: Zone): CardId | undefined {
  if (zone.cards.length === 0) {
    return undefined
  }
  return zone.cards[zone.cards.length - 1]
}

export function getBottomCard(zone: Zone): CardId | undefined {
  if (zone.cards.length === 0) {
    return undefined
  }
  return zone.cards[0]
}

export function hasCard(zone: Zone, cardId: CardId): boolean {
  return findCardInZone(zone, cardId) !== -1
}

// Zone shuffling

export function shuffleZone<T extends Zone>(zone: T): T {
  if (zone.order === 'unordered') {
    throw new Error('Cannot shuffle unordered zone')
  }

  return {
    ...zone,
    cards: shuffleArray(zone.cards)
  }
}

// Zone validation

export function validateZone(zone: any): asserts zone is Zone {
  if (!zone || typeof zone !== 'object') {
    throw new Error('Zone must be an object')
  }

  const requiredFields = ['id', 'name', 'owner', 'cards', 'visibility', 'order']
  
  for (const field of requiredFields) {
    if (!(field in zone)) {
      throw new Error(`Zone missing required field: ${field}`)
    }
  }

  if (!isValidId(zone.id)) {
    throw new Error('Invalid zone ID')
  }

  if (typeof zone.name !== 'string' || zone.name.trim() === '') {
    throw new Error('Zone name must be a non-empty string')
  }

  if (zone.owner !== null && !isValidId(zone.owner)) {
    throw new Error('Invalid owner ID')
  }

  if (!Array.isArray(zone.cards)) {
    throw new Error('Cards must be an array')
  }

  zone.cards.forEach((cardId: any, index: number) => {
    if (!isValidId(cardId)) {
      throw new Error(`Invalid card ID in zone at index ${index}`)
    }
  })

  if (zone.visibility !== 'public' && zone.visibility !== 'private') {
    throw new Error('Invalid visibility value')
  }

  if (zone.order !== 'ordered' && zone.order !== 'unordered') {
    throw new Error('Invalid order value')
  }

  if (zone.maxSize !== undefined) {
    if (typeof zone.maxSize !== 'number' || zone.maxSize < 0 || !Number.isInteger(zone.maxSize)) {
      throw new Error('Invalid max size')
    }
  }
}

// Advanced zone operations

export function drawCardsFromZone(zone: Zone, count: number, fromTop: boolean = true): { 
  drawnCards: CardId[], 
  updatedZone: Zone 
} {
  if (count < 0) {
    throw new Error('Cannot draw negative number of cards')
  }

  if (count > zone.cards.length) {
    throw new Error('Not enough cards in zone')
  }

  if (count === 0) {
    return { drawnCards: [], updatedZone: zone }
  }

  let drawnCards: CardId[]
  let remainingCards: CardId[]

  if (fromTop) {
    drawnCards = zone.cards.slice(-count)
    remainingCards = zone.cards.slice(0, -count)
  } else {
    drawnCards = zone.cards.slice(0, count)
    remainingCards = zone.cards.slice(count)
  }

  return {
    drawnCards,
    updatedZone: {
      ...zone,
      cards: remainingCards
    }
  }
}

export function insertCardAtTop(zone: Zone, cardId: CardId): Zone {
  return addCardToZone(zone, cardId, zone.cards.length)
}

export function insertCardAtBottom(zone: Zone, cardId: CardId): Zone {
  return addCardToZone(zone, cardId, 0)
}

export function peekAtCards(zone: Zone, count: number, fromTop: boolean = true): CardId[] {
  if (count < 0) {
    throw new Error('Cannot peek at negative number of cards')
  }

  if (count > zone.cards.length) {
    return [...zone.cards]
  }

  if (fromTop) {
    return zone.cards.slice(-count)
  } else {
    return zone.cards.slice(0, count)
  }
}

export function getCardsInOrder(zone: Zone): CardId[] {
  return [...zone.cards]
}

export function isZoneFull(zone: Zone): boolean {
  return zone.maxSize !== undefined && zone.cards.length >= zone.maxSize
}

export function getRemainingCapacity(zone: Zone): number {
  if (zone.maxSize === undefined) {
    return Infinity
  }
  return Math.max(0, zone.maxSize - zone.cards.length)
}

// Zone type checking utilities

export function isDeck(zone: Zone): zone is Deck {
  return 'type' in zone && (zone as any).type === 'deck'
}

export function isHand(zone: Zone): zone is Hand {
  return 'type' in zone && (zone as any).type === 'hand'
}

export function isDiscardPile(zone: Zone): zone is DiscardPile {
  return 'type' in zone && (zone as any).type === 'discard'
}

export function isPlayArea(zone: Zone): zone is PlayArea {
  return 'type' in zone && (zone as any).type === 'playarea'
}

export function isStack(zone: Zone): zone is Stack {
  return 'type' in zone && (zone as any).type === 'stack'
}