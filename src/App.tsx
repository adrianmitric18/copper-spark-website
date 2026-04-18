import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import APropos from "./pages/APropos";
import FAQ from "./pages/FAQ";
import Services from "./pages/Services";
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
import ScrollToTop from "./components/ScrollToTop";
import MobileStickyBar from "./components/MobileStickyBar";
import AnalyticsPageTracker from "./components/AnalyticsPageTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsPageTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/services" element={<Services />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileStickyBar />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
