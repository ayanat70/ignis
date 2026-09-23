"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Zap,
  CreditCard,
  Percent,
} from "lucide-react";
import { Button } from "@/components/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { FileDropzone } from "@/components/FileDropzone";
import { useToast } from "@/components/Toast";

const MONTH_OPTIONS = [
  { value: "1", label: "01 — Январь" },
  { value: "2", label: "02 — Февраль" },
  { value: "3", label: "03 — Март" },
  { value: "4", label: "04 — Апрель" },
  { value: "5", label: "05 — Май" },
  { value: "6", label: "06 — Июнь" },
  { value: "7", label: "07 — Июль" },
  { value: "8", label: "08 — Август" },
  { value: "9", label: "09 — Сентябрь" },
  { value: "10", label: "10 — Октябрь" },
  { value: "11", label: "11 — Ноябрь" },
  { value: "12", label: "12 — Декабрь" },
];

export default function AddReceiptPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    periodMonth: String(currentMonth),
    periodYear: String(currentYear),
    totalKwh: "",
    totalAmount: "",
    tariffRate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Photo Analysis handler
  const handlePhotoSelected = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/receipts/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось распознать квитанцию");
      }

      setFormData({
        periodMonth: String(data.periodMonth || currentMonth),
        periodYear: String(data.periodYear || currentYear),
        totalKwh: data.totalKwh ? String(data.totalKwh) : "",
        totalAmount: data.totalAmount ? String(data.totalAmount) : "",
        tariffRate: data.tariffRate ? String(data.tariffRate) : "",
      });

      toastSuccess(
        "Квитанция успешно распознана! Проверьте данные и нажмите «Сохранить»."
      );
    } catch (err: any) {
      toastError(
        err.message ||
          "Не удалось распознать данные с фото, попробуйте более чёткое изображение или введите данные вручную"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Save Receipt handler
  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const month = parseInt(formData.periodMonth, 10);
    const year = parseInt(formData.periodYear, 10);
    const kwh = parseFloat(formData.totalKwh);
    const amount = parseFloat(formData.totalAmount);
    const rate = formData.tariffRate ? parseFloat(formData.tariffRate) : null;

    if (!month || month < 1 || month > 12) {
      newErrors.periodMonth = "Укажите корректный месяц (1-12)";
    }
    if (!year || year < 2000 || year > 2100) {
      newErrors.periodYear = "Укажите корректный год";
    }
    if (isNaN(kwh) || kwh <= 0) {
      newErrors.totalKwh = "Расход (кВт·ч) должен быть больше нуля";
    }
    if (isNaN(amount) || amount < 0) {
      newErrors.totalAmount = "Сумма к оплате должна быть неотрицательной";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toastError("Проверьте введённые данные в форме");
      return;
    }
    setErrors({});
    setIsSaving(true);

    try {
      const payload = {
        periodMonth: month,
        periodYear: year,
        totalKwh: kwh,
        totalAmount: amount,
        tariffRate: rate && rate > 0 ? rate : amount / kwh,
      };

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка сохранения квитанции");
      }

      toastSuccess("Квитанция сохранена! Переходим к расчёту энергоаудита.");
      router.push(`/dashboard/${data.id}`);
    } catch (err: any) {
      toastError(err.message || "Ошибка при сохранении квитанции");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in mx-auto max-w-3xl space-y-8 duration-300">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Назад к списку
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Загрузка квитанции ЖКХ
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Загрузите фотографию или скан счёта за электроэнергию для
          автоматического считывания показателей.
        </p>
      </div>

      {/* Upload Box */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400/90">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>
              Загрузите фото бумажной квитанции или PDF-файл. Gemini AI
              автоматически определит расчётный месяц, объём кВт·ч, сумму и
              тариф.
            </span>
          </div>

          <FileDropzone
            onFileSelected={handlePhotoSelected}
            disabled={isAnalyzing || isSaving}
            label="Перетащите счёт за электричество (JPG, PNG, WEBP, PDF)"
            sublabel="Максимум 10 МБ. Чёткий кадр таблицы расчётов"
          />

          {isAnalyzing && (
            <div className="flex animate-pulse items-center justify-center gap-3 rounded-xl border border-orange-500/30 bg-slate-950/80 p-4 text-sm text-orange-400">
              <Sparkles className="h-5 w-5 animate-spin" />
              <span>
                Gemini AI распознаёт реквизиты и цифры из квитанции...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-400" />
            Данные квитанции
          </CardTitle>
          <CardDescription>
            Вы можете скорректировать распознанные значения или внести их
            вручную
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveReceipt} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Расчётный месяц *"
                options={MONTH_OPTIONS}
                value={formData.periodMonth}
                onChange={(e) =>
                  setFormData({ ...formData, periodMonth: e.target.value })
                }
                error={errors.periodMonth}
                disabled={isSaving}
              />

              <Input
                label="Расчётный год *"
                type="number"
                placeholder={String(currentYear)}
                value={formData.periodYear}
                onChange={(e) =>
                  setFormData({ ...formData, periodYear: e.target.value })
                }
                error={errors.periodYear}
                disabled={isSaving}
              />

              <Input
                label="Фактический расход (кВт·ч) *"
                type="number"
                step="0.01"
                placeholder="450.5"
                value={formData.totalKwh}
                onChange={(e) =>
                  setFormData({ ...formData, totalKwh: e.target.value })
                }
                error={errors.totalKwh}
                helperText="Общий объём электроэнергии за месяц"
                disabled={isSaving}
              />

              <Input
                label="Сумма к оплате *"
                type="number"
                step="0.01"
                placeholder="12800"
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, totalAmount: e.target.value })
                }
                error={errors.totalAmount}
                helperText="Итого к начислению по квитанции"
                disabled={isSaving}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Тариф за 1 кВт·ч (необязательно)"
                  type="number"
                  step="0.001"
                  placeholder="28.41"
                  value={formData.tariffRate}
                  onChange={(e) =>
                    setFormData({ ...formData, tariffRate: e.target.value })
                  }
                  helperText="Если не указан, рассчитается автоматически как Сумма / кВт·ч"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <Link href="/">
                <Button variant="ghost" type="button" disabled={isSaving}>
                  Отмена
                </Button>
              </Link>

              <Button
                type="submit"
                isLoading={isSaving}
                disabled={isSaving || isAnalyzing}
                className="min-w-[160px]"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Сохранить квитанцию
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
