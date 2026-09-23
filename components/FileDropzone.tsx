"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "./Toast";

export const ALLOWED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface FileDropzoneProps {
  onFileSelected: (base64: string, file: File) => void;
  onFileCleared?: () => void;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
}

export function FileDropzone({
  onFileSelected,
  onFileCleared,
  disabled = false,
  label = "Перетащите фото или PDF сюда",
  sublabel = "Поддерживаются JPG, PNG, WEBP, PDF до 10 МБ",
}: FileDropzoneProps) {
  const { error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateAndProcessFile = (file: File) => {
    // 1. Format check
    if (!ALLOWED_FORMATS.includes(file.type)) {
      toastError("Поддерживаются только JPG, PNG, WEBP или PDF");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Size check
    if (file.size > MAX_SIZE_BYTES) {
      toastError("Файл слишком большой, максимум 10 МБ");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 3. Process base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(base64String);
      } else {
        setPreviewUrl(null);
      }
      onFileSelected(base64String, file);
    };
    reader.onerror = () => {
      toastError("Ошибка при чтении файла");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onFileCleared) onFileCleared();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            disabled
              ? "pointer-events-none border-slate-800 bg-slate-950/40 opacity-50"
              : isDragOver
                ? "scale-[1.01] border-orange-500 bg-orange-500/10"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 transition-transform group-hover:scale-110">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-100">{label}</p>
              <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
            </div>
            <button
              type="button"
              className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              Выбрать файл на диске
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="flex items-center gap-3.5 overflow-hidden">
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt="Предпросмотр"
                className="h-14 w-14 shrink-0 rounded-xl border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/15 text-orange-400">
                <FileText className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ •{" "}
                {selectedFile.type
                  .toUpperCase()
                  .replace("APPLICATION/", "")
                  .replace("IMAGE/", "")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Удалить файл"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
