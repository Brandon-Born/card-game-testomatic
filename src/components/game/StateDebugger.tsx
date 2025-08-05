'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Game } from '@/types'
import { Settings, User, Zap, Coins } from 'lucide-react'

interface StateDebuggerProps {
  game: Game
  onStateModification: (modification: any) => void
}

export default function StateDebugger({ game, onStateModification }: StateDebuggerProps) {
  const [selectedPlayer, setSelectedPlayer] = useState(game.players[0]?.id?.value || '')
  const [resourceType, setResourceType] = useState('life')
  const [resourceValue, setResourceValue] = useState('')
  const [selectedCard, setSelectedCard] = useState('')
  const [cardProperty, setCardProperty] = useState('power')
  const [cardValue, setCardValue] = useState('')

  const handleModifyPlayerResource = () => {
    if (!selectedPlayer || !resourceValue) return

    const modification = {
      type: 'modifyPlayerResource',
      playerId: selectedPlayer,
      resource: resourceType,
      value: parseInt(resourceValue)
    }

    onStateModification(modification)
    setResourceValue('')
  }

  const handleModifyCardProperty = () => {
    if (!selectedCard || !cardValue) return

    const modification = {
      type: 'modifyCardProperty',
      cardId: selectedCard,
      property: cardProperty,
      value: parseInt(cardValue)
    }

    onStateModification(modification)
    setCardValue('')
  }

  const handleAdvancePhase = () => {
    const phases = ['upkeep', 'main', 'combat', 'end']
    const currentIndex = phases.indexOf(game.phase)
    const nextPhase = phases[(currentIndex + 1) % phases.length]

    onStateModification({
      type: 'setPhase',
      phase: nextPhase
    })
  }

  const handleNextTurn = () => {
    const currentPlayerIndex = game.players.findIndex(p => p.id === game.currentPlayer)
    const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length
    const nextPlayer = game.players[nextPlayerIndex]

    onStateModification({
      type: 'nextTurn',
      currentPlayer: nextPlayer.id,
      turnNumber: game.turnNumber + (nextPlayerIndex === 0 ? 1 : 0)
    })
  }

  const selectedPlayerData = game.players.find(p => p.id.value === selectedPlayer)
  const allCards = game.cards

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Game State Debugger</h3>
        </div>

        <Tabs defaultValue="players" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="game">Game</TabsTrigger>
          </TabsList>

          {/* Player Modifications */}
          <TabsContent value="players">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <h4 className="font-medium">Player Resources</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="player-select">Player</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {game.players.map(player => (
                          <SelectItem key={player.id.value} value={player.id.value}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="resource-type">Resource Type</Label>
                    <Select value={resourceType} onValueChange={setResourceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPlayerData && Object.keys(selectedPlayerData.resources).map(resource => (
                          <SelectItem key={resource} value={resource}>
                            {resource}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="resource-value">New Value</Label>
                    <Input
                      id="resource-value"
                      type="number"
                      placeholder="Enter new value"
                      value={resourceValue}
                      onChange={(e) => setResourceValue(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleModifyPlayerResource}
                    disabled={!selectedPlayer || !resourceValue}
                    className="w-full"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Modify Resource
                  </Button>
                </div>

                {/* Current Player Resources */}
                {selectedPlayerData && (
                  <div className="mt-4 p-3 bg-muted rounded">
                    <h5 className="font-medium mb-2">Current Resources:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedPlayerData.resources).map(([resource, value]) => (
                        <div key={resource} className="flex justify-between">
                          <span className="capitalize">{resource}:</span>
                          <Badge variant="outline">{value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Card Modifications */}
          <TabsContent value="cards">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  <h4 className="font-medium">Card Properties</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="card-select">Card</Label>
                    <Select value={selectedCard} onValueChange={setSelectedCard}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCards.map(card => (
                          <SelectItem key={card.id.value} value={card.id.value}>
                            {card.name} ({card.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="card-property">Property</Label>
                    <Select value={cardProperty} onValueChange={setCardProperty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="power">Power</SelectItem>
                        <SelectItem value="toughness">Toughness</SelectItem>
                        <SelectItem value="cost">Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="card-value">New Value</Label>
                    <Input
                      id="card-value"
                      type="number"
                      placeholder="Enter new value"
                      value={cardValue}
                      onChange={(e) => setCardValue(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleModifyCardProperty}
                    disabled={!selectedCard || !cardValue}
                    className="w-full"
                  >
                    Modify Card Property
                  </Button>
                </div>

                {/* Selected Card Info */}
                {selectedCard && (
                  <div className="mt-4 p-3 bg-muted rounded">
                    {(() => {
                      const card = allCards.find(c => c.id.value === selectedCard)
                      return card ? (
                        <div>
                          <h5 className="font-medium mb-2">{card.name}</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Power: <Badge variant="outline">{card.properties.power || 0}</Badge></div>
                            <div>Toughness: <Badge variant="outline">{card.properties.toughness || 0}</Badge></div>
                            <div>Cost: <Badge variant="outline">{card.properties.cost || 0}</Badge></div>
                            <div>Tapped: <Badge variant={card.isTapped ? "destructive" : "secondary"}>{card.isTapped ? "Yes" : "No"}</Badge></div>
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Game State Modifications */}
          <TabsContent value="game">
            <Card className="p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Game Controls</h4>

                <div className="space-y-3">
                  <Button onClick={handleAdvancePhase} className="w-full">
                    Advance Phase (Current: {game.phase})
                  </Button>

                  <Button onClick={handleNextTurn} className="w-full">
                    Next Turn (Turn {game.turnNumber})
                  </Button>
                </div>

                {/* Game State Info */}
                <div className="mt-4 p-3 bg-muted rounded">
                  <h5 className="font-medium mb-2">Current Game State:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Turn:</span>
                      <Badge variant="outline">{game.turnNumber}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Phase:</span>
                      <Badge variant="outline">{game.phase}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Player:</span>
                      <Badge variant="outline">
                        {game.players.find(p => p.id === game.currentPlayer)?.name}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cards:</span>
                      <Badge variant="outline">{game.cards.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Zones:</span>
                      <Badge variant="outline">{game.zones.length}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}