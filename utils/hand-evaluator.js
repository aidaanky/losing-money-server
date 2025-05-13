// Helper function to get card value
const getCardValue = (rank) => {
  const values = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[rank];
};

// Helper function to check for flush
const isFlush = (cards) => {
  const suits = cards.map(card => card.suit);
  return suits.every(suit => suit === suits[0]);
};

// Helper function to check for straight
const isStraight = (cards) => {
  const values = cards.map(card => getCardValue(card.rank)).sort((a, b) => a - b);
  
  // Check for Ace-low straight (A-2-3-4-5)
  if (values.join(',') === '2,3,4,5,14') return true;
  
  // Check for regular straight
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i-1] + 1) return false;
  }
  return true;
};

// Helper function to get card frequencies
const getCardFrequencies = (cards) => {
  const frequencies = {};
  cards.forEach(card => {
    frequencies[card.rank] = (frequencies[card.rank] || 0) + 1;
  });
  return frequencies;
};

// Main hand evaluator function
function evaluateHand(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  const frequencies = getCardFrequencies(allCards);
  const values = allCards.map(card => getCardValue(card.rank)).sort((a, b) => b - a);
  
  // Royal Flush
  if (isFlush(allCards) && isStraight(allCards) && values[0] === 14) {
    return { rank: 10, name: 'Royal Flush', cards: allCards.slice(0, 5) };
  }
  
  // Straight Flush
  if (isFlush(allCards) && isStraight(allCards)) {
    return { rank: 9, name: 'Straight Flush', cards: allCards.slice(0, 5) };
  }
  
  // Four of a Kind
  const fourOfAKind = Object.entries(frequencies).find(([_, count]) => count === 4);
  if (fourOfAKind) {
    const kicker = values.find(v => v !== getCardValue(fourOfAKind[0]));
    return { 
      rank: 8, 
      name: 'Four of a Kind', 
      cards: allCards.filter(card => card.rank === fourOfAKind[0]).concat(
        allCards.find(card => getCardValue(card.rank) === kicker)
      )
    };
  }
  
  // Full House
  const threeOfAKind = Object.entries(frequencies).find(([_, count]) => count === 3);
  const pair = Object.entries(frequencies).find(([_, count]) => count === 2);
  if (threeOfAKind && pair) {
    return { 
      rank: 7, 
      name: 'Full House', 
      cards: allCards.filter(card => card.rank === threeOfAKind[0]).concat(
        allCards.filter(card => card.rank === pair[0]).slice(0, 2)
      )
    };
  }
  
  // Flush
  if (isFlush(allCards)) {
    return { 
      rank: 6, 
      name: 'Flush', 
      cards: allCards.slice(0, 5)
    };
  }
  
  // Straight
  if (isStraight(allCards)) {
    return { 
      rank: 5, 
      name: 'Straight', 
      cards: allCards.slice(0, 5)
    };
  }
  
  // Three of a Kind
  if (threeOfAKind) {
    const kickers = values.filter(v => v !== getCardValue(threeOfAKind[0])).slice(0, 2);
    return { 
      rank: 4, 
      name: 'Three of a Kind', 
      cards: allCards.filter(card => card.rank === threeOfAKind[0]).concat(
        allCards.filter(card => kickers.includes(getCardValue(card.rank))).slice(0, 2)
      )
    };
  }
  
  // Two Pair
  const pairs = Object.entries(frequencies).filter(([_, count]) => count === 2);
  if (pairs.length >= 2) {
    const kicker = values.find(v => !pairs.slice(0, 2).some(([rank]) => getCardValue(rank) === v));
    return { 
      rank: 3, 
      name: 'Two Pair', 
      cards: allCards.filter(card => pairs.slice(0, 2).some(([rank]) => card.rank === rank)).concat(
        allCards.find(card => getCardValue(card.rank) === kicker)
      )
    };
  }
  
  // One Pair
  if (pairs.length === 1) {
    const kickers = values.filter(v => v !== getCardValue(pairs[0][0])).slice(0, 3);
    return { 
      rank: 2, 
      name: 'One Pair', 
      cards: allCards.filter(card => card.rank === pairs[0][0]).concat(
        allCards.filter(card => kickers.includes(getCardValue(card.rank))).slice(0, 3)
      )
    };
  }
  
  // High Card
  return { 
    rank: 1, 
    name: 'High Card', 
    cards: allCards.slice(0, 5)
  };
}

module.exports = {
  evaluateHand
}; 