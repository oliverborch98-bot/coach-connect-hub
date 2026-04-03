import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
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
import ExerciseLibrary from "@/pages/coach/ExerciseLibrary";
import PaymentDashboard from "@/pages/coach/PaymentDashboard";
import AIProgramBuilder from "@/pages/coach/AIProgramBuilder";
import AINutritionBuilder from "@/pages/coach/AINutritionBuilder";
import RecipeLibrary from "@/pages/coach/RecipeLibrary";
import AccessRequests from "@/pages/coach/AccessRequests";
import CoachMessages from "@/pages/coach/Messages";
import CoachHabits from "@/pages/coach/Habits";
import OnboardingWizard from "@/pages/client/OnboardingWizard";
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
import ClientBodyMeasurements from "@/pages/client/BodyMeasurements";
import ClientResources from "@/pages/client/Resources";
import ClientTransformation from "@/pages/client/Transformation";
import ClientAIChat from "@/pages/client/AIChat";
import AIAssistant from "@/pages/client/AIAssistant";
import ClientLeaderboard from "@/pages/client/Leaderboard";
import ClientGuide from "@/pages/client/Guide";
import ClientCalls from "@/pages/client/Calls";
import ChangePassword from "@/pages/client/ChangePassword";
import ResetPassword from "@/pages/ResetPassword";
import ClientExerciseLibrary from "@/pages/client/ExerciseLibrary";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const location = useLocation(); // SKAL være FØR alle conditional returns

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  if (location.pathname === '/' || location.pathname === '') {
    return <Navigate to={user.role === 'coach' ? '/coach' : '/client'} replace />;
  }

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
          <Route path="/coach/exercises" element={<ExerciseLibrary />} />
          <Route path="/coach/recipes" element={<RecipeLibrary />} />
          <Route path="/coach/payments" element={<PaymentDashboard />} />
          <Route path="/coach/access-requests" element={<AccessRequests />} />
          <Route path="/coach/ai-program" element={<AIProgramBuilder />} />
          <Route path="/coach/ai-nutrition" element={<AINutritionBuilder />} />
          <Route path="/coach/habits" element={<CoachHabits />} />
          <Route path="/coach/messages" element={<CoachMessages />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    );
  }

  return <ClientRoutes />;
}

function ClientRoutes() {
  const { user } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  
  const { data: profileFlags } = useQuery({
    queryKey: ['profile-flags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name') // We already have role and must_change_password from AuthContext
        .eq('id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: clientProfile, isLoading: cpLoading } = useQuery({
    queryKey: ['my-client-profile-onboarding', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, onboarding_completed')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (cpLoading) return;
    if (!clientProfile) {
      setOnboardingDone(false);
      return;
    }
    setOnboardingDone(!!clientProfile.onboarding_completed);
  }, [clientProfile, cpLoading]);

  if (onboardingDone === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!onboardingDone && clientProfile) {
    return (
      <OnboardingWizard
        clientId={clientProfile.id}
        onComplete={() => setOnboardingDone(true)}
      />
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
        <Route path="/client/measurements" element={<ClientBodyMeasurements />} />
        <Route path="/client/messages" element={<ClientMessages />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/resources" element={<ClientResources />} />
        <Route path="/client/exercises" element={<ClientExerciseLibrary />} />
        <Route path="/client/transformation" element={<ClientTransformation />} />
        <Route path="/client/ai" element={<ClientAIChat />} />
        <Route path="/client/ai-assistant" element={<AIAssistant />} />
        <Route path="/client/calls" element={<ClientCalls />} />
        <Route path="/client/leaderboard" element={<ClientLeaderboard />} />
        <Route path="/client/guide" element={<ClientGuide />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Landing page for unauthenticated users */}
                <Route path="/" element={<Landing />} />
                
                {/* Login and password reset pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected routes */}
                <Route path="*" element={<AppRoutes />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
