'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zone, Card as GameCard } from '@/types'
import CardComponent from './CardComponent'

interface ZoneComponentProps {
  zone: Zone
  cards: GameCard[]
  onCardAction: (cardId: string, action: string, targetZoneId?: string) => void
  selectedCard: string | null
  onCardSelect: (cardId: string | null) => void
  isTopPlayer?: boolean
  isPlayArea?: boolean
}

export default function ZoneComponent({
  zone,
  cards,
  onCardAction,
  selectedCard,
  onCardSelect,
  isTopPlayer = false,
  isPlayArea = false
}: ZoneComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const getZoneDisplayName = (zoneName: string) => {
    switch (zoneName) {
      case 'Deck': return 'Library'
      case 'Hand': return 'Hand'
      case 'PlayArea': return 'Battlefield'
      case 'DiscardPile': return 'Graveyard'
      default: return zoneName
    }
  }

  const getZoneColor = (zoneName: string) => {
    switch (zoneName) {
      case 'Deck': return 'bg-gray-100 border-gray-300'
      case 'Hand': return 'bg-blue-50 border-blue-200'
      case 'PlayArea': return 'bg-green-50 border-green-200'
      case 'DiscardPile': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const cardId = e.dataTransfer.getData('text/plain')
    if (cardId) {
      // Don't allow dropping a card onto its current zone
      const card = cards.find(c => c.id.value === cardId)
      if (card && card.currentZone === zone.id) {
        return
      }
      
      onCardAction(cardId, 'moveCard', zone.id.value)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDragOver) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const renderZoneContent = () => {
    if (cards.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          Empty
        </div>
      )
    }

    // Different rendering based on zone type
    switch (zone.name) {
      case 'Deck':
        return (
          <div className="relative h-full">
            <div className="absolute inset-0 bg-gray-600 rounded border-2 border-gray-800 shadow-lg">
              <div className="flex items-center justify-center h-full">
                <Badge variant="secondary">{cards.length}</Badge>
              </div>
            </div>
          </div>
        )

      case 'Hand':
        return (
          <div className={`flex ${isTopPlayer ? 'flex-row-reverse' : 'flex-row'} gap-1 overflow-x-auto h-full`}>
            {cards.map((card, index) => (
              <CardComponent
                key={card.id.value}
                card={card}
                isSelected={selectedCard === card.id.value}
                onSelect={onCardSelect}
                onAction={onCardAction}
                isInHand={true}
                isHidden={isTopPlayer && zone.visibility === 'private'}
                style={{ 
                  zIndex: index,
                  transform: isTopPlayer ? 'rotateY(180deg)' : 'none'
                }}
              />
            ))}
          </div>
        )

      case 'PlayArea':
        return (
          <div className="grid grid-cols-3 gap-1 h-full overflow-auto">
            {cards.map(card => (
              <CardComponent
                key={card.id.value}
                card={card}
                isSelected={selectedCard === card.id.value}
                onSelect={onCardSelect}
                onAction={onCardAction}
                isInPlay={true}
              />
            ))}
          </div>
        )

      case 'DiscardPile':
        const topCard = cards[cards.length - 1]
        return (
          <div className="relative h-full">
            {topCard ? (
              <CardComponent
                card={topCard}
                isSelected={selectedCard === topCard.id.value}
                onSelect={onCardSelect}
                onAction={onCardAction}
                isInGraveyard={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Empty
              </div>
            )}
            {cards.length > 1 && (
              <Badge 
                variant="secondary" 
                className="absolute top-1 right-1 text-xs"
              >
                {cards.length}
              </Badge>
            )}
          </div>
        )

      default:
        return (
          <div className="grid grid-cols-2 gap-1 h-full overflow-auto">
            {cards.map(card => (
              <CardComponent
                key={card.id.value}
                card={card}
                isSelected={selectedCard === card.id.value}
                onSelect={onCardSelect}
                onAction={onCardAction}
              />
            ))}
          </div>
        )
    }
  }

  const shouldShowDropTarget = zone.name !== 'Deck' // Can't drop cards directly into deck

  return (
    <Card 
      className={`
        ${getZoneColor(zone.name)} 
        ${isPlayArea ? 'h-full' : 'h-32'} 
        relative 
        ${shouldShowDropTarget ? 'cursor-pointer' : ''}
        ${isDragOver && shouldShowDropTarget ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''}
        transition-all duration-200
        hover:shadow-md
      `}
      onDrop={shouldShowDropTarget ? handleDrop : undefined}
      onDragOver={shouldShowDropTarget ? handleDragOver : undefined}
      onDragLeave={shouldShowDropTarget ? handleDragLeave : undefined}
    >
      {/* Zone Header */}
      {!isPlayArea && (
        <div className="absolute top-1 left-1 z-10">
          <Badge variant="outline" className="text-xs">
            {getZoneDisplayName(zone.name)}
          </Badge>
        </div>
      )}

      {/* Zone Content */}
      <div className={`${!isPlayArea ? 'p-2 pt-6' : 'p-1'} h-full`}>
        {renderZoneContent()}
      </div>

      {/* Zone Properties Info */}
      {zone.maxSize && (
        <div className="absolute bottom-1 right-1">
          <Badge variant="secondary" className="text-xs">
            {cards.length}/{zone.maxSize}
          </Badge>
        </div>
      )}

      {/* Visibility Indicator */}
      {zone.visibility === 'private' && !isPlayArea && (
        <div className="absolute top-1 right-1">
          <Badge variant="destructive" className="text-xs">
            Private
          </Badge>
        </div>
      )}
    </Card>
  )
}