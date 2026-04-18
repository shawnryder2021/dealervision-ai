/**
 * Email HTML templates for the Email Campaign Builder
 * Each template accepts variables and returns a complete HTML email string.
 */

export interface EmailTemplateVars {
  dealershipName: string;
  dealershipPhone?: string;
  dealershipWebsite?: string;
  primaryColor?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  subject: string;
  previewText?: string;
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

export const EMAIL_TEMPLATES = [
  { id: "sales-announcement", name: "Sales Announcement", description: "Bold hero image with a strong CTA — perfect for sales events and promotions" },
  { id: "new-arrival",        name: "New Arrival",        description: "Clean spotlight layout for a single featured vehicle" },
  { id: "service-special",   name: "Service Special",    description: "Professional layout for service department offers" },
] as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATES)[number]["id"];

function baseWrapper(content: string, vars: EmailTemplateVars): string {
  const primary = vars.primaryColor || "#7c3aed";
  const phone = vars.dealershipPhone ? `<a href="tel:${vars.dealershipPhone}" style="color:#6b7280;">${vars.dealershipPhone}</a>` : "";
  const website = vars.dealershipWebsite ? `<a href="${vars.dealershipWebsite}" style="color:#6b7280;">${vars.dealershipWebsite}</a>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${vars.subject}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    * { box-sizing: border-box; }
    a { text-decoration: none; }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f3f4f6;">${vars.previewText || vars.subject}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:${primary};padding:20px 32px;text-align:center;">
          ${vars.logoUrl ? `<img src="${vars.logoUrl}" alt="${vars.dealershipName}" style="max-height:48px;margin-bottom:8px;" />` : ""}
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">${vars.dealershipName}</p>
        </td></tr>
        <!-- Content -->
        ${content}
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">${vars.dealershipName}</p>
          <p style="margin:0;font-size:12px;color:#d1d5db;">
            ${[phone, website].filter(Boolean).join(" &nbsp;·&nbsp; ")}
          </p>
          ${vars.footerNote ? `<p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">${vars.footerNote}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildEmailHTML(templateId: EmailTemplateId, vars: EmailTemplateVars): string {
  const primary = vars.primaryColor || "#7c3aed";

  if (templateId === "sales-announcement") {
    const content = `
      ${vars.heroImageUrl ? `<tr><td><img src="${vars.heroImageUrl}" alt="Sale" style="width:100%;display:block;max-height:320px;object-fit:cover;" /></td></tr>` : ""}
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#111827;line-height:1.2;">${vars.headline}</h1>
        <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:1.6;">${vars.body.replace(/\n/g, "<br/>")}</p>
        ${vars.ctaText ? `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:${primary};"><a href="${vars.ctaUrl || "#"}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;">${vars.ctaText}</a></td></tr></table>` : ""}
      </td></tr>`;
    return baseWrapper(content, vars);
  }

  if (templateId === "new-arrival") {
    const content = `
      <tr><td style="padding:32px 32px 0;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${primary};">Just Arrived</p>
        <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;">${vars.headline}</h1>
      </td></tr>
      ${vars.heroImageUrl ? `<tr><td style="padding:0 32px;"><img src="${vars.heroImageUrl}" alt="New Arrival" style="width:100%;border-radius:8px;display:block;max-height:280px;object-fit:cover;" /></td></tr>` : ""}
      <tr><td style="padding:20px 32px 32px;">
        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">${vars.body.replace(/\n/g, "<br/>")}</p>
        ${vars.ctaText ? `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:${primary};"><a href="${vars.ctaUrl || "#"}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:700;">${vars.ctaText}</a></td></tr></table>` : ""}
      </td></tr>`;
    return baseWrapper(content, vars);
  }

  // service-special (default)
  const content = `
    <tr><td style="padding:32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${vars.heroImageUrl ? `<td width="200" style="padding-right:24px;vertical-align:top;"><img src="${vars.heroImageUrl}" alt="Service" style="width:100%;border-radius:8px;display:block;max-height:200px;object-fit:cover;" /></td>` : ""}
          <td style="vertical-align:top;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${primary};">Service Special</p>
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111827;">${vars.headline}</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">${vars.body.replace(/\n/g, "<br/>")}</p>
            ${vars.ctaText ? `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:${primary};"><a href="${vars.ctaUrl || "#"}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:700;">${vars.ctaText}</a></td></tr></table>` : ""}
          </td>
        </tr>
      </table>
    </td></tr>`;
  return baseWrapper(content, vars);
}
