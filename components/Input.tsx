import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
            error
              ? "border-rose-500/80 focus:ring-rose-500/50"
              : "border-slate-800 focus:border-orange-500/60"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
