"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

type Result = { title: string; url: string };

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as Result[];
      setResults(data);
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 dark:text-white/50" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-9 w-72 rounded-md border border-black/10 dark:border-white/10 bg-transparent pl-9 pr-16 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        placeholder="Ask or search..."
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-black/5 dark:bg-white/10 rounded border border-black/10 dark:border-white/10">
          ⌘
        </kbd>
        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-black/5 dark:bg-white/10 rounded border border-black/10 dark:border-white/10">
          K
        </kbd>
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-[28rem] rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg">
          <ul className="py-2 max-h-96 overflow-auto">
            {results.map((r, index) => (
              <li key={`search-${r.url}-${index}`}>
                <Link
                  href={r.url}
                  onClick={() => setOpen(false)}
                  className="flex px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}



