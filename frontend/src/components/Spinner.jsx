const Spinner = ({ label = "Laden..." }) => {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-amber-700" />
      <span>{label}</span>
    </div>
  );
};

export default Spinner;





