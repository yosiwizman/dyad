import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ReactCompilerConfig = {};

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/dyad/" : "/";

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_BASE_PATH": JSON.stringify(basePath),
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
