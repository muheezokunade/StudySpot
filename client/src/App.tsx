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
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import { useAuthContext } from "./context/AuthContext";

// Protected route component to handle authentication
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  
  return <Component {...rest} />;
};

// Public layout doesn't include sidebar and app navigation
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

function Router() {
  return (
    <Switch>
      {/* Auth routes with PublicLayout */}
      <Route path="/login">
        <PublicLayout>
          <Login />
        </PublicLayout>
      </Route>
      <Route path="/signup">
        <PublicLayout>
          <SignUp />
        </PublicLayout>
      </Route>
      <Route path="/forgot-password">
        <PublicLayout>
          <ForgotPassword />
        </PublicLayout>
      </Route>

      {/* App routes with MainLayout */}
      <Route path="/">
        <MainLayout>
          <Home />
        </MainLayout>
      </Route>
      <Route path="/exam-prep">
        <MainLayout>
          <ExamPrep />
        </MainLayout>
      </Route>
      <Route path="/summary">
        <MainLayout>
          <Summary />
        </MainLayout>
      </Route>
      <Route path="/jobs">
        <MainLayout>
          <JobBoard />
        </MainLayout>
      </Route>
      <Route path="/forum">
        <MainLayout>
          <Forum />
        </MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout>
          <Profile />
        </MainLayout>
      </Route>
      <Route path="/admin">
        <MainLayout>
          <Admin />
        </MainLayout>
      </Route>

      {/* 404 route */}
      <Route>
        <MainLayout>
          <NotFound />
        </MainLayout>
      </Route>
    </Switch>
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
