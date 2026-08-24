import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function numberValue(
  value: unknown
): number {
  const number = Number(
    value ?? 0
  );

  return Number.isFinite(number)
    ? number
    : 0;
}

function cleanText(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function nullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/*
|--------------------------------------------------------------------------
| GET — Goal Contributions
|
| Optional:
| ?goal_id=1
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const goalIdParam =
      searchParams.get(
        "goal_id"
      );

    let query =
      supabaseAdmin
        .from(
          "money_goal_contributions"
        )
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
        .order(
          "contribution_date",
          {
            ascending: false,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (goalIdParam) {
      const goalId =
        Number(
          goalIdParam
        );

      if (
        !Number.isFinite(
          goalId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid goal ID.",
          },
          {
            status: 400,
          }
        );
      }

      query =
        query.eq(
          "goal_id",
          goalId
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "GOAL CONTRIBUTIONS GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    const contributions =
      (data || []).map(
        (contribution) => ({
          ...contribution,

          amount:
            numberValue(
              contribution.amount
            ),
        })
      );

    const total =
      contributions.reduce(
        (
          sum,
          contribution
        ) =>
          sum +
          numberValue(
            contribution.amount
          ),
        0
      );

    return NextResponse.json({
      success: true,
      contributions,
      total,
    });
  } catch (error) {
    console.error(
      "GOAL CONTRIBUTIONS GET UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load goal contributions.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST — Add Goal Contribution
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const goalId =
      Number(
        body.goal_id
      );

    const accountId =
      nullableNumber(
        body.account_id
      );

    const amount =
      numberValue(
        body.amount
      );

    const contributionDate =
      cleanText(
        body.contribution_date
      ) ||
      new Date().toISOString();

    const note =
      cleanText(
        body.note
      );

    const transactionId =
      nullableNumber(
        body.transaction_id
      );

    if (
      !Number.isFinite(
        goalId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid goal is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      accountId !== null &&
      !Number.isFinite(
        accountId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid account.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Contribution amount must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      transactionId !==
        null &&
      !Number.isFinite(
        transactionId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid transaction.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check goal
     */

    const {
      data: goal,
      error: goalError,
    } =
      await supabaseAdmin
        .from(
          "money_goals"
        )
        .select(`
          id,
          name,
          target_amount,
          status
        `)
        .eq(
          "id",
          goalId
        )
        .single();

    if (
      goalError ||
      !goal
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Goal not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Check account
     */

    if (
      accountId !== null
    ) {
      const {
        data: account,
        error:
          accountError,
      } =
        await supabaseAdmin
          .from(
            "money_accounts"
          )
          .select(`
            id,
            name,
            is_active
          `)
          .eq(
            "id",
            accountId
          )
          .single();

      if (
        accountError ||
        !account
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Account not found.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        !account.is_active
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected account is inactive.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Check transaction
     */

    if (
      transactionId !==
      null
    ) {
      const {
        data: transaction,
        error:
          transactionError,
      } =
        await supabaseAdmin
          .from(
            "money_transactions"
          )
          .select("id")
          .eq(
            "id",
            transactionId
          )
          .single();

      if (
        transactionError ||
        !transaction
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Transaction not found.",
          },
          {
            status: 404
          }
        );
      }
    }

    /*
     * Create contribution
     */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "money_goal_contributions"
        )
        .insert({
          goal_id:
            goalId,

          account_id:
            accountId,

          amount,

          contribution_date:
            contributionDate,

          note:
            note || null,

          transaction_id:
            transactionId,
        })
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
        .single();

    if (error) {
      console.error(
        "GOAL CONTRIBUTION CREATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Update goal status
     */

    await refreshGoalStatus(
      goalId
    );

    return NextResponse.json(
      {
        success: true,

        contribution: {
          ...data,

          amount:
            numberValue(
              data.amount
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "GOAL CONTRIBUTION CREATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create goal contribution.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT — Update Goal Contribution
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const contributionId =
      Number(
        body.id
      );

    const goalId =
      Number(
        body.goal_id
      );

    const accountId =
      nullableNumber(
        body.account_id
      );

    const amount =
      numberValue(
        body.amount
      );

    const contributionDate =
      cleanText(
        body.contribution_date
      );

    const note =
      cleanText(
        body.note
      );

    if (
      !Number.isFinite(
        contributionId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid contribution ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        goalId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid goal is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Contribution amount must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !contributionDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Contribution date is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find existing contribution
     */

    const {
      data: existing,
      error:
        existingError,
    } =
      await supabaseAdmin
        .from(
          "money_goal_contributions"
        )
        .select(`
          id,
          goal_id,
          account_id,
          amount
        `)
        .eq(
          "id",
          contributionId
        )
        .single();

    if (
      existingError ||
      !existing
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Contribution not found.",
        },
        {
          status: 404,
        }
      );
    }

    const oldGoalId =
      Number(
        existing.goal_id
      );

    /*
     * Check new goal
     */

    const {
      data: goal,
      error: goalError,
    } =
      await supabaseAdmin
        .from(
          "money_goals"
        )
        .select(`
          id,
          name,
          target_amount,
          status
        `)
        .eq(
          "id",
          goalId
        )
        .single();

    if (
      goalError ||
      !goal
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Goal not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Check account
     */

    if (
      accountId !== null
    ) {
      const {
        data: account,
        error:
          accountError,
      } =
        await supabaseAdmin
          .from(
            "money_accounts"
          )
          .select(`
            id,
            name,
            is_active
          `)
          .eq(
            "id",
            accountId
          )
          .single();

      if (
        accountError ||
        !account
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Account not found.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        !account.is_active
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected account is inactive.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Update contribution
     */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "money_goal_contributions"
        )
        .update({
          goal_id:
            goalId,

          account_id:
            accountId,

          amount,

          contribution_date:
            contributionDate,

          note:
            note || null,
        })
        .eq(
          "id",
          contributionId
        )
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
        .single();

    if (error) {
      console.error(
        "GOAL CONTRIBUTION UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Refresh old goal
     * and new goal status.
     *
     * This also handles the case
     * where a contribution is moved
     * from one goal to another.
     */

    await refreshGoalStatus(
      oldGoalId
    );

    if (
      goalId !== oldGoalId
    ) {
      await refreshGoalStatus(
        goalId
      );
    } else {
      await refreshGoalStatus(
        goalId
      );
    }

    return NextResponse.json({
      success: true,

      contribution: {
        ...data,

        amount:
          numberValue(
            data.amount
          ),
      },
    });
  } catch (error) {
    console.error(
      "GOAL CONTRIBUTION UPDATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update goal contribution.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE — Delete Goal Contribution
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(
        request.url
      );

    const contributionId =
      Number(
        searchParams.get(
          "id"
        )
      );

    if (
      !Number.isFinite(
        contributionId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid contribution ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find contribution first
     */

    const {
      data: existing,
      error:
        existingError,
    } =
      await supabaseAdmin
        .from(
          "money_goal_contributions"
        )
        .select(`
          id,
          goal_id
        `)
        .eq(
          "id",
          contributionId
        )
        .single();

    if (
      existingError ||
      !existing
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Contribution not found.",
        },
        {
          status: 404,
        }
      );
    }

    const goalId =
      Number(
        existing.goal_id
      );

    /*
     * Delete
     */

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "money_goal_contributions"
        )
        .delete()
        .eq(
          "id",
          contributionId
        );

    if (error) {
      console.error(
        "GOAL CONTRIBUTION DELETE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Refresh goal status
     */

    await refreshGoalStatus(
      goalId
    );

    return NextResponse.json({
      success: true,
      deleted_id:
        contributionId,
      goal_id:
        goalId,
    });
  } catch (error) {
    console.error(
      "GOAL CONTRIBUTION DELETE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete goal contribution.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| Goal Status Helper
|--------------------------------------------------------------------------
*/

async function refreshGoalStatus(
  goalId: number
) {
  try {
    const {
      data: goal,
      error: goalError,
    } =
      await supabaseAdmin
        .from(
          "money_goals"
        )
        .select(`
          id,
          target_amount,
          status
        `)
        .eq(
          "id",
          goalId
        )
        .single();

    if (
      goalError ||
      !goal
    ) {
      console.error(
        "REFRESH GOAL STATUS GOAL ERROR:",
        goalError
      );

      return;
    }

    const {
      data: contributions,
      error:
        contributionsError,
    } =
      await supabaseAdmin
        .from(
          "money_goal_contributions"
        )
        .select(
          "amount"
        )
        .eq(
          "goal_id",
          goalId
        );

    if (
      contributionsError
    ) {
      console.error(
        "REFRESH GOAL STATUS CONTRIBUTIONS ERROR:",
        contributionsError
      );

      return;
    }

    const contributed =
      (
        contributions ||
        []
      ).reduce(
        (
          sum,
          item
        ) =>
          sum +
          numberValue(
            item.amount
          ),
        0
      );

    const targetAmount =
      numberValue(
        goal.target_amount
      );

    /*
     * Only automatically complete
     * an active goal.
     *
     * If a completed goal is edited
     * below target, return it to active.
     */

    let nextStatus =
      goal.status;

    if (
      targetAmount > 0 &&
      contributed >=
        targetAmount
    ) {
      nextStatus =
        "completed";
    } else if (
      goal.status ===
      "completed"
    ) {
      nextStatus =
        "active";
    }

    if (
      nextStatus !==
      goal.status
    ) {
      await supabaseAdmin
        .from(
          "money_goals"
        )
        .update({
          status:
            nextStatus,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          goalId
        );
    }
  } catch (error) {
    console.error(
      "REFRESH GOAL STATUS UNEXPECTED ERROR:",
      error
    );
  }
}