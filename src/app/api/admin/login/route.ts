import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (
      email !== adminEmail ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    await createAdminSession();

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}