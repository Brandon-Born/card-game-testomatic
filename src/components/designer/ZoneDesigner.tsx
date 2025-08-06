'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Edit2,
  Eye,
  EyeOff,
  Users,
  User,
  Hash,
  Shuffle,
  Layers
} from 'lucide-react'
import { createZoneId } from '@/lib/utils'
import type { ZoneTemplate } from '@/types'

interface ZoneDesignerProps {
  zones: ZoneTemplate[]
  onZonesChange: (zones: ZoneTemplate[]) => void
}

export function ZoneDesigner({ zones, onZonesChange }: ZoneDesignerProps) {
  const [editingZone, setEditingZone] = useState<ZoneTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)

  const zoneTypeOptions = [
    { value: 'deck', label: 'Deck', icon: Layers, description: 'Hidden stack of cards, usually face-down' },
    { value: 'hand', label: 'Hand', icon: User, description: 'Private cards visible only to owner' },
    { value: 'discard', label: 'Discard Pile', icon: Trash2, description: 'Face-up pile of discarded cards' },
    { value: 'playarea', label: 'Play Area', icon: Users, description: 'Table area where cards are played' },
    { value: 'stack', label: 'Stack', icon: Hash, description: 'Ordered stack of effects or spells' }
  ]

  const ownerOptions = [
    { value: 'each', label: 'Each Player' },
    { value: 'shared', label: 'Shared/Public' }
  ]

  const defaultZonesByType = {
    deck: { visibility: 'private' as const, order: 'unordered' as const, maxSize: 60 },
    hand: { visibility: 'private' as const, order: 'ordered' as const, maxSize: 7 },
    discard: { visibility: 'public' as const, order: 'unordered' as const },
    playarea: { visibility: 'public' as const, order: 'unordered' as const },
    stack: { visibility: 'public' as const, order: 'ordered' as const }
  }

  const handleAddZone = () => {
    const newZone: ZoneTemplate = {
      id: createZoneId().value,
      name: 'New Zone',
      type: 'hand',
      owner: 'each',
      visibility: 'private',
      order: 'ordered'
    }
    setEditingZone(newZone)
    setShowForm(true)
  }

  const handleEditZone = (zone: ZoneTemplate) => {
    setEditingZone({ ...zone })
    setShowForm(true)
  }

  const handleSaveZone = () => {
    if (!editingZone || !editingZone.name.trim()) return

    const isNew = !zones.find(z => z.id === editingZone.id)
    
    if (isNew) {
      onZonesChange([...zones, editingZone])
    } else {
      onZonesChange(zones.map(z => z.id === editingZone.id ? editingZone : z))
    }
    
    setEditingZone(null)
    setShowForm(false)
  }

  const handleDeleteZone = (zoneId: string) => {
    onZonesChange(zones.filter(z => z.id !== zoneId))
  }

  const handleCancelEdit = () => {
    setEditingZone(null)
    setShowForm(false)
  }

  const handleTypeChange = (type: ZoneTemplate['type']) => {
    if (!editingZone) return
    
    const defaults = defaultZonesByType[type]
    setEditingZone({
      ...editingZone,
      type,
      ...defaults
    })
  }

  const createDefaultZones = () => {
    const defaultZones: ZoneTemplate[] = [
      {
        id: createZoneId().value,
        name: 'Deck',
        type: 'deck',
        owner: 'each',
        visibility: 'private',
        order: 'unordered',
        maxSize: 60,
        description: 'Each player\'s main deck'
      },
      {
        id: createZoneId().value,
        name: 'Hand',
        type: 'hand',
        owner: 'each',
        visibility: 'private',
        order: 'ordered',
        maxSize: 7,
        description: 'Each player\'s hand of cards'
      },
      {
        id: createZoneId().value,
        name: 'Play Area',
        type: 'playarea',
        owner: 'each',
        visibility: 'public',
        order: 'unordered',
        description: 'Each player\'s area for cards in play'
      },
      {
        id: createZoneId().value,
        name: 'Discard Pile',
        type: 'discard',
        owner: 'each',
        visibility: 'public',
        order: 'unordered',
        description: 'Each player\'s discard pile'
      },
      {
        id: createZoneId().value,
        name: 'Graveyard',
        type: 'discard',
        owner: 'shared',
        visibility: 'public',
        order: 'unordered',
        description: 'A shared discard pile for all players'
      }
    ]
    
    onZonesChange(defaultZones)
  }

  const getZoneTypeInfo = (type: string) => {
    return zoneTypeOptions.find(opt => opt.value === type)
  }

  const getOwnerLabel = (owner: string | null) => {
    if (!owner) return 'No Owner'
    return ownerOptions.find(opt => opt.value === owner)?.label || owner
  }

  return (
    <div className="h-full flex">
      {/* Zone List */}
      <div className="w-1/2 p-6 border-r">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Game Zones</h2>
            <p className="text-sm text-muted-foreground">
              Define areas where cards can be placed (hands, tableaus, decks, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={createDefaultZones} variant="outline" size="sm">
              Create Default
            </Button>
            <Button onClick={handleAddZone} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </div>
        </div>

        {zones.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-medium">No zones defined</h3>
                <p className="text-sm text-muted-foreground">
                  Start by creating default zones or add your own custom zones
                </p>
              </div>
              <Button onClick={createDefaultZones}>
                Create Default Zones
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => {
              const typeInfo = getZoneTypeInfo(zone.type)
              const IconComponent = typeInfo?.icon || Layers
              
              return (
                <Card key={zone.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{zone.name}</span>
                          <Badge variant="secondary">
                            {typeInfo?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{getOwnerLabel(zone.owner)}</span>
                          <span className="flex items-center gap-1">
                            {zone.visibility === 'private' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {zone.visibility}
                          </span>
                          {zone.maxSize && <span>Max: {zone.maxSize}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditZone(zone)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteZone(zone.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {zone.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {zone.description}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Zone Editor */}
      <div className="w-1/2 p-6">
        {!showForm ? (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <Edit2 className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-medium">Zone Editor</h3>
                <p className="text-sm text-muted-foreground">
                  Select a zone to edit or create a new one
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg">
                {zones.find(z => z.id === editingZone?.id) ? 'Edit Zone' : 'Create Zone'}
              </CardTitle>
            </CardHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="zone-name">Zone Name</Label>
                <Input
                  id="zone-name"
                  value={editingZone?.name || ''}
                  onChange={(e) => setEditingZone(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Player 1 Hand, Battlefield, Discard Pile"
                />
              </div>

              <div>
                <Label htmlFor="zone-type">Zone Type</Label>
                <Select
                  value={editingZone?.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone type" />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneTypeOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            <div>
                              <div>{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zone-owner">Owner</Label>
                <Select
                  value={editingZone?.owner || 'shared'}
                  onValueChange={(value) => setEditingZone(prev => prev ? { 
                    ...prev, 
                    owner: value as 'each' | 'shared' | null
                  } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zone-visibility">Visibility</Label>
                <Select
                  value={editingZone?.visibility}
                  onValueChange={(value: 'public' | 'private') => 
                    setEditingZone(prev => prev ? { ...prev, visibility: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Public - Visible to all players
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Private - Hidden from other players
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zone-order">Card Order</Label>
                <Select
                  value={editingZone?.order}
                  onValueChange={(value: 'ordered' | 'unordered') => 
                    setEditingZone(prev => prev ? { ...prev, order: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordered">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Ordered - Card position matters
                      </div>
                    </SelectItem>
                    <SelectItem value="unordered">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        Unordered - Cards can be in any position
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zone-maxsize">Maximum Cards (optional)</Label>
                <Input
                  id="zone-maxsize"
                  type="number"
                  min="0"
                  value={editingZone?.maxSize || ''}
                  onChange={(e) => setEditingZone(prev => prev ? { 
                    ...prev, 
                    maxSize: e.target.value ? parseInt(e.target.value) : undefined 
                  } : null)}
                  placeholder="No limit"
                />
              </div>

              <div>
                <Label htmlFor="zone-description">Description (optional)</Label>
                <Input
                  id="zone-description"
                  value={editingZone?.description || ''}
                  onChange={(e) => setEditingZone(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of this zone's purpose"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveZone}
                  disabled={!editingZone?.name.trim()}
                  className="flex-1"
                >
                  {zones.find(z => z.id === editingZone?.id) ? 'Update Zone' : 'Create Zone'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}