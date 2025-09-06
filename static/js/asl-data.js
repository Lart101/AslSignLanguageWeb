// Shared ASL Challenge Data Configuration
// This file contains all the challenge words and categories used across the application

// Challenge words for all categories
export const CHALLENGE_WORDS = {
    alphabet: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    colors: ['Black', 'Blue', 'Green', 'Orange', 'Purple', 'Red', 'White', 'Yellow'],
    basicWords: ['Hello', 'Goodbye', 'Please', 'Thankyou', 'Yes', 'No'],
    family: ['Mother', 'Father', 'Baby', 'Boy', 'Girl'],
    food: ['Apple', 'Drink', 'Eat', 'Milk', 'Pizza', 'Water']
};

// Folder mapping for video paths
export const FOLDER_MAP = {
    'basicWords': 'basic_words',  // Model category -> folder name
    'alphabet': 'alphabet',
    'numbers': 'numbers', 
    'colors': 'colors',
    'family': 'family',
    'food': 'food'
};

// Unified video path generator
export function getVideoPath(word, category) {
    // GitHub Pages compatibility: use relative paths from root
    const basePath = window.location.hostname.includes('github.io') 
        ? '/AslSignLanguageWeb/' // GitHub Pages path
        : './'; // Local development path
    
    const folderName = FOLDER_MAP[category] || category;
    
    // Handle different naming conventions for different categories
    let videoName;
    if (category === 'alphabet' || category === 'numbers') {
        // Alphabet and numbers use uppercase (A.mp4, B.mp4, 0.mp4, 1.mp4, etc.)
        videoName = word.toUpperCase();
    } else {
        // Other categories use proper capitalization (Hello.mp4, Blue.mp4, etc.)
        videoName = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    const fullPath = `${basePath}static/sign_language_videos/${folderName}/${videoName}.mp4`;
    
    return fullPath;
}

// Also provide backward compatibility for non-module scripts
window.ASL_DATA = {
    CHALLENGE_WORDS,
    FOLDER_MAP,
    getVideoPath
};

console.log('📋 ASL shared data configuration loaded');
