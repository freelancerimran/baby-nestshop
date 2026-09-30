import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Permission = {
  module: string;
  action: string;
};

export type PermissionCheckResult = {
  allowed: boolean;
  reason:
    | "super_admin"
    | "user_override_allow"
    | "user_override_deny"
    | "role_permission"
    | "no_permission"
    | "not_authenticated"
    | "inactive_user"
    | "database_error";
};

/**
 * Check whether the current authenticated user
 * has a specific permission.
 *
 * Permission priority:
 *
 * 1. Super Admin
 * 2. Explicit user permission override
 * 3. Role permission
 * 4. Deny by default
 */
export async function checkPermission(
  module: string,
  action: string
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createSupabaseServerClient();

    /*
     * -------------------------------------------------------
     * 1. Get authenticated user
     * -------------------------------------------------------
     */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        allowed: false,
        reason: "not_authenticated",
      };
    }

    /*
     * -------------------------------------------------------
     * 2. Check profile
     * -------------------------------------------------------
     */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Permission profile error:",
        profileError
      );

      return {
        allowed: false,
        reason: "database_error",
      };
    }

    if (!profile || !profile.is_active) {
      return {
        allowed: false,
        reason: "inactive_user",
      };
    }

    /*
     * -------------------------------------------------------
     * 3. Get user's role IDs
     * -------------------------------------------------------
     */
    const { data: userRoleRows, error: userRolesError } =
      await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id);

    if (userRolesError) {
      console.error(
        "Permission user roles error:",
        userRolesError
      );

      return {
        allowed: false,
        reason: "database_error",
      };
    }

    const roleIds = (userRoleRows ?? []).map(
      (row) => row.role_id
    );

    if (roleIds.length === 0) {
      return {
        allowed: false,
        reason: "no_permission",
      };
    }

    /*
     * -------------------------------------------------------
     * 4. Load active roles
     * -------------------------------------------------------
     */
    const { data: roles, error: rolesError } = await supabase
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
        "Permission roles error:",
        rolesError
      );

      return {
        allowed: false,
        reason: "database_error",
      };
    }

    const activeRoles = (roles ?? []).filter(
      (role) => role.is_active !== false
    );

    /*
     * -------------------------------------------------------
     * 5. Super Admin bypass
     * -------------------------------------------------------
     *
     * Super Admin has full system access.
     */
    const isSuperAdmin = activeRoles.some(
      (role) => role.slug === "super_admin"
    );

    if (isSuperAdmin) {
      return {
        allowed: true,
        reason: "super_admin",
      };
    }

    /*
     * -------------------------------------------------------
     * 6. Find requested permission
     * -------------------------------------------------------
     */
    const { data: permission, error: permissionError } =
      await supabase
        .from("permissions")
        .select("id, module, action")
        .eq("module", module)
        .eq("action", action)
        .maybeSingle();

    if (permissionError) {
      console.error(
        "Permission lookup error:",
        permissionError
      );

      return {
        allowed: false,
        reason: "database_error",
      };
    }

    /*
     * Permission does not exist.
     *
     * Deny by default.
     */
    if (!permission) {
      return {
        allowed: false,
        reason: "no_permission",
      };
    }

    /*
     * -------------------------------------------------------
     * 7. Explicit user permission override
     * -------------------------------------------------------
     *
     * If a direct user permission exists, it takes
     * priority over role permissions.
     */
    const { data: userPermission, error: userPermissionError } =
      await supabase
        .from("user_permissions")
        .select("allowed")
        .eq("user_id", user.id)
        .eq("permission_id", permission.id)
        .maybeSingle();

    if (userPermissionError) {
      console.error(
        "User permission lookup error:",
        userPermissionError
      );

      return {
        allowed: false,
        reason: "database_error",
      };
    }

    if (userPermission) {
      if (userPermission.allowed) {
        return {
          allowed: true,
          reason: "user_override_allow",
        };
      }

      return {
        allowed: false,
        reason: "user_override_deny",
      };
    }

    /*
     * -------------------------------------------------------
     * 8. Check role permissions
     * -------------------------------------------------------
     */
    const { data: rolePermissionRows, error: rolePermissionsError } =
      await supabase
        .from("role_permissions")
        .select("role_id")
        .eq("permission_id", permission.id)
        .in("role_id", roleIds);

    if (rolePermissionsError) {
      console.error(
        "Role permission lookup error:",
        rolePermissionsError
      );

      return {
        allowed: false,
        reason: "database_error",
      };
    }

    /*
     * At least one assigned active role has
     * the requested permission.
     */
    const hasRolePermission =
      (rolePermissionRows ?? []).length > 0;

    if (hasRolePermission) {
      return {
        allowed: true,
        reason: "role_permission",
      };
    }

    /*
     * -------------------------------------------------------
     * 9. Deny by default
     * -------------------------------------------------------
     */
    return {
      allowed: false,
      reason: "no_permission",
    };
  } catch (error) {
    console.error(
      "Permission check error:",
      error
    );

    return {
      allowed: false,
      reason: "database_error",
    };
  }
}

/**
 * Simple boolean permission check.
 *
 * Example:
 *
 * const allowed = await hasPermission(
 *   "orders",
 *   "edit"
 * );
 */
export async function hasPermission(
  module: string,
  action: string
): Promise<boolean> {
  const result = await checkPermission(
    module,
    action
  );

  return result.allowed;
}

/**
 * Require a permission.
 *
 * This helper is intended for protected server-side
 * operations and API routes.
 *
 * Throws an error when the user does not have permission.
 */
export async function requirePermission(
  module: string,
  action: string
): Promise<void> {
  const result = await checkPermission(
    module,
    action
  );

  if (!result.allowed) {
    throw new Error(
      `Permission denied: ${module}.${action}`
    );
  }
}

/**
 * Check multiple permissions.
 *
 * Returns true if the user has at least one
 * of the requested permissions.
 */
export async function hasAnyPermission(
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    const allowed = await hasPermission(
      permission.module,
      permission.action
    );

    if (allowed) {
      return true;
    }
  }

  return false;
}

/**
 * Check multiple permissions.
 *
 * Returns true only when the user has ALL
 * requested permissions.
 */
export async function hasAllPermissions(
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    const allowed = await hasPermission(
      permission.module,
      permission.action
    );

    if (!allowed) {
      return false;
    }
  }

  return true;
}