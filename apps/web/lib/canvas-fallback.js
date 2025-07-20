// Canvas fallback for client-side compatibility
// This prevents canvas module from being loaded in the browser

if (typeof window !== "undefined") {
  // Browser environment - provide empty implementation
  module.exports = {
    createCanvas: () => {
      throw new Error("Canvas is not available in browser environment");
    },
    loadImage: () => {
      throw new Error("Canvas is not available in browser environment");
    },
    registerFont: () => {
      throw new Error("Canvas is not available in browser environment");
    },
  };
} else {
  // Server environment - try to load actual canvas or provide fallback
  try {
    module.exports = require("canvas");
  } catch (_e) {
    // Canvas not available, provide fallback
    module.exports = {
      createCanvas: () => {
        throw new Error("Canvas module not installed");
      },
      loadImage: () => {
        throw new Error("Canvas module not installed");
      },
      registerFont: () => {
        throw new Error("Canvas module not installed");
      },
    };
  }
}
