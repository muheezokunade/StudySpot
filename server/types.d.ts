import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      firstName: string;
      email: string;
      school?: string | null;
      role?: string | null;
    } | undefined;
  }
} 