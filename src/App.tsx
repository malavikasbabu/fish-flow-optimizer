
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import TopNavigation from "@/components/TopNavigation";
import AIAssistant from "@/components/AIAssistant";
import "@/i18n/config";

// Pages
import Auth from "./pages/Auth";
import NewDashboard from "./pages/NewDashboard";
import EnhancedOptimization from "./components/EnhancedOptimization";
import ForecastingPage from "./pages/ForecastingPage";
import DataManagement from "./components/DataManagement";
import EnhancedVisualization from "./pages/EnhancedVisualization";
import Simulation from "./pages/Simulation";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <TopNavigation />
              <main className="pb-6">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<NewDashboard />} />
                  <Route path="/input" element={<DataManagement />} />
                  <Route path="/optimization" element={<EnhancedOptimization />} />
                  <Route path="/forecasting" element={<ForecastingPage />} />
                  <Route path="/visualization" element={<EnhancedVisualization />} />
                  <Route path="/simulation" element={<Simulation />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <AIAssistant isOpen={isAIOpen} onOpenChange={setIsAIOpen} />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
