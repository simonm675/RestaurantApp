import { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = "restaurantFavorites";

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const isFavorite = (itemId) => {
    return favorites.some((fav) => fav._id === itemId);
  };

  const toggleFavorite = (item) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav._id === item._id);
      if (exists) {
        return prev.filter((fav) => fav._id !== item._id);
      }
      return [...prev, item];
    });
  };

  const removeFavorite = (itemId) => {
    setFavorites((prev) => prev.filter((fav) => fav._id !== itemId));
  };

  const addFavorite = (item) => {
    if (!isFavorite(item._id)) {
      setFavorites((prev) => [...prev, item]);
    }
  };

  const value = {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
