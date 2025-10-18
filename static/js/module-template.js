// module-template.js - Universal Module Template System
import { config } from './config.js';
import moduleContentLoader from './module-content-loader.js';

class UniversalModuleTemplate {
    constructor() {
        this.supabase = null;
        this.currentModule = null;
        this.moduleData = null;
        this.allModules = [];
        
        // AI and webcam properties
        this.gestureRecognizer = null;
        this.webcamActive = false;
        this.runningMode = "IMAGE";
        this.selectedLetter = null;
        this.modelLoading = false;
        
        // Audio feedback cooldown properties
        this.lastFeedbackTime = 0;
        this.feedbackCooldown = 2000; // 2 seconds cooldown
        this.lastDetectedGesture = null;
        this.lastGestureTime = 0;
        
        this.init();
    }

    async init() {
        // Initialize Supabase client
        await this.initializeSupabase();
        
        // Load all modules for the dropdown first
        await this.loadAllModulesForDropdown();
        
        // Get module from URL parameter or default to alphabet
        const urlParams = new URLSearchParams(window.location.search);
        const moduleParam = urlParams.get('module') || 'alphabet';
        
        await this.loadModule(moduleParam);
        this.setupEventListeners();
    }

    async initializeSupabase() {
        try {
            if (window.supabase && config.supabaseUrl && config.supabaseAnonKey) {
                this.supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
                console.log('✅ Supabase client initialized successfully');
                
                // Test the connection
                const { data, error } = await this.supabase.from('modules').select('id').limit(1);
                if (error) {
                    console.warn('⚠️ Supabase connection test failed:', error.message);
                } else {
                    console.log('✅ Supabase database connection verified');
                }
            } else {
                console.warn('⚠️ Supabase not available or config missing');
            }
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
        }
    }

    async loadAllModulesForDropdown() {
        try {
            console.log('🔄 Loading all modules from Supabase database...');
            
            if (this.supabase) {
                // Load modules directly from Supabase
                const { data: modules, error } = await this.supabase
                    .from('modules')
                    .select('*')
                    .order('display_name', { ascending: true });

                if (error) {
                    console.error('❌ Error loading modules from Supabase:', error);
                    throw error;
                }

                console.log('✅ Loaded modules from database:', modules);
                this.allModules = modules || [];
                this.populateModuleDropdown();
            } else {
                throw new Error('Supabase not initialized');
            }
        } catch (error) {
            console.error('❌ Error loading modules from database, using fallback:', error);
            this.loadFallbackModulesForDropdown();
        }
    }

    populateModuleDropdown() {
        const dropdown = document.getElementById('module-selector');
        dropdown.innerHTML = '<option value="">Choose a module...</option>';
        
        if (this.allModules && this.allModules.length > 0) {
            // Sort modules by display_name
            const sortedModules = [...this.allModules].sort((a, b) => {
                return (a.display_name || '').localeCompare(b.display_name || '');
            });
            
            sortedModules.forEach(module => {
                const option = document.createElement('option');
                option.value = module.module_key;
                option.textContent = `${module.icon || '📚'} ${module.display_name}`;
                dropdown.appendChild(option);
            });
            
            console.log(`✅ Populated dropdown with ${sortedModules.length} modules from database`);
        } else {
            console.warn('⚠️ No modules found, dropdown will remain empty');
        }
    }

    loadFallbackModulesForDropdown() {
        const dropdown = document.getElementById('module-selector');
        const modules = [
            { module_key: 'alphabet', display_name: '🔤 Alphabet (A-Z)' },
            { module_key: 'numbers', display_name: '🔢 Numbers (0-9)' },
            { module_key: 'basicWords', display_name: '💬 Basic Words' },
            { module_key: 'colors', display_name: '🎨 Colors' },
            { module_key: 'family', display_name: '👨‍👩‍👧‍👦 Family' },
            { module_key: 'food', display_name: '🍎 Food & Drinks' }
        ];
        
        dropdown.innerHTML = '<option value="">Choose a module...</option>';
        
        modules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.module_key;
            option.textContent = module.display_name;
            dropdown.appendChild(option);
        });
    }

    getModuleDisplayName(moduleName, moduleDescription = null) {
        // If we have a description from the database, create a nice display name
        if (moduleDescription) {
            return `📚 ${moduleContentLoader.capitalizeWords(moduleName)} - ${moduleDescription}`;
        }
        
        // Fallback to predefined display names with emojis
        const displayNames = {
            'alphabet': '🔤 Alphabet (A-Z)',
            'numbers': '🔢 Numbers (0-9)', 
            'basic-words': '💬 Basic Words',
            'colors': '🎨 Colors',
            'family': '👨‍👩‍👧‍👦 Family',
            'food': '🍎 Food & Drinks'
        };
        
        return displayNames[moduleName] || `📚 ${moduleContentLoader.capitalizeWords(moduleName)}`;
    }

    setupEventListeners() {
        // Module dropdown change
        const dropdown = document.getElementById('module-selector');
        dropdown.addEventListener('change', (e) => {
            const selectedModule = e.target.value;
            if (selectedModule && selectedModule !== this.currentModule) {
                // Update URL and load module
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('module', selectedModule);
                window.history.pushState({}, '', newUrl);
                
                this.loadModule(selectedModule);
            }
        });
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const moduleParam = urlParams.get('module') || 'alphabet';
            
            if (moduleParam !== this.currentModule) {
                this.loadModule(moduleParam);
            }
        });
    }

    async loadModule(moduleName) {
        try {
            // Show loading state
            this.showLoadingState();
            
            console.log(`🔄 Loading module "${moduleName}" from Supabase database...`);
            
            if (this.supabase) {
                // Load module data directly from Supabase
                this.moduleData = await this.loadModuleFromSupabase(moduleName);
                this.currentModule = moduleName;
                
                console.log('✅ Module loaded from database:', this.moduleData);
            } else {
                throw new Error('Supabase not available');
            }
            
            // Update page content
            this.updatePageTitle();
            this.updateModuleInfo();
            this.generateQuickNavigation();
            this.generateModuleGrid();
            this.updateDropdownSelection();
            
            // Initialize model automatically if available
            if (this.moduleData.hasAI && this.moduleData.model) {
                await this.initializeAIModel();
            }
            
            // Setup webcam controls
            this.setupWebcamControls();
            
            // Hide loading state
            this.hideLoadingState();
            
        } catch (error) {
            console.error('❌ Error loading module from database:', error);
            console.log('🔄 Falling back to static data...');
            // Load fallback data
            this.loadFallbackModule(moduleName);
        }
    }

    async loadModuleFromSupabase(moduleName) {
        try {
            // Load module info
            const { data: modules, error: moduleError } = await this.supabase
                .from('modules')
                .select('*')
                .ilike('module_key', moduleName)
                .limit(1);

            if (moduleError) throw moduleError;
            
            if (!modules || modules.length === 0) {
                throw new Error(`Module "${moduleName}" not found in database`);
            }

            const module = modules[0];
            console.log('✅ Found module in database:', module);

            // Load module items
            const { data: items, error: itemsError } = await this.supabase
                .from('module_items')
                .select('*')
                .eq('module_id', module.id)
                .order('display_order', { ascending: true });

            if (itemsError) throw itemsError;

            console.log(`✅ Loaded ${items?.length || 0} items for module:`, items);

            // Load module model (if any)
            const { data: models, error: modelsError } = await this.supabase
                .from('module_models')
                .select('*')
                .eq('module_id', module.id)
                .eq('is_active', true)
                .limit(1);

            if (modelsError) {
                console.warn('⚠️ Error loading models:', modelsError);
            }

            const model = models && models.length > 0 ? models[0] : null;
            console.log('🧠 AI Model for module:', model);

            return {
                module: {
                    id: module.id,
                    name: module.module_key,
                    display_name: module.display_name,
                    description: module.description
                },
                items: items || [],
                model: model,
                hasAI: !!model
            };

        } catch (error) {
            console.error('❌ Error in loadModuleFromSupabase:', error);
            throw error;
        }
    }

    async loadFallbackModule(moduleName) {
        // Show loading state
        this.showLoadingState();
        
        // Generate fallback data
        this.currentModule = moduleName;
        this.moduleData = this.getFallbackModuleData(moduleName);
        
        this.updatePageTitle();
        this.updateModuleInfo();
        this.generateQuickNavigation();
        this.generateModuleGrid();
        this.updateDropdownSelection();
        
        // Initialize AI model if available
        if (this.moduleData.hasAI && this.moduleData.model) {
            await this.initializeAIModel();
        }
        
        // Setup webcam controls
        this.setupWebcamControls();
        
        // Hide loading state
        this.hideLoadingState();
    }

    showLoadingState() {
        const title = document.getElementById('module-title');
        const description = document.getElementById('module-description');
        const grid = document.getElementById('alphabet-grid');
        const quickNav = document.getElementById('quick-alphabet');
        
        title.textContent = 'Loading Module...';
        description.textContent = 'Please wait while we load the module content.';
        grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: #64748b; grid-column: 1 / -1;"><div style="font-size: 2rem;">🔄</div><p>Loading...</p></div>';
        quickNav.innerHTML = '';
    }

    hideLoadingState() {
        // Loading state is automatically hidden when content is updated
    }

    updateDropdownSelection() {
        const dropdown = document.getElementById('module-selector');
        dropdown.value = this.currentModule;
    }

    updatePageTitle() {
        const title = `${moduleContentLoader.capitalizeWords(this.currentModule)} - Signademy`;
        document.title = title;
    }

    updateModuleInfo() {
        const moduleTitle = document.getElementById('module-title');
        const moduleDescription = document.getElementById('module-description');
        
        if (this.moduleData && this.moduleData.module) {
            // Use database content if available
            const module = this.moduleData.module;
            moduleTitle.textContent = module.display_name || 
                `Learn ${moduleContentLoader.capitalizeWords(this.currentModule)}`;
            
            // Use database description or fallback
            moduleDescription.textContent = module.description || this.getFallbackDescription(this.currentModule);
        } else {
            // Fallback to static titles and descriptions
            moduleTitle.textContent = `Learn ${moduleContentLoader.capitalizeWords(this.currentModule)}`;
            moduleDescription.textContent = this.getFallbackDescription(this.currentModule);
        }
    }

    getFallbackDescription(moduleName) {
        const descriptions = {
            alphabet: 'Practice ASL alphabet signs with real-time feedback using a camera. Select a letter to practice the corresponding hand sign.',
            numbers: 'Practice ASL number signs with real-time feedback using a camera. Select a number to practice the corresponding hand sign.',
            colors: 'Practice ASL color signs with real-time feedback using a camera. Select a color to practice the corresponding hand sign.',
            'basic-words': 'Practice ASL basic word signs with real-time feedback using a camera. Select a word to practice the corresponding hand sign.',
            family: 'Practice ASL family signs with real-time feedback using a camera. Select a family member to practice the corresponding hand sign.',
            food: 'Practice ASL food signs with real-time feedback using a camera. Select a food item to practice the corresponding hand sign.'
        };
        
        return descriptions[moduleName] || 
            `Practice ${moduleContentLoader.capitalizeWords(moduleName)} signs with real-time feedback using a camera.`;
    }

    generateQuickNavigation() {
        const container = document.getElementById('quick-alphabet');
        
        if (!this.moduleData.items || this.moduleData.items.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const quickLinks = this.moduleData.items.map(item => {
            const itemName = item.item_name || item.name;
            // Use full name and let CSS handle the display with wrapping
            const displayName = this.currentModule === 'alphabet' ? itemName.toUpperCase() : 
                                this.currentModule === 'numbers' ? itemName :
                                itemName.charAt(0).toUpperCase() + itemName.slice(1);
            
            return `<a href="#${this.getItemId(item)}" class="letter-quick-link">${displayName}</a>`;
        }).join('');
        
        container.innerHTML = quickLinks;
    }

    generateModuleGrid() {
        const container = document.getElementById('alphabet-grid');
        
        if (!this.moduleData.items || this.moduleData.items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #64748b; grid-column: 1 / -1;">
                    <h3>No items available</h3>
                    <p>This module doesn't have any learning items yet.</p>
                    <p><small>Module: ${this.currentModule}</small></p>
                </div>
            `;
            return;
        }
        
        console.log(`✅ Generating grid for ${this.moduleData.items.length} items from database`);
        
        // Debug: Log each item to check URLs
        this.moduleData.items.forEach((item, index) => {
            console.log(`📝 Item ${index + 1}: ${item.item_name}`, {
                video_url: item.video_url,
                image_url: item.image_url,
                description: item.description
            });
        });
        
        const itemsHtml = this.moduleData.items.map(item => {
            // Map database fields to expected format
            const itemName = item.item_name || item.name || 'Unknown';
            const displayName = this.currentModule === 'alphabet' ? itemName.toUpperCase() : itemName;
            const dataAttribute = this.currentModule === 'alphabet' ? itemName.toUpperCase() : 
                                 this.currentModule === 'numbers' ? itemName :
                                 itemName.replace(/\s+/g, '').toUpperCase();
            
            // Use database URLs (no fallback to local files)
            const videoUrl = item.video_url ? this.convertToDirectVideoUrl(item.video_url) : '';
            const imageUrl = item.image_url ? this.convertToDirectImageUrl(item.image_url) : '';
            const description = item.description || this.getDefaultDescription(itemName, this.currentModule);
            
            return `
                <div id="${this.getItemId(item)}" class="letter-card" data-letter="${dataAttribute}">
                    <div class="letter">${displayName}</div>
                    <div class="sign-image">
                        ${this.generateMediaElement(videoUrl, imageUrl, displayName)}
                        <div style="${(videoUrl || imageUrl) ? 'display: none;' : ''} padding: 1rem; background: #f1f5f9; color: #64748b; border-radius: 8px; text-align: center;">
                            ${(videoUrl || imageUrl) ? 'Media not available' : 'No media configured'}
                        </div>
                    </div>
                    <p>${description}</p>
                </div>
            `;
        }).join('');
        
        container.innerHTML = itemsHtml;
        
        // Add video modal to the page
        this.addVideoModal();
        
        // Initialize video controllers for the new content
        setTimeout(() => {
            this.initializeVideoControllers();
            this.setupCardSelection();
            this.initializeModuleVideos();
            this.ensureAllVideosMuted();
        }, 100);
    }

    setupCardSelection() {
        // Add click handlers for card selection
        document.querySelectorAll('.letter-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove previous selection
                document.querySelectorAll('.letter-card.selected').forEach(c => {
                    c.classList.remove('selected');
                });
                
                // Select this card
                card.classList.add('selected');
                this.selectedLetter = card.dataset.letter;
                
                // Reset audio feedback cooldown for new selection
                this.lastFeedbackTime = 0;
                this.lastDetectedGesture = null;
                
                // Play select sound
                const selectSound = document.getElementById('selectSound');
                if (selectSound) {
                    try {
                        // Ensure the audio is unmuted and has volume
                        selectSound.muted = false;
                        selectSound.volume = 1;
                        selectSound.currentTime = 0;
                        selectSound.play().catch(e => console.warn('Select sound play failed:', e));
                    } catch (error) {
                        console.warn('Error playing select sound:', error);
                    }
                }
                
                // Update gesture output to show selected item
                const gestureOutput = document.getElementById('gesture_output');
                if (gestureOutput) {
                    gestureOutput.textContent = `Selected: ${this.selectedLetter} - Show this sign to practice!`;
                }
                
                console.log('📝 Selected item:', this.selectedLetter);
            });
        });
        
        console.log('✅ Card selection setup complete');
    }

    getItemId(item) {
        const prefix = this.currentModule === 'alphabet' ? 'letter' : 'item';
        const itemName = item.item_name || item.name;
        const suffix = this.currentModule === 'alphabet' ? itemName.toUpperCase() : 
                      this.currentModule === 'numbers' ? itemName :
                      itemName.replace(/\s+/g, '-').toLowerCase();
        return `${prefix}-${suffix}`;
    }

    getDefaultDescription(itemName, moduleName) {
        const descriptions = {
            alphabet: {
                'A': 'Make a fist with your thumb alongside',
                'B': 'Hold your hand up with fingers together, thumb tucked',
                'C': 'Curve your hand in a C shape',
                'D': 'Index finger up, other fingers curled',
                'E': 'Curl all fingers, show fingertips',
                'F': 'Connect thumb and index, other fingers up',
                'G': 'Point index finger sideways, thumb straight',
                'H': 'Index and middle finger straight, others closed',
                'I': 'Pinky finger up, others closed',
                'J': 'Pinky up, draw a J in the air',
                'K': 'Index and middle finger up, thumb between',
                'L': 'Index finger and thumb make L shape',
                'M': 'Three fingers over thumb',
                'N': 'Two fingers over thumb',
                'O': 'Fingers curved into O shape',
                'P': 'Point middle finger down, index straight',
                'Q': 'Point index finger down, thumb out',
                'R': 'Cross index and middle finger',
                'S': 'Make a fist with thumb over fingers',
                'T': 'Thumb between index and middle finger',
                'U': 'Index and middle finger up together',
                'V': 'Index and middle finger in V shape',
                'W': 'Index, middle, and ring finger up',
                'X': 'Hook index finger, others closed',
                'Y': 'Thumb and pinky extended',
                'Z': 'Draw a Z with index finger'
            }
        };
        
        if (descriptions[moduleName] && descriptions[moduleName][itemName.toUpperCase()]) {
            return descriptions[moduleName][itemName.toUpperCase()];
        }
        
        return `Practice the sign for ${itemName}`;
    }

    getFallbackModuleData(moduleName) {
        const fallbackData = {
            alphabet: {
                module: {
                    id: 'alphabet',
                    name: 'alphabet',
                    description: 'Learn the ASL alphabet from A to Z'
                },
                items: this.generateAlphabetItems(),
                model: { model_path: '/static/models/letters.task' },
                hasAI: true
            },
            numbers: {
                module: {
                    id: 'numbers',
                    name: 'numbers',
                    description: 'Learn ASL numbers from 0 to 9'
                },
                items: this.generateNumberItems(),
                model: { model_path: '/static/models/numbers.task' },
                hasAI: true
            },
            colors: {
                module: {
                    id: 'colors',
                    name: 'colors',
                    description: 'Learn common color signs in ASL'
                },
                items: this.generateColorItems(),
                model: { model_path: '/static/models/colors.task' },
                hasAI: true
            },
            'basic-words': {
                module: {
                    id: 'basic-words',
                    name: 'basic-words',
                    description: 'Learn essential ASL vocabulary'
                },
                items: this.generateBasicWordItems(),
                model: { model_path: '/static/models/basicWords.task' },
                hasAI: true
            },
            family: {
                module: {
                    id: 'family',
                    name: 'family',
                    description: 'Learn family-related signs in ASL'
                },
                items: this.generateFamilyItems(),
                model: { model_path: '/static/models/family.task' },
                hasAI: true
            },
            food: {
                module: {
                    id: 'food',
                    name: 'food',
                    description: 'Learn food and drink signs in ASL'
                },
                items: this.generateFoodItems(),
                model: { model_path: '/static/models/food.task' },
                hasAI: true
            }
        };

        return fallbackData[moduleName] || {
            module: { id: 'unknown', name: moduleName, description: 'Unknown module' },
            items: [],
            model: null,
            hasAI: false
        };
    }

    initializeVideoControllers() {
        // Re-initialize the card video controller for dynamic content
        if (window.cardVideoController) {
            window.cardVideoController.setupCardControls();
        } else {
            // Create new instance if not available
            setTimeout(() => {
                if (window.CardVideoController) {
                    window.cardVideoController = new window.CardVideoController();
                }
            }, 50);
        }
    }

    async initializeAIModel() {
        if (this.modelLoading || !this.moduleData.model) return;
        
        try {
            this.modelLoading = true;
            console.log('🤖 Loading model for module:', this.currentModule);
            
            const modelUrl = this.moduleData.model.model_url || this.moduleData.model.model_path;
            if (!modelUrl) {
                console.warn('⚠️ No model URL available for module:', this.currentModule);
                this.hideModelLoadingProgress();
                return;
            }

            // Show progress bar and start loading
            this.showModelLoadingProgress();
            this.updateModelLoadingProgress(10, 'Importing MediaPipe components...');
            
            // Import MediaPipe classes (store them for use in recognition)
            const { GestureRecognizer, FilesetResolver, DrawingUtils } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3");
            
            this.updateModelLoadingProgress(30, 'MediaPipe components loaded...');
            
            // Store the classes for later use
            this.GestureRecognizer = GestureRecognizer;
            this.DrawingUtils = DrawingUtils;
            
            if (!GestureRecognizer || !FilesetResolver || !DrawingUtils) {
                console.error('❌ MediaPipe classes not available');
                this.showModelLoadingError('MediaPipe components not available');
                return;
            }
            
            this.updateModelLoadingProgress(50, 'Loading FilesetResolver...');
            
            // Load FilesetResolver
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            
            this.updateModelLoadingProgress(70, 'Creating gesture recognizer...');
            
            // Create gesture recognizer
            this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: modelUrl,
                    delegate: "GPU"
                },
                runningMode: this.runningMode
            });
            
            this.updateModelLoadingProgress(100, '✅ Model ready!');
            
            console.log('✅ Model loaded successfully for:', this.currentModule);
            this.modelLoading = false;
            
            // Show success for a moment, then hide
            setTimeout(() => {
                this.showModelLoadingSuccess();
                setTimeout(() => {
                    this.hideModelLoadingProgress();
                }, 2000);
            }, 500);
            
        } catch (error) {
            console.error('❌ Error loading model:', error);
            this.modelLoading = false;
            this.showModelLoadingError('Failed to load model: ' + error.message);
        }
    }

    // Progress bar helper methods
    showModelLoadingProgress() {
        const container = document.getElementById('model-loading-container');
        if (container) {
            container.style.display = 'block';
            container.className = 'model-loading-container';
        }
    }

    updateModelLoadingProgress(percentage, status) {
        const progressFill = document.getElementById('model-progress-fill');
        const progressText = document.getElementById('model-progress-text');
        const loadingStatus = document.getElementById('loading-status');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (progressText) {
            progressText.textContent = percentage + '%';
        }
        
        if (loadingStatus) {
            loadingStatus.textContent = status;
        }
    }

    showModelLoadingSuccess() {
        const container = document.getElementById('model-loading-container');
        const loadingStatus = document.getElementById('loading-status');
        
        if (container) {
            container.className = 'model-loading-container success';
        }
        
        if (loadingStatus) {
            loadingStatus.textContent = '✅ Model loaded successfully!';
        }
    }

    showModelLoadingError(errorMessage) {
        const container = document.getElementById('model-loading-container');
        const loadingStatus = document.getElementById('loading-status');
        
        if (container) {
            container.style.display = 'block';
            container.className = 'model-loading-container error';
        }
        
        if (loadingStatus) {
            loadingStatus.textContent = '❌ ' + errorMessage;
        }
        
        // Hide after 5 seconds
        setTimeout(() => {
            this.hideModelLoadingProgress();
        }, 5000);
    }

    hideModelLoadingProgress() {
        const container = document.getElementById('model-loading-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    setupWebcamControls() {
        const webcamButton = document.getElementById('webcamButton');
        const webcamVideo = document.getElementById('webcam');
        const gestureOutput = document.getElementById('gesture_output');
        
        if (!webcamButton || !webcamVideo) {
            console.warn('⚠️ Webcam elements not found');
            return;
        }
        
        // Reset button state
        webcamButton.textContent = 'Enable Camera';
        webcamButton.disabled = false;
        gestureOutput.textContent = 'Camera not started';
        
        // Remove any existing event listeners and replace button
        const newWebcamButton = webcamButton.cloneNode(true);
        webcamButton.parentNode.replaceChild(newWebcamButton, webcamButton);
        
        // Add click handler for webcam toggle
        newWebcamButton.addEventListener('click', () => {
            if (this.webcamActive) {
                this.stopWebcam();
            } else {
                this.startWebcam();
            }
        });
        
        console.log('✅ Webcam controls setup complete');
    }



    async startWebcam() {
        const webcamButton = document.getElementById('webcamButton');
        const webcamVideo = document.getElementById('webcam');
        const gestureOutput = document.getElementById('gesture_output');
        
        try {
            webcamButton.textContent = 'Starting...';
            webcamButton.disabled = true;
            gestureOutput.textContent = 'Starting camera...';
            
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            webcamVideo.srcObject = stream;
            webcamVideo.addEventListener('loadedmetadata', () => {
                webcamVideo.play();
                this.webcamActive = true;
                webcamButton.textContent = 'Stop Camera';
                webcamButton.disabled = false;
                gestureOutput.textContent = 'Camera active - Show a sign!';
                
                // Start gesture recognition if model is loaded
                if (this.gestureRecognizer) {
                    this.startGestureRecognition();
                } else if (this.modelLoading) {
                    gestureOutput.textContent = 'Camera active - Model loading...';
                } else {
                    gestureOutput.textContent = 'Camera active - Model not available for this module';
                }
            });
            
            console.log('✅ Webcam started successfully');
            
        } catch (error) {
            console.error('❌ Error starting webcam:', error);
            webcamButton.textContent = 'Enable Camera';
            webcamButton.disabled = false;
            gestureOutput.textContent = 'Camera access denied or not available';
        }
    }

    stopWebcam() {
        const webcamButton = document.getElementById('webcamButton');
        const webcamVideo = document.getElementById('webcam');
        const gestureOutput = document.getElementById('gesture_output');
        
        try {
            // Stop video stream
            if (webcamVideo.srcObject) {
                const tracks = webcamVideo.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                webcamVideo.srcObject = null;
            }
            
            this.webcamActive = false;
            webcamButton.textContent = 'Enable Camera';
            gestureOutput.textContent = 'Camera stopped';
            
            console.log('✅ Webcam stopped');
            
        } catch (error) {
            console.error('❌ Error stopping webcam:', error);
        }
    }

    startGestureRecognition() {
        const webcamVideo = document.getElementById('webcam');
        const gestureOutput = document.getElementById('gesture_output');
        const canvas = document.getElementById('output_canvas');
        
        if (!this.gestureRecognizer || !webcamVideo || !canvas) {
            console.warn('⚠️ Gesture recognition requirements not met');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        canvas.width = webcamVideo.videoWidth || 640;
        canvas.height = webcamVideo.videoHeight || 480;
        
        // Variables for video-based recognition
        let lastVideoTime = -1;
        let results = undefined;
        
        // Recognition loop
        const recognizeLoop = async () => {
            if (!this.webcamActive || !this.gestureRecognizer) return;
            
            try {
                // Set canvas size to match video
                if (webcamVideo.videoWidth && webcamVideo.videoHeight) {
                    canvas.width = webcamVideo.videoWidth;
                    canvas.height = webcamVideo.videoHeight;
                }
                
                // Switch to VIDEO mode if needed
                if (this.runningMode === "IMAGE") {
                    this.runningMode = "VIDEO";
                    await this.gestureRecognizer.setOptions({ runningMode: "VIDEO" });
                }
                
                // Perform gesture recognition for video
                let nowInMs = Date.now();
                if (webcamVideo.currentTime !== lastVideoTime) {
                    lastVideoTime = webcamVideo.currentTime;
                    results = this.gestureRecognizer.recognizeForVideo(webcamVideo, nowInMs);
                }
                
                // Clear canvas and prepare for drawing
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw hand landmarks if available (using stored DrawingUtils)
                if (results && results.landmarks && this.DrawingUtils && this.GestureRecognizer) {
                    const drawingUtils = new this.DrawingUtils(ctx);
                    
                    for (const landmarks of results.landmarks) {
                        // Draw hand connections (skeleton) - use static HAND_CONNECTIONS
                        drawingUtils.drawConnectors(landmarks, this.GestureRecognizer.HAND_CONNECTIONS, {
                            color: "#00FF00", // Green connections
                            lineWidth: 2
                        });
                        
                        // Draw landmark points
                        drawingUtils.drawLandmarks(landmarks, {
                            color: "#FF0000", // Red points
                            lineWidth: 1
                        });
                    }
                }
                
                ctx.restore();
                
                // Process gesture results
                if (results && results.gestures && results.gestures.length > 0) {
                    const topGesture = results.gestures[0][0];
                    const confidence = Math.round(topGesture.score * 100);
                    const gestureName = topGesture.categoryName;
                    
                    // Check if user has selected a card to practice
                    if (this.selectedLetter) {
                        // Validate gesture against selected card
                        this.validateGesture(gestureName, confidence);
                    } else {
                        // No card selected - just show detection
                        gestureOutput.textContent = `Detected: ${gestureName} - Select a card to practice!`;
                        
                        // Still highlight matching card for reference
                        if (confidence >= 60) {
                            this.highlightMatchingCard(gestureName);
                        }
                    }
                } else {
                    if (this.selectedLetter) {
                        gestureOutput.textContent = `Show the sign for "${this.selectedLetter}" to the camera`;
                    } else {
                        gestureOutput.textContent = 'Select a card and show its sign to the camera';
                    }
                }
                
            } catch (error) {
                console.warn('⚠️ Recognition error:', error);
                gestureOutput.textContent = 'Recognition error - try again';
            }
            
            // Continue loop
            if (this.webcamActive) {
                requestAnimationFrame(recognizeLoop);
            }
        };
        
        // Start the recognition loop
        recognizeLoop();
    }

    highlightMatchingCard(gestureName) {
        // Remove existing highlights
        document.querySelectorAll('.letter-card.recognized').forEach(card => {
            card.classList.remove('recognized');
        });
        
        // Find and highlight matching card
        const matchingCard = document.querySelector(`[data-letter="${gestureName.toUpperCase()}"]`);
        if (matchingCard) {
            matchingCard.classList.add('recognized');
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
                matchingCard.classList.remove('recognized');
            }, 2000);
        }
    }

    validateGesture(detectedGesture, confidence) {
        const gestureOutput = document.getElementById('gesture_output');
        const minConfidence = 60; // Minimum confidence for validation
        const currentTime = Date.now();
        
        // Normalize both gestures for comparison
        const normalizedDetected = this.normalizeGestureName(detectedGesture);
        const normalizedSelected = this.normalizeGestureName(this.selectedLetter);
        
        console.log(`🔍 Validating: detected="${normalizedDetected}" vs selected="${normalizedSelected}" (${confidence}%)`);
        
        // Check if we're in cooldown period and same gesture
        const isSameGesture = normalizedDetected === this.lastDetectedGesture;
        const isInCooldown = (currentTime - this.lastFeedbackTime) < this.feedbackCooldown;
        
        if (confidence >= minConfidence) {
            if (normalizedDetected === normalizedSelected) {
                // CORRECT GESTURE!
                if (!isInCooldown || !isSameGesture) {
                    this.showCorrectFeedback(detectedGesture, confidence);
                    this.lastFeedbackTime = currentTime;
                    this.lastDetectedGesture = normalizedDetected;
                }
            } else {
                // INCORRECT GESTURE
                if (!isInCooldown || !isSameGesture) {
                    this.showIncorrectFeedback(detectedGesture, confidence, this.selectedLetter);
                    this.lastFeedbackTime = currentTime;
                    this.lastDetectedGesture = normalizedDetected;
                }
            }
        } else {
            // Low confidence - encourage user (no cooldown for this)
            gestureOutput.textContent = `Try again! Show the sign for "${this.selectedLetter}" more clearly`;
            gestureOutput.style.color = '#f59e0b'; // Amber color for low confidence
        }
    }

    normalizeGestureName(gestureName) {
        if (!gestureName) return '';
        
        // Handle different naming conventions
        const normalized = gestureName.toUpperCase().trim();
        
        // Map common variations
        const mappings = {
            'THANK YOU': 'THANKYOU',
            'THANK_YOU': 'THANKYOU',
            'GOOD BYE': 'GOODBYE',
            'GOOD_BYE': 'GOODBYE',
            // Add more mappings as needed
        };
        
        return mappings[normalized] || normalized;
    }

    showCorrectFeedback(detectedGesture, confidence) {
        const gestureOutput = document.getElementById('gesture_output');
        const selectedCard = document.querySelector('.letter-card.selected');
        
        // Update UI with success message
        gestureOutput.textContent = `✅ Correct! Great job signing "${this.selectedLetter}"`;
        gestureOutput.style.color = '#22c55e'; // Green color for success
        
        // Add success animation to selected card
        if (selectedCard) {
            selectedCard.classList.add('correct-gesture');
            setTimeout(() => {
                selectedCard.classList.remove('correct-gesture');
            }, 2000);
        }
        
        // Play correct sound
        this.playFeedbackSound('correct');
        
        // Keep the success message for a while, then show encouragement
        setTimeout(() => {
            gestureOutput.textContent = `Keep practicing "${this.selectedLetter}" or select another card!`;
            gestureOutput.style.color = '#64748b'; // Reset color
        }, 3000);
        
        console.log('✅ Correct gesture detected!');
    }

    showIncorrectFeedback(detectedGesture, confidence, expectedGesture) {
        const gestureOutput = document.getElementById('gesture_output');
        const selectedCard = document.querySelector('.letter-card.selected');
        
        // Update UI with helpful message
        gestureOutput.textContent = `❌ Detected "${detectedGesture}" but expected "${expectedGesture}". Try again!`;
        gestureOutput.style.color = '#ef4444'; // Red color for incorrect
        
        // Add error animation to selected card
        if (selectedCard) {
            selectedCard.classList.add('incorrect-gesture');
            setTimeout(() => {
                selectedCard.classList.remove('incorrect-gesture');
            }, 1500);
        }
        
        // Play incorrect sound
        this.playFeedbackSound('incorrect');
        
        // Reset message after a few seconds
        setTimeout(() => {
            gestureOutput.textContent = `Keep trying! Show the sign for "${expectedGesture}"`;
            gestureOutput.style.color = '#64748b'; // Reset color
        }, 2500);
        
        console.log('❌ Incorrect gesture detected');
    }

    playFeedbackSound(type) {
        const audioId = type === 'correct' ? 'correctSound' : 'incorrectSound';
        const audioElement = document.getElementById(audioId);
        
        if (audioElement) {
            try {
                // Ensure the audio is unmuted and has volume
                audioElement.muted = false;
                audioElement.volume = 1;
                
                audioElement.currentTime = 0; // Reset to start
                const playPromise = audioElement.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log(`🔊 Playing ${type} sound successfully`);
                    }).catch(error => {
                        console.warn(`⚠️ Failed to play ${type} sound:`, error);
                        // Try again without reset
                        setTimeout(() => {
                            audioElement.muted = false;
                            audioElement.volume = 1;
                            audioElement.play().catch(e => console.warn('Second attempt failed:', e));
                        }, 100);
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Error playing ${type} sound:`, error);
            }
        } else {
            console.warn(`⚠️ ${type} audio element not found`);
        }
    }

    generateAlphabetItems() {
        return Array.from({ length: 26 }, (_, i) => {
            const letter = String.fromCharCode(65 + i);
            return {
                id: `alphabet-${letter}`,
                name: letter,
                description: this.getDefaultDescription(letter, 'alphabet'),
                video_url: '', // No local fallback URLs
                image_url: ''  // No local fallback URLs
            };
        });
    }

    generateNumberItems() {
        return Array.from({ length: 10 }, (_, i) => ({
            id: `number-${i}`,
            name: i.toString(),
            description: `Show the number ${i} in ASL`,
            video_url: '', // No local fallback URLs
            image_url: ''  // No local fallback URLs
        }));
    }

    generateColorItems() {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Black', 'White'];
        return colors.map(color => ({
            id: `color-${color.toLowerCase()}`,
            name: color,
            description: `Sign for the color ${color.toLowerCase()}`,
            video_url: '', // No local fallback URLs
            image_url: ''  // No local fallback URLs
        }));
    }

    generateBasicWordItems() {
        const words = ['Hello', 'Goodbye', 'Please', 'Thank You', 'Sorry', 'Yes', 'No', 'Good', 'Bad', 'Help'];
        return words.map(word => ({
            id: `basic-${word.toLowerCase().replace(' ', '-')}`,
            name: word,
            description: `Sign for "${word}"`,
            video_url: '', // No local fallback URLs
            image_url: ''  // No local fallback URLs
        }));
    }

    generateFamilyItems() {
        const family = ['Mother', 'Father', 'Sister', 'Brother', 'Grandmother', 'Grandfather', 'Baby', 'Child', 'Family', 'Friend'];
        return family.map(member => ({
            id: `family-${member.toLowerCase()}`,
            name: member,
            description: `Sign for "${member}"`,
            video_url: '', // No local fallback URLs
            image_url: ''  // No local fallback URLs
        }));
    }

    generateFoodItems() {
        const foods = ['Water', 'Milk', 'Bread', 'Apple', 'Banana', 'Pizza', 'Hamburger', 'Coffee', 'Tea', 'Cookie'];
        return foods.map(food => ({
            id: `food-${food.toLowerCase()}`,
            name: food,
            description: `Sign for "${food}"`,
            video_url: '', // No local fallback URLs
            image_url: ''  // No local fallback URLs
        }));
    }
    
    // Generate appropriate media element based on URL type
    generateMediaElement(videoUrl, imageUrl, displayName) {
        if (videoUrl) {
            // Determine the video type and generate appropriate element
            const isYoutube = videoUrl.includes('youtube.com/embed/');
            const isGoogleDrive = videoUrl.includes('drive.google.com');
            
            if (isYoutube) {
                // For YouTube, use iframe thumbnail
                return `
                    <div class="video-container">
                        <div class="video-thumbnail" onclick="showContainerVideo('${videoUrl}', '${displayName}', 'iframe')">
                            <iframe src="${videoUrl}?embedded=true" frameborder="0" 
                                    class="responsive-video-thumbnail"
                                    scrolling="no"
                                    style="pointer-events: none;">
                            </iframe>
                            <div class="play-overlay">
                                <div class="play-button">▶</div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (isGoogleDrive) {
                // For Google Drive, create a placeholder thumbnail
                return `
                    <div class="video-container">
                        <div class="video-thumbnail" onclick="showContainerVideo('${videoUrl}', '${displayName}', 'googledrive')">
                            <div class="google-drive-thumbnail">
                                <div class="drive-icon">🎬</div>
                                <p>Google Drive Video</p>
                                <p class="video-name">${displayName}</p>
                            </div>
                            <div class="play-overlay">
                                <div class="play-button">▶</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // For other direct videos, use video element
                return `
                    <div class="video-container">
                        <div class="video-thumbnail" onclick="showContainerVideo('${videoUrl}', '${displayName}', 'video')">
                            <video class="responsive-video-thumbnail" muted preload="metadata">
                                <source src="${videoUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <div class="play-overlay">
                                <div class="play-button">▶</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else if (imageUrl) {
            return `
                <div class="image-container">
                    <img src="${imageUrl}" class="responsive-image" alt="${displayName} sign" 
                         onerror="console.error('Image failed to load:', '${imageUrl}'); this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='block';"
                         onload="console.log('Image loaded successfully:', '${imageUrl}');">
                </div>
            `;
        }
        
        return '';
    }

    
    addVideoModal() {
        // Create the container video modal HTML and add it to the page
        const existingModal = document.getElementById('container-video-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div id="container-video-modal" class="container-video-modal" style="display: none;" onclick="event.stopPropagation()">
                <div class="container-video-header">
                    <span id="container-video-title" class="video-title">Video Demonstration</span>
                    <button onclick="closeContainerVideo()" class="close-container-btn">×</button>
                </div>
                <div id="container-video-content" class="container-video-content">
                    <div class="video-loading-container">
                        <div class="loading-spinner"></div>
                        <p>Loading video...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the modal into the alphabet-section (container area)
        const alphabetSection = document.querySelector('.alphabet-section');
        if (alphabetSection) {
            alphabetSection.insertAdjacentHTML('afterbegin', modalHTML);
            
            // Add click-outside-to-close functionality
            alphabetSection.addEventListener('click', (e) => {
                const modal = document.getElementById('container-video-modal');
                if (e.target === alphabetSection && modal && modal.style.display === 'block') {
                    closeContainerVideo();
                }
            });
        } else {
            // Fallback: add to practice-container
            const practiceContainer = document.querySelector('.practice-container');
            if (practiceContainer) {
                practiceContainer.insertAdjacentHTML('afterbegin', modalHTML);
                
                // Add click-outside-to-close functionality
                practiceContainer.addEventListener('click', (e) => {
                    const modal = document.getElementById('container-video-modal');
                    if (e.target === practiceContainer && modal && modal.style.display === 'block') {
                        closeContainerVideo();
                    }
                });
            }
        }
        
        // Add global functions for container video control
        window.showContainerVideo = (videoUrl, title, videoType = 'video') => {
            const modal = document.getElementById('container-video-modal');
            const videoTitle = document.getElementById('container-video-title');
            const videoContent = document.getElementById('container-video-content');
            const alphabetSection = document.querySelector('.alphabet-section');
            
            if (!modal) return;
            
            // Set title
            videoTitle.textContent = `${title} Demonstration`;
            
            // Add backdrop effect
            if (alphabetSection) {
                alphabetSection.classList.add('video-modal-open');
            }
            
            // Show modal with animation
            modal.style.display = 'block';
            
            // Load video after a short delay for smooth animation
            setTimeout(() => {
                if (videoUrl.includes('drive.google.com') || videoType === 'iframe') {
                    // For all iframe videos (Google Drive, YouTube, etc.) - just load them
                    videoContent.innerHTML = `
                        <iframe src="${videoUrl}" 
                                frameborder="0" 
                                class="container-video-iframe"
                                allow="autoplay; fullscreen"
                                allowfullscreen>
                        </iframe>
                    `;
                } else {
                    // For direct video files - always muted
                    videoContent.innerHTML = `
                        <video class="container-video-iframe" controls muted>
                            <source src="${videoUrl}" type="video/mp4">
                            <p>Video format not supported by your browser.</p>
                        </video>
                    `;
                }
                
                // Force mute any video elements after loading
                setTimeout(() => {
                    const video = videoContent.querySelector('video');
                    if (video) {
                        video.muted = true;
                        video.volume = 0;
                        console.log('🔇 Force muted video element');
                    }
                }, 500);
            }, 300);
        };
        
        window.closeContainerVideo = () => {
            const modal = document.getElementById('container-video-modal');
            const videoContent = document.getElementById('container-video-content');
            const alphabetSection = document.querySelector('.alphabet-section');
            
            if (modal) {
                // Remove backdrop effect
                if (alphabetSection) {
                    alphabetSection.classList.remove('video-modal-open');
                }
                
                // Hide modal
                modal.style.display = 'none';
                
                // Reset video content
                videoContent.innerHTML = `
                    <div class="video-loading-container">
                        <div class="loading-spinner"></div>
                        <p>Loading video...</p>
                    </div>
                `;
            }
        };
    }
    
    // Convert Google Drive sharing URLs to direct playable URLs
    convertToDirectVideoUrl(url) {
        if (!url) return '';
        
        // Handle Google Drive URLs - convert to embed format for public access
        const googleDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(googleDriveRegex);
        
        if (match) {
            const fileId = match[1];
            // Use the embed URL format which works for public files without sign-in
            const directUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            console.log(`🔄 Converted to Google Drive embed URL: ${url} → ${directUrl}`);
            return directUrl;
        }
        
        // Handle YouTube URLs (convert to embed)
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
        const youtubeMatch = url.match(youtubeRegex);
        
        if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            console.log(`🔄 Converted YouTube URL: ${url} → ${embedUrl}`);
            return embedUrl;
        }
        
        // For other URLs (direct video files), return as-is
        return url;
    }
    
    // Convert Google Drive sharing URLs to direct image URLs
    convertToDirectImageUrl(url) {
        if (!url) return '';
        
        // Handle Google Drive URLs
        const googleDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(googleDriveRegex);
        
        if (match) {
            const fileId = match[1];
            const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            console.log(`🔄 Converted Google Drive URL: ${url} → ${directUrl}`);
            return directUrl;
        }
        
        // For other URLs, return as-is
        return url;
    }
    
    // Initialize videos in module cards
    initializeModuleVideos() {
        const videos = document.querySelectorAll('.letter-card video');
        console.log(`🎬 Initializing ${videos.length} videos in module cards`);
        
        videos.forEach((video, index) => {
            const src = video.getAttribute('src');
            console.log(`🎬 Video ${index + 1}: ${src}`);
            
            // Ensure video is muted
            video.muted = true;
            
            // Add hover play/pause functionality
            const card = video.closest('.letter-card');
            
            if (card) {
                card.addEventListener('mouseenter', () => {
                    if (video.paused) {
                        video.play().catch(error => {
                            console.warn('⚠️ Video autoplay failed (this is normal in many browsers):', error);
                        });
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0; // Reset to beginning
                });
                
                // Also try to play on click
                card.addEventListener('click', () => {
                    if (video.paused) {
                        video.play().catch(error => {
                            console.warn('⚠️ Video play on click failed:', error);
                        });
                    }
                });
            }
            
            // Set up error handling
            video.addEventListener('error', (e) => {
                console.error('❌ Video error:', e.target.error);
                console.error(`❌ Failed video URL: ${src}`);
            });
            
            video.addEventListener('loadeddata', () => {
                console.log(`✅ Video loaded successfully: ${src}`);
            });
        });
    }
    
    // Ensure all videos are muted - OPTIMIZED MUTING
    ensureAllVideosMuted() {
        console.log('🔇 Starting optimized video muting system...');
        
        let processedVideos = new WeakSet();
        let mutingInProgress = false;
        
        // Function to intelligently mute videos
        const smartMuteVideos = () => {
            if (mutingInProgress) return;
            mutingInProgress = true;
            
            const allVideos = document.querySelectorAll('video');
            let newlyMuted = 0;
            
            allVideos.forEach(video => {
                // Only process if not already correctly muted or not processed before
                if (!processedVideos.has(video) || !video.muted || video.volume > 0) {
                    video.muted = true;
                    video.volume = 0;
                    video.removeAttribute('autoplay');
                    
                    if (!processedVideos.has(video)) {
                        processedVideos.add(video);
                        newlyMuted++;
                    }
                }
            });
            
            if (newlyMuted > 0) {
                console.log(`🔇 Muted ${newlyMuted} new videos (${allVideos.length} total)`);
            }
            
            mutingInProgress = false;
        };
        
        // Mute existing videos immediately
        smartMuteVideos();
        
        // Throttled observer for new videos (prevents excessive calls)
        let observerTimeout;
        const throttledMuteObserver = new MutationObserver((mutations) => {
            // Only react to actual video additions
            const hasNewVideos = mutations.some(mutation => 
                mutation.type === 'childList' && 
                Array.from(mutation.addedNodes).some(node => 
                    node.tagName === 'VIDEO' || 
                    (node.querySelectorAll && node.querySelectorAll('video').length > 0)
                )
            );
            
            if (hasNewVideos) {
                clearTimeout(observerTimeout);
                observerTimeout = setTimeout(smartMuteVideos, 200);
            }
        });
        
        throttledMuteObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false // Don't watch attributes to prevent loops
        });
        
        // Event-based muting (silent - no console spam)
        ['play', 'playing', 'loadeddata', 'canplay'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                if (event.target.tagName === 'VIDEO') {
                    if (!event.target.muted || event.target.volume > 0) {
                        event.target.muted = true;
                        event.target.volume = 0;
                    }
                }
            }, true);
        });
        
        console.log('✅ Optimized video muting system initialized');
    }
}

// Initialize the universal module template when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.universalModuleTemplate = new UniversalModuleTemplate();
});

export default UniversalModuleTemplate;