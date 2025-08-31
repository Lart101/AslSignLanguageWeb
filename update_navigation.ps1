# PowerShell script to update all HTML files with centralized navigation

$files = @(
    "about.html",
    "about_simple.html", 
    "alphabet.html",
    "basic-words.html",
    "colors.html",
    "contact.html",
    "family.html",
    "food.html",
    "image_to_sign.html",
    "numbers.html",
    "text_to_sign.html",
    "webcam.html"
)

foreach ($file in $files) {
    $filePath = "c:\Users\yeojl\Documents\Capstone\AslSignLanguageWeb\$file"
    
    if (Test-Path $filePath) {
        Write-Host "Processing $file..."
        
        # Read the file content
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Add navigation CSS link if not already present
        if ($content -notmatch 'navigation\.css') {
            $content = $content -replace '(<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>)', '$1`n    <link rel="stylesheet" href="static/css/navigation.css">'
        }
        
        # Replace header content with empty header tag
        $headerPattern = '(?s)<header>.*?</header>'
        $content = $content -replace $headerPattern, '    <header>`n    </header>'
        
        # Add navigation JavaScript before closing body tag if not already present
        if ($content -notmatch 'navigation\.js') {
            $content = $content -replace '(</body>)', '    <script src="static/js/navigation.js"></script>`n$1'
        }
        
        # Write the updated content back
        $content | Set-Content $filePath -Encoding UTF8 -NoNewline
        
        Write-Host "Updated $file successfully"
    } else {
        Write-Host "File $file not found"
    }
}

Write-Host "All files processed!"
