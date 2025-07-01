const metro = require('metro');

module.exports.transform = async ({ src, filename, options }) => {
    const { transform } = await metro.createTransformer({
        babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
    });

    return transform({ src, filename, options });
};