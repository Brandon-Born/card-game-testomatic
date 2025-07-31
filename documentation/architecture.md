# Document 1: Overall Architecture

This document outlines the technical architecture, technology stack, and data flow for the Card Game AI Tester platform.

### 1. Guiding Principles

* **Modular & Composable:** Every part of the system, especially the core framework, should be an independent module that can be tested in isolation and composed to build complex features.
* **Serverless First:** We will leverage serverless functions and managed services to ensure scalability, reduce operational overhead, and align with the Vercel ecosystem.
* **Test-Driven Development (TDD) for the Core:** The game logic framework (Nouns, Verbs, Triggers) is the heart of the application. It **must** be developed with a rigorous TDD methodology to ensure it is rock-solid and bug-free.
* **Incremental Feature Delivery:** The architecture is designed to support the phased rollout without requiring major refactoring. Each new phase builds upon the last.

### 2. Technology Stack Summary

| Component | Technology/Service | Rationale |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) (with React) | Vercel's native framework. Provides SSR, API routes, and a world-class developer experience for web apps. |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/) | Modern, accessible, and highly composable UI components. Perfect for building a complex design tool. |
| **Visual Designer**| [React Flow](https://reactflow.dev/) | A powerful library for building node-based editors. Ideal for visually connecting triggers and actions. |
| **Backend API** | Next.js API Routes | Serverless functions hosted by Vercel. Perfect for database interactions, AI proxying, and auth. |
| **Database** | [Firestore](https://firebase.google.com/docs/firestore) (from Google Firebase) | A NoSQL, document-based DB with excellent real-time capabilities. Perfect for storing flexible game rules and powering multiplayer. |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/docs/auth) | Integrates seamlessly with Firestore for security rules and provides easy-to-use social/email login. |
| **AI Integration** | [Google Gemini API](https://ai.google.dev/) or [OpenAI API](https://openai.com/blog/openai-api) | The AI engine will call one of these services via a secure Next.js API route to parse rules and generate structured JSON. |
| **Payments** | [Stripe](https://stripe.com/) | The industry standard for online payments and subscriptions. Excellent developer tools and APIs. |
| **Deployment** | [Vercel](https://vercel.com/) | The platform of choice. Provides seamless Git-based deployment, hosting, and serverless infrastructure. |

### 3. System Architecture Diagram

!http://googleusercontent.com/image_generation_content/2

### 4. Data Models (Firestore Collections)

* **`users`**:
    * `uid` (from Firebase Auth)
    * `email`
    * `displayName`
    * `subscriptionTier` (e.g., 'free', 'pro')
    * `stripeCustomerId`
* **`games`**:
    * `gameId`
    * `ownerUid`
    * `name`
    * `description`
    * `cards`: A sub-collection of `card` documents.
    * `rules`: A sub-collection of `rule` documents (the output of the visual designer/AI).
* **`gameSessions`** (for Phase 3):
    * `sessionId`
    * `gameId` (references the game being played)
    * `players`: An array of `uid`s.
    * `gameState`: A large JSON object representing the entire current state of the game, which gets updated in real-time.

* * *

# Document 2: Product Requirements

This document outlines the features and requirements for each phase of the project.

### 1. Overall Goal

To create a web-based platform that empowers card game designers to rapidly create, prototype, test, and share their games using a powerful visual editor, an AI assistant, and a robust multiplayer simulator.

### 2. Core Principles

* **User-Centric Design:** The designer is the primary user. The tools must be intuitive, powerful, and reduce their workload.
* **Test-Driven Development:** All modules defined in the "Framework" document (Nouns, Verbs, Triggers) **must** be developed using TDD, with comprehensive unit and integration tests.

### 3. Phased Feature Breakdown

#### Phase 0: The Visual Rules Engine Designer

* **User Stories:**
    * As a designer, I can create a new game project.
    * As a designer, I can create, edit, and delete `Card` definitions (name, text, type, art placeholder).
    * As a designer, I can use a visual, node-based editor (React Flow) to create game logic.
    * As a designer, I can drag `Trigger` nodes (e.g., `OnCardPlayed`) onto a canvas.
    * As a designer, I can drag `Action` nodes (e.g., `DrawCards`) onto a canvas.
    * As a designer, I can connect `Triggers` to `Actions` to define a rule.
    * As a designer, I can configure the parameters for `Actions` (e.g., set `count` to 2 for `DrawCards`).
    * As a designer, I can save my entire game definition (cards and rules) to my account.

#### Phase 1: Local "Pass and Play" Simulator

* **User Stories:**
    * As a designer, I can start a "Local Play" session from one of my saved games.
    * As a designer, I can see a visual representation of the game board, including all public and private `Zones`.
    * As a designer, I can manually perform game actions (draw, play, discard) by dragging and dropping cards.
    * As a designer, when I perform an action, the game engine automatically executes any rules I defined in the visual editor.
    * As a designer, I can see a detailed game log that shows every action taken and every rule triggered.
    * As a designer, I can manually override the game state (e.g., change a player's life total) for testing purposes.

#### Phase 2: AI-Assisted Engine Creation

* **User Stories:**
    * As a designer, I have a new "Import from Rules" option for a project.
    * As a designer, I can paste my game's rulebook text into a text area.
    * As a designer, when I submit the text, the AI processes it and generates a proposed set of `Card` and `Rule` definitions.
    * As a designer, I can see the AI's output and review it.
    * As a designer, I can accept the AI's suggestions, which then populates my visual rules editor.
    * As a designer, I can then use the visual editor to tweak, correct, or add to the AI-generated rules.

#### Phase 3: Online Multiplayer

* **User Stories:**
    * As a user, I can create a persistent account and log in.
    * As a designer, I can create a new online game session (a "lobby") from one of my saved games.
    * As a designer, I can share a unique link to invite other players to my lobby.
    * As a player, I can join a game using a link.
    * As a player, all my game actions are synchronized in real-time for all other players in the session.
    * As a player, I can only see my own hand and other private information.

#### Phase 4: Monetization (Subscriptions)

* **User Stories:**
    * As a user, I can see different subscription tiers (e.g., Free, Pro).
    * The Free tier has limitations (e.g., max 3 game projects, no AI assistance).
    * As a user, I can securely enter my payment information to upgrade to a Pro account.
    * As a Pro user, I have access to unlimited projects and the AI features.
    * As a user, I can manage my subscription and view my billing history from my account dashboard.

### 4. Non-Functional Requirements

* **Performance:** The game simulator must be responsive and handle complex rule interactions without significant lag.
* **Security:** All user data, especially payment information, must be handled securely. Game rules must be protected so only the owner can edit them.
* **Usability:** The visual designer must be intuitive for non-programmers.
* **Scalability:** The architecture must be able to handle a growing number of users and online game sessions.