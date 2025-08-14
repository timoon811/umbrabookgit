"use client";

import { useEffect, useState } from "react";

type Summary = { income: string; expense: string; byAccount: Array<{ account: string; income: string; expense: string }>; byProject: Array<{ projectKey: string; income: string; expense: string }>; };

export default function FinanceReportsPage() {
  const [range, setRange] = useState<{ from: string; to: string }>(() => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
  });
  const [summary, setSummary] = useState<Summary | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/finance/reports/summary?from=${range.from}&to=${range.to}`);
    if (res.ok) setSummary(await res.json());
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Отчёты</h1>
      <div className="mb-4 flex gap-2">
        <input type="date" value={range.from} onChange={(e)=>setRange(r=>({ ...r, from: e.target.value }))} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <input type="date" value={range.to} onChange={(e)=>setRange(r=>({ ...r, to: e.target.value }))} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <button onClick={load} className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-white/10">Обновить</button>
      </div>
      {!summary ? <div>Загрузка…</div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border border-black/10 dark:border-white/10 p-4">
              <div className="text-sm text-black/60 dark:text-white/60">Доход</div>
              <div className="text-2xl font-semibold">{summary.income}</div>
            </div>
            <div className="rounded border border-black/10 dark:border-white/10 p-4">
              <div className="text-sm text-black/60 dark:text-white/60">Расход</div>
              <div className="text-2xl font-semibold">{summary.expense}</div>
            </div>
          </div>
          <div className="rounded border border-black/10 dark:border-white/10">
            <div className="p-2 text-sm font-medium">По счетам</div>
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5"><tr><th className="text-left p-2">Счёт</th><th className="text-right p-2">Доход</th><th className="text-right p-2">Расход</th></tr></thead>
              <tbody>
                {summary.byAccount.map(a => (
                  <tr key={a.account} className="border-t border-black/5 dark:border-white/10"><td className="p-2">{a.account}</td><td className="p-2 text-right">{a.income}</td><td className="p-2 text-right">{a.expense}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded border border-black/10 dark:border-white/10">
            <div className="p-2 text-sm font-medium">По проектам</div>
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5"><tr><th className="text-left p-2">Проект</th><th className="text-right p-2">Доход</th><th className="text-right p-2">Расход</th></tr></thead>
              <tbody>
                {summary.byProject.map(p => (
                  <tr key={p.projectKey} className="border-t border-black/5 dark:border-white/10"><td className="p-2">{p.projectKey}</td><td className="p-2 text-right">{p.income}</td><td className="p-2 text-right">{p.expense}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


