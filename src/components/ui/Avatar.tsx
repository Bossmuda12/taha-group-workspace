"use client";
import { useState } from "react";
import { initials } from "@/lib/utils";

// Avatar dengan fallback ke inisial + warna kalau avatarUrl kosong ATAU gagal
// dimuat (mis. file lama yang sudah hilang dari storage). Tanpa fallback ini,
// <img> dengan src rusak akan menampilkan ikon gambar patah bertanda "?".
export function Avatar({
  avatarUrl,
  fullName,
  avatarColor = "#0A84FF",
  className = "h-8 w-8",
  textClassName = "text-xs",
}: {
  avatarUrl?: string | null;
  fullName: string;
  avatarColor?: string;
  className?: string;
  textClassName?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (avatarUrl && !broken) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={`${className} rounded-full object-cover`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full font-bold text-white ${textClassName}`}
      style={{ background: avatarColor }}
    >
      {initials(fullName)}
    </div>
  );
}
