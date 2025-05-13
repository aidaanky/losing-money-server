require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createDeck, shuffle, deal } = require('./utils/deck');
const { evaluateHand } = require('./utils/hand-evaluator');
const PokerHandEvaluator = require('poker-hand-evaluator');

// Create Express app
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active rooms and players
const rooms = new Map();

// Game phases and their order
const GAME_PHASES = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];

// Helper function to broadcast player list to a room
const broadcastPlayerList = (roomId) => {
  const room = rooms.get(roomId);
  if (room) {
    io.to(roomId).emit('player-list', room.players);
  }
};

// Helper function to get next player
const getNextPlayer = (room, currentPlayerId) => {
  const currentIndex = room.players.findIndex(p => p.id === currentPlayerId);
  return room.players[(currentIndex + 1) % room.players.length];
};

// Helper function to validate bet
const validateBet = (room, player, action, amount) => {
  if (player.folded) {
    return { valid: false, error: 'Player has folded' };
  }

  if (player.id !== room.gameState.activePlayer) {
    return { valid: false, error: 'Not your turn' };
  }

  const currentBet = room.gameState.currentBet;
  const playerBet = player.currentBet;
  const toCall = currentBet - playerBet;

  switch (action) {
    case 'fold':
      return { valid: true };

    case 'check':
      if (toCall > 0) {
        return { valid: false, error: 'Cannot check when there is a bet to call' };
      }
      return { valid: true };

    case 'call':
      if (toCall > player.chips) {
        return { valid: false, error: 'Not enough chips to call' };
      }
      return { valid: true, amount: toCall };

    case 'raise':
      if (!amount || amount < room.gameState.minRaise) {
        return { valid: false, error: `Minimum raise is ${room.gameState.minRaise}` };
      }
      if (amount > player.chips) {
        return { valid: false, error: 'Not enough chips to raise' };
      }
      if (amount + toCall < currentBet + room.gameState.minRaise) {
        return { valid: false, error: 'Raise must be at least the minimum raise amount' };
      }
      return { valid: true, amount: amount + toCall };

    default:
      return { valid: false, error: 'Invalid action' };
  }
};

// Helper function to process player action
const processPlayerAction = (room, player, action, amount) => {
  const validation = validateBet(room, player, action, amount);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  switch (action) {
    case 'fold':
      player.folded = true;
      break;

    case 'check':
      // No action needed, just move to next player
      break;

    case 'call':
      const callAmount = validation.amount;
      player.chips -= callAmount;
      player.currentBet = room.gameState.currentBet;
      room.gameState.pot += callAmount;
      break;

    case 'raise':
      const raiseAmount = validation.amount;
      player.chips -= raiseAmount;
      player.currentBet = raiseAmount;
      room.gameState.currentBet = raiseAmount;
      room.gameState.pot += raiseAmount;
      room.gameState.minRaise = raiseAmount - room.gameState.currentBet;
      break;
  }

  return { success: true };
};

// Helper function to get next active player
const getNextActivePlayer = (room, currentPlayerId) => {
  const currentIndex = room.players.findIndex(p => p.id === currentPlayerId);
  let nextIndex = (currentIndex + 1) % room.players.length;
  
  // Find next player who hasn't folded and has chips
  while (room.players[nextIndex].folded || room.players[nextIndex].chips === 0) {
    nextIndex = (nextIndex + 1) % room.players.length;
    // If we've gone all the way around, break to prevent infinite loop
    if (nextIndex === currentIndex) break;
  }
  
  return room.players[nextIndex];
};

// Helper function to check if betting round is complete
const isBettingRoundComplete = (room) => {
  const activePlayers = room.players.filter(p => !p.folded && p.chips > 0);
  if (activePlayers.length <= 1) return true;

  return activePlayers.every(player => 
    player.currentBet === room.gameState.currentBet ||
    player.chips === 0
  );
};

// Helper function to advance game phase
const advanceGamePhase = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const currentPhaseIndex = GAME_PHASES.indexOf(room.gameState.phase);
  
  if (currentPhaseIndex === -1 || currentPhaseIndex === GAME_PHASES.length - 1) {
    determineWinner(roomId);
    return;
  }

  // Reset betting for new phase
  room.players.forEach(player => {
    player.currentBet = 0;
  });
  room.gameState.currentBet = 0;
  room.gameState.minRaise = room.gameState.bigBlind;

  // Move to next phase
  room.gameState.phase = GAME_PHASES[currentPhaseIndex + 1];
  
  // Deal community cards based on phase
  switch (room.gameState.phase) {
    case 'flop':
      // Deal and store flop cards
      const flopCards = deal(room.gameState.deck, 3);
      room.gameState.communityCards = flopCards;
      io.to(roomId).emit('community-update', {
        phase: 'flop',
        cards: flopCards,
        allCards: flopCards
      });
      break;

    case 'turn':
      // Deal and store turn card
      const turnCard = deal(room.gameState.deck, 1)[0];
      room.gameState.communityCards.push(turnCard);
      io.to(roomId).emit('community-update', {
        phase: 'turn',
        cards: [turnCard],
        allCards: room.gameState.communityCards
      });
      break;

    case 'river':
      // Deal and store river card
      const riverCard = deal(room.gameState.deck, 1)[0];
      room.gameState.communityCards.push(riverCard);
      io.to(roomId).emit('community-update', {
        phase: 'river',
        cards: [riverCard],
        allCards: room.gameState.communityCards
      });
      break;
  }

  // Set first active player as current player
  const firstActivePlayer = room.players.find(p => !p.folded && p.chips > 0);
  if (firstActivePlayer) {
    room.gameState.activePlayer = firstActivePlayer.id;
  }

  // Log phase change
  console.log(`Room ${roomId} advancing to ${room.gameState.phase}`);
  console.log('Community cards:', room.gameState.communityCards);

  // Broadcast updated game state
  io.to(roomId).emit('game-state', room.gameState);
  io.to(roomId).emit('next-turn', room.gameState.activePlayer);
};

// Helper function to convert our card format to evaluator format
const convertCardForEvaluator = (card) => {
  const rankMap = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
    '9': '9', '10': 'T', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
  };
  const suitMap = {
    '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'
  };
  return rankMap[card.rank] + suitMap[card.suit];
};

// Helper function to evaluate a player's hand
const evaluatePlayerHand = (holeCards, communityCards) => {
  const allCards = [...holeCards, ...communityCards];
  const evaluatorCards = allCards.map(convertCardForEvaluator);
  return PokerHandEvaluator.evaluateHand(evaluatorCards);
};

// Helper function to determine winner
const determineWinner = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  // Get active players (not folded)
  const activePlayers = room.players.filter(p => !p.folded);
  
  if (activePlayers.length === 1) {
    // Only one player left, they win
    const winner = activePlayers[0];
    winner.chips += room.gameState.pot;
    io.to(roomId).emit('game-over', {
      winners: [{
        name: winner.name,
        chips: winner.chips,
        hand: winner.hand,
        handRank: null // No need to evaluate hand
      }],
      pot: room.gameState.pot
    });
  } else {
    // Evaluate hands for all active players
    const playerHands = activePlayers.map(player => ({
      player,
      hand: player.hand,
      evaluation: evaluatePlayerHand(player.hand, room.gameState.communityCards)
    }));

    // Sort by hand rank (highest first)
    playerHands.sort((a, b) => b.evaluation.rank - a.evaluation.rank);

    // Find winners (could be multiple in case of tie)
    const winningRank = playerHands[0].evaluation.rank;
    const winners = playerHands.filter(ph => ph.evaluation.rank === winningRank);

    // Split pot among winners
    const potPerWinner = Math.floor(room.gameState.pot / winners.length);
    winners.forEach(winner => {
      winner.player.chips += potPerWinner;
    });

    // Prepare hand rankings for all players
    const handRanks = playerHands.map(ph => ({
      name: ph.player.name,
      hand: ph.hand,
      rank: ph.evaluation.rank,
      description: ph.evaluation.description
    }));

    // Broadcast results
    io.to(roomId).emit('game-over', {
      winners: winners.map(w => ({
        name: w.player.name,
        chips: w.player.chips,
        hand: w.hand,
        handRank: w.evaluation
      })),
      handRanks,
      pot: room.gameState.pot
    });
  }

  // Reset game state for next hand
  room.gameState.phase = 'waiting';
  room.gameState.pot = 0;
  room.gameState.currentBet = 0;
  room.gameState.communityCards = [];
  room.players.forEach(player => {
    player.hand = null;
    player.folded = false;
    player.currentBet = 0;
  });

  // Broadcast updated game state
  io.to(roomId).emit('game-state', room.gameState);
  broadcastPlayerList(roomId);
};

// Helper function to start a new hand
const startNewHand = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  // Create and shuffle a new deck
  const deck = createDeck();
  shuffle(deck);

  // Deal cards to each player
  room.players.forEach(player => {
    player.hand = deal(deck, 2);
    player.folded = false;
    player.currentBet = 0;
  });

  // Deal community cards
  room.gameState.communityCards = [];
  room.gameState.deck = deck;

  // Set up blinds
  const smallBlind = room.players[0];
  const bigBlind = room.players[1];
  
  smallBlind.chips -= room.gameState.smallBlind;
  smallBlind.currentBet = room.gameState.smallBlind;
  bigBlind.chips -= room.gameState.bigBlind;
  bigBlind.currentBet = room.gameState.bigBlind;

  // Update game state
  room.gameState.phase = 'pre-flop';
  room.gameState.pot = room.gameState.smallBlind + room.gameState.bigBlind;
  room.gameState.currentBet = room.gameState.bigBlind;
  room.gameState.minRaise = room.gameState.bigBlind;
  room.gameState.activePlayer = bigBlind.id;

  // Broadcast updated game state to all players
  io.to(roomId).emit('game-state', room.gameState);
  
  // Send each player their private hand
  room.players.forEach(player => {
    io.to(player.id).emit('private-hand', player.hand);
  });

  // Broadcast updated player list
  broadcastPlayerList(roomId);
};

// Helper function to get full room state
const getFullRoomState = (room) => {
  return {
    players: room.players,
    gameState: {
      phase: room.gameState.phase,
      communityCards: room.gameState.communityCards,
      pot: room.gameState.pot,
      currentBet: room.gameState.currentBet,
      minRaise: room.gameState.minRaise,
      activePlayer: room.gameState.activePlayer,
      dealer: room.gameState.dealer,
      smallBlind: room.gameState.smallBlind,
      bigBlind: room.gameState.bigBlind,
      deck: room.gameState.deck
    }
  };
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New connection attempt:', socket.id);

  // Handle room joining
  socket.on('join-room', ({ roomId, playerName }) => {
    if (!roomId || !playerName) {
      console.log('Missing roomId or playerName:', { roomId, playerName });
      socket.emit('error', 'Missing room ID or player name');
      return;
    }

    console.log(`Player ${playerName} attempting to join room ${roomId}`);

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: [],
        gameState: {
          phase: 'waiting',
          communityCards: [],
          pot: 0,
          currentBet: 0,
          minRaise: 0,
          activePlayer: null,
          dealer: null,
          smallBlind: 5,
          bigBlind: 10,
          deck: null
        }
      });
      console.log(`Created new room: ${roomId}`);
    }

    const room = rooms.get(roomId);

    // Check if player name is already taken in this room
    if (room.players.some(p => p.name === playerName)) {
      console.log(`Player name ${playerName} already taken in room ${roomId}`);
      socket.emit('error', 'Player name already taken');
      return;
    }

    // Add player to room
    const player = {
      id: socket.id,
      name: playerName,
      isHost: room.players.length === 0,
      isReady: true,
      chips: 1000,
      currentBet: 0,
      hand: null,
      folded: false
    };

    room.players.push(player);
    socket.join(roomId);

    // Store roomId in socket for later use
    socket.roomId = roomId;
    socket.playerId = socket.id;

    // Update room state
    console.log(`Player ${playerName} joined room ${roomId}`);
    console.log(`Room ${roomId} now has ${room.players.length} players`);
    
    // Broadcast updated player list to the room
    broadcastPlayerList(roomId);

    // Send initial game state to the new player
    socket.emit('game-state', room.gameState);
  });

  // Handle room rejoining
  socket.on('rejoin-room', ({ roomId, playerId }) => {
    console.log(`Player ${playerId} attempting to rejoin room ${roomId}`);

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    // Find existing player
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (!existingPlayer) {
      socket.emit('error', 'Player not found in room');
      return;
    }

    // Update player's socket ID
    existingPlayer.id = socket.id;
    socket.join(roomId);

    // Store roomId in socket for later use
    socket.roomId = roomId;
    socket.playerId = playerId;

    console.log(`Player ${existingPlayer.name} rejoined room ${roomId}`);

    // Send full room state to reconnected player
    socket.emit('full-state', getFullRoomState(room));

    // If player has a hand, send it privately
    if (existingPlayer.hand) {
      socket.emit('deal-holes', existingPlayer.hand);
    }
  });

  // Handle player actions
  socket.on('player-action', ({ action, amount }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const result = processPlayerAction(room, player, action, amount);
    if (!result.success) {
      socket.emit('error', result.error);
      return;
    }

    // Broadcast bet update
    io.to(roomId).emit('bet-update', {
      pot: room.gameState.pot,
      currentBet: room.gameState.currentBet,
      minRaise: room.gameState.minRaise,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        currentBet: p.currentBet,
        folded: p.folded
      }))
    });

    // Check if betting round is complete
    if (isBettingRoundComplete(room)) {
      advanceGamePhase(roomId);
    } else {
      // Move to next active player
      const nextPlayer = getNextActivePlayer(room, socket.id);
      room.gameState.activePlayer = nextPlayer.id;
      io.to(roomId).emit('next-turn', nextPlayer.id);
    }

    // Broadcast updated game state
    io.to(roomId).emit('game-state', room.gameState);
    broadcastPlayerList(roomId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Find and remove the player
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      console.log(`Removing player ${player.name} from room ${roomId}`);
      
      room.players.splice(playerIndex, 1);
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        console.log(`Room ${roomId} is empty, deleting it`);
        rooms.delete(roomId);
      } else {
        // If the host left, assign a new host
        if (player.isHost) {
          room.players[0].isHost = true;
          console.log(`New host assigned: ${room.players[0].name}`);
        }
        
        // If game is in progress, end it
        if (room.gameState.phase !== 'waiting') {
          determineWinner(roomId);
        }
        
        // Broadcast updated player list
        broadcastPlayerList(roomId);
      }
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', 'An error occurred');
  });
});

// Add a simple GET / route
app.get('/', (req, res) => {
  res.send('Losing Money Poker WebSocket Server is running!');
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 