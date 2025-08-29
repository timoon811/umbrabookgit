import Link from "next/link";

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-[760px]">
        <article className="prose prose-zinc dark:prose-invert max-w-none">{children}</article>
      </div>
    </main>
  );
}
