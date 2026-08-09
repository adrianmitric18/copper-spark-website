#!/usr/bin/env node
// Pré-rendu statique des routes publiques — étape de POST-BUILD.
// Lance avec : npm run prerender (ou automatiquement via npm run build)
//
// ============================================================================
// POURQUOI PUPPETEER ET PAS vite-prerender-plugin / vite-ssg
// ============================================================================
// Le site pose son <title>, sa meta description, son canonical et son JSON-LD
// depuis des useEffect (src/components/SEO.tsx et StructuredData.tsx). Or les
// effets ne s'exécutent JAMAIS dans un rendu SSR Node (renderToString les
// ignore) : un plugin de pré-rendu SSR produirait des pages sans aucune de ces
// balises, c'est-à-dire sans le bénéfice recherché. Puppeteer pilote un vrai
// Chromium, les effets tournent, et on sérialise le DOM réel.
//
// ============================================================================
// COMMENT ÇA MARCHE
// ============================================================================
// 1. dist/index.html (le shell SPA) est lu EN MÉMOIRE une fois pour toutes.
// 2. Un petit serveur statique sert dist/ ; toute requête de navigation reçoit
//    ce shell mémoire — jamais un fichier déjà pré-rendu. Sans ça, le pré-rendu
//    de la home réécrirait dist/index.html et les routes suivantes partiraient
//    d'un HTML déjà rendu (double rendu en cascade).
// 3. Chaque route est visitée, on attend que React ait rendu, on déroule la
//    page pour déclencher les animations au scroll, puis on écrit le DOM dans
//    dist/<route>/index.html.
// 4. Cloudflare Pages sert nativement ces fichiers et retombe sur le shell SPA
//    pour toute route non pré-rendue (/realisations/:slug, /admin, /merci).
//
// L'app continue de démarrer avec createRoot() et non hydrateRoot() : React
// remplace le DOM pré-rendu au montage. C'est volontaire — voir la note
// "HYDRATATION" plus bas.
//
// ============================================================================
// CE QUE ÇA SUPPOSE CÔTÉ CLOUDFLARE PAGES
// ============================================================================
// - Node >= 22.12 (exigé par puppeteer 25) → épinglé dans .nvmrc, que
//   Cloudflare Pages lit pour choisir sa version de Node.
// - Chromium téléchargé au `npm install` (postinstall de puppeteer) et rangé
//   dans .cache/ du projet → cf. .puppeteerrc.cjs.
// - Les devDependencies doivent être installées : c'est déjà le cas puisque
//   `vite` lui-même en est une et que le build fonctionne aujourd'hui.
//
// ============================================================================
// TOLÉRANCE AUX PANNES
// ============================================================================
// Un échec de pré-rendu ne casse PAS le build : on repart alors sur le
// comportement actuel (SPA pure), avec un avertissement très visible dans les
// logs. Un site qui perd son pré-rendu reste un site en ligne ; un build rouge
// chez Cloudflare, non. Mettre PRERENDER_STRICT=1 pour échouer franchement
// (utile en debug local).

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PRERENDER_PATHS } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const PORT = Number(process.env.PRERENDER_PORT ?? 41873);
// Séquentiel par défaut, et c'est délibéré. En parallèle, Chromium met en
// sommeil les onglets qui ne sont pas au premier plan : les animations d'entrée
// framer-motion ne se terminent pas et on fige des pages dont la moitié des
// blocs sont restés à opacity:0. Mesuré sur ce projet : en concurrence 4, 5 à 7
// routes sur 20 sortaient abîmées, et pas les mêmes d'un run à l'autre. Le
// pré-rendu complet prend ~1 min en séquentiel, ce qui est sans conséquence
// pour un build Cloudflare.
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY ?? 1);
const STRICT = process.env.PRERENDER_STRICT === "1";
const NAV_TIMEOUT = 45_000;

/** Hôtes dont les requêtes sont coupées pendant le pré-rendu. */
const BLOCKED = [
  // --- Analytics / publicité ---------------------------------------------
  // Sans ça, chaque route visitée par Puppeteer compterait comme une vraie
  // page vue GA4/Google Ads à chaque déploiement, et polluerait les stats.
  "googletagmanager.com",
  "google-analytics.com",
  "analytics.google.com",
  "googleadservices.com",
  "googlesyndication.com",
  "doubleclick.net",
  // --- Backend applicatif -------------------------------------------------
  // Supabase est coupé DÉLIBÉRÉMENT :
  //   1. déterminisme — sinon le HTML capturé dépend d'une course entre la
  //      réponse réseau et le snapshot, et varie d'un build à l'autre ;
  //   2. fraîcheur — figer des avis ou des chantiers dans un fichier statique
  //      les gèlerait jusqu'au prochain déploiement (c'est exactement la
  //      raison pour laquelle /realisations/:slug est exclu du pré-rendu) ;
  //   3. la note Google retombe alors sur FALLBACK_RATING (5,0 / 32 avis),
  //      qui se retrouve donc bien dans le HTML statique, comme voulu.
  // Le client, lui, refait les requêtes normalement au montage de React.
  ".supabase.co",
  "api.emailjs.com",
];

/**
 * Textes d'attente / d'état vide à ne PAS figer dans le HTML statique.
 * Voir l'explication au moment du retrait, dans renderRoute().
 */
const PLACEHOLDERS = [
  "Chargement des réalisations…",
  "Chargement des avis…",
  "Aucun avis disponible pour le moment.",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const log = (msg) => console.log(`  ${msg}`);

/** Sort proprement sans casser le build (sauf mode strict). */
function bail(reason, err) {
  console.warn("");
  console.warn("  ============================================================");
  console.warn("  ⚠  PRÉ-RENDU IGNORÉ — le site est déployé en SPA pure");
  console.warn(`  ⚠  Raison : ${reason}`);
  if (err) console.warn(`  ⚠  Détail : ${err.message}`);
  console.warn("  ⚠  Les pages seront servies sans HTML pré-rendu (comportement");
  console.warn("  ⚠  d'avant l'optimisation). À corriger, mais rien n'est cassé.");
  console.warn("  ============================================================");
  console.warn("");
  if (STRICT) process.exit(1);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Serveur statique local
// ---------------------------------------------------------------------------
if (!existsSync(join(DIST, "index.html"))) {
  bail("dist/index.html est introuvable — `vite build` n'a pas tourné ?");
}

/** Shell SPA d'origine, figé en mémoire AVANT toute écriture de pré-rendu. */
const SHELL = readFileSync(join(DIST, "index.html"), "utf8");

// dist/index.html est à la fois le shell de départ ET la sortie de la route "/".
// Relancer le pré-rendu sans repasser par `vite build` repartirait donc d'un
// HTML déjà rendu, et empilerait le contenu de la home dans toutes les pages
// (JSON-LD en double, DOM dupliqué). On refuse plutôt que de produire ça.
if (!/<div id="root">\s*<\/div>/.test(SHELL)) {
  bail(
    "dist/index.html contient déjà du HTML pré-rendu — relance `npx vite build` " +
      "pour repartir d'un shell propre avant `npm run prerender`",
  );
}

const server = createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    pathname = "/";
  }

  const ext = extname(pathname);
  if (ext) {
    const filePath = join(DIST, pathname);
    // Garde-fou traversée de répertoire
    if ((filePath + sep).startsWith(DIST + sep) && existsSync(filePath)) {
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
        res.end(body);
        return;
      } catch {
        /* tombe sur le 404 */
      }
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  // Navigation → toujours le shell mémoire, jamais un fichier pré-rendu.
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(SHELL);
});

await new Promise((ok, ko) => {
  server.once("error", ko);
  server.listen(PORT, "127.0.0.1", ok);
}).catch((err) => bail(`impossible d'ouvrir le port ${PORT}`, err));

const ORIGIN = `http://127.0.0.1:${PORT}`;

// ---------------------------------------------------------------------------
// Chromium
// ---------------------------------------------------------------------------
let puppeteer;
try {
  ({ default: puppeteer } = await import("puppeteer"));
} catch (err) {
  server.close();
  bail("le paquet `puppeteer` n'est pas installé", err);
}

let browser;
try {
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      // INDISPENSABLE : sans ces trois flags, Chromium gèle requestAnimationFrame
      // sur les onglets qui ne sont pas au premier plan. Avec plusieurs pages en
      // parallèle, les animations d'entrée framer-motion ne se jouent alors
      // jamais et on fige un HTML où tout est resté à opacity:0 — page blanche
      // pour le visiteur tant que React n'a pas pris la main.
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
  });
} catch (err) {
  server.close();
  bail("Chromium n'a pas pu démarrer (dépendances système manquantes ?)", err);
}

/**
 * Rend une route et renvoie son rapport.
 * @param {string} route
 */
async function renderRoute(route) {
  const page = await browser.newPage();
  /** @type {Set<string>} */
  const chunks = new Set();

  try {
    await page.setViewport({ width: 1366, height: 900 });
    await page.setRequestInterception(true);

    page.on("request", (req) => {
      const url = req.url();
      if (BLOCKED.some((host) => url.includes(host))) {
        req.abort().catch(() => {});
        return;
      }
      req.continue().catch(() => {});
    });

    // Recense les chunks JS réellement chargés par CETTE route, pour les
    // précharger ensuite (cf. injection de modulepreload plus bas).
    page.on("response", (res) => {
      const url = res.url();
      if (url.startsWith(ORIGIN) && /\/assets\/.+\.js$/.test(url)) {
        chunks.add(url.slice(ORIGIN.length));
      }
    });

    await page.goto(`${ORIGIN}${route}`, {
      waitUntil: "networkidle0",
      timeout: NAV_TIMEOUT,
    });

    // Attend que React ait monté ET que le chunk de route lazy soit résolu
    // (le fallback <RouteFallback> affiche "Chargement…" — on ne veut surtout
    // pas figer cet état-là dans le HTML statique).
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        if (!root || root.children.length === 0) return false;
        if (root.textContent.trim() === "Chargement…") return false;
        return typeof document.title === "string" && document.title.length > 0;
      },
      { timeout: NAV_TIMEOUT, polling: 100 },
    );

    // Déroule la page : framer-motion et les IntersectionObserver n'animent
    // qu'à l'entrée dans le viewport. Sans ce passage, tous les blocs sous la
    // ligne de flottaison seraient figés en opacity:0 dans le HTML statique —
    // le contenu serait dans le DOM (donc lisible par Google) mais invisible
    // à l'œil tant que React n'a pas pris la main.
    await page.evaluate(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const step = Math.max(200, Math.round(window.innerHeight * 0.75));
      for (let i = 0; i < 60; i += 1) {
        const y = i * step;
        if (y > document.body.scrollHeight) break;
        window.scrollTo(0, y);
        await pause(90);
      }
      window.scrollTo(0, 0);
      await pause(250);
    });

    // Laisse les transitions se terminer (les compteurs animés de
    // KeyFiguresSection durent 1,6 s).
    await new Promise((r) => setTimeout(r, 1_900));

    // Filet de sécurité : attend qu'il ne reste plus aucun bloc figé à
    // opacity:0 par une animation d'entrée qui n'aurait pas abouti. Les
    // contrôles de formulaire sont ignorés : les cases à cocher de /contact
    // sont des <input> volontairement masqués derrière un <label> stylé
    // (motif d'accessibilité classique), ils restent à opacity:0 pour de bon.
    // Non bloquant — on capture quand même et le compteur remonte au rapport.
    await page
      .waitForFunction(
        () => {
          const root = document.getElementById("root");
          if (!root) return false;
          return ![...root.querySelectorAll('[style*="opacity"]')].some(
            (el) =>
              Number.parseFloat(el.style.opacity) === 0 &&
              !["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName),
          );
        },
        { timeout: 12_000, polling: 200 },
      )
      .catch(() => {});

    const report = await page.evaluate((placeholders) => {
      // Le bandeau cookies est retiré du HTML statique : il n'a aucune valeur
      // SEO, et le figer ferait clignoter la bannière chez les visiteurs qui
      // ont déjà donné leur consentement (le localStorage n'est relu qu'une
      // fois React monté).
      document
        .querySelectorAll('[aria-labelledby="cookie-banner-title"]')
        .forEach((el) => el.remove());

      // Les listes alimentées par Supabase (avis, chantiers) sont vides
      // pendant le pré-rendu, puisque le réseau applicatif est coupé. Leur
      // état d'attente ou leur état vide n'a rien à faire dans un fichier
      // statique : figer « Chargement… » ou « Aucun avis disponible » ferait
      // lire ça à Google alors que la page se remplit dès que React monte.
      // On retire le placeholder ; le reste de la page (titre, intro, JSON-LD,
      // maillage) garde tout son intérêt.
      const stripped = [];
      for (const text of placeholders) {
        const match = [...document.querySelectorAll("#root *")].find(
          (el) => el.textContent.trim() === text,
        );
        if (!match) continue;
        // Remonte tant que l'ancêtre ne contient rien d'autre que ce texte,
        // pour emporter aussi l'habillage (le spinner autour du libellé).
        let node = match;
        while (
          node.parentElement &&
          node.parentElement.id !== "root" &&
          node.parentElement.textContent.trim() === text
        ) {
          node = node.parentElement;
        }
        node.remove();
        stripped.push(text);
      }

      const meta = (sel, attr = "content") =>
        document.querySelector(sel)?.getAttribute(attr) ?? null;

      return {
        stripped,
        html: document.documentElement.outerHTML,
        title: document.title,
        description: meta('meta[name="description"]'),
        canonical: meta('link[rel="canonical"]', "href"),
        robots: meta('meta[name="robots"]'),
        jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
        h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? null,
        textLength: (document.getElementById("root")?.innerText ?? "").length,
        hidden: [
          ...(document.getElementById("root")?.querySelectorAll('[style*="opacity"]') ?? []),
        ].filter(
          (el) =>
            Number.parseFloat(el.style.opacity) === 0 &&
            !["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName),
        ).length,
      };
    }, PLACEHOLDERS);

    // Précharge les chunks propres à la route. Sans ça, le visiteur voit le
    // HTML pré-rendu, puis React monte, puis le chunk lazy de la route se
    // télécharge — et le fallback "Chargement…" peut apparaître une fraction
    // de seconde. Avec le modulepreload, l'import() résout depuis le cache.
    const preloads = [...chunks]
      .filter((href) => !report.html.includes(`"${href}"`))
      .map((href) => `<link rel="modulepreload" crossorigin href="${href}">`)
      .join("\n    ");

    let html = report.html;
    if (preloads) {
      html = html.replace("</head>", `  ${preloads}\n  </head>`);
    }
    html = `<!DOCTYPE html>\n${html}`;

    const outDir = route === "/" ? DIST : join(DIST, route);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "index.html"), html, "utf8");

    return { route, ok: true, bytes: Buffer.byteLength(html), preloads: chunks.size, ...report, html: undefined };
  } finally {
    await page.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Boucle principale (petit pool de concurrence)
// ---------------------------------------------------------------------------
console.log(`\nPré-rendu de ${PRERENDER_PATHS.length} routes (concurrence ${CONCURRENCY})…\n`);

const queue = [...PRERENDER_PATHS];
const results = [];

async function worker() {
  for (;;) {
    const route = queue.shift();
    if (!route) return;
    try {
      const r = await renderRoute(route);
      results.push(r);
      log(
        `✓ ${route.padEnd(46)} ${String(r.textLength).padStart(6)} car. · ${r.jsonLd} JSON-LD` +
          (r.hidden ? ` · ⚠ ${r.hidden} bloc(s) à opacity:0` : "") +
          (r.stripped?.length ? ` · placeholder retiré` : ""),
      );
    } catch (err) {
      results.push({ route, ok: false, error: err.message });
      log(`✗ ${route.padEnd(46)} ÉCHEC — ${err.message}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, worker));

await browser.close().catch(() => {});
server.close();

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------
results.sort((a, b) => PRERENDER_PATHS.indexOf(a.route) - PRERENDER_PATHS.indexOf(b.route));

const okCount = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
const noTitle = results.filter((r) => r.ok && !r.title);
const noDesc = results.filter((r) => r.ok && !r.description);
const noCanonical = results.filter((r) => r.ok && !r.canonical);

console.log("");
console.log(`  ${okCount}/${PRERENDER_PATHS.length} routes pré-rendues`);
if (noTitle.length) console.warn(`  ⚠ sans <title> : ${noTitle.map((r) => r.route).join(", ")}`);
if (noDesc.length) console.warn(`  ⚠ sans meta description : ${noDesc.map((r) => r.route).join(", ")}`);
if (noCanonical.length) console.warn(`  ⚠ sans canonical : ${noCanonical.map((r) => r.route).join(", ")}`);

if (failed.length) {
  console.warn("");
  console.warn(`  ⚠ ${failed.length} route(s) non pré-rendue(s) — elles restent servies`);
  console.warn("  ⚠ par le fallback SPA (comportement d'avant, rien n'est cassé) :");
  failed.forEach((r) => console.warn(`  ⚠   ${r.route} — ${r.error}`));
  if (STRICT) process.exit(1);
}

console.log("");
