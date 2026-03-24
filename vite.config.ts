import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Defer Express server import to runtime inside configureServer to avoid
// resolution/bundling of server tree during Vite config evaluation.

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Keep Vite cache outside OneDrive-managed workspace to avoid Windows EPERM
  // lock errors when Vite rewrites dependency bundles.
  cacheDir: path.join(
    process.env.LOCALAPPDATA || process.cwd(),
    "warehouse_2026_vite_cache",
  ),
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-is",
      "scheduler",
    ],
  },
  optimizeDeps: {
    entries: [
      "index.html",
      "client/main.tsx",
      "client/App.tsx",
      "client/components/**/*.tsx",
      "client/contexts/**/*.tsx",
      "client/pages/**/*.tsx",
      "client/services/**/*.ts",
    ],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-is",
      "scheduler",
      "react-router-dom",
      "react-router",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "lucide-react",
      "recharts",
      "react-smooth",
      "framer-motion",
      "tesseract.js",
      "pdfjs-dist",
      "@tensorflow-models/mobilenet",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "@radix-ui/react-slot",
      "@radix-ui/react-toast",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-label",
      "@radix-ui/react-avatar",
      "@radix-ui/react-progress",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-switch",
      "@radix-ui/react-slider",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "sonner",
      "vaul",
      "cmdk",
      "embla-carousel-react",
      "react-day-picker",
      "react-hook-form",
      "react-resizable-panels",
    ],
    force: true,
    holdUntilCrawlEnd: true,
  },
  esbuild: {
    jsx: "automatic",
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      const mod = await import("./server/index.ts");
      const app = mod.createServer();
      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
