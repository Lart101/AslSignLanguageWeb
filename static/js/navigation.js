// Centralized Navigation Component for Signademy
document.addEventListener('DOMContentLoaded', function() {
    // Function to create the navigation HTML
    function createNavigation() {
        return `
            <div class="header-content">
                <h1>Signademy</h1>
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
                        <a href="#" class="dropdown-toggle">About Signademy</a>
                        <div class="dropdown-menu">
                            <a href="mission.html">Mission & Vision</a>
                            <a href="about.html">What is Signademy?</a>
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
                    <div class="nav-item admin-link" style="display:none;">
                        <a href="admin.html">⚙️ Admin</a>
                    </div>
                </nav>
            </div>
        `;
        
        // Check if user is admin (after creating nav)
        setTimeout(checkIfAdmin, 100);
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

    // Check if the current user is an admin
    function checkIfAdmin() {
        // First check if Supabase is available
        if (typeof window.supabase !== 'undefined') {
            const supabase = window.supabase.createClient(
                'https://rgxalrnmnlbmskupyhcm.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGFscm5tbmxibXNrdXB5aGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MjExMzYsImV4cCI6MjA2MDI5NzEzNn0.sB4B5_kwyng0kZ7AHD_lnSpLJ3WfseYwDW1o5-foG-E'
            );
            
            // Check if user is logged in
            supabase.auth.getUser().then(({ data: { user } }) => {
                const adminLink = document.querySelector('.admin-link');
                if (adminLink) {
                    if (user) {
                        // Show admin link if user is logged in
                        adminLink.style.display = 'block';
                    } else {
                        // Hide admin link if user is not logged in
                        adminLink.style.display = 'none';
                    }
                }
            });
        } else {
            // If on admin page, load Supabase and check again
            if (window.location.pathname.includes('admin.html')) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = checkIfAdmin;
                document.head.appendChild(script);
            }
        }
    }

    // Initialize the navigation
    initNavigation();
    
    // Highlight current page after navigation is loaded
    setTimeout(highlightCurrentPage, 100);
});
