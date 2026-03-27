import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { hashPassword } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
