import { getGestureModelUrl, loadModelWithProgress, createModelSelector, getModelUrl } from './config.js';

import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let gestureRecognizer;
let runningMode = "IMAGE";
let webcamRunning = false;
let modelLoading = false;
let currentModel = 'alphabet'; // Track currently selected model
const videoHeight = "480px";
const videoWidth = "640px";

// Initialize the GestureRecognizer with progress
const createGestureRecognizer = async (modelCategory = null) => {
    if (modelLoading) return;
    
    try {
        modelLoading = true;
        const modelUrl = modelCategory ? getModelUrl(modelCategory) : getGestureModelUrl();
        gestureRecognizer = await loadModelWithProgress(modelUrl, {
            runningMode: runningMode,
            delegate: "GPU"
        });
        if (modelCategory) {
            currentModel = modelCategory;
        }
        modelLoading = false;
        console.log('Model loaded successfully!');
    } catch (error) {
        modelLoading = false;
        console.error('Failed to load model:', error);
        alert('Failed to load AI model. Please refresh the page and try again.');
    }
};

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const enableWebcamButton = document.getElementById("webcamButton");

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
    enableWebcamButton.textContent = "Webcam Not Supported";
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

    if (webcamRunning) {
        webcamRunning = false;
        enableWebcamButton.textContent = "Enable Camera";
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    } else {
        webcamRunning = true;
        enableWebcamButton.textContent = "Disable Camera";
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
        // Remove handedness display
        gestureOutput.innerText = `Detected Sign: ${categoryName}\nConfidence: ${categoryScore}%`;
    } else {
        gestureOutput.style.display = "none";
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Initialize model selector
function initializeModelSelector() {
    const onModelChange = async (newModel) => {
        console.log(`Switching to model: ${newModel}`);
        
        // Show loading indicator
        gestureOutput.style.display = "block";
        gestureOutput.innerText = "Loading new model...";
        
        try {
            // Load new model
            await createGestureRecognizer(newModel);
            gestureOutput.innerText = `Model switched to: ${newModel}. Ready for detection.`;
            
            // Clear after a few seconds
            setTimeout(() => {
                gestureOutput.style.display = "none";
            }, 3000);
        } catch (error) {
            console.error('Failed to switch model:', error);
            gestureOutput.innerText = "Failed to load new model. Please try again.";
        }
    };
    
    createModelSelector('model-selection-container', onModelChange, currentModel);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    createGestureRecognizer();
    initializeModelSelector();
});

document.querySelector('.menu-toggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('nav').classList.toggle('active');
});
