/**
 * @fileoverview Comprehensive tests for Card object
 * Following TDD approach - tests written first, implementation follows
 */

import { Card, Counter, CardId, PlayerId, ZoneId } from '@/types'
import { 
  createCard, 
  updateCard, 
  addCounter, 
  removeCounter, 
  tapCard, 
  untapCard,
  setCardProperty,
  validateCard
} from '@/core/primitives/card'
import { createCardId, createPlayerId, createZoneId } from '@/lib/utils'

describe('Card Object - TDD Implementation', () => {
  let mockCardId: CardId
  let mockPlayerId: PlayerId
  let mockZoneId: ZoneId

  beforeEach(() => {
    mockCardId = createCardId()
    mockPlayerId = createPlayerId()
    mockZoneId = createZoneId()
  })

  describe('Card Creation', () => {
    it('should create a card with all required properties', () => {
      const card = createCard({
        id: mockCardId,
        name: 'Lightning Bolt',
        text: 'Deal 3 damage to any target.',
        type: 'Instant',
        owner: mockPlayerId,
        currentZone: mockZoneId
      })

      expect(card).toEqual({
        id: mockCardId,
        name: 'Lightning Bolt',
        text: 'Deal 3 damage to any target.',
        type: 'Instant',
        owner: mockPlayerId,
        currentZone: mockZoneId,
        properties: {},
        counters: [],
        isTapped: false
      })
    })

    it('should create a card with optional properties', () => {
      const card = createCard({
        id: mockCardId,
        name: 'Test Card',
        text: 'Test text',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId,
        properties: { power: 2, toughness: 3, manaCost: 2 },
        isTapped: true
      })

      expect(card.properties).toEqual({ power: 2, toughness: 3, manaCost: 2 })
      expect(card.isTapped).toBe(true)
      expect(card.counters).toEqual([])
    })

    it('should throw error for invalid card data', () => {
      expect(() => createCard({
        id: mockCardId,
        name: '', // Invalid empty name
        text: 'Test text',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId
      })).toThrow('Card name cannot be empty')
    })

    it('should validate card IDs are properly formatted', () => {
      const invalidId = { value: '' } as CardId
      expect(() => createCard({
        id: invalidId,
        name: 'Test Card',
        text: 'Test text',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId
      })).toThrow('Invalid card ID')
    })
  })

  describe('Card Immutability', () => {
    let originalCard: Card

    beforeEach(() => {
      originalCard = createCard({
        id: mockCardId,
        name: 'Test Card',
        text: 'Original text',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId,
        properties: { power: 2, toughness: 3 }
      })
    })

    it('should return new card instance when updating properties', () => {
      const updatedCard = updateCard(originalCard, {
        name: 'Updated Card'
      })

      expect(updatedCard).not.toBe(originalCard) // Different instances
      expect(originalCard.name).toBe('Test Card') // Original unchanged
      expect(updatedCard.name).toBe('Updated Card') // New instance updated
      expect(updatedCard.id).toBe(originalCard.id) // ID preserved
    })

    it('should not mutate original card when updating properties', () => {
      const originalProperties = { ...originalCard.properties }
      
      updateCard(originalCard, {
        properties: { power: 5, toughness: 5 }
      })

      expect(originalCard.properties).toEqual(originalProperties)
    })

    it('should preserve all unchanged properties during updates', () => {
      const updatedCard = updateCard(originalCard, {
        text: 'New text'
      })

      expect(updatedCard.name).toBe(originalCard.name)
      expect(updatedCard.type).toBe(originalCard.type)
      expect(updatedCard.owner).toBe(originalCard.owner)
      expect(updatedCard.currentZone).toBe(originalCard.currentZone)
      expect(updatedCard.properties).toEqual(originalCard.properties)
      expect(updatedCard.counters).toEqual(originalCard.counters)
      expect(updatedCard.isTapped).toBe(originalCard.isTapped)
    })
  })

  describe('Card Counters', () => {
    let card: Card

    beforeEach(() => {
      card = createCard({
        id: mockCardId,
        name: 'Test Creature',
        text: 'A test creature',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId
      })
    })

    it('should add counters to a card', () => {
      const cardWithCounter = addCounter(card, { type: '+1/+1', count: 1 })

      expect(cardWithCounter.counters).toEqual([
        { type: '+1/+1', count: 1 }
      ])
      expect(card.counters).toEqual([]) // Original unchanged
    })

    it('should add multiple counters of the same type', () => {
      let cardWithCounters = addCounter(card, { type: '+1/+1', count: 1 })
      cardWithCounters = addCounter(cardWithCounters, { type: '+1/+1', count: 2 })

      expect(cardWithCounters.counters).toEqual([
        { type: '+1/+1', count: 3 }
      ])
    })

    it('should add different types of counters', () => {
      let cardWithCounters = addCounter(card, { type: '+1/+1', count: 1 })
      cardWithCounters = addCounter(cardWithCounters, { type: 'poison', count: 1 })

      expect(cardWithCounters.counters).toEqual([
        { type: '+1/+1', count: 1 },
        { type: 'poison', count: 1 }
      ])
    })

    it('should remove counters from a card', () => {
      let cardWithCounters = addCounter(card, { type: '+1/+1', count: 3 })
      cardWithCounters = removeCounter(cardWithCounters, { type: '+1/+1', count: 1 })

      expect(cardWithCounters.counters).toEqual([
        { type: '+1/+1', count: 2 }
      ])
    })

    it('should remove counter type completely when count reaches zero', () => {
      let cardWithCounters = addCounter(card, { type: '+1/+1', count: 2 })
      cardWithCounters = removeCounter(cardWithCounters, { type: '+1/+1', count: 2 })

      expect(cardWithCounters.counters).toEqual([])
    })

    it('should not allow negative counter counts', () => {
      expect(() => addCounter(card, { type: '+1/+1', count: -1 }))
        .toThrow('Counter count cannot be negative')
    })

    it('should not remove more counters than exist', () => {
      let cardWithCounters = addCounter(card, { type: '+1/+1', count: 2 })
      
      expect(() => removeCounter(cardWithCounters, { type: '+1/+1', count: 3 }))
        .toThrow('Cannot remove more counters than exist')
    })
  })

  describe('Card Tap/Untap', () => {
    let card: Card

    beforeEach(() => {
      card = createCard({
        id: mockCardId,
        name: 'Test Card',
        text: 'Test text',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId
      })
    })

    it('should tap an untapped card', () => {
      expect(card.isTapped).toBe(false)
      
      const tappedCard = tapCard(card)
      
      expect(tappedCard.isTapped).toBe(true)
      expect(card.isTapped).toBe(false) // Original unchanged
    })

    it('should untap a tapped card', () => {
      const tappedCard = tapCard(card)
      const untappedCard = untapCard(tappedCard)
      
      expect(untappedCard.isTapped).toBe(false)
      expect(tappedCard.isTapped).toBe(true) // Previous state unchanged
    })

    it('should handle tapping an already tapped card', () => {
      const tappedCard = tapCard(card)
      const stillTappedCard = tapCard(tappedCard)
      
      expect(stillTappedCard.isTapped).toBe(true)
    })

    it('should handle untapping an already untapped card', () => {
      const stillUntappedCard = untapCard(card)
      
      expect(stillUntappedCard.isTapped).toBe(false)
    })
  })

  describe('Card Properties', () => {
    let card: Card

    beforeEach(() => {
      card = createCard({
        id: mockCardId,
        name: 'Test Creature',
        text: 'A test creature',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId,
        properties: { power: 2, toughness: 3, manaCost: 2 }
      })
    })

    it('should set individual properties', () => {
      const updatedCard = setCardProperty(card, 'power', 5)
      
      expect(updatedCard.properties.power).toBe(5)
      expect(updatedCard.properties.toughness).toBe(3) // Unchanged
      expect(card.properties.power).toBe(2) // Original unchanged
    })

    it('should add new properties', () => {
      const updatedCard = setCardProperty(card, 'flying', true)
      
      expect(updatedCard.properties.flying).toBe(true)
      expect(updatedCard.properties.power).toBe(2) // Existing preserved
    })

    it('should handle complex property values', () => {
      const complexValue = { abilities: ['flying', 'trample'], cost: { white: 1, blue: 2 } }
      const updatedCard = setCardProperty(card, 'abilities', complexValue)
      
      expect(updatedCard.properties.abilities).toEqual(complexValue)
    })
  })

  describe('Card Validation', () => {
    it('should validate correct card structure', () => {
      const validCard = createCard({
        id: mockCardId,
        name: 'Valid Card',
        text: 'Valid text',
        type: 'Creature',
        owner: mockPlayerId,
        currentZone: mockZoneId
      })

      expect(() => validateCard(validCard)).not.toThrow()
    })

    it('should reject cards with invalid structure', () => {
      const invalidCard = {
        id: mockCardId,
        name: 'Test',
        // Missing required fields
      } as any

      expect(() => validateCard(invalidCard)).toThrow()
    })

    it('should validate counter structure', () => {
      const cardWithInvalidCounters = {
        ...createCard({
          id: mockCardId,
          name: 'Test Card',
          text: 'Test',
          type: 'Creature',
          owner: mockPlayerId,
          currentZone: mockZoneId
        }),
        counters: [{ type: '+1/+1' }] // Missing count
      } as any

      expect(() => validateCard(cardWithInvalidCounters)).toThrow('Invalid counter structure')
    })
  })
})