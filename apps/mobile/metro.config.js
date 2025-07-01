const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');

// Find the workspace root
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

// Create a custom resolver for pnpm
function resolveSymlinks(inputPath) {
    try {
        return fs.realpathSync(inputPath);
    } catch (err) {
        return inputPath;
    }
}

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Set up resolver to handle pnpm symlinks
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies through the project's node_modules
config.resolver.extraNodeModules = new Proxy(
    {},
    {
        get: (target, name) => {
            // Try to resolve the package from the project root first
            const projectPath = path.join(projectRoot, 'node_modules', String(name));
            if (fs.existsSync(projectPath)) {
                return resolveSymlinks(projectPath);
            }

            // Then try the workspace root
            const workspacePath = path.join(workspaceRoot, 'node_modules', String(name));
            if (fs.existsSync(workspacePath)) {
                return resolveSymlinks(workspacePath);
            }

            // If not found, return the original module path
            return path.join(projectRoot, 'node_modules', String(name));
        },
    },
);

// 4. Add the custom transformer
config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
};

module.exports = mergeConfig(config, {});