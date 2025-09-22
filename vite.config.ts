import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    commonjsOptions: {
      include: ["tailwind.config.js", "node_modules/**"],
    },
  },
  optimizeDeps: {
    include: ["tailwind-config"],
    // Don’t let Vite crawl tom-select's "source" entries
    exclude: ["tom-select"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tailwind-config": fileURLToPath(
        new URL("./tailwind.config.js", import.meta.url)
      ),
      // ✅ Force compiled ESM bundle instead of /src/*.ts
      "tom-select": "tom-select/dist/esm/tom-select.complete.js",
      // If your version ever lacks ESM, switch to:
      // "tom-select": "tom-select/dist/js/tom-select.complete.js",
    },
    // Avoid preferring "source" which can point to TS files
    conditions: ["browser", "import", "module", "default"],
  },
});
