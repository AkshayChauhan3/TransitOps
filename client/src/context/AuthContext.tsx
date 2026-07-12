import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import axiosClient from '../api/axiosClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restoring credentials from localStorage on startup.
    const storedToken = localStorage.getItem('transitops_token');
    const storedUser = localStorage.getItem('transitops_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem('transitops_token');
        localStorage.removeItem('transitops_refresh_token');
        localStorage.removeItem('transitops_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, newUser: User) => {
    setToken(accessToken);
    setUser(newUser);
    localStorage.setItem('transitops_token', accessToken);
    localStorage.setItem('transitops_refresh_token', refreshToken);
    localStorage.setItem('transitops_user', JSON.stringify(newUser));
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('transitops_refresh_token');
    if (refreshToken) {
      axiosClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_refresh_token');
    localStorage.removeItem('transitops_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
