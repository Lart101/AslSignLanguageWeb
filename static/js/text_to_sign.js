function translateText() {
    const inputText = document.getElementById('input-text').value;
    const imagesContainer = document.getElementById('translated-images');
    const videosContainer = document.getElementById('translated-videos');
    
    // Get selected mode
    const isAvatarMode = document.querySelector('input[name="mode"]:checked').value === 'avatar';
    
    // Clear previous translations
    imagesContainer.innerHTML = '';
    videosContainer.innerHTML = '';
    
    // Show appropriate container based on selected mode
    imagesContainer.style.display = isAvatarMode ? 'none' : 'flex';
    videosContainer.style.display = isAvatarMode ? 'flex' : 'none';
    
    if (inputText.trim() === '') {
        const warningElement = document.createElement('p');
        warningElement.className = 'warning';
        warningElement.textContent = 'Please enter some text to translate.';
        
        if (isAvatarMode) {
            videosContainer.appendChild(warningElement);
        } else {
            imagesContainer.appendChild(warningElement);
        }
        return;
    }
    
    // Filter out valid letters from the input text
    const validLetters = inputText.split('').filter(char => /[a-zA-Z]/.test(char)).map(char => char.toUpperCase());
    
    if (validLetters.length === 0) {
        const warningElement = document.createElement('p');
        warningElement.className = 'warning';
        warningElement.textContent = 'No valid letters found to translate. Please enter A-Z or a-z characters.';
        
        if (isAvatarMode) {
            videosContainer.appendChild(warningElement);
        } else {
            imagesContainer.appendChild(warningElement);
        }
        return;
    }
    
    if (isAvatarMode) {
        // Create combined video player for avatar mode
        createCombinedVideoPlayer(videosContainer, validLetters, inputText);
    } else {
        // Image mode - use static images as before
        for (let char of inputText) {
            if (/[a-zA-Z]/.test(char)) {
                const upperChar = char.toUpperCase();
                const container = document.createElement('div');
                container.className = 'sign-container';
                
                const img = document.createElement('img');
                img.src = `static/sign_language_images/alphabet_${upperChar}.jpg`;
                img.alt = `Sign for letter ${char}`;
                
                const letter = document.createElement('p');
                letter.textContent = char;
                
                container.appendChild(img);
                container.appendChild(letter);
                imagesContainer.appendChild(container);
            } else if (char === ' ') {
                const space = document.createElement('div');
                space.style.width = '40px';
                space.style.height = '120px';
                imagesContainer.appendChild(space);
            }
        }
    }
}

// Create a combined video player that plays all letters sequentially
function createCombinedVideoPlayer(container, validLetters, originalText) {
    // Create main container
    const combinedPlayerContainer = document.createElement('div');
    combinedPlayerContainer.className = 'combined-video-player';
    
    // Add title
    const titleElement = document.createElement('h3');
    titleElement.textContent = `Sign Language Translation: "${originalText}"`;
    combinedPlayerContainer.appendChild(titleElement);
    
    // Create video element and player structure
    const videoPlayer = document.createElement('div');
    videoPlayer.className = 'combined-player';
    
    // Video and current letter section
    const videoAndDisplay = document.createElement('div');
    videoAndDisplay.className = 'video-and-display';
    
    const video = document.createElement('video');
    video.id = 'combined-video';
    video.width = 320;
    video.height = 240;
    video.controls = false; // We'll add custom controls
    
    // Create a container for the current letter display
    const currentLetterDisplay = document.createElement('div');
    currentLetterDisplay.className = 'current-letter-display';
    currentLetterDisplay.innerHTML = '<span id="current-letter-indicator">Ready to start</span>';
    
    videoAndDisplay.appendChild(video);
    videoAndDisplay.appendChild(currentLetterDisplay);
    
    // Progress section
    const progressSection = document.createElement('div');
    progressSection.className = 'progress-section';
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.className = 'progress-bar';
    
    const progressStats = document.createElement('div');
    progressStats.className = 'progress-stats';
    progressStats.innerHTML = `
        <span id="progress-current">0</span> of <span id="progress-total">${validLetters.length}</span> letters
        <span id="progress-percentage">0%</span>
    `;
    
    progressContainer.appendChild(progressBar);
    progressSection.appendChild(progressContainer);
    progressSection.appendChild(progressStats);
    
    // Controls section
    const controlsSection = document.createElement('div');
    controlsSection.className = 'controls-section';
    
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'combined-video-controls';
    
    // Primary controls group
    const primaryControls = document.createElement('div');
    primaryControls.className = 'primary-controls';
    
    // Play button
    const playBtn = document.createElement('button');
    playBtn.className = 'control-btn play-btn';
    playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
    playBtn.id = 'combined-play-btn';
    
    // Pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'control-btn pause-btn';
    pauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause';
    pauseBtn.id = 'combined-pause-btn';
    
    // Restart button
    const restartBtn = document.createElement('button');
    restartBtn.className = 'control-btn restart-btn';
    restartBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg> Restart';
    restartBtn.id = 'combined-restart-btn';
    
    primaryControls.appendChild(playBtn);
    primaryControls.appendChild(pauseBtn);
    primaryControls.appendChild(restartBtn);
    
    // Speed control
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    speedControl.innerHTML = `
        <label for="combined-playback-speed">Playback Speed:</label>
        <select id="combined-playback-speed">
            <option value="0.5">0.5x (Slow)</option>
            <option value="0.75">0.75x</option>
            <option value="1" selected>1x (Normal)</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x (Fast)</option>
        </select>
    `;
    
    // Add controls to wrapper
    controlsWrapper.appendChild(primaryControls);
    controlsWrapper.appendChild(speedControl);
    controlsSection.appendChild(controlsWrapper);
    
    // Add letter sequence display
    const letterSequence = document.createElement('div');
    letterSequence.className = 'letter-sequence';
    letterSequence.innerHTML = '<h4 style="width:100%; margin-bottom:0.75rem; text-align:center;">Letter Sequence</h4>';
    
    // Create letter blocks
    for (let letter of originalText) {
        const letterSpan = document.createElement('span');
        letterSpan.className = 'sequence-letter';
        letterSpan.textContent = letter;
        if (!/[a-zA-Z]/.test(letter)) {
            letterSpan.className += ' non-letter';
        }
        letterSequence.appendChild(letterSpan);
    }
    
    // Add tips section
    const tipsSection = document.createElement('div');
    tipsSection.className = 'sign-language-tips';
    tipsSection.innerHTML = `
        <h4>Tips for Learning Sign Language</h4>
        <p>Pay attention to hand position and movement. Practice along with the videos to improve retention.</p>
    `;
    
    // Assemble video player
    videoPlayer.appendChild(videoAndDisplay);
    videoPlayer.appendChild(controlsSection);
    videoPlayer.appendChild(progressSection);
    videoPlayer.appendChild(letterSequence);
    videoPlayer.appendChild(tipsSection);
    
    combinedPlayerContainer.appendChild(videoPlayer);
    container.appendChild(combinedPlayerContainer);
    
    // Set up the video sequence player
    setupCombinedVideoPlayer(validLetters);
}

// Set up the video sequence functionality
function setupCombinedVideoPlayer(letters) {
    const video = document.getElementById('combined-video');
    const playBtn = document.getElementById('combined-play-btn');
    const pauseBtn = document.getElementById('combined-pause-btn');
    const restartBtn = document.getElementById('combined-restart-btn');
    const speedSelect = document.getElementById('combined-playback-speed');
    const progressBar = document.getElementById('progress-bar');
    const currentLetterIndicator = document.getElementById('current-letter-indicator');
    const progressCurrent = document.getElementById('progress-current');
    const progressTotal = document.getElementById('progress-total');
    const progressPercentage = document.getElementById('progress-percentage');
    const letterElements = document.querySelectorAll('.sequence-letter');
    
    let currentLetterIndex = 0;
    let videoSequence = [];
    
    // Create an array of letter videos with their sources
    for (let letter of letters) {
        videoSequence.push({
            letter: letter,
            src: `static/sign_language_gif/${letter}.mp4`
        });
    }
    
    // Function to load and play the current letter's video
    function playCurrentLetter() {
        if (currentLetterIndex < videoSequence.length) {
            const currentVideo = videoSequence[currentLetterIndex];
            video.src = currentVideo.src;
            video.load();
            
            // Update current letter display
            currentLetterIndicator.textContent = `Now signing: "${currentVideo.letter}"`;
            
            // Highlight current letter in sequence and mark completed ones
            letterElements.forEach((el, index) => {
                el.classList.remove('active');
                
                // Find the corresponding index in the original text
                let letterIndex = 0;
                let count = 0;
                for (let i = 0; i < letterElements.length; i++) {
                    if (/[a-zA-Z]/.test(letterElements[i].textContent)) {
                        if (count === currentLetterIndex) {
                            letterIndex = i;
                            break;
                        }
                        count++;
                    }
                }
                
                if (index === letterIndex) {
                    el.classList.add('active');
                }
                
                // Mark completed letters
                if (count < currentLetterIndex && /[a-zA-Z]/.test(letterElements[i].textContent)) {
                    letterElements[i].classList.add('completed');
                }
            });
            
            // Update progress indicators
            progressCurrent.textContent = currentLetterIndex + 1;
            const progress = ((currentLetterIndex + 1) / videoSequence.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressPercentage.textContent = `${Math.round(progress)}%`;
            
            // Set playback speed
            video.playbackRate = parseFloat(speedSelect.value);
            
            // Play the video
            video.play();
        } else {
            // End of sequence
            currentLetterIndicator.textContent = "✓ Translation completed";
            progressBar.style.width = "100%";
            progressPercentage.textContent = "100%";
            
            // Mark all letters as completed
            letterElements.forEach(el => {
                if (/[a-zA-Z]/.test(el.textContent)) {
                    el.classList.remove('active');
                    el.classList.add('completed');
                }
            });
        }
    }
    
    // Event listener for when a video ends
    video.addEventListener('ended', function() {
        currentLetterIndex++;
        if (currentLetterIndex < videoSequence.length) {
            playCurrentLetter();
        } else {
            // Reset to beginning after showing "Completed"
            setTimeout(() => {
                currentLetterIndex = 0;
                currentLetterIndicator.textContent = "Ready to start";
                progressBar.style.width = "0%";
                progressCurrent.textContent = "0";
                progressPercentage.textContent = "0%";
                letterElements.forEach(el => {
                    el.classList.remove('active');
                    el.classList.remove('completed');
                });
            }, 3000);
        }
    });
    
    // Play button event
    playBtn.addEventListener('click', function() {
        if (video.paused) {
            if (currentLetterIndex >= videoSequence.length) {
                currentLetterIndex = 0;
                letterElements.forEach(el => {
                    el.classList.remove('active');
                    el.classList.remove('completed');
                });
            }
            playCurrentLetter();
        } else {
            video.play();
        }
    });
    
    // Pause button event
    pauseBtn.addEventListener('click', function() {
        video.pause();
    });
    
    // Restart button event
    restartBtn.addEventListener('click', function() {
        currentLetterIndex = 0;
        letterElements.forEach(el => {
            el.classList.remove('active');
            el.classList.remove('completed');
        });
        playCurrentLetter();
    });
    
    // Speed change event
    speedSelect.addEventListener('change', function() {
        video.playbackRate = parseFloat(this.value);
    });
    
    // Initialize with ready state
    currentLetterIndicator.textContent = "Ready to start";
    progressTotal.textContent = videoSequence.length;
}

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const controlsPanel = document.getElementById('video-controls-panel');
    
    // Mode selection change event
    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const imagesContainer = document.getElementById('translated-images');
            const videosContainer = document.getElementById('translated-videos');
            
            if (this.value === 'avatar') {
                // Switch to Avatar mode
                imagesContainer.style.display = 'none';
                videosContainer.style.display = 'flex';
                controlsPanel.style.display = 'flex'; // Show video controls
            } else {
                // Switch to Image mode
                imagesContainer.style.display = 'flex';
                videosContainer.style.display = 'none';
                controlsPanel.style.display = 'none'; // Hide video controls
            }
            
            // Clear current translations when switching modes
            imagesContainer.innerHTML = '';
            videosContainer.innerHTML = '';
        });
    });
    
    // Playback speed change event
    document.getElementById('playback-speed').addEventListener('change', updatePlaybackSpeed);
    
    // Global control buttons events
    document.getElementById('play-all-btn').addEventListener('click', playAllVideos);
    document.getElementById('pause-all-btn').addEventListener('click', pauseAllVideos);
    document.getElementById('restart-all-btn').addEventListener('click', restartAllVideos);
    
    // Mobile menu toggle
    document.querySelector('.menu-toggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('nav').classList.toggle('active');
    });
    
    // Initialize UI state based on default mode
    const defaultMode = document.querySelector('input[name="mode"]:checked').value;
    if (defaultMode === 'avatar') {
        controlsPanel.style.display = 'flex';
    } else {
        controlsPanel.style.display = 'none';
    }
});

// Global video control functions (for backward compatibility)
function updatePlaybackSpeed() {
    const speed = document.getElementById('playback-speed').value;
    const combinedVideo = document.getElementById('combined-video');
    
    if (combinedVideo) {
        combinedVideo.playbackRate = parseFloat(speed);
    } else {
        const videos = document.querySelectorAll('#translated-videos video');
        videos.forEach(video => {
            video.playbackRate = parseFloat(speed);
        });
    }
}

function playAllVideos() {
    const combinedVideo = document.getElementById('combined-video');
    if (combinedVideo) {
        document.getElementById('combined-play-btn').click();
    } else {
        const videos = document.querySelectorAll('#translated-videos video');
        videos.forEach(video => video.play());
    }
}

function pauseAllVideos() {
    const combinedVideo = document.getElementById('combined-video');
    if (combinedVideo) {
        document.getElementById('combined-pause-btn').click();
    } else {
        const videos = document.querySelectorAll('#translated-videos video');
        videos.forEach(video => video.pause());
    }
}

function restartAllVideos() {
    const combinedVideo = document.getElementById('combined-video');
    if (combinedVideo) {
        document.getElementById('combined-restart-btn').click();
    } else {
        const videos = document.querySelectorAll('#translated-videos video');
        videos.forEach(video => {
            video.currentTime = 0;
            video.play();
        });
    }
}