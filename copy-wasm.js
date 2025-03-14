const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// Source and destination paths
const modulePath = path.join(__dirname, 'node_modules', 'onnxruntime-web');
const destPath = path.join(__dirname, 'public', 'wasm');

// Ensure destination directory exists
ensureDirectoryExists(destPath);

// First check in 'dist' subdirectory
let sourcePath = path.join(modulePath, 'dist');
if (!fs.existsSync(sourcePath)) {
    console.log('dist directory not found, trying lib/wasm...');
    sourcePath = path.join(modulePath, 'lib', 'wasm');

    if (!fs.existsSync(sourcePath)) {
        console.log('lib/wasm directory not found, trying directly in the module...');
        sourcePath = modulePath;
    }
}

console.log(`Searching for WASM files in: ${sourcePath}`);

// List all files in the directory
let files = [];
try {
    files = fs.readdirSync(sourcePath);
    console.log('Found files:', files);
} catch (err) {
    console.error('Error reading directory:', err);
}

// Copy all WASM files
const wasmFiles = files.filter(file => file.endsWith('.wasm'));

if (wasmFiles.length === 0) {
    console.error('No WASM files found!');

    // Last resort - try to find WASM files recursively
    console.log('Searching recursively for WASM files...');

    function findWasmFilesRecursively(dir, fileList = []) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                findWasmFilesRecursively(filePath, fileList);
            } else if (file.endsWith('.wasm')) {
                fileList.push({ name: file, path: filePath });
            }
        });

        return fileList;
    }

    try {
        const foundFiles = findWasmFilesRecursively(modulePath);
        console.log('Found WASM files recursively:', foundFiles);

        foundFiles.forEach(file => {
            const destFile = path.join(destPath, file.name);
            fs.copyFileSync(file.path, destFile);
            console.log(`Copied ${file.name} to public/wasm/`);
        });
    } catch (err) {
        console.error('Error searching recursively:', err);
    }
} else {
    // Copy each file
    wasmFiles.forEach(file => {
        const sourceFile = path.join(sourcePath, file);
        const destFile = path.join(destPath, file);

        fs.copyFileSync(sourceFile, destFile);
        console.log(`Copied ${file} to public/wasm/`);
    });
}

console.log('WASM files copy process completed!'); 