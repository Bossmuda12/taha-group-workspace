"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };
const ToastCtx = createContext<(msg: string, type?: Toast["type"]) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const colors = { success: "text-accent-green", error: "text-accent-pink", info: "text-accent" };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "glass-strong pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white shadow-glass animate-fade-up"
              )}
            >
              <Icon className={cn("h-4 w-4", colors[t.type])} />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
