# Project Outline: The Card Game Framework

**Objective:** To create a robust, extensible, and well-documented set of modular components (objects and functions) that can be used to construct a wide variety of card game engines. This framework will be the foundational toolkit for both human developers and an eventual AI game designer.

---

## 1. Game Object Primitives (The Nouns)

These are the core data structures representing the physical and abstract components of a card game.

| Task | Status | Implementation Details | User-Facing Documentation |
| :--- | :--- | :--- | :--- |
| **`Game` Object** | `To Do` | `[Agent to specify language/class structure]` | **`Game`**: The top-level container for a single game session. It holds all players, zones, and tracks the global game state, such as turn order and global flags. |
| **`Player` Object** | `To Do` | `[Agent to specify language/class structure]` | **`Player`**: Represents a participant in the game. It manages player-specific resources like life, mana, and action points, and holds references to player-owned zones (Hand, Deck, etc.). |
| **`Card` Object** | `To Do` | `[Agent to specify language/class structure]` | **`Card`**: The fundamental unit of gameplay. Each card has a unique ID and properties like Name, Text, and Type. It also tracks its current owner and its location (zone). |
| **`Zone` Object** | `To Do` | `[Agent to specify language/class structure]` | **`Zone`**: A container for `Card` objects. Key properties include `visibility` (public/private), `order` (ordered/unordered), and `owner`. |
| *--Sub-class: `Deck`* | `To Do` | *Inherits from Zone* | **`Deck`**: A specialized, ordered `Zone` that is private to its owner. Typically the main source for drawing cards. |
| *--Sub-class: `Hand`* | `To Do` | *Inherits from Zone* | **`Hand`**: A specialized, unordered `Zone` that is private to its owner. Holds cards the player can typically play. |
| *--Sub-class: `DiscardPile`*| `To Do` | *Inherits from Zone* | **`DiscardPile` / `Graveyard`**: A specialized, ordered `Zone` that is public to all players. |
| *--Sub-class: `PlayArea`* | `To Do` | *Inherits from Zone* | **`PlayArea` / `Battlefield`**: A specialized, unordered `Zone` that is public. Contains cards that are actively affecting the game. |
| **`Counter` Object** | `To Do` | `[Agent to specify language/class structure]` | **`Counter`**: A flexible token that can be placed on any `Card` or `Player` to track temporary or permanent modifications (e.g., +1/+1 counters, poison counters). |
| **`Stack` Object** | `To Do` | `[Agent to specify language/class structure]` | **`Stack`**: A specialized, public `Zone` for managing the order of playing cards and resolving effects, following a "Last-In, First-Out" (LIFO) model. Essential for games with instants and responses. |

---

## 2. Action Library (The Verbs)

These are the pre-coded, parameterized functions that manipulate the Game Object Primitives. They are the only valid ways to change the game state.

| Task | Status | Implementation Details | User-Facing Documentation |
| :--- | :--- | :--- | :--- |
| **`MoveCard(card, toZone)`** | `To Do` | `[Agent to detail function signature]` | **`MoveCard`**: Moves a specified `Card` to a new `Zone`. Handles removing it from the old zone and adding it to the new one. |
| **`DrawCards(player, count)`** | `To Do` | `[Agent to detail function signature]` | **`DrawCards`**: A `Player` moves a specified `count` of cards from the top of their `Deck` to their `Hand`. |
| **`Shuffle(zone)`** | `To Do` | `[Agent to detail function signature]` | **`Shuffle`**: Randomizes the order of all cards within a specified `Zone`. |
| **`PlayCard(player, card, targets)`** | `To Do` | `[Agent to detail function signature]` | **`PlayCard`**: Moves a `Card` from a `Player`'s `Hand` to the `PlayArea`. Can specify `targets` if the card requires them. Triggers `OnPlay` events. |
| **`ModifyStat(target, stat, value)`**| `To Do` | `[Agent to detail function signature]` | **`ModifyStat`**: Changes a numerical property (`stat`) on a `target` `Player` or `Card` by a certain `value` (can be positive or negative). E.g., change life, power, etc. |
| **`Tap(card)` / `Exhaust(card)`** | `To Do` | `[Agent to detail function signature]` | **`Tap` / `Exhaust`**: Sets a boolean flag on a `Card` to indicate it has been used for an action this turn. |
| **`Untap(card)` / `Ready(card)`** | `To Do` | `[Agent to detail function signature]` | **`Untap` / `Ready`**: Resets the 'tapped' or 'exhausted' flag on a `Card`, typically at the start of a turn. |
| **`Discard(player, card)`** | `To Do` | `[Agent to detail function signature]` | **`Discard`**: Moves a specific `Card` from a `Player`'s `Hand` to their `DiscardPile`. |
| **`ViewZone(player, zone, count)`** | `To Do` | `[Agent to detail function signature]` | **`ViewZone`**: Allows a `Player` to look at the cards in a `Zone` (even a private one, like a Deck) up to a certain `count`. |
| **`AddCounter(target, counterType)`** | `To Do` | `[Agent to detail function signature]` | **`AddCounter`**: Places a `Counter` of a specified `counterType` on a `target` `Card` or `Player`. |
| **`RemoveCounter(target, counterType)`**| `To Do` | `[Agent to detail function signature]` | **`RemoveCounter`**: Removes a `Counter` from a `target`. |
| **`SetTurnPhase(phaseName)`** | `To Do` | `[Agent to detail function signature]` | **`SetTurnPhase`**: Advances the game state to a specific named phase (e.g., 'Upkeep', 'Main', 'Combat', 'End'). |

---

## 3. Trigger/Event System (The Logic)

This system connects Actions to Events, forming the core game logic. It's a pub/sub model where game actions publish events, and cards can subscribe to those events to trigger their effects.

| Task | Status | Implementation Details | User-Facing Documentation |
| :--- | :--- | :--- | :--- |
| **Event Listener: `OnEvent`** | `To Do` | `[Agent to detail listener architecture]`| **`OnEvent`**: The core function for creating game logic. Links an `Event` to an `Action`. Usage: `OnEvent(EventType, ActionToTake)`. |
| **`EventType: TurnStart`** | `To Do` | `Published by SetTurnPhase` | **`TurnStart`**: Published at the beginning of a player's turn. |
| **`EventType: TurnEnd`** | `To Do` | `Published by SetTurnPhase` | **`TurnEnd`**: Published at the end of a player's turn. |
| **`EventType: CardPlayed`** | `To Do` | `Published by PlayCard action` | **`CardPlayed`**: Published whenever any card is played. The event payload includes the card and the player. |
| **`EventType: CardDrawn`** | `To Do` | `Published by DrawCards action` | **`CardDrawn`**: Published whenever a player draws a card. |
| **`EventType: CardEntersZone`** | `To Do` | `Published by MoveCard action`| **`CardEntersZone`**: Published when a card enters any zone. Payload includes the card and the destination zone. Useful for "enter the battlefield" or "when this goes to the graveyard" effects. |
| **`EventType: DamageDealt`** | `To Do` | `Published by ModifyStat (on life)` | **`DamageDealt`**: Published when a Player's life total is modified negatively. |
| **`EventType: TargetSelected`** | `To Do` | `Published by PlayCard action` | **`TargetSelected`**: Published when a player chooses a target for a spell or ability. |
| **`EventType: CombatPhaseStart`**| `To Do` | `Published by SetTurnPhase` | **`CombatPhaseStart`**: Published when the game enters the combat phase. |