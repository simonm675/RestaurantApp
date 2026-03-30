const ImpressumPage = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Impressum</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Angaben gemaess Paragraph 5 TMG</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Anbieter</h2>
        <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <p>Jose Ferreira</p>
          <p>Pizzeria Uno aus Lemfoerde</p>
          <p>Hauptstr. 80</p>
          <p>49448 Lemfoerde</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Register und Steuerdaten</h2>
        <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <p>Steuernummer: 45/14401292</p>
          <p>Registergericht / zustaendige Behoerde: Finanzamt Sulingen</p>
          <p>Umsatzsteuer-Identifikationsnummer gemaess Paragraph 27a UStG: DE222480679</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Kontakt</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <p>
            Telefon: <a className="font-semibold text-amber-700 dark:text-amber-300" href="tel:05443203770">05443 / 20 37 70</a>
          </p>
          <p>Telefax: 05443 / 20 37 71</p>
          <p>
            E-Mail: <a className="font-semibold text-amber-700 dark:text-amber-300" href="mailto:info@pizzeria-uno-lemfoerde.de">info@pizzeria-uno-lemfoerde.de</a>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">EU-Streitschlichtung</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
          Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          {" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-amber-700 underline decoration-amber-500/60 underline-offset-2 dark:text-amber-300"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          .
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
          Verbraucherstreitbeilegung/Universalschlichtungsstelle: Wir sind nicht bereit oder verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verantwortlich fuer den Inhalt</h2>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">Jose Ferreira, Hauptstr. 80, 49448 Lemfoerde</p>
      </section>
    </div>
  );
};

export default ImpressumPage;
