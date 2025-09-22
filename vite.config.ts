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
    // Prevent Vite from crawling tom-select's package.json "exports"/"source"
    exclude: ["tom-select"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tailwind-config": fileURLToPath(
        new URL("./tailwind.config.js", import.meta.url)
      ),
      // ✅ Force compiled build instead of /src .ts files.
      // Try ESM first; if your installed version lacks ESM, use the JS path below.
      "tom-select": "tom-select/dist/esm/tom-select.complete.js",
      // Fallback (uncomment if your version has no /dist/esm):
      // "tom-select": "tom-select/dist/js/tom-select.complete.js",
    },
    // Make sure we don't accidentally prefer "source"
    conditions: ["browser", "import", "module", "default"],
  },
});
