import type { SessionPayload } from "./auth";
import { sessionDivisionIds } from "./auth";
import { prisma } from "./prisma";

export function isSuperadmin(session: SessionPayload | null) {
  return session?.role === "SUPERADMIN";
}

// Founder atau karyawan divisi Management Accounting (termasuk typo seed "Acounting")
// yang boleh mengelola modul Slip Gaji.
export async function isManagementAccountingOrFounder(session: {
  role: string;
  divisionId: string | null;
  secondDivisionId?: string | null;
}) {
  if (session.role === "SUPERADMIN") return true;
  const divisionIds = sessionDivisionIds(session);
  if (divisionIds.length === 0) return false;
  const divisions = await prisma.division.findMany({ where: { id: { in: divisionIds } } });
  return divisions.some((d) => d.name?.toLowerCase().includes("counting"));
}

export function canManageDivision(session: SessionPayload | null, divisionId?: string | null) {
  if (!session) return false;
  if (session.role === "SUPERADMIN") return true;
  if (session.role === "DIVISION_HEAD" && divisionId && sessionDivisionIds(session).includes(divisionId)) return true;
  return false;
}

export function canViewDivision(session: SessionPayload | null, divisionId?: string | null) {
  if (!session) return false;
  if (session.role === "SUPERADMIN") return true;
  return !!divisionId && sessionDivisionIds(session).includes(divisionId);
}
