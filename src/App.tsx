import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Eager — la home est servie sans Suspense pour éviter tout flash sur la
// landing principale (TBT-friendly et FCP rapide).
import Index from "./pages/Index";

// Lazy — toutes les autres routes. Vite découpe automatiquement chaque
// import() en chunk séparé et React 18 résout le bundle au moment où la
// route est visitée. Le bundle initial passe sous le seuil de 500 KB.
const APropos = lazy(() => import("./pages/APropos"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Services = lazy(() => import("./pages/Services"));
const InstallationRenovation = lazy(() => import("./pages/services/InstallationRenovation"));
const DepannageUrgent = lazy(() => import("./pages/services/DepannageUrgent"));
const MiseEnConformiteRgie = lazy(() => import("./pages/services/MiseEnConformiteRgie"));
const BornesDeRecharge = lazy(() => import("./pages/services/BornesDeRecharge"));
const PanneauxPhotovoltaiques = lazy(() => import("./pages/services/PanneauxPhotovoltaiques"));
const Simulateur = lazy(() => import("./pages/Simulateur"));
const Realisations = lazy(() => import("./pages/Realisations"));
const ChantierDetail = lazy(() => import("./pages/realisations/ChantierDetail"));
const Avis = lazy(() => import("./pages/Avis"));
const Contact = lazy(() => import("./pages/Contact"));
const Merci = lazy(() => import("./pages/Merci"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const CGV = lazy(() => import("./pages/CGV"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin — bundle séparé (téléchargé uniquement à l'arrivée sur /admin)
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminAujourdhui = lazy(() => import("./admin/pages/Aujourdhui"));
const AdminPipeline = lazy(() => import("./admin/pages/Pipeline"));
const AdminLeadDetail = lazy(() => import("./pages/admin/LeadDetail"));
const AdminAvisManager = lazy(() => import("./pages/admin/AvisManager"));
const AdminRdv = lazy(() => import("./pages/admin/Rdv"));
const AdminChantiers = lazy(() => import("./admin/pages/Chantiers"));
const AdminChantierEditor = lazy(() => import("./admin/pages/ChantierEditor"));
const AdminImportArchives = lazy(() => import("./admin/pages/ImportArchives"));
const AdminRdvRapide = lazy(() => import("./admin/pages/RdvRapide"));
const AdminInterventions = lazy(() => import("./admin/pages/Interventions"));

// Pages zones SEO — peu visitées en direct depuis la home, donc lazy
const ElectricienCourtSaintEtienne = lazy(() => import("./pages/zones/ElectricienCourtSaintEtienne"));
const ElectricienWavre = lazy(() => import("./pages/zones/ElectricienWavre"));
const ElectricienOttigniesLLN = lazy(() => import("./pages/zones/ElectricienOttigniesLLN"));
const ElectricienNivelles = lazy(() => import("./pages/zones/ElectricienNivelles"));
const ElectricienGenappe = lazy(() => import("./pages/zones/ElectricienGenappe"));

import ScrollToTop from "./components/ScrollToTop";
import MobileStickyBar from "./components/MobileStickyBar";
import AnalyticsPageTracker from "./components/AnalyticsPageTracker";
import CookieConsentBanner from "./components/CookieConsentBanner";

const queryClient = new QueryClient();

/**
 * Fallback affiché pendant la résolution d'un chunk lazy.
 * Hauteur d'au moins un viewport pour éviter le saut de mise en page,
 * fond background + libellé sobre.
 */
const RouteFallback = () => (
  <div
    className="min-h-screen bg-background flex items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <p className="text-sm text-muted-foreground">Chargement…</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsentBanner />
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsPageTracker />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/installation-electrique-renovation" element={<InstallationRenovation />} />
            <Route path="/services/depannage-urgent" element={<DepannageUrgent />} />
            <Route path="/services/mise-en-conformite-rgie" element={<MiseEnConformiteRgie />} />
            <Route path="/services/bornes-de-recharge" element={<BornesDeRecharge />} />
            <Route path="/services/panneaux-photovoltaiques" element={<PanneauxPhotovoltaiques />} />
            <Route path="/simulateur" element={<Simulateur />} />
            <Route path="/realisations" element={<Realisations />} />
            {/* Redirections 301 (client-side) des anciennes pages catégories
                vers la grille filtrée par tag. Place ces routes AVANT le
                path:slug catch-all pour qu'elles matchent en priorité. */}
            <Route
              path="/realisations/tableaux-et-prises"
              element={<Navigate to="/realisations?tag=R%C3%A9novation+tableau+%C3%A9lectrique" replace />}
            />
            <Route
              path="/realisations/ambiances-lumineuses"
              element={<Navigate to="/realisations?tag=%C3%89clairage+LED" replace />}
            />
            <Route
              path="/realisations/installation-reseaux"
              element={<Navigate to="/realisations?tag=R%C3%A9seau+%2F+VDI" replace />}
            />
            <Route
              path="/realisations/decoration-de-noel"
              element={<Navigate to="/realisations?tag=D%C3%A9coration+de+No%C3%ABl" replace />}
            />
            <Route
              path="/realisations/bornes-de-recharge"
              element={<Navigate to="/realisations?tag=Bornes+de+recharge+VE" replace />}
            />
            <Route path="/realisations/:slug" element={<ChantierDetail />} />
            <Route path="/avis" element={<Avis />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/merci" element={<Merci />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminAujourdhui />} />
            <Route path="/admin/pipeline" element={<AdminPipeline />} />
            <Route path="/admin/lead/:id" element={<AdminLeadDetail />} />
            <Route path="/admin/avis" element={<AdminAvisManager />} />
            <Route path="/admin/rdv" element={<AdminRdv />} />
            <Route path="/admin/rdv-rapide" element={<AdminRdvRapide />} />
            <Route path="/admin/interventions" element={<AdminInterventions />} />
            <Route path="/admin/chantiers" element={<AdminChantiers />} />
            <Route path="/admin/chantiers/nouveau" element={<AdminChantierEditor />} />
            <Route path="/admin/chantiers/import-archives" element={<AdminImportArchives />} />
            <Route path="/admin/chantiers/:id" element={<AdminChantierEditor />} />
            {/* Pages SEO zones géographiques (non listées dans le menu) */}
            <Route path="/electricien-court-saint-etienne" element={<ElectricienCourtSaintEtienne />} />
            <Route path="/electricien-wavre" element={<ElectricienWavre />} />
            <Route path="/electricien-ottignies-louvain-la-neuve" element={<ElectricienOttigniesLLN />} />
            <Route path="/electricien-nivelles" element={<ElectricienNivelles />} />
            <Route path="/electricien-genappe" element={<ElectricienGenappe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <MobileStickyBar />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
