import { defineConfig } from "vite";

// Animated Fiesta is a static, client-only Three.js app.
export default defineConfig({
  base: "./",
  server: {
    host: true,
    // Avoid 5173 — a stale service worker from another local project can
    // squat that origin and intercept requests. Use a dedicated port.
    port: 5191,
    strictPort: true,
  },
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
