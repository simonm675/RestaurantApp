import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

const toMoney = (value) => Number(Number(value).toFixed(2));

const buildLineId = () => `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeSelectedOptions = (selectedOptions = []) =>
  selectedOptions
    .filter((option) => option && option.label)
    .map((option) => ({
      label: String(option.label),
      value: String(option.value || ""),
      price: toMoney(Number(option.price || 0)),
    }))
    .sort((a, b) => `${a.label}:${a.value}`.localeCompare(`${b.label}:${b.value}`, "de"));

const buildConfigSignature = (itemId, selectedOptions, specialInstructions) =>
  JSON.stringify({
    itemId,
    selectedOptions,
    specialInstructions: String(specialInstructions || "").trim(),
  });

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("restaurantCart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("restaurantCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, config = {}) => {
    const selectedOptions = normalizeSelectedOptions(config.selectedOptions || []);
    const specialInstructions = String(config.specialInstructions || "").trim();
    const optionSurcharge = toMoney(selectedOptions.reduce((acc, option) => acc + option.price, 0));
    const unitPrice = toMoney(Number(item.price) + optionSurcharge);
    const signature = buildConfigSignature(item._id, selectedOptions, specialInstructions);

    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.configSignature === signature);
      if (existing) {
        return prev.map((entry) =>
          entry.configSignature === signature
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [
        ...prev,
        {
          ...item,
          cartLineId: buildLineId(),
          basePrice: Number(item.price),
          unitPrice,
          selectedOptions,
          specialInstructions,
          configSignature: signature,
          quantity: 1,
        },
      ];
    });
    toast.success(`${item.name} im Warenkorb`);
  };

  const removeFromCart = (cartLineId) => {
    setCartItems((prev) => prev.filter((entry) => entry.cartLineId !== cartLineId));
  };

  const updateQuantity = (cartLineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartLineId);
      return;
    }
    setCartItems((prev) =>
      prev.map((entry) =>
        entry.cartLineId === cartLineId ? { ...entry, quantity } : entry
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (acc, item) => acc + Number(item.unitPrice ?? item.price) * item.quantity,
      0
    );
    const deliveryFee = subtotal > 0 ? 2.9 : 0;
    return {
      subtotal: toMoney(subtotal),
      deliveryFee,
      total: toMoney(subtotal + deliveryFee),
      count: cartItems.reduce((acc, item) => acc + item.quantity, 0),
    };
  }, [cartItems]);

  const value = useMemo(
    () => ({
      cartItems,
      totals,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [cartItems, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
};



