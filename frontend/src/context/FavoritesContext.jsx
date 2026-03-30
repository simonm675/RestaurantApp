import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { userApi } from "../services/api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = "restaurantFavorites";

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated, auth } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const serverFavorites = Array.isArray(auth?.favorites)
        ? auth.favorites.filter((item) => item && item._id)
        : [];
      setFavorites(serverFavorites);
      setIsLoaded(true);
      return;
    }

    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch {
      setFavorites([]);
    }
    setIsLoaded(true);
  }, [auth?.favorites, isAuthenticated]);

  useEffect(() => {
    if (!isLoaded || isAuthenticated) return;
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, isAuthenticated, isLoaded]);

  const syncFavoritesToProfile = useCallback(
    async (nextFavorites) => {
      if (!isAuthenticated) return;
      const favoriteIds = nextFavorites.map((item) => item._id);
      try {
        const { data } = await userApi.updateFavorites(favoriteIds);
        if (Array.isArray(data?.favorites)) {
          setFavorites(data.favorites);
        }
      } catch {
        // Keep optimistic state to avoid disrupting user flow if sync fails temporarily.
      }
    },
    [isAuthenticated]
  );

  const isFavorite = useCallback((itemId) => {
    return favorites.some((fav) => fav._id === itemId);
  }, [favorites]);

  const toggleFavorite = useCallback((item) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav._id === item._id);
      const nextFavorites = exists
        ? prev.filter((fav) => fav._id !== item._id)
        : [...prev, item];

      void syncFavoritesToProfile(nextFavorites);
      return nextFavorites;
    });
  }, [syncFavoritesToProfile]);

  const removeFavorite = useCallback((itemId) => {
    setFavorites((prev) => {
      const nextFavorites = prev.filter((fav) => fav._id !== itemId);
      void syncFavoritesToProfile(nextFavorites);
      return nextFavorites;
    });
  }, [syncFavoritesToProfile]);

  const addFavorite = useCallback((item) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav._id === item._id)) return prev;
      const nextFavorites = [...prev, item];
      void syncFavoritesToProfile(nextFavorites);
      return nextFavorites;
    });
  }, [syncFavoritesToProfile]);

  const value = useMemo(() => ({
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  }), [addFavorite, favorites, isFavorite, removeFavorite, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
