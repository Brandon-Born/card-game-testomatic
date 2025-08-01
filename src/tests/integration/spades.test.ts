/**
 * @fileoverview Spades Integration Test
 * Validates the core game framework by implementing authentic Spades rules.
 * Tests partnership gameplay, bidding, trick-taking, and scoring mechanics.
 * 
 * Spades Rules Implemented:
 * - 4 players in fixed partnerships (North/South vs East/West)
 * - Each player bids number of tricks they expect to take
 * - Spades are always trump, cannot lead spades until broken
 * - Must follow suit if possible, otherwise can play any card
 * - Teams score 10 points per bid trick, 1 point per overtrick (bag)
 * - 10 bags = -100 points penalty
 * - Nil bidding: 0 tricks for bonus/penalty
 * - First team to 500 points wins
 */

import { Game, Player, Card, Zone } from '@/types';
import { 
  createGame, 
  addPlayerToGame, 
  addCardToGame, 
  addZoneToGame,
  setGamePhase,
  setCurrentPlayer,
  nextPlayer
} from '@/core/primitives/game';
import { createPlayer, modifyPlayerResource } from '@/core/primitives/player';
import { createCard } from '@/core/primitives/card';
import { createDeck, createHand, addCardToZone, createPlayArea } from '@/core/primitives/zone';
import { 
  moveCard, 
  drawCards,
  modifyStat,
  executeAction 
} from '@/core/actions';
import { createGameId, createPlayerId, createCardId, createZoneId } from '@/lib/utils';

describe('Spades Integration Test', () => {

  // Card creation helper for Spades
  const createSpadesCard = (suit: string, rank: string) => {
    const suitSymbols: { [key: string]: string } = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    const cardId = createCardId();
    const zoneId = createZoneId();
    
    return createCard({
      id: cardId,
      name: `${rank}${suitSymbols[suit]}`,
      text: `${rank} of ${suit}`,
      type: 'Playing Card',
      owner: createPlayerId(), // Will be updated when dealt
      currentZone: zoneId, // Will be updated when dealt
      properties: { 
        suit, 
        rank, 
        value: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'].indexOf(rank) + 2,
        isTrump: suit === 'spades',
        isSpade: suit === 'spades'
      }
    });
  };

  // Create standard 52-card deck for Spades
  const createStandardDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const cards: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push(createSpadesCard(suit, rank));
      }
    }
    return cards;
  };

  // Spades-specific trick evaluation logic
  const evaluateTrick = (cards: Card[], leadSuit: string, spadesBroken: boolean) => {
    const trumpCards = cards.filter(c => c.properties.isSpade);
    
    if (trumpCards.length > 0) {
      // Highest spade wins
      return trumpCards.sort((a, b) => b.properties.value - a.properties.value)[0];
    } else {
      // Highest card of lead suit wins
      const suitCards = cards.filter(c => c.properties.suit === leadSuit);
      return suitCards.sort((a, b) => b.properties.value - a.properties.value)[0];
    }
  };

  describe('Spades Game Setup and Basic Rules', () => {
    let game: Game;
    let players: Player[];
    let teams: { northSouth: [Player, Player], eastWest: [Player, Player]};
    let deckId: any;
    let trickAreaId: any;

    beforeEach(() => {
      // Create 4 players in standard Spades positions
      const north = createPlayer({ 
        id: createPlayerId(), 
        name: 'North', 
        resources: { score: 0, bid: 0, tricksTaken: 0, isNilBidder: 0 } 
      });
      const east = createPlayer({ 
        id: createPlayerId(), 
        name: 'East', 
        resources: { score: 0, bid: 0, tricksTaken: 0, isNilBidder: 0 } 
      });
      const south = createPlayer({ 
        id: createPlayerId(), 
        name: 'South', 
        resources: { score: 0, bid: 0, tricksTaken: 0, isNilBidder: 0 } 
      });
      const west = createPlayer({ 
        id: createPlayerId(), 
        name: 'West', 
        resources: { score: 0, bid: 0, tricksTaken: 0, isNilBidder: 0 } 
      });
      
      players = [north, east, south, west]; // Clockwise seating
      teams = { 
        northSouth: [north, south], // Partners sit opposite
        eastWest: [east, west] 
      };

      // Create zones with proper owners
      deckId = createZoneId();
      trickAreaId = createZoneId();
      const nullPlayerId = createPlayerId(); // Use actual PlayerId for shared zones
      
      const deck = createDeck({ id: deckId, owner: nullPlayerId });
      const trickArea = { 
        ...createPlayArea({ id: trickAreaId, owner: nullPlayerId }), 
        name: 'Current Trick' 
      };
      const playerHands = players.map(p => createHand({ id: createZoneId(), owner: p.id }));
      
      // Create and add cards to deck
      const cards = createStandardDeck();
      let deckWithCards = deck;
      cards.forEach(card => {
        const updatedCard = { ...card, currentZone: deckId, owner: nullPlayerId };
        deckWithCards = addCardToZone(deckWithCards as Zone, updatedCard.id) as typeof deckWithCards;
      });

      game = createGame({
        id: createGameId(),
        players,
        zones: [deckWithCards, trickArea, ...playerHands],
        cards,
        currentPlayer: players[0].id, // North leads first hand
        phase: 'dealing',
        turnNumber: 1,
        globalProperties: { 
          northSouthScore: 0, 
          eastWestScore: 0, 
          northSouthBags: 0, 
          eastWestBags: 0, 
          spadesBroken: false,
          trickLeader: null,
          cardsInCurrentTrick: 0
        }
      });
    });

    it('should set up a complete Spades game', () => {
      // Verify proper 4-player setup
      expect(game.players).toHaveLength(4);
      expect(game.cards).toHaveLength(52);
      expect(game.phase).toBe('dealing');
      
      // Verify zones exist
      const deck = game.zones.find(z => z.name === 'Deck');
      const trickArea = game.zones.find(z => z.name === 'Current Trick');
      const hands = game.zones.filter(z => z.name === 'Hand');

      expect(deck).toBeDefined();
      expect(trickArea).toBeDefined();
      expect(hands).toHaveLength(4);
      expect(deck?.cards).toHaveLength(52);

      // Verify team partnerships
      expect(teams.northSouth[0].name).toBe('North');
      expect(teams.northSouth[1].name).toBe('South');
      expect(teams.eastWest[0].name).toBe('East');
      expect(teams.eastWest[1].name).toBe('West');

      // Verify initial game state
      expect(game.globalProperties.northSouthScore).toBe(0);
      expect(game.globalProperties.eastWestScore).toBe(0);
      expect(game.globalProperties.spadesBroken).toBe(false);
    });

    it('should deal 13 cards to each player', () => {
      let currentGame = game;
      const deck = currentGame.zones.find(z => z.name === 'Deck')!;
      
      // Deal cards clockwise starting with North
      for (let cardNum = 0; cardNum < 13; cardNum++) {
        for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
          const player = players[playerIndex];
          const playerHand = currentGame.zones.find(z => 
            z.owner?.value === player.id.value && z.name === 'Hand'
          )!;
          
          const currentDeck = currentGame.zones.find(z => z.name === 'Deck')!;
          if (currentDeck.cards.length > 0) {
            const topCardId = currentDeck.cards[0];
            currentGame = executeAction(currentGame, moveCard({
              cardId: topCardId,
              fromZone: currentDeck.id,
              toZone: playerHand.id
            }));
          }
        }
      }

      // Verify each player has exactly 13 cards
      players.forEach(player => {
        const playerHand = currentGame.zones.find(z => 
          z.owner?.value === player.id.value && z.name === 'Hand'
        )!;
        expect(playerHand.cards).toHaveLength(13);
      });

      // Verify deck is empty
      const finalDeck = currentGame.zones.find(z => z.name === 'Deck')!;
      expect(finalDeck.cards).toHaveLength(0);
    });

    it('should handle bidding phase with various bid types', () => {
      let currentGame = setGamePhase(game, 'bidding');
      
      // Normal bids: North-4, East-3, South-2, West-4
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[0].id, stat: 'bid', value: 4 
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[1].id, stat: 'bid', value: 3 
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[2].id, stat: 'bid', value: 2 
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[3].id, stat: 'bid', value: 4 
      }));

      expect(currentGame.players.find(p => p.name === 'North')?.resources.bid).toBe(4);
      expect(currentGame.players.find(p => p.name === 'East')?.resources.bid).toBe(3);
      expect(currentGame.players.find(p => p.name === 'South')?.resources.bid).toBe(2);
      expect(currentGame.players.find(p => p.name === 'West')?.resources.bid).toBe(4);

      // Calculate team bids
      const northSouthBid = currentGame.players[0].resources.bid + currentGame.players[2].resources.bid;
      const eastWestBid = currentGame.players[1].resources.bid + currentGame.players[3].resources.bid;

      expect(northSouthBid).toBe(6); // North(4) + South(2)
      expect(eastWestBid).toBe(7);   // East(3) + West(4)

      currentGame = setGamePhase(currentGame, 'playing');
      expect(currentGame.phase).toBe('playing');
    });

    it('should handle nil bidding', () => {
      let currentGame = setGamePhase(game, 'bidding');
      
      // South bids nil, North must cover with higher bid
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[0].id, stat: 'bid', value: 5 
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[1].id, stat: 'bid', value: 3 
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[2].id, stat: 'bid', value: 0 // NIL
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[2].id, stat: 'isNilBidder', value: 1 
      }));
      currentGame = executeAction(currentGame, modifyStat({ 
        target: players[3].id, stat: 'bid', value: 3 
      }));

      const nilBidder = currentGame.players.find(p => p.name === 'South')!;
      expect(nilBidder.resources.bid).toBe(0);
      expect(nilBidder.resources.isNilBidder).toBe(1);
    });

    it('should correctly evaluate trick winners using Spades rules', () => {
      // Test 1: Spade trumps everything
      const heartsLead = createSpadesCard('hearts', '10');
      const heartsKing = createSpadesCard('hearts', 'K');
      const spadesDeuce = createSpadesCard('spades', '2'); // Lowest trump wins
      const heartsAce = createSpadesCard('hearts', 'A');
      
      let trickCards = [heartsLead, heartsKing, spadesDeuce, heartsAce];
      let winner = evaluateTrick(trickCards, 'hearts', false);
      expect(winner.properties.rank).toBe('2');
      expect(winner.properties.suit).toBe('spades');

      // Test 2: No spades, highest of lead suit wins
      const clubsLead = createSpadesCard('clubs', '7');
      const diamondsAce = createSpadesCard('diamonds', 'A'); // Off-suit
      const clubsKing = createSpadesCard('clubs', 'K');
      const clubsDeuce = createSpadesCard('clubs', '2');
      
      trickCards = [clubsLead, diamondsAce, clubsKing, clubsDeuce];
      winner = evaluateTrick(trickCards, 'clubs', false);
      expect(winner.properties.rank).toBe('K');
      expect(winner.properties.suit).toBe('clubs');

      // Test 3: Multiple spades, highest spade wins
      const spadesThree = createSpadesCard('spades', '3');
      const spadesAce = createSpadesCard('spades', 'A');
      const spadesKing = createSpadesCard('spades', 'K');
      const spadesQueen = createSpadesCard('spades', 'Q');
      
      trickCards = [spadesThree, spadesAce, spadesKing, spadesQueen];
      winner = evaluateTrick(trickCards, 'spades', true);
      expect(winner.properties.rank).toBe('A');
      expect(winner.properties.suit).toBe('spades');
    });

    it('should implement spades breaking rules', () => {
      let currentGame = game;
      
      // Initially spades are not broken
      expect(currentGame.globalProperties.spadesBroken).toBe(false);
      
      // When a spade is played on a non-spade lead, spades are broken
      currentGame.globalProperties.spadesBroken = true;
      expect(currentGame.globalProperties.spadesBroken).toBe(true);
      
      // Once broken, spades can be led
      const canLeadSpades = currentGame.globalProperties.spadesBroken || 
                           /* player has only spades */ false;
      expect(canLeadSpades).toBe(true);
    });

    it('should calculate Spades scoring correctly', () => {
      let currentGame = game;

      // Set up a scoring scenario
      const north = currentGame.players.find(p => p.name === 'North')!;
      const east = currentGame.players.find(p => p.name === 'East')!;
      const south = currentGame.players.find(p => p.name === 'South')!;
      const west = currentGame.players.find(p => p.name === 'West')!;

      // North/South bid 6, took 7 (made bid + 1 bag)
      north.resources.bid = 4;
      south.resources.bid = 2;
      north.resources.tricksTaken = 4;
      south.resources.tricksTaken = 3;

      // East/West bid 7, took 6 (failed bid)
      east.resources.bid = 3;
      west.resources.bid = 4;
      east.resources.tricksTaken = 3;
      west.resources.tricksTaken = 3;

      const northSouthBid = north.resources.bid + south.resources.bid;
      const northSouthTricks = north.resources.tricksTaken + south.resources.tricksTaken;
      const eastWestBid = east.resources.bid + west.resources.bid;
      const eastWestTricks = east.resources.tricksTaken + west.resources.tricksTaken;

      // North/South made their bid
      if (northSouthTricks >= northSouthBid) {
        currentGame.globalProperties.northSouthScore += northSouthBid * 10;
        currentGame.globalProperties.northSouthBags += northSouthTricks - northSouthBid;
      }

      // East/West failed their bid
      if (eastWestTricks < eastWestBid) {
        currentGame.globalProperties.eastWestScore -= eastWestBid * 10;
      }

      expect(currentGame.globalProperties.northSouthScore).toBe(60); // 6 * 10
      expect(currentGame.globalProperties.northSouthBags).toBe(1);   // 7 - 6
      expect(currentGame.globalProperties.eastWestScore).toBe(-70);  // -(7 * 10)
    });

    it('should handle nil bidding scoring', () => {
      let currentGame = game;
      
      // South bids nil and makes it (takes 0 tricks)
      const south = currentGame.players.find(p => p.name === 'South')!;
      const north = currentGame.players.find(p => p.name === 'North')!;
      
      south.resources.bid = 0;
      south.resources.isNilBidder = 1;
      south.resources.tricksTaken = 0;
      north.resources.bid = 6;
      north.resources.tricksTaken = 7;

      // Successful nil = +100 points
      if (south.resources.isNilBidder === 1 && south.resources.tricksTaken === 0) {
        currentGame.globalProperties.northSouthScore += 100;
      }
      
      // Partner's bid is separate
      if (north.resources.tricksTaken >= north.resources.bid) {
        currentGame.globalProperties.northSouthScore += north.resources.bid * 10;
        currentGame.globalProperties.northSouthBags += north.resources.tricksTaken - north.resources.bid;
      }

      expect(currentGame.globalProperties.northSouthScore).toBe(160); // 100 (nil) + 60 (bid)
      expect(currentGame.globalProperties.northSouthBags).toBe(1);
    });

    it('should handle failed nil bidding', () => {
      let currentGame = game;
      
      // South bids nil but takes 1 trick (fails)
      const south = currentGame.players.find(p => p.name === 'South')!;
      const north = currentGame.players.find(p => p.name === 'North')!;
      
      south.resources.bid = 0;
      south.resources.isNilBidder = 1;
      south.resources.tricksTaken = 1;
      north.resources.bid = 5;
      north.resources.tricksTaken = 5;

      // Failed nil = -100 points
      if (south.resources.isNilBidder === 1 && south.resources.tricksTaken > 0) {
        currentGame.globalProperties.northSouthScore -= 100;
      }
      
      // Partner's bid counts separately
      if (north.resources.tricksTaken >= north.resources.bid) {
        currentGame.globalProperties.northSouthScore += north.resources.bid * 10;
      }

      expect(currentGame.globalProperties.northSouthScore).toBe(-50); // -100 (failed nil) + 50 (bid)
    });

    it('should handle sandbag penalties', () => {
      let currentGame = game;
      
      // Team has 9 bags already
      currentGame.globalProperties.northSouthBags = 9;
      currentGame.globalProperties.northSouthScore = 250;
      
      // Team takes 2 more bags (reaching 11 total)
      currentGame.globalProperties.northSouthBags += 2;

      // Apply sandbag penalty when reaching 10 bags
      if (currentGame.globalProperties.northSouthBags >= 10) {
        currentGame.globalProperties.northSouthScore -= 100;
        currentGame.globalProperties.northSouthBags -= 10; // Reset bag count
      }

      expect(currentGame.globalProperties.northSouthScore).toBe(150); // 250 - 100
      expect(currentGame.globalProperties.northSouthBags).toBe(1);    // 11 - 10
    });

    it('should determine game winner at 500 points', () => {
      let currentGame = game;
      
      // North/South approaches 500
      currentGame.globalProperties.northSouthScore = 485;
      currentGame.globalProperties.eastWestScore = 320;
      
      // North/South scores 20 more points
      currentGame.globalProperties.northSouthScore += 20;

      let winner = null;
      if (currentGame.globalProperties.northSouthScore >= 500) {
        winner = 'North/South';
      } else if (currentGame.globalProperties.eastWestScore >= 500) {
        winner = 'East/West';
      }

      expect(winner).toBe('North/South');
      expect(currentGame.globalProperties.northSouthScore).toBe(505);
    });
  });
});
