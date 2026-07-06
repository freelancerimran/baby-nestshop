import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
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
  request: Request
) {
  const body = await request.json();

  const {
    facebook_pixel_id,
    facebook_access_token,
  } = body;

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

  return NextResponse.json({
    success: true,
  });
}