// Card ranks and suits
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

/**
 * Creates a new deck of 52 cards
 * @returns {Array<{rank: string, suit: string}>} Array of card objects
 */
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Shuffles a deck in-place using Fisher-Yates algorithm
 * @param {Array<{rank: string, suit: string}>} deck The deck to shuffle
 */
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

/**
 * Deals a specified number of cards from the deck
 * @param {Array<{rank: string, suit: string}>} deck The deck to deal from
 * @param {number} count Number of cards to deal
 * @returns {Array<{rank: string, suit: string}>} Array of dealt cards
 */
function deal(deck, count) {
  if (count > deck.length) {
    throw new Error(`Cannot deal ${count} cards from deck with ${deck.length} cards`);
  }
  return deck.splice(0, count);
}

module.exports = {
  createDeck,
  shuffle,
  deal
}; 