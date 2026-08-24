import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

/*
|--------------------------------------------------------------------------
| GET — Single Account
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

    const accountId = Number(id);

    if (!Number.isFinite(accountId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid account ID.",
        },
        { status: 400 }
      );
    }

    const { data: account, error } =
      await supabaseAdmin
        .from("accounts")
        .select(`
          id,
          name,
          account_type,
          ownership_type,
          business_name,
          opening_balance,
          is_active,
          notes,
          created_at,
          updated_at
        `)
        .eq("id", accountId)
        .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    const { data: transactions } =
      await supabaseAdmin
        .from("transactions")
        .select(`
          transaction_type,
          amount
        `)
        .eq("account_id", accountId);

    let balance = numberValue(
      account.opening_balance
    );

    (transactions || []).forEach((transaction) => {
      const type = String(
        transaction.transaction_type || ""
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
    });

    return NextResponse.json({
      success: true,
      account: {
        ...account,
        opening_balance: numberValue(
          account.opening_balance
        ),
        current_balance: balance,
      },
    });
  } catch (error) {
    console.error(
      "SINGLE ACCOUNT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load account.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH — Update Account
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

    const accountId = Number(id);

    if (!Number.isFinite(accountId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid account ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = cleanText(body.name);
    const accountType = cleanText(
      body.account_type
    );

    const ownershipType =
      cleanText(body.ownership_type) ||
      "personal";

    const businessName = cleanText(
      body.business_name
    );

    const notes = cleanText(body.notes);

    const openingBalance = numberValue(
      body.opening_balance
    );

    const isActive =
      typeof body.is_active === "boolean"
        ? body.is_active
        : true;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Account name is required.",
        },
        { status: 400 }
      );
    }

    if (!accountType) {
      return NextResponse.json(
        {
          success: false,
          error: "Account type is required.",
        },
        { status: 400 }
      );
    }

    if (
      ownershipType !== "personal" &&
      ownershipType !== "business"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ownership type.",
        },
        { status: 400 }
      );
    }

    if (
      ownershipType === "business" &&
      !businessName
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Business name is required for business accounts.",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("accounts")
        .update({
          name,
          account_type: accountType,
          ownership_type: ownershipType,
          business_name:
            ownershipType === "business"
              ? businessName
              : null,
          opening_balance: openingBalance,
          is_active: isActive,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId)
        .select(`
          id,
          name,
          account_type,
          ownership_type,
          business_name,
          opening_balance,
          is_active,
          notes,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        "ACCOUNT UPDATE ERROR:",
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
      account: {
        ...data,
        opening_balance: numberValue(
          data.opening_balance
        ),
      },
    });
  } catch (error) {
    console.error(
      "ACCOUNT UPDATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update account.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE — Delete Account
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

    const accountId = Number(id);

    if (!Number.isFinite(accountId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid account ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Prevent accidental deletion of an account
     * that already has transactions.
     */
    const { count, error: countError } =
      await supabaseAdmin
        .from("transactions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("account_id", accountId);

    if (countError) {
      console.error(
        "ACCOUNT TRANSACTION CHECK ERROR:",
        countError
      );

      return NextResponse.json(
        {
          success: false,
          error: countError.message,
        },
        { status: 500 }
      );
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This account has transactions and cannot be deleted. Deactivate it instead.",
        },
        { status: 409 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("accounts")
        .delete()
        .eq("id", accountId);

    if (error) {
      console.error(
        "ACCOUNT DELETE ERROR:",
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
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error(
      "ACCOUNT DELETE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account.",
      },
      { status: 500 }
    );
  }
}