import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email/phone and password are required.",
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    /*
     * Determine whether the user is logging in with
     * an email address or a phone number.
     */
    const isEmail = identifier.includes("@");

    const { data, error } = isEmail
      ? await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        })
      : await supabase.auth.signInWithPassword({
          phone: identifier,
          password,
        });

    /*
     * Authentication failed.
     */
    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          message: error?.message || "Invalid login credentials.",
        },
        { status: 401 }
      );
    }

    /*
     * Get the user's profile.
     */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          phone,
          avatar_url,
          job_title,
          joining_date,
          is_active
        `
      )
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);

      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load user profile.",
        },
        { status: 500 }
      );
    }

    /*
     * Auth user exists but no profile exists.
     */
    if (!profile) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "User profile is not configured.",
        },
        { status: 403 }
      );
    }

    /*
     * Block inactive/deactivated users.
     */
    if (!profile.is_active) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "Your account has been deactivated.",
        },
        { status: 403 }
      );
    }

    /*
     * Load user's assigned role IDs first.
     *
     * We intentionally do this in two queries instead of using
     * the nested roles relation because Supabase's generated
     * TypeScript type can interpret the nested relation as an array.
     */
    const { data: userRoleRows, error: rolesError } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", data.user.id);

    if (rolesError) {
      console.error("Roles fetch error:", rolesError);

      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load user roles.",
        },
        { status: 500 }
      );
    }

    const roleIds = (userRoleRows ?? []).map((row) => row.role_id);

    /*
     * User has no assigned roles.
     */
    if (roleIds.length === 0) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "No active role is assigned to this account.",
        },
        { status: 403 }
      );
    }

    /*
     * Load complete role information.
     */
    const { data: roles, error: roleDetailsError } = await supabase
      .from("roles")
      .select(
        `
          id,
          name,
          slug,
          is_system_role,
          is_active
        `
      )
      .in("id", roleIds);

    if (roleDetailsError) {
      console.error("Role details fetch error:", roleDetailsError);

      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load role details.",
        },
        { status: 500 }
      );
    }

    /*
     * Only active roles are valid.
     */
    const activeRoles = (roles ?? []).filter(
      (role) => role.is_active !== false
    );

    /*
     * All assigned roles are inactive.
     */
    if (activeRoles.length === 0) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "No active role is assigned to this account.",
        },
        { status: 403 }
      );
    }

    /*
     * Login successful.
     *
     * Supabase SSR has already established the authenticated
     * session through the server client/cookies.
     */
    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        profile,
        roles: activeRoles,
      },
    });
  } catch (error) {
    console.error("Admin Auth Login Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during login.",
      },
      { status: 500 }
    );
  }
}