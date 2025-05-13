const { createDeck, shuffle, deal } = require('./deck');

// Test createDeck
console.log('Testing createDeck...');
const deck = createDeck();
console.log('Deck created with', deck.length, 'cards');
console.log('First few cards:', deck.slice(0, 5));
console.log('Last few cards:', deck.slice(-5));
console.log();

// Test shuffle
console.log('Testing shuffle...');
const originalDeck = [...deck];
shuffle(deck);
console.log('First few cards after shuffle:', deck.slice(0, 5));
console.log('Last few cards after shuffle:', deck.slice(-5));
console.log('Deck is different after shuffle:', 
  JSON.stringify(deck) !== JSON.stringify(originalDeck));
console.log();

// Test deal
console.log('Testing deal...');
const hand = deal(deck, 5);
console.log('Dealt 5 cards:', hand);
console.log('Remaining deck size:', deck.length);
console.log('First few cards in remaining deck:', deck.slice(0, 5));
console.log();

// Test error handling
console.log('Testing error handling...');
try {
  deal(deck, 100); // Should throw error
} catch (error) {
  console.log('Error caught:', error.message);
} 