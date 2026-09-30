import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

import { hasPermission } from "@/lib/permissions";

import { writeAuditLog } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const allowed = await hasPermission(
    "settings",
    "view"
  );

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "You do not have permission to view settings.",
      },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("settings")
    .select(
      "facebook_pixel_id, facebook_access_token"
    )
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest
) {
  const allowed = await hasPermission(
    "settings",
    "edit"
  );

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "You do not have permission to edit settings.",
      },
      { status: 403 }
    );
  }

  let body: {
    facebook_pixel_id?: string | null;
    facebook_access_token?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const {
    facebook_pixel_id,
    facebook_access_token,
  } = body;

  const {
    data: previousSettings,
    error: previousError,
  } = await supabase
    .from("settings")
    .select(
      "id, facebook_pixel_id, facebook_access_token"
    )
    .eq("id", 1)
    .maybeSingle();

  if (previousError) {
    return NextResponse.json(
      { error: previousError.message },
      { status: 500 }
    );
  }

  if (!previousSettings) {
    return NextResponse.json(
      {
        success: false,
        error: "Settings record not found.",
      },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("settings")
    .update({
      facebook_pixel_id,
      facebook_access_token,
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const auditLogged = await writeAuditLog({
    request,
    action: "update_facebook_pixel",
    module: "settings",
    targetType: "settings",
    targetId: "1",
    description:
      "Facebook Pixel settings were updated.",
    metadata: {
      settings_id: 1,
      previous: {
        facebook_pixel_id:
          previousSettings.facebook_pixel_id,
        facebook_access_token:
          previousSettings.facebook_access_token
            ? "[REDACTED]"
            : null,
      },
      updated: {
        facebook_pixel_id,
        facebook_access_token:
          facebook_access_token
            ? "[REDACTED]"
            : null,
      },
    },
  });

  return NextResponse.json({
    success: true,
    auditLogged,
  });
}
