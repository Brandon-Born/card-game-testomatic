'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Game, Zone, Card as GameCard } from '@/types'
import { createGame, createPlayer, createDeck, createHand, createPlayArea, createDiscardPile } from '@/core/primitives'
import { executeAction, validateAction } from '@/core/actions'
import { drawCards } from '@/core/actions/draw-cards'
import { shuffleZone } from '@/core/actions/shuffle'
import { createEventManager, subscribeToEvent, publishEvent, processEvents } from '@/core/events'
import { createGameEvent } from '@/core/events'
import { createPlayerId, createZoneId, createGameId, createCardId } from '@/lib/utils'
import { RuleCompiler, type CompiledRule } from '@/components/designer/RuleCompiler'
import type { ZoneTemplate } from '@/types'
import ZoneComponent from './ZoneComponent'
import GameLog from './GameLog'
import StateDebugger from './StateDebugger'

interface GameBoardProps {
  projectData?: {
    cards: any[]
    rules: any[]
    zones?: ZoneTemplate[]
    name: string
    gameConfig: any
  }
}

export default function GameBoard({ projectData }: GameBoardProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [gameLog, setGameLog] = useState<Array<{ timestamp: Date; action: string; details: string; type?: 'action' | 'event' | 'error' | 'system' }>>([])
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [compiledRules, setCompiledRules] = useState<CompiledRule[]>([])
  const [eventManager, setEventManager] = useState(() => createEventManager())

  // useEffect moved after initializeGame function to avoid hoisting issues

  // Helper function to create zones from templates
  const createZoneFromTemplate = (template: ZoneTemplate, players: any[]): Zone => {
    const ownerIndex = template.owner ? parseInt(template.owner.replace('player', ''), 10) - 1 : -1;
    const ownerId = ownerIndex >= 0 && ownerIndex < players.length ? players[ownerIndex].id : null;

    const zoneId = createZoneId()
    switch (template.type) {
      case 'deck':
        return {
          ...createDeck({ 
            id: zoneId, 
            owner: ownerId,
            maxSize: template.maxSize 
          }),
          name: template.name // Override the default name
        }
      case 'hand':
        return {
          ...createHand({ 
            id: zoneId, 
            owner: ownerId,
            maxSize: template.maxSize 
          }),
          name: template.name
        }
      case 'discard':
        return {
          ...createDiscardPile({ 
            id: zoneId, 
            owner: ownerId
          }),
          name: template.name,
          ...(template.maxSize && { maxSize: template.maxSize })
        }
      case 'playarea':
        return {
          ...createPlayArea({ 
            id: zoneId, 
            owner: ownerId
          }),
          name: template.name,
          ...(template.maxSize && { maxSize: template.maxSize })
        }
      case 'stack':
        // For now, create as PlayArea since we don't have createStack yet
        return {
          ...createPlayArea({ 
            id: zoneId, 
            owner: ownerId
          }),
          name: template.name,
          ...(template.maxSize && { maxSize: template.maxSize })
        }
      default:
        return {
          ...createPlayArea({ 
            id: zoneId, 
            owner: ownerId
          }),
          name: template.name,
          ...(template.maxSize && { maxSize: template.maxSize })
        }
    }
  }

  const initializeGame = useCallback(() => {
    try {
      const playerCount = projectData?.gameConfig?.playerCount?.min || 2
      const configuredResources = projectData?.gameConfig?.initialSetup?.playerResources || {}

      const players = Array.from({ length: playerCount }, (_, i) =>
        createPlayer({
          id: createPlayerId(),
          name: `Player ${i + 1}`,
          resources: { ...configuredResources },
        })
      )

      let gameZones: Zone[] = []
      const playerZoneMap: { [key: string]: string[] } = {}
      players.forEach(p => playerZoneMap[p.id.value] = [])

      if (projectData?.zones && projectData.zones.length > 0) {
        gameZones = projectData.zones.map((template: ZoneTemplate) => {
          const zone = createZoneFromTemplate(template, players)
          if (zone.owner) {
            playerZoneMap[zone.owner.value]?.push(zone.id.value)
          }
          return zone
        })
        addToGameLog('Custom Zones', `Loaded ${gameZones.length} custom zones from project`, 'system')
      }

      const gameCards: GameCard[] = projectData?.cards?.map(cardData => {
        const ownerIndex = Math.floor(Math.random() * players.length)
        const owner = players[ownerIndex].id
        
        const targetDeck = gameZones.find(z => z.owner?.value === owner.value && 'type' in z && (z as any).type === 'deck')
        const defaultZone = gameZones.find(z => z.owner?.value === owner.value) || gameZones[0]
        const currentZone = targetDeck?.id || defaultZone?.id || createZoneId()

        return {
          id: createCardId(),
          name: cardData.name,
          text: cardData.text,
          type: cardData.type,
          owner,
          currentZone,
          properties: {
            cost: cardData.cost || 0,
            power: cardData.power || 0,
            toughness: cardData.toughness || 0,
            ...cardData.properties
          },
          counters: [],
          isTapped: false
        }
      }) || []

      const updatedPlayers = players.map(p => ({
        ...p,
        zones: playerZoneMap[p.id.value].map(zoneId => ({ value: zoneId }))
      }))

      const newGame = createGame({
        id: createGameId(),
        players: updatedPlayers,
        zones: gameZones,
        cards: gameCards,
        currentPlayer: updatedPlayers[0]?.id || createPlayerId(),
        phase: 'main',
        turnNumber: 1,
        globalProperties: {}
      })

      // Compile visual rules from project data
      if (projectData?.rules && projectData.rules.length > 0) {
        try {
          const rulesData = projectData.rules[0]
          if (rulesData && rulesData.nodes && rulesData.edges) {
            const compiled = RuleCompiler.compileAllRules(rulesData.nodes, rulesData.edges)
            setCompiledRules(compiled)
            
            let newEventManager = createEventManager()
            compiled.forEach(rule => {
              newEventManager = subscribeToEvent(newEventManager, rule.eventListener)
            })
            setEventManager(newEventManager)
            
            addToGameLog('Rules Compiled', `Compiled ${compiled.length} rule(s) for automatic execution`, 'system')
          }
        } catch (error) {
          console.error('Error compiling rules:', error)
          addToGameLog('Rule Compilation Error', 'Failed to compile visual rules', 'error')
        }
      } else {
        addToGameLog('No Rules', 'No visual rules found - manual actions only', 'system')
      }

      // Handle automatic card dealing based on project configuration
      let gameWithDealtCards = newGame
      const dealingConfig = projectData?.gameConfig?.initialSetup?.dealingRules
      
      if (dealingConfig?.enabled && dealingConfig.handSize > 0) {
        try {
          // Shuffle deck first if configured
          if (dealingConfig.shuffleDeck) {
            updatedPlayers.forEach(player => {
              const playerDeck = gameWithDealtCards.zones.find(z => 
                z.owner?.value === player.id.value && 
                'type' in z && (z as any).type === 'deck'
              )
              
              if (playerDeck && playerDeck.cards.length > 0) {
                gameWithDealtCards = executeAction(gameWithDealtCards, shuffleZone({
                  zoneId: playerDeck.id
                }))
              }
            })
            
            addToGameLog('Deck Shuffled', 'Shuffled all player decks', 'system')
          }

          // Deal cards to each player
          const dealingOrder = dealingConfig.dealingOrder || 'sequential'
          
          if (dealingOrder === 'round-robin') {
            // Deal one card at a time to each player in rotation
            for (let cardNum = 0; cardNum < dealingConfig.handSize; cardNum++) {
              for (const player of updatedPlayers) {
                try {
                  gameWithDealtCards = executeAction(gameWithDealtCards, drawCards({
                    playerId: player.id,
                    count: 1
                  }))
                } catch (error) {
                  console.warn(`Could not deal card ${cardNum + 1} to ${player.name}:`, error)
                  break // Stop dealing if we run out of cards
                }
              }
            }
          } else {
            // Sequential dealing - deal all cards to each player at once
            for (const player of updatedPlayers) {
              try {
                gameWithDealtCards = executeAction(gameWithDealtCards, drawCards({
                  playerId: player.id,
                  count: dealingConfig.handSize
                }))
              } catch (error) {
                console.warn(`Could not deal ${dealingConfig.handSize} cards to ${player.name}:`, error)
              }
            }
          }
          
          addToGameLog('Cards Dealt', 
            `Dealt ${dealingConfig.handSize} cards to each player (${dealingOrder} order)`, 
            'system'
          )
          
        } catch (error) {
          console.error('Error during automatic dealing:', error)
          addToGameLog('Dealing Error', 'Failed to deal initial cards', 'error')
        }
      }

      setGame(gameWithDealtCards)
      addToGameLog('Game Initialized', `Starting ${projectData?.name || 'New Game'} with ${updatedPlayers.length} player(s)`, 'system')
    } catch (error) {
      console.error('Error initializing game:', error)
      addToGameLog('Initialization Error', 'Failed to initialize game', 'error')
    }
  }, [projectData])

  // Initialize game when project data is loaded
  useEffect(() => {
    if (projectData) {
      initializeGame()
    }
  }, [projectData, initializeGame])

  const addToGameLog = (action: string, details: string, type: 'action' | 'event' | 'error' | 'system' = 'action') => {
    setGameLog(prev => [...prev, {
      timestamp: new Date(),
      action,
      details,
      type
    }])
  }

  const handleCardAction = (cardId: string, action: string, targetZoneId?: string) => {
    if (!game) return

    try {
      let gameAction: any = null
      let eventToPublish: any = null
      
      // Convert UI actions to framework actions
      switch (action) {
        case 'playCard':
          const card = game.cards.find(c => String(c.id) === cardId)
          if (card) {
            gameAction = {
              type: 'PLAY_CARD',
              cardId,
              playerId: card.owner,
              targets: []
            }
            eventToPublish = createGameEvent({
              type: 'CARD_PLAYED',
              payload: { cardId, cardName: card.name, cardType: card.type, playerId: card.owner }
            })
          }
          break

        case 'tapCard':
          gameAction = {
            type: 'TAP_CARD',
            cardId
          }
          break

        case 'untapCard':
          gameAction = {
            type: 'UNTAP_CARD',
            cardId
          }
          break

        case 'discardCard':
          const discardCard = game.cards.find(c => String(c.id) === cardId)
          if (discardCard) {
            gameAction = {
              type: 'DISCARD_CARD',
              cardId,
              playerId: discardCard.owner
            }
          }
          break

        case 'moveCard':
          if (targetZoneId) {
            const moveCard = game.cards.find(c => String(c.id) === cardId)
            if (moveCard) {
              gameAction = {
                type: 'MOVE_CARD',
                cardId,
                fromZone: moveCard.currentZone,
                toZone: targetZoneId
              }
              eventToPublish = createGameEvent({
                type: 'CARD_ENTERS_ZONE',
                payload: { cardId, cardName: moveCard.name, zoneId: targetZoneId }
              })
            }
          }
          break

        case 'addCounter':
          gameAction = {
            type: 'ADD_COUNTER',
            target: cardId,
            counterType: '+1/+1'
          }
          eventToPublish = createGameEvent({
            type: 'COUNTER_ADDED',
            payload: { cardId, counterType: '+1/+1' }
          })
          break

        case 'removeCounter':
          gameAction = {
            type: 'REMOVE_COUNTER',
            target: cardId,
            counterType: '+1/+1'
          }
          break

        default:
          addToGameLog('Unknown Action', `Action "${action}" not recognized`, 'error')
          return
      }

      if (gameAction) {
        // Validate action before execution
        if (validateAction(game, gameAction)) {
          // Execute the action
          const newGameState = executeAction(game, gameAction)
          setGame(newGameState)
          
          // Log the action
          const cardName = game.cards.find(c => c.id.value === cardId)?.name || cardId
          addToGameLog(action, `${cardName}: ${action} executed successfully`)
          
          // Publish event and process rules if event exists
          if (eventToPublish) {
            const updatedEventManager = publishEvent(eventManager, eventToPublish)
            const eventResult = processEvents(updatedEventManager, newGameState)
            
            // Update event manager
            setEventManager(eventResult.manager)
            
            // Log event processing
            if (eventResult.processedEvents.length > 0) {
              addToGameLog('Rules Triggered', `${eventResult.processedEvents.length} event(s) processed`, 'event')
            }
            
            if (eventResult.generatedEvents.length > 0) {
              addToGameLog('Rules Executed', `${eventResult.generatedEvents.length} rule action(s) triggered`, 'event')
            }
            
            if (eventResult.errors.length > 0) {
              eventResult.errors.forEach(error => {
                addToGameLog('Rule Error', error, 'error')
              })
            }
            
            // Update game state if rules modified it
            if (eventResult.game !== newGameState) {
              setGame(eventResult.game)
            }
          }
        } else {
          addToGameLog('Invalid Action', `Cannot ${action} - action validation failed`, 'error')
        }
      }
    } catch (error) {
      console.error('Error performing card action:', error)
      addToGameLog('Execution Error', `Failed to perform ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const handleStateModification = (modification: any) => {
    if (!game) return

    try {
      let gameAction: any = null
      
      switch (modification.type) {
        case 'modifyPlayerResource':
          gameAction = {
            type: 'MODIFY_STAT',
            target: modification.playerId,
            stat: modification.resource,
            value: modification.value
          }
          break

        case 'modifyCardProperty':
          gameAction = {
            type: 'MODIFY_STAT',
            target: modification.cardId,
            stat: modification.property,
            value: modification.value
          }
          break

        case 'setPhase':
          gameAction = {
            type: 'SET_TURN_PHASE',
            phase: modification.phase
          }
          break

        case 'nextTurn':
          // Handle turn progression manually for now
          const newGame = {
            ...game,
            currentPlayer: modification.currentPlayer,
            turnNumber: modification.turnNumber
          }
          setGame(newGame)
          addToGameLog('Turn Advanced', `Turn ${modification.turnNumber} - ${game.players.find(p => p.id === modification.currentPlayer)?.name}`)
          
          // Publish turn start event
          const turnStartEvent = createGameEvent({
            type: 'TURN_START',
            payload: { playerId: modification.currentPlayer, turnNumber: modification.turnNumber }
          })
          
          const updatedEventManager = publishEvent(eventManager, turnStartEvent)
          const eventResult = processEvents(updatedEventManager, newGame)
          setEventManager(eventResult.manager)
          
          if (eventResult.processedEvents.length > 0) {
            addToGameLog('Turn Rules Triggered', `${eventResult.processedEvents.length} turn start rule(s) executed`, 'event')
          }
          return

        default:
          addToGameLog('Unknown Modification', `Modification type "${modification.type}" not recognized`, 'error')
          return
      }

      if (gameAction && validateAction(game, gameAction)) {
        const newGameState = executeAction(game, gameAction)
        setGame(newGameState)
        addToGameLog('State Override', `Manual modification: ${modification.type} successful`)
      } else {
        addToGameLog('Invalid Modification', `Cannot perform modification - validation failed`, 'error')
      }
    } catch (error) {
      console.error('Error modifying state:', error)
      addToGameLog('Modification Error', `Failed to modify game state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project loaded. Please load a project from the designer.</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Initializing game...</p>
      </div>
    )
  }

  const currentPlayer = game.players.find(p => p.id.value === game.currentPlayer?.value)
  const currentPlayerName = currentPlayer?.name || 'Unknown Player'

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100">
      {/* Game Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{projectData.name}</h1>
          <p className="text-sm text-muted-foreground">
            Turn {game.turnNumber} - {currentPlayerName}&apos;s {game.phase} phase
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addToGameLog('Next Phase', 'Advanced to next phase')}>
            Next Phase
          </Button>
          <Button onClick={() => addToGameLog('End Turn', 'Turn ended')}>
            End Turn
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Game Board */}
        <div className="flex-1 p-4">
          <div className="h-full flex flex-col gap-4">
            {/* Render Player Areas Dynamically */}
            {game.players.map((player, index) => (
              <div key={player.id.value} className="border rounded-lg p-4 bg-white/60">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{player.name}</h3>
                  <div className="text-sm text-gray-600">
                    {Object.entries(player.resources).map(([key, value]) =>
                      `${key}: ${value}`
                    ).join(' | ') || 'No resources'}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 h-32">
                  {game.zones
                    .filter(zone => zone.owner?.value === player.id.value)
                    .map(zone => (
                      <ZoneComponent
                        key={zone.id.value}
                        zone={zone}
                        cards={game.cards.filter(card => card.currentZone.value === zone.id.value)}
                        onCardAction={handleCardAction}
                        selectedCard={selectedCard}
                        onCardSelect={setSelectedCard}
                        isTopPlayer={index > 0} // This might need adjustment for multi-player layouts
                      />
                    ))}
                </div>
              </div>
            ))}

            {/* Shared/Battle Area - Only show if there are shared zones or play areas */}
            {(() => {
              const sharedZones = game.zones.filter(zone => zone.owner === null)
              const playAreas = game.zones.filter(zone => 
                zone.name === 'PlayArea' || 
                zone.name === 'Play Area' || 
                zone.name.toLowerCase().includes('play') ||
                zone.name.toLowerCase().includes('battle')
              )
              
              if (sharedZones.length === 0 && playAreas.length === 0) {
                return null // Don't show battlefield section if no relevant zones
              }
              
              return (
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                  <h3 className="text-center font-semibold text-gray-600 mb-4">
                    {sharedZones.length > 0 ? 'Shared Areas' : 'Battle Areas'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {/* Shared zones */}
                    {sharedZones.map(zone => (
                      <div key={zone.id.value} className="border border-gray-300 rounded p-2 col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Shared: {zone.name}</p>
                        <ZoneComponent
                          zone={zone}
                          cards={game.cards.filter(card => card.currentZone.value === zone.id.value)}
                          onCardAction={handleCardAction}
                          selectedCard={selectedCard}
                          onCardSelect={setSelectedCard}
                          isPlayArea={true}
                        />
                      </div>
                    ))}
                    
                    {/* Player play areas */}
                    {game.players.map((player, index) => {
                      const playerPlayAreas = game.zones.filter(zone => 
                        zone.owner?.value === player.id.value && 
                        (zone.name === 'PlayArea' || zone.name === 'Play Area' || zone.name.toLowerCase().includes('play'))
                      )
                      
                      if (playerPlayAreas.length === 0) return null
                      
                      return (
                        <div key={player.id.value} className="border rounded p-2 border-gray-200">
                          <p className="text-xs mb-1 text-gray-600">{player.name}&apos;s Play Area</p>
                          {playerPlayAreas.map(zone => (
                            <ZoneComponent
                              key={zone.id.value}
                              zone={zone}
                              cards={game.cards.filter(card => card.currentZone.value === zone.id.value)}
                              onCardAction={handleCardAction}
                              selectedCard={selectedCard}
                              onCardSelect={setSelectedCard}
                              isPlayArea={true}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}


          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-white">
          <Tabs defaultValue="log" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="log">Game Log</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>
            <TabsContent value="log" className="h-full p-4">
              <GameLog 
                entries={gameLog}
                onClear={() => setGameLog([])}
              />
            </TabsContent>
            <TabsContent value="rules" className="h-full p-4 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Active Rules</h3>
                  <div className="text-sm text-muted-foreground">
                    ({compiledRules.length} rules)
                  </div>
                </div>
                
                {compiledRules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No rules compiled</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create rules in the designer to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {compiledRules.map((rule, index) => (
                      <Card key={rule.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{rule.originalRule.name}</h4>
                            <div className="text-xs text-muted-foreground">
                              #{index + 1}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {rule.originalRule.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {rule.eventListener.eventType}
                            </span>
                            <span className="text-muted-foreground">
                              Priority: {rule.eventListener.priority}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="debug" className="h-full p-4">
              <StateDebugger
                game={game}
                onStateModification={handleStateModification}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}