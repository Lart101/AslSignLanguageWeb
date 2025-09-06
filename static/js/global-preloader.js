// Global Video Preloader - Works on all pages of the ASL website
// This script starts preloading videos immediately when any page loads

console.log('🌐 Global video preloader initialized');

// Video preloading cache shared across all pages
window.globalPreloadedVideos = window.globalPreloadedVideos || new Map();

// Global video path generator - uses shared ASL data if available, fallback otherwise
function getGlobalVideoPath(word, category) {
    // Use shared data if available
    if (window.ASL_DATA && window.ASL_DATA.getVideoPath) {
        return window.ASL_DATA.getVideoPath(word, category);
    }
    
    // Fallback path generation logic
    const basePath = window.location.hostname.includes('github.io') 
        ? '/AslSignLanguageWeb/' 
        : './';
    
    const folderMap = {
        'basicWords': 'basic_words',
        'alphabet': 'alphabet',
        'numbers': 'numbers', 
        'colors': 'colors',
        'family': 'family',
        'food': 'food'
    };
    
    const folderName = folderMap[category] || category;
    
    let videoName;
    if (category === 'alphabet' || category === 'numbers') {
        videoName = word.toUpperCase();
    } else {
        videoName = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    const fullPath = `${basePath}static/sign_language_videos/${folderName}/${videoName}.mp4`;
    console.log(`Global video path generated: ${fullPath} (word: ${word}, category: ${category})`);
    
    return fullPath;
}

// Get challenge words - use shared data if available, fallback otherwise
function getChallengeWords() {
    if (window.ASL_DATA && window.ASL_DATA.CHALLENGE_WORDS) {
        return window.ASL_DATA.CHALLENGE_WORDS;
    }
    
    // Fallback data
    return {
        alphabet: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        colors: ['Black', 'Blue', 'Green', 'Orange', 'Purple', 'Red', 'White', 'Yellow'],
        basicWords: ['Hello', 'Goodbye', 'Please', 'Thankyou', 'Yes', 'No'],
        family: ['Mother', 'Father', 'Baby', 'Boy', 'Girl'],
        food: ['Apple', 'Drink', 'Eat', 'Milk', 'Pizza', 'Water']
    };
}

// Global preloader function
async function startGlobalVideoPreloading() {
    console.log('🚀 Starting global video preloading on page load...');
    
    const challengeWords = getChallengeWords();
    
    // Start preloading all categories in order of priority
    const preloadOrder = ['alphabet', 'numbers', 'basicWords', 'colors', 'family', 'food'];
    
    for (const category of preloadOrder) {
        const words = challengeWords[category] || [];
        console.log(`📦 Global preloading: ${category} (${words.length} videos)`);
        
        // Don't await - let each category load in parallel background
        preloadCategoryInBackground(category, words);
        
        // Small delay between categories to stagger the loading
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function preloadCategoryInBackground(category, words) {
    let loadedCount = 0;
    const totalVideos = words.length;
    
    console.log(`🎬 Background preloading ${totalVideos} videos from ${category}...`);
    
    // Preload videos in small batches to avoid overwhelming GitHub Pages
    const batchSize = 2; // Conservative batch size for global loading
    
    for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (word) => {
            try {
                const videoPath = getGlobalVideoPath(word, category);
                
                // Skip if already cached
                if (window.globalPreloadedVideos.has(videoPath)) {
                    loadedCount++;
                    return;
                }
                
                const video = document.createElement('video');
                video.preload = 'auto';
                video.muted = true;
                video.playsInline = true;
                video.crossOrigin = 'anonymous';
                video.style.display = 'none'; // Hide video elements
                
                await new Promise((resolveVideo) => {
                    const timeout = setTimeout(() => {
                        console.log(`⏰ Global timeout: ${category}/${word}`);
                        resolveVideo(); // Don't block on timeouts
                    }, 20000); // 20 second timeout for global loading
                    
                    video.addEventListener('loadeddata', () => {
                        clearTimeout(timeout);
                        window.globalPreloadedVideos.set(videoPath, video);
                        loadedCount++;
                        console.log(`🟢 Global loaded: ${category}/${word} (${loadedCount}/${totalVideos})`);
                        resolveVideo();
                    }, { once: true });
                    
                    video.addEventListener('error', () => {
                        clearTimeout(timeout);
                        loadedCount++;
                        console.log(`🔴 Global failed: ${category}/${word} (${loadedCount}/${totalVideos})`);
                        resolveVideo();
                    }, { once: true });
                    
                    video.src = videoPath;
                    video.load();
                });
                
            } catch (error) {
                loadedCount++;
                console.warn(`Global preload error for ${category}/${word}:`, error);
            }
        });
        
        // Wait for current batch before starting next batch
        await Promise.all(batchPromises);
        
        // Delay between batches to be gentle on the server
        if (i + batchSize < words.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`✅ Global ${category} preloading completed: ${loadedCount}/${totalVideos} videos loaded`);
}

// Function to get preloaded videos from global cache
function getGlobalPreloadedVideo(videoPath) {
    const cached = window.globalPreloadedVideos.get(videoPath);
    if (cached) {
        // Return a cloned video element to avoid conflicts
        const clonedVideo = cached.cloneNode(true);
        clonedVideo.currentTime = 0;
        clonedVideo.style.display = 'block'; // Make visible when used
        return clonedVideo;
    }
    return null;
}

// Make functions globally available
window.getGlobalPreloadedVideo = getGlobalPreloadedVideo;
window.startGlobalVideoPreloading = startGlobalVideoPreloading;

// Start preloading immediately when this script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGlobalVideoPreloading);
} else {
    // Document already loaded
    startGlobalVideoPreloading();
}
