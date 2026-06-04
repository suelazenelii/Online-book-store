import { createContext, useContext, useState, useEffect } from 'react';
import { setUserToken } from '../api/userAxios';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user_data'));
      if (stored && !stored.role) return { ...stored, role: 'user' };
      return stored;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('user_data')); }
    catch { return false; }
  });

  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('user_data')); }
      catch { return null; }
    })();

    if (!stored) { setLoading(false); return; }

    fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
      { method: 'POST', credentials: 'include' }
    )
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(({ token }) => {
        setUserToken(token);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('user_data');
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = (userData, token) => {
    const u = { ...userData, role: 'user' };
    setUserToken(token);
    localStorage.setItem('user_data', JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    // cookie user_rt dërgohet automatikisht nga browser (credentials: 'include')
    await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`,
      { method: 'POST', credentials: 'include' }
    ).catch(() => {});
    setUserToken(null);
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated, role: 'user' };
    localStorage.setItem('user_data', JSON.stringify(merged));
    setUser(merged);
  };

  if (loading) return null;

  return (
    <UserAuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => useContext(UserAuthContext);
