"use client";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileNav({
  open,
  onClose,
  role,
  divisionName,
  secondDivisionName,
}: {
  open: boolean;
  onClose: () => void;
  role: string;
  divisionName: string | null;
  secondDivisionName?: string | null;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 p-3">
        <button onClick={onClose} className="absolute right-1 top-1 z-10 rounded-full p-2 text-white/60">
          <X className="h-4 w-4" />
        </button>
        <div className="relative h-full [&>aside]:relative [&>aside]:inset-0 [&>aside]:flex [&>aside]:h-full">
          <Sidebar role={role} divisionName={divisionName} secondDivisionName={secondDivisionName} />
        </div>
      </div>
    </div>
  );
}
