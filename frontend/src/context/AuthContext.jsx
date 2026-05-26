import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (!token) { setLoading(false); return; }
    api.getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("crm_token"))
      .finally(() => setLoading(false));
  }, []);

  async function signup(name, email, password) {
    const data = await api.signup({ name, email, password });
    localStorage.setItem("crm_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(email, password) {
    const data = await api.login({ email, password });
    localStorage.setItem("crm_token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("crm_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
