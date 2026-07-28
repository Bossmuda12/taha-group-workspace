"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const GREETINGS = [
  "Selamat Datang",
  "Welcome",
  "ようこそ",
  "환영합니다",
  "أهلا وسهلا",
  "Bienvenue",
];

export function WelcomeScreen({ fullName }: { fullName: string }) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [greetIndex, setGreetIndex] = useState(0);

  useEffect(() => {
    const shown = sessionStorage.getItem("taha_welcome_shown");
    if (shown) return;
    setVisible(true);
    sessionStorage.setItem("taha_welcome_shown", "1");

    const cycle = setInterval(() => setGreetIndex((i) => (i + 1) % GREETINGS.length), 450);
    const t1 = setTimeout(() => setPhase(1), 2700);
    const t2 = setTimeout(() => {
      clearInterval(cycle);
      setPhase(2);
    }, 3400);
    const t3 = setTimeout(() => setVisible(false), 4000);

    return () => {
      clearInterval(cycle);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#05060A] transition-opacity duration-700 ${
        phase === 2 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="aurora-bg" />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {phase === 0 && (
          <p key={greetIndex} className="animate-scale-in text-4xl font-semibold text-white sm:text-6xl">
            {GREETINGS[greetIndex]}
          </p>
        )}
        {phase >= 1 && (
          <div className="animate-fade-up flex flex-col items-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl glass-strong shadow-glow">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-2xl font-semibold text-gradient sm:text-4xl">
              Selamat Datang di Taha Group Work Space
            </h1>
            <p className="mt-3 text-white/50">Halo, {fullName} 👋</p>
          </div>
        )}
      </div>
    </div>
  );
}
