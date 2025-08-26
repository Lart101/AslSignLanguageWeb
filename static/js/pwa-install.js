// PWA Install functionality - Universal script
let deferredPrompt;
const navInstallButton = document.getElementById('navInstallButton');

// Check if app is running as installed PWA and hide install button
function checkIfInstalledPWA() {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
    
    // If running as installed app, hide install button
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
        if (navInstallButton) {
            navInstallButton.style.display = 'none';
        }
        return true; // App is installed and running
    }
    return false; // App is running in browser
}

// Install function - Always working version
async function installApp() {
    // Check if running as installed PWA
    const isInstalled = checkIfInstalledPWA();
    
    if (isInstalled) {
        // Running as installed app - show helpful message
        alert('✅ App is already installed!\n\n📱 You\'re currently using the installed version.\n\n💡 To reinstall or update, visit the website in your browser and use the install option there.');
        return;
    }
    
    if (deferredPrompt) {
        // PWA install prompt available
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
            alert('🎉 App installed successfully!\n\n📱 You can now find it on your home screen or app drawer.');
        }
        deferredPrompt = null;
    } else {
        // No PWA prompt available - show detailed instructions
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            alert('📱 To install this app:\n\n🤖 Android (Chrome/Edge):\n• Tap menu (⋮) → "Add to Home screen"\n\n🍎 iPhone/iPad (Safari):\n• Tap Share (□↑) → "Add to Home Screen"\n\n💡 Tip: If install option is missing, try refreshing the page or clearing browser data.');
        } else {
            alert('💻 To install this app:\n\n• Look for install icon (⊕) in address bar\n• Or use browser menu → "Install [app name]"\n\n💡 Tip: Try refreshing or clearing browser data if install option is missing.');
        }
    }
}

// Always make install button clickable and visible
if (navInstallButton) {
    navInstallButton.addEventListener('click', installApp);
    // Keep button visible in browser, but check on load if in PWA mode
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('Install prompt available');
});

// Handle app installation event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    alert('🎉 App installed successfully!\n\n📱 You can now find it on your home screen!');
});

// Check on page load if app is running as installed PWA
document.addEventListener('DOMContentLoaded', () => {
    // Only hide button if running as installed PWA
    checkIfInstalledPWA();
    
    // Menu toggle functionality (common across pages)
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }
});
