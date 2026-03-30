import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

const translations = {
  de: {
    // Navbar
    home: "Startseite",
    menu: "Menü",
    reservation: "Reservierung",
    cart: "Warenkorb",
    profile: "Profil",
    admin: "Restaurant-Bereich",
    kitchen: "Küche",
    logout: "Abmelden",
    login: "Anmelden",
    register: "Registrieren",

    // MenuPage
    menuTitle: "👨‍🍳 Menü",
    menuSubtitle: "Entdecke unsere vielfältige Auswahl",
    searchPlaceholder: "Suche nach Gericht...",
    filterByCategory: "Nach Kategorie filtern",
    menuLoading: "Menü wird geladen",
    all: "Alle",
    bestsellers: "🌟 Bestseller",
    popularity: "Wird gerade oft bestellt",
    togetherWithDrinks: "Wird oft zusammen mit Getränken bestellt",
    quicklySoldOut: "Schnell ausverkauft am Abend",
    popularNearby: "Beliebt in deiner Nähe",
    addButton: "Hinzufügen",

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
    subtotal: "Zwischensumme",
    deliveryFee: "Liefergebühr",

    // CheckoutPage
    checkoutTitle: "Kasse",
    deliveryInfo: "Lieferinformationen",
    paymentInfo: "Zahlungsinformationen",
    orderSummary: "Bestellübersicht",
    placeOrder: "Bestellung aufgeben",
    toCheckout: "Zur Kasse",
    address: "Adresse",
    phone: "Telefon",
    cardNumber: "Kartennummer",
    deliveryType: "Lieferart",
    delivery: "Lieferung",
    pickup: "Abholung",
    paymentMethod: "Zahlungsmethode",
    card: "Karte",
    paypal: "PayPal",
    guestCheckout: "Als Gast bestellen",
    guestName: "Dein Name",
    guestEmail: "Deine E-Mail",
    fastPayment: "Schnell bezahlen in unter 1 Minute",
    guestCheckoutActive: "Gast-Checkout aktiv: Du kannst ohne Konto bestellen.",
    lastGuestOrder: "✓ Letzte Gastbestellung",
    guestData: "🙋 Gastdaten",
    guestDataInfo: "Für Gastbestellungen brauchen wir Name und mindestens Telefon oder E-Mail.",
    chooseDeliveryType: "📍 Lieferart wählen",
    deliveryOption: "🚗 Lieferung",
    pickupOption: "🏪 Abholung",
    enterDeliveryAddress: "Bitte Lieferadresse eingeben",
    enterGuestName: "Bitte Namen für die Gastbestellung eingeben",
    enterPhoneOrEmail: "Bitte mindestens Telefon oder gültige E-Mail angeben",

    // Auth
    email: "E-Mail",
    password: "Passwort",
    name: "Name",
    confirmPassword: "Passwort bestätigen",
    doNotHaveAccount: "Hast du noch kein Konto?",
    alreadyHaveAccount: "Du hast bereits ein Konto?",
    signIn: "Anmelden",
    signUp: "Registrieren",
    invalidEmail: "Ungültige E-Mail",
    passwordTooShort: "Passwort muss mindestens 6 Zeichen lang sein",
    passwordsDoNotMatch: "Passwörter stimmen nicht überein",
    createAccount: "Konto erstellen",
    yourName: "Dein Name",
    exampleEmail: "deine.email@beispiel.de",
    minCharacters: "Mindestens 6 Zeichen",
    creatingAccount: "⏳ Wird erstellt...",
    createAccountButton: "✓ Konto erstellen",
    alreadyRegistered: "Bereits registriert?",
    toLogin: "Zum Login",

    // Profile
    profileTitle: "Dein Profil",
    editProfile: "Profil bearbeiten",
    profileEdit: "Profil bearbeiten",
    orderHistory: "Bestellhistorie",
    activeOrders: "Aktive Bestellungen",
    pastOrders: "Vergangene Bestellungen",
    noOrders: "Noch keine Bestellungen vorhanden",
    noActiveOrders: "Aktuell keine laufende Bestellung",
    deliveryAddress: "Lieferadresse",
    fillFromLastOrder: "Aus letzter Bestellung",
    street: "Straße",
    houseNumber: "Nr.",
    postalCode: "PLZ",
    city: "Stadt",
    deliveryNotes: "Lieferhinweise (Klingel, Etage, etc.)",
    deliveryHints: "Lieferhinweise (Klingel, Etage, etc.)",
    example: "z.B. Bei Schmidt klingeln",
    preferredDelivery: "Bevorzugte Lieferung",
    preferredPayment: "Bevorzugte Zahlung",
    saving: "⏳ Speichern...",
    savingDone: "✓ Speichern",
    refresh: "🔄 Aktualisieren",
    liveUpdate: "Live",
    newPasswordOptional: "Neues Passwort (optional)",
    noPasswordChange: "Passwort bleibt unverändert",
    theme: "Designschema",
    switchTheme: "Designschema wechseln",
    toDarkMode: "Zu Dunkel-Modus",
    toHellMode: "Zu Hell-Modus",

    // Home
    handmadePizza: "Handgemachte Pizza, frisch aus dem Ofen.",
    enjoyPizza: "Genießen Sie unsere authentischen italienischen Pizzas, zubereitet mit den besten Zutaten.",
    ratings: "⭐ 4.7 (2.3k Bewertungen)",
    deliveryTime: "⏱️ Lieferung 20-35 min",
    openUntil: "🕒 Geöffnet bis 23:00",
    orderNow: "🛒 Jetzt bestellen",
    viewMenu: "🍽️ Menü ansehen",
    ourBestsellers: "🌟 Unsere Bestseller",
    popularDishes: "Die beliebtesten Pizzas und Spezialitäten",
    allDishes: "Alle Gerichte →",

    // Admin
    adminTitle: "Restaurant-Bereich",
    orders: "Bestellungen",
    users: "Benutzer",
    status: "Status",
    pending: "Ausstehend",
    preparing: "Wird zubereitet",
    ready: "Bereit",
    outForDelivery: "Auf dem Weg",
    delivered: "Geliefert",
    cancelled: "Abgebrochen",
    loadingError: "Restaurant-Bereich konnte nicht geladen werden",
    dishes: "🍕 Gerichte",
    nextStepPreparing: "Nächster Schritt: In Zubereitung",
    nextStepReady: "Nächster Schritt: Bereit zur Abholung",
    nextStepDelivery: "Nächster Schritt: In Lieferung",
    nextStepComplete: "Nächster Schritt: Abschließen",

    // Common
    loading: "Wird geladen...",
    error: "Ein Fehler ist aufgetreten",
    success: "Erfolgreich!",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    close: "Schließen",
    notification: "Benachrichtigung",
    warning: "Warnung",
    info: "Informationen",
    language: "Sprache",
    german: "Deutsch",
    english: "English",
    switchLanguage: "Sprache wechseln",
    chooseLanguage: "Sprache wählen",
    darkMode: "Dunkelmodus",
    lightMode: "Hellmodus",

    // Auth UI
    welcomeBack: "Willkommen zurück",
    noAccountYet: "Noch kein Konto?",
    registerNow: "Jetzt registrieren",
    signingIn: "⏳ Wird angemeldet...",
    demoLabel: "👤 Demo",

    // Dish Configurator
    featuredBadge: "⭐ Beliebt",
    chooseOptionsCta: "Anpassen",
    configureItem: "konfigurieren",
    upgradesHint: "Wählbare Upgrades sind markiert.",
    notesOptional: "Notiz (optional)",
    notesPlaceholder: "z.B. gut durchbacken, bitte ohne Zwiebeln",
    unitPrice: "Stückpreis",
    addWithOptions: "Mit Optionen hinzufügen",
    included: "inkl.",
    free: "gratis",
    ourTip: "Unser Tipp",
  },
  en: {
    // Navbar
    home: "Home",
    menu: "Menu",
    reservation: "Reservation",
    cart: "Cart",
    profile: "Profile",
    admin: "Restaurant Area",
    kitchen: "Kitchen",
    logout: "Logout",
    login: "Login",
    register: "Register",

    // MenuPage
    menuTitle: "👨‍🍳 Menu",
    menuSubtitle: "Discover our diverse selection",
    searchPlaceholder: "Search for dish...",
    filterByCategory: "Filter by category",
    menuLoading: "Menu is loading",
    all: "All",
    bestsellers: "🌟 Bestsellers",
    popularity: "Currently very popular",
    togetherWithDrinks: "Often ordered together with drinks",
    quicklySoldOut: "Quickly sold out in the evening",
    popularNearby: "Popular near you",
    addButton: "Add",

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
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",

    // CheckoutPage
    checkoutTitle: "Checkout",
    deliveryInfo: "Delivery information",
    paymentInfo: "Payment information",
    orderSummary: "Order summary",
    placeOrder: "Place order",
    toCheckout: "Checkout",
    address: "Address",
    phone: "Phone",
    cardNumber: "Card number",
    deliveryType: "Delivery type",
    delivery: "Delivery",
    pickup: "Pickup",
    paymentMethod: "Payment method",
    card: "Card",
    paypal: "PayPal",
    guestCheckout: "Order as guest",
    guestName: "Your name",
    guestEmail: "Your email",
    fastPayment: "Quick payment in under 1 minute",
    guestCheckoutActive: "Guest checkout active: You can order without an account.",
    lastGuestOrder: "✓ Last guest order",
    guestData: "🙋 Guest data",
    guestDataInfo: "For guest orders we need name and at least phone or email.",
    chooseDeliveryType: "📍 Choose delivery type",
    deliveryOption: "🚗 Delivery",
    pickupOption: "🏪 Pickup",
    enterDeliveryAddress: "Please enter delivery address",
    enterGuestName: "Please enter name for guest order",
    enterPhoneOrEmail: "Please enter at least phone or valid email",

    // Auth
    email: "Email",
    password: "Password",
    name: "Name",
    confirmPassword: "Confirm password",
    doNotHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    signUp: "Sign up",
    invalidEmail: "Invalid email",
    passwordTooShort: "Password must be at least 6 characters",
    passwordsDoNotMatch: "Passwords don't match",
    createAccount: "Create account",
    yourName: "Your name",
    exampleEmail: "your.email@example.com",
    minCharacters: "At least 6 characters",
    creatingAccount: "⏳ Creating...",
    createAccountButton: "✓ Create account",
    alreadyRegistered: "Already registered?",
    toLogin: "To login",

    // Profile
    profileTitle: "Your Profile",
    editProfile: "Edit profile",
    profileEdit: "Edit profile",
    orderHistory: "Order history",
    activeOrders: "Active orders",
    pastOrders: "Past orders",
    noOrders: "No orders yet",
    noActiveOrders: "No active orders",
    deliveryAddress: "Delivery address",
    fillFromLastOrder: "Fill from last order",
    street: "Street",
    houseNumber: "No.",
    postalCode: "ZIP",
    city: "City",
    deliveryNotes: "Delivery notes (doorbell, floor, etc.)",
    deliveryHints: "Delivery notes (doorbell, floor, etc.)",
    example: "e.g. Ring at Smith",
    preferredDelivery: "Preferred delivery",
    preferredPayment: "Preferred payment",
    saving: "⏳ Saving...",
    savingDone: "✓ Save",
    refresh: "🔄 Refresh",
    liveUpdate: "Live",
    newPasswordOptional: "New password (optional)",
    noPasswordChange: "Password remains unchanged",
    theme: "Theme",
    switchTheme: "Switch theme",
    toDarkMode: "To dark mode",
    toHellMode: "To light mode",

    // Home
    handmadePizza: "Handmade pizza, fresh from the oven.",
    enjoyPizza: "Enjoy our authentic Italian pizzas, prepared with the finest ingredients.",
    ratings: "⭐ 4.7 (2.3k reviews)",
    deliveryTime: "⏱️ Delivery 20-35 min",
    openUntil: "🕒 Open until 11:00 PM",
    orderNow: "🛒 Order now",
    viewMenu: "🍽️ View menu",
    ourBestsellers: "🌟 Our Bestsellers",
    popularDishes: "The most popular pizzas and specialties",
    allDishes: "All dishes →",

    // Admin
    adminTitle: "Restaurant Area",
    orders: "Orders",
    users: "Users",
    status: "Status",
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    loadingError: "Restaurant area could not be loaded",
    dishes: "🍕 Dishes",
    nextStepPreparing: "Next step: Preparing",
    nextStepReady: "Next step: Ready for pickup",
    nextStepDelivery: "Next step: Out for delivery",
    nextStepComplete: "Next step: Complete",

    // Common
    loading: "Loading...",
    error: "An error occurred",
    success: "Success!",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    notification: "Notification",
    warning: "Warning",
    info: "Information",
    language: "Language",
    german: "Deutsch",
    english: "English",
    switchLanguage: "Switch language",
    chooseLanguage: "Choose language",
    darkMode: "Dark mode",
    lightMode: "Light mode",

    // Auth UI
    welcomeBack: "Welcome back",
    noAccountYet: "No account yet?",
    registerNow: "Register now",
    signingIn: "⏳ Signing in...",
    demoLabel: "👤 Demo",

    // Dish Configurator
    featuredBadge: "⭐ Popular",
    chooseOptionsCta: "Customize",
    configureItem: "configure",
    upgradesHint: "Selectable upgrades are highlighted.",
    notesOptional: "Note (optional)",
    notesPlaceholder: "e.g. bake well done, no onions please",
    unitPrice: "Unit price",
    addWithOptions: "Add with options",
    included: "incl.",
    free: "free",
    ourTip: "Our pick",
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

