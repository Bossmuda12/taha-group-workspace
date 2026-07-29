"use client";
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
        <Sidebar
          role={role}
          divisionName={divisionName}
          secondDivisionName={secondDivisionName}
          mobile
          onNavigate={onClose}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
