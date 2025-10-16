/**
 * Environment Variables Loader for Signademy
 * 
 * This script loads environment variables from the .env file and makes them
 * available to the application through the window.env object.
 */

// Define the environment variables object
window.env = {};

// Function to parse .env file content
function parseEnvFile(content) {
    const envVars = {};
    
    // Split content by lines and process each line
    const lines = content.split('\n');
    for (const line of lines) {
        // Skip empty lines and comments
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;
        
        // Split by first equals sign
        const equalSignIndex = trimmedLine.indexOf('=');
        if (equalSignIndex > 0) {
            const key = trimmedLine.substring(0, equalSignIndex).trim();
            let value = trimmedLine.substring(equalSignIndex + 1).trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            
            envVars[key] = value;
        }
    }
    
    return envVars;
}

// Fetch and load environment variables from .env file
async function loadEnvVariables() {
    try {
        const response = await fetch('/.env');
        
        // Check if fetch was successful
        if (!response.ok) {
            console.warn('Failed to load .env file:', response.statusText);
            logEnvIssue('Failed to fetch .env file: ' + response.statusText);
            return;
        }
        
        const content = await response.text();
        window.env = parseEnvFile(content);
        
        // Log loaded keys (but not values) for debugging
        const loadedKeys = Object.keys(window.env);
        console.log('Environment variables loaded successfully:', loadedKeys.join(', '));
        
        // Verify essential variables
        const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
        const missingVars = requiredVars.filter(key => !window.env[key]);
        
        if (missingVars.length > 0) {
            logEnvIssue('Missing required environment variables: ' + missingVars.join(', '));
        }
    } catch (error) {
        console.warn('Error loading environment variables:', error);
        logEnvIssue('Error loading environment variables: ' + error.message);
    }
}

// Function to log environment issues to the console and optionally to the UI
function logEnvIssue(message) {
    console.error('ENV CONFIG ISSUE:', message);
    
    // Only create warning UI when in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Create a warning message for developers
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #FFF3CD;
            border: 1px solid #FFECB5;
            color: #664D03;
            padding: 10px 15px;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            max-width: 320px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        warningDiv.innerHTML = `
            <strong>Environment Configuration Issue</strong>
            <p style="margin: 5px 0;">${message}</p>
            <p style="margin: 5px 0; font-size: 12px;">
                Using fallback values. See console for details.
                <a href="ENV_SETUP.md" target="_blank" style="color: #0D6EFD;">Setup Guide</a>
            </p>
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: #664D03;
        `;
        closeButton.addEventListener('click', () => {
            document.body.removeChild(warningDiv);
        });
        
        warningDiv.appendChild(closeButton);
        
        // Wait for the body to be loaded before appending
        if (document.body) {
            document.body.appendChild(warningDiv);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(warningDiv);
            });
        }
    }
}

// Load environment variables immediately if possible
document.addEventListener('DOMContentLoaded', loadEnvVariables);

// Expose the function for manually loading environment variables
window.loadEnvVariables = loadEnvVariables;