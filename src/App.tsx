import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import ExerciseLibrary from "@/pages/coach/ExerciseLibrary";
import PaymentDashboard from "@/pages/coach/PaymentDashboard";
import AIProgramBuilder from "@/pages/coach/AIProgramBuilder";
import AINutritionBuilder from "@/pages/coach/AINutritionBuilder";
import RecipeLibrary from "@/pages/coach/RecipeLibrary";
import AccessRequests from "@/pages/coach/AccessRequests";
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
import ClientLeaderboard from "@/pages/client/Leaderboard";
import ClientGuide from "@/pages/client/Guide";
import ChangePassword from "@/pages/client/ChangePassword";
import ResetPassword from "@/pages/ResetPassword";
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
          <Route path="/coach/exercises" element={<ExerciseLibrary />} />
          <Route path="/coach/recipes" element={<RecipeLibrary />} />
          <Route path="/coach/payments" element={<PaymentDashboard />} />
          <Route path="/coach/access-requests" element={<AccessRequests />} />
          <Route path="/coach/ai-program" element={<AIProgramBuilder />} />
          <Route path="/coach/ai-nutrition" element={<AINutritionBuilder />} />
        </Route>
        <Route path="/" element={<Navigate to="/coach" replace />} />
        <Route path="*" element={<Navigate to="/coach" replace />} />
      </Routes>
    );
  }

  return <ClientRoutes />;
}

function ClientRoutes() {
  const { user } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState<boolean | null>(null);

  const { data: profileFlags } = useQuery({
    queryKey: ['profile-flags', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile-onboarding', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: onboarding, isLoading: obLoading } = useQuery({
    queryKey: ['onboarding-status', clientProfile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('onboarding_responses')
        .select('id')
        .eq('client_id', clientProfile!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!clientProfile,
  });

  useEffect(() => {
    if (profileFlags !== undefined) {
      setMustChangePassword((profileFlags as any)?.must_change_password ?? false);
    }
  }, [profileFlags]);

  useEffect(() => {
    if (!clientProfile) return;
    if (obLoading) return;
    setOnboardingDone(!!onboarding);
  }, [clientProfile, onboarding, obLoading]);

  if (mustChangePassword === null || onboardingDone === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Force password change before anything else
  if (mustChangePassword) {
    return <ChangePassword />;
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
        <Route path="/client/transformation" element={<ClientTransformation />} />
        <Route path="/client/ai" element={<ClientAIChat />} />
        <Route path="/client/leaderboard" element={<ClientLeaderboard />} />
        <Route path="/client/guide" element={<ClientGuide />} />
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
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<AppRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
