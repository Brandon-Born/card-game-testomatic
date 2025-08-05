/**
 * @fileoverview Comprehensive tests for Zone objects
 * Following TDD approach - tests written first, implementation follows
 */

import { Zone, CardId, PlayerId, ZoneId, Deck } from '@/types'
import { 
  createZone,
  createDeck,
  createHand,
  createDiscardPile,
  createPlayArea,
  createStack,
  addCardToZone,
  removeCardFromZone,
  moveCardInZone,
  shuffleZone,
  getZoneSize,
  isZoneEmpty,
  getCardAt,
  findCardInZone,
  getTopCard,
  getBottomCard,
  validateZone
} from '@/core/primitives/zone'
import { createCardId, createPlayerId, createZoneId } from '@/lib/utils'

describe('Zone Object - TDD Implementation', () => {
  let mockCardId1: CardId
  let mockCardId2: CardId
  let mockCardId3: CardId
  let mockPlayerId: PlayerId
  let mockZoneId: ZoneId

  beforeEach(() => {
    mockCardId1 = createCardId()
    mockCardId2 = createCardId()
    mockCardId3 = createCardId()
    mockPlayerId = createPlayerId()
    mockZoneId = createZoneId()
  })

  describe('Base Zone Creation', () => {
    it('should create a basic zone with all required properties', () => {
      const zone = createZone({
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })

      expect(zone).toEqual({
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        cards: [],
        visibility: 'private',
        order: 'ordered',
        maxSize: undefined
      })
    })

    it('should create a public zone', () => {
      const zone = createZone({
        id: mockZoneId,
        name: 'Public Zone',
        owner: null,
        visibility: 'public',
        order: 'unordered'
      })

      expect(zone.owner).toBeNull()
      expect(zone.visibility).toBe('public')
      expect(zone.order).toBe('unordered')
    })

    it('should create a zone with size limit', () => {
      const zone = createZone({
        id: mockZoneId,
        name: 'Limited Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered',
        maxSize: 7
      })

      expect(zone.maxSize).toBe(7)
    })

    it('should validate zone creation parameters', () => {
      expect(() => createZone({
        id: mockZoneId,
        name: '', // Invalid empty name
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })).toThrow('Zone name cannot be empty')
    })
  })

  describe('Zone Subclass Creation', () => {
    it('should create a Deck with correct properties', () => {
      const deck = createDeck({
        id: mockZoneId,
        owner: mockPlayerId
      })

      expect(deck.name).toBe('Deck')
      expect(deck.visibility).toBe('private')
      expect(deck.order).toBe('ordered')
      expect(deck.type).toBe('deck')
    })

    it('should create a Hand with correct properties', () => {
      const hand = createHand({
        id: mockZoneId,
        owner: mockPlayerId
      })

      expect(hand.name).toBe('Hand')
      expect(hand.visibility).toBe('private')
      expect(hand.order).toBe('unordered')
      expect(hand.type).toBe('hand')
    })

    it('should create a DiscardPile with correct properties', () => {
      const discard = createDiscardPile({
        id: mockZoneId,
        owner: mockPlayerId
      })

      expect(discard.name).toBe('Discard Pile')
      expect(discard.visibility).toBe('public')
      expect(discard.order).toBe('ordered')
      expect(discard.type).toBe('discard')
    })

    it('should create a PlayArea with correct properties', () => {
      const playArea = createPlayArea({
        id: mockZoneId,
        owner: mockPlayerId
      })

      expect(playArea.name).toBe('Play Area')
      expect(playArea.visibility).toBe('public')
      expect(playArea.order).toBe('unordered')
      expect(playArea.type).toBe('playarea')
    })

    it('should create a Stack with correct properties', () => {
      const stack = createStack({
        id: mockZoneId
      })

      expect(stack.name).toBe('Stack')
      expect(stack.owner).toBeNull()
      expect(stack.visibility).toBe('public')
      expect(stack.order).toBe('ordered')
      expect(stack.type).toBe('stack')
    })
  })

  describe('Zone Card Operations', () => {
    let zone: Zone

    beforeEach(() => {
      zone = createZone({
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })
    })

    it('should add cards to a zone', () => {
      const updatedZone = addCardToZone(zone, mockCardId1)

      expect(updatedZone.cards).toEqual([mockCardId1])
      expect(zone.cards).toEqual([]) // Original unchanged
    })

    it('should add multiple cards in order', () => {
      let updatedZone = addCardToZone(zone, mockCardId1)
      updatedZone = addCardToZone(updatedZone, mockCardId2)
      updatedZone = addCardToZone(updatedZone, mockCardId3)

      expect(updatedZone.cards).toEqual([mockCardId1, mockCardId2, mockCardId3])
    })

    it('should add card at specific position', () => {
      let updatedZone = addCardToZone(zone, mockCardId1)
      updatedZone = addCardToZone(updatedZone, mockCardId2)
      updatedZone = addCardToZone(updatedZone, mockCardId3, 1) // Insert at position 1

      expect(updatedZone.cards).toEqual([mockCardId1, mockCardId3, mockCardId2])
    })

    it('should remove cards from a zone', () => {
      let updatedZone = addCardToZone(zone, mockCardId1)
      updatedZone = addCardToZone(updatedZone, mockCardId2)
      updatedZone = removeCardFromZone(updatedZone, mockCardId1)

      expect(updatedZone.cards).toEqual([mockCardId2])
    })

    it('should handle removing non-existent card', () => {
      expect(() => removeCardFromZone(zone, mockCardId1))
        .toThrow('Card not found in zone')
    })

    it('should move card within zone', () => {
      let updatedZone = addCardToZone(zone, mockCardId1)
      updatedZone = addCardToZone(updatedZone, mockCardId2)
      updatedZone = addCardToZone(updatedZone, mockCardId3)
      
      // Move card from position 0 to position 2
      updatedZone = moveCardInZone(updatedZone, mockCardId1, 2)

      expect(updatedZone.cards).toEqual([mockCardId2, mockCardId3, mockCardId1])
    })

    it('should enforce max size limit', () => {
      const limitedZone = createZone({
        id: mockZoneId,
        name: 'Limited Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered',
        maxSize: 2
      })

      let updatedZone = addCardToZone(limitedZone, mockCardId1)
      updatedZone = addCardToZone(updatedZone, mockCardId2)

      expect(() => addCardToZone(updatedZone, mockCardId3))
        .toThrow('Zone is at maximum capacity')
    })
  })

  describe('Zone Utility Functions', () => {
    let zoneWithCards: Zone

    beforeEach(() => {
      let zone = createZone({
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })
      zone = addCardToZone(zone, mockCardId1)
      zone = addCardToZone(zone, mockCardId2)
      zone = addCardToZone(zone, mockCardId3)
      zoneWithCards = zone
    })

    it('should get zone size', () => {
      expect(getZoneSize(zoneWithCards)).toBe(3)
      
      const emptyZone = createZone({
        id: createZoneId(),
        name: 'Empty Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })
      expect(getZoneSize(emptyZone)).toBe(0)
    })

    it('should check if zone is empty', () => {
      expect(isZoneEmpty(zoneWithCards)).toBe(false)
      
      const emptyZone = createZone({
        id: createZoneId(),
        name: 'Empty Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })
      expect(isZoneEmpty(emptyZone)).toBe(true)
    })

    it('should get card at specific position', () => {
      expect(getCardAt(zoneWithCards, 0)).toBe(mockCardId1)
      expect(getCardAt(zoneWithCards, 1)).toBe(mockCardId2)
      expect(getCardAt(zoneWithCards, 2)).toBe(mockCardId3)
      expect(getCardAt(zoneWithCards, 3)).toBeUndefined()
    })

    it('should find card in zone', () => {
      expect(findCardInZone(zoneWithCards, mockCardId2)).toBe(1)
      expect(findCardInZone(zoneWithCards, createCardId())).toBe(-1)
    })

    it('should get top card (last added for ordered zones)', () => {
      expect(getTopCard(zoneWithCards)).toBe(mockCardId3)
      
      const emptyZone = createZone({
        id: createZoneId(),
        name: 'Empty Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })
      expect(getTopCard(emptyZone)).toBeUndefined()
    })

    it('should get bottom card (first added for ordered zones)', () => {
      expect(getBottomCard(zoneWithCards)).toBe(mockCardId1)
      
      const emptyZone = createZone({
        id: createZoneId(),
        name: 'Empty Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })
      expect(getBottomCard(emptyZone)).toBeUndefined()
    })
  })

  describe('Zone Shuffling', () => {
    let deck: Deck

    beforeEach(() => {
      deck = createDeck({
        id: mockZoneId,
        owner: mockPlayerId
      })
      deck = addCardToZone(deck, mockCardId1) as Deck
      deck = addCardToZone(deck, mockCardId2) as Deck
      deck = addCardToZone(deck, mockCardId3) as Deck
    })

    it('should shuffle cards in an ordered zone', () => {
      const originalOrder = [...deck.cards]
      const shuffledDeck = shuffleZone(deck)

      expect(shuffledDeck.cards).toHaveLength(3)
      expect(shuffledDeck.cards).toEqual(expect.arrayContaining(originalOrder))
      // Note: There's a small chance the order could be the same after shuffling
    })

    it('should not affect unordered zones', () => {
      const hand = createHand({
        id: createZoneId(),
        owner: mockPlayerId
      })
      
      expect(() => shuffleZone(hand))
        .toThrow('Cannot shuffle unordered zone')
    })

    it('should handle empty zone shuffle', () => {
      const emptyDeck = createDeck({
        id: createZoneId(),
        owner: mockPlayerId
      })

      const shuffledDeck = shuffleZone(emptyDeck)
      expect(shuffledDeck.cards).toEqual([])
    })
  })

  describe('Zone Validation', () => {
    it('should validate correct zone structure', () => {
      const validZone = createZone({
        id: mockZoneId,
        name: 'Valid Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'ordered'
      })

      expect(() => validateZone(validZone)).not.toThrow()
    })

    it('should reject zones with invalid structure', () => {
      const invalidZone = {
        id: mockZoneId,
        name: 'Test',
        // Missing required fields
      } as any

      expect(() => validateZone(invalidZone)).toThrow()
    })

    it('should validate card IDs in zone', () => {
      const zoneWithInvalidCards = {
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        cards: [{ value: '' }], // Invalid card ID
        visibility: 'private',
        order: 'ordered'
      } as any

      expect(() => validateZone(zoneWithInvalidCards)).toThrow('Invalid card ID in zone')
    })

    it('should validate visibility values', () => {
      expect(() => createZone({
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        visibility: 'invalid' as any,
        order: 'ordered'
      })).toThrow('Invalid visibility value')
    })

    it('should validate order values', () => {
      expect(() => createZone({
        id: mockZoneId,
        name: 'Test Zone',
        owner: mockPlayerId,
        visibility: 'private',
        order: 'invalid' as any
      })).toThrow('Invalid order value')
    })
  })
})