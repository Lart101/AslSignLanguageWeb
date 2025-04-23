import { GESTURE_MODEL_URL } from './config.js';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let gestureRecognizer;
let runningMode = "IMAGE";
let webcamRunning = false;
let selectedLetter = null;
const videoHeight = "360px";
const videoWidth = "480px";

// Sound elements
const selectSound = document.getElementById('selectSound');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const cameraSound = document.getElementById('cameraSound');

// Sound settings
let soundEnabled = true;

// Initialize the GestureRecognizer
const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: GESTURE_MODEL_URL,
            delegate: "GPU"
        },
        runningMode: runningMode
    });
};
createGestureRecognizer();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const enableWebcamButton = document.getElementById("webcamButton");

// Function to play sound
function playSound(audioElement) {
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
    if (!gestureRecognizer) {
        alert("Please wait for gestureRecognizer to load");
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
        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
        
        // Only play sounds when the detected gesture changes
        const gestureChanged = lastDetectedGesture !== categoryName;
        lastDetectedGesture = categoryName;
        
        if (selectedLetter) {
            if (categoryName.toUpperCase() === selectedLetter.toUpperCase()) {
                gestureOutput.className = 'output success';
                gestureOutput.innerText = `Correct! You're showing the letter ${selectedLetter}`;
                
                if (gestureChanged) {
                    playSound(correctSound);
                }
            } else {
                gestureOutput.className = 'output error';
                gestureOutput.innerText = `Keep practicing! You showed ${categoryName}, but we're looking for ${selectedLetter}`;
                
                if (gestureChanged) {
                    playSound(incorrectSound);
                }
            }
        } else {
            gestureOutput.className = 'output neutral';
            gestureOutput.innerText = `Detected letter: ${categoryName}\nConfidence: ${categoryScore}%`;
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

// Add sound toggle button to the UI
function createSoundToggle() {
    const soundToggle = document.createElement('button');
    soundToggle.id = 'soundToggle';
    soundToggle.className = 'control-btn sound-toggle';
    soundToggle.innerHTML = '🔊 Sound On';
    soundToggle.style.marginLeft = '10px';
    
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundToggle.innerHTML = '🔊 Sound On';
            playSound(selectSound); // Play a sound to confirm sound is on
        } else {
            soundToggle.innerHTML = '🔇 Sound Off';
        }
    });
    
    // Add the button next to the webcam button
    const webcamButton = document.getElementById('webcamButton');
    webcamButton.parentNode.insertBefore(soundToggle, webcamButton.nextSibling);
}

// Call the function to create the sound toggle button
createSoundToggle();
