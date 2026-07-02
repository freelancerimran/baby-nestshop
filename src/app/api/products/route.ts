import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzWeaNqryWJzZJXsLqMM7n2mvJJp3rEnNhXjchDbyKBOBrnkXJu_uiOoGvhhlO3I3Dx/exec?action=products",
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        products: [],
      },
      {
        status: 500,
      }
    );
  }
}