'use client';

// Define the Tensor class
export class Tensor {
  type: string;
  data: Float32Array;
  dims: number[];

  constructor(type: string, data: Float32Array, dims: number[]) {
    this.type = type;
    this.data = data;
    this.dims = dims;
  }
}

// Define the InferenceSession class
export class InferenceSession {
  private modelPath: string;
  private model: any;

  private constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  // Create a new inference session
  static async create(modelPath: string): Promise<InferenceSession> {
    const session = new InferenceSession(modelPath);
    
    try {
      // Load the ONNX model using the browser's fetch API
      const response = await fetch(modelPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }
      
      // Get the model as an ArrayBuffer
      const modelBuffer = await response.arrayBuffer();
      
      // In a real implementation, we would load the model into the WASM runtime
      // For now, we'll just store the model buffer
      session.model = modelBuffer;
      
      return session;
    } catch (error) {
      console.error('Error creating inference session:', error);
      throw error;
    }
  }

  // Run inference on the model
  async run(feeds: { [key: string]: Tensor }): Promise<{ [key: string]: Tensor }> {
    try {
      // In a real implementation, we would run the model using the WASM runtime
      // For now, we'll just simulate the inference by returning a mock result
      
      // Get the input tensor
      const inputTensor = feeds.input;
      
      // Create a mock output tensor with 10 values (for MNIST digits 0-9)
      const outputData = new Float32Array(10);
      
      // Simulate inference by setting a high probability for digit 5
      // This is just a mock implementation
      for (let i = 0; i < 10; i++) {
        outputData[i] = Math.random() * 0.1; // Random low probabilities
      }
      outputData[5] = 0.9; // High probability for digit 5
      
      // Create the output tensor
      const outputTensor = new Tensor('float32', outputData, [1, 10]);
      
      // Return the result
      return { output: outputTensor };
    } catch (error) {
      console.error('Error running inference:', error);
      throw error;
    }
  }
}

/**
 * Converts an image to a tensor suitable for the MNIST model
 * @param imageData The image data to convert
 * @returns A tensor representing the image
 */
export async function imageToTensor(imageData: ImageData): Promise<Tensor> {
  try {
    // Get the pixel data from the image
    const { data, width, height } = imageData;
    
    // Create a Float32Array to hold the normalized pixel values
    const inputArray = new Float32Array(width * height);
    
    // Convert the RGBA pixel data to grayscale and normalize to [0, 1]
    for (let i = 0; i < width * height; i++) {
      // Get the RGBA values
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      
      // Convert to grayscale using the luminance formula
      const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
      
      // Invert the color (MNIST expects white digits on black background)
      inputArray[i] = 1.0 - gray;
    }
    
    // Create a tensor with the shape expected by the MNIST model [1, 1, 28, 28]
    // The dimensions are [batch_size, channels, height, width]
    return new Tensor('float32', inputArray, [1, 1, height, width]);
  } catch (error) {
    console.error('Error converting image to tensor:', error);
    throw error;
  }
}

/**
 * Runs inference on the MNIST model
 * @param modelPath The path to the ONNX model
 * @param tensor The input tensor
 * @returns The predicted digit (0-9)
 */
export async function runInference(modelPath: string, tensor: Tensor): Promise<number> {
  try {
    // Create an inference session
    const session = await InferenceSession.create(modelPath);
    
    // Run inference
    const results = await session.run({ input: tensor });
    
    // Get the output data
    const output = results.output;
    const outputData = output.data as Float32Array;
    
    // Find the index with the highest probability
    let maxIndex = 0;
    let maxProbability = outputData[0];
    
    for (let i = 1; i < outputData.length; i++) {
      if (outputData[i] > maxProbability) {
        maxProbability = outputData[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  } catch (error) {
    console.error('Error running inference:', error);
    throw error;
  }
} 