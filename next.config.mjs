/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        // Don't run this on the server
        if (!isServer) {
            // ONNX Runtime Web requires these fallbacks
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };

            // Configure for WASM files
            config.module.rules.push({
                test: /\.wasm$/,
                type: 'asset/resource',
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