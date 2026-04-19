import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Connexion Admin – Le Cuivre Électrique"; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });

    setLoading(false);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    setSent(true);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo />
            </div>
            <CardTitle className="text-2xl">Accès administrateur</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entrez votre email pour recevoir un lien de connexion
            </p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4 py-6">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                <p className="font-medium">Lien envoyé !</p>
                <p className="text-sm text-muted-foreground">
                  Vérifiez votre boîte mail ({email}) et cliquez sur le lien magique pour vous connecter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="cuivre.electrique@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Button type="submit" variant="copper" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Recevoir le lien magique
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
