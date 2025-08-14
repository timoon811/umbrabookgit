"use client";

import { useEffect, useState } from "react";

type Account = { id: string; name: string; currency: string };
type Tx = { id: string; occurredAt: string; type: string; amount: string; account: Account; description?: string; projectKey?: string; userId?: string };

export default function FinanceTransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [userId, setUserId] = useState("");

  const load = async () => {
    setLoading(true);
    const [a, t] = await Promise.all([
      fetch("/api/admin/finance/accounts").then(r=>r.ok?r.json():[]),
      fetch("/api/admin/finance/transactions").then(r=>r.ok?r.json():[]),
    ]);
    setAccounts(a);
    setTxs(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/finance/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId, type, amount: Number(amount), description, projectKey: projectKey || null, userId: userId || null }) });
    if (res.ok) { setAmount(""); setDescription(""); await load(); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Операции</h1>
      <form onSubmit={createTx} className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-2">
        <select value={accountId} onChange={(e)=>setAccountId(e.target.value)} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent">
          <option value="">Счёт…</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </select>
        <select value={type} onChange={(e)=>setType(e.target.value)} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent">
          <option value="INCOME">Приход</option>
          <option value="EXPENSE">Расход</option>
          <option value="TRANSFER">Перевод</option>
        </select>
        <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Сумма" type="number" step="0.01" className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <input value={projectKey} onChange={(e)=>setProjectKey(e.target.value)} placeholder="Проект (key)" className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <input value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="Пользователь (id)" className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Комментарий" className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <div className="md:col-span-6"><button type="submit" className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-white/10">Добавить</button></div>
      </form>
      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div className="rounded border border-black/10 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="text-left p-2">Дата</th>
                <th className="text-left p-2">Счёт</th>
                <th className="text-left p-2">Тип</th>
                <th className="text-right p-2">Сумма</th>
                <th className="text-left p-2">Проект</th>
                <th className="text-left p-2">Пользователь</th>
                <th className="text-left p-2">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(tx => (
                <tr key={tx.id} className="border-top border-black/5 dark:border-white/10">
                  <td className="p-2">{new Date(tx.occurredAt).toLocaleString()}</td>
                  <td className="p-2">{tx.account.name}</td>
                  <td className="p-2">{tx.type}</td>
                  <td className="p-2 text-right">{tx.amount}</td>
                  <td className="p-2">{tx.projectKey || '—'}</td>
                  <td className="p-2">{tx.userId || '—'}</td>
                  <td className="p-2">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


