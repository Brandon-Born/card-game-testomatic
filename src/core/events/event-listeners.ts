/**
 * @fileoverview Event Listener Management
 * Subscribe and unsubscribe from events
 */

import { EventManager, EventListener, GameEvent, Game } from '@/types'
import { createUniqueId } from '@/lib/utils'

export interface CreateEventListenerParams {
  eventType: string
  callback: (event: GameEvent, game: Game) => GameEvent[] | void
  condition?: (event: GameEvent) => boolean
  priority?: number
}

export function createEventListener(params: CreateEventListenerParams): EventListener {
  if (!params.eventType || params.eventType.trim() === '') {
    throw new Error('Event type cannot be empty')
  }

  if (!params.callback || typeof params.callback !== 'function') {
    throw new Error('Callback must be a function')
  }

  return {
    id: createUniqueId(),
    eventType: params.eventType,
    callback: params.callback,
    condition: params.condition,
    priority: params.priority || 0
  }
}

export function subscribeToEvent(manager: EventManager, listener: EventListener): EventManager {
  // Check for duplicate listener ID
  if (manager.listeners.some(l => l.id === listener.id)) {
    throw new Error('Listener with this ID already exists')
  }

  const updatedListeners = [...manager.listeners, listener]
    .sort((a, b) => a.priority - b.priority)

  return {
    ...manager,
    listeners: updatedListeners
  }
}

export function unsubscribeFromEvent(manager: EventManager, listenerId: string): EventManager {
  const listenerIndex = manager.listeners.findIndex(l => l.id === listenerId)
  
  if (listenerIndex === -1) {
    throw new Error('Listener not found')
  }

  const updatedListeners = [...manager.listeners]
  updatedListeners.splice(listenerIndex, 1)

  return {
    ...manager,
    listeners: updatedListeners
  }
}

export function clearAllListeners(manager: EventManager): EventManager {
  return {
    ...manager,
    listeners: []
  }
}

export function validateEventListener(listener: any): boolean {
  if (!listener || typeof listener !== 'object') {
    return false
  }

  const requiredFields = ['id', 'eventType', 'callback', 'priority']
  
  for (const field of requiredFields) {
    if (!(field in listener)) {
      return false
    }
  }

  if (typeof listener.eventType !== 'string' || listener.eventType.trim() === '') {
    return false
  }

  if (typeof listener.callback !== 'function') {
    return false
  }

  if (typeof listener.priority !== 'number') {
    return false
  }

  return true
}