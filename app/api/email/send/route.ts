/**
 * Email Send API
 * POST /api/email/send — Build and send an email campaign via Resend
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEmailHTML, type EmailTemplateId } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    if (!profile?.dealership_id) {
      return NextResponse.json({ error: "No dealership found" }, { status: 400 });
    }

    const { data: dealership } = await supabase
      .from("dealerships")
      .select("name, brand_colors, logo_url, contact")
      .eq("id", profile.dealership_id)
      .single();

    const body = await request.json();
    const {
      template_id,
      subject,
      preview_text,
      headline,
      email_body,
      cta_text,
      cta_url,
      asset_id,
      asset_url,
      recipients,   // array of { email, name } — or "all" to use subscribers
      test_email,   // if set, send only to this email (test mode)
    } = body;

    if (!subject || !headline || !email_body || !template_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Email sending not configured. Add RESEND_API_KEY to environment variables." }, { status: 503 });
    }

    // Build HTML
    const html = buildEmailHTML(template_id as EmailTemplateId, {
      dealershipName: dealership?.name || "Your Dealership",
      dealershipPhone: dealership?.contact?.phone,
      dealershipWebsite: dealership?.contact?.website,
      primaryColor: dealership?.brand_colors?.primary,
      logoUrl: dealership?.logo_url,
      heroImageUrl: asset_url,
      subject,
      previewText: preview_text,
      headline,
      body: email_body,
      ctaText: cta_text,
      ctaUrl: cta_url,
    });

    // Determine recipient list
    let to: Array<{ email: string; name?: string }> = [];
    if (test_email) {
      to = [{ email: test_email }];
    } else if (Array.isArray(recipients)) {
      to = recipients;
    } else {
      // Fetch all active subscribers
      const { data: subs } = await supabase
        .from("email_subscribers")
        .select("email, name")
        .eq("dealership_id", profile.dealership_id)
        .is("unsubscribed_at", null);
      to = subs || [];
    }

    if (to.length === 0) {
      return NextResponse.json({ error: "No recipients. Add subscribers first." }, { status: 400 });
    }

    // Send via Resend
    const fromName = dealership?.name || "DealerAdGen";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@dealervisionai.com";

    const sendResults = await Promise.allSettled(
      to.map((recipient) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [recipient.email],
            subject,
            html,
          }),
        }).then((r) => r.json())
      )
    );

    const sent = sendResults.filter((r) => r.status === "fulfilled").length;
    const failed = sendResults.filter((r) => r.status === "rejected").length;

    // Save campaign record (only for real sends, not test)
    if (!test_email) {
      await supabase.from("email_campaigns").insert({
        dealership_id: profile.dealership_id,
        subject,
        preview_text,
        html_body: html,
        template_id,
        asset_id: asset_id || null,
        asset_url: asset_url || null,
        status: "sent",
        recipient_count: sent,
        sent_at: new Date().toISOString(),
        created_by: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      test_mode: !!test_email,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
