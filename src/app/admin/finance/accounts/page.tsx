"use client";

import { useEffect, useState } from "react";

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  isArchived: boolean;
};

export default function FinanceAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("CASH");
  const [currency, setCurrency] = useState("RUB");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/finance/accounts");
    if (res.ok) setAccounts(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/finance/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type, currency }) });
    if (res.ok) { setName(""); setType("CASH"); setCurrency("RUB"); await load(); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Счета</h1>
      <form onSubmit={createAccount} className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Название" className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent" />
        <select value={type} onChange={(e)=>setType(e.target.value)} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent">
          <option value="CASH">Наличные</option>
          <option value="WALLET">Кошелёк</option>
          <option value="BANK">Банковский</option>
          <option value="OTHER">Другое</option>
        </select>
        <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-transparent">
          <option>RUB</option>
          <option>USD</option>
          <option>EUR</option>
          <option>USDT</option>
        </select>
        <button type="submit" className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-white/10">Создать</button>
      </form>
      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div className="rounded border border-black/10 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="text-left p-2">Название</th>
                <th className="text-left p-2">Тип</th>
                <th className="text-left p-2">Валюта</th>
                <th className="text-left p-2">Баланс</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} className="border-t border-black/5 dark:border-white/10">
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{a.type}</td>
                  <td className="p-2">{a.currency}</td>
                  <td className="p-2">{a.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


