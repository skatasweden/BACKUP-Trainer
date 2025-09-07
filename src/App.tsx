import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CoachDashboard from "./pages/CoachDashboard";
import CoachAdmin from "./pages/CoachAdmin";
import AthleteDashboard from "./pages/AthleteDashboard";
import AthletePrograms from "./pages/AthletePrograms";
import PaymentSuccess from "./pages/PaymentSuccess";
import CoachCategories from "./pages/CoachCategories";
import CoachExercises from "./pages/CoachExercises";
import CoachProtocols from "./pages/CoachProtocols";
import CoachBlocks from "./pages/CoachBlocks";
import BlockBuilder from "./pages/BlockBuilder";
import CoachWorkouts from "./pages/CoachWorkouts";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import CoachPrograms from "./pages/CoachPrograms";
import ProgramBuilder from "./pages/ProgramBuilder";
import AthleteWorkouts from "./pages/AthleteWorkouts";
import AthleteWorkoutsTest from "./pages/AthleteWorkoutsTest";
import AthleteUpcomingWorkouts from "./pages/AthleteUpcomingWorkouts";
import AthleteWorkoutDetail from "./pages/AthleteWorkoutDetail";
import AthleteExerciseDetail from "./pages/AthleteExerciseDetail";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

const queryClient = new QueryClient();

// Layout wrapper component
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const shouldHideSidebar = location.pathname === "/" || location.pathname === "/auth" || location.pathname === "/payment/success";
  
  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header with sidebar trigger */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Main App Content
const AppContent = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Coach Routes */}
        <Route path="/coach/dashboard" element={<ProtectedRoute requiredRole="coach"><CoachDashboard /></ProtectedRoute>} />
        <Route path="/coach/admin" element={<ProtectedRoute requiredRole="coach"><CoachAdmin /></ProtectedRoute>} />
        <Route path="/coach/categories" element={<ProtectedRoute requiredRole="coach"><CoachCategories /></ProtectedRoute>} />
        <Route path="/coach/exercises" element={<ProtectedRoute requiredRole="coach"><CoachExercises /></ProtectedRoute>} />
        <Route path="/coach/protocols" element={<ProtectedRoute requiredRole="coach"><CoachProtocols /></ProtectedRoute>} />
        <Route path="/coach/blocks" element={<ProtectedRoute requiredRole="coach"><CoachBlocks /></ProtectedRoute>} />
        <Route path="/coach/blocks/:id" element={<ProtectedRoute requiredRole="coach"><BlockBuilder /></ProtectedRoute>} />
        <Route path="/coach/workouts" element={<ProtectedRoute requiredRole="coach"><CoachWorkouts /></ProtectedRoute>} />
        <Route path="/coach/workouts/builder/:id" element={<ProtectedRoute requiredRole="coach"><WorkoutBuilder /></ProtectedRoute>} />
        <Route path="/coach/programs" element={<ProtectedRoute requiredRole="coach"><CoachPrograms /></ProtectedRoute>} />
        <Route path="/coach/programs/builder/:id" element={<ProtectedRoute requiredRole="coach"><ProgramBuilder /></ProtectedRoute>} />
        <Route path="/coach/athletes" element={<ProtectedRoute requiredRole="coach"><div className="p-6"><h1 className="text-2xl font-bold">Atleter</h1><p className="text-muted-foreground">Hantera dina atleter här.</p></div></ProtectedRoute>} />
        
        {/* Athlete Routes */}
        <Route path="/athlete/dashboard" element={<ProtectedRoute requiredRole="athlete"><AthleteDashboard /></ProtectedRoute>} />
        <Route path="/athlete/programs" element={<ProtectedRoute requiredRole="athlete"><AthletePrograms /></ProtectedRoute>} />
        <Route path="/athlete/workouts" element={<ProtectedRoute requiredRole="athlete"><AthleteWorkouts /></ProtectedRoute>} />
        <Route path="/athlete/workouts/:workoutId" element={<ProtectedRoute requiredRole="athlete"><AthleteWorkoutDetail /></ProtectedRoute>} />
        <Route path="/athlete/exercises/:itemId" element={<ProtectedRoute requiredRole="athlete"><AthleteExerciseDetail /></ProtectedRoute>} />
        <Route path="/athlete/upcoming-workouts" element={<ProtectedRoute requiredRole="athlete"><AthleteUpcomingWorkouts /></ProtectedRoute>} />
        <Route path="/athlete/workouts/test" element={<ProtectedRoute requiredRole="athlete"><AthleteWorkoutsTest /></ProtectedRoute>} />
        <Route path="/athlete/progress" element={<ProtectedRoute requiredRole="athlete"><div className="p-6"><h1 className="text-2xl font-bold">Progression</h1><p className="text-muted-foreground">Följ din utveckling här.</p></div></ProtectedRoute>} />
        <Route path="/athlete/chat" element={<ProtectedRoute requiredRole="athlete"><div className="p-6"><h1 className="text-2xl font-bold">Chat</h1><p className="text-muted-foreground">Kommunicera med din coach här.</p></div></ProtectedRoute>} />
        
        {/* Payment Routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        
        {/* Support Routes */}
        <Route path="/support" element={<Support />} />
        
        {/* Error Routes */}
        <Route path="/forbidden" element={<Forbidden />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
