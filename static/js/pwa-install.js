// PWA Install functionality - Universal script
let deferredPrompt;
const navInstallButton = document.getElementById('navInstallButton');

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
        // No PWA prompt available - show simple instructions
        alert('To install this app:\n\n📱 Mobile: Use "Add to Home Screen" from your browser menu\n💻 Desktop: Look for install icon in address bar');
    }
}

// Always make install button clickable
if (navInstallButton) {
    navInstallButton.addEventListener('click', installApp);
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Install button is already visible, just keep it ready
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
