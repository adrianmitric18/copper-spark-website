// Compteur anonyme des clics (table `compteur_clics`, migration
// 20261122090000_compteur_clics.sql).
//
// Il ne dépend pas de l'accord cookies parce qu'il n'en a pas besoin : rien
// n'est déposé sur l'appareil, et le serveur n'enregistre qu'un nombre par
// jour, par page et par action. Aucune donnée sur la personne ne part d'ici :
// ne JAMAIS ajouter d'argument (adresse, identifiant, navigateur, référent…).

import type { SupabaseClient } from "@supabase/supabase-js";
import { estRobot } from "@/lib/analytics/gtag";

export type PageComptee = "bornes";
export type ActionComptee = "whatsapp" | "telephone";

/** Action comptée pour un lien, ou `null` si le lien ne se compte pas. */
export function actionDuLien(href: string | null | undefined): ActionComptee | null {
  if (!href) return null;
  if (href.startsWith("tel:")) return "telephone";
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return "whatsapp";
  return null;
}

/**
 * Ajoute 1 au compteur du jour. Ne bloque jamais le clic et n'affiche jamais
 * d'erreur : un compteur en panne ne doit rien coûter au visiteur.
 */
export function compterClic(page: PageComptee, action: ActionComptee): void {
  if (typeof window === "undefined" || estRobot()) return;
  // Import différé : la page bornes n'embarque pas le SDK Supabase tant que
  // personne n'a cliqué.
  void import("@/integrations/supabase/client")
    .then(({ supabase }) =>
      (supabase as unknown as SupabaseClient).rpc("compter_clic", { p_page: page, p_action: action }),
    )
    .catch(() => {
      /* compteur indisponible : sans conséquence */
    });
}
