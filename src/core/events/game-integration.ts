/**
 * @fileoverview Game Integration for Event System
 * Functions to integrate events with game state
 */

import { Game, EventListener } from '@/types'
import { updateGame } from '@/core/primitives/game'
import { subscribeToEvent, unsubscribeFromEvent } from './event-listeners'
import { createEventManager } from './event-manager'

export function addEventListenerToGame(game: Game, listener: EventListener): Game {
  const updatedEventManager = subscribeToEvent(game.eventManager, listener)
  
  return updateGame(game, {
    eventManager: updatedEventManager
  })
}

export function removeEventListenerFromGame(game: Game, listenerId: string): Game {
  const updatedEventManager = unsubscribeFromEvent(game.eventManager, listenerId)
  
  return updateGame(game, {
    eventManager: updatedEventManager
  })
}

export function getActiveListeners(game: Game, eventType?: string): EventListener[] {
  if (eventType) {
    return game.eventManager.listeners.filter(listener => listener.eventType === eventType)
  }
  
  return [...game.eventManager.listeners]
}

export function initializeGameWithEventManager(game: Game): Game {
  if (game.eventManager) {
    return game
  }

  return updateGame(game, {
    eventManager: createEventManager()
  })
}