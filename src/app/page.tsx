import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the DigitRecognizer component with SSR disabled
// This is necessary because the component uses browser-only APIs
const DigitRecognizer = dynamic(() => import('@/components/DigitRecognizer'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="container mx-auto min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl font-bold text-white text-center mb-6">
        MNIST Digit Recognition
      </h1>
      
      <p className="text-center mb-8 max-w-lg mx-auto text-gray-400 text-sm">
        Draw any digit (0-9) and the AI will recognize it using ONNX Runtime Web directly in your browser.
      </p>
      
      {/* Use Suspense to show a fallback while the component loads */}
      <Suspense fallback={<LoadingFallback />}>
        <DigitRecognizer />
      </Suspense>
      
      <footer className="mt-8 text-gray-500 text-xs text-center">
        <p>Built with ONNX Runtime Web and Next.js</p>
        <p className="mt-1">No server processing required - all ML inference runs locally in your browser</p>
      </footer>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-40 w-48 bg-gray-700 rounded mx-auto mb-4"></div>
        <div className="flex space-x-2 justify-center mb-4">
          <div className="h-10 bg-gray-700 rounded w-20"></div>
          <div className="h-10 bg-gray-700 rounded w-40"></div>
          <div className="h-10 bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-5/6 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6 mx-auto"></div>
      </div>
      <p className="mt-6 text-center text-gray-400">Loading ML model...</p>
    </div>
  );
} 