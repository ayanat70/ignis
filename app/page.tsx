export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          Next.js 14 • App Router • TypeScript
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ignis
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Интеллектуальный сервис энергоаудита и декомпозиции счетов за
          электричество — распознаёт приборы по фото/названию, распознаёт
          квитанции ЖКХ, калибрует расчёты под фактическое потребление и даёт
          интерактивный симулятор экономии.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="rounded-md border border-slate-200 px-3 py-1 dark:border-slate-800">
            PostgreSQL (Prisma)
          </span>
          <span className="rounded-md border border-slate-200 px-3 py-1 dark:border-slate-800">
            Tailwind CSS
          </span>
          <span className="rounded-md border border-slate-200 px-3 py-1 dark:border-slate-800">
            ESLint & Prettier
          </span>
        </div>
      </div>
    </main>
  );
}
