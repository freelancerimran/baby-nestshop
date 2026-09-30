import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const module = searchParams.get("module");
    const action = searchParams.get("action");

    if (!module || !action) {
      return NextResponse.json(
        {
          success: false,
          message: "Module and action are required.",
        },
        {
          status: 400,
        }
      );
    }

    const allowed = await hasPermission(
      module,
      action
    );

    return NextResponse.json({
      success: true,
      allowed,
    });
  } catch (error) {
    console.error(
      "PERMISSION CHECK API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        allowed: false,
        message: "Permission check failed.",
      },
      {
        status: 500,
      }
    );
  }
}