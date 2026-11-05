// Audit visuel de l'admin : captures + contrastes, dans les deux thèmes.
//
//   1. npx vite --port 5199 --strictPort        (dans un autre terminal)
//   2. node scripts/admin-audit.mjs [dossier de sortie]
//
// Ouvre chaque écran de /admin dans Chromium (viewport téléphone 390 × 844), en
// mode sombre puis clair, avec une session et des données FACTICES : toutes les
// requêtes vers Supabase sont interceptées, rien ne part vers la production et
// rien n'est écrit. Pour chaque écran :
//   - une capture pleine page (<écran>-<thème>.jpg) ;
//   - le contraste de CHAQUE texte visible, calculé (WCAG 2.x) à partir des
//     couleurs réellement rendues : couleur du texte composée sur le fond
//     effectif (fonds semi-transparents empilés, dégradés = pire arrêt).
// Seuil : 4,5:1 pour tout texte, sans exception pour les grands corps.
// Vérifie aussi que les 6 badges de statut de lead restent distinguables entre
// eux (ΔE CIE76 entre couleurs de texte) dans chaque thème.
//
// Sortie : rapport.json + résumé console. Code de sortie 1 s'il reste des échecs.

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const BASE = process.env.AUDIT_BASE || "http://localhost:5199";
const OUT = path.resolve(process.argv[2] || ".audit-admin");
const SEUIL = 4.5;
const REF = "tipazyavmuteilmerfdl";
const ADMIN_EMAIL = "cuivre.electrique@gmail.com";
const SEULEMENT = process.env.AUDIT_ONLY ? process.env.AUDIT_ONLY.split(",") : null;

fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Données factices
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const jour = (n) => iso(new Date(Date.now() + n * 86400000));
const instant = (n) => new Date(Date.now() + n * 86400000).toISOString();

const lead = (id, name, status, p = {}) => ({
  id,
  name,
  status,
  phone: "0485 12 34 56",
  email: `${id}@exemple.be`,
  address: null,
  rue: "Rue de l'Exemple",
  numero: "12",
  code_postal: "1780",
  commune: "Wemmel",
  client_type: "Particulier",
  services: ["Borne de recharge voiture électrique", "Mise en conformité RGIE"],
  message: "Bonjour, je souhaite un devis pour une borne de recharge à domicile.",
  timing: "Dans le mois",
  source: "formulaire_site",
  notes: null,
  notes_internes: `${pad(new Date().getDate())}/${pad(new Date().getMonth() + 1)}/${new Date().getFullYear()} 09:12 — WhatsApp : Bien reçu`,
  payload: null,
  photo_urls: null,
  gdpr_consent: true,
  devis_envoye_at: null,
  created_at: instant(-2),
  ...p,
});

const LEADS = [
  lead("l-nouveau", "Marie Dupont", "nouveau", { created_at: instant(-1) }),
  lead("l-nouveau2", "Karim Benali", "nouveau", { created_at: instant(-4), commune: "Jette", email: null }),
  lead("l-traite", "Jean Peeters", "traité", { created_at: instant(-10), commune: "Grimbergen" }),
  lead("l-devis", "Sophie Lambert", "devis envoyé", { created_at: instant(-15), devis_envoye_at: jour(-8) }),
  lead("l-converti", "Luc Janssens", "converti", { created_at: instant(-40) }),
  lead("l-perdu", "Anne Claes", "perdu", { created_at: instant(-35) }),
  lead("l-sanssuite", "Paul Maes", "sans suite", { created_at: instant(-80) }),
  lead("l-rdvconf", "Nadia El Amrani", "RDV confirmé", { created_at: instant(-6), commune: "Laeken" }),
  lead("l-rdvpris", "Thomas Willems", "rdv_pris", { created_at: instant(-3), email: null, source: "rdv_rapide", services: [], message: null, client_type: null }),
  lead("l-rdvpasse", "Emma Jacobs", "RDV confirmé", { created_at: instant(-12), commune: "Asse" }),
  lead("l-vieux", "Hugo Mertens", "traité", { created_at: instant(-95), notes_internes: null, commune: "Meise" }),
];
const leadPar = Object.fromEntries(LEADS.map((l) => [l.id, l]));

const rdv = (id, lead_id, date_rdv, heure_rdv, statut, type_visite = "Devis") => ({
  id,
  lead_id,
  date_rdv,
  heure_rdv,
  statut,
  type_visite,
  duree_minutes: 60,
  delai_appel_minutes: 30,
  notes_internes: "Digicode 1234, 2e étage.",
  rappel_envoye_at: statut === "rappel_envoye" ? instant(0) : null,
  created_at: instant(-3),
  updated_at: instant(-1),
  leads: leadPar[lead_id],
});
const RDVS = [
  rdv("r-jour", "l-rdvconf", jour(0), "09:30:00", "confirme", "Visite technique"),
  rdv("r-jour2", "l-traite", jour(0), "14:00:00", "rappel_envoye", "Dépannage"),
  rdv("r-demain", "l-rdvpris", jour(1), "08:00:00", "confirme", "Inspection RGIE"),
  rdv("r-demain2", "l-nouveau", jour(1), "16:30:00", "confirme", "Devis"),
  rdv("r-passe", "l-rdvpasse", jour(-1), "10:00:00", "confirme", "Devis"),
  rdv("r-annule", "l-perdu", jour(-5), "11:00:00", "annule", "Devis"),
  rdv("r-termine", "l-converti", jour(-20), "09:00:00", "termine", "Installation borne de recharge"),
  rdv("r-futur", "l-devis", jour(5), "13:30:00", "confirme", "Visite technique"),
];

const chantier = (id, lead_id, debut, fin, statut, type = "Installation borne de recharge") => ({
  id,
  lead_id,
  date_debut: jour(debut),
  date_fin: jour(fin),
  heure_debut: "08:00:00",
  heure_fin: "16:30:00",
  statut,
  type_intervention: type,
  notes_client: null,
  notes_internes: "Prévoir échelle 3 pans.",
  project_id: null,
  created_at: instant(-10),
  updated_at: instant(-2),
});
const INTERVENTIONS = [
  chantier("c-avenir", "l-converti", 6, 7, "programme"),
  chantier("c-encours", "l-rdvconf", -1, 1, "en_cours", "Inspection RGIE"),
  chantier("c-retard", "l-traite", -6, -4, "programme", "Dépannage"),
  chantier("c-termine", "l-devis", -30, -29, "termine"),
  chantier("c-reporte", "l-nouveau", 12, 12, "reporte", "Devis"),
  chantier("c-annule", "l-perdu", -15, -15, "annule", "Visite technique"),
];

const CHECKLIST = ["Tableau accessible", "Photos du compteur", "Distance tableau → borne", "Type de raccordement"].map(
  (label, i) => ({
    id: `ck-${i}`,
    lead_id: "l-rdvconf",
    checklist_type: "borne",
    item_key: `k${i}`,
    item_label: label,
    item_order: i,
    is_checked: i < 2,
    created_at: instant(-2),
    updated_at: instant(-1),
  }),
);

const heure = (id, d, type, chantierNom, debut, fin, nettes, km, forfait = null, note = null) => ({
  id,
  date: jour(d),
  type,
  chantier: chantierNom,
  debut,
  fin,
  pause_min: 30,
  heures_nettes: nettes,
  km,
  forfait_eur: forfait,
  note,
  created_at: instant(d),
  updated_at: instant(d),
});
const HEURES = [
  heure("h1", 0, "chantier", "Wemmel", "07:30:00", "16:30:00", 8.5, 40, null, "Tirage câbles cuisine"),
  heure("h2", -1, "forfait", "Catinus", "08:00:00", "16:00:00", 7.5, 25, 450),
  heure("h3", -1, "deplacement", "Cebeo", null, null, 0, 18.5, null, "Retrait matériel"),
  heure("h4", -2, "chantier", "Wemmel", "07:30:00", "17:00:00", 9, 40),
];
const CHANTIERS_HEURES = [
  { id: "ch1", nom: "Wemmel", heures_prevues: 15, km_defaut: 40, actif: true, created_at: instant(-10) },
  { id: "ch2", nom: "Catinus", heures_prevues: 40, km_defaut: 25, actif: true, created_at: instant(-10) },
];

const TESTIMONIALS = [
  { id: "t1", name: "Marc V.", city: "Wemmel", rating: 5, service: "Borne de recharge", approved: true, created_at: instant(-20), message: "Travail soigné, ponctuel, explications claires. Je recommande sans hésiter." },
  { id: "t2", name: "Isabelle D.", city: "Jette", rating: 4, service: "Mise en conformité", approved: false, created_at: instant(-3), message: "Très bon contact, intervention rapide après la visite." },
];

const projet = (id, title, status, n) => ({
  id,
  title,
  slug: id,
  status,
  summary: "Remplacement complet du tableau et mise en conformité avant vente.",
  story: "Chantier réalisé en deux jours.",
  location: "Wemmel",
  zone: "Brabant flamand",
  completed_at: jour(-30 * n),
  created_at: instant(-30 * n),
  updated_at: instant(-5),
  deleted_at: null,
  display_order: n,
  duration_days: 2,
  budget_range: "2 000 – 4 000 €",
  featured: n === 1,
  faq: null,
  meta_title: null,
  meta_description: null,
  project_images: [],
  project_tags: [{ project_id: id, tag: "RGIE" }],
});
const PROJECTS = [projet("p-tableau", "Nouveau tableau à Wemmel", "published", 1), projet("p-borne", "Borne Alfen à Jette", "draft", 2)];

const TABLES = {
  leads: LEADS,
  rendez_vous: RDVS,
  interventions: INTERVENTIONS,
  checklist_items: CHECKLIST,
  heures: HEURES,
  chantiers: CHANTIERS_HEURES,
  testimonials: TESTIMONIALS,
  projects: PROJECTS,
  project_images: [],
  project_tags: PROJECTS.flatMap((p) => p.project_tags),
  google_rating: [],
};

// ---------------------------------------------------------------------------
// Faux PostgREST
// ---------------------------------------------------------------------------
const RESERVES = new Set(["select", "order", "limit", "offset", "on_conflict", "columns", "or", "and"]);

function teste(valeur, expr) {
  let neg = false;
  let e = expr;
  if (e.startsWith("not.")) {
    neg = true;
    e = e.slice(4);
  }
  const i = e.indexOf(".");
  const op = i < 0 ? e : e.slice(0, i);
  const arg = i < 0 ? "" : e.slice(i + 1);
  const v = valeur === null || valeur === undefined ? null : String(valeur);
  let ok;
  switch (op) {
    case "eq": ok = v === arg; break;
    case "neq": ok = v !== arg; break;
    case "gt": ok = v !== null && v > arg; break;
    case "gte": ok = v !== null && v >= arg; break;
    case "lt": ok = v !== null && v < arg; break;
    case "lte": ok = v !== null && v <= arg; break;
    case "is": ok = arg === "null" ? v === null : v === arg; break;
    case "in": ok = arg.replace(/^\(|\)$/g, "").split(",").map((x) => x.replace(/^"|"$/g, "")).includes(v ?? ""); break;
    case "like":
    case "ilike": {
      const re = new RegExp("^" + arg.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/[%*]/g, ".*") + "$", op === "ilike" ? "i" : "");
      ok = v !== null && re.test(v);
      break;
    }
    default: ok = true;
  }
  return neg ? !ok : ok;
}

function repondreRest(url, methode, entetes) {
  const table = url.pathname.replace(/^\/rest\/v1\//, "").split("/")[0];
  let lignes = [...(TABLES[table] ?? [])];
  for (const [cle, val] of url.searchParams) {
    if (RESERVES.has(cle)) continue;
    lignes = lignes.filter((l) => teste(l[cle], val));
  }
  const ordre = url.searchParams.get("order");
  if (ordre) {
    const criteres = ordre.split(",").map((c) => c.split("."));
    lignes.sort((a, b) => {
      for (const [col, sens] of criteres) {
        const x = a[col] ?? "";
        const y = b[col] ?? "";
        if (x === y) continue;
        return (x < y ? -1 : 1) * (sens === "desc" ? -1 : 1);
      }
      return 0;
    });
  }
  const limite = Number(url.searchParams.get("limit"));
  if (limite) lignes = lignes.slice(0, limite);
  const objet = (entetes.accept || "").includes("vnd.pgrst.object");
  const base = {
    "access-control-allow-origin": "*",
    "access-control-expose-headers": "content-range",
    "content-type": "application/json",
    "content-range": `0-${Math.max(lignes.length - 1, 0)}/${lignes.length}`,
  };
  if (methode !== "GET" && methode !== "HEAD") {
    // Aucune écriture : on fait semblant que tout va bien.
    return { status: 200, headers: base, body: JSON.stringify(objet ? lignes[0] ?? {} : []) };
  }
  if (objet) {
    if (lignes.length === 0) {
      return { status: 406, headers: base, body: JSON.stringify({ code: "PGRST116", message: "0 rows", details: "The result contains 0 rows", hint: null }) };
    }
    return { status: 200, headers: base, body: JSON.stringify(lignes[0]) };
  }
  return { status: 200, headers: base, body: methode === "HEAD" ? "" : JSON.stringify(lignes) };
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const UTILISATEUR = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: ADMIN_EMAIL,
  email_confirmed_at: instant(-100),
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: instant(-100),
};
const SESSION = {
  access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: UTILISATEUR.id, email: ADMIN_EMAIL, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 86400 * 30 })}.signature-factice`,
  refresh_token: "jeton-factice",
  token_type: "bearer",
  expires_in: 86400 * 30,
  expires_at: Math.floor(Date.now() / 1000) + 86400 * 30,
  user: UTILISATEUR,
};

async function intercepter(page) {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    let url;
    try {
      url = new URL(req.url());
    } catch {
      return req.continue();
    }
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
    };
    if (url.hostname.endsWith("supabase.co")) {
      if (req.method() === "OPTIONS") return req.respond({ status: 204, headers: cors, body: "" });
      if (url.pathname.startsWith("/rest/v1/rpc/")) {
        return req.respond({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: "[]" });
      }
      if (url.pathname.startsWith("/rest/v1/")) return req.respond(repondreRest(url, req.method(), req.headers()));
      if (url.pathname.startsWith("/auth/v1/user")) {
        return req.respond({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(UTILISATEUR) });
      }
      if (url.pathname.startsWith("/auth/v1/token")) {
        return req.respond({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(SESSION) });
      }
      return req.respond({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: "[]" });
    }
    // Rien d'externe ne part pendant l'audit (emails, statistiques, cartes).
    if (/emailjs|googletagmanager|google-analytics|analytics|doubleclick|maps\.googleapis/.test(url.hostname)) {
      return req.abort();
    }
    return req.continue();
  });
}

// ---------------------------------------------------------------------------
// Audit de contraste (exécuté dans la page)
// ---------------------------------------------------------------------------
function auditerDansLaPage(seuil) {
  const parse = (c) => {
    if (!c) return null;
    let m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(c);
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    m = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/.exec(c);
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a };
    }
    return null;
  };
  const melange = (dessus, dessous) => ({
    r: dessus.r * dessus.a + dessous.r * (1 - dessus.a),
    g: dessus.g * dessus.a + dessous.g * (1 - dessus.a),
    b: dessus.b * dessus.a + dessous.b * (1 - dessus.a),
    a: 1,
  });
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const hex = ({ r, g, b }) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  // Fonds possibles derrière un élément : on empile les calques de la racine
  // jusqu'à lui. Un dégradé donne plusieurs candidats (on garde le pire).
  const fonds = (el) => {
    const chaine = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) chaine.unshift(n);
    let candidats = [{ r: 255, g: 255, b: 255, a: 1 }];
    for (const n of chaine) {
      const cs = getComputedStyle(n);
      const image = cs.backgroundImage;
      if (image && image.includes("gradient")) {
        const arrets = (image.match(/rgba?\([^)]+\)|color\(srgb[^)]+\)/g) || []).map(parse).filter(Boolean);
        if (arrets.length) candidats = candidats.flatMap((c) => arrets.map((a) => melange(a, c))).slice(0, 12);
      }
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0) candidats = candidats.map((c) => melange(bg, c));
    }
    return candidats;
  };
  const opaciteCumulee = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || "1");
    return o;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false; // sr-only
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === "none" || c.visibility === "hidden") return false;
      if (n.getAttribute("aria-hidden") === "true" && n.tagName !== "svg") return false;
    }
    return true;
  };
  const decrire = (el) => {
    const cls = (typeof el.className === "string" ? el.className : "").split(/\s+/).filter(Boolean).slice(0, 8).join(".");
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
  };

  const echecs = [];
  let total = 0;
  let ignoresDesactives = 0;
  const mesurer = (el, texte, couleurTexte, genre) => {
    const fg0 = parse(couleurTexte);
    if (!fg0) return;
    if (el.closest("[disabled], [aria-disabled='true'], [data-disabled]")) {
      ignoresDesactives += 1;
      return;
    }
    total += 1;
    const fg = { ...fg0, a: fg0.a * opaciteCumulee(el) };
    let pire = Infinity;
    let pireFond = null;
    let pireTexte = null;
    for (const fond of fonds(el)) {
      const rendu = melange(fg, fond);
      const r = ratio(rendu, fond);
      if (r < pire) {
        pire = r;
        pireFond = fond;
        pireTexte = rendu;
      }
    }
    if (pire < seuil) {
      const cs = getComputedStyle(el);
      echecs.push({
        texte: texte.trim().replace(/\s+/g, " ").slice(0, 48),
        ratio: Math.round(pire * 100) / 100,
        couleur: hex(pireTexte),
        fond: hex(pireFond),
        element: decrire(el),
        taille: cs.fontSize,
        genre,
      });
    }
  };

  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const vus = new Set();
  for (let t = marcheur.nextNode(); t; t = marcheur.nextNode()) {
    const el = t.parentElement;
    if (!el || !t.nodeValue.trim()) continue;
    if (["SCRIPT", "STYLE", "NOSCRIPT", "OPTION"].includes(el.tagName)) continue;
    if (vus.has(el) || !visible(el)) continue;
    vus.add(el);
    mesurer(el, t.nodeValue, getComputedStyle(el).color, "texte");
  }
  for (const el of document.querySelectorAll("input, textarea, select")) {
    if (!visible(el) || ["checkbox", "radio", "file", "hidden"].includes(el.type)) continue;
    if (el.value) mesurer(el, el.value, getComputedStyle(el).color, "saisie");
    else if (el.placeholder) mesurer(el, el.placeholder, getComputedStyle(el, "::placeholder").color, "placeholder");
  }
  return { total, ignoresDesactives, echecs };
}

// Les 6 statuts de lead : contraste de chaque badge + distinction entre eux.
async function auditerStatuts(page) {
  return page.evaluate(async (seuil) => {
    const mod = await import("/src/lib/admin/types.ts");
    const statuts = ["nouveau", "traité", "devis envoyé", "converti", "perdu", "sans suite"];
    const parse = (c) => {
      const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(c);
      return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
    };
    const melange = (d, s) => ({ r: d.r * d.a + s.r * (1 - d.a), g: d.g * d.a + s.g * (1 - d.a), b: d.b * d.a + s.b * (1 - d.a), a: 1 });
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const lab = (c) => {
      const [r, g, b] = [lin(c.r), lin(c.g), lin(c.b)];
      const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
      const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
    };
    const hex = ({ r, g, b }) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

    const hote = document.createElement("div");
    hote.className = "bg-card";
    hote.style.cssText = "position:fixed;left:0;top:0;padding:8px;z-index:99999";
    document.body.appendChild(hote);
    const carte = parse(getComputedStyle(hote).backgroundColor);
    const racine = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    const fondCarte = melange(carte, racine);
    const mesures = statuts.map((s) => {
      const el = document.createElement("span");
      el.className = "border px-2 " + mod.leadStatusColor(s);
      el.textContent = s;
      hote.appendChild(el);
      const cs = getComputedStyle(el);
      const fondBadge = melange(parse(cs.backgroundColor) || { r: 0, g: 0, b: 0, a: 0 }, fondCarte);
      const texte = melange(parse(cs.color), fondBadge);
      return { statut: s, texte: hex(texte), fond: hex(fondBadge), ratio: Math.round(ratio(texte, fondBadge) * 100) / 100, lab: lab(texte), labFond: lab(fondBadge), classes: mod.leadStatusColor(s) };
    });
    hote.remove();
    const paires = [];
    for (let i = 0; i < mesures.length; i++) {
      for (let j = i + 1; j < mesures.length; j++) {
        // Un badge se reconnaît à son texte OU à son fond : on garde l'écart le plus grand.
        const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        const ecart = Math.max(d(mesures[i].lab, mesures[j].lab), d(mesures[i].labFond, mesures[j].labFond));
        paires.push({ paire: `${mesures[i].statut} / ${mesures[j].statut}`, deltaE: Math.round(ecart * 10) / 10 });
      }
    }
    return {
      badges: mesures.map(({ lab: _l, labFond: _f, ...m }) => m),
      contrasteOk: mesures.every((m) => m.ratio >= seuil),
      paireLaPlusProche: paires.sort((a, b) => a.deltaE - b.deltaE)[0],
    };
  }, SEUIL);
}

// ---------------------------------------------------------------------------
// Écrans
// ---------------------------------------------------------------------------
const cliquer = async (page, texte, selecteur = "button, a, [role='tab'], [role='menuitem']") => {
  const ok = await page.evaluate(
    (t, sel) => {
      const el = [...document.querySelectorAll(sel)].find(
        (e) => e.offsetParent !== null && (e.textContent || "").replace(/\s+/g, " ").trim().includes(t),
      );
      if (!el) return false;
      el.scrollIntoView({ block: "center" });
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }));
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerType: "mouse" }));
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      el.click();
      return true;
    },
    texte,
    selecteur,
  );
  if (!ok) throw new Error(`bouton introuvable : « ${texte} »`);
  await new Promise((r) => setTimeout(r, 450));
};

const ECRANS = [
  { nom: "connexion", url: "/admin/login", sansSession: true },
  { nom: "aujourdhui", url: "/admin" },
  { nom: "menu-plus", url: "/admin", apres: (p) => cliquer(p, "Plus", "nav[aria-label='Navigation principale'] button") },
  { nom: "leads", url: "/admin/pipeline" },
  { nom: "leads-termines", url: "/admin/pipeline", apres: (p) => cliquer(p, "Terminés") },
  { nom: "leads-menu-terminer", url: "/admin/pipeline", apres: (p) => cliquer(p, "Terminer", "button[aria-label^='Terminer le lead']") },
  { nom: "leads-archiver", url: "/admin/pipeline", apres: (p) => cliquer(p, "Archiver les anciens") },
  { nom: "leads-nouveau-lead", url: "/admin/pipeline", apres: (p) => cliquer(p, "Nouveau lead") },
  { nom: "fiche-rdv-planifie", url: "/admin/lead/l-rdvconf" },
  { nom: "fiche-rdv-passe", url: "/admin/lead/l-rdvpasse" },
  { nom: "fiche-lead-termine", url: "/admin/lead/l-sanssuite" },
  { nom: "fiche-formulaire-rdv", url: "/admin/lead/l-nouveau?rdv=1" },
  { nom: "rdv-rapide", url: "/admin/rdv-rapide" },
  { nom: "calendrier", url: "/admin/rdv" },
  { nom: "calendrier-passes", url: "/admin/rdv", apres: (p) => cliquer(p, "Passés") },
  { nom: "chantiers", url: "/admin/interventions?filter=all" },
  { nom: "chantiers-en-cours", url: "/admin/interventions?filter=in_progress" },
  { nom: "realisations", url: "/admin/chantiers" },
  { nom: "realisations-editeur", url: "/admin/chantiers/nouveau" },
  { nom: "import-archives", url: "/admin/chantiers/import-archives" },
  { nom: "avis-clients", url: "/admin/avis" },
  { nom: "heures", url: "/admin/heures" },
  { nom: "heures-chantiers", url: "/admin/heures", apres: (p) => cliquer(p, "Chantiers", "[role='tab']") },
  { nom: "heures-mois", url: "/admin/heures", apres: (p) => cliquer(p, "Mois", "[role='tab']") },
  { nom: "heures-export", url: "/admin/heures", apres: (p) => cliquer(p, "Exporter CSV") },
  { nom: "bureau-menu-lateral", url: "/admin/pipeline", bureau: true },
];

const THEMES = ["dark", "light"];

async function pret(page) {
  await page.waitForSelector("main, form, [role='status']", { timeout: 15000 }).catch(() => {});
  for (let i = 0; i < 40; i++) {
    const occupe = await page.evaluate(
      () => document.querySelectorAll(".animate-spin, .animate-pulse, [aria-busy='true']").length > 0,
    );
    if (!occupe) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 350));
}

const navigateur = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--force-color-profile=srgb"] });
const rapport = { date: new Date().toISOString(), seuil: SEUIL, ecrans: [], statuts: {} };
let echecsTotal = 0;

for (const theme of THEMES) {
  for (const ecran of ECRANS) {
    if (SEULEMENT && !SEULEMENT.some((s) => ecran.nom.includes(s))) continue;
    const page = await navigateur.newPage();
    await page.setViewport(
      ecran.bureau ? { width: 1280, height: 800, deviceScaleFactor: 1 } : { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    );
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await intercepter(page);
    const erreursPage = [];
    page.on("pageerror", (e) => erreursPage.push(String(e.message || e)));
    await page.evaluateOnNewDocument(
      (cle, session, t, avecSession) => {
        localStorage.setItem("ce_admin_theme", t);
        // Bandeau cookies du site public : déjà répondu (comme sur le téléphone d'Adrian).
        localStorage.setItem(
          "cookie_consent_v1",
          JSON.stringify({
            timestamp: new Date().toISOString(),
            expires: new Date(Date.now() + 86400000 * 90).toISOString(),
            choices: { analytics: false, marketing: false },
          }),
        );
        localStorage.setItem("ce_admin_last_activity_at", String(Date.now()));
        if (avecSession) localStorage.setItem(cle, JSON.stringify(session));
        else localStorage.removeItem(cle);
      },
      `sb-${REF}-auth-token`,
      SESSION,
      theme,
      !ecran.sansSession,
    );
    const entree = { ecran: ecran.nom, theme, url: ecran.url };
    try {
      await page.goto(BASE + ecran.url, { waitUntil: "networkidle2", timeout: 45000 });
      await pret(page);
      await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
      if (ecran.apres) {
        await ecran.apres(page);
        await pret(page);
      }
      const themeApplique = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      if (themeApplique !== (theme === "dark")) throw new Error(`thème non appliqué (attendu ${theme})`);
      const mesure = await page.evaluate(auditerDansLaPage, SEUIL);
      Object.assign(entree, mesure, { erreursPage, titre: await page.title() });
      echecsTotal += mesure.echecs.length;
      const fichier = `${ecran.nom}-${theme === "dark" ? "sombre" : "clair"}.jpg`;
      // Capture de toute la page : on agrandit la fenêtre à la hauteur du contenu
      // pour que la barre du bas (fixe) reste en bas au lieu de couper la page.
      if (!ecran.bureau) {
        const hauteur = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, 844));
        await page.setViewport({ width: 390, height: Math.min(hauteur, 6000), deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await new Promise((r) => setTimeout(r, 250));
      }
      await page.screenshot({ path: path.join(OUT, fichier), type: "jpeg", quality: 72 });
      entree.capture = fichier;
      if (ecran.nom === "leads") rapport.statuts[theme] = await auditerStatuts(page);
    } catch (e) {
      entree.erreur = String(e.message || e);
      echecsTotal += 1;
    }
    rapport.ecrans.push(entree);
    const marque = entree.erreur ? "ERREUR" : entree.echecs.length ? `${entree.echecs.length} échec(s)` : "ok";
    console.log(`${theme === "dark" ? "sombre" : "clair "}  ${ecran.nom.padEnd(24)} ${String(entree.total ?? "-").padStart(4)} textes  ${marque}${entree.erreur ? " — " + entree.erreur : ""}`);
    await page.close();
  }
}
await navigateur.close();

fs.writeFileSync(path.join(OUT, "rapport.json"), JSON.stringify(rapport, null, 2));

// Résumé : échecs regroupés par (élément, couleurs) pour corriger à la source.
const groupes = new Map();
for (const e of rapport.ecrans) {
  for (const f of e.echecs ?? []) {
    const cle = `${e.theme}|${f.couleur}|${f.fond}|${f.element}`;
    const g = groupes.get(cle) ?? { ...f, theme: e.theme, ecrans: new Set(), n: 0 };
    g.ecrans.add(e.ecran);
    g.n += 1;
    groupes.set(cle, g);
  }
}
console.log(`\n${echecsTotal} échec(s) sous ${SEUIL}:1 — ${groupes.size} cause(s) distincte(s)`);
for (const g of [...groupes.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 60)) {
  console.log(`  ${g.theme === "dark" ? "sombre" : "clair "} ${String(g.ratio).padEnd(5)} ${g.couleur} sur ${g.fond}  ×${g.n}  « ${g.texte} »  [${g.genre}] ${g.element.slice(0, 90)}  (${[...g.ecrans].slice(0, 3).join(", ")})`);
}
for (const t of THEMES) {
  const s = rapport.statuts[t];
  if (!s) continue;
  console.log(`\nStatuts (${t === "dark" ? "sombre" : "clair"}) : contraste ${s.contrasteOk ? "ok" : "INSUFFISANT"} · paire la plus proche ${s.paireLaPlusProche.paire} ΔE ${s.paireLaPlusProche.deltaE}`);
  for (const b of s.badges) console.log(`  ${b.statut.padEnd(13)} ${b.ratio}:1  ${b.texte} sur ${b.fond}`);
}
console.log(`\nRapport : ${path.join(OUT, "rapport.json")}`);
process.exit(echecsTotal > 0 ? 1 : 0);
