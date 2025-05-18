import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import ExamPrep from "./pages/ExamPrep";
import Summary from "./pages/Summary";
import JobBoard from "./pages/JobBoard";
import Forum from "./pages/Forum";
import Profile from "./pages/Profile";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/exam-prep" component={ExamPrep} />
        <Route path="/summary" component={Summary} />
        <Route path="/jobs" component={JobBoard} />
        <Route path="/forum" component={Forum} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
