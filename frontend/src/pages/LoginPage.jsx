import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import pizzeriaLogo from "../assets/pizzeria-uno-logo.svg";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/profile";
  const { login, loading } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const onChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await login(formData.email, formData.password);
    navigate(from, { replace: true });
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-6 text-center dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10">
        <div className="mb-4 flex justify-center">
          <img src={pizzeriaLogo} alt="Pizzeria Uno" className="h-28 w-auto drop-shadow-xl" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Pizzeria Uno</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("welcomeBack")}</p>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">📧 {t("email")}</span>
            <input
              name="email"
              type="email"
              placeholder="deine.email@beispiel.de"
              value={formData.email}
              onChange={onChange}
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">🔐 {t("password")}</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={onChange}
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-5 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("signingIn") : `✓ ${t("login")}`}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200 text-center dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("noAccountYet")} {" "}
            <Link to="/register" className="font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
              {t("registerNow")}
            </Link>
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-100 dark:bg-red-950/20 p-4 text-center">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          {t("demoLabel")}: <code className="font-mono">admin@restaurant.com</code> / <code className="font-mono">Admin123!</code>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;




