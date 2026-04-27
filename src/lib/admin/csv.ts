// Génération et téléchargement d'un export CSV des leads pour la compta
// ou la sauvegarde personnelle. Format compatible Excel/Numbers/LibreOffice.

import type { Lead } from "@/lib/admin/types";

/** Échappe une valeur pour CSV (RFC 4180). */
const escape = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Si la valeur contient virgule, point-virgule, guillemet ou retour ligne,
  // on l'entoure de guillemets et on double les guillemets internes.
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const COLUMNS: { header: string; pick: (l: Lead) => string }[] = [
  { header: "Date", pick: (l) => formatDate(l.created_at) },
  { header: "Nom", pick: (l) => l.name },
  { header: "Email", pick: (l) => l.email },
  { header: "Téléphone", pick: (l) => l.phone },
  { header: "Type client", pick: (l) => l.client_type },
  { header: "Rue", pick: (l) => l.rue ?? "" },
  { header: "Numéro", pick: (l) => l.numero ?? "" },
  { header: "Code postal", pick: (l) => l.code_postal ?? "" },
  { header: "Commune", pick: (l) => l.commune ?? "" },
  { header: "Services", pick: (l) => (l.services || []).join(" | ") },
  { header: "Timing", pick: (l) => l.timing ?? "" },
  { header: "Source", pick: (l) => l.source ?? "" },
  { header: "Statut", pick: (l) => l.status },
  { header: "Message", pick: (l) => l.message },
  { header: "Notes internes", pick: (l) => l.notes_internes ?? "" },
];

/** Construit le contenu CSV à partir d'une liste de leads. */
export const buildLeadsCsv = (leads: Lead[]): string => {
  const headerRow = COLUMNS.map((c) => escape(c.header)).join(";");
  const dataRows = leads.map((lead) => COLUMNS.map((c) => escape(c.pick(lead))).join(";"));
  // BOM UTF-8 pour qu'Excel détecte correctement les accents
  return "﻿" + [headerRow, ...dataRows].join("\r\n");
};

/** Déclenche le téléchargement d'un fichier CSV dans le navigateur. */
export const downloadLeadsCsv = (leads: Lead[]): void => {
  const csv = buildLeadsCsv(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const filename = `leads-${dateStr}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
