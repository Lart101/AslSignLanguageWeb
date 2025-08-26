# ASL Sign Language Web Application

⚠️ **DISCLAIMER: This project is created for educational purposes only as part of a capstone project. It is not intended for commercial use.**

An interactive Progressive Web Application (PWA) for learning and practicing American Sign Language (ASL). The application includes features for alphabet learning, text-to-sign conversion, and real-time sign language recognition through webcam.

## 🚀 Live Demo
Visit the live website: [ASL Sign Language Web](https://lart101.github.io/AslSignLanguageWeb/)

### 📱 Install as App
Visit [Download Page](https://lart101.github.io/AslSignLanguageWeb/download.html) for instructions to install this as an app on your device!

## ✨ Features
- **📚 ASL Alphabet Learning** - Interactive alphabet with images and videos
- **✍️ Text to Sign Language Conversion** - Convert text to ASL signs
- **📷 Real-time Sign Language Recognition** - Live webcam gesture detection
- **🖼️ Image-based Sign Language Detection** - Upload images for analysis
- **📱 Progressive Web App** - Install and use offline like a native app
- **🎯 Responsive Design** - Works on mobile, tablet, and desktop

## 🛠️ Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI/ML**: MediaPipe Gesture Recognizer 
  - Powered by Google's AI technology for real-time hand gesture recognition
  - [MediaPipe Vision Solutions](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)
- **PWA**: Service Workers, Web App Manifest
- **Deployment**: GitHub Pages

## 🚀 Deployment

### GitHub Pages Setup
1. **Push to GitHub**: Make sure all files are committed to your repository
2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" or "master" branch
   - Select "/ (root)" folder
   - Click "Save"
3. **Access your site**: Your app will be available at `https://yourusername.github.io/repositoryname/`

### PWA Requirements for Production
- ✅ HTTPS (automatically provided by GitHub Pages)
- ✅ Web App Manifest (`manifest.json`)
- ✅ Service Worker (`service-worker.js`)
- ⚠️ App Icons (you need to create `icon-192.png` and `icon-512.png`)

### Creating App Icons
1. Create two PNG icons:
   - `static/image/icon-192.png` (192×192 pixels)
   - `static/image/icon-512.png` (512×512 pixels)
2. Use tools like:
   - [Favicon.io](https://favicon.io/) - Free icon generator
   - [RealFaviconGenerator](https://realfavicongenerator.net/) - Advanced PWA icons
   - [Canva](https://canva.com) - Design custom icons

## 🧠 Model Training
The gesture recognition model was trained using Google Colab. The training notebook can be found here:
[MediaPipe Gesture Recognizer Training Notebook](https://colab.research.google.com/github/googlesamples/mediapipe/blob/main/examples/customization/gesture_recognizer.ipynb)

## 📊 Datasets
The project utilizes the following datasets for training and development:
- [ASL Dataset by Ayuraj](https://www.kaggle.com/datasets/ayuraj/asl-dataset)
- [American Sign Language Dataset by Kapil Londhe](https://www.kaggle.com/datasets/kapillondhe/american-sign-language)

## 🎯 Browser Support

### PWA Installation Support
- ✅ **Chrome** (Android/Desktop) - Full PWA support
- ✅ **Edge** (Windows/Android) - Full PWA support  
- ✅ **Samsung Internet** (Android) - Full PWA support
- ✅ **Safari** (iOS/macOS) - Add to Home Screen
- ⚠️ **Firefox** - Limited PWA support

### Webcam/MediaPipe Support
- ✅ Chrome/Chromium browsers
- ✅ Edge
- ✅ Firefox (recent versions)
- ⚠️ Safari (limited MediaPipe support)

## 🙏 Credits
- ASL Alphabet Chart images courtesy of [Super Star Worksheets](https://superstarworksheets.com/asl/asl-alphabet/asl-alphabet-chart/)
- Sound effects from [Pixabay](https://pixabay.com/sound-effects/)
- Model implementation using [Google's MediaPipe Solutions](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)

## 📄 License
Please note that while this project is open source, the datasets and resources used have their own licensing terms. Make sure to comply with their respective licenses when using or redistributing this project.

## 📞 Contact
For questions or feedback about this project, please open an issue on the GitHub repository.