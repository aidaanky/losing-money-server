# Losing Money - Texas Hold'em Poker Game

A real-time multiplayer Texas Hold'em poker game built with Next.js and Socket.IO.

## Author
Aidana Ispayeva

## Tech Stack

### Frontend
- **Next.js** - React framework for server-side rendering and routing
- **React** - UI library
- **Socket.IO Client** - Real-time communication
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **Howler.js** - Sound effects

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **Poker Hand Evaluator** - Hand strength calculation

## Architecture

### Client-Server Architecture
- **WebSocket Connection**: Real-time bidirectional communication between client and server
- **Room-based System**: Players join specific rooms using 4-digit room codes
- **State Management**: Server maintains game state, client receives updates via WebSocket events

### Key Components
1. **Room System**
   - Unique 4-digit room codes
   - Maximum 6 players per room
   - Host controls game start and bot management

2. **Game Engine**
   - Hand evaluation
   - Betting rounds
   - Player actions (fold, check, call, raise)
   - Bot AI for single-player mode

3. **Real-time Updates**
   - Player list updates
   - Game state synchronization
   - Betting updates
   - Hand results

## Game Rules

### Basic Rules
1. Each player receives 2 private cards (hole cards)
2. 5 community cards are dealt in stages:
   - Flop (3 cards)
   - Turn (1 card)
   - River (1 card)
3. Players make the best 5-card hand using any combination of their hole cards and community cards

### Betting Rounds
1. **Pre-flop**: After receiving hole cards
2. **Flop**: After first 3 community cards
3. **Turn**: After 4th community card
4. **River**: After final community card

### Player Actions
- **Fold**: Give up hand and forfeit current bet
- **Check**: Pass without betting (if no current bet)
- **Call**: Match current bet
- **Raise**: Increase current bet

### Hand Rankings (Highest to Lowest)
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

### Starting Chips
- Each player starts with 1000 chips
- Small Blind: 5 chips
- Big Blind: 10 chips

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone [repository-url]
cd losing-money
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables
Create a `.env` file in the root directory:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Features
- Real-time multiplayer gameplay
- Single-player mode with AI bots
- Customizable bot difficulty
- Room-based matchmaking
- Hand strength evaluation
- Animated card dealing
- Sound effects
- Responsive design

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
