import { Suspense, lazy, useLayoutEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import CartDrawer from "./components/CartDrawer";
import MobileBottomNav from "./components/MobileBottomNav";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";
import { LanguageProvider } from "./context/LanguageContext";
import { UIProvider } from "./context/UIContext";

const HomePage = lazy(() => import("./pages/HomePage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const KitchenPage = lazy(() => import("./pages/KitchenPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const ReservationPage = lazy(() => import("./pages/ReservationPage"));

function App() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return (
    <LanguageProvider>
      <UIProvider>
        <div className="min-h-screen bg-app-gradient pb-24 text-slate-700 transition-colors dark:bg-app-gradient-dark dark:text-slate-200">
          <Navbar />

      <main className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<Spinner label="Seite wird geladen" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/reservierung" element={<ReservationPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-tracking" element={<OrderTrackingPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <AdminRoute>
                <KitchenPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>

          <footer className="mx-auto mt-10 w-full max-w-6xl border-t border-slate-200/80 px-4 py-5 text-xs text-slate-600 sm:px-6 lg:px-8 dark:border-slate-700 dark:text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} Pizzeria Uno Lemfoerde</p>
              <Link
                to="/impressum"
                className="font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
              >
                Impressum
              </Link>
            </div>
          </footer>

          <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
          <CartDrawer />
          <MobileBottomNav />
        </div>
      </UIProvider>
    </LanguageProvider>
  );
}

export default App;




