/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Construit dans ../shopsnap/static (servi par Flask). En dev, l'API Flask tourne sur 8765.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  base: "/static/",
  build: { outDir: "../shopsnap/static", emptyOutDir: true },
  server: {
    port: 5180,
    proxy: {
      "/api": "http://127.0.0.1:8765",
      "/apercu": "http://127.0.0.1:8765",
    },
  },
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"], globals: true },
});
