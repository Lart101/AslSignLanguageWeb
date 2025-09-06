// Challenge Game JavaScript
import { createModelSelector, getModelUrl, loadModelWithProgress, MODEL_URLS, normalizeModelOutput, globalSoundManager } from './config.js';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Import shared challenge data and video utilities
import { CHALLENGE_WORDS, getVideoPath } from './asl-data.js';

// Game State
let currentMode = null;
let gameState = {
    score: 0,
    currentQuestion: 0,
    totalQuestions: 10,
    lives: 3,
    revealPowerUsed: false,
    correctAnswers: 0,
    wrongAnswers: 0,
    isGameActive: false,
    endlessQuestionQueue: [], // For endless mode shuffling
    questionsPerModel: 3,
    currentModelIndex: 0,
    questionAnswered: false // Prevent multiple scoring per question
};

// MediaPipe and webcam variables
let gestureRecognizer = undefined;
let runningMode = "IMAGE";
let webcamRunning = false;
let lastVideoTime = -1;
let results = undefined;
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const enableWebcamButton = document.getElementById("webcamButton");

// Game elements
const modeSelection = document.getElementById('mode-selection');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const flashSignContent = document.getElementById('flash-sign-content');
const signMatchContent = document.getElementById('sign-match-content');
const revealContent = document.getElementById('reveal-content');

// Timer variables
let gameTimer = null;
let currentRoundTimer = null;
let timeLeft = 10;

// Video preloading system
let preloadedVideos = new Map(); // Cache for preloaded videos
let videoPreloadQueue = []; // Queue of videos to preload
let isPreloading = false;

// Initialize the challenge page
document.addEventListener('DOMContentLoaded', function() {
    // Test video loading first
    testVideoLoading();
    
    initializePage();
    setupEventListeners();
    createGestureRecognizer();
    
    // Only start comprehensive background preloading for additional categories
    setTimeout(() => {
        startComprehensivePreloading();
    }, 3000); // Delay for initial page setup
});

async function startImmediatePreloading() {
    console.log('⚡ Starting immediate silent video preloading...');
    
    // Get current model category
    const modelCategory = getCurrentModelCategory();
    const words = CHALLENGE_WORDS[modelCategory] || CHALLENGE_WORDS.alphabet;
    
    console.log(`📦 Silently preloading ${words.length} videos from ${modelCategory} category...`);
    
    // Start preloading all videos for the current category immediately
    // This runs completely in background without any UI indicators
    try {
        await preloadAllVideosInBackground(modelCategory, words);
        console.log('✅ Silent immediate preloading completed successfully');
    } catch (error) {
        console.warn('⚠️ Silent immediate preloading had some issues:', error);
    }
}

async function preloadAllVideosInBackground(category, words) {
    return new Promise(async (resolve) => {
        try {
            console.log(`🎬 Background preloading ${words.length} videos from ${category}...`);
            
            let loadedCount = 0;
            const totalVideos = words.length;
            
            // Preload videos in parallel but limit concurrent requests to avoid overwhelming GitHub Pages
            const batchSize = 3; // Load 3 videos at a time
            for (let i = 0; i < words.length; i += batchSize) {
                const batch = words.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (word) => {
                    try {
                        const videoPath = getVideoPath(word, category);
                        
                        // Skip if already cached
                        if (preloadedVideos.has(videoPath)) {
                            loadedCount++;
                            return;
                        }
                        
                        const video = document.createElement('video');
                        video.preload = 'auto';
                        video.muted = true;
                        video.playsInline = true;
                        video.crossOrigin = 'anonymous';
                        
                        await new Promise((resolveVideo) => {
                            const timeout = setTimeout(() => {
                                console.log(`⏰ Background timeout: ${word}`);
                                resolveVideo(); // Don't block on timeouts
                            }, 15000); // 15 second timeout for background loading
                            
                            video.addEventListener('loadeddata', () => {
                                clearTimeout(timeout);
                                preloadedVideos.set(videoPath, video);
                                loadedCount++;
                                console.log(`🟢 Background loaded: ${word} (${loadedCount}/${totalVideos})`);
                                resolveVideo();
                            }, { once: true });
                            
                            video.addEventListener('error', () => {
                                clearTimeout(timeout);
                                loadedCount++;
                                console.log(`🔴 Background failed: ${word} (${loadedCount}/${totalVideos})`);
                                resolveVideo();
                            }, { once: true });
                            
                            video.src = videoPath;
                            video.load();
                        });
                        
                    } catch (error) {
                        loadedCount++;
                        console.warn(`Background preload error for ${word}:`, error);
                    }
                });
                
                // Wait for current batch to complete before starting next batch
                await Promise.all(batchPromises);
                
                // Small delay between batches to avoid overwhelming the server
                if (i + batchSize < words.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            console.log(`✅ Background preloading completed: ${loadedCount}/${totalVideos} videos loaded`);
            resolve();
            
        } catch (error) {
            console.error('Background preloading error:', error);
            resolve(); // Don't fail, just continue
        }
    });
}

async function startComprehensivePreloading() {
    console.log('Starting comprehensive silent preloading for better UX...');
    
    // Preload current model videos immediately
    preloadChallengeVideos();
    
    // Preload other model categories in background
    setTimeout(() => {
        preloadOtherModelCategories();
    }, 2000); // Delay to avoid overwhelming initial load
}

function preloadOtherModelCategories() {
    const currentCategory = getCurrentModelCategory();
    const allCategories = Object.keys(CHALLENGE_WORDS);
    
    // Preload other categories in background
    allCategories.forEach((category, index) => {
        if (category !== currentCategory) {
            setTimeout(() => {
                console.log(`Background preloading: ${category}`);
                const words = CHALLENGE_WORDS[category] || [];
                
                // Add to queue with lower priority
                words.forEach(word => {
                    const videoPath = getVideoPath(word, category);
                    if (!preloadedVideos.has(videoPath)) {
                        videoPreloadQueue.push({
                            word: word,
                            category: category,
                            url: videoPath,
                            priority: false
                        });
                    }
                });
                
                // Continue preloading if not already running
                if (!isPreloading && videoPreloadQueue.length > 0) {
                    preloadNextVideo();
                }
            }, index * 3000); // Stagger loading to avoid overwhelming browser
        }
    });
}

function initializePage() {
    // Initialize model selector
    createModelSelector('model-selection-container', (selectedModel) => {
        console.log('Model changed to:', selectedModel);
        // Reinitialize gesture recognizer with new model
        createGestureRecognizer(selectedModel);
        
        // Smart preloading: prioritize new model but keep existing cache
        prioritizeModelPreloading(selectedModel);
    }, 'alphabet');
    
    // Ensure all video elements are muted
    muteAllVideos();
}

function prioritizeModelPreloading(selectedModel) {
    const newCategory = selectedModel;
    const words = CHALLENGE_WORDS[newCategory] || [];
    
    console.log(`Prioritizing preloading for: ${newCategory}`);
    
    // Add new model videos to front of queue
    const priorityVideos = words.map(word => ({
        word: word,
        category: newCategory,
        url: getVideoPath(word, newCategory),
        priority: true
    }));
    
    // Filter out already cached videos
    const uncachedVideos = priorityVideos.filter(item => !preloadedVideos.has(item.url));
    
    // Add to front of queue
    videoPreloadQueue.unshift(...uncachedVideos);
    
    // Start preloading if not already running
    if (!isPreloading && videoPreloadQueue.length > 0) {
        preloadNextVideo();
    }
    
    console.log(`Added ${uncachedVideos.length} videos to priority queue`);
}

function muteAllVideos() {
    // Mute all existing video elements
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
        video.muted = true;
        video.defaultMuted = true; // Ensure videos stay muted even after src changes
    });
    console.log(`Muted ${allVideos.length} video elements`);
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Mode selection buttons
    const startModeBtns = document.querySelectorAll('.start-mode-btn');
    console.log('🎯 Found', startModeBtns.length, 'start mode buttons:', startModeBtns);
    
    startModeBtns.forEach(btn => {
        console.log('🎯 Found start mode button:', btn);
        btn.addEventListener('click', (e) => {
            console.log('🖱️ Start mode button clicked!', e.target);
            const modeCard = e.target.closest('.mode-card');
            console.log('🃏 Mode card:', modeCard);
            const mode = modeCard.dataset.mode;
            console.log('🎮 Mode detected:', mode);
            startGame(mode);
        });
    });

    // Game control buttons (with null checks)
    const revealPowerBtn = document.getElementById('reveal-power-btn');
    const quitGameBtn = document.getElementById('quit-game-btn');
    const continueAfterRevealBtn = document.getElementById('continue-after-reveal');
    const skipQuestionBtn = document.getElementById('skip-question-btn');
    
    if (revealPowerBtn) revealPowerBtn.addEventListener('click', useRevealPower);
    if (quitGameBtn) quitGameBtn.addEventListener('click', quitGame);
    if (continueAfterRevealBtn) continueAfterRevealBtn.addEventListener('click', continueAfterReveal);
    if (skipQuestionBtn) skipQuestionBtn.addEventListener('click', skipQuestion);

    // Results screen buttons (with null checks)
    const playAgainBtn = document.getElementById('play-again-btn');
    const backToModesBtn = document.getElementById('back-to-modes-btn');
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            if (currentMode) {
                startGame(currentMode);
            }
        });
    }
    if (backToModesBtn) backToModesBtn.addEventListener('click', backToModeSelection);

    // Video selection buttons (for sign match mode)
    document.querySelectorAll('.select-video-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectVideo(e.target.dataset.video);
        });
    });

    // Webcam button (with null check)
    if (enableWebcamButton) {
        enableWebcamButton.addEventListener('click', enableCam);
    }
}

// Create gesture recognizer
async function createGestureRecognizer(modelCategory = 'alphabet') {
    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        const modelUrl = getModelUrl(modelCategory);
        
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: modelUrl,
                delegate: "GPU"
            },
            runningMode: runningMode
        });
        
        console.log(`Gesture recognizer created for ${modelCategory}`);
    } catch (error) {
        console.error('Error creating gesture recognizer:', error);
        alert('Failed to load AI model. Please refresh the page and try again.');
    }
}

// Video Preloading System - Silent Background Loading
async function preloadChallengeVideos() {
    console.log('Starting silent video preloading...');
    
    // Get current model category
    const modelCategory = getCurrentModelCategory();
    
    // Get all words for the current category
    const words = CHALLENGE_WORDS[modelCategory] || [];
    
    // Prioritize first 10 videos for faster initial loading on GitHub Pages
    const priorityWords = words.slice(0, 10);
    const remainingWords = words.slice(10);
    
    // Create preload queue with priority loading
    videoPreloadQueue = [
        ...priorityWords.map(word => ({
            word: word,
            category: modelCategory,
            url: getVideoPath(word, modelCategory),
            priority: true
        })),
        ...remainingWords.map(word => ({
            word: word,
            category: modelCategory,
            url: getVideoPath(word, modelCategory),
            priority: false
        }))
    ];
    
    console.log(`Queued ${videoPreloadQueue.length} videos for silent preloading`);
    
    // Start silent preloading process
    preloadNextVideo();
}

function preloadNextVideo() {
    if (isPreloading || videoPreloadQueue.length === 0) return;
    
    isPreloading = true;
    const videoData = videoPreloadQueue.shift();
    
    // Create video element for preloading
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.crossOrigin = 'anonymous'; // Better compatibility for GitHub Pages
    
    // Set up loading timeout for GitHub Pages
    const loadTimeout = setTimeout(() => {
        console.warn(`Preload timeout for: ${videoData.word} (${videoData.category})`);
        isPreloading = false;
        setTimeout(() => preloadNextVideo(), 100);
    }, 10000); // 10 second timeout
    
    video.addEventListener('canplaythrough', () => {
        clearTimeout(loadTimeout);
        // Video is fully loaded and ready to play
        preloadedVideos.set(videoData.url, video);
        console.log(`✅ Fully preloaded: ${videoData.word} (${videoData.category})`);
        
        isPreloading = false;
        
        // Continue with next video after a small delay
        setTimeout(() => {
            preloadNextVideo();
        }, 100);
    });
    
    video.addEventListener('loadeddata', () => {
        // Fallback: Even if not fully loaded, cache it for faster loading
        if (!preloadedVideos.has(videoData.url)) {
            preloadedVideos.set(videoData.url, video);
            console.log(`📊 Partially preloaded: ${videoData.word} (${videoData.category})`);
        }
    });
    
    video.addEventListener('error', (e) => {
        clearTimeout(loadTimeout);
        console.warn(`Failed to preload video: ${videoData.word} (${videoData.category})`);
        isPreloading = false;
        
        // Continue with next video even if this one failed
        setTimeout(() => {
            preloadNextVideo();
        }, 100);
    });
    
    // Start loading
    video.src = videoData.url;
    video.load();
}

function getPreloadedVideo(videoPath) {
    // Fall back to local cache
    const cached = preloadedVideos.get(videoPath);
    if (cached) {
        // Return a cloned video element to avoid conflicts
        const clonedVideo = cached.cloneNode(true);
        clonedVideo.currentTime = 0;
        console.log(`🏠 Using locally preloaded video: ${videoPath}`);
        return clonedVideo;
    }
    
    // If video isn't preloaded, create a new video element
    console.log(`⚠️ Video not found in any cache, creating new element: ${videoPath}`);
    const video = document.createElement('video');
    video.src = videoPath;
    video.muted = true;
    video.defaultMuted = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    
    return video;
}

function clearVideoCache() {
    // Clear existing cache and queue
    preloadedVideos.clear();
    videoPreloadQueue = [];
    isPreloading = false;
    console.log('Video cache cleared');
}

function preloadGameModeVideos(mode) {
    // Preload videos specific to the current game mode and model
    const modelCategory = getCurrentModelCategory();
    const words = CHALLENGE_WORDS[modelCategory] || [];
    
    // Prioritize loading videos for current game session
    words.forEach(word => {
        const videoPath = getVideoPath(word, modelCategory);
        if (!preloadedVideos.has(videoPath)) {
            // Add to high priority queue (beginning of array)
            videoPreloadQueue.unshift({
                word: word,
                category: modelCategory,
                url: videoPath
            });
        }
    });
    
    // Start preloading if not already running
    if (!isPreloading) {
        preloadNextVideo();
    }
}

// Start a game mode
function startGame(mode) {
    console.log('🎮 Starting game with mode:', mode);
    currentMode = mode;
    resetGameState();
    
    // Start game immediately
    startGameAfterLoading(mode);
}

function startGameAfterLoading(mode) {
    // Set up mode-specific settings
    switch (mode) {
        case 'flash-sign':
            gameState.totalQuestions = 10;
            break;
        case 'sign-match':
            gameState.totalQuestions = 10;
            break;
        case 'endless':
            gameState.totalQuestions = Infinity;
            gameState.lives = 3;
            break;
    }
    
    // Show game screen
    modeSelection.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resultsScreen.classList.add('hidden');
    
    // Update UI
    updateGameUI();
    
    // Start first question
    nextQuestion();
}

// Loading screen functions
function showLoadingScreen() {
    console.log('🔍 Showing loading screen - finding elements...');
    const loadingScreen = document.getElementById('loading-screen');
    const modeSelection = document.getElementById('mode-selection');
    
    console.log('Loading screen element:', loadingScreen);
    console.log('Mode selection element:', modeSelection);
    console.log('Loading screen classes before:', loadingScreen ? loadingScreen.className : 'NOT FOUND');
    
    if (loadingScreen) {
        console.log('📺 Removing hidden class from loading screen');
        loadingScreen.classList.remove('hidden');
        console.log('Loading screen classes after:', loadingScreen.className);
        // Force display for debugging
        loadingScreen.style.display = 'flex';
        loadingScreen.style.zIndex = '9999';
        console.log('Forced loading screen display');
    } else {
        console.error('❌ Loading screen element not found!');
    }
    
    if (modeSelection) {
        console.log('🔽 Hiding mode selection');
        modeSelection.classList.add('hidden');
    }
    
    updateProgress(0, 'Initializing...', 'Preparing...', '0 / 0 videos');
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
}

function updateProgress(percentage, status, currentVideo, videoCount) {
    console.log(`📊 updateProgress called: ${percentage}% - ${status} - ${currentVideo} - ${videoCount}`);
    
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStatus = document.getElementById('progress-status');
    const currentVideoSpan = document.getElementById('current-video');
    const videoCountSpan = document.getElementById('video-count');
    
    console.log('Progress elements found:', {
        progressFill: !!progressFill,
        progressPercentage: !!progressPercentage,
        progressStatus: !!progressStatus,
        currentVideoSpan: !!currentVideoSpan,
        videoCountSpan: !!videoCountSpan
    });
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
    if (progressStatus) progressStatus.textContent = status;
    if (currentVideoSpan) currentVideoSpan.textContent = currentVideo;
    if (videoCountSpan) videoCountSpan.textContent = videoCount;
}

function resetGameState() {
    gameState = {
        score: 0,
        currentQuestion: 0,
        totalQuestions: 10,
        lives: 3,
        revealPowerUsed: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        isGameActive: true,
        endlessQuestionQueue: [],
        questionsPerModel: 3,
        currentModelIndex: 0,
        questionAnswered: false,
        videoSelectionMade: false, // New flag for sign-match mode
        lastVideoSelectionCorrect: false
    };
    
    // Initialize endless mode question queue
    if (currentMode === 'endless') {
        initializeEndlessQueue();
    }
}

function initializeEndlessQueue() {
    gameState.endlessQuestionQueue = [];
    gameState.currentModelIndex = 0;
    
    // Get all available model categories
    const availableModels = Object.keys(CHALLENGE_WORDS);
    
    // Shuffle the models array
    const shuffledModels = [...availableModels].sort(() => Math.random() - 0.5);
    
    // Add 3 questions from each model
    shuffledModels.forEach(modelCategory => {
        const words = CHALLENGE_WORDS[modelCategory];
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        
        // Take first 3 words from shuffled array
        for (let i = 0; i < Math.min(3, shuffledWords.length); i++) {
            gameState.endlessQuestionQueue.push({
                word: shuffledWords[i],
                category: modelCategory
            });
        }
    });
    
    // Shuffle the entire question queue
    gameState.endlessQuestionQueue.sort(() => Math.random() - 0.5);
}

function updateGameUI() {
    const currentScoreEl = document.getElementById('current-score');
    const questionNumberEl = document.getElementById('question-number');
    const totalQuestionsEl = document.getElementById('total-questions');
    
    if (currentScoreEl) currentScoreEl.textContent = gameState.score;
    if (questionNumberEl) questionNumberEl.textContent = gameState.currentQuestion;
    if (totalQuestionsEl) totalQuestionsEl.textContent = currentMode === 'endless' ? '∞' : gameState.totalQuestions;
    
    // Show/hide lives for endless mode
    const livesDisplay = document.getElementById('lives-display');
    if (currentMode === 'endless') {
        livesDisplay.classList.remove('hidden');
        updateLivesDisplay();
    } else {
        livesDisplay.classList.add('hidden');
    }
    
    // Show/hide skip button (not available in endless mode)
    const skipBtn = document.getElementById('skip-question-btn');
    if (currentMode === 'endless') {
        skipBtn.classList.add('hidden');
    } else {
        skipBtn.classList.remove('hidden');
    }
    
    // Update reveal power button - 1 use per game, no cost
    const revealBtn = document.getElementById('reveal-power-btn');
    if (gameState.revealPowerUsed) {
        revealBtn.disabled = true;
        revealBtn.querySelector('.power-count').textContent = '(0)';
    } else {
        revealBtn.disabled = false;
        revealBtn.querySelector('.power-count').textContent = '(1)';
    }
}

function skipQuestion() {
    if (currentMode === 'endless') return; // No skip in endless mode
    if (gameState.questionAnswered) return; // Prevent multiple skips
    gameState.questionAnswered = true;
    
    // Clear timer if it exists (for flash-sign mode)
    if (currentRoundTimer) {
        clearInterval(currentRoundTimer);
    }
    
    // Count as wrong answer
    gameState.wrongAnswers++;
    
    // Show skip feedback
    gestureOutput.style.background = '#fff3cd';
    gestureOutput.style.color = '#856404';
    gestureOutput.textContent = 'Question skipped ⏭️';
    
    setTimeout(() => {
        nextQuestion();
    }, 1000);
}

function updateLivesDisplay() {
    const livesCountEl = document.getElementById('lives-count');
    if (livesCountEl) {
        livesCountEl.textContent = gameState.lives;
    }
    
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index < gameState.lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function nextQuestion() {
    if (!gameState.isGameActive) return;
    
    // Clear canvas and reset camera state for new question
    clearCanvasAndResetCamera();
    
    // Reset question answered flag for new question
    gameState.questionAnswered = false;
    
    gameState.currentQuestion++;
    
    // Check if game should end
    if (currentMode !== 'endless' && gameState.currentQuestion > gameState.totalQuestions) {
        endGame();
        return;
    }
    
    if (currentMode === 'endless' && gameState.lives <= 0) {
        endGame();
        return;
    }
    
    updateGameUI();
    
    // Hide all content sections
    flashSignContent.classList.add('hidden');
    signMatchContent.classList.add('hidden');
    revealContent.classList.add('hidden');
    
    // Show/hide timer display based on mode
    const timerDisplay = document.querySelector('.timer-display');
    if (currentMode === 'flash-sign' || currentMode === 'endless') {
        timerDisplay.classList.remove('hidden');
    } else {
        timerDisplay.classList.add('hidden');
    }
    
    // Show appropriate content based on mode
    if (currentMode === 'flash-sign' || currentMode === 'endless') {
        showFlashSignQuestion();
    } else if (currentMode === 'sign-match') {
        showSignMatchQuestion();
    }
}

function showFlashSignQuestion() {
    flashSignContent.classList.remove('hidden');
    
    let randomWord;
    
    if (currentMode === 'endless') {
        // Use shuffled queue for endless mode
        if (gameState.endlessQuestionQueue.length === 0) {
            // Refill queue when empty
            initializeEndlessQueue();
        }
        
        const currentQuestion = gameState.endlessQuestionQueue.shift();
        randomWord = currentQuestion.word;
        
        // Switch gesture recognizer to current question's model category
        createGestureRecognizer(currentQuestion.category);
    } else {
        // Get random word from selected model category for other modes
        const modelCategory = getCurrentModelCategory();
        const words = CHALLENGE_WORDS[modelCategory] || CHALLENGE_WORDS.alphabet;
        randomWord = words[Math.floor(Math.random() * words.length)];
    }
    
    const challengeWordEl = document.getElementById('challenge-word');
    if (challengeWordEl) {
        challengeWordEl.textContent = randomWord;
    }
    
    // Start timer for flash sign and endless modes
    startRoundTimer();
}

function showSignMatchQuestion() {
    signMatchContent.classList.remove('hidden');
    
    // Clear and reset canvas from previous question
    clearCanvasAndResetCamera();
    
    // Reset video selection state for new question
    gameState.videoSelectionMade = false;
    gameState.lastVideoSelectionCorrect = false;
    
    // Get random word and set up video options
    const modelCategory = getCurrentModelCategory();
    let words = CHALLENGE_WORDS[modelCategory];
    
    // Fallback if category doesn't exist
    if (!words) {
        console.warn('⚠️ No words found for category:', modelCategory, 'falling back to alphabet');
        words = CHALLENGE_WORDS.alphabet;
    }
    
    // Add extra protection against undefined or empty arrays
    if (!words || words.length === 0) {
        console.error('🚨 No words found even after fallback! This is a critical error');
        console.log('🚨 Using hardcoded alphabet fallback');
        words = ['A', 'B', 'C', 'D', 'E'];
    }
    
    const correctWord = words[Math.floor(Math.random() * words.length)];
    let wrongWord;
    
    // Make sure wrong word is different from correct word
    // Add extra protection for single-word arrays
    if (words.length <= 1) {
        console.warn('⚠️ Only one word available, using fallback for wrong word');
        // Use a word from alphabet as fallback wrong word
        const fallbackWords = CHALLENGE_WORDS.alphabet || ['A', 'B', 'C'];
        wrongWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    } else {
        do {
            wrongWord = words[Math.floor(Math.random() * words.length)];
        } while (wrongWord === correctWord);
    }
    
    document.getElementById('match-word').textContent = correctWord;
    
    // Set up videos
    const videoA = document.getElementById('video-a');
    const videoB = document.getElementById('video-b');
    
    // Ensure videos are muted
    videoA.muted = true;
    videoB.muted = true;
    
    // Randomly assign correct/wrong videos
    const isACorrect = Math.random() < 0.5;
    const correctVideoPath = getVideoPath(correctWord, modelCategory);
    const wrongVideoPath = getVideoPath(wrongWord, modelCategory);
    
    // Use preloaded videos if available
    const correctPreloaded = preloadedVideos.has(correctVideoPath);
    const wrongPreloaded = preloadedVideos.has(wrongVideoPath);
    
    if (correctPreloaded && wrongPreloaded) {
        // Both videos are preloaded - use them directly
        const videoASrc = isACorrect ? correctVideoPath : wrongVideoPath;
        const videoBSrc = isACorrect ? wrongVideoPath : correctVideoPath;
        
        videoA.src = videoASrc;
        videoB.src = videoBSrc;
        
        // Don't call load() since videos are preloaded
        console.log(`Using fully preloaded videos for sign-match: ${correctWord} vs ${wrongWord}`);
        
        // Videos should be ready immediately, try to play
        setTimeout(() => {
            videoA.play().catch(e => console.log('Video A autoplay failed:', e));
            videoB.play().catch(e => console.log('Video B autoplay failed:', e));
        }, 100);
    } else {
        // Some or all videos aren't preloaded - load normally
        videoA.src = isACorrect ? correctVideoPath : wrongVideoPath;
        videoB.src = isACorrect ? wrongVideoPath : correctVideoPath;
        
        videoA.preload = 'auto';
        videoB.preload = 'auto';
        videoA.load();
        videoB.load();
        
        console.log(`Loading videos normally for sign-match: ${correctWord} vs ${wrongWord} (Correct preloaded: ${correctPreloaded}, Wrong preloaded: ${wrongPreloaded})`);
        
        // Auto-play videos when they load
        videoA.addEventListener('loadeddata', () => {
            videoA.play().catch(e => console.log('Video A autoplay failed:', e));
        }, { once: true });
        
        videoB.addEventListener('loadeddata', () => {
            videoB.play().catch(e => console.log('Video B autoplay failed:', e));
        }, { once: true });
    }
    
    // Store correct answer
    videoA.dataset.isCorrect = isACorrect;
    videoB.dataset.isCorrect = !isACorrect;

    // Reset video selection UI
    document.querySelectorAll('.video-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('.select-video-btn').forEach(btn => {
        btn.disabled = false;
        btn.textContent = btn.textContent.replace('Selected', 'Choose'); // Reset button text
    });
    document.getElementById('video-selection-result').classList.add('hidden');
    
    // Initially DISABLE webcam section until correct video is selected
    const webcamSection = document.querySelector('.webcam-section');
    const webcamButton = document.getElementById('webcamButton');
    if (webcamSection) {
        webcamSection.style.display = 'block';
        webcamSection.style.opacity = '0.5'; // Visual indication it's disabled
    }
    if (webcamButton) {
        webcamButton.disabled = true;
        webcamButton.style.opacity = '0.5';
    }
    
    // Reset question answered state
    gameState.questionAnswered = false;
    
    // Set initial instruction message
    gestureOutput.style.background = '#f8f9fa';
    gestureOutput.style.color = '#333';
    gestureOutput.textContent = `First select the correct video, then demonstrate the sign for "${correctWord}"`;
    
    // No timer for sign match mode - user takes their time to choose and perform
}

// Helper function to create video with error handling
function createVideoWithErrorHandling(src, word = 'unknown') {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    video.addEventListener('loadstart', () => {
        console.log(`✅ Video loading started: ${word} - ${src}`);
    });
    
    video.addEventListener('canplay', () => {
        console.log(`✅ Video ready to play: ${word} - ${src}`);
    });
    
    video.addEventListener('error', (e) => {
        console.error(`❌ Video loading failed: ${word} - ${src}`, e);
        console.error('Error details:', {
            error: e.error,
            networkState: video.networkState,
            readyState: video.readyState
        });
    });
    
    return video;
}

// Test function to verify video paths and loading
function testVideoLoading() {
    console.log('🧪 Testing video loading...');
    console.log('Current hostname:', window.location.hostname);
    console.log('Is GitHub Pages?:', window.location.hostname.includes('github.io'));
    
    // Test alphabet A
    const testPathA = getVideoPath('A', 'alphabet');
    console.log('Testing path for A:', testPathA);
    
    // Test numbers 1
    const testPath1 = getVideoPath('1', 'numbers');
    console.log('Testing path for 1:', testPath1);
    
    // Create test video elements to verify loading
    const testVideoA = createVideoWithErrorHandling(testPathA, 'A');
    const testVideo1 = createVideoWithErrorHandling(testPath1, '1');
    
    return { testVideoA, testVideo1 };
}

function getCurrentModelCategory() {
    const selector = document.getElementById('model-selector');
    const category = selector ? selector.value : 'alphabet';
    return category;
}

function selectVideo(videoOption) {
    const selectedVideo = document.querySelector(`[data-option="${videoOption}"]`);
    const isCorrect = selectedVideo.querySelector('video').dataset.isCorrect === 'true';
    
    // Mark selection
    document.querySelectorAll('.video-option').forEach(option => {
        option.classList.remove('selected');
    });
    selectedVideo.classList.add('selected');
    
    // Disable ALL buttons after any selection is made
    document.querySelectorAll('.select-video-btn').forEach(btn => {
        btn.disabled = true;
        btn.textContent = btn.textContent.replace('Choose', 'Selected');
    });
    
    // Clear and reset canvas to remove any previous landmarks
    clearCanvasAndResetCamera();
    
    if (isCorrect) {
        // Correct selection - show message and ENABLE demonstration
        const resultDiv = document.getElementById('video-selection-result');
        const message = document.getElementById('selection-message');
        
        message.textContent = 'Correct! Now perform the sign:';
        message.style.color = '#28a745';
        
        const word = document.getElementById('match-word').textContent;
        document.getElementById('perform-word').textContent = word;
        resultDiv.classList.remove('hidden');
        
        // Store video selection result for scoring
        gameState.lastVideoSelectionCorrect = isCorrect;
        gameState.videoSelectionMade = true;
        
        // Reset gesture output for sign demonstration
        gestureOutput.style.background = '#f8f9fa';
        gestureOutput.style.color = '#333';
        gestureOutput.textContent = `Now demonstrate the sign for "${word}"`;
        
        // ENABLE the webcam section for demonstration
        const webcamSection = document.querySelector('.webcam-section');
        if (webcamSection) {
            webcamSection.style.display = 'block';
            webcamSection.style.opacity = '1';
        }
        
        // Enable the webcam button if it's disabled
        const webcamButton = document.getElementById('webcamButton');
        if (webcamButton) {
            webcamButton.disabled = false;
            webcamButton.style.opacity = '1';
        }
        
    } else {
        // Wrong selection - immediately mark as wrong and move to next question
        gameState.wrongAnswers++;
        gameState.questionAnswered = true;
        
        // Show brief wrong feedback
        const resultDiv = document.getElementById('video-selection-result');
        const message = document.getElementById('selection-message');
        
        message.textContent = 'Wrong video selected!';
        message.style.color = '#dc3545';
        resultDiv.classList.remove('hidden');
        
        // DISABLE webcam controls since we're skipping sign performance
        const webcamSection = document.querySelector('.webcam-section');
        if (webcamSection) {
            webcamSection.style.display = 'none';
        }
        
        // Play incorrect sound
        globalSoundManager.playSoundByName('incorrect');
        
        // Show next question button or auto-advance after short delay
        setTimeout(() => {
            clearCanvasAndResetCamera(); // Clear canvas before next question
            nextQuestion();
        }, 1500); // 1.5 second delay to show the wrong message
    }
}

function startRoundTimer() {
    // Only start timer for flash-sign and endless modes
    if (currentMode !== 'flash-sign' && currentMode !== 'endless') {
        return;
    }
    
    timeLeft = 10; // Set to 10 seconds for timed modes
    updateTimerDisplay();
    
    currentRoundTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(currentRoundTimer);
            timeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerText = document.getElementById('timer-text');
    const timerCircle = document.querySelector('.timer-circle');
    
    timerText.textContent = timeLeft;
    
    if (timeLeft <= 5) {
        timerCircle.classList.add('warning');
    } else {
        timerCircle.classList.remove('warning');
    }
}

function timeUp() {
    if (gameState.questionAnswered) return; // Prevent multiple scoring
    gameState.questionAnswered = true;
    
    // Handle time up based on mode
    if (currentMode === 'endless') {
        // In endless mode, lose a life when time runs out
        gameState.lives--;
        gameState.wrongAnswers++;
        updateLivesDisplay();
        
        // Show feedback
        gestureOutput.style.background = '#f8d7da';
        gestureOutput.style.color = '#721c24';
        gestureOutput.textContent = 'Time\'s up! Lost a life ⏰💔';
        
        // Play incorrect sound
        globalSoundManager.playSoundByName('incorrect');
        
        setTimeout(() => {
            nextQuestion();
        }, 1500);
    } else {
        // In other modes, just move to next question (no score change)
        gameState.wrongAnswers++;
        
        // Show feedback
        gestureOutput.style.background = '#fff3cd';
        gestureOutput.style.color = '#856404';
        gestureOutput.textContent = 'Time\'s up! Moving to next question ⏰';
        
        setTimeout(() => {
            nextQuestion();
        }, 1500);
    }
}

function useRevealPower() {
    if (gameState.revealPowerUsed) return; // Can only use once per game
    
    gameState.revealPowerUsed = true; // Mark as used
    clearInterval(currentRoundTimer);
    
    // Show reveal modal
    const revealModal = document.getElementById('reveal-content');
    revealModal.classList.remove('hidden');
    
    // Get current word and show video
    let currentWord;
    if (currentMode === 'sign-match') {
        currentWord = document.getElementById('match-word').textContent;
    } else {
        currentWord = document.getElementById('challenge-word').textContent;
    }
    
    const modelCategory = getCurrentModelCategory();
    const videoPath = getVideoPath(currentWord, modelCategory);
    const revealVideo = document.getElementById('reveal-video');
    
    // Ensure reveal video is muted
    revealVideo.muted = true;
    
    // Use preloaded video if available
    const preloadedVideo = getPreloadedVideo(videoPath);
    if (preloadedVideos.has(videoPath)) {
        // Copy the preloaded video properties to the reveal video
        revealVideo.src = preloadedVideo.src;
        revealVideo.currentTime = 0;
        
        // If the preloaded video is already loaded, we can play immediately
        if (preloadedVideo.readyState >= 3) { // HAVE_FUTURE_DATA
            console.log(`Using fully preloaded video for: ${currentWord}`);
            // Video is ready to play
        } else {
            // Wait for the video to load
            revealVideo.load();
        }
    } else {
        // Fallback to normal loading
        revealVideo.src = videoPath;
        revealVideo.preload = 'auto';
        revealVideo.load();
        console.log(`Loading video normally for: ${currentWord}`);
    }
    
    // Ensure the video plays from the beginning when modal opens
    revealVideo.addEventListener('loadeddata', () => {
        revealVideo.currentTime = 0;
    }, { once: true });
    
    // Update UI to reflect reveal power is used
    updateGameUI();
    
    // Close modal when clicking overlay
    const overlay = revealModal.querySelector('.reveal-overlay');
    overlay.addEventListener('click', () => {
        revealModal.classList.add('hidden');
        continueAfterReveal();
    });
}

function continueAfterReveal() {
    const revealModal = document.getElementById('reveal-content');
    revealModal.classList.add('hidden');
    
    // Reset gesture output and continue the game
    gestureOutput.style.background = '#f8f9fa';
    gestureOutput.style.color = '#333';
    gestureOutput.textContent = 'Perform the sign you just saw!';
    
    // Note: Reveal doesn't affect score, just continue with current question
    // The user can still perform the sign for points
}

function handleCorrectAnswer() {
    if (gameState.questionAnswered) return; // Prevent multiple scoring
    gameState.questionAnswered = true;
    
    gameState.score++;
    gameState.correctAnswers++;
    
    // Play correct sound
    globalSoundManager.playSoundByName('correct');
    
    if (currentMode === 'sign-match') {
        // Use the sign-match specific feedback
        const expectedSign = document.getElementById('match-word').textContent;
        showSignMatchFeedback(expectedSign, expectedSign, true);
    } else {
        // Show regular feedback for other modes
        gestureOutput.style.background = '#d4edda';
        gestureOutput.style.color = '#155724';
        gestureOutput.textContent = 'Correct! +1 point ✓';
    }
    
    clearInterval(currentRoundTimer);
    
    setTimeout(() => {
        nextQuestion();
    }, 1500);
}

function handleWrongAnswer() {
    if (gameState.questionAnswered) return; // Prevent multiple scoring
    gameState.questionAnswered = true;
    
    gameState.wrongAnswers++;
    
    // In endless mode, lose a life
    if (currentMode === 'endless') {
        gameState.lives--;
        updateLivesDisplay();
        
        // Show feedback
        gestureOutput.style.background = '#f8d7da';
        gestureOutput.style.color = '#721c24';
        gestureOutput.textContent = 'Wrong sign! Lost a life ✗💔';
    } else {
        // In other modes, no score penalty - just move on
        gestureOutput.style.background = '#f8d7da';
        gestureOutput.style.color = '#721c24';
        gestureOutput.textContent = 'Wrong or no sign detected ✗';
    }
    
    // Play incorrect sound
    globalSoundManager.playSoundByName('incorrect');
    
    clearInterval(currentRoundTimer);
    
    setTimeout(() => {
        nextQuestion();
    }, 1500);
}

// Function to show feedback in sign-match mode without ending the question
function showSignMatchFeedback(detectedSign, expectedSign, isCorrect, customMessage = null) {
    const gestureOutput = document.getElementById('gesture_output');
    
    if (customMessage) {
        // Show custom message (like "select video first")
        gestureOutput.style.background = '#fff3cd';
        gestureOutput.style.color = '#856404';
        gestureOutput.textContent = customMessage;
    } else if (isCorrect) {
        gestureOutput.style.background = '#d4edda';
        gestureOutput.style.color = '#155724';
        gestureOutput.textContent = `Perfect! You signed "${expectedSign}" correctly! ✓`;
    } else {
        gestureOutput.style.background = '#fff3cd';
        gestureOutput.style.color = '#856404';
        
        if (detectedSign) {
            gestureOutput.textContent = `Keep trying! You signed "${detectedSign}" but we need "${expectedSign}"`;
        } else {
            gestureOutput.textContent = `Keep trying! Show the sign for "${expectedSign}"`;
        }
    }
    
    // Auto-clear the feedback after a few seconds to avoid clutter
    if (!isCorrect && !customMessage) {
        setTimeout(() => {
            gestureOutput.style.background = '';
            gestureOutput.style.color = '';
            gestureOutput.textContent = `Show the sign for "${expectedSign}"`;
        }, 3000);
    } else if (customMessage) {
        // Clear custom messages after 4 seconds
        setTimeout(() => {
            gestureOutput.style.background = '';
            gestureOutput.style.color = '';
            gestureOutput.textContent = `First select the correct video, then demonstrate the sign for "${expectedSign}"`;
        }, 4000);
    }
}

// Webcam and gesture recognition functions
async function enableCam() {
    if (!gestureRecognizer) {
        alert("Please wait for the model to load");
        return;
    }

    if (webcamRunning) {
        webcamRunning = false;
        enableWebcamButton.textContent = "Enable Camera";
        video.srcObject?.getTracks().forEach(track => track.stop());
    } else {
        webcamRunning = true;
        enableWebcamButton.textContent = "Disable Camera";
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        } catch (error) {
            console.error('Error accessing webcam:', error);
            alert('Failed to access webcam. Please check permissions.');
        }
    }
}

async function predictWebcam() {
    if (!gameState.isGameActive || !webcamRunning) return;
    
    canvasElement.style.width = video.videoWidth + "px";
    canvasElement.style.height = video.videoHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, startTimeMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results.landmarks) {
        const drawingUtils = new DrawingUtils(canvasCtx);
        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 2
            });
            drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 1
            });
        }
    }
    
    canvasCtx.restore();

    // Check for gesture recognition
    if (results.gestures && results.gestures.length > 0) {
        const gesture = results.gestures[0][0];
        const confidence = gesture.score;
        
        if (confidence > 0.7) {
            const detectedSign = normalizeModelOutput(gesture.categoryName);
            checkAnswer(detectedSign);
        }
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Helper function to clear canvas and reset camera landmarks
function clearCanvasAndResetCamera() {
    // Clear the canvas completely
    if (canvasElement && canvasCtx) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        console.log('🧹 Canvas cleared and reset');
    }
    
    // Reset any stored results to prevent residual landmarks
    results = undefined;
    lastVideoTime = -1;
    
    // Clear gesture output display
    if (gestureOutput) {
        gestureOutput.style.background = '#f8f9fa';
        gestureOutput.style.color = '#333';
        gestureOutput.textContent = '';
    }
}

function checkAnswer(detectedSign) {
    // Skip processing if question already answered (e.g., wrong video selection in sign-match)
    if (gameState.questionAnswered) {
        return;
    }
    
    let expectedSign;
    
    if (currentMode === 'sign-match') {
        expectedSign = document.getElementById('match-word').textContent;
        
        // In sign-match mode, user MUST select a video first before demonstrating
        if (!gameState.videoSelectionMade) {
            // Show message that they need to select a video first
            showSignMatchFeedback(null, expectedSign, false, 'Please select a video first before demonstrating the sign!');
            return;
        }
        
        // In sign-match mode, if they selected the correct video, they must keep trying 
        // until they perform the correct sign - don't move on for wrong detection
        if (detectedSign === expectedSign) {
            handleCorrectAnswer();
        } else {
            // Show feedback but don't end the question - let them keep trying
            showSignMatchFeedback(detectedSign, expectedSign, false);
        }
    } else {
        // Other modes: normal logic
        expectedSign = document.getElementById('challenge-word').textContent;
        
        if (detectedSign === expectedSign) {
            handleCorrectAnswer();
        } else {
            handleWrongAnswer();
        }
    }
}

function endGame() {
    gameState.isGameActive = false;
    clearInterval(currentRoundTimer);
    
    // Show results screen
    gameScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Update results (with null checks)
    const finalScoreEl = document.getElementById('final-score');
    const finalTotalEl = document.getElementById('final-total');
    const correctCountEl = document.getElementById('correct-count');
    const wrongCountEl = document.getElementById('wrong-count');
    const revealUsedEl = document.getElementById('reveal-used');
    
    if (finalScoreEl) finalScoreEl.textContent = gameState.score;
    if (finalTotalEl) finalTotalEl.textContent = currentMode === 'endless' ? gameState.currentQuestion - 1 : gameState.totalQuestions;
    if (correctCountEl) correctCountEl.textContent = gameState.correctAnswers;
    if (wrongCountEl) wrongCountEl.textContent = gameState.wrongAnswers;
    if (revealUsedEl) revealUsedEl.textContent = gameState.revealPowerUsed ? 'Yes' : 'No';
    
    // Performance message
    const percentage = (gameState.score / (currentMode === 'endless' ? gameState.currentQuestion - 1 : gameState.totalQuestions)) * 100;
    const performanceText = document.getElementById('performance-text');
    const resultsTitleEl = document.getElementById('results-title');
    
    if (percentage >= 90 && resultsTitleEl) {
        if (performanceText) performanceText.textContent = '🎉 Outstanding performance! You\'re an ASL master!';
        resultsTitleEl.textContent = 'Excellent Work!';
    } else if (percentage >= 70 && resultsTitleEl) {
        if (performanceText) performanceText.textContent = '👏 Great job! Keep practicing to improve further!';
        resultsTitleEl.textContent = 'Well Done!';
    } else if (percentage >= 50 && resultsTitleEl) {
        if (performanceText) performanceText.textContent = '👍 Good effort! Practice more to boost your skills!';
        resultsTitleEl.textContent = 'Keep Going!';
    } else if (resultsTitleEl) {
        if (performanceText) performanceText.textContent = '💪 Don\'t give up! Every expert was once a beginner!';
        resultsTitleEl.textContent = 'Keep Practicing!';
    }
}

function quitGame() {
    if (confirm('Are you sure you want to quit the current game?')) {
        gameState.isGameActive = false;
        clearInterval(currentRoundTimer);
        backToModeSelection();
    }
}

function backToModeSelection() {
    gameScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    
    // Clear canvas and reset camera state
    clearCanvasAndResetCamera();
    
    // Stop webcam
    if (webcamRunning) {
        webcamRunning = false;
        enableWebcamButton.textContent = "Enable Camera";
        video.srcObject?.getTracks().forEach(track => track.stop());
    }
}

// Navigation menu toggle - with null safety
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle && nav) {
    menuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        nav.classList.toggle('active');
    });
} else {
    console.log('Menu toggle or nav element not found - skipping menu functionality');
}
