import { cookies } from "next/headers";

const COOKIE_NAME = "babynest_admin";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();

  const session = cookieStore.get(COOKIE_NAME);

  return session?.value === "authenticated";
}

export async function createAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAME);
}