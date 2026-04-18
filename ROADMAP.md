# DealerVision Feature Roadmap 2026

## Context
Platform audit reveals a solid foundation (24 dashboard pages, 40+ API endpoints, core features fully working) but significant gaps in automation, analytics, and integration workflows. The biggest blocker is the lack of a **background job scheduler** — needed for scheduled publishing, auto-sync, webhooks, and notifications.

**Current State:**
- ✅ Asset generation (13 channels, multi-type)
- ✅ Inventory management (CSV import, URL scraping)
- ✅ Landing pages (create/edit, form capture)
- ✅ Social publishing APIs (Facebook, Instagram, Twitter)
- ✅ Stripe subscriptions & billing
- ✅ Admin panel (dealership management)
- ❌ No job scheduler (blocks all scheduled/async features)
- ❌ No email publishing UI (API exists, UI missing)
- ❌ No social publish UI (API exists, UI missing)
- ❌ No landing page hosting/URLs (created but unpublishable)
- ❌ No advanced analytics (usage table exists, dashboards missing)
- ❌ No team collaboration/approval workflows
- ❌ No CRM/DMS integrations

---

## Feature Opportunities (Prioritized)

### QUICK WINS (< 8 hrs each, high user value)

| Feature | Value | Effort | Why | Blocker? |
|---------|-------|--------|-----|----------|
| **QR Code Generator** | ⭐⭐ | 3hr | Easy win. Dealers print lot signs with QR codes | No |
| **PDF/Print Export** | ⭐⭐⭐ | 4hr | PDF export of assets already in code, just needs UI | No |
| **Email Publish UI** | ⭐⭐⭐ | 5hr | Backend `/api/email/send` exists, just needs campaign builder UI | No |
| **Social Publish UI** | ⭐⭐⭐ | 6hr | Backend OAuth + `/api/social/publish` exist, just needs UI | No |
| **Landing Page URL Generation** | ⭐⭐ | 3hr | Make published pages shareable with public URLs | No |
| **Activity Feed Filters** | ⭐ | 2hr | Filter by action type, date range, user | No |
| **Custom Branding for PDFs** | ⭐⭐ | 4hr | Include dealership logo/colors on PDF exports | No |
| **Photo Gallery Manager** | ⭐⭐ | 5hr | UI to upload, reorder, delete vehicle photos | No |

### SHORT-TERM (1-3 weeks, unlocks workflows)

| Feature | Value | Effort | Why | Blocker? |
|---------|-------|--------|-----|----------|
| **Campaign Bundles** | ⭐⭐⭐⭐ | 8hr | One-click multi-channel campaigns (end-of-month sale, new arrivals, etc.) | No |
| **Content Calendar with Scheduling** | ⭐⭐⭐ | 12hr | Drag-and-drop calendar, schedule posts to social/email | Yes (job scheduler) |
| **Background Job Scheduler** | ⭐⭐⭐⭐⭐ | 20hr | **CRITICAL BLOCKER** — enables scheduled publishing, auto-sync, webhooks, notifications. Use Bull Queue + Redis | No (but needed for others) |
| **Lead Notifications** | ⭐⭐⭐ | 6hr | Email dealership when landing page form submitted | Partial (scheduler) |
| **Basic Analytics Dashboard** | ⭐⭐⭐ | 10hr | Per-asset views, generation trends, top channels | No |
| **Team Collaboration** | ⭐⭐⭐ | 14hr | Comment on assets, approval workflows, @mentions | No |
| **Inventory Auto-Sync** | ⭐⭐ | 8hr | Background job to re-scrape sources daily/weekly | Yes (job scheduler) |

### MEDIUM-TERM (1-2 months, strategic bets)

| Feature | Value | Effort | Why | Impact |
|---------|-------|--------|-----|--------|
| **Advanced Analytics** | ⭐⭐⭐⭐ | 20hr | Social engagement metrics, landing page conversions, ROI tracking | High — helps users understand performance |
| **CRM Integration** | ⭐⭐⭐⭐ | 25hr | Salesforce, HubSpot, DealerSocket — sync leads, link to deals | High — consolidates tools |
| **Email Marketing Integration** | ⭐⭐⭐ | 15hr | Mailchimp, HubSpot, Resend — manage lists, send campaigns | Medium — reduces manual work |
| **A/B Test Winner Selection** | ⭐⭐⭐ | 12hr | Auto-detect winning variant, publish at scale | Medium — automates workflow |
| **Video Generation** | ⭐⭐⭐⭐ | 30hr | Create short 15–30sec videos from assets + voiceover | High — video is 5x more engaging |
| **AI Content Suggestions** | ⭐⭐⭐ | 16hr | Suggest posts based on inventory (new cars, price drops), season | Medium — reduces blank-page friction |
| **Custom Template Builder** | ⭐⭐⭐ | 18hr | Let users create reusable prompt templates | Medium — power users love this |

### LONG-TERM (3+ months, platform-level features)

| Feature | Value | Effort | Strategic Impact |
|---------|-------|--------|------------------|
| **White-Label/Multi-Brand** | ⭐⭐⭐⭐ | 40hr | Resell as DealerAdGen-powered service to agencies | High — new revenue stream |
| **DMS/Inventory Ecosystem** | ⭐⭐⭐⭐ | 50hr | Direct integrations with Cox, TrueCar, AutoTrader, DealerSocket | High — solves vendor lock-in |
| **Real-Time Collaboration** | ⭐⭐⭐ | 35hr | WebSockets for live co-editing, presence, live notifications | Medium — team workflows |
| **Advanced Image Editing** | ⭐⭐⭐ | 25hr | In-app cropping, text overlay, filters, effects (not just KIE.ai) | Medium — handles edge cases |
| **Carousel/Multi-Slide Generation** | ⭐⭐⭐ | 20hr | Instagram carousels, email slide-shows, multi-product showcases | Medium — more engagement |
| **Affiliate/Reseller Program** | ⭐⭐⭐ | 20hr | Revenue sharing for agencies that refer dealers | High — growth lever |

---

## RECOMMENDED ROADMAP (Next 3 Months)

### Month 1: Complete Missing UI Workflows
**Goals:** Enable social & email publishing, add quick-win features, unblock analytics
- **Week 1-2**: Social Publish UI + Email Campaign Builder (6-8 hrs each)
- **Week 2**: QR Code Generator + PDF Export (3-4 hrs each)
- **Week 3**: Campaign Bundles (8 hrs)
- **Week 4**: Basic Analytics Dashboard (10 hrs)
- **Total**: ~40-45 hrs (~1 week of dev time)

### Month 2: Automation & Notifications
**Goals:** Implement job scheduler, enable scheduled publishing & webhooks
- **Week 1-2**: Background Job Scheduler with Bull Queue + Redis (20 hrs)
- **Week 2-3**: Content Calendar Scheduling (12 hrs)
- **Week 4**: Lead Notifications (6 hrs)
- **Total**: ~38 hrs (~1.5 weeks)

### Month 3: Intelligence & Integrations
**Goals:** Add data insights and third-party connections
- **Week 1-2**: Advanced Analytics (20 hrs)
- **Week 3**: CRM Integration (Salesforce/HubSpot, 25 hrs)
- **Week 4**: Inventory Auto-Sync (8 hrs)
- **Total**: ~53 hrs (~2 weeks)

---

## CRITICAL BLOCKER: Background Job Scheduler

Many valuable features require **scheduled execution, retries, and reliability**:
- Scheduled social/email publishing
- Nightly inventory auto-sync
- Webhook delivery with retries
- Lead notifications
- Periodic analytics aggregation
- Scheduled tasks (send email campaigns at specific times)

**Solution:** Implement Bull Queue + Redis (or pg-boss for simpler setup)
- Bull: Node.js job queue with Redis backend
- pg-boss: PostgreSQL-native queue (no Redis needed)
- Recommendation: **Bull + Redis** (familiar pattern, battle-tested at scale)

**Setup:**
```bash
npm install bull redis
# Configure Redis endpoint (can use Upstash free tier for small volumes)
```

**Impact:** Unlocks 15+ high-value features immediately.
