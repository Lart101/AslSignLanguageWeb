// Centralized Navigation Component for SignSpeak
document.addEventListener('DOMContentLoaded', function() {
    // Function to create the navigation HTML
    function createNavigation() {
        return `
            <div class="header-content">
                <h1>SignSpeak</h1>
                <div class="menu-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <nav>
                    <div class="nav-item">
                        <a href="index.html">Home</a>
                    </div>
                    <div class="nav-item dropdown">
                        <a href="#" class="dropdown-toggle">About SignSpeak</a>
                        <div class="dropdown-menu">
                            <a href="mission.html">Mission & Vision</a>
                            <a href="about.html">What is SignSpeak?</a>
                        </div>
                    </div>
                    <div class="nav-item dropdown">
                        <a href="#" class="dropdown-toggle">Learn</a>
                        <div class="dropdown-menu">
                            <a href="alphabet.html">Letters (A–Z)</a>
                            <a href="basic-words.html">Basic Words</a>
                            <a href="numbers.html">Numbers (0–9)</a>
                            <a href="colors.html">Colors</a>
                            <a href="family.html">Family & People</a>
                            <a href="food.html">Food & Drinks</a>
                        </div>
                    </div>
                    <div class="nav-item dropdown">
                        <a href="#" class="dropdown-toggle">Tools</a>
                        <div class="dropdown-menu">
                            <a href="image_to_sign.html">Image → Sign</a>
                            <a href="text_to_sign.html">Text → Sign</a>
                            <a href="webcam.html">Webcam → Sign</a>
                        </div>
                    </div>
                    <div class="nav-item">
                        <a href="challenge.html">🎯 Challenge</a>
                    </div>
                    <div class="nav-item">
                        <a href="contact.html">Contact Us</a>
                    </div>
                </nav>
            </div>
        `;
    }

    // Function to initialize navigation
    function initNavigation() {
        const header = document.querySelector('header');
        if (header) {
            header.innerHTML = createNavigation();
            
            // Initialize dropdown functionality
            initDropdowns();
            
            // Initialize mobile menu toggle
            initMobileMenu();
        }
    }

    // Function to handle dropdown functionality
    function initDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isCurrentlyActive = dropdown.classList.contains('active');
                    
                    // Always close all dropdowns first
                    dropdowns.forEach(otherDropdown => {
                        otherDropdown.classList.remove('active');
                    });
                    
                    // If this dropdown wasn't active, open it
                    if (!isCurrentlyActive) {
                        dropdown.classList.add('active');
                    }
                });
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
        
        // Close dropdowns when pressing Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    // Function to handle mobile menu toggle
    function initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('nav');
        
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                const wasActive = nav.classList.contains('mobile-active');
                
                nav.classList.toggle('mobile-active');
                menuToggle.classList.toggle('active');
                
                // If closing the mobile menu, also close all dropdowns
                if (wasActive) {
                    document.querySelectorAll('.dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
            
            // Close mobile menu when clicking on a non-dropdown link
            nav.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' && !e.target.classList.contains('dropdown-toggle')) {
                    nav.classList.remove('mobile-active');
                    menuToggle.classList.remove('active');
                    
                    // Also close any open dropdowns
                    document.querySelectorAll('.dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('header') && nav.classList.contains('mobile-active')) {
                    nav.classList.remove('mobile-active');
                    menuToggle.classList.remove('active');
                    
                    // Also close any open dropdowns
                    document.querySelectorAll('.dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
            
            // Handle window resize - close mobile menu on desktop
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    nav.classList.remove('mobile-active');
                    menuToggle.classList.remove('active');
                    
                    // Also close any open dropdowns
                    document.querySelectorAll('.dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
        }
    }

    // Function to highlight current page in navigation
    function highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
                // Also highlight parent dropdown if this is a submenu item
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const parentToggle = parentDropdown.querySelector('.dropdown-toggle');
                    if (parentToggle) {
                        parentToggle.classList.add('active');
                    }
                }
            }
        });
    }

    // Initialize the navigation
    initNavigation();
    
    // Highlight current page after navigation is loaded
    setTimeout(highlightCurrentPage, 100);
});
