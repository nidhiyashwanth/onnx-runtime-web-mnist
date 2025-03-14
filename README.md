# ONNX Runtime Web - Browser ML Demo

This is a proof of concept (POC) demonstrating how ONNX Runtime Web can be used to run machine learning models directly in the client browser without a server.

## Features

- Runs an MNIST digit recognition model entirely in the browser
- Uses ONNX Runtime Web to execute the model
- Demonstrates client-side ML inference with no server processing
- Built with Next.js and React

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
```
git clone <repository-url>
cd onnx-ml
```

2. Install dependencies
```
npm install
```

3. Run the development server
```
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

This demo loads a pre-trained MNIST model in ONNX format directly in the browser using ONNX Runtime Web. The model is used to recognize handwritten digits (0-9) from images.

The main components are:

1. **onnxHelper.ts** - Utility functions for working with ONNX models
2. **DigitRecognizer.tsx** - React component that handles the UI and inference
3. **app/page.tsx** - Main page that loads the component with React Suspense

The application:
- Loads a sample digit image (the number 5)
- Preprocesses the image and converts it to a tensor
- Runs inference on the image using the ONNX model
- Displays the predicted digit

## Technology Stack

- Next.js 14
- React 18
- TypeScript
- ONNX Runtime Web
- Tailwind CSS

## Notes on ONNX Runtime Web

ONNX Runtime Web is a JavaScript library that provides the capability to run machine learning models in the browser using WebAssembly. This allows for:

- Privacy - All processing happens on the client side
- Reduced latency - No network requests for inference
- Offline capabilities - Can work without an internet connection once loaded

The WASM files need special handling in Next.js which is configured in `next.config.js`. 