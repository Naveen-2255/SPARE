// src/utils/imageHelper.js

export const getPartImage = (partName) => {
  const name = partName.toLowerCase();

  if (name.includes('headlight')) return 'https://i.imgur.com/DigCDtX.jpeg';
  if (name.includes('oil')) return 'https://i.imgur.com/Kgd6yE5.jpeg';
  if (name.includes('brake')) return 'https://i.imgur.com/pP38Qj7.jpeg';
  if (name.includes('chain')) return 'https://i.imgur.com/2K1qLd7.jpeg';
  if (name.includes('mirror')) return 'https://i.imgur.com/7gXN9M3.jpeg';
  if (name.includes('battery')) return 'https://i.imgur.com/0zJj5X2.jpeg';
  if (name.includes('tyre') || name.includes('tire')) return 'https://i.imgur.com/fM2tQjB.jpeg';
  
  // Default image if no match
  return 'https://i.imgur.com/Op5d5bM.png'; 
};