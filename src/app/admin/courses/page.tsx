import Link from "next/link";

export default function AdminCoursesIndex() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Курсы</h1>
      <Link href="/admin/courses/new" className="inline-flex items-center px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-white/10">Создать курс</Link>
    </div>
  );
}


