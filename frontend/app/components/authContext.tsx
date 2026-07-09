import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean | null;
  username: String
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<String>("");

  const checkAuth = async () => {
    const res = await fetch("/api/auth/check");
    setUsername(await res.text())
    setIsAuthenticated(res.ok);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};