import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

/*
 * ---------------------------------------------------------
 * Types
 * ---------------------------------------------------------
 */

type CreateUserBody = {
  email?: string;
  phone?: string;
  password?: string;
  full_name?: string;
  job_title?: string;
  joining_date?: string | null;
  role_id?: number | string | null;
};

type AuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
};

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

/**
 * Normalize Bangladesh mobile numbers to E.164 format.
 *
 * Accepted examples:
 *
 * 01712345678
 * 8801712345678
 * +8801712345678
 * 008801712345678
 *
 * Final output:
 *
 * +8801712345678
 */
function normalizeBangladeshPhone(
  value: string
): string {
  let digits = value.replace(/\D/g, "");

  /*
   * 00880XXXXXXXXXX
   *        ↓
   * 880XXXXXXXXXX
   */
  if (digits.startsWith("00880")) {
    digits = digits.slice(2);
  }

  /*
   * 8801XXXXXXXXX
   *      ↓
   * 01XXXXXXXXX
   */
  if (
    digits.startsWith("880") &&
    digits.length === 13
  ) {
    digits = `0${digits.slice(3)}`;
  }

  /*
   * 1XXXXXXXXX
   *    ↓
   * 01XXXXXXXXX
   */
  if (
    digits.startsWith("1") &&
    digits.length === 10
  ) {
    digits = `0${digits}`;
  }

  /*
   * Bangladesh mobile number validation.
   *
   * Valid prefixes:
   *
   * 013
   * 014
   * 015
   * 016
   * 017
   * 018
   * 019
   */
  if (!/^01[3-9]\d{8}$/.test(digits)) {
    return "";
  }

  /*
   * Convert:
   *
   * 01712345678
   *       ↓
   * +8801712345678
   */
  return `+88${digits.slice(1)}`;
}

/*
 * ---------------------------------------------------------
 * GET
 * ---------------------------------------------------------
 *
 * Returns all team users with:
 *
 * - profile
 * - roles
 * - email
 * - phone
 *
 * Required permission:
 *
 * team.view
 */

export async function GET() {
  try {
    const supabase =
      await createSupabaseServerClient();

    /*
     * -------------------------------------------------------
     * 1. Authentication
     * -------------------------------------------------------
     */

    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /*
     * -------------------------------------------------------
     * 2. Active profile check
     * -------------------------------------------------------
     */

    const {
      data: currentProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (
      profileError ||
      !currentProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User profile is not configured.",
        },
        { status: 403 }
      );
    }

    if (!currentProfile.is_active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated.",
        },
        { status: 403 }
      );
    }

    /*
     * -------------------------------------------------------
     * 3. Permission check
     * -------------------------------------------------------
     */

    const allowed =
      await hasPermission(
        "team",
        "view"
      );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view team members.",
        },
        { status: 403 }
      );
    }

    /*
     * -------------------------------------------------------
     * 4. Get profiles
     * -------------------------------------------------------
     */

    const {
      data: profiles,
      error: profilesError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        `
          id,
          full_name,
          phone,
          avatar_url,
          job_title,
          joining_date,
          is_active,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (profilesError) {
      console.error(
        "Team users profile fetch error:",
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load team members.",
        },
        { status: 500 }
      );
    }

    /*
     * -------------------------------------------------------
     * 5. Get user roles
     * -------------------------------------------------------
     */

    const userIds =
      (profiles ?? []).map(
        (profile) => profile.id
      );

    let userRoleRows: {
      user_id: string;
      role_id: number;
    }[] = [];

    if (userIds.length > 0) {
      const {
        data,
        error: userRolesError,
      } = await supabaseAdmin
        .from("user_roles")
        .select(
          "user_id, role_id"
        )
        .in("user_id", userIds);

      if (userRolesError) {
        console.error(
          "Team user roles fetch error:",
          userRolesError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to load user roles.",
          },
          { status: 500 }
        );
      }

      userRoleRows = data ?? [];
    }

    /*
     * -------------------------------------------------------
     * 6. Get all roles
     * -------------------------------------------------------
     */

    const {
      data: roles,
      error: rolesError,
    } = await supabaseAdmin
      .from("roles")
      .select(
        `
          id,
          name,
          slug,
          description,
          is_system_role,
          is_active
        `
      )
      .order("id", {
        ascending: true,
      });

    if (rolesError) {
      console.error(
        "Team roles fetch error:",
        rolesError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load roles.",
        },
        { status: 500 }
      );
    }

    /*
     * -------------------------------------------------------
     * 7. Get Auth users
     * -------------------------------------------------------
     *
     * Supabase Auth users contain email/phone,
     * while profiles contain business profile data.
     */

    const {
      data: authUsersData,
      error: authUsersError,
    } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authUsersError) {
      console.error(
        "Auth users fetch error:",
        authUsersError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load authentication users.",
        },
        { status: 500 }
      );
    }

    const authUsers: AuthUser[] =
      authUsersData.users.map(
        (authUser) => ({
          id: authUser.id,
          email:
            authUser.email ?? null,
          phone:
            authUser.phone ?? null,
        })
      );

    /*
     * -------------------------------------------------------
     * 8. Build role lookup
     * -------------------------------------------------------
     */

    const roleMap = new Map<
      number,
      {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        is_system_role: boolean;
        is_active: boolean;
      }
    >();

    for (const role of roles ?? []) {
      roleMap.set(
        role.id,
        role
      );
    }

    /*
     * -------------------------------------------------------
     * 9. Build Auth user lookup
     * -------------------------------------------------------
     */

    const authUserMap =
      new Map<
        string,
        AuthUser
      >();

    for (const authUser of authUsers) {
      authUserMap.set(
        authUser.id,
        authUser
      );
    }

    /*
     * -------------------------------------------------------
     * 10. Build user role lookup
     * -------------------------------------------------------
     */

    const userRolesMap =
      new Map<
        string,
        number[]
      >();

    for (const row of userRoleRows) {
      const existing =
        userRolesMap.get(
          row.user_id
        ) ?? [];

      existing.push(
        row.role_id
      );

      userRolesMap.set(
        row.user_id,
        existing
      );
    }

    /*
     * -------------------------------------------------------
     * 11. Build final response
     * -------------------------------------------------------
     */

    const users =
      (profiles ?? []).map(
        (profile) => {
          const authUser =
            authUserMap.get(
              profile.id
            );

          const roleIds =
            userRolesMap.get(
              profile.id
            ) ?? [];

          const assignedRoles =
            roleIds
              .map(
                (roleId) =>
                  roleMap.get(
                    roleId
                  )
              )
              .filter(Boolean);

          return {
            id: profile.id,

            email:
              authUser?.email ??
              null,

            phone:
              authUser?.phone ??
              profile.phone ??
              null,

            full_name:
              profile.full_name,

            avatar_url:
              profile.avatar_url,

            job_title:
              profile.job_title,

            joining_date:
              profile.joining_date,

            is_active:
              profile.is_active,

            created_at:
              profile.created_at,

            updated_at:
              profile.updated_at,

            roles:
              assignedRoles,
          };
        }
      );

    return NextResponse.json({
      success: true,
      users,
      roles: roles ?? [],
      total: users.length,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/team/users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while loading team members.",
      },
      { status: 500 }
    );
  }
}

/*
 * ---------------------------------------------------------
 * POST
 * ---------------------------------------------------------
 *
 * Creates:
 *
 * 1. Supabase Auth user
 * 2. profiles row
 * 3. user_roles row
 * 4. audit_logs row
 *
 * Required permission:
 *
 * team.create
 *
 * Creating Super Admin:
 *
 * Only an existing Super Admin can create
 * another Super Admin.
 */

export async function POST(
  request: NextRequest
) {
  let createdAuthUserId:
    string | null = null;

  try {
    const supabase =
      await createSupabaseServerClient();

    /*
     * -------------------------------------------------------
     * 1. Authentication
     * -------------------------------------------------------
     */

    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /*
     * -------------------------------------------------------
     * 2. Active profile check
     * -------------------------------------------------------
     */

    const {
      data: currentProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, is_active"
      )
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();

    if (
      profileError ||
      !currentProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User profile is not configured.",
        },
        { status: 403 }
      );
    }

    if (!currentProfile.is_active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated.",
        },
        { status: 403 }
      );
    }

    /*
     * -------------------------------------------------------
     * 3. Permission check
     * -------------------------------------------------------
     */

    const canCreate =
      await hasPermission(
        "team",
        "create"
      );

    if (!canCreate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create team members.",
        },
        { status: 403 }
      );
    }

    /*
     * -------------------------------------------------------
     * 4. Read request body
     * -------------------------------------------------------
     */

    const body =
      (await request.json()) as CreateUserBody;

    const email =
      typeof body.email ===
      "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    /*
     * Raw phone from frontend.
     */
    const rawPhone =
      typeof body.phone ===
      "string"
        ? body.phone.trim()
        : "";

    /*
     * Normalize phone for Supabase Auth.
     */
    const phone =
      rawPhone
        ? normalizeBangladeshPhone(
            rawPhone
          )
        : "";

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    const fullName =
      typeof body.full_name ===
      "string"
        ? body.full_name.trim()
        : "";

    const jobTitle =
      typeof body.job_title ===
      "string"
        ? body.job_title.trim()
        : "";

    const joiningDate =
      typeof body.joining_date ===
        "string" &&
      body.joining_date.trim()
        ? body.joining_date.trim()
        : null;

    /*
     * Role ID can come as either
     * number or string from frontend.
     */

    let roleId:
      number | null = null;

    if (
      body.role_id !==
        undefined &&
      body.role_id !== null &&
      body.role_id !== ""
    ) {
      const parsedRoleId =
        Number(
          body.role_id
        );

      if (
        !Number.isInteger(
          parsedRoleId
        ) ||
        parsedRoleId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid role.",
          },
          { status: 400 }
        );
      }

      roleId =
        parsedRoleId;
    }

    /*
     * -------------------------------------------------------
     * 5. Validate identity
     * -------------------------------------------------------
     */

    if (!email && !rawPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email or phone number is required.",
        },
        { status: 400 }
      );
    }

    /*
     * If phone was supplied,
     * it must be a valid Bangladesh number.
     */

    if (
      rawPhone &&
      !phone
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Bangladesh mobile number. Example: 01712345678",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * 6. Password validation
     * -------------------------------------------------------
     *
     * Native Supabase email/phone
     * password authentication requires
     * a password.
     */

    if (
      !password ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * 7. Full name validation
     * -------------------------------------------------------
     */

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * 8. Validate role
     * -------------------------------------------------------
     */

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: selectedRole,
      error: roleError,
    } =
      await supabaseAdmin
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
        .eq(
          "id",
          roleId
        )
        .maybeSingle();

    if (roleError) {
      console.error(
        "Selected role fetch error:",
        roleError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to validate selected role.",
        },
        { status: 500 }
      );
    }

    if (!selectedRole) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected role does not exist.",
        },
        { status: 400 }
      );
    }

    if (!selectedRole.is_active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected role is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * 9. Protect Super Admin creation
     * -------------------------------------------------------
     */

    const isCreatingSuperAdmin =
      selectedRole.slug ===
      "super_admin";

    if (
      isCreatingSuperAdmin
    ) {
      const isCurrentUserSuperAdmin =
        await hasPermission(
          "team",
          "manage_roles"
        );

      if (
        !isCurrentUserSuperAdmin
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only a Super Admin can create another Super Admin.",
          },
          { status: 403 }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * 10. Create Auth user
     * -------------------------------------------------------
     *
     * Service Role is used ONLY
     * on the server.
     */

    const authPayload: {
      password: string;
      email?: string;
      phone?: string;
      email_confirm?: boolean;
      phone_confirm?: boolean;
    } = {
      password,
    };

    /*
     * Email login.
     */
    if (email) {
      authPayload.email =
        email;

      authPayload.email_confirm =
        true;
    }

    /*
     * Phone login.
     *
     * IMPORTANT:
     * phone is already normalized
     * to E.164 format.
     */
    if (phone) {
      authPayload.phone =
        phone;

      authPayload.phone_confirm =
        true;
    }

    const {
      data: authData,
      error: createAuthError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        authPayload
      );

    if (
      createAuthError ||
      !authData.user
    ) {
      console.error(
        "Create Auth user error:",
        createAuthError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            createAuthError?.message ||
            "Unable to create authentication user.",
        },
        { status: 400 }
      );
    }

    createdAuthUserId =
      authData.user.id;

    /*
     * -------------------------------------------------------
     * 11. Create profile
     * -------------------------------------------------------
     */

    const {
      error: createProfileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .insert({
          id:
            authData.user.id,

          full_name:
            fullName,

          phone:
            phone || null,

          job_title:
            jobTitle || null,

          joining_date:
            joiningDate,

          is_active:
            true,
        });

    if (
      createProfileError
    ) {
      console.error(
        "Create profile error:",
        createProfileError
      );

      /*
       * Cleanup Auth user
       * because profile creation failed.
       */
      await supabaseAdmin.auth.admin.deleteUser(
        authData.user.id
      );

      createdAuthUserId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create user profile.",
        },
        { status: 500 }
      );
    }

    /*
     * -------------------------------------------------------
     * 12. Assign role
     * -------------------------------------------------------
     */

    const {
      error: assignRoleError,
    } =
      await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id:
            authData.user.id,

          role_id:
            selectedRole.id,
        });

    if (
      assignRoleError
    ) {
      console.error(
        "Assign role error:",
        assignRoleError
      );

      /*
       * Cleanup profile first.
       */
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq(
          "id",
          authData.user.id
        );

      /*
       * Cleanup Auth user.
       */
      await supabaseAdmin.auth.admin.deleteUser(
        authData.user.id
      );

      createdAuthUserId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to assign selected role.",
        },
        { status: 500 }
      );
    }

    /*
     * -------------------------------------------------------
     * 13. Audit log
     * -------------------------------------------------------
     */

    const auditLogged = await writeAuditLog({
      request,
      action: "create",
      module: "team",
      targetType: "user",
      targetId: authData.user.id,
      description:
        `Created team user ${fullName} with role ${selectedRole.name}.`,
      metadata: {
        created_user_id:
          authData.user.id,
        email:
          email || null,
        phone:
          phone || null,
        role_id:
          selectedRole.id,
        role:
          selectedRole.slug,
        role_name:
          selectedRole.name,
        is_super_admin:
          isCreatingSuperAdmin,
      },
    });

    /*
     * -------------------------------------------------------
     * 14. Success
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Team user created successfully.",

        user: {
          id:
            authData.user.id,

          email:
            authData.user.email ??
            null,

          phone:
            authData.user.phone ??
            null,

          full_name:
            fullName,

          job_title:
            jobTitle || null,

          joining_date:
            joiningDate,

          is_active:
            true,

          role:
            selectedRole,
        },
        auditLogged,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/team/users error:",
      error
    );

    /*
     * -------------------------------------------------------
     * Emergency cleanup
     * -------------------------------------------------------
     *
     * If an unexpected error happened
     * after Auth user creation, clean up:
     *
     * user_roles
     * profiles
     * auth.users
     */

    if (createdAuthUserId) {
      try {
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq(
            "user_id",
            createdAuthUserId
          );

        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq(
            "id",
            createdAuthUserId
          );

        await supabaseAdmin.auth.admin.deleteUser(
          createdAuthUserId
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "User creation cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating the team user.",
      },
      { status: 500 }
    );
  }
}