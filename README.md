# ASL Sign Language Web Application

⚠️ **DISCLAIMER: This project is created for educational purposes only as part of a capstone project. It is not intended for commercial use.**

An interactive web application for learning and practicing American Sign Language (ASL). The application includes features for alphabet learning, text-to-sign conversion, and real-time sign language recognition through webcam.

## Live Demo
Visit the live website: [ASL Sign Language Web](https://lart101.github.io/AslSignLanguageWeb/)

## Features
- ASL Alphabet Learning
- Text to Sign Language Conversion
- Real-time Sign Language Recognition via Webcam
- Image-based Sign Language Detection

## Technologies Used
- HTML5
- CSS3
- JavaScript
- MediaPipe Gesture Recognizer 
  - Powered by Google's AI technology for real-time hand gesture recognition
  - [MediaPipe Vision Solutions](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)

## Model Training
The gesture recognition model was trained using Google Colab. The training notebook can be found here:
[MediaPipe Gesture Recognizer Training Notebook](https://colab.research.google.com/github/googlesamples/mediapipe/blob/main/examples/customization/gesture_recognizer.ipynb)

## Datasets
The project utilizes the following datasets for training and development:
- [ASL Dataset by Ayuraj](https://www.kaggle.com/datasets/ayuraj/asl-dataset)
- [American Sign Language Dataset by Kapil Londhe](https://www.kaggle.com/datasets/kapillondhe/american-sign-language)

## Credits
- ASL Alphabet Chart images courtesy of [Super Star Worksheets](https://superstarworksheets.com/asl/asl-alphabet/asl-alphabet-chart/)
- Model implementation using [Google's MediaPipe Solutions](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)

## License
Please note that while this project is open source, the datasets and resources used have their own licensing terms. Make sure to comply with their respective licenses when using or redistributing this project.

## Contact
For questions or feedback about this project, please open an issue on the GitHub repository.