const fs = require('fs');
const path = require('path');

// Define paths
const sourceDir = path.join(__dirname, 'src', 'utils', 'custom-onnx');
const targetDir = path.join(__dirname, 'public', 'wasm');

// Create the target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Find all WASM files in the source directory
console.log(`Searching for WASM files in: ${sourceDir}`);
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.wasm'));
console.log(`Found files: ${JSON.stringify(files, null, 2)}`);

// Copy each WASM file to the target directory
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${file} to ${targetDir}/`);
});

console.log('WASM files copy process completed!'); 