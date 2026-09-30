import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type AuditLogInput = {
  request?: NextRequest;
  action: string;
  module: string;
  targetType: string;
  targetId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog({
  request,
  action,
  module,
  targetType,
  targetId,
  description,
  metadata = {},
}: AuditLogInput): Promise<boolean> {
  try {
    /*
    ========================================
    GET CURRENT AUTHENTICATED USER
    ========================================
    */

    const supabase =
      await createSupabaseServerClient();

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    /*
    ========================================
    REQUEST INFORMATION
    ========================================
    */

    const forwardedFor =
      request?.headers.get(
        "x-forwarded-for"
      );

    const realIp =
      request?.headers.get(
        "x-real-ip"
      );

    const ipAddress =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ||
      realIp ||
      null;

    const userAgent =
      request?.headers.get(
        "user-agent"
      ) || null;

    /*
    ========================================
    INSERT AUDIT LOG
    ========================================
    */

    const {
      error,
    } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id:
          user?.id || null,

        action,

        module,

        target_type:
          targetType,

        target_id:
          targetId,

        description,

        metadata,

        ip_address:
          ipAddress,

        user_agent:
          userAgent,
      });

    if (error) {
      console.error(
        "AUDIT LOG INSERT ERROR:",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "AUDIT LOG ERROR:",
      error
    );

    return false;
  }
}