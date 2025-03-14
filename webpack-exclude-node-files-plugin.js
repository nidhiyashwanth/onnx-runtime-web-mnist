/**
 * A webpack plugin to exclude Node.js-specific files from the build process
 */
export default class ExcludeNodeFilesPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        const excludeRegex = /\.node\.(mjs|js)$/;

        // Add a hook to the normal module factory
        compiler.hooks.normalModuleFactory.tap('ExcludeNodeFilesPlugin', (factory) => {
            // Add a hook to the module resolver
            factory.hooks.beforeResolve.tap('ExcludeNodeFilesPlugin', (data) => {
                if (!data) return;

                // Check if the request matches our exclude pattern
                if (excludeRegex.test(data.request)) {
                    // Skip this module completely
                    return false;
                }

                return data;
            });
        });
    }
} 