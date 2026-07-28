import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const products = await prisma.product.findMany({ include: { division: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, sku, price, divisionId } = await req.json();
  if (!name) return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      name,
      sku: sku || null,
      price: price ? Number(price) : 0,
      divisionId: divisionId || null,
      isCustom: session.role !== "SUPERADMIN",
    },
  });
  return NextResponse.json(product);
}
