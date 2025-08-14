export default function FinanceDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Финансы — сводка</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-gray-900">
          <div className="text-sm text-black/60 dark:text-white/60">Баланс всех счетов</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="rounded border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-gray-900">
          <div className="text-sm text-black/60 dark:text-white/60">Доход за месяц</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="rounded border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-gray-900">
          <div className="text-sm text-black/60 dark:text-white/60">Расход за месяц</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
      </div>
    </div>
  );
}


