import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

const translations = {
  de: {
    // Navbar
    home: "Startseite",
    menu: "Menü",
    cart: "Warenkorb",
    profile: "Profil",
    admin: "Restaurant-Bereich",
    kitchen: "Küche",
    logout: "Abmelden",
    login: "Anmelden",

    // MenuPage
    menuTitle: "👨‍🍳 Menü",
    menuSubtitle: "Entdecke unsere vielfältige Auswahl",
    searchPlaceholder: "Suche nach Gericht...",
    filterByCategory: "Nach Kategorie filtern",
    menuLoading: "Menü wird geladen",
    all: "Alle",

    // DishCard
    quickAdd: "Schnell +",
    options: "Optionen",
    addToCart: "In den Warenkorb",
    selectOptions: "Optionen auswählen",
    price: "Preis",

    // CartPage
    cartTitle: "Warenkorb",
    cartEmpty: "Dein Warenkorb ist leer",
    backToMenu: "Zurück zum Menü",
    total: "Gesamt",
    checkout: "Zur Kasse",

    // CheckoutPage
    checkoutTitle: "Kasse",
    deliveryInfo: "Lieferinformationen",
    paymentInfo: "Zahlungsinformationen",
    orderSummary: "Bestellübersicht",
    placeOrder: "Bestellung aufgeben",
    address: "Adresse",
    phone: "Telefon",
    cardNumber: "Kartennummer",

    // Auth
    login: "Anmelden",
    register: "Registrieren",
    email: "E-Mail",
    password: "Passwort",
    name: "Name",
    confirmPassword: "Passwort bestätigen",
    doNotHaveAccount: "Hast du noch kein Konto?",
    alreadyHaveAccount: "Du hast bereits ein Konto?",
    signIn: "Anmelden",
    signUp: "Registrieren",

    // Admin
    adminTitle: "Restaurant-Bereich",
    orders: "Bestellungen",
    users: "Benutzer",
    menu: "Menü",

    // Common
    loading: "Wird geladen...",
    error: "Ein Fehler ist aufgetreten",
    success: "Erfolgreich!",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
  },
  en: {
    // Navbar
    home: "Home",
    menu: "Menu",
    cart: "Cart",
    profile: "Profile",
    admin: "Restaurant Area",
    kitchen: "Kitchen",
    logout: "Logout",
    login: "Login",

    // MenuPage
    menuTitle: "👨‍🍳 Menu",
    menuSubtitle: "Discover our diverse selection",
    searchPlaceholder: "Search for dish...",
    filterByCategory: "Filter by category",
    menuLoading: "Menu is loading",
    all: "All",

    // DishCard
    quickAdd: "Quick +",
    options: "Options",
    addToCart: "Add to cart",
    selectOptions: "Select options",
    price: "Price",

    // CartPage
    cartTitle: "Cart",
    cartEmpty: "Your cart is empty",
    backToMenu: "Back to menu",
    total: "Total",
    checkout: "Checkout",

    // CheckoutPage
    checkoutTitle: "Checkout",
    deliveryInfo: "Delivery information",
    paymentInfo: "Payment information",
    orderSummary: "Order summary",
    placeOrder: "Place order",
    address: "Address",
    phone: "Phone",
    cardNumber: "Card number",

    // Auth
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    name: "Name",
    confirmPassword: "Confirm password",
    doNotHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    signUp: "Sign up",

    // Admin
    adminTitle: "Restaurant Area",
    orders: "Orders",
    users: "Users",
    menu: "Menu",

    // Common
    loading: "Loading...",
    error: "An error occurred",
    success: "Success!",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "de";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.de[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "de" ? "en" : "de"));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
