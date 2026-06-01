#!/usr/bin/env python3
"""Generate the DealerAdGen one-page sales sheet PDF."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

# ── Brand palette ───────────────────────────────────────────────────────────
NAVY = HexColor("#003366")
NAVY_LT = HexColor("#0A4A8A")
ACCENT = HexColor("#1E88E5")
INK = HexColor("#1A2530")
GREY = HexColor("#5A6B7B")
LIGHT = HexColor("#F2F6FA")
LINE = HexColor("#D9E2EC")
GREEN = HexColor("#1AA251")

OUT = "DealerAdGen-Sales-Sheet.pdf"
W, H = letter
M = 0.6 * inch  # page margin

c = canvas.Canvas(OUT, pagesize=letter)


def text(x, y, s, font="Helvetica", size=10, color=INK, align="left"):
    c.setFont(font, size)
    c.setFillColor(color)
    if align == "center":
        c.drawCentredString(x, y, s)
    elif align == "right":
        c.drawRightString(x, y, s)
    else:
        c.drawString(x, y, s)


# ── Header band ──────────────────────────────────────────────────────────────
HEADER_H = 1.35 * inch
c.setFillColor(NAVY)
c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)
# accent stripe
c.setFillColor(ACCENT)
c.rect(0, H - HEADER_H, W, 0.06 * inch, fill=1, stroke=0)

text(M, H - 0.55 * inch, "DealerAdGen", "Helvetica-Bold", 30, white)
text(M, H - 0.85 * inch, "AI Marketing Built for Car Dealers",
     "Helvetica", 13, HexColor("#BBD4EE"))
text(W - M, H - 0.6 * inch, "dealeradgen.com", "Helvetica-Bold", 12, white, align="right")
text(W - M, H - 0.82 * inch, "Start free — no card required",
     "Helvetica", 9.5, HexColor("#BBD4EE"), align="right")

y = H - HEADER_H - 0.45 * inch

# ── Headline ──────────────────────────────────────────────────────────────────
text(M, y, "Turn one phone photo into a complete marketing campaign.",
     "Helvetica-Bold", 16, NAVY)
y -= 0.28 * inch
sub = ("Snap a vehicle with your phone and get 8 showroom-quality angles, social posts, "
       "email headers, and VDP-ready creative — branded to your store, in about 10 minutes. "
       "No photographer. No studio. No agency retainer.")
for line in simpleSplit(sub, "Helvetica", 10.5, W - 2 * M):
    text(M, y, line, "Helvetica", 10.5, GREY)
    y -= 0.205 * inch

y -= 0.12 * inch

# ── The Problem strip ──────────────────────────────────────────────────────────
box_h = 0.62 * inch
c.setFillColor(LIGHT)
c.roundRect(M, y - box_h, W - 2 * M, box_h, 6, fill=1, stroke=0)
c.setFillColor(ACCENT)
c.roundRect(M, y - box_h, 0.08 * inch, box_h, 2, fill=1, stroke=0)
text(M + 0.25 * inch, y - 0.22 * inch, "THE PROBLEM", "Helvetica-Bold", 9, ACCENT)
prob = ("Dealers spend 2-4 hours per vehicle on photos and marketing across 5+ disconnected tools. "
        "By the time the campaign launches, the unit has aged another 3 days on the lot.")
yy = y - 0.40 * inch
for line in simpleSplit(prob, "Helvetica", 9.5, W - 2 * M - 0.5 * inch):
    text(M + 0.25 * inch, yy, line, "Helvetica", 9.5, INK)
    yy -= 0.16 * inch

y = y - box_h - 0.4 * inch

# ── How it works (3 steps) ──────────────────────────────────────────────────────
text(M, y, "HOW IT WORKS", "Helvetica-Bold", 11, NAVY)
y -= 0.28 * inch

steps = [
    ("1", "Capture", "Scan a VIN or snap one photo with any phone. We auto-fill the vehicle details."),
    ("2", "Generate", "Pick a channel and style. Get 8 angles + multi-channel creative in one batch."),
    ("3", "Publish", "Push to Instagram, Facebook, email, your website, and print — every lead tracked."),
]
col_w = (W - 2 * M - 0.4 * inch) / 3
for i, (num, title_s, body) in enumerate(steps):
    x = M + i * (col_w + 0.2 * inch)
    c.setFillColor(white)
    c.setStrokeColor(LINE)
    c.roundRect(x, y - 1.05 * inch, col_w, 1.05 * inch, 6, fill=1, stroke=1)
    # number circle
    c.setFillColor(NAVY)
    c.circle(x + 0.32 * inch, y - 0.30 * inch, 0.16 * inch, fill=1, stroke=0)
    text(x + 0.32 * inch, y - 0.345 * inch, num, "Helvetica-Bold", 12, white, align="center")
    text(x + 0.56 * inch, y - 0.345 * inch, title_s, "Helvetica-Bold", 11.5, NAVY)
    yy = y - 0.58 * inch
    for line in simpleSplit(body, "Helvetica", 8.8, col_w - 0.4 * inch):
        text(x + 0.2 * inch, yy, line, "Helvetica", 8.8, GREY)
        yy -= 0.155 * inch

y = y - 1.05 * inch - 0.4 * inch

# ── What's included (feature grid) ──────────────────────────────────────────────
text(M, y, "WHAT'S INCLUDED", "Helvetica-Bold", 11, NAVY)
y -= 0.26 * inch

features = [
    "8 photoreal angles from one photo",
    "13 channel-ready formats",
    "11 automotive content types",
    "35+ premium showroom backdrops",
    "Full Design Studio + templates",
    "License-plate blur or branded inlay",
    "Vehicle descriptions & captions",
    "Batch generation across inventory",
    "Mobile VIN scanner",
    "Conversion widgets for your site",
    "OEM co-op & state-disclaimer ready",
    "Showroom TV display mode",
]
fcol_w = (W - 2 * M) / 2
row_h = 0.205 * inch
for i, feat in enumerate(features):
    col = i % 2
    row = i // 2
    x = M + col * fcol_w
    fy = y - row * row_h
    c.setFillColor(GREEN)
    c.circle(x + 0.05 * inch, fy + 0.03 * inch, 0.035 * inch, fill=1, stroke=0)
    text(x + 0.16 * inch, fy, feat, "Helvetica", 9.5, INK)

y = y - (len(features) // 2) * row_h - 0.38 * inch

# ── Pricing band ────────────────────────────────────────────────────────────────
pb_h = 1.05 * inch
c.setFillColor(NAVY)
c.roundRect(M, y - pb_h, W - 2 * M, pb_h, 8, fill=1, stroke=0)

# divider
midx = M + (W - 2 * M) / 2
c.setStrokeColor(NAVY_LT)
c.setLineWidth(1)
c.line(midx, y - 0.2 * inch, midx, y - pb_h + 0.2 * inch)

# Free trial
text(M + (W - 2 * M) / 4, y - 0.32 * inch, "FREE TRIAL", "Helvetica-Bold", 11, HexColor("#BBD4EE"), align="center")
text(M + (W - 2 * M) / 4, y - 0.62 * inch, "25 images", "Helvetica-Bold", 22, white, align="center")
text(M + (W - 2 * M) / 4, y - 0.85 * inch, "No credit card required", "Helvetica", 9, HexColor("#BBD4EE"), align="center")

# Pro
text(midx + (W - 2 * M) / 4, y - 0.32 * inch, "PRO", "Helvetica-Bold", 11, HexColor("#BBD4EE"), align="center")
text(midx + (W - 2 * M) / 4, y - 0.62 * inch, "$249/mo", "Helvetica-Bold", 22, white, align="center")
text(midx + (W - 2 * M) / 4, y - 0.85 * inch, "Unlimited image generation", "Helvetica", 9, HexColor("#BBD4EE"), align="center")

y = y - pb_h - 0.3 * inch

# ── CTA footer ──────────────────────────────────────────────────────────────────
text(W / 2, y, "Start free at dealeradgen.com", "Helvetica-Bold", 14, NAVY, align="center")
y -= 0.22 * inch
text(W / 2, y, "No setup fees  ·  No per-image charges  ·  Cancel anytime",
     "Helvetica", 9.5, GREY, align="center")

# bottom rule + credit
c.setStrokeColor(LINE)
c.setLineWidth(0.75)
c.line(M, 0.55 * inch, W - M, 0.55 * inch)
text(M, 0.38 * inch, "DealerAdGen — AI-Powered Automotive Marketing", "Helvetica", 8, GREY)
text(W - M, 0.38 * inch, "Developed by Shawn Ryder Digital", "Helvetica", 8, GREY, align="right")

c.showPage()
c.save()
print(f"Wrote {OUT}")
