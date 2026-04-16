import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getSocialAccount, createPublishedPost } from "@/lib/db/social";
import { MetaClient, TwitterClient } from "@/lib/social/clients";

interface PublishRequest {
  assetId: string;
  accountId: string;
  caption: string;
  imageUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    const body: PublishRequest = await request.json();
    const { assetId, accountId, caption, imageUrl } = body;

    if (!accountId || !caption || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the social account
    const account = await getSocialAccount(accountId);

    if (!account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    if (account.dealership_id !== profile.dealership_id) {
      return NextResponse.json(
        { error: "Unauthorized access to this account" },
        { status: 403 }
      );
    }

    let postId: string;
    let postUrl: string;

    // Publish based on platform
    if (account.provider === "facebook") {
      const metaClient = new MetaClient();
      const result = await metaClient.postImage(
        account.provider_user_id,
        account.oauth_token,
        imageUrl,
        caption
      );
      postId = result.postId;
      postUrl = result.postUrl;
    } else if (account.provider === "instagram") {
      const metaClient = new MetaClient();
      const result = await metaClient.postInstagramImage(
        account.provider_user_id,
        account.oauth_token,
        imageUrl,
        caption
      );
      postId = result.postId;
      postUrl = result.postUrl;
    } else if (account.provider === "twitter") {
      const twitterClient = new TwitterClient();
      // For Twitter, we'd need to handle image uploads separately
      // For simplicity, posting text with URL
      const result = await twitterClient.postTweet(
        account.oauth_token,
        `${caption}\n${imageUrl}`
      );
      postId = result.postId;
      postUrl = result.postUrl;
    } else {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

    // Record the published post
    await createPublishedPost(
      profile.dealership_id,
      assetId || null,
      accountId,
      account.provider,
      caption,
      postUrl,
      postId
    );

    // Log the action
    await supabase.from("usage_logs").insert({
      dealership_id: profile.dealership_id,
      action: `social_publish_${account.provider}`,
      credits_used: 0,
      metadata: {
        platform: account.provider,
        post_url: postUrl,
      },
    });

    return NextResponse.json({
      success: true,
      postId,
      postUrl,
      platform: account.provider,
    });
  } catch (error) {
    console.error("Publish error:", error);
    const message = error instanceof Error ? error.message : "Publishing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
