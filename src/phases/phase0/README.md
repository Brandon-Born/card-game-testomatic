# Phase 0: Visual Rules Engine Designer

This phase focuses on creating the visual, node-based editor for designing game rules, cards, and zones.

## Features

- **Visual Rule Designer**: React Flow-based editor for creating game logic
- **Card Management**: Create, edit, and delete card definitions
- **Zone Designer**: Create custom game layouts (hands, tableaus, play areas, etc.)
- **Trigger Nodes**: Visual representations of game events (OnCardPlayed, TurnStart, etc.)
- **Action Nodes**: Visual representations of game actions (DrawCards, ModifyStat, etc.)
- **Rule Connections**: Visual connections between triggers and actions
- **Project Management**: Save and load complete game projects

## Components

- `RuleDesigner/`: Main visual editor component with React Flow
- `NodeTypes/`: Custom node types for triggers and actions
- `CardDesigner/`: Interface for creating and editing cards
- `ZoneDesigner/`: Interface for creating custom game zone layouts
- `ProjectManager/`: Project creation and management

## Zone Types Supported

- **Deck**: Private, unordered stacks (typically for drawing cards)
- **Hand**: Private, ordered card collections (player hands)
- **Discard Pile**: Public, unordered discard areas
- **Play Area**: Public, unordered game boards/tableaus
- **Stack**: Public, ordered effect stacks

## Status

✅ **COMPLETE** - Full visual designer with rules, cards, zones, and project management