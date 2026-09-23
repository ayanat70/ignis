"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sliders,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Zap,
  DollarSign,
  Percent,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
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
import { calculateRawEstimate, getDaysInPeriod } from "@/lib/calculations";

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

export default function SimulatorPage() {
  const params = useParams();
  const receiptId = (params.receiptId || params.id) as string;
  const { error: toastError } = useToast();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [estimates, setEstimates] = useState<ApplianceEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client-side adjusted hours state: map applianceId -> hoursPerDay
  const [simulatedHours, setSimulatedHours] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/receipts/${receiptId}/breakdown`);
        if (!res.ok) throw new Error("Не удалось загрузить данные квитанции");
        const data = await res.json();
        setReceipt(data.receipt);
        setEstimates(data.estimates || []);

        // Initial hours match the current estimate
        const initialHours: Record<string, number> = {};
        (data.estimates || []).forEach((e: ApplianceEstimate) => {
          initialHours[e.applianceId] = e.hoursPerDay;
        });
        setSimulatedHours(initialHours);
      } catch (err: any) {
        toastError(err.message || "Ошибка загрузки симулятора");
      } finally {
        setIsLoading(false);
      }
    }
    if (receiptId) loadData();
  }, [receiptId, toastError]);

  // Days in this billing period
  const daysInPeriod = useMemo(() => {
    if (!receipt) return 30;
    return getDaysInPeriod(receipt.periodYear, receipt.periodMonth);
  }, [receipt]);

  const calibrationCoef = receipt?.calibrationCoef || 1.0;
  const tariffRate =
    receipt?.tariffRate ||
    (receipt && receipt.totalKwh > 0
      ? receipt.totalAmount / receipt.totalKwh
      : 25);

  // Pure client-side calculations: Live recalculation
  const simulationResults = useMemo(() => {
    if (!receipt || estimates.length === 0) {
      return {
        baselineKwh: 0,
        baselineAmount: 0,
        simulatedKwh: 0,
        simulatedAmount: 0,
        savedKwh: 0,
        savedMoney: 0,
        savingsPercent: 0,
        items: [],
      };
    }

    const baselineKwh = receipt.totalKwh;
    const baselineAmount = receipt.totalAmount;

    let simulatedKwhSum = 0;
    const items = estimates.map((est) => {
      const currentHours = simulatedHours[est.applianceId] ?? est.hoursPerDay;
      const rawKwh = calculateRawEstimate(
        est.appliance.ratedPowerWatts,
        currentHours,
        est.dutyCycle,
        daysInPeriod
      );
      const calibratedKwh = rawKwh * calibrationCoef;
      simulatedKwhSum += calibratedKwh;

      const diffKwh = est.calibratedKwh - calibratedKwh;
      const diffMoney = diffKwh * tariffRate;

      return {
        estimate: est,
        originalHours: est.hoursPerDay,
        simulatedHours: currentHours,
        originalKwh: est.calibratedKwh,
        simulatedKwh: calibratedKwh,
        diffKwh,
        diffMoney,
      };
    });

    const simulatedKwh = simulatedKwhSum;
    const simulatedAmount = simulatedKwh * tariffRate;
    const savedKwh = baselineKwh - simulatedKwh;
    const savedMoney = baselineAmount - simulatedAmount;
    const savingsPercent = baselineKwh > 0 ? (savedKwh / baselineKwh) * 100 : 0;

    return {
      baselineKwh,
      baselineAmount,
      simulatedKwh,
      simulatedAmount,
      savedKwh,
      savedMoney,
      savingsPercent,
      items,
    };
  }, [
    receipt,
    estimates,
    simulatedHours,
    daysInPeriod,
    calibrationCoef,
    tariffRate,
  ]);

  // Quick preset: Eco mode (reduce high consumption appliances by 30%)
  const applyEcoPreset = () => {
    const updated: Record<string, number> = {};
    estimates.forEach((e) => {
      if (e.priority === "RED" || e.priority === "ORANGE") {
        updated[e.applianceId] = parseFloat(
          Math.max(1, e.hoursPerDay * 0.7).toFixed(1)
        );
      } else {
        updated[e.applianceId] = e.hoursPerDay;
      }
    });
    setSimulatedHours(updated);
  };

  // Quick preset: Reset
  const resetToBaseline = () => {
    const reset: Record<string, number> = {};
    estimates.forEach((e) => {
      reset[e.applianceId] = e.hoursPerDay;
    });
    setSimulatedHours(reset);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Sparkles className="h-8 w-8 animate-spin text-orange-400" />
        <p className="text-sm text-slate-400">Инициализация симулятора...</p>
      </div>
    );
  }

  if (!receipt || estimates.length === 0) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg text-slate-300">
          Для этой квитанции ещё не выполнен расчёт.
        </p>
        <Link href={`/dashboard/${receiptId}`}>
          <Button>Перейти к расчёту</Button>
        </Link>
      </div>
    );
  }

  const isSaving = simulationResults.savedMoney > 0;

  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href={`/dashboard/${receipt.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад к декомпозиции
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Интерактивный симулятор &quot;Что если&quot;
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Меняйте время работы приборов и наблюдайте мгновенный пересчёт
            экономии без обращения к серверу.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToBaseline}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Сбросить
          </Button>
          <Button
            size="sm"
            onClick={applyEcoPreset}
            className="border-emerald-500/30 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Эко-режим (-30% на пиковых)
          </Button>
        </div>
      </div>

      {/* Comparison: Было vs Стало Summary Banner */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Baseline Card */}
        <Card className="border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Фактически (Было)
          </span>
          <div className="mt-2 space-y-1">
            <p className="font-mono text-3xl font-extrabold text-white">
              {simulationResults.baselineKwh.toFixed(1)}{" "}
              <span className="text-sm font-normal text-slate-400">кВт·ч</span>
            </p>
            <p className="font-mono text-sm text-slate-400">
              {simulationResults.baselineAmount.toLocaleString("ru-RU", {
                maximumFractionDigits: 0,
              })}{" "}
              ₸/₽ (по квитанции)
            </p>
          </div>
        </Card>

        {/* Simulated Card */}
        <Card className="border-orange-500/30 bg-orange-950/20 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
            Смоделировано (Стало)
          </span>
          <div className="mt-2 space-y-1">
            <p className="font-mono text-3xl font-extrabold text-orange-300">
              {simulationResults.simulatedKwh.toFixed(1)}{" "}
              <span className="text-sm font-normal text-slate-400">кВт·ч</span>
            </p>
            <p className="font-mono text-sm text-orange-400/80">
              ~
              {simulationResults.simulatedAmount.toLocaleString("ru-RU", {
                maximumFractionDigits: 0,
              })}{" "}
              ₸/₽ (новый прогноз)
            </p>
          </div>
        </Card>

        {/* Net Delta Card */}
        <Card
          className={`border p-5 transition-all ${
            isSaving
              ? "border-emerald-500/40 bg-emerald-950/30 shadow-lg shadow-emerald-950/20"
              : "border-slate-800 bg-slate-900/60"
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isSaving ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {isSaving ? "Ваша потенциальная экономия" : "Изменение счёта"}
          </span>
          <div className="mt-2 space-y-1">
            <p
              className={`flex items-center gap-1.5 font-mono text-3xl font-extrabold ${
                isSaving ? "text-emerald-400" : "text-slate-200"
              }`}
            >
              {isSaving ? (
                <ArrowDownRight className="h-7 w-7 shrink-0" />
              ) : (
                <ArrowUpRight className="h-7 w-7 shrink-0 text-amber-400" />
              )}
              {Math.abs(simulationResults.savedMoney).toLocaleString("ru-RU", {
                maximumFractionDigits: 0,
              })}{" "}
              <span className="text-base font-normal">₸/₽</span>
            </p>
            <p className="font-mono text-sm text-slate-300">
              {isSaving ? "Минус" : "Плюс"}{" "}
              {Math.abs(simulationResults.savedKwh).toFixed(1)} кВт·ч (
              {simulationResults.savingsPercent > 0 ? "-" : "+"}
              {Math.abs(simulationResults.savingsPercent).toFixed(1)}%)
            </p>
          </div>
        </Card>
      </div>

      {/* Interactive Appliance Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-orange-400" />
              Регулировка режимов эксплуатации
            </span>
            <span className="text-xs font-normal text-slate-400">
              Тариф: {tariffRate.toFixed(2)} ₸/кВт·ч
            </span>
          </CardTitle>
          <CardDescription>
            Двигайте ползунки, чтобы смоделировать изменение привычек (например,
            выключение кондиционера на ночь или таймер стирки)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {simulationResults.items.map((item) => {
              const maxSlider = Math.max(
                12,
                Math.min(24, Math.ceil(item.originalHours * 1.5))
              );
              const est = item.estimate;
              const isReduced = item.simulatedHours < item.originalHours;
              const isIncreased = item.simulatedHours > item.originalHours;

              return (
                <div
                  key={est.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isReduced
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : isIncreased
                        ? "border-amber-500/30 bg-amber-950/10"
                        : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">
                          {est.appliance.name}
                        </h4>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {est.priority}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Паспортная мощность: {est.appliance.ratedPowerWatts} Вт
                        • Исходно: {item.originalHours} ч/сутки
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-bold text-white">
                        {item.simulatedKwh.toFixed(1)} кВт·ч
                      </p>
                      {item.diffMoney !== 0 && (
                        <p
                          className={`font-mono text-xs font-semibold ${
                            item.diffMoney > 0
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {item.diffMoney > 0 ? "Экономия: -" : "+"}
                          {Math.abs(item.diffMoney).toFixed(0)} ₸/₽
                        </p>
                      )}
                    </div>
                  </div>

                  <Slider
                    label="Время работы"
                    value={item.simulatedHours}
                    min={0}
                    max={maxSlider}
                    step={0.5}
                    unit="ч/сутки"
                    onChange={(val) =>
                      setSimulatedHours((prev) => ({
                        ...prev,
                        [est.applianceId]: val,
                      }))
                    }
                  />

                  {/* Visual micro comparison bar */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono text-[11px] text-slate-400">
                    <span>Было: {item.originalKwh.toFixed(1)} кВт·ч</span>
                    <span
                      className={
                        isReduced
                          ? "font-semibold text-emerald-400"
                          : isIncreased
                            ? "font-semibold text-amber-400"
                            : ""
                      }
                    >
                      Стало: {item.simulatedKwh.toFixed(1)} кВт·ч
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
