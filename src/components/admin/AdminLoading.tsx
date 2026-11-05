import { Loader2 } from "lucide-react";
import { useDarkMode } from "@/admin/hooks/useDarkMode";

/**
 * Écran de chargement plein écran utilisé par les pages /admin pendant la
 * résolution de l'auth ou du fetch initial.
 */
const AdminLoading = () => {
  useDarkMode();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground" role="status">
      <Loader2 className="animate-spin" aria-hidden="true" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
};

export default AdminLoading;
