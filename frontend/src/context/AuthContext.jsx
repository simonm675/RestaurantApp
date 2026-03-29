import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { authApi, userApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("restaurantAuth");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) {
      localStorage.setItem("restaurantAuth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("restaurantAuth");
    }
  }, [auth]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      setAuth(data);
      toast.success("Willkommen zurueck");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login fehlgeschlagen");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.register({ name, email, password });
      setAuth(data);
      toast.success("Konto erfolgreich erstellt");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registrierung fehlgeschlagen");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    toast.success("Du wurdest abgemeldet");
  };

  const refreshProfile = async () => {
    if (!auth?.token) return null;
    try {
      const { data } = await userApi.getMe();
      setAuth((prev) => ({ ...prev, ...data, token: prev.token }));
      return data;
    } catch {
      return null;
    }
  };

  const updateProfile = async (payload) => {
    setLoading(true);
    try {
      const { data } = await userApi.updateProfile(payload);
      setAuth((prev) => ({ ...prev, ...data, token: prev.token }));
      toast.success("Profil aktualisiert");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Profil konnte nicht gespeichert werden");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      auth,
      loading,
      isAuthenticated: Boolean(auth?.token),
      isAdmin: auth?.role === "admin",
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [auth, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};



