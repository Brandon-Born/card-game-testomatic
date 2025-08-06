import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameBoard from '@/components/game/GameBoard'
import type { ZoneTemplate, GameConfiguration } from '@/types'

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

describe('Automatic Card Dealing Integration', () => {
  it('should automatically deal cards when dealing rules are enabled', async () => {
    const customZones: ZoneTemplate[] = [
      { id: 'deck-p1', name: 'Player 1 Deck', type: 'deck', owner: 'player1', visibility: 'private', order: 'ordered' },
      { id: 'hand-p1', name: 'Player 1 Hand', type: 'hand', owner: 'player1', visibility: 'private', order: 'unordered' },
      { id: 'deck-p2', name: 'Player 2 Deck', type: 'deck', owner: 'player2', visibility: 'private', order: 'ordered' },
      { id: 'hand-p2', name: 'Player 2 Hand', type: 'hand', owner: 'player2', visibility: 'private', order: 'unordered' },
    ]

    const gameConfig: GameConfiguration = {
      initialSetup: {
        dealingRules: {
          enabled: true,
          handSize: 5,
          shuffleDeck: true,
          dealingOrder: 'round-robin'
        },
        playerResources: {
          life: 20,
          mana: 0
        }
      }
    }

    const projectData = {
      name: 'Auto-Deal Test Game',
      cards: [
        { name: 'Card 1', text: 'Test card 1', type: 'Creature' },
        { name: 'Card 2', text: 'Test card 2', type: 'Spell' },
        { name: 'Card 3', text: 'Test card 3', type: 'Land' },
        { name: 'Card 4', text: 'Test card 4', type: 'Artifact' },
        { name: 'Card 5', text: 'Test card 5', type: 'Instant' },
        { name: 'Card 6', text: 'Test card 6', type: 'Sorcery' },
        { name: 'Card 7', text: 'Test card 7', type: 'Enchantment' },
        { name: 'Card 8', text: 'Test card 8', type: 'Planeswalker' },
        { name: 'Card 9', text: 'Test card 9', type: 'Creature' },
        { name: 'Card 10', text: 'Test card 10', type: 'Spell' }
      ],
      rules: [],
      zones: customZones,
      gameConfig
    }

    render(<GameBoard projectData={projectData} />)

    // Wait for the game to initialize and deal cards
    await waitFor(() => {
      expect(screen.getByText(/Deck Shuffled/)).toBeInTheDocument()
      expect(screen.getByText(/Cards Dealt/)).toBeInTheDocument()
      expect(screen.getByText(/Dealt 5 cards to each player \(round-robin order\)/)).toBeInTheDocument()
    })

    // Verify that player resources are set correctly
    await waitFor(() => {
      const lifeText = screen.getAllByText(/life: 20/i)
      expect(lifeText.length).toBeGreaterThan(0) // Should show life for both players
      
      const manaText = screen.getAllByText(/mana: 0/i)
      expect(manaText.length).toBeGreaterThan(0) // Should show mana for both players
    })
  })

  it('should handle sequential dealing order', async () => {
    const customZones: ZoneTemplate[] = [
      { id: 'deck-p1', name: 'Player 1 Deck', type: 'deck', owner: 'player1', visibility: 'private', order: 'ordered' },
      { id: 'hand-p1', name: 'Player 1 Hand', type: 'hand', owner: 'player1', visibility: 'private', order: 'unordered' },
      { id: 'deck-p2', name: 'Player 2 Deck', type: 'deck', owner: 'player2', visibility: 'private', order: 'ordered' },
      { id: 'hand-p2', name: 'Player 2 Hand', type: 'hand', owner: 'player2', visibility: 'private', order: 'unordered' },
    ]

    const gameConfig: GameConfiguration = {
      playerCount: { min: 2, max: 2 },
      initialSetup: {
        dealingRules: {
          enabled: true,
          handSize: 3,
          shuffleDeck: false,
          dealingOrder: 'sequential'
        }
      }
    }

    const projectData = {
      name: 'Sequential Deal Test',
      cards: [
        { name: 'Card 1', text: 'Test card 1', type: 'Creature' },
        { name: 'Card 2', text: 'Test card 2', type: 'Spell' },
        { name: 'Card 3', text: 'Test card 3', type: 'Land' }
      ],
      rules: [],
      zones: customZones,
      gameConfig
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getByText(/Cards Dealt/)).toBeInTheDocument()
      expect(screen.getByText(/Dealt 3 cards to each player \(sequential order\)/)).toBeInTheDocument()
    })

    // Should not see shuffle message when shuffleDeck is false
    expect(screen.queryByText(/Deck Shuffled/)).not.toBeInTheDocument()
  })

  it('should not deal cards when dealing is disabled', async () => {
    const gameConfig: GameConfiguration = {
      initialSetup: {
        dealingRules: {
          enabled: false,
          handSize: 7
        },
        playerResources: {
          chips: 1000
        }
      }
    }

    const projectData = {
      name: 'No Auto-Deal Test',
      cards: [
        { name: 'Card 1', text: 'Test card', type: 'Creature' }
      ],
      rules: [],
      zones: [],
      gameConfig
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getByText(/Game Initialized/)).toBeInTheDocument()
    })

    // Should not see dealing messages
    expect(screen.queryByText(/Cards Dealt/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Deck Shuffled/)).not.toBeInTheDocument()

    // But should still see configured resources (both players)
    await waitFor(() => {
      expect(screen.getAllByText(/chips: 1000/i)).toHaveLength(2) // Both players have chips
    })
  })

  it('should handle dealing errors gracefully', async () => {
    const customZones: ZoneTemplate[] = [
      {
        id: 'deck-1',
        name: 'Player 1 Deck',
        type: 'deck',
        owner: 'player1',
        visibility: 'private',
        order: 'ordered'
      },
      {
        id: 'hand-1',
        name: 'Player 1 Hand',
        type: 'hand',
        owner: 'player1',
        visibility: 'private',
        order: 'unordered'
      },
      // Player 2 has no deck, which will cause a recoverable error
      {
        id: 'hand-2',
        name: 'Player 2 Hand',
        type: 'hand',
        owner: 'player2',
        visibility: 'private',
        order: 'unordered'
      }
    ]

    const gameConfig: GameConfiguration = {
      initialSetup: {
        dealingRules: {
          enabled: true,
          handSize: 5
        }
      }
    }

    const projectData = {
      name: 'Dealing Error Test',
      cards: [{ name: 'Card 1', text: 'Test card', type: 'Creature' }],
      rules: [],
      zones: customZones,
      gameConfig
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getByText(/Game Initialized/)).toBeInTheDocument()
    })

    // Game should still initialize even if dealing fails
    expect(screen.queryByText(/Initialization Error/)).not.toBeInTheDocument()
  })

  it('should use empty resources when none are configured', async () => {
    const gameConfig: GameConfiguration = {
      initialSetup: {
        dealingRules: {
          enabled: false,
          handSize: 0
        }
        // No playerResources configured
      }
    }

    const projectData = {
      name: 'Empty Resources Test',
      cards: [],
      rules: [],
      zones: [],
      gameConfig
    }

    render(<GameBoard projectData={projectData} />)

    await waitFor(() => {
      expect(screen.getAllByText(/No resources/)).toHaveLength(2) // Both players show no resources
    })
  })
})