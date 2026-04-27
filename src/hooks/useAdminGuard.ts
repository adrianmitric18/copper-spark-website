// Garde d'authentification pour les pages /admin.
// Encapsule la triple logique précédemment dupliquée dans Dashboard,
// Rdv, AvisManager et LeadDetail :
//   1. Attendre la résolution de la session Supabase
//   2. Rediriger vers /admin/login si non authentifié
//   3. Refuser l'accès (toast + redirect /) si l'email n'est pas admin
//
// Utilisation typique :
//
//   const { user, ready, loading } = useAdminGuard();
//
//   useEffect(() => {
//     if (!ready) return;
//     fetchSomething();
//   }, [ready, user?.id]);
//
//   if (loading || !user) return <AdminLoading />;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const useAdminGuard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAdminAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/admin/login");
      return;
    }
    if (!isAdmin) {
      toast.error("Accès refusé");
      navigate("/");
    }
    // user est l'objet User Supabase qui change de référence à chaque
    // TOKEN_REFRESHED. On ne dépend que de son `id` (string stable) pour
    // éviter une boucle de re-render. Cf. commit d452c99.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading, isAdmin, navigate]);

  /** True quand l'auth est résolue ET que l'utilisateur est bien admin. */
  const ready = !loading && !!user && isAdmin;

  return { user, ready, loading };
};
