'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Shuffle, 
  Users,
  Coins,
  Heart,
  Zap
} from 'lucide-react'
import type { GameConfiguration } from '@/types'

interface GameConfigPanelProps {
  gameConfig?: GameConfiguration
  onConfigChange: (config: GameConfiguration) => void
}

export function GameConfigPanel({ gameConfig, onConfigChange }: GameConfigPanelProps) {
  const [config, setConfig] = useState<GameConfiguration>({
    playerCount: {
      min: 2,
      max: 2,
    },
    initialSetup: {
      dealingRules: {
        enabled: false,
        handSize: 7,
        shuffleDeck: true,
        dealingOrder: 'round-robin'
      },
      playerResources: {}
    }
  })

  useEffect(() => {
    if (gameConfig) {
      setConfig(gameConfig)
    }
  }, [gameConfig])

  const updateConfig = (newConfig: GameConfiguration) => {
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const updateDealingRules = (updates: Partial<NonNullable<GameConfiguration['initialSetup']>['dealingRules']>) => {
    updateConfig({
      ...config,
      initialSetup: {
        ...config.initialSetup,
        dealingRules: {
          ...config.initialSetup?.dealingRules,
          ...updates
        } as NonNullable<GameConfiguration['initialSetup']>['dealingRules']
      }
    })
  }

  const updatePlayerResources = (resource: string, value: number) => {
    updateConfig({
      ...config,
      initialSetup: {
        ...config.initialSetup,
        playerResources: {
          ...config.initialSetup?.playerResources,
          [resource]: value
        }
      }
    })
  }

  const removePlayerResource = (resource: string) => {
    const newResources = { ...config.initialSetup?.playerResources }
    delete newResources[resource]
    
    updateConfig({
      ...config,
      initialSetup: {
        ...config.initialSetup,
        playerResources: newResources
      }
    })
  }

  const [newResourceName, setNewResourceName] = useState('')
  const [newResourceValue, setNewResourceValue] = useState(0)

  const addPlayerResource = () => {
    if (newResourceName.trim()) {
      updatePlayerResources(newResourceName.trim(), newResourceValue)
      setNewResourceName('')
      setNewResourceValue(0)
    }
  }

  const updatePlayerCount = (updates: Partial<NonNullable<GameConfiguration['playerCount']>>) => {
    const newPlayerCount = {
      ...config.playerCount,
      ...updates,
    }
    if (!newPlayerCount.min) newPlayerCount.min = 2;
    if (!newPlayerCount.max) newPlayerCount.max = 2;

    updateConfig({
      ...config,
      playerCount: newPlayerCount
    })
  }

  const dealingConfig = config.initialSetup?.dealingRules
  const playerResources = config.initialSetup?.playerResources || {}
  const playerCount = config.playerCount || { min: 2, max: 2 }

  return (
    <div className="space-y-6">
      {/* Player Count Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Player Count
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="min-players">Minimum Players</Label>
              <Input
                id="min-players"
                type="number"
                min="1"
                max="8"
                value={playerCount.min}
                onChange={(e) => updatePlayerCount({ min: parseInt(e.target.value) || 1 })}
                className="w-24"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="max-players">Maximum Players</Label>
              <Input
                id="max-players"
                type="number"
                min={playerCount.min}
                max="8"
                value={playerCount.max}
                onChange={(e) => updatePlayerCount({ max: parseInt(e.target.value) || playerCount.min })}
                className="w-24"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Define the range of players your game supports. The simulator will launch with the minimum number.
          </p>
        </CardContent>
      </Card>

      {/* Card Dealing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            Initial Card Dealing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dealing-enabled"
              checked={dealingConfig?.enabled || false}
              onChange={(e) => updateDealingRules({ enabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="dealing-enabled">Automatically deal cards at game start</Label>
          </div>

          {dealingConfig?.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div>
                <Label htmlFor="hand-size">Initial Hand Size</Label>
                <Input
                  id="hand-size"
                  type="number"
                  min="0"
                  max="20"
                  value={dealingConfig.handSize}
                  onChange={(e) => updateDealingRules({ handSize: parseInt(e.target.value) || 0 })}
                  className="w-24"
                />
              </div>

              <div>
                <Label htmlFor="dealing-order">Dealing Order</Label>
                <Select
                  value={dealingConfig.dealingOrder || 'round-robin'}
                  onValueChange={(value: 'sequential' | 'round-robin') => 
                    updateDealingRules({ dealingOrder: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">Round-robin (alternate players)</SelectItem>
                    <SelectItem value="sequential">Sequential (all to player 1, then player 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shuffle-deck"
                  checked={dealingConfig.shuffleDeck || false}
                  onChange={(e) => updateDealingRules({ shuffleDeck: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="shuffle-deck">Shuffle deck before dealing</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Resources Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Starting Player Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Define what resources players start with (life, mana, chips, etc.)
          </div>

          {/* Existing Resources */}
          {Object.entries(playerResources).length > 0 && (
            <div className="space-y-2">
              <Label>Current Resources</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(playerResources).map(([resource, value]) => (
                  <Badge 
                    key={resource} 
                    variant="secondary" 
                    className="flex items-center gap-2"
                  >
                    {resource === 'life' && <Heart className="w-3 h-3" />}
                    {resource === 'mana' && <Zap className="w-3 h-3" />}
                    {resource === 'chips' && <Coins className="w-3 h-3" />}
                    {!['life', 'mana', 'chips'].includes(resource) && <Settings className="w-3 h-3" />}
                    
                    <span>{resource}: {value}</span>
                    <button
                      onClick={() => removePlayerResource(resource)}
                      className="ml-1 text-xs hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add New Resource */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="resource-name">Resource Name</Label>
              <Input
                id="resource-name"
                placeholder="e.g., life, mana, chips"
                value={newResourceName}
                onChange={(e) => setNewResourceName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="resource-value">Starting Value</Label>
              <Input
                id="resource-value"
                type="number"
                value={newResourceValue}
                onChange={(e) => setNewResourceValue(parseInt(e.target.value) || 0)}
                className="w-24"
              />
            </div>
            <Button onClick={addPlayerResource} disabled={!newResourceName.trim()}>
              Add
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="pt-4 border-t">
            <Label>Quick Presets</Label>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  updatePlayerResources('life', 20)
                  updatePlayerResources('mana', 0)
                }}
              >
                Magic-style (Life: 20, Mana: 0)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  updatePlayerResources('chips', 1000)
                }}
              >
                Poker-style (Chips: 1000)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}