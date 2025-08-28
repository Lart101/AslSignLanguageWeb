
import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Model URLs for different learning categories
export const MODEL_URLS = {
    // Alphabet Learning (A-Z)
    alphabet: "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/letters.task",
    
    // Numbers Learning (0-9)
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
