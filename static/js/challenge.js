// Challenge Game JavaScript
import { createModelSelector, getModelUrl, loadModelWithProgress, MODEL_URLS, normalizeModelOutput } from './config.js';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

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

// Challenge word pools for different categories
const CHALLENGE_WORDS = {
    alphabet: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    colors: ['RED', 'BLUE', 'YELLOW', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE'],
    basicWords: ['HELLO', 'THANK', 'PLEASE', 'YES', 'NO', 'GOODBYE'],
    family: ['MOTHER', 'FATHER', 'BABY', 'BOY', 'GIRL'],
    food: ['EAT', 'DRINK', 'WATER', 'APPLE', 'MILK', 'PIZZA']
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
}

function setupEventListeners() {
    // Mode selection buttons
    document.querySelectorAll('.start-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modeCard = e.target.closest('.mode-card');
            const mode = modeCard.dataset.mode;
            startGame(mode);
        });
    });

    // Game control buttons
    document.getElementById('reveal-power-btn').addEventListener('click', useRevealPower);
    document.getElementById('quit-game-btn').addEventListener('click', quitGame);
    document.getElementById('continue-after-reveal').addEventListener('click', continueAfterReveal);
    document.getElementById('skip-question-btn').addEventListener('click', skipQuestion);

    // Results screen buttons
    document.getElementById('play-again-btn').addEventListener('click', () => {
        if (currentMode) {
            startGame(currentMode);
        }
    });
    document.getElementById('back-to-modes-btn').addEventListener('click', backToModeSelection);

    // Video selection buttons (for sign match mode)
    document.querySelectorAll('.select-video-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectVideo(e.target.dataset.video);
        });
    });

    // Webcam button
    enableWebcamButton.addEventListener('click', enableCam);
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

// Start a game mode
function startGame(mode) {
    currentMode = mode;
    resetGameState();
    
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
        questionAnswered: false
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
    document.getElementById('current-score').textContent = gameState.score;
    document.getElementById('question-number').textContent = gameState.currentQuestion;
    document.getElementById('total-questions').textContent = currentMode === 'endless' ? '∞' : gameState.totalQuestions;
    
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
    document.getElementById('lives-count').textContent = gameState.lives;
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
    
    document.getElementById('challenge-word').textContent = randomWord;
    
    // Start timer for flash sign and endless modes
    startRoundTimer();
}

function showSignMatchQuestion() {
    signMatchContent.classList.remove('hidden');
    
    // Get random word and set up video options
    const modelCategory = getCurrentModelCategory();
    const words = CHALLENGE_WORDS[modelCategory] || CHALLENGE_WORDS.alphabet;
    const correctWord = words[Math.floor(Math.random() * words.length)];
    let wrongWord;
    
    // Make sure wrong word is different from correct word
    do {
        wrongWord = words[Math.floor(Math.random() * words.length)];
    } while (wrongWord === correctWord && words.length > 1);
    
    document.getElementById('match-word').textContent = correctWord;
    
    // Set up videos
    const videoA = document.getElementById('video-a');
    const videoB = document.getElementById('video-b');
    
    // Randomly assign correct/wrong videos
    const isACorrect = Math.random() < 0.5;
    const correctVideoPath = getVideoPath(correctWord, modelCategory);
    const wrongVideoPath = getVideoPath(wrongWord, modelCategory);
    
    videoA.src = isACorrect ? correctVideoPath : wrongVideoPath;
    videoB.src = isACorrect ? wrongVideoPath : correctVideoPath;
    
    // Store correct answer
    videoA.dataset.isCorrect = isACorrect;
    videoB.dataset.isCorrect = !isACorrect;
    
    // Auto-play videos when they load
    videoA.addEventListener('loadeddata', () => {
        videoA.play().catch(e => console.log('Video A autoplay failed:', e));
    });
    
    videoB.addEventListener('loadeddata', () => {
        videoB.play().catch(e => console.log('Video B autoplay failed:', e));
    });
    
    // Force reload to trigger loadeddata event
    videoA.load();
    videoB.load();
    
    // Reset video selection
    document.querySelectorAll('.video-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('.select-video-btn').forEach(btn => {
        btn.disabled = false;
    });
    document.getElementById('video-selection-result').classList.add('hidden');
    
    // No timer for sign match mode - user takes their time to choose and perform
}

function getVideoPath(word, category) {
    // Construct video path based on category and word
    return `static/sign_language_videos/${category}/${word.toLowerCase()}.mp4`;
}

function getCurrentModelCategory() {
    const selector = document.getElementById('model-selector');
    return selector ? selector.value : 'alphabet';
}

function selectVideo(videoOption) {
    const selectedVideo = document.querySelector(`[data-option="${videoOption}"]`);
    const isCorrect = selectedVideo.querySelector('video').dataset.isCorrect === 'true';
    
    // Mark selection
    document.querySelectorAll('.video-option').forEach(option => {
        option.classList.remove('selected');
    });
    selectedVideo.classList.add('selected');
    
    // Disable buttons
    document.querySelectorAll('.select-video-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Show result and next step
    const resultDiv = document.getElementById('video-selection-result');
    const message = document.getElementById('selection-message');
    
    if (isCorrect) {
        message.textContent = 'Correct! Now perform the sign:';
        message.style.color = '#28a745';
    } else {
        message.textContent = 'Wrong video selected. Try to perform the correct sign:';
        message.style.color = '#dc3545';
    }
    
    const word = document.getElementById('match-word').textContent;
    document.getElementById('perform-word').textContent = word;
    resultDiv.classList.remove('hidden');
    
    // Store video selection result for scoring
    gameState.lastVideoSelectionCorrect = isCorrect;
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
        document.getElementById('incorrectSound').play().catch(e => console.log('Audio play failed'));
        
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
    const revealVideo = document.getElementById('reveal-video');
    revealVideo.src = getVideoPath(currentWord, modelCategory);
    
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
    document.getElementById('correctSound').play().catch(e => console.log('Audio play failed'));
    
    // Show feedback
    gestureOutput.style.background = '#d4edda';
    gestureOutput.style.color = '#155724';
    gestureOutput.textContent = 'Correct! +1 point ✓';
    
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
    document.getElementById('incorrectSound').play().catch(e => console.log('Audio play failed'));
    
    clearInterval(currentRoundTimer);
    
    setTimeout(() => {
        nextQuestion();
    }, 1500);
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

function checkAnswer(detectedSign) {
    let expectedSign;
    
    if (currentMode === 'sign-match') {
        expectedSign = document.getElementById('match-word').textContent;
        // For sign match, also check if they selected the correct video
        if (!gameState.lastVideoSelectionCorrect) {
            handleWrongAnswer();
            return;
        }
    } else {
        expectedSign = document.getElementById('challenge-word').textContent;
    }
    
    if (detectedSign === expectedSign) {
        handleCorrectAnswer();
    }
}

function endGame() {
    gameState.isGameActive = false;
    clearInterval(currentRoundTimer);
    
    // Show results screen
    gameScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Update results
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-total').textContent = currentMode === 'endless' ? gameState.currentQuestion - 1 : gameState.totalQuestions;
    document.getElementById('correct-count').textContent = gameState.correctAnswers;
    document.getElementById('wrong-count').textContent = gameState.wrongAnswers;
    document.getElementById('reveal-used').textContent = gameState.revealPowerUsed ? 'Yes' : 'No';
    
    // Performance message
    const percentage = (gameState.score / (currentMode === 'endless' ? gameState.currentQuestion - 1 : gameState.totalQuestions)) * 100;
    const performanceText = document.getElementById('performance-text');
    
    if (percentage >= 90) {
        performanceText.textContent = '🎉 Outstanding performance! You\'re an ASL master!';
        document.getElementById('results-title').textContent = 'Excellent Work!';
    } else if (percentage >= 70) {
        performanceText.textContent = '👏 Great job! Keep practicing to improve further!';
        document.getElementById('results-title').textContent = 'Well Done!';
    } else if (percentage >= 50) {
        performanceText.textContent = '👍 Good effort! Practice more to boost your skills!';
        document.getElementById('results-title').textContent = 'Keep Going!';
    } else {
        performanceText.textContent = '💪 Don\'t give up! Every expert was once a beginner!';
        document.getElementById('results-title').textContent = 'Keep Practicing!';
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
    
    // Stop webcam
    if (webcamRunning) {
        webcamRunning = false;
        enableWebcamButton.textContent = "Enable Camera";
        video.srcObject?.getTracks().forEach(track => track.stop());
    }
}

// Navigation menu toggle
document.querySelector('.menu-toggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('nav').classList.toggle('active');
});
