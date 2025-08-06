'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit } from 'lucide-react'
import { CardTemplate } from '@/types'

const initialCards: CardTemplate[] = []

interface CardDesignerProps {
  cards?: CardTemplate[]
  onCardsChange?: (cards: CardTemplate[]) => void
}

export function CardDesigner({ cards: propCards, onCardsChange }: CardDesignerProps) {
  const [cards, setCards] = useState<CardTemplate[]>(propCards || initialCards)
  
  // Update local state when props change
  React.useEffect(() => {
    if (propCards) {
      setCards(propCards)
    }
  }, [propCards])
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<CardTemplate>>({})

  const handleCreateCard = () => {
    const newCard: CardTemplate = {
      id: `card-${Date.now()}`,
      name: 'New Card',
      text: 'Enter card description...',
      type: 'Spell',
      cost: 0,
      properties: {},
      copies: 1,
    }
    const updatedCards = [...cards, newCard]
    setCards(updatedCards)
    onCardsChange?.(updatedCards)
    setSelectedCard(newCard)
    setEditForm(newCard)
    setIsEditing(true)
  }

  const handleEditCard = (card: CardTemplate) => {
    setSelectedCard(card)
    setEditForm(card)
    setIsEditing(true)
  }

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards.filter(c => c.id !== cardId)
    setCards(updatedCards)
    onCardsChange?.(updatedCards)
    if (selectedCard?.id === cardId) {
      setSelectedCard(null)
    }
  }

  const handleSaveCard = () => {
    if (!editForm.id) return
    
    const updatedCards = cards.map(card => 
      card.id === editForm.id ? { ...card, ...editForm } as CardTemplate : card
    )
    setCards(updatedCards)
    onCardsChange?.(updatedCards)
    setSelectedCard({ ...selectedCard, ...editForm } as CardTemplate)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({})
  }

  return (
    <div className="flex h-full">
      {/* Card list */}
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Cards</h3>
          <Button onClick={handleCreateCard} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </div>
        
        <div className="space-y-2">
          {cards.map((card) => (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all ${
                selectedCard?.id === card.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCard(card)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{card.name}</h4>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{card.type}</Badge>
                      <Badge variant="secondary" className="text-xs">Cost: {card.cost}</Badge>
                      <Badge variant="default" className="text-xs">x{card.copies}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCard(card)
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCard(card.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Card preview and editor */}
      <div className="flex-1 p-6">
        {selectedCard ? (
          <div className="max-w-2xl mx-auto">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={editForm.cost || 0}
                        onChange={(e) => setEditForm({ ...editForm, cost: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="copies">Copies</Label>
                      <Input
                        id="copies"
                        type="number"
                        value={editForm.copies || 1}
                        onChange={(e) => setEditForm({ ...editForm, copies: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={editForm.type || ''}
                      onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Creature">Creature</SelectItem>
                        <SelectItem value="Instant">Instant</SelectItem>
                        <SelectItem value="Sorcery">Sorcery</SelectItem>
                        <SelectItem value="Enchantment">Enchantment</SelectItem>
                        <SelectItem value="Artifact">Artifact</SelectItem>
                        <SelectItem value="Land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editForm.type === 'Creature' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="power">Power</Label>
                        <Input
                          id="power"
                          type="number"
                          value={editForm.power || 0}
                          onChange={(e) => setEditForm({ ...editForm, power: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="toughness">Toughness</Label>
                        <Input
                          id="toughness"
                          type="number"
                          value={editForm.toughness || 0}
                          onChange={(e) => setEditForm({ ...editForm, toughness: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="text">Card Text</Label>
                    <Textarea
                      id="text"
                      value={editForm.text || ''}
                      onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCard}>Save Changes</Button>
                    <Button onClick={handleCancelEdit} variant="outline">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full max-w-sm mx-auto">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{selectedCard.name}</CardTitle>
                    <Badge variant="secondary">{selectedCard.cost}</Badge>
                  </div>
                  <Badge variant="outline">{selectedCard.type}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">{selectedCard.text}</p>
                  
                  {selectedCard.type === 'Creature' && (
                    <div className="flex justify-between items-center text-sm font-mono">
                      <span>Power: {selectedCard.power}</span>
                      <span>Toughness: {selectedCard.toughness}</span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button onClick={() => handleEditCard(selectedCard)} className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No card selected</p>
              <p className="text-sm">Select a card from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}