import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*");

    if (error) {
      console.error("Settings GET Error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data?.[0] || null,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {

    const body =
      await request.json();

    const {
      site_name,

      logo,

      hero_title,
      hero_subtitle,
      hero_image,

      hero_button_text,
      hero_button_link,

      phone,
      email,

      facebook,
      instagram,
      youtube,
      whatsapp,
    } = body;

    const {
      data: settingsRow,
      error: rowError,
    } = await supabase
      .from("settings")
      .select("id")
      .limit(1);

    if (rowError) {
      return NextResponse.json(
        {
          success: false,
          error: rowError.message,
        },
        { status: 500 }
      );
    }

    const rowId =
      settingsRow?.[0]?.id;

    if (!rowId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Settings row not found",
        },
        { status: 404 }
      );
    }

    const { error } =
      await supabase
        .from("settings")
        .update({
          site_name,

          logo,

          hero_title,
          hero_subtitle,
          hero_image,

          hero_button_text,
          hero_button_link,

          phone,
          email,

          facebook,
          instagram,
          youtube,
          whatsapp,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", rowId);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Settings updated successfully",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}