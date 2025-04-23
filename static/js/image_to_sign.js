import { GESTURE_MODEL_URL } from './config.js';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let gestureRecognizer;
let runningMode = "IMAGE";

// Initialize the GestureRecognizer
const createGestureRecognizer = async () => {
   try {
       const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
       gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
           baseOptions: {
               modelAssetPath: GESTURE_MODEL_URL,
               delegate: "GPU"
           },
           runningMode: runningMode
       });
       console.log("Gesture recognizer created successfully");
   } catch (error) {
       console.error("Error creating gesture recognizer:", error);
   }
};
createGestureRecognizer();

const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

// Add image selection indicator
document.getElementById('image-upload').addEventListener('change', (e) => {
   const fileInput = e.target;
   const file = fileInput.files[0];
   const uploadText = document.getElementById('upload-text');
   
   if (file) {
       uploadText.innerText = `Selected image: ${file.name}`;
       uploadText.style.display = 'block';
   } else {
       uploadText.innerText = '';
       uploadText.style.display = 'none';
   }
});

// Image Upload and Processing
document.getElementById('upload-form').addEventListener('submit', async (e) => {
   e.preventDefault();
   const fileInput = document.getElementById('image-upload');
   const file = fileInput.files[0];
   
   if (!file) {
       alert('Please select an image file.');
       return;
   }

   const loadingIndicator = document.getElementById('loading-indicator');
   const gestureOutput = document.getElementById('gesture_output');
   const uploadText = document.getElementById('upload-text');
   const canvasElement = document.getElementById('output_canvas');

   loadingIndicator.style.display = 'block';
   gestureOutput.style.display = 'none';
   uploadText.innerText = '';

   try {
       const imageUrl = URL.createObjectURL(file);
       const img = new Image();
       
       img.onload = async () => {
           // Wait for gesture recognizer to be ready
           while (!gestureRecognizer) {
               await new Promise(resolve => setTimeout(resolve, 100));
           }

           // Calculate dimensions while maintaining aspect ratio
           const maxWidth = 640;
           const maxHeight = 480;
           let width = img.width;
           let height = img.height;
           
           if (width > maxWidth || height > maxHeight) {
               const ratio = Math.min(maxWidth / width, maxHeight / height);
               width = width * ratio;
               height = height * ratio;
           }

           // Set canvas dimensions
           canvasElement.width = width;
           canvasElement.height = height;
           canvasCtx.clearRect(0, 0, width, height);
           
           // Draw image with proper sizing
           canvasCtx.drawImage(img, 0, 0, width, height);

           // Create new ImageData for processing
           const imageData = canvasCtx.getImageData(0, 0, width, height);

           try {
               // Perform gesture recognition
               const results = gestureRecognizer.recognize(imageData);
               
               console.log("Recognition results:", results); // Debug log

               loadingIndicator.style.display = 'none';
               canvasElement.style.display = 'block';

               if (results && results.gestures && results.gestures.length > 0) {
                   // Draw landmarks if detected
                   if (results.landmarks && results.landmarks.length > 0) {
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

                   gestureOutput.style.display = 'block';
                   const categoryName = results.gestures[0][0].categoryName;
                   const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
                   const handedness = results.handednesses[0][0].displayName;
                   gestureOutput.innerText = `Detected Sign: ${categoryName}\nConfidence: ${categoryScore}%`;
               } else {
                   gestureOutput.style.display = 'block';
                   gestureOutput.innerText = 'No hand signs detected in the image. Please ensure your hand is clearly visible in the image.';
               }
           } catch (recognitionError) {
               console.error("Recognition error:", recognitionError);
               gestureOutput.style.display = 'block';
               gestureOutput.innerText = 'Error analyzing the image. Please try again with a different image.';
           }

           // Clean up
           URL.revokeObjectURL(imageUrl);
       };

       img.src = imageUrl;

       img.onerror = () => {
           loadingIndicator.style.display = 'none';
           uploadText.innerText = 'Error loading the image.';
           URL.revokeObjectURL(imageUrl);
       };
   } catch (error) {
       console.error("Processing error:", error);
       loadingIndicator.style.display = 'none';
       uploadText.innerText = 'An error occurred while processing the image.';
   }
});

document.querySelector('.menu-toggle').addEventListener('click', function() {
   this.classList.toggle('active');
   document.querySelector('nav').classList.toggle('active');
});
