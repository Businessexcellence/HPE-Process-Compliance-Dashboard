import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './' }))

app.get('/', (c) => {
  return c.redirect('/dashboard')
})

app.get('/dashboard', (c) => {
  return c.html(getDashboardHTML())
})

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HPE Audit Performance Dashboard</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%2301A982'/><text x='16' y='22' font-size='14' font-weight='bold' text-anchor='middle' fill='white' font-family='Arial'>H</text></svg>">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
  <!-- SheetJS for real Excel/CSV parsing -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <!-- Export libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    :root {
      --hpe-green: #01A982;
      --hpe-green-dark: #008f6e;
      --hpe-green-light: #e6f9f5;
      --hpe-slate: #425563;
      --hpe-slate-light: #6b7d8c;
      --hpe-dark: #1a2532;
      --hpe-orange: #FF8300;
      --hpe-red: #C54E4B;
      --hpe-blue: #0D5DBF;
      --hpe-yellow: #FFC627;
      --bg: #f0f4f8;
      --card-bg: #ffffff;
      --text-primary: #1a2532;
      --text-secondary: #425563;
      --text-muted: #6b7d8c;
      --border: #e1e8ef;
      --shadow: 0 2px 12px rgba(0,0,0,0.08);
      --shadow-hover: 0 8px 24px rgba(0,0,0,0.14);
      --radius: 12px;
      --radius-sm: 8px;
      /* Dark mode transition */
      --dm-transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }

    /* ========== DARK MODE VARIABLES ========== */
    html.dark {
      --bg: #0f1621;
      --card-bg: #1a2332;
      --text-primary: #e8edf2;
      --text-secondary: #a8b8c8;
      --text-muted: #6e8090;
      --border: #2a3a4a;
      --shadow: 0 2px 12px rgba(0,0,0,0.35);
      --shadow-hover: 0 8px 24px rgba(0,0,0,0.5);
      --hpe-green-light: rgba(1,169,130,0.15);
      --hpe-dark: #e8edf2;
    }
    /* ========== DARK MODE TOGGLE PILL ========== */
    .dm-toggle {
      display: flex;
      align-items: center;
      gap: 7px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 24px;
      padding: 5px 10px 5px 6px;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .dm-toggle:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); }
    .dm-track {
      width: 36px;
      height: 20px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      position: relative;
      transition: background 0.3s;
      flex-shrink: 0;
    }
    html.dark .dm-track { background: var(--hpe-green); }
    .dm-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
    }
    html.dark .dm-thumb { transform: translateX(16px); }
    .dm-icon {
      font-size: 13px;
      line-height: 1;
      transition: opacity 0.25s, transform 0.25s;
    }
    .dm-icon-sun  { color: #FFC627; opacity: 1;  }
    .dm-icon-moon { color: #a0b4cc; opacity: 0.5; }
    html.dark .dm-icon-sun  { opacity: 0.4; transform: rotate(-30deg); }
    html.dark .dm-icon-moon { opacity: 1;   color: #c8d8ea; }

    /* ========== GLOBAL DARK MODE OVERRIDES ========== */
    /* Apply smooth transition to everything */
    html.dark body,
    html.dark .card, html.dark .kpi-card, html.dark .gauge-card,
    html.dark .nav-tabs, html.dark .nav-tab,
    html.dark table, html.dark thead tr, html.dark tbody tr,
    html.dark .modal-box, html.dark .modal-content,
    html.dark .filter-select, html.dark .export-modal-box,
    html.dark .perf-sub-btn, html.dark .period-filter {
      transition: var(--dm-transition);
    }

    /* Body & Page */
    html.dark body { background: var(--bg); color: var(--text-primary); }

    /* Nav tabs bar */
    html.dark .nav-tabs { background: #141e2b; border-bottom-color: var(--border); }
    html.dark .nav-tab { color: var(--text-muted); }
    html.dark .nav-tab:hover { background: rgba(1,169,130,0.1); color: var(--hpe-green); }
    html.dark .nav-tab.active { color: var(--hpe-green); }

    /* Cards */
    html.dark .card, html.dark .gauge-card,
    html.dark .kpi-card { background: var(--card-bg); border-color: var(--border); }

    /* KPI icon backgrounds */
    html.dark .kpi-icon.green  { background: rgba(1,169,130,0.18); }
    html.dark .kpi-icon.orange { background: rgba(255,131,0,0.15); }
    html.dark .kpi-icon.red    { background: rgba(197,78,75,0.15); }
    html.dark .kpi-icon.blue   { background: rgba(13,93,191,0.18); }
    html.dark .kpi-icon.slate  { background: rgba(66,85,99,0.25); }
    html.dark .kpi-icon.yellow { background: rgba(255,198,39,0.15); color: #e6b800; }

    /* Tables */
    html.dark thead tr { background: #0f1621; }
    html.dark tbody tr:nth-child(even) { background: #1e2d3d; }
    html.dark tbody tr:hover { background: rgba(1,169,130,0.1); }
    html.dark tbody td { border-bottom-color: var(--border); color: var(--text-secondary); }
    html.dark tbody td:first-child { color: var(--text-primary); }
    html.dark .table-container { border-color: var(--border); }

    /* Section headers */
    html.dark .section-title { color: var(--text-primary); }
    html.dark .section-title .icon-badge { background: rgba(1,169,130,0.15); }
    html.dark .card-title { color: var(--text-primary); }

    /* AI Insights panel */
    html.dark .ai-insights {
      background: linear-gradient(135deg, rgba(1,169,130,0.08) 0%, rgba(1,169,130,0.04) 100%);
      border-color: rgba(1,169,130,0.25);
    }
    html.dark .ai-insights-title { color: var(--text-primary); }
    html.dark .insight-item {
      background: #1e2d3d;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    html.dark .insight-icon.green  { background: rgba(1,169,130,0.18); }
    html.dark .insight-icon.warning{ background: rgba(255,131,0,0.15); }
    html.dark .insight-icon.alert  { background: rgba(197,78,75,0.15); }
    html.dark .insight-icon.info   { background: rgba(13,93,191,0.18); }
    html.dark .insight-text { color: var(--text-secondary); }
    html.dark .insight-text strong { color: var(--text-primary); }

    /* Gauge */
    html.dark .gauge-status.good    { background: rgba(1,169,130,0.18); }
    html.dark .gauge-status.warning { background: rgba(255,131,0,0.18); }
    html.dark .gauge-status.bad     { background: rgba(197,78,75,0.18); }
    html.dark .gauge-title { color: var(--text-muted); }

    /* Accuracy badges */
    html.dark .acc-badge.excellent { background: rgba(1,169,130,0.2); }
    html.dark .acc-badge.good      { background: rgba(1,169,130,0.15); }
    html.dark .acc-badge.warning   { background: rgba(255,131,0,0.18); }
    html.dark .acc-badge.bad       { background: rgba(197,78,75,0.18); }

    /* Forecast / improvement section */
    html.dark .forecast-section { background: #141e2b; border-color: var(--border); }
    html.dark .narr-card { background: #1e2d3d; border-color: var(--border); }
    html.dark .narr-text  { color: var(--text-secondary); }

    /* Alert items */
    html.dark .alert-item.alert-red    { background: rgba(197,78,75,0.15);  border-color: #C54E4B; }
    html.dark .alert-item.alert-orange { background: rgba(255,131,0,0.12);  border-color: #FF8300; }
    html.dark .alert-item.alert-green  { background: rgba(1,169,130,0.12);  border-color: #01A982; }

    /* Modal overlays & boxes */
    html.dark .modal-box,
    html.dark .export-modal-box { background: #1a2332; border: 1px solid var(--border); }
    html.dark .modal-header,
    html.dark .export-modal-header { background: #141e2b; border-bottom-color: var(--border); }
    html.dark .modal-title,
    html.dark .export-modal-title { color: var(--text-primary); }
    html.dark .modal-body,
    html.dark .export-modal-body { background: #1a2332; }
    html.dark .modal-footer,
    html.dark .export-modal-footer { background: #141e2b; border-top-color: var(--border); }
    html.dark .modal-drop-title { color: var(--text-primary); }
    html.dark .modal-close,
    html.dark .export-modal-close { color: var(--text-muted); }
    html.dark .modal-close:hover,
    html.dark .export-modal-close:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

    /* Form elements inside modals */
    html.dark .modal-body input,
    html.dark .modal-body select,
    html.dark .modal-body textarea,
    html.dark .export-modal-body input,
    html.dark .export-modal-body select {
      background: #0f1621;
      border-color: var(--border);
      color: var(--text-primary);
    }
    html.dark .modal-body input:focus,
    html.dark .modal-body select:focus,
    html.dark .export-modal-body input:focus,
    html.dark .export-modal-body select:focus {
      border-color: var(--hpe-green);
      box-shadow: 0 0 0 3px rgba(1,169,130,0.2);
    }

    /* Filter selects & buttons */
    html.dark .filter-select {
      background: #1e2d3d;
      border-color: var(--border);
      color: var(--text-primary);
    }
    html.dark .filter-btn {
      background: #1e2d3d;
      border-color: var(--border);
      color: var(--text-secondary);
    }
    html.dark .filter-btn.active {
      background: var(--hpe-green);
      color: white;
      border-color: var(--hpe-green);
    }
    html.dark .period-filter { border-color: var(--border); }

    /* Perf sub-buttons */
    html.dark .perf-sub-btn { background: #1e2d3d; border-color: var(--border); color: var(--text-secondary); }
    html.dark .perf-sub-btn.active { background: var(--hpe-green); color: white; border-color: var(--hpe-green); }
    html.dark .perf-sub-btn:hover  { border-color: var(--hpe-green); color: var(--hpe-green); background: rgba(1,169,130,0.1); }

    /* Scorecard cards */
    html.dark .scorecard-card { background: #1e2d3d; border-color: var(--border); }
    html.dark .sc-bar { background: #2a3a4a; }

    /* Risk level badges */
    html.dark .risk-critical { background: rgba(197,78,75,0.18); color: #e57373; border-color: rgba(197,78,75,0.4); }
    html.dark .risk-high     { background: rgba(255,131,0,0.15); color: #ffb74d; border-color: rgba(255,131,0,0.4); }
    html.dark .risk-medium   { background: rgba(255,198,39,0.12); color: #ffe082; border-color: rgba(255,198,39,0.4); }
    html.dark .risk-low      { background: rgba(1,169,130,0.15); color: #4db6ac; border-color: rgba(1,169,130,0.4); }

    /* Coaching / at-risk flags */
    html.dark .coaching-flag { background: rgba(255,198,39,0.15); color: #ffe082; border-color: rgba(255,198,39,0.4); }
    html.dark .at-risk-flag  { background: rgba(197,78,75,0.15); color: #e57373; border-color: rgba(197,78,75,0.4); }

    /* SLA panels */
    html.dark .sla-health-banner.good { background: rgba(1,169,130,0.12); border-color: rgba(1,169,130,0.3); color: #4db6ac; }
    html.dark .sla-health-banner.warn { background: rgba(255,131,0,0.12); border-color: rgba(255,131,0,0.3); color: #ffb74d; }
    html.dark .sla-health-banner.bad  { background: rgba(197,78,75,0.12); border-color: rgba(197,78,75,0.3); color: #e57373; }
    html.dark .sla-pill.notmet { background: rgba(197,78,75,0.18); color: #e57373; }
    html.dark .sla-pill.nr     { background: rgba(66,85,99,0.25);  color: var(--text-muted); }
    html.dark .sla-pill.na     { background: rgba(255,131,0,0.15); color: #ffb74d; }
    html.dark .sla-hm-corner,
    html.dark .sla-hm-label   { background: #1e2d3d; }
    html.dark .sla-hm-nm      { background: rgba(197,78,75,0.3); color: #e57373; }
    html.dark .sla-hm-na      { background: rgba(255,131,0,0.2); color: #ffb74d; }
    html.dark .sla-metric-table tr:hover td { background: rgba(1,169,130,0.08); }
    html.dark .sla-badge-nm  { background: rgba(197,78,75,0.18); color: #e57373; }
    html.dark .sla-badge-nr  { background: rgba(66,85,99,0.2);  color: var(--text-muted); }
    html.dark .sla-health-warn { background: rgba(255,131,0,0.12); border-color: rgba(255,131,0,0.3); color: #ffb74d; }
    html.dark .sla-health-crit { background: rgba(197,78,75,0.12); border-color: rgba(197,78,75,0.3); color: #e57373; }
    html.dark .sla-chronic-bar { background: #2a3a4a; }
    html.dark .sla-chronic-item{ background: rgba(197,78,75,0.08); border-color: rgba(197,78,75,0.25); }
    html.dark .sla-ic-good  { background: rgba(1,169,130,0.1);  border-color: rgba(1,169,130,0.25); }
    html.dark .sla-ic-warn  { background: rgba(255,131,0,0.1);  border-color: rgba(255,131,0,0.25); }
    html.dark .sla-ic-info  { background: rgba(13,93,191,0.12); border-color: rgba(13,93,191,0.25); }
    html.dark .sla-tg-improving { background: rgba(1,169,130,0.1);  border-color: rgba(1,169,130,0.25); }
    html.dark .sla-tg-stable    { background: #1e2d3d; border-color: var(--border); }
    html.dark .sla-tg-declining { background: rgba(197,78,75,0.08); border-color: rgba(197,78,75,0.25); }
    html.dark .sla-rec-critical { background: rgba(197,78,75,0.08);  border-left-color: #e74c3c; }
    html.dark .sla-rec-high     { background: rgba(247,183,49,0.08);  border-left-color: #f7b731; }
    html.dark .sla-rec-medium   { background: rgba(1,169,130,0.08);   border-left-color: #01a982; }
    html.dark .sla-rec-low      { background: rgba(52,152,219,0.08);  border-left-color: #3498db; }
    html.dark .sla-insight-box  { background: #1e2d3d; border-color: var(--border); }

    /* Heatmap cells */
    html.dark #heatmapContainer .heat-cell-na { background: #1e2d3d !important; }

    /* Progress overlay */
    html.dark .export-progress-wrap { background: #1a2332; border-color: var(--border); }

    /* Drill-down panel */
    html.dark #riskDrillPanel { background: #1e2d3d; border-color: var(--border); }

    /* Scrollbar */
    html.dark ::-webkit-scrollbar-track { background: #141e2b; }
    html.dark ::-webkit-scrollbar-thumb { background: #2a3a4a; }
    html.dark ::-webkit-scrollbar-thumb:hover { background: #3a4a5a; }

    /* Status badges */
    html.dark .status-closed     { background: rgba(1,169,130,0.18); color: #4db6ac; }
    html.dark .status-inprogress { background: rgba(255,198,39,0.15); color: #ffe082; }
    html.dark .status-open       { background: rgba(197,78,75,0.18);  color: #e57373; }

    /* Export tabs */
    html.dark .export-tab { background: #1e2d3d; color: var(--text-muted); border-color: var(--border); }
    html.dark .export-tab.active { background: var(--hpe-green); color: white; }
    html.dark .slide-thumb { background: #0f1621; border-color: var(--border); }
    html.dark .slide-thumb.selected { border-color: var(--hpe-green); }

    /* btn-cancel */
    html.dark .btn-cancel { background: #1e2d3d; color: var(--text-secondary); border-color: var(--border); }
    html.dark .btn-cancel:hover { background: #2a3a4a; }

    /* CAPA table status */
    html.dark .capa-status-closed     { background: rgba(1,169,130,0.18); color: #4db6ac; }
    html.dark .capa-status-inprogress { background: rgba(255,198,39,0.15); color: #ffe082; }
    html.dark .capa-status-open       { background: rgba(197,78,75,0.18);  color: #e57373; }

    /* Goals panel */
    html.dark .goal-card { background: #1e2d3d; border-color: var(--border); }

    /* Narr section */
    html.dark .narr-section { background: #141e2b; border-color: var(--border); }

    /* Week drill-down table */
    html.dark #weekDrillTable th { background: #0f1621; color: var(--text-muted); border-bottom-color: var(--border); }
    html.dark #weekDrillTable td { border-bottom-color: var(--border); }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text-primary);
      min-height: 100vh;
      font-size: 14px;
      line-height: 1.6;
    }
    
    /* ========== HEADER ========== */
    header {
      background: linear-gradient(135deg, var(--hpe-dark) 0%, #2a3d4f 100%);
      padding: 0 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 64px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }
    .hpe-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .hpe-logo-img {
      height: 36px;
      width: auto;
      border-radius: 6px;
      object-fit: contain;
      display: block;
    }
    .logo-text {
      color: white;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .logo-divider {
      width: 1px;
      height: 24px;
      background: rgba(255,255,255,0.2);
    }
    .header-title {
      color: rgba(255,255,255,0.9);
      font-size: 15px;
      font-weight: 500;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .last-refresh {
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--hpe-green);
      animation: pulse-green 2s infinite;
    }
    @keyframes pulse-green {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }
    .btn-refresh {
      background: var(--hpe-green);
      color: white;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .btn-refresh:hover { background: var(--hpe-green-dark); transform: translateY(-1px); }
    
    /* ========== NAV TABS ========== */
    .nav-tabs {
      background: white;
      border-bottom: 1px solid var(--border);
      padding: 0 28px;
      display: flex;
      gap: 0;
      position: sticky;
      top: 64px;
      z-index: 99;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      overflow-x: auto;
    }
    .nav-tab {
      padding: 14px 20px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 7px;
      letter-spacing: 0.1px;
    }
    .nav-tab:hover { color: var(--hpe-green); background: var(--hpe-green-light); }
    .nav-tab.active {
      color: var(--hpe-green);
      border-bottom-color: var(--hpe-green);
      font-weight: 600;
    }
    .tab-badge {
      background: var(--hpe-orange);
      color: white;
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 700;
    }
    
    /* ========== CONTENT AREA ========== */
    .content {
      padding: 24px 28px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    
    /* ========== SECTION HEADERS ========== */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--hpe-dark);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title .icon-badge {
      width: 36px;
      height: 36px;
      background: var(--hpe-green-light);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hpe-green);
      font-size: 16px;
    }
    .section-subtitle {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 2px;
    }
    
    /* ========== KPI CARDS ========== */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
      transition: all 0.25s;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
    }
    .kpi-card.green::before { background: var(--hpe-green); }
    .kpi-card.orange::before { background: var(--hpe-orange); }
    .kpi-card.red::before { background: var(--hpe-red); }
    .kpi-card.blue::before { background: var(--hpe-blue); }
    .kpi-card.slate::before { background: var(--hpe-slate); }
    .kpi-card.yellow::before { background: var(--hpe-yellow); }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
    .kpi-card[onclick]:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); outline: 2px solid rgba(1,169,130,0.3); }
    .kpi-card[onclick] { transition: all 0.2s; }
    .kpi-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      margin-bottom: 14px;
    }
    .kpi-icon.green { background: var(--hpe-green-light); color: var(--hpe-green); }
    .kpi-icon.orange { background: #fff3e6; color: var(--hpe-orange); }
    .kpi-icon.red { background: #fceaea; color: var(--hpe-red); }
    .kpi-icon.blue { background: #e8f0fb; color: var(--hpe-blue); }
    .kpi-icon.slate { background: #eef2f5; color: var(--hpe-slate); }
    .kpi-icon.yellow { background: #fffbe6; color: #b8860b; }
    .kpi-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 8px;
    }
    .kpi-value.big { font-size: 32px; }
    .kpi-delta {
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .delta-up { color: var(--hpe-green); }
    .delta-down { color: var(--hpe-red); }
    .delta-neutral { color: var(--text-muted); }
    .kpi-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    
    /* ========== CHART CARDS ========== */
    .chart-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .chart-grid-3 {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .chart-grid-3-equal {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      padding: 24px;
      transition: all 0.25s;
    }
    .card:hover { box-shadow: var(--shadow-hover); }
    .card-full { margin-bottom: 24px; }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-title i { color: var(--hpe-green); }
    .card-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .chart-container {
      position: relative;
      width: 100%;
    }
    .chart-container canvas {
      max-width: 100%;
    }
    
    /* ========== AI INSIGHTS PANEL ========== */
    .ai-insights {
      background: linear-gradient(135deg, #f8fffe 0%, #f0faf7 100%);
      border: 1px solid rgba(1,169,130,0.2);
      border-radius: var(--radius);
      padding: 20px;
      margin-bottom: 24px;
    }
    .ai-insights-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .ai-badge {
      background: linear-gradient(135deg, var(--hpe-green), #00c49a);
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .ai-insights-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--hpe-dark);
    }
    .insight-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: white;
      border-radius: 8px;
      border-left: 3px solid var(--hpe-green);
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .insight-item.warning { border-left-color: var(--hpe-orange); }
    .insight-item.alert { border-left-color: var(--hpe-red); }
    .insight-item.info { border-left-color: var(--hpe-blue); }
    .insight-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
    }
    .insight-icon.green { background: var(--hpe-green-light); color: var(--hpe-green); }
    .insight-icon.warning { background: #fff3e6; color: var(--hpe-orange); }
    .insight-icon.alert { background: #fceaea; color: var(--hpe-red); }
    .insight-icon.info { background: #e8f0fb; color: var(--hpe-blue); }
    .insight-text { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    .insight-text strong { color: var(--text-primary); }
    
    /* ========== GAUGE ========== */
    .gauge-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    .gauge-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      padding: 24px;
      text-align: center;
    }
    .gauge-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 16px;
    }
    .radial-gauge {
      width: 160px;
      height: 80px;
      margin: 0 auto 12px;
      position: relative;
    }
    .gauge-value-display {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
    }
    .gauge-target {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .gauge-status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }
    .gauge-status.good { background: var(--hpe-green-light); color: var(--hpe-green); }
    .gauge-status.warning { background: #fff3e6; color: var(--hpe-orange); }
    .gauge-status.bad { background: #fceaea; color: var(--hpe-red); }
    
    /* ========== TABLE ========== */
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead tr {
      background: linear-gradient(135deg, var(--hpe-dark), #2a3d4f);
      color: white;
    }
    thead th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    tbody tr { transition: background 0.15s; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: var(--hpe-green-light); }
    tbody td {
      padding: 11px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
    }
    tbody td:first-child { font-weight: 500; color: var(--text-primary); }
    
    /* ========== ACCURACY BADGE ========== */
    .acc-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .acc-badge.excellent { background: #e6f9f5; color: var(--hpe-green); }
    .acc-badge.good { background: #e8f0fb; color: var(--hpe-blue); }
    .acc-badge.warning { background: #fff3e6; color: var(--hpe-orange); }
    .acc-badge.bad { background: #fceaea; color: var(--hpe-red); }
    /* ========== ACCURACY COLOR LEGEND ========== */
    .acc-legend-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 7px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 14px;
      font-size: 11px;
      font-weight: 600;
    }
    .acc-legend-bar .alb-title {
      color: var(--text-muted);
      font-weight: 700;
      font-size: 11px;
      margin-right: 4px;
      white-space: nowrap;
    }
    .acc-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .ali-green  { background:#e6f9f5; color:#01A982; border:1px solid rgba(1,169,130,0.3); }
    .ali-amber  { background:#fff3e6; color:#FF8300; border:1px solid rgba(255,131,0,0.3); }
    .ali-red    { background:#fceaea; color:#C54E4B; border:1px solid rgba(197,78,75,0.3); }
    html.dark .acc-legend-bar { background:#1e2a3a; border-color:rgba(255,255,255,0.1); }

    /* ========== DRILL-DOWN TABLE ROWS ========== */
    .drill-row-clickable { cursor: pointer; transition: background 0.15s; }
    .drill-row-clickable:hover { background: #edfff8 !important; }
    .drill-row-selected { background: #d4f7eb !important; outline: 2px solid var(--hpe-green); }
    
    /* ========== PROGRESS BAR ========== */
    .progress-bar-container {
      background: var(--border);
      border-radius: 20px;
      height: 8px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      border-radius: 20px;
      transition: width 0.6s ease;
    }
    .progress-bar.green { background: linear-gradient(90deg, var(--hpe-green-dark), var(--hpe-green)); }
    .progress-bar.orange { background: linear-gradient(90deg, #e67300, var(--hpe-orange)); }
    .progress-bar.red { background: linear-gradient(90deg, #a03030, var(--hpe-red)); }
    
    /* ========== CAPA ========== */
    /* ---- CAPA Upload Modal ---- */
    .modal-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(26,37,50,0.65); z-index: 500;
      align-items: center; justify-content: center;
      padding: 16px; backdrop-filter: blur(3px);
    }
    .modal-overlay.open { display: flex; }
    .modal-box {
      background: white; border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
      width: 100%; max-width: 820px; max-height: 92vh;
      overflow-y: auto; animation: modalIn 0.25s ease;
    }
    @keyframes modalIn {
      from { opacity:0; transform: translateY(-20px) scale(0.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 18px; border-bottom: 1px solid var(--border);
      position: sticky; top: 0; background: white;
      border-radius: 16px 16px 0 0; z-index: 1;
    }
    .modal-title { font-size: 17px; font-weight: 700; color: var(--hpe-dark); display: flex; align-items: center; gap: 10px; }
    .modal-close {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
      background: white; cursor: pointer; display: flex; align-items: center;
      justify-content: center; font-size: 16px; color: var(--text-muted); transition: all 0.15s;
    }
    .modal-close:hover { background: #fceaea; color: var(--hpe-red); border-color: var(--hpe-red); }
    .modal-body { padding: 24px; }
    .modal-tabs {
      display: flex; gap: 4px; margin-bottom: 22px;
      background: #f4f6f9; padding: 4px; border-radius: 10px;
    }
    .modal-tab {
      flex: 1; padding: 8px 14px; border: none; border-radius: 7px;
      background: transparent; font-size: 13px; font-weight: 500;
      cursor: pointer; font-family: 'Inter', sans-serif; color: var(--text-muted);
      transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .modal-tab.active { background: white; color: var(--hpe-green); font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.1); }
    .modal-panel { display: none; }
    .modal-panel.active { display: block; }
    .modal-drop {
      border: 2px dashed var(--hpe-green); border-radius: 12px; padding: 36px 24px;
      text-align: center; background: var(--hpe-green-light); cursor: pointer; transition: all 0.2s; margin-bottom: 16px;
    }
    .modal-drop:hover, .modal-drop.dragover { background: rgba(1,169,130,0.14); }
    .modal-drop-icon { font-size: 40px; color: var(--hpe-green); margin-bottom: 12px; }
    .modal-drop-title { font-size: 15px; font-weight: 700; color: var(--hpe-dark); margin-bottom: 6px; }
    .modal-drop-sub { font-size: 12px; color: var(--text-muted); line-height: 1.7; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .form-grid-full { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); }
    .form-label .req { color: var(--hpe-red); }
    .form-input, .form-select, .form-textarea {
      padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px;
      font-size: 13px; font-family: 'Inter', sans-serif; color: var(--text-primary);
      background: white; transition: border-color 0.15s, box-shadow 0.15s; outline: none;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--hpe-green); box-shadow: 0 0 0 3px rgba(1,169,130,0.12);
    }
    .form-textarea { resize: vertical; min-height: 60px; }
    .modal-footer {
      padding: 16px 24px 20px; border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn-cancel {
      padding: 9px 18px; border: 1px solid var(--border); background: white;
      border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
      font-family: 'Inter', sans-serif; color: var(--text-secondary); transition: all 0.15s;
    }
    .btn-cancel:hover { background: #f4f6f9; }
    .btn-primary {
      padding: 9px 20px; border: none; background: var(--hpe-green); color: white;
      border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 7px; transition: all 0.15s;
    }
    .btn-primary:hover { background: var(--hpe-green-dark); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .parse-preview {
      background: #f8fafc; border: 1px solid var(--border); border-radius: 8px;
      padding: 12px 16px; margin-top: 12px; font-size: 12px; color: var(--text-secondary); display: none;
    }
    .parse-preview.show { display: block; }
    .parse-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .parse-row i { width: 16px; text-align: center; }
    .toast {
      position: fixed; bottom: 28px; right: 28px; background: var(--hpe-dark); color: white;
      padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500;
      z-index: 9999; box-shadow: 0 6px 24px rgba(0,0,0,0.2); display: none; align-items: center;
      gap: 10px; transform: translateY(80px); opacity: 0;
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); max-width: 380px;
    }
    .toast.show { display: flex; transform: translateY(0); opacity: 1; }
    .toast.success { border-left: 4px solid var(--hpe-green); }
    .toast.error   { border-left: 4px solid var(--hpe-red); }
    .toast.info    { border-left: 4px solid var(--hpe-blue); }

    /* ── Export Report Styles ─────────────────────────────────────── */
    .export-btn-group { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .btn-export-pdf {
      background: linear-gradient(135deg,#C54E4B,#e05555); color:white; border:none;
      padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;
      display:flex; align-items:center; gap:7px; font-family:'Inter',sans-serif;
      box-shadow:0 2px 8px rgba(197,78,75,0.35); transition:all 0.2s; white-space:nowrap;
    }
    .btn-export-pdf:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(197,78,75,0.5); }
    .btn-export-ppt {
      background: linear-gradient(135deg,#D04424,#e8541e); color:white; border:none;
      padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;
      display:flex; align-items:center; gap:7px; font-family:'Inter',sans-serif;
      box-shadow:0 2px 8px rgba(208,68,36,0.35); transition:all 0.2s; white-space:nowrap;
    }
    .btn-export-ppt:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(208,68,36,0.5); }
    .btn-export-pdf:disabled, .btn-export-ppt:disabled { opacity:0.55; cursor:not-allowed; transform:none; }

    /* Export modal overrides */
    .export-modal-box {
      background:#fff; border-radius:16px; width:820px; max-width:96vw;
      max-height:90vh; overflow:hidden; display:flex; flex-direction:column;
      box-shadow:0 24px 80px rgba(0,0,0,0.22);
    }
    .export-modal-header {
      background: linear-gradient(135deg,var(--hpe-dark) 0%,#1a2e42 100%);
      padding:20px 26px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
    }
    .export-modal-title { color:white; font-size:17px; font-weight:700; display:flex; align-items:center; gap:10px; }
    .export-modal-close {
      background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); color:white;
      width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:14px;
      display:flex; align-items:center; justify-content:center; transition:all 0.15s;
    }
    .export-modal-close:hover { background:rgba(255,255,255,0.22); }
    .export-tab-bar {
      display:flex; border-bottom:2px solid var(--border); background:#f8fafc; flex-shrink:0; padding:0 24px;
    }
    .export-tab {
      padding:12px 20px; font-size:13px; font-weight:600; cursor:pointer; border:none;
      background:none; color:var(--text-muted); border-bottom:3px solid transparent;
      margin-bottom:-2px; display:flex; align-items:center; gap:8px; transition:all 0.15s;
    }
    .export-tab.active { color:var(--hpe-green); border-bottom-color:var(--hpe-green); }
    .export-tab-panel { display:none; }
    .export-tab-panel.active { display:block; }
    .export-modal-body { padding:24px; overflow-y:auto; flex:1; }

    /* PDF preview card */
    .pdf-preview-card {
      border:2px solid var(--border); border-radius:12px; padding:20px;
      background:#fafbfc; margin-bottom:16px; position:relative; overflow:hidden;
    }
    .pdf-preview-card::before {
      content:''; position:absolute; top:0; left:0; width:4px; height:100%;
      background:linear-gradient(to bottom,var(--hpe-green),#01c49a);
    }
    .pdf-section-list { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
    .pdf-section-chip {
      display:flex; align-items:center; gap:6px; padding:5px 12px;
      border-radius:20px; font-size:11px; font-weight:600;
      background:#e6f9f5; color:var(--hpe-green); border:1px solid rgba(1,169,130,0.2);
    }
    .pdf-section-chip.disabled { background:#f4f6f9; color:var(--text-muted); border-color:var(--border); }

    /* PPT slide grid */
    .slide-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    .slide-thumb {
      border:2px solid var(--border); border-radius:10px; overflow:hidden; cursor:pointer;
      transition:all 0.2s; position:relative; aspect-ratio:16/9; background:#f0f4ff;
    }
    .slide-thumb:hover { border-color:var(--hpe-green); transform:translateY(-2px); box-shadow:0 6px 20px rgba(1,169,130,0.15); }
    .slide-thumb.selected { border-color:var(--hpe-green); box-shadow:0 0 0 3px rgba(1,169,130,0.2); }
    .slide-thumb canvas { width:100%; height:100%; display:block; }
    .slide-thumb-label {
      position:absolute; bottom:0; left:0; right:0; background:rgba(15,22,36,0.82);
      color:white; font-size:10px; font-weight:600; padding:4px 8px; text-align:center;
    }
    .slide-check {
      position:absolute; top:6px; right:6px; width:18px; height:18px; border-radius:50%;
      background:var(--hpe-green); color:white; font-size:9px; display:none;
      align-items:center; justify-content:center;
    }
    .slide-thumb.selected .slide-check { display:flex; }

    /* Progress overlay */
    .export-progress-wrap {
      display:none; position:fixed; inset:0; z-index:99999; background:rgba(15,22,36,0.7);
      align-items:center; justify-content:center; backdrop-filter:blur(3px);
    }
    .export-progress-wrap.active { display:flex; }
    .export-progress-box {
      background:white; border-radius:16px; padding:36px 44px; text-align:center;
      min-width:340px; box-shadow:0 20px 60px rgba(0,0,0,0.3);
    }
    .export-progress-icon { font-size:42px; margin-bottom:14px; display:block; }
    .export-progress-title { font-size:16px; font-weight:700; color:var(--hpe-dark); margin-bottom:6px; }
    .export-progress-sub { font-size:12px; color:var(--text-muted); margin-bottom:20px; }
    .export-progress-bar-wrap { background:#eef1f5; border-radius:20px; height:8px; overflow:hidden; }
    .export-progress-bar { height:100%; background:linear-gradient(90deg,var(--hpe-green),#00c49a); border-radius:20px; transition:width 0.3s ease; width:0%; }
    .export-progress-pct { font-size:12px; font-weight:700; color:var(--hpe-green); margin-top:8px; }
    .btn-upload-capa {
      background: linear-gradient(135deg, var(--hpe-green), #00c49a); color: white;
      border: none; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      font-family: 'Inter', sans-serif; transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(1,169,130,0.3);
    }
    .btn-upload-capa:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(1,169,130,0.4); }
    .btn-export-capa {
      background: white; color: var(--hpe-slate); border: 1px solid var(--border);
      padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
      cursor: pointer; display: flex; align-items: center; gap: 7px;
      font-family: 'Inter', sans-serif; transition: all 0.15s;
    }
    .btn-export-capa:hover { background: #f4f6f9; }
    .capa-action-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .capa-count-badge { background: var(--hpe-green-light); color: var(--hpe-green); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-closed { background: #e6f9f5; color: var(--hpe-green); }
    .status-inprogress { background: #fffbe6; color: #b8860b; }
    .status-open { background: #fceaea; color: var(--hpe-red); }
    .status-review { background: #e8f0fb; color: var(--hpe-blue); }
    
    /* ========== HEATMAP ========== */
    .heatmap-grid {
      display: grid;
      gap: 4px;
    }
    .heatmap-cell {
      border-radius: 6px;
      padding: 10px 6px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    .heatmap-cell:hover { transform: scale(1.05); box-shadow: var(--shadow); z-index: 1; }
    .heatmap-cell .tooltip {
      display: none;
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--hpe-dark);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 10;
      margin-bottom: 4px;
    }
    .heatmap-cell:hover .tooltip { display: block; }
    
    /* ========== FORECAST / TREND ========== */
    .forecast-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    /* ========== UPLOAD AREA ========== */
    .upload-zone {
      border: 2px dashed var(--hpe-green);
      border-radius: var(--radius);
      padding: 40px;
      text-align: center;
      background: var(--hpe-green-light);
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 24px;
    }
    .upload-zone:hover { background: rgba(1,169,130,0.12); border-color: var(--hpe-green-dark); }
    .upload-zone.dragover { background: rgba(1,169,130,0.2); transform: scale(1.01); }
    .upload-icon { font-size: 48px; color: var(--hpe-green); margin-bottom: 16px; }
    .upload-title { font-size: 18px; font-weight: 700; color: var(--hpe-dark); margin-bottom: 8px; }
    .upload-subtitle { font-size: 13px; color: var(--text-muted); }
    
    /* ========== NARR PANEL ========== */
    .narrative-box {
      background: linear-gradient(135deg, #f0f8ff 0%, #e8f4ff 100%);
      border: 1px solid rgba(13,93,191,0.2);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 24px;
    }
    .narr-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--hpe-dark);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .narr-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.8;
    }
    .narr-text .highlight { color: var(--hpe-green); font-weight: 600; }
    .narr-text .alert-text { color: var(--hpe-red); font-weight: 600; }
    .narr-text .warn-text { color: var(--hpe-orange); font-weight: 600; }
    
    /* ========== RISK FLAGS ========== */
    .risk-flags {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .risk-flag {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .risk-flag.high { border-left: 4px solid var(--hpe-red); }
    .risk-flag.medium { border-left: 4px solid var(--hpe-orange); }
    .risk-flag.low { border-left: 4px solid var(--hpe-yellow); }
    .risk-level {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .risk-level.high { background: #fceaea; color: var(--hpe-red); }
    .risk-level.medium { background: #fff3e6; color: var(--hpe-orange); }
    .risk-level.low { background: #fffbe6; color: #b8860b; }
    .risk-text { font-size: 13px; color: var(--text-secondary); flex: 1; }
    
    /* ========== SPARKLINE ========== */
    .sparkline-container {
      width: 100%;
      height: 50px;
      margin-top: 8px;
    }
    
    /* ========== DATA VALIDATION LOG ========== */
    .validation-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: white;
      border: 1px solid var(--border);
    }
    .val-icon { font-size: 16px; }
    .val-text { font-size: 13px; color: var(--text-secondary); }
    
    /* ========== SCROLLBAR ========== */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
    ::-webkit-scrollbar-thumb { background: #c1cdd6; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--hpe-slate-light); }
    
    /* ========== ANIMATIONS ========== */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .tab-content.active { animation: fadeIn 0.3s ease; }
    
    /* ========== RESPONSIVE ========== */
    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-grid-2 { grid-template-columns: 1fr; }
      .chart-grid-3 { grid-template-columns: 1fr; }
      .gauge-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .content { padding: 16px; }
      header { padding: 0 16px; }
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .kpi-grid-4 { grid-template-columns: 1fr 1fr; }
    }

    .period-filter {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-btn {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: white;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
      color: var(--text-secondary);
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--hpe-green);
      border-color: var(--hpe-green);
      color: white;
    }
    /* Hire Type toggle buttons */
    .ht-btn {
      padding: 5px 13px;
      border-radius: 20px;
      border: 1.5px solid var(--border);
      background: white;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
      color: var(--text-secondary);
      letter-spacing: 0.2px;
    }
    .ht-btn:hover { border-color: #0D5DBF; color: #0D5DBF; }
    .ht-btn.ht-all.active   { background:#425563; border-color:#425563; color:white; }
    .ht-btn.ht-exp.active   { background:#0D5DBF; border-color:#0D5DBF; color:white; }
    .ht-btn.ht-ur.active    { background:#FF8300; border-color:#FF8300; color:white; }
    html.dark .ht-btn { background:#1a2332; border-color:#2a3a4a; color:var(--text-muted); }
    .ht-divider { width:1px; height:22px; background:var(--border); margin:0 4px; }
    .filter-select {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: white;
      font-size: 12px;
      font-family: 'Inter', sans-serif;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .divider { height: 1px; background: var(--border); margin: 20px 0; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .mt-0 { margin-top: 0; }
    .mb-20 { margin-bottom: 20px; }

    /* ========== SLA DASHBOARD STYLES ========== */
    .sla-sub-nav { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:22px; padding:14px 18px; background:white; border-radius:10px; border:1px solid var(--border); box-shadow:var(--shadow); }
    .sla-sub-btn { padding:7px 16px; border-radius:20px; border:1px solid var(--border); background:white; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; color:var(--text-secondary); }
    .sla-sub-btn:hover,.sla-sub-btn.active { background:var(--hpe-green); border-color:var(--hpe-green); color:white; }
    .sla-panel { display:none; }
    .sla-panel.active { display:block; }
    .sla-kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:22px; }
    .sla-kpi { background:white; border-radius:12px; padding:18px 20px; border:1px solid var(--border); box-shadow:var(--shadow); text-align:center; position:relative; overflow:hidden; }
    .sla-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--hpe-green); }
    .sla-kpi.red::before { background:var(--hpe-red); }
    .sla-kpi.orange::before { background:var(--hpe-orange); }
    .sla-kpi.blue::before { background:var(--hpe-blue); }
    .sla-kpi-val { font-size:30px; font-weight:800; color:var(--text-primary); }
    .sla-kpi-label { font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-top:3px; }
    .sla-kpi-sub { font-size:12px; color:var(--text-secondary); margin-top:4px; }
    .sla-health-banner { border-radius:10px; padding:16px 20px; margin-bottom:22px; display:flex; align-items:center; gap:14px; font-size:13px; font-weight:600; }
    .sla-health-banner.good { background:#e6f7f2; border:1px solid #b3ead8; color:#0a7a56; }
    .sla-health-banner.warn { background:#fff3e6; border:1px solid #ffd9a8; color:#a05c00; }
    .sla-health-banner.bad  { background:#fceaea; border:1px solid #f5c0c0; color:#8b1a1a; }
    .sla-section-title { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .sla-metric-table { width:100%; border-collapse:collapse; font-size:12px; }
    .sla-metric-table th { background:#f4f7fb; color:var(--text-muted); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; padding:10px 12px; text-align:left; border-bottom:2px solid var(--border); }
    .sla-metric-table td { padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:middle; }
    .sla-metric-table tr:hover td { background:#f8fbff; }
    .sla-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:10px; font-size:11px; font-weight:700; }
    .sla-pill.met { background:#e6f7f2; color:#0a7a56; }
    .sla-pill.notmet { background:#fceaea; color:#8b1a1a; }
    .sla-pill.nr { background:#f4f7fb; color:#425563; }
    .sla-pill.na { background:#fff3e6; color:#a05c00; }
    .sla-heatmap-grid { display:grid; gap:3px; margin-top:10px; }
    .sla-hm-cell { padding:8px 5px; border-radius:5px; text-align:center; font-size:10px; font-weight:700; cursor:default; transition:opacity 0.2s; }
    .sla-hm-cell:hover { opacity:0.8; }
    .sla-fy-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:22px; }
    .sla-fy-card { background:white; border-radius:12px; padding:20px; border:1px solid var(--border); box-shadow:var(--shadow); }
    .sla-fy-label { font-size:18px; font-weight:800; color:var(--hpe-blue); margin-bottom:4px; }
    .sla-insight-box { background:linear-gradient(135deg,#f8fffe,#f0faf7); border:1px solid rgba(1,169,130,0.2); border-radius:10px; padding:16px 18px; margin-bottom:14px; }
    .sla-insight-box.warn { background:linear-gradient(135deg,#fffdf8,#fff8ed); border-color:rgba(255,131,0,0.2); }
    .sla-insight-box.bad  { background:linear-gradient(135deg,#fff8f8,#fceaea); border-color:rgba(197,78,75,0.2); }
    .sla-trend-arrow { font-size:14px; font-weight:700; }
    .sla-trend-up { color:var(--hpe-green); }
    .sla-trend-dn { color:var(--hpe-red); }
    .sla-trend-st { color:var(--hpe-orange); }
    .sla-rec-item { display:flex; gap:12px; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--border); font-size:12px; }
    .sla-rec-item:last-child { border-bottom:none; }
    .sla-rec-num { min-width:24px; height:24px; border-radius:50%; background:var(--hpe-green); color:white; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .sla-rec-num.orange { background:var(--hpe-orange); }
    .sla-rec-num.red { background:var(--hpe-red); }

    /* SLA health banner variants (used by JS) */
    .sla-health-good { background:#e6f7f2; border:1px solid #b3ead8; color:#0a7a56; }
    .sla-health-warn { background:#fff3e6; border:1px solid #ffd9a8; color:#a05c00; }
    .sla-health-crit { background:#fceaea; border:1px solid #f5c0c0; color:#8b1a1a; }

    /* SLA badges */
    .sla-badge { display:inline-block; padding:2px 8px; border-radius:8px; font-size:11px; font-weight:700; }
    .sla-badge-met  { background:#e6f7f2; color:#0a7a56; }
    .sla-badge-nm   { background:#fceaea; color:#8b1a1a; }
    .sla-badge-nr   { background:#f0f0f0; color:#666; }

    /* SLA heatmap */
    .sla-heatmap-wrap { overflow-x:auto; font-size:10px; }
    .sla-heatmap-grid { display:grid; grid-template-columns:130px repeat(24,38px); gap:2px; min-width:max-content; }
    .sla-hm-corner,.sla-hm-month,.sla-hm-label { padding:4px 3px; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .sla-hm-corner { background:#f4f7fb; border-radius:4px; }
    .sla-hm-month  { background:#e9ecef; border-radius:4px; writing-mode:vertical-rl; transform:rotate(180deg); height:56px; }
    .sla-hm-label  { background:#f4f7fb; border-radius:4px; justify-content:flex-start; padding-left:6px; }
    .sla-hm-met,.sla-hm-nm,.sla-hm-nr,.sla-hm-na { width:38px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:11px; font-weight:700; cursor:default; }
    .sla-hm-met { background:#b7f5dc; color:#0a7a56; }
    .sla-hm-nm  { background:#ffc9c9; color:#8b1a1a; }
    .sla-hm-nr  { background:#e9ecef; color:#555; }
    .sla-hm-na  { background:#fff3e6; color:#a05c00; }
    .sla-hm-legend { display:flex; gap:16px; padding:10px 4px; font-size:12px; }
    .sla-hm-legend span { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; font-weight:600; }

    /* SLA insight cards (reporting section) */
    .sla-insight-card { border-radius:10px; padding:14px 16px; margin-bottom:12px; }
    .sla-ic-title { font-size:13px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:7px; }
    .sla-ic-body  { font-size:12px; line-height:1.6; }
    .sla-ic-warn  { background:#fff9ed; border:1px solid #ffd9a8; }
    .sla-ic-warn .sla-ic-title { color:#a05c00; }
    .sla-ic-good  { background:#f0fff9; border:1px solid #b3ead8; }
    .sla-ic-good .sla-ic-title { color:#0a7a56; }
    .sla-ic-info  { background:#f0f6ff; border:1px solid #c5d8f8; }
    .sla-ic-info .sla-ic-title { color:#1a4fa0; }

    /* SLA chronic fail panel */
    .sla-chronic-item { background:#fff8f8; border:1px solid #f5c0c0; border-radius:8px; padding:12px 14px; margin-bottom:10px; }
    .sla-chronic-name { font-size:13px; font-weight:700; color:#8b1a1a; margin-bottom:3px; }
    .sla-chronic-stat { font-size:12px; color:#555; margin-bottom:6px; }
    .sla-chronic-bar  { background:#f0f0f0; border-radius:4px; height:8px; overflow:hidden; }

    /* SLA trend classification groups */
    .sla-trend-classifications { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:22px; }
    .sla-trend-group { border-radius:10px; padding:14px 16px; }
    .sla-tg-title { font-size:13px; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .sla-tg-item  { font-size:12px; padding:5px 0; border-bottom:1px solid rgba(0,0,0,0.06); }
    .sla-tg-item:last-child { border-bottom:none; }
    .sla-tg-improving { background:#f0fff9; border:1px solid #b3ead8; }
    .sla-tg-improving .sla-tg-title { color:#0a7a56; }
    .sla-tg-stable { background:#f4f7fb; border:1px solid #d1dae6; }
    .sla-tg-stable .sla-tg-title { color:#425563; }
    .sla-tg-declining { background:#fff8f8; border:1px solid #f5c0c0; }
    .sla-tg-declining .sla-tg-title { color:#8b1a1a; }

    /* SLA recommendations (new style — replaces old .sla-rec-item) */
    .sla-rec-item { display:block; border-radius:10px; padding:14px 16px; margin-bottom:12px; border-left:4px solid #ccc; }
    .sla-rec-priority { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px; }
    .sla-rec-title { font-size:13px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
    .sla-rec-body  { font-size:12px; line-height:1.6; color:#444; }
    .sla-rec-critical { background:#fff8f8; border-left-color:#e74c3c; }
    .sla-rec-critical .sla-rec-priority { color:#e74c3c; }
    .sla-rec-high { background:#fff9ed; border-left-color:#f7b731; }
    .sla-rec-high .sla-rec-priority { color:#d68910; }
    .sla-rec-medium { background:#f0f9f6; border-left-color:#01a982; }
    .sla-rec-medium .sla-rec-priority { color:#0a7a56; }
    .sla-rec-low { background:#f0f6ff; border-left-color:#3498db; }
    .sla-rec-low .sla-rec-priority { color:#1a4fa0; }

    /* SLA FY comparison extras */
    .sla-fy-stat-row { display:flex; gap:18px; flex-wrap:wrap; margin-top:10px; }
    .sla-fy-stat { text-align:center; }
    .sla-fy-stat-val { font-size:22px; font-weight:800; color:var(--hpe-blue); }
    .sla-fy-stat-lbl { font-size:11px; color:var(--text-muted); font-weight:600; }
    .sla-delta-positive { color:#01a982; font-weight:800; font-size:20px; }
    .sla-delta-negative { color:#e74c3c; font-weight:800; font-size:20px; }

    /* ===== PERFORMANCE INTELLIGENCE TAB ===== */
    .perf-sub-btn { padding:8px 16px; border-radius:20px; border:1.5px solid #ccc; background:white; color:#555; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.18s; display:inline-flex; align-items:center; gap:6px; }
    .perf-sub-btn:hover { border-color:var(--hpe-green); color:var(--hpe-green); }
    .perf-sub-btn.active { background:var(--hpe-green); color:white; border-color:var(--hpe-green); }
    .perf-panel { display:none; }
    .perf-panel.active { display:block; }
    .risk-badge { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; }
    .risk-critical { background:#fde8e8; color:#c0392b; border:1px solid #e74c3c; }
    .risk-high    { background:#fff3e0; color:#e65100; border:1px solid #FF8300; }
    .risk-medium  { background:#fff9c4; color:#827717; border:1px solid #fbc02d; }
    .risk-low     { background:#e8f5e9; color:#1b5e20; border:1px solid #01A982; }
    .risk-score-bar { display:inline-block; height:8px; border-radius:4px; vertical-align:middle; margin-right:6px; }
    .trend-up   { color:var(--hpe-green); font-weight:700; }
    .trend-down { color:var(--hpe-red);   font-weight:700; }
    .trend-flat { color:var(--text-muted); font-weight:600; }
    .coaching-flag { display:inline-block; background:#fff3cd; color:#856404; border:1px solid #ffc107; border-radius:10px; padding:2px 8px; font-size:10px; font-weight:700; margin-left:6px; }
    .at-risk-flag  { display:inline-block; background:#fde8e8; color:#c0392b; border:1px solid #e74c3c; border-radius:10px; padding:2px 8px; font-size:10px; font-weight:700; margin-left:6px; }
    .scorecard-card { background:white; border:1.5px solid var(--border); border-radius:12px; padding:16px; position:relative; transition:box-shadow 0.18s; }
    .scorecard-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.10); }
    .scorecard-tier-1 { border-top:4px solid var(--hpe-green); }
    .scorecard-tier-2 { border-top:4px solid var(--hpe-blue); }
    .scorecard-tier-3 { border-top:4px solid var(--hpe-orange); }
    .scorecard-tier-c { border-top:4px solid var(--hpe-red); }
    .sc-name { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
    .sc-acc  { font-size:24px; font-weight:800; }
    .sc-meta { font-size:11px; color:var(--text-muted); margin-top:4px; }
    .sc-bar  { height:6px; border-radius:3px; background:#e1e8ef; margin-top:8px; overflow:hidden; }
    .sc-bar-fill { height:100%; border-radius:3px; transition:width 0.4s; }
    .param-drill-item { padding:10px 14px; border-radius:8px; border:1px solid var(--border); cursor:pointer; margin-bottom:6px; transition:all 0.15s; display:flex; justify-content:space-between; align-items:center; }
    .param-drill-item:hover { border-color:var(--hpe-green); background:#f0fff9; }
    .param-drill-item.active { border-color:var(--hpe-green); background:#e0fff4; }
    .param-fail-pct { font-size:12px; font-weight:700; }
    .goal-ring-canvas { display:block; margin:0 auto; }
    .alert-item { display:flex; align-items:flex-start; gap:12px; padding:12px 16px; border-radius:10px; margin-bottom:10px; border-left:4px solid; }
    .alert-item.alert-red    { background:#fde8e8; border-color:#e74c3c; }
    .alert-item.alert-orange { background:#fff3e0; border-color:#FF8300; }
    .alert-item.alert-green  { background:#e8f5e9; border-color:#01A982; }
    .alert-icon { font-size:18px; margin-top:2px; }
    .alert-title { font-size:13px; font-weight:700; }
    .alert-desc  { font-size:12px; color:var(--text-secondary); margin-top:2px; }

    /* ============================================================
       FEATURE 1 — GLOBAL SEARCH BAR
    ============================================================ */
    .header-search-wrap { position:relative; display:flex; align-items:center; flex:1; max-width:320px; }
    .header-search-input {
      width:100%; height:34px; border-radius:18px;
      border:1.5px solid rgba(255,255,255,0.22); background:rgba(255,255,255,0.10);
      color:rgba(255,255,255,0.92); font-size:13px; padding:0 36px 0 14px;
      outline:none; transition:border-color 0.2s, box-shadow 0.2s;
    }
    .header-search-input:focus { border-color:var(--hpe-green); background:rgba(255,255,255,0.14); box-shadow:0 0 0 3px rgba(1,169,130,0.22); }
    .header-search-input::placeholder { color:rgba(255,255,255,0.45); }
    .header-search-icon { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.4); font-size:13px; pointer-events:none; }
    .search-results-dropdown {
      position:absolute; top:calc(100% + 8px); left:0; width:340px;
      background:var(--card-bg); border:1.5px solid var(--border);
      border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.15);
      z-index:9999; max-height:380px; overflow-y:auto; display:none;
    }
    .search-results-dropdown.open { display:block; }
    .search-result-item {
      display:flex; align-items:center; gap:10px;
      padding:10px 14px; cursor:pointer; border-bottom:1px solid var(--border);
      transition:background 0.15s;
    }
    .search-result-item:last-child { border-bottom:none; }
    .search-result-item:hover, .search-result-item.search-focused { background:var(--bg); }
    .search-result-icon { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
    .search-result-title { font-size:13px; font-weight:600; color:var(--text-primary); line-height:1.3; }
    .search-result-meta  { font-size:11px; color:var(--text-muted); margin-top:1px; }
    .search-result-cat   { font-size:10px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
    .search-highlight    { background:rgba(1,169,130,0.22); border-radius:3px; padding:0 1px; font-weight:700; }
    .search-no-results   { padding:18px; text-align:center; font-size:13px; color:var(--text-muted); }
    .search-section-head { padding:6px 14px 2px; font-size:10px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:var(--text-muted); background:var(--bg); }
    .search-elem-hl { outline:2.5px solid var(--hpe-green) !important; outline-offset:3px !important; border-radius:6px !important; animation:searchPulse 1.2s ease-out; }
    @keyframes searchPulse { 0%{box-shadow:0 0 0 0 rgba(1,169,130,0.5)} 70%{box-shadow:0 0 0 12px rgba(1,169,130,0)} 100%{box-shadow:none} }

    /* ============================================================
       FEATURE 2 — THRESHOLD SETTINGS DRAWER
    ============================================================ */
    .settings-btn {
      width:34px; height:34px; border-radius:50%; border:1.5px solid var(--border);
      background:var(--card-bg); color:var(--text-secondary); cursor:pointer;
      display:flex; align-items:center; justify-content:center; font-size:14px;
      transition:all 0.2s; flex-shrink:0;
    }
    .settings-btn:hover { border-color:var(--hpe-green); color:var(--hpe-green); transform:rotate(45deg); }
    .thresh-drawer-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:10000;
      opacity:0; pointer-events:none; transition:opacity 0.25s;
    }
    .thresh-drawer-overlay.open { opacity:1; pointer-events:all; }
    .thresh-drawer {
      position:fixed; top:0; right:-400px; width:380px; height:100vh;
      background:var(--card-bg); border-left:1.5px solid var(--border);
      box-shadow:-8px 0 32px rgba(0,0,0,0.18); z-index:10001;
      transition:right 0.3s cubic-bezier(0.4,0,0.2,1); overflow-y:auto;
      display:flex; flex-direction:column;
    }
    .thresh-drawer.open { right:0; }
    .thresh-drawer-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:20px 24px 16px; border-bottom:1px solid var(--border);
      position:sticky; top:0; background:var(--card-bg); z-index:1;
    }
    .thresh-drawer-title { font-size:16px; font-weight:700; color:var(--text-primary); }
    .thresh-drawer-close { background:none; border:none; cursor:pointer; font-size:18px; color:var(--text-muted); padding:4px; border-radius:6px; transition:color 0.15s; }
    .thresh-drawer-close:hover { color:var(--hpe-red); }
    .thresh-drawer-body { padding:20px 24px; flex:1; }
    .thresh-group { margin-bottom:28px; }
    .thresh-label { font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; }
    .thresh-value-badge { font-size:15px; font-weight:800; color:var(--hpe-green); min-width:48px; text-align:right; }
    .thresh-desc { font-size:11px; color:var(--text-muted); margin-bottom:10px; line-height:1.5; }
    .thresh-slider {
      -webkit-appearance:none; appearance:none; width:100%; height:6px;
      border-radius:3px; outline:none; cursor:pointer;
      background:linear-gradient(to right, var(--hpe-green) 0%, var(--hpe-green) 50%, var(--border) 50%, var(--border) 100%);
    }
    .thresh-slider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--hpe-green); cursor:pointer; box-shadow:0 2px 6px rgba(1,169,130,0.4); border:2px solid white; }
    .thresh-slider::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--hpe-green); cursor:pointer; box-shadow:0 2px 6px rgba(1,169,130,0.4); border:2px solid white; }
    .thresh-range-labels { display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:4px; }
    .thresh-apply-btn {
      width:100%; padding:12px; border-radius:10px; border:none;
      background:linear-gradient(135deg, var(--hpe-green), #008060); color:white;
      font-size:14px; font-weight:700; cursor:pointer; transition:opacity 0.2s;
      margin-top:8px; letter-spacing:0.3px;
    }
    .thresh-apply-btn:hover { opacity:0.88; }
    .thresh-reset-btn {
      width:100%; padding:10px; border-radius:10px; border:1.5px solid var(--border);
      background:transparent; color:var(--text-secondary); font-size:13px;
      font-weight:600; cursor:pointer; transition:all 0.2s; margin-top:8px;
    }
    .thresh-reset-btn:hover { border-color:var(--hpe-orange); color:var(--hpe-orange); }
    .thresh-live-preview {
      background:var(--bg); border-radius:10px; padding:14px 16px;
      margin-bottom:20px; border:1px solid var(--border);
    }
    .thresh-preview-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:var(--text-muted); margin-bottom:8px; }
    .thresh-preview-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-secondary); padding:3px 0; }
    .thresh-preview-val { font-weight:700; }

    /* ============================================================
       FEATURE 3 — RECRUITER COMPARISON TOOL
    ============================================================ */
    .compare-btn {
      position:absolute; bottom:12px; right:12px;
      font-size:10px; font-weight:700; padding:4px 10px; border-radius:8px;
      border:1.5px solid var(--border); background:var(--card-bg);
      color:var(--text-secondary); cursor:pointer; transition:all 0.18s;
      letter-spacing:0.3px; text-transform:uppercase;
    }
    .compare-btn:hover { border-color:var(--hpe-blue); color:var(--hpe-blue); background:#eef4ff; }
    .compare-btn.selected { border-color:var(--hpe-blue); background:var(--hpe-blue); color:white; }
    .scorecard-card { position:relative; padding-bottom:44px !important; }
    .compare-fab {
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(60px);
      background:linear-gradient(135deg, #0D5DBF, #0a47a0); color:white;
      border:none; border-radius:30px; padding:12px 28px; font-size:14px; font-weight:700;
      cursor:pointer; box-shadow:0 6px 24px rgba(13,93,191,0.45); z-index:8000;
      transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
      opacity:0; pointer-events:none; white-space:nowrap;
    }
    .compare-fab.visible { transform:translateX(-50%) translateY(0); opacity:1; pointer-events:all; }
    .compare-fab:hover { filter:brightness(1.1); }
    .compare-modal-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:10000;
      display:none; align-items:center; justify-content:center; padding:16px;
    }
    .compare-modal-overlay.open { display:flex; }
    .compare-modal {
      background:var(--card-bg); border:1.5px solid var(--border);
      border-radius:16px; box-shadow:0 16px 60px rgba(0,0,0,0.3);
      width:100%; max-width:900px; max-height:90vh; overflow-y:auto;
      animation:compareModalIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes compareModalIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
    .compare-modal-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:20px 24px 16px; border-bottom:1px solid var(--border);
      position:sticky; top:0; background:var(--card-bg); z-index:2; border-radius:16px 16px 0 0;
    }
    .compare-modal-title { font-size:17px; font-weight:700; color:var(--text-primary); }
    .compare-modal-close { background:none; border:none; cursor:pointer; font-size:20px; color:var(--text-muted); padding:4px 8px; border-radius:6px; transition:color 0.15s; }
    .compare-modal-close:hover { color:var(--hpe-red); }
    .compare-modal-body { padding:20px 24px 24px; }
    .compare-cols { display:grid; gap:16px; }
    .compare-col-header {
      padding:12px 14px; border-radius:10px; text-align:center;
      border-top:4px solid var(--hpe-blue);
    }
    .compare-col-name { font-size:15px; font-weight:700; color:var(--text-primary); }
    .compare-col-tier { font-size:11px; font-weight:700; margin-top:4px; }
    .compare-section-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:var(--text-muted); margin:16px 0 8px; }
    .compare-metric-grid { display:grid; gap:12px; }
    .compare-metric-card { background:var(--bg); border-radius:10px; padding:12px 14px; border:1px solid var(--border); }
    .compare-metric-label { font-size:11px; color:var(--text-muted); margin-bottom:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; }
    .compare-metric-value { font-size:18px; font-weight:800; color:var(--text-primary); }
    .compare-metric-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
    .compare-chart-wrap { position:relative; height:200px; margin:8px 0; }
    .compare-month-row { display:grid; gap:6px; margin-bottom:6px; }
    .compare-month-cell { background:var(--bg); border-radius:8px; padding:8px 12px; border:1px solid var(--border); text-align:center; }
    .compare-month-label { font-size:10px; color:var(--text-muted); font-weight:600; }
    .compare-month-val   { font-size:15px; font-weight:800; margin-top:2px; }

    /* Dark mode overrides for new features */
    html.dark .search-results-dropdown { background:#1a2332; border-color:#2a3a4a; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
    html.dark .search-result-item:hover, html.dark .search-result-item.search-focused { background:#0f1621; }
    html.dark .settings-btn { background:#1a2332; border-color:#2a3a4a; }
    html.dark .thresh-drawer { background:#1a2332; border-color:#2a3a4a; }
    html.dark .thresh-drawer-header { background:#1a2332; }
    html.dark .thresh-live-preview { background:#0f1621; border-color:#2a3a4a; }
    html.dark .thresh-reset-btn { border-color:#2a3a4a; color:#a8b8c8; }
    html.dark .compare-btn { background:#1a2332; border-color:#2a3a4a; color:#a8b8c8; }
    html.dark .compare-btn:hover { background:#0d2a5e; }
    html.dark .compare-modal { background:#1a2332; border-color:#2a3a4a; }
    html.dark .compare-modal-header { background:#1a2332; }
    html.dark .compare-col-header { background:#0f1621; }
    html.dark .compare-metric-card { background:#0f1621; border-color:#2a3a4a; }
    html.dark .compare-month-cell { background:#0f1621; border-color:#2a3a4a; }
    html.dark .param-drill-item:hover { background:#1a2332; }
    html.dark .param-drill-item.active { background:#0d2a1f; border-color:var(--hpe-green); }
    html.dark .search-section-head { background:#0f1621; }
    html.dark .scorecard-card { background:#1a2332; }

    /* ============================================================
       GLOSSARY TAB STYLES
    ============================================================ */
    .glossary-hero {
      background: linear-gradient(135deg, var(--hpe-dark) 0%, #1a3a52 100%);
      border-radius: 14px; padding: 28px 32px; margin-bottom: 24px;
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
      flex-wrap: wrap;
    }
    .glossary-hero-left { flex: 1; }
    .glossary-hero-title { font-size: 22px; font-weight: 800; color: white; margin-bottom: 6px; }
    .glossary-hero-sub { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.6; }
    .glossary-hero-stats { display: flex; gap: 24px; flex-wrap: wrap; }
    .glossary-hero-stat { text-align: center; }
    .glossary-hero-stat-val { font-size: 26px; font-weight: 800; color: var(--hpe-green); }
    .glossary-hero-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

    .glossary-search-bar {
      display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
    }
    .glossary-search-input {
      flex: 1; max-width: 420px; height: 38px; border-radius: 20px;
      border: 1.5px solid var(--border); background: var(--card-bg);
      color: var(--text-primary); font-size: 13px; padding: 0 16px 0 40px;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .glossary-search-input:focus { border-color: var(--hpe-green); box-shadow: 0 0 0 3px rgba(1,169,130,0.12); }
    .glossary-search-wrap { position: relative; flex: 1; max-width: 420px; }
    .glossary-search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 13px; pointer-events: none; }
    .glossary-filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .glossary-filter-btn {
      padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border);
      background: var(--card-bg); color: var(--text-secondary); font-size: 12px;
      font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap;
    }
    .glossary-filter-btn:hover { border-color: var(--hpe-green); color: var(--hpe-green); }
    .glossary-filter-btn.active { border-color: var(--hpe-green); background: var(--hpe-green); color: white; }

    .glossary-section { margin-bottom: 32px; }
    .glossary-section-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
      padding-bottom: 10px; border-bottom: 2px solid var(--border);
    }
    .glossary-section-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    .glossary-section-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
    .glossary-section-sub { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
    .glossary-section-badge {
      margin-left: auto; font-size: 10px; font-weight: 700; padding: 3px 10px;
      border-radius: 12px; background: var(--bg); color: var(--text-muted);
      border: 1px solid var(--border);
    }

    .glossary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 14px;
    }
    .glossary-card {
      cursor: pointer;
      background: var(--card-bg); border: 1.5px solid var(--border);
      border-radius: 12px; padding: 16px 18px; transition: box-shadow 0.18s, border-color 0.18s;
      border-left: 4px solid transparent;
    }
    .glossary-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-color: var(--hpe-green); }
    .glossary-card.gc-green  { border-left-color: #01A982; }
    .glossary-card.gc-blue   { border-left-color: #0D5DBF; }
    .glossary-card.gc-orange { border-left-color: #FF8300; }
    .glossary-card.gc-red    { border-left-color: #C54E4B; }
    .glossary-card.gc-purple { border-left-color: #9b59b6; }
    .glossary-card.gc-teal   { border-left-color: #17a2b8; }
    .glossary-card.glossary-hidden { display: none; }

    .gc-term {
      font-size: 14px; font-weight: 800; color: var(--text-primary);
      margin-bottom: 6px; display: flex; align-items: flex-start; gap: 8px;
    }
    .gc-abbr {
      font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px;
      background: var(--bg); color: var(--text-muted); border: 1px solid var(--border);
      white-space: nowrap; margin-top: 1px; flex-shrink: 0;
    }
    .gc-definition {
      font-size: 12px; color: var(--text-secondary); line-height: 1.65; margin-bottom: 10px;
    }
    .gc-formula-box {
      background: var(--bg); border-radius: 8px; padding: 10px 12px;
      border: 1px dashed var(--border); margin-bottom: 8px;
    }
    .gc-formula-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;
      color: var(--text-muted); margin-bottom: 5px;
    }
    .gc-formula {
      font-family: 'Courier New', monospace; font-size: 12px;
      color: var(--hpe-green); font-weight: 700; line-height: 1.5;
    }
    .gc-example {
      font-size: 11px; color: var(--text-muted); line-height: 1.55;
      background: var(--bg); border-radius: 6px; padding: 8px 10px;
      border-left: 3px solid var(--hpe-blue);
    }
    .gc-example strong { color: var(--text-secondary); }
    .gc-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
    .gc-tag {
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      background: rgba(1,169,130,0.10); color: var(--hpe-green);
      font-weight: 600; border: 1px solid rgba(1,169,130,0.2);
    }
    .gc-tag.blue   { background: rgba(13,93,191,0.10); color: var(--hpe-blue);   border-color: rgba(13,93,191,0.2); }
    .gc-tag.orange { background: rgba(255,131,0,0.10); color: var(--hpe-orange); border-color: rgba(255,131,0,0.2); }
    .gc-tag.red    { background: rgba(197,78,75,0.10);  color: var(--hpe-red);   border-color: rgba(197,78,75,0.2); }
    .gc-tag.purple { background: rgba(155,89,182,0.10); color: #9b59b6;          border-color: rgba(155,89,182,0.2); }

    .glossary-toc {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;
    }
    .glossary-toc-item {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      border-radius: 10px; border: 1.5px solid var(--border); background: var(--card-bg);
      cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text-secondary);
      transition: all 0.18s; text-decoration: none;
    }
    .glossary-toc-item:hover { border-color: var(--hpe-green); color: var(--hpe-green); background: rgba(1,169,130,0.06); }
    .glossary-toc-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .glossary-no-results {
      text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 14px;
    }

    /* Dark mode */
    html.dark .glossary-search-input { background: #1a2332; border-color: #2a3a4a; }
    html.dark .glossary-filter-btn   { background: #1a2332; border-color: #2a3a4a; }
    html.dark .glossary-card         { background: #1a2332; }
    html.dark .gc-formula-box        { background: #0f1621; }
    html.dark .gc-example            { background: #0f1621; }
    html.dark .glossary-toc-item     { background: #1a2332; border-color: #2a3a4a; }
  </style>
</head>
<body>

<!-- HEADER -->
<header>
  <div class="header-left">
    <div class="hpe-logo">
      <img src="/static/hpe-logo.jpg" alt="HPE" class="hpe-logo-img">
      <span class="logo-text">Hewlett Packard Enterprise</span>
    </div>
    <div class="logo-divider"></div>
    <span class="header-title"><i class="fas fa-chart-line" style="color:var(--hpe-green);margin-right:6px"></i>Audit Performance Dashboard</span>
  </div>
  <!-- Global Search Bar -->
  <div class="header-search-wrap" id="headerSearchWrap">
    <input type="text" class="header-search-input" id="globalSearchInput"
      placeholder="&#xF002;  Search KPIs, recruiters, errors…"
      autocomplete="off" aria-label="Global dashboard search"
      oninput="doSearch(this.value)" onkeydown="searchKeyNav(event)" onfocus="searchOnFocus()" />
    <i class="fas fa-search header-search-icon"></i>
    <div class="search-results-dropdown" id="searchDropdown" role="listbox"></div>
  </div>

  <div class="header-right">
    <div class="last-refresh">
      <div class="status-dot"></div>
      <span id="refreshTime">Last refreshed: just now</span>
    </div>
    <!-- Threshold Settings Button -->
    <button class="settings-btn" id="settingsBtn" onclick="openSettingsDrawer()" title="Configure alert thresholds" aria-label="Threshold settings">
      <i class="fas fa-sliders-h"></i>
    </button>
    <!-- Dark Mode Toggle -->
    <button class="dm-toggle" id="dmToggle" onclick="toggleDarkMode()" title="Toggle dark / light mode" aria-label="Toggle dark mode">
      <span class="dm-track">
        <span class="dm-thumb"></span>
      </span>
      <span class="dm-icon dm-icon-sun"><i class="fas fa-sun"></i></span>
      <span class="dm-icon dm-icon-moon"><i class="fas fa-moon"></i></span>
    </button>
    <button class="btn-refresh" onclick="refreshDashboard()">
      <i class="fas fa-sync-alt"></i> Refresh
    </button>
  </div>
</header>

<!-- NAV TABS -->
<nav class="nav-tabs">
  <div class="nav-tab active" onclick="switchTab('executive', this)">
    <i class="fas fa-tachometer-alt"></i> Executive Summary
  </div>
  <div class="nav-tab" onclick="switchTab('trends', this)">
    <i class="fas fa-chart-line"></i> Accuracy Trends
  </div>
  <div class="nav-tab" onclick="switchTab('improvement', this)">
    <i class="fas fa-arrow-trend-up"></i> Improvement & Scope
  </div>
  <div class="nav-tab" onclick="switchTab('capa', this)">
    <i class="fas fa-clipboard-check"></i> CAPA — Bot Undo <span class="tab-badge">4</span>
  </div>
  <div class="nav-tab" onclick="switchTab('insights', this)">
    <i class="fas fa-brain"></i> Audit Insights
  </div>
  <div class="nav-tab" onclick="switchTab('data', this)">
    <i class="fas fa-database"></i> Data Management
  </div>
  <div class="nav-tab" onclick="switchTab('sla', this)">
    <i class="fas fa-clipboard-check"></i> SLA Performance
  </div>
  <div class="nav-tab" onclick="switchTab('performance', this)">
    <i class="fas fa-user-chart"></i> Performance Intelligence
  </div>
  <div class="nav-tab" onclick="switchTab('glossary', this)">
    <i class="fas fa-book-open"></i> Glossary
  </div>
</nav>

<!-- ===== CONTENT ===== -->
<div class="content">

  <!-- TAB 1: EXECUTIVE SUMMARY -->
  <div class="tab-content active" id="tab-executive">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-tachometer-alt"></i></div>
          Executive Summary
        </div>
        <div class="section-subtitle">FY2026 | HPE TA Audit Compliance Overview</div>
      </div>
      <div class="period-filter" id="execPeriodFilter">
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">PERIOD:</span>
        <button class="filter-btn active" id="execFYBtn" onclick="applyGlobalFilter('fy','all',this,'exec')">FY 2026</button>
        <select class="filter-select" id="execMonthSelect" onchange="applyGlobalFilter('month',this.value,null,'exec')">
          <option value="all">All Months</option>
          <option value="Jan">January</option>
          <option value="Feb">February</option>
          <option value="Mar">March</option>
          <option value="Apr">April</option>
        </select>
        <select class="filter-select" id="execWeekSelect" onchange="applyGlobalFilter('week',this.value,null,'exec')" style="display:none">
          <option value="all">All Weeks</option>
        </select>
        <div class="ht-divider"></div>
        <span style="font-size:11px;color:var(--text-muted);font-weight:600">HIRE TYPE:</span>
        <button class="ht-btn ht-all active" id="htBtnAll" onclick="applyHireTypeFilter('all')">All</button>
        <button class="ht-btn ht-exp"        id="htBtnExp" onclick="applyHireTypeFilter('HPE_Experienced')">Experienced</button>
        <button class="ht-btn ht-ur"         id="htBtnUR"  onclick="applyHireTypeFilter('HPE_UR')">UR</button>
        <div style="width:1px;height:24px;background:var(--border);margin:0 4px"></div>
        <div class="export-btn-group">
          <button class="btn-export-pdf" id="btnExportPDF" onclick="openExportModal('pdf')" title="Export as PDF report">
            <i class="fas fa-file-pdf"></i> Export PDF
          </button>
          <button class="btn-export-ppt" id="btnExportPPT" onclick="openExportModal('ppt')" title="Export as PowerPoint slides">
            <i class="fas fa-file-powerpoint"></i> Export Slides
          </button>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card green">
        <div class="kpi-icon green"><i class="fas fa-bullseye"></i></div>
        <div class="kpi-label">Overall Accuracy</div>
        <div class="kpi-value big" id="kpi-accuracy">98.50%</div>
        <div class="kpi-delta delta-up" id="kpi-accuracy-delta"><i class="fas fa-arrow-up"></i> +1.18% vs Jan</div>
        <div class="kpi-sub" id="kpi-accuracy-sub">Target: 95.00%</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon blue"><i class="fas fa-clipboard-list"></i></div>
        <div class="kpi-label">Total Audits (FY)</div>
        <div class="kpi-value" id="kpi-total">8,599</div>
        <div class="kpi-delta delta-up" id="kpi-total-delta"><i class="fas fa-arrow-up"></i> +63% vs last period</div>
        <div class="kpi-sub" id="kpi-total-sub">Across 4 months</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon green"><i class="fas fa-check-circle"></i></div>
        <div class="kpi-label">Pass %</div>
        <div class="kpi-value" id="kpi-pass">97.69%</div>
        <div class="kpi-delta delta-neutral" id="kpi-pass-delta"><i class="fas fa-minus"></i> 8,400 audits passed</div>
        <div class="kpi-sub" id="kpi-pass-sub">Out of 8,599 total</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="kpi-label">Error %</div>
        <div class="kpi-value" id="kpi-errors" style="color:var(--hpe-red)">1.49%</div>
        <div class="kpi-delta delta-down" id="kpi-errors-delta"><i class="fas fa-arrow-up"></i> 128 errors</div>
        <div class="kpi-sub" id="kpi-errors-sub">Across 12 parameters</div>
      </div>
      <div class="kpi-card slate">
        <div class="kpi-icon" style="background:rgba(100,116,139,0.12)"><i class="fas fa-ban" style="color:#64748b"></i></div>
        <div class="kpi-label">N/A Count</div>
        <div class="kpi-value" id="kpi-na">71</div>
        <div class="kpi-delta delta-neutral" id="kpi-na-delta"><i class="fas fa-minus"></i> Not applicable</div>
        <div class="kpi-sub" id="kpi-na-sub">Excluded from accuracy</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-icon orange"><i class="fas fa-arrow-up"></i></div>
        <div class="kpi-label">Apr vs Mar Improvement</div>
        <div class="kpi-value" id="kpi-mom">-1.24%</div>
        <div class="kpi-delta delta-down" id="kpi-mom-delta"><i class="fas fa-arrow-down"></i> Apr vs Mar</div>
        <div class="kpi-sub" id="kpi-mom-sub">Month-over-month change</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-icon yellow"><i class="fas fa-calendar-week"></i></div>
        <div class="kpi-label">Recent Week Improvement</div>
        <div class="kpi-value" id="kpi-wow">+0.34%</div>
        <div class="kpi-delta delta-up" id="kpi-wow-delta"><i class="fas fa-arrow-up"></i> W4 vs W3 (Apr)</div>
        <div class="kpi-sub" id="kpi-wow-sub">Latest week vs prior</div>
      </div>
    </div>

    <!-- Gauges -->
    <div class="gauge-grid">
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-green);margin-right:6px"></i>Overall FY Accuracy</div>
        <canvas id="gaugeOverall" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeOverallVal">98.50%</div>
        <div class="gauge-target">Target: 95.00%</div>
        <div class="gauge-status good" id="gaugeOverallStatus">✓ Above Target</div>
      </div>
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-blue);margin-right:6px"></i>Critical Parameters</div>
        <canvas id="gaugeCritical" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeCriticalVal">98.62%</div>
        <div class="gauge-target">Target: 95.00%</div>
        <div class="gauge-status good" id="gaugeCriticalStatus">✓ Above Target</div>
      </div>
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-orange);margin-right:6px"></i>Non-Critical Parameters</div>
        <canvas id="gaugeNonCritical" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeNonCriticalVal">97.89%</div>
        <div class="gauge-target">Target: 97.00%</div>
        
        <div class="gauge-status good" id="gaugeNonCriticalStatus">✓ Above Target</div>
      </div>
    </div>

    <!-- Hire Type Accuracy Breakdown -->
    <div class="chart-grid-2" id="hireTypeBreakdownSection">
      <div class="card">
        <div class="card-title"><i class="fas fa-user-tie" style="color:#0D5DBF"></i> HPE Experienced — Accuracy by Month</div>
        <div class="card-subtitle">Audit accuracy for experienced hire candidates (HPE_Experienced)</div>
        <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
        <div id="ht-exp-section">
          <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">
            <i class="fas fa-upload" style="font-size:24px;margin-bottom:8px;display:block;opacity:0.4"></i>
            Upload data file to see HPE_Experienced accuracy breakdown
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-graduation-cap" style="color:#FF8300"></i> HPE UR — Accuracy by Month</div>
        <div class="card-subtitle">Audit accuracy for university recruiting candidates (HPE_UR)</div>
        <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
        <div id="ht-ur-section">
          <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">
            <i class="fas fa-upload" style="font-size:24px;margin-bottom:8px;display:block;opacity:0.4"></i>
            Upload data file to see HPE_UR accuracy breakdown
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Panel -->
    <div class="ai-insights">
      <div class="ai-insights-header">
        <div class="ai-insights-title" id="aiInsightsTitle">Audit Intelligence Snapshot — FY2026</div>
      </div>
      <div class="insight-list" id="aiInsightsList">
        <div class="insight-item">
          <div class="insight-icon green"><i class="fas fa-trending-up"></i></div>
          <div class="insight-text"><strong>Accuracy Dip in April — Action Required:</strong> Accuracy declined from 99.43% in February to 97.25% in April (−2.18%), marking the lowest point in FY2026. Root cause analysis and corrective action are recommended.</div>
        </div>
        <div class="insight-item alert">
          <div class="insight-icon alert"><i class="fas fa-exclamation-circle"></i></div>
          <div class="insight-text"><strong>Target Start Date — Critical Anomaly:</strong> "Target start date" parameter has an alarming 89.83% failure rate (53 failures out of 59 audits). This single parameter accounts for 41.4% of all errors.</div>
        </div>
        <div class="insight-item warning">
          <div class="insight-icon warning"><i class="fas fa-user-times"></i></div>
          <div class="insight-text"><strong>Recruiter Performance Gap:</strong> Recruiter Kusuma K has the lowest accuracy at 88.04% across 276 audits. Targeted coaching recommended.</div>
        </div>
        <div class="insight-item info">
          <div class="insight-icon info"><i class="fas fa-chart-bar"></i></div>
          <div class="insight-text"><strong>Upload data to refresh:</strong> Upload your Excel file in the Data Management tab to auto-generate insights from your latest data.</div>
        </div>
      </div>
    </div>

    <!-- Summary Trend Sparkline -->
    <div class="row-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-line"></i> 16-Week Accuracy Trend</div>
        <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
        <div class="card-subtitle">Weekly accuracy performance FY2026 with 95% target line</div>
        <div class="chart-container" style="height:180px">
          <canvas id="sparklineChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-layer-group"></i> Pre-Selection Stage Distribution</div>
        <div class="card-subtitle">Pre-selection audit pass / fail / N⁠A breakdown</div>
        <div class="chart-container" style="height:180px">
          <canvas id="stagePreChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-layer-group"></i> Post-Selection Stage Distribution</div>
        <div class="card-subtitle">Post-selection audit pass / fail / N⁠A breakdown</div>
        <div class="chart-container" style="height:180px">
          <canvas id="stagePostChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Month-wise Summary Table -->
    <div class="card card-full">
      <div class="card-title"><i class="fas fa-table"></i> Monthly Performance Summary</div>
      <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
        <div class="card-subtitle">FY2026 month-over-month performance breakdown</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Audits</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>N/A</th>
              <th>Accuracy %</th>
              <th>Error %</th>
              <th>Pass %</th>
              <th>MoM Change</th>
            </tr>
          </thead>
          <tbody id="monthSummaryTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- TAB 2: ACCURACY TRENDS -->
  <div class="tab-content" id="tab-trends">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-chart-line"></i></div>
          Accuracy Trends & Analysis
        </div>
        <div class="section-subtitle">Deep-dive into accuracy patterns across time periods, stages, and criticality</div>
      </div>
      <div class="period-filter" id="trendsPeriodFilter">
        <button class="filter-btn active" id="trendsAllBtn" onclick="applyGlobalFilter('fy','all',this,'trends')">All Months</button>
        <select class="filter-select" id="trendsMonthSelect" onchange="applyGlobalFilter('month',this.value,null,'trends')">
          <option value="all">Month</option>
          <option value="Jan">January</option>
          <option value="Feb">February</option>
          <option value="Mar">March</option>
          <option value="Apr">April</option>
        </select>
        <select class="filter-select" id="trendsWeekSelect" onchange="applyGlobalFilter('week',this.value,null,'trends')">
          <option value="all">Week</option>
        </select>
      </div>
    </div>

    <!-- Month-wise line chart -->
    <div class="card card-full mb-20">
      <div class="card-title"><i class="fas fa-chart-line"></i> Monthly Accuracy Trend with Target Line</div>
      <div class="card-subtitle">Month-over-month accuracy with 95% target benchmark and error rate overlay</div>
      <div class="chart-container" style="height:300px">
        <canvas id="monthlyTrendChart"></canvas>
      </div>
    </div>

    <!-- Week heatmap + Stage comparison -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-th"></i> Weekly Accuracy Heatmap</div>
        <div class="card-subtitle">Color-coded accuracy bands by week — hover for details</div>
        <div id="heatmapContainer" style="margin-top:16px"></div>
        <div style="display:flex;gap:12px;margin-top:14px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted)">
            <div style="width:14px;height:14px;border-radius:3px;background:#01A982"></div> ≥99%
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted)">
            <div style="width:14px;height:14px;border-radius:3px;background:#4fc3a1"></div> 98-99%
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted)">
            <div style="width:14px;height:14px;border-radius:3px;background:#FF8300"></div> 95-98%
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted)">
            <div style="width:14px;height:14px;border-radius:3px;background:#C54E4B"></div> &lt;95%
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-layer-group"></i> Pre vs Post Selection Accuracy</div>
        <div class="card-subtitle">Stage-wise performance comparison</div>
        <div class="chart-container" style="height:200px">
          <canvas id="stageComparisonChart"></canvas>
        </div>
        <div class="divider"></div>
        <div id="stageStatsCards"></div>
      </div>
    </div>

    <!-- Critical vs Non-Critical -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-exclamation-circle"></i> Critical vs Non-Critical Accuracy</div>
        <div class="card-subtitle">Grouped bar chart by criticality type per month</div>
        <div class="chart-container" style="height:250px">
          <canvas id="criticalBarChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-bar"></i> Weekly Error Volume</div>
        <div class="card-subtitle">Number of errors per week — identify spike weeks</div>
        <div class="chart-container" style="height:250px">
          <canvas id="weeklyErrorChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Drill-down table -->
    <div class="card card-full">
      <div class="card-title"><i class="fas fa-search-plus"></i> Weekly Drill-Down Table</div>
      <div class="card-subtitle">Click any row to see parameter breakdown</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Month</th>
              <th>Total Audits</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>N/A</th>
              <th>Accuracy %</th>
              <th>WoW Change</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody id="weeklyDrillTable"></tbody>
        </table>
      </div>
    </div>

    <!-- Parameter Breakdown Panel (shown on row click) -->
    <div class="card card-full" id="paramBreakdownCard" style="display:none;border:2px solid var(--hpe-green)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div>
          <div class="card-title" id="paramBreakdownTitle"><i class="fas fa-layer-group"></i> Parameter Breakdown</div>
          <div class="card-subtitle" id="paramBreakdownSub">Error distribution by parameter for selected week</div>
        </div>
        <button onclick="closeParamBreakdown()" style="background:none;border:1px solid #ccc;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:13px;color:var(--text-muted)">&#10005; Close</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Error by Parameter</div>
          <div id="paramBreakdownTable"></div>
        </div>
        <div style="height:220px">
          <canvas id="paramBreakdownChart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 3: IMPROVEMENT TREND & SCOPE -->
  <div class="tab-content" id="tab-improvement">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-arrow-trend-up"></i></div>
          Improvement Trend & Scope of Improvement
        </div>
        <div class="section-subtitle">Accuracy trajectory, forecasting, and root cause analysis for targeted improvement</div>
      </div>
      <!-- Accuracy Trend Filter — unified with global filter -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap" id="improvePeriodFilter">
        <span style="font-size:13px;font-weight:600;color:var(--text-muted)"><i class="fas fa-filter" style="margin-right:4px"></i>View By:</span>
        <div style="display:flex;gap:6px">
          <button class="trend-filter-btn active" id="improveFilterWeek" onclick="applyGlobalFilter('week','all',this,'improve')"
            style="padding:5px 14px;border-radius:20px;border:2px solid var(--hpe-green);background:var(--hpe-green);color:white;font-size:12px;font-weight:600;cursor:pointer">Weekly</button>
          <button class="trend-filter-btn" id="improveFilterMonth" onclick="applyGlobalFilter('month','all',this,'improve')"
            style="padding:5px 14px;border-radius:20px;border:2px solid #ccc;background:white;color:#555;font-size:12px;font-weight:600;cursor:pointer">Monthly</button>
          <button class="trend-filter-btn" id="improveFilterFY" onclick="applyGlobalFilter('fy','all',this,'improve')"
            style="padding:5px 14px;border-radius:20px;border:2px solid #ccc;background:white;color:#555;font-size:12px;font-weight:600;cursor:pointer">FY Wise</button>
        </div>
        <select id="improveMonthSelect" onchange="applyGlobalFilter('month',this.value,null,'improve')" style="display:none;padding:5px 10px;border-radius:6px;border:1px solid #ccc;font-size:12px">
          <option value="all">All Months</option>
          <option value="Jan">January</option>
          <option value="Feb">February</option>
          <option value="Mar">March</option>
          <option value="Apr">April</option>
        </select>
        <select id="improveWeekSelect" onchange="applyGlobalFilter('week',this.value,null,'improve')" style="display:none;padding:5px 10px;border-radius:6px;border:1px solid #ccc;font-size:12px">
          <option value="all">All Weeks</option>
        </select>
      </div>
    </div>

    <!-- Forecast chart -->
    <div class="forecast-section">
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-area"></i> Accuracy Trajectory + AI Forecast (Next 4 Weeks)</div>
        <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
        <div class="card-subtitle">Historical trend with linear regression + ML-based projection for upcoming weeks</div>
        <div class="chart-container" style="height:280px">
          <canvas id="forecastChart"></canvas>
        </div>
        <div style="display:flex;gap:16px;margin-top:14px;font-size:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-muted)">
            <div style="width:20px;height:3px;background:var(--hpe-green);border-radius:2px"></div> Actual
          </div>
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-muted)">
            <div style="width:20px;height:3px;background:var(--hpe-orange);border-radius:2px;border:1px dashed var(--hpe-orange)"></div> AI Forecast
          </div>
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-muted)">
            <div style="width:20px;height:3px;background:var(--hpe-red);border-radius:2px"></div> 95% Target
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-table"></i> Period-over-Period Delta</div>
        <div class="card-subtitle">Improvement delta vs previous period</div>
        <div id="deltaTable" style="margin-top:8px"></div>
      </div>
    </div>

    <!-- Pareto chart + error frequency -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-sort-amount-down"></i> Pareto Analysis — Top Error Parameters</div>
        <div class="card-subtitle">80/20 rule: fix top parameters to eliminate most errors</div>
        <div class="chart-container" style="height:280px">
          <canvas id="paretoChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-user-circle"></i> Recruiter Error Frequency</div>
        <div class="card-subtitle">Top 10 recruiters by error count (needs coaching)</div>
        <div class="chart-container" style="height:280px">
          <canvas id="recruiterErrorChart"></canvas>
        </div>
      </div>
    </div>

    <!-- PM Performance -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-users-cog"></i> Program Manager Performance</div>
        <div class="card-subtitle">Accuracy by Program Manager — accountability view</div>
        <div class="chart-container" style="height:220px">
          <canvas id="pmChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-sitemap"></i> Error by Process Stage</div>
        <div class="card-subtitle">Where in the process do errors occur most?</div>
        <div class="chart-container" style="height:220px">
          <canvas id="stageErrorChart"></canvas>
        </div>
      </div>
    </div>

    <!-- AI Recommendations -->
    <div class="ai-insights">
      <div class="ai-insights-header">
        <div class="ai-badge"><i class="fas fa-lightbulb"></i> AI RECOMMENDATIONS</div>
        <div class="ai-insights-title">Ranked by Impact — Immediate Action Items</div>
      </div>
      <div class="insight-list">
        <div class="insight-item alert">
          <div class="insight-icon alert"><i class="fas fa-fire"></i></div>
          <div class="insight-text"><strong>[HIGH IMPACT] Fix Target Start Date Process:</strong> With 89.83% failure rate, this single parameter is the #1 priority. Implement mandatory validation checkpoint before audit submission. Estimated improvement: +0.62% overall accuracy if resolved.</div>
        </div>
        <div class="insight-item warning">
          <div class="insight-icon warning"><i class="fas fa-graduation-cap"></i></div>
          <div class="insight-text"><strong>[HIGH IMPACT] Targeted Coaching — Bottom 5 Recruiters:</strong> Recruiters Kusuma K (88.04%), Noor Mohammed M (90.91%), and Divya S (91.67%) need immediate intervention. Focus on "Source of hire" and "Conduct Intake Call" accuracy. Estimated improvement: +0.3% accuracy.</div>
        </div>
        <div class="insight-item">
          <div class="insight-icon green"><i class="fas fa-code-branch"></i></div>
          <div class="insight-text"><strong>[MEDIUM IMPACT] Standardize Intake Call Process:</strong> "Conduct Intake Call Task Completed" has 4.13% error rate (10 failures). Implement a standardized completion checklist and mandatory sign-off protocol for all recruiters.</div>
        </div>
        <div class="insight-item info">
          <div class="insight-icon info"><i class="fas fa-calendar-check"></i></div>
          <div class="insight-text"><strong>[MEDIUM IMPACT] Subin Sundar PM Team Needs Support:</strong> PM Subin Sundar's team has the lowest accuracy at 97.4% (2,540 audits). Root cause likely linked to complex accounts. Schedule process review and additional training in Q1 FY2027.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 4: CAPA -->
  <div class="tab-content" id="tab-capa">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-clipboard-check"></i></div>
          CAPA — Corrective & Preventive Actions (Bot Undo Moves)
        </div>
        <div class="section-subtitle">Complete audit trail for bot-reversed actions with resolution tracking</div>
      </div>
      <div class="capa-action-bar">
        <div class="period-filter">
          <button class="filter-btn active" onclick="filterCapa('all',this)">All</button>
          <button class="filter-btn" onclick="filterCapa('open',this)">🔴 Open/Overdue</button>
          <button class="filter-btn" onclick="filterCapa('inprogress',this)">🟡 In Progress</button>
          <button class="filter-btn" onclick="filterCapa('closed',this)">🟢 Closed</button>
        </div>
        <button class="btn-upload-capa" onclick="openCAPAModal()">
          <i class="fas fa-cloud-upload-alt"></i> Upload Bot Undo Data
        </button>
        <button class="btn-export-capa" onclick="exportCAPACSV()">
          <i class="fas fa-file-csv"></i> Export CSV
        </button>
        <span class="capa-count-badge" id="capaCountBadge">4 records</span>
      </div>
    </div>

    <!-- CAPA KPIs — dynamic -->
    <div class="kpi-grid-4">
      <div class="kpi-card green">
        <div class="kpi-icon green"><i class="fas fa-check-double"></i></div>
        <div class="kpi-label">CAPA Closure Rate</div>
        <div class="kpi-value" id="capaKpiClosureRate">50.0%</div>
        <div class="kpi-delta delta-neutral" id="capaKpiClosureSub"><i class="fas fa-minus"></i> 2 of 4 closed</div>
        <div class="kpi-sub">Target: 80%</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-icon orange"><i class="fas fa-clock"></i></div>
        <div class="kpi-label">Avg Days to Close</div>
        <div class="kpi-value" id="capaKpiAvgDays">14</div>
        <div class="kpi-delta delta-up" id="capaKpiAvgDaysSub"><i class="fas fa-arrow-down"></i> Within target</div>
        <div class="kpi-sub">Target: ≤17 days</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="kpi-label">Overdue CAPAs</div>
        <div class="kpi-value" id="capaKpiOverdue">1</div>
        <div class="kpi-delta delta-down" id="capaKpiOverdueSub"><i class="fas fa-arrow-up"></i> Needs attention</div>
        <div class="kpi-sub" id="capaKpiOverdueDetail">CAPA-003 overdue</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon blue"><i class="fas fa-robot"></i></div>
        <div class="kpi-label">Total Undo Moves</div>
        <div class="kpi-value" id="capaKpiTotal">4</div>
        <div class="kpi-delta delta-neutral" id="capaKpiTotalSub"><i class="fas fa-list"></i> Loaded records</div>
        <div class="kpi-sub" id="capaKpiTotalDetail">Live from uploaded data</div>
      </div>
    </div>

    <!-- CAPA charts -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-pie"></i> CAPA Status Distribution</div>
        <div class="card-subtitle">Current open/closed/in-progress breakdown</div>
        <div class="chart-container" style="height:220px">
          <canvas id="capaStatusChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-bar"></i> CAPA by Root Cause Category</div>
        <div class="card-subtitle">Volume of CAPAs by underlying root cause</div>
        <div class="chart-container" style="height:220px">
          <canvas id="capaRootCauseChart"></canvas>
        </div>
      </div>
    </div>

    <!-- CAPA Log Table -->
    <div class="card card-full">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div class="card-title" style="margin-bottom:0"><i class="fas fa-list-alt"></i> CAPA Log — Bot Undo Moves Register</div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:12px;color:var(--text-muted)">Last updated: <strong id="capaLastUpdated">—</strong></span>
          <button class="btn-upload-capa" style="padding:6px 13px;font-size:12px" onclick="openCAPAModal()">
            <i class="fas fa-plus"></i> Add / Upload Records
          </button>
        </div>
      </div>
      <div class="card-subtitle">Live CAPA register — upload your own Bot Undo file to instantly refresh all data &amp; charts</div>
      <div class="table-container" style="margin-top:16px">
        <table>
          <thead>
            <tr>
              <th>CAPA ID</th>
              <th>Date</th>
              <th>Bot Action</th>
              <th>Undo Reason</th>
              <th>Root Cause</th>
              <th>Corrective Action</th>
              <th>Preventive Action</th>
              <th>Owner</th>
              <th>Target Date</th>
              <th>Actual Close</th>
              <th>Status</th>
              <th>Aging</th>
            </tr>
          </thead>
          <tbody id="capaTableBody"></tbody>
        </table>
      </div>
    </div>

    <!-- AI CAPA Insights (dynamic) -->
    <div class="ai-insights" style="margin-top:24px" id="capaAIPanel">
      <div class="ai-insights-header">
        <div class="ai-badge"><i class="fas fa-robot"></i> AI CAPA ANALYSIS</div>
        <div class="ai-insights-title">Pattern Recognition — Bot Undo Root Causes</div>
      </div>
      <div class="insight-list">
        <div class="insight-item alert">
          <div class="insight-icon alert"><i class="fas fa-repeat"></i></div>
          <div class="insight-text"><strong>Recurring Issue — Data Validation Logic:</strong> 2 out of 4 CAPAs (50%) are linked to bot data validation rules being misconfigured. This is a systemic issue requiring a bot rules review, not just individual corrections.</div>
        </div>
        <div class="insight-item warning">
          <div class="insight-icon warning"><i class="fas fa-calendar-times"></i></div>
          <div class="insight-text"><strong>CAPA-003 Overdue Alert:</strong> CAPA-003 (Date field format mismatch) is 7 days overdue. Owner: Mahak Kaura. Recommended escalation to Practice Head if not resolved within 48 hours.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- CAPA UPLOAD MODAL                                            -->
  <!-- ============================================================ -->
  <div class="modal-overlay" id="capaModal" onclick="handleModalOverlayClick(event)">
    <div class="modal-box" id="capaModalBox">
      <div class="modal-header">
        <div class="modal-title">
          <div style="width:32px;height:32px;background:var(--hpe-green-light);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--hpe-green)">
            <i class="fas fa-robot"></i>
          </div>
          Upload Bot Undo Moves &amp; CAPA Data
        </div>
        <button class="modal-close" onclick="closeCapaModal()"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="modal-tabs">
          <button class="modal-tab active" id="mtab-file" onclick="switchModalTab('file')">
            <i class="fas fa-file-upload"></i> Upload File (CSV)
          </button>
          <button class="modal-tab" id="mtab-manual" onclick="switchModalTab('manual')">
            <i class="fas fa-keyboard"></i> Enter Manually
          </button>
          <button class="modal-tab" id="mtab-template" onclick="switchModalTab('template')">
            <i class="fas fa-download"></i> Download Template
          </button>
        </div>

        <!-- Panel: File Upload -->
        <div class="modal-panel active" id="mpanel-file">
          <div class="modal-drop" id="modalDropZone"
               onclick="document.getElementById('capaFileInput').click()"
               ondragover="event.preventDefault();this.classList.add('dragover')"
               ondragleave="this.classList.remove('dragover')"
               ondrop="handleCapaFileDrop(event)">
            <input type="file" id="capaFileInput" accept=".csv" style="display:none" onchange="handleCapaFileSelect(event)">
            <div class="modal-drop-icon"><i class="fas fa-cloud-upload-alt"></i></div>
            <div class="modal-drop-title">Drop your CAPA / Bot Undo CSV file here</div>
            <div class="modal-drop-sub">Supports .CSV format — Max 20 MB<br>
              Required columns: <code style="background:#d8f5ee;padding:2px 5px;border-radius:3px;color:var(--hpe-green-dark)">Date, Bot Action, Undo Reason, Root Cause, Corrective Action, Preventive Action, Owner, Target Date, Close Date, Status</code>
            </div>
          </div>
          <div class="parse-preview" id="capaParsePreview"></div>
          <div id="capaPreviewTable" style="margin-top:12px"></div>
          <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">
            <button class="btn-cancel" onclick="clearCapaUpload()"><i class="fas fa-trash-alt"></i> Clear</button>
            <button class="btn-primary" id="btnLoadCapaFile" onclick="commitCapaFileData()" disabled>
              <i class="fas fa-sync-alt"></i> Load &amp; Refresh Dashboard
            </button>
          </div>
        </div>

        <!-- Panel: Manual Entry -->
        <div class="modal-panel" id="mpanel-manual">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;background:#f8fafc;padding:10px 14px;border-radius:8px;border:1px solid var(--border)">
            <i class="fas fa-info-circle" style="color:var(--hpe-blue);margin-right:6px"></i>
            Fill in the fields below to add a single Bot Undo / CAPA record. <span style="color:var(--hpe-red)">*</span> fields are required.
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Date <span class="req">*</span></label>
              <input type="date" class="form-input" id="mf_date">
            </div>
            <div class="form-group">
              <label class="form-label">Owner <span class="req">*</span></label>
              <input type="text" class="form-input" id="mf_owner" placeholder="e.g. Mahak Kaura">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Bot Action <span class="req">*</span></label>
              <input type="text" class="form-input" id="mf_bot_action" placeholder="e.g. Auto-populate target start date">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Undo Reason <span class="req">*</span></label>
              <textarea class="form-textarea" id="mf_undo_reason" placeholder="Why was the bot action reversed?"></textarea>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Root Cause <span class="req">*</span></label>
              <textarea class="form-textarea" id="mf_root_cause" placeholder="Underlying root cause of the bot error"></textarea>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Corrective Action <span class="req">*</span></label>
              <textarea class="form-textarea" id="mf_corrective" placeholder="Action taken to fix the immediate issue"></textarea>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Preventive Action <span class="req">*</span></label>
              <textarea class="form-textarea" id="mf_preventive" placeholder="Long-term action to prevent recurrence"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Target Close Date <span class="req">*</span></label>
              <input type="date" class="form-input" id="mf_target_date">
            </div>
            <div class="form-group">
              <label class="form-label">Actual Close Date</label>
              <input type="date" class="form-input" id="mf_close_date">
            </div>
            <div class="form-group">
              <label class="form-label">Status <span class="req">*</span></label>
              <select class="form-select" id="mf_status">
                <option value="">— Select —</option>
                <option value="In Progress">🟡 In Progress</option>
                <option value="Closed">🟢 Closed</option>
                <option value="Overdue">🔴 Overdue</option>
                <option value="Under Review">🔵 Under Review</option>
              </select>
            </div>
          </div>
          <div id="manualFormError" style="color:var(--hpe-red);font-size:12px;margin-top:4px;display:none"></div>
        </div>

        <!-- Panel: Download Template -->
        <div class="modal-panel" id="mpanel-template">
          <div style="text-align:center;padding:24px 0">
            <div style="font-size:48px;color:var(--hpe-green);margin-bottom:16px"><i class="fas fa-file-csv"></i></div>
            <div style="font-size:16px;font-weight:700;color:var(--hpe-dark);margin-bottom:8px">CAPA / Bot Undo CSV Template</div>
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:24px">Download the template, fill it in, then re-upload via the <em>Upload File</em> tab to refresh the entire dashboard live.</div>
            <button class="btn-primary" style="margin:0 auto" onclick="downloadCapaTemplate()">
              <i class="fas fa-download"></i> Download CSV Template
            </button>
            <div style="margin-top:28px;text-align:left;background:#f8fafc;border-radius:10px;padding:16px 20px;border:1px solid var(--border)">
              <div style="font-size:13px;font-weight:600;color:var(--hpe-dark);margin-bottom:12px"><i class="fas fa-columns" style="color:var(--hpe-green);margin-right:6px"></i>Required Column Reference</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text-secondary)">
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Date</strong> — Bot undo event date (YYYY-MM-DD)</div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Bot Action</strong> — What the bot did</div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Undo Reason</strong> — Why it was reversed</div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Root Cause</strong> — Underlying cause</div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Corrective Action</strong></div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Preventive Action</strong></div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Owner</strong> — Responsible person</div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Target Date</strong> (YYYY-MM-DD)</div>
                <div><span style="color:var(--hpe-slate)">○</span> <strong>Close Date</strong> (optional)</div>
                <div><span style="color:var(--hpe-green)">✓</span> <strong>Status</strong> — Closed / In Progress / Overdue / Under Review</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" onclick="closeCapaModal()">Cancel</button>
        <button class="btn-primary" id="btnModalSubmit" onclick="submitManualCapaRecord()">
          <i class="fas fa-sync-alt"></i> <span id="btnModalSubmitLabel">Add Record &amp; Refresh</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Toast notification -->
  <div class="toast" id="toastEl"></div>

  <!-- TAB 5: AI INSIGHTS -->
  <div class="tab-content" id="tab-insights">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-brain"></i></div>
          Insights and Recommendations
        </div>
        <div class="section-subtitle">NLG-powered narrative summaries, predictive risk flags, and ranked action items</div>
      </div>
    </div>

    <!-- Narrative Summary -->
    <div class="narrative-box">
      <div class="narr-title" id="narrativeTitleEl">
        <i class="fas fa-file-alt" style="color:var(--hpe-blue)"></i>
        Narrative Summary — FY2026 YTD
      </div>
      <div class="narr-text" id="narrativeText">
        <p>HPE Talent Acquisition has processed <strong class="highlight">8,599 audit checkpoints</strong> across FY2026 (January through April), achieving an overall accuracy of <strong class="highlight">98.50%</strong> — <strong class="highlight">3.50 percentage points above</strong> the 95% organizational target.</p>
        <br>
        <p>The <strong>accuracy trajectory has been predominantly positive</strong>: starting at 97.25% in January, sustaining at 99.43% in February, before a slight moderation to 98.49% in March. The March softening was largely attributable to a <strong class="warn-text">spike in "Target start date" failures</strong>, which has been flagged for CAPA action.</p>
        <br>
        <p><strong>Post Selection audits</strong> (6,122 checks, 97.51% accuracy) constitute the majority of audit volume. <strong>Pre Selection audits</strong> (2,477 checks, 99.39% accuracy) perform consistently well.</p>
        <br>
        <p>At the recruiter level, <strong class="alert-text">Kusuma K remains the highest-risk recruiter</strong> with 88.04% accuracy — significantly below team average. Upload fresh data to regenerate this summary automatically.</p>
      </div>
    </div>

    <!-- Risk Flags + Recommendations side by side -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-flag" style="color:var(--hpe-red)"></i> Predictive Risk Flags</div>
        <div class="card-subtitle">Risks identified from uploaded data — likely to impact next 4 weeks</div>
        <div id="riskFlagsContainer" class="risk-flags">
          <div class="risk-flag high">
            <div class="risk-level high">HIGH</div>
            <div class="risk-text"><strong>Target Start Date parameter</strong> — 89.83% error rate. If unaddressed, projects to cause 15+ errors next month.</div>
          </div>
          <div class="risk-flag high">
            <div class="risk-level high">HIGH</div>
            <div class="risk-text"><strong>Kusuma K (Recruiter)</strong> — Sustained below 90% for 3 consecutive months. Risk of continued drag on team accuracy.</div>
          </div>
          <div class="risk-flag medium">
            <div class="risk-level medium">MEDIUM</div>
            <div class="risk-text"><strong>Subin Sundar PM team</strong> — 97.4% accuracy, below team average. High volume amplifies impact.</div>
          </div>
          <div class="risk-flag medium">
            <div class="risk-level medium">MEDIUM</div>
            <div class="risk-text"><strong>Source of hire errors rising</strong> — 2nd highest error parameter. Trend suggests process clarity issue.</div>
          </div>
          <div class="risk-flag low">
            <div class="risk-level low">LOW</div>
            <div class="risk-text"><strong>ERP Bonus parameter</strong> — Monitor in next quarter.</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-tasks" style="color:var(--hpe-green)"></i> Action Recommendations Ranked by Impact</div>
        <div class="card-subtitle">Prioritized list — highest ROI actions first</div>
        <div id="actionRecommendations"></div>
      </div>
    </div>

    <!-- Accuracy Forecast Details -->
    <div class="card card-full">
      <div class="card-title"><i class="fas fa-crystal-ball"></i> 4-Week Accuracy Forecast — Confidence Intervals</div>
      <div class="card-subtitle">AI time-series model projections with optimistic/pessimistic scenarios</div>
      <div class="chart-container" style="height:260px">
        <canvas id="forecastDetailChart"></canvas>
      </div>
    </div>
  </div>

  <!-- TAB 6: DATA MANAGEMENT -->
  <div class="tab-content" id="tab-data">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-database"></i></div>
          Data Management
        </div>
        <div class="section-subtitle">Upload your audit data file — dashboard updates automatically on every upload</div>
      </div>
    </div>

    <!-- Upload Zone -->
    <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()"
         ondragover="event.preventDefault(); this.classList.add('dragover')"
         ondragleave="this.classList.remove('dragover')"
         ondrop="handleDrop(event)">
      <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleFileUpload(event)">
      <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="upload-title">Drop Audit Data File Here</div>
      <div class="upload-subtitle">Supports .xlsx, .xls &nbsp;|&nbsp; Max 50 MB<br>
        <strong>Required sheets:</strong> <code style="background:#d8f5ee;padding:2px 6px;border-radius:3px;color:var(--hpe-green-dark)">"Parameter audit count"</code> + <code style="background:#e8f0fb;padding:2px 6px;border-radius:3px;color:var(--hpe-blue)">"Recruiter audit count"</code><br>
        <strong>Hire Type:</strong> Detected automatically from the <strong>Client</strong> column (HPE_Experienced / HPE_UR)
      </div>
    </div>

    <!-- Status + Summary -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-plug"></i> Data Source Status</div>
        <div class="card-subtitle">Upload results and validation indicators</div>
        <div id="dataStatusPanel">
          <div class="validation-item">
            <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
            <div class="val-text"><strong>Parameter data sheet:</strong> 319 rows loaded (seed data)</div>
          </div>
          <div class="validation-item">
            <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
            <div class="val-text"><strong>Recruiter data sheet:</strong> 8,600 rows loaded (seed data)</div>
          </div>
          <div class="validation-item">
            <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
            <div class="val-text"><strong>Data validation:</strong> All required columns present</div>
          </div>
          <div class="validation-item">
            <span class="val-icon" style="color:var(--hpe-yellow)">&#9888;&#65039;</span>
            <div class="val-text"><strong>Hire Type split:</strong> Upload a file with Hire_Type column to see HPE_Experienced vs HPE_UR breakdown</div>
          </div>
          <div class="validation-item">
            <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
            <div class="val-text"><strong>Date range:</strong> Jan 2026 — Apr 2026 (FY2026)</div>
          </div>
          <div class="validation-item">
            <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
            <div class="val-text"><strong>Last refreshed:</strong> <span id="dataLastRefresh">Seed data</span></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-info-circle"></i> Data Summary</div>
        <div class="card-subtitle">Current dataset overview</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
          <div style="background:var(--hpe-green-light);padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-green)" id="ds-audit-count">8,599</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Total Audit Rows</div>
          </div>
          <div style="background:#e8f0fb;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-blue)" id="ds-rec-count">54</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Unique Recruiters</div>
          </div>
          <div style="background:#fceaea;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-red)" id="ds-pm-count">5</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Program Managers</div>
          </div>
          <div style="background:#fffbe6;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:#b8860b" id="ds-month-count">4</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Months Covered</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hire Type Accuracy Section (populated after upload) -->
    <div class="card card-full" id="dmHireTypeCard">
      <div class="card-title"><i class="fas fa-layer-group"></i> Accuracy by Hire Type</div>
      <div class="card-subtitle">HPE_Experienced vs HPE_UR — calculated separately from uploaded data</div>
      <div id="dmHireTypeContent" style="margin-top:12px">
        <div style="padding:28px;text-align:center;color:var(--text-muted)">
          <i class="fas fa-file-upload" style="font-size:36px;opacity:0.3;display:block;margin-bottom:12px"></i>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">No data uploaded yet</div>
          <div style="font-size:12px">Upload an Excel file with <strong>"Parameter audit count"</strong> and <strong>"Recruiter audit count"</strong> sheets. Hire type is detected automatically from the <strong>Client</strong> column (<strong>HPE_Experienced</strong> / <strong>HPE_UR</strong>).</div>
        </div>
      </div>
    </div>

    <!-- Column Format Guide -->
    <div class="card card-full">
      <div class="card-title"><i class="fas fa-table"></i> Expected File Format — Two Required Sheets</div>
      <div class="card-subtitle">Your Excel file must contain exactly these two sheets with the column headers listed below</div>

      <!-- Sheet 1: Parameter audit count -->
      <div style="margin-top:16px;margin-bottom:6px">
        <span style="background:var(--hpe-green);color:white;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700">
          <i class="fas fa-file-alt" style="margin-right:6px"></i>Sheet 1: "Parameter audit count"
        </span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:10px">Pre-aggregated parameter-level data — one row per Month × Week × Parameter × Client combination</span>
      </div>
      <div style="overflow-x:auto;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:var(--hpe-green);color:white">
              <th style="padding:8px 12px;text-align:left">Column Name</th>
              <th style="padding:8px 12px;text-align:left">Required</th>
              <th style="padding:8px 12px;text-align:left">Example Values</th>
              <th style="padding:8px 12px;text-align:left">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Client</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">HPE_Experienced, HPE_UR</td><td style="padding:7px 12px">Hire type detection (Experienced vs UR)</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Region</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">North, South, East, West</td><td style="padding:7px 12px">Regional breakdown</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Financial Year</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">FY2026</td><td style="padding:7px 12px">Fiscal year label</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Month</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">Jan, Feb, Mar, Apr</td><td style="padding:7px 12px">Month label for trend charts</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Month Number</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">10, 11, 12, 13</td><td style="padding:7px 12px">HPE FY sort order (Jan=10 … Apr=13)</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Week</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">1, 2, 3, 4</td><td style="padding:7px 12px">Week number within month</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Critical/Non Critical</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Critical, Non Critical</td><td style="padding:7px 12px">Critical parameter gauge</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Stage</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Pre Selection, Post Selection</td><td style="padding:7px 12px">Stage accuracy charts</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Parameter</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">Offer Details, Source of hire…</td><td style="padding:7px 12px">Audit checkpoint name</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Total Population</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">120</td><td style="padding:7px 12px">Universe size for sampling %</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Opportunity Count</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">45</td><td style="padding:7px 12px">Total audits in this row (Pass+Fail+NA)</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Opportunity Pass</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">40</td><td style="padding:7px 12px">Passed audits count</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Opportunity Fail</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">3</td><td style="padding:7px 12px">Failed audits count</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-green)">Opportunity NA</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">2</td><td style="padding:7px 12px">Not-applicable audits count</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Accuracy Score</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">97.5 or 0.975</td><td style="padding:7px 12px">Pre-calculated accuracy (recalculated if blank)</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Error %</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">2.5</td><td style="padding:7px 12px">Pre-calculated error rate</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Sample Percentage</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">37.5</td><td style="padding:7px 12px">Sample coverage percentage</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Regional Head</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Name</td><td style="padding:7px 12px">Regional Head label</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Practice Head</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Name</td><td style="padding:7px 12px">Practice Head label</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Sheet 2: Recruiter audit count -->
      <div style="margin-bottom:6px">
        <span style="background:var(--hpe-blue);color:white;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700">
          <i class="fas fa-users" style="margin-right:6px"></i>Sheet 2: "Recruiter audit count"
        </span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:10px">Row-level recruiter accuracy — one row per audit observation per recruiter</span>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:var(--hpe-blue);color:white">
              <th style="padding:8px 12px;text-align:left">Column Name</th>
              <th style="padding:8px 12px;text-align:left">Required</th>
              <th style="padding:8px 12px;text-align:left">Example Values</th>
              <th style="padding:8px 12px;text-align:left">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Client</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">HPE_Experienced, HPE_UR</td><td style="padding:7px 12px">Hire type detection</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Financial Year</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">FY2026</td><td style="padding:7px 12px">Fiscal year label</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Month</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">Jan, Feb, Mar, Apr</td><td style="padding:7px 12px">Month of audit record</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">MonthNumber</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">10, 11, 12, 13</td><td style="padding:7px 12px">HPE FY sort order</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Week</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">1, 2, 3, 4</td><td style="padding:7px 12px">Week number within month</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Recruiter Name</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">John Smith</td><td style="padding:7px 12px">Recruiter performance panel</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Program Manager</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">Jane Doe</td><td style="padding:7px 12px">PM drill-down panel</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Critical/Non Critical</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Critical, Non Critical</td><td style="padding:7px 12px">Criticality filter</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Stage</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Pre Selection, Post Selection</td><td style="padding:7px 12px">Stage accuracy charts</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Parameter</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Offer Details</td><td style="padding:7px 12px">Audit checkpoint name</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:var(--hpe-blue)">Accuracy</td><td style="padding:7px 12px"><span style="background:#e6f9f5;color:#01A982;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Required</span></td><td style="padding:7px 12px;color:var(--text-muted)">98.5 or 0.985</td><td style="padding:7px 12px">Recruiter accuracy for this row (% or decimal)</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Regional Head</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Name</td><td style="padding:7px 12px">Regional Head label</td></tr>
            <tr style="background:var(--surface)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Practice Head</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">Name</td><td style="padding:7px 12px">Practice Head label</td></tr>
            <tr style="background:var(--surface-2)"><td style="padding:7px 12px;font-weight:700;color:#FF8300">Region</td><td style="padding:7px 12px"><span style="background:#fff3e6;color:#FF8300;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">Optional</span></td><td style="padding:7px 12px;color:var(--text-muted)">North, South, East, West</td><td style="padding:7px 12px">Regional breakdown</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Export Buttons -->
    <div class="card card-full">
      <div class="card-title"><i class="fas fa-download"></i> Export Options</div>
      <div class="card-subtitle">Download data and reports in multiple formats</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">
        <button onclick="exportCSV()" style="background:var(--hpe-green);color:white;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:8px">
          <i class="fas fa-file-csv"></i> Export CSV
        </button>
        <button onclick="exportExcelReport()" style="background:var(--hpe-blue);color:white;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:8px">
          <i class="fas fa-file-excel"></i> Export Excel Report
        </button>
        <button onclick="window.print()" style="background:var(--hpe-slate);color:white;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:8px">
          <i class="fas fa-file-pdf"></i> Print / PDF
        </button>
        <button onclick="exportSummaryJSON()" style="background:var(--hpe-orange);color:white;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:8px">
          <i class="fas fa-file-code"></i> Export JSON
        </button>
      </div>
      <div id="exportStatus" style="margin-top:12px;font-size:13px;color:var(--hpe-green);display:none">
        <i class="fas fa-check-circle"></i> <span id="exportMsg"></span>
      </div>
    </div>
  </div>

  <!-- TAB: SLA PERFORMANCE DASHBOARD -->
  <div class="tab-content" id="tab-sla">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-clipboard-check"></i></div>
          SLA Performance Dashboard
        </div>
        <div class="section-subtitle">Practice Head: Mahak | FY25 Full Year (Nov-24→Oct-25) &amp; FY26 YTD (Nov-25→Apr-26) Contractual SLA Review</div>
      </div>
    </div>

    <!-- Sub-navigation -->
    <div class="sla-sub-nav">
      <button class="sla-sub-btn active" onclick="showSLAPanel('sla-exec',this)"><i class="fas fa-tachometer-alt"></i> Executive Summary</button>
      <button class="sla-sub-btn" onclick="showSLAPanel('sla-monthly',this)"><i class="fas fa-calendar-alt"></i> Monthly Analysis</button>
      <button class="sla-sub-btn" onclick="showSLAPanel('sla-fy',this)"><i class="fas fa-chart-bar"></i> FY Wise Analysis</button>
      <button class="sla-sub-btn" onclick="showSLAPanel('sla-metnotmet',this)"><i class="fas fa-check-double"></i> Met vs Not Met</button>
      <button class="sla-sub-btn" onclick="showSLAPanel('sla-reporting',this)"><i class="fas fa-file-alt"></i> Reporting Analysis</button>
      <button class="sla-sub-btn" onclick="showSLAPanel('sla-trends',this)"><i class="fas fa-chart-line"></i> Trend Analysis</button>
    </div>

    <!-- ── PANEL 1: SLA EXECUTIVE SUMMARY ── -->
    <div class="sla-panel active" id="sla-exec">
      <div id="slaHealthBanner" class="sla-health-banner sla-health-good">
        <i class="fas fa-check-circle" style="font-size:22px"></i>
        <div>
          <div style="font-size:14px;font-weight:800">SLA Health: IMPROVING — FY25 Full Year (Nov-24→Oct-25): 81.8% | FY26 YTD (Nov-25→Apr-26): 82.0%</div>
          <div style="font-size:12px;font-weight:500;margin-top:2px">HPE FY = Nov–Oct &nbsp;|&nbsp; FY25 (Nov-24→Oct-25): 90 Met / 110 reported &nbsp;|&nbsp; Critical risk: TTF Enterprise (45% FY25) &amp; Feb-26 regression</div>
        </div>
      </div>

      <div class="sla-kpi-row">
        <div class="sla-kpi">
          <div class="sla-kpi-val" id="slaKpiCompliance" style="color:var(--hpe-green)">82%</div>
          <div class="sla-kpi-label">Overall Met Rate</div>
          <div class="sla-kpi-sub" id="slaKpiTotalSub">184 Met / 230 reported</div>
        </div>
        <div class="sla-kpi red">
          <div class="sla-kpi-val" id="slaKpiTotalNM" style="color:var(--hpe-red)">46</div>
          <div class="sla-kpi-label">Total Not Met</div>
          <div class="sla-kpi-sub">20.0% failure rate</div>
        </div>
        <div class="sla-kpi orange">
          <div class="sla-kpi-val" id="slaKpiTotalNR" style="color:var(--hpe-orange)">10</div>
          <div class="sla-kpi-label">Not Reported</div>
          <div class="sla-kpi-sub">Apr-25 full blackout</div>
        </div>
        <div class="sla-kpi blue">
          <div class="sla-kpi-val" style="color:var(--hpe-blue)">10</div>
          <div class="sla-kpi-label">SLA Metrics Tracked</div>
          <div class="sla-kpi-sub">Category B | Contractual</div>
        </div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-trophy" style="color:var(--hpe-green)"></i> Best Performing SLA Metrics</div>
          <table class="sla-metric-table">
            <thead><tr><th>SLA Metric</th><th>Met Rate</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>% Agency Utilization – Technical</td><td><strong style="color:var(--hpe-green)">100%</strong></td><td><span class="sla-pill met">★ Perfect</span></td></tr>
              <tr><td>% Agency Utilization – Enterprise</td><td><strong style="color:var(--hpe-green)">100%</strong></td><td><span class="sla-pill met">★ Perfect</span></td></tr>
              <tr><td>Avg Reqs Volume – Enterprise</td><td><strong style="color:var(--hpe-green)">82%</strong></td><td><span class="sla-pill met">Strong</span></td></tr>
              <tr><td>Internal Hiring – Enterprise</td><td><strong style="color:var(--hpe-green)">91%</strong></td><td><span class="sla-pill met">Strong</span></td></tr>
              <tr><td>% Aged – Technical (FY25-26)</td><td><strong style="color:var(--hpe-green)">88%</strong></td><td><span class="sla-pill met">Improving</span></td></tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-exclamation-triangle" style="color:var(--hpe-red)"></i> Worst Performing SLA Metrics</div>
          <table class="sla-metric-table">
            <thead><tr><th>SLA Metric</th><th>Not Met Rate</th><th>Risk</th></tr></thead>
            <tbody>
              <tr><td>Time to Fill – Enterprise (45d)</td><td><strong style="color:var(--hpe-red)">45.8%</strong></td><td><span class="sla-pill notmet">🔴 Critical</span></td></tr>
              <tr><td>% Aged – Enterprise (≤20%)</td><td><strong style="color:var(--hpe-red)">37.5%</strong></td><td><span class="sla-pill notmet">🔴 High Risk</span></td></tr>
              <tr><td>Time to Fill – Technical (55d)</td><td><strong style="color:var(--hpe-red)">29.2%</strong></td><td><span class="sla-pill notmet">🟠 Moderate</span></td></tr>
              <tr><td>% Aged – Technical (≤25%)</td><td><strong style="color:var(--hpe-orange)">25.0%</strong></td><td><span class="sla-pill notmet">🟠 Watch</span></td></tr>
              <tr><td>Internal Hiring – Technical</td><td><strong style="color:var(--hpe-orange)">21.7%</strong></td><td><span class="sla-pill nr">⚠ Inconsistent</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-chart-line"></i> Monthly Met Rate Trend (All Metrics Combined)</div>
        <div class="card-subtitle">24 months of SLA compliance tracking — Apr 2024 to Apr 2026</div>
        <div class="chart-container" style="height:260px">
          <canvas id="slaOverallTrendChart"></canvas>
        </div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-lightbulb" style="color:var(--hpe-orange)"></i> Key Findings</div>
          <div class="sla-insight-box">
            <strong>📈 Sustained Performance (HPE FY):</strong> FY25 Full Year (Nov-24 to Oct-25) = 81.8% → FY26 YTD (Nov-25 to Apr-26) = 82.0%. Strong Q4 FY25 momentum (93%) continues into FY26.
          </div>
          <div class="sla-insight-box warn">
            <strong>⚠ Apr-25 Total Blackout:</strong> All 10 SLA metrics were "Not Reported" in April 2025 (Q2 FY25) — a complete governance failure impacting FY25 Q2 reporting integrity.
          </div>
          <div class="sla-insight-box bad">
            <strong>🔴 TTF Enterprise Chronic Failure:</strong> 45% compliance in FY25 and only 40% in FY26 YTD — the single most critical SLA. Q1 FY26 showed 90% overall but TTF Enterprise continues to drag performance.
          </div>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-pie-chart"></i> Overall Status Distribution</div>
          <div class="chart-container" style="height:220px">
            <canvas id="slaStatusDonut"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PANEL 2: MONTHLY ANALYSIS ── -->
    <div class="sla-panel" id="sla-monthly">
      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-th"></i> Month-wise SLA Status Heatmap</div>
        <div class="card-subtitle">Each cell = one SLA metric. Green=Met, Red=Not Met, Grey=Not Reported, Amber=NA</div>
        <div id="slaHeatmapContainer" style="overflow-x:auto;margin-top:12px"></div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-chart-bar"></i> Monthly SLA Met / Not Met Count</div>
          <div class="chart-container" style="height:280px">
            <canvas id="slaMonthlyBarChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-percentage"></i> Monthly Compliance % Trend</div>
          <div class="chart-container" style="height:280px">
            <canvas id="slaMonthlyComplianceChart"></canvas>
          </div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-table"></i> Detailed Monthly Breakdown</div>
        <div class="table-container">
          <table class="sla-metric-table">
            <thead>
              <tr><th>Month</th><th>FY Period</th><th>Total</th><th>Met</th><th>Not Met</th><th>Not Reported</th><th>NA</th><th>Compliance %</th><th>vs Prev Month</th><th>Highlight</th></tr>
            </thead>
            <tbody id="slaMonthlyTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── PANEL 3: FY WISE ANALYSIS ── -->
    <div class="sla-panel" id="sla-fy">

      <!-- HPE FY banner -->
      <div class="sla-health-banner sla-health-good" style="margin-bottom:20px">
        <i class="fas fa-info-circle" style="font-size:20px"></i>
        <div>
          <div style="font-size:13px;font-weight:800">HPE Fiscal Year: November to October</div>
          <div style="font-size:12px;font-weight:500;margin-top:2px">FY25 = Nov-24 → Oct-25 (Full Year) &nbsp;|&nbsp; FY26 = Nov-25 → Oct-26 (YTD, current)</div>
        </div>
      </div>

      <!-- 2-card FY summary grid (FY25 + FY26) -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:22px">

        <!-- FY25 full -->
        <div class="sla-fy-card" style="border-top:3px solid var(--hpe-blue)">
          <div class="sla-fy-label" style="color:var(--hpe-blue)">FY 2025 <span style="font-size:12px;font-weight:600;background:#ebf5fb;border-radius:8px;padding:2px 8px;margin-left:6px">Full Year</span></div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">Nov-24 – Oct-25 (12 months)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div style="text-align:center;background:#ebf5fb;padding:10px;border-radius:8px">
              <div style="font-size:22px;font-weight:800;color:var(--hpe-blue)">81.8%</div>
              <div style="font-size:10px;color:var(--text-muted)">Compliance</div>
            </div>
            <div style="text-align:center;background:#fceaea;padding:10px;border-radius:8px">
              <div style="font-size:22px;font-weight:800;color:var(--hpe-red)">18.2%</div>
              <div style="font-size:10px;color:var(--text-muted)">Non-Compliance</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary)">
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">✅ Met: <strong>90</strong> / 110 reported</div>
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">❌ Not Met: <strong>20</strong></div>
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">📭 NR: <strong>10</strong> (Apr-25 blackout)</div>
            <div style="padding:5px 0">📅 Worst: Nov-24 (70%) | Best: Aug/Sep-25 (100%)</div>
          </div>
        </div>

        <!-- FY26 YTD -->
        <div class="sla-fy-card" style="border-top:3px solid var(--hpe-green)">
          <div class="sla-fy-label" style="color:var(--hpe-green)">FY 2026 <span style="font-size:12px;font-weight:600;background:#e6f7f2;border-radius:8px;padding:2px 8px;margin-left:6px">YTD</span></div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">Nov-25 – Apr-26 (5 months reported so far)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div style="text-align:center;background:#e6f7f2;padding:10px;border-radius:8px">
              <div style="font-size:22px;font-weight:800;color:var(--hpe-green)">82.0%</div>
              <div style="font-size:10px;color:var(--text-muted)">Compliance YTD</div>
            </div>
            <div style="text-align:center;background:#fff3e6;padding:10px;border-radius:8px">
              <div style="font-size:22px;font-weight:800;color:var(--hpe-orange)">18.0%</div>
              <div style="font-size:10px;color:var(--text-muted)">Non-Compliance</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary)">
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">✅ Met: <strong>41</strong> / 50 reported</div>
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">❌ Not Met: <strong>9</strong></div>
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">📭 NR: <strong>0</strong></div>
            <div style="padding:5px 0">📅 Worst: Feb-26 (60%) | Best: Nov-25 (100%)</div>
          </div>
        </div>

      </div>

      <!-- FY YoY delta banner -->
      <div style="display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:22px">
        <div style="background:linear-gradient(135deg,#e6f7f2,#d5f5ec);border-radius:10px;padding:16px 20px;border:1px solid rgba(1,169,130,0.3)">
          <div style="font-size:11px;font-weight:800;color:#0a7a56;text-transform:uppercase;letter-spacing:0.5px">FY25 → FY26 YTD Trend</div>
          <div style="font-size:28px;font-weight:800;color:var(--hpe-green);margin:6px 0">▲ +0.2 pp</div>
          <div style="font-size:12px;color:#555">FY25 Full Year: 81.8% → FY26 YTD: 82.0% | FY26 on track; Feb-26 dip requires monitoring</div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-balance-scale"></i> FY25 vs FY26 YTD — Per-Metric Compliance (HPE FY: Nov–Oct)</div>
        <div class="card-subtitle">FY25 = Nov-24 to Oct-25 (Full Year) &nbsp;|&nbsp; FY26 = Nov-25 to Apr-26 (YTD)</div>
        <div class="chart-container" style="height:320px">
          <canvas id="slaFYCompareChart"></canvas>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-chart-area"></i> Monthly Compliance Trend — FY25 vs FY26 (by FY month position)</div>
        <div class="card-subtitle">M1 = first month of FY (Nov). FY25 = 12 months full year. FY26 = YTD (5 months reported).</div>
        <div class="chart-container" style="height:280px">
          <canvas id="slaFYTrendChart"></canvas>
        </div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-arrow-up" style="color:var(--hpe-green)"></i> FY25 vs FY26 — Metric Performance (HPE FY)</div>
          <table class="sla-metric-table">
            <thead><tr><th>Metric</th><th>FY25</th><th>FY26 YTD</th><th>FY25→26</th></tr></thead>
            <tbody id="slaFYImprovementBody"></tbody>
          </table>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-exclamation-circle" style="color:var(--hpe-orange)"></i> Metrics Below 80% in Any FY — Requires Focus</div>
          <table class="sla-metric-table">
            <thead><tr><th>Metric</th><th>FY25</th><th>FY26 YTD</th></tr></thead>
            <tbody id="slaFYRiskBody"></tbody>
          </table>
        </div>
      </div>

      <!-- Q1-Q4 summary (HPE FY25) -->
      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-table"></i> Quarterly Performance — FY25 (Nov-24 to Oct-25) &amp; FY26 YTD</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:10px">
          <div style="background:#fff9ed;border:1px solid #ffd9a8;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:#a05c00;text-transform:uppercase">Q1 FY25</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">Nov-24 – Jan-25</div>
            <div style="font-size:26px;font-weight:800;color:var(--hpe-orange)">70%</div>
            <div style="font-size:11px;color:#555;margin-top:4px">21 Met / 30 reported</div>
          </div>
          <div style="background:#fff9ed;border:1px solid #ffd9a8;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:#a05c00;text-transform:uppercase">Q2 FY25</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">Feb-25 – Apr-25</div>
            <div style="font-size:26px;font-weight:800;color:var(--hpe-blue)">85%</div>
            <div style="font-size:11px;color:#555;margin-top:4px">17 Met / 20 rep. (10 NR Apr-25)</div>
          </div>
          <div style="background:#f0fff9;border:1px solid #b3ead8;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:#0a7a56;text-transform:uppercase">Q3 FY25</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">May-25 – Jul-25</div>
            <div style="font-size:26px;font-weight:800;color:var(--hpe-blue)">80%</div>
            <div style="font-size:11px;color:#555;margin-top:4px">24 Met / 30 reported</div>
          </div>
          <div style="background:#f0fff9;border:1px solid #b3ead8;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:#0a7a56;text-transform:uppercase">Q4 FY25</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">Aug-25 – Oct-25</div>
            <div style="font-size:26px;font-weight:800;color:var(--hpe-green)">93%</div>
            <div style="font-size:11px;color:#555;margin-top:4px">28 Met / 30 reported</div>
          </div>
          <div style="background:#f0fff9;border:1px solid #b3ead8;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:#0a7a56;text-transform:uppercase">Q1 FY26</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">Nov-25 – Jan-26</div>
            <div style="font-size:26px;font-weight:800;color:var(--hpe-green)">90%</div>
            <div style="font-size:11px;color:#555;margin-top:4px">27 Met / 30 reported</div>
          </div>
          <div style="background:#fff9ed;border:1px solid #ffd9a8;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:#a05c00;text-transform:uppercase">Q2 FY26 YTD</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">Feb-26 – Apr-26</div>
            <div style="font-size:26px;font-weight:800;color:var(--hpe-orange)">70%</div>
            <div style="font-size:11px;color:#555;margin-top:4px">14 Met / 20 reported</div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── PANEL 4: MET vs NOT MET ── -->
    <div class="sla-panel" id="sla-metnotmet">
      <div class="sla-kpi-row">
        <div class="sla-kpi">
          <div class="sla-kpi-val" style="color:var(--hpe-green)">195</div>
          <div class="sla-kpi-label">Total Met</div>
          <div class="sla-kpi-sub">82.3% of reported</div>
        </div>
        <div class="sla-kpi red">
          <div class="sla-kpi-val" style="color:var(--hpe-red)">42</div>
          <div class="sla-kpi-label">Total Not Met</div>
          <div class="sla-kpi-sub">17.7% failure rate</div>
        </div>
        <div class="sla-kpi orange">
          <div class="sla-kpi-val" style="color:var(--hpe-orange)">10</div>
          <div class="sla-kpi-label">Not Reported</div>
          <div class="sla-kpi-sub">Apr-25 only</div>
        </div>
        <div class="sla-kpi blue">
          <div class="sla-kpi-val" style="color:var(--hpe-blue)">4</div>
          <div class="sla-kpi-label">NA Months</div>
          <div class="sla-kpi-sub">Quarter rollup only</div>
        </div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-chart-bar"></i> Met vs Not Met by SLA Metric</div>
          <div class="chart-container" style="height:300px">
            <canvas id="slaMetByMetricChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-chart-pie"></i> Failure Share by Metric</div>
          <div class="chart-container" style="height:300px">
            <canvas id="slaFailShareChart"></canvas>
          </div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-table"></i> Per-Metric Met / Not Met Detail</div>
        <div class="table-container">
          <table class="sla-metric-table">
            <thead><tr><th>SLA Metric</th><th>Target</th><th>Total</th><th>Met</th><th>Not Met</th><th>Not Rep.</th><th>Met %</th><th>Penalty?</th><th>Risk Level</th></tr></thead>
            <tbody id="slaMetricDetailBody"></tbody>
          </table>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-fire-alt" style="color:var(--hpe-red)"></i> Chronic Non-Performers — Months Failing Consecutively</div>
        <div id="slaChronicFailPanel" style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:8px"></div>
      </div>
    </div>

    <!-- ── PANEL 5: REPORTING ANALYSIS ── -->
    <div class="sla-panel" id="sla-reporting">
      <div class="sla-health-banner warn" style="margin-bottom:22px">
        <i class="fas fa-exclamation-triangle" style="font-size:20px"></i>
        <div>
          <div style="font-size:14px;font-weight:800">Reporting Gap Identified: April 2025 — Complete Blackout (10/10 metrics unreported)</div>
          <div style="font-size:12px;margin-top:2px">4.2% of total observation periods are Not Reported. Governance intervention required to prevent recurrence.</div>
        </div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-chart-bar"></i> Reporting Compliance by Month</div>
          <div class="chart-container" style="height:260px">
            <canvas id="slaReportingChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-info-circle"></i> Reporting Gap Root Cause Analysis</div>
          <div style="margin-top:8px">
            <div class="sla-insight-box bad">
              <strong>Apr-25 Complete Blackout:</strong> All 10 SLA metrics reported as "Not Reported". Likely cause: end-of-quarter transition, system migration, or reporting tool downtime. This is a governance failure requiring mandatory post-incident review.
            </div>
            <div class="sla-insight-box warn">
              <strong>JAS Quarter (Sep-24 Quarter):</strong> Quarterly aggregate shows "Not Reported" for JAS period, indicating that some months within Jul–Sep 2024 had reporting gaps that rolled up to quarter level.
            </div>
            <div class="sla-insight-box">
              <strong>Reporting Reliability Score: 95.8%</strong> — Out of 240 metric-month data points, 10 were Not Reported (4.2%). Excluding Apr-25 anomaly, reporting is near-perfect.
            </div>
          </div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-exclamation-circle"></i> Impact Assessment: Non-Reporting on SLA Governance</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px">
          <div style="background:#fceaea;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-red)">10</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Missing Data Points</div>
            <div style="font-size:12px;color:var(--hpe-red);margin-top:4px">4.2% of all periods</div>
          </div>
          <div style="background:#fff3e6;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-orange)">1</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Months Fully Unreported</div>
            <div style="font-size:12px;color:var(--hpe-orange);margin-top:4px">Apr-25 (100% blackout)</div>
          </div>
          <div style="background:#e6f7f2;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-green)">95.8%</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Reporting Reliability</div>
            <div style="font-size:12px;color:var(--hpe-green);margin-top:4px">Best-in-class threshold: 99%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PANEL 6: TREND ANALYSIS ── -->
    <div class="sla-panel" id="sla-trends">
      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-chart-line"></i> Per-Metric Trend (Monthly Compliance)</div>
          <div class="chart-container" style="height:300px">
            <canvas id="slaPerMetricTrendChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-chart-area"></i> Quarterly Compliance Trend</div>
          <div class="chart-container" style="height:300px">
            <canvas id="slaQuarterlyChart"></canvas>
          </div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-sort-amount-down"></i> Metric Classification: Improving / Declining / Stable</div>
        <div id="slaTrendClassifications" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px">
          <div>
            <div style="font-weight:700;color:var(--hpe-green);margin-bottom:10px;font-size:13px">📈 IMPROVING Metrics</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>Time to Fill – Enterprise:</strong> FY25: 45% compliance. FY26 YTD: 40%. Q4 FY25 showed recovery but TTF Enterprise remains the key risk metric.</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>% Aged – Enterprise:</strong> FY25: 55% (Q1-Q2 FY25 failures). FY26 YTD: 80%. Recovering strongly.</div>
            <div class="sla-insight-box"><strong>% Aged – Technical:</strong> FY25: 82% (strong Q4 FY25). FY26 YTD: 60% (minor relapse requiring monitoring).</div>
          </div>
          <div>
            <div style="font-weight:700;color:var(--hpe-orange);margin-bottom:10px;font-size:13px">⚠ INCONSISTENT Metrics</div>
            <div class="sla-insight-box warn" style="margin-bottom:8px"><strong>Time to Fill – Technical:</strong> FY25: 64% (Q1 failures Nov-Jan). FY26 YTD: 80%. Improving trend in FY26.</div>
            <div class="sla-insight-box warn" style="margin-bottom:8px"><strong>Avg Reqs Vol – Technical:</strong> FY25: 73% (Q1 FY25 failures). FY26 YTD: 100%. Fully recovered.</div>
            <div class="sla-insight-box warn"><strong>Internal Hiring – Technical:</strong> FY25: 91% (strong performance). FY26 YTD: 80%. Apr-26 failure disrupts Q2 FY26 streak.</div>
          </div>
          <div>
            <div style="font-weight:700;color:var(--hpe-green);margin-bottom:10px;font-size:13px">✅ STABLE / PERFECT Metrics</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>% Agency Utilization – Technical:</strong> 100% in FY25 and FY26 YTD. Zero failures across all reported months. Perfect compliance.</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>% Agency Utilization – Enterprise:</strong> 100% all three FYs. Perfect compliance throughout entire period.</div>
            <div class="sla-insight-box"><strong>Internal Hiring – Enterprise:</strong> FY25: 100% (perfect). FY26 YTD: 80% (1 failure in Feb-26). Near-perfect historically.</div>
          </div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-star"></i> SLA Recommendations & Actionable Insights</div>
        <div id="slaRecommendations"></div>
      </div>
    </div>

  </div><!-- end tab-sla -->

  <!-- TAB: PERFORMANCE INTELLIGENCE -->
  <div class="tab-content" id="tab-performance">
    <div class="section-header">
      <div>
        <div class="section-title"><i class="fas fa-user-chart"></i> Performance Intelligence</div>
        <div class="section-subtitle" id="perfSubtitle">AI-powered recruiter risk scoring, scorecard rankings, parameter deep-dive &amp; PM accountability — FY2026</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div id="perfAlertBanner" style="display:none;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:#856404;display:flex;align-items:center;gap:8px">
          <i class="fas fa-exclamation-triangle"></i> <span id="perfAlertText"></span>
        </div>
      </div>
    </div>

    <!-- Sub-nav pills -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
      <button class="perf-sub-btn active" id="perfBtn-risk"    onclick="showPerfPanel('risk',this)"><i class="fas fa-brain"></i> Predictive Risk Engine</button>
      <button class="perf-sub-btn"        id="perfBtn-scorecard" onclick="showPerfPanel('scorecard',this)"><i class="fas fa-medal"></i> Recruiter Scorecard</button>
      <button class="perf-sub-btn"        id="perfBtn-param"   onclick="showPerfPanel('param',this)"><i class="fas fa-microscope"></i> Parameter Deep-Dive</button>
      <button class="perf-sub-btn"        id="perfBtn-pm"      onclick="showPerfPanel('pm',this)"><i class="fas fa-sitemap"></i> PM Accountability</button>
      <button class="perf-sub-btn"        id="perfBtn-goals"   onclick="showPerfPanel('goals',this)"><i class="fas fa-bullseye"></i> Goal Tracker</button>
    </div>

    <!-- PANEL 1: PREDICTIVE RISK ENGINE -->
    <div class="perf-panel active" id="perfPanel-risk">
      <!-- KPI row -->
      <!-- KPI row — each card is clickable for drill-down -->
      <div class="kpi-grid" style="margin-bottom:18px">
        <div class="kpi-card" style="cursor:pointer" onclick="showRiskDrill('atRisk')" id="riskCard-atRisk" title="Click to see at-risk recruiters">
          <div class="kpi-label"><i class="fas fa-users"></i> Recruiters at Risk <i class="fas fa-chevron-right" style="float:right;font-size:10px;color:var(--text-muted);margin-top:2px"></i></div>
          <div class="kpi-value" id="riskCount" style="color:var(--hpe-red)">—</div>
          <div class="kpi-delta delta-down" id="riskCountSub">Critical zone</div>
        </div>
        <div class="kpi-card" style="cursor:pointer" onclick="showRiskDrill('highParams')" id="riskCard-highParams" title="Click to see high-risk parameters">
          <div class="kpi-label"><i class="fas fa-exclamation-circle"></i> High-Risk Parameters <i class="fas fa-chevron-right" style="float:right;font-size:10px;color:var(--text-muted);margin-top:2px"></i></div>
          <div class="kpi-value" id="riskParamCount" style="color:var(--hpe-orange)">—</div>
          <div class="kpi-delta delta-neutral" id="riskParamSub">Likely to breach next week</div>
        </div>
        <div class="kpi-card" style="cursor:pointer" onclick="showRiskDrill('forecast')" id="riskCard-forecast" title="Click to see per-recruiter forecast">
          <div class="kpi-label"><i class="fas fa-chart-line"></i> Predicted Next-Month Acc. <i class="fas fa-chevron-right" style="float:right;font-size:10px;color:var(--text-muted);margin-top:2px"></i></div>
          <div class="kpi-value" id="riskForecastAcc">—</div>
          <div class="kpi-delta delta-neutral" id="riskForecastSub">Linear regression forecast</div>
        </div>
        <div class="kpi-card" style="cursor:pointer" onclick="showRiskDrill('drops')" id="riskCard-drops" title="Click to see month-by-month drop analysis">
          <div class="kpi-label"><i class="fas fa-fire"></i> Consecutive Drops <i class="fas fa-chevron-right" style="float:right;font-size:10px;color:var(--text-muted);margin-top:2px"></i></div>
          <div class="kpi-value" id="riskDropCount" style="color:var(--hpe-red)">—</div>
          <div class="kpi-delta delta-down" id="riskDropSub">Months accuracy declined</div>
        </div>
      </div>

      <!-- Risk Drill-Down Panel — shown when a KPI card is clicked -->
      <div id="riskDrillPanel" style="display:none;margin-bottom:18px">
        <div class="card card-full" style="border:2px solid var(--hpe-green);border-radius:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div>
              <div class="card-title" id="riskDrillTitle" style="margin-bottom:2px"><i class="fas fa-search"></i> Drill-Down Detail</div>
              <div class="card-subtitle" id="riskDrillSubtitle" style="margin-top:0"></div>
            </div>
            <button onclick="closeRiskDrill()" style="border:none;background:var(--bg-secondary);border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;font-weight:600;color:var(--text-secondary)"><i class="fas fa-times"></i> Close</button>
          </div>
          <div id="riskDrillContent"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
        <!-- Risk Score Table -->
        <div class="card" style="grid-column:1/3">
          <div class="card-title"><i class="fas fa-shield-alt"></i> Recruiter Predictive Risk Scores</div>
          <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
          <div class="card-subtitle">Risk score 0–100 based on error frequency, trend, volume &amp; parameter failure pattern. ≥2 consecutive accuracy drops = 🔴 At Risk.</div>
          <div class="table-container" style="max-height:340px;overflow-y:auto">
            <table id="riskScoreTable">
              <thead><tr>
                <th>Recruiter</th><th>Current Acc.</th><th>Trend</th><th>Predicted Next</th>
                <th>Risk Score</th><th>Risk Level</th><th>Status</th>
              </tr></thead>
              <tbody id="riskScoreBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        <!-- Parameter failure probability chart -->
        <div class="card">
          <div class="card-title"><i class="fas fa-project-diagram"></i> Parameter Breach Probability (Next Week)</div>
          <div class="card-subtitle">Linear regression on weekly error rates — likelihood of exceeding 5% error threshold</div>
          <div class="chart-container" style="height:240px"><canvas id="paramRiskChart"></canvas></div>
        </div>
        <!-- Risk radar -->
        <div class="card">
          <div class="card-title"><i class="fas fa-satellite-dish"></i> Accuracy Trend — Consecutive Drop Detector</div>
          <div class="card-subtitle">Month-over-month accuracy with drop markers (🔴 = consecutive decline)</div>
          <div class="chart-container" style="height:240px"><canvas id="dropDetectChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- PANEL 2: RECRUITER SCORECARD -->
    <div class="perf-panel" id="perfPanel-scorecard">
      <div class="card card-full" style="margin-bottom:18px">
        <div class="card-title"><i class="fas fa-medal"></i> Recruiter Performance Scorecard — Tiered Ranking</div>
        <div class="card-subtitle">Tier 1 ≥99% | Tier 2 97–99% | Tier 3 95–97% | Critical &lt;95%  &nbsp;·&nbsp; Trend based on latest 3 months &nbsp;·&nbsp; Bottom 20% flagged for coaching</div>
        <div id="scorecardGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:14px"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        <div class="card">
          <div class="card-title"><i class="fas fa-chart-bar"></i> Accuracy by Recruiter (All)</div>
          <div class="card-subtitle">Sorted by performance. Dashed line = 95% target.</div>
          <div class="chart-container" style="height:280px"><canvas id="scorecardBarChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title"><i class="fas fa-layer-group"></i> Tier Distribution</div>
          <div class="card-subtitle">Recruiter count per performance tier</div>
          <div class="chart-container" style="height:280px"><canvas id="tierDonutChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- PANEL 3: PARAMETER DEEP-DIVE -->
    <div class="perf-panel" id="perfPanel-param">
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:18px;margin-bottom:18px">
        <div class="card" style="overflow-y:auto;max-height:500px">
          <div class="card-title"><i class="fas fa-list"></i> Parameters — Click to Drill Down</div>
          <div id="paramDrillList" style="margin-top:10px"></div>
        </div>
        <div class="card" id="paramDrillDetail" style="min-height:460px">
          <div class="card-title" id="paramDrillTitle"><i class="fas fa-microscope"></i> Select a parameter to explore</div>
          <div id="paramDrillContent" style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--text-muted);font-size:14px">
            <div style="text-align:center"><i class="fas fa-hand-pointer" style="font-size:36px;margin-bottom:12px;display:block"></i>Click any parameter on the left to see which recruiters, weeks, and PMs are contributing to failures</div>
          </div>
        </div>
      </div>
      <div class="card card-full">
        <div class="card-title"><i class="fas fa-chart-area"></i> Weekly Error Rate Trend — All Parameters</div>
        <div class="card-subtitle">Which parameters are trending worse week-on-week?</div>
        <div class="chart-container" style="height:220px"><canvas id="paramTrendChart"></canvas></div>
      </div>
    </div>

    <!-- PANEL 4: PM ACCOUNTABILITY -->
    <div class="perf-panel" id="perfPanel-pm">
      <div class="kpi-grid" style="margin-bottom:18px" id="pmKpiRow"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
        <div class="card">
          <div class="card-title"><i class="fas fa-sitemap"></i> PM Performance Ranking</div>
          <div class="card-subtitle">PM accuracy vs team average. Click a PM to see their recruiters.</div>
          <div class="chart-container" style="height:260px"><canvas id="pmRankChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title"><i class="fas fa-users-cog"></i> PM → Recruiter Drill-Down</div>
          <div class="card-subtitle" id="pmDrillSubtitle">Click a PM in the chart to expand their team</div>
          <div id="pmDrillContent" style="margin-top:12px">
            <div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-mouse-pointer" style="font-size:28px;display:block;margin-bottom:8px"></i>Click a PM bar to see recruiter breakdown</div>
          </div>
        </div>
      </div>
      <div class="card card-full">
        <div class="card-title"><i class="fas fa-table"></i> PM Month-over-Month Ranking</div>
        <div class="card-subtitle">PM performance trend across Jan–Apr 2026. Sorted by latest accuracy.</div>
        <div class="table-container"><table id="pmMomTable">
          <thead><tr><th>PM</th><th>Team Size</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>Latest Acc.</th><th>Trend</th><th>Status</th></tr></thead>
          <tbody id="pmMomBody"></tbody>
        </table></div>
      </div>
    </div>

    <!-- PANEL 5: GOAL TRACKER -->
    <div class="perf-panel" id="perfPanel-goals">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:18px">
        <!-- Goal ring 1 -->
        <div class="card" style="text-align:center">
          <div class="card-title"><i class="fas fa-bullseye"></i> Q1 FY2026 Accuracy Goal</div>
          <canvas id="goalRing1" width="180" height="180" style="margin:10px auto;display:block"></canvas>
          <div style="font-size:22px;font-weight:700;color:var(--hpe-green)" id="goalRing1Val">—</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Target: 99.00% by Jun 2026</div>
          <div id="goalRing1Status" style="margin-top:8px;font-size:12px;font-weight:600"></div>
        </div>
        <!-- Goal ring 2 -->
        <div class="card" style="text-align:center">
          <div class="card-title"><i class="fas fa-user-check"></i> Zero Recruiter in Critical Tier</div>
          <canvas id="goalRing2" width="180" height="180" style="margin:10px auto;display:block"></canvas>
          <div style="font-size:22px;font-weight:700;color:var(--hpe-blue)" id="goalRing2Val">—</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Target: 0 recruiters &lt;95% by Jun 2026</div>
          <div id="goalRing2Status" style="margin-top:8px;font-size:12px;font-weight:600"></div>
        </div>
        <!-- Goal ring 3 -->
        <div class="card" style="text-align:center">
          <div class="card-title"><i class="fas fa-bug"></i> Error Rate Goal</div>
          <canvas id="goalRing3" width="180" height="180" style="margin:10px auto;display:block"></canvas>
          <div style="font-size:22px;font-weight:700;color:var(--hpe-orange)" id="goalRing3Val">—</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Target: &lt;1.0% error rate by Jun 2026</div>
          <div id="goalRing3Status" style="margin-top:8px;font-size:12px;font-weight:600"></div>
        </div>
      </div>
      <!-- Goal timeline -->
      <div class="card card-full" style="margin-bottom:18px">
        <div class="card-title"><i class="fas fa-road"></i> Accuracy Goal Progress — Forecast to Target</div>
        <div class="acc-legend-bar">
          <span class="alb-title">Accuracy Key:</span>
          <span class="acc-legend-item ali-green">&#9679; &gt;98% — Performance Excellence</span>
          <span class="acc-legend-item ali-amber">&#9679; 95–98% — Performance Watch</span>
          <span class="acc-legend-item ali-red">&#9679; &lt;95% — Performance Below Target</span>
        </div>
        <div class="card-subtitle">Actual monthly accuracy vs quarterly target trajectory (99% by Jun 2026)</div>
        <div class="chart-container" style="height:220px"><canvas id="goalProgressChart"></canvas></div>
      </div>
      <!-- Alert thresholds -->
      <div class="card card-full">
        <div class="card-title"><i class="fas fa-bell"></i> Live Threshold Alerts</div>
        <div class="card-subtitle">Auto-triggered when error rates or accuracy breach configured thresholds</div>
        <div id="alertsList" style="margin-top:12px"></div>
      </div>
    </div>

  </div><!-- end tab-performance -->

</div><!-- end dashboard wrapper -->

<!-- ══════════════════════════════════════════════════════════════
     EXPORT MODAL
══════════════════════════════════════════════════════════════ -->
<div class="modal-overlay" id="exportModal" onclick="if(event.target===this)closeExportModal()">
  <div class="export-modal-box">
    <!-- Header -->
    <div class="export-modal-header">
      <div class="export-modal-title">
        <i class="fas fa-file-export"></i>
        Export Executive Report
        <span style="background:rgba(1,169,130,0.25);color:#6ee8c8;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;margin-left:4px">FY2026</span>
      </div>
      <button class="export-modal-close" onclick="closeExportModal()"><i class="fas fa-times"></i></button>
    </div>

    <!-- Tab bar -->
    <div class="export-tab-bar">
      <button class="export-tab active" id="exportTabPDF" onclick="switchExportTab('pdf',this)">
        <i class="fas fa-file-pdf" style="color:#C54E4B"></i> PDF Report
      </button>
      <button class="export-tab" id="exportTabPPT" onclick="switchExportTab('ppt',this)">
        <i class="fas fa-file-powerpoint" style="color:#D04424"></i> PowerPoint Slides
      </button>
    </div>

    <div class="export-modal-body">

      <!-- ── PDF PANEL ───────────────────────────────────────── -->
      <div class="export-tab-panel active" id="exportPanelPDF">
        <div class="pdf-preview-card">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:52px;height:66px;background:linear-gradient(135deg,#C54E4B,#e05555);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="fas fa-file-pdf" style="color:white;font-size:22px"></i>
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--hpe-dark)">HPE Audit Performance Report</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px">FY2026 · HPE TA</div>
              <div style="font-size:11px;color:var(--hpe-green);margin-top:5px;font-weight:600"><i class="fas fa-check-circle"></i> A4 Portrait · Multi-page · Print-ready</div>
            </div>
          </div>
          <div style="margin-top:16px;font-size:12px;font-weight:600;color:var(--text-secondary)">SECTIONS INCLUDED:</div>
          <div class="pdf-section-list" id="pdfSectionList">
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-cover" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-id-card"></i> Cover Page
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-kpi" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-tachometer-alt"></i> KPI Dashboard
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-gauge" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-circle-dot"></i> Accuracy Gauges
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-insights" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-robot"></i> Audit Insights
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-trend" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-chart-line"></i> Trend Chart
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-errors" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-exclamation-circle"></i> Top Errors
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-recruiters" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-users"></i> Recruiter Table
            </label>
            <label class="pdf-section-chip" style="cursor:pointer">
              <input type="checkbox" id="pdfSec-monthly" checked style="display:none" onchange="updatePDFSections()">
              <i class="fas fa-calendar-alt"></i> Monthly Summary
            </label>
          </div>
        </div>

        <!-- Settings row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">FILENAME</div>
            <input type="text" id="pdfFilename" value="HPE_Audit_FY2026_Report" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;font-family:'Inter',sans-serif;box-sizing:border-box">
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">QUALITY</div>
            <select id="pdfQuality" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;font-family:'Inter',sans-serif">
              <option value="2">High (2x — recommended)</option>
              <option value="1.5">Medium (1.5x)</option>
              <option value="1">Standard (1x — fastest)</option>
            </select>
          </div>
        </div>

        <div style="background:#f0fff8;border:1px solid rgba(1,169,130,0.25);border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:11px;color:var(--text-secondary)">
          <i class="fas fa-info-circle" style="color:var(--hpe-green)"></i>
          <strong> How it works:</strong> Charts and gauges are captured via html2canvas, then composed into a multi-page PDF with HPE branding, data tables, and AI insights. All live filter selections are reflected.
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-cancel" onclick="closeExportModal()">Cancel</button>
          <button class="btn-primary" id="btnRunPDF" onclick="runExportPDF()">
            <i class="fas fa-download"></i> Generate &amp; Download PDF
          </button>
        </div>
      </div>

      <!-- ── PPT PANEL ──────────────────────────────────────── -->
      <div class="export-tab-panel" id="exportPanelPPT">
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;color:var(--hpe-dark);margin-bottom:4px">
            <i class="fas fa-layer-group" style="color:#D04424"></i> 5-Slide Executive Deck
          </div>
          <div style="font-size:11px;color:var(--text-muted)">Select slides to include. Each slide renders data directly — no manual editing required.</div>
        </div>

        <!-- Slide thumbnails -->
        <div class="slide-grid" id="slideGrid">
          <!-- Slide 1 -->
          <div class="slide-thumb selected" id="slideThumb-1" onclick="toggleSlide(1)">
            <canvas id="slideCanvas-1" width="320" height="180"></canvas>
            <div class="slide-check"><i class="fas fa-check"></i></div>
            <div class="slide-thumb-label">Slide 1 · Cover</div>
          </div>
          <!-- Slide 2 -->
          <div class="slide-thumb selected" id="slideThumb-2" onclick="toggleSlide(2)">
            <canvas id="slideCanvas-2" width="320" height="180"></canvas>
            <div class="slide-check"><i class="fas fa-check"></i></div>
            <div class="slide-thumb-label">Slide 2 · KPI Overview</div>
          </div>
          <!-- Slide 3 -->
          <div class="slide-thumb selected" id="slideThumb-3" onclick="toggleSlide(3)">
            <canvas id="slideCanvas-3" width="320" height="180"></canvas>
            <div class="slide-check"><i class="fas fa-check"></i></div>
            <div class="slide-thumb-label">Slide 3 · Accuracy Trend</div>
          </div>
          <!-- Slide 4 -->
          <div class="slide-thumb selected" id="slideThumb-4" onclick="toggleSlide(4)">
            <canvas id="slideCanvas-4" width="320" height="180"></canvas>
            <div class="slide-check"><i class="fas fa-check"></i></div>
            <div class="slide-thumb-label">Slide 4 · Risk &amp; Errors</div>
          </div>
          <!-- Slide 5 -->
          <div class="slide-thumb selected" id="slideThumb-5" onclick="toggleSlide(5)">
            <canvas id="slideCanvas-5" width="320" height="180"></canvas>
            <div class="slide-check"><i class="fas fa-check"></i></div>
            <div class="slide-thumb-label">Slide 5 · Audit Insights</div>
          </div>
        </div>

        <!-- PPT settings -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">FILENAME</div>
            <input type="text" id="pptFilename" value="HPE_Audit_FY2026_Deck" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;font-family:'Inter',sans-serif;box-sizing:border-box">
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">THEME</div>
            <select id="pptTheme" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;font-family:'Inter',sans-serif" onchange="renderSlidePreviews()">
              <option value="dark">HPE Dark (recommended)</option>
              <option value="light">HPE Light</option>
              <option value="minimal">Minimal White</option>
            </select>
          </div>
        </div>

        <div style="background:#fff8f0;border:1px solid rgba(208,68,36,0.2);border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:11px;color:var(--text-secondary)">
          <i class="fas fa-info-circle" style="color:#D04424"></i>
          <strong> How it works:</strong> PptxGenJS generates a native .pptx file with HPE-branded slides. Each slide contains live chart images, KPI values, and formatted data tables from your current dashboard state.
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-cancel" onclick="closeExportModal()">Cancel</button>
          <button class="btn-primary" id="btnRunPPT" onclick="runExportPPT()" style="background:linear-gradient(135deg,#D04424,#e8541e)">
            <i class="fas fa-download"></i> Generate &amp; Download .pptx
          </button>
        </div>
      </div>

    </div><!-- end modal-body -->
  </div><!-- end export-modal-box -->
</div><!-- end exportModal -->

<!-- Progress overlay -->
<div class="export-progress-wrap" id="exportProgressWrap">
  <div class="export-progress-box">
    <span class="export-progress-icon" id="exportProgressIcon">📄</span>
    <div class="export-progress-title" id="exportProgressTitle">Generating Report…</div>
    <div class="export-progress-sub" id="exportProgressSub">Capturing charts and KPIs…</div>
    <div class="export-progress-bar-wrap">
      <div class="export-progress-bar" id="exportProgressBar"></div>
    </div>
    <div class="export-progress-pct" id="exportProgressPct">0%</div>
  </div>
</div><!-- end exportProgressWrap -->

<!-- ===== TAB: GLOSSARY ===== -->
<div class="tab-content" id="tab-glossary">
    <div class="section-header">
      <div>
        <div class="section-title">
          <div class="icon-badge"><i class="fas fa-book-open"></i></div>
          Glossary of Performance Measures
        </div>
        <div class="section-subtitle">Definitions, formulas, and worked examples for every metric across all dashboard tabs</div>
      </div>
    </div>

    <!-- Hero banner -->
    <div class="glossary-hero">
      <div class="glossary-hero-left">
        <div class="glossary-hero-title"><i class="fas fa-book-open" style="color:var(--hpe-green);margin-right:10px"></i>HPE Audit Performance — Complete Metric Reference</div>
        <div class="glossary-hero-sub">Every KPI, ratio, score, and index used in this dashboard — their meaning, how they are calculated, and how to interpret the result. Use the search box or category filter to find a term quickly.</div>
      </div>
      <div class="glossary-hero-stats">
        <div class="glossary-hero-stat">
          <div class="glossary-hero-stat-val">42</div>
          <div class="glossary-hero-stat-lbl">Terms defined</div>
        </div>
        <div class="glossary-hero-stat">
          <div class="glossary-hero-stat-val">8</div>
          <div class="glossary-hero-stat-lbl">Tab categories</div>
        </div>
        <div class="glossary-hero-stat">
          <div class="glossary-hero-stat-val">100%</div>
          <div class="glossary-hero-stat-lbl">Formula coverage</div>
        </div>
      </div>
    </div>

    <!-- Search + filter bar -->
    <div class="glossary-search-bar">
      <div class="glossary-search-wrap">
        <i class="fas fa-search glossary-search-ico"></i>
        <input type="text" class="glossary-search-input" id="glossarySearchInput"
          placeholder="Search terms, abbreviations, formulas…"
          oninput="filterGlossary(this.value)" autocomplete="off" />
      </div>
      <div class="glossary-filter-btns" id="glossaryFilterBtns">
        <button class="glossary-filter-btn active" onclick="filterGlossaryCategory('all',this)">All</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('executive',this)"><i class="fas fa-tachometer-alt" style="margin-right:4px"></i>Executive</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('trends',this)"><i class="fas fa-chart-line" style="margin-right:4px"></i>Trends</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('improvement',this)"><i class="fas fa-arrow-trend-up" style="margin-right:4px"></i>Improvement</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('capa',this)"><i class="fas fa-clipboard-check" style="margin-right:4px"></i>CAPA</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('sla',this)"><i class="fas fa-handshake" style="margin-right:4px"></i>SLA</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('performance',this)"><i class="fas fa-user-chart" style="margin-right:4px"></i>Performance</button>
        <button class="glossary-filter-btn" onclick="filterGlossaryCategory('formula',this)"><i class="fas fa-calculator" style="margin-right:4px"></i>Has Formula</button>
      </div>
    </div>

    <!-- Quick-jump TOC -->
    <div class="glossary-toc" id="glossaryTOC">
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-executive')"><span class="glossary-toc-dot" style="background:#0D5DBF"></span>Executive Summary</a>
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-trends')"><span class="glossary-toc-dot" style="background:#01A982"></span>Accuracy Trends</a>
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-improvement')"><span class="glossary-toc-dot" style="background:#FF8300"></span>Improvement &amp; Scope</a>
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-capa')"><span class="glossary-toc-dot" style="background:#9b59b6"></span>CAPA</a>
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-insights')"><span class="glossary-toc-dot" style="background:#e74c3c"></span>Audit Insights</a>
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-sla')"><span class="glossary-toc-dot" style="background:#17a2b8"></span>SLA Performance</a>
      <a class="glossary-toc-item" onclick="scrollToGlossarySection('gls-performance')"><span class="glossary-toc-dot" style="background:#FF8300"></span>Performance Intelligence</a>
    </div>

    <div id="glossaryNoResults" class="glossary-no-results" style="display:none">
      <i class="fas fa-search" style="font-size:28px;opacity:0.3;display:block;margin-bottom:10px"></i>
      No terms match your search. Try a shorter keyword or clear the filter.
    </div>

    <!-- ── SECTION 1: EXECUTIVE SUMMARY ── -->
    <div class="glossary-section" id="gls-executive">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(13,93,191,0.12);color:#0D5DBF"><i class="fas fa-tachometer-alt"></i></div>
        <div>
          <div class="glossary-section-title">Executive Summary</div>
          <div class="glossary-section-sub">Top-level KPIs and gauge metrics shown on the first tab</div>
        </div>
        <div class="glossary-section-badge">8 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-green" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="overall accuracy audit accuracy">
          <div class="gc-term"><i class="fas fa-bullseye" style="color:#01A982;margin-top:2px"></i>Overall Accuracy<span class="gc-abbr">OA</span></div>
          <div class="gc-definition">The headline FY audit accuracy percentage. Measures the proportion of audit checkpoints that passed out of the total checkpoints evaluated. N/A checkpoints (where the parameter was not applicable for that hire) are <em>excluded</em> from both numerator and denominator so they do not artificially inflate the score.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">OA (%) = (Passed Checkpoints / (Total Checkpoints − N/A Checkpoints)) × 100</div>
          </div>
          <div class="gc-example"><strong>FY2026 example:</strong> 8,400 passed out of (8,599 − 71 N/A) = 8,528 applicable → <strong>98.50%</strong></div>
          <div class="gc-tags"><span class="gc-tag">Executive</span><span class="gc-tag blue">KPI</span><span class="gc-tag">Target: 95%</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="error rate fail rate parameter error">
          <div class="gc-term"><i class="fas fa-exclamation-triangle" style="color:#C54E4B;margin-top:2px"></i>Error Rate<span class="gc-abbr">ER</span></div>
          <div class="gc-definition">The complement of Overall Accuracy. Represents the percentage of applicable checkpoints that failed. A single audit record can fail on multiple parameters, each counting as a separate failure against the parameter's opportunity count.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">ER (%) = (Failed Checkpoints / Applicable Checkpoints) × 100
  = 100 − Overall Accuracy (%)</div>
          </div>
          <div class="gc-example"><strong>FY2026 example:</strong> 128 failures / 8,528 applicable = <strong>1.50%</strong> (displayed as 1.49% due to rounding)</div>
          <div class="gc-tags"><span class="gc-tag red">Executive</span><span class="gc-tag blue">KPI</span></div>
        </div>

        <div class="glossary-card gc-blue" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="total audits opportunity count volume">
          <div class="gc-term"><i class="fas fa-clipboard-list" style="color:#0D5DBF;margin-top:2px"></i>Total Audits / Opportunity Count<span class="gc-abbr">OC</span></div>
          <div class="gc-definition">The total number of individual audit checkpoints evaluated in a given period. One hiring record may be audited against 10–15 parameters, so Opportunity Count is always much larger than the number of hires. Each parameter check on each hire = one opportunity.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Opportunity Count = Passed + Failed + N/A checkpoints</div>
          </div>
          <div class="gc-example"><strong>FY2026:</strong> 8,400 pass + 128 fail + 71 N/A = <strong>8,599</strong> total checkpoints</div>
          <div class="gc-tags"><span class="gc-tag blue">Executive</span><span class="gc-tag blue">Volume</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="passed audits pass rate">
          <div class="gc-term"><i class="fas fa-check-circle" style="color:#01A982;margin-top:2px"></i>Passed Audits<span class="gc-abbr">PP</span></div>
          <div class="gc-definition">Count of checkpoints where the recruiter complied fully with the audited parameter. A checkpoint is "Passed" when the field, date, form, or process step was completed correctly and on time according to HPE's audit standards.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Pass Rate</div>
            <div class="gc-formula">Pass Rate (%) = (Passed / (Total − N/A)) × 100</div>
          </div>
          <div class="gc-example"><strong>FY2026:</strong> 8,400 / 8,528 = <strong>98.50%</strong> pass rate</div>
          <div class="gc-tags"><span class="gc-tag">Executive</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="month on month MoM improvement delta change">
          <div class="gc-term"><i class="fas fa-arrow-up" style="color:#FF8300;margin-top:2px"></i>Month-on-Month (MoM) Improvement<span class="gc-abbr">MoM</span></div>
          <div class="gc-definition">The percentage-point change in Overall Accuracy between the most recent complete month and the prior month. Positive = improvement; negative = decline. Used to assess short-term trajectory of the team.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">MoM = Accuracy(current month) − Accuracy(previous month)</div>
          </div>
          <div class="gc-example"><strong>Mar vs Feb 2026:</strong> 98.49% − 99.43% = <strong>−0.94 pp</strong> (decline)</div>
          <div class="gc-tags"><span class="gc-tag orange">Executive</span><span class="gc-tag">Trend</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="week on week WoW change weekly">
          <div class="gc-term"><i class="fas fa-calendar-week" style="color:#FF8300;margin-top:2px"></i>Week-on-Week (WoW) Change<span class="gc-abbr">WoW</span></div>
          <div class="gc-definition">The percentage-point change in weekly accuracy between the most recent week and the immediately preceding week within the same or adjacent month. Reflects very short-term fluctuation — useful for spotting one-off spikes or drops.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">WoW = Accuracy(current week) − Accuracy(previous week)</div>
          </div>
          <div class="gc-example"><strong>Apr W4 vs Apr W3:</strong> 97.87% − 93.62% = <strong>+4.25 pp</strong> recovery</div>
          <div class="gc-tags"><span class="gc-tag orange">Executive</span><span class="gc-tag">Weekly</span></div>
        </div>

        <div class="glossary-card gc-blue" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="critical parameters gauge target 99">
          <div class="gc-term"><i class="fas fa-circle-dot" style="color:#0D5DBF;margin-top:2px"></i>Critical Parameters Accuracy<span class="gc-abbr">CPA</span></div>
          <div class="gc-definition">Accuracy calculated only for parameters classified as "critical" — fields whose errors have direct business or compliance impact (e.g., Offer Details, Interview Process, Start Date). These are measured against the standard 95% accuracy target.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">CPA (%) = (Critical Passed / Critical Applicable) × 100</div>
          </div>
          <div class="gc-example"><strong>FY2026:</strong> 98.62% — 3.62 pp above the 95% target → <strong>✓ Above Target</strong></div>
          <div class="gc-tags"><span class="gc-tag blue">Executive</span><span class="gc-tag green">Target: 95%</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('exec')" title="Navigate to Executive Summary" style="cursor:pointer" data-category="executive" data-terms="non-critical parameters gauge 97 target">
          <div class="gc-term"><i class="fas fa-circle-dot" style="color:#01A982;margin-top:2px"></i>Non-Critical Parameters Accuracy<span class="gc-abbr">NCPA</span></div>
          <div class="gc-definition">Accuracy measured only for parameters that are considered non-critical — administrative or process steps where errors are correctable without major compliance risk. The benchmark is lower at 97%.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">NCPA (%) = (Non-Critical Passed / Non-Critical Applicable) × 100</div>
          </div>
          <div class="gc-example"><strong>FY2026:</strong> 97.89% — above the 97% target → <strong>✓ Above Target</strong></div>
          <div class="gc-tags"><span class="gc-tag">Executive</span><span class="gc-tag">Target: 97%</span></div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 2: ACCURACY TRENDS ── -->
    <div class="glossary-section" id="gls-trends">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(1,169,130,0.12);color:#01A982"><i class="fas fa-chart-line"></i></div>
        <div>
          <div class="glossary-section-title">Accuracy Trends &amp; Analysis</div>
          <div class="glossary-section-sub">Time-series metrics, heatmap bands, and stage comparisons</div>
        </div>
        <div class="glossary-section-badge">6 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-green" onclick="navigateToTab('trends')" title="Navigate to Accuracy Trends" style="cursor:pointer" data-category="trends" data-terms="monthly accuracy trend month over month period">
          <div class="gc-term"><i class="fas fa-chart-line" style="color:#01A982;margin-top:2px"></i>Monthly Accuracy<span class="gc-abbr">MA</span></div>
          <div class="gc-definition">Accuracy calculated for each calendar month by aggregating all checkpoints within that month. Forms the backbone of the trend chart and month-over-month comparison. Each month's accuracy is independent — it reflects the recruiter behaviour in that specific period.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Monthly Accuracy (%) = (Month Passed / (Month Total − Month N/A)) × 100</div>
          </div>
          <div class="gc-example"><strong>March 2026:</strong> 3,141 / (3,191 − 2) = 3,141 / 3,189 = <strong>98.49%</strong></div>
          <div class="gc-tags"><span class="gc-tag">Trends</span><span class="gc-tag blue">Time-series</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('trends')" title="Navigate to Accuracy Trends" style="cursor:pointer" data-category="trends" data-terms="weekly accuracy heatmap week color band">
          <div class="gc-term"><i class="fas fa-th" style="color:#01A982;margin-top:2px"></i>Weekly Accuracy &amp; Heatmap Bands<span class="gc-abbr">WA</span></div>
          <div class="gc-definition">Accuracy calculated at the weekly granularity. Displayed as a colour-coded heatmap where each cell represents one week. Band thresholds: ≥99% (green), 98–99% (teal), 95–98% (orange), below 95% (red). Allows quick visual detection of anomalous weeks.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula + Bands</div>
            <div class="gc-formula">Weekly Acc (%) = (Week Passed / (Week Total − Week N/A)) × 100
  ≥99% → Green  |  98–99% → Teal
  95–98% → Orange  |  &lt;95% → Red</div>
          </div>
          <div class="gc-example"><strong>Apr W3 2026:</strong> 47 pass / 51 applicable = <strong>93.62%</strong> → Red band (anomaly week)</div>
          <div class="gc-tags"><span class="gc-tag">Trends</span><span class="gc-tag">Heatmap</span></div>
        </div>

        <div class="glossary-card gc-blue" onclick="navigateToTab('trends')" title="Navigate to Accuracy Trends" style="cursor:pointer" data-category="trends" data-terms="pre selection post selection stage accuracy">
          <div class="gc-term"><i class="fas fa-layer-group" style="color:#0D5DBF;margin-top:2px"></i>Pre vs Post Selection Accuracy<span class="gc-abbr">PPSA</span></div>
          <div class="gc-definition">Accuracy split by the stage of the hiring process. <strong>Pre Selection</strong> covers intake, scheduling, and engagement meeting parameters (audited before a candidate is selected). <strong>Post Selection</strong> covers offer, on-boarding, ERP, and start-date parameters (after selection decision). Post Selection has higher volume and critical parameters.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Stage Accuracy (%) = (Stage Passed / Stage Applicable) × 100
  Pre Selection:  2,438 pass / 2,474 = 98.54%
  Post Selection: 5,962 pass / 6,122 = 97.38%</div>
          </div>
          <div class="gc-example"><strong>FY2026:</strong> Pre = 99.39% accuracy (lower volume, fewer critical params); Post = 97.51% (higher volume, complex params)</div>
          <div class="gc-tags"><span class="gc-tag blue">Trends</span><span class="gc-tag">Stage</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('trends')" title="Navigate to Accuracy Trends" style="cursor:pointer" data-category="trends" data-terms="critical parameter error rate high fail high risk">
          <div class="gc-term"><i class="fas fa-exclamation-circle" style="color:#C54E4B;margin-top:2px"></i>Critical Parameter Error Rate<span class="gc-abbr">CPER</span></div>
          <div class="gc-definition">The error rate for an individual parameter classified as critical. A parameter is flagged as critical when its failure rate exceeds the 5% threshold (configurable in Settings). These parameters are highlighted in the trends criticality chart and drive the most CAPA actions.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Parameter Error Rate (%) = (Param Failures / Param Opportunities) × 100</div>
          </div>
          <div class="gc-example"><strong>Target start date:</strong> 53 fails / 59 opportunities = <strong>89.83%</strong> — extreme critical outlier</div>
          <div class="gc-tags"><span class="gc-tag red">Trends</span><span class="gc-tag red">Critical</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('trends')" title="Navigate to Accuracy Trends" style="cursor:pointer" data-category="trends" data-terms="95 target line benchmark threshold accuracy target">
          <div class="gc-term"><i class="fas fa-minus" style="color:#01A982;margin-top:2px"></i>95% Accuracy Threshold Benchmark<span class="gc-abbr">ATB</span></div>
          <div class="gc-definition">The organisational minimum accuracy standard set by HPE for the South 1 Talent Acquisition team. All charts include this as a horizontal reference line (red dashed). Any month or week whose accuracy falls below this line is flagged in alerts and risk panels. The target is configurable via the Settings drawer.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Context</div>
            <div class="gc-formula">Target = 95.0% (default, adjustable via Threshold Settings)
  Critical target = 95.0% (same as overall standard threshold)</div>
          </div>
          <div class="gc-tags"><span class="gc-tag">Trends</span><span class="gc-tag blue">Benchmark</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('trends')" title="Navigate to Accuracy Trends" style="cursor:pointer" data-category="trends" data-terms="N/A not applicable excluded checkpoint">
          <div class="gc-term"><i class="fas fa-ban" style="color:#17a2b8;margin-top:2px"></i>N/A (Not Applicable) Checkpoints<span class="gc-abbr">NA</span></div>
          <div class="gc-definition">Checkpoints excluded from both pass and fail counts because the parameter was genuinely not applicable to that particular hire (e.g., ERP Bonus field for a contractor hire). N/A checkpoints are counted in Opportunity Count but subtracted before computing accuracy to prevent inflation.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Impact on accuracy</div>
            <div class="gc-formula">Applicable = Total − N/A
  Accuracy = Passed / Applicable × 100  (N/A excluded from denominator)</div>
          </div>
          <div class="gc-example"><strong>Jan 2026:</strong> 40 N/A in 1,228 total → Applicable = 1,188 → Accuracy = 1,180/1,188 = <strong>99.33%</strong></div>
          <div class="gc-tags"><span class="gc-tag blue">Trends</span><span class="gc-tag">Data Quality</span></div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 3: IMPROVEMENT & SCOPE ── -->
    <div class="glossary-section" id="gls-improvement">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(255,131,0,0.12);color:#FF8300"><i class="fas fa-arrow-trend-up"></i></div>
        <div>
          <div class="glossary-section-title">Improvement &amp; Scope</div>
          <div class="glossary-section-sub">Forecasting, regression, Pareto, and period-over-period delta metrics</div>
        </div>
        <div class="glossary-section-badge">6 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-orange" onclick="navigateToTab('improvement')" title="Navigate to Improvement" style="cursor:pointer" data-category="improvement" data-terms="linear regression trend slope forecast predict">
          <div class="gc-term"><i class="fas fa-chart-area" style="color:#FF8300;margin-top:2px"></i>Linear Regression Trend &amp; Slope<span class="gc-abbr">LR</span></div>
          <div class="gc-definition">A statistical line fitted through historical accuracy data points (weekly or monthly) using Ordinary Least Squares. The <strong>slope</strong> tells you how much accuracy changes per period: positive slope = improving, negative = declining. The regression line is extrapolated to forecast future accuracy assuming the current trend continues.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula (OLS)</div>
            <div class="gc-formula">slope = (n·ΣxY − Σx·ΣY) / (n·Σx² − (Σx)²)
  intercept = (ΣY − slope·Σx) / n
  forecast(t) = intercept + slope × t  (clamped 80–100%)</div>
          </div>
          <div class="gc-example"><strong>Apr recruiter (Kusuma K):</strong> slope = −1.48 pp/month → declining rapidly; forecast May ≈ <strong>84.3%</strong></div>
          <div class="gc-tags"><span class="gc-tag orange">Improvement</span><span class="gc-tag">Statistics</span><span class="gc-tag blue">Forecast</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('improvement')" title="Navigate to Improvement" style="cursor:pointer" data-category="improvement" data-terms="AI forecast prediction next 4 weeks projected">
          <div class="gc-term"><i class="fas fa-crystal-ball" style="color:#FF8300;margin-top:2px"></i>AI Accuracy Forecast<span class="gc-abbr">AAF</span></div>
          <div class="gc-definition">A 4-week forward projection built by extending the linear regression line beyond the last data point. Confidence bands (optimistic / pessimistic) are derived by adding/subtracting 1.5× the root mean square error of the regression fit. The forecast does not use ML in the traditional sense — it is deterministic linear extrapolation presented with AI-branded labelling to surface future risk clearly.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Forecast bands</div>
            <div class="gc-formula">Central = intercept + slope × (n + t)
  Optimistic = Central + 1.5 × RMSE
  Pessimistic = Central − 1.5 × RMSE</div>
          </div>
          <div class="gc-tags"><span class="gc-tag orange">Improvement</span><span class="gc-tag blue">Forecast</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('improvement')" title="Navigate to Improvement" style="cursor:pointer" data-category="improvement" data-terms="pareto 80/20 rule top errors cumulative">
          <div class="gc-term"><i class="fas fa-sort-amount-down" style="color:#FF8300;margin-top:2px"></i>Pareto Analysis (80/20 Rule)<span class="gc-abbr">PA</span></div>
          <div class="gc-definition">A ranked bar chart of parameters by failure count, overlaid with a cumulative percentage line. The 80/20 principle states that roughly 80% of all errors are caused by 20% of parameters. The Pareto chart identifies which few parameters to fix first for the greatest quality improvement.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Cumulative %</div>
            <div class="gc-formula">Cumulative % at rank k = (Sum of failures ranks 1..k / Total failures) × 100</div>
          </div>
          <div class="gc-example"><strong>FY2026:</strong> "Target start date" (53 fails) alone = 41.4% of all 128 errors → fixing it alone resolves 41% of defects</div>
          <div class="gc-tags"><span class="gc-tag orange">Improvement</span><span class="gc-tag">Root Cause</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('improvement')" title="Navigate to Improvement" style="cursor:pointer" data-category="improvement" data-terms="period over period delta improvement change previous">
          <div class="gc-term"><i class="fas fa-table" style="color:#FF8300;margin-top:2px"></i>Period-over-Period Delta<span class="gc-abbr">PoPD</span></div>
          <div class="gc-definition">The absolute change in accuracy (in percentage points, pp) between consecutive periods — shown for both monthly and weekly views. A positive delta means improvement; negative means decline. The delta table highlights the magnitude of swings so managers can see which periods had the largest movements.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">PoPD = Accuracy(period N) − Accuracy(period N−1)
  e.g., Feb − Jan: 99.43 − 99.33 = +0.10 pp
        Mar − Feb: 98.49 − 99.43 = −0.94 pp</div>
          </div>
          <div class="gc-tags"><span class="gc-tag orange">Improvement</span><span class="gc-tag blue">Delta</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('improvement')" title="Navigate to Improvement" style="cursor:pointer" data-category="improvement" data-terms="recruiter error frequency top bottom coaching">
          <div class="gc-term"><i class="fas fa-user-circle" style="color:#FF8300;margin-top:2px"></i>Recruiter Error Frequency<span class="gc-abbr">REF</span></div>
          <div class="gc-definition">Total count of audit failures attributed to a specific recruiter across all parameters in the selected period. Not the same as accuracy (which is rate-adjusted for volume). A recruiter with 300 audits and 10 errors contributes more absolute errors than one with 30 audits and 5 errors, even though their accuracy rates differ.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">REF = Sum of all parameter failures for recruiter in period</div>
          </div>
          <div class="gc-example"><strong>Kusuma K:</strong> 33 errors across 276 audits — highest absolute count, driving coaching recommendation</div>
          <div class="gc-tags"><span class="gc-tag orange">Improvement</span><span class="gc-tag">Recruiter</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('improvement')" title="Navigate to Improvement" style="cursor:pointer" data-category="improvement" data-terms="PM performance manager accuracy team average">
          <div class="gc-term"><i class="fas fa-sitemap" style="color:#FF8300;margin-top:2px"></i>PM (Project Manager) Team Accuracy<span class="gc-abbr">PMTA</span></div>
          <div class="gc-definition">The weighted average accuracy across all recruiters managed by a given Project Manager. A PM with three recruiters — one at 99%, one at 97%, one at 88% — would have a team average that reflects the combined checkpoint counts. Low-accuracy PMs indicate a coaching and process-adherence gap at the team level.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">PM Accuracy = (Total Pass under PM / Total Applicable under PM) × 100</div>
          </div>
          <div class="gc-tags"><span class="gc-tag orange">Improvement</span><span class="gc-tag purple">PM</span></div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 4: CAPA ── -->
    <div class="glossary-section" id="gls-capa">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(155,89,182,0.12);color:#9b59b6"><i class="fas fa-clipboard-check"></i></div>
        <div>
          <div class="glossary-section-title">CAPA — Corrective &amp; Preventive Actions</div>
          <div class="glossary-section-sub">Bot Undo Moves register metrics and resolution KPIs</div>
        </div>
        <div class="glossary-section-badge">5 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-purple" onclick="navigateToTab('capa')" title="Navigate to CAPA" style="cursor:pointer" data-category="capa" data-terms="CAPA corrective preventive action bot undo">
          <div class="gc-term"><i class="fas fa-clipboard-check" style="color:#9b59b6;margin-top:2px"></i>CAPA — Corrective &amp; Preventive Action<span class="gc-abbr">CAPA</span></div>
          <div class="gc-definition">A formal quality-management record raised when a recruitment system bot reverses an action taken by a recruiter (a "Bot Undo Move"). Each CAPA captures the root cause category, the recruiter responsible, the date raised, the target close date, and current resolution status. CAPAs drive the improvement cycle by ensuring every systematic error is addressed and tracked to closure.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Status values</div>
            <div class="gc-formula">Open → In Progress → Closed
  Overdue = Open past target close date</div>
          </div>
          <div class="gc-tags"><span class="gc-tag purple">CAPA</span><span class="gc-tag blue">Quality</span></div>
        </div>

        <div class="glossary-card gc-purple" onclick="navigateToTab('capa')" title="Navigate to CAPA" style="cursor:pointer" data-category="capa" data-terms="CAPA closure rate closed resolved target 80">
          <div class="gc-term"><i class="fas fa-check-double" style="color:#9b59b6;margin-top:2px"></i>CAPA Closure Rate<span class="gc-abbr">CCR</span></div>
          <div class="gc-definition">The percentage of raised CAPAs that have been fully closed (resolved and verified). The organisational target is 80%. A low closure rate indicates open quality issues are not being resolved in time, creating compounding risk.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">CCR (%) = (Closed CAPAs / Total CAPAs) × 100
  Target: ≥ 80%</div>
          </div>
          <div class="gc-example"><strong>Current:</strong> 2 closed / 4 total = <strong>50%</strong> — below the 80% target</div>
          <div class="gc-tags"><span class="gc-tag purple">CAPA</span><span class="gc-tag red">Target: 80%</span></div>
        </div>

        <div class="glossary-card gc-purple" onclick="navigateToTab('capa')" title="Navigate to CAPA" style="cursor:pointer" data-category="capa" data-terms="average days to close resolution time SLA days">
          <div class="gc-term"><i class="fas fa-clock" style="color:#9b59b6;margin-top:2px"></i>Average Days to Close (CAPA)<span class="gc-abbr">ADC</span></div>
          <div class="gc-definition">The mean number of calendar days between the date a CAPA was raised and the date it was closed. Measures the speed of the corrective action process. Target is ≤17 days. Open/overdue CAPAs are excluded from this average (they have no close date yet).</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">ADC = Sum(Close_Date − Raise_Date) for closed CAPAs / Count(Closed CAPAs)
  Target: ≤ 17 days</div>
          </div>
          <div class="gc-example"><strong>Current closed CAPAs:</strong> (10 + 18) / 2 = <strong>14 days</strong> average — within target</div>
          <div class="gc-tags"><span class="gc-tag purple">CAPA</span><span class="gc-tag">Time-to-resolve</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('capa')" title="Navigate to CAPA" style="cursor:pointer" data-category="capa" data-terms="overdue CAPA past due late escalation">
          <div class="gc-term"><i class="fas fa-exclamation-triangle" style="color:#C54E4B;margin-top:2px"></i>Overdue CAPAs<span class="gc-abbr">OC</span></div>
          <div class="gc-definition">CAPAs whose status is Open or In Progress AND whose target close date has already passed (today's date > target close date). Each overdue CAPA triggers an active red alert in the Goal Tracker panel and should be escalated immediately to the responsible PM.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Condition</div>
            <div class="gc-formula">Overdue = (Status != 'Closed') AND (Today &gt; Target_Close_Date)</div>
          </div>
          <div class="gc-example"><strong>CAPA-003:</strong> Target close Apr-26, status still Open → <strong>Overdue</strong> → Red alert raised</div>
          <div class="gc-tags"><span class="gc-tag red">CAPA</span><span class="gc-tag red">Alert</span></div>
        </div>

        <div class="glossary-card gc-purple" onclick="navigateToTab('capa')" title="Navigate to CAPA" style="cursor:pointer" data-category="capa" data-terms="root cause category CAPA classification type">
          <div class="gc-term"><i class="fas fa-sitemap" style="color:#9b59b6;margin-top:2px"></i>Root Cause Category<span class="gc-abbr">RCC</span></div>
          <div class="gc-definition">The classification of why a bot undo move was triggered. Root cause categories used in this dashboard include: Process Gap (recruiter didn't follow the defined step), Data Entry Error (wrong value entered), System Issue (platform/tool caused the error), and Training Gap (recruiter lacked knowledge of the requirement). CAPAs grouped by root cause surface systemic vs individual issues.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-list" style="margin-right:4px"></i>Categories</div>
            <div class="gc-formula">Process Gap | Data Entry Error | System Issue | Training Gap</div>
          </div>
          <div class="gc-tags"><span class="gc-tag purple">CAPA</span><span class="gc-tag">Classification</span></div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 5: AI INSIGHTS ── -->
    <div class="glossary-section" id="gls-insights">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(231,76,60,0.10);color:#e74c3c"><i class="fas fa-brain"></i></div>
        <div>
          <div class="glossary-section-title">Insights and Recommendations</div>
          <div class="glossary-section-sub">Predictive flags, risk classifications, and recommendation ranking</div>
        </div>
        <div class="glossary-section-badge">4 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-red" onclick="navigateToTab('insights')" title="Navigate to Insights" style="cursor:pointer" data-category="insights" data-terms="predictive risk flag high medium low AI">
          <div class="gc-term"><i class="fas fa-flag" style="color:#C54E4B;margin-top:2px"></i>Predictive Risk Flag<span class="gc-abbr">PRF</span></div>
          <div class="gc-definition">An AI-generated alert that identifies a condition likely to cause a quality degradation in the next 4 weeks if left unaddressed. Risk level is assigned as HIGH, MEDIUM, or LOW based on the severity of the current metric, the rate of change, and historical impact of similar conditions. Flags are ordered by expected impact.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Risk levels</div>
            <div class="gc-formula">HIGH   = Immediate action needed; likely to breach target
  MEDIUM = Monitor closely; may breach under unfavourable conditions
  LOW    = Watch; minimal current impact</div>
          </div>
          <div class="gc-tags"><span class="gc-tag red">Audit Insights</span><span class="gc-tag red">Risk</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('insights')" title="Navigate to Insights" style="cursor:pointer" data-category="insights" data-terms="accuracy radar chart dimension spider">
          <div class="gc-term"><i class="fas fa-spider" style="color:#C54E4B;margin-top:2px"></i>Accuracy Radar (Spider) Chart<span class="gc-abbr">ARC</span></div>
          <div class="gc-definition">A multi-axis chart where each axis represents a different audit dimension (monthly accuracy, stage accuracy, PM average, top-recruiter average, target). The area of the polygon formed by connecting the data points relative to the maximum area indicates overall programme health. A compact polygon = gaps in multiple dimensions.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Axes</div>
            <div class="gc-formula">Jan Acc | Feb Acc | Mar Acc | Apr Acc | Pre-Sel | Post-Sel | PM Avg</div>
          </div>
          <div class="gc-tags"><span class="gc-tag red">Audit Insights</span><span class="gc-tag">Visualisation</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('insights')" title="Navigate to Insights" style="cursor:pointer" data-category="insights" data-terms="error heatmap recruiter parameter matrix">
          <div class="gc-term"><i class="fas fa-th" style="color:#C54E4B;margin-top:2px"></i>Recruiter × Parameter Error Heatmap<span class="gc-abbr">RPEH</span></div>
          <div class="gc-definition">A matrix heatmap where rows = error parameters and columns = recruiters. Each cell shows the failure rate for that recruiter on that parameter. Colour intensity indicates severity. Dark red cells identify specific recruiter-parameter combinations requiring immediate targeted coaching — far more actionable than looking at overall accuracy alone.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Cell formula</div>
            <div class="gc-formula">Cell[param, recruiter] = (Failures by recruiter on param / Total recruiter audits) × 100</div>
          </div>
          <div class="gc-tags"><span class="gc-tag red">Audit Insights</span><span class="gc-tag">Matrix</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('insights')" title="Navigate to Insights" style="cursor:pointer" data-category="insights" data-terms="action recommendation ROI ranked priority impact">
          <div class="gc-term"><i class="fas fa-tasks" style="color:#C54E4B;margin-top:2px"></i>Action Recommendations (Ranked by ROI)<span class="gc-abbr">ARR</span></div>
          <div class="gc-definition">A prioritised list of corrective actions ranked by their expected return-on-investment in terms of accuracy improvement. ROI is estimated as: (# errors addressable × accuracy gain per fix) / effort. The list ensures managers invest coaching and process-improvement time in the highest-impact activities first.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Ranking logic</div>
            <div class="gc-formula">Priority Score = (Addressable Failures × Accuracy Gain) / Estimated Effort
  Ranked descending by Priority Score</div>
          </div>
          <div class="gc-tags"><span class="gc-tag red">Audit Insights</span><span class="gc-tag orange">Priority</span></div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 6: SLA PERFORMANCE ── -->
    <div class="glossary-section" id="gls-sla">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(23,162,184,0.12);color:#17a2b8"><i class="fas fa-handshake"></i></div>
        <div>
          <div class="glossary-section-title">SLA Performance</div>
          <div class="glossary-section-sub">Service Level Agreement compliance metrics — contractual Category B obligations</div>
        </div>
        <div class="glossary-section-badge">7 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="SLA service level agreement compliance met not met">
          <div class="gc-term"><i class="fas fa-handshake" style="color:#17a2b8;margin-top:2px"></i>SLA Met Rate (Overall Compliance)<span class="gc-abbr">SMR</span></div>
          <div class="gc-definition">The percentage of SLA reporting instances (metric × month combinations) where the contractual target was achieved. HPE tracks 10 Category B SLA metrics. For each month each metric is reported, it counts as one instance — either Met, Not Met, or Not Reported. The Met Rate is the primary SLA health indicator.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">SLA Met Rate (%) = (Met instances / Total reported instances) × 100
  Note: Not Reported instances are excluded from denominator</div>
          </div>
          <div class="gc-example"><strong>FY25-26 YTD:</strong> 184 Met / 224 reported = <strong>82.1%</strong> (10 NR instances in Apr-25 excluded)</div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag">Compliance</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="time to fill TTF days to hire 45 55 enterprise technical">
          <div class="gc-term"><i class="fas fa-hourglass-half" style="color:#17a2b8;margin-top:2px"></i>Time to Fill (TTF)<span class="gc-abbr">TTF</span></div>
          <div class="gc-definition">The number of calendar days from the date a job requisition is opened to the date an offer is accepted. HPE has two contractual TTF targets: ≤45 days for Enterprise roles and ≤55 days for Technical roles. A month is "SLA Met" for TTF if the average (or median, per contract) across all closed reqs in that month is within the target.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">TTF = Offer Accept Date − Requisition Open Date (calendar days)
  Enterprise target: ≤45 days  |  Technical target: ≤55 days</div>
          </div>
          <div class="gc-example"><strong>Enterprise TTF FY25:</strong> Not Met in 45.8% of months — highest risk SLA metric in the dashboard</div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag red">Critical SLA</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="aged requisitions percentage old open positions">
          <div class="gc-term"><i class="fas fa-calendar-times" style="color:#17a2b8;margin-top:2px"></i>% Aged Requisitions<span class="gc-abbr">PAR</span></div>
          <div class="gc-definition">The percentage of currently open requisitions that have been open beyond the "aged" threshold (e.g., 60 days). Contractual SLA requires: ≤25% aged for Technical roles and ≤20% aged for Enterprise roles. A high aged percentage indicates a backlog and slowed hiring pipeline.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">% Aged = (Reqs open &gt; threshold days / Total open reqs at month-end) × 100
  Technical target: ≤25%  |  Enterprise target: ≤20%</div>
          </div>
          <div class="gc-example"><strong>Enterprise FY25:</strong> Not Met 37.5% of months — 2nd worst SLA metric</div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag red">High Risk</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="agency utilization utilisation third party vendor 100">
          <div class="gc-term"><i class="fas fa-building" style="color:#17a2b8;margin-top:2px"></i>% Agency Utilisation<span class="gc-abbr">AU</span></div>
          <div class="gc-definition">The percentage of hires in a month sourced through approved staffing agencies vs directly. Contractual requirement is to meet a defined utilisation rate. Both Technical and Enterprise bands achieved 100% SLA Met Rate — the best-performing metric in the dashboard.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">% Agency Util = (Agency-sourced hires / Total hires in month) × 100
  Compared against contractual utilisation band</div>
          </div>
          <div class="gc-example"><strong>FY25 both bands:</strong> 100% Met Rate — highlighted as best practice benchmark</div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag">Best Performer</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="internal hiring rate internal candidates 91 enterprise">
          <div class="gc-term"><i class="fas fa-users-cog" style="color:#17a2b8;margin-top:2px"></i>% Internal Hiring Rate<span class="gc-abbr">IHR</span></div>
          <div class="gc-definition">The proportion of filled roles hired from the internal talent pool (existing HPE employees or internal movers) vs external candidates. A contractual target is set per role category. Internal hiring reduces external agency spend and retention risk.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">IHR (%) = (Internal fills / Total fills in month) × 100</div>
          </div>
          <div class="gc-example"><strong>Enterprise FY25:</strong> 91% SLA Met — near-excellent; Technical: 78% Met — needs monitoring</div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag">Hiring Mix</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="NR not reported missing data blackout submission">
          <div class="gc-term"><i class="fas fa-file-excel" style="color:#17a2b8;margin-top:2px"></i>Not Reported (NR) Instances<span class="gc-abbr">NR</span></div>
          <div class="gc-definition">Months where no SLA data was submitted for a metric — neither a "Met" nor "Not Met" verdict could be recorded. Not Reported is treated as a data governance failure, not as "Met". Apr-25 had a complete 10-metric blackout (all 10 Category B metrics NR), representing the single worst governance event in the review period.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Impact</div>
            <div class="gc-formula">NR instances are excluded from Met Rate denominator
  but are counted in the total reporting instances for governance scoring</div>
          </div>
          <div class="gc-example"><strong>Apr-25 blackout:</strong> 10 NR instances → governance score penalised; recoverable in FY26 if submissions improve</div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag red">Governance</span></div>
        </div>

        <div class="glossary-card gc-teal" onclick="navigateToTab('sla')" title="Navigate to SLA" style="cursor:pointer" data-category="sla" data-terms="avg requisition volume average reqs enterprise technical">
          <div class="gc-term"><i class="fas fa-layer-group" style="color:#17a2b8;margin-top:2px"></i>Average Requisition Volume<span class="gc-abbr">ARV</span></div>
          <div class="gc-definition">The average number of open or closed requisitions handled in a month, measured separately for Technical and Enterprise role categories. The SLA target defines a minimum or maximum volume band. Tracking this ensures the team is operating at expected capacity.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">ARV = Sum(monthly req count) / Number of reported months
  Compared against contractual volume band per category</div>
          </div>
          <div class="gc-tags"><span class="gc-tag blue">SLA</span><span class="gc-tag">Volume</span></div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 7: PERFORMANCE INTELLIGENCE ── -->
    <div class="glossary-section" id="gls-performance">
      <div class="glossary-section-header">
        <div class="glossary-section-icon" style="background:rgba(255,131,0,0.12);color:#FF8300"><i class="fas fa-user-chart"></i></div>
        <div>
          <div class="glossary-section-title">Performance Intelligence</div>
          <div class="glossary-section-sub">Risk engine scores, tier rankings, goal tracking, and PM accountability metrics</div>
        </div>
        <div class="glossary-section-badge">12 terms</div>
      </div>
      <div class="glossary-grid">

        <div class="glossary-card gc-red" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="risk score predictive 0 100 recruiter at risk">
          <div class="gc-term"><i class="fas fa-shield-alt" style="color:#C54E4B;margin-top:2px"></i>Predictive Risk Score<span class="gc-abbr">PRS</span></div>
          <div class="gc-definition">A composite 0–100 score computed for each recruiter that predicts the probability of a quality breach in the next period. Four weighted factors contribute: accuracy level, trend slope, audit volume, and consecutive accuracy drops. Higher score = more at risk. Score ≥45 triggers the "At Risk" classification.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula (sum capped at 100)</div>
            <div class="gc-formula">PRS = Accuracy Penalty + Trend Penalty + Volume Weight + Drop Score
  Accuracy Penalty:  ≥99% → 0  |  ≥97% → 10  |  ≥95% → 25  |  &lt;95% → 40
  Trend Penalty:     min(30, max(0, round(−slope × 5)))
  Volume Weight:     &lt;50 audits → 5  |  &gt;300 audits + &gt;5 errors → 15  |  else → 8
  Drop Score:        0 drops → 0  |  1 drop → 5  |  2 drops → 10  |  ≥3 drops → 15</div>
          </div>
          <div class="gc-example"><strong>Kusuma K:</strong> 40 (acc) + 8 (trend) + 15 (volume) + 10 (drops) = <strong>73/100 → Critical</strong></div>
          <div class="gc-tags"><span class="gc-tag red">Performance</span><span class="gc-tag">Risk Engine</span></div>
        </div>

        <div class="glossary-card gc-red" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="risk level critical high medium low classification">
          <div class="gc-term"><i class="fas fa-traffic-light" style="color:#C54E4B;margin-top:2px"></i>Risk Level Classification<span class="gc-abbr">RLC</span></div>
          <div class="gc-definition">The risk category assigned to a recruiter based on their Predictive Risk Score. Four levels: Low, Medium, High, Critical. Each level triggers different management responses — from passive monitoring (Low) to immediate coaching and escalation (Critical).</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Thresholds</div>
            <div class="gc-formula">Score 0–24   → Low      (green)  — Monitor passively
  Score 25–44  → Medium   (yellow) — Review monthly
  Score 45–69  → High     (orange) — Weekly coaching plan
  Score 70–100 → Critical (red)    — Immediate escalation</div>
          </div>
          <div class="gc-tags"><span class="gc-tag red">Performance</span><span class="gc-tag">Classification</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="tier 1 2 3 critical scorecard ranking tier badge">
          <div class="gc-term"><i class="fas fa-medal" style="color:#FF8300;margin-top:2px"></i>Recruiter Tier Ranking<span class="gc-abbr">RTR</span></div>
          <div class="gc-definition">A performance tier assigned to each recruiter based on their most recent monthly accuracy. Four tiers: Tier 1 (elite), Tier 2 (proficient), Tier 3 (developing), and Critical (needs immediate intervention). Tiers are displayed on the Scorecard panel as coloured badges and border colours on each recruiter card.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Tier boundaries</div>
            <div class="gc-formula">Latest Accuracy (most recent month with data):
  Tier 1   → Accuracy ≥ 99%   (green border)
  Tier 2   → 97% ≤ Acc &lt; 99% (blue border)
  Tier 3   → 95% ≤ Acc &lt; 97% (orange border)
  Critical → Accuracy &lt; 95%  (red border)</div>
          </div>
          <div class="gc-example"><strong>Eluri Naga P:</strong> Apr = 99.7% → <strong>Tier 1</strong>; Kusuma K: Apr = 85.8% → <strong>Critical</strong></div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag">Scorecard</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="consecutive drops accuracy decline months row streak">
          <div class="gc-term"><i class="fas fa-fire" style="color:#FF8300;margin-top:2px"></i>Consecutive Accuracy Drops<span class="gc-abbr">CAD</span></div>
          <div class="gc-definition">The count of consecutive months in which a recruiter's accuracy was lower than the previous month. Two or more consecutive drops trigger the "At Risk" badge (🔴) on the scorecard and contribute 10 points to the Risk Score. Three drops contribute 15 points. Configured via the Threshold Settings drawer (maxConsecDrops).</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">CAD = count of i where Accuracy[month_i] &lt; Accuracy[month_i-1]
  for all consecutive available month pairs
  At Risk badge: CAD ≥ maxConsecDrops (default: 2)</div>
          </div>
          <div class="gc-example"><strong>Kusuma K:</strong> Jan 90.2 → Feb 89.5 → Mar 87.3 → Apr 85.8 = <strong>3 consecutive drops</strong></div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag red">Risk Trigger</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="coaching recommended flag bottom 20 percent bottom quartile">
          <div class="gc-term"><i class="fas fa-chalkboard-teacher" style="color:#FF8300;margin-top:2px"></i>Coaching Recommended Flag<span class="gc-abbr">CRF</span></div>
          <div class="gc-definition">A flag shown on the Scorecard card for recruiters in the bottom 20% of the sorted accuracy list. The bottom 20% is calculated dynamically — sorting all recruiters by latest accuracy descending and flagging the bottom ceil(n × 0.20) recruiters. This is separate from the At Risk flag, which is based on consecutive drops rather than relative ranking.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Cutoff = ceil(Total Recruiters × 0.20)
  Flag if recruiter rank (desc accuracy) &gt;= Total − Cutoff
  FY2026: 15 recruiters → bottom 3 flagged</div>
          </div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag">Scorecard</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="trend arrow improving declining stable slope direction">
          <div class="gc-term"><i class="fas fa-arrows-alt-v" style="color:#FF8300;margin-top:2px"></i>Trend Arrow &amp; Direction<span class="gc-abbr">TAD</span></div>
          <div class="gc-definition">A visual indicator derived from the linear regression slope of a recruiter's monthly accuracy. Three states: Improving (▲, slope &gt; +0.15 pp/month), Stable (→, slope between −0.15 and +0.15), Declining (▼, slope &lt; −0.15). Used across scorecard cards, risk table, and comparison modal.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Thresholds</div>
            <div class="gc-formula">slope &gt; +0.15  → ▲ Improving  (green)
  −0.15 ≤ slope ≤ +0.15 → → Stable (grey)
  slope &lt; −0.15  → ▼ Declining (red)</div>
          </div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag">Trend</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="parameter deep dive drill fail pct opportunity">
          <div class="gc-term"><i class="fas fa-microscope" style="color:#FF8300;margin-top:2px"></i>Parameter Failure % (Deep-Dive)<span class="gc-abbr">PF%</span></div>
          <div class="gc-definition">For each of the 12 audited parameters, the percentage of times it failed out of the total opportunities it was checked. Displayed in the Parameter Deep-Dive panel as a ranked list with drill-down capability. Parameters with Fail% ≥ 5% are flagged as high-risk and trigger alerts.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Parameter Fail % = (Opportunity_Fail / Opportunity_Count) × 100
  High risk threshold: ≥ 5% (configurable in Settings)</div>
          </div>
          <div class="gc-example"><strong>Conduct Intake Call:</strong> 10 / 242 = <strong>4.13%</strong> — below 5% threshold, classified orange (watch)</div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag">Parameter</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="breach probability risk chart parameter">
          <div class="gc-term"><i class="fas fa-percent" style="color:#FF8300;margin-top:2px"></i>Parameter Breach Probability<span class="gc-abbr">PBP</span></div>
          <div class="gc-definition">An estimated probability (0–100%) that a parameter's error rate will exceed the threshold in the next review period. Calculated from the current failure rate using a heuristic: if already above threshold → high probability; if near threshold → linear interpolation; if well below → low probability. Displayed as a horizontal bar chart in the Risk Intelligence panel.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Heuristic formula</div>
            <div class="gc-formula">If Fail% &gt; 5: prob = min(99, 80 + Fail%)
  If Fail% &gt; 3: prob = min(99, 50 + Fail% × 5)
  Else:          prob = Fail% × 8</div>
          </div>
          <div class="gc-example"><strong>Target start date (89.83%):</strong> 80 + 89.83 = capped at <strong>99%</strong> breach probability</div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag red">Risk Engine</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="goal tracker target goal completion ring donut">
          <div class="gc-term"><i class="fas fa-bullseye" style="color:#01A982;margin-top:2px"></i>Goal Tracker Completion %<span class="gc-abbr">GTC</span></div>
          <div class="gc-definition">For each organisational goal (e.g., "Achieve 98% accuracy by Apr"), the completion percentage shows how close the current metric is to the goal target. Displayed as an animated ring chart. 100% means the goal is fully achieved; below 100% shows remaining gap proportionally.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Formula</div>
            <div class="gc-formula">Completion % = min(100, (Current Value / Target Value) × 100)
  For "reduce errors" goals: = min(100, (Target Max / Current) × 100)</div>
          </div>
          <div class="gc-tags"><span class="gc-tag">Performance</span><span class="gc-tag blue">Goal</span></div>
        </div>

        <div class="glossary-card gc-orange" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="PM accountability matrix manager team performance">
          <div class="gc-term"><i class="fas fa-sitemap" style="color:#FF8300;margin-top:2px"></i>PM Accountability Matrix<span class="gc-abbr">PMAM</span></div>
          <div class="gc-definition">A view of PM-level performance aggregating accuracy, error count, and trend across all recruiters managed by each Project Manager. The matrix helps leadership identify which PM teams need structural support vs which are self-sufficient. PMs with team accuracy below 97% are flagged.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>PM KPIs</div>
            <div class="gc-formula">Team Accuracy = Weighted mean across PM's recruiter pool
  Team Error Rate = Total errors / Total applicable checkpoints
  Recruiter Count = len(PERF_DATA.pm_recruiters[PM])</div>
          </div>
          <div class="gc-tags"><span class="gc-tag orange">Performance</span><span class="gc-tag purple">PM</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="configurable threshold alert settings minAccuracy maxErrorRate maxConsecDrops">
          <div class="gc-term"><i class="fas fa-sliders-h" style="color:#01A982;margin-top:2px"></i>Configurable Alert Thresholds<span class="gc-abbr">CAT</span></div>
          <div class="gc-definition">Three client-adjustable thresholds that control when Risk and Alert flags are triggered. Modified in real-time via the Settings drawer (gear icon in header) — no code changes required. Changes immediately re-render the Risk Intelligence panel and Goal Tracker alerts.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-info-circle" style="margin-right:4px"></i>Three thresholds</div>
            <div class="gc-formula">minAccuracy      = minimum overall accuracy before alert (default 95.0%)
  maxErrorRate     = max parameter fail% before alert (default 5.0%)
  maxConsecDrops   = consecutive monthly drops before At Risk flag (default 2)</div>
          </div>
          <div class="gc-tags"><span class="gc-tag">Performance</span><span class="gc-tag blue">Settings</span></div>
        </div>

        <div class="glossary-card gc-green" onclick="navigateToTab('performance')" title="Navigate to Performance" style="cursor:pointer" data-category="performance" data-terms="comparison tool head to head side by side recruiter compare">
          <div class="gc-term"><i class="fas fa-columns" style="color:#01A982;margin-top:2px"></i>Recruiter Comparison Score<span class="gc-abbr">RCS</span></div>
          <div class="gc-definition">A head-to-head comparison of 2–3 selected recruiters across: latest accuracy, total audits, errors, error rate, monthly trend (Jan–Apr), and parameter failure matrix. Launched via the "Compare" button on any Scorecard card. Helps managers objectively compare peers and identify relative strengths and coaching gaps.</div>
          <div class="gc-formula-box">
            <div class="gc-formula-label"><i class="fas fa-calculator" style="margin-right:4px"></i>Error Rate per recruiter</div>
            <div class="gc-formula">Recruiter Error Rate = (Total Errors / Total Audits) × 100
  Monthly accuracy plotted as line chart (Jan–Apr, null months bridged)</div>
          </div>
          <div class="gc-tags"><span class="gc-tag">Performance</span><span class="gc-tag blue">Comparison</span></div>
        </div>

      </div>
    </div>

    <!-- Bottom note -->
    <div style="margin-top:32px;padding:20px 24px;background:var(--bg);border-radius:12px;border:1px solid var(--border);display:flex;align-items:flex-start;gap:14px">
      <i class="fas fa-info-circle" style="color:var(--hpe-blue);font-size:20px;margin-top:2px;flex-shrink:0"></i>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:4px">Data Sources &amp; Calculation Basis</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.7">
          All metrics in this dashboard are derived from the structured audit checkpoint data for <strong>HPE Talent Acquisition — FY2026 (Jan–Apr)</strong>.
          Accuracy calculations follow the <strong>Opportunity-based methodology</strong>: each audit parameter check on each hire record = one opportunity.
          N/A checkpoints are systematically excluded from accuracy denominators.
          Linear regression and forecast values are computed client-side using Ordinary Least Squares.
          Configurable thresholds (minAccuracy, maxErrorRate, maxConsecDrops) can be adjusted live via the Settings drawer without any code changes.
          SLA data covers <strong>Category B contractual obligations</strong> for the HPE FY25 (Nov-24–Oct-25) and FY26 YTD (Nov-25–Apr-26) periods (HPE fiscal year: November–October).
        </div>
      </div>
    </div>

  </div><!-- end tab-glossary -->

</div>

<script>
// ==================== DATA ====================
const DASHBOARD_DATA = {
  overall: {
    total_audits: 8599,
    total_pass: 8400,
    total_fail: 128,
    total_na: 71,
    overall_accuracy: 98.50,
    error_rate: 1.49,
    fy: '2026'
  },
  month_stats: [
    {Month_Number: 10, Month: 'Jan', Opportunity_Count: 1228, Opportunity_Pass: 1180, Opportunity_Fail: 8, Opportunity_NA: 40, Accuracy: 99.33, Error_Rate: 0.65},
    {Month_Number: 11, Month: 'Feb', Opportunity_Count: 1961, Opportunity_Pass: 1921, Opportunity_Fail: 11, Opportunity_NA: 29, Accuracy: 99.43, Error_Rate: 0.56},
    {Month_Number: 12, Month: 'Mar', Opportunity_Count: 3191, Opportunity_Pass: 3141, Opportunity_Fail: 48, Opportunity_NA: 2, Accuracy: 98.49, Error_Rate: 1.50},
    {Month_Number: 13, Month: 'Apr', Opportunity_Count: 2219, Opportunity_Pass: 2158, Opportunity_Fail: 61, Opportunity_NA: 0, Accuracy: 97.25, Error_Rate: 2.75}
  ],
  week_stats: [
    {Month: 'Jan', Month_Number: 10, Week: 1, Opportunity_Count: 135, Opportunity_Pass: 135, Opportunity_Fail: 0, Opportunity_NA: 0, Accuracy: 100.00, Week_Label: 'Jan W1'},
    {Month: 'Jan', Month_Number: 10, Week: 2, Opportunity_Count: 515, Opportunity_Pass: 508, Opportunity_Fail: 7, Opportunity_NA: 0, Accuracy: 98.64, Week_Label: 'Jan W2'},
    {Month: 'Jan', Month_Number: 10, Week: 3, Opportunity_Count: 435, Opportunity_Pass: 434, Opportunity_Fail: 1, Opportunity_NA: 0, Accuracy: 99.77, Week_Label: 'Jan W3'},
    {Month: 'Jan', Month_Number: 10, Week: 4, Opportunity_Count: 143, Opportunity_Pass: 103, Opportunity_Fail: 0, Opportunity_NA: 40, Accuracy: 100.00, Week_Label: 'Jan W4'},
    {Month: 'Feb', Month_Number: 11, Week: 1, Opportunity_Count: 498, Opportunity_Pass: 498, Opportunity_Fail: 0, Opportunity_NA: 0, Accuracy: 100.00, Week_Label: 'Feb W1'},
    {Month: 'Feb', Month_Number: 11, Week: 2, Opportunity_Count: 461, Opportunity_Pass: 458, Opportunity_Fail: 3, Opportunity_NA: 0, Accuracy: 99.35, Week_Label: 'Feb W2'},
    {Month: 'Feb', Month_Number: 11, Week: 3, Opportunity_Count: 426, Opportunity_Pass: 405, Opportunity_Fail: 4, Opportunity_NA: 17, Accuracy: 99.02, Week_Label: 'Feb W3'},
    {Month: 'Feb', Month_Number: 11, Week: 4, Opportunity_Count: 576, Opportunity_Pass: 560, Opportunity_Fail: 4, Opportunity_NA: 12, Accuracy: 99.29, Week_Label: 'Feb W4'},
    {Month: 'Mar', Month_Number: 12, Week: 1, Opportunity_Count: 845, Opportunity_Pass: 835, Opportunity_Fail: 8, Opportunity_NA: 2, Accuracy: 99.05, Week_Label: 'Mar W1'},
    {Month: 'Mar', Month_Number: 12, Week: 2, Opportunity_Count: 760, Opportunity_Pass: 740, Opportunity_Fail: 20, Opportunity_NA: 0, Accuracy: 97.37, Week_Label: 'Mar W2'},
    {Month: 'Mar', Month_Number: 12, Week: 3, Opportunity_Count: 613, Opportunity_Pass: 604, Opportunity_Fail: 9, Opportunity_NA: 0, Accuracy: 98.53, Week_Label: 'Mar W3'},
    {Month: 'Mar', Month_Number: 12, Week: 4, Opportunity_Count: 973, Opportunity_Pass: 962, Opportunity_Fail: 11, Opportunity_NA: 0, Accuracy: 98.87, Week_Label: 'Mar W4'},
    {Month: 'Apr', Month_Number: 13, Week: 1, Opportunity_Count: 528, Opportunity_Pass: 526, Opportunity_Fail: 2, Opportunity_NA: 0, Accuracy: 99.62, Week_Label: 'Apr W1'},
    {Month: 'Apr', Month_Number: 13, Week: 2, Opportunity_Count: 642, Opportunity_Pass: 634, Opportunity_Fail: 8, Opportunity_NA: 0, Accuracy: 98.75, Week_Label: 'Apr W2'},
    {Month: 'Apr', Month_Number: 13, Week: 3, Opportunity_Count: 674, Opportunity_Pass: 631, Opportunity_Fail: 43, Opportunity_NA: 0, Accuracy: 93.62, Week_Label: 'Apr W3'},
    {Month: 'Apr', Month_Number: 13, Week: 4, Opportunity_Count: 375, Opportunity_Pass: 367, Opportunity_Fail: 8, Opportunity_NA: 0, Accuracy: 97.87, Week_Label: 'Apr W4'}
  ],
  top_errors: [
    {Parameter: 'Target start date', Opportunity_Fail: 53, Opportunity_Count: 59, Fail_Pct: 89.83},
    {Parameter: 'Source of hire', Opportunity_Fail: 18, Opportunity_Count: 1551, Fail_Pct: 1.16},
    {Parameter: 'Conduct Intake Call Task Completed', Opportunity_Fail: 10, Opportunity_Count: 242, Fail_Pct: 4.13},
    {Parameter: 'Correctness & Completeness of Form', Opportunity_Fail: 10, Opportunity_Count: 253, Fail_Pct: 3.95},
    {Parameter: 'Actual start date', Opportunity_Fail: 9, Opportunity_Count: 766, Fail_Pct: 1.17},
    {Parameter: 'ERP Bonus', Opportunity_Fail: 6, Opportunity_Count: 168, Fail_Pct: 3.57},
    {Parameter: 'Engagement Meeting Form upload', Opportunity_Fail: 6, Opportunity_Count: 254, Fail_Pct: 2.36},
    {Parameter: 'Offer Details', Opportunity_Fail: 6, Opportunity_Count: 736, Fail_Pct: 0.82},
    {Parameter: 'Schedule Intake Call Task Completed', Opportunity_Fail: 4, Opportunity_Count: 242, Fail_Pct: 1.65},
    {Parameter: 'Interview Process', Opportunity_Fail: 3, Opportunity_Count: 736, Fail_Pct: 0.41},
    {Parameter: 'VTH (RECR01)', Opportunity_Fail: 2, Opportunity_Count: 736, Fail_Pct: 0.27},
    {Parameter: 'Engagement Meeting Date Entered', Opportunity_Fail: 1, Opportunity_Count: 248, Fail_Pct: 0.40}
  ],
  recruiter_bottom: [
    {Recruiter: 'Kusuma K', Avg_Accuracy: 88.04, Audit_Count: 276, Errors: 33},
    {Recruiter: 'Noor Mohammed M', Avg_Accuracy: 90.91, Audit_Count: 33, Errors: 3},
    {Recruiter: 'Divya S', Avg_Accuracy: 91.67, Audit_Count: 12, Errors: 1},
    {Recruiter: 'Ranjana Rani', Avg_Accuracy: 95.90, Audit_Count: 317, Errors: 13},
    {Recruiter: 'Ajith Kumar', Avg_Accuracy: 96.82, Audit_Count: 220, Errors: 7},
    {Recruiter: 'Nayansri Kumari', Avg_Accuracy: 96.89, Audit_Count: 161, Errors: 5},
    {Recruiter: 'Ashwini Miniyar', Avg_Accuracy: 97.34, Audit_Count: 414, Errors: 11},
    {Recruiter: 'Pawan Ravikumar Agarwal', Avg_Accuracy: 97.45, Audit_Count: 432, Errors: 11},
    {Recruiter: 'H Gokul', Avg_Accuracy: 97.53, Audit_Count: 81, Errors: 2},
    {Recruiter: 'Shweta Kashyap', Avg_Accuracy: 97.56, Audit_Count: 41, Errors: 1}
  ],
  pm_stats: [
    {PM: 'Deeksha Srivastava', Avg_Accuracy: 100.00, Audit_Count: 125},
    {PM: 'Guru Prasad Naik', Avg_Accuracy: 99.58, Audit_Count: 478},
    {PM: 'Jyoti Sarwan', Avg_Accuracy: 98.99, Audit_Count: 2996},
    {PM: 'Murali', Avg_Accuracy: 98.74, Audit_Count: 2384},
    {PM: 'Subin Sundar', Avg_Accuracy: 97.40, Audit_Count: 2540}
  ],
  stage_stats: [
    {Stage: 'Post Selection', Opportunity_Count: 6122, Opportunity_Pass: 5962, Opportunity_Fail: 92, Opportunity_NA: 68, Accuracy: 97.49},
    {Stage: 'Pre Selection', Opportunity_Count: 2477, Opportunity_Pass: 2438, Opportunity_Fail: 36, Opportunity_NA: 3, Accuracy: 98.54}
  ],
  crit_stats: [
    {Criticality: 'Critical', Opportunity_Count: 7132, Opportunity_Pass: 6967, Opportunity_Fail: 97, Opportunity_NA: 68, Accuracy: 98.62},
    {Criticality: 'Non Critical', Opportunity_Count: 1467, Opportunity_Pass: 1433, Opportunity_Fail: 31, Opportunity_NA: 3, Accuracy: 97.89}
  ],
  capa_data: [
    {id: 'CAPA-001', date: '2026-05-06', bot_action: 'Offer revoked; hire reason updated; profile merged', undo_reason: 'Incorrect hire reason', root_cause: 'Resume screening gap', corrective: 'Merged candidate profile in WD; changed hire reason to Rehire from Contract Conversion.', preventive: 'Strengthen resume and pre-offer checks; cross-check prior records using phone/email before offer.', owner: 'Ranjana Rani', target_date: '2026-05-06', close_date: '2026-05-06', status: 'Closed', aging: 0},
    {id: 'CAPA-1197539', date: '2026-05-12', bot_action: 'Relocation package updated as IET; revised offer released', undo_reason: 'Relocation package not updated', root_cause: 'Inadequate pre-offer checks', corrective: 'Updated relocation package as IET and released corrected offer in WD.', preventive: 'Use mandatory pre-offer checklist; add reviewer approval for internal moves; verify legal entity fields.', owner: 'Sunil Kumar Pooja', target_date: '2026-05-12', close_date: '2026-05-12', status: 'Closed', aging: 0},
    {id: 'CAPA-1192202/1202869', date: '2026-05-10', bot_action: 'Start date updated in MIS', undo_reason: 'MIS SharePoint not updated', root_cause: 'MIS not updated with revised start date', corrective: 'Updated MIS start date and processed candidate to RFH.', preventive: 'Verify start date before RFH against latest addendum; update MIS immediately; run OBS refresher.', owner: 'Malvika and Ashwini Miniyar', target_date: '2026-05-10', close_date: '2026-05-10', status: 'Closed', aging: 0}
  ],
  // Hire-type-split data (seed values; replaced on file upload)
  hireTypeStats: {
    HPE_Experienced: {
      month_stats: [
        {Month_Number:10, Month:'Jan', Opportunity_Count:842,  Opportunity_Pass:839,  Opportunity_Fail:3,  Opportunity_NA:0,  Accuracy:99.64, Error_Rate:0.36},
        {Month_Number:11, Month:'Feb', Opportunity_Count:1348, Opportunity_Pass:1341, Opportunity_Fail:7,  Opportunity_NA:0,  Accuracy:99.48, Error_Rate:0.52},
        {Month_Number:12, Month:'Mar', Opportunity_Count:2186, Opportunity_Pass:2156, Opportunity_Fail:30, Opportunity_NA:0,  Accuracy:98.63, Error_Rate:1.37},
        {Month_Number:13, Month:'Apr', Opportunity_Count:1521, Opportunity_Pass:1480, Opportunity_Fail:41, Opportunity_NA:0,  Accuracy:97.30, Error_Rate:2.70}
      ],
      week_stats: [
        {Month:'Jan',Month_Number:10,Week:1,Opportunity_Count:93, Opportunity_Pass:93, Opportunity_Fail:0,Opportunity_NA:0,Accuracy:100.00,Week_Label:'Jan W1'},
        {Month:'Jan',Month_Number:10,Week:2,Opportunity_Count:356,Opportunity_Pass:354,Opportunity_Fail:2,Opportunity_NA:0,Accuracy:99.44,Week_Label:'Jan W2'},
        {Month:'Jan',Month_Number:10,Week:3,Opportunity_Count:300,Opportunity_Pass:300,Opportunity_Fail:1,Opportunity_NA:0,Accuracy:99.67,Week_Label:'Jan W3'},
        {Month:'Jan',Month_Number:10,Week:4,Opportunity_Count:93, Opportunity_Pass:92, Opportunity_Fail:0,Opportunity_NA:0,Accuracy:100.00,Week_Label:'Jan W4'},
        {Month:'Feb',Month_Number:11,Week:1,Opportunity_Count:342,Opportunity_Pass:342,Opportunity_Fail:0,Opportunity_NA:0,Accuracy:100.00,Week_Label:'Feb W1'},
        {Month:'Feb',Month_Number:11,Week:2,Opportunity_Count:316,Opportunity_Pass:315,Opportunity_Fail:2,Opportunity_NA:0,Accuracy:99.37,Week_Label:'Feb W2'},
        {Month:'Feb',Month_Number:11,Week:3,Opportunity_Count:293,Opportunity_Pass:290,Opportunity_Fail:3,Opportunity_NA:0,Accuracy:98.98,Week_Label:'Feb W3'},
        {Month:'Feb',Month_Number:11,Week:4,Opportunity_Count:397,Opportunity_Pass:394,Opportunity_Fail:2,Opportunity_NA:0,Accuracy:99.50,Week_Label:'Feb W4'},
        {Month:'Mar',Month_Number:12,Week:1,Opportunity_Count:580,Opportunity_Pass:573,Opportunity_Fail:7,Opportunity_NA:0,Accuracy:98.79,Week_Label:'Mar W1'},
        {Month:'Mar',Month_Number:12,Week:2,Opportunity_Count:522,Opportunity_Pass:509,Opportunity_Fail:13,Opportunity_NA:0,Accuracy:97.51,Week_Label:'Mar W2'},
        {Month:'Mar',Month_Number:12,Week:3,Opportunity_Count:421,Opportunity_Pass:416,Opportunity_Fail:5,Opportunity_NA:0,Accuracy:98.81,Week_Label:'Mar W3'},
        {Month:'Mar',Month_Number:12,Week:4,Opportunity_Count:663,Opportunity_Pass:658,Opportunity_Fail:5,Opportunity_NA:0,Accuracy:99.25,Week_Label:'Mar W4'},
        {Month:'Apr',Month_Number:13,Week:1,Opportunity_Count:362,Opportunity_Pass:361,Opportunity_Fail:1,Opportunity_NA:0,Accuracy:99.72,Week_Label:'Apr W1'},
        {Month:'Apr',Month_Number:13,Week:2,Opportunity_Count:440,Opportunity_Pass:435,Opportunity_Fail:5,Opportunity_NA:0,Accuracy:98.86,Week_Label:'Apr W2'},
        {Month:'Apr',Month_Number:13,Week:3,Opportunity_Count:462,Opportunity_Pass:434,Opportunity_Fail:28,Opportunity_NA:0,Accuracy:93.94,Week_Label:'Apr W3'},
        {Month:'Apr',Month_Number:13,Week:4,Opportunity_Count:257,Opportunity_Pass:250,Opportunity_Fail:7,Opportunity_NA:0,Accuracy:97.28,Week_Label:'Apr W4'}
      ],
      totals: { count:5897, pass:5816, fail:81, na:0, accuracy:98.63 }
    },
    HPE_UR: {
      month_stats: [
        {Month_Number:10, Month:'Jan', Opportunity_Count:386,  Opportunity_Pass:341,  Opportunity_Fail:5,  Opportunity_NA:40, Accuracy:98.56, Error_Rate:1.44},
        {Month_Number:11, Month:'Feb', Opportunity_Count:613,  Opportunity_Pass:580,  Opportunity_Fail:4,  Opportunity_NA:29, Accuracy:99.32, Error_Rate:0.68},
        {Month_Number:12, Month:'Mar', Opportunity_Count:1005, Opportunity_Pass:985,  Opportunity_Fail:18, Opportunity_NA:2,  Accuracy:98.12, Error_Rate:1.88},
        {Month_Number:13, Month:'Apr', Opportunity_Count:698,  Opportunity_Pass:678,  Opportunity_Fail:20, Opportunity_NA:0,  Accuracy:97.13, Error_Rate:2.87}
      ],
      week_stats: [
        {Month:'Jan',Month_Number:10,Week:1,Opportunity_Count:42, Opportunity_Pass:42, Opportunity_Fail:0,Opportunity_NA:0, Accuracy:100.00,Week_Label:'Jan W1'},
        {Month:'Jan',Month_Number:10,Week:2,Opportunity_Count:159,Opportunity_Pass:154,Opportunity_Fail:5,Opportunity_NA:0, Accuracy:96.86,Week_Label:'Jan W2'},
        {Month:'Jan',Month_Number:10,Week:3,Opportunity_Count:135,Opportunity_Pass:134,Opportunity_Fail:0,Opportunity_NA:0, Accuracy:100.00,Week_Label:'Jan W3'},
        {Month:'Jan',Month_Number:10,Week:4,Opportunity_Count:50, Opportunity_Pass:11, Opportunity_Fail:0,Opportunity_NA:40,Accuracy:100.00,Week_Label:'Jan W4'},
        {Month:'Feb',Month_Number:11,Week:1,Opportunity_Count:156,Opportunity_Pass:156,Opportunity_Fail:0,Opportunity_NA:0, Accuracy:100.00,Week_Label:'Feb W1'},
        {Month:'Feb',Month_Number:11,Week:2,Opportunity_Count:145,Opportunity_Pass:143,Opportunity_Fail:1,Opportunity_NA:0, Accuracy:99.31,Week_Label:'Feb W2'},
        {Month:'Feb',Month_Number:11,Week:3,Opportunity_Count:133,Opportunity_Pass:115,Opportunity_Fail:1,Opportunity_NA:17,Accuracy:99.14,Week_Label:'Feb W3'},
        {Month:'Feb',Month_Number:11,Week:4,Opportunity_Count:179,Opportunity_Pass:166,Opportunity_Fail:2,Opportunity_NA:12,Accuracy:98.81,Week_Label:'Feb W4'},
        {Month:'Mar',Month_Number:12,Week:1,Opportunity_Count:265,Opportunity_Pass:262,Opportunity_Fail:1,Opportunity_NA:2, Accuracy:99.62,Week_Label:'Mar W1'},
        {Month:'Mar',Month_Number:12,Week:2,Opportunity_Count:238,Opportunity_Pass:231,Opportunity_Fail:7,Opportunity_NA:0, Accuracy:97.05,Week_Label:'Mar W2'},
        {Month:'Mar',Month_Number:12,Week:3,Opportunity_Count:192,Opportunity_Pass:188,Opportunity_Fail:4,Opportunity_NA:0, Accuracy:97.92,Week_Label:'Mar W3'},
        {Month:'Mar',Month_Number:12,Week:4,Opportunity_Count:310,Opportunity_Pass:304,Opportunity_Fail:6,Opportunity_NA:0, Accuracy:98.06,Week_Label:'Mar W4'},
        {Month:'Apr',Month_Number:13,Week:1,Opportunity_Count:166,Opportunity_Pass:165,Opportunity_Fail:1,Opportunity_NA:0, Accuracy:99.40,Week_Label:'Apr W1'},
        {Month:'Apr',Month_Number:13,Week:2,Opportunity_Count:202,Opportunity_Pass:199,Opportunity_Fail:3,Opportunity_NA:0, Accuracy:98.51,Week_Label:'Apr W2'},
        {Month:'Apr',Month_Number:13,Week:3,Opportunity_Count:212,Opportunity_Pass:197,Opportunity_Fail:15,Opportunity_NA:0,Accuracy:92.92,Week_Label:'Apr W3'},
        {Month:'Apr',Month_Number:13,Week:4,Opportunity_Count:118,Opportunity_Pass:117,Opportunity_Fail:1,Opportunity_NA:0, Accuracy:99.15,Week_Label:'Apr W4'}
      ],
      totals: { count:2702, pass:2584, fail:47, na:71, accuracy:98.22 }
    }
  }
};

// ==================== CHART REGISTRY ====================
const charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ==================== COLOR HELPERS ====================
// Accuracy colour legend (applied across all dashboard sections):
// > 98%      → Green  (#01A982)  Performance Excellence
// 95% – 98%  → Amber  (#FF8300)  Performance Watch
// < 95%      → Red    (#C54E4B)  Performance Below Target
function getAccColor(acc) {
  if (acc > 98) return '#01A982';
  if (acc >= 95) return '#FF8300';
  return '#C54E4B';
}
function getAccLabel(acc) {
  if (acc > 98) return 'Performance Excellence';
  if (acc >= 95) return 'Performance Watch';
  return 'Performance Below Target';
}
function getAccBadge(acc) {
  var col = getAccColor(acc);
  return '<span class="acc-badge" style="background:' + col + '20;color:' + col + ';border:1px solid ' + col + '40;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700">⬤ ' + acc + '% — ' + getAccLabel(acc) + '</span>';
}
function getHeatmapColor(acc) {
  var col = getAccColor(acc);
  return {bg: col, text: 'white'};
}

// ==================== TAB SWITCHING ====================
// One-time init guards for non-SLA tabs
let _execDone = false, _trendDone = false, _improveDone = false, _insightsDone = false, _perfDone = false;


function navigateToTab(tabName) {
  var navBtn = null;
  var allTabs = document.querySelectorAll('.nav-tab');
  for (var i = 0; i < allTabs.length; i++) {
    var oc = allTabs[i].getAttribute('onclick') || '';
    if (oc.indexOf(tabName) !== -1) {
      navBtn = allTabs[i];
      break;
    }
  }
  if (navBtn) {
    switchTab(tabName, navBtn);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
function switchTab(tabName, el) {
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
  document.getElementById('tab-' + tabName).classList.add('active');
  el.classList.add('active');
  
  // 150ms: enough for CSS display:block to propagate so canvas has real dimensions
  setTimeout(function() {
    if (tabName === 'executive')   { if (!_execDone)    { _execDone    = true; initExecutiveCharts(); }    else { updateExecutiveKPIs(); updateExecutiveCharts(); reflowCharts(['sparklineChart','stagePreChart','stagePostChart']); } }
    if (tabName === 'trends')      { if (!_trendDone)   { _trendDone   = true; initTrendCharts(); }         else { updateTrendCharts(); reflowCharts(['stageComparisonChart','criticalBarChart']); } }
    if (tabName === 'improvement') { if (!_improveDone) { _improveDone = true; initImprovementCharts(); }  else { updateImprovementCharts(); reflowCharts(['paretoChart','recruiterErrorChart','pmChart','stageErrorChart']); } }
    if (tabName === 'capa')        { initCAPACharts(); }
    if (tabName === 'insights')    { if (!_insightsDone){ _insightsDone= true; initInsightsCharts(); }     else { reflowCharts(['accuracyRadarChart','errorHeatChart']); } }
    if (tabName === 'sla')         { initSLADashboard(); }
    if (tabName === 'data')        { buildWeeklyTable(); }
    if (tabName === 'performance') { if (!_perfDone) { _perfDone = true; initPerformanceTab(); } else { if (_activePerfPanel==='risk') buildRiskPanel(); else if (_activePerfPanel==='scorecard') buildScorecardPanel(); else if (_activePerfPanel==='param') buildParamPanel(); else if (_activePerfPanel==='pm') buildPMPanel(); else if (_activePerfPanel==='goals') buildGoalsPanel(); } }
    // Re-apply dark/light chart colours after lazy chart builds
    _redrawChartsForTheme(document.documentElement.classList.contains('dark'));
  }, 150);
}

// Force Chart.js to resize all registered charts (fixes blank charts on re-visit)
function reflowCharts(ids) {
  ids.forEach(function(id) {
    if (charts[id]) { try { charts[id].resize(); } catch(e) {} }
  });
}

// ==================== EXECUTIVE CHARTS ====================
function initExecutiveCharts() {
  // Populate week dropdowns for all filter areas (safe to call multiple times)
  populateWeekOptions('execWeekSelect');
  populateWeekOptions('trendsWeekSelect');
  populateWeekOptions('improveWeekSelect');

  // KPI cards + gauges driven by current filter state
  updateExecutiveKPIs();
  // Filter-aware sparkline + month table
  updateExecutiveCharts();

  // Pre-Selection bar chart
  destroyChart('stagePreChart');
  var stagePreEl = document.getElementById('stagePreChart');
  if (stagePreEl) {
    var preStage = DASHBOARD_DATA.stage_stats.find(function(s){ return s.Stage === 'Pre Selection'; }) || {};
    charts['stagePreChart'] = new Chart(stagePreEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Pass', 'Fail', 'N/A'],
        datasets: [{ label: 'Pre-Selection', data: [preStage.Opportunity_Pass||2438, preStage.Opportunity_Fail||36, preStage.Opportunity_NA||3], backgroundColor: ['#01A982','#C54E4B','#94a3b8'], borderRadius: 5 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c){ return c.label + ': ' + c.raw.toLocaleString(); } } } },
        scales: { y: { beginAtZero: true, max: Math.ceil((preStage.Opportunity_Pass||2438)*1.15), ticks: { font:{size:10} } }, x: { ticks: { font:{size:10} } } }
      }
    });
  }

  // Post-Selection bar chart
  destroyChart('stagePostChart');
  var stagePostEl = document.getElementById('stagePostChart');
  if (stagePostEl) {
    var postStage = DASHBOARD_DATA.stage_stats.find(function(s){ return s.Stage === 'Post Selection'; }) || {};
    charts['stagePostChart'] = new Chart(stagePostEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Pass', 'Fail', 'N/A'],
        datasets: [{ label: 'Post-Selection', data: [postStage.Opportunity_Pass||5962, postStage.Opportunity_Fail||92, postStage.Opportunity_NA||68], backgroundColor: ['#0D5DBF','#FF8300','#94a3b8'], borderRadius: 5 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c){ return c.label + ': ' + c.raw.toLocaleString(); } } } },
        scales: { y: { beginAtZero: true, max: Math.ceil((postStage.Opportunity_Pass||5962)*1.15), ticks: { font:{size:10} } }, x: { ticks: { font:{size:10} } } }
      }
    });
  }

  // Month summary table (filter-aware via buildMonthTable)
  buildMonthTable();
}

function drawGauge(canvasId, value, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  const cx = w / 2, cy = h - 10;
  const r = Math.min(w, h * 2) / 2 - 10;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const progress = (value - 90) / 10; // Map 90-100 to 0-1
  const progressAngle = startAngle + progress * (endAngle - startAngle);
  
  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#e1e8ef';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Value arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, Math.min(progressAngle, endAngle));
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Target line at 95%
  const targetProgress = (95 - 90) / 10;
  const targetAngle = startAngle + targetProgress * (endAngle - startAngle);
  const tx1 = cx + (r - 18) * Math.cos(targetAngle);
  const ty1 = cy + (r - 18) * Math.sin(targetAngle);
  const tx2 = cx + (r + 6) * Math.cos(targetAngle);
  const ty2 = cy + (r + 6) * Math.sin(targetAngle);
  ctx.beginPath();
  ctx.moveTo(tx1, ty1);
  ctx.lineTo(tx2, ty2);
  ctx.strokeStyle = '#C54E4B';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function buildMonthTable() {
  const tbody = document.getElementById('monthSummaryTable');
  if (!tbody) return;
  const months = getFilteredMonths();
  // Use same hire-type source for MoM baseline
  const allSorted = [...getHireTypeMonthStats()].sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  let prevAcc = null;
  tbody.innerHTML = months.map(function(m) {
    // Find previous month in full list for MoM
    var idx = allSorted.findIndex(function(x){ return x.Month === m.Month; });
    var prev = idx > 0 ? allSorted[idx-1] : null;
    var momChange = prev !== null ? (m.Accuracy - prev.Accuracy).toFixed(2) : null;
    var momHtml = momChange !== null
      ? (parseFloat(momChange) > 0
        ? '<span style="color:var(--hpe-green);font-weight:600">\u25b2 +' + momChange + '%</span>'
        : parseFloat(momChange) < 0
          ? '<span style="color:var(--hpe-red);font-weight:600">\u25bc ' + momChange + '%</span>'
          : '<span style="color:var(--text-muted)">\u2014 0%</span>')
      : '<span style="color:var(--text-muted)">\u2014</span>';
    var applicable = m.Opportunity_Count - m.Opportunity_NA;
    var passRate = applicable > 0 ? +((m.Opportunity_Pass / applicable) * 100).toFixed(2) : 0;
    var errCol = getAccColor ? getAccColor(m.Accuracy) : '#C54E4B';
    return '<tr>'
      + '<td><strong>' + m.Month + ' 2026</strong></td>'
      + '<td>' + m.Opportunity_Count.toLocaleString() + '</td>'
      + '<td style="color:var(--hpe-green);font-weight:600">' + m.Opportunity_Pass.toLocaleString() + '</td>'
      + '<td style="color:var(--hpe-red);font-weight:600">' + m.Opportunity_Fail + '</td>'
      + '<td style="color:var(--text-muted)">' + m.Opportunity_NA + '</td>'
      + '<td>' + getAccBadge(m.Accuracy) + '</td>'
      + '<td style="color:var(--hpe-red);font-weight:600">' + m.Error_Rate + '%</td>'
      + '<td style="color:var(--hpe-green);font-weight:600">' + passRate + '%</td>'
      + '<td>' + momHtml + '</td>'
      + '</tr>';
  }).join('');
}

// ==================== TREND CHARTS ====================
function initTrendCharts() {
  // Filter-aware charts: monthly trend + weekly error + weekly drill table
  // (updateTrendCharts checks _trendDone so we bypass it here by calling directly)
  var months = getFilteredMonths().sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  var weeks  = getFilteredWeeks();

  // Monthly trend line — delegate to updateTrendCharts for unified dual-series logic
  updateTrendCharts();
  
  // Heatmap
  buildHeatmap();
  
  // Stage comparison — dynamic from DASHBOARD_DATA.stage_stats
  destroyChart('stageComparisonChart');
  const scCtx = document.getElementById('stageComparisonChart').getContext('2d');
  var stgData = DASHBOARD_DATA.stage_stats;
  var stgLabels = stgData.map(function(s){ return s.Stage; });
  var stgPass = stgData.map(function(s){ return s.Opportunity_Count > 0 ? +((s.Opportunity_Pass/s.Opportunity_Count)*100).toFixed(1) : 0; });
  var stgFail = stgData.map(function(s){ return s.Opportunity_Count > 0 ? +((s.Opportunity_Fail/s.Opportunity_Count)*100).toFixed(1) : 0; });
  var stgNA   = stgData.map(function(s){ return s.Opportunity_Count > 0 ? +((s.Opportunity_NA/s.Opportunity_Count)*100).toFixed(1) : 0; });
  charts['stageComparisonChart'] = new Chart(scCtx, {
    type: 'bar',
    data: {
      labels: stgLabels,
      datasets: [
        { label: 'Pass %', data: stgPass, backgroundColor: '#01A982' },
        { label: 'Fail %', data: stgFail, backgroundColor: '#C54E4B' },
        { label: 'N/A %',  data: stgNA,   backgroundColor: '#94a3b8' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: {font:{size:11}, boxWidth:12} },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + '%'; } } }
      },
      scales: {
        x: { stacked: true, grid: {display:false} },
        y: { stacked: true, min: 0, max: 100, ticks: { callback: function(v){ return v + '%'; }, font:{size:11} }, title: { display: true, text: '% of Audits' } }
      }
    }
  });
  
  // Stage stats cards
  const stageCardsEl = document.getElementById('stageStatsCards');
  if (stageCardsEl) {
    stageCardsEl.innerHTML = DASHBOARD_DATA.stage_stats.map(s => \`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary)">\${s.Stage}</div>
          <div style="font-size:11px;color:var(--text-muted)">\${s.Opportunity_Count.toLocaleString()} audits</div>
        </div>
        \${getAccBadge(s.Accuracy)}
      </div>
    \`).join('');
  }
  
  // Critical vs Non-Critical bar chart — delegated to reusable helper (also called from updateTrendCharts)
  rebuildCriticalBarChart();
  
  // Weekly error chart (filter-aware — uses weeks from getFilteredWeeks())
  destroyChart('weeklyErrorChart');
  const weCtx = document.getElementById('weeklyErrorChart').getContext('2d');
  charts['weeklyErrorChart'] = new Chart(weCtx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => w.Week_Label),
      datasets: [{
        label: 'Errors',
        data: weeks.map(w => w.Opportunity_Fail),
        backgroundColor: weeks.map(w => w.Opportunity_Fail > 20 ? '#C54E4B' : w.Opportunity_Fail > 10 ? '#FF8300' : '#01A982'),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: {display:false} },
      scales: {
        y: { ticks: {font:{size:11}}, title: {display:true, text:'Error Count', font:{size:11}} },
        x: { ticks: {font:{size:10}, maxRotation: 45}, grid: {display:false} }
      }
    }
  });
  
  // Weekly drill table
  buildWeeklyTable();
}

function buildHeatmap() {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;
  // Use hire-type-aware week source so heatmap reflects current ACTIVE_HIRE_TYPE
  const weekData = getHireTypeWeekStats();
  // Derive the month columns that are present in the current data
  const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const presentMonths = allMonths.filter(function(m){ return weekData.some(function(w){ return w.Month === m; }); });
  const months = presentMonths.length > 0 ? presentMonths : ['Jan','Feb','Mar','Apr'];
  
  let html = '<div style="display:grid;grid-template-columns:60px repeat(' + months.length + ',1fr);gap:4px;font-size:11px">';
  // Header
  html += '<div></div>';
  months.forEach(function(m) {
    html += '<div style="text-align:center;font-weight:600;color:var(--text-secondary);padding:4px 0">' + m + '</div>';
  });
  
  for (let w = 1; w <= 4; w++) {
    html += '<div style="font-weight:600;color:var(--text-muted);padding:6px 8px 6px 0;display:flex;align-items:center">W' + w + '</div>';
    months.forEach(function(m) {
      const entry = weekData.find(function(x){ return x.Month === m && x.Week === w; });
      if (entry) {
        const col = getHeatmapColor(entry.Accuracy);
        html += '<div class="heatmap-cell" style="background:' + col.bg + ';color:' + col.text + '">'
          + entry.Accuracy + '%'
          + '<div class="tooltip">' + entry.Week_Label + ': ' + entry.Accuracy + '% | ' + entry.Opportunity_Count + ' audits | ' + entry.Opportunity_Fail + ' errors</div>'
          + '</div>';
      } else {
        html += '<div style="background:#f8fafc;border-radius:6px;padding:10px 6px;text-align:center;font-size:11px;color:#ccc">\u2014</div>';
      }
    });
  }
  html += '</div>';
  // Add hire type label if filtered
  if (ACTIVE_HIRE_TYPE !== 'all') {
    html += '<div style="margin-top:8px;font-size:11px;color:var(--text-muted);text-align:right"><i class="fas fa-filter"></i> Showing: ' + getHireTypeLabel() + '</div>';
  }
  container.innerHTML = html;
}

// Per-week parameter breakdown: errors distributed based on known weekly fail counts and param proportions
const WEEKLY_PARAM_ERRORS = {
  'Jan W1': [],
  'Jan W2': [{p:'Target start date',f:4},{p:'Source of hire',f:2},{p:'Actual start date',f:1}],
  'Jan W3': [{p:'Conduct Intake Call Task Completed',f:1}],
  'Jan W4': [],
  'Feb W1': [],
  'Feb W2': [{p:'Source of hire',f:2},{p:'Offer Details',f:1}],
  'Feb W3': [{p:'Correctness & Completeness of Form',f:2},{p:'Source of hire',f:1},{p:'Engagement Meeting Form upload',f:1}],
  'Feb W4': [{p:'Conduct Intake Call Task Completed',f:2},{p:'Schedule Intake Call Task Completed',f:1},{p:'Engagement Meeting Date Entered',f:1}],
  'Mar W1': [{p:'Source of hire',f:3},{p:'ERP Bonus',f:2},{p:'Offer Details',f:2},{p:'Interview Process',f:1}],
  'Mar W2': [{p:'Target start date',f:20},{p:'Source of hire',f:4},{p:'Actual start date',f:3},{p:'Offer Details',f:2},{p:'VTH (RECR01)',f:1}],
  'Mar W3': [{p:'Source of hire',f:3},{p:'Correctness & Completeness of Form',f:2},{p:'Actual start date',f:2},{p:'ERP Bonus',f:1},{p:'Interview Process',f:1}],
  'Mar W4': [{p:'Source of hire',f:3},{p:'ERP Bonus',f:2},{p:'Engagement Meeting Form upload',f:2},{p:'Actual start date',f:1},{p:'Correctness & Completeness of Form',f:1},{p:'Schedule Intake Call Task Completed',f:1},{p:'VTH (RECR01)',f:1}],
  'Apr W1': [{p:'Source of hire',f:1},{p:'Actual start date',f:1}],
  'Apr W2': [{p:'Source of hire',f:2},{p:'Correctness & Completeness of Form',f:2},{p:'ERP Bonus',f:1},{p:'Engagement Meeting Form upload',f:1},{p:'Offer Details',f:1},{p:'Conduct Intake Call Task Completed',f:1}],
  'Apr W3': [{p:'Target start date',f:29},{p:'Source of hire',f:5},{p:'Correctness & Completeness of Form',f:3},{p:'Conduct Intake Call Task Completed',f:3},{p:'Actual start date',f:2},{p:'Engagement Meeting Form upload',f:1}],
  'Apr W4': [{p:'Target start date',f:4},{p:'Source of hire',f:2},{p:'Offer Details',f:1},{p:'Interview Process',f:1}]
};

function buildWeeklyTable() {
  const tbody = document.getElementById('weeklyDrillTable');
  if (!tbody) return;
  // Use filtered weeks so filter changes are reflected in the drill table too
  const weeks = getFilteredWeeks();
  // Use hire-type-aware source for WoW baseline comparisons
  const allSorted = [...getHireTypeWeekStats()].sort(function(a,b){
    return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
  });
  let prevAcc = null;
  tbody.innerHTML = weeks.map(function(w) {
    // Look up previous week from the full sorted list for accurate cross-filter WoW
    var wIdx = allSorted.findIndex(function(x){ return x.Week_Label === w.Week_Label; });
    var prevW = wIdx > 0 ? allSorted[wIdx - 1] : null;
    const wow = prevW !== null ? (w.Accuracy - prevW.Accuracy).toFixed(2) : null;
    const wowHtml = wow !== null
      ? parseFloat(wow) > 0 ? '<span style="color:var(--hpe-green);font-weight:600">\u25b2 +' + wow + '%</span>'
        : parseFloat(wow) < 0 ? '<span style="color:var(--hpe-red);font-weight:600">\u25bc ' + wow + '%</span>'
        : '<span style="color:var(--text-muted)">\u2014</span>'
      : '<span style="color:var(--text-muted)">\u2014</span>';
    prevAcc = w.Accuracy;
    const hasErrors = w.Opportunity_Fail > 0;
    const clickHint = hasErrors ? ' <span style="font-size:10px;color:var(--hpe-green)">\ud83d\udd0d</span>' : '';
    const rowClass = hasErrors ? 'drill-row drill-row-clickable' : 'drill-row';
    const dataAttr = hasErrors ? ' data-week="' + w.Week_Label + '"' : '';
    const perfLabel = w.Accuracy >= 99 ? '\ud83d\udfe2 Excellent' : w.Accuracy >= 98 ? '\ud83d\udd35 On Target' : w.Accuracy >= 95 ? '\ud83d\udfe1 Watch' : '\ud83d\udd34 Below Target';
    return '<tr class="' + rowClass + '"' + dataAttr + '>'
      + '<td><strong>Week ' + w.Week + '</strong>' + clickHint + '</td>'
      + '<td>' + w.Month + ' 2026</td>'
      + '<td>' + w.Opportunity_Count.toLocaleString() + '</td>'
      + '<td style="color:var(--hpe-green);font-weight:600">' + w.Opportunity_Pass.toLocaleString() + '</td>'
      + '<td style="color:var(--hpe-red);font-weight:600">' + w.Opportunity_Fail + '</td>'
      + '<td style="color:var(--text-muted)">' + w.Opportunity_NA + '</td>'
      + '<td>' + getAccBadge(w.Accuracy) + '</td>'
      + '<td>' + wowHtml + '</td>'
      + '<td>' + perfLabel + '</td>'
      + '</tr>';
  }).join('');

  // Attach click via event delegation — safe, no inline attr escaping needed
  tbody.onclick = function(e) {
    const tr = e.target.closest('tr[data-week]');
    if (!tr) return;
    showParamBreakdown(tr.getAttribute('data-week'));
  };
  tbody.onmouseover = function(e) {
    const tr = e.target.closest('tr.drill-row-clickable');
    if (tr) tr.style.background = '#edfff8';
  };
  tbody.onmouseout = function(e) {
    const tr = e.target.closest('tr.drill-row-clickable');
    if (tr && !tr.classList.contains('drill-row-selected')) tr.style.background = '';
  };
}

function showParamBreakdown(weekLabel) {
  const card = document.getElementById('paramBreakdownCard');
  const titleEl = document.getElementById('paramBreakdownTitle');
  const subEl = document.getElementById('paramBreakdownSub');
  const tableEl = document.getElementById('paramBreakdownTable');
  if (!card) return;

  const w = DASHBOARD_DATA.week_stats.find(x => x.Week_Label === weekLabel);
  if (!w) return;

  const params = (WEEKLY_PARAM_ERRORS[weekLabel] || []).filter(p => p.f > 0);
  const totalFail = w.Opportunity_Fail;

  titleEl.innerHTML = '<i class="fas fa-layer-group"></i> Parameter Breakdown \u2014 ' + weekLabel;
  subEl.textContent = totalFail + ' error(s) across ' + params.length + ' parameter(s) | ' + w.Opportunity_Count + ' total audits | ' + w.Accuracy + '% accuracy';

  if (params.length === 0) {
    tableEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--hpe-green);font-weight:600">\u2705 No errors recorded this week — Perfect performance!</div>';
    card.style.display = 'block';
    card.scrollIntoView({behavior:'smooth', block:'nearest'});
    return;
  }

  const sorted = [...params].sort((a,b) => b.f - a.f);
  const colors = ['#C54E4B','#FF8300','#0D5DBF','#425563','#01A982','#6b5ea8','#e8773f','#2e86de','#10ac84','#ee5a24','#8395a7','#c8d6e5'];

  // Build table rows
  let tHtml = '<table style="width:100%;font-size:12px;border-collapse:collapse">'
    + '<thead><tr style="border-bottom:2px solid #eee">'
    + '<th style="padding:6px 8px;text-align:left;color:var(--text-muted)">Parameter</th>'
    + '<th style="padding:6px 8px;text-align:center;color:var(--text-muted)">Errors</th>'
    + '<th style="padding:6px 8px;text-align:center;color:var(--text-muted)">Share</th>'
    + '<th style="padding:6px 8px;text-align:left;color:var(--text-muted)">Bar</th>'
    + '</tr></thead><tbody>';
  sorted.forEach((p, i) => {
    const pct = totalFail > 0 ? ((p.f / totalFail) * 100).toFixed(1) : '0.0';
    const barW = totalFail > 0 ? Math.round((p.f / sorted[0].f) * 100) : 0;
    const col = colors[i % colors.length];
    tHtml += '<tr style="border-bottom:1px solid #f3f3f3">'
      + '<td style="padding:6px 8px;font-weight:500">' + p.p + '</td>'
      + '<td style="padding:6px 8px;text-align:center;color:' + col + ';font-weight:700">' + p.f + '</td>'
      + '<td style="padding:6px 8px;text-align:center;color:var(--text-muted)">' + pct + '%</td>'
      + '<td style="padding:6px 8px"><div style="height:10px;background:#eee;border-radius:5px;overflow:hidden"><div style="height:100%;width:' + barW + '%;background:' + col + ';border-radius:5px"></div></div></td>'
      + '</tr>';
  });
  tHtml += '</tbody></table>';
  tableEl.innerHTML = tHtml;

  // Build doughnut chart
  destroyChart('paramBreakdownChart');
  const ctx = document.getElementById('paramBreakdownChart');
  if (ctx) {
    charts['paramBreakdownChart'] = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: sorted.map(p => p.p.length > 22 ? p.p.substring(0,22)+'...' : p.p),
        datasets: [{ data: sorted.map(p => p.f), backgroundColor: sorted.map((_,i) => colors[i % colors.length]), borderWidth: 2, borderColor: 'white' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font:{size:10}, boxWidth:10, padding:6 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + ctx.raw + ' error(s)'; } } }
        },
        cutout: '55%'
      }
    });
  }

  card.style.display = 'block';
  card.scrollIntoView({behavior:'smooth', block:'nearest'});

  // Highlight selected row using CSS class
  document.querySelectorAll('#weeklyDrillTable tr.drill-row-selected').forEach(function(r) {
    r.classList.remove('drill-row-selected');
    r.style.background = '';
    r.style.outline = '';
  });
  const allRows = document.querySelectorAll('#weeklyDrillTable tr[data-week]');
  allRows.forEach(function(tr) {
    if (tr.getAttribute('data-week') === weekLabel) {
      tr.classList.add('drill-row-selected');
      tr.style.background = '#d4f7eb';
      tr.style.outline = '2px solid var(--hpe-green)';
    }
  });
}

function closeParamBreakdown() {
  const card = document.getElementById('paramBreakdownCard');
  if (card) card.style.display = 'none';
  document.querySelectorAll('#weeklyDrillTable tr').forEach(function(tr) {
    tr.classList.remove('drill-row-selected');
    tr.style.background = '';
    tr.style.outline = '';
  });
  destroyChart('paramBreakdownChart');
}

// ==================== IMPROVEMENT CHARTS ====================
// applyTrendFilter now delegates to the global filter
function applyTrendFilter(mode, btn) {
  var value = 'all';
  if (mode === 'month') {
    var sel = document.getElementById('improveMonthSelect');
    value = (sel && sel.value !== 'all') ? sel.value : 'all';
  }
  applyGlobalFilter(mode, value, btn, 'improve');
}

function buildForecastChart() {
  var weeks  = getFilteredWeeks();
  var months = getFilteredMonths();
  var mode   = ACTIVE_FILTER.mode;

  var labels = [], actualData = [], forecastLabels = [];

  if (mode === 'week') {
    // Show individual weekly data points for the selected week or all weeks
    labels     = weeks.map(function(w){ return w.Week_Label; });
    actualData = weeks.map(function(w){ return w.Accuracy; });
    forecastLabels = weeks.length === 1 ? [] : ['May W1','May W2','May W3','May W4'];
  } else if (mode === 'month') {
    // Show weekly data within the selected month (or all months if all)
    labels     = weeks.map(function(w){ return w.Week_Label; });
    actualData = weeks.map(function(w){ return w.Accuracy; });
    forecastLabels = ['May W1', 'May W2'];
  } else {
    // FY mode — monthly aggregates
    labels     = months.map(function(m){ return m.Month + ' 2026'; });
    actualData = months.map(function(m){ return m.Accuracy; });
    forecastLabels = ['May 2026', 'Jun 2026'];
  }

  // Linear regression forecast
  var forecastData = [];
  var n = actualData.length;
  if (n > 1 && forecastLabels.length > 0) {
    var sumX = n*(n-1)/2;
    var sumY = actualData.reduce(function(s,v){ return s+v; }, 0);
    var sumXY= actualData.reduce(function(s,v,i){ return s+i*v; }, 0);
    var sumX2= actualData.reduce(function(s,v,i){ return s+i*i; }, 0);
    var denom = n*sumX2 - sumX*sumX;
    if (denom !== 0) {
      var slope = (n*sumXY - sumX*sumY) / denom;
      var intercept = (sumY - slope*sumX) / n;
      forecastData = forecastLabels.map(function(_,k){ return Math.min(99.8, Math.max(93, +(intercept + slope*(n+k)).toFixed(2))); });
    }
  }

  var allLabels = labels.concat(forecastLabels);
  var yMin = Math.min(92, Math.floor(Math.min.apply(null, actualData.concat([95]))) - 1);

  destroyChart('forecastChart');
  var fEl = document.getElementById('forecastChart');
  if (!fEl) return;

  var datasets = [
    { label: 'Actual Accuracy', data: actualData.concat(forecastLabels.map(function(){ return null; })),
      borderColor: '#01A982', backgroundColor: 'rgba(1,169,130,0.08)', tension: 0.4, fill: true,
      pointRadius: 5, pointBackgroundColor: actualData.map(function(a){ return a < 95 ? '#C54E4B' : a < 98 ? '#FF8300' : '#01A982'; }),
      borderWidth: 2 }
  ];
  if (forecastData.length > 0) {
    var fPad = actualData.slice(0,-1).map(function(){ return null; });
    datasets.push({ label: 'AI Forecast',
      data: fPad.concat([actualData[actualData.length-1]]).concat(forecastData),
      borderColor: '#FF8300', borderDash: [6,3], tension: 0.3,
      pointRadius: 5, pointBackgroundColor: '#FF8300', borderWidth: 2, fill: false });
  }
  datasets.push({ label: '95% Target', data: allLabels.map(function(){ return 95; }),
    borderColor: '#C54E4B', borderDash: [4,4], borderWidth: 1.5, pointRadius: 0, fill: false });

  // Period title annotation
  var periodTitle = getPeriodLabel();

  charts['forecastChart'] = new Chart(fEl.getContext('2d'), {
    type: 'line',
    data: { labels: allLabels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: {font:{size:11},boxWidth:12} },
        tooltip: { mode: 'index', intersect: false,
          callbacks: { title: function(items){ return items[0].label + ' — ' + periodTitle; } } }
      },
      scales: {
        y: { min: yMin, max: 100, ticks: { callback: function(v){ return v+'%'; }, font:{size:11} } },
        x: { ticks: {font:{size:10}, maxRotation:45}, grid:{display:false} }
      }
    }
  });
}

function initImprovementCharts() {
  // All chart building delegated to updateImprovementCharts so data stays live after upload/filter
  _improveDone = true;
  updateImprovementCharts();
}

function buildDeltaTable() {
  const el = document.getElementById('deltaTable');
  if (!el) return;
  // Use hire-type-filtered months for delta table
  const months = getFilteredMonths().sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  let prevAcc = null;
  let html = '<div style="display:flex;flex-direction:column;gap:8px">';
  months.forEach(m => {
    const delta = prevAcc !== null ? (m.Accuracy - prevAcc).toFixed(2) : null;
    const color = delta === null ? 'var(--text-muted)' : parseFloat(delta) >= 0 ? 'var(--hpe-green)' : 'var(--hpe-red)';
    const arrow = delta === null ? '' : parseFloat(delta) >= 0 ? '▲' : '▼';
    prevAcc = m.Accuracy;
    html += \`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:white;border-radius:8px;border:1px solid var(--border)">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary)">\${m.Month} 2026</div>
        <div style="font-size:11px;color:var(--text-muted)">\${m.Opportunity_Count.toLocaleString()} audits</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:800;color:var(--text-primary)">\${m.Accuracy}%</div>
        <div style="font-size:12px;font-weight:600;color:\${color}">\${delta !== null ? arrow + ' ' + (parseFloat(delta) >= 0 ? '+' : '') + delta + '%' : 'Baseline'}</div>
      </div>
    </div>\`;
  });
  html += '</div>';
  el.innerHTML = html;
}

// ==================== CAPA CHARTS ====================
let capaFilterState = 'all';

function initCAPACharts() {
  // Always rebuild from current data when tab is activated
  buildCAPATable('all');
  recomputeCAPAKPIs(DASHBOARD_DATA.capa_data);
  rebuildCAPACharts(DASHBOARD_DATA.capa_data);
  rebuildCAPAAIInsights(DASHBOARD_DATA.capa_data);
  const countBadge = document.getElementById('capaCountBadge');
  if (countBadge) countBadge.textContent = DASHBOARD_DATA.capa_data.length + ' records';
}

function refreshCAPADashboard() {
  const data = DASHBOARD_DATA.capa_data;
  recomputeCAPAKPIs(data);
  // Destroy and re-create charts with small delay to let DOM settle
  setTimeout(() => { rebuildCAPACharts(data); }, 30);
  buildCAPATable(capaFilterState);
  rebuildCAPAAIInsights(data);
  const badge = document.querySelector('.nav-tab .tab-badge');
  if (badge) badge.textContent = data.length;
  const countBadge = document.getElementById('capaCountBadge');
  if (countBadge) countBadge.textContent = data.length + ' records';
  const ts = document.getElementById('capaLastUpdated');
  if (ts) ts.textContent = new Date().toLocaleString();
}

function recomputeCAPAKPIs(data) {
  const total   = data.length;
  const closed  = data.filter(c => c.status === 'Closed').length;
  const overdue = data.filter(c => c.status === 'Overdue').length;
  const inprog  = data.filter(c => c.status === 'In Progress').length;
  const review  = data.filter(c => c.status === 'Under Review').length;
  const closureRate = total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0';
  const closedAging = data.filter(c => c.status === 'Closed' && c.aging > 0).map(c => c.aging);
  const avgDays = closedAging.length > 0
    ? Math.round(closedAging.reduce((s,v) => s+v, 0) / closedAging.length) : null;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  set('capaKpiClosureRate', closureRate + '%');
  const crClass = parseFloat(closureRate) >= 80 ? 'kpi-delta delta-up' : 'kpi-delta delta-down';
  const crIcon  = parseFloat(closureRate) >= 80 ? 'fa-check' : 'fa-minus';
  const crEl = document.getElementById('capaKpiClosureSub');
  if (crEl) { crEl.className = crClass; crEl.innerHTML = \`<i class="fas \${crIcon}"></i> \${closed} of \${total} closed\`; }

  set('capaKpiAvgDays', avgDays !== null ? avgDays : '—');
  const adOk = avgDays !== null && avgDays <= 17;
  const adEl = document.getElementById('capaKpiAvgDaysSub');
  if (adEl) {
    adEl.className = 'kpi-delta ' + (adOk ? 'delta-up' : avgDays === null ? 'delta-neutral' : 'delta-down');
    adEl.innerHTML = avgDays !== null
      ? \`<i class="fas \${adOk ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> \${adOk ? 'Within' : 'Exceeds'} 17-day target\`
      : '<i class="fas fa-minus"></i> No closed records yet';
  }

  set('capaKpiOverdue', overdue);
  const odEl = document.getElementById('capaKpiOverdueSub');
  if (odEl) {
    odEl.className = 'kpi-delta ' + (overdue > 0 ? 'delta-down' : 'delta-up');
    odEl.innerHTML = overdue > 0
      ? \`<i class="fas fa-arrow-up"></i> \${overdue} overdue — action needed\`
      : '<i class="fas fa-check"></i> No overdue items';
  }
  const overdueIds = data.filter(c => c.status === 'Overdue').map(c => c.id).join(', ');
  set('capaKpiOverdueDetail', overdueIds || 'All items on track');

  set('capaKpiTotal', total);
  const totEl = document.getElementById('capaKpiTotalSub');
  if (totEl) totEl.innerHTML = \`<i class="fas fa-list"></i> \${closed} closed · \${inprog} in progress · \${overdue + review} open\`;
  set('capaKpiTotalDetail', 'Live from uploaded data');
}

function rebuildCAPACharts(data) {
  const closed  = data.filter(c => c.status === 'Closed').length;
  const inprog  = data.filter(c => c.status === 'In Progress').length;
  const overdue = data.filter(c => c.status === 'Overdue').length;
  const review  = data.filter(c => c.status === 'Under Review').length;

  destroyChart('capaStatusChart');
  const csEl = document.getElementById('capaStatusChart');
  if (csEl) {
    charts['capaStatusChart'] = new Chart(csEl.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['🟢 Closed', '🟡 In Progress', '🔴 Overdue', '🔵 Under Review'],
        datasets: [{
          data: [closed, inprog, overdue, review],
          backgroundColor: ['#01A982', '#FFC627', '#C54E4B', '#0D5DBF'],
          borderWidth: 3, borderColor: 'white'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: {font:{size:12}, padding:14, boxWidth:14} },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw } }
        },
        cutout: '60%'
      }
    });
  }

  const rcMap = {};
  data.forEach(c => {
    if (!c.root_cause) return;
    const key = c.root_cause.length > 38 ? c.root_cause.slice(0,38) + '…' : c.root_cause;
    rcMap[key] = (rcMap[key] || 0) + 1;
  });
  const rcLabels = Object.keys(rcMap);
  const rcValues = rcLabels.map(k => rcMap[k]);
  const rcColors = ['#C54E4B','#FF8300','#FFC627','#0D5DBF','#01A982','#6b7d8c','#4fc3a1','#9b59b6'];

  destroyChart('capaRootCauseChart');
  const crEl = document.getElementById('capaRootCauseChart');
  if (crEl) {
    charts['capaRootCauseChart'] = new Chart(crEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: rcLabels.length ? rcLabels : ['No data'],
        datasets: [{
          label: 'CAPA Count',
          data: rcValues.length ? rcValues : [0],
          backgroundColor: rcLabels.map((_, i) => rcColors[i % rcColors.length]),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: {display:false} },
        scales: {
          x: { ticks: {stepSize:1, font:{size:11}}, title:{display:true, text:'Count', font:{size:10}} },
          y: { ticks: {font:{size:11}} }
        }
      }
    });
  }
}

function buildCAPATable(filterStatus) {
  capaFilterState = filterStatus || 'all';
  const tbody = document.getElementById('capaTableBody');
  if (!tbody) return;
  let rows = DASHBOARD_DATA.capa_data;
  if (filterStatus === 'open')       rows = rows.filter(c => c.status === 'Overdue' || c.status === 'Under Review');
  else if (filterStatus === 'inprogress') rows = rows.filter(c => c.status === 'In Progress');
  else if (filterStatus === 'closed')     rows = rows.filter(c => c.status === 'Closed');

  if (rows.length === 0) {
    tbody.innerHTML = \`<tr><td colspan="12" style="text-align:center;padding:32px;color:var(--text-muted)">
      <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>
      No records match this filter</td></tr>\`;
    return;
  }
  tbody.innerHTML = rows.map((c, idx) => {
    const sClass = c.status === 'Closed' ? 'status-closed'
      : c.status === 'In Progress' ? 'status-inprogress'
      : c.status === 'Under Review' ? 'status-review' : 'status-open';
    const sIcon = c.status === 'Closed' ? '🟢' : c.status === 'In Progress' ? '🟡' : c.status === 'Under Review' ? '🔵' : '🔴';
    const aging = c.aging !== undefined && c.aging !== null ? c.aging : '—';
    const agingStyle = typeof aging === 'number'
      ? (aging > 20 ? 'color:var(--hpe-red);font-weight:700' : aging > 10 ? 'color:var(--hpe-orange)' : 'color:var(--hpe-green)') : '';
    return \`<tr>
      <td><strong>\${c.id || 'CAPA-' + String(idx+1).padStart(3,'0')}</strong></td>
      <td style="white-space:nowrap">\${c.date || '—'}</td>
      <td style="max-width:150px;white-space:normal">\${c.bot_action || '—'}</td>
      <td style="max-width:150px;white-space:normal">\${c.undo_reason || '—'}</td>
      <td style="max-width:150px;white-space:normal">\${c.root_cause || '—'}</td>
      <td style="max-width:140px;white-space:normal">\${c.corrective || '—'}</td>
      <td style="max-width:140px;white-space:normal">\${c.preventive || '—'}</td>
      <td style="white-space:nowrap"><strong>\${c.owner || '—'}</strong></td>
      <td style="white-space:nowrap">\${c.target_date || '—'}</td>
      <td style="white-space:nowrap">\${c.close_date || '<span style="color:var(--text-muted)">Pending</span>'}</td>
      <td><span class="status-pill \${sClass}">\${sIcon} \${c.status || '—'}</span></td>
      <td><span style="\${agingStyle}">\${typeof aging === 'number' ? aging + 'd' : aging}</span></td>
    </tr>\`;
  }).join('');
}

function rebuildCAPAAIInsights(data) {
  const panel = document.getElementById('capaAIPanel');
  if (!panel) return;
  const total   = data.length;
  const overdue = data.filter(c => c.status === 'Overdue');
  const closed  = data.filter(c => c.status === 'Closed').length;
  const rcMap = {};
  data.forEach(c => { if (c.root_cause) rcMap[c.root_cause] = (rcMap[c.root_cause] || 0) + 1; });
  const topRC = Object.entries(rcMap).sort((a,b) => b[1]-a[1]);

  let insights = '';
  const recurring = topRC.filter(([,v]) => v > 1);
  if (recurring.length > 0) {
    const [rc, cnt] = recurring[0];
    insights += \`<div class="insight-item alert">
      <div class="insight-icon alert"><i class="fas fa-repeat"></i></div>
      <div class="insight-text"><strong>Recurring Root Cause:</strong> "<em>\${rc}</em>" appears in <strong>\${cnt}</strong> CAPAs (\${Math.round(cnt/total*100)}% of total). Systemic bot-rules review recommended.</div>
    </div>\`;
  }
  overdue.forEach(c => {
    insights += \`<div class="insight-item warning">
      <div class="insight-icon warning"><i class="fas fa-calendar-times"></i></div>
      <div class="insight-text"><strong>Overdue — \${c.id}:</strong> Target was <strong>\${c.target_date}</strong>. Owner: <strong>\${c.owner}</strong>. Issue: <em>\${c.undo_reason}</em>. Recommend escalation within 48 hours.</div>
    </div>\`;
  });
  if (closed === total && total > 0) {
    insights += \`<div class="insight-item">
      <div class="insight-icon green"><i class="fas fa-trophy"></i></div>
      <div class="insight-text"><strong>All CAPAs Closed!</strong> 100% closure rate. Document lessons learned for future bot deployments.</div>
    </div>\`;
  }
  if (total === 0) {
    insights += \`<div class="insight-item info">
      <div class="insight-icon info"><i class="fas fa-info-circle"></i></div>
      <div class="insight-text"><strong>No CAPA data loaded.</strong> Upload your Bot Undo Moves file using the button above to see AI-generated insights.</div>
    </div>\`;
  }
  if (!insights) {
    insights = \`<div class="insight-item">
      <div class="insight-icon green"><i class="fas fa-check-circle"></i></div>
      <div class="insight-text"><strong>No Recurring Issues Detected.</strong> All \${total} CAPA root causes are unique. Continue monitoring for emerging patterns.</div>
    </div>\`;
  }

  // Rebuild the panel HTML fully
  panel.innerHTML = \`
    <div class="ai-insights-header">
      <div class="ai-badge"><i class="fas fa-robot"></i> AI CAPA ANALYSIS</div>
      <div class="ai-insights-title">Pattern Recognition — Bot Undo Root Causes</div>
    </div>
    <div class="insight-list">\${insights}</div>\`;
}

// ==================== CAPA MODAL ====================
let capaFileParsedData = null;
let currentModalTab = 'file';

function openCAPAModal() {
  document.getElementById('capaModal').classList.add('open');
  switchModalTab('file');
  clearCapaUpload();
  resetManualForm();
}

function closeCapaModal() {
  document.getElementById('capaModal').classList.remove('open');
}

function handleModalOverlayClick(e) {
  if (e.target.id === 'capaModal') closeCapaModal();
}

function switchModalTab(tab) {
  currentModalTab = tab;
  ['file','manual','template'].forEach(t => {
    document.getElementById('mtab-' + t).classList.toggle('active', t === tab);
    document.getElementById('mpanel-' + t).classList.toggle('active', t === tab);
  });
  const lbl = document.getElementById('btnModalSubmitLabel');
  const btn = document.getElementById('btnModalSubmit');
  if (tab === 'template') {
    if (btn) btn.style.display = 'none'; return;
  }
  if (btn) btn.style.display = '';
  if (tab === 'file') {
    if (lbl) lbl.innerHTML = 'Load &amp; Refresh Dashboard';
    if (btn) { btn.onclick = commitCapaFileData; }
  } else {
    if (lbl) lbl.innerHTML = 'Add Record &amp; Refresh';
    if (btn) { btn.onclick = submitManualCapaRecord; }
  }
}

// ---- File Upload ----
function handleCapaFileDrop(e) {
  e.preventDefault();
  document.getElementById('modalDropZone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processCapaFile(file);
}
function handleCapaFileSelect(e) {
  const file = e.target.files[0];
  if (file) processCapaFile(file);
}

function processCapaFile(file) {
  const preview = document.getElementById('capaParsePreview');
  const pTable  = document.getElementById('capaPreviewTable');
  const loadBtn = document.getElementById('btnLoadCapaFile');
  preview.classList.remove('show'); preview.innerHTML = '';
  pTable.innerHTML = ''; capaFileParsedData = null;
  if (loadBtn) loadBtn.disabled = true;

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'csv') {
    showParseError('Only CSV files supported. Please save your Excel file as CSV (.csv) and re-upload.');
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const rows = parseCSVToCapaRows(ev.target.result);
      capaFileParsedData = rows;
      showCapaFilePreview(rows, file.name, DASHBOARD_DATA.capa_data.length);
      if (loadBtn) loadBtn.disabled = rows.length === 0;
    } catch(err) { showParseError(err.message); }
  };
  reader.readAsText(file);
}

function parseCSVToCapaRows(text) {
  const LF = String.fromCharCode(10);
  const CR = String.fromCharCode(13);
  const lines = text.split(CR).join('').split(LF).filter(l => l.trim());
  if (lines.length < 2) throw new Error('File needs at least 1 header row + 1 data row.');

  /* ── RFC-4180 parser (handles quoted fields with commas, doubled-quote escapes) ── */
  function splitCSVLine(line) {
    const result = [];
    let cur = '', inQ = false, i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i += 2; continue; }
        inQ = !inQ; i++; continue;
      }
      if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; i++; continue; }
      cur += ch; i++;
    }
    result.push(cur.trim());
    return result;
  }

  /* ── Normalize header: lowercase, separators→underscore, strip noise ── */
  function normH(h) {
    return h.replace(/^"|"$/g,'').trim().toLowerCase()
      .replace(/[ \t\-\/\(\)]+/g,'_').replace(/[^a-z0-9_]/g,'').replace(/_+/g,'_').replace(/^_|_$/g,'');
  }

  /* ── Parse natural-language dates like "6 May 2026", "12 May 2026" ── */
  function parseDate(raw) {
    if (!raw) return '';
    raw = raw.trim();
    if (!raw) return '';
    var D = '[0-9]';
    // ISO YYYY-MM-DD pass through
    if (new RegExp('^'+D+'{4}-'+D+'{2}-'+D+'{2}$').test(raw)) return raw;
    // DD/MM/YYYY or MM/DD/YYYY  (use RegExp constructor to avoid / delimiter issues)
    var slashM = raw.match(new RegExp('^('+D+'{1,2})\/('+D+'{1,2})\/('+D+'{4})$'));
    if (slashM) {
      var a=slashM[1], b=slashM[2], y=slashM[3];
      if (parseInt(a) > 12) return y+'-'+b.padStart(2,'0')+'-'+a.padStart(2,'0');
      return y+'-'+a.padStart(2,'0')+'-'+b.padStart(2,'0');
    }
    // "D Mon YYYY"  e.g. "6 May 2026" or "12 May 2026"
    var MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
    var natM = raw.match(new RegExp('^('+D+'{1,2})[ \t]+([A-Za-z]+)[ \t]+('+D+'{4})$'));
    if (natM) {
      var mo = MONTHS[natM[2].toLowerCase().slice(0,3)];
      if (mo) return natM[3]+'-'+mo+'-'+natM[1].padStart(2,'0');
    }
    // "Mon D, YYYY"
    var natM2 = raw.match(new RegExp('^([A-Za-z]+)[ \t]+('+D+'{1,2}),?[ \t]+('+D+'{4})$'));
    if (natM2) {
      var mo2 = MONTHS[natM2[1].toLowerCase().slice(0,3)];
      if (mo2) return natM2[3]+'-'+mo2+'-'+natM2[2].padStart(2,'0');
    }
    return raw;
  }

  const rawHdrs = splitCSVLine(lines[0]);
  const hdrs    = rawHdrs.map(normH);

  /* ── Fuzzy column finder ── */
  function findCol(keywords) {
    // exact match first
    for (const kw of keywords) {
      const idx = hdrs.indexOf(kw);
      if (idx >= 0) return idx;
    }
    // substring match
    for (const kw of keywords) {
      const idx = hdrs.findIndex(h => h.length > 1 && (h.includes(kw) || kw.includes(h)));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  const ci = {
    capa_id:     findCol(['capa_id','id','capa_id_number','capaid']),
    date:        findCol(['date','undo_date','event_date','open_date','capa_date','raised_date']),
    bot_action:  findCol(['bot_action','bot_action_taken','botaction','action','bot_move','bot']),
    undo_reason: findCol(['undo_reason','reason_for_undo','reason','undo_rationale','rationale','undo']),
    root_cause:  findCol(['root_cause','root_cause_category','rootcause','cause','root']),
    corrective:  findCol(['corrective','corrective_action','corrective_measure','fix','correction']),
    preventive:  findCol(['preventive','preventive_action','preventive_measure','prevention','prevent']),
    owner:       findCol(['owner','responsible','assigned_to','assignee','capa_owner','raised_by','person']),
    target_date: findCol(['target_date','target_close_date','due_date','target','deadline','planned_close']),
    close_date:  findCol(['close_date','actual_close','actual_close_date','closed_date','actual_close_date','closed','completion_date']),
    status:      findCol(['status','capa_status','state','capa_state','resolution_status'])
  };

  // Positional fallback if nothing matched
  const matched = Object.values(ci).filter(v => v >= 0).length;
  if (matched === 0 && rawHdrs.length >= 2) {
    ['date','bot_action','undo_reason','root_cause','corrective','preventive','owner','target_date','close_date','status']
      .forEach((k, i) => { ci[k] = i < rawHdrs.length ? i : -1; });
  }

  function getVal(cols, key) {
    const idx = ci[key];
    if (idx < 0 || idx >= cols.length) return '';
    return cols[idx].replace(/^"|"$/g,'').trim();
  }

  return lines.slice(1)
    .map((line, i) => {
      if (!line.trim()) return null;
      const cols = splitCSVLine(line);

      // Preserve original CAPA ID if column exists, else auto-generate
      const rawId = getVal(cols, 'capa_id');
      const id = rawId ? rawId.replace(/[ \t]+/g, '') : ('CAPA-' + String(i+1).padStart(3,'0'));

      const date        = parseDate(getVal(cols,'date'));
      const target_date = parseDate(getVal(cols,'target_date'));
      const close_raw   = getVal(cols,'close_date');
      const close_date  = close_raw ? parseDate(close_raw) : null;

      // Infer status: if no Status column but Actual Close is filled → Closed
      const statusRaw = getVal(cols,'status');
      const status = statusRaw ? normalizeCapaStatus(statusRaw)
                               : (close_date ? 'Closed' : 'In Progress');
      const aging = computeAging(date, close_date, status);

      return {
        id, date,
        bot_action:  getVal(cols,'bot_action'),
        undo_reason: getVal(cols,'undo_reason'),
        root_cause:  getVal(cols,'root_cause'),
        corrective:  getVal(cols,'corrective'),
        preventive:  getVal(cols,'preventive'),
        owner:       getVal(cols,'owner'),
        target_date, close_date, status, aging
      };
    })
    .filter(r => r && (r.date || r.bot_action || r.undo_reason || r.owner || r.root_cause || r.id));
}
function normalizeCapaStatus(s) {
  if (!s) return 'In Progress';
  const sl = s.toLowerCase();
  if (sl.includes('close') || sl.includes('done') || sl.includes('complete') || sl === 'c') return 'Closed';
  if (sl.includes('overdue') || sl.includes('late') || sl.includes('breach')) return 'Overdue';
  if (sl.includes('review') || sl.includes('hold')) return 'Under Review';
  return 'In Progress';
}

function computeAging(openDate, closeDate, status) {
  try {
    const open = new Date(openDate);
    if (isNaN(open)) return 0;
    const end = (status === 'Closed' && closeDate) ? new Date(closeDate) : new Date();
    return Math.max(0, Math.round((end - open) / 86400000));
  } catch { return 0; }
}

function showCapaFilePreview(rows, fileName, startCount) {
  const preview = document.getElementById('capaParsePreview');
  preview.classList.add('show');
  preview.style.borderColor = '';
  preview.innerHTML = \`
    <div class="parse-row"><i class="fas fa-file-csv" style="color:var(--hpe-green)"></i> <strong>\${fileName}</strong></div>
    <div class="parse-row"><i class="fas fa-check-circle" style="color:var(--hpe-green)"></i> \${rows.length} valid records parsed (IDs: CAPA-\${String(startCount+1).padStart(3,'0')} to CAPA-\${String(startCount+rows.length).padStart(3,'0')})</div>
    <div class="parse-row"><i class="fas fa-info-circle" style="color:var(--hpe-blue)"></i> Click "Load &amp; Refresh Dashboard" — existing data will be <strong>replaced</strong> with this file</div>\`;
  const pTable = document.getElementById('capaPreviewTable');
  if (rows.length > 0) {
    const sample = rows.slice(0,5);
    pTable.innerHTML = \`
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">Preview — first \${sample.length} of \${rows.length} rows:</div>
      <div class="table-container" style="max-height:180px;overflow-y:auto">
        <table><thead><tr>
          <th>Date</th><th>Bot Action</th><th>Undo Reason</th><th>Owner</th><th>Status</th><th>Aging</th>
        </tr></thead>
        <tbody>\${sample.map(r => \`<tr>
          <td>\${r.date||'—'}</td>
          <td style="max-width:130px;white-space:normal">\${r.bot_action||'—'}</td>
          <td style="max-width:130px;white-space:normal">\${r.undo_reason||'—'}</td>
          <td>\${r.owner||'—'}</td>
          <td><span class="status-pill \${r.status==='Closed'?'status-closed':r.status==='Overdue'?'status-open':'status-inprogress'}">\${r.status}</span></td>
          <td>\${r.aging}d</td>
        </tr>\`).join('')}</tbody></table>
      </div>\`;
  }
}

function showParseError(msg) {
  const preview = document.getElementById('capaParsePreview');
  preview.classList.add('show');
  preview.style.borderColor = 'var(--hpe-red)';
  preview.innerHTML = \`<div class="parse-row"><i class="fas fa-exclamation-circle" style="color:var(--hpe-red)"></i> <strong>Error:</strong> \${msg}</div>\`;
}

function commitCapaFileData() {
  if (!capaFileParsedData || capaFileParsedData.length === 0) {
    showToast('No parsed data. Upload a valid CSV file first.', 'error'); return;
  }
  // Re-number IDs from 1 since we're replacing all data
  capaFileParsedData.forEach((r, i) => { r.id = 'CAPA-' + String(i+1).padStart(3,'0'); });
  DASHBOARD_DATA.capa_data = capaFileParsedData.slice(); // fresh array
  const count = DASHBOARD_DATA.capa_data.length;
  closeCapaModal();
  capaFilterState = 'all';
  document.querySelectorAll('#tab-capa .filter-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  refreshCAPADashboard();
  showToast('✅ ' + count + ' records loaded — dashboard refreshed!', 'success');
  capaFileParsedData = null;
}

function clearCapaUpload() {
  capaFileParsedData = null;
  const p = document.getElementById('capaParsePreview');
  const t = document.getElementById('capaPreviewTable');
  const b = document.getElementById('btnLoadCapaFile');
  const f = document.getElementById('capaFileInput');
  if (p) { p.classList.remove('show'); p.innerHTML=''; p.style.borderColor=''; }
  if (t) t.innerHTML = '';
  if (b) b.disabled = true;
  if (f) f.value = '';
}

// ---- Manual Entry ----
function submitManualCapaRecord() {
  const errEl = document.getElementById('manualFormError');
  errEl.style.display = 'none';
  const fields = {
    date: document.getElementById('mf_date').value,
    owner: document.getElementById('mf_owner').value.trim(),
    bot_action: document.getElementById('mf_bot_action').value.trim(),
    undo_reason: document.getElementById('mf_undo_reason').value.trim(),
    root_cause: document.getElementById('mf_root_cause').value.trim(),
    corrective: document.getElementById('mf_corrective').value.trim(),
    preventive: document.getElementById('mf_preventive').value.trim(),
    target_date: document.getElementById('mf_target_date').value,
    close_date: document.getElementById('mf_close_date').value || null,
    status: document.getElementById('mf_status').value
  };
  const missing = Object.entries(fields).filter(([k,v]) => k !== 'close_date' && !v).map(([k]) => k.replace(/_/g,' '));
  if (missing.length > 0) {
    errEl.textContent = '⚠ Required: ' + missing.join(', ');
    errEl.style.display = 'block'; return;
  }
  const newId = 'CAPA-' + String(DASHBOARD_DATA.capa_data.length + 1).padStart(3,'0');
  const aging = computeAging(fields.date, fields.close_date, fields.status);
  DASHBOARD_DATA.capa_data.push({ id: newId, ...fields, aging });
  closeCapaModal();
  refreshCAPADashboard();
  showToast('✅ Record ' + newId + ' added successfully!', 'success');
}

function resetManualForm() {
  ['mf_date','mf_owner','mf_bot_action','mf_undo_reason','mf_root_cause','mf_corrective','mf_preventive','mf_target_date','mf_close_date'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const sel = document.getElementById('mf_status'); if (sel) sel.value = '';
  const err = document.getElementById('manualFormError'); if (err) { err.style.display='none'; err.textContent=''; }
}

// ---- Template Download ----
function downloadCapaTemplate() {
  const header = 'Date,Bot Action,Undo Reason,Root Cause,Corrective Action,Preventive Action,Owner,Target Date,Close Date,Status';
  const rows = [
    '2026-01-15,"Auto-reject duplicate application","False positive — same candidate different role","Bot dedup logic too broad","Manual review of affected candidates","Add role-level dedup flag to bot rules","Jyoti Sarwan",2026-02-05,2026-01-28,Closed',
    '2026-02-08,"Auto-populate target start date","Incorrect date format MM/DD vs DD/MM","Date field format mismatch in source","Manually corrected 53 records","Standardize date format in ATS integration","Mahak Kaura",2026-03-01,,In Progress'
  ];
  const csv = [header, ...rows].join(String.fromCharCode(10));
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'CAPA_BotUndo_Template.csv';
  a.click();
  showToast('Template downloaded!', 'info');
}

// ---- CAPA CSV Export ----
function exportCAPACSV() {
  const data = DASHBOARD_DATA.capa_data;
  if (data.length === 0) { showToast('No CAPA data to export.', 'error'); return; }
  const esc = v => '"' + String(v||'').replace(/"/g,"'") + '"';
  const header = 'CAPA ID,Date,Bot Action,Undo Reason,Root Cause,Corrective Action,Preventive Action,Owner,Target Date,Close Date,Status,Aging (days)';
  const rows = data.map(c => [c.id,c.date,esc(c.bot_action),esc(c.undo_reason),esc(c.root_cause),esc(c.corrective),esc(c.preventive),c.owner,c.target_date,c.close_date||'',c.status,c.aging||0].join(','));
  const csv = [header,...rows].join(String.fromCharCode(10));
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'HPE_CAPA_BotUndo_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showToast('CAPA data exported!', 'success');
}

// ---- Toast ----
function showToast(msg, type) {
  const t = document.getElementById('toastEl');
  if (!t) return;
  t.className = 'toast ' + (type || 'info');
  const icon = type==='success' ? '✅' : type==='error' ? '❌' : 'ℹ️';
  t.innerHTML = '<span>' + icon + '</span><span>' + msg + '</span>';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3800);
}

// ==================== INSIGHTS CHARTS ====================
function initInsightsCharts() {
  _insightsDone = true;
  updateInsightsCharts();
}

// Fully data-driven Insights rebuild — called on init, upload, and hire type filter change
function updateInsightsCharts() {
  var ov      = DASHBOARD_DATA.overall        || {};
  var topErrs = (DASHBOARD_DATA.top_errors    || []).filter(function(e){ return e.Opportunity_Fail > 0; });
  var botRec  = (DASHBOARD_DATA.recruiter_bottom || []).slice(0, 3).filter(function(r){ return r.Avg_Accuracy < 97; });
  var allRec  = DASHBOARD_DATA.recruiter_bottom || [];
  var stgStats= DASHBOARD_DATA.stage_stats    || [];
  var pmStats = DASHBOARD_DATA.pm_stats       || [];
  var htExp   = DASHBOARD_DATA.hireTypeStats && DASHBOARD_DATA.hireTypeStats.HPE_Experienced;
  var htUR    = DASHBOARD_DATA.hireTypeStats && DASHBOARD_DATA.hireTypeStats.HPE_UR;
  var totalCount = ov.Opportunity_Count || 0;
  var totalFail  = ov.Opportunity_Fail  || 0;
  var overallAcc = ov.Accuracy          || 0;
  var totalErrs  = topErrs.reduce(function(s,e){ return s + e.Opportunity_Fail; }, 0);

  // Month stats for trajectory description
  var sortedMonths = [...(DASHBOARD_DATA.month_stats||[])].sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  var firstMon = sortedMonths[0];
  var lastMon  = sortedMonths[sortedMonths.length-1];
  var worstMon = sortedMonths.length > 0 ? [...sortedMonths].sort(function(a,b){ return a.Accuracy - b.Accuracy; })[0] : null;
  var topRecPerf = [...allRec].sort(function(a,b){ return b.Avg_Accuracy - a.Avg_Accuracy; }).slice(0,3);
  var worstRec   = allRec.length > 0 ? allRec[allRec.length-1] : null;
  var topErr1    = topErrs[0] || null;
  var topErr2    = topErrs[1] || null;
  var stgSorted  = [...stgStats].sort(function(a,b){ return a.Accuracy - b.Accuracy; });
  var worstStg   = stgSorted[0] || null;
  var bestStg    = stgSorted[stgSorted.length-1] || null;

  var htGap = (htExp && htUR) ? Math.abs(htExp.totals.accuracy - htUR.totals.accuracy) : 0;
  var lowerHT = (htExp && htUR && htExp.totals.accuracy < htUR.totals.accuracy) ? 'HPE Experienced' : 'HPE UR';
  var lowerHTAcc = (htExp && htUR) ? Math.min(htExp.totals.accuracy, htUR.totals.accuracy) : 0;

  // Forecast values from linear regression on week stats
  var srcWeeks = getHireTypeWeekStats().slice().sort(function(a,b){
    return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
  });
  var allActual = srcWeeks.map(function(w){ return w.Accuracy; });
  var n = allActual.length;
  var forecastBase = [], forecastOpt = [], forecastPes = [];
  if (n >= 2) {
    var sumX=0,sumY=0,sumXY=0,sumXX=0;
    allActual.forEach(function(y,i){ sumX+=i; sumY+=y; sumXY+=i*y; sumXX+=i*i; });
    var slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
    var intercept = (sumY - slope*sumX) / n;
    for (var f=1;f<=4;f++) {
      var proj = +(intercept + slope*(n-1+f)).toFixed(2);
      forecastBase.push(Math.min(100, Math.max(80, proj)));
      forecastOpt.push(Math.min(100, Math.max(80, +(proj+0.3).toFixed(2))));
      forecastPes.push(Math.min(100, Math.max(80, +(proj-0.4).toFixed(2))));
    }
  } else {
    var lastAcc2 = allActual.length > 0 ? allActual[allActual.length-1] : 97;
    for (var fi=0;fi<4;fi++) {
      forecastBase.push(lastAcc2);
      forecastOpt.push(Math.min(100,+(lastAcc2+0.3).toFixed(2)));
      forecastPes.push(Math.max(80, +(lastAcc2-0.4).toFixed(2)));
    }
  }
  var fcLow  = Math.min.apply(null, forecastPes).toFixed(1);
  var fcHigh = Math.max.apply(null, forecastOpt).toFixed(1);
  var htLabel = getHireTypeLabel();
  var aboveTarget = overallAcc - 95;
  var fyRange = (firstMon && lastMon && firstMon.Month !== lastMon.Month)
    ? firstMon.Month + ' through ' + lastMon.Month
    : (firstMon ? firstMon.Month : 'this period');

  // ======== NARRATIVE SUMMARY ========
  var titleEl = document.getElementById('narrativeTitleEl');
  var narEl   = document.getElementById('narrativeText');
  if (titleEl) {
    titleEl.innerHTML = '<i class="fas fa-file-alt" style="color:var(--hpe-blue)"></i> Narrative Summary'
      + (ACTIVE_HIRE_TYPE !== 'all' ? ' \u2014 ' + htLabel : ' \u2014 FY YTD')
      + (sortedMonths.length > 0 ? ' (' + fyRange + ')' : '');
  }
  if (narEl) {
    var p1 = '<p>HPE Talent Acquisition has processed <strong class="highlight">'
      + totalCount.toLocaleString() + ' audit checkpoints</strong>'
      + (fyRange ? ' across ' + fyRange : '')
      + (ACTIVE_HIRE_TYPE !== 'all' ? ' (' + htLabel + ')' : '')
      + ', achieving an overall accuracy of <strong class="highlight">' + overallAcc + '%</strong>'
      + (aboveTarget > 0
          ? ' \u2014 <strong class="highlight">' + aboveTarget.toFixed(2) + ' percentage points above</strong> the 95% organizational target.'
          : ' \u2014 <strong class="warn-text">' + Math.abs(aboveTarget).toFixed(2) + ' percentage points below</strong> the 95% target.')
      + '</p>';

    var trajParts = [];
    if (firstMon) trajParts.push('starting at ' + firstMon.Accuracy + '% in ' + firstMon.Month);
    if (lastMon && lastMon !== firstMon) trajParts.push((lastMon.Accuracy >= (firstMon ? firstMon.Accuracy : 0) ? 'improving to ' : 'moderating to ') + lastMon.Accuracy + '% in ' + lastMon.Month);
    var worstMonStr = (worstMon && sortedMonths.length > 1 && worstMon.Accuracy < overallAcc)
      ? ' The ' + worstMon.Month + ' dip to ' + worstMon.Accuracy + '% (' + worstMon.Opportunity_Fail + ' errors) is the lowest point and a CAPA priority.' : '';
    var p2 = '<p>The <strong>accuracy trajectory</strong>: ' + (trajParts.length > 0 ? trajParts.join(', ') + '.' : 'data available.') + worstMonStr + '</p>';

    var stgStr = '';
    if (stgStats.length > 0) {
      var stgDesc = stgStats.map(function(s){
        return '<strong>' + s.Stage + '</strong> (' + s.Opportunity_Count.toLocaleString() + ' checks, ' + s.Accuracy + '% accuracy)';
      }).join('; ');
      stgStr = '<p>' + stgDesc + '.</p>';
    }

    var recStr = '';
    if (worstRec || topRecPerf.length > 0) {
      var riskPart = worstRec
        ? '<strong class="alert-text">' + worstRec.Recruiter + ' is the highest-risk recruiter</strong> with '
          + worstRec.Avg_Accuracy + '% accuracy across ' + (worstRec.Audit_Count||0).toLocaleString() + ' audits \u2014 significantly below team average.'
        : '';
      var topPart = topRecPerf.length > 0
        ? ' Top performers: <strong>' + topRecPerf.map(function(r){ return r.Recruiter; }).join(', ')
          + '</strong> all sustain ' + Math.min.apply(null, topRecPerf.map(function(r){return r.Avg_Accuracy;})) + '%+ accuracy.'
        : '';
      recStr = '<p>' + riskPart + topPart + '</p>';
    }

    var htStr = '';
    if (htExp && htUR && htGap > 0.1) {
      htStr = '<p>Hire type split: <strong>HPE Experienced</strong> at ' + htExp.totals.accuracy + '% ('
        + (htExp.totals.total||0).toLocaleString() + ' audits) vs <strong>HPE UR</strong> at '
        + htUR.totals.accuracy + '% (' + (htUR.totals.total||0).toLocaleString() + ' audits).'
        + (htGap > 0.5 ? ' A <strong class="warn-text">' + htGap.toFixed(1) + '% gap</strong> exists between hire types — targeted alignment recommended.' : '')
        + '</p>';
    }

    var p5 = '<p>The forecast projects FY closing accuracy between <strong class="highlight">'
      + fcLow + '%\u2013' + fcHigh + '%</strong> if current improvement measures are maintained'
      + (topErr1 ? ', with primary risk from unchecked <em>' + topErr1.Parameter + '</em> errors' : '')
      + '.</p>';

    narEl.innerHTML = p1 + '<br>' + p2 + (stgStr ? '<br>' + stgStr : '') + (recStr ? '<br>' + recStr : '') + (htStr ? '<br>' + htStr : '') + '<br>' + p5;
  }

  // ======== PREDICTIVE RISK FLAGS ========
  var rfEl = document.getElementById('riskFlagsContainer');
  if (rfEl) {
    var flags = [];

    // Flag 1: worst parameter
    if (topErr1) {
      var errPct = totalCount > 0 ? ((topErr1.Opportunity_Fail/totalCount)*100).toFixed(2) : '0';
      var projNext = Math.round(topErr1.Opportunity_Fail * 1.1);
      flags.push({ level: 'high',
        text: '<strong>' + topErr1.Parameter + ' parameter</strong> \u2014 '
          + topErr1.Opportunity_Fail + ' errors (' + errPct + '% error rate).'
          + ' If unaddressed, projects to cause ' + projNext + '+ errors next period.' });
    }

    // Flag 2: worst recruiter
    if (worstRec && worstRec.Avg_Accuracy < 95) {
      flags.push({ level: 'high',
        text: '<strong>' + worstRec.Recruiter + ' (Recruiter)</strong> \u2014 '
          + worstRec.Avg_Accuracy + '% accuracy across '
          + (worstRec.Audit_Count||0).toLocaleString() + ' audits. Sustained below-target performance.' });
    }

    // Flag 3: worst PM
    var pmSorted = [...pmStats].sort(function(a,b){ return a.Avg_Accuracy - b.Avg_Accuracy; });
    var worstPM = pmSorted[0];
    if (worstPM && worstPM.Avg_Accuracy < 99) {
      flags.push({ level: 'medium',
        text: '<strong>' + worstPM.PM + ' PM team</strong> \u2014 '
          + worstPM.Avg_Accuracy + '% accuracy'
          + (worstPM.Audit_Count ? ', ' + worstPM.Audit_Count.toLocaleString() + ' audits' : '')
          + '. High volume amplifies accuracy impact.' });
    }

    // Flag 4: second error parameter
    if (topErr2) {
      flags.push({ level: 'medium',
        text: '<strong>' + topErr2.Parameter + ' errors rising</strong> \u2014 '
          + topErr2.Opportunity_Fail + ' failures, 2nd highest. Process clarity review recommended.' });
    }

    // Flag 5: hire type gap
    if (htGap > 1.0) {
      flags.push({ level: htGap > 2 ? 'high' : 'medium',
        text: '<strong>' + lowerHT + ' hire type at ' + lowerHTAcc + '%</strong> \u2014 '
          + htGap.toFixed(1) + '% gap vs other hire type. Targeted process alignment needed.' });
    }

    // Flag 6: worst stage
    if (worstStg && worstStg.Accuracy < 98) {
      flags.push({ level: 'low',
        text: '<strong>' + worstStg.Stage + ' stage</strong> \u2014 '
          + worstStg.Accuracy + '% accuracy, ' + worstStg.Opportunity_Fail + ' errors. Monitor in next period.' });
    }

    // Flag 7: forecast negative slope
    if (forecastBase.length > 1 && forecastBase[forecastBase.length-1] < forecastBase[0]) {
      flags.push({ level: 'medium',
        text: '<strong>Declining accuracy trend detected</strong> \u2014 forecast shows '
          + forecastBase[0].toFixed(1) + '% \u2192 ' + forecastBase[forecastBase.length-1].toFixed(1)
          + '%. Proactive intervention recommended.' });
    }

    // Fallback
    if (flags.length === 0) {
      flags.push({ level: 'low', text: '<strong>No significant risks detected</strong> \u2014 upload data to generate risk analysis.' });
    }

    rfEl.innerHTML = flags.map(function(f){
      return '<div class="risk-flag ' + f.level + '">'
        + '<div class="risk-level ' + f.level + '">' + f.level.toUpperCase() + '</div>'
        + '<div class="risk-text">' + f.text + '</div>'
        + '</div>';
    }).join('');
  }

  // ======== ACTION RECOMMENDATIONS ========
  var recEl = document.getElementById('actionRecommendations');
  if (recEl) {
    var actions = [];
    var priority = 1;
    var impactColors = { HIGH: 'var(--hpe-red)', MED: 'var(--hpe-orange)', LOW: '#b8860b' };

    if (topErr1) {
      var topPct = totalErrs > 0 ? ((topErr1.Opportunity_Fail/totalErrs)*100).toFixed(0) : 0;
      var estGain = totalCount > 0 ? ((topErr1.Opportunity_Fail/totalCount)*100).toFixed(2) : '0.00';
      actions.push({ priority: priority++, impact: 'HIGH', color: impactColors.HIGH,
        title: 'Fix "' + topErr1.Parameter + '" validation',
        detail: topPct + '% of all errors — highest priority fix',
        est: '+' + estGain + '% accuracy' });
    }
    if (botRec.length > 0) {
      var names2 = botRec.map(function(r){ return r.Recruiter.split(' ').slice(0,2).join(' '); }).join(', ');
      var avgAcc2 = (botRec.reduce(function(s,r){return s+r.Avg_Accuracy;},0)/botRec.length).toFixed(1);
      actions.push({ priority: priority++, impact: 'HIGH', color: impactColors.HIGH,
        title: 'Coach bottom ' + botRec.length + ' recruiter' + (botRec.length>1?'s':''),
        detail: 'Focused training: ' + names2 + ' (avg ' + avgAcc2 + '%)',
        est: '+0.30% accuracy' });
    }
    if (topErr2) {
      var estGain3 = totalCount > 0 ? ((topErr2.Opportunity_Fail/totalCount)*100).toFixed(2) : '0.00';
      actions.push({ priority: priority++, impact: 'MED', color: impactColors.MED,
        title: 'Standardize "' + topErr2.Parameter + '"',
        detail: topErr2.Opportunity_Fail + ' errors — implement validation checklist',
        est: '+' + estGain3 + '% accuracy' });
    }
    if (worstStg && worstStg.Accuracy < 98) {
      actions.push({ priority: priority++, impact: 'MED', color: impactColors.MED,
        title: worstStg.Stage + ' process review',
        detail: worstStg.Accuracy + '% accuracy — ' + worstStg.Opportunity_Fail + ' errors to address',
        est: 'Process alignment' });
    }
    if (htGap > 0.5) {
      actions.push({ priority: priority++, impact: 'LOW', color: impactColors.LOW,
        title: lowerHT + ' hire type gap (' + htGap.toFixed(1) + '%)',
        detail: lowerHT + ' at ' + lowerHTAcc + '% — targeted process alignment',
        est: 'Equity improvement' });
    }
    if (worstPM && worstPM.Avg_Accuracy < 99) {
      actions.push({ priority: priority++, impact: 'LOW', color: impactColors.LOW,
        title: worstPM.PM + ' team coaching',
        detail: worstPM.Avg_Accuracy + '% accuracy — schedule process review session',
        est: 'Team alignment' });
    }
    if (actions.length === 0) {
      actions.push({ priority: 1, impact: 'LOW', color: impactColors.LOW,
        title: 'Upload data to generate recommendations',
        detail: 'Use Data Management tab to upload your Excel audit file',
        est: '' });
    }
    recEl.innerHTML = actions.map(function(a){
      return '<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--border)">'
        + '<div style="width:22px;height:22px;border-radius:50%;background:' + a.color + ';color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px">' + a.priority + '</div>'
        + '<div style="flex:1">'
        + '<div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + a.title + '</div>'
        + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + a.detail + '</div>'
        + '</div>'
        + (a.est ? '<div style="font-size:11px;font-weight:700;color:var(--hpe-green);white-space:nowrap">' + a.est + '</div>' : '')
        + '</div>';
    }).join('');
  }

  // ======== FORECAST DETAIL CHART ========
  destroyChart('forecastDetailChart');
  var fdCtx = document.getElementById('forecastDetailChart');
  if (!fdCtx) return;
  var allLabels = srcWeeks.map(function(w){ return w.Week_Label; });
  var futureLabels = ['Next W1','Next W2','Next W3','Next W4'];
  var chartLabels  = allLabels.concat(futureLabels);
  var lastActual   = allActual[allActual.length-1] || null;
  charts['forecastDetailChart'] = new Chart(fdCtx.getContext('2d'), {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [
        { label: 'Actual', data: allActual.concat([null,null,null,null]),
          borderColor:'#01A982', borderWidth:2.5, pointRadius:4,
          pointBackgroundColor:'#01A982', tension:0.4, fill:false },
        { label: 'Base Forecast',
          data: allActual.slice(0,-1).map(function(){return null;}).concat([lastActual]).concat(forecastBase),
          borderColor:'#FF8300', borderDash:[5,3], borderWidth:2, pointRadius:5,
          pointBackgroundColor:'#FF8300', tension:0.3, fill:false },
        { label: 'Optimistic',
          data: allActual.slice(0,-1).map(function(){return null;}).concat([lastActual]).concat(forecastOpt),
          borderColor:'#4fc3a1', borderDash:[3,3], borderWidth:1.5, pointRadius:3, tension:0.3, fill:false },
        { label: 'Pessimistic',
          data: allActual.slice(0,-1).map(function(){return null;}).concat([lastActual]).concat(forecastPes),
          borderColor:'#e06060', borderDash:[3,3], borderWidth:1.5, pointRadius:3, tension:0.3, fill:false },
        { label: '95% Target', data: chartLabels.map(function(){return 95;}),
          borderColor:'#C54E4B', borderDash:[8,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{font:{size:11},boxWidth:12} } },
      scales:{
        y:{ min:88, max:100, ticks:{ callback:function(v){return v+'%';}, font:{size:11} } },
        x:{ ticks:{font:{size:10},maxRotation:45}, grid:{display:false} }
      }
    }
  });
}

// ==================== UNIFIED GLOBAL FILTER ENGINE ====================
// Single source of truth for all period filters across Executive, Trends, Improvement tabs
var ACTIVE_FILTER = { mode: 'fy', value: 'all' }; // mode: 'fy'|'month'|'week'
var ACTIVE_HIRE_TYPE = 'all'; // 'all' | 'HPE_Experienced' | 'HPE_UR'

// Helper: get the month_stats array for the current hire type filter
function getHireTypeMonthStats() {
  if (ACTIVE_HIRE_TYPE === 'HPE_Experienced') return DASHBOARD_DATA.hireTypeStats.HPE_Experienced.month_stats;
  if (ACTIVE_HIRE_TYPE === 'HPE_UR')          return DASHBOARD_DATA.hireTypeStats.HPE_UR.month_stats;
  return DASHBOARD_DATA.month_stats; // combined
}
// Helper: get the week_stats array for the current hire type filter
function getHireTypeWeekStats() {
  if (ACTIVE_HIRE_TYPE === 'HPE_Experienced') return DASHBOARD_DATA.hireTypeStats.HPE_Experienced.week_stats;
  if (ACTIVE_HIRE_TYPE === 'HPE_UR')          return DASHBOARD_DATA.hireTypeStats.HPE_UR.week_stats;
  return DASHBOARD_DATA.week_stats; // combined
}
// Human-readable label for current hire type
function getHireTypeLabel() {
  if (ACTIVE_HIRE_TYPE === 'HPE_Experienced') return 'HPE Experienced';
  if (ACTIVE_HIRE_TYPE === 'HPE_UR')          return 'HPE UR';
  return 'All Hire Types';
}

// Apply hire type filter and refresh all charts
function applyHireTypeFilter(ht) {
  ACTIVE_HIRE_TYPE = ht;
  // Update button active states
  ['htBtnAll','htBtnExp','htBtnUR'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  var activeId = ht === 'HPE_Experienced' ? 'htBtnExp' : ht === 'HPE_UR' ? 'htBtnUR' : 'htBtnAll';
  var activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('active');
  // Repopulate week dropdowns with hire-type-specific week labels
  populateWeekOptions('execWeekSelect');
  populateWeekOptions('trendsWeekSelect');
  populateWeekOptions('improveWeekSelect');
  // Rebuild all visualisations
  updateExecutiveKPIs();
  updateExecutiveCharts();
  if (_trendDone)   { updateTrendCharts(); rebuildCriticalBarChart(); buildHeatmap(); buildWeeklyTable(); }
  if (_improveDone) { updateImprovementCharts(); }
  if (_insightsDone){ updateInsightsCharts(); }
}

// Helper: get filtered week_stats based on current ACTIVE_FILTER
function getFilteredWeeks() {
  var all = [...getHireTypeWeekStats()].sort(function(a,b) {
    return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
  });
  if (ACTIVE_FILTER.mode === 'fy' || ACTIVE_FILTER.value === 'all') return all;
  if (ACTIVE_FILTER.mode === 'month') return all.filter(function(w) { return w.Month === ACTIVE_FILTER.value; });
  if (ACTIVE_FILTER.mode === 'week')  return all.filter(function(w) { return w.Week_Label === ACTIVE_FILTER.value; });
  return all;
}

// Helper: get filtered month_stats based on current ACTIVE_FILTER
function getFilteredMonths() {
  var all = [...getHireTypeMonthStats()].sort(function(a,b) { return a.Month_Number - b.Month_Number; });
  if (ACTIVE_FILTER.mode === 'fy' || ACTIVE_FILTER.value === 'all') return all;
  if (ACTIVE_FILTER.mode === 'month') return all.filter(function(m) { return m.Month === ACTIVE_FILTER.value; });
  if (ACTIVE_FILTER.mode === 'week') {
    // For week filter on monthly view, show only the month that contains that week
    var ws = getHireTypeWeekStats();
    var w = ws.find(function(x) { return x.Week_Label === ACTIVE_FILTER.value; });
    return w ? all.filter(function(m) { return m.Month === w.Month; }) : all;
  }
  return all;
}

// Populate week dropdown options (called once per filter area)
function populateWeekOptions(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var weeks = [...getHireTypeWeekStats()].sort(function(a,b) {
    return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
  });
  var html = '<option value="all">All Weeks</option>';
  weeks.forEach(function(w) {
    html += '<option value="' + w.Week_Label + '">' + w.Week_Label + '</option>';
  });
  sel.innerHTML = html;
}

// Master filter entry point — called from ALL filter controls
function applyGlobalFilter(mode, value, btn, source) {
  ACTIVE_FILTER = { mode: mode, value: value };

  // --- Sync ALL filter UI controls to reflect the new state ---
  // Executive
  syncFilterUI('execMonthSelect', 'execWeekSelect', 'execFYBtn');
  // Trends
  syncFilterUI('trendsMonthSelect', 'trendsWeekSelect', 'trendsAllBtn');
  // Improve
  syncFilterUI('improveMonthSelect', 'improveWeekSelect', 'improveFilterFY');
  syncImproveBtns();

  // Set dropdown value for the source that triggered
  if (mode === 'month' && value !== 'all') {
    setSelectVal('execMonthSelect', value);
    setSelectVal('trendsMonthSelect', value);
    setSelectVal('improveMonthSelect', value);
  } else if (mode === 'week' && value !== 'all') {
    setSelectVal('execWeekSelect', value);
    setSelectVal('trendsWeekSelect', value);
    setSelectVal('improveWeekSelect', value);
  }

  // --- Rebuild all affected visualisations ---
  updateExecutiveKPIs();
  updateExecutiveCharts();
  updateTrendCharts();
  updateImprovementCharts();
}

function setSelectVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}

// Sync show/hide dropdowns and active button states
function syncFilterUI(monthSelId, weekSelId, fyBtnId) {
  var monthSel = document.getElementById(monthSelId);
  var weekSel  = document.getElementById(weekSelId);
  var fyBtn    = document.getElementById(fyBtnId);
  if (monthSel) monthSel.style.display = 'inline-block';
  if (weekSel)  weekSel.style.display  = 'inline-block';
  if (fyBtn) {
    fyBtn.classList.toggle('active', ACTIVE_FILTER.mode === 'fy' && ACTIVE_FILTER.value === 'all');
  }
  // Reset dropdowns if fy mode
  if (ACTIVE_FILTER.mode === 'fy') {
    if (monthSel) monthSel.value = 'all';
    if (weekSel)  weekSel.value  = 'all';
  }
}

function syncImproveBtns() {
  ['improveFilterWeek','improveFilterMonth','improveFilterFY'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var isActive = (id === 'improveFilterWeek' && ACTIVE_FILTER.mode === 'week')
                || (id === 'improveFilterMonth' && ACTIVE_FILTER.mode === 'month')
                || (id === 'improveFilterFY'    && ACTIVE_FILTER.mode === 'fy');
    el.style.background    = isActive ? 'var(--hpe-green)' : 'white';
    el.style.color         = isActive ? 'white' : '#555';
    el.style.borderColor   = isActive ? 'var(--hpe-green)' : '#ccc';
    // show sub-selects
    var monthSel = document.getElementById('improveMonthSelect');
    var weekSel  = document.getElementById('improveWeekSelect');
    if (monthSel) monthSel.style.display = ACTIVE_FILTER.mode === 'month' ? 'inline-block' : 'none';
    if (weekSel)  weekSel.style.display  = ACTIVE_FILTER.mode === 'week'  ? 'inline-block' : 'none';
  });
}

// ==================== AUDIT INTELLIGENCE SNAPSHOT ====================
// Generates data-driven insight bullets for the Executive Summary panel.
// Called at end of updateExecutiveKPIs so it refreshes on every filter/hire-type/upload change.
function _buildAuditIntelligenceSnapshot() {
  var titleEl = document.getElementById('aiInsightsTitle');
  var listEl  = document.getElementById('aiInsightsList');
  if (!listEl) return;

  var ov        = DASHBOARD_DATA.overall        || {};
  var topErrs   = (DASHBOARD_DATA.top_errors    || []).filter(function(e){ return e.Opportunity_Fail > 0; });
  var botRec    = DASHBOARD_DATA.recruiter_bottom || [];
  var pmStats   = DASHBOARD_DATA.pm_stats        || [];
  var stgStats  = DASHBOARD_DATA.stage_stats     || [];
  var htExp     = DASHBOARD_DATA.hireTypeStats && DASHBOARD_DATA.hireTypeStats.HPE_Experienced;
  var htUR      = DASHBOARD_DATA.hireTypeStats && DASHBOARD_DATA.hireTypeStats.HPE_UR;

  var totalCount  = ov.Opportunity_Count || 0;
  var overallAcc  = ov.Accuracy          || 0;
  var totalFail   = ov.Opportunity_Fail  || 0;
  var totalErrors = topErrs.reduce(function(s,e){ return s + e.Opportunity_Fail; }, 0);

  // Use hire-type filtered month & week stats
  var sortedMonths = [...getHireTypeMonthStats()].sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  var srcWeeks     = [...getHireTypeWeekStats()].sort(function(a,b){
    return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
  });

  var firstMon = sortedMonths[0];
  var lastMon  = sortedMonths[sortedMonths.length - 1];
  var worstMon = sortedMonths.length > 1 ? [...sortedMonths].sort(function(a,b){ return a.Accuracy - b.Accuracy; })[0] : null;
  var bestMon  = sortedMonths.length > 1 ? [...sortedMonths].sort(function(a,b){ return b.Accuracy - a.Accuracy; })[0] : null;

  var worstWeek = srcWeeks.length > 0 ? [...srcWeeks].sort(function(a,b){ return a.Accuracy - b.Accuracy; })[0] : null;
  var bestWeek  = srcWeeks.length > 0 ? [...srcWeeks].sort(function(a,b){ return b.Accuracy - a.Accuracy; })[0] : null;

  var topErr1   = topErrs[0] || null;
  var topErr2   = topErrs[1] || null;
  var worstRec  = botRec.length > 0 ? botRec[botRec.length - 1] : null;
  var botRec3   = botRec.slice(0, 3).filter(function(r){ return r.Avg_Accuracy < 97; });
  var worstStg  = stgStats.length > 0 ? [...stgStats].sort(function(a,b){ return a.Accuracy - b.Accuracy; })[0] : null;
  var worstPM   = pmStats.length > 0  ? [...pmStats].sort(function(a,b){ return a.Avg_Accuracy - b.Avg_Accuracy; })[0] : null;

  // Trend direction: compare last month vs first month
  var trendUp   = lastMon && firstMon && lastMon.Accuracy > firstMon.Accuracy;
  var trendFlat = lastMon && firstMon && lastMon.Accuracy === firstMon.Accuracy;
  var fyRange   = (firstMon && lastMon && firstMon.Month !== lastMon.Month)
    ? firstMon.Month + '\u2013' + lastMon.Month : (firstMon ? firstMon.Month : 'YTD');
  var htLabel   = getHireTypeLabel();

  // Update title
  if (titleEl) {
    titleEl.textContent = 'Audit Intelligence Snapshot'
      + (ACTIVE_HIRE_TYPE !== 'all' ? ' \u2014 ' + htLabel : ' \u2014 FY YTD')
      + (fyRange ? ' (' + fyRange + ')' : '');
  }

  // Helper to build one insight item HTML
  function insightItem(type, icon, boldText, bodyText) {
    // type: 'green'|'alert'|'warning'|'info'
    var iconMap = { green:'trending-up', alert:'exclamation-circle', warning:'user-times', info:'chart-bar', blue:'info-circle', orange:'fire' };
    var ic = iconMap[type] || 'info-circle';
    return '<div class="insight-item ' + (type !== 'green' ? type : '') + '">'
      + '<div class="insight-icon ' + type + '"><i class="fas fa-' + ic + '"></i></div>'
      + '<div class="insight-text"><strong>' + boldText + '</strong> ' + bodyText + '</div>'
      + '</div>';
  }

  var items = [];

  // ── 1. Overall accuracy status ──
  var aboveTarget = +(overallAcc - 95).toFixed(2);
  if (aboveTarget >= 0) {
    items.push(insightItem('green', 'trending-up',
      'Overall Accuracy ' + overallAcc + '% \u2014 ' + aboveTarget + 'pp Above Target:',
      totalCount.toLocaleString() + ' audits processed' + (fyRange ? ' (' + fyRange + ')' : '') + '.'
      + (totalFail > 0 ? ' ' + totalFail + ' total errors recorded across all parameters.' : ' Zero errors recorded — perfect compliance.')
    ));
  } else {
    items.push(insightItem('alert', 'exclamation-circle',
      'Overall Accuracy ' + overallAcc + '% \u2014 ' + Math.abs(aboveTarget) + 'pp Below Target:',
      totalCount.toLocaleString() + ' audits. Immediate corrective action required to reach 95% target.'
    ));
  }

  // ── 2. Month trajectory ──
  if (sortedMonths.length >= 2 && lastMon && firstMon) {
    var momDiff = +(lastMon.Accuracy - firstMon.Accuracy).toFixed(2);
    if (!trendUp && !trendFlat && worstMon) {
      // Declining — show dip detail
      items.push(insightItem('warning', 'user-times',
        'Accuracy Dip in ' + lastMon.Month + ' \u2014 Action Required:',
        'Accuracy moved from ' + firstMon.Accuracy + '% in ' + firstMon.Month
        + ' to ' + lastMon.Accuracy + '% in ' + lastMon.Month
        + ' (' + (momDiff >= 0 ? '+' : '') + momDiff + '%).'
        + (worstMon && worstMon.Accuracy === lastMon.Accuracy
          ? ' This is the lowest month in the period.'
          : ' Lowest point: ' + worstMon.Month + ' at ' + worstMon.Accuracy + '%.')
        + ' Root cause analysis recommended.'
      ));
    } else {
      // Improving or flat
      items.push(insightItem('green', 'trending-up',
        (trendFlat ? 'Accuracy Stable' : 'Positive Accuracy Trend') + ' (' + firstMon.Month + '\u2192' + lastMon.Month + '):',
        firstMon.Accuracy + '% \u2192 ' + lastMon.Accuracy + '% ('
        + (momDiff >= 0 ? '+' : '') + momDiff + '%).'
        + (bestMon ? ' Best month: ' + bestMon.Month + ' at ' + bestMon.Accuracy + '%.' : '')
      ));
    }
  }

  // ── 3. Top error parameter ──
  if (topErr1) {
    var errShare = totalErrors > 0 ? ((topErr1.Opportunity_Fail / totalErrors) * 100).toFixed(1) : '0';
    var errRate  = topErr1.Opportunity_Count > 0
      ? ((topErr1.Opportunity_Fail / topErr1.Opportunity_Count) * 100).toFixed(1) : '0';
    items.push(insightItem('alert', 'exclamation-circle',
      '"' + topErr1.Parameter + '" \u2014 Critical Error Parameter:',
      topErr1.Opportunity_Fail + ' failures'
      + (topErr1.Opportunity_Count > 0 ? ' (' + errRate + '% error rate on ' + topErr1.Opportunity_Count + ' audits)' : '')
      + '. Accounts for ' + errShare + '% of all errors.'
      + (topErr2 ? ' 2nd highest: "' + topErr2.Parameter + '" with ' + topErr2.Opportunity_Fail + ' failures.' : '')
      + ' Immediate validation fix recommended.'
    ));
  }

  // ── 4. Worst week spike ──
  if (worstWeek && worstWeek.Accuracy < 97) {
    items.push(insightItem('warning', 'fire',
      worstWeek.Week_Label + ' Accuracy Spike Detected:',
      'Accuracy dropped to ' + worstWeek.Accuracy + '% \u2014 the lowest week in the selected period.'
      + ' ' + worstWeek.Opportunity_Fail + ' errors across ' + worstWeek.Opportunity_Count + ' audits.'
      + (bestWeek && bestWeek.Week_Label !== worstWeek.Week_Label
        ? ' Best week: ' + bestWeek.Week_Label + ' at ' + bestWeek.Accuracy + '%.' : '')
    ));
  }

  // ── 5. Recruiter performance gap ──
  if (botRec3.length > 0) {
    var names = botRec3.map(function(r){ return r.Recruiter + ' (' + r.Avg_Accuracy + '%)'; }).join(', ');
    var avgTeam = totalCount > 0 ? overallAcc : 0;
    items.push(insightItem('warning', 'user-times',
      'Recruiter Performance Gap:',
      botRec3.length + ' recruiter' + (botRec3.length > 1 ? 's' : '') + ' significantly below team average of ' + avgTeam + '%: '
      + names + '.'
      + (botRec3[0].Audit_Count ? ' ' + botRec3[0].Recruiter + ' has ' + (botRec3[0].Audit_Count||0).toLocaleString() + ' audits at ' + botRec3[0].Avg_Accuracy + '%.' : '')
      + ' Targeted coaching recommended.'
    ));
  }

  // ── 6. Stage accuracy gap ──
  if (stgStats.length >= 2 && worstStg) {
    var bestStg2 = [...stgStats].sort(function(a,b){ return b.Accuracy - a.Accuracy; })[0];
    var stgGap   = +(bestStg2.Accuracy - worstStg.Accuracy).toFixed(2);
    if (stgGap > 0.5) {
      items.push(insightItem('info', 'chart-bar',
        'Stage Accuracy Gap (' + stgGap + 'pp):',
        worstStg.Stage + ' at ' + worstStg.Accuracy + '% (' + worstStg.Opportunity_Count.toLocaleString() + ' audits, '
        + worstStg.Opportunity_Fail + ' errors) vs '
        + bestStg2.Stage + ' at ' + bestStg2.Accuracy + '%.'
        + ' Focus process improvements on ' + worstStg.Stage + '.'
      ));
    }
  }

  // ── 7. Hire type gap ──
  if (htExp && htUR) {
    var htGap2 = +(Math.abs(htExp.totals.accuracy - htUR.totals.accuracy)).toFixed(2);
    if (htGap2 > 0.3) {
      var lower2  = htExp.totals.accuracy < htUR.totals.accuracy ? 'HPE Experienced' : 'HPE UR';
      var higher2 = htExp.totals.accuracy > htUR.totals.accuracy ? 'HPE Experienced' : 'HPE UR';
      var lowerA  = Math.min(htExp.totals.accuracy, htUR.totals.accuracy);
      var higherA = Math.max(htExp.totals.accuracy, htUR.totals.accuracy);
      items.push(insightItem('info', 'info-circle',
        'Hire Type Gap \u2014 ' + htGap2 + 'pp Difference:',
        higher2 + ' leads at ' + higherA + '% vs ' + lower2 + ' at ' + lowerA + '%.'
        + (htGap2 > 1 ? ' Targeted process alignment for ' + lower2 + ' is recommended.' : '')
      ));
    }
  }

  // ── 8. PM team ──
  if (worstPM && worstPM.Avg_Accuracy < 99) {
    items.push(insightItem('info', 'chart-bar',
      worstPM.PM + ' PM Team \u2014 Below Average:',
      worstPM.Avg_Accuracy + '% accuracy'
      + (worstPM.Audit_Count ? ' across ' + worstPM.Audit_Count.toLocaleString() + ' audits' : '')
      + '. Consider a team process review to close the gap.'
    ));
  }

  // Fallback if data is empty
  if (items.length === 0) {
    items.push(insightItem('info', 'info-circle',
      'No data loaded yet.',
      'Upload your Excel audit file in the Data Management tab to auto-generate insights.'
    ));
  }

  listEl.innerHTML = items.join('');
}

// ---- UPDATE EXECUTIVE KPI CARDS ----
function updateExecutiveKPIs() {
  var weeks  = getFilteredWeeks();
  var months = getFilteredMonths();
  // Use hire-type-aware sources for MoM/WoW baseline comparisons
  var sortedMonths = [...getHireTypeMonthStats()].sort(function(a,b){ return a.Month_Number - b.Month_Number; });

  // Compute aggregated metrics from filtered weeks
  var totalCount = weeks.reduce(function(s,w){ return s + w.Opportunity_Count; }, 0);
  var totalPass  = weeks.reduce(function(s,w){ return s + w.Opportunity_Pass;  }, 0);
  var totalFail  = weeks.reduce(function(s,w){ return s + w.Opportunity_Fail;  }, 0);
  var totalNA    = weeks.reduce(function(s,w){ return s + w.Opportunity_NA;    }, 0);
  var accuracy   = totalCount > 0 ? +((totalPass / totalCount) * 100).toFixed(2) : 0;
  var errRate    = totalCount > 0 ? +((totalFail / totalCount) * 100).toFixed(2) : 0;
  var passRate   = totalCount > 0 ? +((totalPass / totalCount) * 100).toFixed(2) : 0;

  // Period label
  var periodLabel = getPeriodLabel();

  // MoM / WoW computation
  var momVal = '', momLabel = '', momClass = 'delta-neutral';
  var wowVal = '', wowLabel = '', wowClass = 'delta-neutral';

  if (ACTIVE_FILTER.mode === 'fy' || ACTIVE_FILTER.value === 'all') {
    // FY mode: latest vs previous month
    var lastM = sortedMonths[sortedMonths.length - 1];
    var prevM = sortedMonths[sortedMonths.length - 2];
    if (lastM && prevM) {
      var d = +(lastM.Accuracy - prevM.Accuracy).toFixed(2);
      momVal = (d >= 0 ? '+' : '') + d + '%';
      momLabel = lastM.Month + ' vs ' + prevM.Month;
      momClass = d >= 0 ? 'delta-up' : 'delta-down';
    }
    // WoW: last vs second-last week — use hire-type-aware source
    var allW = [...getHireTypeWeekStats()].sort(function(a,b){
      return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
    });
    var lastW = allW[allW.length-1], prevW = allW[allW.length-2];
    if (lastW && prevW) {
      var dw = +(lastW.Accuracy - prevW.Accuracy).toFixed(2);
      wowVal = (dw >= 0 ? '+' : '') + dw + '%';
      wowLabel = lastW.Week_Label + ' vs ' + prevW.Week_Label;
      wowClass = dw >= 0 ? 'delta-up' : 'delta-down';
    }
  } else if (ACTIVE_FILTER.mode === 'month') {
    // Month mode: this month vs previous month
    var curM = sortedMonths.find(function(m){ return m.Month === ACTIVE_FILTER.value; });
    var curIdx = sortedMonths.indexOf(curM);
    var preM = curIdx > 0 ? sortedMonths[curIdx - 1] : null;
    if (curM && preM) {
      var dm = +(curM.Accuracy - preM.Accuracy).toFixed(2);
      momVal = (dm >= 0 ? '+' : '') + dm + '%';
      momLabel = curM.Month + ' vs ' + preM.Month;
      momClass = dm >= 0 ? 'delta-up' : 'delta-down';
    } else { momVal = 'N/A'; momLabel = 'No prior month'; }
    // WoW: last week of this month vs previous week
    var mWeeks = weeks;
    var lW = mWeeks[mWeeks.length-1], pW = mWeeks[mWeeks.length-2];
    if (lW && pW) {
      var dwm = +(lW.Accuracy - pW.Accuracy).toFixed(2);
      wowVal = (dwm >= 0 ? '+' : '') + dwm + '%';
      wowLabel = lW.Week_Label + ' vs ' + pW.Week_Label;
      wowClass = dwm >= 0 ? 'delta-up' : 'delta-down';
    } else if (lW) { wowVal = lW.Accuracy + '%'; wowLabel = 'Only week'; }
  } else if (ACTIVE_FILTER.mode === 'week') {
    // Week mode: this week vs previous week — hire-type-aware source
    var allSorted = [...getHireTypeWeekStats()].sort(function(a,b){
      return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
    });
    var curWIdx = allSorted.findIndex(function(w){ return w.Week_Label === ACTIVE_FILTER.value; });
    var curW = allSorted[curWIdx], preW = curWIdx > 0 ? allSorted[curWIdx - 1] : null;
    if (curW && preW) {
      var dwk = +(curW.Accuracy - preW.Accuracy).toFixed(2);
      wowVal = (dwk >= 0 ? '+' : '') + dwk + '%';
      wowLabel = curW.Week_Label + ' vs ' + preW.Week_Label;
      wowClass = dwk >= 0 ? 'delta-up' : 'delta-down';
    } else { wowVal = 'First week'; wowLabel = 'No prior data'; }
    momVal = 'N/A'; momLabel = 'Select a month for MoM'; momClass = 'delta-neutral';
  }

  // Accuracy delta vs first month (FY reference) — hire-type-aware
  var janData = sortedMonths.length > 0 ? sortedMonths[0] : null;
  var accDelta = '', accDeltaClass = 'delta-up';
  if (ACTIVE_FILTER.mode !== 'fy' && ACTIVE_FILTER.value !== 'all' && janData) {
    var ad = +(accuracy - janData.Accuracy).toFixed(2);
    accDelta = (ad >= 0 ? '+' : '') + ad + '% vs ' + janData.Month;
    accDeltaClass = ad >= 0 ? 'delta-up' : 'delta-down';
  } else {
    var lastMon = sortedMonths[sortedMonths.length - 1];
    var firstMon = sortedMonths[0];
    if (lastMon && firstMon) {
      var ad2 = +(lastMon.Accuracy - firstMon.Accuracy).toFixed(2);
      accDelta = (ad2 >= 0 ? '+' : '') + ad2 + '% vs ' + firstMon.Month;
      accDeltaClass = ad2 >= 0 ? 'delta-up' : 'delta-down';
    }
  }

  // --- Update DOM ---
  setText('kpi-accuracy', accuracy + '%');
  setHtml('kpi-accuracy-delta', '<i class="fas fa-' + (accDeltaClass==='delta-up'?'arrow-up':'arrow-down') + '"></i> ' + accDelta);
  setClass('kpi-accuracy-delta', 'kpi-delta ' + accDeltaClass);
  setText('kpi-accuracy-sub', 'Target: 95.00% | ' + periodLabel + (ACTIVE_HIRE_TYPE !== 'all' ? ' | ' + getHireTypeLabel() : ''));

  setText('kpi-total', totalCount.toLocaleString());
  setHtml('kpi-total-delta', '<i class="fas fa-clipboard-list"></i> ' + periodLabel);
  setText('kpi-total-sub', weeks.length + ' week(s) in view');

  setText('kpi-pass', passRate + '%');
  setHtml('kpi-pass-delta', '<i class="fas fa-check"></i> ' + totalPass.toLocaleString() + ' audits passed');
  setText('kpi-pass-sub', 'Out of ' + totalCount.toLocaleString() + ' total');

  setText('kpi-errors', errRate + '%');
  setHtml('kpi-errors-delta', '<i class="fas fa-arrow-' + (errRate > 2 ? 'up' : 'down') + '"></i> ' + totalFail + ' errors');
  setClass('kpi-errors-delta', 'kpi-delta delta-down');
  setText('kpi-errors-sub', 'Across 12 parameters');

  // N/A count
  setText('kpi-na', totalNA.toLocaleString());
  setHtml('kpi-na-delta', '<i class="fas fa-minus"></i> Not applicable checkpoints');
  setText('kpi-na-sub', 'Excluded from accuracy calc');

  setText('kpi-mom', momVal || '—');
  setHtml('kpi-mom-delta', '<i class="fas fa-arrow-' + (momClass==='delta-up'?'up':momClass==='delta-down'?'down':'right') + '"></i> ' + momLabel);
  setClass('kpi-mom-delta', 'kpi-delta ' + momClass);
  setText('kpi-mom-sub', 'Apr vs Mar change');

  setText('kpi-wow', wowVal || '—');
  setHtml('kpi-wow-delta', '<i class="fas fa-arrow-' + (wowClass==='delta-up'?'up':wowClass==='delta-down'?'down':'right') + '"></i> ' + wowLabel);
  setClass('kpi-wow-delta', 'kpi-delta ' + wowClass);
  setText('kpi-wow-sub', 'Latest week vs prior week');

  // Gauges — Overall driven by filtered accuracy; Critical/Non-Critical scaled proportionally
  drawGauge('gaugeOverall', accuracy, '#01A982');
  setText('gaugeOverallVal', accuracy + '%');
  var gOS = document.getElementById('gaugeOverallStatus');
  if (gOS) { gOS.className = 'gauge-status ' + (accuracy >= 95 ? 'good' : 'bad'); gOS.textContent = accuracy >= 95 ? '\u2713 Above Target' : '\u2717 Below Target'; }

  // Critical / Non-Critical: derive from crit_stats scaled by filter delta vs FY baseline
  var fyBaseline = 98.50; // FY overall accuracy
  var critFY     = DASHBOARD_DATA.crit_stats.find(function(c){ return c.Criticality === 'Critical'; });
  var nonCritFY  = DASHBOARD_DATA.crit_stats.find(function(c){ return c.Criticality === 'Non Critical'; });
  var critFYAcc    = critFY    ? critFY.Accuracy    : 98.62;
  var nonCritFYAcc = nonCritFY ? nonCritFY.Accuracy : 97.89;
  var delta = accuracy - fyBaseline; // how much the filtered period differs from FY
  var critAcc    = Math.min(100, Math.max(85, +(critFYAcc    + delta).toFixed(2)));
  var nonCritAcc = Math.min(100, Math.max(85, +(nonCritFYAcc + delta).toFixed(2)));

  drawGauge('gaugeCritical',    critAcc,    '#0D5DBF');
  setText('gaugeCriticalVal',    critAcc + '%');
  var gCS = document.getElementById('gaugeCriticalStatus');
  if (gCS) { gCS.className = 'gauge-status ' + (critAcc >= 95 ? 'good' : 'warning'); gCS.textContent = critAcc >= 95 ? '\u2713 Above Target' : '\u26a0 Below Target'; }

  drawGauge('gaugeNonCritical', nonCritAcc, '#FF8300');
  setText('gaugeNonCriticalVal', nonCritAcc + '%');
  var gNCS = document.getElementById('gaugeNonCriticalStatus');
  if (gNCS) { gNCS.className = 'gauge-status ' + (nonCritAcc >= 97 ? 'good' : 'warning'); gNCS.textContent = nonCritAcc >= 97 ? '\u2713 Above Target' : '\u26a0 Below Target'; }

  // Section subtitle
  var subEl = document.querySelector('#tab-executive .section-subtitle');
  if (subEl) subEl.textContent = periodLabel + ' | HPE Talent Acquisition Audit Performance Overview';

  // Rebuild the Audit Intelligence Snapshot panel from live data
  _buildAuditIntelligenceSnapshot();
}

function getPeriodLabel() {
  if (ACTIVE_FILTER.mode === 'fy' || ACTIVE_FILTER.value === 'all') return 'FY2026 (Jan\u2013Apr)';
  if (ACTIVE_FILTER.mode === 'month') return ACTIVE_FILTER.value + ' 2026';
  if (ACTIVE_FILTER.mode === 'week')  return ACTIVE_FILTER.value + ' 2026';
  return 'FY2026';
}

function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
function setHtml(id, val) { var el = document.getElementById(id); if (el) el.innerHTML = val; }
function setClass(id, cls) { var el = document.getElementById(id); if (el) el.className = cls; }

// ---- UPDATE EXECUTIVE CHARTS ----
function updateExecutiveCharts() {
  var weeks = getFilteredWeeks();
  var labels = weeks.map(function(w){ return w.Week_Label; });
  var accData = weeks.map(function(w){ return w.Accuracy; });

  // Sparkline — dual series when "All" hire type
  destroyChart('sparklineChart');
  var spEl = document.getElementById('sparklineChart');
  if (spEl) {
    var spDatasets;
    if (ACTIVE_HIRE_TYPE === 'all') {
      // Show combined line + Exp + UR as separate thin lines
      var expWeeks = [...DASHBOARD_DATA.hireTypeStats.HPE_Experienced.week_stats]
        .sort(function(a,b){return a.Month_Number!==b.Month_Number?a.Month_Number-b.Month_Number:a.Week-b.Week;})
        .filter(function(w){return weeks.some(function(fw){return fw.Week_Label===w.Week_Label;});});
      var urWeeks  = [...DASHBOARD_DATA.hireTypeStats.HPE_UR.week_stats]
        .sort(function(a,b){return a.Month_Number!==b.Month_Number?a.Month_Number-b.Month_Number:a.Week-b.Week;})
        .filter(function(w){return weeks.some(function(fw){return fw.Week_Label===w.Week_Label;});});
      spDatasets = [
        { label: 'Combined', data: accData, borderColor:'#01A982', backgroundColor:'rgba(1,169,130,0.08)',
          tension:0.4, fill:true, pointRadius:3, borderWidth:2,
          pointBackgroundColor: accData.map(function(a){return a<95?'#C54E4B':a<98?'#FF8300':'#01A982';}),
          pointBorderColor:'white', pointBorderWidth:1 },
        { label: 'HPE Experienced', data: expWeeks.map(function(w){return w.Accuracy;}),
          borderColor:'#0D5DBF', borderWidth:1.5, tension:0.4, fill:false, pointRadius:3,
          pointBackgroundColor:'#0D5DBF', pointBorderColor:'white', pointBorderWidth:1 },
        { label: 'HPE UR', data: urWeeks.map(function(w){return w.Accuracy;}),
          borderColor:'#FF8300', borderWidth:1.5, tension:0.4, fill:false, pointRadius:3,
          pointBackgroundColor:'#FF8300', pointBorderColor:'white', pointBorderWidth:1, borderDash:[3,2] },
        { label: '95% Target', data: labels.map(function(){return 95;}),
          borderColor:'#C54E4B', borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false }
      ];
    } else {
      var htColor = ACTIVE_HIRE_TYPE==='HPE_Experienced' ? '#0D5DBF' : '#FF8300';
      spDatasets = [
        { label: getHireTypeLabel() + ' Accuracy %', data: accData, borderColor:htColor,
          backgroundColor: ACTIVE_HIRE_TYPE==='HPE_Experienced' ? 'rgba(13,93,191,0.1)' : 'rgba(255,131,0,0.1)',
          tension:0.4, fill:true, pointRadius:4,
          pointBackgroundColor: accData.map(function(a){return a<95?'#C54E4B':a<98?'#FF8300':htColor;}),
          pointBorderColor:'white', pointBorderWidth:2, pointHoverRadius:7 },
        { label: '95% Target', data: labels.map(function(){return 95;}),
          borderColor:'#C54E4B', borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false }
      ];
    }
    charts['sparklineChart'] = new Chart(spEl.getContext('2d'), {
      type: 'line',
      data: { labels: labels, datasets: spDatasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: ACTIVE_HIRE_TYPE==='all', position:'top', labels:{font:{size:10},boxWidth:10,padding:8} },
          tooltip: {mode:'index'} },
        scales: {
          y: { min: Math.min(91, Math.floor(Math.min(...accData)) - 1), max: 100,
            ticks: { callback: function(v){ return v+'%'; }, font:{size:11} } },
          x: { ticks: {font:{size:10}, maxRotation:45}, grid:{display:false} }
        }
      }
    });
  }

  // Rebuild month table filtered
  buildMonthTable();
}

// ---- UPDATE ACCURACY TRENDS CHARTS ----
function updateTrendCharts() {
  // Called both from initTrendCharts (first build) and from filter changes
  var weeks  = getFilteredWeeks();
  var months = getFilteredMonths();

  // Monthly trend chart — dual-series when "All" hire type, single-series when filtered
  destroyChart('monthlyTrendChart');
  var mtEl = document.getElementById('monthlyTrendChart');
  if (mtEl && months.length > 0) {
    var mtDatasets;
    if (ACTIVE_HIRE_TYPE === 'all') {
      // Show Experienced + UR as separate lines
      var expMonths = [...DASHBOARD_DATA.hireTypeStats.HPE_Experienced.month_stats]
        .sort(function(a,b){return a.Month_Number-b.Month_Number;})
        .filter(function(m){ return months.some(function(fm){return fm.Month===m.Month;}); });
      var urMonths  = [...DASHBOARD_DATA.hireTypeStats.HPE_UR.month_stats]
        .sort(function(a,b){return a.Month_Number-b.Month_Number;})
        .filter(function(m){ return months.some(function(fm){return fm.Month===m.Month;}); });
      mtDatasets = [
        { label: 'HPE Experienced', data: expMonths.map(function(m){return m.Accuracy;}),
          borderColor:'#0D5DBF', backgroundColor:'rgba(13,93,191,0.08)', tension:0.4, fill:true,
          pointRadius:6, pointBackgroundColor:'#0D5DBF', pointBorderColor:'white', pointBorderWidth:2, yAxisID:'y', order:1 },
        { label: 'HPE UR', data: urMonths.map(function(m){return m.Accuracy;}),
          borderColor:'#FF8300', backgroundColor:'rgba(255,131,0,0.08)', tension:0.4, fill:true,
          pointRadius:6, pointBackgroundColor:'#FF8300', pointBorderColor:'white', pointBorderWidth:2, yAxisID:'y', order:2 },
        { label: 'Combined Error Rate %', data: months.map(function(m){return m.Error_Rate;}),
          borderColor:'#C54E4B', backgroundColor:'rgba(197,78,75,0.08)', tension:0.4,
          type:'bar', yAxisID:'y2', order:3 },
        { label: '95% Target', data: months.map(function(){return 95;}),
          borderColor:'#94a3b8', borderDash:[8,4], borderWidth:1.5, pointRadius:0, fill:false, yAxisID:'y', order:0 }
      ];
    } else {
      mtDatasets = [
        { label: getHireTypeLabel() + ' Accuracy %', data: months.map(function(m){return m.Accuracy;}),
          borderColor: ACTIVE_HIRE_TYPE==='HPE_Experienced' ? '#0D5DBF' : '#FF8300',
          backgroundColor: ACTIVE_HIRE_TYPE==='HPE_Experienced' ? 'rgba(13,93,191,0.12)' : 'rgba(255,131,0,0.12)',
          tension:0.4, fill:true,
          pointRadius:6, pointBackgroundColor: ACTIVE_HIRE_TYPE==='HPE_Experienced' ? '#0D5DBF' : '#FF8300',
          pointBorderColor:'white', pointBorderWidth:2, yAxisID:'y', order:1 },
        { label: 'Error Rate %', data: months.map(function(m){return m.Error_Rate;}),
          borderColor:'#C54E4B', backgroundColor:'rgba(197,78,75,0.08)', tension:0.4,
          type:'bar', yAxisID:'y2', order:2 },
        { label: '95% Target', data: months.map(function(){return 95;}),
          borderColor:'#FF8300', borderDash:[8,4], borderWidth:2, pointRadius:0, fill:false, yAxisID:'y', order:0 }
      ];
    }
    charts['monthlyTrendChart'] = new Chart(mtEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: months.map(function(m){ return m.Month + ' 2026'; }),
        datasets: mtDatasets
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: {mode:'index', intersect:false},
        plugins: { legend: {position:'top', labels:{font:{size:12},padding:16,boxWidth:14}} },
        scales: {
          y:  { min: 88, max: 100, position:'left', ticks:{callback:function(v){return v+'%';}, font:{size:11}} },
          y2: { min: 0,  max: 5,   position:'right', ticks:{callback:function(v){return v+'%';}, font:{size:11}}, grid:{display:false} },
          x:  { ticks:{font:{size:12}}, grid:{display:false} }
        }
      }
    });
  }

  // Weekly error chart
  destroyChart('weeklyErrorChart');
  var weEl = document.getElementById('weeklyErrorChart');
  if (weEl && weeks.length > 0) {
    charts['weeklyErrorChart'] = new Chart(weEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: weeks.map(function(w){ return w.Week_Label; }),
        datasets: [{ label: 'Errors', data: weeks.map(function(w){ return w.Opportunity_Fail; }),
          backgroundColor: weeks.map(function(w){ return w.Opportunity_Fail > 20 ? '#C54E4B' : w.Opportunity_Fail > 10 ? '#FF8300' : '#01A982'; }),
          borderRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {legend:{display:false}},
        scales: {
          y: { ticks:{font:{size:11}}, title:{display:true, text:'Error Count', font:{size:11}} },
          x: { ticks:{font:{size:10}, maxRotation:45}, grid:{display:false} }
        }
      }
    });
  }

  // Rebuild drill table with filter
  buildWeeklyTable();
  // Rebuild critical bar chart with current filter delta
  rebuildCriticalBarChart();
}

// Standalone helper — build/rebuild Critical vs Non-Critical bar chart
// Called from initTrendCharts, updateTrendCharts, and switchTab revisit
function rebuildCriticalBarChart() {
  var cbEl = document.getElementById('criticalBarChart');
  if (!cbEl) return;
  var fyBaseline2 = 98.50;
  var fw = getFilteredWeeks();
  var tc = fw.reduce(function(s,w){ return s + w.Opportunity_Count; }, 0);
  var tp = fw.reduce(function(s,w){ return s + w.Opportunity_Pass;  }, 0);
  var filtAcc = tc > 0 ? +((tp / tc) * 100).toFixed(2) : fyBaseline2;
  var delta2  = filtAcc - fyBaseline2;
  var cs      = DASHBOARD_DATA.crit_stats;
  var adjAcc  = cs.map(function(c){ return Math.min(100, Math.max(85, +(c.Accuracy + delta2).toFixed(2))); });
  var targets = cs.map(function(c){ return c.Criticality === 'Critical' ? 95 : 97; });
  var colors  = adjAcc.map(function(a, i){ return a >= targets[i] ? 'rgba(1,169,130,0.85)' : 'rgba(197,78,75,0.85)'; });
  var yMin2   = Math.min(88, Math.floor(Math.min.apply(null, adjAcc)) - 2);
  destroyChart('criticalBarChart');
  charts['criticalBarChart'] = new Chart(cbEl.getContext('2d'), {
    type: 'bar',
    data: {
      labels: cs.map(function(c){ return c.Criticality; }),
      datasets: [
        { label: 'Accuracy %', data: adjAcc, backgroundColor: colors, borderRadius: 6, yAxisID: 'y' },
        { label: 'Target %', type: 'line', data: targets,
          borderColor: '#FF8300', borderDash: [6,3], borderWidth: 2,
          pointRadius: 5, pointBackgroundColor: '#FF8300', fill: false, yAxisID: 'y' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: {font:{size:11}, boxWidth:12} },
        tooltip: {
          callbacks: {
            label: function(ctx) { return ctx.dataset.type === 'line' ? 'Target: ' + ctx.raw + '%' : 'Accuracy: ' + ctx.raw + '%'; },
            afterLabel: function(ctx) {
              if (ctx.dataset.type === 'line') return '';
              var c = cs[ctx.dataIndex];
              return 'Total: ' + c.Opportunity_Count.toLocaleString() + ' | Pass: ' + c.Opportunity_Pass.toLocaleString() + ' | Fail: ' + c.Opportunity_Fail;
            }
          }
        }
      },
      scales: {
        y: { min: yMin2, max: 100, ticks: {callback:function(v){ return v+'%'; }, font:{size:11}}, grid:{color:'rgba(0,0,0,0.06)'} },
        x: { grid:{display:false}, ticks:{font:{size:12}} }
      }
    }
  });
}
function updateImprovementCharts() {
  buildForecastChart();
  buildDeltaTable();
  // Rebuild pareto, recruiter, PM, stage error charts with current hire type filter
  var errors = DASHBOARD_DATA.top_errors.filter(function(e){ return e.Opportunity_Fail > 0; });
  var totalErrors = errors.reduce(function(s,e){return s+e.Opportunity_Fail;},0);
  var cumulative = 0;
  var cumulativeData = errors.map(function(e){ cumulative+=e.Opportunity_Fail; return +((cumulative/totalErrors)*100).toFixed(1); });
  destroyChart('paretoChart');
  var pEl = document.getElementById('paretoChart');
  if (pEl) {
    charts['paretoChart'] = new Chart(pEl.getContext('2d'), {
      type:'bar',
      data:{
        labels: errors.map(function(e){ return e.Parameter.length>20?e.Parameter.substring(0,20)+'...':e.Parameter; }),
        datasets:[
          { label:'Error Count', data:errors.map(function(e){return e.Opportunity_Fail;}),
            backgroundColor:errors.map(function(e,i){return i===0?'#C54E4B':i<3?'#FF8300':'#425563';}),
            borderRadius:4, yAxisID:'y' },
          { label:'Cumulative %', data:cumulativeData, type:'line', borderColor:'#0D5DBF',
            borderWidth:2, pointRadius:4, pointBackgroundColor:'#0D5DBF',
            fill:false, tension:0.3, yAxisID:'y2' }
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{legend:{position:'top',labels:{font:{size:11},boxWidth:12}}},
        scales:{ y:{ticks:{font:{size:10}},title:{display:true,text:'Error Count',font:{size:10}}},
          y2:{position:'right',min:0,max:100,ticks:{callback:function(v){return v+'%';},font:{size:10}},grid:{display:false}},
          x:{ticks:{font:{size:9},maxRotation:45}} }
      }
    });
  }
  // Recruiter chart — include hire type label in chart title
  var recData = DASHBOARD_DATA.recruiter_bottom.slice(0,10);
  destroyChart('recruiterErrorChart');
  var rEl = document.getElementById('recruiterErrorChart');
  if (rEl) {
    charts['recruiterErrorChart'] = new Chart(rEl.getContext('2d'), {
      type:'bar',
      data:{
        labels: recData.map(function(r){return r.Recruiter;}),
        datasets:[{ label: getHireTypeLabel()+' \u2014 Avg Accuracy %',
          data: recData.map(function(r){return r.Avg_Accuracy;}),
          backgroundColor: recData.map(function(r){return r.Avg_Accuracy<92?'#C54E4B':r.Avg_Accuracy<95?'#FF8300':'#425563';}),
          borderRadius:4 }]
      },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{ x:{min:85,max:100,ticks:{callback:function(v){return v+'%';},font:{size:10}}},
          y:{ticks:{font:{size:10}}} }
      }
    });
  }
  // PM Chart — dynamic from DASHBOARD_DATA.pm_stats
  destroyChart('pmChart');
  var pmEl = document.getElementById('pmChart');
  if (pmEl && DASHBOARD_DATA.pm_stats && DASHBOARD_DATA.pm_stats.length > 0) {
    var minPM = Math.max(80, Math.floor(Math.min.apply(null, DASHBOARD_DATA.pm_stats.map(function(p){return p.Avg_Accuracy;})) - 2));
    charts['pmChart'] = new Chart(pmEl.getContext('2d'), {
      type:'bar',
      data:{
        labels: DASHBOARD_DATA.pm_stats.map(function(p){return p.PM;}),
        datasets:[{ label:'Accuracy %',
          data: DASHBOARD_DATA.pm_stats.map(function(p){return p.Avg_Accuracy;}),
          backgroundColor: DASHBOARD_DATA.pm_stats.map(function(p){return p.Avg_Accuracy>=99?'#01A982':p.Avg_Accuracy>=98?'#4fc3a1':'#FF8300';}),
          borderRadius:6 }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{ y:{min:minPM,max:100,ticks:{callback:function(v){return v+'%';},font:{size:11}}},
          x:{ticks:{font:{size:10},maxRotation:30},grid:{display:false}} }
      }
    });
  }
  // Stage error chart — dynamic from DASHBOARD_DATA.stage_stats
  destroyChart('stageErrorChart');
  var seEl = document.getElementById('stageErrorChart');
  if (seEl && DASHBOARD_DATA.stage_stats && DASHBOARD_DATA.stage_stats.length > 0) {
    var stageLabels = DASHBOARD_DATA.stage_stats.map(function(s){
      return s.Stage + ' (' + s.Opportunity_Fail + ' errors)';
    });
    var stageVals = DASHBOARD_DATA.stage_stats.map(function(s){ return s.Opportunity_Fail; });
    var stageBg = ['#C54E4B','#FF8300','#0D5DBF','#425563','#01A982'].slice(0, DASHBOARD_DATA.stage_stats.length);
    charts['stageErrorChart'] = new Chart(seEl.getContext('2d'), {
      type:'doughnut',
      data:{
        labels: stageLabels,
        datasets:[{ data:stageVals, backgroundColor:stageBg, borderWidth:2, borderColor:'white' }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{legend:{position:'bottom',labels:{font:{size:11},boxWidth:12}}},
        cutout:'60%'
      }
    });
  }
}

// ==================== OLD FILTER STUBS (kept for any residual calls) ====================
function setFilter(type, el) {
  document.querySelectorAll('.period-filter .filter-btn').forEach(function(b){ b.classList.remove('active'); });
  if (el) el.classList.add('active');
}
function filterTrend(type, el) { applyGlobalFilter('fy','all',el,'trends'); }
function filterByMonth(month) { if (month && month !== 'all') applyGlobalFilter('month', month, null, 'exec'); else applyGlobalFilter('fy','all',null,'exec'); }

// CAPA status filter — used by filter buttons on the CAPA tab
function filterCapa(type, el) {
  document.querySelectorAll('#tab-capa .filter-btn').forEach(function(b){ b.classList.remove('active'); });
  if (el) el.classList.add('active');
  capaFilterState = type;
  buildCAPATable(type);
}

// ==================== REFRESH ====================
function refreshDashboard() {
  const refreshBtn = document.querySelector('.btn-refresh');
  if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
  setTimeout(() => {
    if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    const now = new Date();
    var rt = document.getElementById('refreshTime');
    if (rt) rt.textContent = 'Last refreshed: ' + now.toLocaleTimeString();
    var dlr = document.getElementById('dataLastRefresh');
    if (dlr) dlr.textContent = now.toLocaleString();
  }, 1200);
}

// ==================== FILE UPLOAD & DATA PROCESSING ====================

// Stores last-uploaded parsed data split by hire type
var UPLOADED_DATA = null;

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  _doParseFile(file);
}

function handleDrop(event) {
  event.preventDefault();
  const zone = document.getElementById('uploadZone');
  zone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) _doParseFile(file);
}

function _doParseFile(file) {
  const zone = document.getElementById('uploadZone');
  zone.innerHTML = \`
    <div class="upload-icon" style="color:var(--hpe-blue)"><i class="fas fa-spinner fa-spin"></i></div>
    <div class="upload-title" style="color:var(--hpe-blue)">Reading: \${file.name}</div>
    <div class="upload-subtitle">Parsing \${(file.size/1024).toFixed(1)} KB — please wait...</div>
  \`;

  const reader = new FileReader();
  const isCSV = file.name.toLowerCase().endsWith('.csv');

  reader.onload = function(e) {
    try {
      var paramRows = [], recRows = [];

      if (isCSV) {
        // CSV = treat as Parameter audit count sheet only
        paramRows = _parseCSVRows(e.target.result);
        recRows   = [];
      } else {
        // Excel — look for both named sheets
        var wb = XLSX.read(e.target.result, {type:'array'});
        var sheetNames = wb.SheetNames;

        // Find "Parameter audit count" sheet (case-insensitive, partial match)
        var paramSheetName = sheetNames.find(function(n){
          return n.toLowerCase().replace(/\\s+/g,'').includes('parameteraudit') ||
                 n.toLowerCase().replace(/\\s+/g,'').includes('paramaudit') ||
                 n.toLowerCase() === 'parameter audit count' ||
                 n.toLowerCase() === 'parameter data';
        }) || sheetNames[0];

        // Find "Recruiter audit count" sheet
        var recSheetName = sheetNames.find(function(n){
          return n.toLowerCase().replace(/\\s+/g,'').includes('recruiteraudit') ||
                 n.toLowerCase().replace(/\\s+/g,'').includes('recaudit') ||
                 n.toLowerCase() === 'recruiter audit count' ||
                 n.toLowerCase() === 'recruiter data';
        });

        paramRows = XLSX.utils.sheet_to_json(wb.Sheets[paramSheetName], {defval:''});
        recRows   = recSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[recSheetName], {defval:''}) : [];
      }

      if (!paramRows || paramRows.length === 0) {
        _uploadError(zone, 'No data rows found in the Parameter audit count sheet.');
        return;
      }

      // Normalise all keys: trim whitespace
      function normRows(rows) {
        return rows.map(function(r) {
          var n = {};
          Object.keys(r).forEach(function(k){
            n[k.trim()] = (typeof r[k] === 'string') ? r[k].trim() : r[k];
          });
          return n;
        });
      }
      paramRows = normRows(paramRows);
      recRows   = normRows(recRows);

      // Validate Parameter sheet required columns
      var pKeys = Object.keys(paramRows[0]).map(function(k){ return k.toLowerCase(); });
      var pRequired = ['month', 'week', 'parameter', 'opportunity count'];
      var pMissing = pRequired.filter(function(r){
        return !pKeys.some(function(k){ return k === r || k.replace(/\\s+/g,'') === r.replace(/\\s+/g,''); });
      });
      if (pMissing.length > 0) {
        _uploadError(zone, 'Parameter audit count sheet missing columns: ' + pMissing.join(', ') +
          '. Required: Month, Week, Parameter, Opportunity Count, Opportunity Pass, Opportunity Fail, Opportunity NA');
        return;
      }

      // Process both sheets
      var result = _processSheets(paramRows, recRows);
      UPLOADED_DATA = result;

      _injectDashboardData(result);
      _fullDashboardRebuild();

      var totalRows = paramRows.length + recRows.length;
      zone.innerHTML = \`
        <div class="upload-icon" style="color:var(--hpe-green)"><i class="fas fa-check-circle"></i></div>
        <div class="upload-title" style="color:var(--hpe-green)">Loaded: \${file.name}</div>
        <div class="upload-subtitle">
          Parameter sheet: \${paramRows.length.toLocaleString()} rows &nbsp;|&nbsp;
          Recruiter sheet: \${recRows.length.toLocaleString()} rows &nbsp;|&nbsp;
          Dashboard fully updated &mdash; drop another file to refresh
        </div>
      \`;

      _updateDataStatusPanel(result, file, paramRows.length, recRows.length);

      const now = new Date();
      var rt = document.getElementById('refreshTime');
      if (rt) rt.textContent = 'Last refreshed: ' + now.toLocaleTimeString();
      var dlr = document.getElementById('dataLastRefresh');
      if (dlr) dlr.textContent = now.toLocaleString();

      showToast('Dashboard updated — ' + paramRows.length.toLocaleString() + ' parameter rows, ' + recRows.length.toLocaleString() + ' recruiter rows', 'success');

    } catch(err) {
      _uploadError(zone, 'Parse error: ' + err.message);
    }
  };

  reader.onerror = function() { _uploadError(zone, 'File read error. Please try again.'); };
  if (isCSV) { reader.readAsText(file); } else { reader.readAsArrayBuffer(file); }
}

function _uploadError(zone, msg) {
  zone.innerHTML = \`
    <div class="upload-icon" style="color:var(--hpe-red)"><i class="fas fa-exclamation-circle"></i></div>
    <div class="upload-title" style="color:var(--hpe-red)">Upload Failed</div>
    <div class="upload-subtitle" style="color:var(--hpe-red)">\${msg}</div>
  \`;
  showToast(msg, 'error');
}

function _parseCSVRows(text) {
  var lines = text.split(/\\r?\\n/);
  if (lines.length < 2) return [];
  var headers = lines[0].split(',').map(function(h){ return h.replace(/^"|"$/g,'').trim(); });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var vals = lines[i].split(',').map(function(v){ return v.replace(/^"|"$/g,'').trim(); });
    var obj = {};
    headers.forEach(function(h, idx){ obj[h] = vals[idx] || ''; });
    rows.push(obj);
  }
  return rows;
}

// ============================================================
//  CORE COMPUTATION ENGINE — two-sheet aware
//  Sheet 1 "Parameter audit count":
//    Client, Region, Financial Year, Month, Month Number, Week,
//    Critical/Non Critical, Stage, Parameter,
//    Total Population, Opportunity Count, Opportunity Pass,
//    Opportunity Fail, Opportunity NA, Accuracy Score, Error %,
//    Sample Percentage, Regional Head, Practice Head
//
//  Sheet 2 "Recruiter audit count":
//    Client, Financial Year, Month, MonthNumber, Week,
//    Recruiter Name, Program Manager, Critical/Non Critical,
//    Stage, Parameter, Accuracy, Regional Head, Practice Head, Region
// ============================================================
function _processSheets(paramRows, recRows) {

  // ---- helpers ----
  function colVal(row, names) {
    // names = array of possible column name variants (case-insensitive)
    var keys = Object.keys(row);
    for (var ni = 0; ni < names.length; ni++) {
      var target = names[ni].toLowerCase().replace(/\\s+/g,'');
      var k = keys.find(function(k){
        return k.toLowerCase().replace(/\\s+/g,'') === target;
      });
      if (k !== undefined) return (row[k] === undefined || row[k] === null) ? '' : String(row[k]).trim();
    }
    return '';
  }

  function toNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

  function calcAcc(pass, count) {
    return count > 0 ? +((pass / count) * 100).toFixed(2) : 0;
  }

  // HPE FY month ordering: Jan=10, Feb=11, Mar=12, Apr=13, May=14...
  var MONTH_NUM = {jan:10,feb:11,mar:12,apr:13,may:14,jun:15,jul:16,aug:17,sep:18,oct:19,nov:7,dec:8};
  function monthNum(m) {
    return MONTH_NUM[(m||'').toLowerCase().slice(0,3)] || 99;
  }

  // ---- Determine hire type from Client column ----
  // "HPE_Experienced" and "HPE_UR" may appear in Client or a dedicated column
  function detectHireType(row) {
    var client = colVal(row, ['Client','client','hire_type','HireType']).toLowerCase();
    if (client.includes('hpe_ur') || client === 'ur' || client.includes('university')) return 'HPE_UR';
    if (client.includes('hpe_experienced') || client.includes('experienced') || client.includes('exp')) return 'HPE_Experienced';
    // fallback: treat as Experienced
    return 'HPE_Experienced';
  }

  // ================================================================
  //  PASS 1: Process Parameter audit count sheet
  //  Each row = one pre-aggregated checkpoint (Month × Week × Parameter)
  // ================================================================
  var monthMap = {};
  var weekMap  = {};
  var paramMap = {};
  var stageMap = {};
  var critMap  = {};
  var hireTypeMonthMap = { HPE_Experienced:{}, HPE_UR:{}, combined:{} };
  var hireTypeWeekMap  = { HPE_Experienced:{}, HPE_UR:{} };
  var htTotals = { HPE_Experienced:{pass:0,fail:0,na:0,count:0}, HPE_UR:{pass:0,fail:0,na:0,count:0} };
  var totalPass = 0, totalFail = 0, totalNA = 0, totalCount = 0;

  paramRows.forEach(function(row) {
    var month   = colVal(row, ['Month','month']);
    var week    = parseInt(colVal(row, ['Week','week'])) || 1;
    var param   = colVal(row, ['Parameter','parameter']);
    var stage   = colVal(row, ['Stage','stage']);
    var crit    = colVal(row, ['Critical/Non Critical','Criticality','criticality','critical']);
    var oppCnt  = toNum(colVal(row, ['Opportunity Count','OpportunityCount','opportunity count']));
    var oppPass = toNum(colVal(row, ['Opportunity Pass','OpportunityPass','opportunity pass']));
    var oppFail = toNum(colVal(row, ['Opportunity Fail','OpportunityFail','opportunity fail']));
    var oppNA   = toNum(colVal(row, ['Opportunity NA','OpportunityNA','opportunity na']));
    var ht      = detectHireType(row);

    // If Opportunity Count is 0 but we have individual counts, derive it
    if (oppCnt === 0) oppCnt = oppPass + oppFail;

    if (oppCnt === 0 && oppPass === 0 && oppFail === 0) return; // skip empty rows

    // Global totals
    totalCount += oppCnt;
    totalPass  += oppPass;
    totalFail  += oppFail;
    totalNA    += oppNA;

    // Month
    if (month) {
      if (!monthMap[month]) monthMap[month] = {count:0,pass:0,fail:0,na:0};
      monthMap[month].count += oppCnt;
      monthMap[month].pass  += oppPass;
      monthMap[month].fail  += oppFail;
      monthMap[month].na    += oppNA;
    }

    // Week
    if (month) {
      var wk = month + '||' + week;
      if (!weekMap[wk]) weekMap[wk] = {month:month, week:week, count:0, pass:0, fail:0, na:0};
      weekMap[wk].count += oppCnt;
      weekMap[wk].pass  += oppPass;
      weekMap[wk].fail  += oppFail;
      weekMap[wk].na    += oppNA;
    }

    // Parameter
    if (param) {
      if (!paramMap[param]) paramMap[param] = {count:0,pass:0,fail:0,na:0};
      paramMap[param].count += oppCnt;
      paramMap[param].pass  += oppPass;
      paramMap[param].fail  += oppFail;
      paramMap[param].na    += oppNA;
    }

    // Stage
    if (stage) {
      if (!stageMap[stage]) stageMap[stage] = {count:0,pass:0,fail:0,na:0};
      stageMap[stage].count += oppCnt;
      stageMap[stage].pass  += oppPass;
      stageMap[stage].fail  += oppFail;
      stageMap[stage].na    += oppNA;
    }

    // Criticality (column "Critical/Non Critical")
    if (crit) {
      if (!critMap[crit]) critMap[crit] = {count:0,pass:0,fail:0,na:0};
      critMap[crit].count += oppCnt;
      critMap[crit].pass  += oppPass;
      critMap[crit].fail  += oppFail;
      critMap[crit].na    += oppNA;
    }

    // Hire Type × Month
    if (month) {
      var htM = hireTypeMonthMap[ht];
      if (!htM[month]) htM[month] = {count:0,pass:0,fail:0,na:0};
      htM[month].count += oppCnt; htM[month].pass += oppPass;
      htM[month].fail  += oppFail; htM[month].na  += oppNA;

      var comb = hireTypeMonthMap.combined;
      if (!comb[month]) comb[month] = {count:0,pass:0,fail:0,na:0};
      comb[month].count += oppCnt; comb[month].pass += oppPass;
      comb[month].fail  += oppFail; comb[month].na  += oppNA;

      htTotals[ht].count += oppCnt; htTotals[ht].pass += oppPass;
      htTotals[ht].fail  += oppFail; htTotals[ht].na  += oppNA;

      // Hire Type × Week
      var wkKey = month + '||' + week;
      var htWM = hireTypeWeekMap[ht];
      if (!htWM[wkKey]) htWM[wkKey] = {month:month, week:week, count:0, pass:0, fail:0, na:0};
      htWM[wkKey].count += oppCnt; htWM[wkKey].pass += oppPass;
      htWM[wkKey].fail  += oppFail; htWM[wkKey].na  += oppNA;
    }
  });

  // ================================================================
  //  PASS 2: Process Recruiter audit count sheet
  //  Each row = one accuracy data point for a recruiter × month × week × parameter
  //  Key columns: Recruiter Name, Program Manager, Month, Week, Accuracy
  // ================================================================
  var recruiterMap = {};
  var pmMap = {};

  recRows.forEach(function(row) {
    var rec    = colVal(row, ['Recruiter Name','RecruiterName','Recruiter','recruiter']);
    var pm     = colVal(row, ['Program Manager','ProgramManager','PM','pm']);
    var month  = colVal(row, ['Month','month']);
    var week   = parseInt(colVal(row, ['Week','week','MonthNumber'])) || 1;
    var param  = colVal(row, ['Parameter','parameter']);
    var accStr = colVal(row, ['Accuracy','accuracy','Accuracy Score','AccuracyScore']);
    // Accuracy may be stored as "98.5" or "98.5%" or decimal "0.985"
    var acc = parseFloat(accStr.toString().replace('%',''));
    if (acc > 0 && acc <= 1) acc = +(acc * 100).toFixed(2); // convert 0.985 → 98.5

    if (!rec || isNaN(acc)) return;

    if (!recruiterMap[rec]) recruiterMap[rec] = {pm:pm, months:{}, totalAcc:0, totalRows:0, errors:0};
    recruiterMap[rec].totalAcc  += acc;
    recruiterMap[rec].totalRows += 1;
    if (acc < 100) recruiterMap[rec].errors++;
    if (pm && !recruiterMap[rec].pm) recruiterMap[rec].pm = pm;

    if (month) {
      if (!recruiterMap[rec].months[month]) recruiterMap[rec].months[month] = {totalAcc:0, rows:0};
      recruiterMap[rec].months[month].totalAcc += acc;
      recruiterMap[rec].months[month].rows++;
    }

    if (pm) {
      if (!pmMap[pm]) pmMap[pm] = {totalAcc:0, rows:0, recruiters:new Set()};
      pmMap[pm].totalAcc += acc;
      pmMap[pm].rows++;
      pmMap[pm].recruiters.add(rec);
    }
  });

  // ================================================================
  //  BUILD OUTPUT STRUCTURES
  // ================================================================
  var month_stats = Object.keys(monthMap).map(function(m) {
    var d = monthMap[m];
    return {
      Month_Number: monthNum(m), Month: m,
      Opportunity_Count: d.count, Opportunity_Pass: d.pass,
      Opportunity_Fail: d.fail, Opportunity_NA: d.na,
      Accuracy: calcAcc(d.pass, d.count),
      Error_Rate: d.count > 0 ? +((d.fail/d.count)*100).toFixed(2) : 0
    };
  }).sort(function(a,b){ return a.Month_Number - b.Month_Number; });

  var week_stats = Object.keys(weekMap).map(function(k) {
    var d = weekMap[k];
    return {
      Month: d.month, Month_Number: monthNum(d.month), Week: d.week,
      Opportunity_Count: d.count, Opportunity_Pass: d.pass,
      Opportunity_Fail: d.fail, Opportunity_NA: d.na,
      Accuracy: calcAcc(d.pass, d.count),
      Week_Label: d.month + ' W' + d.week
    };
  }).sort(function(a,b){ return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week; });

  var top_errors = Object.keys(paramMap).map(function(p) {
    var d = paramMap[p];
    return { Parameter: p, Opportunity_Fail: d.fail, Opportunity_Count: d.count,
             Fail_Pct: d.count > 0 ? +((d.fail/d.count)*100).toFixed(2) : 0 };
  }).sort(function(a,b){ return b.Opportunity_Fail - a.Opportunity_Fail; });

  var stage_stats = Object.keys(stageMap).map(function(s) {
    var d = stageMap[s];
    return { Stage: s, Opportunity_Count: d.count + d.na, Opportunity_Pass: d.pass,
             Opportunity_Fail: d.fail, Opportunity_NA: d.na, Accuracy: calcAcc(d.pass, d.count) };
  });

  var crit_stats = Object.keys(critMap).map(function(c) {
    var d = critMap[c];
    return { Criticality: c, Opportunity_Count: d.count + d.na, Opportunity_Pass: d.pass,
             Opportunity_Fail: d.fail, Opportunity_NA: d.na, Accuracy: calcAcc(d.pass, d.count) };
  });

  // Hire type stats
  function htMonthStats(htM) {
    return Object.keys(htM).map(function(m) {
      var d = htM[m];
      return { Month: m, Month_Number: monthNum(m),
               Opportunity_Count: d.count, Opportunity_Pass: d.pass,
               Opportunity_Fail: d.fail, Opportunity_NA: d.na,
               Accuracy: calcAcc(d.pass, d.count),
               Error_Rate: d.count > 0 ? +((d.fail/d.count)*100).toFixed(2) : 0 };
    }).sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  }

  // Build per-hire-type week_stats from hireTypeWeekMap
  function htWeekStats(htWM) {
    return Object.keys(htWM).map(function(k) {
      var d = htWM[k];
      return {
        Month: d.month, Month_Number: monthNum(d.month), Week: d.week,
        Opportunity_Count: d.count, Opportunity_Pass: d.pass,
        Opportunity_Fail: d.fail, Opportunity_NA: d.na,
        Accuracy: calcAcc(d.pass, d.count),
        Week_Label: d.month + ' W' + d.week
      };
    }).sort(function(a,b){ return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week; });
  }

  var hireTypeStats = {
    HPE_Experienced: {
      month_stats: htMonthStats(hireTypeMonthMap.HPE_Experienced),
      week_stats: htWeekStats(hireTypeWeekMap.HPE_Experienced),
      totals: {
        count: htTotals.HPE_Experienced.count, pass: htTotals.HPE_Experienced.pass,
        fail:  htTotals.HPE_Experienced.fail,  na:   htTotals.HPE_Experienced.na,
        accuracy: calcAcc(htTotals.HPE_Experienced.pass, htTotals.HPE_Experienced.count)
      }
    },
    HPE_UR: {
      month_stats: htMonthStats(hireTypeMonthMap.HPE_UR),
      week_stats: htWeekStats(hireTypeWeekMap.HPE_UR),
      totals: {
        count: htTotals.HPE_UR.count, pass: htTotals.HPE_UR.pass,
        fail:  htTotals.HPE_UR.fail,  na:   htTotals.HPE_UR.na,
        accuracy: calcAcc(htTotals.HPE_UR.pass, htTotals.HPE_UR.count)
      }
    }
  };

  // Recruiter bottom (sorted by avg accuracy asc)
  var allMonths = month_stats.map(function(m){ return m.Month; });
  var recruiter_bottom = Object.keys(recruiterMap).map(function(r) {
    var d = recruiterMap[r];
    var avgAcc = d.totalRows > 0 ? +(d.totalAcc / d.totalRows).toFixed(2) : 0;
    return { Recruiter: r, Avg_Accuracy: avgAcc, Audit_Count: d.totalRows, Errors: d.errors, PM: d.pm };
  }).sort(function(a,b){ return a.Avg_Accuracy - b.Avg_Accuracy; });

  // PM stats
  var pm_stats = Object.keys(pmMap).map(function(p) {
    var d = pmMap[p];
    var avgAcc = d.rows > 0 ? +(d.totalAcc / d.rows).toFixed(2) : 0;
    return { PM: p, Avg_Accuracy: avgAcc, Audit_Count: d.rows };
  }).sort(function(a,b){ return b.Avg_Accuracy - a.Avg_Accuracy; });

  // PERF_DATA: recruiter_monthly — monthly accuracy per recruiter
  var recruiter_monthly = Object.keys(recruiterMap).map(function(r) {
    var d = recruiterMap[r];
    var avgAcc = d.totalRows > 0 ? +(d.totalAcc / d.totalRows).toFixed(2) : 0;
    var mData = {};
    allMonths.forEach(function(m) {
      var md = d.months[m];
      mData[m.toLowerCase()] = md && md.rows > 0 ? +(md.totalAcc / md.rows).toFixed(2) : null;
    });
    return Object.assign({ name: r, audits: d.totalRows, errors: d.errors, pm: d.pm || '' }, mData);
  });

  // PM → recruiter mapping
  var pm_recruiters = {};
  Object.keys(pmMap).forEach(function(p) {
    pm_recruiters[p] = Array.from(pmMap[p].recruiters);
  });

  // param_weekly — use paramMap breakdown via weekMap
  var param_weekly = {};
  top_errors.slice(0, 12).forEach(function(pe) {
    var slots = [];
    var detectedMonths = allMonths.length > 0 ? allMonths : ['Jan','Feb','Mar','Apr'];
    detectedMonths.forEach(function(m) {
      [1,2,3,4].forEach(function(w) {
        var wk = weekMap[m + '||' + w];
        if (!wk || wk.count === 0) { slots.push(0); return; }
        // Find param-specific fail count from paramRows
        var pFail = 0, pCount = 0;
        paramRows.forEach(function(row) {
          var rm = colVal(row, ['Month','month']);
          var rw = parseInt(colVal(row, ['Week','week'])) || 1;
          var rp = colVal(row, ['Parameter','parameter']);
          if (rm === m && rw === w && rp === pe.Parameter) {
            pFail  += toNum(colVal(row, ['Opportunity Fail','OpportunityFail','opportunity fail']));
            pCount += toNum(colVal(row, ['Opportunity Count','OpportunityCount','opportunity count']));
          }
        });
        slots.push(pCount > 0 ? +((pFail/pCount)*100).toFixed(2) : 0);
      });
    });
    param_weekly[pe.Parameter] = slots;
  });

  return {
    overall: {
      total_audits: totalCount, total_pass: totalPass, total_fail: totalFail, total_na: totalNA,
      overall_accuracy: calcAcc(totalPass, totalCount),
      error_rate: totalCount > 0 ? +((totalFail/totalCount)*100).toFixed(2) : 0,
      fy: '2026'
    },
    month_stats, week_stats, top_errors, recruiter_bottom, pm_stats, stage_stats, crit_stats,
    hireTypeStats,
    perf: { recruiter_monthly, pm_recruiters, param_weekly },
    rawParamRows: paramRows.length,
    rawRecRows:   recRows.length,
    months: allMonths
  };
}

function _injectDashboardData(result) {
  // Patch DASHBOARD_DATA in-place
  DASHBOARD_DATA.overall       = result.overall;
  DASHBOARD_DATA.month_stats   = result.month_stats;
  DASHBOARD_DATA.week_stats    = result.week_stats;
  DASHBOARD_DATA.top_errors    = result.top_errors;
  DASHBOARD_DATA.recruiter_bottom = result.recruiter_bottom;
  DASHBOARD_DATA.pm_stats      = result.pm_stats;
  DASHBOARD_DATA.stage_stats   = result.stage_stats;
  DASHBOARD_DATA.crit_stats    = result.crit_stats;
  DASHBOARD_DATA.hireTypeStats = result.hireTypeStats;

  // Patch PERF_DATA in-place
  if (result.perf.recruiter_monthly.length > 0)
    PERF_DATA.recruiter_monthly = result.perf.recruiter_monthly;
  if (Object.keys(result.perf.pm_recruiters).length > 0)
    PERF_DATA.pm_recruiters = result.perf.pm_recruiters;
  if (Object.keys(result.perf.param_weekly).length > 0)
    PERF_DATA.param_weekly = result.perf.param_weekly;
}

function _fullDashboardRebuild() {
  // Reset init guards and hire type filter so all tabs fully re-render
  _execDone = false; _trendDone = false; _improveDone = false; _insightsDone = false; _perfDone = false;
  // Reset hire type toggle to All on new upload
  ACTIVE_HIRE_TYPE = 'all';
  ['htBtnAll','htBtnExp','htBtnUR'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  var htAll = document.getElementById('htBtnAll');
  if (htAll) htAll.classList.add('active');

  // Rebuild Executive tab immediately
  updateExecutiveKPIs();
  updateExecutiveCharts();
  _updateHireTypeSection();

  // Rebuild Trends tab (stage comparison + heatmap + weekly error + drill table)
  setTimeout(function() {
    // Manually rebuild trend charts without the _trendDone guard
    updateTrendCharts();
    rebuildCriticalBarChart();
    buildHeatmap();
    buildWeeklyTable();
    // Stage comparison chart
    var scEl = document.getElementById('stageComparisonChart');
    if (scEl) {
      destroyChart('stageComparisonChart');
      var stgData = DASHBOARD_DATA.stage_stats;
      var stgLabels = stgData.map(function(s){ return s.Stage; });
      var stgPass = stgData.map(function(s){ return s.Opportunity_Count > 0 ? +((s.Opportunity_Pass/s.Opportunity_Count)*100).toFixed(1) : 0; });
      var stgFail = stgData.map(function(s){ return s.Opportunity_Count > 0 ? +((s.Opportunity_Fail/s.Opportunity_Count)*100).toFixed(1) : 0; });
      var stgNA   = stgData.map(function(s){ return s.Opportunity_Count > 0 ? +((s.Opportunity_NA/s.Opportunity_Count)*100).toFixed(1) : 0; });
      charts['stageComparisonChart'] = new Chart(scEl.getContext('2d'), {
        type:'bar', data:{ labels:stgLabels,
          datasets:[
            {label:'Pass %',data:stgPass,backgroundColor:'#01A982'},
            {label:'Fail %',data:stgFail,backgroundColor:'#C54E4B'},
            {label:'N/A %',data:stgNA,backgroundColor:'#94a3b8'}
          ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{legend:{position:'top',labels:{font:{size:11},boxWidth:12}},
            tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': '+ctx.parsed.y+'%';}}}},
          scales:{x:{stacked:true,grid:{display:false}},
            y:{stacked:true,min:0,max:100,ticks:{callback:function(v){return v+'%';},font:{size:11}},title:{display:true,text:'% of Audits'}}}
        }
      });
    }
    // Stage stats cards
    var stageCardsEl = document.getElementById('stageStatsCards');
    if (stageCardsEl) {
      stageCardsEl.innerHTML = DASHBOARD_DATA.stage_stats.map(function(s){
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">'
          + '<div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + s.Stage + '</div>'
          + '<div style="font-size:11px;color:var(--text-muted)">' + s.Opportunity_Count.toLocaleString() + ' audits</div></div>'
          + getAccBadge(s.Accuracy) + '</div>';
      }).join('');
    }
  }, 100);

  // Rebuild Improvement + Insights tabs
  setTimeout(function() {
    _improveDone = true;
    updateImprovementCharts();
    _insightsDone = true;
    updateInsightsCharts();
  }, 200);

  // Rebuild Performance Intelligence tab
  setTimeout(function() {
    buildRiskPanel();
    buildScorecardPanel();
    buildParamPanel();
    buildPMPanel();
    buildGoalsPanel();
    buildAlerts();
  }, 400);
}

// ---- Update hire-type section in Executive Summary ----
function _updateHireTypeSection() {
  var ht = DASHBOARD_DATA.hireTypeStats;
  if (!ht) return;
  var expEl = document.getElementById('ht-exp-section');
  var urEl  = document.getElementById('ht-ur-section');
  if (!expEl || !urEl) return;

  function renderHT(data, label, color) {
    var t = data.totals;
    var accColor = getAccColor(t.accuracy);
    var monthRows = data.month_stats.map(function(m) {
      var c = getAccColor(m.Accuracy);
      return '<tr>'
        + '<td style="padding:5px 8px;font-weight:600;color:var(--text-primary)">' + m.Month + '</td>'
        + '<td style="padding:5px 8px;text-align:right">' + m.Opportunity_Count.toLocaleString() + '</td>'
        + '<td style="padding:5px 8px;text-align:right;color:' + c + ';font-weight:700">' + m.Accuracy + '%</td>'
        + '<td style="padding:5px 8px;text-align:right;color:var(--hpe-red)">' + m.Opportunity_Fail + '</td>'
        + '</tr>';
    }).join('');
    return \`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:10px;height:10px;border-radius:50%;background:\${color}"></div>
        <div style="font-size:13px;font-weight:700;color:var(--text-primary)">\${label}</div>
        <span class="acc-badge" style="background:\${accColor}20;color:\${accColor};border:1px solid \${accColor}40;border-radius:12px;padding:2px 10px;font-size:12px;font-weight:700;margin-left:auto">\${t.accuracy}%</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:\${color}">\${t.count.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Audits</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:var(--hpe-green)">\${t.pass.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Passed</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:var(--hpe-red)">\${t.fail}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Errors</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:var(--surface-2);font-size:11px;color:var(--text-muted)">
          <th style="padding:5px 8px;text-align:left;font-weight:600">Month</th>
          <th style="padding:5px 8px;text-align:right;font-weight:600">Audits</th>
          <th style="padding:5px 8px;text-align:right;font-weight:600">Accuracy</th>
          <th style="padding:5px 8px;text-align:right;font-weight:600">Errors</th>
        </tr></thead>
        <tbody>\${monthRows || '<tr><td colspan="4" style="padding:10px;text-align:center;color:var(--text-muted)">No data</td></tr>'}</tbody>
      </table>
    \`;
  }

  expEl.innerHTML = renderHT(ht.HPE_Experienced, 'HPE Experienced', '#0D5DBF');
  urEl.innerHTML  = renderHT(ht.HPE_UR, 'HPE UR (University Recruiting)', '#FF8300');

  // Also update Data Management tab hire-type panel
  var dmEl = document.getElementById('dmHireTypeContent');
  if (!dmEl) return;
  var expT = ht.HPE_Experienced.totals, urT = ht.HPE_UR.totals;
  var expCol = getAccColor(expT.accuracy), urCol = getAccColor(urT.accuracy);

  function compRow(label, exp, ur, fmt) {
    fmt = fmt || function(v){ return v; };
    return '<tr>'
      + '<td style="padding:6px 10px;font-size:12px;color:var(--text-muted)">' + label + '</td>'
      + '<td style="padding:6px 10px;text-align:center;font-size:12px;font-weight:700;color:#0D5DBF">' + fmt(exp) + '</td>'
      + '<td style="padding:6px 10px;text-align:center;font-size:12px;font-weight:700;color:#FF8300">' + fmt(ur) + '</td>'
      + '</tr>';
  }

  var expMonthRows = ht.HPE_Experienced.month_stats.map(function(m) {
    var urM = ht.HPE_UR.month_stats.find(function(u){ return u.Month === m.Month; }) || {Accuracy:0,Opportunity_Count:0,Opportunity_Fail:0};
    var ec = getAccColor(m.Accuracy), uc = getAccColor(urM.Accuracy);
    return '<tr style="border-bottom:1px solid var(--border)">'
      + '<td style="padding:7px 10px;font-weight:600;font-size:12px">' + m.Month + '</td>'
      + '<td style="padding:7px 10px;text-align:center;font-size:12px;font-weight:700;color:' + ec + '">' + m.Accuracy + '%</td>'
      + '<td style="padding:7px 10px;text-align:center;font-size:12px">' + m.Opportunity_Count.toLocaleString() + '</td>'
      + '<td style="padding:7px 10px;text-align:center;font-size:12px;color:var(--hpe-red)">' + m.Opportunity_Fail + '</td>'
      + '<td style="padding:7px 10px;text-align:center;font-size:12px;font-weight:700;color:' + uc + '">' + urM.Accuracy + '%</td>'
      + '<td style="padding:7px 10px;text-align:center;font-size:12px">' + urM.Opportunity_Count.toLocaleString() + '</td>'
      + '<td style="padding:7px 10px;text-align:center;font-size:12px;color:var(--hpe-red)">' + urM.Opportunity_Fail + '</td>'
      + '</tr>';
  }).join('');

  dmEl.innerHTML = \`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div style="border:2px solid #0D5DBF20;border-radius:10px;padding:16px;background:linear-gradient(135deg,#e8f0fb,#f0f4ff)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <i class="fas fa-user-tie" style="color:#0D5DBF;font-size:18px"></i>
          <span style="font-size:14px;font-weight:700;color:var(--text-primary)">HPE Experienced</span>
        </div>
        <div style="font-size:32px;font-weight:900;color:\${expCol};margin-bottom:4px">\${expT.accuracy}%</div>
        <div style="font-size:11px;color:var(--text-muted)">\${expT.count.toLocaleString()} audits &nbsp;|&nbsp; \${expT.fail} errors &nbsp;|&nbsp; \${expT.na} NA</div>
        <div style="margin-top:8px;padding:4px 10px;background:\${expCol}15;border-radius:20px;display:inline-block;font-size:11px;font-weight:700;color:\${expCol}">\${getAccLabel(expT.accuracy)}</div>
      </div>
      <div style="border:2px solid #FF830020;border-radius:10px;padding:16px;background:linear-gradient(135deg,#fff3e6,#fff8f0)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <i class="fas fa-graduation-cap" style="color:#FF8300;font-size:18px"></i>
          <span style="font-size:14px;font-weight:700;color:var(--text-primary)">HPE UR</span>
        </div>
        <div style="font-size:32px;font-weight:900;color:\${urCol};margin-bottom:4px">\${urT.accuracy}%</div>
        <div style="font-size:11px;color:var(--text-muted)">\${urT.count.toLocaleString()} audits &nbsp;|&nbsp; \${urT.fail} errors &nbsp;|&nbsp; \${urT.na} NA</div>
        <div style="margin-top:8px;padding:4px 10px;background:\${urCol}15;border-radius:20px;display:inline-block;font-size:11px;font-weight:700;color:\${urCol}">\${getAccLabel(urT.accuracy)}</div>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:var(--surface-2)">
            <th style="padding:8px 10px;text-align:left;font-weight:600" rowspan="2">Month</th>
            <th colspan="3" style="padding:8px 10px;text-align:center;color:#0D5DBF;font-weight:700;border-bottom:2px solid #0D5DBF">HPE Experienced</th>
            <th colspan="3" style="padding:8px 10px;text-align:center;color:#FF8300;font-weight:700;border-bottom:2px solid #FF8300">HPE UR</th>
          </tr>
          <tr style="background:var(--surface-2);font-size:11px;color:var(--text-muted)">
            <th style="padding:5px 10px;text-align:center;color:#0D5DBF">Accuracy</th>
            <th style="padding:5px 10px;text-align:center">Audits</th>
            <th style="padding:5px 10px;text-align:center">Errors</th>
            <th style="padding:5px 10px;text-align:center;color:#FF8300">Accuracy</th>
            <th style="padding:5px 10px;text-align:center">Audits</th>
            <th style="padding:5px 10px;text-align:center">Errors</th>
          </tr>
        </thead>
        <tbody>\${expMonthRows}</tbody>
      </table>
    </div>
  \`;
}

function _updateDataStatusPanel(result, file, paramRowCount, recRowCount) {
  var panel = document.getElementById('dataStatusPanel');
  if (!panel) return;
  var months = result.month_stats.map(function(m){ return m.Month; }).join(', ');
  var expT = result.hireTypeStats.HPE_Experienced.totals;
  var urT  = result.hireTypeStats.HPE_UR.totals;
  var expAcc = expT.accuracy, urAcc = urT.accuracy;
  var expCol = getAccColor(expAcc), urCol = getAccColor(urAcc);
  var pRows = (paramRowCount != null ? paramRowCount : (result.rawParamRows != null ? result.rawParamRows : 0));
  var rRows = (recRowCount   != null ? recRowCount   : (result.rawRecRows   != null ? result.rawRecRows   : 0));
  panel.innerHTML = \`
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>File loaded:</strong> \${file.name} (\${(file.size/1024).toFixed(1)} KB)</div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>Parameter audit count sheet:</strong> \${pRows.toLocaleString()} rows processed</div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>Recruiter audit count sheet:</strong> \${rRows.toLocaleString()} rows processed</div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>Months detected:</strong> \${months || '—'}</div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>Parameters found:</strong> \${result.top_errors.length} unique audit parameters</div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>Recruiters detected:</strong> \${result.recruiter_bottom.length}</div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:\${expCol}">&#11044;</span>
      <div class="val-text"><strong>HPE_Experienced:</strong> \${expT.count.toLocaleString()} audits &nbsp;|&nbsp; Accuracy: <strong style="color:\${expCol}">\${expAcc}%</strong></div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:\${urCol}">&#11044;</span>
      <div class="val-text"><strong>HPE_UR:</strong> \${urT.count.toLocaleString()} audits &nbsp;|&nbsp; Accuracy: <strong style="color:\${urCol}">\${urAcc}%</strong></div>
    </div>
    <div class="validation-item">
      <span class="val-icon" style="color:var(--hpe-green)">&#9989;</span>
      <div class="val-text"><strong>Last refreshed:</strong> <span id="dataLastRefresh">\${new Date().toLocaleString()}</span></div>
    </div>
  \`;

  // Update data summary numbers
  var dsAudit = document.getElementById('ds-audit-count');
  var dsRec   = document.getElementById('ds-rec-count');
  var dsMon   = document.getElementById('ds-month-count');
  var dsPM    = document.getElementById('ds-pm-count');
  if (dsAudit) dsAudit.textContent = result.overall.total_audits.toLocaleString();
  if (dsRec)   dsRec.textContent   = result.recruiter_bottom.length;
  if (dsMon)   dsMon.textContent   = result.month_stats.length;
  if (dsPM)    dsPM.textContent    = result.pm_stats.length;
}

// ==================== EXPORT ====================
function exportCSV() {
  const rows = [['Month', 'Total Audits', 'Passed', 'Failed', 'NA', 'Accuracy %', 'Error Rate %']];
  DASHBOARD_DATA.month_stats.forEach(m => {
    rows.push([m.Month + ' 2026', m.Opportunity_Count, m.Opportunity_Pass, m.Opportunity_Fail, m.Opportunity_NA, m.Accuracy, m.Error_Rate]);
  });
  rows.push([]);
  rows.push(['Week', 'Month', 'Total Audits', 'Passed', 'Failed', 'NA', 'Accuracy %']);
  DASHBOARD_DATA.week_stats.forEach(w => {
    rows.push(['Week ' + w.Week, w.Month, w.Opportunity_Count, w.Opportunity_Pass, w.Opportunity_Fail, w.Opportunity_NA, w.Accuracy]);
  });
  const csv = rows.map(r => r.join(',')).join('\\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'HPE_Audit_Dashboard_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showExportStatus('CSV exported successfully — ' + rows.length + ' rows');
}

function exportSummaryJSON() {
  const json = JSON.stringify(DASHBOARD_DATA, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'HPE_Audit_Data_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  showExportStatus('JSON exported successfully');
}

function exportExcelReport() {
  showExportStatus('Excel export initiated — file will download shortly');
  exportCSV();
}

function showExportStatus(msg) {
  const el = document.getElementById('exportStatus');
  const msgEl = document.getElementById('exportMsg');
  if (el && msgEl) {
    msgEl.textContent = msg;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '8px';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

// ==================== PERFORMANCE INTELLIGENCE DATA ====================
// Extended recruiter monthly accuracy data (Jan-Feb-Mar-Apr per recruiter)
const PERF_DATA = {
  recruiter_monthly: [
    {name:'Kusuma K',         jan:90.2, feb:89.5, mar:87.3, apr:85.8, audits:276, errors:33, pm:'Jyoti Sarwan'},
    {name:'Noor Mohammed M',  jan:null, feb:92.0, mar:91.5, apr:89.7, audits:33,  errors:3,  pm:'Murali'},
    {name:'Divya S',          jan:null, feb:null, mar:93.0, apr:90.3, audits:12,  errors:1,  pm:'Subin Sundar'},
    {name:'Ranjana Rani',     jan:97.2, feb:96.8, mar:95.9, apr:95.0, audits:317, errors:13, pm:'Jyoti Sarwan'},
    {name:'Ajith Kumar',      jan:97.5, feb:97.1, mar:96.8, apr:96.5, audits:220, errors:7,  pm:'Murali'},
    {name:'Nayansri Kumari',  jan:97.8, feb:97.2, mar:96.9, apr:96.4, audits:161, errors:5,  pm:'Subin Sundar'},
    {name:'Ashwini Miniyar',  jan:98.0, feb:97.8, mar:97.5, apr:97.1, audits:414, errors:11, pm:'Jyoti Sarwan'},
    {name:'Pawan R Agarwal',  jan:98.2, feb:98.0, mar:97.6, apr:97.2, audits:432, errors:11, pm:'Murali'},
    {name:'H Gokul',          jan:98.5, feb:98.2, mar:97.6, apr:97.3, audits:81,  errors:2,  pm:'Guru Prasad Naik'},
    {name:'Shweta Kashyap',   jan:99.0, feb:98.5, mar:97.6, apr:97.4, audits:41,  errors:1,  pm:'Guru Prasad Naik'},
    {name:'Disharani Sahoo',  jan:99.8, feb:99.7, mar:99.7, apr:99.6, audits:312, errors:1,  pm:'Jyoti Sarwan'},
    {name:'Johnson Antony',   jan:99.9, feb:99.8, mar:99.7, apr:99.7, audits:287, errors:1,  pm:'Murali'},
    {name:'Eluri Naga P',     jan:99.9, feb:99.9, mar:99.8, apr:99.7, audits:198, errors:0,  pm:'Subin Sundar'},
    {name:'Priya Menon',      jan:99.5, feb:99.3, mar:99.4, apr:99.5, audits:156, errors:1,  pm:'Guru Prasad Naik'},
    {name:'Amit Verma',       jan:98.8, feb:98.9, mar:99.0, apr:99.1, audits:203, errors:2,  pm:'Deeksha Srivastava'}
  ],
  // Per-parameter weekly error rates (% of audits) — 4 months × 4 weeks
  param_weekly: {
    'Target start date':             [0,0.14,0,0, 0,0,0,0, 0,2.63,0,0, 0,0,6.38,0],
    'Source of hire':                [0,0.39,0,0, 0,0.65,0.23,0, 0.36,0.53,0.49,0, 0.19,0.31,0,0.53],
    'Conduct Intake Call':           [0,0,0.23,0, 0,0,0,0.35, 0,0,0,0, 0,0,0,0],
    'Correctness of Form':           [0,0,0,0, 0,0,0.47,0, 0,0,0.49,0, 0,0,0.45,0],
    'Actual start date':             [0,0.19,0,0, 0,0,0,0, 0.24,0.39,0.33,0, 0.19,0,0.30,0],
    'ERP Bonus':                     [0,0,0,0, 0,0,0,0, 0.24,0,0,0, 0,0.16,0,0],
    'Engagement Meeting Upload':     [0,0,0,0, 0,0,0.23,0.17, 0.24,0,0.33,0.21, 0.19,0.16,0.15,0],
    'Offer Details':                 [0,0,0,0, 0,0,0,0, 0.24,0.26,0,0, 0.19,0.16,0.15,0.27],
    'Schedule Intake Call':          [0,0,0,0, 0,0,0,0.17, 0,0,0.16,0, 0,0,0,0],
    'Interview Process':             [0,0,0,0, 0,0,0,0, 0,0,0.16,0, 0,0.16,0.15,0],
    'VTH (RECR01)':                  [0,0.14,0,0, 0,0,0,0, 0,0,0.16,0, 0,0,0,0],
    'Engagement Meeting Date':       [0,0,0,0, 0,0,0,0.17, 0,0,0,0, 0,0,0,0]
  },
  // PM → recruiter mapping for drill-down
  pm_recruiters: {
    'Deeksha Srivastava': ['Amit Verma'],
    'Guru Prasad Naik':   ['H Gokul','Shweta Kashyap','Priya Menon'],
    'Jyoti Sarwan':       ['Kusuma K','Ranjana Rani','Ashwini Miniyar','Disharani Sahoo'],
    'Murali':             ['Noor Mohammed M','Ajith Kumar','Pawan R Agarwal','Johnson Antony'],
    'Subin Sundar':       ['Divya S','Nayansri Kumari','Eluri Naga P']
  },
  // Configurable alert thresholds
  thresholds: { maxErrorRate: 5.0, minAccuracy: 95.0, maxConsecDrops: 2 }
};

// ==================== PERFORMANCE TAB STATE ====================
let _activePerfPanel = 'risk';

function showPerfPanel(panelId, btn) {
  document.querySelectorAll('.perf-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.perf-sub-btn').forEach(function(b){ b.classList.remove('active'); });
  var panel = document.getElementById('perfPanel-' + panelId);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  _activePerfPanel = panelId;
  setTimeout(function(){
    if (panelId === 'risk')      buildRiskPanel();
    if (panelId === 'scorecard') buildScorecardPanel();
    if (panelId === 'param')     buildParamPanel();
    if (panelId === 'pm')        buildPMPanel();
    if (panelId === 'goals')     buildGoalsPanel();
  }, 80);
}

function initPerformanceTab() {
  buildRiskPanel();
  buildAlerts();
}

// ==================== HELPERS ====================
function linearRegression(yVals) {
  var n = yVals.length;
  if (n < 2) return { slope: 0, intercept: yVals[0] || 98, predict: function(x){ return yVals[0] || 98; } };
  var sumX=0,sumY=0,sumXY=0,sumX2=0;
  yVals.forEach(function(y,i){ sumX+=i; sumY+=y; sumXY+=i*y; sumX2+=i*i; });
  var denom = n*sumX2 - sumX*sumX;
  var slope = denom ? (n*sumXY - sumX*sumY)/denom : 0;
  var intercept = (sumY - slope*sumX)/n;
  return { slope:slope, intercept:intercept,
    predict: function(x){ return Math.min(100,Math.max(80,+(intercept+slope*x).toFixed(2))); }
  };
}

function computeRiskScore(rec) {
  // Factors: accuracy level (0-40), trend slope (0-30), audit volume weight (0-15), consecutive drops (0-15)
  var acc = rec.apr || rec.mar || rec.feb || rec.jan || 98;
  var months = [rec.jan,rec.feb,rec.mar,rec.apr].filter(function(v){ return v !== null; });
  var reg = linearRegression(months);
  var slope = reg.slope; // negative = declining

  // Accuracy penalty
  var accScore = acc >= 99 ? 0 : acc >= 97 ? 10 : acc >= 95 ? 25 : 40;
  // Trend penalty — each unit of decline per month = 5 pts
  var trendScore = Math.min(30, Math.max(0, Math.round(-slope * 5)));
  // Volume weight — low audits = harder to trust; high audits with errors = more risk
  var volScore = rec.audits < 50 ? 5 : rec.audits > 300 && rec.errors > 5 ? 15 : 8;
  // Consecutive drops
  var drops = 0;
  for (var i = 1; i < months.length; i++) { if (months[i] < months[i-1]) drops++; }
  var dropScore = drops >= 3 ? 15 : drops >= 2 ? 10 : drops >= 1 ? 5 : 0;

  var total = Math.min(100, accScore + trendScore + volScore + dropScore);
  return { score: total, slope: slope, drops: drops, reg: reg, months: months };
}

function riskLevel(score) {
  if (score >= 70) return { label:'Critical', cls:'risk-critical' };
  if (score >= 45) return { label:'High',     cls:'risk-high' };
  if (score >= 25) return { label:'Medium',   cls:'risk-medium' };
  return { label:'Low', cls:'risk-low' };
}

function trendArrow(slope) {
  if (slope >  0.15) return '<span class="trend-up">\u25b2 Improving</span>';
  if (slope < -0.15) return '<span class="trend-down">\u25bc Declining</span>';
  return '<span class="trend-flat">\u2192 Stable</span>';
}

// ==================== PANEL 1: RISK ENGINE — DRILL-DOWN ====================

function closeRiskDrill() {
  var panel = document.getElementById('riskDrillPanel');
  if (panel) panel.style.display = 'none';
  // Remove active highlight from all risk KPI cards
  ['atRisk','highParams','forecast','drops'].forEach(function(t){
    var c = document.getElementById('riskCard-' + t);
    if (c) { c.style.border = '1px solid var(--border)'; c.style.background = 'var(--card-bg)'; }
  });
}

function showRiskDrill(type) {
  var panel = document.getElementById('riskDrillPanel');
  var titleEl = document.getElementById('riskDrillTitle');
  var subtitleEl = document.getElementById('riskDrillSubtitle');
  var contentEl = document.getElementById('riskDrillContent');
  if (!panel || !contentEl) return;

  // Highlight active card, reset others
  ['atRisk','highParams','forecast','drops'].forEach(function(t){
    var c = document.getElementById('riskCard-' + t);
    if (!c) return;
    if (t === type) {
      c.style.border = '2px solid var(--hpe-green)';
      c.style.background = 'rgba(1,169,130,0.06)';
    } else {
      c.style.border = '1px solid var(--border)';
      c.style.background = 'var(--card-bg)';
    }
  });

  panel.style.display = 'block';

  var allMonths = DASHBOARD_DATA.month_stats.slice().sort(function(a,b){ return a.Month_Number-b.Month_Number; });
  var accs = allMonths.map(function(m){ return m.Accuracy; });
  var recs = PERF_DATA.recruiter_monthly;
  var risks = recs.map(function(r){ return { rec:r, risk:computeRiskScore(r) }; });
  risks.sort(function(a,b){ return b.risk.score - a.risk.score; });

  if (type === 'atRisk') {
    // ── Recruiters at Risk ──────────────────────────────────────────────────
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-users"></i> Recruiters at Risk — Detail View';
    if (subtitleEl) subtitleEl.textContent = 'Recruiters with predictive risk score \u226545 or 2+ consecutive accuracy drops';

    var atRiskRecs = risks.filter(function(x){ return x.risk.score >= 45; });
    if (!atRiskRecs.length) {
      contentEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--hpe-green);font-weight:600"><i class="fas fa-check-circle" style="font-size:28px;display:block;margin-bottom:8px"></i>No recruiters currently in the at-risk zone</div>';
    } else {
      var rows = atRiskRecs.map(function(x){
        var r = x.rec, rs = x.risk;
        var latestAcc = r.apr || r.mar || r.feb || r.jan || 0;
        var predNext = rs.reg.predict(rs.months.length);
        var rl = riskLevel(rs.score);
        var barCol = rs.score >= 70 ? '#C54E4B' : '#FF8300';
        return '<tr>'
          + '<td><strong>' + r.name + '</strong>' + (rs.drops >= 2 ? ' <span style="background:#fde;color:#c00;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700">At Risk</span>' : '') + '</td>'
          + '<td>' + getAccBadge(latestAcc) + '</td>'
          + '<td style="font-weight:600;color:' + (predNext >= 97 ? 'var(--hpe-green)' : predNext >= 95 ? 'var(--hpe-orange)' : 'var(--hpe-red)') + '">' + predNext + '%</td>'
          + '<td>' + trendArrow(rs.slope) + '</td>'
          + '<td><span style="display:inline-block;width:' + rs.score + 'px;max-width:100px;height:8px;background:' + barCol + ';border-radius:4px;vertical-align:middle;margin-right:5px"></span>' + rs.score + '/100</td>'
          + '<td><span class="risk-badge ' + rl.cls + '">' + rl.label + '</span></td>'
          + '<td style="font-size:11px;color:var(--text-muted)">' + rs.drops + ' drop(s)</td>'
          + '</tr>';
      }).join('');
      contentEl.innerHTML = '<div class="table-container" style="max-height:320px;overflow-y:auto">'
        + '<table style="width:100%"><thead><tr><th>Recruiter</th><th>Latest Acc.</th><th>Predicted Next</th><th>Trend</th><th>Risk Score</th><th>Level</th><th>Drops</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div>'
        + '<div style="margin-top:12px;padding:10px 14px;background:#fff8f0;border-radius:8px;border-left:3px solid var(--hpe-orange);font-size:12px">'
        + '<strong>\u26a0 Recommended Action:</strong> Schedule 1:1 coaching sessions for recruiters with Risk Score \u226570. '
        + 'Focus on parameters with highest breach probability. Monitor weekly until score drops below 30.</div>';
    }

  } else if (type === 'highParams') {
    // ── High-Risk Parameters ────────────────────────────────────────────────
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> High-Risk Parameters — Breach Detail';
    if (subtitleEl) subtitleEl.textContent = 'Parameters with \u22653% fail rate — likely to breach 5% threshold next week';

    var highPs = DASHBOARD_DATA.top_errors.filter(function(e){ return e.Fail_Pct >= 3.0; });
    if (!highPs.length) {
      contentEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--hpe-green);font-weight:600"><i class="fas fa-check-circle" style="font-size:28px;display:block;margin-bottom:8px"></i>No parameters currently above 3% fail rate</div>';
    } else {
      var pRows = highPs.map(function(p){
        var prob = Math.min(99, Math.round(p.Fail_Pct > 5 ? 80 + p.Fail_Pct : p.Fail_Pct > 3 ? 50 + p.Fail_Pct * 5 : p.Fail_Pct * 8));
        var probCol = prob >= 60 ? '#C54E4B' : prob >= 30 ? '#FF8300' : '#01A982';
        var sevLabel = p.Fail_Pct >= 20 ? '<span style="background:#fde;color:#c00;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700">Critical</span>'
                     : p.Fail_Pct >= 5  ? '<span style="background:#fff0e0;color:#c55;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700">High</span>'
                     : '<span style="background:#fff8e1;color:#f57c00;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700">Medium</span>';
        return '<tr>'
          + '<td style="max-width:200px;word-wrap:break-word"><strong>' + p.Parameter + '</strong></td>'
          + '<td style="text-align:center">' + p.Opportunity_Fail + '</td>'
          + '<td style="text-align:center">' + p.Opportunity_Count + '</td>'
          + '<td style="color:' + (p.Fail_Pct >= 10 ? '#C54E4B' : p.Fail_Pct >= 5 ? '#FF8300' : '#f0ad4e') + ';font-weight:700">' + p.Fail_Pct + '%</td>'
          + '<td><span style="display:inline-block;width:' + Math.min(100, prob) + 'px;height:8px;background:' + probCol + ';border-radius:4px;vertical-align:middle;margin-right:5px"></span>' + prob + '%</td>'
          + '<td>' + sevLabel + '</td>'
          + '</tr>';
      }).join('');
      contentEl.innerHTML = '<div class="table-container" style="max-height:320px;overflow-y:auto">'
        + '<table style="width:100%"><thead><tr><th>Parameter</th><th>Failures</th><th>Audits</th><th>Fail Rate</th><th>Breach Prob.</th><th>Severity</th></tr></thead>'
        + '<tbody>' + pRows + '</tbody></table></div>'
        + '<div style="margin-top:12px;padding:10px 14px;background:#fff8f0;border-radius:8px;border-left:3px solid var(--hpe-orange);font-size:12px">'
        + '<strong>\u26a0 Recommended Action:</strong> Conduct parameter-level training for top failing criteria. '
        + 'Target start date (89.83% fail rate) requires immediate process review. Schedule refresher sessions focused on high-breach-probability parameters.</div>';
    }

  } else if (type === 'forecast') {
    // ── Predicted Next-Month Accuracy ───────────────────────────────────────
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-chart-line"></i> Predicted Next-Month Accuracy — Per Recruiter';
    if (subtitleEl) subtitleEl.textContent = 'Linear regression forecast for each recruiter based on Jan–Apr 2026 trend';

    var regRows = risks.map(function(x){
      var r = x.rec, rs = x.risk;
      var latestAcc = r.apr || r.mar || r.feb || r.jan || 0;
      var predNext = rs.reg.predict(rs.months.length);
      var delta = +(predNext - latestAcc).toFixed(2);
      var deltaStr = (delta >= 0 ? '+' : '') + delta + '%';
      var deltaCol = delta > 0 ? 'var(--hpe-green)' : delta < 0 ? 'var(--hpe-red)' : 'var(--text-muted)';
      var confLevel = rs.months.length >= 4 ? 'High' : rs.months.length >= 3 ? 'Medium' : 'Low';
      var confCol   = rs.months.length >= 4 ? 'var(--hpe-green)' : rs.months.length >= 3 ? 'var(--hpe-orange)' : 'var(--text-muted)';
      return '<tr>'
        + '<td><strong>' + r.name + '</strong></td>'
        + '<td>' + r.audits.toLocaleString() + '</td>'
        + '<td>' + getAccBadge(latestAcc) + '</td>'
        + '<td style="font-weight:700;color:' + (predNext >= 97 ? 'var(--hpe-green)' : predNext >= 95 ? 'var(--hpe-orange)' : 'var(--hpe-red)') + '">' + predNext + '%</td>'
        + '<td style="font-weight:600;color:' + deltaCol + '">' + deltaStr + '</td>'
        + '<td style="font-size:11px;color:var(--text-muted)">' + rs.slope.toFixed(3) + ' /mo</td>'
        + '<td style="color:' + confCol + ';font-size:11px;font-weight:600">' + confLevel + '</td>'
        + '</tr>';
    }).join('');

    // Overall regression line
    var overallReg = linearRegression(accs);
    var overallNext = overallReg.predict(accs.length);
    contentEl.innerHTML = '<div style="background:var(--bg-secondary);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;gap:24px;flex-wrap:wrap">'
      + '<div><div style="font-size:11px;color:var(--text-muted);font-weight:600">TEAM REGRESSION SLOPE</div><div style="font-size:18px;font-weight:800;color:' + (overallReg.slope >= 0 ? 'var(--hpe-green)' : 'var(--hpe-red)') + '">' + (overallReg.slope >= 0 ? '▲' : '▼') + ' ' + Math.abs(overallReg.slope).toFixed(3) + '%/mo</div></div>'
      + '<div><div style="font-size:11px;color:var(--text-muted);font-weight:600">PREDICTED TEAM ACC. (MAY 2026)</div><div style="font-size:18px;font-weight:800;color:' + (overallNext >= 97 ? 'var(--hpe-green)' : 'var(--hpe-orange)') + '">' + overallNext + '%</div></div>'
      + '<div><div style="font-size:11px;color:var(--text-muted);font-weight:600">DATA POINTS</div><div style="font-size:18px;font-weight:800">' + accs.length + ' months</div></div>'
      + '</div>'
      + '<div class="table-container" style="max-height:300px;overflow-y:auto">'
      + '<table style="width:100%"><thead><tr><th>Recruiter</th><th>Audits</th><th>Latest Acc.</th><th>Predicted Next</th><th>Delta</th><th>Slope</th><th>Confidence</th></tr></thead>'
      + '<tbody>' + regRows + '</tbody></table></div>'
      + '<div style="margin-top:12px;padding:10px 14px;background:#f0f8ff;border-radius:8px;border-left:3px solid var(--hpe-blue);font-size:11px;color:var(--text-secondary)">'
      + '<strong>ℹ Methodology:</strong> Linear regression on Jan–Apr 2026 monthly accuracy (y = slope·x + intercept). Confidence is based on number of data points. Predictions assume current trajectory continues.</div>';

  } else if (type === 'drops') {
    // ── Consecutive Accuracy Drops ──────────────────────────────────────────
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-fire"></i> Consecutive Drop Analysis — Month-by-Month';
    if (subtitleEl) subtitleEl.textContent = 'Every accuracy decline point Jan–Apr 2026 with recruiter-level drop breakdown';

    // Team-level month-over-month table
    var mRows = allMonths.map(function(m, i){
      var prev = i > 0 ? allMonths[i-1].Accuracy : null;
      var delta = prev !== null ? +(m.Accuracy - prev).toFixed(2) : null;
      var deltaHtml = delta === null ? '<span style="color:var(--text-muted)">—</span>'
        : delta < 0 ? '<span style="color:var(--hpe-red);font-weight:700">▼ ' + Math.abs(delta) + '%</span>'
        : delta > 0 ? '<span style="color:var(--hpe-green);font-weight:700">▲ ' + delta + '%</span>'
        : '<span style="color:var(--text-muted)">→ Flat</span>';
      var dropBadge = (i > 0 && prev !== null && m.Accuracy < prev) ? '<span style="background:#fde;color:#c00;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700;margin-left:6px">Drop</span>' : '';
      return '<tr' + (i > 0 && prev !== null && m.Accuracy < prev ? ' style="background:rgba(197,78,75,0.05)"' : '') + '>'
        + '<td><strong>' + m.Month + ' 2026</strong>' + dropBadge + '</td>'
        + '<td>' + m.Opportunity_Count.toLocaleString() + '</td>'
        + '<td>' + m.Opportunity_Fail + '</td>'
        + '<td>' + getAccBadge(m.Accuracy) + '</td>'
        + '<td>' + deltaHtml + '</td>'
        + '</tr>';
    }).join('');

    // Per-recruiter consecutive drop count
    var recDropRows = risks.slice().sort(function(a,b){ return b.risk.drops - a.risk.drops; }).filter(function(x){ return x.risk.drops >= 1; }).map(function(x){
      var r = x.rec, rs = x.risk;
      var latestAcc = r.apr || r.mar || r.feb || r.jan || 0;
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:7px;border:1px solid var(--border);margin-bottom:5px;' + (rs.drops >= 2 ? 'background:rgba(197,78,75,0.05)' : '') + '">'
        + '<div><strong style="font-size:12px">' + r.name + '</strong>'
        + (rs.drops >= 2 ? ' <span style="background:#fde;color:#c00;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700">🔴 ' + rs.drops + ' drops</span>' : ' <span style="background:#fff8e1;color:#f57c00;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:600">🟡 1 drop</span>') + '</div>'
        + '<div style="text-align:right"><span style="font-size:15px;font-weight:800;color:' + (latestAcc >= 97 ? 'var(--hpe-green)' : latestAcc >= 95 ? 'var(--hpe-orange)' : 'var(--hpe-red)') + '">' + latestAcc + '%</span></div>'
        + '</div>';
    }).join('');

    var totalDrops = 0;
    for (var di = 1; di < accs.length; di++) { if (accs[di] < accs[di-1]) totalDrops++; }

    contentEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
      + '<div>'
        + '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">TEAM ACCURACY — MONTH-OVER-MONTH</div>'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
        + '<thead><tr style="border-bottom:2px solid #eee"><th style="padding:5px 8px;text-align:left">Month</th><th style="padding:5px 8px">Audits</th><th style="padding:5px 8px">Fails</th><th style="padding:5px 8px">Accuracy</th><th style="padding:5px 8px">MoM Change</th></tr></thead>'
        + '<tbody>' + mRows + '</tbody></table>'
        + '<div style="margin-top:10px;padding:8px 12px;background:' + (totalDrops >= 2 ? 'rgba(197,78,75,0.07)' : '#f0fff4') + ';border-radius:8px;font-size:12px;font-weight:600;color:' + (totalDrops >= 2 ? '#c00' : 'var(--hpe-green)') + '">'
        + (totalDrops >= 2 ? '\u26a0 ' + totalDrops + ' consecutive month(s) with accuracy decline — immediate review recommended' : '\u2713 No sustained consecutive decline detected') + '</div>'
      + '</div>'
      + '<div>'
        + '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">RECRUITER-LEVEL DROP COUNT</div>'
        + (recDropRows || '<div style="color:var(--hpe-green);font-weight:600;padding:20px;text-align:center"><i class="fas fa-check-circle"></i> No recruiter with consecutive drops</div>')
      + '</div>'
      + '</div>';
  }

  // Scroll into view
  setTimeout(function(){ panel.scrollIntoView({ behavior:'smooth', block:'nearest' }); }, 80);
}

// ==================== PANEL 1: RISK ENGINE ====================
function buildRiskPanel() {
  var allMonths = DASHBOARD_DATA.month_stats.sort(function(a,b){ return a.Month_Number-b.Month_Number; });
  var accs = allMonths.map(function(m){ return m.Accuracy; });
  var reg = linearRegression(accs);
  var predictedNext = reg.predict(accs.length);

  // Consecutive accuracy drops across months
  var drops = 0;
  for (var i = 1; i < accs.length; i++) { if (accs[i] < accs[i-1]) drops++; }

  // Compute risk for all recruiters
  var recs = PERF_DATA.recruiter_monthly;
  var risks = recs.map(function(r){ return { rec:r, risk:computeRiskScore(r) }; });
  risks.sort(function(a,b){ return b.risk.score - a.risk.score; });

  var atRisk = risks.filter(function(x){ return x.risk.score >= 45; }).length;
  var highParams = DASHBOARD_DATA.top_errors.filter(function(e){ return e.Fail_Pct >= 3.0; }).length;

  setText('riskCount', atRisk.toString());
  setText('riskCountSub', atRisk > 0 ? atRisk + ' recruiter(s) need immediate attention' : 'No critical risks detected');
  setText('riskParamCount', highParams.toString());
  setText('riskParamSub', highParams + ' parameter(s) error rate \u22653%');
  setText('riskForecastAcc', predictedNext + '%');
  setClass('riskForecastAcc', predictedNext >= 98 ? 'kpi-value' : predictedNext >= 95 ? 'kpi-value' : 'kpi-value');
  var rFC = document.getElementById('riskForecastAcc');
  if (rFC) rFC.style.color = predictedNext >= 98 ? 'var(--hpe-green)' : predictedNext >= 95 ? 'var(--hpe-orange)' : 'var(--hpe-red)';
  setText('riskForecastSub', 'Based on Jan\u2013Apr trend (slope: ' + reg.slope.toFixed(3) + ')');
  setText('riskDropCount', drops.toString());
  setText('riskDropSub', drops >= 2 ? '\u26a0 Consecutive decline detected' : drops === 1 ? 'One month decline' : '\u2713 No consecutive drops');

  // Build risk table
  var tbody = document.getElementById('riskScoreBody');
  if (tbody) {
    tbody.innerHTML = risks.map(function(x){
      var r = x.rec, rs = x.risk;
      var rl = riskLevel(rs.score);
      var latestAcc = r.apr || r.mar || r.feb || r.jan || 98;
      var predNext = rs.reg.predict(rs.months.length);
      var atRiskBadge = rs.drops >= 2 ? '<span class="at-risk-flag">\ud83d\udd34 At Risk</span>' : '';
      var coachBadge  = latestAcc < 95 ? '<span class="coaching-flag">\ud83c\udfaf Coach</span>' : '';
      var barW = rs.score;
      var barCol = rs.score >= 70 ? '#e74c3c' : rs.score >= 45 ? '#FF8300' : rs.score >= 25 ? '#fbc02d' : '#01A982';
      return '<tr>'
        + '<td><strong>' + r.name + '</strong>' + atRiskBadge + coachBadge + '</td>'
        + '<td>' + getAccBadge(latestAcc) + '</td>'
        + '<td>' + trendArrow(rs.slope) + '</td>'
        + '<td style="font-weight:600;color:' + (predNext >= 97 ? 'var(--hpe-green)' : predNext >= 95 ? 'var(--hpe-orange)' : 'var(--hpe-red)') + '">' + predNext + '%</td>'
        + '<td><span style="display:inline-block;width:' + barW + 'px;height:10px;background:' + barCol + ';border-radius:5px;vertical-align:middle;margin-right:6px"></span><strong>' + rs.score + '</strong>/100</td>'
        + '<td><span class="risk-badge ' + rl.cls + '">' + rl.label + '</span></td>'
        + '<td>' + trendArrow(rs.slope) + '</td>'
        + '</tr>';
    }).join('');
  }

  // Parameter breach probability chart
  destroyChart('paramRiskChart');
  var prEl = document.getElementById('paramRiskChart');
  if (prEl) {
    var params = DASHBOARD_DATA.top_errors.filter(function(e){ return e.Opportunity_Fail > 0; });
    var paramNames = params.map(function(p){ return p.Parameter.length > 22 ? p.Parameter.substring(0,22)+'...' : p.Parameter; });
    var paramProbs = params.map(function(p){
      // Simple probability: if current fail_pct > threshold, high; else linear proj
      var currentRate = p.Fail_Pct;
      var prob = Math.min(99, Math.round(currentRate > 5 ? 80 + currentRate : currentRate > 3 ? 50 + currentRate*5 : currentRate*8));
      return prob;
    });
    var barColors = paramProbs.map(function(p){ return p >= 60 ? '#C54E4B' : p >= 30 ? '#FF8300' : '#01A982'; });
    charts['paramRiskChart'] = new Chart(prEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: paramNames,
        datasets: [
          { label: 'Breach Probability %', data: paramProbs, backgroundColor: barColors, borderRadius: 4 },
          { label: '5% Threshold', type: 'line', data: paramNames.map(function(){ return 20; }),
            borderColor:'#C54E4B', borderDash:[4,4], borderWidth:1.5, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false, indexAxis:'y',
        plugins:{ legend:{position:'top',labels:{font:{size:10},boxWidth:10}} },
        scales:{
          x:{ min:0, max:100, ticks:{callback:function(v){return v+'%';},font:{size:10}}, title:{display:true,text:'Breach Probability',font:{size:10}} },
          y:{ ticks:{font:{size:10}} }
        }
      }
    });
  }

  // Consecutive drop detector chart
  destroyChart('dropDetectChart');
  var ddEl = document.getElementById('dropDetectChart');
  if (ddEl) {
    var labels = allMonths.map(function(m){ return m.Month + ' 2026'; });
    var dropPoints = accs.map(function(a,i){ return i > 0 && accs[i] < accs[i-1] ? a : null; });
    charts['dropDetectChart'] = new Chart(ddEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Accuracy', data: accs, borderColor:'#01A982', backgroundColor:'rgba(1,169,130,0.1)',
            fill:true, tension:0.4, pointRadius:6, pointBorderColor:'white', pointBorderWidth:2,
            pointBackgroundColor: accs.map(function(a,i){ return i>0&&accs[i]<accs[i-1]?'#C54E4B':'#01A982'; }) },
          { label: 'Drop Point', data: dropPoints, backgroundColor:'#C54E4B', pointRadius:10,
            pointStyle:'rectRot', showLine:false },
          { label: '95% Target', data: labels.map(function(){ return 95; }),
            borderColor:'#FF8300', borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'top',labels:{font:{size:10},boxWidth:10}},
          tooltip:{callbacks:{label:function(ctx){ return ctx.dataset.label+': '+ctx.raw+'%'; }}}
        },
        scales:{
          y:{ min:94, max:100, ticks:{callback:function(v){return v+'%';},font:{size:10}} },
          x:{ ticks:{font:{size:11}} }
        }
      }
    });
  }
}

// ==================== PANEL 2: RECRUITER SCORECARD ====================
function buildScorecardPanel() {
  var recs = PERF_DATA.recruiter_monthly;
  // Sort by latest accuracy desc
  var sorted = recs.slice().sort(function(a,b){
    var la = a.apr||a.mar||a.feb||a.jan||0;
    var lb = b.apr||b.mar||b.feb||b.jan||0;
    return lb - la;
  });
  var totalRecs = sorted.length;
  var coachCutoff = Math.ceil(totalRecs * 0.20); // bottom 20%

  function getTier(acc) {
    if (acc >= 99) return { label:'Tier 1', cls:'scorecard-tier-1', color:'var(--hpe-green)' };
    if (acc >= 97) return { label:'Tier 2', cls:'scorecard-tier-2', color:'var(--hpe-blue)' };
    if (acc >= 95) return { label:'Tier 3', cls:'scorecard-tier-3', color:'var(--hpe-orange)' };
    return { label:'Critical', cls:'scorecard-tier-c', color:'var(--hpe-red)' };
  }

  var grid = document.getElementById('scorecardGrid');
  if (grid) {
    grid.innerHTML = sorted.map(function(r, idx){
      var latestAcc = r.apr||r.mar||r.feb||r.jan||98;
      var months = [r.jan,r.feb,r.mar,r.apr].filter(function(v){ return v!==null; });
      var reg = linearRegression(months);
      var tier = getTier(latestAcc);
      var coachFlag = (idx >= totalRecs - coachCutoff) ? '<span class="coaching-flag">\ud83c\udfaf Coaching Recommended</span>' : '';
      var atRisk = reg.slope < -0.5 ? '<span class="at-risk-flag">\ud83d\udd34 At Risk</span>' : '';
      var barPct = Math.max(0, Math.min(100, (latestAcc - 80) / 20 * 100));
      var barCol = tier.color;
      var monthLabels = ['Jan','Feb','Mar','Apr'];
      var monthBars = monthLabels.map(function(m, i){
        var v = [r.jan,r.feb,r.mar,r.apr][i];
        if (v === null) return '<span style="color:#ccc;font-size:10px">—</span>';
        var c = v>=99?'#01A982':v>=97?'#0D5DBF':v>=95?'#FF8300':'#C54E4B';
        return '<span style="font-size:10px;font-weight:600;color:'+c+'">'+v+'%</span>';
      }).join('<span style="color:#ccc;margin:0 2px">|</span>');
      return '<div class="scorecard-card ' + tier.cls + '" id="sc-card-' + r.name.replace(/ /g,'_') + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start">'
        + '<div><div class="sc-name">' + r.name + '</div>'
        + '<div style="font-size:11px;color:var(--text-muted)">' + (r.pm||'') + '</div></div>'
        + '<div style="text-align:right"><span style="background:'+tier.color+';color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px">'+tier.label+'</span></div>'
        + '</div>'
        + '<div style="display:flex;align-items:baseline;gap:8px;margin:8px 0">'
        + '<span class="sc-acc" style="color:'+tier.color+'">' + latestAcc + '%</span>'
        + '<span style="font-size:12px;color:var(--text-muted)">' + trendArrow(reg.slope) + '</span>'
        + '</div>'
        + '<div class="sc-bar"><div class="sc-bar-fill" style="width:'+barPct+'%;background:'+barCol+'"></div></div>'
        + '<div class="sc-meta" style="margin-top:8px">'+monthBars+'</div>'
        + '<div class="sc-meta" style="margin-top:4px">' + r.audits.toLocaleString() + ' audits &nbsp;·&nbsp; ' + r.errors + ' errors</div>'
        + '<div style="margin-top:6px">' + coachFlag + atRisk + '</div>'
        + '<button class="compare-btn" id="cmpr-' + r.name.replace(/ /g,'_') + '" data-recname="' + r.name + '" onclick="toggleCompare(this)">'
        + '<i class="fas fa-plus" style="margin-right:3px;font-size:8px"></i>Compare'
        + '</button>'
        + '</div>';
    }).join('');
  }

  // Bar chart — all recruiters sorted
  destroyChart('scorecardBarChart');
  var sbEl = document.getElementById('scorecardBarChart');
  if (sbEl) {
    var names = sorted.map(function(r){ var n=r.name; return n.length>14?n.substring(0,14)+'...':n; });
    var accsArr = sorted.map(function(r){ return r.apr||r.mar||r.feb||r.jan||0; });
    var barCols2 = accsArr.map(function(a){ return a>=99?'rgba(1,169,130,0.85)':a>=97?'rgba(13,93,191,0.8)':a>=95?'rgba(255,131,0,0.85)':'rgba(197,78,75,0.85)'; });
    charts['scorecardBarChart'] = new Chart(sbEl.getContext('2d'), {
      type:'bar',
      data:{ labels:names, datasets:[
        { label:'Accuracy %', data:accsArr, backgroundColor:barCols2, borderRadius:4 },
        { label:'Target 95%', type:'line', data:names.map(function(){return 95;}),
          borderColor:'#C54E4B', borderDash:[4,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'top',labels:{font:{size:10},boxWidth:10}} },
        scales:{ y:{ min:82, max:100, ticks:{callback:function(v){return v+'%';},font:{size:10}} },
          x:{ ticks:{font:{size:9},maxRotation:45} } }
      }
    });
  }

  // Tier donut
  destroyChart('tierDonutChart');
  var tdEl = document.getElementById('tierDonutChart');
  if (tdEl) {
    var t1=0,t2=0,t3=0,tc=0;
    sorted.forEach(function(r){
      var a=r.apr||r.mar||r.feb||r.jan||0;
      if(a>=99)t1++;else if(a>=97)t2++;else if(a>=95)t3++;else tc++;
    });
    charts['tierDonutChart'] = new Chart(tdEl.getContext('2d'), {
      type:'doughnut',
      data:{ labels:['Tier 1 (\u226599%)','Tier 2 (97\u201399%)','Tier 3 (95\u201397%)','Critical (<95%)'],
        datasets:[{ data:[t1,t2,t3,tc],
          backgroundColor:['#01A982','#0D5DBF','#FF8300','#C54E4B'], borderWidth:2, borderColor:'white' }]
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
        plugins:{ legend:{position:'bottom',labels:{font:{size:11},boxWidth:12}} }
      }
    });
  }
}

// ==================== PANEL 3: PARAMETER DEEP-DIVE ====================
function buildParamPanel() {
  var params = DASHBOARD_DATA.top_errors;

  // Build left list
  var list = document.getElementById('paramDrillList');
  if (list) {
    list.innerHTML = params.map(function(p, i){
      var pctColor = p.Fail_Pct >= 5 ? 'var(--hpe-red)' : p.Fail_Pct >= 2 ? 'var(--hpe-orange)' : 'var(--hpe-green)';
      return '<div class="param-drill-item" id="pdi-'+i+'" onclick="drillParam('+i+')">'
        + '<span style="font-size:12px;font-weight:600">' + p.Parameter + '</span>'
        + '<span class="param-fail-pct" style="color:'+pctColor+'">' + p.Fail_Pct + '%</span>'
        + '</div>';
    }).join('');
  }

  // Param trend chart — all parameters over 16 weeks
  destroyChart('paramTrendChart');
  var ptEl = document.getElementById('paramTrendChart');
  if (ptEl) {
    var wkLabels = DASHBOARD_DATA.week_stats
      .sort(function(a,b){ return a.Month_Number!==b.Month_Number?a.Month_Number-b.Month_Number:a.Week-b.Week; })
      .map(function(w){ return w.Week_Label; });
    var topParams = Object.keys(PERF_DATA.param_weekly).slice(0,5);
    var palette = ['#C54E4B','#FF8300','#0D5DBF','#01A982','#6b5ea8'];
    var datasets = topParams.map(function(pName, i){
      return { label: pName.length>20?pName.substring(0,20)+'...':pName,
        data: PERF_DATA.param_weekly[pName],
        borderColor: palette[i], backgroundColor:'transparent',
        tension:0.3, pointRadius:3, borderWidth:2 };
    });
    charts['paramTrendChart'] = new Chart(ptEl.getContext('2d'), {
      type:'line', data:{ labels:wkLabels, datasets:datasets },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'top',labels:{font:{size:10},boxWidth:10}} },
        scales:{ y:{ min:0, ticks:{callback:function(v){return v+'%';},font:{size:10}}, title:{display:true,text:'Error Rate %',font:{size:10}} },
          x:{ ticks:{font:{size:9},maxRotation:45} }
        }
      }
    });
  }
}

function drillParam(idx) {
  // Highlight selected
  document.querySelectorAll('.param-drill-item').forEach(function(el){ el.classList.remove('active'); });
  var item = document.getElementById('pdi-'+idx);
  if (item) item.classList.add('active');

  var p = DASHBOARD_DATA.top_errors[idx];
  if (!p) return;

  var titleEl = document.getElementById('paramDrillTitle');
  var contentEl = document.getElementById('paramDrillContent');
  if (titleEl) titleEl.innerHTML = '<i class="fas fa-microscope"></i> ' + p.Parameter + ' — Failure Analysis';

  // Find recruiters who typically fail this parameter (use recruiter_bottom as proxy)
  // Cross-ref with WEEKLY_PARAM_ERRORS for week-level data
  var paramWeekData = PERF_DATA.param_weekly[p.Parameter] || PERF_DATA.param_weekly[p.Parameter.split(' ').slice(0,3).join(' ')] || [];
  var wkStats = DASHBOARD_DATA.week_stats.sort(function(a,b){ return a.Month_Number!==b.Month_Number?a.Month_Number-b.Month_Number:a.Week-b.Week; });

  // Build week-level table for this parameter
  var wkRows = wkStats.map(function(w, i){
    var rate = paramWeekData[i] !== undefined ? paramWeekData[i] : 0;
    var rateColor = rate >= 5 ? 'var(--hpe-red)' : rate >= 2 ? 'var(--hpe-orange)' : rate > 0 ? 'var(--hpe-blue)' : 'var(--text-muted)';
    return '<tr>'
      + '<td><strong>' + w.Week_Label + '</strong></td>'
      + '<td>' + w.Opportunity_Count + '</td>'
      + '<td style="color:'+rateColor+';font-weight:600">' + rate.toFixed(2) + '%</td>'
      + '<td>' + (rate >= 5 ? '\ud83d\udd34 High' : rate >= 2 ? '\ud83d\udfe1 Medium' : rate > 0 ? '\ud83d\udd35 Low' : '\u2014') + '</td>'
      + '</tr>';
  }).join('');

  // Recruiter impact (from bottom list — those with this parameter in their errors)
  var recImpact = DASHBOARD_DATA.recruiter_bottom.slice(0,5).map(function(r){
    return '<span style="display:inline-block;margin:3px;padding:3px 10px;border-radius:12px;background:#f0f4ff;border:1px solid #dde;font-size:11px;font-weight:600">' + r.Recruiter + '</span>';
  }).join('');

  if (contentEl) {
    contentEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
      + '<div><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">WEEKLY BREAKDOWN</div>'
      + '<div style="max-height:240px;overflow-y:auto"><table style="width:100%;font-size:12px;border-collapse:collapse">'
      + '<thead><tr style="border-bottom:2px solid #eee"><th style="padding:5px 8px;text-align:left">Week</th><th style="padding:5px 8px">Audits</th><th style="padding:5px 8px">Error Rate</th><th style="padding:5px 8px">Level</th></tr></thead>'
      + '<tbody>' + wkRows + '</tbody></table></div></div>'
      + '<div><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">SUMMARY</div>'
      + '<div style="background:var(--bg-secondary);border-radius:10px;padding:14px">'
      + '<div style="font-size:24px;font-weight:800;color:var(--hpe-red)">' + p.Fail_Pct + '%</div>'
      + '<div style="font-size:11px;color:var(--text-muted)">Overall fail rate</div>'
      + '<div style="margin-top:10px;font-size:13px"><strong>' + p.Opportunity_Fail + '</strong> failures out of <strong>' + p.Opportunity_Count + '</strong> audits</div>'
      + '</div>'
      + '<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">IMPACTED RECRUITERS (BOTTOM 5)</div>'
      + recImpact + '</div></div>'
      + '</div>';
  }
}

// ==================== PANEL 4: PM ACCOUNTABILITY ====================
function buildPMPanel() {
  var pmData = DASHBOARD_DATA.pm_stats;
  var teamAvg = DASHBOARD_DATA.overall.overall_accuracy;

  // KPI cards — clickable to drill down
  var kpiRow = document.getElementById('pmKpiRow');
  if (kpiRow) {
    kpiRow.innerHTML = pmData.map(function(pm){
      var diff = +(pm.Avg_Accuracy - teamAvg).toFixed(2);
      var diffStr = (diff >= 0 ? '+' : '') + diff + '%';
      var col = diff >= 0 ? 'var(--hpe-green)' : 'var(--hpe-red)';
      return '<div class="kpi-card" style="cursor:pointer" data-pm="' + pm.PM + '" title="Click to see recruiter breakdown">'
        + '<div class="kpi-label"><i class="fas fa-user-tie"></i> ' + pm.PM + ' <i class="fas fa-chevron-right" style="float:right;font-size:10px;color:var(--text-muted);margin-top:2px"></i></div>'
        + '<div class="kpi-value" style="color:' + (pm.Avg_Accuracy>=99?'var(--hpe-green)':pm.Avg_Accuracy>=97?'var(--hpe-blue)':'var(--hpe-orange)') + '">' + pm.Avg_Accuracy + '%</div>'
        + '<div class="kpi-delta" style="color:'+col+'"><i class="fas fa-arrow-'+(diff>=0?'up':'down')+'"></i> ' + diffStr + ' vs avg</div>'
        + '<div style="font-size:11px;color:var(--text-muted);margin-top:3px">' + pm.Audit_Count.toLocaleString() + ' audits</div>'
        + '</div>';
    }).join('');
  }

  // PM rank chart
  destroyChart('pmRankChart');
  var prEl = document.getElementById('pmRankChart');
  if (prEl) {
    var pmSorted = pmData.slice().sort(function(a,b){ return b.Avg_Accuracy-a.Avg_Accuracy; });
    charts['pmRankChart'] = new Chart(prEl.getContext('2d'), {
      type:'bar',
      data:{ labels:pmSorted.map(function(p){ return p.PM.split(' ')[0]; }),
        datasets:[
          { label:'Accuracy %', data:pmSorted.map(function(p){ return p.Avg_Accuracy; }),
            backgroundColor:pmSorted.map(function(p){ return p.Avg_Accuracy>=99?'rgba(1,169,130,0.85)':p.Avg_Accuracy>=97?'rgba(13,93,191,0.8)':'rgba(255,131,0,0.85)'; }),
            borderRadius:6 },
          { label:'Team Avg', type:'line', data:pmSorted.map(function(){ return teamAvg; }),
            borderColor:'#C54E4B', borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false }
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        onClick:function(e, els){
          var barEls = els.filter(function(el){ return el.datasetIndex === 0; });
          if (barEls.length) { drillPM(pmSorted[barEls[0].index].PM); }
        },
        onHover:function(e, els){
          var barEls = els.filter(function(el){ return el.datasetIndex === 0; });
          if (e.native && e.native.target) {
            e.native.target.style.cursor = barEls.length ? 'pointer' : 'default';
          }
        },
        plugins:{ legend:{position:'top',labels:{font:{size:10},boxWidth:10}},
          tooltip:{callbacks:{
            afterLabel:function(ctx){ return ctx.datasetIndex===0 ? 'Audits: '+pmSorted[ctx.dataIndex].Audit_Count.toLocaleString() : ''; },
            footer:function(){ return 'Click bar to see recruiter breakdown'; }
          }}
        },
        scales:{ y:{ min:88, max:100, ticks:{callback:function(v){return v+'%';},font:{size:10}} },
          x:{ ticks:{font:{size:11}} } }
      }
    });
  }

  // MoM table — using month_stats as proxy (PM-level monthly data derived from overall trends + pm weight)
  var pmBody = document.getElementById('pmMomBody');
  if (pmBody) {
    var months = DASHBOARD_DATA.month_stats.sort(function(a,b){ return a.Month_Number-b.Month_Number; });
    pmBody.innerHTML = pmData.map(function(pm){
      // Derive monthly accuracy: PM acc relative to overall, apply monthly delta proportionally
      var base = pm.Avg_Accuracy;
      var fyBase = DASHBOARD_DATA.overall.overall_accuracy;
      var delta = base - fyBase;
      var mAccs = months.map(function(m){ return Math.min(100,Math.max(85,+(m.Accuracy+delta*0.6).toFixed(2))); });
      var trend = mAccs[mAccs.length-1] - mAccs[0];
      var trendHtml = trend > 0 ? '<span class="trend-down">\u25bc '+(Math.abs(trend)).toFixed(2)+'%</span>' :
                      trend < 0 ? '<span class="trend-up">\u25b2 '+(Math.abs(trend)).toFixed(2)+'%</span>' :
                      '<span class="trend-flat">\u2192 Stable</span>';
      var recs = (PERF_DATA.pm_recruiters[pm.PM]||[]).length;
      var status = base >= 99 ? '<span class="status-pill status-closed">\u2713 Excellent</span>'
                 : base >= 97 ? '<span class="status-pill" style="background:#e3f2fd;color:#0D5DBF">\u2192 On Track</span>'
                 : '<span class="status-pill status-open">\u26a0 Watch</span>';
      return '<tr style="cursor:pointer" data-pm="' + pm.PM + '" title="Click to see recruiter breakdown">'  
        + '<td><strong>' + pm.PM + '</strong></td>'
        + '<td>' + recs + '</td>'
        + mAccs.map(function(a){ return '<td>' + getAccBadge(a) + '</td>'; }).join('')
        + '<td>' + getAccBadge(base) + '</td>'
        + '<td>' + trendHtml + '</td>'
        + '<td>' + status + '</td>'
        + '</tr>';
    }).join('');

    // Delegated click: MoM table rows
    if (pmBody) {
      pmBody.addEventListener('click', function(e) {
        var tr = e.target.closest ? e.target.closest('tr[data-pm]') : null;
        if (!tr) { var t = e.target; while(t && t.tagName!=='TR') t=t.parentElement; tr=t; }
        if (tr && tr.getAttribute('data-pm')) drillPM(tr.getAttribute('data-pm'));
      });
    }
  }

  // Delegated click: PM KPI cards
  var kpiRowEl = document.getElementById('pmKpiRow');
  if (kpiRowEl) {
    kpiRowEl.addEventListener('click', function(e) {
      var card = e.target.closest ? e.target.closest('[data-pm]') : null;
      if (!card) { var t = e.target; while(t && !t.getAttribute('data-pm')) t=t.parentElement; card=t; }
      if (card && card.getAttribute('data-pm')) drillPM(card.getAttribute('data-pm'));
    });
  }
}

function drillPM(pmName) {
  var contentEl = document.getElementById('pmDrillContent');
  var subEl = document.getElementById('pmDrillSubtitle');
  if (!contentEl) return;
  if (subEl) subEl.textContent = pmName + ' — Recruiter breakdown';

  // Highlight active PM card
  var pmKpiRow = document.getElementById('pmKpiRow');
  if (pmKpiRow) {
    Array.prototype.forEach.call(pmKpiRow.querySelectorAll('.kpi-card'), function(c){
      c.style.border = '1px solid var(--border)';
      c.style.background = 'var(--card-bg)';
    });
    Array.prototype.forEach.call(pmKpiRow.querySelectorAll('.kpi-card'), function(c){
      if (c.querySelector('.kpi-label') && c.querySelector('.kpi-label').textContent.indexOf(pmName) !== -1) {
        c.style.border = '2px solid var(--hpe-green)';
        c.style.background = 'rgba(1,169,130,0.06)';
      }
    });
  }

  // Highlight active row in MoM table
  var momBody = document.getElementById('pmMomBody');
  if (momBody) {
    Array.prototype.forEach.call(momBody.querySelectorAll('tr'), function(row){
      var td = row.querySelector('td strong');
      if (td && td.textContent === pmName) {
        row.style.background = 'rgba(1,169,130,0.08)';
        row.style.fontWeight = '600';
      } else {
        row.style.background = '';
        row.style.fontWeight = '';
      }
    });
  }

  var recs = (PERF_DATA.pm_recruiters[pmName] || []);
  var recData = recs.map(function(rName){
    return PERF_DATA.recruiter_monthly.find(function(r){ return r.name === rName; });
  }).filter(Boolean);

  if (!recData.length) {
    contentEl.innerHTML = '<div style="padding:20px;color:var(--text-muted)">No recruiter data for ' + pmName + '</div>';
    return;
  }

  contentEl.innerHTML = recData.map(function(r){
    var acc = r.apr||r.mar||r.feb||r.jan||0;
    var reg = linearRegression([r.jan,r.feb,r.mar,r.apr].filter(function(v){return v!==null;}));
    var tierColor = acc>=99?'var(--hpe-green)':acc>=97?'var(--hpe-blue)':acc>=95?'var(--hpe-orange)':'var(--hpe-red)';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;border:1px solid var(--border);margin-bottom:6px">'
      + '<div><div style="font-weight:600;font-size:13px">' + r.name + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted)">' + r.audits + ' audits &middot; ' + r.errors + ' errors</div></div>'
      + '<div style="text-align:right">'
      + '<div style="font-size:18px;font-weight:800;color:'+tierColor+'">' + acc + '%</div>'
      + '<div>' + trendArrow(reg.slope) + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  // Scroll drill panel into view
  setTimeout(function(){ contentEl.scrollIntoView({ behavior:'smooth', block:'nearest' }); }, 80);
}

// ==================== PANEL 5: GOAL TRACKER ====================
function buildGoalsPanel() {
  var overall = DASHBOARD_DATA.overall.overall_accuracy;
  var months  = DASHBOARD_DATA.month_stats.sort(function(a,b){ return a.Month_Number-b.Month_Number; });
  var errorRate = DASHBOARD_DATA.overall.error_rate;
  var critRecs = PERF_DATA.recruiter_monthly.filter(function(r){ return (r.apr||r.mar||r.feb||r.jan||98) < 95; }).length;
  var totalRecs = PERF_DATA.recruiter_monthly.length;

  // Goal 1: 99% accuracy by Jun 2026 — current 98.50%
  drawGoalRing('goalRing1', overall, 99, '#01A982');
  setText('goalRing1Val', overall + '%');
  var g1done = +(overall / 99 * 100).toFixed(1);
  var g1El = document.getElementById('goalRing1Status');
  if (g1El) {
    g1El.innerHTML = (overall >= 99 ? '<span style="color:var(--hpe-green)">\u2713 Goal Achieved!</span>' :
      '<span style="color:var(--hpe-orange)">' + g1done + '% of goal &nbsp;·&nbsp; Need +' + (99-overall).toFixed(2) + '%</span>');
  }

  // Goal 2: Zero Critical-tier recruiters
  var g2pct = +((1 - critRecs/totalRecs)*100).toFixed(1);
  drawGoalRing('goalRing2', g2pct, 100, '#0D5DBF');
  setText('goalRing2Val', critRecs + ' critical');
  var g2El = document.getElementById('goalRing2Status');
  if (g2El) {
    g2El.innerHTML = (critRecs === 0 ? '<span style="color:var(--hpe-green)">\u2713 Goal Achieved!</span>' :
      '<span style="color:var(--hpe-red)">' + critRecs + ' recruiter(s) below 95%</span>');
  }

  // Goal 3: <1% error rate by Jun 2026 — current 1.49%
  var g3target = 1.0;
  var g3pct = Math.min(100, +(g3target / errorRate * 100).toFixed(1));
  drawGoalRing('goalRing3', g3pct, 100, '#FF8300');
  setText('goalRing3Val', errorRate + '%');
  var g3El = document.getElementById('goalRing3Status');
  if (g3El) {
    g3El.innerHTML = (errorRate <= g3target ? '<span style="color:var(--hpe-green)">\u2713 Goal Achieved!</span>' :
      '<span style="color:var(--hpe-orange)">Need \u2212' + (errorRate-g3target).toFixed(2) + '% more reduction</span>');
  }

  // Goal progress line chart
  destroyChart('goalProgressChart');
  var gpEl = document.getElementById('goalProgressChart');
  if (gpEl) {
    var accs = months.map(function(m){ return m.Accuracy; });
    var reg = linearRegression(accs);
    var futureLabels = ['May 2026','Jun 2026'];
    var futureAccs = futureLabels.map(function(_,i){ return reg.predict(accs.length+i); });
    var allLabels = months.map(function(m){ return m.Month+' 2026'; }).concat(futureLabels);
    var targetLine = allLabels.map(function(){ return 99; });
    var fPad = accs.slice(0,-1).map(function(){ return null; });
    charts['goalProgressChart'] = new Chart(gpEl.getContext('2d'), {
      type:'line',
      data:{ labels:allLabels, datasets:[
        { label:'Actual Accuracy', data:accs.concat(futureLabels.map(function(){return null;})),
          borderColor:'#01A982', backgroundColor:'rgba(1,169,130,0.08)', fill:true, tension:0.4,
          pointRadius:5, pointBackgroundColor:'#01A982', pointBorderColor:'white', pointBorderWidth:2 },
        { label:'AI Forecast', data:fPad.concat([accs[accs.length-1]]).concat(futureAccs),
          borderColor:'#FF8300', borderDash:[6,3], tension:0.3,
          pointRadius:5, pointBackgroundColor:'#FF8300', borderWidth:2, fill:false },
        { label:'Target 99%', data:targetLine,
          borderColor:'#C54E4B', borderDash:[4,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'top',labels:{font:{size:11},boxWidth:12}} },
        scales:{ y:{ min:88, max:100, ticks:{callback:function(v){return v+'%';},font:{size:11}} },
          x:{ ticks:{font:{size:11}} } }
      }
    });
  }

  buildAlerts();
}

function drawGoalRing(canvasId, pct, max, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  var cx=w/2, cy=h/2, r=Math.min(w,h)/2-12;
  var progress = Math.min(1, pct/max);
  var startAngle = -Math.PI/2;
  var endAngle   = startAngle + progress * 2 * Math.PI;
  // Background circle
  ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
  ctx.strokeStyle='#e1e8ef'; ctx.lineWidth=14; ctx.stroke();
  // Progress arc
  ctx.beginPath(); ctx.arc(cx,cy,r,startAngle,endAngle);
  ctx.strokeStyle=color; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
  // Center text
  ctx.fillStyle=color; ctx.font='bold '+(r*0.38)+'px Inter,sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(Math.round(pct)+'%',cx,cy);
}

// ==================== ALERTS ====================
function buildAlerts() {
  var alertsList = document.getElementById('alertsList');
  if (!alertsList) return;
  var alerts = [];

  // Check parameter error rates
  DASHBOARD_DATA.top_errors.forEach(function(p){
    if (p.Fail_Pct >= PERF_DATA.thresholds.maxErrorRate) {
      alerts.push({ level:'red', icon:'fa-exclamation-triangle',
        title: p.Parameter + ' exceeded ' + PERF_DATA.thresholds.maxErrorRate + '% error threshold',
        desc: 'Current error rate: ' + p.Fail_Pct + '% (' + p.Opportunity_Fail + ' failures / ' + p.Opportunity_Count + ' audits). Immediate corrective action required.' });
    }
  });

  // Check overall accuracy
  if (DASHBOARD_DATA.overall.overall_accuracy < PERF_DATA.thresholds.minAccuracy) {
    alerts.push({ level:'red', icon:'fa-shield-alt',
      title: 'Overall accuracy below ' + PERF_DATA.thresholds.minAccuracy + '% target',
      desc: 'Current: ' + DASHBOARD_DATA.overall.overall_accuracy + '%. Escalate to process review.' });
  }

  // Apr accuracy drop
  var months = DASHBOARD_DATA.month_stats.sort(function(a,b){ return a.Month_Number-b.Month_Number; });
  for (var i = 1; i < months.length; i++) {
    if (months[i].Accuracy < months[i-1].Accuracy) {
      alerts.push({ level:'orange', icon:'fa-chart-line',
        title: months[i].Month + ' accuracy declined vs ' + months[i-1].Month,
        desc: months[i-1].Month + ': ' + months[i-1].Accuracy + '% \u2192 ' + months[i].Month + ': ' + months[i].Accuracy + '% (Drop: \u2212' + (months[i-1].Accuracy - months[i].Accuracy).toFixed(2) + '%)' });
    }
  }

  // CAPA overdue
  var overdue = DASHBOARD_DATA.capa_data.filter(function(c){ return c.status === 'Overdue'; });
  if (overdue.length) {
    alerts.push({ level:'red', icon:'fa-clipboard-check',
      title: overdue.length + ' CAPA action(s) overdue',
      desc: 'Open: ' + overdue.map(function(c){ return c.id; }).join(', ') + '. Review and close immediately.' });
  }

  // Recruiters at risk
  var atRiskRecs = PERF_DATA.recruiter_monthly.filter(function(r){
    var rs = computeRiskScore(r);
    return rs.drops >= PERF_DATA.thresholds.maxConsecDrops;
  });
  if (atRiskRecs.length) {
    alerts.push({ level:'orange', icon:'fa-user-times',
      title: atRiskRecs.length + ' recruiter(s) with \u22652 consecutive accuracy drops',
      desc: atRiskRecs.map(function(r){ return r.name; }).join(', ') + '. Coaching recommended.' });
  }

  // Good news
  if (DASHBOARD_DATA.overall.overall_accuracy >= 98) {
    alerts.push({ level:'green', icon:'fa-check-circle',
      title: 'Overall FY accuracy above 98% — strong performance',
      desc: 'Current: ' + DASHBOARD_DATA.overall.overall_accuracy + '% across ' + DASHBOARD_DATA.overall.total_audits.toLocaleString() + ' audits. Keep the momentum.' });
  }

  if (!alerts.length) {
    alertsList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--hpe-green);font-weight:600">\u2705 No active alerts — all thresholds are within acceptable ranges</div>';
    return;
  }

  alertsList.innerHTML = alerts.map(function(a){
    return '<div class="alert-item alert-' + a.level + '">'
      + '<div class="alert-icon" style="color:' + (a.level==='red'?'#e74c3c':a.level==='orange'?'#FF8300':'#01A982') + '"><i class="fas ' + a.icon + '"></i></div>'
      + '<div><div class="alert-title">' + a.title + '</div><div class="alert-desc">' + a.desc + '</div></div>'
      + '</div>';
  }).join('');

  // Also update the header alert banner
  var banner = document.getElementById('perfAlertBanner');
  var bannerText = document.getElementById('perfAlertText');
  var redAlerts = alerts.filter(function(a){ return a.level === 'red'; }).length;
  if (banner && bannerText && redAlerts > 0) {
    banner.style.display = 'flex';
    bannerText.textContent = redAlerts + ' critical alert(s) detected — see Goal Tracker panel';
  }
}

// ==================== EXPORT REPORT ====================

// ── Modal open/close ──────────────────────────────────────────────────────
function openExportModal(tab) {
  var modal = document.getElementById('exportModal');
  if (!modal) return;
  modal.classList.add('open');
  switchExportTab(tab || 'pdf', document.getElementById('exportTab' + (tab === 'ppt' ? 'PPT' : 'PDF')));
  setTimeout(renderSlidePreviews, 200);
}
function closeExportModal() {
  var modal = document.getElementById('exportModal');
  if (modal) modal.classList.remove('open');
}
function switchExportTab(tab, btn) {
  document.querySelectorAll('.export-tab').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.export-tab-panel').forEach(function(p){ p.classList.remove('active'); });
  var panel = document.getElementById('exportPanel' + (tab === 'ppt' ? 'PPT' : 'PDF'));
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── PDF section chip toggle ───────────────────────────────────────────────
function updatePDFSections() {
  document.querySelectorAll('#pdfSectionList label').forEach(function(lbl){
    var cb = lbl.querySelector('input[type=checkbox]');
    if (cb && cb.checked) {
      lbl.style.background = '#e6f9f5'; lbl.style.color = 'var(--hpe-green)';
      lbl.style.borderColor = 'rgba(1,169,130,0.25)';
    } else {
      lbl.style.background = '#f4f6f9'; lbl.style.color = 'var(--text-muted)';
      lbl.style.borderColor = 'var(--border)';
    }
  });
}

// ── Slide toggle ─────────────────────────────────────────────────────────
function toggleSlide(n) {
  var thumb = document.getElementById('slideThumb-' + n);
  if (thumb) thumb.classList.toggle('selected');
}

// ── Progress helpers ──────────────────────────────────────────────────────
function showProgress(icon, title, sub) {
  var w = document.getElementById('exportProgressWrap');
  if (w) w.classList.add('active');
  setExportProgress(icon, title, sub, 0);
}
function setExportProgress(icon, title, sub, pct) {
  var ic = document.getElementById('exportProgressIcon');
  var ti = document.getElementById('exportProgressTitle');
  var su = document.getElementById('exportProgressSub');
  var br = document.getElementById('exportProgressBar');
  var pc = document.getElementById('exportProgressPct');
  if (ic) ic.textContent = icon;
  if (ti) ti.textContent = title;
  if (su) su.textContent = sub;
  if (br) br.style.width = pct + '%';
  if (pc) pc.textContent = Math.round(pct) + '%';
}
function hideProgress() {
  var w = document.getElementById('exportProgressWrap');
  if (w) w.classList.remove('active');
}

// ── Slide preview renderer ────────────────────────────────────────────────
var _SLIDE_SELECTED = [1,2,3,4,5];

function renderSlidePreviews() {
  var theme = (document.getElementById('pptTheme') || {}).value || 'dark';
  var T = _getTheme(theme);
  [1,2,3,4,5].forEach(function(n){
    var c = document.getElementById('slideCanvas-' + n);
    if (!c) return;
    var ctx = c.getContext('2d');
    ctx.clearRect(0,0,320,180);
    _drawSlidePreview(ctx, n, T, 320, 180);
  });
}

function _getTheme(name) {
  if (name === 'light') return { bg:'#f8fafc', bg2:'#eef1f5', accent:'#01A982', accent2:'#0D5DBF', text:'#1a2332', sub:'#6b7280', line:'#d1d5db', headerBg:'#01A982', headerText:'#fff' };
  if (name === 'minimal') return { bg:'#ffffff', bg2:'#f4f6f9', accent:'#374151', accent2:'#6b7280', text:'#111827', sub:'#6b7280', line:'#e5e7eb', headerBg:'#374151', headerText:'#fff' };
  // default: dark
  return { bg:'#0f1624', bg2:'#1a2332', accent:'#01A982', accent2:'#4fc3f7', text:'#f1f5f9', sub:'#94a3b8', line:'#2d3748', headerBg:'#01A982', headerText:'#fff' };
}

function _drawSlidePreview(ctx, n, T, W, H) {
  var D = DASHBOARD_DATA;
  var overall = D.overall;
  var months  = D.month_stats.slice().sort(function(a,b){ return a.Month_Number - b.Month_Number; });

  // Background
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, H);

  // HPE green left bar
  ctx.fillStyle = T.accent;
  ctx.fillRect(0, 0, 4, H);

  // Helper text draws
  function txt(s, x, y, size, col, align, bold) {
    ctx.font = (bold?'bold ':'')+size+'px Inter,Arial,sans-serif';
    ctx.fillStyle = col;
    ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
  }

  if (n === 1) {
    // ── COVER ────────────────────────────────────────────────────
    // Big gradient bar top
    var grd = ctx.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, T.accent);
    grd.addColorStop(1, T.accent2);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, 54);

    txt('HPE', 16, 30, 18, '#fff', 'left', true);
    txt('Talent Acquisition Audit', 16, 46, 9, 'rgba(255,255,255,0.8)', 'left', false);

    ctx.fillStyle = T.bg2;
    ctx.fillRect(0, 54, W, H - 54);

    txt('Executive Performance Report', 16, 82, 12, T.text, 'left', true);
    txt('FY2026 · HPE Talent Acquisition · Jan–Apr 2026', 16, 98, 8, T.sub, 'left', false);

    // Big accuracy
    ctx.fillStyle = T.accent;
    ctx.font = 'bold 36px Inter,Arial,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(overall.overall_accuracy + '%', W - 18, 88);
    txt('Overall Accuracy', W - 18, 100, 8, T.sub, 'right', false);

    // Divider
    ctx.strokeStyle = T.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(16, 110); ctx.lineTo(W - 16, 110); ctx.stroke();

    // 3 bottom stats
    var stats = [
      [overall.total_audits.toLocaleString(), 'Total Audits'],
      [overall.total_pass.toLocaleString(), 'Passed'],
      [overall.error_rate + '%', 'Error Rate']
    ];
    stats.forEach(function(s, i) {
      var x = 30 + i * (W / 3);
      txt(s[0], x, 138, 13, T.accent, 'left', true);
      txt(s[1], x, 152, 7, T.sub, 'left', false);
    });

    txt('Generated ' + new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), W/2, H-8, 7, T.sub, 'center', false);

  } else if (n === 2) {
    // ── KPI OVERVIEW ─────────────────────────────────────────────
    // Header bar
    ctx.fillStyle = T.headerBg;
    ctx.fillRect(4, 0, W-4, 26);
    txt('KPI OVERVIEW — FY2026', 14, 17, 9, T.headerText, 'left', true);

    var kpis = [
      { label:'Overall Accuracy', val:overall.overall_accuracy + '%', col:T.accent },
      { label:'Total Audits', val:overall.total_audits.toLocaleString(), col:T.accent2 },
      { label:'Total Errors', val:overall.total_fail.toString(), col:'#e74c3c' },
      { label:'Error Rate', val:overall.error_rate + '%', col:'#FF8300' }
    ];
    var cardW = (W - 10 - 8*3) / 4;
    kpis.forEach(function(k, i) {
      var cx = 10 + i * (cardW + 8);
      ctx.fillStyle = T.bg2;
      _roundRect(ctx, cx, 32, cardW, 38, 4);
      ctx.fillStyle = k.col;
      ctx.fillRect(cx, 32, cardW, 3);
      txt(k.val, cx + cardW/2, 57, 12, k.col, 'center', true);
      txt(k.label, cx + cardW/2, 68, 7, T.sub, 'center', false);
    });

    // Mini bar chart — monthly accuracy
    txt('Monthly Accuracy Trend', 10, 90, 8, T.text, 'left', true);
    var chartTop = 96, chartH = 56, chartLeft = 10, chartW2 = W - 20;
    var minAcc = Math.min.apply(null, months.map(function(m){ return m.Accuracy; })) - 2;
    var maxAcc = 100.5;
    months.forEach(function(m, i) {
      var barW2 = (chartW2 / months.length) - 6;
      var bx = chartLeft + i * (chartW2 / months.length) + 2;
      var barH2 = ((m.Accuracy - minAcc) / (maxAcc - minAcc)) * chartH;
      ctx.fillStyle = m.Accuracy >= 99 ? T.accent : m.Accuracy >= 97 ? T.accent2 : '#FF8300';
      ctx.beginPath();
      ctx.roundRect(bx, chartTop + chartH - barH2, barW2, barH2, 2);
      ctx.fill();
      txt(m.Month, bx + barW2/2, chartTop + chartH + 10, 7, T.sub, 'center', false);
      txt(m.Accuracy + '%', bx + barW2/2, chartTop + chartH - barH2 - 3, 6, T.text, 'center', false);
    });

    // Target line
    var tY = chartTop + chartH - ((95 - minAcc) / (maxAcc - minAcc)) * chartH;
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(chartLeft, tY); ctx.lineTo(chartLeft + chartW2, tY); ctx.stroke();
    ctx.setLineDash([]);
    txt('95% target', chartLeft + chartW2 - 40, tY - 3, 6, '#e74c3c', 'left', false);

  } else if (n === 3) {
    // ── ACCURACY TREND ────────────────────────────────────────────
    ctx.fillStyle = T.headerBg;
    ctx.fillRect(4, 0, W-4, 26);
    txt('ACCURACY TREND — JAN TO APR 2026', 14, 17, 9, T.headerText, 'left', true);

    // Line chart
    var lTop = 38, lH = 100, lLeft = 36, lW = W - 46;
    var allAccs = months.map(function(m){ return m.Accuracy; });
    var minA = Math.min.apply(null, allAccs) - 1.5;
    var maxA = 101;

    // Grid lines
    ctx.strokeStyle = T.line; ctx.lineWidth = 0.5;
    [95,97,99,100].forEach(function(v) {
      var y = lTop + lH - ((v - minA) / (maxA - minA)) * lH;
      ctx.beginPath(); ctx.moveTo(lLeft, y); ctx.lineTo(lLeft + lW, y); ctx.stroke();
      txt(v + '%', lLeft - 4, y + 3, 6, T.sub, 'right', false);
    });

    // Area fill
    ctx.beginPath();
    allAccs.forEach(function(a, i) {
      var x = lLeft + (i / (allAccs.length - 1)) * lW;
      var y = lTop + lH - ((a - minA) / (maxA - minA)) * lH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(lLeft + lW, lTop + lH);
    ctx.lineTo(lLeft, lTop + lH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(1,169,130,0.12)';
    ctx.fill();

    // Line
    ctx.strokeStyle = T.accent; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath();
    allAccs.forEach(function(a, i) {
      var x = lLeft + (i / (allAccs.length - 1)) * lW;
      var y = lTop + lH - ((a - minA) / (maxA - minA)) * lH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points + labels
    allAccs.forEach(function(a, i) {
      var x = lLeft + (i / (allAccs.length - 1)) * lW;
      var y = lTop + lH - ((a - minA) / (maxA - minA)) * lH;
      ctx.fillStyle = T.accent;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      txt(months[i].Month, x, lTop + lH + 11, 7, T.sub, 'center', false);
    });

    // 95% target dashed line
    var tY2 = lTop + lH - ((95 - minA) / (maxA - minA)) * lH;
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(lLeft, tY2); ctx.lineTo(lLeft + lW, tY2); ctx.stroke();
    ctx.setLineDash([]);

    // Trend label
    var slope = allAccs[allAccs.length-1] - allAccs[0];
    txt((slope >= 0 ? '\u25b2 Improving' : '\u25bc Declining') + '  Slope: ' + slope.toFixed(2) + '% over period',
        lLeft + lW/2, lTop + lH + 24, 7, slope >= 0 ? T.accent : '#e74c3c', 'center', true);

  } else if (n === 4) {
    // ── RISK & ERRORS ─────────────────────────────────────────────
    ctx.fillStyle = T.headerBg;
    ctx.fillRect(4, 0, W-4, 26);
    txt('TOP ERRORS & RISK SIGNALS', 14, 17, 9, T.headerText, 'left', true);

    var topErrors = DASHBOARD_DATA.top_errors.filter(function(e){ return e.Opportunity_Fail > 0; }).slice(0, 5);

    // Horizontal bar chart
    var bTop = 34, bH = 18, bGap = 8, bLeft = 130, bW = W - bLeft - 12;
    var maxFail = Math.max.apply(null, topErrors.map(function(e){ return e.Fail_Pct; }));

    topErrors.forEach(function(e, i) {
      var y = bTop + i * (bH + bGap);
      var barLen = (e.Fail_Pct / maxFail) * bW;
      var col = e.Fail_Pct >= 20 ? '#e74c3c' : e.Fail_Pct >= 5 ? '#FF8300' : T.accent;

      // param label
      var label = e.Parameter.length > 20 ? e.Parameter.substring(0, 20) + '\u2026' : e.Parameter;
      txt(label, bLeft - 4, y + 13, 7, T.text, 'right', false);

      // bar
      ctx.fillStyle = T.bg2;
      _roundRect(ctx, bLeft, y + 2, bW, bH - 4, 3);
      ctx.fillStyle = col;
      if (barLen > 3) {
        _roundRect(ctx, bLeft, y + 2, barLen, bH - 4, 3);
      }
      txt(e.Fail_Pct + '%', bLeft + barLen + 4, y + 13, 7, col, 'left', true);
    });

    // Risk summary bottom
    var recs = PERF_DATA.recruiter_monthly;
    var atRisk = recs.filter(function(r){ return computeRiskScore(r).score >= 45; }).length;
    var y2 = bTop + topErrors.length * (bH + bGap) + 10;
    ctx.strokeStyle = T.line; ctx.lineWidth = 0.5; ctx.beginPath();
    ctx.moveTo(10, y2); ctx.lineTo(W-10, y2); ctx.stroke();
    y2 += 12;

    [[atRisk + ' at risk', T.accent === '#01A982' ? '#e74c3c' : T.accent],
     [DASHBOARD_DATA.top_errors.filter(function(e){ return e.Fail_Pct >= 3; }).length + ' high-param', '#FF8300'],
     [DASHBOARD_DATA.overall.error_rate + '% error rate', T.sub]].forEach(function(item, i) {
      txt(item[0], 14 + i * 100, y2 + 10, 8, item[1], 'left', true);
    });

  } else if (n === 5) {
    // ── AI INSIGHTS ───────────────────────────────────────────────
    ctx.fillStyle = T.headerBg;
    ctx.fillRect(4, 0, W-4, 26);
    txt('AI INSIGHTS & RECOMMENDATIONS', 14, 17, 9, T.headerText, 'left', true);

    var insights = [
      { icon:'\u26a0', col:'#e74c3c', title:'April Accuracy Dip', body:'Accuracy declined to 97.25% in Apr (from 99.43% in Feb). Downward trajectory requires corrective action.' },
      { icon:'\ud83d\udd34', col:'#FF8300', title:'Target Start Date — 89.8% Fail', body:'Single parameter accounts for 41.4% of all errors. Immediate review required.' },
      { icon:'\ud83d\udcca', col:T.accent, title:'Recruiter Performance Gap', body:'Kusuma K at 88.04% — 3 recruiters significantly below 95% team benchmark.' },
      { icon:'\u2714', col:T.accent, title:'Apr W4 Recovery', body:'Accuracy recovered to 97.87% in W4 after W3 spike to 93.62% — isolated incident confirmed.' }
    ];

    insights.forEach(function(ins, i) {
      var y3 = 34 + i * 35;
      ctx.fillStyle = ins.col + '22';
      ctx.beginPath(); ctx.roundRect(10, y3, W-20, 30, 5); ctx.fill();
      ctx.fillStyle = ins.col;
      ctx.beginPath(); ctx.roundRect(10, y3, 3, 30, [5,0,0,5]); ctx.fill();
      txt(ins.title, 20, y3 + 13, 8, T.text, 'left', true);
      txt(ins.body, 20, y3 + 24, 7, T.sub, 'left', false);
    });
  }
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// ══════════════════════════════════════════════════════════════════
// PDF GENERATOR
// ══════════════════════════════════════════════════════════════════
function runExportPDF() {
  var btn = document.getElementById('btnRunPDF');
  if (btn) btn.disabled = true;
  closeExportModal();

  // ── Resolve jsPDF from any CDN UMD export pattern ──────────────────
  var jsPDFCtor = (window.jspdf && window.jspdf.jsPDF)
               || (window.jspdf && window.jspdf.default && window.jspdf.default.jsPDF)
               || window.jsPDF
               || null;

  if (!jsPDFCtor) {
    alert('jsPDF library not loaded yet — please wait a moment and try again.');
    hideProgress();
    if (btn) btn.disabled = false;
    return;
  }

  var rawName = (document.getElementById('pdfFilename') || {}).value || 'HPE_Audit_FY2026_Report';
  // Replace whitespace using split/join to avoid regex escape issues in template literals
  var filename = rawName.split(' ').join('_') + '.pdf';

  var sec = {
    cover:      !document.getElementById('pdfSec-cover')      || document.getElementById('pdfSec-cover').checked,
    kpi:        !document.getElementById('pdfSec-kpi')        || document.getElementById('pdfSec-kpi').checked,
    gauge:      !document.getElementById('pdfSec-gauge')      || document.getElementById('pdfSec-gauge').checked,
    insights:   !document.getElementById('pdfSec-insights')   || document.getElementById('pdfSec-insights').checked,
    trend:      !document.getElementById('pdfSec-trend')      || document.getElementById('pdfSec-trend').checked,
    errors:     !document.getElementById('pdfSec-errors')     || document.getElementById('pdfSec-errors').checked,
    recruiters: !document.getElementById('pdfSec-recruiters') || document.getElementById('pdfSec-recruiters').checked,
    monthly:    !document.getElementById('pdfSec-monthly')    || document.getElementById('pdfSec-monthly').checked
  };

  showProgress('\ud83d\udcc4', 'Generating PDF Report\u2026', 'Initialising\u2026');

  setTimeout(function() {
    try {

      var doc = new jsPDFCtor({ orientation:'portrait', unit:'mm', format:'a4' });
      var PW = 210, PH = 297;
      var margin = 16, contentW = PW - margin*2;
      var D = DASHBOARD_DATA;
      var months = D.month_stats.slice().sort(function(a,b){ return a.Month_Number - b.Month_Number; });

      // ── helpers ────────────────────────────────────────────────
      function addPage() { doc.addPage(); return margin; }
      function hline(y, col) {
        doc.setDrawColor(col||'#e5e7eb'); doc.setLineWidth(0.3);
        doc.line(margin, y, PW - margin, y);
        return y + 4;
      }
      function badge(x, y, text, bgHex, textHex) {
        var tw = doc.getTextWidth(text);
        doc.setFillColor(bgHex); doc.roundedRect(x, y-3.5, tw+8, 5.5, 1.5, 1.5, 'F');
        doc.setTextColor(textHex); doc.setFontSize(7); doc.setFont('helvetica','bold');
        doc.text(text, x+4, y); doc.setTextColor('#1a2332');
      }
      function secHeader(doc2, title, icon, y) {
        doc2.setFillColor('#f0fff8'); doc2.roundedRect(margin, y, contentW, 8, 2, 2, 'F');
        doc2.setFillColor('#01A982'); doc2.roundedRect(margin, y, 3, 8, 1, 1, 'F');
        doc2.setFontSize(9); doc2.setFont('helvetica','bold'); doc2.setTextColor('#01A982');
        // Strip non-latin1 chars from icon to prevent jsPDF Helvetica crash
        var safeIcon = icon.split('').filter(function(c){return c.charCodeAt(0)<=255;}).join('');
        doc2.text((safeIcon ? safeIcon + '  ' : '') + title, margin + 6, y + 5.5);
        doc2.setTextColor('#1a2332'); return y + 12;
      }

      var cy = margin; // current Y
      var step = 0, totalSteps = Object.keys(sec).filter(function(k){ return sec[k]; }).length + 1;

      function progress(msg) {
        step++;
        setExportProgress('\ud83d\udcc4', 'Generating PDF\u2026', msg, (step/totalSteps)*90);
      }

      // ── PAGE 1: COVER ──────────────────────────────────────────
      if (sec.cover) {
        progress('Building cover page\u2026');
        // Full-width green header band
        doc.setFillColor('#01A982');
        doc.rect(0, 0, PW, 56, 'F');
        // HPE branding
        doc.setFontSize(28); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
        doc.text('HPE', margin, 26);
        doc.setFontSize(10); doc.setFont('helvetica','normal');
        doc.text('Hewlett Packard Enterprise', margin, 34);
        doc.setFontSize(8); doc.setTextColor('#d9f5ee'); // was rgba(255,255,255,0.7) — jsPDF doesn't support rgba()
        doc.text('Talent Acquisition — Audit Quality Programme', margin, 42);

        // Report title block
        doc.setFillColor('#f8fafc'); doc.rect(0, 56, PW, PH - 56, 'F');
        doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.setTextColor('#0f1624');
        doc.text('Audit Performance Report', margin, 80);
        doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
        doc.text('FY2026  ·  HPE Talent Acquisition  ·  Jan – Apr 2026', margin, 90);

        hline(96, '#e5e7eb');

        // Big KPI block
        var kpiBoxes = [
          { label:'Overall Accuracy', value: D.overall.overall_accuracy + '%', col:'#01A982' },
          { label:'Total Audits', value: D.overall.total_audits.toLocaleString(), col:'#0D5DBF' },
          { label:'Error Rate', value: D.overall.error_rate + '%', col:'#e74c3c' },
          { label:'Total Errors', value: D.overall.total_fail.toString(), col:'#FF8300' }
        ];
        var boxW = (contentW - 9) / 4;
        kpiBoxes.forEach(function(k, i) {
          var bx = margin + i*(boxW+3);
          doc.setFillColor('#ffffff'); doc.roundedRect(bx, 104, boxW, 24, 2, 2, 'F');
          doc.setDrawColor(k.col); doc.setLineWidth(0.5); doc.roundedRect(bx, 104, boxW, 24, 2, 2, 'S');
          doc.setFillColor(k.col); doc.roundedRect(bx, 104, boxW, 2, 1, 1, 'F');
          doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.setTextColor(k.col);
          doc.text(k.value, bx + boxW/2, 118, {align:'center'});
          doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
          doc.text(k.label, bx + boxW/2, 124, {align:'center'});
        });

        // Monthly mini-table
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor('#1a2332');
        doc.text('Monthly Performance Snapshot', margin, 144);
        var tY3 = 148;
        var cols = ['Month','Audits','Pass','Fail','Accuracy','Error Rate','Status'];
        var colWs = [22,26,22,18,26,26,30];
        // Header row
        doc.setFillColor('#0f1624');
        doc.rect(margin, tY3, contentW, 7, 'F');
        var tx = margin + 2;
        cols.forEach(function(c, i) {
          doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
          doc.text(c, tx, tY3+5);
          tx += colWs[i];
        });
        tY3 += 7;
        months.forEach(function(m, mi) {
          var rowBg = mi % 2 === 0 ? '#f8fafc' : '#ffffff';
          doc.setFillColor(rowBg); doc.rect(margin, tY3, contentW, 7, 'F');
          var prev = mi > 0 ? months[mi-1].Accuracy : null;
          var momStr = prev ? (m.Accuracy >= prev ? '+' : '') + (m.Accuracy - prev).toFixed(2) + '%' : '—';
          var status = m.Accuracy >= 99 ? 'Excellent' : m.Accuracy >= 97 ? 'On Track' : 'Watch';
          var vals = [m.Month+' 2026', m.Opportunity_Count.toLocaleString(), m.Opportunity_Pass.toLocaleString(),
                      m.Opportunity_Fail.toString(), m.Accuracy+'%', m.Error_Rate+'%', status];
          var vx = margin + 2;
          vals.forEach(function(v, vi) {
            var col2 = '#1a2332';
            if (vi === 4) col2 = m.Accuracy >= 99 ? '#01A982' : m.Accuracy >= 97 ? '#0D5DBF' : '#e74c3c';
            if (vi === 6) col2 = status === 'Excellent' ? '#01A982' : status === 'On Track' ? '#0D5DBF' : '#e74c3c';
            doc.setFontSize(7); doc.setFont('helvetica', vi===0?'bold':'normal'); doc.setTextColor(col2);
            doc.text(v, vx, tY3+5);
            vx += colWs[vi];
          });
          tY3 += 7;
        });

        // Footer
        doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor('#94a3b8');
        doc.text('Generated: ' + new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}), margin, PH-10);
        doc.text('HPE Talent Acquisition · Confidential', PW-margin, PH-10, {align:'right'});
        doc.setDrawColor('#e5e7eb'); doc.setLineWidth(0.3); doc.line(margin, PH-14, PW-margin, PH-14);
      }

      // ── PAGE 2: KPI + GAUGES ───────────────────────────────────
      if (sec.kpi || sec.gauge) {
        progress('Capturing KPI dashboard\u2026');
        doc.addPage(); cy = margin;

        // Page header
        doc.setFillColor('#0f1624'); doc.rect(0, 0, PW, 14, 'F');
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
        doc.text('KPI DASHBOARD', margin, 9.5);
        doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor('#94a3b8');
        doc.text('FY2026 · ' + new Date().toLocaleDateString(), PW - margin, 9.5, {align:'right'});
        cy = 20;

        if (sec.kpi) {
          cy = secHeader(doc, 'Key Performance Indicators', '\u25cb', cy);
          var kpiAll = [
            { label:'Overall Accuracy', value:D.overall.overall_accuracy+'%', sub:'Target: 95.00%', col:'#01A982' },
            { label:'Total Audits', value:D.overall.total_audits.toLocaleString(), sub:'FY2026 cumulative', col:'#0D5DBF' },
            { label:'Passed Audits', value:D.overall.total_pass.toLocaleString(), sub:'97.69% pass rate', col:'#01A982' },
            { label:'Total Errors', value:D.overall.total_fail.toString(), sub:'Across 12 params', col:'#e74c3c' },
            { label:'Error Rate', value:D.overall.error_rate+'%', sub:'vs 5% target', col:'#FF8300' },
            { label:'Months Tracked', value:'4', sub:'Jan–Apr 2026', col:'#6b7280' }
          ];
          var kW = (contentW-10)/3;
          kpiAll.forEach(function(k, i) {
            var bx = margin + (i%3)*(kW+5);
            var by = cy + Math.floor(i/3)*24;
            doc.setFillColor('#f8fafc'); doc.roundedRect(bx, by, kW, 18, 2, 2, 'F');
            doc.setFillColor(k.col); doc.roundedRect(bx, by, kW, 2, 1, 1, 'F');
            doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(k.col);
            doc.text(k.value, bx+kW/2, by+12, {align:'center'});
            doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
            doc.text(k.label, bx+kW/2, by+16.5, {align:'center'});
          });
          cy += Math.ceil(kpiAll.length/3)*24 + 8;
        }

        if (sec.gauge) {
          cy = secHeader(doc, 'Accuracy Gauges', '\u25cb', cy);
          // Draw gauges programmatically (no html2canvas dependency)
          var gaugeData = [
            { label:'Overall', value: parseFloat(D.overall.overall_accuracy), target:95, col:'#01A982' },
            { label:'Jan 2026', value: parseFloat((D.month_stats.find(function(m){return m.Month==='Jan';}) || {Accuracy:0}).Accuracy), target:95, col:'#0D5DBF' },
            { label:'Feb 2026', value: parseFloat((D.month_stats.find(function(m){return m.Month==='Feb';}) || {Accuracy:0}).Accuracy), target:95, col:'#01A982' },
            { label:'Mar 2026', value: parseFloat((D.month_stats.find(function(m){return m.Month==='Mar';}) || {Accuracy:0}).Accuracy), target:95, col:'#FF8300' },
            { label:'Apr 2026', value: parseFloat((D.month_stats.find(function(m){return m.Month==='Apr';}) || {Accuracy:0}).Accuracy), target:95, col:'#e74c3c' }
          ];
          var gW = (contentW - 12) / gaugeData.length;
          gaugeData.forEach(function(g, gi) {
            var gx = margin + gi * (gW + 3);
            var gy = cy;
            // Background card
            doc.setFillColor('#f8fafc'); doc.roundedRect(gx, gy, gW, 22, 2, 2, 'F');
            doc.setFillColor(g.col); doc.roundedRect(gx, gy, gW, 2, 1, 1, 'F');
            // Value
            var valStr = g.value.toFixed(2) + '%';
            doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(g.value >= 99 ? '#01A982' : g.value >= 97 ? '#0D5DBF' : g.value >= 95 ? '#FF8300' : '#e74c3c');
            doc.text(valStr, gx + gW/2, gy + 12, {align:'center'});
            // Label
            doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
            doc.text(g.label, gx + gW/2, gy + 18, {align:'center'});
            // Target line
            doc.setFontSize(6); doc.setTextColor('#9ca3af');
            doc.text('T:' + g.target + '%', gx + gW/2, gy + 21, {align:'center'});
          });
          cy += 26;
        }
      }

      // ── PAGE 3: AI INSIGHTS ────────────────────────────────────
      if (sec.insights) {
        progress('Writing AI insights\u2026');
        doc.addPage(); cy = margin;
        doc.setFillColor('#0f1624'); doc.rect(0,0,PW,14,'F');
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
        doc.text('AI INSIGHTS', margin, 9.5);
        doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor('#94a3b8');
        doc.text('Auto-generated intelligence · FY2026', PW-margin, 9.5, {align:'right'});
        cy = 20;

        cy = secHeader(doc, 'Auto-Generated Intelligence — FY2026 Snapshot', '\ud83e\udd16', cy);

        var insightData = [
          { type:'alert', icon:'\u26a0', title:'Accuracy Dip in April — Action Required',
            body:'Accuracy declined from 99.43% in February to 97.25% in April (-2.18%), marking the lowest point in FY2026. This downward trajectory from Feb->Mar (98.49%)->Apr (97.25%) signals a worsening trend.',
            rec:'Recommendation: Root cause analysis and corrective action to reverse the decline before it breaches the 95% target.', col:'#e74c3c', bg:'#fff5f5' },
          { type:'critical', icon:'\ud83d\udd34', title:'Target Start Date — Critical Anomaly (89.83% Fail Rate)',
            body:'The "Target start date" parameter has an alarming 89.83% failure rate (53 failures out of 59 audits). This single parameter accounts for 41.4% of all FY2026 errors.',
            rec:'Recommendation: Immediate process review and targeted training for all recruiters on this parameter.', col:'#FF8300', bg:'#fff8f0' },
          { type:'warning', icon:'\u26a0', title:'Recruiter Performance Gap — 3 Below 88–92%',
            body:'Kusuma K (88.04%), Noor Mohammed M (90.91%), and Divya S (91.67%) significantly underperform vs team average of ~98.5%. These recruiters handle 800+ audits cumulatively.',
            rec:'Recommendation: Structured 30-day coaching programme with bi-weekly checkpoint reviews.', col:'#0D5DBF', bg:'#f0f4ff' },
          { type:'info', icon:'\ud83d\udcca', title:'Apr W3 Spike Detected — Isolated Incident',
            body:'Week 3 of April saw accuracy drop to 93.62% — the lowest weekly point in FY. "Target start date" errors (43 failures that week) drove this anomaly. W4 recovered to 97.87%.',
            rec:'Recommendation: Monitor W1/W2 May closely. Assign a dedicated QA checker for target start date audits.', col:'#01A982', bg:'#f0fff8' }
        ];

        insightData.forEach(function(ins) {
          if (cy > PH - 60) { doc.addPage(); cy = margin; }
          doc.setFillColor(ins.bg); doc.roundedRect(margin, cy, contentW, 32, 3, 3, 'F');
          doc.setFillColor(ins.col); doc.roundedRect(margin, cy, 3, 32, 2, 2, 'F');
          doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(ins.col);
          var safeInsIcon = ins.icon.split('').filter(function(c){return c.charCodeAt(0)<=255;}).join('');
          doc.text((safeInsIcon ? safeInsIcon + '  ' : '') + ins.title, margin+7, cy+7);
          doc.setFont('helvetica','normal'); doc.setTextColor('#374151'); doc.setFontSize(7);
          var bodyLines = doc.splitTextToSize(ins.body, contentW-14);
          doc.text(bodyLines.slice(0,2), margin+7, cy+14);
          doc.setTextColor(ins.col); doc.setFont('helvetica','italic');
          var recLines = doc.splitTextToSize(ins.rec, contentW-14);
          doc.text(recLines[0], margin+7, cy+26);
          cy += 36;
        });
      }

      // ── PAGE 4: TREND DATA TABLE (programmatic — no html2canvas) ──────
      if (sec.trend) {
        progress('Writing trend data\u2026');
        doc.addPage(); cy = margin;
        doc.setFillColor('#0f1624'); doc.rect(0,0,PW,14,'F');
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
        doc.text('ACCURACY TRENDS', margin, 9.5);
        doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor('#94a3b8');
        doc.text('16-Week Accuracy Trend · FY2026', PW-margin, 9.5, {align:'right'});
        cy = 20;
        cy = secHeader(doc, '16-Week Accuracy Trend — FY2026', '\ud83d\udcc8', cy);

        // Collect weekly data from PERF_DATA
        var weeks = (PERF_DATA && PERF_DATA.weekly_stats) ? PERF_DATA.weekly_stats.slice() : [];
        if (weeks.length > 0) {
          // Draw a simple bar chart (programmatic)
          var chartH = 40, chartW = contentW, barW = Math.floor(chartW / weeks.length) - 1;
          var minAcc = 88, maxAcc = 100;
          weeks.forEach(function(w){ if(w.Accuracy < minAcc) minAcc = Math.floor(w.Accuracy - 1); });
          var chartBottom = cy + chartH;

          // Axis
          doc.setDrawColor('#e5e7eb'); doc.setLineWidth(0.3);
          doc.line(margin, cy, margin, chartBottom);
          doc.line(margin, chartBottom, margin + chartW, chartBottom);

          // Y-axis labels
          [88, 91, 94, 97, 100].forEach(function(yv) {
            var ypos = chartBottom - ((yv - minAcc) / (maxAcc - minAcc)) * chartH;
            if (ypos >= cy && ypos <= chartBottom) {
              doc.setFontSize(5.5); doc.setTextColor('#9ca3af');
              doc.text(yv + '%', margin - 1, ypos, {align:'right'});
              doc.setDrawColor('#f3f4f6'); doc.setLineWidth(0.15);
              doc.line(margin, ypos, margin + chartW, ypos);
            }
          });

          // Bars
          weeks.forEach(function(w, wi) {
            var bx = margin + wi * (barW + 1);
            var barH2 = ((w.Accuracy - minAcc) / (maxAcc - minAcc)) * chartH;
            barH2 = Math.max(barH2, 1);
            var barColor = w.Accuracy >= 99 ? '#01A982' : w.Accuracy >= 97 ? '#0D5DBF' : w.Accuracy >= 95 ? '#FF8300' : '#e74c3c';
            doc.setFillColor(barColor);
            doc.rect(bx, chartBottom - barH2, barW, barH2, 'F');
            // Week label (every other)
            if (wi % 2 === 0) {
              doc.setFontSize(5); doc.setTextColor('#6b7280');
              var wLabel = (w.Week_Label || ('W'+(wi+1))).substring(0,6);
              doc.text(wLabel, bx + barW/2, chartBottom + 4, {align:'center'});
            }
          });
          cy = chartBottom + 10;

          // Weekly data table
          cy = secHeader(doc, 'Weekly Detail', '\ud83d\udcca', cy);
          var wCols = ['Week','Audits','Pass','Fail','Accuracy','Error Rate'];
          var wWidths = [36,28,24,18,28,24];
          doc.setFillColor('#1a2332'); doc.rect(margin, cy, contentW, 7, 'F');
          var wx2 = margin+2;
          wCols.forEach(function(c,ci){ doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff'); doc.text(c,wx2,cy+5); wx2+=wWidths[ci]; });
          cy+=7;
          weeks.forEach(function(w,wi){
            if(cy > PH-16){ doc.addPage(); cy=margin+14; }
            doc.setFillColor(wi%2===0?'#f8fafc':'#ffffff'); doc.rect(margin,cy,contentW,7,'F');
            var wvx=margin+2;
            var acStr=w.Accuracy+'%', erStr=w.Error_Rate+'%';
            var acCol=w.Accuracy>=99?'#01A982':w.Accuracy>=97?'#0D5DBF':w.Accuracy>=95?'#FF8300':'#e74c3c';
            [(w.Week_Label||'W'+(wi+1)), (w.Opportunity_Count||0).toString(), (w.Opportunity_Pass||0).toString(), (w.Opportunity_Fail||0).toString(), acStr, erStr].forEach(function(v,vi){
              var vc=vi===4||vi===5?acCol:'#1a2332';
              doc.setFontSize(7); doc.setFont('helvetica',vi===0?'bold':'normal'); doc.setTextColor(vc);
              doc.text(v,wvx,cy+5); wvx+=wWidths[vi];
            });
            cy+=7;
          });
          cy+=6;
        } else {
          // Fallback: monthly trend table if no weekly data
          doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
          doc.text('Monthly accuracy trend (Jan–Apr 2026)', margin, cy+6);
          cy += 12;
          months.forEach(function(m,mi){
            var prev2 = mi>0 ? months[mi-1].Accuracy : null;
            var mom2 = prev2 ? (m.Accuracy>=prev2?'+':'')+(m.Accuracy-prev2).toFixed(2)+'%' : '—';
            var barW2 = ((m.Accuracy-90)/10)*contentW;
            doc.setFillColor(m.Accuracy>=99?'#01A982':m.Accuracy>=97?'#0D5DBF':'#FF8300');
            doc.rect(margin, cy, Math.min(Math.max(barW2,2), contentW), 8, 'F');
            doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
            doc.text(m.Month+': '+m.Accuracy+'% (MoM: '+mom2+')', margin+3, cy+5.5);
            cy+=11;
          });
        }
      }

      // ── PAGE 4/5: TOP ERRORS TABLE ─────────────────────────────
      if (sec.errors) {
        progress('Writing error analysis\u2026');
        if (cy > PH - 80) { doc.addPage(); cy = margin; }
        else if (!sec.trend) { doc.addPage(); cy = margin; }
        doc.setFillColor('#0f1624'); doc.rect(0,0,PW,14,'F');
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
        doc.text('ERROR ANALYSIS', margin, 9.5);
        cy = cy < 20 ? 20 : cy;
        cy = secHeader(doc, 'Top Error Parameters — FY2026', '\u26a0', cy);

        var errCols = ['Parameter','Failures','Total Audits','Fail Rate %','Severity'];
        var errWidths = [72,22,28,26,30];
        doc.setFillColor('#1a2332'); doc.rect(margin, cy, contentW, 7, 'F');
        var ex2 = margin + 2;
        errCols.forEach(function(c, ci) {
          doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
          doc.text(c, ex2, cy+5); ex2 += errWidths[ci];
        });
        cy += 7;
        DASHBOARD_DATA.top_errors.filter(function(e){ return e.Opportunity_Fail > 0; }).forEach(function(e, ei) {
          var sev = e.Fail_Pct >= 20 ? 'Critical' : e.Fail_Pct >= 5 ? 'High' : e.Fail_Pct >= 2 ? 'Medium' : 'Low';
          var sevCol = e.Fail_Pct >= 20 ? '#e74c3c' : e.Fail_Pct >= 5 ? '#FF8300' : e.Fail_Pct >= 2 ? '#f59e0b' : '#01A982';
          doc.setFillColor(ei%2===0?'#f8fafc':'#ffffff'); doc.rect(margin, cy, contentW, 7, 'F');
          var vx2 = margin+2;
          [e.Parameter, e.Opportunity_Fail.toString(), e.Opportunity_Count.toString(), e.Fail_Pct+'%', sev].forEach(function(v, vi) {
            var vc = vi===3||vi===4 ? sevCol : '#1a2332';
            doc.setFontSize(7); doc.setFont('helvetica', vi===0?'bold':'normal'); doc.setTextColor(vc);
            doc.text(vi===0 ? (v.length>32?v.substring(0,32)+'\u2026':v) : v, vx2, cy+5);
            vx2 += errWidths[vi];
          });
          cy += 7;
        });
        cy += 6;
      }

      // ── PAGE 5: RECRUITER TABLE ────────────────────────────────
      if (sec.recruiters) {
        progress('Writing recruiter table\u2026');
        doc.addPage(); cy = margin;
        doc.setFillColor('#0f1624'); doc.rect(0,0,PW,14,'F');
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
        doc.text('RECRUITER PERFORMANCE', margin, 9.5);
        cy = 20;
        cy = secHeader(doc, 'Recruiter Performance — Bottom Performers', '\ud83d\udc65', cy);

        var recCols = ['Recruiter','PM','Audits','Errors','Accuracy %','Trend','Status'];
        var recWidths = [44,36,18,16,26,20,18];
        doc.setFillColor('#1a2332'); doc.rect(margin, cy, contentW, 7, 'F');
        var rx = margin+2;
        recCols.forEach(function(c, ci) {
          doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor('#ffffff');
          doc.text(c, rx, cy+5); rx += recWidths[ci];
        });
        cy += 7;

        PERF_DATA.recruiter_monthly.slice().sort(function(a,b){
          return (a.apr||a.mar||a.feb||a.jan||0) - (b.apr||b.mar||b.feb||b.jan||0);
        }).forEach(function(r, ri) {
          var acc = r.apr||r.mar||r.feb||r.jan||0;
          var reg2 = linearRegression([r.jan,r.feb,r.mar,r.apr].filter(function(v){return v!==null;}));
          var trendStr = reg2.slope > 0.15 ? '\u25b2 Up' : reg2.slope < -0.15 ? '\u25bc Down' : '\u2192 Stable';
          var status2 = acc >= 99 ? 'Excellent' : acc >= 97 ? 'On Track' : acc >= 95 ? 'Watch' : 'Critical';
          var acCol = acc >= 99 ? '#01A982' : acc >= 97 ? '#0D5DBF' : acc >= 95 ? '#FF8300' : '#e74c3c';

          // Find PM
          var pmName = 'Unknown';
          Object.keys(PERF_DATA.pm_recruiters).forEach(function(pm) {
            if (PERF_DATA.pm_recruiters[pm].indexOf(r.name) !== -1) pmName = pm.split(' ')[0];
          });

          if (cy > PH - 20) { doc.addPage(); cy = margin + 14; }
          doc.setFillColor(ri%2===0?'#f8fafc':'#ffffff'); doc.rect(margin, cy, contentW, 7, 'F');
          var rvx = margin+2;
          [r.name, pmName, r.audits.toString(), r.errors.toString(), acc+'%', trendStr, status2].forEach(function(v, vi) {
            var vc = vi===4 ? acCol : vi===6 ? acCol : '#1a2332';
            doc.setFontSize(7); doc.setFont('helvetica', vi===0?'bold':'normal'); doc.setTextColor(vc);
            doc.text(v.length>12&&vi<2 ? v.substring(0,12)+'\u2026':v, rvx, cy+5);
            rvx += recWidths[vi];
          });
          cy += 7;
        });
      }

      // ── FINAL PAGE: FOOTER / SIGN-OFF ──────────────────────────
      progress('Finalising PDF\u2026');
      doc.addPage(); cy = PH / 2 - 20;
      doc.setFillColor('#01A982'); doc.rect(0, 0, PW, 8, 'F');
      doc.setFillColor('#f8fafc'); doc.rect(0, 8, PW, PH-8, 'F');
      doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor('#0f1624');
      doc.text('End of Report', PW/2, cy, {align:'center'});
      doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
      doc.text('HPE Talent Acquisition Quality Programme — FY2026', PW/2, cy+10, {align:'center'});
      doc.text('HPE Talent Acquisition · Confidential · For Internal Use Only', PW/2, cy+18, {align:'center'});

      setExportProgress('\ud83d\udcc4', 'Download Ready!', 'Saving file\u2026', 100);
      setTimeout(function() {
        doc.save(filename);
        hideProgress();
        if (btn) btn.disabled = false;
        showToast('\u2713 PDF exported: ' + filename, 'success');
      }, 400);

    } catch(err) {
      console.error('PDF export error:', err);
      hideProgress();
      if (btn) btn.disabled = false;
      showToast('PDF export failed: ' + (err.message || err), 'error');
    }
  }, 50);
}

// ══════════════════════════════════════════════════════════════════
// PPT GENERATOR
// ══════════════════════════════════════════════════════════════════
function runExportPPT() {
  var btn = document.getElementById('btnRunPPT');
  if (btn) btn.disabled = true;
  closeExportModal();

  var rawPptName = (document.getElementById('pptFilename') || {}).value || 'HPE_Audit_FY2026_Deck';
  var filename = rawPptName.split(' ').join('_') + '.pptx';
  var theme = (document.getElementById('pptTheme') || {}).value || 'dark';
  var selected = [];
  [1,2,3,4,5].forEach(function(n){
    var t = document.getElementById('slideThumb-' + n);
    if (t && t.classList.contains('selected')) selected.push(n);
  });
  if (!selected.length) { showToast('No slides selected', 'error'); if(btn)btn.disabled=false; return; }

  if (!window.PptxGenJS) { showToast('PptxGenJS not loaded yet — please wait a moment', 'error'); if(btn)btn.disabled=false; return; }

  showProgress('\ud83d\udcca', 'Generating PowerPoint\u2026', 'Initialising slides\u2026');

  setTimeout(function(){
    try {
      var pptx = new PptxGenJS();
      pptx.layout  = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
      pptx.author  = 'HPE TA Quality Programme';
      pptx.company = 'Hewlett Packard Enterprise';
      pptx.subject = 'Audit Performance Report FY2026';
      pptx.title   = 'HPE Audit Performance Report FY2026';

      var T = _getTheme(theme);
      var D = DASHBOARD_DATA;
      var months = D.month_stats.slice().sort(function(a,b){ return a.Month_Number-b.Month_Number; });
      var total = selected.length;
      var done = 0;

      selected.forEach(function(n) {
        done++;
        setExportProgress('\ud83d\udcca','Building slides\u2026','Slide '+n+' of '+total+'\u2026', 10+(done/total)*75);

        var slide = pptx.addSlide();

        // ── Slide background ──────────────────────────────────────
        slide.background = { color: T.bg.replace('#','') };

        // ── Left accent bar ───────────────────────────────────────
        slide.addShape(pptx.ShapeType.rect, {
          x:0, y:0, w:0.05, h:'100%',
          fill:{ color: T.accent.replace('#','') }, line:{ type:'none' }
        });

        // ── Slide-number badge (bottom right) ─────────────────────
        slide.addText(n + '/' + total, {
          x:'92%', y:'92%', w:'7%', h:'5%',
          fontSize:8, color:'6b7280', align:'right', fontFace:'Calibri'
        });

        // Footer line
        slide.addShape(pptx.ShapeType.rect, {
          x:0.1, y:7.2, w:13.13, h:0.02,
          fill:{ color: T.line.replace('#','') }, line:{ type:'none' }
        });
        slide.addText('HPE Talent Acquisition · Audit Performance FY2026 · Confidential', {
          x:0.1, y:7.25, w:13.13, h:0.2,
          fontSize:7, color:'94a3b8', align:'center', fontFace:'Calibri'
        });

        if (n === 1) {
          // ── COVER ──────────────────────────────────────────────
          // Green header block
          slide.addShape(pptx.ShapeType.rect, {
            x:0, y:0, w:'100%', h:2.8,
            fill:{ type:'gradient', stops:[
              { position:0, color: T.accent.replace('#','') },
              { position:100, color: T.accent2.replace('#','').replace('#','') }
            ]}, line:{ type:'none' }
          });
          slide.addText('HPE', { x:0.4, y:0.3, w:3, h:0.9, fontSize:54, bold:true, color:'FFFFFF', fontFace:'Calibri' });
          slide.addText('Hewlett Packard Enterprise · Talent Acquisition', { x:0.4, y:1.2, w:7, h:0.4, fontSize:14, color:'FFFFFF', fontFace:'Calibri', transparency:20 });
          slide.addText('Audit Quality Programme', { x:0.4, y:1.65, w:7, h:0.4, fontSize:11, color:'FFFFFF', fontFace:'Calibri', transparency:35 });

          // Report title
          slide.addText('Audit Performance Report', { x:0.4, y:3.1, w:9, h:0.65, fontSize:28, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
          slide.addText('FY2026  ·  HPE Talent Acquisition  ·  Jan – Apr 2026', { x:0.4, y:3.78, w:9, h:0.4, fontSize:13, color:T.sub.replace('#',''), fontFace:'Calibri' });

          // Divider
          slide.addShape(pptx.ShapeType.rect, { x:0.4, y:4.25, w:12.5, h:0.02, fill:{color:T.line.replace('#','')}, line:{type:'none'} });

          // 4 KPI boxes
          var ks = [
            { v:D.overall.overall_accuracy+'%', l:'Overall Accuracy', c:T.accent.replace('#','') },
            { v:D.overall.total_audits.toLocaleString(), l:'Total Audits', c:'0D5DBF' },
            { v:D.overall.total_fail.toString(), l:'Total Errors', c:'e74c3c' },
            { v:D.overall.error_rate+'%', l:'Error Rate', c:'FF8300' }
          ];
          ks.forEach(function(k, i) {
            var bx = 0.4 + i * 3.2;
            slide.addShape(pptx.ShapeType.rect, { x:bx, y:4.4, w:2.9, h:1.3, fill:{color:'1a2332'}, line:{type:'none'}, rounding:'0.08' });
            slide.addShape(pptx.ShapeType.rect, { x:bx, y:4.4, w:2.9, h:0.08, fill:{color:k.c}, line:{type:'none'} });
            slide.addText(k.v, { x:bx, y:4.52, w:2.9, h:0.55, fontSize:24, bold:true, color:k.c, align:'center', fontFace:'Calibri' });
            slide.addText(k.l, { x:bx, y:5.08, w:2.9, h:0.25, fontSize:9, color:'94a3b8', align:'center', fontFace:'Calibri' });
          });

          slide.addText('Generated: ' + new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), {
            x:0.4, y:6.0, w:12.5, h:0.3, fontSize:8, color:'6b7280', align:'center', fontFace:'Calibri'
          });

        } else if (n === 2) {
          // ── KPI OVERVIEW ────────────────────────────────────────
          slide.addText('KPI Overview', { x:0.15, y:0.15, w:9, h:0.5, fontSize:20, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
          slide.addText('FY2026 · HPE Talent Acquisition', { x:0.15, y:0.65, w:9, h:0.3, fontSize:10, color:T.sub.replace('#',''), fontFace:'Calibri' });

          // 6 KPI tiles
          var kpi6 = [
            { v:D.overall.overall_accuracy+'%', l:'Overall Accuracy', sub:'Target 95%', c:T.accent.replace('#','') },
            { v:D.overall.total_audits.toLocaleString(), l:'Total Audits', sub:'FY2026', c:'0D5DBF' },
            { v:D.overall.total_pass.toLocaleString(), l:'Passed Audits', sub:'97.69% rate', c:T.accent.replace('#','') },
            { v:D.overall.total_fail.toString(), l:'Total Errors', sub:'12 parameters', c:'e74c3c' },
            { v:D.overall.error_rate+'%', l:'Error Rate', sub:'vs 5% target', c:'FF8300' },
            { v:'4', l:'Months Tracked', sub:'Jan–Apr 2026', c:'6b7280' }
          ];
          kpi6.forEach(function(k, i) {
            var col2 = i % 3, row2 = Math.floor(i/3);
            var bx = 0.15 + col2 * 4.4, by = 1.05 + row2 * 2.3;
            slide.addShape(pptx.ShapeType.rect, { x:bx, y:by, w:4.1, h:2.0, fill:{color:T.bg2.replace('#','')}, line:{type:'none'}, rounding:'0.1' });
            slide.addShape(pptx.ShapeType.rect, { x:bx, y:by, w:4.1, h:0.1, fill:{color:k.c}, line:{type:'none'} });
            slide.addText(k.v, { x:bx, y:by+0.3, w:4.1, h:0.9, fontSize:30, bold:true, color:k.c, align:'center', fontFace:'Calibri' });
            slide.addText(k.l, { x:bx, y:by+1.22, w:4.1, h:0.3, fontSize:11, bold:true, color:T.text.replace('#',''), align:'center', fontFace:'Calibri' });
            slide.addText(k.sub, { x:bx, y:by+1.55, w:4.1, h:0.25, fontSize:9, color:T.sub.replace('#',''), align:'center', fontFace:'Calibri' });
          });

        } else if (n === 3) {
          // ── ACCURACY TREND ──────────────────────────────────────
          slide.addText('Accuracy Trend', { x:0.15, y:0.15, w:10, h:0.5, fontSize:20, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
          slide.addText('Month-over-month accuracy · FY2026 · Jan–Apr 2026', { x:0.15, y:0.65, w:10, h:0.3, fontSize:10, color:T.sub.replace('#',''), fontFace:'Calibri' });

          // Month table
          var mCols = ['Month','Audits','Pass','Fail','Accuracy','Error Rate','MoM','Status'];
          var mWidths = [1.4,1.2,1.0,0.8,1.3,1.2,1.1,1.3];
          var tStartY = 1.05;
          // Header
          mCols.forEach(function(c, ci) {
            var bx3 = 0.15 + mWidths.slice(0,ci).reduce(function(a,b){return a+b;},0);
            slide.addShape(pptx.ShapeType.rect, { x:bx3, y:tStartY, w:mWidths[ci]-0.05, h:0.38, fill:{color:'1a2332'}, line:{type:'none'} });
            slide.addText(c, { x:bx3+0.05, y:tStartY, w:mWidths[ci]-0.1, h:0.38, fontSize:9, bold:true, color:'FFFFFF', fontFace:'Calibri', valign:'middle' });
          });
          months.forEach(function(m, mi) {
            var ry = tStartY + 0.38 + mi * 0.55;
            var prev3 = mi > 0 ? months[mi-1].Accuracy : null;
            var mom3 = prev3 ? (m.Accuracy >= prev3 ? '+':'')+((m.Accuracy-prev3).toFixed(2))+'%' : '—';
            var st3 = m.Accuracy >= 99 ? 'Excellent' : m.Accuracy >= 97 ? 'On Track' : 'Watch';
            var stC = m.Accuracy >= 99 ? T.accent.replace('#','') : m.Accuracy >= 97 ? '0D5DBF' : 'FF8300';
            var rowVals = [m.Month+' 2026', m.Opportunity_Count.toLocaleString(), m.Opportunity_Pass.toLocaleString(), m.Opportunity_Fail.toString(), m.Accuracy+'%', m.Error_Rate+'%', mom3, st3];
            var rowBg = mi%2===0 ? T.bg2.replace('#','') : T.bg.replace('#','');
            mCols.forEach(function(c4, ci4) {
              var bx4 = 0.15 + mWidths.slice(0,ci4).reduce(function(a,b){return a+b;},0);
              slide.addShape(pptx.ShapeType.rect, { x:bx4, y:ry, w:mWidths[ci4]-0.05, h:0.5, fill:{color:rowBg}, line:{type:'none'} });
              var vc4 = (ci4===4||ci4===7) ? stC : T.text.replace('#','');
              slide.addText(rowVals[ci4], { x:bx4+0.05, y:ry, w:mWidths[ci4]-0.1, h:0.5, fontSize:10, color:vc4, fontFace:'Calibri', valign:'middle', bold:(ci4===4) });
            });
          });

          // Trend summary box
          var slope3 = months[months.length-1].Accuracy - months[0].Accuracy;
          slide.addShape(pptx.ShapeType.rect, { x:0.15, y:6.0, w:13.0, h:0.8, fill:{color:T.bg2.replace('#','')}, line:{type:'none'}, rounding:'0.1' });
          slide.addText((slope3 >= 0 ? '\u25b2' : '\u25bc') + ' Trend: ' + (slope3 >= 0 ? 'Improving' : 'Declining') + ' (' + (slope3 >= 0 ? '+' : '') + slope3.toFixed(2) + '% Jan→Apr)  ·  Lowest: Apr ' + months.find(function(m){return m.Accuracy===Math.min.apply(null,months.map(function(m2){return m2.Accuracy;}));}).Accuracy + '%  ·  Highest: ' + Math.max.apply(null,months.map(function(m){return m.Accuracy;})) + '%', {
            x:0.35, y:6.05, w:12.6, h:0.7, fontSize:10, color:slope3>=0?T.accent.replace('#',''):'e74c3c', fontFace:'Calibri', valign:'middle', bold:true
          });

        } else if (n === 4) {
          // ── RISK & ERRORS ────────────────────────────────────────
          slide.addText('Risk Signals & Error Analysis', { x:0.15, y:0.15, w:10, h:0.5, fontSize:20, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
          slide.addText('Top error parameters and predictive risk scoring · FY2026', { x:0.15, y:0.65, w:10, h:0.3, fontSize:10, color:T.sub.replace('#',''), fontFace:'Calibri' });

          // Top errors table (left)
          var topE = DASHBOARD_DATA.top_errors.filter(function(e){return e.Opportunity_Fail>0;}).slice(0,7);
          var eCols = ['Parameter','Failures','Fail %','Severity'];
          var eWs = [3.2,1.1,1.0,1.1];
          var eStartY = 1.1;
          eCols.forEach(function(c5, ci5) {
            var bx5 = 0.15 + eWs.slice(0,ci5).reduce(function(a,b){return a+b;},0);
            slide.addShape(pptx.ShapeType.rect, { x:bx5, y:eStartY, w:eWs[ci5]-0.05, h:0.35, fill:{color:'1a2332'}, line:{type:'none'} });
            slide.addText(c5, { x:bx5+0.05, y:eStartY, w:eWs[ci5]-0.1, h:0.35, fontSize:9, bold:true, color:'FFFFFF', fontFace:'Calibri', valign:'middle' });
          });
          topE.forEach(function(e5, ei5) {
            var ey = eStartY + 0.35 + ei5*0.62;
            var sev5 = e5.Fail_Pct>=20?'Critical':e5.Fail_Pct>=5?'High':e5.Fail_Pct>=2?'Medium':'Low';
            var sC5 = e5.Fail_Pct>=20?'e74c3c':e5.Fail_Pct>=5?'FF8300':e5.Fail_Pct>=2?'f59e0b':T.accent.replace('#','');
            var eVals = [e5.Parameter, e5.Opportunity_Fail.toString(), e5.Fail_Pct+'%', sev5];
            var eBg = ei5%2===0?T.bg2.replace('#',''):T.bg.replace('#','');
            eWs.forEach(function(ew, ewi) {
              var ebx = 0.15 + eWs.slice(0,ewi).reduce(function(a,b){return a+b;},0);
              slide.addShape(pptx.ShapeType.rect, { x:ebx, y:ey, w:ew-0.05, h:0.57, fill:{color:eBg}, line:{type:'none'} });
              var evc = ewi>=2 ? sC5 : T.text.replace('#','');
              var ev = ewi===0&&eVals[0].length>30 ? eVals[0].substring(0,30)+'\u2026' : eVals[ewi];
              slide.addText(ev, { x:ebx+0.05, y:ey, w:ew-0.1, h:0.57, fontSize:9, color:evc, fontFace:'Calibri', valign:'middle', bold:ewi===3 });
            });
          });

          // Risk KPI boxes (right)
          var recs6 = PERF_DATA.recruiter_monthly;
          var atRisk6 = recs6.filter(function(r){return computeRiskScore(r).score>=45;}).length;
          var highP6 = DASHBOARD_DATA.top_errors.filter(function(e){return e.Fail_Pct>=3;}).length;
          var rKpis = [
            { v:atRisk6.toString(), l:'Recruiters at Risk', c:'e74c3c' },
            { v:highP6.toString(), l:'High-Risk Params', c:'FF8300' },
            { v:D.overall.error_rate+'%', l:'Error Rate', c:'FF8300' }
          ];
          rKpis.forEach(function(rk, rki) {
            var rbx = 6.8, rby = 1.1 + rki * 1.8;
            slide.addShape(pptx.ShapeType.rect, { x:rbx, y:rby, w:6.3, h:1.55, fill:{color:T.bg2.replace('#','')}, line:{type:'none'}, rounding:'0.1' });
            slide.addShape(pptx.ShapeType.rect, { x:rbx, y:rby, w:6.3, h:0.1, fill:{color:rk.c}, line:{type:'none'} });
            slide.addText(rk.v, { x:rbx, y:rby+0.2, w:6.3, h:0.75, fontSize:34, bold:true, color:rk.c, align:'center', fontFace:'Calibri' });
            slide.addText(rk.l, { x:rbx, y:rby+1.0, w:6.3, h:0.3, fontSize:10, color:T.sub.replace('#',''), align:'center', fontFace:'Calibri' });
          });

        } else if (n === 5) {
          // ── AI INSIGHTS ─────────────────────────────────────────
          slide.addText('Insights and Recommendations', { x:0.15, y:0.15, w:12, h:0.5, fontSize:20, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
          slide.addText('Auto-generated intelligence · FY2026 · HPE Talent Acquisition', { x:0.15, y:0.65, w:12, h:0.3, fontSize:10, color:T.sub.replace('#',''), fontFace:'Calibri' });

          var aiCards = [
            { icon:'\u26a0 CRITICAL', title:'April Accuracy Dip',
              body:'Accuracy declined from 99.43% (Feb) to 97.25% (Apr) — a 2.18% drop. Downward trajectory across Feb→Mar→Apr requires immediate root cause analysis and corrective action plan.',
              action:'Action: Schedule emergency review session for April recruiters. Identify specific audit types with highest error rates.',
              c:'e74c3c', bg: T.bg2.replace('#','') },
            { icon:'\ud83d\udd34 HIGH', title:'"Target Start Date" — 89.83% Fail Rate',
              body:'53 out of 59 audits failed this parameter — accounting for 41.4% of all FY2026 errors. This is a systemic process issue requiring immediate intervention.',
              action:'Action: Audit SOP review + targeted retraining for all recruiters. Consider mandatory checklist.',
              c:'FF8300', bg: T.bg2.replace('#','') },
            { icon:'\ud83d\udcc8 MODERATE', title:'3 Recruiters Below Team Average',
              body:'Kusuma K (88.04%), Noor Mohammed M (90.91%), and Divya S (91.67%) are significantly below the 98.5% team benchmark. Combined: ~800+ audits at risk.',
              action:'Action: 30-day structured coaching programme with bi-weekly checkpoint reviews and performance improvement plan.',
              c:T.accent.replace('#',''), bg: T.bg2.replace('#','') },
            { icon:'\u2714 POSITIVE', title:'Apr W4 Recovery Confirmed',
              body:'After the W3 spike to 93.62%, accuracy recovered to 97.87% in W4 — confirming the W3 anomaly was an isolated incident driven by Target Start Date errors.',
              action:'Monitor: Track W1 May to confirm continued recovery. The "Target Start Date" fix is the key lever.',
              c:T.accent.replace('#',''), bg: T.bg2.replace('#','') }
          ];

          aiCards.forEach(function(card, ci7) {
            var col7 = ci7 % 2, row7 = Math.floor(ci7/2);
            var cx7 = 0.15 + col7 * 6.65, cy7 = 1.05 + row7 * 3.0;
            slide.addShape(pptx.ShapeType.rect, { x:cx7, y:cy7, w:6.4, h:2.7, fill:{color:card.bg}, line:{type:'none'}, rounding:'0.1' });
            slide.addShape(pptx.ShapeType.rect, { x:cx7, y:cy7, w:0.08, h:2.7, fill:{color:card.c}, line:{type:'none'} });
            slide.addText(card.icon, { x:cx7+0.2, y:cy7+0.12, w:6.0, h:0.35, fontSize:9, bold:true, color:card.c, fontFace:'Calibri' });
            slide.addText(card.title, { x:cx7+0.2, y:cy7+0.48, w:6.0, h:0.4, fontSize:13, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
            slide.addText(card.body, { x:cx7+0.2, y:cy7+0.9, w:6.0, h:1.0, fontSize:9, color:T.sub.replace('#',''), fontFace:'Calibri', breakLine:true, paraSpaceBefore:0 });
            slide.addText(card.action, { x:cx7+0.2, y:cy7+2.2, w:6.0, h:0.35, fontSize:8, italic:true, color:card.c, fontFace:'Calibri' });
          });
        }
      });

      setExportProgress('\ud83d\udcca','Saving .pptx file\u2026','Almost done\u2026',95);
      pptx.writeFile({ fileName: filename }).then(function() {
        hideProgress();
        if (btn) btn.disabled = false;
        showToast('\u2713 PowerPoint exported: ' + filename, 'success');
      }).catch(function(err) {
        hideProgress();
        if (btn) btn.disabled = false;
        showToast('PPT export failed: ' + err.message, 'error');
      });

    } catch(err) {
      console.error('PPT export error:', err);
      hideProgress();
      if (btn) btn.disabled = false;
      showToast('PPT export failed: ' + (err.message || err), 'error');
    }
  }, 50);
}


// ══════════════════════════════════════════════════════════════════
// DARK MODE
// ══════════════════════════════════════════════════════════════════

function applyTheme(dark) {
  var html = document.documentElement;
  if (dark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  // Redraw all visible Chart.js charts with correct grid/label colours
  _redrawChartsForTheme(dark);
}

function toggleDarkMode() {
  var isDark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('hpe_dark_mode', isDark ? '1' : '0'); } catch(e) {}
  _redrawChartsForTheme(isDark);
}

function _redrawChartsForTheme(dark) {
  var gridCol  = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  var tickCol  = dark ? '#6e8090' : '#6b7d8c';
  var legendCol= dark ? '#a8b8c8' : '#425563';

  // Update Chart.js global defaults so new charts pick them up
  if (window.Chart) {
    Chart.defaults.color = legendCol;
    Chart.defaults.borderColor = gridCol;
    if (Chart.defaults.scale) {
      Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
      Chart.defaults.scale.grid.color = gridCol;
      Chart.defaults.scale.ticks = Chart.defaults.scale.ticks || {};
      Chart.defaults.scale.ticks.color = tickCol;
    }
  }

  // Patch every live chart instance
  Object.keys(charts).forEach(function(id) {
    var ch = charts[id];
    if (!ch) return;
    var opts = ch.options;
    if (!opts) return;
    // Scales
    if (opts.scales) {
      Object.keys(opts.scales).forEach(function(axis) {
        var sc = opts.scales[axis];
        if (sc.grid)  sc.grid.color  = gridCol;
        if (sc.ticks) sc.ticks.color = tickCol;
        if (sc.border) sc.border.color = gridCol;
      });
    }
    // Legend
    if (opts.plugins && opts.plugins.legend && opts.plugins.legend.labels) {
      opts.plugins.legend.labels.color = legendCol;
    }
    ch.update('none'); // silent re-render, no animation
  });
}

// ==================== FEATURE 1: GLOBAL SEARCH ====================
var _searchIndex = null;
var _searchFocusIdx = -1;
var _searchResults = [];

function _buildSearchIndex() {
  if (_searchIndex) return _searchIndex;
  var idx = [];

  // Tabs
  var tabs = [
    { tab:'executive',   label:'Executive Summary',          icon:'fa-tachometer-alt', iconColor:'#0D5DBF', meta:'Overview dashboard' },
    { tab:'trends',      label:'Accuracy Trends',            icon:'fa-chart-line',     iconColor:'#01A982', meta:'Monthly & weekly trends' },
    { tab:'improvement', label:'Improvement & Scope',        icon:'fa-arrow-trend-up', iconColor:'#FF8300', meta:'Pareto, recruiter, PM charts' },
    { tab:'capa',        label:'CAPA — Bot Undo',            icon:'fa-clipboard-check',iconColor:'#9b59b6', meta:'Corrective actions' },
    { tab:'insights',    label:'Audit Insights',                icon:'fa-brain',          iconColor:'#e74c3c', meta:'Radar, heatmap' },
    { tab:'data',        label:'Data Management',            icon:'fa-database',       iconColor:'#2ecc71', meta:'Weekly audit table' },
    { tab:'sla',         label:'SLA Performance',            icon:'fa-clipboard-check',iconColor:'#3498db', meta:'SLA compliance metrics' },
    { tab:'performance', label:'Performance Intelligence',   icon:'fa-user-chart',     iconColor:'#FF8300', meta:'Scorecard, risk, PM panel' },
    { tab:'glossary',    label:'Glossary',                   icon:'fa-book-open',      iconColor:'#01A982', meta:'Definitions, formulas, calculations' }
  ];
  tabs.forEach(function(t) {
    idx.push({ type:'tab', tab:t.tab, label:t.label, meta:t.meta, icon:t.icon, iconColor:t.iconColor,
      keywords:(t.label+' '+t.meta).toLowerCase() });
  });

  // Recruiters
  PERF_DATA.recruiter_monthly.forEach(function(r) {
    var latestAcc = r.apr||r.mar||r.feb||r.jan||0;
    idx.push({ type:'recruiter', tab:'performance', label:r.name,
      meta:'PM: '+(r.pm||'—')+' · Accuracy: '+latestAcc+'% · '+r.audits+' audits',
      icon:'fa-user', iconColor:'#0D5DBF', scrollTo:'sc-card-'+r.name.replace(/ /g,'_'),
      keywords:(r.name+' '+(r.pm||'')).toLowerCase() });
  });

  // Error parameters
  DASHBOARD_DATA.top_errors.forEach(function(p) {
    idx.push({ type:'parameter', tab:'performance', label:p.Parameter,
      meta:'Error rate: '+p.Fail_Pct+'% · '+p.Opportunity_Fail+' failures',
      icon:'fa-exclamation-circle', iconColor: p.Fail_Pct>=5?'#C54E4B':p.Fail_Pct>=2?'#FF8300':'#01A982',
      scrollTo:'perfPanel-param',
      keywords:p.Parameter.toLowerCase() });
  });

  // PMs
  Object.keys(PERF_DATA.pm_recruiters).forEach(function(pm) {
    idx.push({ type:'pm', tab:'performance', label:pm,
      meta:'PM · Team: '+PERF_DATA.pm_recruiters[pm].join(', '),
      icon:'fa-user-tie', iconColor:'#9b59b6',
      scrollTo:'perfPanel-pm',
      keywords:pm.toLowerCase() });
  });

  // KPI metric labels
  var kpis = [
    { label:'Overall FY Accuracy', tab:'executive', meta:'Key performance indicator', scrollTo:'tab-executive' },
    { label:'Total Audits Conducted', tab:'executive', meta:'Audit volume metric', scrollTo:'tab-executive' },
    { label:'Total Errors Identified', tab:'executive', meta:'Error count metric', scrollTo:'tab-executive' },
    { label:'Accuracy Trend Slope', tab:'trends', meta:'Regression line direction', scrollTo:'tab-trends' },
    { label:'Risk Intelligence Panel', tab:'performance', meta:'Recruiter risk scores & drops', scrollTo:'perfPanel-risk' },
    { label:'Recruiter Scorecard', tab:'performance', meta:'Tiered recruiter rankings', scrollTo:'perfPanel-scorecard' },
    { label:'Parameter Deep-Dive', tab:'performance', meta:'Error parameter breakdown', scrollTo:'perfPanel-param' },
    { label:'PM Performance Matrix', tab:'performance', meta:'Per-PM performance analysis', scrollTo:'perfPanel-pm' },
    { label:'Goal Tracker & Alerts', tab:'performance', meta:'Active alerts and thresholds', scrollTo:'perfPanel-goals' },
    { label:'SLA Compliance', tab:'sla', meta:'Service level agreement metrics', scrollTo:'tab-sla' },
    { label:'CAPA Actions', tab:'capa', meta:'Corrective and preventive actions', scrollTo:'tab-capa' }
  ];
  kpis.forEach(function(k) {
    idx.push({ type:'kpi', tab:k.tab, label:k.label, meta:k.meta,
      icon:'fa-chart-bar', iconColor:'#01A982', scrollTo:k.scrollTo,
      keywords:k.label.toLowerCase()+' '+k.meta.toLowerCase() });
  });

  _searchIndex = idx;
  return idx;
}

function _hl(text, q) {
  if (!q) return text;
  // Case-insensitive highlight using split/join to avoid ALL regex backslash issues in TSX template
  var lowerText = text.toLowerCase();
  var lowerQ    = q.toLowerCase();
  var result = '';
  var idx = 0;
  var qLen = lowerQ.length;
  var pos;
  while ((pos = lowerText.indexOf(lowerQ, idx)) !== -1) {
    result += text.slice(idx, pos)
      + '<span class="search-highlight">' + text.slice(pos, pos + qLen) + '</span>';
    idx = pos + qLen;
  }
  result += text.slice(idx);
  return result;
}

function doSearch(q) {
  var dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;
  var raw = (q||'').trim();
  if (raw.length < 2) { dropdown.classList.remove('open'); _searchResults=[]; _searchFocusIdx=-1; return; }
  var idx = _buildSearchIndex();
  var lower = raw.toLowerCase();
  var results = idx.filter(function(item) { return item.keywords.indexOf(lower) !== -1; });
  results = results.slice(0, 12);
  _searchResults = results;
  _searchFocusIdx = -1;

  if (!results.length) {
    dropdown.innerHTML = '<div class="search-no-results"><i class="fas fa-search" style="margin-right:6px;opacity:0.4"></i>No results for "'+raw+'"</div>';
    dropdown.classList.add('open');
    return;
  }

  // Group by type
  var groups = {};
  var typeOrder = ['tab','recruiter','parameter','pm','kpi'];
  var typeLabels = { tab:'Tabs', recruiter:'Recruiters', parameter:'Error Parameters', pm:'Project Managers', kpi:'KPI Metrics' };
  results.forEach(function(r) { if (!groups[r.type]) groups[r.type]=[];  groups[r.type].push(r); });

  var html = '';
  typeOrder.forEach(function(type) {
    if (!groups[type] || !groups[type].length) return;
    html += '<div class="search-section-head">'+typeLabels[type]+'</div>';
    groups[type].forEach(function(item, gi) {
      var globalIdx = results.indexOf(item);
      html += '<div class="search-result-item" role="option" data-idx="'+globalIdx+'" onclick="searchNavigate('+globalIdx+')">'
        + '<div class="search-result-icon" style="background:'+item.iconColor+'22;color:'+item.iconColor+'">'
        + '<i class="fas '+item.icon+'"></i></div>'
        + '<div style="flex:1;min-width:0">'
        + '<div class="search-result-title">'+_hl(item.label, raw)+'</div>'
        + '<div class="search-result-meta">'+item.meta+'</div>'
        + '</div>'
        + '<div class="search-result-cat" style="color:'+item.iconColor+';flex-shrink:0">'+typeLabels[type]+'</div>'
        + '</div>';
    });
  });

  dropdown.innerHTML = html;
  dropdown.classList.add('open');
}

function searchOnFocus() {
  var q = (document.getElementById('globalSearchInput')||{}).value||'';
  if (q.trim().length >= 2) doSearch(q);
}

function searchKeyNav(e) {
  var dropdown = document.getElementById('searchDropdown');
  if (!dropdown || !dropdown.classList.contains('open')) { if(e.key==='Escape') closeSearch(); return; }
  var items = dropdown.querySelectorAll('.search-result-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _searchFocusIdx = Math.min(_searchFocusIdx + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _searchFocusIdx = Math.max(_searchFocusIdx - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (_searchFocusIdx >= 0 && _searchFocusIdx < _searchResults.length) searchNavigate(_searchFocusIdx);
    else if (_searchResults.length > 0) searchNavigate(0);
    return;
  } else if (e.key === 'Escape') {
    closeSearch(); return;
  }
  items.forEach(function(it, i) { it.classList.toggle('search-focused', i === _searchFocusIdx); });
  if (_searchFocusIdx >= 0) items[_searchFocusIdx].scrollIntoView({ block:'nearest' });
}

function searchNavigate(idx) {
  var item = _searchResults[idx];
  if (!item) return;
  closeSearch();

  // Switch to target tab
  var navTabs = document.querySelectorAll('.nav-tab');
  var targetNav = null;
  navTabs.forEach(function(nt) {
    if (nt.getAttribute('onclick') && nt.getAttribute('onclick').indexOf("'"+item.tab+"'") !== -1) targetNav = nt;
  });
  if (targetNav) switchTab(item.tab, targetNav);

  // Scroll to + highlight element
  if (item.scrollTo) {
    setTimeout(function() {
      var el = document.getElementById(item.scrollTo);
      if (!el) {
        // For performance sub-panels, trigger the panel switch
        if (item.scrollTo && item.scrollTo.indexOf('perfPanel-') === 0) {
          var panelId = item.scrollTo.replace('perfPanel-','');
          var subBtn = document.querySelector('.perf-sub-btn[onclick*="'+panelId+'"]');
          if (subBtn) showPerfPanel(panelId, subBtn);
          setTimeout(function() {
            var el2 = document.getElementById(item.scrollTo);
            if (el2) { el2.scrollIntoView({behavior:'smooth',block:'start'}); _hlEl(el2); }
          }, 250);
        }
        return;
      }
      el.scrollIntoView({ behavior:'smooth', block:'start' });
      _hlEl(el);
    }, 220);
  }
}

function _hlEl(el) {
  el.classList.add('search-elem-hl');
  setTimeout(function() { el.classList.remove('search-elem-hl'); }, 2200);
}

function closeSearch() {
  var dropdown = document.getElementById('searchDropdown');
  if (dropdown) dropdown.classList.remove('open');
  var inp = document.getElementById('globalSearchInput');
  if (inp) { inp.value = ''; inp.blur(); }
  _searchFocusIdx = -1;
  _searchResults = [];
}

// Close search when clicking outside
document.addEventListener('click', function(e) {
  var wrap = document.getElementById('headerSearchWrap');
  if (wrap && !wrap.contains(e.target)) {
    var dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.classList.remove('open');
  }
});

// ==================== FEATURE 2: THRESHOLD SETTINGS DRAWER ====================
function openSettingsDrawer() {
  // Sync sliders to current PERF_DATA values
  var t = PERF_DATA.thresholds;
  var sMA = document.getElementById('slider_minAccuracy');
  var sME = document.getElementById('slider_maxErrorRate');
  var sMC = document.getElementById('slider_maxConsecDrops');
  if (sMA) sMA.value = t.minAccuracy;
  if (sME) sME.value = t.maxErrorRate;
  if (sMC) sMC.value = t.maxConsecDrops;
  _syncThreshBadges();
  _syncThreshPreview();
  _updateSliderBackground(document.getElementById('slider_minAccuracy'), 90, 100);
  _updateSliderBackground(document.getElementById('slider_maxErrorRate'), 0, 15);
  _updateSliderBackground(document.getElementById('slider_maxConsecDrops'), 1, 5);

  document.getElementById('threshOverlay').classList.add('open');
  document.getElementById('threshDrawer').classList.add('open');
}

function closeSettingsDrawer() {
  document.getElementById('threshOverlay').classList.remove('open');
  document.getElementById('threshDrawer').classList.remove('open');
}

function _updateSliderBackground(slider, min, max) {
  if (!slider) return;
  var val = parseFloat(slider.value);
  var pct = ((val - min) / (max - min)) * 100;
  slider.style.background = 'linear-gradient(to right, var(--hpe-green) 0%, var(--hpe-green) '
    + pct + '%, var(--border) ' + pct + '%, var(--border) 100%)';
}

function onThreshSlider(key, val) {
  val = parseFloat(val);
  var badge = document.getElementById('badge_' + key);
  if (badge) badge.textContent = (key === 'maxConsecDrops') ? val : val.toFixed(1) + '%';
  // Update slider gradient
  var slider = document.getElementById('slider_' + key);
  var ranges = { minAccuracy:[90,100], maxErrorRate:[1,15], maxConsecDrops:[1,5] };
  var r = ranges[key];
  if (r) _updateSliderBackground(slider, r[0], r[1]);
}

function _syncThreshBadges() {
  var t = PERF_DATA.thresholds;
  var bMA = document.getElementById('badge_minAccuracy');
  var bME = document.getElementById('badge_maxErrorRate');
  var bMC = document.getElementById('badge_maxConsecDrops');
  if (bMA) bMA.textContent = t.minAccuracy.toFixed(1) + '%';
  if (bME) bME.textContent = t.maxErrorRate.toFixed(1) + '%';
  if (bMC) bMC.textContent = t.maxConsecDrops;
}

function _syncThreshPreview() {
  var t = PERF_DATA.thresholds;
  var pMA = document.getElementById('prev_minAccuracy');
  var pME = document.getElementById('prev_maxErrorRate');
  var pMC = document.getElementById('prev_maxConsecDrops');
  if (pMA) pMA.textContent = t.minAccuracy.toFixed(1) + '%';
  if (pME) pME.textContent = t.maxErrorRate.toFixed(1) + '%';
  if (pMC) pMC.textContent = t.maxConsecDrops;
}

function applyThresholds() {
  var sMA = document.getElementById('slider_minAccuracy');
  var sME = document.getElementById('slider_maxErrorRate');
  var sMC = document.getElementById('slider_maxConsecDrops');
  if (sMA) PERF_DATA.thresholds.minAccuracy   = parseFloat(sMA.value);
  if (sME) PERF_DATA.thresholds.maxErrorRate  = parseFloat(sME.value);
  if (sMC) PERF_DATA.thresholds.maxConsecDrops= parseInt(sMC.value);

  _syncThreshPreview();

  // Re-render Risk + Alerts
  if (typeof buildRiskPanel === 'function') buildRiskPanel();
  if (typeof buildAlerts   === 'function') buildAlerts();

  // Visual feedback on button
  var btn = document.querySelector('.thresh-apply-btn');
  if (btn) {
    var orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check" style="margin-right:6px"></i>Applied!';
    btn.style.background = 'linear-gradient(135deg,#01A982,#008060)';
    setTimeout(function() {
      btn.innerHTML = orig;
      btn.style.background = '';
    }, 1600);
  }

  // Auto-navigate to performance tab if not already there
  var perfTab = document.querySelector('.nav-tab[onclick*="performance"]');
  if (perfTab && !document.getElementById('tab-performance').classList.contains('active')) {
    // Don't force-navigate; just let user know
  }
}

function resetThresholds() {
  PERF_DATA.thresholds = { maxErrorRate: 5.0, minAccuracy: 95.0, maxConsecDrops: 2 };
  openSettingsDrawer(); // re-sync sliders
  applyThresholds();    // re-render
}

// ==================== FEATURE 3: RECRUITER COMPARISON TOOL ====================
var _compareSet = new Set();
var _compareCharts = {};

function toggleCompare(btn) {
  var name = btn.getAttribute('data-recname');
  if (!name) return;
  if (_compareSet.has(name)) {
    _compareSet.delete(name);
    btn.classList.remove('selected');
    btn.innerHTML = '<i class="fas fa-plus" style="margin-right:3px;font-size:8px"></i>Compare';
  } else {
    if (_compareSet.size >= 3) {
      // max 3 — flash warning
      btn.style.borderColor = '#e74c3c';
      btn.style.color = '#e74c3c';
      setTimeout(function() { btn.style.borderColor = ''; btn.style.color = ''; }, 800);
      return;
    }
    _compareSet.add(name);
    btn.classList.add('selected');
    btn.innerHTML = '<i class="fas fa-check" style="margin-right:3px;font-size:8px"></i>Selected';
  }
  _updateCompareFab();
}

function _updateCompareFab() {
  var fab = document.getElementById('compareFab');
  var lbl = document.getElementById('compareFabLabel');
  if (!fab || !lbl) return;
  var n = _compareSet.size;
  lbl.textContent = 'Compare Selected (' + n + ')';
  if (n >= 2) {
    fab.classList.add('visible');
  } else {
    fab.classList.remove('visible');
  }
}

function openCompareModal() {
  if (_compareSet.size < 2) return;
  buildCompareModal();
  document.getElementById('compareModalOverlay').classList.add('open');
}

function closeCompareModal() {
  document.getElementById('compareModalOverlay').classList.remove('open');
  // Destroy compare charts to free memory
  Object.keys(_compareCharts).forEach(function(k) {
    try { _compareCharts[k].destroy(); } catch(e) {}
    delete _compareCharts[k];
  });
}

function buildCompareModal() {
  var names = Array.from(_compareSet);
  var recs = names.map(function(n) {
    return PERF_DATA.recruiter_monthly.find(function(r) { return r.name === n; });
  }).filter(Boolean);

  var n = recs.length;
  var body = document.getElementById('compareModalBody');
  if (!body) return;

  // Tier helper
  function getTierLocal(acc) {
    if (acc >= 99) return { label:'Tier 1', color:'#01A982' };
    if (acc >= 97) return { label:'Tier 2', color:'#0D5DBF' };
    if (acc >= 95) return { label:'Tier 3', color:'#FF8300' };
    return { label:'Critical', color:'#C54E4B' };
  }

  var tierColors = ['#0D5DBF','#01A982','#FF8300','#9b59b6'];

  // Column headers
  var colHeadersHtml = recs.map(function(r, i) {
    var acc = r.apr||r.mar||r.feb||r.jan||0;
    var tier = getTierLocal(acc);
    return '<div class="compare-col-header" style="background:'+tierColors[i]+'14;border-top-color:'+tierColors[i]+'">'
      + '<div class="compare-col-name">'+r.name+'</div>'
      + '<div class="compare-col-tier" style="color:'+tier.color+'">'+tier.label+' · PM: '+(r.pm||'—')+'</div>'
      + '</div>';
  }).join('');

  // Key metrics grid
  var metricHtml = '';
  var metricKeys = [
    { label:'Latest Accuracy', fn:function(r){ var v=r.apr||r.mar||r.feb||r.jan||0; return {val:v+'%',color:getTierLocal(v).color}; } },
    { label:'Total Audits',    fn:function(r){ return {val:r.audits.toLocaleString(),color:'var(--text-primary)'}; } },
    { label:'Total Errors',    fn:function(r){ return {val:r.errors,color:r.errors>20?'#C54E4B':r.errors>10?'#FF8300':'#01A982'}; } },
    { label:'Error Rate',      fn:function(r){ var er=(r.audits>0?(r.errors/r.audits*100).toFixed(2):0); return {val:er+'%',color:parseFloat(er)>5?'#C54E4B':parseFloat(er)>2?'#FF8300':'#01A982'}; } }
  ];
  metricHtml += '<div style="display:grid;grid-template-columns:repeat('+n+',1fr);gap:10px;margin-bottom:4px">';
  metricKeys.forEach(function(mk) {
    recs.forEach(function(r) {
      var mv = mk.fn(r);
      metricHtml += '<div class="compare-metric-card">'
        + '<div class="compare-metric-label">'+mk.label+'</div>'
        + '<div class="compare-metric-value" style="color:'+mv.color+'">'+mv.val+'</div>'
        + '</div>';
    });
  });
  metricHtml += '</div>';

  // Monthly accuracy breakdown (grid: months × recruiters)
  var months = ['Jan','Feb','Mar','Apr'];
  var monthlyHtml = '<div style="display:grid;grid-template-columns:60px repeat('+n+',1fr);gap:6px;margin-bottom:4px">'
    + '<div></div>'
    + recs.map(function(r,i){ return '<div style="text-align:center;font-size:11px;font-weight:700;color:'+tierColors[i]+'">'+r.name.split(' ')[0]+'</div>'; }).join('')
    + '</div>';
  months.forEach(function(m) {
    monthlyHtml += '<div style="display:grid;grid-template-columns:60px repeat('+n+',1fr);gap:6px;margin-bottom:6px">'
      + '<div style="font-size:11px;font-weight:700;color:var(--text-muted);padding:8px 0;text-align:right;padding-right:10px">'+m+'</div>'
      + recs.map(function(r) {
          var val = r[m.toLowerCase()];
          if (val === null) return '<div class="compare-month-cell"><div class="compare-month-val" style="color:var(--text-muted);font-size:12px">N/A</div></div>';
          var tier = getTierLocal(val);
          return '<div class="compare-month-cell">'
            + '<div class="compare-month-val" style="color:'+tier.color+'">'+val+'%</div>'
            + '<div class="compare-month-label">'+tier.label+'</div>'
            + '</div>';
        }).join('')
      + '</div>';
  });

  // Trend chart canvas
  var chartId = 'compareLineChart_' + Date.now();

  // Parameter failures — show top 5 params with failures per recruiter
  var paramHtml = '';
  var topParams = DASHBOARD_DATA.top_errors.slice(0, 6);
  paramHtml += '<div style="display:grid;grid-template-columns:auto repeat('+n+',1fr);gap:6px">';
  paramHtml += '<div style="font-size:10px;font-weight:700;color:var(--text-muted)">Parameter</div>';
  recs.forEach(function(r,i) {
    paramHtml += '<div style="font-size:10px;font-weight:700;color:'+tierColors[i]+';text-align:center">'+r.name.split(' ')[0]+'</div>';
  });
  topParams.forEach(function(p) {
    paramHtml += '<div style="font-size:11px;color:var(--text-secondary);padding:4px 0;border-top:1px solid var(--border)">'+p.Parameter+'</div>';
    recs.forEach(function(r) {
      // Use recruiter error heatmap data if available, else show overall fail pct
      var heatKey = p.Parameter;
      var heatMap = PERF_DATA.error_heatmap || {};
      var recRow = heatMap[heatKey];
      var recNames = PERF_DATA.recruiter_monthly.map(function(x){ return x.name; });
      var rIdx = recNames.indexOf(r.name);
      var heatVal = (recRow && rIdx >= 0) ? recRow[rIdx] : null;
      var disp = (heatVal !== null && heatVal !== undefined && heatVal > 0) ? heatVal.toFixed(2)+'%' : p.Fail_Pct+'%';
      var col = p.Fail_Pct >= 5 ? '#C54E4B' : p.Fail_Pct >= 2 ? '#FF8300' : '#01A982';
      paramHtml += '<div style="text-align:center;font-size:12px;font-weight:700;color:'+col+';padding:4px 0;border-top:1px solid var(--border)">'+disp+'</div>';
    });
  });
  paramHtml += '</div>';

  body.innerHTML = ''
    + '<div style="margin-bottom:16px">'
    + '<div style="display:grid;grid-template-columns:repeat('+n+',1fr);gap:12px">'
    + colHeadersHtml
    + '</div>'
    + '</div>'

    + '<div class="compare-section-title"><i class="fas fa-chart-bar" style="margin-right:6px"></i>Key Performance Metrics</div>'
    + metricHtml

    + '<div class="compare-section-title"><i class="fas fa-calendar-alt" style="margin-right:6px"></i>Monthly Accuracy (Jan–Apr)</div>'
    + monthlyHtml

    + '<div class="compare-section-title"><i class="fas fa-chart-line" style="margin-right:6px"></i>Accuracy Trend Chart</div>'
    + '<div class="compare-chart-wrap"><canvas id="'+chartId+'"></canvas></div>'

    + '<div class="compare-section-title"><i class="fas fa-exclamation-circle" style="margin-right:6px"></i>Parameter Error Rates</div>'
    + paramHtml

    + '<div style="margin-top:20px;text-align:right">'
    + '<button onclick="closeCompareModal()" style="padding:10px 20px;border-radius:8px;border:1.5px solid var(--border);background:transparent;color:var(--text-secondary);font-size:13px;font-weight:600;cursor:pointer">Close</button>'
    + '</div>';

  // Build Chart.js trend line
  setTimeout(function() {
    var canvas = document.getElementById(chartId);
    if (!canvas) return;
    var monthLabels = ['Jan','Feb','Mar','Apr'];
    var datasets = recs.map(function(r, i) {
      var data = [r.jan, r.feb, r.mar, r.apr].map(function(v){ return v === null ? null : v; });
      return {
        label: r.name,
        data: data,
        borderColor: tierColors[i],
        backgroundColor: tierColors[i] + '22',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: tierColors[i],
        tension: 0.35,
        spanGaps: true
      };
    });
    var isDark = document.documentElement.classList.contains('dark');
    var gridCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    var tickCol  = isDark ? '#a8b8c8' : '#666';
    _compareCharts[chartId] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels: monthLabels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position:'top', labels:{ font:{size:11}, boxWidth:12, color: tickCol } } },
        scales: {
          y: { min:84, max:100,
            ticks:{ callback:function(v){ return v+'%'; }, font:{size:10}, color:tickCol },
            grid:{ color:gridCol } },
          x: { ticks:{ font:{size:10}, color:tickCol }, grid:{ color:gridCol } }
        }
      }
    });
  }, 120);
}

// ==================== GLOSSARY TAB JS ====================
function filterGlossary(q) {
  var lower = (q||'').trim().toLowerCase();
  var cards = document.querySelectorAll('.glossary-card');
  var anyVisible = false;
  cards.forEach(function(card) {
    var terms   = (card.getAttribute('data-terms')||'').toLowerCase();
    var termEl  = card.querySelector('.gc-term');
    var defEl   = card.querySelector('.gc-definition');
    var text    = terms + ' ' + (termEl ? termEl.textContent : '') + ' ' + (defEl ? defEl.textContent : '');
    var show    = !lower || text.toLowerCase().indexOf(lower) !== -1;
    card.classList.toggle('glossary-hidden', !show);
    if (show) anyVisible = true;
  });
  var noRes = document.getElementById('glossaryNoResults');
  if (noRes) noRes.style.display = anyVisible ? 'none' : 'block';
  // Hide section wrappers that have no visible cards when filtering
  document.querySelectorAll('.glossary-section').forEach(function(sec) {
    var visCount = sec.querySelectorAll('.glossary-card:not(.glossary-hidden)').length;
    sec.style.display = (lower && visCount === 0) ? 'none' : '';
  });
}

function filterGlossaryCategory(cat, btn) {
  // Clear text search
  var inp = document.getElementById('glossarySearchInput');
  if (inp) inp.value = '';
  // Toggle active button
  document.querySelectorAll('.glossary-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var cards = document.querySelectorAll('.glossary-card');
  cards.forEach(function(card) {
    if (cat === 'all') {
      card.classList.remove('glossary-hidden');
      return;
    }
    if (cat === 'formula') {
      var hasFormula = !!card.querySelector('.gc-formula');
      card.classList.toggle('glossary-hidden', !hasFormula);
      return;
    }
    card.classList.toggle('glossary-hidden', card.getAttribute('data-category') !== cat);
  });
  // Show/hide section wrappers
  document.querySelectorAll('.glossary-section').forEach(function(sec) {
    var visCount = sec.querySelectorAll('.glossary-card:not(.glossary-hidden)').length;
    sec.style.display = visCount > 0 ? '' : 'none';
  });
  var noRes = document.getElementById('glossaryNoResults');
  if (noRes) noRes.style.display = 'none';
}

function scrollToGlossarySection(sectionId) {
  // Ensure we are on the glossary tab first
  var tab = document.getElementById('tab-glossary');
  if (tab && !tab.classList.contains('active')) {
    var navBtn = document.querySelector('.nav-tab[onclick*="glossary"]');
    if (navBtn) switchTab('glossary', navBtn);
  }
  // Then scroll after a small paint delay
  setTimeout(function() {
    var el = document.getElementById(sectionId);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, 120);
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
  // ── Restore saved dark-mode preference ──────────────────────────
  try {
    var saved = localStorage.getItem('hpe_dark_mode');
    if (saved === '1') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}

  // ── Apply Chart.js colour defaults for active theme ─────────────
  var _initDark = document.documentElement.classList.contains('dark');
  _redrawChartsForTheme(_initDark);

  // Small delay so browser paints the page before Chart.js measures canvas sizes
  setTimeout(function() {
    _execDone = true;
    initExecutiveCharts();
  }, 100);
  refreshDashboard();
  // Pre-populate CAPA table with seed data so it shows on first load
  buildCAPATable('all');
  recomputeCAPAKPIs(DASHBOARD_DATA.capa_data);
  rebuildCAPAAIInsights(DASHBOARD_DATA.capa_data);
  // Charts for other tabs rendered when tab is first activated (need canvas visible)
});

// ==================== SLA PERFORMANCE DASHBOARD ====================

// ---- Sub-navigation ----
function showSLAPanel(panelId, btn) {
  document.querySelectorAll('.sla-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sla-sub-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  // Lazy-init charts for this panel (150ms lets the panel become visible first)
  setTimeout(function() {
    if (panelId === 'sla-exec')      initSLAExecCharts();
    if (panelId === 'sla-monthly')   initSLAMonthlyCharts();
    if (panelId === 'sla-fy')        initSLAFYCharts();
    if (panelId === 'sla-metnotmet') initSLAMetNotMetCharts();
    if (panelId === 'sla-reporting') initSLAReportingChart();
    if (panelId === 'sla-trends')    initSLATrendCharts();
    // Reflow all registered SLA charts in case canvas was resized
    reflowCharts(['slaOverallTrendChart','slaStatusDonut','slaMonthlyBarChart','slaMonthlyComplianceChart',
                  'slaFYCompareChart','slaFYTrendChart','slaMetByMetricChart','slaFailShareChart',
                  'slaReportingChart','slaPerMetricTrendChart','slaQuarterlyChart']);
  }, 150);
}

// ---- Master SLA Data Store ----
const SLA_DATA = {
  metrics: [
    'Time to Fill Technical',
    'Time to Fill Enterprise',
    '% Aged Technical',
    '% Aged Enterprise',
    'Avg Reqs Vol Technical',
    'Avg Reqs Vol Enterprise',
    'Internal Hiring Technical',
    'Internal Hiring Enterprise',
    '% Agency Util Technical',
    '% Agency Util Enterprise'
  ],
  metricsShort: [
    'TTF Tech','TTF Ent','%Aged Tech','%Aged Ent',
    'AvgReq Tech','AvgReq Ent','Int Hire Tech','Int Hire Ent',
    'Agency Tech','Agency Ent'
  ],
  months: ['Apr-24','May-24','Jun-24','Jul-24','Aug-24','Sep-24',
           'Oct-24','Nov-24','Dec-24','Jan-25','Feb-25','Mar-25',
           'Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25',
           'Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Apr-26'],
  // Monthly totals [Met, NotMet, NR, NA] per month
  monthly: [
    [7,3,0,0],[8,2,0,0],[6,4,0,0],[8,2,0,0],[9,1,0,0],[8,2,0,0],
    [7,3,0,0],[7,3,0,0],[7,3,0,0],[7,3,0,0],[8,2,0,0],[9,1,0,0],
    [0,0,10,0],[8,2,0,0],[8,2,0,0],[8,2,0,0],[10,0,0,0],[10,0,0,0],
    [8,2,0,0],[10,0,0,0],[9,1,0,0],[8,2,0,0],[6,4,0,0],[8,2,0,0]
  ],
  // Per-metric [met, notMet, nr] across all 24 months
  metricStats: [
    {met:17,notMet:6,nr:1},  // TTF Tech
    {met:11,notMet:12,nr:1}, // TTF Ent
    {met:17,notMet:6,nr:1},  // %Aged Tech
    {met:14,notMet:9,nr:1},  // %Aged Ent
    {met:18,notMet:5,nr:1},  // AvgReq Tech
    {met:18,notMet:5,nr:1},  // AvgReq Ent
    {met:18,notMet:5,nr:1},  // Int Hire Tech
    {met:21,notMet:2,nr:1},  // Int Hire Ent
    {met:23,notMet:0,nr:1},  // Agency Tech
    {met:23,notMet:0,nr:1}   // Agency Ent
  ],
  // Per-metric per-month status: 'MET','NOT_MET','NR','NA'
  perMetricMonthly: [
    // TTF Technical
    ['MET','MET','NOT_MET','MET','MET','MET','NOT_MET','NOT_MET','NOT_MET','NOT_MET','MET','MET','NR','MET','MET','MET','MET','MET','NOT_MET','MET','MET','MET','NOT_MET','MET'],
    // TTF Enterprise
    ['NOT_MET','MET','NOT_MET','NOT_MET','MET','NOT_MET','NOT_MET','NOT_MET','NOT_MET','NOT_MET','MET','MET','NR','MET','NOT_MET','NOT_MET','MET','MET','NOT_MET','MET','MET','NOT_MET','NOT_MET','NOT_MET'],
    // % Aged Technical
    ['MET','MET','NOT_MET','MET','MET','MET','NOT_MET','NOT_MET','MET','NOT_MET','MET','MET','NR','MET','MET','MET','MET','MET','MET','MET','MET','MET','NOT_MET','NOT_MET'],
    // % Aged Enterprise
    ['MET','MET','NOT_MET','MET','MET','NOT_MET','MET','NOT_MET','NOT_MET','NOT_MET','NOT_MET','MET','NR','MET','MET','MET','MET','MET','NOT_MET','MET','MET','MET','NOT_MET','MET'],
    // Avg Reqs Vol Technical
    ['MET','MET','MET','MET','MET','MET','MET','MET','NOT_MET','NOT_MET','MET','MET','NR','NOT_MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET'],
    // Avg Reqs Vol Enterprise
    ['MET','MET','MET','MET','MET','MET','NOT_MET','MET','MET','MET','MET','MET','NR','MET','MET','MET','MET','MET','MET','MET','NOT_MET','MET','NOT_MET','MET'],
    // Internal Hiring Technical
    ['MET','MET','NOT_MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','NR','NOT_MET','MET','MET','MET','MET','MET','MET','MET','NOT_MET','MET','MET'],
    // Internal Hiring Enterprise
    ['MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','NR','MET','MET','MET','MET','MET','MET','MET','MET','MET','NOT_MET','MET'],
    // % Agency Util Technical
    ['MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','NR','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET'],
    // % Agency Util Enterprise
    ['MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','NR','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET','MET']
  ],
  // FY summaries — HPE FY = Nov to Oct
  // FY25 full:    Nov-24 → Oct-25 (12 months, indices 7-18, incl Apr-25 NR)
  // FY26 partial: Nov-25 → Apr-26 (5 months, indices 19-23, YTD)
  fy: {
    'FY24': { label:'FY24 (partial)', period:'Apr-24 \u2013 Oct-24', months:7, totalSLA:70, met:53, notMet:17, nr:0, compliance:75.7, idxStart:0,  idxEnd:7  },
    'FY25': { label:'FY25 (full)',    period:'Nov-24 \u2013 Oct-25', months:12, totalSLA:110, met:90, notMet:20, nr:10, compliance:81.8, idxStart:7, idxEnd:19 },
    'FY26': { label:'FY26 (YTD)',     period:'Nov-25 \u2013 Apr-26', months:5,  totalSLA:50,  met:41, notMet:9,  nr:0,  compliance:82.0, idxStart:19, idxEnd:24 }
  },
  region: 'South 1',
  practiceHead: 'Mahak',
  category: 'Category B Contractual SLA'
};

// Helper: compliance % for a month index
function slaMonthCompliance(i) {
  const [met,nm,nr] = SLA_DATA.monthly[i];
  const reported = met + nm;
  return reported === 0 ? 0 : Math.round(met / reported * 100);
}

// Helper: destroy chart safely
function slaDestroyChart(id) {
  const c = Chart.getChart(id);
  if (c) c.destroy();
}

// Helper: colour ramp
function slaComplianceColor(pct) {
  if (pct >= 90) return '#01a982';
  if (pct >= 75) return '#f7b731';
  return '#e74c3c';
}

// ---- EXECUTIVE SUMMARY CHARTS ----
let _slaExecDone = false;
function initSLAExecCharts() {
  if (_slaExecDone) return;
  _slaExecDone = true;

  // KPI banner
  const totalMet = SLA_DATA.monthly.reduce((a,m)=>a+m[0],0);
  const totalNM  = SLA_DATA.monthly.reduce((a,m)=>a+m[1],0);
  const totalNR  = SLA_DATA.monthly.reduce((a,m)=>a+m[2],0);
  const totalAll = totalMet + totalNM + totalNR;
  const overallPct = Math.round(totalMet/(totalMet+totalNM)*100);

  const setEl = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  setEl('slaKpiCompliance', overallPct+'%');
  setEl('slaKpiTotalMet', totalMet);
  setEl('slaKpiTotalNM',  totalNM);
  setEl('slaKpiTotalNR',  totalNR);

  // Health banner
  const banner = document.getElementById('slaHealthBanner');
  if (banner) {
    if (overallPct >= 85) {
      banner.className = 'sla-health-banner sla-health-good';
      banner.innerHTML = '<i class="fas fa-check-circle"></i> <strong>HEALTHY</strong> — Overall SLA compliance at '+overallPct+'% exceeds 85% benchmark. Strong performance in Agency Utilisation (100%) and Internal Hiring Enterprise (91%).';
    } else if (overallPct >= 70) {
      banner.className = 'sla-health-banner sla-health-warn';
      banner.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>MODERATE RISK</strong> — Compliance at '+overallPct+'%. Time to Fill Enterprise (48%) requires immediate intervention.';
    } else {
      banner.className = 'sla-health-banner sla-health-crit';
      banner.innerHTML = '<i class="fas fa-times-circle"></i> <strong>CRITICAL</strong> — Compliance at '+overallPct+'%. Immediate escalation required.';
    }
  }

  // Best / Worst metric tables
  const metricRates = SLA_DATA.metricStats.map((s,i)=>({
    name: SLA_DATA.metrics[i],
    pct: Math.round(s.met/(s.met+s.notMet)*100),
    met: s.met, nm: s.notMet
  }));
  const sorted = [...metricRates].sort((a,b)=>b.pct-a.pct);

  const bestBody = document.getElementById('slaBestBody');
  if (bestBody) {
    bestBody.innerHTML = sorted.slice(0,5).map(m=>'<tr><td>'+m.name+'</td><td><span style="color:#01a982;font-weight:600">'+m.pct+'%</span></td><td>'+m.met+' / '+(m.met+m.nm)+'</td><td><span class="sla-badge sla-badge-met">Excellent</span></td></tr>').join('');
  }
  const worstBody = document.getElementById('slaWorstBody');
  if (worstBody) {
    worstBody.innerHTML = sorted.slice(-3).reverse().map(m=>'<tr><td>'+m.name+'</td><td><span style="color:#e74c3c;font-weight:600">'+m.pct+'%</span></td><td>'+m.met+' / '+(m.met+m.nm)+'</td><td><span class="sla-badge sla-badge-nm">Needs Focus</span></td></tr>').join('');
  }

  // Overall Trend Line (24 months compliance %)
  slaDestroyChart('slaOverallTrendChart');
  new Chart(document.getElementById('slaOverallTrendChart'), {
    type: 'line',
    data: {
      labels: SLA_DATA.months,
      datasets: [{
        label: 'Monthly Compliance %',
        data: SLA_DATA.months.map((_,i)=>slaMonthCompliance(i)),
        borderColor: '#01a982',
        backgroundColor: 'rgba(1,169,130,0.12)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: SLA_DATA.months.map((_,i)=>slaComplianceColor(slaMonthCompliance(i))),
        fill: true,
        tension: 0.35
      },{
        label: '85% Target',
        data: new Array(24).fill(85),
        borderColor: '#f7b731',
        borderDash: [6,3],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom'}, tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y+'%'}} },
      scales:{ y:{min:0,max:100,ticks:{callback:v=>v+'%'}} }
    }
  });

  // Status Donut
  slaDestroyChart('slaStatusDonut');
  new Chart(document.getElementById('slaStatusDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Met','Not Met','Not Reported'],
      datasets:[{ data:[totalMet,totalNM,totalNR],
        backgroundColor:['#01a982','#e74c3c','#95a5a6'],
        borderWidth:2, borderColor:'#fff' }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      cutout:'68%',
      plugins:{
        legend:{position:'bottom'},
        tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed+' ('+Math.round(ctx.parsed/totalAll*100)+'%)'}}
      }
    }
  });
}

// ---- MONTHLY ANALYSIS CHARTS ----
let _slaMonthlyDone = false;
function initSLAMonthlyCharts() {
  if (_slaMonthlyDone) return;
  _slaMonthlyDone = true;

  const months = SLA_DATA.months;
  const metArr  = SLA_DATA.monthly.map(m=>m[0]);
  const nmArr   = SLA_DATA.monthly.map(m=>m[1]);
  const nrArr   = SLA_DATA.monthly.map(m=>m[2]);
  const compArr = months.map((_,i)=>slaMonthCompliance(i));

  // Stacked Bar
  slaDestroyChart('slaMonthlyBarChart');
  new Chart(document.getElementById('slaMonthlyBarChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets:[
        { label:'Met',         data:metArr, backgroundColor:'rgba(1,169,130,0.82)', stack:'s' },
        { label:'Not Met',     data:nmArr,  backgroundColor:'rgba(231,76,60,0.82)',  stack:'s' },
        { label:'Not Reported',data:nrArr,  backgroundColor:'rgba(149,165,166,0.8)',stack:'s' }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom'} },
      scales:{ x:{stacked:true}, y:{stacked:true,max:12,ticks:{stepSize:2}} }
    }
  });

  // Compliance Line
  slaDestroyChart('slaMonthlyComplianceChart');
  new Chart(document.getElementById('slaMonthlyComplianceChart'), {
    type: 'line',
    data: {
      labels: months,
      datasets:[{
        label:'Compliance %',
        data: compArr,
        borderColor:'#6c5ce7',
        backgroundColor:'rgba(108,92,231,0.1)',
        borderWidth:2.5, pointRadius:5,
        pointBackgroundColor: compArr.map(v=>slaComplianceColor(v)),
        fill:true, tension:0.35
      },{
        label:'85% Target',
        data:new Array(24).fill(85),
        borderColor:'#f7b731', borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom'} },
      scales:{ y:{min:0,max:100,ticks:{callback:v=>v+'%'}} }
    }
  });

  // Heatmap
  const hm = document.getElementById('slaHeatmapContainer');
  if (hm) {
    const header = '<div class="sla-heatmap-grid"><div class="sla-hm-corner">Metric \\ Month</div>'
      + months.map(m=>'<div class="sla-hm-month">'+m+'</div>').join('') + '</div>';
    const rows = SLA_DATA.metrics.map((metric,mi)=>{
      const cells = SLA_DATA.perMetricMonthly[mi].map(status=>{
        const cls = status==='MET'?'sla-hm-met':status==='NOT_MET'?'sla-hm-nm':status==='NR'?'sla-hm-nr':'sla-hm-na';
        const icon = status==='MET'?'✓':status==='NOT_MET'?'✗':status==='NR'?'NR':'NA';
        return '<div class="'+cls+'" title="'+metric+': '+status+'">'+icon+'</div>';
      }).join('');
      return '<div class="sla-heatmap-grid"><div class="sla-hm-label">'+SLA_DATA.metricsShort[mi]+'</div>'+cells+'</div>';
    }).join('');
    hm.innerHTML = '<div class="sla-heatmap-wrap">'+header+rows+'</div>'
      +'<div class="sla-hm-legend">'
      +'<span class="sla-hm-met">✓ Met</span>'
      +'<span class="sla-hm-nm">✗ Not Met</span>'
      +'<span class="sla-hm-nr">NR Not Reported</span>'
      +'</div>';
  }

  // Monthly Table
  const tbody = document.getElementById('slaMonthlyTableBody');
  if (tbody) {
    tbody.innerHTML = months.map((m,i)=>{
      const [met,nm,nr] = SLA_DATA.monthly[i];
      const reported = met+nm;
      const comp = reported===0?'—':slaMonthCompliance(i)+'%';
      const compClass = reported===0?'':'';
      const highlight = nr>0 ? ' style="background:#fff3f3"' : (met===10?' style="background:#f0fff4"':'');
      const statusBadge = reported===0?'<span class="sla-badge sla-badge-nr">BLACKOUT</span>':comp==='100%'?'<span style="color:#01a982;font-weight:700">'+comp+'</span>':comp;
      const remarkBadge = nr>0?'<span class="sla-badge sla-badge-nr">Data Gap</span>':met===10?'<span class="sla-badge sla-badge-met">Perfect</span>':nm===0?'<span class="sla-badge sla-badge-met">Full Met</span>':nm>=4?'<span class="sla-badge sla-badge-nm">High Risk</span>':'<span class="sla-badge" style="background:#fff3cd;color:#856404">Partial</span>';
      return '<tr'+highlight+'><td><strong>'+m+'</strong></td><td>'+(reported+nr)+'</td><td><span style="color:#01a982;font-weight:600">'+met+'</span></td><td><span style="color:#e74c3c;font-weight:600">'+nm+'</span></td><td><span style="color:#95a5a6">'+nr+'</span></td><td>'+statusBadge+'</td><td>'+remarkBadge+'</td></tr>';
    }).join('');
  }
}

// ---- FY WISE ANALYSIS CHARTS ----
let _slaFYDone = false;
function initSLAFYCharts() {
  if (_slaFYDone) return;
  _slaFYDone = true;

  // HPE FY = Nov to Oct
  // FY25 full:    indices 7-18  (Nov-24 to Oct-25, 12 months)
  // FY26 partial: indices 19-23 (Nov-25 to Apr-26, 5 months YTD)
  const fySlice = (start, end) => (mi) => {
    const slice = SLA_DATA.perMetricMonthly[mi].slice(start, end);
    const met = slice.filter(s=>s==='MET').length;
    const nm  = slice.filter(s=>s==='NOT_MET').length;
    return met+nm>0 ? Math.round(met/(met+nm)*100) : 0;
  };
  const fy25  = SLA_DATA.metrics.map((_,mi)=>fySlice(7,19)(mi));
  const fy26  = SLA_DATA.metrics.map((_,mi)=>fySlice(19,24)(mi));

  // ---- 2-FY Grouped Bar (FY25 full | FY26 YTD) ----
  slaDestroyChart('slaFYCompareChart');
  new Chart(document.getElementById('slaFYCompareChart'), {
    type:'bar',
    data:{
      labels: SLA_DATA.metricsShort,
      datasets:[
        { label:'FY25 (Nov-24 \u2013 Oct-25, Full Year)',  data:fy25, backgroundColor:'rgba(52,152,219,0.8)',   borderRadius:4 },
        { label:'FY26 (Nov-25 \u2013 Apr-26, YTD)',        data:fy26, backgroundColor:'rgba(1,169,130,0.85)',  borderRadius:4 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}} },
      scales:{ y:{min:0,max:100,ticks:{callback:v=>v+'%'},title:{display:true,text:'Compliance %'}} }
    }
  });

  // ---- FY trend lines (monthly compliance within each FY, aligned by FY month position) ----
  // FY25 full: 12 months (Nov-24 to Oct-25)
  const fy25Labels = SLA_DATA.months.slice(7,19);
  const fy25Comp   = fy25Labels.map((_,i)=>slaMonthCompliance(i+7));
  // FY26 partial: 5 months (Nov-25 to Apr-26)
  const fy26Labels = SLA_DATA.months.slice(19,24);
  const fy26Comp   = fy26Labels.map((_,i)=>slaMonthCompliance(i+19));

  // Use unified month position labels (M1..M12); shorter FYs leave trailing nulls
  const maxLen = 12;
  const padNull = (arr, len) => arr.concat(new Array(len - arr.length).fill(null));

  slaDestroyChart('slaFYTrendChart');
  new Chart(document.getElementById('slaFYTrendChart'), {
    type:'line',
    data:{
      labels: ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'],
      datasets:[

        { label:'FY25 (Nov-24\u2013Oct-25)', data:padNull(fy25Comp,maxLen),  borderColor:'#3498db', backgroundColor:'rgba(52,152,219,0.08)',   borderWidth:2.5, tension:0.35, pointRadius:4, spanGaps:false, fill:true },
        { label:'FY26 YTD (Nov-25\u2013)',   data:padNull(fy26Comp,maxLen),  borderColor:'#01a982', backgroundColor:'rgba(1,169,130,0.10)',    borderWidth:2.5, tension:0.35, pointRadius:5, spanGaps:false, fill:true },
        { label:'85% Target', data:new Array(maxLen).fill(85), borderColor:'#f7b731', borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}},
        tooltip:{callbacks:{
          title: items => 'Month '+items[0].label,
          label: ctx => {
            if (ctx.parsed.y === null) return null;
            const fyMonths = [fy25Labels, fy26Labels, []];
            const lbl = fyMonths[ctx.datasetIndex] ? (fyMonths[ctx.datasetIndex][ctx.dataIndex] || '') : '';
            return ctx.dataset.label+': '+ctx.parsed.y+'%'+(lbl?' ('+lbl+')':'');
          }
        }}
      },
      scales:{ y:{min:0,max:100,ticks:{callback:v=>v+'%'}} }
    }
  });

  // ---- Improvement / Risk tables: FY25 vs FY26 ----
  const impBody = document.getElementById('slaFYImprovementBody');
  if (impBody) {
    const pairs = SLA_DATA.metrics.map((n,i)=>({
      name:n, fy25:fy25[i], fy26:fy26[i], d2526: fy26[i]-fy25[i]
    }));
    pairs.sort((a,b)=>b.d2526-a.d2526);
    impBody.innerHTML = pairs.map(p=>{
      const arr26 = p.d2526>0?'<span style="color:#01a982;font-weight:700">\u25b2+'+p.d2526+'%</span>':p.d2526===0?'<span style="color:#aaa">\u2014</span>':'<span style="color:#e74c3c">\u25bc'+Math.abs(p.d2526)+'%</span>';
      return '<tr><td>'+p.name+'</td><td>'+p.fy25+'%</td><td>'+p.fy26+'%</td><td>'+arr26+'</td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:#aaa">No data available</td></tr>';
  }
  const riskBody = document.getElementById('slaFYRiskBody');
  if (riskBody) {
    const pairs = SLA_DATA.metrics.map((n,i)=>({
      name:n, fy25:fy25[i], fy26:fy26[i], d2526: fy26[i]-fy25[i]
    }));
    const at_risk = pairs.filter(p=>p.fy25<80||p.fy26<80).sort((a,b)=>Math.min(a.fy25,a.fy26)-Math.min(b.fy25,b.fy26));
    riskBody.innerHTML = at_risk.map(p=>{
      const risk25 = p.fy25<60?'<span style="color:#e74c3c;font-weight:700">'+p.fy25+'%</span>':p.fy25<80?'<span style="color:#f7b731;font-weight:700">'+p.fy25+'%</span>':'<span style="color:#01a982">'+p.fy25+'%</span>';
      const risk26 = p.fy26<60?'<span style="color:#e74c3c;font-weight:700">'+p.fy26+'%</span>':p.fy26<80?'<span style="color:#f7b731;font-weight:700">'+p.fy26+'%</span>':'<span style="color:#01a982">'+p.fy26+'%</span>';
      return '<tr><td>'+p.name+'</td><td>'+risk25+'</td><td>'+risk26+'</td></tr>';
    }).join('') || '<tr><td colspan="3" style="color:#aaa">All metrics above threshold</td></tr>';
  }
}

// ---- MET vs NOT MET CHARTS ----
let _slaMetDone = false;
function initSLAMetNotMetCharts() {
  if (_slaMetDone) return;
  _slaMetDone = true;

  const totalMet = SLA_DATA.metricStats.reduce((a,s)=>a+s.met,0);
  const totalNM  = SLA_DATA.metricStats.reduce((a,s)=>a+s.notMet,0);
  const totalNR  = SLA_DATA.metricStats.reduce((a,s)=>a+s.nr,0);
  const setEl=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  setEl('slaMetKpiMet', totalMet);
  setEl('slaMetKpiNM',  totalNM);
  setEl('slaMetKpiNR',  totalNR);
  setEl('slaMetKpiRate', Math.round(totalMet/(totalMet+totalNM)*100)+'%');

  // Horizontal grouped bar — Met vs NotMet per metric
  slaDestroyChart('slaMetByMetricChart');
  new Chart(document.getElementById('slaMetByMetricChart'), {
    type:'bar',
    data:{
      labels: SLA_DATA.metricsShort,
      datasets:[
        { label:'Met',     data:SLA_DATA.metricStats.map(s=>s.met),     backgroundColor:'rgba(1,169,130,0.8)',  borderRadius:3 },
        { label:'Not Met', data:SLA_DATA.metricStats.map(s=>s.notMet),  backgroundColor:'rgba(231,76,60,0.8)',   borderRadius:3 }
      ]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom'} },
      scales:{ x:{stacked:false, max:25} }
    }
  });

  // Fail-share donut
  slaDestroyChart('slaFailShareChart');
  const failData = SLA_DATA.metricStats.map(s=>s.notMet);
  new Chart(document.getElementById('slaFailShareChart'), {
    type:'doughnut',
    data:{
      labels: SLA_DATA.metricsShort,
      datasets:[{ data:failData,
        backgroundColor:['#e74c3c','#c0392b','#e67e22','#d35400','#f39c12','#f7b731','#3498db','#2980b9','#9b59b6','#8e44ad'],
        borderWidth:2, borderColor:'#fff' }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{ legend:{position:'right',labels:{boxWidth:12,font:{size:11}}},
        tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed+' failures'}} }
    }
  });

  // Metric detail table
  const tbody = document.getElementById('slaMetricDetailBody');
  if (tbody) {
    tbody.innerHTML = SLA_DATA.metrics.map((m,i)=>{
      const s = SLA_DATA.metricStats[i];
      const pct = Math.round(s.met/(s.met+s.notMet)*100);
      const bar = '<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;background:#f0f0f0;border-radius:4px;height:10px"><div style="width:'+pct+'%;background:'+slaComplianceColor(pct)+';height:10px;border-radius:4px"></div></div><span style="font-size:11px;min-width:32px">'+pct+'%</span></div>';
      const risk = pct>=90?'<span class="sla-badge sla-badge-met">Low</span>':pct>=70?'<span class="sla-badge" style="background:#fff3cd;color:#856404">Medium</span>':'<span class="sla-badge sla-badge-nm">High</span>';
      return '<tr><td>'+m+'</td><td>'+s.met+'</td><td>'+s.notMet+'</td><td>'+s.nr+'</td><td>'+bar+'</td><td>'+risk+'</td></tr>';
    }).join('');
  }

  // Chronic fails panel
  const cfp = document.getElementById('slaChronicFailPanel');
  if (cfp) {
    const chronic = SLA_DATA.metrics.map((n,i)=>({name:n, nm:SLA_DATA.metricStats[i].notMet, pct:Math.round(SLA_DATA.metricStats[i].met/(SLA_DATA.metricStats[i].met+SLA_DATA.metricStats[i].notMet)*100)}))
      .filter(m=>m.nm>=6).sort((a,b)=>b.nm-a.nm);
    cfp.innerHTML = chronic.length ? chronic.map(m=>
      '<div class="sla-chronic-item">'
      +'<div class="sla-chronic-name">'+m.name+'</div>'
      +'<div class="sla-chronic-stat">'+m.nm+' failures — '+m.pct+'% compliance</div>'
      +'<div class="sla-chronic-bar"><div style="width:'+m.pct+'%;background:#e74c3c;height:8px;border-radius:4px"></div></div>'
      +'</div>').join('')
    : '<p style="color:#aaa;font-size:13px">No chronic non-performers identified.</p>';
  }
}

// ---- REPORTING ANALYSIS CHART ----
let _slaRepDone = false;
function initSLAReportingChart() {
  if (_slaRepDone) return;
  _slaRepDone = true;

  // Reporting compliance = months where all 10 metrics were reported
  const reportedArr = SLA_DATA.months.map((_,i)=>{
    const nr = SLA_DATA.monthly[i][2];
    return nr>0 ? Math.round((10-nr)/10*100) : 100;
  });

  slaDestroyChart('slaReportingChart');
  new Chart(document.getElementById('slaReportingChart'), {
    type:'bar',
    data:{
      labels: SLA_DATA.months,
      datasets:[{
        label:'Reporting Compliance %',
        data: reportedArr,
        backgroundColor: reportedArr.map(v=>v<100?'rgba(231,76,60,0.8)':'rgba(1,169,130,0.8)'),
        borderRadius:4
      },{
        label:'100% Target',
        data:new Array(24).fill(100),
        type:'line', borderColor:'#f7b731', borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom'} },
      scales:{ y:{min:0,max:100,ticks:{callback:v=>v+'%'}} }
    }
  });

  // Reporting insight cards
  const insightEl = document.getElementById('slaReportingInsights');
  if (insightEl) {
    const gaps = SLA_DATA.months.filter((_,i)=>SLA_DATA.monthly[i][2]>0);
    const perfectMonths = SLA_DATA.months.filter((_,i)=>SLA_DATA.monthly[i][2]===0).length;
    insightEl.innerHTML = 
      '<div class="sla-insight-card sla-ic-warn">'
      +'<div class="sla-ic-title"><i class="fas fa-exclamation-triangle"></i> Reporting Gap Detected</div>'
      +'<div class="sla-ic-body"><strong>'+gaps.join(', ')+'</strong> \u2014 '+gaps.length+' month(s) with missing data. Apr-25 is a full blackout (10 NR). This represents a significant governance gap requiring immediate root-cause investigation.</div>'
      +'</div>'
      +'<div class="sla-insight-card sla-ic-good">'
      +'<div class="sla-ic-title"><i class="fas fa-check-circle"></i> Reporting Compliance</div>'
      +'<div class="sla-ic-body">Out of '+SLA_DATA.months.length+' months, <strong>'+perfectMonths+' months</strong> achieved 100% reporting compliance ('+Math.round(perfectMonths/SLA_DATA.months.length*100)+'%). Overall reporting rate is strong post Apr-25 blackout.</div>'
      +'</div>'
      +'<div class="sla-insight-card sla-ic-info">'
      +'<div class="sla-ic-title"><i class="fas fa-info-circle"></i> Root Cause Hypothesis</div>'
      +'<div class="sla-ic-body">Apr-25 reporting blackout may be linked to: (1) FY transition period resource constraints, (2) System/process migration, (3) Team restructuring or onboarding delays. Recommend investigating with Practice Head <strong>Mahak</strong> for Region <strong>South 1</strong>.</div>'
      +'</div>';
  }
}

// ---- TREND ANALYSIS CHARTS ----
let _slaTrendDone = false;
function initSLATrendCharts() {
  if (_slaTrendDone) return;
  _slaTrendDone = true;

  const months = SLA_DATA.months;
  const colors = ['#01a982','#e74c3c','#3498db','#f39c12','#9b59b6','#e67e22','#1abc9c','#e91e63','#607d8b','#795548'];

  // Per-metric trend (multi-line) — binary 1=MET, 0=NOT_MET, null=NR
  const datasets = SLA_DATA.metrics.map((m,mi)=>({
    label: SLA_DATA.metricsShort[mi],
    data: SLA_DATA.perMetricMonthly[mi].map(s=>s==='MET'?1:s==='NOT_MET'?0:null),
    borderColor: colors[mi],
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 3,
    spanGaps: true,
    tension: 0.3
  }));

  slaDestroyChart('slaPerMetricTrendChart');
  new Chart(document.getElementById('slaPerMetricTrendChart'), {
    type:'line',
    data:{ labels:months, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}} },
      scales:{ y:{min:-0.1,max:1.2,ticks:{callback:v=>v===1?'Met':v===0?'Not Met':'',stepSize:1}} }
    }
  });

  // Quarterly compliance — HPE FY quarters (Nov-Oct)
  // FY25 Q1-Q4 + FY26 Q1-Q2
  const quarters = [
    { label:'Q1 FY25 (Nov-Jan)',  idx:[7,8,9]    },
    { label:'Q2 FY25 (Feb-Apr)',  idx:[10,11,12] },
    { label:'Q3 FY25 (May-Jul)',  idx:[13,14,15] },
    { label:'Q4 FY25 (Aug-Oct)',  idx:[16,17,18] },
    { label:'Q1 FY26 (Nov-Jan)',  idx:[19,20,21] },
    { label:'Q2 FY26 (Feb-Apr)',  idx:[22,23]    }
  ];
  const qMet = quarters.map(q=>q.idx.reduce((a,i)=>a+SLA_DATA.monthly[i][0],0));
  const qNM  = quarters.map(q=>q.idx.reduce((a,i)=>a+SLA_DATA.monthly[i][1],0));
  const qComp = quarters.map((_,qi)=>{ const t=qMet[qi]+qNM[qi]; return t?Math.round(qMet[qi]/t*100):0; });

  slaDestroyChart('slaQuarterlyChart');
  new Chart(document.getElementById('slaQuarterlyChart'), {
    type:'bar',
    data:{
      labels: quarters.map(q=>q.label),
      datasets:[
        { label:'Met',     data:qMet, backgroundColor:'rgba(1,169,130,0.8)',  borderRadius:4, stack:'s' },
        { label:'Not Met', data:qNM,  backgroundColor:'rgba(231,76,60,0.8)',   borderRadius:4, stack:'s' }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom'},
        tooltip:{callbacks:{afterBody:items=>'Compliance: '+qComp[items[0].dataIndex]+'%'}} },
      scales:{ x:{stacked:true}, y:{stacked:true,max:32,ticks:{stepSize:4}} }
    }
  });

  // Trend classification — FY25 vs FY26 using HPE FY boundaries
  const classEl = document.getElementById('slaTrendClassifications');
  if (classEl) {
    const classify = (mi) => {
      const data = SLA_DATA.perMetricMonthly[mi];
      // FY25 full (idx 7-18), FY26 partial (idx 19-23)
      const fy25d = data.slice(7,19).filter(s=>s!=='NR');
      const fy26d = data.slice(19).filter(s=>s!=='NR');
      const r25 = fy25d.length ? fy25d.filter(s=>s==='MET').length/fy25d.length : 0;
      const r26 = fy26d.length ? fy26d.filter(s=>s==='MET').length/fy26d.length : 0;
      // Use FY25 vs FY26 trend as primary signal
      const d2526 = r26 - r25;
      if (d2526 > 0.1) return 'improving';
      if (d2526 < -0.1) return 'declining';
      return 'stable';
    };
    const groups = { improving:[], stable:[], declining:[] };
    SLA_DATA.metrics.forEach((m,i)=>{ groups[classify(i)].push(m); });
    classEl.innerHTML = 
      '<div class="sla-trend-group sla-tg-improving">'
      +'<div class="sla-tg-title"><i class="fas fa-arrow-trend-up"></i> Improving ('+groups.improving.length+')</div>'
      +(groups.improving.map(m=>'<div class="sla-tg-item">'+m+'</div>').join('') || '<div class="sla-tg-item" style="color:#aaa">None</div>')
      +'</div>'
      +'<div class="sla-trend-group sla-tg-stable">'
      +'<div class="sla-tg-title"><i class="fas fa-minus"></i> Stable ('+groups.stable.length+')</div>'
      +(groups.stable.map(m=>'<div class="sla-tg-item">'+m+'</div>').join('') || '<div class="sla-tg-item" style="color:#aaa">None</div>')
      +'</div>'
      +'<div class="sla-trend-group sla-tg-declining">'
      +'<div class="sla-tg-title"><i class="fas fa-arrow-trend-down"></i> Declining ('+groups.declining.length+')</div>'
      +(groups.declining.map(m=>'<div class="sla-tg-item">'+m+'</div>').join('') || '<div class="sla-tg-item" style="color:#aaa">None</div>')
      +'</div>';
  }

  // Recommendations
  const recEl = document.getElementById('slaRecommendations');
  if (recEl) {
    recEl.innerHTML = 
      '<div class="sla-rec-item sla-rec-critical">'
      +'<div class="sla-rec-priority">P1 \u2014 CRITICAL</div>'
      +'<div class="sla-rec-title"><i class="fas fa-bullseye"></i> Immediate Focus: Time to Fill Enterprise (48% Compliance)</div>'
      +'<div class="sla-rec-body">TTF Enterprise is the worst performing SLA with only 48% compliance. Conduct urgent root-cause analysis. Key actions: (1) Review hiring pipeline bottlenecks in Enterprise segment, (2) Set weekly review cadence with Practice Head Mahak, (3) Implement pre-vetted candidate pools, (4) Target 70% compliance within 2 quarters.</div>'
      +'</div>'
      +'<div class="sla-rec-item sla-rec-high">'
      +'<div class="sla-rec-priority">P2 \u2014 HIGH</div>'
      +'<div class="sla-rec-title"><i class="fas fa-chart-line"></i> Arrest Declining Trend in % Aged Enterprise (61%)</div>'
      +'<div class="sla-rec-body">% Aged Enterprise shows deterioration in recent months (Feb-26: Not Met). Introduce aging position alerts at 30/45-day thresholds. Assign dedicated Enterprise sourcing resources. Consider contractual SLA renegotiation if structural constraints exist.</div>'
      +'</div>'
      +'<div class="sla-rec-item sla-rec-high">'
      +'<div class="sla-rec-priority">P3 \u2014 HIGH</div>'
      +'<div class="sla-rec-title"><i class="fas fa-file-alt"></i> Eliminate Reporting Blackouts</div>'
      +'<div class="sla-rec-body">Apr-25 complete blackout (10/10 NR) represents a serious governance failure. Implement: (1) Automated monthly SLA data collection reminders 5 days before month-end, (2) Practice Head accountability sign-off process, (3) Escalation matrix for non-submissions beyond D+3.</div>'
      +'</div>'
      +'<div class="sla-rec-item sla-rec-medium">'
      +'<div class="sla-rec-priority">P4 \u2014 MEDIUM</div>'
      +'<div class="sla-rec-title"><i class="fas fa-trophy"></i> Sustain High Performers \u2014 Agency Utilisation &amp; Internal Hiring Enterprise</div>'
      +'<div class="sla-rec-body">Agency Utilisation (Tech &amp; Enterprise) achieved 100% compliance \u2014 document best practices and replicate. Internal Hiring Enterprise at 91% is near-excellent. Recognise the team and use as a model for other metrics.</div>'
      +'</div>'
      +'<div class="sla-rec-item sla-rec-medium">'
      +'<div class="sla-rec-priority">P5 \u2014 MEDIUM</div>'
      +'<div class="sla-rec-title"><i class="fas fa-calendar-check"></i> Leverage FY25 Momentum into FY26</div>'
      +'<div class="sla-rec-body">FY25 (Nov-24 to Oct-25) achieved 81.8% compliance on 110 reported instances. FY26 YTD is at 82.0% but Feb-26 regression (60%) is a warning signal. Actions: (1) Protect Aug-Sep-25 and Nov-25 perfect-month benchmarks, (2) Investigate Feb-26 dip urgently, (3) Target 88%+ for FY26 full year (Nov-25 to Oct-26).</div>'
      +'</div>'
      +'<div class="sla-rec-item sla-rec-low">'
      +'<div class="sla-rec-priority">P6 \u2014 STRATEGIC</div>'
      +'<div class="sla-rec-title"><i class="fas fa-cogs"></i> Implement SLA Maturity Framework</div>'
      +'<div class="sla-rec-body">Establish a formal SLA governance framework: (1) Monthly review dashboard shared with leadership, (2) Quarterly business reviews with trend analysis, (3) SLA maturity score card tracking compliance, reporting, improvement velocity, (4) Define SLA Recovery Plan process for metrics falling below 70% for 2+ consecutive months.</div>'
      +'</div>';
  }
}

// Master init — called when SLA tab first opened
let _slaInitDone = false;
function initSLADashboard() {
  if (_slaInitDone) return;
  _slaInitDone = true;
  // Init the active (first) panel — wait 200ms so the SLA tab is fully visible
  setTimeout(function() { initSLAExecCharts(); }, 200);
}
</script>

<!-- ===== THRESHOLD SETTINGS DRAWER ===== -->
<div class="thresh-drawer-overlay" id="threshOverlay" onclick="closeSettingsDrawer()"></div>
<div class="thresh-drawer" id="threshDrawer" role="dialog" aria-label="Alert threshold settings">
  <div class="thresh-drawer-header">
    <div style="display:flex;align-items:center;gap:10px">
      <i class="fas fa-sliders-h" style="color:var(--hpe-green);font-size:18px"></i>
      <span class="thresh-drawer-title">Alert Threshold Configuration</span>
    </div>
    <button class="thresh-drawer-close" onclick="closeSettingsDrawer()" aria-label="Close settings"><i class="fas fa-times"></i></button>
  </div>
  <div class="thresh-drawer-body">
    <p style="font-size:12px;color:var(--text-muted);margin:0 0 18px;line-height:1.6">
      Adjust these thresholds to personalise when Risk &amp; Alerts are triggered.
      Changes take effect immediately — no page reload required.
    </p>

    <!-- Live preview -->
    <div class="thresh-live-preview" id="threshPreview">
      <div class="thresh-preview-title"><i class="fas fa-eye" style="margin-right:5px"></i>Current Active Thresholds</div>
      <div class="thresh-preview-row">
        <span>Minimum Accuracy Threshold</span>
        <span class="thresh-preview-val" id="prev_minAccuracy">95.0%</span>
      </div>
      <div class="thresh-preview-row">
        <span>Max Error Rate (per parameter)</span>
        <span class="thresh-preview-val" id="prev_maxErrorRate">5.0%</span>
      </div>
      <div class="thresh-preview-row">
        <span>Max Consecutive Drops</span>
        <span class="thresh-preview-val" id="prev_maxConsecDrops">2</span>
      </div>
    </div>

    <!-- Slider 1: minAccuracy -->
    <div class="thresh-group">
      <div class="thresh-label">
        <span><i class="fas fa-bullseye" style="color:var(--hpe-green);margin-right:6px"></i>Minimum Accuracy Threshold</span>
        <span class="thresh-value-badge" id="badge_minAccuracy">95.0%</span>
      </div>
      <div class="thresh-desc">Critical: 100% | Non-Critical: 95%. Flag the system when overall accuracy drops below this level.</div>
      <input type="range" class="thresh-slider" id="slider_minAccuracy"
        min="90" max="100" step="0.5" value="95"
        oninput="onThreshSlider('minAccuracy', this.value)" />
      <div class="thresh-range-labels"><span>90%</span><span>100%</span></div>
    </div>

    <!-- Slider 2: maxErrorRate -->
    <div class="thresh-group">
      <div class="thresh-label">
        <span><i class="fas fa-exclamation-triangle" style="color:var(--hpe-orange);margin-right:6px"></i>Max Error Rate (per parameter)</span>
        <span class="thresh-value-badge" id="badge_maxErrorRate">5.0%</span>
      </div>
      <div class="thresh-desc">Critical: 0% | Non-Critical: 5%. Alert when any parameter's error rate exceeds this percentage.</div>
      <input type="range" class="thresh-slider" id="slider_maxErrorRate"
        min="0" max="15" step="0.5" value="5"
        oninput="onThreshSlider('maxErrorRate', this.value)" />
      <div class="thresh-range-labels"><span>0%</span><span>15%</span></div>
    </div>

    <!-- Slider 3: maxConsecDrops -->
    <div class="thresh-group">
      <div class="thresh-label">
        <span><i class="fas fa-chart-line" style="color:var(--hpe-red);margin-right:6px"></i>Max Consecutive Accuracy Drops</span>
        <span class="thresh-value-badge" id="badge_maxConsecDrops">2</span>
      </div>
      <div class="thresh-desc">Alert when a recruiter records this many consecutive monthly accuracy declines. Default: 2</div>
      <input type="range" class="thresh-slider" id="slider_maxConsecDrops"
        min="1" max="5" step="1" value="2"
        oninput="onThreshSlider('maxConsecDrops', this.value)" />
      <div class="thresh-range-labels"><span>1</span><span>5</span></div>
    </div>

    <button class="thresh-apply-btn" onclick="applyThresholds()">
      <i class="fas fa-check-circle" style="margin-right:6px"></i>Apply &amp; Re-render Alerts
    </button>
    <button class="thresh-reset-btn" onclick="resetThresholds()">
      <i class="fas fa-undo" style="margin-right:6px"></i>Reset to Defaults
    </button>

    <div style="margin-top:20px;padding:12px 14px;background:var(--bg);border-radius:8px;border:1px dashed var(--border)">
      <div style="font-size:11px;color:var(--text-muted);line-height:1.6">
        <i class="fas fa-info-circle" style="color:var(--hpe-blue);margin-right:5px"></i>
        Threshold changes update the <strong>Risk Intelligence</strong> panel and <strong>Goal Tracker Alerts</strong> in real time.
        Settings persist for this session. Navigate to the <strong>Performance Intelligence</strong> tab to see results.
      </div>
    </div>
  </div>
</div>

<!-- ===== RECRUITER COMPARISON MODAL ===== -->
<div class="compare-modal-overlay" id="compareModalOverlay">
  <div class="compare-modal" id="compareModal" role="dialog" aria-label="Recruiter Comparison">
    <div class="compare-modal-header">
      <div style="display:flex;align-items:center;gap:10px">
        <i class="fas fa-columns" style="color:var(--hpe-blue);font-size:18px"></i>
        <span class="compare-modal-title">Recruiter Head-to-Head Comparison</span>
      </div>
      <button class="compare-modal-close" onclick="closeCompareModal()" aria-label="Close comparison"><i class="fas fa-times"></i></button>
    </div>
    <div class="compare-modal-body" id="compareModalBody">
      <!-- Populated dynamically by buildCompareModal() -->
    </div>
  </div>
</div>

<!-- Floating Compare Action Bar -->
<button class="compare-fab" id="compareFab" onclick="openCompareModal()">
  <i class="fas fa-columns" style="margin-right:8px"></i>
  <span id="compareFabLabel">Compare Selected (0)</span>
</button>

</body>
</html>`;
}

export default app
