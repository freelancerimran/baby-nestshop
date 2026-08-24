import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
| GET — All Goals
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const {
      data: goals,
      error: goalsError,
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
      .order("created_at", {
        ascending: false,
      });

    if (goalsError) {
      console.error(
        "GOALS GET ERROR:",
        goalsError
      );

      return NextResponse.json(
        {
          success: false,
          error: goalsError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Get all contributions once and
     * calculate progress for every goal.
     */

    const {
      data: contributions,
      error:
        contributionsError,
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
      .order("contribution_date", {
        ascending: false,
      });

    if (contributionsError) {
      console.error(
        "GOAL CONTRIBUTIONS GET ERROR:",
        contributionsError
      );
    }

    const contributionList =
      contributions || [];

    const result = (goals || []).map(
      (goal) => {
        const targetAmount =
          numberValue(
            goal.target_amount
          );

        const monthlyTarget =
          numberValue(
            goal.monthly_target
          );

        const goalContributions =
          contributionList.filter(
            (contribution) =>
              contribution.goal_id ===
              goal.id
          );

        const contributed =
          goalContributions.reduce(
            (sum, contribution) =>
              sum +
              numberValue(
                contribution.amount
              ),
            0
          );

        const remaining = Math.max(
          0,
          targetAmount -
            contributed
        );

        const percentage =
          targetAmount > 0
            ? Math.min(
                100,
                (contributed /
                  targetAmount) *
                  100
              )
            : 0;

        return {
          ...goal,
          target_amount:
            targetAmount,
          monthly_target:
            monthlyTarget,
          contributed,
          remaining,
          percentage,
          contribution_count:
            goalContributions.length,
        };
      }
    );

    return NextResponse.json({
      success: true,
      goals: result,
    });
  } catch (error) {
    console.error(
      "GOALS GET UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load goals.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST — Create Goal
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const name = cleanText(
      body.name
    );

    const description =
      cleanText(
        body.description
      );

    const ownershipType =
      cleanText(
        body.ownership_type
      ).toLowerCase() ||
      "personal";

    const targetAmount =
      numberValue(
        body.target_amount
      );

    const monthlyTarget =
      numberValue(
        body.monthly_target
      );

    const startDate =
      cleanText(
        body.start_date
      ) || null;

    const targetDate =
      cleanText(
        body.target_date
      ) || null;

    const status =
      cleanText(
        body.status
      ).toLowerCase() ||
      "active";

    const notes =
      cleanText(
        body.notes
      );


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
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Target amount must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (monthlyTarget < 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Monthly target cannot be negative.",
        },
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }


    /*
     * Create goal
     */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("money_goals")
      .insert({
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
      })
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
        "GOAL CREATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        goal: {
          ...data,
          target_amount:
            numberValue(
              data.target_amount
            ),
          monthly_target:
            numberValue(
              data.monthly_target
            ),
          contributed: 0,
          remaining:
            numberValue(
              data.target_amount
            ),
          percentage: 0,
          contribution_count: 0,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "GOAL CREATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create goal.",
      },
      {
        status: 500,
      }
    );
  }
}