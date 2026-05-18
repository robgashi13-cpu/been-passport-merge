import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^lucide-react$/, replacement: path.resolve(__dirname, "./src/lib/lucide-react.ts") },
      { find: "idb-keyval", replacement: path.resolve(__dirname, "./src/lib/idb-keyval.ts") },
      { find: "@lovable.dev/cloud-auth-js", replacement: path.resolve(__dirname, "./src/lib/lovable-cloud-auth.ts") },
    ],
  },
});
