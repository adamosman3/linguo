import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  const entries = await prisma.translationMemory.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return NextResponse.json(entries);
}

export async function DELETE(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { id } = body;

    if (id) {
      await prisma.translationMemory.delete({ where: { id } });
    } else {
      await prisma.translationMemory.deleteMany();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting TM entry:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
