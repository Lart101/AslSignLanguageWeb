// PWA Install functionality - Universal script
let deferredPrompt;
const navInstallButton = document.getElementById('navInstallButton');

// Install function
async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        
        // Hide install button
        if (navInstallButton) {
            navInstallButton.style.display = 'none';
        }
    }
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show navigation install button
    if (navInstallButton) {
        navInstallButton.style.display = 'block';
        navInstallButton.addEventListener('click', installApp);
    }
});

// Hide install button when app is installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (navInstallButton) {
        navInstallButton.style.display = 'none';
    }
});

// Menu toggle functionality (common across pages)
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }
});
