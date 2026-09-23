import React from "react";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  helperText?: string;
  colorScheme?: "orange" | "emerald" | "sky";
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  helperText,
  colorScheme = "orange",
}: SliderProps) {
  const accentClass = {
    orange: "accent-orange-500",
    emerald: "accent-emerald-500",
    sky: "accent-sky-500",
  }[colorScheme];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </span>
        <span className="rounded border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 font-mono text-sm font-bold text-orange-400">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 ${accentClass}`}
      />

      <div className="flex justify-between font-mono text-[11px] text-slate-500">
        <span>
          {min} {unit}
        </span>
        {helperText && <span className="text-slate-400">{helperText}</span>}
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
