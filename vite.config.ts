import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  cacheDir: "node_modules/.vite",
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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react/jsx-runtime"],
        },
      },
    },
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
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-is",
      "react-router-dom",
      "react-router",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "lucide-react",
      "recharts",
      "react-smooth",
      "framer-motion",
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
  },
  esbuild: {
    jsxInject: undefined,
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      const mod = await import("./server/index.ts");
      const app = mod.createServer();
      server.middlewares.use(app);
    },
  };
}
