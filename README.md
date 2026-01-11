# The Resistance Game Helper

A Progressive Web App (PWA) helper for playing the classic board game **The Resistance**. This offline-capable application serves as a "secret tablet" passed between players to manage roles, mission voting, and game flow.

## About The Resistance

The Resistance is a social deduction game where players are divided into two factions:

- **Resistance** (majority): Fighting against the oppressive government
- **Spies** (minority): Infiltrating the resistance to sabotage their missions

The game consists of up to 5 missions. Resistance wins by successfully completing 3 missions, while Spies win by causing 3 missions to fail.

## Features

- 🎯 **Offline Support**: Full PWA with service worker for offline gameplay
- 🌍 **Multilingual**: English and Russian language support
- 📱 **Mobile Optimized**: Touch-friendly interface with mobile-first design
- 🔒 **Privacy Protection**: Private screens with auto-clear functionality
- ⚡ **Real-time State**: Persistent game state using localStorage
- 🎨 **Modern UI**: Built with Tailwind CSS and smooth animations

## Game Flow

1. **Lobby**: Host selects number of players (5-10)
2. **Name Entry**: Each player enters their name and privately views their role
3. **Captain Selection**: Shows current mission captain
4. **Team Selection**: Captain selects team members for the mission
5. **Mission Voting**: Team members vote Success/Fail in private
6. **Results**: Mission outcome is revealed with vote tallies
7. **Victory**: Final results with role reveals

## Player Distribution

| Players | Resistance | Spies |
| ------- | ---------- | ----- |
| 5       | 3          | 2     |
| 6       | 4          | 2     |
| 7       | 4          | 3     |
| 8       | 5          | 3     |
| 9       | 6          | 3     |
| 10      | 6          | 4     |

## Mission Rules

- **Standard Rule**: Any Fail vote causes mission failure
- **Special Rule**: Mission 4 with 7+ players requires 2+ Fail votes to fail
- **Team Sizes**: Vary by player count and mission number (see `TEAM_SIZES` constant)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand with localStorage persistence
- **PWA**: Vite PWA plugin with Workbox
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + TypeScript

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd resistance-game

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint
```

## Development

The application is structured as follows:

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── PrivateScreen.tsx
├── screens/            # Game screens/pages
│   ├── Lobby.tsx
│   ├── NameEntry.tsx
│   ├── Captain.tsx
│   ├── TeamSelect.tsx
│   ├── MissionVote.tsx
│   ├── MissionResult.tsx
│   └── Victory.tsx
├── store/              # State management
│   └── gameStore.ts
├── utils/              # Game logic utilities
│   └── gameLogic.ts
├── hooks/              # Custom React hooks
│   └── useTranslation.ts
├── i18n/               # Internationalization
│   ├── en.json
│   └── ru.json
├── types/              # TypeScript definitions
│   └── game.ts
└── App.tsx             # Main application component
```

## Screenshot / Demo States

For making nice mobile screenshots, you can seed a few interesting demo states via URL params:

- `?shot=<id>`: loads a predefined complex game state into `localStorage`
- `&vote=1`: opens the private mission vote card screen (for `mission-vote` shots)
- `&cards=1&noAnim=1`: shows mission result cards immediately (no flip animation)

Available `shot` ids:

- `captain-m4-specialrule`
- `team-vote-m4-tension`
- `mission-vote-m4-private`
- `mission-result-m4-fail-2red`

Short links (hosted as static pages, for sharing):

- `/1/` → `captain-m4-specialrule`
- `/2/` → `team-vote-m4-tension`
- `/3/` → `mission-vote-m4-private` (+`vote=1`)
- `/4/` → `mission-result-m4-fail-2red` (+`cards=1&noAnim=1`)

## Game State Schema

```typescript
interface GameState {
  phase:
    | "lobby"
    | "name-entry"
    | "captain"
    | "team-select"
    | "mission-vote"
    | "mission-result"
    | "victory";
  totalPlayers: number;
  players: Player[];
  captainIndex: number;
  missions: Mission[];
  currentPlayerIndex: number;
  language: "en" | "ru";
}

interface Player {
  id: string;
  name: string;
  role: "spy" | "resistance" | null;
}

interface Mission {
  number: 1 | 2 | 3 | 4 | 5;
  team: string[]; // Player IDs
  votes: MissionVote[];
  result: "pending" | "success" | "fail";
}
```

## PWA Features

- **Offline Capability**: Works without internet connection
- **Install Prompt**: Can be installed as a native app
- **Auto-Updates**: Automatic updates when new versions are available
- **Portrait Lock**: Optimized for mobile portrait orientation

## Privacy & Security

- **Private Screens**: Role reveals and voting use full-screen overlays
- **Auto-Clear**: Sensitive screens automatically clear after timeout
- **Local Storage**: All data stored locally, no server communication
- **Screen Protection**: Clear screen buttons prevent accidental reveals

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original board game "The Resistance" by Don Eskridge
- Built with modern web technologies for optimal user experience
- Designed for both casual and competitive play sessions
