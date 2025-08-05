'use client'

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// ScrollArea component not available, using regular div with scroll
import { Trash2, Clock } from 'lucide-react'

interface GameLogEntry {
  timestamp: Date
  action: string
  details: string
  type?: 'action' | 'event' | 'error' | 'system'
}

interface GameLogProps {
  entries: GameLogEntry[]
  onClear: () => void
}

export default function GameLog({ entries, onClear }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEntryColor = (type: string = 'action') => {
    switch (type) {
      case 'error': return 'border-l-red-500 bg-red-50'
      case 'event': return 'border-l-blue-500 bg-blue-50'
      case 'system': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getActionBadgeColor = (action: string) => {
    if (action.toLowerCase().includes('error')) return 'destructive'
    if (action.toLowerCase().includes('rule') || action.toLowerCase().includes('trigger')) return 'secondary'
    if (action.toLowerCase().includes('play') || action.toLowerCase().includes('draw')) return 'default'
    return 'outline'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Game Log</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {entries.length} entries
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClear}
            disabled={entries.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-2">
          {entries.length === 0 ? (
            <Card className="p-4 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No game actions yet</p>
              <p className="text-sm">Game events will appear here</p>
            </Card>
          ) : (
            entries.map((entry, index) => (
              <Card 
                key={index}
                className={`
                  p-3 border-l-4 transition-all duration-200
                  ${getEntryColor(entry.type)}
                  hover:shadow-sm
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <Badge 
                    variant={getActionBadgeColor(entry.action)}
                    className="text-xs"
                  >
                    {entry.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {entry.details}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            Actions: {entries.filter(e => e.type !== 'error').length}
          </div>
          <div>
            Errors: {entries.filter(e => e.type === 'error').length}
          </div>
        </div>
      </div>
    </div>
  )
}