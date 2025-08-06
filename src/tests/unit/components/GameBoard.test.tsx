import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameBoard from '@/components/game/GameBoard'
import { GameConfiguration } from '@/types'

// Mock the core primitives
jest.mock('@/core/primitives', () => ({
  ...jest.requireActual('@/core/primitives'),
  createPlayer: jest.fn((props) => ({
    id: props.id,
    name: props.name,
    resources: props.resources || {},
    zones: [],
    counters: [],
  })),
  createGame: jest.fn((props) => ({
    id: props.id,
    players: props.players,
    zones: props.zones,
    cards: props.cards,
    currentPlayer: props.currentPlayer,
    phase: 'main',
    turnNumber: 1,
    stack: { id: { value: 'stack' }, name: 'Stack', owner: null, cards: [], visibility: 'public', order: 'ordered' },
    globalProperties: {},
    eventManager: { listeners: [], eventQueue: [], isProcessing: false },
  })),
}))

describe('GameBoard', () => {
  it('initializes with the minimum number of players from gameConfig', async () => {
    const projectData = {
      name: 'Test Project',
      cards: [],
      rules: [],
      zones: [],
      gameConfig: {
        playerCount: {
          min: 3,
          max: 5,
        },
      } as GameConfiguration,
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('Player 2')).toBeInTheDocument()
      expect(screen.getByText('Player 3')).toBeInTheDocument()
      expect(screen.queryByText('Player 4')).not.toBeInTheDocument()
    })
  })

  it('defaults to 2 players if gameConfig is not provided', async () => {
    const projectData = {
      name: 'Test Project',
      cards: [],
      rules: [],
      zones: [],
      gameConfig: {},
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('Player 2')).toBeInTheDocument()
      expect(screen.queryByText('Player 3')).not.toBeInTheDocument()
    })
  })
})
