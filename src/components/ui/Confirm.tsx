"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { GlassCard } from "./GlassCard";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

const ConfirmCtx = createContext<(opts: ConfirmOptions | string) => Promise<boolean>>(async () => false);

export function useConfirm() {
  return useContext(ConfirmCtx);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized = typeof opts === "string" ? { message: opts } : opts;
    setState(normalized);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function handle(result: boolean) {
    setState(null);
    resolver.current?.(result);
    resolver.current = null;
  }

  const danger = state?.danger !== false;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s]"
            onClick={() => handle(false)}
          />
          <GlassCard
            strong
            className="relative z-10 w-full max-w-sm rounded-4xl p-6 text-center animate-scale-in"
          >
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                danger ? "bg-accent-pink/15 text-accent-pink" : "bg-accent/15 text-accent"
              }`}
            >
              {danger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
            </div>
            {state.title && <h3 className="mb-1.5 text-base font-semibold text-white">{state.title}</h3>}
            <p className="mb-6 text-sm text-white/60">{state.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handle(false)}
                className="flex-1 rounded-2xl glass-pill px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {state.cancelLabel || "Batal"}
              </button>
              <button
                onClick={() => handle(true)}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-glow transition hover:brightness-110 ${
                  danger ? "bg-accent-pink" : "bg-gradient-to-b from-accent to-[#0066CC]"
                }`}
              >
                {state.confirmLabel || "Ya, Lanjutkan"}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
