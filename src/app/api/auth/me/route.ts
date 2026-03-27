import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "active") {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
