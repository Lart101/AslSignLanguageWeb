import { getGestureModelUrl, loadModelWithProgress, normalizeModelOutput, getDisplayNameFromDataLetter, globalSoundManager } from './config.js';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let gestureRecognizer;
let runningMode = "IMAGE";
let webcamRunning = false;
let selectedLetter = null;
let modelLoading = false;
const videoHeight = "360px";
const videoWidth = "480px";

// Sound elements
const selectSound = document.getElementById('selectSound');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const cameraSound = document.getElementById('cameraSound');

// Initialize the GestureRecognizer with progress
const createGestureRecognizer = async () => {
    if (modelLoading) return;
    
    try {
        modelLoading = true;
        gestureRecognizer = await loadModelWithProgress(getGestureModelUrl(), {
            runningMode: runningMode,
            delegate: "GPU"
        });
        modelLoading = false;
        console.log('Model loaded successfully!');
    } catch (error) {
        modelLoading = false;
        console.error('Failed to load model:', error);
        alert('Failed to load AI model. Please refresh the page and try again.');
    }
};
createGestureRecognizer();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const enableWebcamButton = document.getElementById("webcamButton");

// Function to play sound using global sound manager
function playSound(audioElement) {
    // Check localStorage directly for manual toggle compatibility
    const soundEnabled = localStorage.getItem('signademy_sound_enabled') !== 'false';
    if (soundEnabled && audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(error => {
            console.warn('Error playing sound:', error);
        });
    }
}

// Add click handlers to letter cards
document.querySelectorAll('.letter-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.letter-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedLetter = card.dataset.letter;
        playSound(selectSound);
    });
});

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Enable webcam
if (hasGetUserMedia()) {
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
    enableWebcamButton.innerText = "Webcam Not Supported";
    enableWebcamButton.disabled = true;
}

async function enableCam() {
    if (modelLoading) {
        alert("Please wait for the AI model to finish loading...");
        return;
    }
    
    if (!gestureRecognizer) {
        alert("AI model is not loaded yet. Please wait and try again.");
        return;
    }

    playSound(cameraSound);

    if (webcamRunning) {
        webcamRunning = false;
        enableWebcamButton.innerText = "Enable Camera";
        // Stop the webcam
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    } else {
        webcamRunning = true;
        enableWebcamButton.innerText = "Disable Camera";
        // Start the webcam
        try {
            const constraints = {
                video: {
                    width: 640,
                    height: 480
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Error accessing webcam. Please make sure you have granted camera permissions.");
        }
    }
}

let lastVideoTime = -1;
let results = undefined;
let lastDetectedGesture = null;

async function predictWebcam() {
    // Remove fixed dimensions and make it responsive
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    
    // Make sure the canvas is setup with the video's actual dimensions
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    if (results.landmarks) {
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

    if (results.gestures.length > 0) {
        gestureOutput.style.display = "block";
        const rawCategoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
        
        // Normalize the model output to match our expected format
        const categoryName = normalizeModelOutput(rawCategoryName);
        
        // Only play sounds when the detected gesture changes
        const gestureChanged = lastDetectedGesture !== categoryName;
        lastDetectedGesture = categoryName;
        
        if (selectedLetter) {
            if (categoryName.toUpperCase() === selectedLetter.toUpperCase()) {
                gestureOutput.className = 'output success';
                const displayName = getDisplayNameFromDataLetter(selectedLetter);
                gestureOutput.innerText = `Correct! You're showing the sign for ${displayName}`;
                
                if (gestureChanged) {
                    playSound(correctSound);
                }
            } else {
                gestureOutput.className = 'output error';
                const expectedDisplayName = getDisplayNameFromDataLetter(selectedLetter);
                const detectedDisplayName = getDisplayNameFromDataLetter(categoryName);
                gestureOutput.innerText = `Keep practicing! You showed ${detectedDisplayName}, but we're looking for ${expectedDisplayName}`;
                
                if (gestureChanged) {
                    playSound(incorrectSound);
                }
            }
        } else {
            gestureOutput.className = 'output neutral';
            const detectedDisplayName = getDisplayNameFromDataLetter(categoryName);
            gestureOutput.innerText = `Detected: ${detectedDisplayName}\nConfidence: ${categoryScore}%`;
        }
    } else {
        gestureOutput.style.display = "none";
        lastDetectedGesture = null;
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Add smooth scrolling for letter links
document.querySelectorAll('.letter-quick-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

document.querySelector('.menu-toggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('nav').classList.toggle('active');
});

// Function to handle text length in letter cards
function adjustCardTextSizing() {
    document.querySelectorAll('.letter-card .letter').forEach(letterElement => {
        const text = letterElement.textContent.trim();
        const card = letterElement.closest('.letter-card');
        
        // Remove any existing text-length classes
        card.classList.remove('long-text', 'very-long-text');
        
        // Add appropriate class based on text length
        if (text.length > 15) {
            card.classList.add('very-long-text');
        } else if (text.length > 8) {
            card.classList.add('long-text');
        }
    });
}

// Run the text sizing adjustment when DOM is loaded
document.addEventListener('DOMContentLoaded', adjustCardTextSizing);

// Also run it after any dynamic content changes
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(adjustCardTextSizing);
    observer.observe(document.body, { childList: true, subtree: true });
}

// Register audio elements with global sound manager
document.addEventListener('DOMContentLoaded', () => {
    globalSoundManager.registerAudioElement('select', selectSound);
    globalSoundManager.registerAudioElement('correct', correctSound);
    globalSoundManager.registerAudioElement('incorrect', incorrectSound);
    globalSoundManager.registerAudioElement('camera', cameraSound);
});
