const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Define the port
const PORT = process.env.PORT || 3000;

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.ico': 'image/x-icon'
};

// Create the server
const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Normalize pathname
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Special handling for .env file
    if (pathname === '/.env') {
        // Create a public-safe version of the .env file
        const publicEnv = createPublicEnv();
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(publicEnv);
        return;
    }

    // Get the full file path
    const filePath = path.join(__dirname, pathname);
    
    // Get the file extension
    const extname = path.extname(filePath);
    
    // Set the content type
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Read the file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Function to create a public-safe version of the .env file
function createPublicEnv() {
    try {
        // Read the .env file
        const envFile = fs.readFileSync('.env', 'utf8');
        
        // Split by lines
        const lines = envFile.split('\n');
        
        // Filter to only include allowed environment variables
        const publicEnvLines = lines.filter(line => {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || !line.trim()) {
                return true;
            }
            
            // Only include allowed variables
            const keyMatch = line.match(/^(\w+)=/);
            if (keyMatch) {
                const key = keyMatch[1];
                
                // List of environment variables that are safe to expose to the client
                const allowedVars = [
                    'SUPABASE_URL',
                    'SUPABASE_ANON_KEY',
                    'STORAGE_BUCKET'
                ];
                
                return allowedVars.includes(key);
            }
            
            return false;
        });
        
        return publicEnvLines.join('\n');
    } catch (error) {
        console.error('Error reading .env file:', error);
        return '# No environment variables available';
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});