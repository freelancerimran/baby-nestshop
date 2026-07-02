import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzWeaNqryWJzZJXsLqMM7n2mvJJp3rEnNhXjchDbyKBOBrnkXJu_uiOoGvhhlO3I3Dx/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(body),
      }
    );

    const googleData = await response.json();

    return NextResponse.json({
      success: googleData.success,
      orderId: googleData.orderId,
      googleResponse: googleData,
    });
  } catch (error) {
    console.error("ORDER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Order submission failed",
      },
      {
        status: 500,
      }
    );
  }
}