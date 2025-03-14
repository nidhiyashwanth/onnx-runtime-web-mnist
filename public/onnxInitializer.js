// This script will be included in the HTML to initialize ONNX Runtime
(function () {
    // Make sure this runs only in browser environments
    if (typeof window !== 'undefined') {
        console.log('Initializing ONNX Runtime WASM paths');

        // Set the WASM path for ONNX Runtime Web
        window.ortWasmPaths = {
            'ort-wasm-simd-threaded.wasm': '/wasm/ort-wasm-simd-threaded.wasm',
            'ort-wasm-simd-threaded.jsep.wasm': '/wasm/ort-wasm-simd-threaded.jsep.wasm',
        };

        console.log('ONNX Runtime WASM paths initialized:', window.ortWasmPaths);
    }
})(); 