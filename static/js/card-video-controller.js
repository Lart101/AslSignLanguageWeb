// Card Video Controller - Ensures only one video plays at a time when clicking cards
// Author: AI Assistant
// Purpose: Handle video playback for letter/number/color cards with proper pause/play functionality

class CardVideoController {
    constructor() {
        this.currentlyPlayingVideo = null;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupCardControls());
        } else {
            this.setupCardControls();
        }
    }

    setupCardControls() {
        // Find all letter cards (covers alphabet, numbers, colors, etc.)
        const cards = document.querySelectorAll('.letter-card');
        
        cards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                this.setupVideoCard(card, video);
            }
        });

        console.log(`🎬 Card Video Controller initialized for ${cards.length} cards`);
    }

    setupVideoCard(card, video) {
        // Ensure video is properly configured
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        
        // Remove any existing autoplay to prevent conflicts
        video.removeAttribute('autoplay');

        // Add visual indicator that the card is clickable
        card.style.cursor = 'pointer';
        card.classList.add('video-card-interactive');

        // Add click handler for the entire card
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleCardClick(card, video);
        });

        // Handle video events
        video.addEventListener('loadstart', () => {
            console.log(`📥 Loading video: ${video.src}`);
        });

        video.addEventListener('canplay', () => {
            console.log(`✅ Video ready: ${video.src}`);
        });

        video.addEventListener('error', (e) => {
            console.error(`❌ Video error: ${video.src}`, e);
            card.classList.add('video-error');
        });
    }

    handleCardClick(card, video) {
        // If this video is currently playing, pause it
        if (this.currentlyPlayingVideo === video && !video.paused) {
            this.pauseVideo(video, card);
            return;
        }

        // Pause any currently playing video
        this.pauseAllVideos();

        // Play this video
        this.playVideo(video, card);
    }

    playVideo(video, card) {
        // Add visual feedback
        card.classList.add('playing');
        card.classList.remove('paused');

        // Store reference to currently playing video
        this.currentlyPlayingVideo = video;

        // Play the video
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`▶️ Playing: ${video.src}`);
            }).catch(error => {
                console.warn(`⚠️ Autoplay prevented: ${video.src}`, error);
                // Remove visual feedback if play failed
                card.classList.remove('playing');
                this.currentlyPlayingVideo = null;
            });
        }
    }

    pauseVideo(video, card) {
        video.pause();
        card.classList.remove('playing');
        card.classList.add('paused');
        
        if (this.currentlyPlayingVideo === video) {
            this.currentlyPlayingVideo = null;
        }
        
        console.log(`⏸️ Paused: ${video.src}`);
    }

    pauseAllVideos() {
        const allVideos = document.querySelectorAll('.letter-card video');
        const allCards = document.querySelectorAll('.letter-card');
        
        allVideos.forEach((video, index) => {
            if (!video.paused) {
                video.pause();
                console.log(`⏸️ Auto-paused: ${video.src}`);
            }
        });

        // Remove playing class from all cards
        allCards.forEach(card => {
            card.classList.remove('playing');
            card.classList.add('paused');
        });

        this.currentlyPlayingVideo = null;
    }

    // Public method to pause all videos (can be called from other scripts)
    static pauseAll() {
        const controller = window.cardVideoController;
        if (controller) {
            controller.pauseAllVideos();
        }
    }

    // Public method to get current playing video info
    getCurrentlyPlaying() {
        if (this.currentlyPlayingVideo) {
            const card = this.currentlyPlayingVideo.closest('.letter-card');
            return {
                video: this.currentlyPlayingVideo,
                card: card,
                letter: card ? card.dataset.letter : null
            };
        }
        return null;
    }
}

// Initialize the controller and make it globally available
window.cardVideoController = new CardVideoController();

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardVideoController;
}
