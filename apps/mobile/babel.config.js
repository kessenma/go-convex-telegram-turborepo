module.exports = {
  presets: ["@react-native/babel-preset"],
  plugins: [
    "@babel/plugin-proposal-function-bind",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-transform-class-properties", { loose: true }],
    [
      "@babel/plugin-transform-runtime",
      {
        helpers: true,
        regenerator: true,
      },
    ],
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-transform-numeric-separator",
    "@babel/plugin-transform-optional-chaining",
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
    [
      "module:react-native-dotenv",
      {
        moduleName: "@env",
        path: ".env",
        blocklist: null,
        allowlist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
    "react-native-reanimated/plugin", // <- This MUST be the last plugin!
  ],
}

