'use client';

import { useState, useEffect, useRef } from 'react';
import { imageToTensor, runInference } from '@/utils/onnxHelper';

export default function DigitRecognizer() {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImagePath, setCurrentImagePath] = useState('/5.png');
  const [modelPath, setModelPath] = useState('/models/simple/model.onnx');
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [allModelsFailed, setAllModelsFailed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [useDrawnImage, setUseDrawnImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // List of possible image paths to try
  const imagePaths = [
    '/5.png',
    '/digit5.png'
  ];

  // List of possible model paths to try
  const modelPaths = [
    '/models/simple/model.onnx', // Try the simpler model first
    '/models/mnist.onnx',
    '/models/mnist-8.onnx'
  ];

  // Initialize drawing canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set initial canvas state - white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Set drawing style
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      let x, y;
      
      if ('touches' in e) {
        // Touch event
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        // Mouse event
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      let x, y;
      
      if ('touches' in e) {
        // Touch event
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        // Mouse event
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    setUseDrawnImage(true);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setPrediction(null);
    }
  };

  // Preload and verify that at least one image is available
  useEffect(() => {
    // Try to load images in sequence until one works
    const tryLoadImage = (index: number) => {
      if (index >= imagePaths.length) {
        console.error('All image loading attempts failed');
        setError('Failed to load any test images. Check console for details.');
        return;
      }
      
      const path = imagePaths[index];
      console.log(`Attempting to load image: ${path}`);
      
      const img = document.createElement('img');
      
      img.onload = () => {
        console.log(`Successfully loaded image: ${path}`);
        setImageLoaded(true);
        setCurrentImagePath(path);
        setError(null);
      };
      
      img.onerror = () => {
        console.error(`Failed to load image: ${path}`);
        // Try next image
        tryLoadImage(index + 1);
      };
      
      img.src = path;
    };
    
    // Start trying to load images
    tryLoadImage(0);
    
    // No cleanup needed as we want the image loading to complete
  }, []);
  
  // Reset all state and start over
  const resetAndRetry = () => {
    setFallbackIndex(0);
    setModelPath(modelPaths[0]);
    setRetryCount(0);
    setAllModelsFailed(false);
    setError(null);
    setPrediction(null);
    // Short delay to ensure state updates before retry
    setTimeout(() => {
      recognizeDigit();
    }, 500);
  };

  // Manually set a different model
  const tryNextModel = () => {
    if (fallbackIndex < modelPaths.length - 1) {
      const nextIndex = fallbackIndex + 1;
      setFallbackIndex(nextIndex);
      setModelPath(modelPaths[nextIndex]);
      setError(`Switching to model: ${modelPaths[nextIndex]}`);
      setRetryCount(0);
    } else {
      setAllModelsFailed(true);
      setError('All models have failed. Try a different approach or check troubleshooting tips below.');
    }
  };

  const recognizeDigit = async () => {
    // Don't attempt if we've already tried all models
    if (allModelsFailed) {
      setError('All models have failed. Please try the troubleshooting options below.');
      return;
    }
    
    // Prevent excessive retry loops
    if (retryCount > 3) {
      setError(`Too many retries on model ${fallbackIndex + 1}. Try the next model instead.`);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      let tensor;
      
      if (useDrawnImage && canvasRef.current) {
        console.log('Using drawn image for recognition');
        // Convert canvas to a data URL
        const canvasDataUrl = canvasRef.current.toDataURL('image/png');
        // Create an image from the canvas data
        const img = document.createElement('img');
        
        // Wait for the image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = canvasDataUrl;
        });
        
        // Draw the image to a new 28x28 canvas for proper size
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
          // Fill with white background first
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 28, 28);
          // Draw the image
          ctx.drawImage(img, 0, 0, 28, 28);
          
          // Get the data URL from the new canvas
          const dataUrl = tempCanvas.toDataURL('image/png');
          
          // Convert to tensor
          tensor = await imageToTensor(dataUrl);
        } else {
          throw new Error('Could not get canvas context');
        }
      } else {
        console.log('Using sample image for recognition:', currentImagePath);
        // Convert image to tensor
        tensor = await imageToTensor(currentImagePath);
      }
      
      console.log('Image converted to tensor successfully');
      
      // Run inference with the MNIST model
      console.log('Running inference with model:', modelPath);
      const result = await runInference(modelPath, tensor);
      console.log('Inference completed successfully with result:', result);
      
      // Clear any previous errors and update state
      setError(null);
      setPrediction(result);
      setRetryCount(0);
      setAllModelsFailed(false);
    } catch (err) {
      console.error('Error during recognition:', err);
      setRetryCount(prev => prev + 1);
      
      // If model loading failed, try the next model in sequence
      if (fallbackIndex < modelPaths.length - 1 && err instanceof Error && 
          (err.message.includes('Failed to load model') || err.message.includes('protobuf parsing failed'))) {
        console.log('Trying next model file...');
        const nextIndex = fallbackIndex + 1;
        const nextModel = modelPaths[nextIndex];
        setModelPath(nextModel);
        setFallbackIndex(nextIndex);
        setError(`Model ${fallbackIndex + 1} failed, trying model ${nextIndex + 1}: ${nextModel}`);
        setRetryCount(0);
        
        // Retry with the next model after a brief delay
        setTimeout(() => {
          recognizeDigit();
        }, 1000);
        return;
      }
      
      // If we've tried all models and still have errors
      if (fallbackIndex >= modelPaths.length - 1) {
        setAllModelsFailed(true);
        setError('All models have failed. Try the troubleshooting options below.');
      } else {
        setError('Failed to recognize digit. See console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white text-center">MNIST Digit Recognition</h2>
      
      {/* Model info */}
      <div className="mb-3 text-xs text-gray-400 text-center">
        <div>Using model: {modelPath.split('/').pop()}</div>
        <div className="text-xs text-gray-500">Model {fallbackIndex + 1} of {modelPaths.length}</div>
      </div>
      
      <div className="flex flex-col items-center gap-4 mb-6">
        {/* Drawing Canvas */}
        <div className="border border-gray-600 rounded-lg bg-white mb-2 shadow-md overflow-hidden">
          <canvas 
            ref={canvasRef}
            width={196}
            height={196}
            className="cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>
        
        {/* Canvas Controls */}
        <div className="flex space-x-2 w-full justify-center">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          
          <button
            onClick={recognizeDigit}
            disabled={isLoading || allModelsFailed}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-grow"
          >
            {isLoading ? 'Recognizing...' : 'Recognize Digit'}
          </button>
          
          <button
            onClick={tryNextModel}
            disabled={fallbackIndex >= modelPaths.length - 1 || isLoading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Try Next Model
          </button>
        </div>
        
        {/* Prediction Result */}
        {prediction !== null && (
          <div className="mt-4 py-6 px-8 bg-gray-800 rounded-xl border border-gray-700 shadow-inner">
            <h3 className="text-gray-400 text-sm mb-1 text-center">Prediction</h3>
            <div className="text-5xl font-bold text-white text-center">{prediction}</div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
            {error}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-6 text-center">
        <p>
          This demo runs MNIST digit recognition directly in your browser using ONNX Runtime Web.
          Draw a digit from 0-9 in the canvas above and click "Recognize Digit".
        </p>
      </div>
    </div>
  );
} 