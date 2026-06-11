# HPE AI-Enabled Audit Performance Dashboard

> **Client:** Hewlett Packard Enterprise (HPE) · **Region:** South 1 · **FY:** 2026 (Jan–Apr)

---

## Overview

A fully interactive, single-page audit performance dashboard built for HPE South 1 region. Covers accuracy tracking, trend analysis, CAPA management, SLA compliance, recruiter performance intelligence, and a comprehensive metric glossary — all rendered at the edge via Cloudflare Workers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend / Edge | [Hono](https://hono.dev/) on Cloudflare Workers/Pages |
| Charts | Chart.js 4.4.0 |
| Icons | Font Awesome 6.4.0 |
| Fonts | Google Inter |
| Build | Vite + @hono/vite-cloudflare-pages |
| Dev server | Wrangler Pages Dev + PM2 |
| Language | TypeScript (TSX) |

---

## Features — All 9 Tabs

### Tab 1 · Executive Summary
- 6 KPI cards: Overall Accuracy %, Total Audits, Passed, Errors, MoM Change, WoW Change
- 3 Radial gauges: Overall, Critical, Non-Critical accuracy vs target
- AI Insights panel (4 auto-generated insights)
- 16-week accuracy sparkline with 98% target line
- Stage distribution donut chart
- Monthly performance summary table with MoM delta

### Tab 2 · Accuracy Trends & Analysis
- Monthly line chart with error rate overlay + 98% target
- Weekly accuracy heatmap (colour-coded: green/blue/orange/red)
- Pre vs Post Selection comparison chart
- Critical vs Non-Critical grouped bar chart
- Weekly error volume chart
- Drill-down weekly table with WoW change indicators

### Tab 3 · Improvement Trend & Scope
- AI Forecast chart (16 weeks actual + 4-week projection via linear regression)
- Period-over-period delta table
- Pareto chart (Top 12 error parameters with cumulative %)
- Recruiter error frequency (bottom 10)
- Program Manager performance chart
- Process stage error distribution donut
- AI Recommendations panel (ranked by impact)

### Tab 4 · CAPA — Bot Undo Moves *(Live Upload)*
- **Upload Bot Undo Data** — 3-tab modal for live data ingestion:
  - **Upload File**: Drag-and-drop CSV with instant preview + smart column alias mapping
  - **Enter Manually**: 10-field form with live validation
  - **Download Template**: Pre-formatted CSV template + column reference guide
- Live refresh engine: every change recomputes KPIs, rebuilds charts, regenerates AI insights
- 4 dynamic KPI cards: Closure Rate, Avg Days to Close, Overdue Count, Total Records
- Filter bar: All · Open/Overdue · In Progress · Closed
- CAPA Status donut + Root Cause bar chart
- Export CSV at any time

### Tab 5 · AI Insights & Recommendations
- Auto-generated NLG narrative summary (full FY2026 YTD)
- 5 Predictive Risk Flags (HIGH / MEDIUM / LOW)
- Ranked action recommendations by impact
- 4-week forecast with confidence intervals (Base / Optimistic / Pessimistic)

### Tab 6 · Data Management
- Drag-and-drop file upload zone
- Data source connection status panel
- Validation log (rows imported, issues flagged)
- Export buttons: CSV · Excel · JSON · PDF/Print

### Tab 7 · SLA Performance
- SLA compliance metrics across all contractual KPIs
- Category B obligation tracking (HPE FY24–25 and FY25–26)
- Trend charts per SLA metric

### Tab 8 · Performance Intelligence
- **Recruiter Scorecard** — tiered rankings (Elite / Strong / Developing / At-Risk)
- **Risk Intelligence Panel** — composite risk score (accuracy + trend + volume + consecutive drops)
- **Parameter Deep-Dive** — per-error breakdown with failure rates
- **PM Performance Matrix** — per-PM team analysis
- **Goal Tracker & Alerts** — active threshold alerts
- **Global Search Bar** — searches KPIs, recruiters, error params, PMs, tab names
- **Threshold Alert Configuration** — live sliders for minAccuracy, maxErrorRate, maxConsecDrops
- **Recruiter Comparison Tool** — head-to-head modal (2–3 recruiters, Chart.js trend line, monthly grid)

### Tab 9 · Glossary
- 42 term cards across 7 sections covering every metric in the dashboard
- Each card includes: full definition, formula box, worked example with FY2026 data, tags
- Live search bar — filters all 42 cards in real time
- Category filter buttons: All · Executive · Trends · Improvement · CAPA · Insights · SLA · Performance · Formula-only
- Table of Contents with 7 smooth-scroll jump links
- Full dark mode support

---

## Key Metrics (FY2026 YTD)

| Metric | Value |
|---|---|
| Overall Accuracy | 98.50% |
| Total Audits | 8,599 |
| Total Errors | 128 |
| Error Rate | 1.49% |
| Best Month | Feb 2026 (99.43%) |
| Worst Week | Apr W3 (93.62%) |
| Top Error Parameter | Target start date (89.83% fail rate) |
| Lowest Recruiter | Kusuma K (88.04%) |
| Best PM | Deeksha Srivastava (100%) |

---

## Data Source

| Field | Detail |
|---|---|
| File | Quality_dashboard_data_HPE.xlsx |
| Sheet 1 | Parameter audit count (319 rows) |
| Sheet 2 | Recruiter audit count (8,600 rows) |
| FY Period | January – April 2026 |
| Region | South 1 |

---

## Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Start dev server (PM2 + wrangler pages dev)
pm2 start ecosystem.config.cjs

# Open dashboard
open http://localhost:3000/dashboard
```

## Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name hpe-audit-dashboard
```

---

## Repository Structure

```
src/
└── index.tsx          # Entire dashboard — HTML, CSS, JS, data (single-file architecture)
public/
└── static/
    └── hpe-logo.jpg   # HPE logo
ecosystem.config.cjs   # PM2 config (wrangler pages dev)
wrangler.jsonc         # Cloudflare Pages config
vite.config.ts         # Vite build config
```

---

*Built with Hono + Chart.js · Deployed on Cloudflare Workers/Pages · HPE South 1 · FY2026*
