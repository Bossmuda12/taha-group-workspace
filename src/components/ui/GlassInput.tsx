"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";

export const GlassInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl glass-pill px-4 py-3 text-sm text-white placeholder:text-white/40",
        "outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40 transition-all",
        className
      )}
      {...props}
    />
  )
);
GlassInput.displayName = "GlassInput";

export function GlassLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50" {...props} />;
}

export const GlassSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-2xl glass-pill px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent/60 transition-all",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
GlassSelect.displayName = "GlassSelect";

export const GlassTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-2xl glass-pill px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-accent/60 transition-all",
        className
      )}
      {...props}
    />
  )
);
GlassTextarea.displayName = "GlassTextarea";
