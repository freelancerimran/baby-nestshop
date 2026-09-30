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

function validTransactionType(value: string) {
  return (
    value === "income" ||
    value === "expense" ||
    value === "transfer"
  );
}

/*
|--------------------------------------------------------------------------
| GET — Transactions
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("money_transactions")
        .select(`
          id,
          account_id,
          transaction_type,
          ownership_type,
          category_id,
          amount,
          transaction_date,
          description,
          reference,
          related_account_id,
          goal_id,
          created_at,
          updated_at
        `)
        .order("transaction_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "TRANSACTIONS GET ERROR:",
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

    const transactions = (data || []).map(
      (transaction) => ({
        ...transaction,
        amount: numberValue(
          transaction.amount
        ),
      })
    );

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error(
      "TRANSACTIONS GET UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load transactions.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST — Create Transaction
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const accountId = Number(
      body.account_id
    );

    const transactionType =
      cleanText(
        body.transaction_type
      ).toLowerCase();

    const ownershipType =
      cleanText(
        body.ownership_type
      ).toLowerCase() || "personal";

    const categoryId =
      body.category_id === null ||
      body.category_id === undefined ||
      body.category_id === ""
        ? null
        : Number(body.category_id);

    const amount = numberValue(
      body.amount
    );

    const transactionDate =
      cleanText(
        body.transaction_date
      ) ||
      new Date().toISOString();

    const description =
      cleanText(
        body.description
      );

    const reference =
      cleanText(
        body.reference
      );

    const relatedAccountId =
      body.related_account_id ===
        null ||
      body.related_account_id ===
        undefined ||
      body.related_account_id === ""
        ? null
        : Number(
            body.related_account_id
          );

    const goalId =
      body.goal_id === null ||
      body.goal_id === undefined ||
      body.goal_id === ""
        ? null
        : Number(body.goal_id);

    /*
     * Validation
     */

    if (!Number.isFinite(accountId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid account is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !validTransactionType(
        transactionType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid transaction type.",
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

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Transaction amount must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check account
     */

    const {
      data: account,
      error: accountError,
    } =
      await supabaseAdmin
        .from("money_accounts")
        .select(`
          id,
          name,
          ownership_type,
          is_active
        `)
        .eq("id", accountId)
        .single();

    if (accountError || !account) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected account was not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!account.is_active) {
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

    /*
     * Transfer validation
     */

    if (
      transactionType ===
      "transfer"
    ) {
      if (
        !relatedAccountId ||
        !Number.isFinite(
          relatedAccountId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Destination account is required for a transfer.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        relatedAccountId ===
        accountId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Source and destination accounts cannot be the same.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: relatedAccount,
        error:
          relatedAccountError,
      } =
        await supabaseAdmin
          .from("money_accounts")
          .select(`
            id,
            name,
            ownership_type,
            is_active
          `)
          .eq(
            "id",
            relatedAccountId
          )
          .single();

      if (
        relatedAccountError ||
        !relatedAccount
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Destination account was not found.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        !relatedAccount.is_active
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Destination account is inactive.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Check category
     */

    if (
      categoryId !== null &&
      !Number.isFinite(categoryId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid category.",
        },
        {
          status: 400,
        }
      );
    }

    if (categoryId !== null) {
      const {
        data: category,
        error: categoryError,
      } =
        await supabaseAdmin
          .from("money_categories")
          .select("id")
          .eq("id", categoryId)
          .single();

      if (
        categoryError ||
        !category
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected category was not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * Check goal
     */

    if (
      goalId !== null &&
      !Number.isFinite(goalId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid goal.",
        },
        {
          status: 400,
        }
      );
    }

    if (goalId !== null) {
      const {
        data: goal,
        error: goalError,
      } =
        await supabaseAdmin
          .from("money_goals")
          .select("id")
          .eq("id", goalId)
          .single();

      if (
        goalError ||
        !goal
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected goal was not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * Create transaction
     */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("money_transactions")
        .insert({
          account_id: accountId,
          transaction_type:
            transactionType,
          ownership_type:
            ownershipType,
          category_id: categoryId,
          amount,
          transaction_date:
            transactionDate,
          description:
            description || null,
          reference:
            reference || null,
          related_account_id:
            transactionType ===
            "transfer"
              ? relatedAccountId
              : null,
          goal_id: goalId,
        })
        .select(`
          id,
          account_id,
          transaction_type,
          ownership_type,
          category_id,
          amount,
          transaction_date,
          description,
          reference,
          related_account_id,
          goal_id,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        "TRANSACTION CREATE ERROR:",
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

    /*
     * Goal contribution
     */

    if (
      goalId !== null &&
      transactionType ===
        "income"
    ) {
      const {
        error:
          contributionError,
      } =
        await supabaseAdmin
          .from(
            "money_goal_contributions"
          )
          .insert({
            goal_id: goalId,
            account_id: accountId,
            amount,
            contribution_date:
              transactionDate,
            note:
              description ||
              "Goal contribution",
            transaction_id:
              data.id,
          });

      if (contributionError) {
        console.error(
          "GOAL CONTRIBUTION ERROR:",
          contributionError
        );
      }
    }

    const auditLogged = await writeAuditLog({
      request,
      action: "create_transaction",
      module: "finance",
      targetType: "money_transaction",
      targetId: data?.id,
      description:
        `Created ${transactionType} transaction ${data?.id ?? ""}.`.trim(),
      metadata: {
        transaction_id: data?.id,
        account_id: accountId,
        transaction_type:
          data?.transaction_type ??
          transactionType,
        ownership_type:
          data?.ownership_type ??
          ownershipType,
        category_id:
          data?.category_id ?? categoryId,
        amount: numberValue(
          data?.amount ?? amount
        ),
        transaction_date:
          data?.transaction_date ??
          transactionDate,
        description:
          data?.description ??
          (description || null),
        reference:
          data?.reference ??
          (reference || null),
        related_account_id:
          data?.related_account_id ??
          (transactionType === "transfer"
            ? relatedAccountId
            : null),
        goal_id:
          data?.goal_id ?? goalId,
        goal_contribution_created:
          goalId !== null &&
          transactionType === "income",
      },
    });

    return NextResponse.json(
      {
        success: true,
        transaction: {
          ...data,
          amount: numberValue(
            data.amount
          ),
        },
        auditLogged,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "TRANSACTION CREATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create transaction.",
      },
      {
        status: 500,
      }
    );
  }
}