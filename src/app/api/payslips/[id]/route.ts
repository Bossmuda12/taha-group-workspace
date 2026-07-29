import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isManagementAccountingOrFounder } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await isManagementAccountingOrFounder(session);
    if (!allowed) {
          return NextResponse.json({ error: "Hanya Management Accounting/Founder yang bisa mengubah slip gaji" }, { status: 403 });
    }

  const existing = await prisma.payslip.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });

  const body = await req.json();
    const { userId, period, baseSalary, bonus, deduction } = body;
    const data: any = {};
    if (userId) data.userId = userId;
    if (period) data.period = period;
    if (baseSalary !== undefined) data.baseSalary = Number(baseSalary) || 0;
    if (bonus !== undefined) data.bonus = Number(bonus) || 0;
    if (deduction !== undefined) data.deduction = Number(deduction) || 0;

  const base = data.baseSalary ?? existing.baseSalary;
    const bns = data.bonus ?? existing.bonus;
    const ded = data.deduction ?? existing.deduction;
    data.total = base + bns - ded;

  const updated = await prisma.payslip.update({ where: { id: params.id }, data, include: { user: true } });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await isManagementAccountingOrFounder(session);
    if (!allowed) {
          return NextResponse.json({ error: "Hanya Management Accounting/Founder yang bisa menghapus slip gaji" }, { status: 403 });
    }

  await prisma.payslip.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
}
