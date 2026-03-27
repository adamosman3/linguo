import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "edge";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || "translator",
      },
    });

    // Send welcome email (non-blocking — don't fail user creation if email fails)
    if (process.env.RESEND_API_KEY) {
      sendWelcomeEmail({ name, email, role: role || "translator" })
        .then((result) => {
          if (!result.success) {
            console.warn(`Welcome email failed for ${email}:`, result.error);
          }
        })
        .catch((err) => console.warn("Welcome email error:", err));
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
