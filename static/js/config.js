
import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Model URLs for different learning categories
export const MODEL_URLS = {
    // Alphabet Learning (A-Z)
    alphabet: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/letters.task",

    // Numbers Learning (0-9)
    numbers: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/numbers.task",
    
    // Colors Learning
    colors: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/colors.task",
    
    // Basic Words Learning
    basicWords: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/basicwords.task",
    
    // Family & People Learning
    family: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task",
    
    // Food & Drinks Learning
    food: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage//Asl14000imagePART3.task"
};

// Legacy export for backward compatibility - now uses automatic detection
export function getGestureModelUrl() {
    try {
        const modelUrl = getCurrentModuleModelUrl();
        console.log(`Loading model for current page: ${modelUrl}`);
        return modelUrl;
    } catch (error) {
        // Fallback to alphabet model if detection fails
        console.warn('Could not detect current module for model URL, using alphabet model', error);
        return MODEL_URLS.alphabet;
    }
}

// For immediate backwards compatibility, also export as constant with alphabet default
// This will be used if pages haven't been updated to use the function yet
export const GESTURE_MODEL_URL = MODEL_URLS.alphabet;

// Helper function to get model URL by category
export function getModelUrl(category) {
    return MODEL_URLS[category] || MODEL_URLS.alphabet;
}

// Function to detect current learning module from URL and return appropriate model URL
export function getCurrentModuleModelUrl() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop().toLowerCase();
    
    // Map HTML filenames to model categories
    const pageToCategory = {
        'alphabet.html': 'alphabet',
        'numbers.html': 'numbers',
        'colors.html': 'colors',
        'basic-words.html': 'basicWords',
        'basicwords.html': 'basicWords', // Alternative naming
        'family.html': 'family',
        'food.html': 'food',
        'webcam.html': 'alphabet', // Default to alphabet for general webcam
        'image_to_sign.html': 'alphabet', // Default to alphabet for general image recognition
        'text_to_sign.html': 'alphabet' // Default to alphabet for text to sign
    };
    
    // Check for exact filename match first
    let category = pageToCategory[filename];
    
    // If no exact match, check for partial matches in the filename
    if (!category) {
        for (const [pagePattern, cat] of Object.entries(pageToCategory)) {
            if (filename.includes(pagePattern.replace('.html', ''))) {
                category = cat;
                break;
            }
        }
    }
    
    // If still no match, check for category keywords in the path or filename
    if (!category) {
        const pathLower = currentPath.toLowerCase();
        if (pathLower.includes('alphabet')) category = 'alphabet';
        else if (pathLower.includes('number')) category = 'numbers';
        else if (pathLower.includes('color')) category = 'colors';
        else if (pathLower.includes('basic') || pathLower.includes('word')) category = 'basicWords';
        else if (pathLower.includes('family')) category = 'family';
        else if (pathLower.includes('food')) category = 'food';
    }
    
    return getModelUrl(category);
}

// Enhanced function to get model URL with automatic detection
export function getModelUrlForCurrentPage(fallbackCategory = 'alphabet') {
    try {
        const modelUrl = getCurrentModuleModelUrl();
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop().toLowerCase();
        console.log(`Auto-detected model for ${filename}: ${modelUrl}`);
        return modelUrl;
    } catch (error) {
        console.warn('Could not detect current module, using fallback:', fallbackCategory);
        return getModelUrl(fallbackCategory);
    }
}

// Debug function to help troubleshoot model detection
export function debugModelDetection() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop().toLowerCase();
    const detectedUrl = getCurrentModuleModelUrl();
    
    console.log('=== Model Detection Debug ===');
    console.log('Current path:', currentPath);
    console.log('Filename:', filename);
    console.log('Detected model URL:', detectedUrl);
    console.log('Available models:', Object.keys(MODEL_URLS));
    console.log('============================');
    
    return {
        path: currentPath,
        filename: filename,
        modelUrl: detectedUrl,
        availableModels: Object.keys(MODEL_URLS)
    };
}

// Word mapping for basic words model output normalization
export const WORD_MAPPINGS = {
    // Model output -> Expected HTML data-letter values
    // Basic Words
    'thank you': 'THANK',
    'thankyou': 'THANK',
    'thank_you': 'THANK',
    'good bye': 'GOODBYE',
    'goodbye': 'GOODBYE', 
    'good_bye': 'GOODBYE',
    'hello': 'HELLO',
    'please': 'PLEASE',
    'yes': 'YES',
    'no': 'NO',
    
    // Basic Colors
    'red': 'RED',
    'blue': 'BLUE',
    'yellow': 'YELLOW',
    'green': 'GREEN',
    'orange': 'ORANGE',
    'purple': 'PURPLE',
    'black': 'BLACK',
    'white': 'WHITE'
};

// Function to normalize model output to match HTML data-letter attributes
export function normalizeModelOutput(modelOutput) {
    if (!modelOutput) return modelOutput;
    
    // Add debugging
    console.log(`[DEBUG] Raw model output: "${modelOutput}"`);
    
    // Convert to lowercase for lookup
    const lowerOutput = modelOutput.toLowerCase().trim();
    
    // Check if we have a direct mapping
    if (WORD_MAPPINGS[lowerOutput]) {
        const normalized = WORD_MAPPINGS[lowerOutput];
        console.log(`[DEBUG] Mapped "${modelOutput}" -> "${normalized}"`);
        return normalized;
    }
    
    // If no mapping found, return uppercase version
    const fallback = modelOutput.toUpperCase().trim();
    console.log(`[DEBUG] No mapping found for "${modelOutput}", using fallback: "${fallback}"`);
    return fallback;
}

// Function to reverse lookup - get display name from data-letter value
export function getDisplayNameFromDataLetter(dataLetter) {
    if (!dataLetter) return dataLetter;
    
    // Find the reverse mapping
    for (const [modelOutput, expectedValue] of Object.entries(WORD_MAPPINGS)) {
        if (expectedValue === dataLetter.toUpperCase()) {
            // Return a properly formatted display name
            return modelOutput.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
    }
    
    // If no mapping found, return the original value
    return dataLetter;
}

// Model display names for user interface
export const MODEL_DISPLAY_NAMES = {
    alphabet: 'Letters (A-Z)',
    numbers: 'Numbers (0-9)', 
    colors: 'Colors',
    basicWords: 'Basic Words',
    family: 'Family & People',
    food: 'Food & Drinks'
};

// Function to get all available models for selection
export function getAvailableModels() {
    return Object.keys(MODEL_URLS).map(key => ({
        value: key,
        name: MODEL_DISPLAY_NAMES[key] || key,
        url: MODEL_URLS[key]
    }));
}

// Function to create model selector UI element
export function createModelSelector(containerId, onModelChange, defaultModel = 'alphabet') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
    }

    const models = getAvailableModels();
    
    const selectorHtml = `
        <div class="model-selector-wrapper">
            <label for="model-selector" class="model-selector-label">
                <span class="model-icon">🧠</span>
                Choose Recognition Model:
            </label>
            <select id="model-selector" class="model-selector">
                ${models.map(model => 
                    `<option value="${model.value}" ${model.value === defaultModel ? 'selected' : ''}>
                        ${model.name}
                    </option>`
                ).join('')}
            </select>
            <div class="model-info">
                <span class="info-icon">ℹ️</span>
                <span id="model-description">Select a model to recognize different types of signs</span>
            </div>
        </div>
    `;
    
    container.innerHTML = selectorHtml;
    
    const selector = document.getElementById('model-selector');
    const description = document.getElementById('model-description');
    
    // Model descriptions
    const descriptions = {
        alphabet: 'Recognizes individual letters A-Z for fingerspelling',
        numbers: 'Recognizes number signs 0-9',
        colors: 'Recognizes basic color signs (red, blue, yellow, etc.)',
        basicWords: 'Recognizes common words (hello, thank you, please, etc.)',
        family: 'Recognizes family member signs (mother, father, sister, etc.)',
        food: 'Recognizes food and drink signs (eat, drink, apple, etc.)'
    };
    
    // Update description on change
    function updateDescription() {
        const selectedModel = selector.value;
        description.textContent = descriptions[selectedModel] || 'Select a model to recognize different types of signs';
    }
    
    selector.addEventListener('change', (e) => {
        updateDescription();
        if (onModelChange) {
            onModelChange(e.target.value);
        }
    });
    
    // Set initial description
    updateDescription();
    
    return selector;
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
    'family',
    'food'
];

// Model loading progress utility
export class ModelLoadingProgress {
    constructor(containerId = 'model-loading-container') {
        this.containerId = containerId;
        this.progressContainer = null;
        this.progressBar = null;
        this.progressText = null;
        this.isVisible = false;
    }

    // Create and show progress bar
    show(message = 'Loading AI model...') {
        if (this.isVisible) return;
        
        // Create progress container
        this.progressContainer = document.createElement('div');
        this.progressContainer.id = this.containerId;
        this.progressContainer.className = 'model-loading-overlay';
        
        // Create progress content
        const progressContent = document.createElement('div');
        progressContent.className = 'model-loading-content';
        
        // Create message text
        this.progressText = document.createElement('div');
        this.progressText.className = 'model-loading-text';
        this.progressText.textContent = message;
        
        // Create progress bar container
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'model-progress-bar-container';
        
        // Create actual progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'model-progress-bar';
        this.progressBar.style.width = '0%';
        
        // Create percentage text
        this.percentageText = document.createElement('div');
        this.percentageText.className = 'model-progress-percentage';
        this.percentageText.textContent = '0%';
        
        // Assemble the structure
        progressBarContainer.appendChild(this.progressBar);
        progressContent.appendChild(this.progressText);
        progressContent.appendChild(progressBarContainer);
        progressContent.appendChild(this.percentageText);
        this.progressContainer.appendChild(progressContent);
        
        // Add to page
        document.body.appendChild(this.progressContainer);
        this.isVisible = true;
        
        // Add CSS if not already present
        this.addStyles();
    }

    // Update progress (0-100)
    updateProgress(percentage, message = null) {
        if (!this.isVisible || !this.progressBar) return;
        
        const clampedPercentage = Math.min(100, Math.max(0, percentage));
        this.progressBar.style.width = `${clampedPercentage}%`;
        this.percentageText.textContent = `${Math.round(clampedPercentage)}%`;
        
        if (message) {
            this.progressText.textContent = message;
        }
    }

    // Hide and remove progress bar
    hide() {
        if (!this.isVisible) return;
        
        if (this.progressContainer && this.progressContainer.parentNode) {
            this.progressContainer.parentNode.removeChild(this.progressContainer);
        }
        
        this.progressContainer = null;
        this.progressBar = null;
        this.progressText = null;
        this.percentageText = null;
        this.isVisible = false;
    }

    // Add CSS styles for the progress bar
    addStyles() {
        // Check if styles already exist
        if (document.getElementById('model-loading-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'model-loading-styles';
        style.textContent = `
            .model-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Inter', sans-serif;
            }
            
            .model-loading-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                text-align: center;
                min-width: 300px;
                max-width: 400px;
            }
            
            .model-loading-text {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin-bottom: 20px;
            }
            
            .model-progress-bar-container {
                width: 100%;
                height: 8px;
                background-color: #e0e0e0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 12px;
            }
            
            .model-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #2196F3);
                border-radius: 4px;
                transition: width 0.3s ease;
                animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0.8; }
            }
            
            .model-progress-percentage {
                font-size: 14px;
                font-weight: 500;
                color: #666;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Export a singleton instance for easy use
export const modelLoadingProgress = new ModelLoadingProgress();

// Enhanced model loader with progress tracking
export async function loadModelWithProgress(modelUrl, options = {}) {
    const progress = options.progressInstance || modelLoadingProgress;
    const showProgress = options.showProgress !== false; // Default to true
    
    try {
        if (showProgress) {
            progress.show('Initializing AI model...');
            progress.updateProgress(10, 'Loading MediaPipe framework...');
        }
        
        // Load FilesetResolver
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        
        if (showProgress) {
            progress.updateProgress(30, 'Framework loaded, downloading model...');
        }
        
        // Create a promise that tracks the model loading
        const gestureRecognizer = await new Promise(async (resolve, reject) => {
            try {
                // Simulate progress updates during model loading
                let currentProgress = 30;
                const progressInterval = setInterval(() => {
                    if (currentProgress < 90) {
                        currentProgress += Math.random() * 15;
                        if (showProgress) {
                            progress.updateProgress(currentProgress, 'Downloading and processing model...');
                        }
                    }
                }, 200);
                
                // Create the actual gesture recognizer
                const recognizer = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: modelUrl,
                        delegate: options.delegate || "GPU"
                    },
                    runningMode: options.runningMode || "IMAGE"
                });
                
                clearInterval(progressInterval);
                
                if (showProgress) {
                    progress.updateProgress(100, 'Model loaded successfully!');
                }
                
                // Small delay to show completion
                setTimeout(() => {
                    if (showProgress) {
                        progress.hide();
                    }
                    resolve(recognizer);
                }, 500);
                
            } catch (error) {
                if (showProgress) {
                    progress.hide();
                }
                reject(error);
            }
        });
        
        return gestureRecognizer;
        
    } catch (error) {
        if (showProgress) {
            progress.hide();
        }
        console.error('Error loading model:', error);
        throw error;
    }
}
