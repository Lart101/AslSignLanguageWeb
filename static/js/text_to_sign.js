function translateText() {
    const inputText = document.getElementById('input-text').value;
    const imagesContainer = document.getElementById('translated-images');
    const videosContainer = document.getElementById('translated-videos');
    
    // Get selected mode from dropdown instead of radio buttons
    const isAvatarMode = document.getElementById('display-mode').value === 'avatar';
    
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
    
    // Create video element and player structure with flex layout
    const videoPlayer = document.createElement('div');
    videoPlayer.className = 'combined-player';
    videoPlayer.style.display = 'flex';
    videoPlayer.style.flexDirection = 'column'; // Main container is a column
    
    // Create a row container for video+controls and progress+sequence
    const rowContainer = document.createElement('div');
    rowContainer.style.display = 'flex';
    rowContainer.style.flexDirection = 'row';
    rowContainer.style.gap = '20px';
    rowContainer.style.alignItems = 'flex-start';
    
    // Left column: Video and Controls - now 50% of the space
    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.width = '50%'; // Increased to 50% of available space
    
    // Video and current letter section
    const videoAndDisplay = document.createElement('div');
    videoAndDisplay.className = 'video-and-display';
    
    const video = document.createElement('video');
    video.id = 'combined-video';
    video.style.width = '100%'; // Make video fill the column
    video.style.height = 'auto'; // Keep aspect ratio
    video.controls = false; // We'll add custom controls
    
    // Create a container for the current letter display
    const currentLetterDisplay = document.createElement('div');
    currentLetterDisplay.className = 'current-letter-display';
    currentLetterDisplay.innerHTML = '<span id="current-letter-indicator">Ready to start</span>';
    
    videoAndDisplay.appendChild(video);
    videoAndDisplay.appendChild(currentLetterDisplay);
    
    // Controls section - now horizontally aligned
    const controlsSection = document.createElement('div');
    controlsSection.className = 'controls-section';
    controlsSection.style.marginTop = '10px';
    
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'combined-video-controls';
    controlsWrapper.style.display = 'flex';
    controlsWrapper.style.flexDirection = 'row';
    controlsWrapper.style.alignItems = 'center';
    controlsWrapper.style.justifyContent = 'space-between';
    
    // Primary controls group - now horizontal
    const primaryControls = document.createElement('div');
    primaryControls.className = 'primary-controls';
    primaryControls.style.display = 'flex';
    primaryControls.style.flexDirection = 'row';
    primaryControls.style.gap = '10px';
    
    // Play/Pause toggle button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'control-btn play-btn';
    playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
    playPauseBtn.id = 'combined-play-pause-btn';
    playPauseBtn.dataset.state = 'paused';
    
    // Restart button
    const restartBtn = document.createElement('button');
    restartBtn.className = 'control-btn restart-btn';
    restartBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg> Restart';
    restartBtn.id = 'combined-restart-btn';
    
    primaryControls.appendChild(playPauseBtn);
    primaryControls.appendChild(restartBtn);
    
    // Speed control - part of the horizontal row
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    speedControl.style.display = 'flex';
    speedControl.style.alignItems = 'center';
    speedControl.style.gap = '5px';
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
    
    // Add video and controls to the left column
    leftColumn.appendChild(videoAndDisplay);
    leftColumn.appendChild(controlsSection);
    
    // Right column: Progress and Letter Sequence
    const rightColumn = document.createElement('div');
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.flex = '1';
    
    // Progress section - now on the right
    const progressSection = document.createElement('div');
    progressSection.className = 'progress-section';
    progressSection.style.marginBottom = '20px';
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.className = 'progress-bar';
    
    progressContainer.appendChild(progressBar);
    progressSection.appendChild(progressContainer);
    
    // Add letter sequence display - also on the right
    const letterSequence = document.createElement('div');
    letterSequence.className = 'letter-sequence';
    letterSequence.style.marginTop = '20px';
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
    
    // Add progress and letter sequence to right column
    rightColumn.appendChild(progressSection);
    rightColumn.appendChild(letterSequence);
    
    // Add left and right columns to row container
    rowContainer.appendChild(leftColumn);
    rowContainer.appendChild(rightColumn);
    
    // Add tips section - remains at the bottom
    const tipsSection = document.createElement('div');
    tipsSection.className = 'sign-language-tips';
    tipsSection.style.marginTop = '20px';
    tipsSection.innerHTML = `
        <h4>Tips for Learning Sign Language</h4>
        <p>Pay attention to hand position and movement. Practice along with the videos to improve retention.</p>
    `;
    
    // Assemble video player
    videoPlayer.appendChild(rowContainer);
    videoPlayer.appendChild(tipsSection);
    
    combinedPlayerContainer.appendChild(videoPlayer);
    container.appendChild(combinedPlayerContainer);
    
    // Set up the video sequence player
    setupCombinedVideoPlayer(validLetters);
}

// Set up the video sequence functionality
function setupCombinedVideoPlayer(letters) {
    const video = document.getElementById('combined-video');
    const playPauseBtn = document.getElementById('combined-play-pause-btn');
    const restartBtn = document.getElementById('combined-restart-btn');
    const speedSelect = document.getElementById('combined-playback-speed');
    const progressBar = document.getElementById('progress-bar');
    const currentLetterIndicator = document.getElementById('current-letter-indicator');
    const letterElements = document.querySelectorAll('.sequence-letter');
    
    let currentLetterIndex = 0;
    let videoSequence = [];
    let isPlaying = false; // Track if playback is in progress
    
    // Create an array of letter videos with their sources
    for (let letter of letters) {
        videoSequence.push({
            letter: letter,
            src: `static/sign_language_gif/${letter}.mp4`
        });
    }
    
    // Function to update play/pause button appearance
    function updatePlayPauseButton(playing) {
        if (playing) {
            playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause';
            playPauseBtn.dataset.state = 'playing';
            playPauseBtn.className = 'control-btn pause-btn'; // Apply pause styling
        } else {
            playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
            playPauseBtn.dataset.state = 'paused';
            playPauseBtn.className = 'control-btn play-btn'; // Apply play styling
        }
    }
    
    // Function to load and play the current letter's video
    function playCurrentLetter() {
        if (currentLetterIndex < videoSequence.length) {
            const currentVideo = videoSequence[currentLetterIndex];
            video.src = currentVideo.src;
            video.load();
            isPlaying = true;
            
            // Update play/pause button
            updatePlayPauseButton(true);
            
            // Update current letter display
            currentLetterIndicator.textContent = `Now signing: "${currentVideo.letter}"`;
            
            // Highlight current letter in sequence and mark completed ones
            updateLetterHighlighting();
            
            // Update progress indicators
            updateProgressIndicators();
            
            // Set playback speed
            video.playbackRate = parseFloat(speedSelect.value);
            
            // Play the video
            const playPromise = video.play();
            
            // Handle play promise to avoid race conditions
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Playback error:', error);
                    isPlaying = false;
                    updatePlayPauseButton(false);
                });
            }
        } else {
            // End of sequence
            isPlaying = false;
            updatePlayPauseButton(false);
            currentLetterIndicator.textContent = "✓ Translation completed";
            progressBar.style.width = "100%";
            
            // Mark all letters as completed
            letterElements.forEach(el => {
                if (/[a-zA-Z]/.test(el.textContent)) {
                    el.classList.remove('active');
                    el.classList.add('completed');
                }
            });
        }
    }
    
    // Helper function to update letter highlighting
    function updateLetterHighlighting() {
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
            if (count < currentLetterIndex && /[a-zA-Z]/.test(el.textContent)) {
                el.classList.add('completed');
            } else if (count >= currentLetterIndex) {
                el.classList.remove('completed');
            }
        });
    }
    
    // Helper function to update progress indicators
    function updateProgressIndicators() {
        const progress = ((currentLetterIndex + 1) / videoSequence.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Event listener for when a video ends
    video.addEventListener('ended', function() {
        isPlaying = false;
        updatePlayPauseButton(false);
        currentLetterIndex++;
        if (currentLetterIndex < videoSequence.length) {
            playCurrentLetter();
        } else {
            // Reset to beginning after showing "Completed"
            setTimeout(() => {
                currentLetterIndex = 0;
                currentLetterIndicator.textContent = "Click PLAY to start";
                progressBar.style.width = "0%";
                letterElements.forEach(el => {
                    el.classList.remove('active');
                    el.classList.remove('completed');
                });
            }, 3000);
        }
    });
    
    // Play/Pause button event
    playPauseBtn.addEventListener('click', function() {
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
            video.pause();
            isPlaying = false;
            updatePlayPauseButton(false);
        }
    });
    
    // Restart button event
    restartBtn.addEventListener('click', function() {
        // Stop current playback if any
        video.pause();
        isPlaying = false;
        updatePlayPauseButton(false);
        
        // Reset to first letter
        currentLetterIndex = 0;
        
        // Reset all letter highlighting
        letterElements.forEach(el => {
            el.classList.remove('active');
            el.classList.remove('completed');
        });
        
        // Reset progress indicators
        progressBar.style.width = "0%";
        
        // Update text
        currentLetterIndicator.textContent = "Click PLAY to start";
        
        // Small delay to ensure proper reset before starting again
        setTimeout(() => {
            playCurrentLetter();
        }, 50);
    });
    
    // Speed change event
    speedSelect.addEventListener('change', function() {
        video.playbackRate = parseFloat(this.value);
    });
    
    // Initialize with ready state
    currentLetterIndicator.textContent = "Click PLAY to start";
}

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const displayModeSelect = document.getElementById('display-mode');
    const controlsPanel = document.getElementById('video-controls-panel');
    const inputText = document.getElementById('input-text');
    const charCounter = document.getElementById('char-count');
    
    // Initialize character counter
    updateCharCount();
    
    // Add input event listener to textarea for character counting and validation
    inputText.addEventListener('input', function() {
        // Filter out non-alphabetic characters
        const value = this.value;
        const filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
        
        // If the value changed (non-alphabetic characters were removed), update the textarea
        if (value !== filteredValue) {
            this.value = filteredValue;
            
            // Visual feedback that an invalid character was attempted
            this.classList.add('invalid');
            setTimeout(() => {
                this.classList.remove('invalid');
            }, 500);
        }
        
        updateCharCount();
    });
    
    // Character counter function
    function updateCharCount() {
        const count = inputText.value.length;
        charCounter.textContent = count;
        
        if (count >= 70) {
            charCounter.classList.add('char-limit-exceeded');
        } else {
            charCounter.classList.remove('char-limit-exceeded');
        }
    }
    
    // Mode selection change event
    displayModeSelect.addEventListener('change', function() {
        const imagesContainer = document.getElementById('translated-images');
        const videosContainer = document.getElementById('translated-videos');
        
        if (this.value === 'avatar') {
            // Switch to Avatar mode
            imagesContainer.style.display = 'none';
            videosContainer.style.display = 'flex';
            if (controlsPanel) {
                controlsPanel.style.display = 'flex'; // Show video controls if it exists
            }
        } else {
            // Switch to Image mode
            imagesContainer.style.display = 'flex';
            videosContainer.style.display = 'none';
            if (controlsPanel) {
                controlsPanel.style.display = 'none'; // Hide video controls if it exists
            }
        }
        
        // Clear current translations when switching modes
        imagesContainer.innerHTML = '';
        videosContainer.innerHTML = '';
    });
    
    // Mobile menu toggle
    document.querySelector('.menu-toggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('nav').classList.toggle('active');
    });
    
    // Initialize UI state based on default mode
    const defaultMode = document.getElementById('display-mode').value;
    if (defaultMode === 'avatar' && controlsPanel) {
        controlsPanel.style.display = 'flex';
    } else if (controlsPanel) {
        controlsPanel.style.display = 'none';
    }
    
    // For backward compatibility with existing control elements
    const playbackSpeed = document.getElementById('playback-speed');
    if (playbackSpeed) {
        playbackSpeed.addEventListener('change', updatePlaybackSpeed);
    }
    
    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
        playAllBtn.addEventListener('click', playAllVideos);
    }
    
    const pauseAllBtn = document.getElementById('pause-all-btn');
    if (pauseAllBtn) {
        pauseAllBtn.addEventListener('click', pauseAllVideos);
    }
    
    const restartAllBtn = document.getElementById('restart-all-btn');
    if (restartAllBtn) {
        restartAllBtn.addEventListener('click', restartAllVideos);
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
        // Only trigger click if video is paused
        if (combinedVideo.paused) {
            document.getElementById('combined-play-pause-btn').click();
        }
    } else {
        const videos = document.querySelectorAll('#translated-videos video');
        videos.forEach(video => video.play());
    }
}

function pauseAllVideos() {
    const combinedVideo = document.getElementById('combined-video');
    if (combinedVideo) {
        // Only trigger click if video is playing
        if (!combinedVideo.paused) {
            document.getElementById('combined-play-pause-btn').click();
        }
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