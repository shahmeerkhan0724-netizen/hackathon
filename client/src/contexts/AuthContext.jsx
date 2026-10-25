import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hcm_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupCompleted, setIsSetupCompleted] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Check setup status and restore session on mount
  const checkAuthAndSetup = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Check if system first-run setup is complete
      const setupRes = await authApi.getSetupStatus();
      const initialized = Boolean(setupRes?.data?.isInitialized);
      setIsSetupCompleted(initialized);

      if (!initialized) {
        setIsLoading(false);
        return;
      }

      // 2. If token exists, verify and fetch current user profile
      const storedToken = localStorage.getItem('hcm_token');
      if (storedToken) {
        try {
          const meRes = await authApi.getMe();
          if (meRes?.data) {
            setUser(meRes.data);
            setMustChangePassword(Boolean(meRes.data.mustChangePassword));
          } else {
            setUser(null);
            localStorage.removeItem('hcm_token');
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid:', err.message);
          setUser(null);
          localStorage.removeItem('hcm_token');
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] Error checking setup/auth:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthAndSetup();

    // Listen for 401 token expiration from axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('hcm_token');
    };

    window.addEventListener('hcm_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('hcm_auth_expired', handleAuthExpired);
  }, [checkAuthAndSetup]);

  // Login handler
  const login = async (email, password) => {
    const res = await authApi.loginUser({ email, password });
    if (res?.data?.token) {
      const newToken = res.data.token;
      const newUser = res.data.user;

      localStorage.setItem('hcm_token', newToken);
      setToken(newToken);
      setUser(newUser);
      setMustChangePassword(Boolean(newUser.mustChangePassword));

      return newUser;
    }
    throw new Error('Invalid response from login endpoint');
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logoutUser();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hcm_token');
      setToken(null);
      setUser(null);
    }
  };

  // Refresh current user info (e.g. after password change or profile update)
  const refreshUser = async () => {
    try {
      const meRes = await authApi.getMe();
      if (meRes?.data) {
        setUser(meRes.data);
        setMustChangePassword(Boolean(meRes.data.mustChangePassword));
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to refresh user profile:', e.message);
    }
  };

  const role = user?.role || null;
  const company = user?.company || null;
  const employee = user?.employee || null;
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        company,
        employee,
        token,
        isAuthenticated,
        isLoading,
        isSetupCompleted,
        setIsSetupCompleted,
        mustChangePassword,
        setMustChangePassword,
        login,
        logout,
        refreshUser,
        checkAuthAndSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
