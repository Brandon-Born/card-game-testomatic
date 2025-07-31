import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid'
import type { CardId, PlayerId, GameId, ZoneId } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ID Generation Utilities
export const createCardId = (): CardId => ({ value: uuidv4() })
export const createPlayerId = (): PlayerId => ({ value: uuidv4() })
export const createGameId = (): GameId => ({ value: uuidv4() })
export const createZoneId = (): ZoneId => ({ value: uuidv4() })

// Array utilities for immutable operations
export const removeFromArray = <T>(array: T[], predicate: (item: T) => boolean): T[] => 
  array.filter(item => !predicate(item))

export const updateInArray = <T>(array: T[], predicate: (item: T) => boolean, updater: (item: T) => T): T[] =>
  array.map(item => predicate(item) ? updater(item) : item)

export const insertIntoArray = <T>(array: T[], item: T, index?: number): T[] => {
  if (index === undefined) {
    return [...array, item]
  }
  return [...array.slice(0, index), item, ...array.slice(index)]
}

// Game-specific utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const drawFromTop = <T>(array: T[], count: number): { drawn: T[], remaining: T[] } => {
  const drawn = array.slice(0, count)
  const remaining = array.slice(count)
  return { drawn, remaining }
}

// Validation utilities
export const isValidId = (id: { value: string }): boolean => {
  return typeof id.value === 'string' && id.value.length > 0
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}