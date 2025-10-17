// Admin Dashboard for Signademy
// Handles authentication, model management, and Supabase interactions

// Supabase Configuration
const SUPABASE_URL = 'https://rgxalrnmnlbmskupyhcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGFscm5tbmxibXNrdXB5aGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MjExMzYsImV4cCI6MjA2MDI5NzEzNn0.sB4B5_kwyng0kZ7AHD_lnSpLJ3WfseYwDW1o5-foG-E';
const STORAGE_BUCKET = 'signlanguage';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logout-button');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const addModelButton = document.getElementById('add-model-button');
const modelModal = document.getElementById('model-modal');
const closeModal = document.querySelector('.close-modal');
const cancelButton = document.querySelector('.cancel-button');
const modelForm = document.getElementById('model-form');
const modelList = document.getElementById('model-list');
const settingsForm = document.getElementById('settings-form');
const modelIdInput = document.getElementById('model-id');
const modalTitle = document.getElementById('modal-title');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadProgressText = document.getElementById('upload-progress-text');
const uploadProgress = document.querySelector('.upload-progress');
const debugStorageButton = document.getElementById('debug-storage-button');
const verifyModelsButton = document.getElementById('verify-models-button');
const debugOutput = document.getElementById('debug-output');

// Content Management DOM Elements
const moduleSelector = document.getElementById('module-selector');
const addModuleBtn = document.getElementById('add-module-btn');
const editModuleBtn = document.getElementById('edit-module-btn');
const deleteModuleBtn = document.getElementById('delete-module-btn');
const moduleModal = document.getElementById('module-modal');
const closeModuleModal = document.getElementById('close-module-modal');
const cancelModuleBtn = document.getElementById('cancel-module-btn');
const moduleForm = document.getElementById('module-form');
const itemsManagement = document.getElementById('items-management');
const selectedModuleName = document.getElementById('selected-module-name');
const moduleItemsList = document.getElementById('module-items-list');
const addItemBtn = document.getElementById('add-item-btn');
const itemModal = document.getElementById('item-modal');
const closeItemModal = document.getElementById('close-item-modal');
const cancelItemBtn = document.getElementById('cancel-item-btn');
const itemForm = document.getElementById('item-form');
const modelAssociation = document.getElementById('model-association');
const associatedModel = document.getElementById('associated-model');
const modelInfoDisplay = document.getElementById('model-info-display');
const saveAssociationBtn = document.getElementById('save-association-btn');
const testModelBtn = document.getElementById('test-model-btn');
const modelModuleName = document.getElementById('model-module-name');

// Model display names mapping
const MODEL_DISPLAY_NAMES = {
    alphabet: 'Letters (A-Z)',
    numbers: 'Numbers (0-9)', 
    colors: 'Colors',
    basicWords: 'Basic Words',
    family: 'Family & People',
    food: 'Food & Drinks'
};

// Cache for module data from database
let cachedModules = new Map();
let cachedModuleItems = new Map();

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
});

// Check if user is already logged in
async function initializeAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        showAdminDashboard();
        loadModels();
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout button
    logoutButton.addEventListener('click', handleLogout);
    
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // Model modal controls
    addModelButton.addEventListener('click', openAddModelModal);
    closeModal.addEventListener('click', closeModelModal);
    cancelButton.addEventListener('click', closeModelModal);
    
    // Model form submission
    modelForm.addEventListener('submit', handleModelSubmit);
    
    // Settings form submission
    settingsForm.addEventListener('submit', handleSettingsSubmit);
    
    // Auto-fill display name and update required filename when category changes
    document.getElementById('model-category').addEventListener('change', function() {
        const category = this.value;
        const displayNameInput = document.getElementById('model-display-name');
        const requiredFilenameDisplay = document.getElementById('required-filename');
        
        if (category && MODEL_DISPLAY_NAMES[category]) {
            displayNameInput.value = MODEL_DISPLAY_NAMES[category];
        }
        
        // Update required filename display
        if (requiredFilenameDisplay) {
            if (!category) {
                requiredFilenameDisplay.textContent = 'Please select a category';
                requiredFilenameDisplay.classList.remove('highlight');
            } else {
                const expectedFilenames = getExpectedFilenamesForCategory(category);
                if (expectedFilenames && expectedFilenames.length > 0) {
                    requiredFilenameDisplay.textContent = expectedFilenames[0];
                    requiredFilenameDisplay.classList.add('highlight');
                } else {
                    requiredFilenameDisplay.textContent = `${category}.task`;
                    requiredFilenameDisplay.classList.add('highlight');
                }
            }
        }
    });
    
    // Debug storage button
    if (debugStorageButton) {
        debugStorageButton.addEventListener('click', runStorageDebug);
    }
    
    // Verify models button
    if (verifyModelsButton) {
        verifyModelsButton.addEventListener('click', runModelVerification);
    }
    
    // Media tab setup
    const mediaTypeFilter = document.getElementById('media-type-filter');
    if (mediaTypeFilter) {
        mediaTypeFilter.addEventListener('change', function() {
            loadMediaItems(this.value);
        });
    }
    
    // Media upload form
    const mediaUploadForm = document.getElementById('media-upload-form');
    if (mediaUploadForm) {
        mediaUploadForm.addEventListener('submit', handleMediaUpload);
    }
    
    // Content Management Event Listeners
    if (moduleSelector) {
        moduleSelector.addEventListener('change', handleModuleSelection);
    }
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', openAddModuleModal);
    }
    if (editModuleBtn) {
        editModuleBtn.addEventListener('click', openEditModuleModal);
    }
    if (deleteModuleBtn) {
        deleteModuleBtn.addEventListener('click', handleDeleteModule);
    }
    if (closeModuleModal) {
        closeModuleModal.addEventListener('click', closeModuleModalFunc);
    }
    if (cancelModuleBtn) {
        cancelModuleBtn.addEventListener('click', closeModuleModalFunc);
    }
    if (moduleForm) {
        moduleForm.addEventListener('submit', handleModuleSubmit);
    }
    if (addItemBtn) {
        addItemBtn.addEventListener('click', openAddItemModal);
    }
    if (closeItemModal) {
        closeItemModal.addEventListener('click', closeItemModalFunc);
    }
    if (cancelItemBtn) {
        cancelItemBtn.addEventListener('click', closeItemModalFunc);
    }
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemSubmit);
    }
    if (associatedModel) {
        associatedModel.addEventListener('change', handleModelSelection);
    }
    if (saveAssociationBtn) {
        saveAssociationBtn.addEventListener('click', handleSaveAssociation);
    }
    if (testModelBtn) {
        testModelBtn.addEventListener('click', handleTestModel);
    }
    
    // Media selection radio button logic
    setupMediaTypeSelection();
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('login-button');
    
    // Show loading state
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner"></span> Logging in...';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            showLoginMessage(error.message, 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'Log In';
            return;
        }
        
        showAdminDashboard();
        loadModels();
        
    } catch (error) {
        showLoginMessage('An unexpected error occurred. Please try again.', 'error');
        console.error('Login error:', error);
        loginButton.disabled = false;
        loginButton.textContent = 'Log In';
    }
}

// Handle logout button click
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        showLoginSection();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show login message with type (error or success)
function showLoginMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = 'message';
    loginMessage.classList.add(`${type}-message`);
}

// Show admin dashboard, hide login section
function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
}

// Show login section, hide admin dashboard
function showLoginSection() {
    adminDashboard.style.display = 'none';
    loginSection.style.display = 'block';
    
    // Clear login form
    loginForm.reset();
    loginMessage.className = 'message';
}

// Switch between tabs
function switchTab(tabName) {
    // Update active tab button
    tabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    // Show selected tab content
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.style.display = 'block';
            
            // Load content for the active tab
            if (tabName === 'models') {
                loadModels();
            } else if (tabName === 'content') {
                loadContentManagement();
            } else if (tabName === 'media') {
                const mediaTypeFilter = document.getElementById('media-type-filter');
                const selectedType = mediaTypeFilter ? mediaTypeFilter.value : 'all';
                loadMediaItems(selectedType);
            }
        } else {
            content.style.display = 'none';
        }
    });
}

// Open modal for adding a new model
function openAddModelModal() {
    modalTitle.textContent = 'Add New Model';
    modelForm.reset();
    modelIdInput.value = '';
    document.getElementById('model-file').required = true;
    uploadProgressBar.style.width = '0%';
    uploadProgressText.textContent = '0%';
    uploadProgress.style.display = 'none';
    
    // Hide filename options by default
    const filenameOptions = document.getElementById('filename-options');
    if (filenameOptions) {
        filenameOptions.style.display = 'none';
    }
    
    // Default the letters.task checkbox to checked for better compatibility
    const useLettersCheckbox = document.getElementById('use-letters-filename');
    if (useLettersCheckbox) {
        useLettersCheckbox.checked = true;
    }
    
    modelModal.style.display = 'block';
}

// Open modal for editing an existing model
function openEditModelModal(model) {
    modalTitle.textContent = 'Update Model';
    modelIdInput.value = model.id;
    
    const categorySelect = document.getElementById('model-category');
    const displayNameInput = document.getElementById('model-display-name');
    
    // Set values from model
    categorySelect.value = model.category;
    displayNameInput.value = model.displayName;
    
    // File is not required when editing
    document.getElementById('model-file').required = false;
    
    uploadProgressBar.style.width = '0%';
    uploadProgressText.textContent = '0%';
    uploadProgress.style.display = 'none';
    
    modelModal.style.display = 'block';
}

// Close the model modal
function closeModelModal() {
    modelModal.style.display = 'none';
}

// Handle model form submission
async function handleModelSubmit(e) {
    e.preventDefault();
    
    const modelId = modelIdInput.value;
    const category = document.getElementById('model-category').value;
    const displayName = document.getElementById('model-display-name').value;
    const modelFile = document.getElementById('model-file').files[0];
    
    // Get form's submit button
    const submitButton = modelForm.querySelector('button[type="submit"]');
    
    // Validate file selection
    if (!modelFile) {
        showModalMessage('Please select a model file to upload.', 'error');
        return;
    }
    
    // Validate and enforce filename conventions
    const expectedFilenames = getExpectedFilenamesForCategory(category);
    const originalFilename = modelFile.name;
    
    console.log("Validating filename:", originalFilename, "against expected:", expectedFilenames);
    
    // Check if the uploaded file has one of the expected names (strict matching)
    const isValidFilename = expectedFilenames.some(expectedName => 
        originalFilename.toLowerCase() === expectedName.toLowerCase()
    );
    
    // If filename doesn't match category, show error and block upload
    if (!isValidFilename) {
        submitButton.disabled = false;
        showFilenameWarning(category, originalFilename, expectedFilenames);
        console.log("Filename validation failed, showing error message. Upload blocked.");
        return;
    }
    
    // Check if a model for this category already exists in storage
    try {
        const { data: files, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list();
            
        if (!error && files) {
            const expectedFilename = expectedFilenames[0]; // We now only have one expected filename per category
            const existingModel = files.find(file => 
                file.name.toLowerCase() === expectedFilename.toLowerCase()
            );
            
            console.log("Checking for existing model:", expectedFilename, "Found:", !!existingModel);
            
            // If we found an existing model and it's not the one we're editing, confirm replacement
            // Allow bypass if the hidden override input exists
            if (existingModel && !document.getElementById('override-model-input')) {
                submitButton.disabled = false;
                showExistingModelWarning(category, expectedFilename);
                console.log("Existing model found, showing replacement warning");
                return;
            }
        }
    } catch (checkError) {
        console.warn("Error checking for existing model:", checkError);
        // Continue with upload even if check fails
    }
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Saving...';
    
    // Check auth status first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        try {
            // Try to refresh the session
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshedSession) {
                alert('Your session has expired. Please log in again.');
                showLoginSection();
                return;
            }
        } catch (refreshErr) {
            alert('Authentication error. Please log in again.');
            showLoginSection();
            return;
        }
    }
    
    // Show upload progress
    uploadProgress.style.display = 'block';
    
    try {
        let modelUrl = null;
        
        // If a file was selected, upload it
        if (modelFile) {
            // Get the proper filename based on category
            let fileName = `${category}.task`;
            
            // Special case for alphabet - use letters.task for better compatibility
            if (category === 'alphabet') {
                fileName = 'letters.task';
            }
            
            console.log(`Uploading model for category ${category} as filename: ${fileName}`);
            
            // Make sure we're authenticated before uploading
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                throw new Error('You must be logged in to upload models. Please log in again.');
            }
            
            // Create an upload client that tracks progress
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(fileName, modelFile, {
                    cacheControl: '3600',
                    upsert: true,
                    onUploadProgress: (progress) => {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        uploadProgressBar.style.width = `${percent}%`;
                        uploadProgressText.textContent = `${percent}%`;
                    }
                });
            
            if (error) {
                throw new Error(`Error uploading model: ${error.message}`);
            }
            
            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(fileName);
                
            modelUrl = publicUrl;
        }
        
        // Update model in the database
        if (modelId) {
            // This is an edit - update existing model
            // Here we would normally update a database record
            // For this example, we'll just refresh the model list
        } else {
            // This is an add - create new model
            // Here we would normally insert a database record
            // For this example, we'll just refresh the model list
        }
        
        // Close the modal and refresh the model list
        closeModelModal();
        loadModels();
        
        // Show success message
        alert('Model saved successfully!');
        
    } catch (error) {
        console.error('Error saving model:', error);
        alert(`Error saving model: ${error.message}`);
        
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Model';
    }
}

// Handle settings form submission
function handleSettingsSubmit(e) {
    e.preventDefault();
    
    const updateInterval = document.getElementById('update-interval').value;
    
    // Save settings to localStorage for demonstration
    localStorage.setItem('model_update_interval', updateInterval);
    
    alert('Settings saved successfully!');
}

// Load models from Supabase storage
async function loadModels() {
    try {
        // Clear current list except for loading row
        modelList.innerHTML = '<tr class="loading-row"><td colspan="5">Loading models...</td></tr>';
        
        // List all files in the storage bucket
        const { data: files, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list();
            
        if (error) {
            throw new Error(`Error loading models: ${error.message}`);
        }
        
        // Only get .task files (models)
        const modelFiles = files.filter(file => file.name.endsWith('.task'));
        
        if (modelFiles.length === 0) {
            modelList.innerHTML = '<tr><td colspan="5">No models found.</td></tr>';
            return;
        }
        
        // Build model data array from files
        const models = modelFiles.map(file => {
            // Extract category from filename (removing .task extension)
            const category = file.name.replace('.task', '');
            
            return {
                id: file.id,
                category: category,
                displayName: MODEL_DISPLAY_NAMES[category] || category,
                fileName: file.name,
                lastUpdated: new Date(file.updated_at || file.created_at).toLocaleString(),
                url: `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${file.name}`
            };
        });
        
        // Sort models by category
        models.sort((a, b) => a.category.localeCompare(b.category));
        
        // Render models
        renderModelList(models);
        
        // Update the model URLs in config.js by triggering a refresh
        try {
            // Check if loadModelUrlsFromStorage is available globally
            if (window.loadModelUrlsFromStorage) {
                await window.loadModelUrlsFromStorage();
            } else {
                // Dynamically import if not available globally
                const configModule = await import('./config.js');
                if (configModule.loadModelUrlsFromStorage) {
                    await configModule.loadModelUrlsFromStorage();
                }
            }
            console.log('Model URLs refreshed after admin panel update');
        } catch (configError) {
            console.warn('Could not refresh model URLs:', configError);
        }
        
    } catch (error) {
        console.error('Error loading models:', error);
        modelList.innerHTML = `<tr><td colspan="5">Error loading models: ${error.message}</td></tr>`;
    }
}

// Render the model list in the table
function renderModelList(models) {
    modelList.innerHTML = '';
    
    models.forEach(model => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${model.category}</td>
            <td>${model.displayName}</td>
            <td>${model.fileName}</td>
            <td>${model.lastUpdated}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-button edit-button" title="Edit Model">
                        ✏️
                    </button>
                    <button class="action-button delete-button" title="Delete Model">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        // Add event listeners for action buttons
        const editButton = row.querySelector('.edit-button');
        const deleteButton = row.querySelector('.delete-button');
        
        editButton.addEventListener('click', () => openEditModelModal(model));
        deleteButton.addEventListener('click', () => confirmDeleteModel(model));
        
        modelList.appendChild(row);
    });
}

// Confirm model deletion
function confirmDeleteModel(model) {
    if (confirm(`Are you sure you want to delete the ${model.displayName} model?`)) {
        deleteModel(model);
    }
}

// Delete a model from Supabase storage
async function deleteModel(model) {
    try {
        // Make sure we're authenticated before deleting
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            throw new Error('You must be logged in to delete models. Please log in again.');
        }
        
        // Delete the file from storage
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([model.fileName]);
            
        if (error) {
            throw new Error(`Error deleting model: ${error.message}`);
        }
        
        // Refresh the model list
        loadModels();
        
        alert('Model deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting model:', error);
        alert(`Error deleting model: ${error.message}`);
    }
}

// Function to verify model URLs are working
async function verifyModelUrls() {
    try {
        const results = [];
        results.push('===== MODEL URL VERIFICATION =====');
        
        // Import MODEL_URLS from config.js
        const configScript = document.createElement('script');
        configScript.type = 'module';
        configScript.textContent = `
            import { MODEL_URLS } from '/static/js/config.js';
            window.MODEL_URLS_IMPORTED = MODEL_URLS;
        `;
        document.head.appendChild(configScript);
        
        // Wait for import to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const modelUrls = window.MODEL_URLS_IMPORTED || {};
        
        results.push(`Found ${Object.keys(modelUrls).length} model URLs to verify.`);
        
        // Check each model URL
        for (const [category, url] of Object.entries(modelUrls)) {
            results.push(`\nTesting model: ${category}`);
            results.push(`URL: ${url}`);
            
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    results.push(`✅ SUCCESS: Model URL is accessible (Status ${response.status})`);
                } else {
                    results.push(`❌ ERROR: Model URL returned status ${response.status}`);
                }
            } catch (error) {
                results.push(`❌ ERROR: Could not access model URL: ${error.message}`);
            }
        }
        
        results.push('\n===== VERIFICATION COMPLETE =====');
        return results.join('\n');
    } catch (error) {
        console.error('Error verifying model URLs:', error);
        return `Error verifying model URLs: ${error.message}`;
    }
}

// Helper function to debug storage permissions
async function debugStoragePermissions() {
    try {
        const results = [];
        
        results.push('===== SUPABASE STORAGE DEBUG =====');
        
        // Check authentication status
        const { data: { session } } = await supabase.auth.getSession();
        results.push(`Authenticated: ${!!session}`);
        if (session) {
            results.push(`User ID: ${session.user.id}`);
            results.push(`User email: ${session.user.email}`);
        } else {
            results.push('WARNING: Not authenticated! Please log in first.');
        }
        
        // Try to list buckets (requires admin privileges)
        results.push('\nTrying to list storage buckets...');
        try {
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            if (bucketsError) {
                results.push(`ERROR: Could not list buckets: ${bucketsError.message}`);
            } else {
                results.push(`SUCCESS: Found buckets: ${buckets.map(b => b.name).join(', ')}`);
            }
        } catch (e) {
            results.push(`ERROR: Bucket listing failed: ${e.message}`);
        }
        
        // Try to list files in our bucket
        results.push(`\nTrying to list files in "${STORAGE_BUCKET}" bucket...`);
        try {
            const { data: files, error: filesError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list();
                
            if (filesError) {
                results.push(`ERROR: Could not list files: ${filesError.message}`);
            } else {
                if (files && files.length > 0) {
                    results.push(`SUCCESS: Found ${files.length} files`);
                    results.push(`File list: ${files.map(f => f.name).join(', ')}`);
                } else {
                    results.push('SUCCESS: Bucket exists but contains no files');
                }
            }
        } catch (e) {
            results.push(`ERROR: File listing failed: ${e.message}`);
        }
        
        // Check bucket permissions
        results.push('\nChecking bucket permissions...');
        try {
            // Create a test file
            const testContent = new Blob(['test content'], { type: 'text/plain' });
            const testFileName = `permission_test_${Date.now()}.txt`;
            
            results.push(`Testing upload permissions with test file: ${testFileName}`);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(testFileName, testContent);
                
            if (uploadError) {
                results.push(`ERROR: Upload test failed: ${uploadError.message}`);
                results.push('This suggests your user does not have INSERT permissions');
                
                // Check if this is an RLS policy issue
                if (uploadError.message.includes('new row violates row-level security') || 
                    uploadError.message.includes('permission denied') || 
                    uploadError.message.includes('policy')) {
                    results.push('\nLikely RLS Policy Issue:');
                    results.push('1. Check that you have row-level security policies that allow INSERT');
                    results.push('2. Verify that your authenticated user role has the correct permissions');
                    results.push('3. Consider adding a policy for authenticated users like:');
                    results.push('   CREATE POLICY "Allow authenticated uploads" ON storage.objects');
                    results.push('   FOR INSERT TO authenticated USING (bucket_id = \'signlanguage\');');
                }
            } else {
                results.push('SUCCESS: Upload test succeeded!');
                
                // Try to delete the test file
                results.push('Testing delete permissions...');
                const { error: deleteError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .remove([testFileName]);
                    
                if (deleteError) {
                    results.push(`ERROR: Delete test failed: ${deleteError.message}`);
                    results.push('This suggests your user does not have DELETE permissions');
                    
                    if (deleteError.message.includes('violates row-level') || 
                        deleteError.message.includes('permission denied')) {
                        results.push('\nLikely RLS Policy Issue:');
                        results.push('1. Check that you have row-level security policies that allow DELETE');
                        results.push('2. Consider adding a policy for authenticated users like:');
                        results.push('   CREATE POLICY "Allow authenticated deletions" ON storage.objects');
                        results.push('   FOR DELETE TO authenticated USING (bucket_id = \'signlanguage\');');
                    }
                } else {
                    results.push('SUCCESS: Delete test succeeded!');
                }
            }
        } catch (e) {
            results.push(`ERROR: Permission test failed: ${e.message}`);
        }
        
        // Try to create a signed URL for download
        results.push('\nTesting signed URL generation...');
        try {
            const testFile = 'test_signed_url.txt';
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(testFile, 60);
                
            if (error) {
                results.push(`ERROR: Signed URL generation failed: ${error.message}`);
            } else {
                results.push('SUCCESS: Signed URL generation works');
            }
        } catch (e) {
            results.push(`ERROR: Signed URL test failed: ${e.message}`);
        }
        
        // Check bucket public setting
        results.push('\nChecking if bucket is public...');
        try {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl('non_existent_file_to_check_public.txt');
                
            if (error) {
                results.push(`ERROR: Public URL generation failed: ${error.message}`);
                results.push('This suggests your bucket may not be set to public');
            } else if (data && data.publicUrl) {
                results.push('SUCCESS: Bucket appears to be public (can generate public URLs)');
            }
        } catch (e) {
            results.push(`ERROR: Public URL test failed: ${e.message}`);
        }
        
        results.push('\n===== DEBUG COMPLETE =====');
        
        // Return joined results for display
        return results.join('\n');
        
    } catch (error) {
        console.error('Debug error:', error);
        return `Error running debug: ${error.message}`;
    }
}

// Run storage debug and display results
async function runStorageDebug() {
    try {
        if (debugOutput) {
            debugOutput.value = 'Running storage diagnostics...\n';
            debugStorageButton.disabled = true;
            debugStorageButton.textContent = 'Running diagnostics...';
            
            const result = await debugStoragePermissions();
            debugOutput.value = result;
        }
    } catch (error) {
        debugOutput.value = `Error in diagnostics: ${error.message}`;
        console.error('Debug run error:', error);
    } finally {
        debugStorageButton.disabled = false;
        debugStorageButton.textContent = 'Debug Storage Permissions';
    }
}

// Run model URL verification and display results
async function runModelVerification() {
    try {
        if (debugOutput) {
            debugOutput.value = 'Verifying model URLs...\n';
            verifyModelsButton.disabled = true;
            verifyModelsButton.textContent = 'Verifying...';
            
            const result = await verifyModelUrls();
            debugOutput.value = result;
        }
    } catch (error) {
        debugOutput.value = `Error verifying models: ${error.message}`;
        console.error('Model verification error:', error);
    } finally {
        verifyModelsButton.disabled = false;
        verifyModelsButton.textContent = 'Verify Model URLs';
    }
}

// Helper function to get expected filenames for a category
function getExpectedFilenamesForCategory(category) {
    const categoryMap = {
        'alphabet': ['letters.task'],
        'numbers': ['numbers.task'],
        'colors': ['colors.task'],
        'basicWords': ['basicWords.task'],
        'family': ['family.task'],
        'food': ['food.task']
    };
    
    return categoryMap[category] || [`${category}.task`];
}

// Show warning about incorrect filename and provide options to proceed
function showFilenameWarning(category, originalFilename, expectedFilenames) {
    try {
        console.log("Showing filename warning for category:", category, "original filename:", originalFilename);
        
        // Create a modal dialog instead of inline message for more prominence
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'custom-modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'custom-modal-content';
        
        // Display name for better readability
        const displayName = MODEL_DISPLAY_NAMES[category] || category;
        
        // Create recommended filename options HTML
        const filenameOptionsHtml = expectedFilenames.map(name => 
            `<span class="expected-filename">${name}</span>`
        ).join(' or ');
        
        // Compose warning message with strict enforcement
        modalContent.innerHTML = `
            <div class="custom-modal-header">
                <h3>⛔ Incorrect Filename</h3>
                <span class="custom-modal-close">&times;</span>
            </div>
            <div class="custom-modal-body">
                <p class="filename-warning-text">The file you selected has an incorrect name for the <strong>${displayName}</strong> category.</p>
                
                <div class="filename-comparison">
                    <div class="filename-row">
                        <div class="filename-label">Your file:</div>
                        <div class="filename-value incorrect">${originalFilename}</div>
                    </div>
                    <div class="filename-row">
                        <div class="filename-label">Required:</div>
                        <div class="filename-value correct">${filenameOptionsHtml}</div>
                    </div>
                </div>
                
                <div class="strict-warning">
                    <div class="strict-warning-icon">🚫</div>
                    <div class="strict-warning-text">
                        <p><strong>File upload denied</strong></p>
                        <p>This system strictly enforces filename conventions.</p>
                        <p>You <strong>must</strong> rename your file to exactly match the required filename before uploading.</p>
                    </div>
                </div>
                
                <div class="filename-instructions">
                    <h4>How to fix this issue:</h4>
                    <ol>
                        <li>Close this dialog</li>
                        <li>Rename your file to <code>${expectedFilenames[0]}</code></li>
                        <li>Try uploading again</li>
                    </ol>
                </div>
                
                <div class="custom-modal-actions">
                    <button id="rename-cancel-btn" class="custom-modal-button primary">I Understand</button>
                </div>
            </div>
        `;
        
        // Add the modal to the page
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Show the modal with animation
        setTimeout(() => {
            modalOverlay.style.opacity = '1';
            modalContent.style.transform = 'translateY(0)';
        }, 10);
        
        // Event listener for close button
        modalContent.querySelector('.custom-modal-close').addEventListener('click', () => {
            closeFilenameWarningModal(modalOverlay);
        });
        
        // Event listener for "I Understand" button
        document.getElementById('rename-cancel-btn').addEventListener('click', () => {
            closeFilenameWarningModal(modalOverlay);
        });
        
        // Prevent clicks outside the modal from closing it
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        console.log("Filename warning modal created and displayed");
    } catch (error) {
        console.error("Error showing filename warning:", error);
        alert(`Error: Your file ${originalFilename} doesn't match the required filename (${expectedFilenames.join(' or ')}). Please rename your file.`);
    }
}

// Helper function to close the filename warning modal
function closeFilenameWarningModal(modalOverlay) {
    modalOverlay.style.opacity = '0';
    const modalContent = modalOverlay.querySelector('.custom-modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(-20px)';
    }
    
    setTimeout(() => {
        if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
        }
    }, 300);
}

// Show warning when attempting to replace an existing model
function showExistingModelWarning(category, expectedFilename) {
    try {
        console.log("Showing existing model warning for category:", category);
        
        // Create a modal dialog for more prominence
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'custom-modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'custom-modal-content';
        
        // Get display name for this category
        const displayName = MODEL_DISPLAY_NAMES[category] || category;
        
        // Compose warning message with options
        modalContent.innerHTML = `
            <div class="custom-modal-header">
                <h3>⚠️ Replace Existing Model</h3>
                <span class="custom-modal-close">&times;</span>
            </div>
            <div class="custom-modal-body">
                <p class="replace-warning-text">A model for <strong>${displayName}</strong> already exists.</p>
                
                <div class="model-replacement-info">
                    <div class="model-icon">🔄</div>
                    <div class="model-text">
                        <p>If you continue, the existing model <span class="filename-highlight">${expectedFilename}</span> will be <strong>permanently replaced</strong> with your new upload.</p>
                        <p><strong>Each category can only have one active model file.</strong></p>
                    </div>
                </div>
                
                <div class="custom-modal-actions">
                    <button id="replace-cancel-btn" class="custom-modal-button secondary">Cancel</button>
                    <button id="replace-proceed-btn" class="custom-modal-button warning">Replace Model</button>
                </div>
                <div class="override-option">
                    <label>
                        <input type="checkbox" id="override-model-check" required> 
                        I understand this action cannot be undone
                    </label>
                </div>
            </div>
        `;
        
        // Add the modal to the page
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Show the modal with animation
        setTimeout(() => {
            modalOverlay.style.opacity = '1';
            modalContent.style.transform = 'translateY(0)';
        }, 10);
        
        // Event listener for close button
        modalContent.querySelector('.custom-modal-close').addEventListener('click', () => {
            closeWarningModal(modalOverlay);
        });
        
        // Event listener for cancel button
        document.getElementById('replace-cancel-btn').addEventListener('click', () => {
            closeWarningModal(modalOverlay);
        });
        
        // Event listener for proceed button
        document.getElementById('replace-proceed-btn').addEventListener('click', () => {
            const checkbox = document.getElementById('override-model-check');
            if (!checkbox.checked) {
                alert("You must acknowledge that this action cannot be undone by checking the box.");
                return;
            }
            
            // Create a hidden field to store that we're overriding the check
            let overrideInput = document.getElementById('override-model-input');
            if (!overrideInput) {
                overrideInput = document.createElement('input');
                overrideInput.type = 'hidden';
                overrideInput.id = 'override-model-input';
                overrideInput.name = 'override-model';
                overrideInput.value = 'true';
                document.getElementById('model-form').appendChild(overrideInput);
            }
            
            // Close the modal
            closeWarningModal(modalOverlay);
            
            // Submit the form
            setTimeout(() => {
                document.getElementById('model-form').dispatchEvent(new Event('submit'));
            }, 100);
        });
        
        // Prevent clicks outside the modal from closing it
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        console.log("Model replacement warning modal created and displayed");
    } catch (error) {
        console.error("Error showing model replacement warning:", error);
        alert(`A model for this category already exists and will be replaced if you continue.`);
    }
}

// Helper function to close warning modals
function closeWarningModal(modalOverlay) {
    modalOverlay.style.opacity = '0';
    const modalContent = modalOverlay.querySelector('.custom-modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(-20px)';
    }
    
    setTimeout(() => {
        if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
        }
    }, 300);
}

// Show message in modal
function showModalMessage(message, type = 'info') {
    // Clear any existing messages first
    const existingMessage = document.getElementById('modal-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create a new message element
    const messageEl = document.createElement('div');
    messageEl.id = 'modal-message';
    messageEl.className = `modal-message ${type}-message`;
    
    // Find where to insert the message - after the last form-group, before form-actions
    const formActions = document.querySelector('.form-actions');
    if (!formActions) {
        console.error("Could not find form-actions element to attach message to");
        alert(message);
        return;
    }
    
    // Insert the message before the form actions
    formActions.parentNode.insertBefore(messageEl, formActions);
    
    // Set message content
    messageEl.innerHTML = `<div class="${type}-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
                          <div>${message}</div>`;
    
    // Ensure the message is visible with !important to override any other styles
    messageEl.style.cssText = 'display: block !important; margin: 1rem 0 !important; padding: 1rem !important;';
    
    console.log(`${type.toUpperCase()} message displayed:`, message);
    
    // Auto-hide after a few seconds for non-error messages
    if (type !== 'error' && type !== 'warning') {
        setTimeout(() => {
            if (messageEl && messageEl.parentNode) {
                messageEl.style.display = 'none';
            }
        }, 5000);
    }
}

// Media management functions
async function loadMediaItems(type = 'all') {
    try {
        const mediaListElement = document.getElementById('media-list');
        
        if (!mediaListElement) {
            return;
        }
        
        // Show loading message
        mediaListElement.innerHTML = '<div class="loading-message">Loading media items...</div>';
        
        // Get folder path based on type
        let folderPath = '';
        if (type !== 'all') {
            folderPath = type + '/';
        }
        
        // List files in the storage bucket
        const { data: files, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(folderPath);
            
        if (error) {
            throw new Error(`Error loading media: ${error.message}`);
        }
        
        // Filter out unwanted file types if needed
        const mediaFiles = files.filter(file => 
            !file.name.endsWith('.task') && 
            !file.name.startsWith('permission_test_')
        );
        
        if (mediaFiles.length === 0) {
            mediaListElement.innerHTML = '<div class="empty-state">No media items found.</div>';
            return;
        }
        
        // Build media items HTML
        let mediaHTML = '<div class="media-grid">';
        
        for (const file of mediaFiles) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
            const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension);
            const isSubtitle = ['srt', 'vtt'].includes(fileExtension);
            
            const filePath = folderPath + file.name;
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
            const fileUrl = data?.publicUrl || '';
            
            let thumbnailHtml = '';
            let fileTypeIcon = '';
            
            if (isImage) {
                thumbnailHtml = `<img src="${fileUrl}" alt="${file.name}" class="media-thumbnail">`;
                fileTypeIcon = '🖼️';
            } else if (isVideo) {
                thumbnailHtml = `<div class="video-thumbnail"><span>🎬</span></div>`;
                fileTypeIcon = '🎬';
            } else if (isSubtitle) {
                thumbnailHtml = `<div class="subtitle-thumbnail"><span>📝</span></div>`;
                fileTypeIcon = '📝';
            } else {
                thumbnailHtml = `<div class="generic-thumbnail"><span>📄</span></div>`;
                fileTypeIcon = '📄';
            }
            
            mediaHTML += `
                <div class="media-item" data-file-path="${filePath}">
                    <div class="media-thumbnail-container">
                        ${thumbnailHtml}
                    </div>
                    <div class="media-details">
                        <div class="media-title">${fileTypeIcon} ${file.name}</div>
                        <div class="media-meta">
                            <span class="media-size">${formatFileSize(file.metadata?.size || 0)}</span>
                            <span class="media-date">${new Date(file.metadata?.lastModified || Date.now()).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="media-actions">
                        <button class="media-preview-btn" title="Preview">👁️</button>
                        <button class="media-delete-btn" title="Delete">🗑️</button>
                    </div>
                </div>
            `;
        }
        
        mediaHTML += '</div>';
        mediaListElement.innerHTML = mediaHTML;
        
        // Add event listeners to media item buttons
        document.querySelectorAll('.media-preview-btn').forEach(button => {
            button.addEventListener('click', function() {
                const mediaItem = this.closest('.media-item');
                const filePath = mediaItem.dataset.filePath;
                previewMediaItem(filePath);
            });
        });
        
        document.querySelectorAll('.media-delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const mediaItem = this.closest('.media-item');
                const filePath = mediaItem.dataset.filePath;
                confirmDeleteMedia(filePath);
            });
        });
        
    } catch (error) {
        console.error('Error loading media:', error);
        const mediaListElement = document.getElementById('media-list');
        if (mediaListElement) {
            mediaListElement.innerHTML = `<div class="error-message">Error loading media: ${error.message}</div>`;
        }
    }
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Preview media item
function previewMediaItem(filePath) {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    const fileUrl = data?.publicUrl || '';
    
    if (!fileUrl) {
        alert('Could not generate preview URL for this file.');
        return;
    }
    
    const fileExtension = filePath.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
    const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension);
    const isSubtitle = ['srt', 'vtt'].includes(fileExtension);
    
    // Open in new tab for now - could be enhanced to use a modal
    window.open(fileUrl, '_blank');
}

// Confirm media deletion
function confirmDeleteMedia(filePath) {
    if (confirm(`Are you sure you want to delete this file?\n${filePath}`)) {
        deleteMediaItem(filePath);
    }
}

// Delete media item
async function deleteMediaItem(filePath) {
    try {
        // Make sure we're authenticated before deleting
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            throw new Error('You must be logged in to delete files. Please log in again.');
        }
        
        // Delete the file from storage
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([filePath]);
            
        if (error) {
            throw new Error(`Error deleting file: ${error.message}`);
        }
        
        // Refresh the media list
        const mediaTypeSelect = document.getElementById('media-type-filter');
        const selectedType = mediaTypeSelect ? mediaTypeSelect.value : 'all';
        loadMediaItems(selectedType);
        
        alert('File deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting file:', error);
        alert(`Error deleting file: ${error.message}`);
    }
}

// Handle media upload form submission
async function handleMediaUpload(e) {
    e.preventDefault();
    
    const mediaFile = document.getElementById('media-file').files[0];
    const mediaType = document.getElementById('media-upload-type').value;
    const mediaDescription = document.getElementById('media-description').value;
    
    if (!mediaFile) {
        alert('Please select a file to upload.');
        return;
    }
    
    const submitButton = document.querySelector('#media-upload-form button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Uploading...';
    
    try {
        // Get proper folder path based on type
        let folderPath = '';
        if (mediaType !== 'other') {
            folderPath = mediaType + '/';
        }
        
        // Generate filename
        const fileName = `${folderPath}${mediaFile.name}`;
        
        // Upload the file
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, mediaFile, {
                cacheControl: '3600',
                upsert: true
            });
            
        if (error) {
            throw new Error(`Error uploading file: ${error.message}`);
        }
        
        // Reset form and reload media items
        document.getElementById('media-upload-form').reset();
        loadMediaItems(mediaType);
        
        alert('Media uploaded successfully!');
        
    } catch (error) {
        console.error('Error uploading media:', error);
        alert(`Error uploading media: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Upload Media';
    }
}

// ===============================
// CONTENT MANAGEMENT FUNCTIONS
// ===============================

// Load content management interface
async function loadContentManagement() {
    console.log('Loading Content Management interface...');
    await loadModulesFromDatabase();
    await loadAvailableModels();
    resetContentManagementFlow();
}

// Load modules from Supabase database and populate dropdown
async function loadModulesFromDatabase() {
    try {
        const { data: modules, error } = await supabase
            .from('modules')
            .select('*')
            .order('display_name');

        if (error) {
            console.error('Error loading modules:', error);
            return;
        }

        // Clear and populate the module selector
        if (moduleSelector) {
            moduleSelector.innerHTML = '<option value="">-- Select a Module --</option>';
            
            modules.forEach(module => {
                cachedModules.set(module.module_key, module);
                const option = document.createElement('option');
                option.value = module.module_key;
                option.textContent = module.display_name;
                moduleSelector.appendChild(option);
            });
        }

        console.log('Loaded modules from database:', modules.length);
    } catch (error) {
        console.error('Error loading modules from database:', error);
    }
}

// Reset the content management flow to initial state
function resetContentManagementFlow() {
    if (moduleSelector) moduleSelector.value = '';
    if (editModuleBtn) editModuleBtn.disabled = true;
    if (deleteModuleBtn) deleteModuleBtn.disabled = true;
    if (itemsManagement) itemsManagement.style.display = 'none';
    if (modelAssociation) modelAssociation.style.display = 'none';
    
    // Remove active classes
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('module-selection').classList.add('active');
}

// Handle module selection from dropdown
async function handleModuleSelection() {
    const selectedModuleKey = moduleSelector.value;
    
    if (selectedModuleKey) {
        const module = cachedModules.get(selectedModuleKey);
        
        editModuleBtn.disabled = false;
        deleteModuleBtn.disabled = false;
        
        // Show step 2: Items Management
        itemsManagement.style.display = 'block';
        selectedModuleName.textContent = module?.display_name || selectedModuleKey;
        await loadModuleItems(selectedModuleKey);
        
        // Show step 3: Model Association
        modelAssociation.style.display = 'block';
        modelModuleName.textContent = module?.display_name || selectedModuleKey;
        await loadModelAssociation(selectedModuleKey);
        
        // Update step visual states
        document.getElementById('items-management').classList.add('active');
        document.getElementById('model-association').classList.add('active');
    } else {
        editModuleBtn.disabled = true;
        deleteModuleBtn.disabled = true;
        itemsManagement.style.display = 'none';
        modelAssociation.style.display = 'none';
        
        // Remove active classes
        document.getElementById('items-management').classList.remove('active');
        document.getElementById('model-association').classList.remove('active');
    }
}

// Load items for the selected module from database
async function loadModuleItems(moduleKey) {
    try {
        const module = cachedModules.get(moduleKey);
        if (!module || !moduleItemsList) return;

        // Fetch items from database
        const { data: items, error } = await supabase
            .from('module_items')
            .select('*')
            .eq('module_id', module.id)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error loading module items:', error);
            return;
        }

        // Cache the items
        cachedModuleItems.set(moduleKey, items);

        if (!items || items.length === 0) {
            moduleItemsList.innerHTML = `
                <div class="empty-items">
                    <div class="empty-items-icon">📝</div>
                    <h4>No items in this module</h4>
                    <p>Click "Add New Item" to add content to this module.</p>
                </div>
            `;
            return;
        }
        
        let itemsHtml = '';
        items.forEach((item, index) => {
            const hasVideo = item.video_url && item.video_url.length > 0;
            const hasImage = item.image_url && item.image_url.length > 0;
            
            itemsHtml += `
                <div class="item-card" data-item-id="${item.id}" data-item="${item.item_name}" data-module="${moduleKey}">
                    <div class="item-card-header">
                        <div class="item-name">${item.item_name}</div>
                        <div class="item-order">#${item.display_order}</div>
                    </div>
                    <div class="item-meta">
                        <div class="item-meta-row">
                            <span>Video:</span>
                            <span class="${hasVideo ? 'has-media' : 'no-media'}">
                                ${hasVideo ? '✓ Available' : '✗ Missing'}
                            </span>
                        </div>
                        <div class="item-meta-row">
                            <span>Image:</span>
                            <span class="${hasImage ? 'has-media' : 'no-media'}">
                                ${hasImage ? '✓ Available' : '✗ Missing'}
                            </span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn item-edit-btn" title="Edit Item" data-item-id="${item.id}" data-item-name="${item.item_name}" data-module="${moduleKey}">
                            ✏️
                        </button>
                        <button class="item-action-btn item-delete-btn" title="Delete Item" data-item-id="${item.id}" data-item-name="${item.item_name}" data-module="${moduleKey}">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        
        moduleItemsList.innerHTML = itemsHtml;
        
        // Add event listeners to item action buttons
        moduleItemsList.querySelectorAll('.item-edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.itemId;
                const itemName = this.dataset.itemName;
                const moduleKey = this.dataset.module;
                openEditItemModal(itemId, itemName, moduleKey);
            });
        });
        
        moduleItemsList.querySelectorAll('.item-delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.itemId;
                const itemName = this.dataset.itemName;
                const moduleKey = this.dataset.module;
                handleDeleteItem(itemId, itemName, moduleKey);
            });
        });
    } catch (error) {
        console.error('Error loading module items:', error);
        moduleItemsList.innerHTML = `
            <div class="empty-items">
                <div class="empty-items-icon">❌</div>
                <h4>Error loading items</h4>
                <p>Could not load items for this module.</p>
            </div>
        `;
    }
}

// Load available models for association
async function loadAvailableModels() {
    if (!associatedModel) return;
    
    try {
        // Clear existing options except first
        associatedModel.innerHTML = '<option value="">-- Select a Model --</option>';
        
        // List all files in the storage bucket to get available models
        const { data: files, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list();
            
        if (error) {
            console.error('Error loading models for association:', error);
            return;
        }
        
        // Only get .task files (models)
        const modelFiles = files.filter(file => file.name.endsWith('.task'));
        
        modelFiles.forEach(file => {
            const category = file.name.replace('.task', '');
            const displayName = MODEL_DISPLAY_NAMES[category] || category;
            
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `${displayName} (${file.name})`;
            associatedModel.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading available models:', error);
    }
}

// Load model association for selected module from database
async function loadModelAssociation(moduleKey) {
    try {
        const module = cachedModules.get(moduleKey);
        if (!module) return;

        // Fetch current model association from database
        const { data: modelAssociations, error } = await supabase
            .from('module_models')
            .select('*')
            .eq('module_id', module.id)
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error('Error loading model association:', error);
            return;
        }

        // Set the currently associated model
        if (associatedModel && modelAssociations && modelAssociations.length > 0) {
            const association = modelAssociations[0];
            associatedModel.value = association.model_category;
            handleModelSelection(); // This will show model info
        } else {
            associatedModel.value = '';
            hideModelInfo();
        }
    } catch (error) {
        console.error('Error loading model association:', error);
    }
}

// Handle model selection for association
async function handleModelSelection() {
    const selectedModel = associatedModel.value;
    
    if (selectedModel) {
        await showModelInfo(selectedModel);
        saveAssociationBtn.disabled = false;
        testModelBtn.disabled = false;
    } else {
        hideModelInfo();
        saveAssociationBtn.disabled = true;
        testModelBtn.disabled = true;
    }
}

// Show model information with real availability check
async function showModelInfo(modelCategory) {
    if (!modelInfoDisplay) return;
    
    const displayName = MODEL_DISPLAY_NAMES[modelCategory] || modelCategory;
    let fileName = `${modelCategory}.task`;
    
    // Special case for alphabet
    if (modelCategory === 'alphabet') {
        fileName = 'letters.task';
    }
    
    const modelUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
    
    // Check if model actually exists in storage
    let isAvailable = false;
    try {
        const { data: files, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list();
            
        if (!error && files) {
            isAvailable = files.some(file => file.name === fileName);
        }
    } catch (error) {
        console.error('Error checking model availability:', error);
    }
    
    modelInfoDisplay.innerHTML = `
        <div class="model-info-header">
            <div class="model-info-title">${displayName}</div>
            <div class="model-status ${isAvailable ? 'available' : 'missing'}">
                ${isAvailable ? 'Available' : 'Missing'}
            </div>
        </div>
        <div class="model-details">
            <div class="model-detail-item">
                <div class="model-detail-label">File Name:</div>
                <div class="model-detail-value">${fileName}</div>
            </div>
            <div class="model-detail-item">
                <div class="model-detail-label">Category:</div>
                <div class="model-detail-value">${modelCategory}</div>
            </div>
            <div class="model-detail-item">
                <div class="model-detail-label">Model URL:</div>
                <div class="model-detail-value">${modelUrl}</div>
            </div>
            <div class="model-detail-item">
                <div class="model-detail-label">Status:</div>
                <div class="model-detail-value">${isAvailable ? 'Ready to use' : 'Upload required'}</div>
            </div>
        </div>
    `;
    
    modelInfoDisplay.classList.add('visible');
}

// Hide model information
function hideModelInfo() {
    if (modelInfoDisplay) {
        modelInfoDisplay.classList.remove('visible');
    }
}

// Modal management functions
function openAddModuleModal() {
    document.getElementById('module-modal-title').textContent = 'Add New Module';
    document.getElementById('module-id').value = '';
    moduleForm.reset();
    moduleModal.style.display = 'block';
}

async function openEditModuleModal() {
    const selectedModuleKey = moduleSelector.value;
    if (!selectedModuleKey) return;
    
    const module = cachedModules.get(selectedModuleKey);
    if (!module) return;
    
    document.getElementById('module-modal-title').textContent = 'Edit Module';
    document.getElementById('module-id').value = module.id;
    document.getElementById('module-key').value = module.module_key;
    document.getElementById('module-display-name').value = module.display_name;
    document.getElementById('module-description').value = module.description || '';
    document.getElementById('module-icon').value = module.icon || '';
    
    // Disable key editing for existing modules
    document.getElementById('module-key').disabled = true;
    
    moduleModal.style.display = 'block';
}

function closeModuleModalFunc() {
    moduleModal.style.display = 'none';
    // Re-enable key field for next use
    document.getElementById('module-key').disabled = false;
}

async function openAddItemModal() {
    const selectedModuleKey = moduleSelector.value;
    if (!selectedModuleKey) return;
    
    const module = cachedModules.get(selectedModuleKey);
    if (!module) return;
    
    document.getElementById('item-modal-title').textContent = 'Add New Item';
    document.getElementById('item-id').value = '';
    document.getElementById('item-module').value = module.id;
    itemForm.reset();
    
    // Set next order number
    const items = cachedModuleItems.get(selectedModuleKey) || [];
    const nextOrder = Math.max(...items.map(item => item.display_order), 0) + 1;
    document.getElementById('item-order').value = nextOrder;
    
    itemModal.style.display = 'block';
}

async function openEditItemModal(itemId, itemName, moduleKey) {
    const items = cachedModuleItems.get(moduleKey) || [];
    const item = items.find(i => i.id === itemId);
    
    if (!item) return;
    
    document.getElementById('item-modal-title').textContent = 'Edit Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-module').value = item.module_id;
    document.getElementById('item-name').value = item.item_name;
    document.getElementById('item-description').value = item.description || '';
    document.getElementById('item-order').value = item.display_order;
    
    // Set URLs first
    document.getElementById('item-video').value = item.video_url || '';
    document.getElementById('item-image').value = item.image_url || '';
    
    // Then set the appropriate media type selection
    setMediaTypeSelection(item.video_url, item.image_url);
    
    itemModal.style.display = 'block';
}

function closeItemModalFunc() {
    itemModal.style.display = 'none';
    
    // Reset form to default state
    const mediaNone = document.getElementById('media-none');
    const videoUrlGroup = document.getElementById('video-url-group');
    const imageUrlGroup = document.getElementById('image-url-group');
    const videoInput = document.getElementById('item-video');
    const imageInput = document.getElementById('item-image');
    
    // Reset radio selection to "No Media"
    if (mediaNone) mediaNone.checked = true;
    
    // Hide URL groups
    if (videoUrlGroup) {
        videoUrlGroup.style.display = 'none';
        videoUrlGroup.classList.remove('show');
    }
    if (imageUrlGroup) {
        imageUrlGroup.style.display = 'none';
        imageUrlGroup.classList.remove('show');
    }
    
    // Clear required attributes
    if (videoInput) videoInput.required = false;
    if (imageInput) imageInput.required = false;
}

// Handle module form submission with database operations
async function handleModuleSubmit(e) {
    e.preventDefault();
    
    const moduleId = document.getElementById('module-id').value;
    const moduleKey = document.getElementById('module-key').value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const displayName = document.getElementById('module-display-name').value;
    const description = document.getElementById('module-description').value;
    const icon = document.getElementById('module-icon').value;
    
    // Validate module key
    if (!moduleKey || moduleKey.length < 2) {
        alert('Module key must be at least 2 characters long and contain only lowercase letters and numbers.');
        return;
    }
    
    try {
        if (moduleId) {
            // Update existing module
            const { data, error } = await supabase
                .from('modules')
                .update({
                    display_name: displayName,
                    description: description,
                    icon: icon
                })
                .eq('id', moduleId)
                .select();

            if (error) throw error;

            // Update cache
            const module = cachedModules.get(moduleKey);
            if (module) {
                module.display_name = displayName;
                module.description = description;
                module.icon = icon;
            }

            // Update dropdown
            const option = moduleSelector.querySelector(`option[value="${moduleKey}"]`);
            if (option) {
                option.textContent = displayName;
            }
        } else {
            // Check if key already exists
            const { data: existingModule, error: checkError } = await supabase
                .from('modules')
                .select('id')
                .eq('module_key', moduleKey)
                .limit(1);

            if (checkError) throw checkError;

            if (existingModule && existingModule.length > 0) {
                alert('A module with this key already exists. Please choose a different key.');
                return;
            }

            // Add new module
            const { data, error } = await supabase
                .from('modules')
                .insert({
                    module_key: moduleKey,
                    display_name: displayName,
                    description: description,
                    icon: icon
                })
                .select();

            if (error) throw error;

            const newModule = data[0];
            cachedModules.set(moduleKey, newModule);
            
            // Add to dropdown
            const option = document.createElement('option');
            option.value = moduleKey;
            option.textContent = displayName;
            moduleSelector.appendChild(option);
        }
        
        closeModuleModalFunc();
        alert('Module saved successfully!');
        
    } catch (error) {
        console.error('Error saving module:', error);
        alert(`Error saving module: ${error.message}`);
    }
}

// Handle item form submission with database operations and URL handling
async function handleItemSubmit(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('item-id').value;
    const moduleId = document.getElementById('item-module').value;
    const itemName = document.getElementById('item-name').value;
    const itemDescription = document.getElementById('item-description').value;
    const itemOrder = parseInt(document.getElementById('item-order').value) || 1;
    
    // Get the selected media type and corresponding URL
    const selectedMediaType = getSelectedMediaType();
    let videoUrl = null;
    let imageUrl = null;
    
    if (selectedMediaType === 'video') {
        videoUrl = document.getElementById('item-video').value.trim();
        if (!videoUrl) {
            alert('Please enter a video URL.');
            return;
        }
        if (!isValidUrl(videoUrl)) {
            alert('Please enter a valid video URL.');
            return;
        }
    } else if (selectedMediaType === 'image') {
        imageUrl = document.getElementById('item-image').value.trim();
        if (!imageUrl) {
            alert('Please enter an image URL.');
            return;
        }
        if (!isValidUrl(imageUrl)) {
            alert('Please enter a valid image URL.');
            return;
        }
    }
    // If selectedMediaType === 'none', both videoUrl and imageUrl remain null
    
    try {
        if (itemId) {
            // Update existing item
            const updateData = {
                item_name: itemName,
                description: itemDescription,
                display_order: itemOrder,
                video_url: videoUrl,
                image_url: imageUrl
            };
            
            const { data, error } = await supabase
                .from('module_items')
                .update(updateData)
                .eq('id', itemId)
                .select();

            if (error) throw error;
        } else {
            // Add new item
            const insertData = {
                module_id: moduleId,
                item_name: itemName,
                description: itemDescription,
                display_order: itemOrder,
                video_url: videoUrl,
                image_url: imageUrl
            };
            
            const { data, error } = await supabase
                .from('module_items')
                .insert(insertData)
                .select();

            if (error) throw error;
        }
        
        closeItemModalFunc();
        
        // Refresh items list
        const selectedModuleKey = moduleSelector.value;
        await loadModuleItems(selectedModuleKey);
        
        alert('Item saved successfully!');
        
    } catch (error) {
        console.error('Error saving item:', error);
        alert(`Error saving item: ${error.message}`);
    }
}

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Handle module deletion with database operations
async function handleDeleteModule() {
    const selectedModuleKey = moduleSelector.value;
    if (!selectedModuleKey) return;
    
    const module = cachedModules.get(selectedModuleKey);
    if (!module) return;
    
    // Get item count for confirmation
    const items = cachedModuleItems.get(selectedModuleKey) || [];
    const itemCount = items.length;
    
    const confirmMessage = `Are you sure you want to delete the "${module.display_name}" module?\n\nThis will also delete all ${itemCount} items in this module.\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            // Delete module (items will be cascade deleted due to foreign key constraint)
            const { error } = await supabase
                .from('modules')
                .delete()
                .eq('id', module.id);

            if (error) throw error;

            // Remove from cache
            cachedModules.delete(selectedModuleKey);
            cachedModuleItems.delete(selectedModuleKey);
            
            // Remove from dropdown
            const option = moduleSelector.querySelector(`option[value="${selectedModuleKey}"]`);
            if (option) {
                option.remove();
            }
            
            // Reset interface
            resetContentManagementFlow();
            
            alert('Module deleted successfully.');
        } catch (error) {
            console.error('Error deleting module:', error);
            alert(`Error deleting module: ${error.message}`);
        }
    }
}

// Handle item deletion with database operations
async function handleDeleteItem(itemId, itemName, moduleKey) {
    const confirmMessage = `Are you sure you want to delete "${itemName}" from this module?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            // Delete item from database
            const { error } = await supabase
                .from('module_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            // Refresh items list
            await loadModuleItems(moduleKey);
            
            alert('Item deleted successfully.');
        } catch (error) {
            console.error('Error deleting item:', error);
            alert(`Error deleting item: ${error.message}`);
        }
    }
}

// Handle saving model association with database operations
async function handleSaveAssociation() {
    const selectedModuleKey = moduleSelector.value;
    const selectedModel = associatedModel.value;
    
    if (!selectedModuleKey || !selectedModel) return;
    
    const module = cachedModules.get(selectedModuleKey);
    if (!module) return;
    
    try {
        let fileName = `${selectedModel}.task`;
        if (selectedModel === 'alphabet') {
            fileName = 'letters.task';
        }
        
        const modelUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
        
        // First, deactivate any existing associations for this module
        await supabase
            .from('module_models')
            .update({ is_active: false })
            .eq('module_id', module.id);
        
        // Then insert/update the new association
        const { data, error } = await supabase
            .from('module_models')
            .upsert({
                module_id: module.id,
                model_category: selectedModel,
                model_file_name: fileName,
                model_url: modelUrl,
                is_active: true
            }, {
                onConflict: 'module_id,model_category'
            });

        if (error) throw error;

        alert('Model association saved successfully!');
    } catch (error) {
        console.error('Error saving model association:', error);
        alert(`Error saving model association: ${error.message}`);
    }
}

// Handle testing model with real model verification
async function handleTestModel() {
    const selectedModel = associatedModel.value;
    if (!selectedModel) return;
    
    let fileName = `${selectedModel}.task`;
    if (selectedModel === 'alphabet') {
        fileName = 'letters.task';
    }
    
    const modelUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
    
    try {
        // Test if model file exists and is accessible
        const response = await fetch(modelUrl, { method: 'HEAD' });
        
        if (response.ok) {
            alert(`✅ Model test successful!\n\nThe ${MODEL_DISPLAY_NAMES[selectedModel] || selectedModel} model is accessible and ready to use.\n\nModel URL: ${modelUrl}`);
        } else {
            alert(`❌ Model test failed!\n\nThe ${MODEL_DISPLAY_NAMES[selectedModel] || selectedModel} model could not be accessed (HTTP ${response.status}).\n\nPlease check if the model file exists in storage.`);
        }
    } catch (error) {
        console.error('Error testing model:', error);
        alert(`❌ Model test failed!\n\nError: ${error.message}\n\nPlease check your network connection and model availability.`);
    }
}

// Event listeners for window click to close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === modelModal) {
        closeModelModal();
    }
    
    if (event.target === moduleModal) {
        closeModuleModalFunc();
    }
    
    if (event.target === itemModal) {
        closeItemModalFunc();
    }
    
    // Add more modal closing logic here if needed
});

// Setup media type selection with radio buttons
function setupMediaTypeSelection() {
    const mediaTypeRadios = document.querySelectorAll('input[name="media-type"]');
    const videoUrlGroup = document.getElementById('video-url-group');
    const imageUrlGroup = document.getElementById('image-url-group');
    const videoInput = document.getElementById('item-video');
    const imageInput = document.getElementById('item-image');
    
    if (mediaTypeRadios.length === 0) return;
    
    // Add event listeners to radio buttons
    mediaTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Hide all URL groups first
            if (videoUrlGroup) {
                videoUrlGroup.style.display = 'none';
                videoUrlGroup.classList.remove('show');
            }
            if (imageUrlGroup) {
                imageUrlGroup.style.display = 'none';
                imageUrlGroup.classList.remove('show');
            }
            
            // Clear URL inputs when switching types
            if (videoInput) videoInput.value = '';
            if (imageInput) imageInput.value = '';
            
            // Show the appropriate URL group
            if (selectedType === 'video' && videoUrlGroup) {
                videoUrlGroup.style.display = 'block';
                videoUrlGroup.classList.add('show');
                // Make video URL required
                if (videoInput) videoInput.required = true;
                if (imageInput) imageInput.required = false;
            } else if (selectedType === 'image' && imageUrlGroup) {
                imageUrlGroup.style.display = 'block';
                imageUrlGroup.classList.add('show');
                // Make image URL required
                if (imageInput) imageInput.required = true;
                if (videoInput) videoInput.required = false;
            } else {
                // No media selected - make neither required
                if (videoInput) videoInput.required = false;
                if (imageInput) imageInput.required = false;
            }
        });
    });
}

// Get the currently selected media type
function getSelectedMediaType() {
    const checkedRadio = document.querySelector('input[name="media-type"]:checked');
    return checkedRadio ? checkedRadio.value : 'none';
}

// Set the media type selection (used when editing items)
function setMediaTypeSelection(videoUrl, imageUrl) {
    const mediaNone = document.getElementById('media-none');
    const mediaVideo = document.getElementById('media-video');
    const mediaImage = document.getElementById('media-image');
    const videoUrlGroup = document.getElementById('video-url-group');
    const imageUrlGroup = document.getElementById('image-url-group');
    
    // Reset all first
    if (mediaNone) mediaNone.checked = true;
    if (videoUrlGroup) {
        videoUrlGroup.style.display = 'none';
        videoUrlGroup.classList.remove('show');
    }
    if (imageUrlGroup) {
        imageUrlGroup.style.display = 'none';
        imageUrlGroup.classList.remove('show');
    }
    
    // Set based on existing URLs
    if (videoUrl && videoUrl.trim().length > 0) {
        if (mediaVideo) {
            mediaVideo.checked = true;
            videoUrlGroup.style.display = 'block';
            videoUrlGroup.classList.add('show');
            document.getElementById('item-video').required = true;
            document.getElementById('item-image').required = false;
        }
    } else if (imageUrl && imageUrl.trim().length > 0) {
        if (mediaImage) {
            mediaImage.checked = true;
            imageUrlGroup.style.display = 'block';
            imageUrlGroup.classList.add('show');
            document.getElementById('item-image').required = true;
            document.getElementById('item-video').required = false;
        }
    }
    // If neither URL exists, "No Media" remains selected by default
}