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

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/appliances/add">
              <Button size="lg" className="shadow-lg shadow-orange-500/25">
                <PlusCircle className="mr-1 h-5 w-5" />
                Добавить прибор
              </Button>
            </Link>
            <Link href="/receipts/add">
              <Button size="lg" variant="secondary">
                <ReceiptIcon className="mr-1 h-5 w-5 text-orange-400" />
                Загрузить квитанцию
              </Button>
            </Link>
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

      {/* Receipts Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
              <ReceiptIcon className="h-6 w-6 text-orange-400" />
              Квитанции и расчёты
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Выберите квитанцию для просмотра детальной декомпозиции и
              симулятора экономии
            </p>
          </div>
          <Link href="/receipts/add">
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-1.5 h-4 w-4 text-orange-400" />
              Новая квитанция
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
              />
            ))}
          </div>
        ) : receipts.length === 0 ? (
          <Card className="border-dashed border-slate-800 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <ReceiptIcon className="h-7 w-7" />
            </div>
            <CardTitle className="text-lg">Нет загруженных квитанций</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md">
              Загрузите фото квитанции за любой месяц, чтобы Ignis распознал
              потребление и рассчитал долю каждого прибора.
            </CardDescription>
            <Link href="/receipts/add" className="mt-6 inline-block">
              <Button>
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Загрузить первую квитанцию
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {receipts.map((receipt) => {
              const isCalibrated = !!receipt.calibrationCoef;
              return (
                <Link
                  key={receipt.id}
                  href={`/dashboard/${receipt.id}`}
                  className="group block transition-transform hover:-translate-y-1 focus:outline-none"
                >
                  <Card className="h-full border-slate-800/80 transition-all group-hover:border-orange-500/40 group-hover:shadow-xl group-hover:shadow-orange-500/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2 font-semibold text-slate-300">
                        <Calendar className="h-4 w-4 text-orange-400" />
                        <span>
                          {MONTH_NAMES[receipt.periodMonth]}{" "}
                          {receipt.periodYear}
                        </span>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          isCalibrated
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {isCalibrated ? "Откалибровано" : "Требует расчёта"}
                      </span>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-3">
                          <span className="block text-[11px] font-medium text-slate-400">
                            Потребление
                          </span>
                          <span className="mt-0.5 block font-mono text-lg font-bold text-white">
                            {receipt.totalKwh.toLocaleString("ru-RU")}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              кВт·ч
                            </span>
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-3">
                          <span className="block text-[11px] font-medium text-slate-400">
                            Сумма к оплате
                          </span>
                          <span className="mt-0.5 block font-mono text-lg font-bold text-amber-400">
                            {receipt.totalAmount.toLocaleString("ru-RU", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            <span className="text-xs font-normal">₸ / ₽</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 text-xs text-slate-400 transition-colors group-hover:text-orange-400">
                        <span>
                          {isCalibrated
                            ? "Смотреть декомпозицию"
                            : "Запустить расчёт"}
                        </span>
                        <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Appliances Quick Overview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
              <Zap className="h-6 w-6 text-amber-400" />
              Мои электроприборы
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Приборы, участвующие в декомпозиции и калибровке расчётов
            </p>
          </div>
          <Link href="/appliances/add">
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-1.5 h-4 w-4 text-amber-400" />
              Добавить прибор
            </Button>
          </Link>
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
