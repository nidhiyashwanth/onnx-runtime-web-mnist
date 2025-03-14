// Custom ONNX Runtime Web wrapper
// This file exports only the parts of onnxruntime-web that we need for browser usage

// Import directly from the local files
import { InferenceSession, Tensor, env } from './ort.wasm.min.mjs';

// Configure the ONNX runtime environment
env.wasm.wasmPaths = '/wasm/';

export { InferenceSession, Tensor, env };
