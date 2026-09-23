"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Search,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowLeft,
  Info,
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

const CATEGORY_OPTIONS = [
  { value: "cooling", label: "Кондиционер / Климат (cooling)" },
  { value: "heating", label: "Обогреватель / Отопление (heating)" },
  { value: "fridge", label: "Холодильник / Морозильник (fridge)" },
  { value: "washing", label: "Стиральная машина (washing)" },
  { value: "dishwasher", label: "Посудомоечная машина (dishwasher)" },
  {
    value: "water_heating",
    label: "Бойлер / Нагреватель воды (water_heating)",
  },
  { value: "lighting", label: "Освещение (lighting)" },
  { value: "router", label: "Wi-Fi роутер / Сеть (router)" },
  { value: "security", label: "Камеры / Безопасность (security)" },
  { value: "other", label: "Другое (other)" },
];

export default function AddAppliancePage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"photo" | "model">("photo");
  const [modelQuery, setModelQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable Form State
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    ratedPowerWatts: "",
    category: "cooling",
    source: "MANUAL" as "PHOTO_LABEL" | "MODEL_NAME" | "MANUAL",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Photo Analysis handler
  const handlePhotoSelected = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/appliances/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось распознать шильдик");
      }

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || "",
        model: data.model || "",
        ratedPowerWatts: String(data.ratedPowerWatts || ""),
        source: "PHOTO_LABEL",
      }));

      toastSuccess("Шильдик успешно распознан AI! Проверьте данные формы.");
    } catch (err: any) {
      toastError(
        err.message ||
          "Не удалось распознать данные с фото, попробуйте более чёткое изображение или введите данные вручную"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Model Lookup handler
  const handleModelLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelQuery.trim()) {
      toastError("Введите название или модель прибора");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/appliances/lookup-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName: modelQuery.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка поиска модели");
      }

      setFormData((prev) => ({
        ...prev,
        name: data.name || modelQuery.trim(),
        brand: data.brand || "",
        ratedPowerWatts: String(data.ratedPowerWatts || ""),
        source: "MODEL_NAME",
      }));

      toastSuccess("Характеристики модели найдены в базе данных!");
    } catch (err: any) {
      toastError(
        err.message ||
          "Не удалось найти характеристики прибора, попробуйте уточнить название"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Save Appliance handler
  const handleSaveAppliance = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Укажите название прибора";
    }

    const watts = Number(formData.ratedPowerWatts);
    if (!formData.ratedPowerWatts || isNaN(watts) || watts <= 0) {
      newErrors.ratedPowerWatts =
        "Мощность должна быть положительным числом (Вт)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toastError("Заполните обязательные поля формы");
      return;
    }
    setErrors({});
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        category: formData.category,
        ratedPowerWatts: watts,
        source: formData.source,
      };

      const res = await fetch("/api/appliances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка сохранения прибора");
      }

      toastSuccess(`Прибор "${data.name}" успешно добавлен!`);

      // Reset form
      setFormData({
        name: "",
        brand: "",
        model: "",
        ratedPowerWatts: "",
        category: "cooling",
        source: "MANUAL",
      });
      setModelQuery("");

      // Redirect to homepage after brief moment
      router.push("/");
    } catch (err: any) {
      toastError(err.message || "Ошибка при сохранении прибора в БД");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in mx-auto max-w-3xl space-y-8 duration-300">
      {/* Top back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Назад к списку
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Добавление электроприбора
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Распознайте паспортные характеристики автоматически с помощью Gemini
          AI или введите вручную.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-2xl border border-slate-800 bg-slate-900 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("photo")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            activeTab === "photo"
              ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Camera className="h-4 w-4" />
          Сфотографировать шильдик
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("model")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            activeTab === "model"
              ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Search className="h-4 w-4" />
          Ввести название модели
        </button>
      </div>

      {/* Input method panels */}
      <Card>
        <CardContent className="pt-6">
          {activeTab === "photo" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400/90">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>
                  Загрузите фото металлической наклейки (шильдика) с напряжением
                  и мощностью (Вт/W). AI автоматически заполнит форму ниже.
                </span>
              </div>

              <FileDropzone
                onFileSelected={handlePhotoSelected}
                disabled={isAnalyzing || isSaving}
                label="Перетащите фото шильдика (JPG, PNG, WEBP, PDF)"
                sublabel="Максимум 10 МБ. Чёткий кадр шильдика прибора"
              />

              {isAnalyzing && (
                <div className="flex animate-pulse items-center justify-center gap-3 rounded-xl border border-orange-500/30 bg-slate-950/80 p-4 text-sm text-orange-400">
                  <Sparkles className="h-5 w-5 animate-spin" />
                  <span>Gemini AI анализирует шильдик прибора...</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleModelLookup} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400/90">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>
                  Введите марку и модель (например: &quot;Daikin FTXN35M&quot;
                  или &quot;Холодильник Samsung NoFrost&quot;), и AI определит
                  мощность.
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Например: Samsung RB37J5000SA"
                    value={modelQuery}
                    onChange={(e) => setModelQuery(e.target.value)}
                    disabled={isAnalyzing || isSaving}
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isAnalyzing}
                  disabled={isAnalyzing || isSaving}
                  className="w-full sm:w-auto"
                >
                  <Search className="mr-1.5 h-4 w-4" />
                  Найти
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Editable Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-400" />
            Параметры прибора
          </CardTitle>
          <CardDescription>
            Проверьте и скорректируйте данные при необходимости перед
            сохранением
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveAppliance} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Отображаемое название *"
                  placeholder="Кондиционер спальня"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  disabled={isSaving}
                />
              </div>

              <Input
                label="Бренд / Производитель"
                placeholder="Daikin"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                disabled={isSaving}
              />

              <Input
                label="Модель"
                placeholder="FTXN35M"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                disabled={isSaving}
              />

              <Input
                label="Паспортная мощность (Вт) *"
                type="number"
                placeholder="1200"
                value={formData.ratedPowerWatts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ratedPowerWatts: e.target.value,
                  })
                }
                error={errors.ratedPowerWatts}
                helperText="Электрическая мощность прибора из паспорта"
                disabled={isSaving}
              />

              <Select
                label="Категория энергопотребления"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                helperText="Влияет на коэффициент гибкости расчёта"
                disabled={isSaving}
              />
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
                Сохранить прибор
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
