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

// Model display names mapping
const MODEL_DISPLAY_NAMES = {
    alphabet: 'Letters (A-Z)',
    numbers: 'Numbers (0-9)', 
    colors: 'Colors',
    basicWords: 'Basic Words',
    family: 'Family & People',
    food: 'Food & Drinks'
};

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

// Event listeners for window click to close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === modelModal) {
        closeModelModal();
    }
    
    // Add more modal closing logic here if needed
});