import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import APropos from "./pages/APropos";
import FAQ from "./pages/FAQ";
import Services from "./pages/Services";
import InstallationRenovation from "./pages/services/InstallationRenovation";
import DepannageUrgent from "./pages/services/DepannageUrgent";
import MiseEnConformiteRgie from "./pages/services/MiseEnConformiteRgie";
import BornesDeRecharge from "./pages/services/BornesDeRecharge";
import PanneauxPhotovoltaiques from "./pages/services/PanneauxPhotovoltaiques";
import Realisations from "./pages/Realisations";
import TableauxEtPrises from "./pages/realisations/TableauxEtPrises";
import AmbiancesLumineuses from "./pages/realisations/AmbiancesLumineuses";
import InstallationReseaux from "./pages/realisations/InstallationReseaux";
import DecorationNoel from "./pages/realisations/DecorationNoel";
import Avis from "./pages/Avis";
import Contact from "./pages/Contact";
import Merci from "./pages/Merci";
import MentionsLegales from "./pages/MentionsLegales";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeadDetail from "./pages/admin/LeadDetail";
import AdminAvisManager from "./pages/admin/AvisManager";
import AdminRdv from "./pages/admin/Rdv";
import ElectricienCourtSaintEtienne from "./pages/zones/ElectricienCourtSaintEtienne";
import ElectricienWavre from "./pages/zones/ElectricienWavre";
import ElectricienOttigniesLLN from "./pages/zones/ElectricienOttigniesLLN";
import ElectricienNivelles from "./pages/zones/ElectricienNivelles";
import ElectricienGenappe from "./pages/zones/ElectricienGenappe";
import ScrollToTop from "./components/ScrollToTop";
import MobileStickyBar from "./components/MobileStickyBar";
import AnalyticsPageTracker from "./components/AnalyticsPageTracker";
import CookieConsentBanner from "./components/CookieConsentBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsentBanner />
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsPageTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/installation-electrique-renovation" element={<InstallationRenovation />} />
          <Route path="/services/depannage-urgent" element={<DepannageUrgent />} />
          <Route path="/services/mise-en-conformite-rgie" element={<MiseEnConformiteRgie />} />
          <Route path="/services/bornes-de-recharge" element={<BornesDeRecharge />} />
          <Route path="/services/panneaux-photovoltaiques" element={<PanneauxPhotovoltaiques />} />
          <Route path="/realisations" element={<Realisations />} />
          <Route path="/realisations/tableaux-et-prises" element={<TableauxEtPrises />} />
          <Route path="/realisations/ambiances-lumineuses" element={<AmbiancesLumineuses />} />
          <Route path="/realisations/installation-reseaux" element={<InstallationReseaux />} />
          <Route path="/realisations/decoration-de-noel" element={<DecorationNoel />} />
          <Route path="/avis" element={<Avis />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/merci" element={<Merci />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/lead/:id" element={<AdminLeadDetail />} />
          <Route path="/admin/avis" element={<AdminAvisManager />} />
          {/* Pages SEO zones géographiques (non listées dans le menu) */}
          <Route path="/electricien-court-saint-etienne" element={<ElectricienCourtSaintEtienne />} />
          <Route path="/electricien-wavre" element={<ElectricienWavre />} />
          <Route path="/electricien-ottignies-louvain-la-neuve" element={<ElectricienOttigniesLLN />} />
          <Route path="/electricien-nivelles" element={<ElectricienNivelles />} />
          <Route path="/electricien-genappe" element={<ElectricienGenappe />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileStickyBar />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
