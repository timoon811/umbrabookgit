"use client";

import React from "react";
import * as Lucide from "lucide-react";

type PickerTab = "icons" | "emojis";

export type IconEmojiValue =
  | { kind: "emoji"; value: string }
  | { kind: "lucide"; value: string }; // value = Lucide component name

export function parseIconEmojiValue(raw?: string | null): IconEmojiValue | null {
  if (!raw) return null;
  if (raw.startsWith("emoji:")) return { kind: "emoji", value: raw.slice(6) };
  if (raw.startsWith("lucide:")) return { kind: "lucide", value: raw.slice(7) };
  return null;
}

export function stringifyIconEmojiValue(v: IconEmojiValue): string {
  return v.kind === "emoji" ? `emoji:${v.value}` : `lucide:${v.value}`;
}

const EMOJIS: string[] = (
  "😀😁😂🤣😃😄😅😆😉😊😋😎😍😘😗😙😚🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜🤪😝🤤😒😓😔😕🙃🫠🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵😵‍💫🥴😠😡🤬😷🤒🤕🤢🤮🤧🥳🤠🥸🤥🤫🤭🧐🤓😈👿💀☠️👻👽🤖🎃👍👎👊✊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦾🦵🦶👂🦻👃👀👁️🧠🫀🫁👅👄💋👓🕶️🥽🦺👔👕👖🧣🧤🧥🧦👗👙👚👛👜👝🛍️🎒👞👟🥾🥿👠👡🩰👑👒🎩🎓🧢⛑️📿💄💍🪪".split(
    ""
  )
).filter(Boolean);

// Collect Lucide icon component names (PascalCase keys)
const LUCIDE_ICON_NAMES: string[] = Object.keys(Lucide).filter((k) =>
  /^[A-Z][A-Za-z0-9]*$/.test(k)
);

export default function IconEmojiPicker({
  onSelect,
  onClose,
  initialTab = "icons",
}: {
  onSelect: (val: IconEmojiValue) => void;
  onClose: () => void;
  initialTab?: PickerTab;
}) {
  const [tab, setTab] = React.useState<PickerTab>(initialTab);
  const [query, setQuery] = React.useState("");

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const normalized = query.trim().toLowerCase();
  const filteredIconNames = React.useMemo(() => {
    if (!normalized) return LUCIDE_ICON_NAMES.slice(0, 400); // ограничим первичную выдачу
    return LUCIDE_ICON_NAMES.filter((n) => n.toLowerCase().includes(normalized)).slice(0, 400);
  }, [normalized]);

  const filteredEmojis = React.useMemo(() => {
    if (!normalized) return EMOJIS;
    // простая фильтрация по описанию не реализована — отображаем все
    return EMOJIS;
  }, [normalized]);

  return (
    <div
      ref={panelRef}
      className="absolute z-50 mt-2 w-[360px] max-h-[360px] overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-xl"
      role="dialog"
      aria-label="Icon and emoji picker"
    >
      <div className="flex items-center border-b border-black/5 dark:border-white/10 px-3 pt-2">
        <div className="flex gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-md text-xs">
          <button
            onClick={() => setTab("icons")}
            className={`px-2 py-1 rounded ${tab === "icons" ? "bg-white dark:bg-[#0a0a0a]" : "opacity-70"}`}
          >
            Icons
          </button>
          <button
            onClick={() => setTab("emojis")}
            className={`px-2 py-1 rounded ${tab === "emojis" ? "bg-white dark:bg-[#0a0a0a]" : "opacity-70"}`}
          >
            Emojis
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter..."
          className="ml-2 flex-1 bg-transparent text-sm px-2 py-2 outline-none placeholder-black/40 dark:placeholder-white/40"
        />
      </div>

      <div className="p-2 overflow-y-auto max-h-[300px]">
        {tab === "icons" ? (
          <div className="grid grid-cols-8 gap-1">
            {filteredIconNames.map((name) => {
              const Cmp = (Lucide as any)[name] as React.ComponentType<{
                className?: string;
              }>;
              if (!Cmp) return null;
              return (
                <button
                  key={name}
                  title={name}
                  onClick={() => onSelect({ kind: "lucide", value: name })}
                  className="h-9 w-9 inline-flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Cmp className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-1">
            {filteredEmojis.map((e, idx) => (
              <button
                key={`${e}-${idx}`}
                onClick={() => onSelect({ kind: "emoji", value: e })}
                className="h-9 w-9 text-lg leading-none inline-flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


