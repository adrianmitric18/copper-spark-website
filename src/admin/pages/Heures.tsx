/**
 * /admin/heures — Pointage des heures, km et forfaits (admin seul).
 *
 * Formulaire de saisie en haut (mobile first), puis trois onglets :
 * Semaine · Chantiers · Mois. Export CSV compatible avec le pointage local de
 * vertuoza-tools. Les données vivent dans les tables `heures` et `chantiers`
 * (RLS admin). Logique pure dans @/lib/admin/heures, requêtes dans
 * @/lib/admin/heures-api.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import HeuresForm from "@/admin/components/heures/HeuresForm";
import SemaineTab from "@/admin/components/heures/SemaineTab";
import ChantiersTab from "@/admin/components/heures/ChantiersTab";
import MoisTab from "@/admin/components/heures/MoisTab";
import ExportDialog from "@/admin/components/heures/ExportDialog";
import {
  formulaireVide,
  kmParDefaut,
  messageDoublon,
  nomsChantiers,
  resumeParChantier,
  todayIso,
  trouverDoublon,
  validerSaisie,
  versFormulaire,
  type Chantier,
  type ChantierResume,
  type Heure,
  type HeureFormValues,
  type HeureInput,
} from "@/lib/admin/heures";
import {
  assurerChantier,
  enregistrerHeuresPrevues,
  fetchChantiers,
  fetchHeures,
  insererHeure,
  modifierHeure,
  supprimerHeure,
} from "@/lib/admin/heures-api";

const QK_HEURES = ["admin-heures"] as const;
const QK_CHANTIERS = ["admin-heures-chantiers"] as const;
// Références stables pour les useMemo quand les données ne sont pas encore là.
const AUCUNE_LIGNE: Heure[] = [];
const AUCUN_CHANTIER: Chantier[] = [];

const messageErreur = (e: unknown): string =>
  e instanceof Error ? e.message : "Une erreur est survenue.";

const Heures = () => {
  const { user, ready } = useAdminGuard();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Heures – Le Cuivre Admin";
  }, []);

  const heuresQuery = useQuery({
    queryKey: QK_HEURES,
    queryFn: fetchHeures,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const chantiersQuery = useQuery({
    queryKey: QK_CHANTIERS,
    queryFn: fetchChantiers,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (heuresQuery.error) toast.error("Chargement des heures : " + messageErreur(heuresQuery.error));
  }, [heuresQuery.error]);
  useEffect(() => {
    if (chantiersQuery.error) toast.error("Chargement des chantiers : " + messageErreur(chantiersQuery.error));
  }, [chantiersQuery.error]);

  const lignes = heuresQuery.data ?? AUCUNE_LIGNE;
  const chantiers = chantiersQuery.data ?? AUCUN_CHANTIER;

  // --- État du formulaire -------------------------------------------------
  // `initial` + `cleFormulaire` : chaque création/modification remonte un
  // formulaire neuf (cf. HeuresForm). La date du jour est reprise à chaque
  // ouverture de la page ; après un enregistrement on garde la date saisie
  // (plusieurs lignes le même jour), les autres champs repartent à vide.
  const [enEdition, setEnEdition] = useState<Heure | null>(null);
  const [initial, setInitial] = useState<HeureFormValues>(() => formulaireVide());
  const [cleFormulaire, setCleFormulaire] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [onglet, setOnglet] = useState("semaine");
  const [dateSemaine, setDateSemaine] = useState(todayIso());
  const [dateMois, setDateMois] = useState(todayIso());
  const [enregistrementCle, setEnregistrementCle] = useState<string | null>(null);

  const suggestions = useMemo(() => nomsChantiers(lignes, chantiers), [lignes, chantiers]);
  const resumes = useMemo<ChantierResume[]>(() => resumeParChantier(lignes, chantiers), [lignes, chantiers]);

  const recharger = () => {
    queryClient.invalidateQueries({ queryKey: QK_HEURES });
    queryClient.invalidateQueries({ queryKey: QK_CHANTIERS });
  };

  const reinitialiser = (date: string) => {
    setEnEdition(null);
    setInitial(formulaireVide(date));
    setCleFormulaire((k) => k + 1);
    setErreur(null);
  };

  // --- Mutations ----------------------------------------------------------
  const sauver = useMutation({
    mutationFn: async ({ valeur, id }: { valeur: HeureInput; id: string | null }) => {
      const ligne = id ? await modifierHeure(id, valeur) : await insererHeure(valeur);
      // Référentiel des chantiers : création à la première saisie + km par
      // défaut. Un échec ici ne doit pas masquer la réussite du pointage.
      try {
        await assurerChantier(valeur.chantier, valeur.km, chantiers);
      } catch (e) {
        toast.warning("Heures enregistrées, mais chantier non mémorisé : " + messageErreur(e));
      }
      return ligne;
    },
    onSuccess: (ligne, { id }) => {
      toast.success(id ? "Ligne mise à jour." : "Heures enregistrées.");
      reinitialiser(ligne.date);
      setDateSemaine(ligne.date);
      recharger();
    },
    onError: (e) => setErreur(messageErreur(e)),
  });

  const supprimer = useMutation({
    mutationFn: supprimerHeure,
    onSuccess: () => {
      toast.success("Ligne supprimée.");
      reinitialiser(initial.date);
      recharger();
    },
    onError: (e) => toast.error("Suppression impossible : " + messageErreur(e)),
  });

  const prevues = useMutation({
    mutationFn: async ({ r, heures }: { r: ChantierResume; heures: number | null }) => {
      setEnregistrementCle(r.cle);
      await enregistrerHeuresPrevues(r.nom, r.chantierId, heures);
    },
    onSuccess: () => {
      toast.success("Heures prévues enregistrées.");
      queryClient.invalidateQueries({ queryKey: QK_CHANTIERS });
    },
    onError: (e) => toast.error("Enregistrement impossible : " + messageErreur(e)),
    onSettled: () => setEnregistrementCle(null),
  });

  // --- Handlers -----------------------------------------------------------
  const soumettre = (valeurs: HeureFormValues) => {
    setErreur(null);
    const res = validerSaisie(valeurs);
    if (res.ok === false) {
      setErreur(res.erreur);
      return;
    }
    const doublon = trouverDoublon(res.valeur, lignes, enEdition?.id ?? null);
    if (doublon) {
      setErreur(messageDoublon(doublon));
      return;
    }
    sauver.mutate({ valeur: res.valeur, id: enEdition?.id ?? null });
  };

  const editer = (ligne: Heure) => {
    setEnEdition(ligne);
    setInitial(versFormulaire(ligne));
    setCleFormulaire((k) => k + 1);
    setErreur(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!ready || !user) return <AdminLoading />;

  const chargement = heuresQuery.isLoading || chantiersQuery.isLoading;

  return (
    <AdminShell mobileTitle="Heures">
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Clock className="w-7 h-7 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold">Heures</h1>
              <p className="text-xs text-muted-foreground">Pointage des heures, km et forfaits</p>
            </div>
          </div>
          <ExportDialog lignes={lignes} chantiers={suggestions} />
        </div>

        <div ref={formRef} className="scroll-mt-16">
          <Card className="p-4 md:p-6">
            <HeuresForm
              key={cleFormulaire}
              initial={initial}
              enEdition={enEdition}
              suggestions={suggestions}
              kmPourChantier={(nom) => kmParDefaut(nom, lignes, chantiers)}
              enCours={sauver.isPending || supprimer.isPending}
              erreur={erreur}
              onSubmit={soumettre}
              onAnnuler={() => reinitialiser(initial.date)}
              onSupprimer={() => enEdition && supprimer.mutate(enEdition.id)}
            />
          </Card>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={onglet} onValueChange={setOnglet}>
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="semaine" className="h-10 text-sm">Semaine</TabsTrigger>
              <TabsTrigger value="chantiers" className="h-10 text-sm">Chantiers</TabsTrigger>
              <TabsTrigger value="mois" className="h-10 text-sm">Mois</TabsTrigger>
            </TabsList>
            <TabsContent value="semaine" className="mt-4">
              <SemaineTab
                lignes={lignes}
                dateRef={dateSemaine}
                onChangerDate={setDateSemaine}
                onEditer={editer}
                enEditionId={enEdition?.id ?? null}
              />
            </TabsContent>
            <TabsContent value="chantiers" className="mt-4">
              <ChantiersTab
                resumes={resumes}
                onHeuresPrevues={(r, heures) => prevues.mutate({ r, heures })}
                enregistrementCle={enregistrementCle}
              />
            </TabsContent>
            <TabsContent value="mois" className="mt-4">
              <MoisTab lignes={lignes} dateRef={dateMois} onChangerDate={setDateMois} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminShell>
  );
};

export default Heures;
