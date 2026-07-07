import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/adminAuth";

export async function POST() {
  try {
    await destroyAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ADMIN LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
      },
      {
        status: 500,
      }
    );
  }
}