# ASL Learning Web Application

⚠️ **IMPORTANT DISCLAIMER: This is a student capstone project created for educational purposes only. It is not a professional ASL learning tool and should not be considered a substitute for proper ASL instruction or professional learning resources.**

This is a simple web application that attempts to help with basic American Sign Language (ASL) learning. As a student project, it has many limitations and is still in development.

## Live Demo
You can try the application here: [ASL Web App](https://lart101.github.io/AslSignLanguageWeb/)

**Please note:** The gesture recognition may not be very accurate and works best in good lighting conditions.

## Features Available

### Learning Modules
- **ASL Alphabet**: Interactive alphabet learning with visual reference images
- **Numbers (0-9)**: Number signs with visual demonstrations
- **Basic Words**: Common signs like Hello, Goodbye, Please, Thank You, Yes, No
- **Colors**: Color signs including Red, Blue, Green, Yellow, Orange, Purple, Black, White
- **Family**: Family-related signs like Mother, Father, Boy, Girl, Baby
- **Food**: Food-related signs like Apple, Water, Milk, Pizza, Eat, Drink

### Interactive Tools
- **Text to Sign Converter**: Input text and see corresponding ASL sign images
- **Image to Sign Recognition**: Upload images to attempt sign recognition
- **Real-time Webcam Recognition**: Live gesture recognition through your camera
- **Challenge Games**: Three game modes for practice:
  - **Flash Sign Mode**: Timed challenges to perform specific signs
  - **Sign Match Mode**: Match videos to signs and then demonstrate
  - **Endless Mode**: Continuous Timed challenges to perform random signs

### User Interface Features
- **Model Selection**: Switch between different AI models (Alphabet, Numbers, Colors, etc.)
- **Sound Effects**: Audio feedback for correct/incorrect answers
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Progress Tracking**: Score tracking and performance feedback
- **Power-ups**: Reveal power in challenge games to see correct demonstrations

### Technical Features
- **Multiple AI Models**: Custom trained models for different sign categories
- **Real-time Processing**: Live gesture recognition and feedback
- **Video Demonstrations**: Reference videos for proper sign execution
- **Cross-browser Compatibility**: Works on modern web browsers
- **No Installation Required**: Runs directly in web browser

## Current Limitations
- Gesture recognition accuracy varies significantly
- Works best with good lighting and clear hand positioning
- Limited vocabulary (mainly alphabet and basic words)
- Not suitable for comprehensive ASL learning 
- May not work well on all devices or browsers

## Technologies Used
- HTML5, CSS3, JavaScript
- MediaPipe Gesture Recognizer (Google's AI technology)
- Custom trained models using available datasets

## How The Models Were Created
The gesture recognition models were trained using Google Colab with publicly available datasets. This was a learning exercise in machine learning, and the resulting models have limited accuracy.

Training notebook reference: [MediaPipe Gesture Recognizer Training](https://colab.research.google.com/github/googlesamples/mediapipe/blob/main/examples/customization/gesture_recognizer.ipynb)

## Datasets Used
This project used public datasets for learning purposes:
- [ASL Dataset by Ayuraj](https://www.kaggle.com/datasets/ayuraj/asl-dataset)
- [American Sign Language Dataset by Kapil Londhe](https://www.kaggle.com/datasets/kapillondhe/american-sign-language)

## Acknowledgments
- ASL reference images from [Super Star Worksheets](https://superstarworksheets.com/asl/asl-alphabet/asl-alphabet-chart/)
- Sound effects from [Pixabay](https://pixabay.com/sound-effects/)
- Built using [Google's MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)
- Created as part of an academic capstone project

## Important Notes
- This is a learning project by a student, not a professional tool
- For serious ASL learning, please use proper educational resources and instruction
- The gesture recognition is experimental and may not be reliable
- Please respect the licensing terms of all datasets and resources used

## Feedback
As this is a student project, constructive feedback is welcome through GitHub issues. Please keep in mind this is a learning exercise.