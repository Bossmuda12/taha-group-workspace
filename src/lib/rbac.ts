import type { SessionPayload } from "./auth";
import { sessionDivisionIds } from "./auth";

export function isSuperadmin(session: SessionPayload | null) {
  return session?.role === "SUPERADMIN";
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
