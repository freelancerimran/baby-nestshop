import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { writeAuditLog } from "@/lib/audit";

function numberValue(value: unknown) {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function validOwnership(value: string) {
  return (
    value === "personal" ||
    value === "business"
  );
}

function validStatus(value: string) {
  return (
    value === "active" ||
    value === "completed" ||
    value === "paused" ||
    value === "cancelled"
  );
}


/*
|--------------------------------------------------------------------------
| GET — Single Goal
|--------------------------------------------------------------------------
*/

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const goalId = Number(id);

    if (!Number.isFinite(goalId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid goal ID.",
        },
        { status: 400 }
      );
    }

    const {
      data: goal,
      error: goalError,
    } = await supabaseAdmin
      .from("money_goals")
      .select(`
        id,
        name,
        description,
        ownership_type,
        target_amount,
        monthly_target,
        start_date,
        target_date,
        status,
        notes,
        created_at,
        updated_at
      `)
      .eq("id", goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        {
          success: false,
          error:
            goalError?.message ||
            "Goal not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: contributions,
      error: contributionsError,
    } = await supabaseAdmin
      .from("money_goal_contributions")
      .select(`
        id,
        goal_id,
        account_id,
        amount,
        contribution_date,
        note,
        transaction_id,
        created_at
      `)
      .eq("goal_id", goalId)
      .order("contribution_date", {
        ascending: false,
      });

    if (contributionsError) {
      console.error(
        "GOAL CONTRIBUTIONS GET ERROR:",
        contributionsError
      );
    }

    const contributed = (
      contributions || []
    ).reduce(
      (sum, contribution) =>
        sum +
        numberValue(
          contribution.amount
        ),
      0
    );

    const targetAmount = numberValue(
      goal.target_amount
    );

    const remaining = Math.max(
      0,
      targetAmount - contributed
    );

    const percentage =
      targetAmount > 0
        ? Math.min(
            100,
            (contributed / targetAmount) * 100
          )
        : 0;

    return NextResponse.json({
      success: true,
      goal: {
        ...goal,
        target_amount: targetAmount,
        monthly_target: numberValue(
          goal.monthly_target
        ),
        contributed,
        remaining,
        percentage,
      },
      contributions: (
        contributions || []
      ).map((contribution) => ({
        ...contribution,
        amount: numberValue(
          contribution.amount
        ),
      })),
    });
  } catch (error) {
    console.error(
      "SINGLE GOAL GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load goal.",
      },
      { status: 500 }
    );
  }
}


/*
|--------------------------------------------------------------------------
| PATCH — Update Goal
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const goalId = Number(id);

    if (!Number.isFinite(goalId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid goal ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = cleanText(body.name);

    const description =
      cleanText(body.description);

    const ownershipType =
      cleanText(
        body.ownership_type
      ).toLowerCase() ||
      "personal";

    const targetAmount = numberValue(
      body.target_amount
    );

    const monthlyTarget = numberValue(
      body.monthly_target
    );

    const startDate =
      cleanText(body.start_date) ||
      null;

    const targetDate =
      cleanText(body.target_date) ||
      null;

    const status =
      cleanText(body.status)
        .toLowerCase() ||
      "active";

    const notes =
      cleanText(body.notes);


    /*
     * Validation
     */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Goal name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !validOwnership(
        ownershipType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid ownership type.",
        },
        { status: 400 }
      );
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Target amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (monthlyTarget < 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Monthly target cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (
      !validStatus(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid goal status.",
        },
        { status: 400 }
      );
    }


    /*
     * Get existing goal snapshot for audit.
     */
    const {
      data: existingGoal,
      error: existingGoalError,
    } = await supabaseAdmin
      .from("money_goals")
      .select(`
        id,
        name,
        description,
        ownership_type,
        target_amount,
        monthly_target,
        start_date,
        target_date,
        status,
        notes,
        created_at,
        updated_at
      `)
      .eq("id", goalId)
      .single();

    if (existingGoalError || !existingGoal) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingGoalError?.message ||
            "Goal not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Update
     */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("money_goals")
      .update({
        name,
        description:
          description || null,
        ownership_type:
          ownershipType,
        target_amount:
          targetAmount,
        monthly_target:
          monthlyTarget,
        start_date:
          startDate,
        target_date:
          targetDate,
        status,
        notes:
          notes || null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", goalId)
      .select(`
        id,
        name,
        description,
        ownership_type,
        target_amount,
        monthly_target,
        start_date,
        target_date,
        status,
        notes,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error(
        "GOAL UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const auditLogged = await writeAuditLog({
      request,
      action: "update_goal",
      module: "finance",
      targetType: "money_goal",
      targetId: data?.id ?? goalId,
      description: `Updated money goal "${data?.name ?? name}".`,
      metadata: {
        goal_id: data?.id ?? goalId,
        previous: {
          name: existingGoal.name,
          description: existingGoal.description,
          ownership_type:
            existingGoal.ownership_type,
          target_amount:
            numberValue(
              existingGoal.target_amount
            ),
          monthly_target:
            numberValue(
              existingGoal.monthly_target
            ),
          start_date:
            existingGoal.start_date,
          target_date:
            existingGoal.target_date,
          status: existingGoal.status,
          notes: existingGoal.notes,
        },
        updated: {
          name: data?.name ?? name,
          description:
            data?.description ??
            (description || null),
          ownership_type:
            data?.ownership_type ??
            ownershipType,
          target_amount:
            numberValue(
              data?.target_amount ??
                targetAmount
            ),
          monthly_target:
            numberValue(
              data?.monthly_target ??
                monthlyTarget
            ),
          start_date:
            data?.start_date ?? startDate,
          target_date:
            data?.target_date ?? targetDate,
          status: data?.status ?? status,
          notes:
            data?.notes ?? (notes || null),
        },
      },
    });

    return NextResponse.json({
      success: true,
      goal: {
        ...data,
        target_amount: numberValue(
          data.target_amount
        ),
        monthly_target:
          numberValue(
            data.monthly_target
          ),
      },
      auditLogged,
    });
  } catch (error) {
    console.error(
      "GOAL UPDATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update goal.",
      },
      { status: 500 }
    );
  }
}


/*
|--------------------------------------------------------------------------
| DELETE — Delete Goal
|--------------------------------------------------------------------------
*/

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const goalId = Number(id);

    if (!Number.isFinite(goalId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid goal ID.",
        },
        { status: 400 }
      );
    }


    const {
      data: existingGoal,
      error: existingGoalError,
    } = await supabaseAdmin
      .from("money_goals")
      .select(`
        id,
        name,
        description,
        ownership_type,
        target_amount,
        monthly_target,
        start_date,
        target_date,
        status,
        notes
      `)
      .eq("id", goalId)
      .single();

    if (existingGoalError || !existingGoal) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingGoalError?.message ||
            "Goal not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Check contributions first.
     */

    const {
      count,
      error: countError,
    } = await supabaseAdmin
      .from("money_goal_contributions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("goal_id", goalId);

    if (countError) {
      console.error(
        "GOAL CONTRIBUTION CHECK ERROR:",
        countError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            countError.message,
        },
        { status: 500 }
      );
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This goal has contributions and cannot be deleted. Mark it completed or cancelled instead.",
        },
        { status: 409 }
      );
    }


    /*
     * Delete goal
     */

    const {
      error,
    } = await supabaseAdmin
      .from("money_goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      console.error(
        "GOAL DELETE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const auditLogged = await writeAuditLog({
      request: _request,
      action: "delete_goal",
      module: "finance",
      targetType: "money_goal",
      targetId: String(goalId),
      description: `Deleted money goal "${existingGoal.name}".`,
      metadata: {
        goal_id: goalId,
        goal: existingGoal,
        contribution_count_before_delete:
          count || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Goal deleted successfully.",
      auditLogged,
    });
  } catch (error) {
    console.error(
      "GOAL DELETE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete goal.",
      },
      { status: 500 }
    );
  }
}