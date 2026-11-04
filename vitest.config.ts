import { defineConfig } from "vitest/config";
import path from "path";

// Tests unitaires de la logique pure (src/**/*.test.ts). Config séparée de
// vite.config.ts pour ne pas charger les plugins PWA / imagetools en test.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
