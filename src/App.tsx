import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import CoachLayout from "@/layouts/CoachLayout";
import ClientLayout from "@/layouts/ClientLayout";
import CoachDashboard from "@/pages/coach/Dashboard";
import CoachClientDetail from "@/pages/coach/ClientDetail";
import CoachCalls from "@/pages/coach/Calls";
import CoachNewClient from "@/pages/coach/NewClient";
import CoachSettings from "@/pages/coach/Settings";
import CoachAnalytics from "@/pages/coach/Analytics";
import ProgramBuilder from "@/pages/coach/ProgramBuilder";
import NutritionBuilder from "@/pages/coach/NutritionBuilder";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientCheckIn from "@/pages/client/CheckIn";
import ClientHabits from "@/pages/client/Habits";
import ClientMessages from "@/pages/client/ClientMessages";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientTraining from "@/pages/client/Training";
import ClientNutritionPlan from "@/pages/client/NutritionPlan";
import ClientPhasePlan from "@/pages/client/PhasePlan";
import ClientGoalsScore from "@/pages/client/GoalsScore";
import ClientProgressPhotos from "@/pages/client/ProgressPhotos";
import ClientResources from "@/pages/client/Resources";
import ClientTransformation from "@/pages/client/Transformation";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (user.role === 'coach') {
    return (
      <Routes>
        <Route element={<CoachLayout />}>
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/client/:id" element={<CoachClientDetail />} />
          <Route path="/coach/calls" element={<CoachCalls />} />
          <Route path="/coach/new-client" element={<CoachNewClient />} />
          <Route path="/coach/settings" element={<CoachSettings />} />
          <Route path="/coach/analytics" element={<CoachAnalytics />} />
          <Route path="/coach/program-builder" element={<ProgramBuilder />} />
          <Route path="/coach/nutrition-builder" element={<NutritionBuilder />} />
        </Route>
        <Route path="/" element={<Navigate to="/coach" replace />} />
        <Route path="*" element={<Navigate to="/coach" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/client/training" element={<ClientTraining />} />
        <Route path="/client/nutrition" element={<ClientNutritionPlan />} />
        <Route path="/client/phases" element={<ClientPhasePlan />} />
        <Route path="/client/goals" element={<ClientGoalsScore />} />
        <Route path="/client/checkin" element={<ClientCheckIn />} />
        <Route path="/client/habits" element={<ClientHabits />} />
        <Route path="/client/photos" element={<ClientProgressPhotos />} />
        <Route path="/client/messages" element={<ClientMessages />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/resources" element={<ClientResources />} />
        <Route path="/client/transformation" element={<ClientTransformation />} />
      </Route>
      <Route path="/" element={<Navigate to="/client" replace />} />
      <Route path="*" element={<Navigate to="/client" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
