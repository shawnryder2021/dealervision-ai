/**
 * Social Media API Clients
 * Handles OAuth flows and API calls for Facebook, Instagram, and Twitter
 */

import crypto from "crypto";

/**
 * Facebook/Instagram API Client
 * Uses Meta's Graph API
 */
export class MetaClient {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;
  private scope: string[];

  constructor(
    appId = process.env.FACEBOOK_APP_ID || "",
    appSecret = process.env.FACEBOOK_APP_SECRET || "",
    redirectUri = process.env.FACEBOOK_REDIRECT_URI || ""
  ) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.redirectUri = redirectUri;
    this.scope = ["business_basic_access", "pages_read_engagement", "pages_manage_posts"];
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: this.scope.join(","),
      state,
      response_type: "code",
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    userId: string;
  }> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook OAuth error: ${data.error.message}`);
    }

    return {
      accessToken: data.access_token,
      userId: data.user_id,
    };
  }

  /**
   * Get user's pages (for posting)
   */
  async getPages(
    accessToken: string
  ): Promise<Array<{ id: string; name: string; access_token: string }>> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(`Failed to get pages: ${data.error.message}`);
    }

    return data.data || [];
  }

  /**
   * Post an image to a Facebook page
   */
  async postImage(
    pageId: string,
    accessToken: string,
    imageUrl: string,
    caption: string
  ): Promise<{ postId: string; postUrl: string }> {
    const formData = new URLSearchParams({
      url: imageUrl,
      caption,
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(`Failed to post to Facebook: ${data.error.message}`);
    }

    return {
      postId: data.id,
      postUrl: `https://facebook.com/${pageId}/posts/${data.id}`,
    };
  }

  /**
   * Post an image to Instagram (via Instagram Graph API)
   */
  async postInstagramImage(
    igUserId: string,
    accessToken: string,
    imageUrl: string,
    caption: string
  ): Promise<{ postId: string; postUrl: string }> {
    // First, create a media container
    const containerResponse = await fetch(
      `https://graph.instagram.com/v18.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      throw new Error(`Failed to create Instagram container: ${containerData.error.message}`);
    }

    const containerId = containerData.id;

    // Then publish the container
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(`Failed to publish Instagram post: ${publishData.error.message}`);
    }

    return {
      postId: publishData.id,
      postUrl: `https://instagram.com/p/${publishData.id}`,
    };
  }
}

/**
 * Twitter API Client
 * Uses Twitter API v2 (requires Bearer token)
 */
export class TwitterClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor(
    clientId = process.env.TWITTER_CLIENT_ID || "",
    clientSecret = process.env.TWITTER_CLIENT_SECRET || "",
    redirectUri = process.env.TWITTER_REDIRECT_URI || ""
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scopes = ["tweet.write", "tweet.read", "users.read"];
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `https://twitter.com/i/oauth2/authorize?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<{ accessToken: string; userId: string }> {
    const response = await fetch("https://twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
          "base64"
        )}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Twitter OAuth error: ${data.error_description}`);
    }

    return {
      accessToken: data.access_token,
      userId: data.id_token ? JSON.parse(atob(data.id_token.split(".")[1])).sub : "",
    };
  }

  /**
   * Post a tweet with image
   */
  async postTweet(
    accessToken: string,
    text: string,
    mediaId?: string
  ): Promise<{ postId: string; postUrl: string }> {
    const body: any = { text };

    if (mediaId) {
      body.media = { media_ids: [mediaId] };
    }

    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.data) {
      throw new Error(`Failed to post tweet: ${data.errors?.[0]?.message || "Unknown error"}`);
    }

    const postId = data.data.id;

    return {
      postId,
      postUrl: `https://twitter.com/i/web/status/${postId}`,
    };
  }

  /**
   * Upload media to Twitter
   */
  async uploadMedia(
    accessToken: string,
    imageBuffer: Buffer,
    mediaType = "image/jpeg"
  ): Promise<string> {
    const response = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: imageBuffer,
    });

    const data = await response.json();

    if (!data.media_id) {
      throw new Error(`Failed to upload media: ${data.errors?.[0]?.message || "Unknown error"}`);
    }

    return data.media_id_string;
  }
}

/**
 * PKCE utility for OAuth with code challenge
 */
export function generatePKCE(): { codeChallenge: string; codeVerifier: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeChallenge, codeVerifier };
}
