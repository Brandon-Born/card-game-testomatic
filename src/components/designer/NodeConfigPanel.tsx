'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Badge import removed - not used in current implementation
import { X } from 'lucide-react'

// Define available trigger and action types based on our framework
export const TRIGGER_TYPES = {
  TURN_START: { label: 'Turn Start', description: 'Triggers at the beginning of a player\'s turn' },
  TURN_END: { label: 'Turn End', description: 'Triggers at the end of a player\'s turn' },
  CARD_PLAYED: { label: 'Card Played', description: 'Triggers when any card is played' },
  CARD_DRAWN: { label: 'Card Drawn', description: 'Triggers when a player draws a card' },
  CARD_ENTERS_ZONE: { label: 'Card Enters Zone', description: 'Triggers when a card enters a specific zone' },
  DAMAGE_DEALT: { label: 'Damage Dealt', description: 'Triggers when damage is dealt to any target' },
  TARGET_SELECTED: { label: 'Target Selected', description: 'Triggers when a player chooses a target' },
  COMBAT_PHASE_START: { label: 'Combat Phase Start', description: 'Triggers when combat phase begins' },
  MANA_SPENT: { label: 'Mana Spent', description: 'Triggers when mana is spent' },
  COUNTER_ADDED: { label: 'Counter Added', description: 'Triggers when a counter is added' },
  PLAYER_ELIMINATED: { label: 'Player Eliminated', description: 'Triggers when a player is eliminated' },
}

export const ACTION_TYPES = {
  moveCard: { label: 'Move Card', description: 'Transfer a card between zones', parameters: ['cardId', 'fromZone', 'toZone', 'position'] },
  drawCards: { label: 'Draw Cards', description: 'Draw cards from deck to hand', parameters: ['playerId', 'count'] },
  playCard: { label: 'Play Card', description: 'Play a card from hand', parameters: ['cardId', 'playerId', 'targets'] },
  modifyStat: { label: 'Modify Stat', description: 'Change a numerical property', parameters: ['target', 'stat', 'value'] },
  tapCard: { label: 'Tap Card', description: 'Tap a card', parameters: ['cardId'] },
  untapCard: { label: 'Untap Card', description: 'Untap a card', parameters: ['cardId'] },
  discardCard: { label: 'Discard Card', description: 'Move card to discard pile', parameters: ['cardId', 'playerId'] },
  shuffleZone: { label: 'Shuffle Zone', description: 'Randomize zone order', parameters: ['zoneId'] },
  addCounter: { label: 'Add Counter', description: 'Add a counter to target', parameters: ['target', 'counterType'] },
  removeCounter: { label: 'Remove Counter', description: 'Remove a counter from target', parameters: ['target', 'counterType'] },
  setTurnPhase: { label: 'Set Turn Phase', description: 'Change the game phase', parameters: ['phaseName'] },
  viewZone: { label: 'View Zone', description: 'Look at cards in a zone', parameters: ['playerId', 'zoneId', 'count'] },
}

interface NodeConfigPanelProps {
  nodeId: string
  nodeData: any
  onUpdateNode: (nodeId: string, updates: any) => void
  onDeleteNode: (nodeId: string) => void
  onClose: () => void
}

export function NodeConfigPanel({ nodeId, nodeData, onUpdateNode, onDeleteNode, onClose }: NodeConfigPanelProps) {
  const isTriggerNode = nodeData.eventType !== undefined
  const isActionNode = nodeData.actionType !== undefined

  const handleFieldChange = (field: string, value: any) => {
    onUpdateNode(nodeId, { [field]: value })
  }

  const handleParameterChange = (paramKey: string, value: any) => {
    const currentParams = nodeData.parameters || {}
    onUpdateNode(nodeId, {
      parameters: { ...currentParams, [paramKey]: value }
    })
  }

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="trigger-type">Trigger Type</Label>
        <Select
          value={nodeData.eventType || ''}
          onValueChange={(value) => {
            const triggerInfo = TRIGGER_TYPES[value as keyof typeof TRIGGER_TYPES]
            handleFieldChange('eventType', value)
            handleFieldChange('label', triggerInfo?.label || value)
            handleFieldChange('description', triggerInfo?.description || '')
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRIGGER_TYPES).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                {info.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="trigger-condition">Condition (Optional)</Label>
        <Textarea
          id="trigger-condition"
          placeholder="e.g., event.payload.cardType === 'Lightning Bolt'"
          value={nodeData.condition || ''}
          onChange={(e) => handleFieldChange('condition', e.target.value)}
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          JavaScript expression to filter when this trigger fires
        </p>
      </div>

      <div>
        <Label htmlFor="trigger-priority">Priority</Label>
        <Input
          id="trigger-priority"
          type="number"
          value={nodeData.priority || 1}
          onChange={(e) => handleFieldChange('priority', parseInt(e.target.value))}
        />
        <p className="text-xs text-gray-500 mt-1">
          Higher numbers execute first (default: 1)
        </p>
      </div>
    </div>
  )

  const renderActionConfig = () => {
    const actionInfo = ACTION_TYPES[nodeData.actionType as keyof typeof ACTION_TYPES]
    const parameters = actionInfo?.parameters || []

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="action-type">Action Type</Label>
          <Select
            value={nodeData.actionType || ''}
            onValueChange={(value) => {
              const actionInfo = ACTION_TYPES[value as keyof typeof ACTION_TYPES]
              handleFieldChange('actionType', value)
              handleFieldChange('label', actionInfo?.label || value)
              handleFieldChange('description', actionInfo?.description || '')
              // Reset parameters when changing action type
              handleFieldChange('parameters', {})
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_TYPES).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {parameters.length > 0 && (
          <div>
            <Label>Parameters</Label>
            <div className="space-y-2 mt-2">
              {parameters.map((param) => (
                <div key={param}>
                  <Label htmlFor={`param-${param}`} className="text-sm text-gray-600">
                    {param}
                  </Label>
                  <Input
                    id={`param-${param}`}
                    placeholder={getParameterPlaceholder(param)}
                    value={nodeData.parameters?.[param] || ''}
                    onChange={(e) => handleParameterChange(param, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const getParameterPlaceholder = (param: string): string => {
    const placeholders: Record<string, string> = {
      cardId: 'Card ID or variable',
      playerId: 'Player ID or variable', 
      zoneId: 'Zone ID or variable',
      fromZone: 'Source zone ID',
      toZone: 'Target zone ID',
      count: 'Number of cards',
      target: 'Target card or player ID',
      stat: 'Property name (e.g., life, power)',
      value: 'Numerical value',
      position: 'Position in zone (optional)',
      targets: 'Array of target IDs',
      counterType: 'Counter type (e.g., +1/+1, poison)',
      phaseName: 'Phase name (upkeep, main, combat, end)'
    }
    return placeholders[param] || param
  }

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">
          {isTriggerNode ? 'Configure Trigger' : 'Configure Action'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="node-label">Display Name</Label>
          <Input
            id="node-label"
            value={nodeData.label || ''}
            onChange={(e) => handleFieldChange('label', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="node-description">Description</Label>
          <Textarea
            id="node-description"
            value={nodeData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={2}
          />
        </div>

        {isTriggerNode && renderTriggerConfig()}
        {isActionNode && renderActionConfig()}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onDeleteNode(nodeId)}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            Delete Node
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}