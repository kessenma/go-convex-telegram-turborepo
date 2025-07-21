import { nextJsConfig } from "@repo/eslint-config/next-js";
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Turn off the base rule as it can report incorrect errors
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Enable unused imports detection and auto-fix
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "react/prop-types": "off", // Using TypeScript for prop validation
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Relax some rules for Three.js and React Three Fiber
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            // Three.js/React Three Fiber properties
            "args",
            "position",
            "rotation",
            "scale",
            "intensity",
            "object",
            "transparent",
            "wireframe",
            "emissive",
            "emissiveIntensity",
            "castShadow",
          ],
        },
      ],
      // Allow some React hooks patterns common in Three.js
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
