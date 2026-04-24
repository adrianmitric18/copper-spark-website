import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Disable in dev to avoid Lovable preview iframe interference
      devOptions: {
        enabled: false,
      },
      // Use a dedicated manifest filename so we don't clash with the existing
      // public/site.webmanifest used for the public marketing site.
      manifestFilename: "admin-manifest.webmanifest",
      includeAssets: [
        "icon-192.png",
        "icon-512.png",
        "apple-touch-icon-admin.png",
      ],
      manifest: {
        name: "Cuivre Admin",
        short_name: "Admin",
        description: "CRM Le Cuivre Électrique — gestion des leads, RDV et checklists de visite",
        start_url: "/admin",
        scope: "/admin",
        display: "standalone",
        orientation: "portrait",
        background_color: "#E85D04",
        theme_color: "#E85D04",
        lang: "fr-BE",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Only cache /admin shell + static assets. Never cache OAuth callbacks
        // and never cache the public marketing site (which the user navigates
        // away from). The SW is registered only on /admin (see main.tsx guard).
        navigateFallback: "/admin",
        navigateFallbackDenylist: [
          /^\/~oauth/,
          /^\/api\//,
          /^\/auth/,
        ],
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,woff2}"],
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Supabase API: network-first, never persist sensitive lead data
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          animations: ["framer-motion"],
          ui: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
