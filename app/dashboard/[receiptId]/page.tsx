"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PieChart as PieChartIcon,
  Zap,
  Sliders,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Flame,
  Clock,
  RotateCcw,
  Sparkles,
  Info,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/Card";
import { Slider } from "@/components/Slider";
import { useToast } from "@/components/Toast";

interface Appliance {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  ratedPowerWatts: number;
  flexibility: number;
}

interface ApplianceEstimate {
  id: string;
  applianceId: string;
  receiptId: string;
  hoursPerDay: number;
  dutyCycle: number;
  rawEstimateKwh: number;
  calibratedKwh: number;
  priority: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  appliance: Appliance;
}

interface Receipt {
  id: string;
  periodMonth: number;
  periodYear: number;
  totalKwh: number;
  totalAmount: number;
  tariffRate: number | null;
  calibrationCoef: number | null;
  estimates?: ApplianceEstimate[];
}

const PRIORITY_CONFIG = {
  RED: {
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "Высокий потенциал экономии",
  },
  ORANGE: {
    color: "#f97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badge: "Значительный резерв",
  },
  YELLOW: {
    color: "#eab308",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    badge: "Умеренный резерв",
  },
  GREEN: {
    color: "#22c55e",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "Базовое / неизменное",
  },
};

const CHART_COLORS = [
  "#f97316",
  "#ef4444",
  "#38bdf8",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#6366f1",
];

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

export default function ReceiptDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = (params.receiptId || params.id) as string;
  const { success: toastSuccess, error: toastError } = useToast();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [estimates, setEstimates] = useState<ApplianceEstimate[]>([]);
  const [allAppliances, setAllAppliances] = useState<Appliance[]>([]);
  const [usageInputs, setUsageInputs] = useState<
    Record<string, { hoursPerDay: number; dutyCycle: number }>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showConfigMode, setShowConfigMode] = useState(false);

  // Load Breakdown and Appliances
  useEffect(() => {
    async function loadData() {
      try {
        const [resBreakdown, resAppliances] = await Promise.all([
          fetch(`/api/receipts/${receiptId}/breakdown`),
          fetch("/api/appliances"),
        ]);

        if (!resBreakdown.ok) {
          throw new Error("Не удалось загрузить данные квитанции");
        }

        const breakdown = await resBreakdown.json();
        setReceipt(breakdown.receipt);
        setEstimates(breakdown.estimates || []);

        const apps: Appliance[] = await resAppliances.json();
        setAllAppliances(apps);

        // Pre-fill usage inputs with existing or default values
        const inputs: Record<
          string,
          { hoursPerDay: number; dutyCycle: number }
        > = {};
        apps.forEach((app) => {
          const existing = breakdown.estimates?.find(
            (e: ApplianceEstimate) => e.applianceId === app.id
          );
          inputs[app.id] = {
            hoursPerDay: existing ? existing.hoursPerDay : 4,
            dutyCycle: existing ? existing.dutyCycle : 0.5,
          };
        });
        setUsageInputs(inputs);

        if (!breakdown.estimates || breakdown.estimates.length === 0) {
          setShowConfigMode(true);
        }
      } catch (err: any) {
        toastError(err.message || "Ошибка загрузки дашборда");
      } finally {
        setIsLoading(false);
      }
    }

    if (receiptId) {
      loadData();
    }
  }, [receiptId, toastError]);

  // Handle Calculate
  const handleCalculate = async () => {
    if (allAppliances.length === 0) {
      toastError("Сначала добавьте хотя бы один электроприбор");
      return;
    }

    setIsCalculating(true);
    try {
      const payload = allAppliances.map((app) => ({
        applianceId: app.id,
        hoursPerDay: usageInputs[app.id]?.hoursPerDay ?? 4,
        dutyCycle: usageInputs[app.id]?.dutyCycle ?? 0.5,
      }));

      const res = await fetch(`/api/receipts/${receiptId}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка расчёта энергоаудита");
      }

      setReceipt(data.receipt);
      setEstimates(data.estimates);
      setShowConfigMode(false);
      toastSuccess(
        "Расчёт успешно выполнен и откалиброван под факт квитанции!"
      );
    } catch (err: any) {
      toastError(err.message || "Ошибка при выполнении расчёта");
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Sparkles className="h-8 w-8 animate-spin text-orange-400" />
        <p className="text-sm text-slate-400">Загрузка декомпозиции счёта...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg text-slate-300">Квитанция не найдена</p>
        <Link href="/">
          <Button variant="outline">Вернуться на главную</Button>
        </Link>
      </div>
    );
  }

  const hasCalculation = estimates.length > 0 && !showConfigMode;
  const totalCalibrated = estimates.reduce(
    (sum, e) => sum + (e.calibratedKwh ?? 0),
    0
  );

  const chartData = estimates.map((e) => ({
    name: e.appliance.name,
    kwh: parseFloat(e.calibratedKwh.toFixed(1)),
    percentage: parseFloat(
      ((e.calibratedKwh / (receipt.totalKwh || 1)) * 100).toFixed(1)
    ),
  }));

  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />К списку квитанций
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Декомпозиция счёта: {MONTH_NAMES[receipt.periodMonth]}{" "}
            {receipt.periodYear}
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Фактический счёт: {receipt.totalKwh.toLocaleString("ru-RU")} кВт·ч (
            {receipt.totalAmount.toLocaleString("ru-RU")} ₸/₽)
          </p>
        </div>

        {hasCalculation && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigMode(true)}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Изменить параметры
            </Button>
            <Link href={`/dashboard/${receipt.id}/simulate`}>
              <Button size="sm">
                <Sliders className="mr-1.5 h-4 w-4" />
                Симулятор экономии
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Mode A: Appliance Usage Setup before calculation or re-calculation */}
      {showConfigMode && (
        <Card className="border-orange-500/30 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Clock className="h-5 w-5" />
              Параметры работы электроприборов в{" "}
              {MONTH_NAMES[receipt.periodMonth]}
            </CardTitle>
            <CardDescription>
              Укажите примерные часы работы в сутки (t) и коэффициент нагрузки
              (duty cycle). Алгоритм Ignis откалибрует сумму под фактические{" "}
              <span className="font-bold text-orange-400">
                {receipt.totalKwh} кВт·ч
              </span>
              .
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {allAppliances.length === 0 ? (
              <div className="space-y-4 py-8 text-center">
                <p className="text-sm text-slate-400">
                  В вашей базе нет зарегистрированных приборов. Добавьте их
                  перед расчётом.
                </p>
                <Link href="/appliances/add">
                  <Button>Добавить прибор</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {allAppliances.map((app) => {
                  const currentHours = usageInputs[app.id]?.hoursPerDay ?? 4;
                  const currentDuty = usageInputs[app.id]?.dutyCycle ?? 0.5;

                  return (
                    <div
                      key={app.id}
                      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-white">
                            {app.name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {[app.brand, app.model].filter(Boolean).join(" ") ||
                              app.category}
                          </p>
                        </div>
                        <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-orange-400">
                          {app.ratedPowerWatts} Вт
                        </span>
                      </div>

                      <Slider
                        label="Часов работы в сутки"
                        value={currentHours}
                        min={0}
                        max={24}
                        step={0.5}
                        unit="ч"
                        onChange={(val) =>
                          setUsageInputs((prev) => ({
                            ...prev,
                            [app.id]: {
                              ...prev[app.id],
                              hoursPerDay: val,
                            },
                          }))
                        }
                      />

                      <Slider
                        label="Коэффициент загрузки (Duty Cycle)"
                        value={Math.round(currentDuty * 100)}
                        min={10}
                        max={100}
                        step={5}
                        unit="%"
                        helperText="100% — макс. нагрузка, 50% — периодический цикл"
                        onChange={(val) =>
                          setUsageInputs((prev) => ({
                            ...prev,
                            [app.id]: {
                              ...prev[app.id],
                              dutyCycle: val / 100,
                            },
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {allAppliances.length > 0 && (
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                {estimates.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowConfigMode(false)}
                    disabled={isCalculating}
                  >
                    Отмена
                  </Button>
                )}
                <Button
                  onClick={handleCalculate}
                  isLoading={isCalculating}
                  disabled={isCalculating}
                  className="min-w-[200px]"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Рассчитать декомпозицию
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mode B: Visualized Breakdown Dashboard */}
      {hasCalculation && (
        <>
          {/* Reconciliation Banner */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-slate-950 p-4 shadow-xl sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-white">
                  Фактическая сходимость расчёта:{" "}
                  <span className="font-mono font-extrabold text-emerald-400">
                    100% ✓
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Сумма по приборам:{" "}
                  <span className="font-mono font-semibold text-white">
                    {totalCalibrated.toFixed(1)} кВт·ч
                  </span>{" "}
                  = Квитанция:{" "}
                  <span className="font-mono font-semibold text-white">
                    {receipt.totalKwh} кВт·ч
                  </span>{" "}
                  (k_calib = {receipt.calibrationCoef?.toFixed(3)})
                </p>
              </div>
            </div>

            <Link href={`/dashboard/${receipt.id}/simulate`}>
              <Button size="sm" className="w-full whitespace-nowrap sm:w-auto">
                <Sliders className="mr-1.5 h-4 w-4" />
                Симулятор &quot;Что если&quot;
              </Button>
            </Link>
          </div>

          {/* Charts & Breakdown Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Visual Chart */}
            <div className="space-y-6 lg:col-span-5">
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChartIcon className="h-4 w-4 text-orange-400" />
                    Доли приборов в общем счёте
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-[300px] flex-1 flex-col items-center justify-center">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="kwh"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          innerRadius={55}
                          paddingAngle={3}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              stroke="#0f172a"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="space-y-1 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                                  <p className="font-bold text-white">
                                    {data.name}
                                  </p>
                                  <p className="font-mono font-semibold text-orange-400">
                                    {data.kwh} кВт·ч ({data.percentage}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 grid w-full grid-cols-2 gap-2 border-t border-slate-800 pt-4 text-xs">
                    {chartData.map((d, idx) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 truncate"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                        <span className="truncate text-slate-300">
                          {d.name}
                        </span>
                        <span className="ml-auto font-mono font-medium text-slate-400">
                          {d.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Cards with Priority Indicators */}
            <div className="space-y-4 lg:col-span-7">
              <h3 className="flex items-center justify-between text-base font-bold text-white">
                <span>Рейтинг приборов по потреблению</span>
                <span className="text-xs font-normal text-slate-400">
                  Всего приборов: {estimates.length}
                </span>
              </h3>

              <div className="space-y-3.5">
                {estimates.map((est, idx) => {
                  const cfg = PRIORITY_CONFIG[est.priority];
                  const percentOfTotal = (
                    (est.calibratedKwh / (receipt.totalKwh || 1)) *
                    100
                  ).toFixed(1);
                  const approxCost =
                    est.calibratedKwh *
                    (receipt.tariffRate ||
                      receipt.totalAmount / receipt.totalKwh);

                  return (
                    <Card
                      key={est.id}
                      className="border-slate-800/80 bg-slate-900/70 p-5 transition-all hover:border-slate-700"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-500">
                              #{idx + 1}
                            </span>
                            <h4 className="text-base font-bold text-white">
                              {est.appliance.name}
                            </h4>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.bg} ${cfg.border} ${cfg.text}`}
                            >
                              {cfg.badge}
                            </span>
                          </div>

                          <p className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{est.appliance.ratedPowerWatts} Вт</span>
                            <span>•</span>
                            <span>{est.hoursPerDay} ч/сутки</span>
                            <span>•</span>
                            <span>
                              Duty: {(est.dutyCycle * 100).toFixed(0)}%
                            </span>
                          </p>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="font-mono text-lg font-bold text-white">
                            {est.calibratedKwh.toFixed(1)}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              кВт·ч
                            </span>
                          </p>
                          <p className="font-mono text-xs font-semibold text-amber-400">
                            ~{approxCost.toFixed(0)} ₸/₽ ({percentOfTotal}%)
                          </p>
                        </div>
                      </div>

                      {/* Progress bar of share */}
                      <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentOfTotal}%`,
                            backgroundColor: cfg.color,
                          }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
