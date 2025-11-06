import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthState, LoginCredentials } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'parent_dashboard_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Mock user data
const MOCK_USER: User = {
  id: 'user-1',
  email: 'parent@example.com',
  childProfiles: [
    {
      id: 'child-1',
      name: 'Emma',
      age: 7,
      deviceId: 'device-001',
    },
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const { user, expiry } = JSON.parse(sessionData);
          if (Date.now() < expiry) {
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
            });
            return;
          } else {
            // Session expired
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (error) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    };

    checkSession();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock authentication - accept any email/password for demo
    if (credentials.email && credentials.password) {
      const expiry = Date.now() + SESSION_DURATION;
      const sessionData = {
        user: MOCK_USER,
        expiry,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

      setAuthState({
        isAuthenticated: true,
        user: MOCK_USER,
        loading: false,
      });
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
