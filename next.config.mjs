/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        // Don't run this on the server
        if (!isServer) {
            // Configure for WASM files
            config.module.rules.push({
                test: /\.wasm$/,
                type: 'asset/resource',
            });

            // Fix for Node.js modules error in onnxruntime-web
            config.module.rules.push({
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            });
        }

        return config;
    },
    // Enable Cross-Origin Isolation headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ];
    },
};

export default nextConfig; 