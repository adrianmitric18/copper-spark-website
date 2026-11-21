import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { imagetools } from "vite-imagetools";
import { existsSync, readFileSync } from "node:fs";

/**
 * Module virtuel `virtual:realisations` : les réalisations publiées, figées au
 * build par scripts/fetch-realisations.mjs dans .generated/realisations.json.
 * Données initiales des pages /realisations et /realisations/:slug, pour que
 * leur HTML pré-rendu soit complet sans requête Supabase.
 * Fichier absent ou illisible = snapshot vide, jamais une erreur de build.
 */
function realisationsSnapshot() {
  const id = "virtual:realisations";
  const resolved = "\0" + id;
  const file = path.resolve(__dirname, ".generated/realisations.json");
  const vide = '{"generatedAt":null,"supabaseUrl":null,"projects":[]}';
  return {
    name: "realisations-snapshot",
    resolveId(source: string) {
      return source === id ? resolved : null;
    },
    load(source: string) {
      if (source !== resolved) return null;
      let json = vide;
      if (existsSync(file)) {
        try {
          json = JSON.stringify(JSON.parse(readFileSync(file, "utf8")));
        } catch {
          /* snapshot illisible : liste vide */
        }
      }
      return `export default ${json};`;
    },
  };
}

/**
 * Note Google figée au build (même fichier que les réalisations), exposée par
 * la constante `__GOOGLE_RATING__`. Une constante plutôt que le module
 * virtuel : l'accueil lit la note, et n'a pas à embarquer tout le snapshot des
 * réalisations pour deux nombres.
 */
function googleRatingDuBuild(): { rating: number; total: number } | null {
  const file = path.resolve(__dirname, ".generated/realisations.json");
  if (!existsSync(file)) return null;
  try {
    const r = JSON.parse(readFileSync(file, "utf8")).googleRating;
    return r && Number.isFinite(r.rating) && Number.isFinite(r.total) ? { rating: r.rating, total: r.total } : null;
  } catch {
    return null;
  }
}

export default defineConfig(({ mode }) => ({
  define: {
    __GOOGLE_RATING__: JSON.stringify(googleRatingDuBuild()),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    realisationsSnapshot(),
    mode === "development" && componentTagger(),
    imagetools(),
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
          // Split data layer pour mieux cacher entre navigations.
          // supabase/query : utilisés sur la home (useAggregateRating) et
          // partout ailleurs → bénéficient d'un chunk dédié.
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
          // Les forms ne sont chargés que sur /contact et /admin → pas
          // besoin de les inclure dans le chunk initial.
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
