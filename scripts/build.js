const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Function to copy file
function copyFile(source, destination) {
    fs.copyFileSync(source, destination);
    console.log(`Copied ${source} to ${destination}`);
}

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

try {
    // Copy manifest.json
    copyFile(path.join(__dirname, '../manifest.json'), path.join(distDir, 'manifest.json'));

    // Copy icons directory
    copyDir(path.join(srcDir, 'icons'), path.join(distDir, 'icons'));

    // Copy HTML files from src
    const srcFiles = fs.readdirSync(srcDir);
    srcFiles.forEach(file => {
        if (file.endsWith('.html') || file.endsWith('.css')) {
            copyFile(path.join(srcDir, file), path.join(distDir, file));
        }
    });

    console.log('Build assets copied successfully!');
} catch (error) {
    console.error('Error copying build assets:', error);
    process.exit(1);
}
