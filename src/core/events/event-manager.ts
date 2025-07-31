/**
 * @fileoverview Event Manager Implementation
 * Core event publishing and processing system
 */

import { EventManager, GameEvent, EventListener, EventProcessingResult, Game } from '@/types'
import { createUniqueId } from '@/lib/utils'

export interface CreateEventManagerParams {
  maxQueueSize?: number
  enableLogging?: boolean
}

export function createEventManager(params: CreateEventManagerParams = {}): EventManager {
  return {
    listeners: [],
    eventQueue: [],
    isProcessing: false,
    maxQueueSize: params.maxQueueSize || 1000,
    enableLogging: params.enableLogging || false
  }
}

export function createGameEvent<T = any>(params: {
  type: string
  payload: T
  triggeredBy?: any
}): GameEvent<T> {
  return {
    id: createUniqueId(),
    type: params.type,
    payload: params.payload,
    timestamp: new Date(),
    triggeredBy: params.triggeredBy || 'system'
  }
}

export function publishEvent(manager: EventManager, event: GameEvent): EventManager {
  if (manager.maxQueueSize && manager.eventQueue.length >= manager.maxQueueSize) {
    throw new Error('Event queue is full')
  }

  return {
    ...manager,
    eventQueue: [...manager.eventQueue, event]
  }
}

export function processEvents(manager: EventManager, game: Game): EventProcessingResult {
  if (manager.isProcessing) {
    return {
      manager,
      game,
      processedEvents: [],
      generatedEvents: [],
      errors: ['Event processing already in progress']
    }
  }

  const result: EventProcessingResult = {
    manager: { ...manager, isProcessing: true, eventQueue: [] },
    game,
    processedEvents: [],
    generatedEvents: [],
    errors: []
  }

  const eventsToProcess = [...manager.eventQueue]
  const maxRecursionDepth = 10
  let recursionDepth = 0

  const processEventQueue = (events: GameEvent[]): void => {
    if (recursionDepth >= maxRecursionDepth) {
      result.errors.push('Maximum event recursion depth reached')
      return
    }

    recursionDepth++
    const newEvents: GameEvent[] = []

    for (const event of events) {
      result.processedEvents.push(event)

      // Find matching listeners
      const matchingListeners = manager.listeners
        .filter(listener => listener.eventType === event.type)
        .sort((a, b) => a.priority - b.priority)

      for (const listener of matchingListeners) {
        try {
          // Check condition if provided
          if (listener.condition && !listener.condition(event)) {
            continue
          }

          // Execute callback
          const generatedEvents = listener.callback(event, game)
          if (generatedEvents && Array.isArray(generatedEvents)) {
            newEvents.push(...generatedEvents)
            result.generatedEvents.push(...generatedEvents)
          }
        } catch (error) {
          result.errors.push(`Callback error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    if (newEvents.length > 0) {
      processEventQueue(newEvents)
    }
  }

  processEventQueue(eventsToProcess)

  return {
    ...result,
    manager: { ...result.manager, isProcessing: false }
  }
}

export function clearEventQueue(manager: EventManager): EventManager {
  return {
    ...manager,
    eventQueue: []
  }
}