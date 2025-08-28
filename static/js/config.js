
// Model URLs for different learning categories
export const MODEL_URLS = {
    // Alphabet Learning (A-Z)
    alphabet: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/letters.task",
    
    // Numbers Learning (0-10)
    numbers: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task",
    
    // Colors Learning
    colors: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task",
    
    // Basic Words Learning
    basicWords: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task",
    
    // Common Phrases Learning
    phrases: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task",
    
    // Family & People Learning
    family: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task",
    
    // Food & Drinks Learning
    food: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task"
};

// Legacy export for backward compatibility
export const GESTURE_MODEL_URL = MODEL_URLS.alphabet;

// Helper function to get model URL by category
export function getModelUrl(category) {
    return MODEL_URLS[category] || MODEL_URLS.alphabet;
}

// Model configuration settings
export const MODEL_CONFIG = {
    // Confidence threshold for gesture recognition
    confidenceThreshold: 0.7,
    
    // Maximum number of predictions to return
    maxPredictions: 3,
    
    // Model loading timeout (milliseconds)
    loadTimeout: 30000,
    
    // Recognition settings
    recognition: {
        // Minimum confidence for valid detection
        minConfidence: 0.6,
        
        // Debounce time between predictions (milliseconds)
        debounceTime: 500,
        
        // Maximum processing time per frame (milliseconds)
        maxProcessingTime: 100
    }
};

// Available learning categories
export const LEARNING_CATEGORIES = [
    'alphabet',
    'numbers', 
    'colors',
    'basicWords',
    'phrases',
    'family',
    'food'
];
