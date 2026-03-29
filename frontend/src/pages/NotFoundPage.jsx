import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">404</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Die angefragte Seite wurde nicht gefunden.</p>
      <Link to="/" className="mt-4 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600">
        Zur Startseite
      </Link>
    </div>
  );
};

export default NotFoundPage;



