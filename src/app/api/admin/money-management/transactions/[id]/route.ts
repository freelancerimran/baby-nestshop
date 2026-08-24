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

function validTransactionType(value: string) {
  return (
    value === "income" ||
    value === "expense" ||
    value === "transfer"
  );
}


/*
|--------------------------------------------------------------------------
| GET — Single Transaction
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

    const transactionId = Number(id);

    if (!Number.isFinite(transactionId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction ID.",
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("transactions")
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
      .eq("id", transactionId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error:
            error?.message ||
            "Transaction not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        ...data,
        amount: numberValue(
          data.amount
        ),
      },
    });
  } catch (error) {
    console.error(
      "SINGLE TRANSACTION GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load transaction.",
      },
      { status: 500 }
    );
  }
}


/*
|--------------------------------------------------------------------------
| PATCH — Update Transaction
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

    const transactionId = Number(id);

    if (!Number.isFinite(transactionId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction ID.",
        },
        { status: 400 }
      );
    }

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
      ).toLowerCase() ||
      "personal";

    const categoryId =
      body.category_id === null ||
      body.category_id === undefined ||
      body.category_id === ""
        ? null
        : Number(
            body.category_id
          );

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
        : Number(
            body.goal_id
          );


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
        { status: 400 }
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

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Transaction amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (
      categoryId !== null &&
      !Number.isFinite(
        categoryId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid category.",
        },
        { status: 400 }
      );
    }

    if (
      goalId !== null &&
      !Number.isFinite(
        goalId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid goal.",
        },
        { status: 400 }
      );
    }


    /*
     * Check source account
     */

    const {
      data: account,
      error: accountError,
    } = await supabaseAdmin
      .from("accounts")
      .select(`
        id,
        name,
        is_active
      `)
      .eq("id", accountId)
      .single();

    if (
      accountError ||
      !account
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected account was not found.",
        },
        { status: 404 }
      );
    }

    if (!account.is_active) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected account is inactive.",
        },
        { status: 400 }
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
        relatedAccountId ===
          null ||
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
          { status: 400 }
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
          { status: 400 }
        );
      }

      const {
        data: relatedAccount,
        error:
          relatedAccountError,
      } = await supabaseAdmin
        .from("accounts")
        .select(`
          id,
          name,
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
          { status: 404 }
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
          { status: 400 }
        );
      }
    }


    /*
     * Check goal
     */

    if (goalId !== null) {
      const {
        data: goal,
        error: goalError,
      } = await supabaseAdmin
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
          { status: 404 }
        );
      }
    }


    /*
     * Find existing transaction
     *
     * This is needed because a goal
     * contribution may be linked to it.
     */

    const {
      data: existingTransaction,
      error:
        existingTransactionError,
    } = await supabaseAdmin
      .from("transactions")
      .select(`
        id,
        goal_id,
        transaction_type
      `)
      .eq("id", transactionId)
      .single();

    if (
      existingTransactionError ||
      !existingTransaction
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Transaction not found.",
        },
        { status: 404 }
      );
    }


    /*
     * Update transaction
     */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("transactions")
      .update({
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
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", transactionId)
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
        "TRANSACTION UPDATE ERROR:",
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


    /*
     * Remove old goal contribution
     *
     * If this transaction was previously
     * connected to a goal, remove the old
     * contribution before creating the
     * new one.
     */

    await supabaseAdmin
      .from(
        "money_goal_contributions"
      )
      .delete()
      .eq(
        "transaction_id",
        transactionId
      );


    /*
     * Re-create goal contribution
     *
     * Only income transactions contribute
     * automatically to a goal.
     */

    if (
      goalId !== null &&
      transactionType ===
        "income"
    ) {
      const {
        error:
          contributionError,
      } = await supabaseAdmin
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
            transactionId,
        });

      if (contributionError) {
        console.error(
          "UPDATED GOAL CONTRIBUTION ERROR:",
          contributionError
        );
      }
    }


    return NextResponse.json({
      success: true,
      transaction: {
        ...data,
        amount: numberValue(
          data.amount
        ),
      },
    });
  } catch (error) {
    console.error(
      "TRANSACTION UPDATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update transaction.",
      },
      { status: 500 }
    );
  }
}


/*
|--------------------------------------------------------------------------
| DELETE — Delete Transaction
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

    const transactionId = Number(id);

    if (!Number.isFinite(transactionId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction ID.",
        },
        { status: 400 }
      );
    }


    /*
     * Remove linked goal contribution first.
     */

    const {
      error:
        contributionDeleteError,
    } = await supabaseAdmin
      .from(
        "money_goal_contributions"
      )
      .delete()
      .eq(
        "transaction_id",
        transactionId
      );

    if (
      contributionDeleteError
    ) {
      console.error(
        "TRANSACTION CONTRIBUTION DELETE ERROR:",
        contributionDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            contributionDeleteError.message,
        },
        { status: 500 }
      );
    }


    /*
     * Delete transaction
     */

    const {
      error,
    } = await supabaseAdmin
      .from("transactions")
      .delete()
      .eq(
        "id",
        transactionId
      );

    if (error) {
      console.error(
        "TRANSACTION DELETE ERROR:",
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

    return NextResponse.json({
      success: true,
      message:
        "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error(
      "TRANSACTION DELETE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete transaction.",
      },
      { status: 500 }
    );
  }
}