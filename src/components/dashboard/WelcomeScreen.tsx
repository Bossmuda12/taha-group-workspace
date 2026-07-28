"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export function WelcomeScreen({ fullName }: { fullName: string }) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("taha_welcome_shown");
    if (shown) return;
    setVisible(true);
    sessionStorage.setItem("taha_welcome_shown", "1");
    const t1 = setTimeout(() => setFadeOut(true), 2200);
    const t2 = setTimeout(() => setVisible(false), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#05060A] transition-opacity duration-700 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <div className="aurora-bg" />
      <div className="animate-fade-up relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl glass-strong shadow-glow overflow-hidden">
          <Image src="/logo-mark.svg" alt="Taha Group" width={40} height={40} />
        </div>
        <h1 className="text-2xl font-semibold text-gradient sm:text-4xl">Selamat Datang di Taha Workspace</h1>
        <p className="mt-3 text-white/50">Halo, {fullName} 👋</p>
      </div>
    </div>
  );
}
