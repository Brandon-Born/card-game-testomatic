// Core Game Types - Based on Framework Documentation

export interface GameId {
  readonly value: string;
}

export interface PlayerId {
  readonly value: string;
}

export interface CardId {
  readonly value: string;
}

export interface ZoneId {
  readonly value: string;
}

// Game Object Primitives (The Nouns)

export interface Card {
  readonly id: CardId;
  readonly name: string;
  readonly text: string;
  readonly type: string;
  readonly owner: PlayerId;
  readonly currentZone: ZoneId;
  readonly properties: Record<string, any>;
  readonly counters: Counter[];
  readonly isTapped: boolean;
}

export interface Counter {
  readonly type: string;
  readonly count: number;
}

export interface Zone {
  readonly id: ZoneId;
  readonly name: string;
  readonly owner: PlayerId | null; // null for public zones
  readonly cards: CardId[];
  readonly visibility: 'public' | 'private';
  readonly order: 'ordered' | 'unordered';
  readonly maxSize?: number;
}

export interface Deck extends Zone {
  readonly type: 'deck';
}

export interface Hand extends Zone {
  readonly type: 'hand';
}

export interface DiscardPile extends Zone {
  readonly type: 'discard';
}

export interface PlayArea extends Zone {
  readonly type: 'playarea';
}

export interface Stack extends Zone {
  readonly type: 'stack';
}

export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly resources: Record<string, number>; // life, mana, etc.
  readonly zones: ZoneId[];
  readonly counters: Counter[];
}

export interface Game {
  readonly id: GameId;
  readonly players: Player[];
  readonly zones: Zone[];
  readonly cards: Card[];
  readonly currentPlayer: PlayerId;
  readonly phase: string;
  readonly turnNumber: number;
  readonly stack: Stack;
  readonly globalProperties: Record<string, any>;
}

// Event System Types

export interface GameEvent<T = any> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
  readonly triggeredBy: PlayerId | 'system';
}

export interface EventListener {
  readonly eventType: string;
  readonly condition?: (event: GameEvent) => boolean;
  readonly action: (event: GameEvent, game: Game) => GameAction[];
}

// Action System Types

export interface GameAction {
  readonly type: string;
  readonly payload: any;
  readonly playerId?: PlayerId;
}

export interface MoveCardAction extends GameAction {
  readonly type: 'MOVE_CARD';
  readonly payload: {
    cardId: CardId;
    fromZone: ZoneId;
    toZone: ZoneId;
    position?: number;
  };
}

export interface DrawCardsAction extends GameAction {
  readonly type: 'DRAW_CARDS';
  readonly payload: {
    playerId: PlayerId;
    count: number;
  };
}

export interface PlayCardAction extends GameAction {
  readonly type: 'PLAY_CARD';
  readonly payload: {
    cardId: CardId;
    playerId: PlayerId;
    targets?: CardId[] | PlayerId[];
  };
}

export interface ModifyStatAction extends GameAction {
  readonly type: 'MODIFY_STAT';
  readonly payload: {
    target: CardId | PlayerId;
    stat: string;
    value: number;
  };
}

// Phase System Types

export interface Phase {
  readonly name: string;
  readonly allowedActions: string[];
  readonly autoAdvance?: boolean;
  readonly onEnter?: (game: Game) => GameAction[];
  readonly onExit?: (game: Game) => GameAction[];
}

// Rule Definition Types (for the visual designer)

export interface TriggerNode {
  readonly id: string;
  readonly type: string;
  readonly eventType: string;
  readonly condition?: string;
  readonly position: { x: number; y: number };
}

export interface ActionNode {
  readonly id: string;
  readonly type: string;
  readonly actionType: string;
  readonly parameters: Record<string, any>;
  readonly position: { x: number; y: number };
}

export interface RuleConnection {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
}

export interface GameRule {
  readonly id: string;
  readonly name: string;
  readonly triggers: TriggerNode[];
  readonly actions: ActionNode[];
  readonly connections: RuleConnection[];
}

// UI/App Types

export interface User {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly subscriptionTier: 'free' | 'pro';
}

export interface GameProject {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly ownerUid: string;
  readonly cards: Card[];
  readonly rules: GameRule[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GameSession {
  readonly id: string;
  readonly gameId: string;
  readonly players: PlayerId[];
  readonly gameState: Game;
  readonly isActive: boolean;
  readonly createdAt: Date;
}