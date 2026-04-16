import { createClient } from "@/lib/supabase/client";

export type SocialAccount = any;
export type PublishedPost = any;

/**
 * Get all social accounts for a dealership
 */
export async function getSocialAccounts(dealershipId: string): Promise<SocialAccount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a specific social account
 */
export async function getSocialAccount(
  accountId: string
): Promise<SocialAccount | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Create a social account (after OAuth callback)
 */
export async function createSocialAccount(
  dealershipId: string,
  provider: "facebook" | "instagram" | "twitter",
  providerUserId: string,
  oauthToken: string,
  accountName?: string,
  additionalData?: {
    refreshToken?: string;
    tokenExpiresAt?: string;
    oauthTokenSecret?: string;
  }
): Promise<SocialAccount> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("social_accounts")
    .insert({
      dealership_id: dealershipId,
      provider,
      provider_user_id: providerUserId,
      account_name: accountName,
      oauth_token: oauthToken,
      oauth_token_secret: additionalData?.oauthTokenSecret || null,
      refresh_token: additionalData?.refreshToken || null,
      token_expires_at: additionalData?.tokenExpiresAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SocialAccount;
}

/**
 * Update social account tokens (for token refresh)
 */
export async function updateSocialAccountTokens(
  accountId: string,
  oauthToken: string,
  additionalData?: {
    refreshToken?: string;
    tokenExpiresAt?: string;
  }
): Promise<SocialAccount> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("social_accounts")
    .update({
      oauth_token: oauthToken,
      refresh_token: additionalData?.refreshToken || null,
      token_expires_at: additionalData?.tokenExpiresAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .select()
    .single();

  if (error) throw error;
  return data as SocialAccount;
}

/**
 * Delete a social account
 */
export async function deleteSocialAccount(accountId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("social_accounts")
    .delete()
    .eq("id", accountId);

  if (error) throw error;
}

/**
 * Create a published post record
 */
export async function createPublishedPost(
  dealershipId: string,
  assetId: string | null,
  socialAccountId: string,
  platform: string,
  caption: string,
  postUrl?: string,
  postId?: string
): Promise<PublishedPost> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("published_posts")
    .insert({
      dealership_id: dealershipId,
      asset_id: assetId,
      social_account_id: socialAccountId,
      platform,
      caption,
      post_url: postUrl || null,
      post_id: postId || null,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as PublishedPost;
}

/**
 * Get published posts for an asset
 */
export async function getPublishedPostsForAsset(
  assetId: string
): Promise<PublishedPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("published_posts")
    .select("*")
    .eq("asset_id", assetId)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get recent published posts for a dealership
 */
export async function getRecentPublishedPosts(
  dealershipId: string,
  limit = 10
): Promise<PublishedPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("published_posts")
    .select("*")
    .eq("dealership_id", dealershipId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
