# SignSpeak - ASL Sign Language Learning Web Application

```
   🖐️ SignSpeak
   ASL Learning Made Interactive
```

## Overview
SignSpeak is a web-based application designed to help users learn American Sign Language (ASL). The application provides an interactive platform for learning the ASL alphabet through real-time hand gesture recognition using MediaPipe.

## Visual Guide to Hand Landmarks
```
![alt text](https://ai.google.dev/static/edge/mediapipe/images/solutions/hand-landmarks.png)

## ASL Alphabet Reference
```
Directory Structure:
📁 sign_language_images/
 ├── 🖼️ alphabet_A.jpg - ASL Sign for 'A'
 ├── 🖼️ alphabet_B.jpg - ASL Sign for 'B'
 ├── 🖼️ alphabet_C.jpg - ASL Sign for 'C'
 └── ... (and so on for all letters)
```

## Features

### 1. ASL Alphabet Learning
- Complete ASL alphabet (A-Z) with visual references
- Clear images demonstrating proper hand positions for each letter
- Quick navigation links to jump to specific letters
- Detailed instructions for forming each hand sign

### 2. Real-time Practice
- Live webcam integration for practice
- Real-time hand tracking and gesture recognition
- Instant feedback on sign accuracy
- Visual hand landmark tracking
- Confidence score display

### 3. Interactive Interface
- Clean, modern UI design
- Responsive layout that works on different screen sizes
- Easy navigation between different sections
- Visual feedback for selected letters and correct gestures

## Project Structure
```
AslSignLanguageWeb/
├── alphabet.html        # ASL alphabet learning page
├── image_to_sign.html   # Image to sign translation page
├── index.html          # Home page
├── text_to_sign.html   # Text to sign translation page
├── webcam.html         # Webcam practice page
└── sign_language_images/
    ├── alphabet_A.jpg
    ├── alphabet_B.jpg
    └── ...             # All alphabet images A-Z
```

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- MediaPipe Tasks Vision (v0.10.3)
  - Gesture Recognizer Solution
  - Hand Landmarker Model
- WebRTC (for webcam access)
- Canvas API (for drawing hand landmarks)

## Key Components

### MediaPipe Gesture Recognizer Integration
The application uses MediaPipe's GestureRecognizer solution for:
- Real-time hand tracking with 21 3D landmarks per hand
- Custom gesture recognition for ASL alphabet signs
- Gesture classification with confidence scores
- Support for both static hand poses and dynamic gestures
- Optimized edge computing performance
- Built-in hand landmark visualization

Technical Specifications:
- Model: MediaPipe Gesture Recognizer task
- Input: Live video stream from webcam
- Output: 
  - Hand landmarks (21 points per hand)
  - Gesture classification
  - Confidence scores
  - Hand presence detection
- Performance: Real-time processing on modern browsers
- Supported Gestures: Customized for ASL alphabet recognition

Implementation Details:
- Uses the MediaPipe Tasks Vision JavaScript API
- Requires the gesture_recognizer.task file
- Runs entirely client-side for privacy
- Optimized for both desktop and mobile devices
- Supports multiple hand tracking simultaneously

### MediaPipe Vision Integration
```
Webcam Input → MediaPipe Processing → Hand Detection
      ↓                    ↓                ↓
Video Feed     →    Landmark Detection   →  ASL Recognition
      ↓                    ↓                ↓
Real-time Display  ←   Visualization    ←  Gesture Analysis
```

## Getting Started

1. Clone the repository
2. Ensure you have a modern web browser with webcam support
3. Open index.html in your web browser

## Browser Compatibility
- Chrome (recommended)
- Firefox
- Edge
- Safari (requires WebKit)

## Notes
- Requires webcam access for practice features
- Uses GPU acceleration when available
- Internet connection required for MediaPipe models

## Future Enhancements
- Word-level sign language recognition
- Multiple hand gesture support
- Custom gesture recording
- Practice mode with scoring
- Mobile app version

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is part of a Capstone Project. All rights reserved.

## Dataset
This project uses the ASL Dataset from Kaggle:
- Source: [ASL Dataset on Kaggle](https://www.kaggle.com/datasets/ayuraj/asl-dataset/data)
- Contents: High-quality ASL alphabet images (A-Z)
- Format: JPG images
- Usage: Training and reference material for ASL alphabet recognition


## Credits
- Hand gesture recognition powered by [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)
- ASL alphabet images sourced from [Kaggle ASL Dataset](https://www.kaggle.com/datasets/ayuraj/asl-dataset/data)
- Developed as part of the Capstone Project


## Additional Resources
- [MediaPipe Documentation](https://ai.google.dev/edge/mediapipe)
- [Gesture Recognizer API Reference](https://developers.google.com/mediapipe/api/solutions/js/tasks-vision.gesturerecognizer)
- [Hand Landmarker Documentation](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)