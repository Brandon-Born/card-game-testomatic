# Card Game AI Tester Application

The project is an application designed to rapidly prototype and iterate on card game designs. It functions by ingesting a game designer's rules, automatically generating a playable engine and digital assets, and providing a platform for testing.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (for backend services)
- AI API key (Google Gemini or OpenAI)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd card-game-testomatic
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory with:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

   # AI Integration (Choose one)
   GEMINI_API_KEY=your_gemini_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here

   # Development
   NODE_ENV=development
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Visit the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
card-game-testomatic/
├── src/
│   ├── app/                    # Next.js app router
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── game/               # Game-specific components
│   │   ├── designer/           # Visual designer components
│   │   └── simulator/          # Game simulator components
│   ├── core/                   # Game framework
│   │   ├── primitives/         # Game objects (Card, Player, Zone)
│   │   ├── actions/            # Game actions (MoveCard, DrawCards)
│   │   └── events/             # Event system
│   ├── phases/                 # Development phases
│   │   ├── phase0/             # Visual Rules Engine Designer
│   │   ├── phase1/             # Local Pass-and-Play Simulator
│   │   ├── phase2/             # AI-Assisted Engine Creation
│   │   └── phase3/             # Online Multiplayer
│   ├── lib/                    # Utilities and configurations
│   ├── types/                  # TypeScript definitions
│   └── tests/                  # Test files
└── documentation/              # Project documentation
```

## 🎯 Core Features

1. **Ingest Rules:** Allow a game designer to upload a document containing the rules of their card game.

2. **AI Interpretation:** Use an AI to parse the document, understand the core mechanics, and identify specific rules, card effects, and game flow.

3. **Automatic Engine Generation:** The AI will translate the interpreted rules into a functional, playable game engine.

4. **Leverage a Core Framework:** This custom engine will plug into a pre-existing framework that already handles the basic building blocks of any card game (e.g., shuffling decks, drawing cards, managing hands, turn order).

5. **Generate Digital Assets:** The AI will also create the initial set of digital cards based on the rules, populating them with the necessary text and attributes.

## 🚧 Development Phases

### Phase 0: Visual Rules Engine Designer *(Current)*
- Visual, node-based editor for creating game logic
- Card management interface
- Project save/load functionality

### Phase 1: Local "Pass and Play" Simulator
- Game board visualization
- Manual action interface
- Rule execution engine
- Game logging and debugging

### Phase 2: AI-Assisted Engine Creation
- Rulebook text parsing
- AI rule interpretation
- Automatic rule generation
- Review and refinement tools

### Phase 3: Online Multiplayer
- User authentication
- Real-time game sessions
- Multiplayer synchronization
- Session management

## 🛠️ Technology Stack

- **Frontend:** Next.js 15, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Visual Designer:** React Flow
- **Backend:** Next.js API Routes, Firebase
- **Database:** Firestore
- **Authentication:** Firebase Auth
- **AI Integration:** Google Gemini / OpenAI
- **Deployment:** Vercel

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type checking
npm run type-check
```

## 📚 Documentation

Detailed documentation is available in the `documentation/` folder:

- [Architecture Overview](documentation/architecture.md)
- [Framework Specification](documentation/framework.md)
- [Change Log](documentation/change-log.md)

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Write tests for new functionality
3. Update documentation for significant changes
4. Follow TypeScript best practices
5. Use the established Git workflow

## 📄 License

This project is unlicensed. All rights reserved.