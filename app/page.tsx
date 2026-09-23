"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  PlusCircle,
  Receipt as ReceiptIcon,
  ArrowRight,
  Zap,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
  Activity,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/Card";

interface ReceiptItem {
  id: string;
  periodMonth: number;
  periodYear: number;
  totalKwh: number;
  totalAmount: number;
  tariffRate: number | null;
  calibrationCoef: number | null;
  createdAt: string;
  estimates: any[];
}

interface ApplianceItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  ratedPowerWatts: number;
  flexibility: number;
}

const MONTH_NAMES = [
  "",
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export default function HomePage() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [appliances, setAppliances] = useState<ApplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resR, resA] = await Promise.all([
          fetch("/api/receipts"),
          fetch("/api/appliances"),
        ]);
        if (resR.ok) setReceipts(await resR.json());
        if (resA.ok) setAppliances(await resA.json());
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const hasAppliances = appliances.length > 0;
  const hasReceipts = receipts.length > 0;
  const latestReceipt = receipts[0];

  return (
    <div className="animate-in fade-in space-y-12 pb-12 duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-950/20 via-slate-900/60 to-slate-950/80 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="pointer-events-none absolute right-0 top-0 -mr-12 -mt-12 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-12 -ml-12 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400">
            <Flame className="h-3.5 w-3.5 animate-pulse" />
            Интеллектуальный энергоаудит с AI
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Узнайте, куда уходит электричество, и{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              сократите счёт до 35%
            </span>
          </h1>

          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
            Ignis анализирует фото квитанций ЖКХ и шильдиков приборов, проводит
            эвристическую декомпозицию энергопотребления, калибрует расчёт под
            фактический счёт и моделирует сценарии экономии в реальном времени.
          </p>

          {/* Wizard Steps Indicator */}
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
                  hasAppliances
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border border-orange-500/40 bg-orange-500/20 text-orange-300 font-semibold ring-1 ring-orange-500/30"
                }`}
              >
                {hasAppliances ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-slate-950">
                    1
                  </span>
                )}
                1. Приборы {hasAppliances && `(${appliances.length})`}
              </span>

              <span className="text-slate-600">→</span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
                  !hasAppliances
                    ? "border border-slate-800 bg-slate-900/50 text-slate-500"
                    : hasReceipts
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border border-orange-500/40 bg-orange-500/20 text-orange-300 font-semibold ring-1 ring-orange-500/30"
                }`}
              >
                {hasReceipts ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : !hasAppliances ? (
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-slate-950">
                    2
                  </span>
                )}
                2. Квитанция {hasReceipts && `(${receipts.length})`}
              </span>

              <span className="text-slate-600">→</span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
                  hasAppliances && hasReceipts
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 font-semibold ring-1 ring-amber-500/30"
                    : "border border-slate-800 bg-slate-900/50 text-slate-500"
                }`}
              >
                {hasAppliances && hasReceipts ? (
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                )}
                3. Аудит и симуляция
              </span>
            </div>
          </div>

          {/* Action buttons strictly respecting sequential wizard rules */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {/* Step 1: Добавить прибор (THE ONLY ONE on page) */}
            <Link href="/appliances/add">
              <Button
                size="lg"
                variant={!hasAppliances ? "primary" : "outline"}
                className={!hasAppliances ? "shadow-lg shadow-orange-500/25" : ""}
              >
                <PlusCircle className="mr-1.5 h-5 w-5" />
                Добавить прибор
              </Button>
            </Link>

            {/* Step 2: Загрузить квитанцию (disabled if 0 appliances) */}
            {hasAppliances ? (
              <Link href="/receipts/add">
                <Button
                  size="lg"
                  variant={!hasReceipts ? "primary" : "secondary"}
                  className={!hasReceipts ? "shadow-lg shadow-orange-500/25" : ""}
                >
                  <ReceiptIcon className="mr-1.5 h-5 w-5 text-orange-400" />
                  Загрузить квитанцию
                </Button>
              </Link>
            ) : (
              <div className="relative group">
                <Button
                  size="lg"
                  variant="secondary"
                  disabled
                  className="cursor-not-allowed opacity-50 border-slate-800"
                  title="Сначала добавьте хотя бы один прибор"
                >
                  <Lock className="mr-1.5 h-4 w-4 text-slate-500" />
                  Загрузить квитанцию
                </Button>
                <span className="block mt-1 text-xs text-amber-400/90 font-medium">
                  Сначала добавьте хотя бы один прибор
                </span>
              </div>
            )}

            {/* Step 3: Transition to Audit Dashboard (available once both exist) */}
            {hasAppliances && hasReceipts && latestReceipt && (
              <Link href={`/dashboard/${latestReceipt.id}`}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-amber-400"
                >
                  <Flame className="mr-1.5 h-5 w-5" />
                  Перейти к аудиту
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-10 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Добавлено приборов
            </p>
            <p className="flex items-center gap-2 font-mono text-2xl font-bold text-white sm:text-3xl">
              <Zap className="h-5 w-5 text-amber-400" />
              {appliances.length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Загружено счетов
            </p>
            <p className="flex items-center gap-2 font-mono text-2xl font-bold text-white sm:text-3xl">
              <ReceiptIcon className="h-5 w-5 text-orange-400" />
              {receipts.length}
            </p>
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Потенциал экономии
            </p>
            <p className="flex items-center gap-1.5 font-mono text-2xl font-bold text-emerald-400 sm:text-3xl">
              <TrendingDown className="h-5 w-5" />
              до 35%
            </p>
          </div>
        </div>
      </section>

      {/* Appliances Quick Overview */}
      <section className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
            <Zap className="h-6 w-6 text-amber-400" />
            Мои электроприборы
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Приборы, участвующие в декомпозиции и калибровке расчётов
          </p>
        </div>

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
        ) : appliances.length === 0 ? (
          <Card className="border-dashed border-slate-800 px-6 py-10 text-center">
            <p className="text-sm text-slate-400">
              Список приборов пуст. Добавьте первый прибор по фото шильдика или
              названию модели.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {appliances.map((app) => (
              <Card
                key={app.id}
                className="border-slate-800/80 bg-slate-950/60 p-4 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {app.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {[app.brand, app.model].filter(Boolean).join(" ") ||
                        "Без бренда"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-orange-400">
                    {app.ratedPowerWatts} Вт
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-500">
                  <span className="capitalize">{app.category || "Общее"}</span>
                  <span>Гибкость: {app.flexibility * 100}%</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
