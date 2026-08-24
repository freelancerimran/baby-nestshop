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

/*
|--------------------------------------------------------------------------
| GET — Accounts
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("money_accounts")
      .select(`
        id,
        name,
        account_type,
        ownership_type,
        business_name,
        opening_balance,
        is_active,
        notes,
        account_scope,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ACCOUNTS GET ERROR:",
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
     * Get all money transactions so we can
     * calculate the current balance of each account.
     */

    const {
      data: transactions,
      error: transactionsError,
    } = await supabaseAdmin
      .from("money_transactions")
      .select(`
        account_id,
        transaction_type,
        amount
      `);

    if (transactionsError) {
      console.error(
        "ACCOUNT TRANSACTIONS ERROR:",
        transactionsError
      );
    }

    const transactionList =
      transactions || [];

    const accounts = (data || []).map(
      (account) => {
        let balance = numberValue(
          account.opening_balance
        );

        transactionList.forEach(
          (transaction) => {
            if (
              transaction.account_id !==
              account.id
            ) {
              return;
            }

            const type = String(
              transaction.transaction_type ||
                ""
            )
              .toLowerCase()
              .trim();

            const amount = numberValue(
              transaction.amount
            );

            if (
              type === "income" ||
              type === "deposit"
            ) {
              balance += amount;
            }

            if (
              type === "expense" ||
              type === "withdrawal"
            ) {
              balance -= amount;
            }
          }
        );

        return {
          ...account,
          opening_balance:
            numberValue(
              account.opening_balance
            ),
          current_balance: balance,
        };
      }
    );

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error(
      "ACCOUNTS GET UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load accounts.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
|--------------------------------------------------------------------------
| POST — Create Account
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const name = cleanText(body.name);

    const accountType = cleanText(
      body.account_type
    );

    const ownershipType =
      cleanText(
        body.ownership_type
      ) || "personal";

    const businessName = cleanText(
      body.business_name
    );

    const notes = cleanText(
      body.notes
    );

    const openingBalance =
      numberValue(
        body.opening_balance
      );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Account name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!accountType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Account type is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ownershipType !== "personal" &&
      ownershipType !== "business"
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

    if (
      ownershipType === "business" &&
      !businessName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Business name is required for business accounts.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("money_accounts")
        .insert({
          name,
          account_type: accountType,
          ownership_type:
            ownershipType,
          business_name:
            ownershipType ===
            "business"
              ? businessName
              : null,
          opening_balance:
            openingBalance,
          is_active: true,
          notes:
            notes || null,
        })
        .select(`
          id,
          name,
          account_type,
          ownership_type,
          business_name,
          opening_balance,
          is_active,
          notes,
          account_scope,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        "ACCOUNT CREATE ERROR:",
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
        account: {
          ...data,
          opening_balance:
            numberValue(
              data.opening_balance
            ),
          current_balance:
            numberValue(
              data.opening_balance
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ACCOUNT CREATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create account.",
      },
      {
        status: 500,
      }
    );
  }
}