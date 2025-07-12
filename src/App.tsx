
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import "@/i18n/config";

// Pages
import Auth from "./pages/Auth";
import NewDashboard from "./pages/NewDashboard";
import NewOptimization from "./pages/NewOptimization";
import ForecastingPage from "./pages/ForecastingPage";
import InputPanel from "./pages/InputPanel";
import Visualization from "./pages/Visualization";
import Simulation from "./pages/Simulation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<NewDashboard />} />
            <Route path="/input" element={<InputPanel />} />
            <Route path="/optimization" element={<NewOptimization />} />
            <Route path="/forecasting" element={<ForecastingPage />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
