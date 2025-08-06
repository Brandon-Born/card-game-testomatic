import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GameConfigPanel } from '@/components/designer/GameConfigPanel'
import type { GameConfiguration } from '@/types'

describe('GameConfigPanel', () => {
  const mockOnConfigChange = jest.fn()

  beforeEach(() => {
    mockOnConfigChange.mockClear()
  })

  it('renders the player count configuration card', () => {
    render(<GameConfigPanel onConfigChange={mockOnConfigChange} />)
    expect(screen.getByText('Player Count')).toBeInTheDocument()
    expect(screen.getByLabelText('Minimum Players')).toBeInTheDocument()
    expect(screen.getByLabelText('Maximum Players')).toBeInTheDocument()
  })

  it('displays default player count values', () => {
    render(<GameConfigPanel onConfigChange={mockOnConfigChange} />)
    expect(screen.getByLabelText('Minimum Players')).toHaveValue(2)
    expect(screen.getByLabelText('Maximum Players')).toHaveValue(2)
  })

  it('calls onConfigChange when minimum players is changed', () => {
    render(<GameConfigPanel onConfigChange={mockOnConfigChange} />)
    const minPlayersInput = screen.getByLabelText('Minimum Players')
    fireEvent.change(minPlayersInput, { target: { value: '3' } })
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        playerCount: { min: 3, max: 2 },
      })
    )
  })

  it('calls onConfigChange when maximum players is changed', () => {
    render(<GameConfigPanel onConfigChange={mockOnConfigChange} />)
    const maxPlayersInput = screen.getByLabelText('Maximum Players')
    fireEvent.change(maxPlayersInput, { target: { value: '4' } })
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        playerCount: { min: 2, max: 4 },
      })
    )
  })

  it('loads initial gameConfig values', () => {
    const initialConfig: GameConfiguration = {
      playerCount: { min: 1, max: 4 },
      initialSetup: {
        dealingRules: { enabled: true, handSize: 5 },
      },
    }
    render(
      <GameConfigPanel
        gameConfig={initialConfig}
        onConfigChange={mockOnConfigChange}
      />
    )
    expect(screen.getByLabelText('Minimum Players')).toHaveValue(1)
    expect(screen.getByLabelText('Maximum Players')).toHaveValue(4)
  })
})
