const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('Starting MNIST model download script...');

// Create models directory if it doesn't exist
const modelsDir = path.join(__dirname, 'public', 'models');
const simpleDir = path.join(modelsDir, 'simple');

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log('Created models directory');
}

if (!fs.existsSync(simpleDir)) {
    fs.mkdirSync(simpleDir, { recursive: true });
    console.log('Created simple models directory');
}

// URLs for the MNIST models from ONNX Model Zoo
const MODEL_URLS = [
    {
        url: 'https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-7.onnx',
        path: path.join(simpleDir, 'model.onnx'),
        name: 'MNIST-7 (Simpler)'
    },
    {
        url: 'https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-8.onnx',
        path: path.join(modelsDir, 'mnist-8.onnx'),
        name: 'MNIST-8'
    },
    {
        url: 'https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-12.onnx',
        path: path.join(modelsDir, 'mnist.onnx'),
        name: 'MNIST-12 (Newer)'
    }
];

/**
 * Download a file from a URL to a local path
 */
function downloadFile(url, destPath, name) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading ${name} from ${url}...`);

        const file = fs.createWriteStream(destPath);

        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 302 || response.statusCode === 301) {
                console.log(`Following redirect to ${response.headers.location}...`);
                downloadFile(response.headers.location, destPath, name)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`Successfully downloaded ${name} to ${destPath}`);
                resolve();
            });

            response.on('error', (err) => {
                fs.unlink(destPath, () => { }); // Delete the file if there was an error
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete the file if there was an error
            reject(err);
        });
    });
}

// Download each model sequentially
async function downloadAllModels() {
    for (const model of MODEL_URLS) {
        try {
            await downloadFile(model.url, model.path, model.name);
        } catch (err) {
            console.error(`Error downloading ${model.name}:`, err.message);
        }
    }

    console.log('All downloads completed. Verifying files...');

    // Verify files exist and are not empty
    let allValid = true;
    for (const model of MODEL_URLS) {
        try {
            const stats = fs.statSync(model.path);
            if (stats.size > 0) {
                console.log(`✅ ${model.name}: ${stats.size} bytes`);
            } else {
                console.log(`❌ ${model.name}: File exists but is empty`);
                allValid = false;
            }
        } catch (err) {
            console.log(`❌ ${model.name}: File does not exist`);
            allValid = false;
        }
    }

    if (allValid) {
        console.log('All models downloaded successfully and ready to use!');
    } else {
        console.log('Some models failed to download. Please try running the script again.');
    }
}

downloadAllModels().catch(console.error); 