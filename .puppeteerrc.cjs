const { join } = require("node:path");

/**
 * Configuration Puppeteer — utilisée par le pré-rendu (scripts/prerender.mjs).
 *
 * Pourquoi un cache DANS le projet plutôt que ~/.cache/puppeteer :
 * sur Cloudflare Pages (comme sur Vercel/Netlify), le home directory n'est pas
 * conservé entre l'étape `npm install` et l'étape `npm run build`. Chromium
 * téléchargé au postinstall serait alors introuvable au moment du build.
 * Le placer dans le répertoire du projet règle le problème.
 *
 * Ce dossier est gitignoré (.cache/) et n'est jamais publié : Cloudflare
 * n'uploade que dist/.
 *
 * Doc : https://pptr.dev/guides/configuration
 */
module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
