import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "cuivre.electrique@gmail.com";
const LAST_ACTIVITY_KEY = "ce_admin_last_activity_at";
const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000;

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSession = async (sessionUser: User | null) => {
      if (!sessionUser) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setUser(null);
        setLoading(false);
        return;
      }

      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      if (Date.now() - lastActivity > INACTIVITY_LIMIT_MS) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setUser(sessionUser);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleSession(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void handleSession(session?.user ?? null);
    });

    const refreshActivity = () => {
      if (user) localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };
    window.addEventListener("pointerdown", refreshActivity, { passive: true });
    window.addEventListener("keydown", refreshActivity);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pointerdown", refreshActivity);
      window.removeEventListener("keydown", refreshActivity);
    };
  }, [user]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return { user, loading, isAdmin, adminEmail: ADMIN_EMAIL };
};
