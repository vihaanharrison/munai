import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateConference from "./pages/CreateConference";
import CreateStandaloneCommittee from "./pages/CreateStandaloneCommittee";
import JoinByCode from "./pages/JoinByCode";
import ConferencePublic from "./pages/ConferencePublic";
import SecGenDashboard from "./pages/SecGenDashboard";
import SecretariatDashboard from "./pages/SecretariatDashboard";
import ChairPortal from "./pages/ChairPortal";
import DelegateRegister from "./pages/DelegateRegister";
import HmunRop from "./pages/HmunRop";
import About from "./pages/About";
import StandaloneChairPortal from "./pages/StandaloneChairPortal";
import StandaloneDelegatePortal from "./pages/StandaloneDelegatePortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/create-conference" element={<CreateConference />} />
          <Route path="/create-standalone" element={<CreateStandaloneCommittee />} />
          <Route path="/join/:code" element={<JoinByCode />} />
          <Route path="/conference/:id" element={<ConferencePublic />} />
          <Route path="/secgen/:id" element={<SecGenDashboard />} />
          <Route path="/secretariat/:id" element={<SecretariatDashboard />} />
          <Route path="/chair/:conferenceId/:committeeId" element={<ChairPortal />} />
          <Route path="/delegate/:conferenceId" element={<DelegateRegister />} />
          <Route path="/standalone/:id" element={<StandaloneChairPortal />} />
          <Route path="/standalone-delegate/:id" element={<StandaloneDelegatePortal />} />
          <Route path="/hmun-rop" element={<HmunRop />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
