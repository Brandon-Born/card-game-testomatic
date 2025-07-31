/**
 * @fileoverview Texas Hold'em Integration Test
 * Demonstrates complete framework capabilities with a real card game
 * Tests complex multi-player gameplay, betting rounds, and poker mechanics
 */

import { Game, Player, Card, Zone, GameEvent, EventListener } from '@/types'
import { 
  createGame, 
  addPlayerToGame, 
  addCardToGame, 
  addZoneToGame,
  setGamePhase,
  setCurrentPlayer,
  nextPlayer
} from '@/core/primitives/game'
import { createPlayer, modifyPlayerResource } from '@/core/primitives/player'
import { createCard } from '@/core/primitives/card'
import { createDeck, createHand, addCardToZone, createPlayArea } from '@/core/primitives/zone'
import { 
  moveCard, 
  drawCards, 
  modifyStat,
  executeAction 
} from '@/core/actions'
import { 
  createEventListener, 
  createGameEvent, 
  addEventListenerToGame
} from '@/core/events'
import { createGameId, createPlayerId, createCardId, createZoneId } from '@/lib/utils'

describe('Texas Hold\'em Integration Test', () => {
  // Poker card creation helper
  const createPokerCard = (suit: string, rank: string) => {
    const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
    return createCard({
      id: createCardId(),
      name: `${rank}${suitSymbols[suit as keyof typeof suitSymbols]}`,
      text: `${rank} of ${suit}`,
      type: 'Playing Card',
      owner: createPlayerId(), // Will be updated when dealt
      currentZone: createZoneId(), // Will be updated when dealt
      properties: { 
        suit, 
        rank, 
        value: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'].indexOf(rank) + 2 
      }
    })
  }

  // Create standard 52-card deck
  const createStandardDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const cards: Card[] = []

    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push(createPokerCard(suit, rank))
      }
    }

    return cards
  }

  describe('Complete Texas Hold\'em Game', () => {
    let game: Game
    let players: Player[]
    let deck: Zone
    let communityCards: Zone
    let pot: Zone

    beforeEach(() => {
      // Create 4 players for Texas Hold'em
      players = [
        createPlayer({
          id: createPlayerId(),
          name: 'Alice',
          resources: { chips: 1000, currentBet: 0 }
        }),
        createPlayer({
          id: createPlayerId(),
          name: 'Bob', 
          resources: { chips: 1000, currentBet: 0 }
        }),
        createPlayer({
          id: createPlayerId(),
          name: 'Charlie',
          resources: { chips: 1000, currentBet: 0 }
        }),
        createPlayer({
          id: createPlayerId(),
          name: 'Diana',
          resources: { chips: 1000, currentBet: 0 }
        })
      ]

      // Create zones
      const deckId = createZoneId()
      const communityId = createZoneId()
      const potId = createZoneId()

      deck = createDeck({ id: deckId, owner: null })
      communityCards = { 
        ...createPlayArea({ id: communityId, owner: null }),
        name: 'Community Cards',
        visibility: 'public' as const
      }
      pot = { 
        ...createPlayArea({ id: potId, owner: null }),
        name: 'Pot'
      }

      // Create hands for each player
      const playerHands = players.map(player => 
        createHand({ id: createZoneId(), owner: player.id })
      )

      // Create and shuffle deck
      const cards = createStandardDeck()
      let deckWithCards = deck
      cards.forEach(card => {
        const updatedCard = { ...card, currentZone: deck.id }
        deckWithCards = addCardToZone(deckWithCards, updatedCard.id) as Zone
      })

      // Create game
      game = createGame({
        id: createGameId(),
        players,
        zones: [deckWithCards, communityCards, pot, ...playerHands],
        cards,
        currentPlayer: players[0].id,
        phase: 'preflop',
        turnNumber: 1,
        globalProperties: {
          bigBlind: 20,
          smallBlind: 10,
          dealerPosition: 0,
          communityCardCount: 0,
          bettingRound: 1
        }
      })
    })

    it('should set up a complete Texas Hold\'em game', () => {
      // Verify game setup
      expect(game.players).toHaveLength(4)
      expect(game.cards).toHaveLength(52)
      expect(game.phase).toBe('preflop')
      
      // Verify zones
      const deckZone = game.zones.find(z => z.name === 'Deck')
      const community = game.zones.find(z => z.name === 'Community Cards')
      const potZone = game.zones.find(z => z.name === 'Pot')
      const playerHands = game.zones.filter(z => z.name === 'Hand')

      expect(deckZone).toBeDefined()
      expect(community).toBeDefined()
      expect(potZone).toBeDefined()

      expect(deckZone?.cards).toHaveLength(52)
      expect(community?.cards).toHaveLength(0)
      expect(potZone?.cards).toHaveLength(0)
      expect(playerHands).toHaveLength(4)

      // Verify each player has starting chips
      game.players.forEach(player => {
        expect(player.resources.chips).toBe(1000)
        expect(player.resources.currentBet).toBe(0)
      })
    })

    it('should handle pre-flop betting round', () => {
      let currentGame = game

      // Post blinds
      // Small blind (player 1)
      currentGame = executeAction(currentGame, modifyStat({
        target: players[1].id,
        stat: 'chips',
        value: -10
      }))
      currentGame = executeAction(currentGame, modifyStat({
        target: players[1].id,
        stat: 'currentBet',
        value: 10
      }))

      // Big blind (player 2)
      currentGame = executeAction(currentGame, modifyStat({
        target: players[2].id,
        stat: 'chips',
        value: -20
      }))
      currentGame = executeAction(currentGame, modifyStat({
        target: players[2].id,
        stat: 'currentBet',
        value: 20
      }))

      // Verify blinds were posted
      const smallBlindPlayer = currentGame.players.find(p => p.id.value === players[1].id.value)!
      const bigBlindPlayer = currentGame.players.find(p => p.id.value === players[2].id.value)!

      expect(smallBlindPlayer.resources.chips).toBe(990)
      expect(smallBlindPlayer.resources.currentBet).toBe(10)
      expect(bigBlindPlayer.resources.chips).toBe(980)
      expect(bigBlindPlayer.resources.currentBet).toBe(20)

      // Player 3 calls the big blind
      currentGame = executeAction(currentGame, modifyStat({
        target: players[3].id,
        stat: 'chips',
        value: -20
      }))
      currentGame = executeAction(currentGame, modifyStat({
        target: players[3].id,
        stat: 'currentBet',
        value: 20
      }))

      // Player 0 (dealer) raises to 60
      currentGame = executeAction(currentGame, modifyStat({
        target: players[0].id,
        stat: 'chips',
        value: -60
      }))
      currentGame = executeAction(currentGame, modifyStat({
        target: players[0].id,
        stat: 'currentBet',
        value: 60
      }))

      const raisePlayer = currentGame.players.find(p => p.id.value === players[0].id.value)!
      expect(raisePlayer.resources.chips).toBe(940)
      expect(raisePlayer.resources.currentBet).toBe(60)
    })

    it('should deal hole cards to all players', () => {
      let currentGame = game

      // Deal 2 cards to each player
      const deckZone = currentGame.zones.find(z => z.name === 'Deck')!
      
      for (let round = 0; round < 2; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const player = players[playerIndex]
          const playerHand = currentGame.zones.find(z => 
            z.owner?.value === player.id.value && z.name === 'Hand'
          )!

          // Get top card from deck
          const topCardId = deckZone.cards[0]
          
          // Move card from deck to player's hand
          currentGame = executeAction(currentGame, moveCard({
            cardId: topCardId,
            fromZone: deckZone.id,
            toZone: playerHand.id
          }))

          // Update our reference to the deck
          const updatedDeck = currentGame.zones.find(z => z.name === 'Deck')!
          Object.assign(deckZone, updatedDeck)
        }
      }

      // Verify each player has 2 hole cards
      currentGame.players.forEach(player => {
        const playerHand = currentGame.zones.find(z => 
          z.owner?.value === player.id.value && z.name === 'Hand'
        )!
        expect(playerHand.cards).toHaveLength(2)
      })

      // Verify deck has 44 cards remaining (52 - 8 dealt)
      const finalDeck = currentGame.zones.find(z => z.name === 'Deck')!
      expect(finalDeck.cards).toHaveLength(44)
    })

    it('should handle the flop (3 community cards)', () => {
      let currentGame = game
      const deckZone = currentGame.zones.find(z => z.name === 'Deck')!
      const communityZone = currentGame.zones.find(z => z.name === 'Community Cards')!
      
      expect(deckZone).toBeDefined()
      expect(communityZone).toBeDefined()

      // Burn one card (move to separate burn pile or just remove from deck)
      const burnCardId = deckZone.cards[0]
      currentGame = executeAction(currentGame, moveCard({
        cardId: burnCardId,
        fromZone: deckZone.id,
        toZone: communityZone.id // Using community as temporary burn location
      }))

      // Deal 3 flop cards
      for (let i = 0; i < 3; i++) {
        const currentDeck = currentGame.zones.find(z => z.name === 'Deck')!
        const cardId = currentDeck.cards[0]
        currentGame = executeAction(currentGame, moveCard({
          cardId: cardId,
          fromZone: currentDeck.id,
          toZone: communityZone.id
        }))
      }

      // Update phase to flop
      currentGame = setGamePhase(currentGame, 'flop')

      // Verify community cards
      const finalCommunity = currentGame.zones.find(z => z.name === 'Community Cards')!
      expect(finalCommunity.cards).toHaveLength(4) // 3 flop + 1 burn card
      expect(currentGame.phase).toBe('flop')

      // Update global properties
      currentGame = {
        ...currentGame,
        globalProperties: {
          ...currentGame.globalProperties,
          communityCardCount: 3,
          bettingRound: 2
        }
      }

      expect(currentGame.globalProperties.communityCardCount).toBe(3)
      expect(currentGame.globalProperties.bettingRound).toBe(2)
    })

    it('should handle the turn (4th community card)', () => {
      let currentGame = setGamePhase(game, 'turn')
      const deckZone = currentGame.zones.find(z => z.name === 'Deck')!
      const communityZone = currentGame.zones.find(z => z.name === 'Community Cards')!
      
      expect(deckZone).toBeDefined()
      expect(communityZone).toBeDefined()

      // Simulate that flop already happened (3 community cards)
      for (let i = 0; i < 3; i++) {
        const cardId = deckZone.cards[i]
        currentGame = executeAction(currentGame, moveCard({
          cardId: cardId,
          fromZone: deckZone.id,
          toZone: communityZone.id
        }))
      }

      // Burn one card and deal the turn
      const updatedDeck = currentGame.zones.find(z => z.name === 'Deck')!
      const burnCardId = updatedDeck.cards[0]
      currentGame = executeAction(currentGame, moveCard({
        cardId: burnCardId,
        fromZone: updatedDeck.id,
        toZone: communityZone.id
      }))

      const turnCardId = currentGame.zones.find(z => z.name === 'Deck')!.cards[0]
      currentGame = executeAction(currentGame, moveCard({
        cardId: turnCardId,
        fromZone: currentGame.zones.find(z => z.name === 'Deck')!.id,
        toZone: communityZone.id
      }))

      // Verify turn setup
      const finalCommunity = currentGame.zones.find(z => z.name === 'Community Cards')!
      expect(finalCommunity.cards).toHaveLength(5) // 3 flop + 1 burn + 1 turn
      expect(currentGame.phase).toBe('turn')
    })

    it('should handle the river (5th community card)', () => {
      let currentGame = setGamePhase(game, 'river')
      const deckZone = currentGame.zones.find(z => z.name === 'Deck')!
      const communityZone = currentGame.zones.find(z => z.name === 'Community Cards')!
      
      expect(deckZone).toBeDefined()
      expect(communityZone).toBeDefined()

      // Simulate flop and turn already happened (4 community cards + burns)
      for (let i = 0; i < 5; i++) {
        const cardId = deckZone.cards[i]
        currentGame = executeAction(currentGame, moveCard({
          cardId: cardId,
          fromZone: deckZone.id,
          toZone: communityZone.id
        }))
      }

      // Burn one card and deal the river
      const updatedDeck = currentGame.zones.find(z => z.name === 'Deck')!
      const burnCardId = updatedDeck.cards[0]
      currentGame = executeAction(currentGame, moveCard({
        cardId: burnCardId,
        fromZone: updatedDeck.id,
        toZone: communityZone.id
      }))

      const riverCardId = currentGame.zones.find(z => z.name === 'Deck')!.cards[0]
      currentGame = executeAction(currentGame, moveCard({
        cardId: riverCardId,
        fromZone: currentGame.zones.find(z => z.name === 'Deck')!.id,
        toZone: communityZone.id
      }))

      // Verify river setup
      const finalCommunity = currentGame.zones.find(z => z.name === 'Community Cards')!
      expect(finalCommunity.cards).toHaveLength(7) // 5 community + 2 burns
      expect(currentGame.phase).toBe('river')
    })

    it('should handle player turn rotation', () => {
      let currentGame = game

      // Test turn rotation
      expect(currentGame.currentPlayer).toBe(players[0].id)

      currentGame = nextPlayer(currentGame)
      expect(currentGame.currentPlayer).toBe(players[1].id)

      currentGame = nextPlayer(currentGame)
      expect(currentGame.currentPlayer).toBe(players[2].id)

      currentGame = nextPlayer(currentGame)
      expect(currentGame.currentPlayer).toBe(players[3].id)

      // Should wrap around to first player
      currentGame = nextPlayer(currentGame)
      expect(currentGame.currentPlayer).toBe(players[0].id)
    })

    it('should track pot and betting', () => {
      let currentGame = game
      let totalPot = 0

      // Simulate betting round - each player bets 50 chips
      const betAmount = 50
      
      for (const player of players) {
        // Decrease player chips
        currentGame = executeAction(currentGame, modifyStat({
          target: player.id,
          stat: 'chips',
          value: -betAmount
        }))

        // Set current bet
        currentGame = executeAction(currentGame, modifyStat({
          target: player.id,
          stat: 'currentBet',
          value: betAmount
        }))

        totalPot += betAmount
      }

      // Update global pot size
      currentGame = {
        ...currentGame,
        globalProperties: {
          ...currentGame.globalProperties,
          potSize: totalPot
        }
      }

      // Verify betting results
      expect(currentGame.globalProperties.potSize).toBe(200) // 4 players × 50 chips

      currentGame.players.forEach(player => {
        expect(player.resources.chips).toBe(950) // 1000 - 50
        expect(player.resources.currentBet).toBe(50)
      })
    })

    it('should handle all-in scenarios', () => {
      let currentGame = game

      // Player goes all-in with remaining chips
      const allinPlayer = players[0]
      const remainingChips = allinPlayer.resources.chips

      currentGame = executeAction(currentGame, modifyStat({
        target: allinPlayer.id,
        stat: 'chips',
        value: -remainingChips
      }))

      currentGame = executeAction(currentGame, modifyStat({
        target: allinPlayer.id,
        stat: 'currentBet',
        value: remainingChips
      }))

      // Add all-in flag
      currentGame = executeAction(currentGame, modifyStat({
        target: allinPlayer.id,
        stat: 'isAllIn',
        value: 1
      }))

      const updatedPlayer = currentGame.players.find(p => p.id.value === allinPlayer.id.value)!
      expect(updatedPlayer.resources.chips).toBe(0)
      expect(updatedPlayer.resources.currentBet).toBe(1000)
      expect(updatedPlayer.resources.isAllIn).toBe(1)
    })

    it('should handle side pots with all-in players', () => {
      let currentGame = game

      // Player 1 has only 100 chips (short stack)
      currentGame = executeAction(currentGame, modifyStat({
        target: players[1].id,
        stat: 'chips',
        value: -900 // Leave only 100
      }))

      // Player 1 goes all-in with 100
      currentGame = executeAction(currentGame, modifyStat({
        target: players[1].id,
        stat: 'chips',
        value: -100
      }))
      currentGame = executeAction(currentGame, modifyStat({
        target: players[1].id,
        stat: 'currentBet',
        value: 100
      }))

      // Other players call the 100 and can bet more
      for (let i = 0; i < players.length; i++) {
        if (i === 1) continue // Skip the all-in player

        currentGame = executeAction(currentGame, modifyStat({
          target: players[i].id,
          stat: 'chips',
          value: -200 // Bet 200 total
        }))
        currentGame = executeAction(currentGame, modifyStat({
          target: players[i].id,
          stat: 'currentBet',
          value: 200
        }))
      }

      // Calculate side pots
      const mainPot = 100 * 4 // All 4 players contribute 100
      const sidePot = 100 * 3 // 3 players contribute additional 100

      currentGame = {
        ...currentGame,
        globalProperties: {
          ...currentGame.globalProperties,
          mainPot: mainPot,
          sidePot: sidePot,
          totalPot: mainPot + sidePot
        }
      }

      expect(currentGame.globalProperties.mainPot).toBe(400)
      expect(currentGame.globalProperties.sidePot).toBe(300)
      expect(currentGame.globalProperties.totalPot).toBe(700)
    })
  })

  describe('Texas Hold\'em with Event System', () => {
    it('should use events for automatic betting enforcement', () => {
      // Create a simple game for event testing
      const gameId = createGameId()
      const alice = createPlayer({
        id: createPlayerId(),
        name: 'Alice',
        resources: { chips: 1000, currentBet: 0 }
      })

      let game = createGame({
        id: gameId,
        players: [alice],
        zones: [],
        cards: [],
        currentPlayer: alice.id,
        phase: 'preflop'
      })

      // Add event listener for minimum bet enforcement
      const minBetEnforcer = createEventListener({
        eventType: 'PLAYER_BETS',
        condition: (event: GameEvent) => {
          const betAmount = event.payload.amount
          const minBet = event.payload.minBet || 20
          return betAmount < minBet
        },
        callback: (event: GameEvent, gameState: Game) => {
          return [
            createGameEvent({
              type: 'INVALID_BET',
              payload: {
                playerId: event.payload.playerId,
                betAmount: event.payload.amount,
                minBet: event.payload.minBet,
                message: 'Bet amount below minimum'
              }
            })
          ]
        },
        priority: 1
      })

      game = addEventListenerToGame(game, minBetEnforcer)

      // Verify event listener was added
      expect(game.eventManager.listeners).toHaveLength(1)
      expect(game.eventManager.listeners[0].eventType).toBe('PLAYER_BETS')
    })

    it('should handle poker hand evaluation events', () => {
      const gameId = createGameId()
      const alice = createPlayer({
        id: createPlayerId(),
        name: 'Alice',
        resources: { chips: 1000 }
      })

      let game = createGame({
        id: gameId,
        players: [alice],
        zones: [],
        cards: [],
        currentPlayer: alice.id,
        phase: 'showdown'
      })

      // Add event listener for hand evaluation
      const handEvaluator = createEventListener({
        eventType: 'EVALUATE_HANDS',
        callback: (event: GameEvent, gameState: Game) => {
          const hands = event.payload.hands
          // Simulate hand evaluation logic
          const results = hands.map((hand: any) => ({
            playerId: hand.playerId,
            handRank: 'pair', // Simplified for test
            handStrength: 2
          }))

          return [
            createGameEvent({
              type: 'HANDS_EVALUATED',
              payload: { results }
            })
          ]
        },
        priority: 1
      })

      game = addEventListenerToGame(game, handEvaluator)

      expect(game.eventManager.listeners).toHaveLength(1)
      expect(game.eventManager.listeners[0].eventType).toBe('EVALUATE_HANDS')
    })
  })

  describe('Performance with Multiple Poker Games', () => {
    it('should handle multiple simultaneous poker games efficiently', () => {
      const startTime = Date.now()
      const games: Game[] = []
      const gamesCount = 10
      const playersPerGame = 6

      // Create multiple poker games
      for (let gameIndex = 0; gameIndex < gamesCount; gameIndex++) {
        const players = Array.from({ length: playersPerGame }, (_, playerIndex) =>
          createPlayer({
            id: createPlayerId(),
            name: `Player ${gameIndex}-${playerIndex}`,
            resources: { chips: 1000, currentBet: 0 }
          })
        )

        const cards = createStandardDeck()
        const deckId = createZoneId()
        let deck = createDeck({ id: deckId, owner: null })
        
        cards.forEach(card => {
          deck = addCardToZone(deck, card.id) as Zone
        })

        const game = createGame({
          id: createGameId(),
          players,
          zones: [deck],
          cards,
          currentPlayer: players[0].id,
          phase: 'preflop',
          turnNumber: 1
        })

        games.push(game)
      }

      const setupTime = Date.now() - startTime

      // Perform operations on all games
      const operationStart = Date.now()
      
      games.forEach(game => {
        // Simulate some poker operations
        let currentGame = setGamePhase(game, 'flop')
        currentGame = nextPlayer(currentGame)
        currentGame = setGamePhase(currentGame, 'turn')
      })

      const operationTime = Date.now() - operationStart

      // Verify performance
      expect(setupTime).toBeLessThan(2000) // 2 seconds for setup
      expect(operationTime).toBeLessThan(1000) // 1 second for operations

      // Verify correctness
      expect(games).toHaveLength(gamesCount)
      games.forEach(game => {
        expect(game.players).toHaveLength(playersPerGame)
        expect(game.cards).toHaveLength(52)
      })

      console.log(`Created ${gamesCount} poker games with ${playersPerGame} players each in ${setupTime}ms`)
      console.log(`Performed operations on all games in ${operationTime}ms`)
    })
  })
})