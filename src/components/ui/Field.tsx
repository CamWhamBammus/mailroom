import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlStyles =
  "w-full rounded-md border border-walnut-500/25 bg-parchment-paper px-3 py-2 text-sm text-charcoal-800 placeholder:text-charcoal-600/40 transition-colors focus:border-moss-500 focus:outline-none";

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-canopy-900">
        {label}
        {required && <span className="text-clay-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-charcoal-600/70">{hint}</span>}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlStyles, className)} {...props} />
  )
);
TextInput.displayName = "TextInput";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlStyles, "resize-none", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlStyles, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";
