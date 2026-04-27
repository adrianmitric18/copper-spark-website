import { Loader2 } from "lucide-react";

/**
 * Écran de chargement plein écran utilisé par les pages /admin pendant la
 * résolution de l'auth ou du fetch initial.
 */
const AdminLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="animate-spin" />
  </div>
);

export default AdminLoading;
