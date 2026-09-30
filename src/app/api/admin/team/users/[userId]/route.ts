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

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type UpdateUserBody = {
  full_name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  joining_date?: string | null;

  /*
   * Role change.
   */
  role_id?: number | string | null;

  /*
   * Account status.
   */
  is_active?: boolean;
};

type Role = {
  id: number;
  name: string;
  slug: string;
  is_system_role: boolean;
  is_active: boolean;
};

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

/**
 * Normalize Bangladesh mobile number to E.164.
 *
 * Accepted:
 *
 * 01712345678
 * 8801712345678
 * +8801712345678
 * 008801712345678
 *
 * Output:
 *
 * +8801712345678
 */
function normalizeBangladeshPhone(
  value: string
): string {
  let digits = value.replace(/\D/g, "");

  // 00880XXXXXXXXXX -> 880XXXXXXXXXX
  if (digits.startsWith("00880")) {
    digits = digits.slice(2);
  }

  // +8801XXXXXXXXX / 8801XXXXXXXXX -> 01XXXXXXXXX
  if (
    digits.startsWith("880") &&
    digits.length === 13
  ) {
    digits = `0${digits.slice(3)}`;
  }

  // 88XXXXXXXXXX -> 01XXXXXXXXX
  // Example: 881734330771 -> 01734330771
  if (
    digits.startsWith("88") &&
    digits.length === 12
  ) {
    digits = `0${digits.slice(2)}`;
  }

  // 1XXXXXXXXX -> 01XXXXXXXXX
  if (
    digits.startsWith("1") &&
    digits.length === 10
  ) {
    digits = `0${digits}`;
  }

  // Final Bangladesh mobile validation.
  if (!/^01[3-9]\d{8}$/.test(digits)) {
    return "";
  }

  // 01734330771 -> +8801734330771
  return `+880${digits.slice(1)}`;
}

/**
 * Get a role by ID.
 */
async function getRole(
  roleId: number
): Promise<{
  role: Role | null;
  error: string | null;
}> {
  const {
    data,
    error,
  } = await supabaseAdmin
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
    .eq("id", roleId)
    .maybeSingle();

  if (error) {
    console.error(
      "Team role lookup error:",
      error
    );

    return {
      role: null,
      error: "Unable to validate role.",
    };
  }

  if (!data) {
    return {
      role: null,
      error: "Selected role does not exist.",
    };
  }

  if (!data.is_active) {
    return {
      role: null,
      error: "Selected role is inactive.",
    };
  }

  return {
    role: data,
    error: null,
  };
}

/**
 * Get the roles assigned to a user.
 */
async function getUserRoles(
  userId: string
): Promise<{
  roles: Role[];
  roleIds: number[];
  error: string | null;
}> {
  const {
    data: userRoleRows,
    error: userRoleError,
  } =
    await supabaseAdmin
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId);

  if (userRoleError) {
    console.error(
      "User role lookup error:",
      userRoleError
    );

    return {
      roles: [],
      roleIds: [],
      error: "Unable to load user roles.",
    };
  }

  const roleIds =
    (userRoleRows ?? []).map(
      (row) => row.role_id
    );

  if (roleIds.length === 0) {
    return {
      roles: [],
      roleIds: [],
      error: null,
    };
  }

  const {
    data: roles,
    error: rolesError,
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
      .in("id", roleIds);

  if (rolesError) {
    console.error(
      "User roles fetch error:",
      rolesError
    );

    return {
      roles: [],
      roleIds,
      error: "Unable to load user roles.",
    };
  }

  return {
    roles: roles ?? [],
    roleIds,
    error: null,
  };
}

/**
 * Check whether a user currently has
 * the Super Admin role.
 */
async function isSuperAdminUser(
  userId: string
): Promise<{
  isSuperAdmin: boolean;
  error: string | null;
}> {
  const {
    roles,
    error,
  } = await getUserRoles(userId);

  if (error) {
    return {
      isSuperAdmin: false,
      error,
    };
  }

  return {
    isSuperAdmin: roles.some(
      (role) =>
        role.slug === "super_admin"
    ),
    error: null,
  };
}

/**
 * Count current Super Admin users.
 *
 * We never allow an operation that would leave
 * the system with zero Super Admins.
 */
async function countSuperAdmins(): Promise<{
  count: number;
  error: string | null;
}> {
  const {
    data: superAdminRole,
    error: roleError,
  } =
    await supabaseAdmin
      .from("roles")
      .select("id")
      .eq(
        "slug",
        "super_admin"
      )
      .maybeSingle();

  if (roleError) {
    console.error(
      "Super Admin role lookup error:",
      roleError
    );

    return {
      count: 0,
      error:
        "Unable to check Super Admin protection.",
    };
  }

  if (!superAdminRole) {
    return {
      count: 0,
      error:
        "Super Admin role is not configured.",
    };
  }

  const {
    data: superAdminUsers,
    error: usersError,
  } =
    await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq(
        "role_id",
        superAdminRole.id
      );

  if (usersError) {
    console.error(
      "Super Admin users lookup error:",
      usersError
    );

    return {
      count: 0,
      error:
        "Unable to check Super Admin users.",
    };
  }

  return {
    count:
      superAdminUsers?.length ?? 0,
    error: null,
  };
}

/*
 * ---------------------------------------------------------
 * PATCH
 * ---------------------------------------------------------
 *
 * Handles:
 *
 * - profile edit
 * - role change
 * - activate
 * - deactivate
 *
 * Permission:
 *
 * team.edit
 * team.manage_roles
 * team.activate
 * team.deactivate
 */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const {
    userId: targetUserId,
  } = await context.params;

  try {
    /*
     * -------------------------------------------------------
     * 1. Authentication
     * -------------------------------------------------------
     */

    const supabase =
      await createSupabaseServerClient();

    const {
      data: {
        user: currentUser,
      },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !currentUser
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 2. Current profile
     * -------------------------------------------------------
     */

    const {
      data: currentProfile,
      error: currentProfileError,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, is_active, full_name"
        )
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (
      currentProfileError ||
      !currentProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your user profile is not configured.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !currentProfile.is_active
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 3. Load target user
     * -------------------------------------------------------
     */

    const {
      data: targetProfile,
      error: targetProfileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
            id,
            full_name,
            phone,
            job_title,
            joining_date,
            is_active
          `
        )
        .eq(
          "id",
          targetUserId
        )
        .maybeSingle();

    if (
      targetProfileError ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Team user not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: targetAuthUserData,
      error: targetAuthUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      targetUserId
    );

    if (targetAuthUserError || !targetAuthUserData.user) {
      console.error(
        "Target Auth user lookup error:",
        targetAuthUserError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load target authentication user.",
        },
        {
          status: 500,
        }
      );
    }

    const previousTargetEmail =
      targetAuthUserData.user.email ?? null;
    const previousTargetPhone =
      targetAuthUserData.user.phone ?? null;

    /*
     * -------------------------------------------------------
     * 4. Parse body
     * -------------------------------------------------------
     */

    const body =
      (await request.json()) as UpdateUserBody;

    /*
     * -------------------------------------------------------
     * 5. Determine requested operations
     * -------------------------------------------------------
     */

    const hasProfileChanges =
      body.full_name !==
        undefined ||
      body.email !==
        undefined ||
      body.phone !==
        undefined ||
      body.job_title !==
        undefined ||
      body.joining_date !==
        undefined;

    const hasRoleChange =
      body.role_id !==
        undefined;

    const hasStatusChange =
      body.is_active !==
        undefined;

    /*
     * At least one operation must exist.
     */
    if (
      !hasProfileChanges &&
      !hasRoleChange &&
      !hasStatusChange
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No changes were provided.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 6. Current target role
     * -------------------------------------------------------
     */

    const {
      roles: targetRoles,
      roleIds:
        targetRoleIds,
      error:
        targetRolesError,
    } =
      await getUserRoles(
        targetUserId
      );

    if (targetRolesError) {
      return NextResponse.json(
        {
          success: false,
          message:
            targetRolesError,
        },
        {
          status: 500,
        }
      );
    }

    const targetIsSuperAdmin =
      targetRoles.some(
        (role) =>
          role.slug ===
          "super_admin"
      );

    /*
     * -------------------------------------------------------
     * 7. Permission checks
     * -------------------------------------------------------
     */

    if (
      hasProfileChanges
    ) {
      const canEdit =
        await hasPermission(
          "team",
          "edit"
        );

      if (!canEdit) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to edit team members.",
          },
          {
            status: 403,
          }
        );
      }
    }

    if (
      hasRoleChange
    ) {
      const canManageRoles =
        await hasPermission(
          "team",
          "manage_roles"
        );

      if (!canManageRoles) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to change user roles.",
          },
          {
            status: 403,
          }
        );
      }
    }

    if (
      hasStatusChange
    ) {
      const newStatus =
        body.is_active;

      const permissionAction =
        newStatus
          ? "activate"
          : "deactivate";

      const canChangeStatus =
        await hasPermission(
          "team",
          permissionAction
        );

      if (!canChangeStatus) {
        return NextResponse.json(
          {
            success: false,
            message:
              `You do not have permission to ${permissionAction} team members.`,
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * 8. Validate role change
     * -------------------------------------------------------
     */

    let selectedRole:
      | Role
      | null = null;

    if (
      hasRoleChange
    ) {
      if (
        body.role_id ===
          null ||
        body.role_id ===
          ""
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Role is required.",
          },
          {
            status: 400,
          }
        );
      }

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
          {
            status: 400,
          }
        );
      }

      const {
        role,
        error:
          roleError,
      } =
        await getRole(
          parsedRoleId
        );

      if (
        roleError ||
        !role
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              roleError ||
              "Invalid role.",
          },
          {
            status: 400,
          }
        );
      }

      selectedRole =
        role;
    }

    /*
     * -------------------------------------------------------
     * 9. Super Admin safety
     * -------------------------------------------------------
     *
     * Any Super Admin can manage any other Super Admin.
     *
     * But the system must NEVER be left with zero
     * Super Admins.
     */

    const newRoleIsSuperAdmin =
      selectedRole?.slug ===
      "super_admin";

    const removingSuperAdminRole =
      targetIsSuperAdmin &&
      hasRoleChange &&
      !newRoleIsSuperAdmin;

    const deactivatingSuperAdmin =
      targetIsSuperAdmin &&
      hasStatusChange &&
      body.is_active === false;

    const deletingSuperAdmin =
      false;

    if (
      removingSuperAdminRole ||
      deactivatingSuperAdmin ||
      deletingSuperAdmin
    ) {
      const {
        count,
        error:
          countError,
      } =
        await countSuperAdmins();

      if (countError) {
        return NextResponse.json(
          {
            success: false,
            message:
              countError,
          },
          {
            status: 500,
          }
        );
      }

      if (count <= 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "At least one Super Admin must remain in the system.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * 10. Validate status change
     * -------------------------------------------------------
     */

    if (
      hasStatusChange &&
      typeof body.is_active !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid account status.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 11. Profile update
     * -------------------------------------------------------
     */

    if (
      hasProfileChanges
    ) {
      const profileUpdate: Record<
        string,
        unknown
      > = {};

      if (
        body.full_name !==
        undefined
      ) {
        const fullName =
          typeof body.full_name ===
          "string"
            ? body.full_name.trim()
            : "";

        if (!fullName) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Full name cannot be empty.",
            },
            {
              status: 400,
            }
          );
        }

        profileUpdate.full_name =
          fullName;
      }

      if (
        body.phone !==
        undefined
      ) {
        const rawPhone =
          typeof body.phone ===
          "string"
            ? body.phone.trim()
            : "";

        if (
          rawPhone
        ) {
          const normalizedPhone =
            normalizeBangladeshPhone(
              rawPhone
            );

          if (
            !normalizedPhone
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Invalid Bangladesh mobile number. Example: 01712345678",
              },
              {
                status: 400,
              }
            );
          }

          profileUpdate.phone =
            normalizedPhone;
        } else {
          profileUpdate.phone =
            null;
        }
      }

      if (
        body.job_title !==
        undefined
      ) {
        profileUpdate.job_title =
          typeof body.job_title ===
          "string"
            ? body.job_title.trim() ||
              null
            : null;
      }

      if (
        body.joining_date !==
        undefined
      ) {
        profileUpdate.joining_date =
          body.joining_date ||
          null;
      }

      const {
        error:
          updateProfileError,
      } =
        await supabaseAdmin
          .from("profiles")
          .update(
            profileUpdate
          )
          .eq(
            "id",
            targetUserId
          );

      if (
        updateProfileError
      ) {
        console.error(
          "Team profile update error:",
          updateProfileError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to update user profile.",
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * 12. Auth email / phone update
     * -------------------------------------------------------
     *
     * Email and phone live in Supabase Auth.
     */

    if (
      body.email !==
        undefined ||
      body.phone !==
        undefined
    ) {
      const authUpdate: {
        email?: string;
        phone?: string;
        email_confirm?: boolean;
        phone_confirm?: boolean;
      } = {};

      if (
        body.email !==
        undefined
      ) {
        const email =
          typeof body.email ===
          "string"
            ? body.email
                .trim()
                .toLowerCase()
            : "";

        if (
          !email
        ) {
          /*
           * We allow removing email only if phone exists.
           */
          const {
            data:
              currentAuthUser,
          } =
            await supabaseAdmin.auth.admin.getUserById(
              targetUserId
            );

          if (
            !currentAuthUser
              .user?.phone &&
            !body.phone
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "User must have an email or phone number.",
              },
              {
                status: 400,
              }
            );
          }

          authUpdate.email =
            "";
        } else {
          authUpdate.email =
            email;

          authUpdate.email_confirm =
            true;
        }
      }

      if (
        body.phone !==
        undefined
      ) {
        const rawPhone =
          typeof body.phone ===
          "string"
            ? body.phone.trim()
            : "";

        if (
          rawPhone
        ) {
          const normalizedPhone =
            normalizeBangladeshPhone(
              rawPhone
            );

          if (
            !normalizedPhone
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Invalid Bangladesh mobile number. Example: 01712345678",
              },
              {
                status: 400,
              }
            );
          }

          authUpdate.phone =
            normalizedPhone;

          authUpdate.phone_confirm =
            true;
        } else {
          /*
           * Remove phone.
           *
           * This is allowed only when email exists
           * or is being supplied in the same request.
           */
          const {
            data:
              currentAuthUser,
          } =
            await supabaseAdmin.auth.admin.getUserById(
              targetUserId
            );

          const currentEmail =
            currentAuthUser
              .user?.email;

          if (
            !currentEmail &&
            !body.email
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "User must have an email or phone number.",
              },
              {
                status: 400,
              }
            );
          }

          authUpdate.phone =
            "";
        }
      }

      const {
        error:
          authUpdateError,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          authUpdate
        );

      if (
        authUpdateError
      ) {
        console.error(
          "Team Auth user update error:",
          authUpdateError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              authUpdateError.message ||
              "Unable to update authentication details.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * 13. Update status
     * -------------------------------------------------------
     */

    if (
      hasStatusChange
    ) {
      const {
        error:
          statusError,
      } =
        await supabaseAdmin
          .from("profiles")
          .update({
            is_active:
              body.is_active,
          })
          .eq(
            "id",
            targetUserId
          );

      if (
        statusError
      ) {
        console.error(
          "Team status update error:",
          statusError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to update account status.",
          },
          {
            status: 500,
          }
        );
      }

      /*
       * If deactivating, invalidate all Auth sessions
       * when supported by Supabase.
       */
      if (
        body.is_active ===
        false
      ) {
        const {
          error:
            signOutError,
        } =
          await supabaseAdmin.auth.admin.signOut(
            targetUserId,
            "global"
          );

        if (
          signOutError
        ) {
          console.error(
            "Global sign-out error:",
            signOutError
          );
        }
      }
    }

    /*
     * -------------------------------------------------------
     * 14. Change role
     * -------------------------------------------------------
     */

    if (
      hasRoleChange &&
      selectedRole
    ) {
      /*
       * Remove existing roles.
       *
       * Current architecture uses one primary role
       * from Team Management.
       */
      const {
        error:
          deleteRolesError,
      } =
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq(
            "user_id",
            targetUserId
          );

      if (
        deleteRolesError
      ) {
        console.error(
          "Delete old user roles error:",
          deleteRolesError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to update user role.",
          },
          {
            status: 500,
          }
        );
      }

      /*
       * Assign new role.
       */
      const {
        error:
          insertRoleError,
      } =
        await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id:
              targetUserId,
            role_id:
              selectedRole.id,
          });

      if (
        insertRoleError
      ) {
        console.error(
          "Insert new user role error:",
          insertRoleError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to assign new user role.",
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * 15. Audit
     * -------------------------------------------------------
     */

    const auditLogged =
      await writeAuditLog({
        request,
        action: "update",
        module: "team",
        targetType: "user",
        targetId: targetUserId,
        description:
          `Updated team user ${targetProfile.full_name}.`,
        metadata: {
          target_user_id: targetUserId,
          previous: {
            full_name: targetProfile.full_name,
            phone: targetProfile.phone,
            job_title: targetProfile.job_title,
            joining_date: targetProfile.joining_date,
            is_active: targetProfile.is_active,
            email: previousTargetEmail,
            auth_phone: previousTargetPhone,
            role_ids: targetRoleIds,
            roles: targetRoles.map((role) => role.slug),
          },
          changes: {
            profile_changed: hasProfileChanges,
            role_changed: hasRoleChange,
            status_changed: hasStatusChange,
            requested_fields: Object.keys(body),
          },
          new_values: {
            role: selectedRole?.slug ?? null,
            role_id: selectedRole?.id ?? null,
            status:
              hasStatusChange
                ? body.is_active
                : targetProfile.is_active,
          },
        },
      });

    /*
     * -------------------------------------------------------
     * 16. Return updated user
     * -------------------------------------------------------
     */

    const {
      data: updatedProfile,
    } =
      await supabaseAdmin
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
        .eq(
          "id",
          targetUserId
        )
        .maybeSingle();

    const {
      roles:
        updatedRoles,
    } =
      await getUserRoles(
        targetUserId
      );

    const {
      data:
        updatedAuthUser,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        targetUserId
      );

    return NextResponse.json({
      success: true,
      message:
        "Team user updated successfully.",
      auditLogged,

      user: {
        id:
          updatedProfile?.id ??
          targetUserId,

        full_name:
          updatedProfile?.full_name ??
          null,

        email:
          updatedAuthUser
            .user?.email ??
          null,

        phone:
          updatedAuthUser
            .user?.phone ??
          updatedProfile?.phone ??
          null,

        avatar_url:
          updatedProfile?.avatar_url ??
          null,

        job_title:
          updatedProfile?.job_title ??
          null,

        joining_date:
          updatedProfile?.joining_date ??
          null,

        is_active:
          updatedProfile?.is_active ??
          false,

        roles:
          updatedRoles,
      },
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/team/users/[userId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while updating the team user.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ---------------------------------------------------------
 * DELETE
 * ---------------------------------------------------------
 *
 * Deletes:
 *
 * - user_permissions
 * - user_roles
 * - profile
 * - Supabase Auth user
 *
 * Permission:
 *
 * team.delete
 */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const {
    userId: targetUserId,
  } = await context.params;

  try {
    /*
     * -------------------------------------------------------
     * 1. Authentication
     * -------------------------------------------------------
     */

    const supabase =
      await createSupabaseServerClient();

    const {
      data: {
        user: currentUser,
      },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !currentUser
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 2. Current profile
     * -------------------------------------------------------
     */

    const {
      data: currentProfile,
      error: currentProfileError,
    } =
      await supabase
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
      currentProfileError ||
      !currentProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your user profile is not configured.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !currentProfile.is_active
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 3. Permission
     * -------------------------------------------------------
     */

    const canDelete =
      await hasPermission(
        "team",
        "delete"
      );

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to delete team members.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 4. Self-account safety
     * -------------------------------------------------------
     */
    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * 5. Target profile
     * -------------------------------------------------------
     */

    const {
      data: targetProfile,
      error: targetProfileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
            id,
            full_name,
            is_active
          `
        )
        .eq(
          "id",
          targetUserId
        )
        .maybeSingle();

    if (
      targetProfileError ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Team user not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 5. Super Admin protection
     * -------------------------------------------------------
     */

    const {
      isSuperAdmin:
        targetIsSuperAdmin,
      error:
        targetRoleError,
    } =
      await isSuperAdminUser(
        targetUserId
      );

    if (
      targetRoleError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            targetRoleError,
        },
        {
          status: 500,
        }
      );
    }

    if (
      targetIsSuperAdmin
    ) {
      const {
        count,
        error:
          countError,
      } =
        await countSuperAdmins();

      if (countError) {
        return NextResponse.json(
          {
            success: false,
            message:
              countError,
          },
          {
            status: 500,
          }
        );
      }

      /*
       * NEVER allow the last Super Admin
       * to be deleted.
       */
      if (count <= 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The last Super Admin cannot be deleted.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const {
      data: targetAuthUserData,
      error: targetAuthUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      targetUserId
    );

    if (targetAuthUserError || !targetAuthUserData.user) {
      console.error(
        "Target Auth user lookup error before deletion:",
        targetAuthUserError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to load target authentication user.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 6. Audit BEFORE deletion
     * -------------------------------------------------------
     *
     * The audit must be written before the Auth/profile rows
     * are removed because the target user no longer exists
     * after deletion. The audit itself is best-effort.
     */

    const {
      roles: targetRolesBeforeDelete,
      roleIds: targetRoleIdsBeforeDelete,
    } = await getUserRoles(targetUserId);

    const auditLogged =
      await writeAuditLog({
        request,
        action: "delete",
        module: "team",
        targetType: "user",
        targetId: targetUserId,
        description:
          `Deleted team user ${targetProfile.full_name}.`,
        metadata: {
          deleted_user_id: targetUserId,
          was_super_admin: targetIsSuperAdmin,
          previous: {
            full_name: targetProfile.full_name,
            is_active: targetProfile.is_active,
            email:
              targetAuthUserData?.user?.email ?? null,
            phone:
              targetAuthUserData?.user?.phone ?? null,
            role_ids: targetRoleIdsBeforeDelete,
            roles: targetRolesBeforeDelete.map(
              (role) => role.slug
            ),
          },
        },
      });

    /*
     * -------------------------------------------------------
     * 7. Delete direct permissions
     * -------------------------------------------------------
     */

    const {
      error:
        userPermissionsError,
    } =
      await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq(
          "user_id",
          targetUserId
        );

    if (
      userPermissionsError
    ) {
      console.error(
        "Delete user permissions error:",
        userPermissionsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to remove user permissions.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 8. Delete roles
     * -------------------------------------------------------
     */

    const {
      error:
        userRolesError,
    } =
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq(
          "user_id",
          targetUserId
        );

    if (
      userRolesError
    ) {
      console.error(
        "Delete user roles error:",
        userRolesError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to remove user roles.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 9. Delete profile
     * -------------------------------------------------------
     */

    const {
      error:
        profileDeleteError,
    } =
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq(
          "id",
          targetUserId
        );

    if (
      profileDeleteError
    ) {
      console.error(
        "Delete user profile error:",
        profileDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to delete user profile.",
        },
        {
          status: 500
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 10. Delete Auth user
     * -------------------------------------------------------
     */

    const {
      error:
        authDeleteError,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        targetUserId
      );

    if (
      authDeleteError
    ) {
      console.error(
        "Delete Auth user error:",
        authDeleteError
      );

      /*
       * Important:
       *
       * At this point profile/role data has already
       * been removed.
       *
       * Return an explicit error rather than pretending
       * deletion was fully successful.
       */
      return NextResponse.json(
        {
          success: false,
          message:
            authDeleteError.message ||
            "User profile was removed but authentication user could not be deleted. Please check Supabase Auth.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 11. Success
     * -------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      message:
        "Team user deleted successfully.",
      auditLogged,
      user_id:
        targetUserId,
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/team/users/[userId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while deleting the team user.",
      },
      {
        status: 500,
      }
    );
  }
}