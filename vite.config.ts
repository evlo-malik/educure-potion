import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from "path";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
    react(),
    copy({
      targets: [
        {
          src: "node_modules/pdfjs-dist/build/pdf.worker.min.js",
          dest: "public",
        },
      ],
      hook: "buildStart",
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
          ui: ["framer-motion", "lucide-react"],
        },
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    sourcemap: false,
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: [".."],
    },
    // proxy: {
    //   "/api/ai/command": {
    //     target: "https://callai-r5nvvwcznq-uc.a.run.app",
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api\/ai\/command/, ""),
    //   },
    // },
  },
  base: "/",
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
