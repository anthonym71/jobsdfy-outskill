import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      // Explicitly disabling old JSX transforms that cause the 'Invalid key' error in Vite 8
      jsxImportSource: 'react',
    })
  ],
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Renaming this to rolldownOptions silences the deprecation warning
    rolldownOptions: {
      external: [],
    }
  }
});