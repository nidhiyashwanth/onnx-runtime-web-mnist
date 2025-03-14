'use client';

import * as ort from 'onnxruntime-web';

// Initialize ONNX runtime with the files we found
ort.env.wasm.wasmPaths = {
  'ort-wasm-simd-threaded.wasm': '/wasm/ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.wasm': '/wasm/ort-wasm-simd-threaded.jsep.wasm',
};

// Enable debug logging but don't be too verbose
ort.env.debug = true;
console.log('ONNX Runtime version:', ort.env.versions);

// Function to load an image and convert it to a tensor for the MNIST model
export const imageToTensor = async (imageUrl: string): Promise<ort.Tensor> => {
  return new Promise((resolve, reject) => {
    // Use document.createElement instead of new Image()
    const img = document.createElement('img');
    
    img.onload = () => {
      console.log(`Image loaded successfully: ${imageUrl}`);
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 28;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill with white background first
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 28, 28);
      
      // Draw the image in the canvas
      ctx.drawImage(img, 0, 0, 28, 28);
      const imageData = ctx.getImageData(0, 0, 28, 28);
      
      // ===== DEBUG =====
      // Log the first few pixels to verify we have data
      console.log('First 10 pixels:');
      for (let i = 0; i < 10; i++) {
        console.log(`Pixel ${i}: R=${imageData.data[i*4]}, G=${imageData.data[i*4+1]}, B=${imageData.data[i*4+2]}, A=${imageData.data[i*4+3]}`);
      }
      // ================
      
      // Convert the image data to a Float32Array
      // MNIST expects a 1D array of 784 (28*28) values between 0-1
      const data = new Float32Array(28 * 28);
      for (let i = 0; i < imageData.data.length / 4; i++) {
        // Convert RGBA to grayscale and normalize to 0-1
        // For MNIST: white (255,255,255) should be 0, black (0,0,0) should be 1
        const r = 1.0 - (imageData.data[i * 4] / 255);
        const g = 1.0 - (imageData.data[i * 4 + 1] / 255);
        const b = 1.0 - (imageData.data[i * 4 + 2] / 255);
        
        // Simple grayscale conversion - higher value for darker pixels
        data[i] = (r + g + b) / 3;
      }
      
      // Log first few values of processed data
      console.log('First 10 tensor values:');
      for (let i = 0; i < 10; i++) {
        console.log(`Value ${i}: ${data[i]}`);
      }
      
      // Create the tensor (shape should match model input)
      // MNIST model expects shape [1, 1, 28, 28]
      const tensor = new ort.Tensor('float32', data, [1, 1, 28, 28]);
      resolve(tensor);
    };
    
    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

// Function to run inference on an ONNX model
export const runInference = async (modelPath: string, inputTensor: ort.Tensor): Promise<number> => {
  try {
    console.log(`Creating session for model: ${modelPath}`);
    
    // Simplest approach possible: fetch the model directly
    const response = await fetch(modelPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
    }
    
    const modelArrayBuffer = await response.arrayBuffer();
    console.log(`Model file fetched successfully: ${modelPath} (${modelArrayBuffer.byteLength} bytes)`);
    
    // Log first few bytes of model to verify it's an ONNX file
    const firstBytes = new Uint8Array(modelArrayBuffer.slice(0, 20));
    console.log('First 20 bytes of model file:', Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    // Create session with minimal options for maximum compatibility
    const sessionOptions = {
      executionProviders: ['wasm'],
      enableMemPattern: false,
      enableCpuMemArena: false
    };
    
    console.log('Creating session with minimal options');
    const session = await ort.InferenceSession.create(modelArrayBuffer, sessionOptions);
    
    console.log('Session created successfully');
    console.log('Model input names:', session.inputNames);
    console.log('Model output names:', session.outputNames);
    
    // Create feeds with the input name from model
    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;
    
    // Run the session
    console.log('Running inference...');
    const outputData = await session.run(feeds);
    console.log('Inference completed, processing results...');
    
    // Get the output tensor
    const output = outputData[session.outputNames[0]];
    console.log('Output tensor shape:', output.dims);
    
    // Process the output - find the index of max value (predicted digit)
    const predictions = Array.prototype.slice.call(output.data as Float32Array);
    console.log('Raw predictions:', predictions);
    const maxPredictionIndex = predictions.indexOf(Math.max(...predictions));
    console.log('Prediction index:', maxPredictionIndex);
    
    return maxPredictionIndex;
  } catch (error) {
    console.error('Error running inference:', error);
    throw error;
  }
}; 