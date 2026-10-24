import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { setAuthToken } from '../services/api';

const AuthContext = createContext();

export function normalizeAuthPayload(payload) {
  const user = payload?.user;
  if (!user) {
    return payload;
  }

  return {
    ...payload,
    user: {
      id: user.id ?? user.Id ?? null,
      fullName: user.fullName ?? user.FullName ?? user.name ?? user.Name ?? '',
      email: user.email ?? user.Email ?? '',
      phone: user.phone ?? user.Phone ?? '',
      role: user.role ?? user.Role ?? ''
    }
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pfaUser');
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored);
      return normalizeAuthPayload({ user: parsed }).user;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pfaToken'));

  useEffect(() => {
    if (user) {
      localStorage.setItem('pfaUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('pfaUser');
    }
  }, [user]);

  useLayoutEffect(() => {
    const storedToken = localStorage.getItem('pfaToken');
    if (storedToken) {
      setAuthToken(storedToken);
    } else {
      setAuthToken(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('pfaToken', token);
      setAuthToken(token);
    } else {
      localStorage.removeItem('pfaToken');
      setAuthToken(null);
    }
  }, [token]);

  const login = (data) => {
    const normalized = normalizeAuthPayload(data);
    setUser(normalized.user);
    setToken(normalized.token);
    setAuthToken(normalized.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
