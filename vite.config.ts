import { defineConfig } from "vite";

// Animated Fiesta is a static, client-only Three.js app.
export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
