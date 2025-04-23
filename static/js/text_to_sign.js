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
        const imageGrid = document.createElement('div');
        imageGrid.className = 'sign-image-grid';
        imageGrid.style.display = 'flex';
        imageGrid.style.flexWrap = 'wrap';
        imageGrid.style.gap = '1rem';
        imageGrid.style.justifyContent = 'center';
        
        for (let char of inputText) {
            if (/[a-zA-Z]/.test(char)) {
                const upperChar = char.toUpperCase();
                const container = document.createElement('div');
                container.className = 'sign-container';
                
                const img = document.createElement('img');
                img.src = `static/sign_language_images/alphabet_${upperChar}.jpg`;
                img.alt = `Sign for letter ${char}`;
                img.style.width = 'auto'; // Allow image to size naturally
                img.style.height = 'auto'; // Allow image to size naturally
                img.style.maxWidth = '100%'; // But don't exceed container
                img.style.maxHeight = '120px'; // Maximum height
                
                const letter = document.createElement('p');
                letter.textContent = char;
                
                container.appendChild(img);
                container.appendChild(letter);
                imageGrid.appendChild(container);
            } else if (char === ' ') {
                const space = document.createElement('div');
                space.style.width = '40px';
                space.style.height = '120px';
                imageGrid.appendChild(space);
            }
        }
        
        imagesContainer.appendChild(imageGrid);
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
    rowContainer.style.flexWrap = 'wrap'; // Allow wrapping on smaller screens
    
    // Left column: Video and Controls - now 50% of the space with minimum width
    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.width = '50%'; // Relative width for larger screens
    leftColumn.style.minWidth = '280px'; // Minimum width for smaller screens
    leftColumn.style.flex = '1'; // Allow growing and shrinking
    
    // Video and current letter section
    const videoAndDisplay = document.createElement('div');
    videoAndDisplay.className = 'video-and-display';
    
    const video = document.createElement('video');
    video.id = 'combined-video';
    video.style.width = '50%'; // Make video 50% smaller
    video.style.height = 'auto'; // Keep aspect ratio
    video.style.maxWidth = '50%'; // Ensure video doesn't overflow container
    video.style.backgroundColor = 'black'; // Add black background
    video.style.margin = '0 auto'; // Center the video
    video.style.display = 'block'; // Ensure display block for margin auto to work
    video.muted = true; // Mute the video
    video.controls = false; // We'll add custom controls
    
    // Create a container for the current letter display
    const currentLetterDisplay = document.createElement('div');
    currentLetterDisplay.className = 'current-letter-display';
    currentLetterDisplay.innerHTML = '<span id="current-letter-indicator">Ready to start</span>';
    
    videoAndDisplay.appendChild(video);
    videoAndDisplay.appendChild(currentLetterDisplay);
    
    // Controls section - now horizontally aligned with wrap for mobile
    const controlsSection = document.createElement('div');
    controlsSection.className = 'controls-section';
    controlsSection.style.marginTop = '10px';
    controlsSection.style.width = '100%'; // Full width of parent
    
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'combined-video-controls';
    controlsWrapper.style.display = 'flex';
    controlsWrapper.style.flexDirection = 'row';
    controlsWrapper.style.alignItems = 'center';
    controlsWrapper.style.justifyContent = 'space-between';
    controlsWrapper.style.flexWrap = 'wrap'; // Allow controls to wrap
    controlsWrapper.style.gap = '10px'; // Gap between wrapped items
    
    // Primary controls group - horizontal but can wrap
    const primaryControls = document.createElement('div');
    primaryControls.className = 'primary-controls';
    primaryControls.style.display = 'flex';
    primaryControls.style.flexDirection = 'row';
    primaryControls.style.gap = '10px';
    primaryControls.style.flexWrap = 'wrap'; // Allow buttons to wrap
    primaryControls.style.justifyContent = 'center'; // Center when wrapped
    primaryControls.style.width = '100%'; // Full width on smaller screens
    
    // Play/Pause toggle button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'control-btn play-btn';
    playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
    playPauseBtn.id = 'combined-play-pause-btn';
    playPauseBtn.dataset.state = 'paused';
    
    // STOP button
    const restartBtn = document.createElement('button');
    restartBtn.className = 'control-btn restart-btn';
    restartBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16"></rect></svg> Stop';
    restartBtn.id = 'combined-restart-btn';
    restartBtn.style.backgroundColor = '#ff3b30'; // Red background
    restartBtn.style.color = 'white'; // White text for contrast
    restartBtn.style.borderColor = '#d9322a'; // Darker red border
    
    // Speed control - moved to be after restart button
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    speedControl.style.display = 'flex';
    speedControl.style.alignItems = 'center';
    speedControl.style.gap = '5px';
    speedControl.style.flexWrap = 'nowrap'; // Keep label and select together
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
    
    // Add elements to primary controls in correct order
    primaryControls.appendChild(playPauseBtn);
    primaryControls.appendChild(restartBtn);
    primaryControls.appendChild(speedControl);
    
    // Add controls to wrapper
    controlsWrapper.appendChild(primaryControls);
    controlsSection.appendChild(controlsWrapper);
    
    // Add video and controls to the left column
    leftColumn.appendChild(videoAndDisplay);
    leftColumn.appendChild(controlsSection);
    
    // Right column: Progress and Letter Sequence
    const rightColumn = document.createElement('div');
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.flex = '1'; // Allow growing
    rightColumn.style.minWidth = '280px'; // Minimum width for smaller screens
    rightColumn.style.width = '100%'; // Full width on small screens
    
    // Progress section - now on the right
    const progressSection = document.createElement('div');
    progressSection.className = 'progress-section';
    progressSection.style.marginBottom = '20px';
    progressSection.style.width = '100%'; // Full width
    
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
    letterSequence.style.width = '100%'; // Full width
    letterSequence.innerHTML = '<h4 style="width:100%; margin-bottom:0.75rem; text-align:center;">Letter Sequence</h4>';
    
    // Create letter blocks
    for (let i = 0; i < originalText.length; i++) {
        const letter = originalText[i];
        const letterSpan = document.createElement('span');
        letterSpan.className = 'sequence-letter';
        letterSpan.textContent = letter;
        if (!/[a-zA-Z]/.test(letter)) {
            letterSpan.className += ' non-letter';
        } else {
            // Make alphabet letters clickable and store position info
            letterSpan.style.cursor = 'pointer';
            letterSpan.dataset.letter = letter;
            letterSpan.dataset.position = i; // Store position in the original text
            letterSpan.title = `Click to play sign for "${letter}"`;
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
    tipsSection.style.width = '100%'; // Full width
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
    
    // Add window resize listener to adjust layout dynamically
    window.addEventListener('resize', adjustVideoPlayerLayout);
    
    // Initial layout adjustment
    adjustVideoPlayerLayout();
}

// Function to adjust layout based on screen size
function adjustVideoPlayerLayout() {
    const windowWidth = window.innerWidth;
    const rowContainer = document.querySelector('.combined-player > div');
    const leftColumn = document.querySelector('.combined-player > div > div:first-child');
    const rightColumn = document.querySelector('.combined-player > div > div:last-child');
    const controlsWrapper = document.querySelector('.combined-video-controls');
    const primaryControls = document.querySelector('.primary-controls');
    
    if (!rowContainer) return; // Exit if elements don't exist yet
    
    if (windowWidth < 768) {
        // Mobile layout
        rowContainer.style.flexDirection = 'column';
        
        if (leftColumn) {
            leftColumn.style.width = '100%';
            leftColumn.style.marginBottom = '20px';
        }
        
        if (rightColumn) {
            rightColumn.style.width = '100%';
        }
        
        if (controlsWrapper) {
            controlsWrapper.style.flexDirection = 'column';
        }
        
        if (primaryControls) {
            primaryControls.style.width = '100%';
            primaryControls.style.justifyContent = 'center';
        }
    } else {
        // Desktop layout
        rowContainer.style.flexDirection = 'row';
        
        if (leftColumn) {
            leftColumn.style.width = '50%';
            leftColumn.style.marginBottom = '0';
        }
        
        if (rightColumn) {
            rightColumn.style.width = '50%';
        }
        
        if (controlsWrapper) {
            controlsWrapper.style.flexDirection = 'row';
        }
    }
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
    let isTransitioning = false; // Track if we're in a transition
    
    // Create an array of letter videos with their sources
    for (let letter of letters) {
        videoSequence.push({
            letter: letter,
            src: `static/sign_language_gif/${letter}.Mp4`
        });
    }
    
    // Add CSS for fade transition
    const style = document.createElement('style');
    style.textContent = `
        #combined-video {
            transition: opacity 0.3s ease-in-out, transform 0.5s ease-in-out;
        }
        #combined-video.fade-out {
            opacity: 0;
        }
        #combined-video.fade-in {
            opacity: 1;
        }
        #combined-video.morph-in {
            opacity: 1;
            animation: dissolveEffect 0.5s ease-in-out;
        }
        
        @keyframes dissolveEffect {
            0% { 
                opacity: 0.2; 
                filter: blur(10px);
                transform: scale(0.95);
            }
            50% { 
                opacity: 0.7; 
                filter: blur(5px);
                transform: scale(0.98);
            }
            100% { 
                opacity: 1; 
                filter: blur(0);
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Initially set video to fully visible
    video.classList.add('fade-in');
    
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
    
    // Function to load and play the current letter's video with fade transition
    function playCurrentLetter() {
        if (isTransitioning) return; // Prevent multiple transitions at once
        
        if (currentLetterIndex < videoSequence.length) {
            const currentVideo = videoSequence[currentLetterIndex];
            
            // Start fade out transition
            isTransitioning = true;
            video.classList.remove('fade-in');
            video.classList.add('fade-out');
            
            // Store current playback rate to apply after loading new video
            const currentSpeed = parseFloat(speedSelect.value);
            
            // Wait for fade out to complete before changing source
            setTimeout(() => {
                // Change video source
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
                
                // Once video is ready to play, fade it in
                video.oncanplay = function() {
                    // Apply the playback rate to the newly loaded video
                    video.playbackRate = currentSpeed;
                    
                    // Start morph/dissolve transition
                    video.classList.remove('fade-out');
                    video.classList.add('morph-in'); // Changed to morph-in for dissolve effect
                    
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
                    
                    // Reset transition flag after morph-in completes
                    setTimeout(() => {
                        isTransitioning = false;
                        // Remove the morph-in class after transition completes
                        video.classList.remove('morph-in');
                        video.classList.add('fade-in');
                    }, 500); // Slightly longer for the morph effect
                };
            }, 300); // Match the transition duration in the CSS
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
    
    // Function to jump to specific letter in the sequence
    function jumpToLetter(letterToJump) {
        // Find the index of this letter in our sequence
        const letterIndex = letters.findIndex(l => l.toUpperCase() === letterToJump.toUpperCase());
        
        if (letterIndex >= 0 && !isTransitioning) {
            // Force stop current playback
            video.pause();
            
            // Update the current index
            currentLetterIndex = letterIndex;
            
            // Update UI
            letterElements.forEach(el => {
                el.classList.remove('active');
                el.classList.remove('completed');
            });
            
            // Mark all previous letters as completed
            let letterCount = 0;
            for (let i = 0; i < letterElements.length; i++) {
                if (!/[a-zA-Z]/.test(letterElements[i].textContent)) continue;
                
                if (letterCount < currentLetterIndex) {
                    letterElements[i].classList.add('completed');
                }
                letterCount++;
            }
            
            // Play this letter's video
            playCurrentLetter();
        }
    }
    
    // Add click events to the letter sequence elements
    letterElements.forEach(letterElement => {
        if (letterElement.dataset.letter) {
            letterElement.addEventListener('click', function() {
                // Get the exact position of this letter in the original text
                const position = parseInt(this.dataset.position);
                
                // Get the letter to play
                const letterToPlay = this.dataset.letter.toUpperCase();
                
                // Count up to this specific position to find the correct index in our sequence
                let validLetterCount = -1;  // Start at -1 because we'll count to the current letter
                let targetLetterIndex = -1;
                
                // Loop through all letters up to and including this one
                for (let i = 0; i <= position; i++) {
                    const char = letterElements[i].textContent.toUpperCase();
                    if (/[A-Z]/.test(char)) {
                        validLetterCount++;
                        if (i === position) {
                            targetLetterIndex = validLetterCount;
                        }
                    }
                }
                
                // Make sure we found a valid index
                if (targetLetterIndex >= 0) {
                    // Force stop any current playback and transitions
                    video.pause();
                    
                    // Clear any pending timeouts that might interfere with our jump
                    for (let i = 1; i < 1000; i++) {
                        window.clearTimeout(i);
                    }
                    
                    // Reset transition state
                    isTransitioning = false;
                    
                    // Update the current index to our specific target
                    currentLetterIndex = targetLetterIndex;
                    
                    // Update UI - reset all letter highlights first
                    letterElements.forEach(el => {
                        el.classList.remove('active');
                        el.classList.remove('completed');
                    });
                    
                    // Mark all previous letters as completed
                    let letterCount = 0;
                    for (let i = 0; i < letterElements.length; i++) {
                        if (!/[a-zA-Z]/.test(letterElements[i].textContent)) continue;
                        
                        if (letterCount < currentLetterIndex) {
                            letterElements[i].classList.add('completed');
                        }
                        letterCount++;
                    }
                    
                    // Reset video transitions before playing the new letter
                    video.classList.remove('fade-out', 'fade-in', 'morph-in');
                    
                    // Ensure we're in a fresh state before playing
                    setTimeout(() => {
                        // Force play flag to true so the video plays regardless of previous state
                        isPlaying = true;
                        
                        // Play this letter's video
                        playCurrentLetter();
                    }, 50);
                }
            });
        }
    });

    // Event listener for when a video ends
    video.addEventListener('ended', function() {
        if (!isTransitioning) {
            isPlaying = false;
            updatePlayPauseButton(false);
            currentLetterIndex++;
            if (currentLetterIndex < videoSequence.length) {
                playCurrentLetter();
            } else {
                // Fade out video at the end
                video.classList.remove('fade-in');
                video.classList.add('fade-out');
                
                // Reset to beginning after showing "Completed"
                setTimeout(() => {
                    currentLetterIndex = 0;
                    currentLetterIndicator.textContent = "Click PLAY to start";
                    progressBar.style.width = "0%";
                    letterElements.forEach(el => {
                        el.classList.remove('active');
                        el.classList.remove('completed');
                    });
                    
                    // Fade back in empty video
                    setTimeout(() => {
                        video.classList.remove('fade-out');
                        video.classList.add('fade-in');
                    }, 300);
                }, 3000);
            }
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
    
    // Stop button event
    restartBtn.addEventListener('click', function() {
        // Force stop current playback and any transitions
        video.pause();
        video.removeAttribute('src'); // Remove source to stop any loading
        video.load(); // Reset the video element
        
        // Force cancel any ongoing transitions
        isTransitioning = false;
        
        // Clear any pending timeouts
        for (let i = 1; i < 10000; i++) {
            window.clearTimeout(i);
        }
        
        // Reset state
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
        
        // Reset all animations and transitions
        video.classList.remove('fade-out', 'fade-in', 'morph-in');
        video.classList.add('fade-in');
        
        // Update text
        currentLetterIndicator.textContent = "Click PLAY to start";
    });
    
    // Speed change event
    speedSelect.addEventListener('change', function() {
        const newSpeed = parseFloat(this.value);
        
        // Apply speed change immediately to current video if it exists
        if (video && video.src) {
            video.playbackRate = newSpeed;
        }
        
        // Also update global playback speed for any future videos
        updatePlaybackSpeed(newSpeed);
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
function updatePlaybackSpeed(speedValue) {
    // Use provided speed value if available, otherwise get from dropdown
    const speed = speedValue || document.getElementById('playback-speed')?.value || "1";
    const speedNumeric = parseFloat(speed);
    
    // Update main combined video if it exists
    const combinedVideo = document.getElementById('combined-video');
    if (combinedVideo) {
        combinedVideo.playbackRate = speedNumeric;
    } 
    
    // Also update any individual videos (for backwards compatibility)
    const videos = document.querySelectorAll('#translated-videos video');
    videos.forEach(video => {
        video.playbackRate = speedNumeric;
    });
    
    // Update any speed dropdowns to keep UI in sync
    const combinedSpeedSelect = document.getElementById('combined-playback-speed');
    const mainSpeedSelect = document.getElementById('playback-speed');
    
    if (combinedSpeedSelect && combinedSpeedSelect.value !== String(speedNumeric)) {
        combinedSpeedSelect.value = String(speedNumeric);
    }
    
    if (mainSpeedSelect && mainSpeedSelect.value !== String(speedNumeric)) {
        mainSpeedSelect.value = String(speedNumeric);
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