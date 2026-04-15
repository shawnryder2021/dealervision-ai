import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getSocialAccounts, deleteSocialAccount } from "@/lib/db/social";

// GET /api/social/accounts - List all connected social accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "No dealership found" },
        { status: 400 }
      );
    }

    const accounts = await getSocialAccounts(profile.dealership_id);

    // Don't return sensitive tokens
    const safeAccounts = accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      accountName: account.account_name,
      createdAt: account.created_at,
      connected: true,
    }));

    return NextResponse.json({ accounts: safeAccounts });
  } catch (error) {
    console.error("Error getting social accounts:", error);
    return NextResponse.json(
      { error: "Failed to get accounts" },
      { status: 500 }
    );
  }
}

// DELETE /api/social/accounts/[id] - Disconnect a social account
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account ID from URL
    const url = new URL(request.url);
    const accountId = url.pathname.split("/").pop();

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID required" },
        { status: 400 }
      );
    }

    await deleteSocialAccount(accountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social account:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
