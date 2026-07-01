import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbyjIdtpMuJBoorS4QCZn7BSGN2nh6xoi6Qv9LH2RKXfSnT6zJ2dtI_F8b0Fw5JZhETy/exec",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    const text = await response.text();

    console.log("========== GOOGLE RESPONSE ==========");
    console.log(text);
    console.log("====================================");

    return NextResponse.json({
      success: true,
      googleResponse: text,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}