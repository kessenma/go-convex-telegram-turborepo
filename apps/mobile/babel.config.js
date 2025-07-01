module.exports = {
  presets: ["@react-native/babel-preset"],
  plugins: [
    "@babel/plugin-proposal-function-bind",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    [
      "@babel/plugin-transform-runtime",
      {
        helpers: true,
        regenerator: true,
      },
    ],
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-optional-chaining",
    [
      "module-resolver",
      {
        root: ["./"],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@": "./",
          "@components": "./components",
          "@views": "./views",
          "@api": "./api",
          "@config": "./config",
          "@utils": "./utils",
        },
      },
    ],
    "react-native-reanimated/plugin", // <- This MUST be the last plugin!
  ],
}

