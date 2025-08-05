'use client'

import React, { useState } from 'react'
// Card UI component not used - using custom card styling
import { Badge } from '@/components/ui/badge'
// Button component not used - using div with click handlers
// Context menu will be implemented later when available
import { Card as GameCard } from '@/types'

interface CardComponentProps {
  card: GameCard
  isSelected: boolean
  onSelect: (cardId: string | null) => void
  onAction: (cardId: string, action: string, targetZoneId?: string) => void
  isInHand?: boolean
  isInPlay?: boolean
  isInGraveyard?: boolean
  isHidden?: boolean
  style?: React.CSSProperties
}

export default function CardComponent({
  card,
  isSelected,
  onSelect,
  onAction,
  isInHand = false,
  isInPlay = false,
  isInGraveyard = false,
  isHidden = false,
  style
}: CardComponentProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', String(card.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    if (isSelected) {
      onSelect(null)
    } else {
      onSelect(String(card.id))
    }
  }

  // Context menu functionality - reserved for future implementation
  // const handleContextAction = (action: string) => {
  //   onAction(String(card.id), action)
  // }

  const handleDoubleClick = () => {
    // Double-click for primary action based on context
    if (isInHand) {
      onAction(String(card.id), 'playCard')
    } else if (isInPlay) {
      onAction(String(card.id), card.isTapped ? 'untapCard' : 'tapCard')
    }
  }

  const getCardSize = () => {
    if (isInHand) return 'w-12 h-16'
    if (isInPlay) return 'w-16 h-20'
    if (isInGraveyard) return 'w-full h-full'
    return 'w-14 h-18'
  }

  const getCardContent = () => {
    if (isHidden) {
      return (
        <div className="h-full bg-gradient-to-br from-blue-800 to-blue-900 rounded border-2 border-blue-700">
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-8 bg-blue-600 rounded opacity-50"></div>
          </div>
        </div>
      )
    }

    return (
      <div className={`
        h-full bg-gradient-to-br from-white to-gray-50 
        border-2 border-gray-300 rounded shadow-sm
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-400' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${card.isTapped ? 'transform rotate-90' : ''}
        transition-all duration-200
      `}>
        {/* Card Header */}
        <div className="p-1 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium truncate flex-1 mr-1">
              {card.name}
            </span>
            {card.properties.cost !== undefined && (
              <Badge variant="secondary" className="text-xs min-w-0">
                {card.properties.cost}
              </Badge>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-1 flex-1 flex flex-col">
          {/* Card Type */}
          <div className="text-xs text-muted-foreground mb-1">
            {card.type}
          </div>

          {/* Card Text */}
          {card.text && (
            <div className="text-xs leading-tight flex-1 overflow-hidden">
              {card.text.substring(0, isInPlay ? 60 : 30)}
              {card.text.length > (isInPlay ? 60 : 30) && '...'}
            </div>
          )}

          {/* Power/Toughness for creatures */}
          {(card.properties.power !== undefined || card.properties.toughness !== undefined) && (
            <div className="text-xs font-bold text-right mt-auto">
              {card.properties.power}/{card.properties.toughness}
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="absolute top-0 right-0 p-1 space-y-1">
          {card.isTapped && (
            <Badge variant="secondary" className="text-xs">T</Badge>
          )}
          {card.counters.length > 0 && (
            <Badge variant="outline" className="text-xs">
              +{card.counters.length}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        ${getCardSize()} 
        cursor-pointer 
        relative
        ${isSelected ? 'z-10' : ''}
      `}
      style={style}
      draggable={!isHidden}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={isInHand ? "Double-click to play" : isInPlay ? "Double-click to tap/untap" : ""}
    >
      {getCardContent()}
    </div>
  )
}