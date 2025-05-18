import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, signup, logout, error } = useAuthContext();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      toast({
        title: 'Login successful',
        description: 'Welcome back to Noun Success!',
        variant: 'default',
      });
      return true;
    } catch (err) {
      // Error is already set in context
      toast({
        title: 'Login failed',
        description: error || 'Please check your credentials and try again',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleSignup = async (
    firstName: string,
    email: string,
    password: string,
    confirmPassword: string,
    school?: string,
    referralCode?: string
  ) => {
    try {
      await signup({
        firstName,
        email,
        password,
        confirmPassword,
        school,
        referralCode,
      });
      toast({
        title: 'Account created',
        description: 'Welcome to Noun Success!',
        variant: 'default',
      });
      return true;
    } catch (err) {
      toast({
        title: 'Signup failed',
        description: error || 'Please check your information and try again',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        variant: 'default',
      });
      return true;
    } catch (err) {
      toast({
        title: 'Logout failed',
        description: error || 'An error occurred during logout',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    error,
  };
};
