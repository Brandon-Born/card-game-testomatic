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
  it('should create zones for each player when owner is "each"', async () => {
    const customZones: ZoneTemplate[] = [
      {
        id: 'custom-deck',
        name: 'Library',
        type: 'deck',
        owner: 'each',
        visibility: 'private',
        order: 'ordered',
        maxSize: 40,
      },
      {
        id: 'custom-hand',
        name: 'Hand of Cards',
        type: 'hand',
        owner: 'each',
        visibility: 'private',
        order: 'unordered',
        maxSize: 10,
      },
      {
        id: 'custom-battlefield',
        name: 'Battle Area',
        type: 'playarea',
        owner: 'shared',
        visibility: 'public',
        order: 'unordered',
      },
    ];

    const projectData = {
      name: 'Each Player Zone Test',
      cards: [],
      rules: [],
      zones: customZones,
      gameConfig: { playerCount: { min: 2, max: 4 } }, // Default 2 players
    };

    render(<GameBoard projectData={projectData} />);

    await waitFor(() => {
      // 2 "each" templates * 2 players + 1 "shared" template = 5 zones
      expect(screen.getByText(/Loaded 5 zones from project templates/)).toBeInTheDocument();
    });

    // Verify zones were created for each player
    await waitFor(() => {
      expect(screen.getByText('Player 1 Library')).toBeInTheDocument();
      expect(screen.getByText('Player 2 Library')).toBeInTheDocument();
      expect(screen.getByText('Player 1 Hand of Cards')).toBeInTheDocument();
      expect(screen.getByText('Player 2 Hand of Cards')).toBeInTheDocument();
      expect(screen.getByText('Shared: Battle Area')).toBeInTheDocument();
    });
  });

  it('should handle "each" owner property for a different player count', async () => {
    const customZones: ZoneTemplate[] = [
      {
        id: 'player-deck',
        name: 'Deck',
        type: 'deck',
        owner: 'each',
        visibility: 'private',
        order: 'ordered',
      },
    ];

    const projectData = {
      name: '3 Player Game',
      cards: [],
      rules: [],
      zones: customZones,
      gameConfig: { playerCount: { min: 3, max: 3 } }, // 3 players
    };

    render(<GameBoard projectData={projectData} />);

    await waitFor(() => {
      // 1 "each" template * 3 players = 3 zones
      expect(screen.getByText(/Loaded 3 zones from project templates/)).toBeInTheDocument();
    });

    // Verify zones were created for all 3 players
    await waitFor(() => {
      expect(screen.getByText('Player 1 Deck')).toBeInTheDocument();
      expect(screen.getByText('Player 2 Deck')).toBeInTheDocument();
      expect(screen.getByText('Player 3 Deck')).toBeInTheDocument();
    });
  });

  it('should handle minimal zone configuration and shared zones', async () => {
    const customZones: ZoneTemplate[] = [
      {
        id: 'minimal-zone',
        name: 'Minimal Shared Zone',
        type: 'playarea',
        owner: 'shared', // Explicitly shared
        visibility: 'public',
        order: 'unordered',
      },
    ];

    const projectData = {
      name: 'Minimal Shared Test',
      cards: [],
      rules: [],
      zones: customZones,
      gameConfig: { playerCount: { min: 2, max: 2 } },
    };

    render(<GameBoard projectData={projectData} />);

    await waitFor(() => {
      // 1 "shared" template = 1 zone
      expect(screen.getByText(/Loaded 1 zones from project templates/)).toBeInTheDocument();
      expect(screen.getByText('Shared: Minimal Shared Zone')).toBeInTheDocument();
    });
  });
});