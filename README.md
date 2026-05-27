# HPE AI-Enabled Audit Performance Dashboard

## Project Overview
- **Client**: Hewlett Packard Enterprise (HPE)
- **Region**: South 1
- **FY**: 2026 (Jan–Apr data loaded)
- **Platform**: Cloudflare Workers (Hono framework)
- **Live URL**: http://localhost:3000/dashboard (sandbox)

## Features — All 6 Tabs Implemented

### Tab 1: Executive Summary
- 6 KPI cards: Overall Accuracy %, Total Audits, Passed, Errors, MoM Change, WoW Change
- 3 Radial gauges: Overall, Critical, Non-Critical accuracy vs target
- AI Insights panel (4 auto-generated insights)
- 16-week accuracy sparkline with 98% target line
- Stage distribution donut chart
- Monthly performance summary table with MoM delta

### Tab 2: Accuracy Trends & Analysis
- Monthly line chart with error rate overlay + 98% target
- Weekly accuracy heatmap (color-coded: green/blue/orange/red)
- Pre vs Post Selection comparison chart
- Critical vs Non-Critical grouped bar chart
- Weekly error volume chart
- Drill-down weekly table with WoW change indicators

### Tab 3: Improvement Trend & Scope
- AI Forecast chart (16 weeks actual + 4-week projection)
- Period-over-period delta table
- Pareto chart (Top 12 error parameters with cumulative %)
- Recruiter error frequency (bottom 10)
- Program Manager performance chart
- Process stage error distribution donut
- AI Recommendations panel (ranked by impact)

### Tab 4: CAPA — Bot Undo Moves *(Live Upload Enabled)*
- **Upload Bot Undo Data** button — opens 3-tab modal for live data ingestion
  - **Tab 1 — Upload File**: Drag-and-drop or browse CSV upload with instant preview table; smart column alias mapping (10 fields); "Load N Records" button commits to dashboard and refreshes everything live
  - **Tab 2 — Enter Manually**: 10-field form (Date, Owner, Bot Action, Undo Reason, Root Cause, Corrective Action, Preventive Action, Target Date, Close Date, Status) with validation; adds record live on submit
  - **Tab 3 — Download Template**: Pre-formatted CSV template download + column reference guide
- **Live Refresh Engine**: every data change triggers `refreshCAPADashboard()` → recomputes KPIs, rebuilds charts, redraws table, regenerates AI insights
- 4 dynamic KPI cards: Closure Rate, Avg Days to Close, Overdue Count, Total Records
- Filter bar: All | 🔴 Open/Overdue | 🟡 In Progress | 🟢 Closed
- Export CSV button — exports full CAPA data at any time
- Count badge + "Last updated" timestamp auto-refresh on every change
- Toast notifications (✅ success / ❌ error / ℹ info) on all actions
- CAPA Status donut chart
- Root Cause bar chart
- Complete CAPA log table (4 entries with full audit trail)
- Status indicators: 🟢 Closed | 🟡 In Progress | 🔴 Overdue
- Aging analysis per CAPA

### Tab 5: AI Insights & Recommendations
- Auto-generated NLG narrative summary (full FY2026 YTD)
- 5 Predictive Risk Flags (HIGH/MEDIUM/LOW)
- Ranked action recommendations (5 items by impact)
- 4-week forecast with confidence intervals (Base/Optimistic/Pessimistic)

### Tab 6: Data Management
- Drag-and-drop file upload zone
- Data source connection status
- Validation log (rows imported, issues flagged)
- Data summary grid (6 metrics)
- Export buttons: CSV, Excel, JSON, PDF/Print

## Data Source
- **File**: Quality_dashboard_data_HPE.xlsx
- **Sheet 1**: Parameter audit count (319 rows)
- **Sheet 2**: Recruiter audit count (8,600 rows)
- **FY Period**: January–April 2026
- **Total Audits**: 8,599 | **Overall Accuracy**: 98.50%

## Key Metrics (FY2026)
| Metric | Value |
|--------|-------|
| Overall Accuracy | 98.50% |
| Total Audits | 8,599 |
| Total Errors | 128 |
| Error Rate | 1.49% |
| Best Month | Feb (99.43%) |
| Worst Week | Apr W3 (93.62%) |
| Top Error | Target start date (89.83% fail) |
| Lowest Recruiter | Kusuma K (88.04%) |
| Best PM | Deeksha Srivastava (100%) |

## Tech Stack
- **Backend**: Hono (TypeScript) on Cloudflare Workers
- **Charts**: Chart.js 4.4.0
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Inter
- **Build**: Vite + @hono/vite-build
- **Dev**: Wrangler Pages Dev + PM2

## Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name hpe-audit-dashboard
```
