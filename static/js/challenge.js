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
    skippedQuestions: 0,
    isGameActive: false,
    endlessQuestionQueue: [], // For endless mode shuffling
    questionsPerModel: 3,
    currentModelIndex: 0,
    questionAnswered: false, // Prevent multiple scoring per question
    videoSelectionMade: false, // New flag for sign-match mode
    lastVideoSelectionCorrect: false,
    signMatchAttempts: 0, // Counter for sign demonstration attempts in sign-match mode
    requireDemonstration: false, // Flag to require hand demonstration after correct video selection
    demonstrationWord: null, // Word that user must demonstrate
    lastDetectedSign: null // Store last detected sign for feedback display
};

// MediaPipe and webcam variables
let gestureRecognizer = undefined;
let runningMode = "IMAGE";
let webcamRunning = false;
let gestureDetectionEnabled = false; // New flag to control gesture detection in sign-match mode
let manualCameraToggle = false; // Flag to track when user manually toggles camera
let currentActiveModel = 'alphabet'; // Track the currently active model for consistency
let lastVideoTime = -1;
let results = undefined;
let predictionTimeout = null; // Add timeout to prevent freezing
let lastPredictionTime = 0; // Track last prediction time for watchdog
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

// Popup notification system for demonstration feedback
function showPopupNotification(message, type = 'success', duration = 2000) {
    // Remove any existing popups
    const existingPopup = document.querySelector('.demo-popup-notification');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.className = `demo-popup-notification ${type}`;
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div class="popup-message">${message}</div>
        </div>
    `;
    
    // Add styles
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        font-family: 'Arial', sans-serif;
        font-size: 16px;
        font-weight: bold;
        color: white;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        popup.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    } else if (type === 'error') {
        popup.style.background = 'linear-gradient(135deg, #dc3545, #fd7e14)';
    } else {
        popup.style.background = 'linear-gradient(135deg, #007bff, #6f42c1)';
    }
    
    // Style the content
    const content = popup.querySelector('.popup-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = popup.querySelector('.popup-icon');
    icon.style.cssText = `
        font-size: 24px;
        flex-shrink: 0;
    `;
    
    const messageEl = popup.querySelector('.popup-message');
    messageEl.style.cssText = `
        flex: 1;
        line-height: 1.4;
    `;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(() => {
        popup.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        popup.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }, duration);
    
    // Add click to dismiss
    popup.addEventListener('click', () => {
        popup.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    });
}

// Timer variables
let gameTimer = null;
let currentRoundTimer = null;
let timeLeft = 10;

// Initialize the challenge page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    createGestureRecognizer();
});

function initializePage() {
    // Initialize model selector
    createModelSelector('model-selection-container', (selectedModel) => {
        console.log('Model changed to:', selectedModel);
        // Reinitialize gesture recognizer with new model
        createGestureRecognizer(selectedModel);
    }, 'alphabet');
    
    // Ensure all video elements are muted
    muteAllVideos();
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
        
        // Add double-click to restart camera if frozen
        enableWebcamButton.addEventListener('dblclick', async () => {
            console.log('🔄 Double-click detected - restarting camera');
            if (webcamRunning) {
                await restartCamera();
            }
        });
    }
}

// Create gesture recognizer
async function createGestureRecognizer(modelCategory = 'alphabet') {
    try {
        // Update the active model tracker
        currentActiveModel = modelCategory;
        
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
    
    // Hide model selection during game
    const modelSelectionContainer = document.getElementById('model-selection-container');
    if (modelSelectionContainer) {
        modelSelectionContainer.classList.add('hidden');
    }
    
    // Update UI
    updateGameUI();
    
    // Start first question
    nextQuestion();
}

function resetGameState() {
    console.log('🎯 resetGameState called - current scores before reset:', gameState.score, gameState.correctAnswers);
    gameState = {
        score: 0,
        currentQuestion: 0,
        totalQuestions: 10,
        lives: 3,
        revealPowerUsed: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedQuestions: 0,
        isGameActive: true,
        endlessQuestionQueue: [],
        questionsPerModel: 3,
        currentModelIndex: 0,
        questionAnswered: false,
        videoSelectionMade: false, // New flag for sign-match mode
        lastVideoSelectionCorrect: false,
        signMatchAttempts: 0, // Counter for sign demonstration attempts in sign-match mode
        requireDemonstration: false, // Flag to require hand demonstration after correct video selection
        demonstrationWord: null, // Word that user must demonstrate
        lastDetectedSign: null // Store last detected sign for feedback display
    };
    
    // Initialize gesture detection state based on mode
    if (currentMode === 'sign-match') {
        gestureDetectionEnabled = false; // Start disabled for sign-match
    } else {
        gestureDetectionEnabled = true; // Start enabled for other modes
    }
    
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
    
    // Count only as skipped question (not as wrong answer)
    gameState.skippedQuestions++;
    
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
    console.log('🎯 nextQuestion() called - isGameActive:', gameState.isGameActive);
    if (!gameState.isGameActive) return;
    
    // Turn off camera to prevent freezing and save resources for all modes
    disableCamera('next question');
    
    // Force clear canvas to ensure no residual landmarks from previous question
    forceCanvasClear();
    
    // Clear canvas and reset camera state for new question
    clearCanvasAndResetCamera();
    
    // Reset question answered flag for new question
    gameState.questionAnswered = false;
    
    // Reset sign-match specific states for new question
    gameState.videoSelectionMade = false;
    gameState.signMatchAttempts = 0;
    gameState.lastVideoSelectionCorrect = false;
    gameState.requireDemonstration = false; // Reset demonstration requirement
    gameState.demonstrationWord = null; // Clear demonstration word
    
    // DISABLE gesture detection at start of new question (sign-match mode)
    if (currentMode === 'sign-match') {
        disableGestureDetection();
        
        // Ensure webcam section is visible for new question
        const webcamSection = document.querySelector('.webcam-section');
        if (webcamSection) {
            webcamSection.style.display = 'block';
        }
    }
    
    // Reset video styling and stop any playing videos
    document.querySelectorAll('.video-option').forEach(option => {
        option.style.border = '';
        option.style.boxShadow = '';
        // No animation to reset since we removed it
        const video = option.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
            video.muted = true; // Reset to muted
        }
    });
    
    gameState.currentQuestion++;
    
    // Check if game should end
    if (currentMode !== 'endless' && gameState.currentQuestion > gameState.totalQuestions) {
        console.log('🎯 Game ending - reached total questions:', gameState.currentQuestion, '/', gameState.totalQuestions);
        endGame();
        return;
    }
    
    if (currentMode === 'endless' && gameState.lives <= 0) {
        console.log('🎯 Game ending - no lives left:', gameState.lives);
        endGame();
        return;
    }
    
    console.log('🎯 Continuing to question:', gameState.currentQuestion, '/', gameState.totalQuestions);
    
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
        
        // Switch gesture recognizer to the selected model category for consistency
        createGestureRecognizer(modelCategory);
    }
    
    const challengeWordEl = document.getElementById('challenge-word');
    if (challengeWordEl) {
        challengeWordEl.textContent = randomWord;
    }
    
    // ENABLE gesture detection for flash-sign and endless modes
    enableGestureDetection();
    
    // Automatically re-enable camera for flash-sign and endless modes
    // Set manualCameraToggle to false since this is automatic
    manualCameraToggle = false;
    if (!webcamRunning) {
        enableCam();
    } else {
        // If camera is already running, just update the gesture output
        gestureOutput.style.background = '#f8f9fa';
        gestureOutput.style.color = '#333';
        gestureOutput.textContent = `Show the sign for "${randomWord}"!`;
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
    
    // Switch gesture recognizer to the selected model category for consistency
    createGestureRecognizer(modelCategory);
    
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
    
    const matchWordEl = document.getElementById('match-word');
    if (matchWordEl) {
        matchWordEl.textContent = correctWord;
    }
    
    // Set up videos
    const videoA = document.getElementById('video-a');
    const videoB = document.getElementById('video-b');
    
    if (!videoA || !videoB) {
        console.error('Video elements not found');
        return;
    }
    
    // Ensure videos are muted and won't autoplay
    videoA.muted = true;
    videoB.muted = true;
    videoA.autoplay = false;
    videoB.autoplay = false;
    
    // Randomly assign correct/wrong videos
    const isACorrect = Math.random() < 0.5;
    const correctVideoPath = getVideoPath(correctWord, modelCategory);
    const wrongVideoPath = getVideoPath(wrongWord, modelCategory);
    
    // Set video sources but don't load or play automatically
    videoA.src = isACorrect ? correctVideoPath : wrongVideoPath;
    videoB.src = isACorrect ? wrongVideoPath : correctVideoPath;
    
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
    
    // Initially DISABLE gesture detection until correct video is selected
    disableGestureDetection();
    
    // Reset question answered state
    gameState.questionAnswered = false;
    
    // Set initial instruction message
    gestureOutput.style.background = '#f8f9fa';
    gestureOutput.style.color = '#333';
    gestureOutput.textContent = `First select the correct video, then demonstrate the sign for "${correctWord}"`;
    
    // Add click to play functionality for videos
    setupVideoClickToPlay(videoA);
    setupVideoClickToPlay(videoB);
    
    // No timer for sign match mode - user takes their time to choose and perform
}

// Helper function to create video with error handling
function createVideoWithErrorHandling(src, word = 'unknown') {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.preload = 'metadata';
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

// Setup click to play functionality for videos
function setupVideoClickToPlay(video) {
    // Remove any existing click listeners
    video.removeEventListener('click', handleVideoClick);
    
    // Add click listener to play/pause video
    video.addEventListener('click', handleVideoClick);
    
    // Ensure video starts paused
    video.pause();
    video.currentTime = 0;
}

function handleVideoClick(event) {
    const video = event.target;
    
    // Pause all other videos when this one is clicked
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(otherVideo => {
        if (otherVideo !== video) {
            otherVideo.pause();
        }
    });
    
    // Toggle play/pause for clicked video
    if (video.paused) {
        video.currentTime = 0; // Start from beginning
        video.play().catch(e => console.log('Video play failed:', e));
    } else {
        video.pause();
    }
}

function getCurrentModelCategory() {
    const selector = document.getElementById('model-selector');
    const category = selector ? selector.value : 'alphabet';
    return category;
}

// Helper function to ensure model consistency
function ensureModelConsistency() {
    const selectedModel = getCurrentModelCategory();
    if (selectedModel !== currentActiveModel) {
        console.warn(`⚠️ Model mismatch detected! Selected: ${selectedModel}, Active: ${currentActiveModel}`);
        console.log('🔄 Updating gesture recognizer to match selected model');
        createGestureRecognizer(selectedModel);
        return false; // Indicates model was inconsistent
    }
    return true; // Model is consistent
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
        // Correct selection - award points immediately
        console.log('🎯 selectVideo: Correct video selected - before scoring:', gameState.score, gameState.correctAnswers);
        gameState.score++;
        gameState.correctAnswers++;
        // Don't set questionAnswered = true yet in sign-match mode - wait for demonstration
        console.log('🎯 selectVideo: After scoring:', gameState.score, gameState.correctAnswers);
        
        // Play correct sound
        globalSoundManager.playSoundByName('correct');
        
        // Show success popup notification for correct video selection
        showPopupNotification(`🎯 Great choice! Correct video selected! +1 point. Now demonstrate the sign!`, 'success', 3500);
        
        // Demonstrate the correct answer by playing the selected video (MUTED)
        const correctVideo = selectedVideo.querySelector('video');
        if (correctVideo) {
            // Pause all other videos first
            document.querySelectorAll('video').forEach(v => {
                if (v !== correctVideo) v.pause();
            });
            
            correctVideo.currentTime = 0; // Reset to beginning
            correctVideo.muted = true; // ALWAYS MUTED
            
            // Play the video (muted) automatically for correct selection
            correctVideo.play().then(() => {
                console.log('🎬 Demonstration video playing successfully (muted)');
            }).catch(e => {
                console.log('🎬 Video play failed:', e);
            });
            
            // Highlight the correct video with a visual indicator
            selectedVideo.style.border = '3px solid #28a745';
            selectedVideo.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.5)';
        }
        
        // Show message requiring demonstration
        const resultDiv = document.getElementById('video-selection-result');
        const message = document.getElementById('selection-message');
        
        if (message) {
            message.textContent = 'Correct! +1 point ✓ Now demonstrate this sign with your hands to continue!';
            message.style.color = '#28a745';
        }
        
        const matchWordEl = document.getElementById('match-word');
        const performWordEl = document.getElementById('perform-word');
        if (matchWordEl && performWordEl) {
            const word = matchWordEl.textContent;
            performWordEl.textContent = word;
        }
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
        }
        
        // Store video selection result for scoring
        gameState.lastVideoSelectionCorrect = isCorrect;
        gameState.videoSelectionMade = true;
        
        // Update the UI to reflect new score
        updateGameUI();
        
        // Reset gesture output to prompt for demonstration
        gestureOutput.style.background = '#fff3cd';
        gestureOutput.style.color = '#856404';
        const word = matchWordEl.textContent;
        gestureOutput.textContent = `Watch the video above, then perform the sign for "${word}" to continue!`;
        
        // Enable gesture recognition for demonstration requirement
        gameState.requireDemonstration = true;
        gameState.demonstrationWord = word;
        
        // ENABLE gesture detection now that correct video is selected
        enableGestureDetection();
        
        // DO NOT auto-advance - wait for demonstration
        // The user must now perform the gesture to proceed
        
    } else {
        // Wrong selection - mark as wrong but with specific feedback for sign-match mode
        gameState.wrongAnswers++;
        gameState.questionAnswered = true;
        
        // In endless mode, also lose a life (consistency with other wrong answers)
        if (currentMode === 'endless') {
            gameState.lives--;
            updateLivesDisplay();
            
            // Show error popup notification for wrong video selection in endless mode
            showPopupNotification(`❌ Wrong video selected! Lost a life 💔`, 'error', 3000);
        } else {
            // Show error popup notification for wrong video selection in other modes
            showPopupNotification(`❌ Wrong video selected! Try again next time!`, 'error', 2500);
        }
        
        // Show brief wrong feedback
        const resultDiv = document.getElementById('video-selection-result');
        const message = document.getElementById('selection-message');
        
        if (message) {
            message.textContent = 'Wrong video selected!';
            message.style.color = '#dc3545';
        }
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
        }
        
        // DISABLE webcam controls since we're skipping sign performance for wrong selection
        // Don't hide the webcam section completely, just disable gesture detection
        disableGestureDetection();
        
        // Ensure gesture detection remains disabled for wrong selection
        disableGestureDetection();
        
        // Play incorrect sound
        globalSoundManager.playSoundByName('incorrect');
        
        // Show next question button or auto-advance after short delay
        setTimeout(() => {
            // Check if game should end in endless mode after losing life
            if (currentMode === 'endless' && gameState.lives <= 0) {
                endGame();
                return;
            }
            clearCanvasAndResetCamera(); // Clear canvas before next question
            nextQuestion();
        }, 10); // Immediate progression
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
        }, 10);
    } else {
        // In other modes, just move to next question (no score change)
        gameState.wrongAnswers++;
        
        // Show feedback
        gestureOutput.style.background = '#fff3cd';
        gestureOutput.style.color = '#856404';
        gestureOutput.textContent = 'Time\'s up! Moving to next question ⏰';
        
        setTimeout(() => {
            nextQuestion();
        }, 10);
    }
}

function useRevealPower() {
    if (gameState.revealPowerUsed) return; // Can only use once per game
    
    gameState.revealPowerUsed = true; // Mark as used
    clearInterval(currentRoundTimer);
    
    // Show reveal modal
    const revealModal = document.getElementById('reveal-content');
    if (!revealModal) {
        console.error('Reveal modal not found');
        return;
    }
    revealModal.classList.remove('hidden');
    
    // Get current word and show video
    let currentWord;
    if (currentMode === 'sign-match') {
        const matchWordEl = document.getElementById('match-word');
        currentWord = matchWordEl ? matchWordEl.textContent : '';
    } else {
        const challengeWordEl = document.getElementById('challenge-word');
        currentWord = challengeWordEl ? challengeWordEl.textContent : '';
    }
    
    if (!currentWord) {
        console.error('Could not determine current word for reveal');
        return;
    }
    
    const modelCategory = getCurrentModelCategory();
    const videoPath = getVideoPath(currentWord, modelCategory);
    const revealVideo = document.getElementById('reveal-video');
    
    if (!revealVideo) {
        console.error('Reveal video element not found');
        return;
    }
    
    // Ensure reveal video is muted
    revealVideo.muted = true;
    
    // Set up the video source
    revealVideo.src = videoPath;
    revealVideo.preload = 'metadata';
    
    console.log(`Loading reveal video for: ${currentWord}`);
    
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

function showCorrectAnswerDemonstration() {
    const currentWord = document.getElementById('challenge-word').textContent;
    const modelCategory = getCurrentModelCategory();
    const videoPath = getVideoPath(currentWord, modelCategory);
    
    // Reuse the reveal modal structure for demonstration
    const revealModal = document.getElementById('reveal-content');
    const revealVideo = document.getElementById('reveal-video');
    const continueBtn = document.getElementById('continue-after-reveal');
    
    // Update the modal title and content for demonstration
    const titleElement = revealModal.querySelector('h3');
    if (titleElement) {
        titleElement.textContent = 'Correct! Here\'s the demonstration:';
    }
    
    // Set up the video (MUTED)
    revealVideo.src = videoPath;
    revealVideo.currentTime = 0;
    revealVideo.muted = true; // ALWAYS MUTED
    
    // Show the modal
    revealModal.classList.remove('hidden');
    
    // Auto-play the demonstration video
    revealVideo.play().catch(e => console.log('Video autoplay blocked:', e));
    
    // Update the continue button to move to next question
    continueBtn.onclick = () => {
        revealModal.classList.add('hidden');
        // Reset the title back to default
        if (titleElement) {
            titleElement.textContent = 'Correct Sign:';
        }
        nextQuestion();
    };
}

function handleCorrectAnswer() {
    console.log('🎯 handleCorrectAnswer called - questionAnswered:', gameState.questionAnswered);
    if (gameState.questionAnswered) return; // Prevent multiple scoring
    gameState.questionAnswered = true;
    
    gameState.score++;
    gameState.correctAnswers++;
    console.log('🎯 Updated scores - score:', gameState.score, 'correctAnswers:', gameState.correctAnswers);
    
    // Play correct sound
    globalSoundManager.playSoundByName('correct');
    
    if (currentMode === 'sign-match') {
        // Use the sign-match specific feedback
        const expectedSign = document.getElementById('match-word').textContent;
        showSignMatchFeedback(expectedSign, expectedSign, true);
    } else {
        // Show regular feedback for other modes and proceed immediately
        gestureOutput.style.background = '#d4edda';
        gestureOutput.style.color = '#155724';
        gestureOutput.textContent = `Correct! Detected "${gameState.lastDetectedSign || 'sign'}" ✓ +1 point!`;
        
        // Show success popup notification for flash-sign and endless modes
        const detectedSign = gameState.lastDetectedSign || 'sign';
        showPopupNotification(`🎉 Correct! You signed "${detectedSign}" perfectly! +1 point`, 'success', 2500);
        
        // Don't show demonstration modal - proceed immediately
        // showCorrectAnswerDemonstration();
    }
    
    // Update the UI to reflect new score
    updateGameUI();
    
    clearInterval(currentRoundTimer);
    
    // Proceed immediately for all modes (no delay)
    setTimeout(() => {
        nextQuestion();
    }, 10); // Absolute minimal delay
}

function handleWrongAnswer() {
    if (gameState.questionAnswered) return; // Prevent multiple scoring
    gameState.questionAnswered = true;
    
    gameState.wrongAnswers++;
    
    // In endless mode, lose a life
    if (currentMode === 'endless') {
        gameState.lives--;
        updateLivesDisplay();
        
        // Show feedback with detected sign
        gestureOutput.style.background = '#f8d7da';
        gestureOutput.style.color = '#721c24';
        gestureOutput.textContent = `Wrong! Detected "${gameState.lastDetectedSign || 'unknown'}" ✗ Lost a life 💔`;
        
        // Show error popup notification for endless mode
        const detectedSign = gameState.lastDetectedSign || 'unknown';
        showPopupNotification(`❌ Wrong! You signed "${detectedSign}" but we needed "${gameState.currentAnswer}". Lost a life 💔`, 'error', 3000);
    } else {
        // In other modes, no score penalty - just move on
        gestureOutput.style.background = '#f8d7da';
        gestureOutput.style.color = '#721c24';
        gestureOutput.textContent = `Wrong! Detected "${gameState.lastDetectedSign || 'unknown'}" ✗`;
        
        // Show error popup notification for flash-sign mode
        const detectedSign = gameState.lastDetectedSign || 'unknown';
        showPopupNotification(`❌ Wrong! You signed "${detectedSign}" but we needed "${gameState.currentAnswer}"`, 'error', 2500);
    }
    
    // Play incorrect sound
    globalSoundManager.playSoundByName('incorrect');
    
    clearInterval(currentRoundTimer);
    
    setTimeout(() => {
        // Check if game should end in endless mode after losing life
        if (currentMode === 'endless' && gameState.lives <= 0) {
            endGame();
            return;
        }
        nextQuestion();
    }, 10); // Immediate progression for all answers
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

// Enable gesture detection for sign-match mode demonstration
function enableGestureDetection() {
    gestureDetectionEnabled = true;
    const webcamSection = document.querySelector('.webcam-section');
    const webcamButton = document.getElementById('webcamButton');
    
    if (webcamSection) {
        webcamSection.style.opacity = '1'; // Full opacity when enabled
        webcamSection.style.pointerEvents = 'auto';
        webcamSection.style.display = 'block'; // Ensure it's visible
    }
    
    if (webcamButton) {
        webcamButton.disabled = false;
        webcamButton.style.opacity = '1';
    }
    
    // Clear any residual landmarks when enabling gesture detection for fresh start
    if (canvasCtx && canvasElement) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        results = undefined;
        console.log('🧹 Cleared landmarks when enabling gesture detection');
    }
    
    console.log('🔵 Gesture detection ENABLED for demonstration');
}

// Disable gesture detection for sign-match mode
function disableGestureDetection() {
    gestureDetectionEnabled = false;
    const webcamSection = document.querySelector('.webcam-section');
    const webcamButton = document.getElementById('webcamButton');
    
    if (webcamSection) {
        webcamSection.style.opacity = '0.5'; // Dim when disabled
        webcamSection.style.pointerEvents = 'none'; // Prevent interaction
        // Don't hide completely, just dim it
    }
    
    if (webcamButton) {
        webcamButton.disabled = true;
        webcamButton.style.opacity = '0.5';
    }
    
    // Clear any residual landmarks when disabling gesture detection
    if (canvasCtx && canvasElement) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        results = undefined;
        console.log('🧹 Cleared landmarks when disabling gesture detection');
    }
    
    console.log('🔴 Gesture detection DISABLED');
}

async function enableCam() {
    if (!gestureRecognizer) {
        alert("Please wait for the model to load");
        return;
    }

    // Set flag to indicate this is a manual camera toggle
    manualCameraToggle = true;

    if (webcamRunning) {
        // Disable webcam
        webcamRunning = false;
        enableWebcamButton.textContent = "Enable Camera";
        
        // Clear any pending timeouts
        if (predictionTimeout) {
            clearTimeout(predictionTimeout);
            predictionTimeout = null;
        }
        
        // Stop all video tracks
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped video track:', track.kind);
            });
            video.srcObject = null;
        }
        
        // Clear canvas
        if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        
        // Reset variables
        results = undefined;
        lastVideoTime = -1;
        lastPredictionTime = 0;
        
        console.log('📷 Webcam disabled and cleaned up');
    } else {
        // Enable webcam
        webcamRunning = true;
        enableWebcamButton.textContent = "Disable Camera";
        
        // Force clear canvas immediately when enabling camera to remove any residual landmarks
        forceCanvasClear();
        console.log('🧹 Force cleared canvas before enabling camera');
        
        // Reset all MediaPipe variables to ensure clean state
        results = undefined;
        lastVideoTime = -1;
        lastPredictionTime = 0;
        runningMode = "IMAGE";
        
        try {
            // Clear any existing stream first
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } 
            });
            
            video.srcObject = stream;
            
            // Wait for video to be ready before starting prediction
            video.addEventListener("loadeddata", () => {
                console.log('📷 Video loaded, starting prediction');
                
                // Force clear canvas again when video is ready to ensure no residual landmarks
                forceCanvasClear();
                console.log('🧹 Force cleared canvas after video loaded');
                
                // Always add 1 second delay when enabling camera (manual or automatic)
                console.log('🔄 Camera enabled - adding 1 second delay before detection starts');
                
                // Show preparation message
                if (gestureOutput && (currentMode === 'flash-sign' || currentMode === 'endless')) {
                    const challengeWordEl = document.getElementById('challenge-word');
                    const currentWord = challengeWordEl ? challengeWordEl.textContent : 'the sign';
                    gestureOutput.style.background = '#fff3cd';
                    gestureOutput.style.color = '#856404';
                    gestureOutput.textContent = manualCameraToggle ? 
                        'Camera reactivated! Preparing detection system...' : 
                        `Preparing detection for "${currentWord}"... Get ready!`;
                } else if (gestureOutput && currentMode === 'sign-match') {
                    gestureOutput.style.background = '#fff3cd';
                    gestureOutput.style.color = '#856404';
                    gestureOutput.textContent = 'Preparing camera system...';
                }
                
                setTimeout(() => {
                    lastPredictionTime = Date.now();
                    predictWebcam();
                    startPredictionWatchdog();
                    
                    // Clear the preparation message and show appropriate message for each mode
                    if (gestureOutput && (currentMode === 'flash-sign' || currentMode === 'endless')) {
                        const challengeWordEl = document.getElementById('challenge-word');
                        const currentWord = challengeWordEl ? challengeWordEl.textContent : 'the sign';
                        gestureOutput.style.background = '#f8f9fa';
                        gestureOutput.style.color = '#333';
                        gestureOutput.textContent = `Show the sign for "${currentWord}"!`;
                    } else if (gestureOutput && currentMode === 'sign-match') {
                        gestureOutput.style.background = '#f8f9fa';
                        gestureOutput.style.color = '#333';
                        gestureOutput.textContent = 'First select the correct video, then demonstrate the sign';
                    }
                    
                    // Reset the manual toggle flag
                    manualCameraToggle = false;
                }, 1000);
            }, { once: true });
            
        } catch (error) {
            console.error('Error accessing webcam:', error);
            webcamRunning = false;
            enableWebcamButton.textContent = "Enable Camera";
            alert('Failed to access webcam. Please check permissions.');
        }
    }
}

// Add watchdog to detect camera freezing
function startPredictionWatchdog() {
    // Clear any existing watchdog
    if (predictionTimeout) {
        clearTimeout(predictionTimeout);
    }
    
    predictionTimeout = setTimeout(() => {
        if (webcamRunning) {
            const timeSinceLastPrediction = Date.now() - lastPredictionTime;
            console.log('🐕 Watchdog check - time since last prediction:', timeSinceLastPrediction, 'ms');
            
            if (timeSinceLastPrediction > 3000) { // 3 seconds without prediction
                console.warn('⚠️ Camera appears frozen, restarting prediction loop');
                
                // Reset variables
                results = undefined;
                lastVideoTime = -1;
                runningMode = "IMAGE";
                
                // Restart prediction
                if (video && video.readyState >= 2) {
                    lastPredictionTime = Date.now();
                    predictWebcam();
                }
            }
            
            // Continue watchdog if webcam is still running
            if (webcamRunning) {
                startPredictionWatchdog();
            }
        }
    }, 5000); // Check every 5 seconds
}

async function predictWebcam() {
    // Add safety check to prevent infinite loops
    if (!gameState.isGameActive || !webcamRunning || !video || !gestureRecognizer) {
        console.log('🛑 Stopping prediction: game inactive, webcam stopped, or components missing');
        return;
    }
    
    // Use responsive canvas sizing to match the video display
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    
    // Make sure the canvas internal dimensions match the video's actual dimensions
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
    } else {
        console.warn('Video dimensions not available yet');
        if (webcamRunning) {
            // Add timeout to prevent infinite waiting
            setTimeout(() => {
                if (webcamRunning) {
                    window.requestAnimationFrame(predictWebcam);
                }
            }, 100);
        }
        return;
    }

    try {
        // Update watchdog timer
        lastPredictionTime = Date.now();
        
        if (runningMode === "IMAGE") {
            runningMode = "VIDEO";
            await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
        }

        let startTimeMs = performance.now();
        
        // Simplify the video time check - always process if webcam is running
        // This prevents freezing when video.currentTime doesn't update properly
        if (webcamRunning && video.readyState >= 2) { // HAVE_CURRENT_DATA
            lastVideoTime = video.currentTime;
            results = gestureRecognizer.recognizeForVideo(video, startTimeMs);
        }

        // Always clear and redraw canvas to prevent freezing
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        if (results && results.landmarks) {
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

        // Check for gesture recognition (only if enabled)
        if (results && results.gestures && results.gestures.length > 0) {
        const gesture = results.gestures[0][0];
        const confidence = gesture.score;
        const detectedSign = normalizeModelOutput(gesture.categoryName);
        
        // Debug: Log all gesture detections
        if (confidence > 0.3) { // Lower threshold for debugging
            console.log('🎯 Gesture detected:', detectedSign, 'confidence:', confidence.toFixed(2), 'mode:', currentMode);
        }
        
        // Show real-time detection output when gesture detection is enabled
        if (gestureDetectionEnabled && currentMode === 'sign-match' && gameState.requireDemonstration) {
            gestureOutput.style.background = confidence > 0.3 ? '#d4edda' : '#f8f9fa';
            gestureOutput.style.color = confidence > 0.3 ? '#155724' : '#333';
            gestureOutput.textContent = `Detecting: "${detectedSign}"`;
        }
        
        if (confidence > 0.3) {
            console.log('🎯 GESTURE DETECTED:', detectedSign, 'Mode:', currentMode, 'Confidence:', confidence.toFixed(2), 'Active Model:', currentActiveModel);
            
            // In sign-match mode, only process gestures if detection is enabled
            if (currentMode === 'sign-match') {
                console.log('🎯 Sign-match mode - gestureDetectionEnabled:', gestureDetectionEnabled);
                if (gestureDetectionEnabled) {
                    checkAnswer(detectedSign);
                }
                // If detection is disabled, ignore the gesture
            } else {
                // For other modes, always process gestures immediately
                console.log('🎯 Flash-sign/Endless mode - processing immediately');
                
                // Store the detected sign for feedback
                gameState.lastDetectedSign = detectedSign;
                
                // Check if this is the correct answer
                const expectedSign = document.getElementById('challenge-word').textContent;
                console.log('🎯 Expected:', expectedSign, 'Detected:', detectedSign, 'Match:', detectedSign === expectedSign);
                console.log('🎯 Question already answered?', gameState.questionAnswered);
                
                if (detectedSign === expectedSign) {
                    // Immediate correct answer processing
                    if (!gameState.questionAnswered) {
                        console.log('🎯 PROCESSING CORRECT ANSWER IMMEDIATELY');
                        gameState.questionAnswered = true;
                        gameState.score++;
                        gameState.correctAnswers++;
                        
                        // Show immediate feedback
                        gestureOutput.style.background = '#d4edda';
                        gestureOutput.style.color = '#155724';
                        gestureOutput.textContent = `Correct! Detected "${detectedSign}" ✓ +1 point!`;
                        
                        // Play correct sound
                        try {
                            globalSoundManager.playSoundByName('correct');
                        } catch (e) {
                            console.log('Sound error:', e);
                        }
                        
                        // Update UI
                        try {
                            updateGameUI();
                        } catch (e) {
                            console.log('UpdateUI error:', e);
                        }
                        
                        try {
                            clearInterval(currentRoundTimer);
                        } catch (e) {
                            console.log('Timer clear error:', e);
                        }
                        
                        // Proceed immediately to next question
                        console.log('🎯 SETTING TIMEOUT TO NEXT QUESTION');
                        setTimeout(() => {
                            console.log('🎯 CALLING NEXT QUESTION NOW');
                            try {
                                nextQuestion();
                            } catch (e) {
                                console.error('🎯 ERROR CALLING NEXT QUESTION:', e);
                            }
                        }, 100);
                    } else {
                        console.log('🎯 Question already answered, ignoring');
                    }
                } else {
                    // Wrong answer - use regular flow
                    console.log('🎯 Wrong answer, using regular checkAnswer flow');
                    checkAnswer(detectedSign);
                }
            }
        }
    } else {
        // No gesture detected - show waiting message if in demonstration mode
        if (gestureDetectionEnabled && currentMode === 'sign-match' && gameState.requireDemonstration) {
            gestureOutput.style.background = '#f8f9fa';
            gestureOutput.style.color = '#6c757d';
            gestureOutput.textContent = `Waiting for gesture... Demonstrate "${gameState.demonstrationWord}"`;
        }
    }

    } catch (error) {
        console.error('Error in predictWebcam:', error);
        // Continue the loop even if there's an error to prevent freezing
    }

    // Continue the prediction loop
    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Function to restart camera when it's frozen
async function restartCamera() {
    console.log('🔄 Restarting camera due to freeze detection');
    
    if (webcamRunning) {
        // Temporarily disable and re-enable camera
        const wasRunning = webcamRunning;
        await enableCam(); // This will disable it
        
        if (wasRunning) {
            // Wait a moment then re-enable
            setTimeout(async () => {
                await enableCam(); // This will enable it again
            }, 500);
        }
    }
}

// Special function to forcefully clear any residual landmarks
function forceCanvasClear() {
    if (canvasElement && canvasCtx) {
        // Multiple clearing approaches to ensure complete cleanup
        canvasCtx.save();
        canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.restore();
        
        // Reset canvas dimensions to trigger redraw
        const width = canvasElement.width;
        const height = canvasElement.height;
        canvasElement.width = width;
        canvasElement.height = height;
        
        console.log('🧹 Canvas force cleared - all residual landmarks removed');
    }
    
    // Also reset all MediaPipe variables
    results = undefined;
    lastVideoTime = -1;
    runningMode = "IMAGE";
}

// Helper function to cleanly disable camera
function disableCamera(reason = 'cleanup') {
    if (webcamRunning) {
        console.log(`📷 Turning off camera - ${reason}`);
        webcamRunning = false;
        enableWebcamButton.textContent = "Enable Camera";
        
        // Clear any pending timeouts
        if (predictionTimeout) {
            clearTimeout(predictionTimeout);
            predictionTimeout = null;
        }
        
        // Stop all video tracks
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => {
                track.stop();
            });
            video.srcObject = null;
        }
        
        // Reset variables
        results = undefined;
        lastVideoTime = -1;
        lastPredictionTime = 0;
        runningMode = "IMAGE";
        
        // Thoroughly clear canvas to prevent residual landmarks
        if (canvasCtx && canvasElement) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.fillStyle = 'transparent';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
            console.log('🧹 Canvas thoroughly cleared during camera disable');
        }
    }
}

// Helper function to clear canvas and reset camera landmarks
function clearCanvasAndResetCamera() {
    // Clear the canvas completely and thoroughly
    if (canvasElement && canvasCtx) {
        // Clear with background color to ensure complete cleanup
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.fillStyle = 'transparent';
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        console.log('🧹 Canvas cleared and reset thoroughly');
    }
    
    // Reset any stored results to prevent residual landmarks
    results = undefined;
    lastVideoTime = -1;
    lastPredictionTime = Date.now(); // Reset watchdog timer
    runningMode = "IMAGE"; // Reset to ensure fresh start
    
    // Clear gesture output display
    if (gestureOutput) {
        gestureOutput.style.background = '#f8f9fa';
        gestureOutput.style.color = '#333';
        gestureOutput.textContent = '';
    }
    
    // If camera is running but seems frozen, restart prediction
    if (webcamRunning && video && video.readyState >= 2) {
        console.log('🔄 Restarting prediction after canvas clear');
        setTimeout(() => {
            if (webcamRunning) {
                predictWebcam();
            }
        }, 100);
    }
}

function checkAnswer(detectedSign) {
    // Store the detected sign for feedback display
    gameState.lastDetectedSign = detectedSign;
    
    console.log('🎯 checkAnswer() called with:', detectedSign);
    console.log('🎯 gameState.questionAnswered:', gameState.questionAnswered);
    console.log('🎯 gameState.isGameActive:', gameState.isGameActive);
    
    // Ensure model consistency before processing answer
    if (!ensureModelConsistency()) {
        console.log('🔄 Model was updated, waiting for next gesture detection');
        return; // Wait for next detection with correct model
    }
    
    // Skip processing if question already answered, EXCEPT in sign-match mode where demonstration is required
    if (gameState.questionAnswered && !(currentMode === 'sign-match' && gameState.requireDemonstration)) {
        console.log('🎯 Question already answered, returning early');
        return;
    }
    
    let expectedSign;
    
    if (currentMode === 'sign-match') {
        const matchWordEl = document.getElementById('match-word');
        expectedSign = matchWordEl ? matchWordEl.textContent : '';
        
        if (!expectedSign) {
            console.error('Could not determine expected sign for sign-match mode');
            return;
        }
        
        // In sign-match mode, user MUST select a video first before demonstrating
        if (!gameState.videoSelectionMade) {
            // Show message that they need to select a video first
            showSignMatchFeedback(null, expectedSign, false, 'Please select a video first before demonstrating the sign!');
            return;
        }
        
        // Check if demonstration is required (after correct video selection)
        if (gameState.requireDemonstration && gameState.demonstrationWord) {
            const requiredSign = gameState.demonstrationWord;
            
            if (detectedSign === requiredSign) {
                // Successful demonstration - proceed immediately to next question
                showSignMatchFeedback(detectedSign, requiredSign, true, `Perfect! Detected "${detectedSign}" correctly!`);
                
                // Show success popup notification
                showPopupNotification(`🎉 Perfect! You correctly signed "${detectedSign}"!`, 'success', 3000);
                
                // Mark question as answered ONLY after successful demonstration
                gameState.questionAnswered = true;
                
                // Clear demonstration requirement
                gameState.requireDemonstration = false;
                gameState.demonstrationWord = null;
                
                // DISABLE gesture detection after successful demonstration
                disableGestureDetection();
                
                // Proceed immediately to next question (no delay)
                setTimeout(() => {
                    nextQuestion();
                }, 10); // Absolute minimal delay
            } else {
                // Wrong demonstration - show what was detected and try again
                showSignMatchFeedback(detectedSign, requiredSign, false, `Detected "${detectedSign}" but need "${requiredSign}". Please try again.`);
                
                // Show error popup notification
                showPopupNotification(`❌ Detected "${detectedSign}" but need "${requiredSign}". Try again!`, 'error', 3000);
            }
        } else {
            // Video selection was wrong, or no demonstration required yet
            showSignMatchFeedback(detectedSign, expectedSign, false, 'Please select the correct video first!');
        }
    } else {
        // Other modes: normal logic (but not sign-match mode)
        if (currentMode !== 'sign-match') {
            const challengeWordEl = document.getElementById('challenge-word');
            expectedSign = challengeWordEl ? challengeWordEl.textContent : '';
            
            if (!expectedSign) {
                console.error('Could not determine expected sign for challenge mode');
                return;
            }
            
            if (detectedSign === expectedSign) {
                handleCorrectAnswer();
            } else {
                handleWrongAnswer();
            }
        }
        // Note: sign-match mode handles scoring through selectVideo(), not gesture recognition
    }
}

function endGame() {
    console.log('🎯 endGame() called');
    gameState.isGameActive = false;
    clearInterval(currentRoundTimer);
    
    // Turn off camera when game ends
    disableCamera('game ended');
    
    // Show results screen
    gameScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Calculate total questions attempted first
    let totalQuestionsAttempted;
    if (currentMode === 'endless') {
        // For endless mode, calculate based on actual answers given to ensure consistency
        totalQuestionsAttempted = gameState.correctAnswers + gameState.wrongAnswers + gameState.skippedQuestions;
        // Ensure we have at least 1 if somehow all counters are 0
        totalQuestionsAttempted = Math.max(1, totalQuestionsAttempted);
    } else {
        // For other modes, use the fixed total questions
        totalQuestionsAttempted = gameState.totalQuestions;
    }
    
    // Update results (with null checks)
    const finalScoreEl = document.getElementById('final-score');
    const finalTotalEl = document.getElementById('final-total');
    const finalScoreContainer = document.querySelector('.final-score');
    const correctCountEl = document.getElementById('correct-count');
    const wrongCountEl = document.getElementById('wrong-count');
    const skipCountEl = document.getElementById('skip-count');
    const revealUsedEl = document.getElementById('reveal-used');
    
    // Debug: Check if elements are found
    console.log('🎯 HTML Elements found:');
    console.log('finalScoreEl:', !!finalScoreEl);
    console.log('correctCountEl:', !!correctCountEl);
    console.log('wrongCountEl:', !!wrongCountEl);
    console.log('skipCountEl:', !!skipCountEl);
    
    // Handle final score display differently for endless mode
    if (currentMode === 'endless') {
        // For endless mode, hide the traditional final score and show dynamic counter
        if (finalScoreContainer) {
            finalScoreContainer.innerHTML = `
                <span class="score-label">Questions Attempted:</span>
                <span class="endless-questions">${totalQuestionsAttempted}</span>
            `;
        }
    } else {
        // For other modes, show traditional score format
        if (finalScoreEl) {
            finalScoreEl.textContent = gameState.score;
            console.log('📊 Set finalScoreEl to:', gameState.score);
        }
        if (finalTotalEl) {
            finalTotalEl.textContent = totalQuestionsAttempted;
            console.log('📊 Set finalTotalEl to:', totalQuestionsAttempted);
        }
    }
    
    if (correctCountEl) {
        correctCountEl.textContent = gameState.correctAnswers;
        console.log('📊 Set correctCountEl to:', gameState.correctAnswers);
    }
    if (wrongCountEl) {
        wrongCountEl.textContent = gameState.wrongAnswers;
        console.log('📊 Set wrongCountEl to:', gameState.wrongAnswers);
    }
    if (skipCountEl) {
        skipCountEl.textContent = gameState.skippedQuestions;
        console.log('📊 Set skipCountEl to:', gameState.skippedQuestions);
    }
    if (revealUsedEl) revealUsedEl.textContent = gameState.revealPowerUsed ? 'Yes' : 'No';
    
    // Debug logging to understand the scoring issue
    console.log('� GAME ENDING - Final gameState:');
    console.log('gameState.score:', gameState.score);
    console.log('gameState.correctAnswers:', gameState.correctAnswers);
    console.log('gameState.wrongAnswers:', gameState.wrongAnswers);
    console.log('gameState.skippedQuestions:', gameState.skippedQuestions);
    console.log('totalQuestionsAttempted:', totalQuestionsAttempted);
    console.log('Full gameState object:', JSON.stringify(gameState, null, 2));
    console.log('Skipped Questions:', gameState.skippedQuestions);
    console.log('Total Questions Attempted:', totalQuestionsAttempted);
    console.log('Current Mode:', currentMode);
    console.log('Current Question:', gameState.currentQuestion);
    
    // Validate that the numbers add up correctly
    const calculatedTotal = gameState.correctAnswers + gameState.wrongAnswers + gameState.skippedQuestions;
    console.log('📊 Calculated total from answers:', calculatedTotal);
    console.log('📊 Total questions attempted:', totalQuestionsAttempted);
    
    if (calculatedTotal !== totalQuestionsAttempted && currentMode === 'endless') {
        console.warn('⚠️ MISMATCH detected! Correcting totalQuestionsAttempted to match actual answers');
        totalQuestionsAttempted = calculatedTotal;
    }
    
    // Performance message
    const performanceText = document.getElementById('performance-text');
    const resultsTitleEl = document.getElementById('results-title');
    
    if (currentMode === 'endless') {
        // Special messages for endless mode based on questions attempted and accuracy
        const percentage = totalQuestionsAttempted > 0 ? (gameState.score / totalQuestionsAttempted) * 100 : 0;
        
        if (resultsTitleEl) {
            resultsTitleEl.textContent = 'Endless Challenge Complete!';
        }
        
        if (performanceText) {
            if (totalQuestionsAttempted >= 20 && percentage >= 80) {
                performanceText.textContent = `🏆 Amazing endurance! You answered ${totalQuestionsAttempted} questions with ${percentage.toFixed(0)}% accuracy!`;
            } else if (totalQuestionsAttempted >= 15 && percentage >= 70) {
                performanceText.textContent = `🔥 Great persistence! ${totalQuestionsAttempted} questions attempted with solid ${percentage.toFixed(0)}% accuracy!`;
            } else if (totalQuestionsAttempted >= 10) {
                performanceText.textContent = `💪 Good effort! You tackled ${totalQuestionsAttempted} questions. Keep pushing your limits!`;
            } else if (totalQuestionsAttempted >= 5) {
                performanceText.textContent = `👍 Nice try! ${totalQuestionsAttempted} questions is a good start. Challenge yourself to go further!`;
            } else {
                performanceText.textContent = `🌟 Every journey begins with a step! Try to push beyond ${totalQuestionsAttempted} questions next time!`;
            }
        }
    } else {
        // Traditional performance messages for other modes
        const percentage = totalQuestionsAttempted > 0 ? (gameState.score / totalQuestionsAttempted) * 100 : 0;
        
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
}

function quitGame() {
    if (confirm('Are you sure you want to quit the current game?')) {
        // End the game and show the score results
        endGame();
    }
}

function backToModeSelection() {
    gameScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    
    // Show model selection again
    const modelSelectionContainer = document.getElementById('model-selection-container');
    if (modelSelectionContainer) {
        modelSelectionContainer.classList.remove('hidden');
    }
    
    // Clear canvas and reset camera state
    clearCanvasAndResetCamera();
    
    // Stop webcam and clean up properly
    disableCamera('back to mode selection');
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
