/**
 * Skeleton Loader Components
 * Bessere UX als Standard Spinner - zeigt Content Layout vor Laden
 */

export const SkeletonOrderCard = () => (
  <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-slate-200 rounded dark:bg-slate-700" />
        <div className="h-3 w-16 bg-slate-100 rounded dark:bg-slate-600" />
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded dark:bg-slate-700" />
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-3 w-full bg-slate-100 rounded dark:bg-slate-600" />
      <div className="h-3 w-4/5 bg-slate-100 rounded dark:bg-slate-600" />
    </div>
    <div className="h-8 w-32 bg-slate-200 rounded dark:bg-slate-700" />
  </div>
);

export const SkeletonMenuGrid = ({ count = 6 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
        <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-slate-200 rounded dark:bg-slate-700" />
          <div className="h-3 w-3/4 bg-slate-100 rounded dark:bg-slate-600" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-5 w-16 bg-slate-200 rounded dark:bg-slate-700" />
            <div className="h-8 w-24 bg-amber-200 rounded dark:bg-amber-900" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonCheckoutForm = () => (
  <div className="space-y-6 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-32 dark:bg-slate-700" />
        <div className="h-10 bg-slate-100 rounded dark:bg-slate-700" />
      </div>
    ))}
    <div className="h-12 bg-amber-200 rounded dark:bg-amber-900" />
  </div>
);

export const SkeletonKitchenBoard = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-4 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 animate-pulse"
      >
        <div className="flex justify-between mb-3">
          <div className="h-5 w-12 bg-slate-200 rounded dark:bg-slate-700" />
          <div className="h-6 w-16 bg-red-200 rounded dark:bg-red-900" />
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-4 w-full bg-slate-200 rounded dark:bg-slate-700" />
          <div className="h-4 w-5/6 bg-slate-200 rounded dark:bg-slate-700" />
        </div>
        <div className="h-3 w-24 bg-slate-100 rounded dark:bg-slate-600" />
      </div>
    ))}
  </div>
);
