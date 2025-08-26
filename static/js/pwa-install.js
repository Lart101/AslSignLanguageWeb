// PWA Install functionality - Universal script
let deferredPrompt;
// Grab (potentially multiple) install buttons if duplicate markup was accidentally introduced
let navInstallButton = document.getElementById('navInstallButton');

// Defensive: remove any accidental duplicate install buttons that might have been left in the DOM
// This prevents the UI from showing two green "Install App" buttons side by side.
const installButtons = document.querySelectorAll('#navInstallButton');
if (installButtons.length > 1) {
    // Keep the first, remove the rest
    for (let i = 1; i < installButtons.length; i++) {
        installButtons[i].parentElement?.removeChild(installButtons[i]);
    }
    navInstallButton = installButtons[0];
}

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

// Install function
async function installApp() {
    if (deferredPrompt) {
        // PWA install available
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
            // Hide install button after successful install
            if (navInstallButton) {
                navInstallButton.style.display = 'none';
            }
        }
        deferredPrompt = null;
    } else {
        // No PWA prompt available - show detailed instructions
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            alert('📱 To install this app:\n\n🤖 Android (Chrome/Edge):\n• Tap menu (⋮) → "Add to Home screen"\n\n🍎 iPhone/iPad (Safari):\n• Tap Share (□↑) → "Add to Home Screen"\n\n💡 Tip: If you removed the app before, you may need to clear browser data first.');
        } else {
            alert('💻 To install this app:\n\n• Look for install icon (⊕) in address bar\n• Or use browser menu → "Install [app name]"\n\n💡 Tip: Try refreshing or clearing browser data if install option is missing.');
        }
    }
}

// Always make install button clickable (if not hidden)
if (navInstallButton) {
    navInstallButton.addEventListener('click', installApp);
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Install button is already visible, just keep it ready (unless app is installed)
    if (!checkIfInstalledPWA()) {
        // Only show if not running as installed app
        if (navInstallButton) {
            navInstallButton.style.display = 'block';
        }
    }
});

// Hide install button when app is installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (navInstallButton) {
        navInstallButton.style.display = 'none';
    }
});

// Check on page load if app is running as installed PWA
document.addEventListener('DOMContentLoaded', () => {
    // Check if running as installed PWA and hide button if so
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
