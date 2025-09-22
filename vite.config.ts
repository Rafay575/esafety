import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // …your existing config…
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tailwind-config": fileURLToPath(new URL("./tailwind.config.js", import.meta.url)),

      // ⬇️ Force CSS to the actual file so PostCSS can resolve it
      "simplebar/dist/simplebar.css":
        fileURLToPath(new URL("./node_modules/simplebar/dist/simplebar.css", import.meta.url)),
      "simplebar/dist/simplebar.min.css":
        fileURLToPath(new URL("./node_modules/simplebar/dist/simplebar.min.css", import.meta.url)),
    },
    conditions: ["browser", "import", "module", "default"],
  },
});
