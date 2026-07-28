import type { SessionPayload } from "./auth";

export function isSuperadmin(session: SessionPayload | null) {
    return session?.role === "SUPERADMIN";
}

export function canManageDivision(session: SessionPayload | null, divisionId?: string | null) {
    if (!session) return false;
    if (session.role === "SUPERADMIN") return true;
    if (session.role === "DIVISION_HEAD" && session.divisionId === divisionId) return true;
    return false;
}

export function canViewDivision(session: SessionPayload | null, divisionId?: string | null) {
    if (!session) return false;
    if (session.role === "SUPERADMIN") return true;
    return session.divisionId === divisionId;
}
