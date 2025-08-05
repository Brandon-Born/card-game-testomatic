import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameBoard from '@/components/game/GameBoard'
import type { ZoneTemplate } from '@/types'

// Mock the auth context and other dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } })
}))

jest.mock('@/hooks/useProjectManager', () => ({
  useProjectManager: () => ({
    projects: [],
    loadProjects: jest.fn(),
    loadProject: jest.fn()
  })
}))

describe('Simulator Zone Integration', () => {
  it('should use custom zones from project data instead of hardcoded zones', async () => {
    // Define custom zones that differ from the default setup
    const customZones: ZoneTemplate[] = [
      {
        id: 'custom-zone-1',
        name: 'Player 1 Library',
        type: 'deck',
        owner: 'player1',
        visibility: 'private',
        order: 'ordered',
        maxSize: 40, // Different from default 60
        description: 'Custom library zone'
      },
      {
        id: 'custom-zone-2',
        name: 'Player 1 Hand of Cards',
        type: 'hand',
        owner: 'player1',
        visibility: 'private',
        order: 'unordered', // Different from default ordered
        maxSize: 10, // Different from default 7
        description: 'Custom hand zone'
      },
      {
        id: 'custom-zone-3',
        name: 'Shared Battle Area',
        type: 'playarea',
        owner: 'shared',
        visibility: 'public',
        order: 'unordered',
        description: 'Shared battlefield'
      },
      {
        id: 'custom-zone-4',
        name: 'Player 2 Collection',
        type: 'deck',
        owner: 'player2',
        visibility: 'private',
        order: 'unordered', // Different from default ordered
        maxSize: 50,
        description: 'Player 2 custom deck'
      }
    ]

    const projectData = {
      name: 'Custom Zone Test Project',
      cards: [
        { name: 'Test Card 1', text: 'A test card', type: 'Creature' },
        { name: 'Test Card 2', text: 'Another test card', type: 'Spell' }
      ],
      rules: [],
      zones: customZones
    }

    render(<GameBoard projectData={projectData} />)

    // Wait for the game to initialize
    await waitFor(() => {
      // Check that custom zones message appears in game log
      expect(screen.getByText(/Custom Zones/)).toBeInTheDocument()
      expect(screen.getByText(/Loaded 4 custom zones from project/)).toBeInTheDocument()
    })

    // Verify that custom zone names are used instead of defaults
    await waitFor(() => {
      expect(screen.getByText('Player 1 Library')).toBeInTheDocument()
      expect(screen.getByText('Player 1 Hand of Cards')).toBeInTheDocument()
      expect(screen.getByText('Shared: Shared Battle Area')).toBeInTheDocument() // Shared zones show with "Shared:" prefix
      expect(screen.getByText('Player 2 Collection')).toBeInTheDocument()
    })

    // Verify that default zone names are NOT present (checking specific default zones)
    // Note: "Battlefield" header is always shown, but check that default "Play Area" zones aren't present
    expect(screen.queryByText('Play Area')).not.toBeInTheDocument() // Default PlayArea name
    expect(screen.queryByText('Discard Pile')).not.toBeInTheDocument() // Default DiscardPile name
    expect(screen.queryByText('Deck')).not.toBeInTheDocument() // Default Deck name (before transformation)
  })

  it('should validate zone configuration and handle edge cases', async () => {
    const customZones: ZoneTemplate[] = [
      {
        id: 'minimal-zone',
        name: 'Minimal Zone',
        type: 'deck',
        owner: 'player1',
        visibility: 'private',
        order: 'ordered'
        // No maxSize, description - should handle optional fields
      }
    ]

    const projectData = {
      name: 'Minimal Zone Test',
      cards: [],
      rules: [],
      zones: customZones
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getByText(/Custom Zones/)).toBeInTheDocument()
      expect(screen.getByText(/Loaded 1 custom zones from project/)).toBeInTheDocument()
      expect(screen.getByText('Minimal Zone')).toBeInTheDocument()
    })
  })
})