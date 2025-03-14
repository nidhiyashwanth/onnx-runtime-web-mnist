const fs = require('fs');
const path = require('path');

// Define paths
const onnxRuntimePath = path.join(__dirname, 'node_modules', 'onnxruntime-web');
const customOnnxPath = path.join(__dirname, 'src', 'utils', 'custom-onnx');

// Create the custom ONNX directory if it doesn't exist
if (!fs.existsSync(customOnnxPath)) {
    fs.mkdirSync(customOnnxPath, { recursive: true });
}

// Copy the necessary files from onnxruntime-web
const filesToCopy = [
    'dist/ort.wasm.min.js',
    'dist/ort.wasm.min.mjs',
    'dist/ort-wasm-simd-threaded.wasm',
    'dist/ort-wasm-simd-threaded.jsep.wasm',
];

filesToCopy.forEach(file => {
    const sourcePath = path.join(onnxRuntimePath, file);
    const destPath = path.join(customOnnxPath, path.basename(file));

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${sourcePath} to ${destPath}`);
    } else {
        console.error(`File not found: ${sourcePath}`);
    }
});

// Create a custom index.js file that exports only what we need
const customIndexContent = `
// Custom ONNX Runtime Web wrapper
// This file exports only the parts of onnxruntime-web that we need for browser usage

// Import from the minified browser-compatible version
import { InferenceSession, Tensor, env } from 'onnxruntime-web/dist/ort.wasm.min.mjs';

// Configure the ONNX runtime environment
env.wasm.wasmPaths = '/wasm/';

export { InferenceSession, Tensor, env };
`;

fs.writeFileSync(path.join(customOnnxPath, 'index.js'), customIndexContent);
console.log(`Created custom index.js at ${path.join(customOnnxPath, 'index.js')}`);

console.log('Custom ONNX runtime package created successfully!'); 