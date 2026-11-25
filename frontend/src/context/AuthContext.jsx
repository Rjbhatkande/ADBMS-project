import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('campus_hub_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.getMe();
      setUser(data.user);
    } catch (_err) {
      localStorage.removeItem('campus_hub_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [loadUser]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('campus_hub_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    localStorage.setItem('campus_hub_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('campus_hub_token');
    setUser(null);
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
  };

  const isOrganizerOrAdmin = Boolean(user && ['organizer', 'admin'].includes(user.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isOrganizerOrAdmin,
        login,
        register,
        logout,
        updateUserState,
        refreshUser: loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
