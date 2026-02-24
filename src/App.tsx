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
import ClientDashboard from "@/pages/client/Dashboard";
import ClientCheckIn from "@/pages/client/CheckIn";
import ClientHabits from "@/pages/client/Habits";
import ClientMessages from "@/pages/client/ClientMessages";
import ClientProfile from "@/pages/client/ClientProfile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

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
        <Route path="/client/checkin" element={<ClientCheckIn />} />
        <Route path="/client/habits" element={<ClientHabits />} />
        <Route path="/client/messages" element={<ClientMessages />} />
        <Route path="/client/profile" element={<ClientProfile />} />
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
