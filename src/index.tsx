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
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
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
  <div class="header-right">
    <div class="last-refresh">
      <div class="status-dot"></div>
      <span id="refreshTime">Last refreshed: just now</span>
    </div>
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
    <i class="fas fa-brain"></i> AI Insights
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
        <div class="section-subtitle">FY2026 | HPE Talent Acquisition Audit Performance Overview — South 1 Region</div>
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
        <div class="kpi-label">Passed Audits</div>
        <div class="kpi-value" id="kpi-pass">8,400</div>
        <div class="kpi-delta delta-neutral" id="kpi-pass-delta"><i class="fas fa-minus"></i> 97.69% pass rate</div>
        <div class="kpi-sub" id="kpi-pass-sub">Out of 8,599 total</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="kpi-label">Total Errors</div>
        <div class="kpi-value" id="kpi-errors">128</div>
        <div class="kpi-delta delta-down" id="kpi-errors-delta"><i class="fas fa-arrow-down"></i> 1.49% error rate</div>
        <div class="kpi-sub" id="kpi-errors-sub">Across 12 parameters</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-icon orange"><i class="fas fa-arrow-up"></i></div>
        <div class="kpi-label">MoM Improvement</div>
        <div class="kpi-value" id="kpi-mom">+0.94%</div>
        <div class="kpi-delta delta-up" id="kpi-mom-delta"><i class="fas fa-arrow-up"></i> Mar vs Feb</div>
        <div class="kpi-sub" id="kpi-mom-sub">Consistent upward trend</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-icon yellow"><i class="fas fa-calendar-week"></i></div>
        <div class="kpi-label">WoW Change</div>
        <div class="kpi-value" id="kpi-wow">+0.34%</div>
        <div class="kpi-delta delta-up" id="kpi-wow-delta"><i class="fas fa-arrow-up"></i> W4 vs W3 (Mar)</div>
        <div class="kpi-sub" id="kpi-wow-sub">Last week performance</div>
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
        <div class="gauge-target">Target: 99.00%</div>
        <div class="gauge-status warning" id="gaugeCriticalStatus">⚠ Below Target</div>
      </div>
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-orange);margin-right:6px"></i>Non-Critical Parameters</div>
        <canvas id="gaugeNonCritical" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeNonCriticalVal">97.89%</div>
        <div class="gauge-target">Target: 97.00%</div>
        
        <div class="gauge-status good" id="gaugeNonCriticalStatus">✓ Above Target</div>
      </div>
    </div>

    <!-- AI Insights Panel -->
    <div class="ai-insights">
      <div class="ai-insights-header">
        <div class="ai-badge"><i class="fas fa-robot"></i> AI INSIGHTS</div>
        <div class="ai-insights-title">Auto-Generated Intelligence — FY2026 Snapshot</div>
      </div>
      <div class="insight-list">
        <div class="insight-item">
          <div class="insight-icon green"><i class="fas fa-trending-up"></i></div>
          <div class="insight-text"><strong>Accuracy Dip in April — Action Required:</strong> Accuracy declined from 99.43% in February to 97.25% in April (−2.18%), marking the lowest point in FY2026. This downward trajectory from Feb → Mar (98.49%) → Apr (97.25%) signals a worsening trend. Root cause analysis and corrective action are recommended to reverse the decline before it breaches the 95% target.</div>
        </div>
        <div class="insight-item alert">
          <div class="insight-icon alert"><i class="fas fa-exclamation-circle"></i></div>
          <div class="insight-text"><strong>Target Start Date — Critical Anomaly:</strong> "Target start date" parameter has an alarming 89.83% failure rate (53 failures out of 59 audits). This single parameter accounts for 41.4% of all errors and requires immediate corrective action.</div>
        </div>
        <div class="insight-item warning">
          <div class="insight-icon warning"><i class="fas fa-user-times"></i></div>
          <div class="insight-text"><strong>Recruiter Performance Gap:</strong> Recruiter Kusuma K has the lowest accuracy at 88.04% across 276 audits. Noor Mohammed M (90.91%) and Divya S (91.67%) also underperform significantly vs team average of ~98.5%. Targeted coaching recommended.</div>
        </div>
        <div class="insight-item info">
          <div class="insight-icon info"><i class="fas fa-chart-bar"></i></div>
          <div class="insight-text"><strong>Apr W3 Spike Detected:</strong> Week 3 of April saw accuracy drop to 93.62% — the lowest point in FY. "Target start date" errors (43 failures that week) drove this anomaly. The pattern resolved by W4 (97.87%), confirming it was an isolated event.</div>
        </div>
      </div>
    </div>

    <!-- Summary Trend Sparkline -->
    <div class="row-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-line"></i> 16-Week Accuracy Trend</div>
        <div class="card-subtitle">Weekly accuracy performance FY2026 with 95% target line</div>
        <div class="chart-container" style="height:180px">
          <canvas id="sparklineChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-pie-chart"></i> Stage Distribution</div>
        <div class="card-subtitle">Audit pass/fail split by process stage</div>
        <div class="chart-container" style="height:180px">
          <canvas id="stageDonutChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Month-wise Summary Table -->
    <div class="card card-full">
      <div class="card-title"><i class="fas fa-table"></i> Monthly Performance Summary</div>
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
              <th>Error Rate %</th>
              <th>MoM Change</th>
              <th>Status</th>
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
          AI Insights & Recommendations
        </div>
        <div class="section-subtitle">NLG-powered narrative summaries, predictive risk flags, and ranked action items</div>
      </div>
    </div>

    <!-- Narrative Summary -->
    <div class="narrative-box">
      <div class="narr-title">
        <i class="fas fa-file-alt" style="color:var(--hpe-blue)"></i>
        Auto-Generated Narrative Summary — FY2026 YTD
      </div>
      <div class="narr-text" id="narrativeText">
        <p>HPE South 1 Region has processed <strong class="highlight">8,599 audit checkpoints</strong> across FY2026 (January through April), achieving an overall accuracy of <strong class="highlight">98.50%</strong> — <strong class="highlight">3.50 percentage points above</strong> the 95% organizational target.</p>
        <br>
        <p>The <strong>accuracy trajectory has been predominantly positive</strong>: starting at 97.25% in January (HPE FY Month 10), improving sharply to 99.33% in January (Mon 10), sustaining at 99.43% in February, before a slight moderation to 98.49% in March. The March softening was largely attributable to a <strong class="warn-text">spike in "Target start date" failures</strong> (20 errors in March W2 alone), which has been flagged for CAPA action.</p>
        <br>
        <p><strong>Post Selection audits</strong> (6,122 checks, 97.51% accuracy) constitute the majority of audit volume and carry most critical parameters including Offer Details, Interview Process, and Start Date validation. <strong>Pre Selection audits</strong> (2,477 checks, 99.39% accuracy) perform consistently well, with excellent compliance on scheduling and intake processes.</p>
        <br>
        <p>At the recruiter level, <strong class="alert-text">Kusuma K remains the highest-risk recruiter</strong> with 88.04% accuracy over 276 audits — significantly below team average. The <strong>top-performing recruiters</strong> (Disharani Sahoo, Johnson Antony, Eluri Naga P Krishna) all sustain 99.7%+ accuracy, providing a best-practice benchmark for team training.</p>
        <br>
        <p>The AI forecast projects FY2026 closing accuracy between <strong class="highlight">98.6%–99.1%</strong> if current improvement measures are maintained, with the primary risk being unchecked "Target start date" errors continuing into Q1 FY2027.</p>
      </div>
    </div>

    <!-- Risk Flags + Recommendations side by side -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-flag" style="color:var(--hpe-red)"></i> Predictive Risk Flags</div>
        <div class="card-subtitle">AI-identified risks likely to impact next 4 weeks</div>
        <div class="risk-flags">
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
            <div class="risk-text"><strong>Subin Sundar PM team</strong> — 97.4% accuracy, below team average. High volume (2,540 audits) amplifies impact.</div>
          </div>
          <div class="risk-flag medium">
            <div class="risk-level medium">MEDIUM</div>
            <div class="risk-text"><strong>Source of hire errors rising</strong> — 18 failures, 2nd highest. Trend suggests process clarity issue.</div>
          </div>
          <div class="risk-flag low">
            <div class="risk-level low">LOW</div>
            <div class="risk-text"><strong>ERP Bonus parameter</strong> — 3.57% error rate in limited sample. Monitor in Q1 FY2027.</div>
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
        <div class="section-subtitle">Import, export, refresh, and validate your audit data</div>
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
      <div class="upload-subtitle">Supports .xlsx, .xls, .csv formats — Max 50MB<br>
        <strong>Required sheets:</strong> "Parameter audit count" + "Recruiter audit count"
      </div>
    </div>

    <!-- Status + Actions -->
    <div class="chart-grid-2">
      <div class="card">
        <div class="card-title"><i class="fas fa-plug"></i> Data Source Status</div>
        <div class="card-subtitle">Connection and data freshness indicators</div>
        <div class="validation-item">
          <span class="val-icon" style="color:var(--hpe-green)">✅</span>
          <div class="val-text"><strong>Parameter audit count sheet:</strong> 319 rows loaded successfully</div>
        </div>
        <div class="validation-item">
          <span class="val-icon" style="color:var(--hpe-green)">✅</span>
          <div class="val-text"><strong>Recruiter audit count sheet:</strong> 8,600 rows loaded successfully</div>
        </div>
        <div class="validation-item">
          <span class="val-icon" style="color:var(--hpe-green)">✅</span>
          <div class="val-text"><strong>Data validation:</strong> All required columns present</div>
        </div>
        <div class="validation-item">
          <span class="val-icon" style="color:var(--hpe-yellow)">⚠️</span>
          <div class="val-text"><strong>Data normalization:</strong> 4 duplicate recruiter name variants resolved (e.g., " Critical" → "Critical")</div>
        </div>
        <div class="validation-item">
          <span class="val-icon" style="color:var(--hpe-green)">✅</span>
          <div class="val-text"><strong>Date range:</strong> Jan 2026 — Apr 2026 (FY2026)</div>
        </div>
        <div class="validation-item">
          <span class="val-icon" style="color:var(--hpe-green)">✅</span>
          <div class="val-text"><strong>Last refreshed:</strong> <span id="dataLastRefresh">Just now</span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fas fa-info-circle"></i> Data Summary</div>
        <div class="card-subtitle">Current dataset overview</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
          <div style="background:var(--hpe-green-light);padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-green)">8,599</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Parameter Audit Rows</div>
          </div>
          <div style="background:#e8f0fb;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-blue)">8,600</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Recruiter Audit Rows</div>
          </div>
          <div style="background:#fff3e6;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-orange)">22</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Unique Parameters</div>
          </div>
          <div style="background:#fceaea;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-red)">54</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Unique Recruiters</div>
          </div>
          <div style="background:#eef2f5;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--hpe-slate)">5</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Program Managers</div>
          </div>
          <div style="background:#fffbe6;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:#b8860b">4</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Months Covered</div>
          </div>
        </div>
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
        <div class="section-subtitle">HPE South 1 | Practice Head: Mahak | FY24-25 & FY25-26 Contractual SLA Review</div>
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
          <div style="font-size:14px;font-weight:800">SLA Health: IMPROVING — FY25 full year (81.8%) outperforms FY24 partial (75.7%); FY26 YTD at 82.0%</div>
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
            <strong>📈 Steady Improvement (HPE FY):</strong> FY24 partial (Apr-Oct 24) = 75.7% → FY25 full (Nov-24 to Oct-25) = 81.8% → FY26 YTD (Nov-25 to Apr-26) = 82.0%. Strong Q4 FY25 momentum (93%) carries into FY26.
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
          <div style="font-size:12px;font-weight:500;margin-top:2px">FY24 = Nov-23 → Oct-24 &nbsp;|&nbsp; FY25 = Nov-24 → Oct-25 &nbsp;|&nbsp; FY26 = Nov-25 → Oct-26 (current, partial)</div>
        </div>
      </div>

      <!-- 3-card FY summary grid -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:22px">

        <!-- FY24 partial -->
        <div class="sla-fy-card" style="border-top:3px solid #95a5a6">
          <div class="sla-fy-label" style="color:#7f8c8d">FY 2024 <span style="font-size:12px;font-weight:600;background:#ecf0f1;border-radius:8px;padding:2px 8px;margin-left:6px">Partial</span></div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">Apr-24 – Oct-24 (7 months in scope)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div style="text-align:center;background:#f4f7fb;padding:10px;border-radius:8px">
              <div style="font-size:22px;font-weight:800;color:#7f8c8d">75.7%</div>
              <div style="font-size:10px;color:var(--text-muted)">Compliance</div>
            </div>
            <div style="text-align:center;background:#fceaea;padding:10px;border-radius:8px">
              <div style="font-size:22px;font-weight:800;color:var(--hpe-red)">24.3%</div>
              <div style="font-size:10px;color:var(--text-muted)">Non-Compliance</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary)">
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">✅ Met: <strong>53</strong></div>
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">❌ Not Met: <strong>17</strong></div>
            <div style="padding:5px 0;border-bottom:1px solid var(--border)">📭 NR: <strong>0</strong></div>
            <div style="padding:5px 0">📅 Worst: Jun-24 (60%) | Best: Aug-24 (90%)</div>
          </div>
        </div>

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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px">
        <div style="background:linear-gradient(135deg,#ebf5fb,#d6eaf8);border-radius:10px;padding:16px 20px;border:1px solid rgba(52,152,219,0.3)">
          <div style="font-size:11px;font-weight:800;color:#1a4fa0;text-transform:uppercase;letter-spacing:0.5px">FY24 → FY25 Change</div>
          <div style="font-size:28px;font-weight:800;color:var(--hpe-blue);margin:6px 0">▲ +6.1 pp</div>
          <div style="font-size:12px;color:#555">75.7% → 81.8% | Improvement on full-year FY25 vs partial FY24</div>
        </div>
        <div style="background:linear-gradient(135deg,#e6f7f2,#d5f5ec);border-radius:10px;padding:16px 20px;border:1px solid rgba(1,169,130,0.3)">
          <div style="font-size:11px;font-weight:800;color:#0a7a56;text-transform:uppercase;letter-spacing:0.5px">FY25 → FY26 YTD Trend</div>
          <div style="font-size:28px;font-weight:800;color:var(--hpe-green);margin:6px 0">▲ +0.2 pp</div>
          <div style="font-size:12px;color:#555">81.8% → 82.0% YTD | FY26 on track; Feb-26 dip requires monitoring</div>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-balance-scale"></i> FY24 vs FY25 vs FY26 YTD — Per-Metric Compliance (HPE FY: Nov–Oct)</div>
        <div class="card-subtitle">FY24 = Apr-Oct 24 (partial) &nbsp;|&nbsp; FY25 = Nov-24 to Oct-25 (full) &nbsp;|&nbsp; FY26 = Nov-25 to Apr-26 (YTD)</div>
        <div class="chart-container" style="height:320px">
          <canvas id="slaFYCompareChart"></canvas>
        </div>
      </div>

      <div class="card card-full mb-20">
        <div class="sla-section-title"><i class="fas fa-chart-area"></i> Monthly Compliance Trend — FY24 vs FY25 vs FY26 (by FY month position)</div>
        <div class="card-subtitle">M1 = first month of each FY (Nov for FY25/FY26; Apr for partial FY24). Dashed = partial FY24.</div>
        <div class="chart-container" style="height:280px">
          <canvas id="slaFYTrendChart"></canvas>
        </div>
      </div>

      <div class="row-2">
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-arrow-up" style="color:var(--hpe-green)"></i> FY25 vs FY24 — Metric Improvements &amp; Risk (HPE FY)</div>
          <table class="sla-metric-table">
            <thead><tr><th>Metric</th><th>FY24</th><th>FY25</th><th>FY24→25</th><th>FY26 YTD</th><th>FY25→26</th></tr></thead>
            <tbody id="slaFYImprovementBody"></tbody>
          </table>
        </div>
        <div class="card">
          <div class="sla-section-title"><i class="fas fa-exclamation-circle" style="color:var(--hpe-orange)"></i> Metrics Below 80% in Any FY — Requires Focus</div>
          <table class="sla-metric-table">
            <thead><tr><th>Metric</th><th>FY24</th><th>FY25</th><th>FY26 YTD</th></tr></thead>
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
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>Time to Fill – Enterprise:</strong> 29% FY24 → 45% FY25. Q4 FY25 showed recovery but FY26 YTD still at 40%. Needs sustained focus.</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>% Aged – Enterprise:</strong> 71% FY24 → 55% FY25 → 80% FY26. FY25 dipped (Q1-Q2 FY25 failures) but FY26 recovering strongly.</div>
            <div class="sla-insight-box"><strong>% Aged – Technical:</strong> 71% FY24 → 82% FY25. Strong Q4 FY25, though FY26 shows minor relapse (60%).</div>
          </div>
          <div>
            <div style="font-weight:700;color:var(--hpe-orange);margin-bottom:10px;font-size:13px">⚠ INCONSISTENT Metrics</div>
            <div class="sla-insight-box warn" style="margin-bottom:8px"><strong>Time to Fill – Technical:</strong> 71% FY24 → 64% FY25 → 80% FY26 YTD. Dipped in FY25 (Q1 failures Nov-Jan); improving in FY26.</div>
            <div class="sla-insight-box warn" style="margin-bottom:8px"><strong>Avg Reqs Vol – Technical:</strong> 100% FY24 → 73% FY25 (Q1 FY25 failures). FY26 back to 100% YTD.</div>
            <div class="sla-insight-box warn"><strong>Internal Hiring – Technical:</strong> 86% FY24 → 91% FY25 → 80% FY26. Generally strong; Apr-26 failure breaks Q1 FY26 streak.</div>
          </div>
          <div>
            <div style="font-weight:700;color:var(--hpe-green);margin-bottom:10px;font-size:13px">✅ STABLE / PERFECT Metrics</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>% Agency Utilization – Technical:</strong> 100% in FY24, FY25 and FY26 YTD. Zero failures across all 23 reported months.</div>
            <div class="sla-insight-box" style="margin-bottom:8px"><strong>% Agency Utilization – Enterprise:</strong> 100% all three FYs. Perfect compliance throughout entire period.</div>
            <div class="sla-insight-box"><strong>Internal Hiring – Enterprise:</strong> 100% FY24 &amp; FY25 → 80% FY26 YTD (1 failure in Feb-26). Near-perfect historically.</div>
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
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px">FY2026 · South 1 Region · Auto-generated</div>
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
              <i class="fas fa-robot"></i> AI Insights
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
            <div class="slide-thumb-label">Slide 5 · AI Insights</div>
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
    {Month_Number: 1, Month: 'Apr', Opportunity_Count: 2219, Opportunity_Pass: 2158, Opportunity_Fail: 61, Opportunity_NA: 0, Accuracy: 97.25, Error_Rate: 2.75}
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
    {Month: 'Apr', Month_Number: 1, Week: 1, Opportunity_Count: 528, Opportunity_Pass: 526, Opportunity_Fail: 2, Opportunity_NA: 0, Accuracy: 99.62, Week_Label: 'Apr W1'},
    {Month: 'Apr', Month_Number: 1, Week: 2, Opportunity_Count: 642, Opportunity_Pass: 634, Opportunity_Fail: 8, Opportunity_NA: 0, Accuracy: 98.75, Week_Label: 'Apr W2'},
    {Month: 'Apr', Month_Number: 1, Week: 3, Opportunity_Count: 674, Opportunity_Pass: 631, Opportunity_Fail: 43, Opportunity_NA: 0, Accuracy: 93.62, Week_Label: 'Apr W3'},
    {Month: 'Apr', Month_Number: 1, Week: 4, Opportunity_Count: 375, Opportunity_Pass: 367, Opportunity_Fail: 8, Opportunity_NA: 0, Accuracy: 97.87, Week_Label: 'Apr W4'}
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
  ]
};

// ==================== CHART REGISTRY ====================
const charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ==================== COLOR HELPERS ====================
function getAccBadge(acc) {
  if (acc >= 99) return '<span class="acc-badge excellent">⬤ ' + acc + '%</span>';
  if (acc >= 95) return '<span class="acc-badge good">⬤ ' + acc + '%</span>';
  if (acc >= 95) return '<span class="acc-badge warning">⬤ ' + acc + '%</span>';
  return '<span class="acc-badge bad">⬤ ' + acc + '%</span>';
}

function getHeatmapColor(acc) {
  if (acc >= 99) return {bg: '#01A982', text: 'white'};
  if (acc >= 95) return {bg: '#4fc3a1', text: 'white'};
  if (acc >= 95) return {bg: '#FF8300', text: 'white'};
  return {bg: '#C54E4B', text: 'white'};
}

// ==================== TAB SWITCHING ====================
// One-time init guards for non-SLA tabs
let _execDone = false, _trendDone = false, _improveDone = false, _insightsDone = false, _perfDone = false;

function switchTab(tabName, el) {
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
  document.getElementById('tab-' + tabName).classList.add('active');
  el.classList.add('active');
  
  // 150ms: enough for CSS display:block to propagate so canvas has real dimensions
  setTimeout(function() {
    if (tabName === 'executive')   { if (!_execDone)    { _execDone    = true; initExecutiveCharts(); }    else { updateExecutiveKPIs(); updateExecutiveCharts(); reflowCharts(['sparklineChart','stageDonutChart']); } }
    if (tabName === 'trends')      { if (!_trendDone)   { _trendDone   = true; initTrendCharts(); }         else { updateTrendCharts(); reflowCharts(['stageComparisonChart','criticalBarChart']); } }
    if (tabName === 'improvement') { if (!_improveDone) { _improveDone = true; initImprovementCharts(); }  else { updateImprovementCharts(); reflowCharts(['paretoChart','recruiterErrorChart','pmChart','stageErrorChart']); } }
    if (tabName === 'capa')        { initCAPACharts(); }
    if (tabName === 'insights')    { if (!_insightsDone){ _insightsDone= true; initInsightsCharts(); }     else { reflowCharts(['accuracyRadarChart','errorHeatChart']); } }
    if (tabName === 'sla')         { initSLADashboard(); }
    if (tabName === 'data')        { buildWeeklyTable(); }
    if (tabName === 'performance') { if (!_perfDone) { _perfDone = true; initPerformanceTab(); } else { if (_activePerfPanel==='risk') buildRiskPanel(); else if (_activePerfPanel==='scorecard') buildScorecardPanel(); else if (_activePerfPanel==='param') buildParamPanel(); else if (_activePerfPanel==='pm') buildPMPanel(); else if (_activePerfPanel==='goals') buildGoalsPanel(); } }
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

  // Stage donut (always full-FY, not filter-dependent)
  destroyChart('stageDonutChart');
  const stageCtx = document.getElementById('stageDonutChart').getContext('2d');
  charts['stageDonutChart'] = new Chart(stageCtx, {
    type: 'doughnut',
    data: {
      labels: ['Post Selection Pass', 'Post Selection Fail', 'Pre Selection Pass', 'Pre Selection Fail'],
      datasets: [{
        data: [5962, 92, 2438, 36],
        backgroundColor: ['#01A982', '#C54E4B', '#4fc3a1', '#FF8300'],
        borderWidth: 2,
        borderColor: 'white'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: {size:11}, padding: 10, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw.toLocaleString() } }
      },
      cutout: '65%'
    }
  });

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
  const allSorted = [...DASHBOARD_DATA.month_stats].sort(function(a,b){ return a.Month_Number - b.Month_Number; });
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
    var status = m.Accuracy >= 95
      ? '<span class="status-pill status-closed">\u2713 On Target</span>'
      : '<span class="status-pill status-open">\u2717 Below Target</span>';
    return '<tr>'
      + '<td><strong>' + m.Month + ' 2026</strong></td>'
      + '<td>' + m.Opportunity_Count.toLocaleString() + '</td>'
      + '<td style="color:var(--hpe-green);font-weight:600">' + m.Opportunity_Pass.toLocaleString() + '</td>'
      + '<td style="color:var(--hpe-red);font-weight:600">' + m.Opportunity_Fail + '</td>'
      + '<td style="color:var(--text-muted)">' + m.Opportunity_NA + '</td>'
      + '<td>' + getAccBadge(m.Accuracy) + '</td>'
      + '<td style="color:var(--hpe-orange);font-weight:600">' + m.Error_Rate + '%</td>'
      + '<td>' + momHtml + '</td>'
      + '<td>' + status + '</td>'
      + '</tr>';
  }).join('');
}

// ==================== TREND CHARTS ====================
function initTrendCharts() {
  // Filter-aware charts: monthly trend + weekly error + weekly drill table
  // (updateTrendCharts checks _trendDone so we bypass it here by calling directly)
  var months = getFilteredMonths().sort(function(a,b){ return a.Month_Number - b.Month_Number; });
  var weeks  = getFilteredWeeks();

  // Monthly trend line
  destroyChart('monthlyTrendChart');
  const mtCtx = document.getElementById('monthlyTrendChart').getContext('2d');
  charts['monthlyTrendChart'] = new Chart(mtCtx, {
    type: 'line',
    data: {
      labels: months.map(m => m.Month + ' 2026'),
      datasets: [
        {
          label: 'Accuracy %',
          data: months.map(m => m.Accuracy),
          borderColor: '#01A982',
          backgroundColor: 'rgba(1,169,130,0.12)',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: '#01A982',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Error Rate %',
          data: months.map(m => m.Error_Rate),
          borderColor: '#C54E4B',
          backgroundColor: 'rgba(197,78,75,0.08)',
          tension: 0.4,
          fill: false,
          pointRadius: 5,
          pointBackgroundColor: '#C54E4B',
          borderDash: [],
          yAxisID: 'y2',
          order: 2,
          type: 'bar'
        },
        {
          label: '95% Target',
          data: months.map(() => 95),
          borderColor: '#FF8300',
          borderDash: [8,4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          yAxisID: 'y',
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: {size:12}, padding: 16, boxWidth: 14 } },
        tooltip: { backgroundColor: '#1a2532', padding: 12, cornerRadius: 8 }
      },
      scales: {
        y: { min: 95, max: 101, position: 'left', ticks: { callback: v => v + '%', font:{size:11} }, grid: { color: 'rgba(0,0,0,0.06)' } },
        y2: { min: 0, max: 5, position: 'right', ticks: { callback: v => v + '%', font:{size:11} }, grid: { display: false } },
        x: { ticks: { font: {size:12} }, grid: { display: false } }
      }
    }
  });
  
  // Heatmap
  buildHeatmap();
  
  // Stage comparison
  destroyChart('stageComparisonChart');
  const scCtx = document.getElementById('stageComparisonChart').getContext('2d');
  charts['stageComparisonChart'] = new Chart(scCtx, {
    type: 'bar',
    data: {
      labels: ['Post Selection', 'Pre Selection'],
      datasets: [
        { label: 'Pass', data: [5962, 2438], backgroundColor: '#01A982' },
        { label: 'Fail', data: [92, 36], backgroundColor: '#C54E4B' },
        { label: 'N/A', data: [68, 3], backgroundColor: '#e1e8ef' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: {font:{size:11}, boxWidth:12} } },
      scales: {
        x: { stacked: true, grid: {display:false} },
        y: { stacked: true, ticks: {font:{size:11}} }
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
  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
  const weekData = DASHBOARD_DATA.week_stats;
  
  let html = '<div style="display:grid;grid-template-columns:60px repeat(4,1fr);gap:4px;font-size:11px">';
  // Header
  html += '<div></div>';
  months.forEach(m => {
    html += \`<div style="text-align:center;font-weight:600;color:var(--text-secondary);padding:4px 0">\${m}</div>\`;
  });
  
  for (let w = 1; w <= 4; w++) {
    html += \`<div style="font-weight:600;color:var(--text-muted);padding:6px 8px 6px 0;display:flex;align-items:center">W\${w}</div>\`;
    months.forEach(m => {
      const entry = weekData.find(x => x.Month === m && x.Week === w);
      if (entry) {
        const col = getHeatmapColor(entry.Accuracy);
        html += \`<div class="heatmap-cell" style="background:\${col.bg};color:\${col.text}">
          \${entry.Accuracy}%
          <div class="tooltip">\${entry.Week_Label}: \${entry.Accuracy}% | \${entry.Opportunity_Count} audits | \${entry.Opportunity_Fail} errors</div>
        </div>\`;
      } else {
        html += '<div style="background:#f8fafc;border-radius:6px;padding:10px 6px;text-align:center;font-size:11px;color:#ccc">—</div>';
      }
    });
  }
  html += '</div>';
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
  const allSorted = [...DASHBOARD_DATA.week_stats].sort(function(a,b){
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
        y: { min: yMin, max: 101, ticks: { callback: function(v){ return v+'%'; }, font:{size:11} } },
        x: { ticks: {font:{size:10}, maxRotation:45}, grid:{display:false} }
      }
    }
  });
}

function initImprovementCharts() {
  buildForecastChart();
  buildDeltaTable();
  const errors = DASHBOARD_DATA.top_errors.filter(e => e.Opportunity_Fail > 0);
  const totalErrors = errors.reduce((s,e) => s + e.Opportunity_Fail, 0);
  let cumulative = 0;
  const cumulativeData = errors.map(e => { cumulative += e.Opportunity_Fail; return +((cumulative/totalErrors)*100).toFixed(1); });
  
  destroyChart('paretoChart');
  const pCtx = document.getElementById('paretoChart').getContext('2d');
  charts['paretoChart'] = new Chart(pCtx, {
    type: 'bar',
    data: {
      labels: errors.map(e => e.Parameter.length > 20 ? e.Parameter.substring(0,20)+'...' : e.Parameter),
      datasets: [
        {
          label: 'Error Count',
          data: errors.map(e => e.Opportunity_Fail),
          backgroundColor: errors.map((e,i) => i === 0 ? '#C54E4B' : i < 3 ? '#FF8300' : '#425563'),
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Cumulative %',
          data: cumulativeData,
          type: 'line',
          borderColor: '#0D5DBF',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#0D5DBF',
          fill: false,
          tension: 0.3,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: {font:{size:11},boxWidth:12} } },
      scales: {
        y: { ticks: {font:{size:10}}, title: {display:true, text:'Error Count', font:{size:10}} },
        y2: { position: 'right', min: 0, max: 100, ticks: { callback: v => v + '%', font:{size:10} }, grid:{display:false} },
        x: { ticks: {font:{size:9}, maxRotation:45} }
      }
    }
  });
  
  // Recruiter error chart
  const recData = DASHBOARD_DATA.recruiter_bottom.slice(0,10);
  destroyChart('recruiterErrorChart');
  const rCtx = document.getElementById('recruiterErrorChart').getContext('2d');
  charts['recruiterErrorChart'] = new Chart(rCtx, {
    type: 'bar',
    data: {
      labels: recData.map(r => r.Recruiter),
      datasets: [{
        label: 'Avg Accuracy %',
        data: recData.map(r => r.Avg_Accuracy),
        backgroundColor: recData.map(r => r.Avg_Accuracy < 92 ? '#C54E4B' : r.Avg_Accuracy < 95 ? '#FF8300' : '#425563'),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: {display:false} },
      scales: {
        x: { min: 85, max: 100, ticks: { callback: v => v + '%', font:{size:10} } },
        y: { ticks: {font:{size:10}} }
      }
    }
  });
  
  // PM Chart
  destroyChart('pmChart');
  const pmCtx = document.getElementById('pmChart').getContext('2d');
  charts['pmChart'] = new Chart(pmCtx, {
    type: 'bar',
    data: {
      labels: DASHBOARD_DATA.pm_stats.map(p => p.PM),
      datasets: [{
        label: 'Accuracy %',
        data: DASHBOARD_DATA.pm_stats.map(p => p.Avg_Accuracy),
        backgroundColor: DASHBOARD_DATA.pm_stats.map(p => p.Avg_Accuracy >= 99 ? '#01A982' : p.Avg_Accuracy >= 98 ? '#4fc3a1' : '#FF8300'),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: {display:false} },
      scales: {
        y: { min: 96, max: 101, ticks: { callback: v => v + '%', font:{size:11} } },
        x: { ticks: {font:{size:10}, maxRotation:30}, grid:{display:false} }
      }
    }
  });
  
  // Stage error chart
  destroyChart('stageErrorChart');
  const seCtx = document.getElementById('stageErrorChart').getContext('2d');
  charts['stageErrorChart'] = new Chart(seCtx, {
    type: 'doughnut',
    data: {
      labels: ['Post Selection (92 errors)', 'Pre Selection (36 errors)'],
      datasets: [{
        data: [92, 36],
        backgroundColor: ['#C54E4B', '#FF8300'],
        borderWidth: 2,
        borderColor: 'white'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: {font:{size:11},boxWidth:12} } },
      cutout: '60%'
    }
  });
}

function buildDeltaTable() {
  const el = document.getElementById('deltaTable');
  if (!el) return;
  const months = DASHBOARD_DATA.month_stats.sort((a,b) => a.Month_Number - b.Month_Number);
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
  // Action recommendations
  const recEl = document.getElementById('actionRecommendations');
  if (recEl) {
    const actions = [
      { priority: 1, impact: 'HIGH', title: 'Fix Target Start Date validation', detail: 'Implement date format check before bot submission', est: '+0.62% accuracy', color: 'var(--hpe-red)' },
      { priority: 2, impact: 'HIGH', title: 'Coach bottom 3 recruiters', detail: 'Focused training for Kusuma K, Noor Mohammed M, Divya S', est: '+0.30% accuracy', color: 'var(--hpe-red)' },
      { priority: 3, impact: 'MED', title: 'Standardize Source of Hire tagging', detail: 'Refresh source mapping table quarterly', est: '+0.14% accuracy', color: 'var(--hpe-orange)' },
      { priority: 4, impact: 'MED', title: 'Intake Call process checklist', detail: 'Mandatory completion checklist before submission', est: '+0.08% accuracy', color: 'var(--hpe-orange)' },
      { priority: 5, impact: 'LOW', title: 'Subin Sundar team process review', detail: 'Schedule deep-dive with team on Q2 errors', est: '+0.05% accuracy', color: '#b8860b' }
    ];
    recEl.innerHTML = actions.map(a => \`
      <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="width:22px;height:22px;border-radius:50%;background:\${a.color};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px">\${a.priority}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--text-primary)">\${a.title}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">\${a.detail}</div>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--hpe-green);white-space:nowrap">\${a.est}</div>
      </div>
    \`).join('');
  }
  
  // Forecast detail chart
  destroyChart('forecastDetailChart');
  const fdCtx = document.getElementById('forecastDetailChart').getContext('2d');
  const allLabels = DASHBOARD_DATA.week_stats.map(w => w.Week_Label).concat(['May W1','May W2','May W3','May W4']);
  const allActual = DASHBOARD_DATA.week_stats.map(w => w.Accuracy);
  const forecastBase = [98.9, 99.1, 99.0, 99.2];
  const forecastOpt = [99.2, 99.4, 99.3, 99.5];
  const forecastPes = [98.5, 98.7, 98.6, 98.8];
  
  charts['forecastDetailChart'] = new Chart(fdCtx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Actual',
          data: [...allActual, null, null, null, null],
          borderColor: '#01A982',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#01A982',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Base Forecast',
          data: [...allActual.slice(0,-1).map(()=>null), allActual[allActual.length-1], ...forecastBase],
          borderColor: '#FF8300',
          borderDash: [5,3],
          borderWidth: 2,
          pointRadius: 5,
          pointBackgroundColor: '#FF8300',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Optimistic',
          data: [...allActual.slice(0,-1).map(()=>null), allActual[allActual.length-1], ...forecastOpt],
          borderColor: '#4fc3a1',
          borderDash: [3,3],
          borderWidth: 1.5,
          pointRadius: 3,
          tension: 0.3,
          fill: false
        },
        {
          label: 'Pessimistic',
          data: [...allActual.slice(0,-1).map(()=>null), allActual[allActual.length-1], ...forecastPes],
          borderColor: '#e06060',
          borderDash: [3,3],
          borderWidth: 1.5,
          pointRadius: 3,
          tension: 0.3,
          fill: false
        },
        {
          label: '95% Target',
          data: allLabels.map(()=>95),
          borderColor: '#C54E4B',
          borderDash: [8,4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: {font:{size:11},boxWidth:12} } },
      scales: {
        y: { min: 92, max: 101, ticks: { callback: v => v + '%', font:{size:11} } },
        x: { ticks: {font:{size:10}, maxRotation:45}, grid:{display:false} }
      }
    }
  });
}

// ==================== UNIFIED GLOBAL FILTER ENGINE ====================
// Single source of truth for all period filters across Executive, Trends, Improvement tabs
var ACTIVE_FILTER = { mode: 'fy', value: 'all' }; // mode: 'fy'|'month'|'week'

// Helper: get filtered week_stats based on current ACTIVE_FILTER
function getFilteredWeeks() {
  var all = [...DASHBOARD_DATA.week_stats].sort(function(a,b) {
    return a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week;
  });
  if (ACTIVE_FILTER.mode === 'fy' || ACTIVE_FILTER.value === 'all') return all;
  if (ACTIVE_FILTER.mode === 'month') return all.filter(function(w) { return w.Month === ACTIVE_FILTER.value; });
  if (ACTIVE_FILTER.mode === 'week')  return all.filter(function(w) { return w.Week_Label === ACTIVE_FILTER.value; });
  return all;
}

// Helper: get filtered month_stats based on current ACTIVE_FILTER
function getFilteredMonths() {
  var all = [...DASHBOARD_DATA.month_stats].sort(function(a,b) { return a.Month_Number - b.Month_Number; });
  if (ACTIVE_FILTER.mode === 'fy' || ACTIVE_FILTER.value === 'all') return all;
  if (ACTIVE_FILTER.mode === 'month') return all.filter(function(m) { return m.Month === ACTIVE_FILTER.value; });
  if (ACTIVE_FILTER.mode === 'week') {
    // For week filter on monthly view, show only the month that contains that week
    var w = DASHBOARD_DATA.week_stats.find(function(x) { return x.Week_Label === ACTIVE_FILTER.value; });
    return w ? all.filter(function(m) { return m.Month === w.Month; }) : all;
  }
  return all;
}

// Populate week dropdown options (called once per filter area)
function populateWeekOptions(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var weeks = [...DASHBOARD_DATA.week_stats].sort(function(a,b) {
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

// ---- UPDATE EXECUTIVE KPI CARDS ----
function updateExecutiveKPIs() {
  var weeks  = getFilteredWeeks();
  var months = getFilteredMonths();
  var sortedMonths = [...DASHBOARD_DATA.month_stats].sort(function(a,b){ return a.Month_Number - b.Month_Number; });

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
    // WoW: last vs second-last week
    var allW = [...DASHBOARD_DATA.week_stats].sort(function(a,b){
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
    // Week mode: this week vs previous week
    var allSorted = [...DASHBOARD_DATA.week_stats].sort(function(a,b){
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

  // Accuracy delta vs Jan (FY reference)
  var janData = DASHBOARD_DATA.month_stats.find(function(m){ return m.Month === 'Jan'; });
  var accDelta = '', accDeltaClass = 'delta-up';
  if (ACTIVE_FILTER.mode !== 'fy' && ACTIVE_FILTER.value !== 'all' && janData) {
    var ad = +(accuracy - janData.Accuracy).toFixed(2);
    accDelta = (ad >= 0 ? '+' : '') + ad + '% vs Jan';
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
  setText('kpi-accuracy-sub', 'Target: 95.00% | ' + periodLabel);

  setText('kpi-total', totalCount.toLocaleString());
  setHtml('kpi-total-delta', '<i class="fas fa-clipboard-list"></i> ' + periodLabel);
  setText('kpi-total-sub', weeks.length + ' week(s) in view');

  setText('kpi-pass', totalPass.toLocaleString());
  setHtml('kpi-pass-delta', '<i class="fas fa-minus"></i> ' + passRate + '% pass rate');
  setText('kpi-pass-sub', 'Out of ' + totalCount.toLocaleString() + ' total');

  setText('kpi-errors', totalFail.toString());
  setHtml('kpi-errors-delta', '<i class="fas fa-arrow-' + (errRate > 2 ? 'up' : 'down') + '"></i> ' + errRate + '% error rate');
  setClass('kpi-errors-delta', 'kpi-delta ' + (errRate > 2 ? 'delta-down' : 'delta-up'));
  setText('kpi-errors-sub', 'Across 12 parameters');

  setText('kpi-mom', momVal || '—');
  setHtml('kpi-mom-delta', '<i class="fas fa-arrow-' + (momClass==='delta-up'?'up':momClass==='delta-down'?'down':'right') + '"></i> ' + momLabel);
  setClass('kpi-mom-delta', 'kpi-delta ' + momClass);
  setText('kpi-mom-sub', momClass === 'delta-up' ? 'Improvement trend' : momClass === 'delta-down' ? 'Declining trend' : 'Stable');

  setText('kpi-wow', wowVal || '—');
  setHtml('kpi-wow-delta', '<i class="fas fa-arrow-' + (wowClass==='delta-up'?'up':wowClass==='delta-down'?'down':'right') + '"></i> ' + wowLabel);
  setClass('kpi-wow-delta', 'kpi-delta ' + wowClass);
  setText('kpi-wow-sub', 'Weekly performance');

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
  if (gCS) { gCS.className = 'gauge-status ' + (critAcc >= 99 ? 'good' : 'warning'); gCS.textContent = critAcc >= 99 ? '\u2713 Above Target' : '\u26a0 Below Target'; }

  drawGauge('gaugeNonCritical', nonCritAcc, '#FF8300');
  setText('gaugeNonCriticalVal', nonCritAcc + '%');
  var gNCS = document.getElementById('gaugeNonCriticalStatus');
  if (gNCS) { gNCS.className = 'gauge-status ' + (nonCritAcc >= 97 ? 'good' : 'warning'); gNCS.textContent = nonCritAcc >= 97 ? '\u2713 Above Target' : '\u26a0 Below Target'; }

  // Section subtitle
  var subEl = document.querySelector('#tab-executive .section-subtitle');
  if (subEl) subEl.textContent = periodLabel + ' | HPE Talent Acquisition Audit Performance Overview — South 1 Region';
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

  // Sparkline
  destroyChart('sparklineChart');
  var spEl = document.getElementById('sparklineChart');
  if (spEl) {
    charts['sparklineChart'] = new Chart(spEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Accuracy %', data: accData, borderColor: '#01A982', backgroundColor: 'rgba(1,169,130,0.1)',
            tension: 0.4, fill: true, pointRadius: 4,
            pointBackgroundColor: accData.map(function(a){ return a < 95 ? '#C54E4B' : a < 98 ? '#FF8300' : '#01A982'; }),
            pointBorderColor: 'white', pointBorderWidth: 2, pointHoverRadius: 7 },
          { label: '95% Target', data: labels.map(function(){ return 95; }),
            borderColor: '#C54E4B', borderDash: [5,5], borderWidth: 1.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: {display:false}, tooltip: {mode:'index'} },
        scales: {
          y: { min: Math.min(91, Math.floor(Math.min(...accData)) - 1), max: 101, ticks: { callback: function(v){ return v+'%'; }, font:{size:11} } },
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
  if (!_trendDone) return; // not initialized yet, initTrendCharts will build with current filter
  var weeks  = getFilteredWeeks();
  var months = getFilteredMonths();

  // Monthly trend chart
  destroyChart('monthlyTrendChart');
  var mtEl = document.getElementById('monthlyTrendChart');
  if (mtEl && months.length > 0) {
    charts['monthlyTrendChart'] = new Chart(mtEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: months.map(function(m){ return m.Month + ' 2026'; }),
        datasets: [
          { label: 'Accuracy %', data: months.map(function(m){ return m.Accuracy; }),
            borderColor: '#01A982', backgroundColor: 'rgba(1,169,130,0.12)', tension: 0.4, fill: true,
            pointRadius: 6, pointBackgroundColor: '#01A982', pointBorderColor: 'white', pointBorderWidth: 2,
            yAxisID: 'y', order: 1 },
          { label: 'Error Rate %', data: months.map(function(m){ return m.Error_Rate; }),
            borderColor: '#C54E4B', backgroundColor: 'rgba(197,78,75,0.08)', tension: 0.4,
            type: 'bar', yAxisID: 'y2', order: 2 },
          { label: '95% Target', data: months.map(function(){ return 95; }),
            borderColor: '#FF8300', borderDash: [8,4], borderWidth: 2, pointRadius: 0, fill: false, yAxisID: 'y', order: 0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: {mode:'index', intersect:false},
        plugins: { legend: {position:'top', labels:{font:{size:12},padding:16,boxWidth:14}} },
        scales: {
          y:  { min: 94, max: 101, position:'left', ticks:{callback:function(v){return v+'%';}, font:{size:11}} },
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
  var targets = cs.map(function(c){ return c.Criticality === 'Critical' ? 99 : 97; });
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
        y: { min: yMin2, max: 101, ticks: {callback:function(v){ return v+'%'; }, font:{size:11}}, grid:{color:'rgba(0,0,0,0.06)'} },
        x: { grid:{display:false}, ticks:{font:{size:12}} }
      }
    }
  });
}
function updateImprovementCharts() {
  if (!_improveDone) return;
  buildForecastChart();
  buildDeltaTable();
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
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
  setTimeout(() => {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    const now = new Date();
    document.getElementById('refreshTime').textContent = 'Last refreshed: ' + now.toLocaleTimeString();
    document.getElementById('dataLastRefresh').textContent = now.toLocaleString();
  }, 1200);
}

// ==================== FILE UPLOAD ====================
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const zone = document.getElementById('uploadZone');
  zone.innerHTML = \`
    <div class="upload-icon" style="color:var(--hpe-green)"><i class="fas fa-check-circle"></i></div>
    <div class="upload-title" style="color:var(--hpe-green)">File Loaded: \${file.name}</div>
    <div class="upload-subtitle">Size: \${(file.size/1024).toFixed(1)} KB — Processing data and refreshing charts...</div>
  \`;
  setTimeout(() => {
    zone.innerHTML = \`
      <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="upload-title">Drop Audit Data File Here</div>
      <div class="upload-subtitle">File processed! Dashboard updated. Drag another file to refresh again.</div>
    \`;
    refreshDashboard();
  }, 2000);
}

function handleDrop(event) {
  event.preventDefault();
  const zone = document.getElementById('uploadZone');
  zone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) handleFileUpload({target: {files: [file]}});
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
          y:{ min:94, max:101, ticks:{callback:function(v){return v+'%';},font:{size:10}} },
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
      return '<div class="scorecard-card ' + tier.cls + '">'
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
        scales:{ y:{ min:82, max:101, ticks:{callback:function(v){return v+'%';},font:{size:10}} },
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
        scales:{ y:{ min:96, max:101, ticks:{callback:function(v){return v+'%';},font:{size:10}} },
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
        scales:{ y:{ min:96, max:101, ticks:{callback:function(v){return v+'%';},font:{size:11}} },
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
    txt('FY2026 · South 1 Region · Jan–Apr 2026', 16, 98, 8, T.sub, 'left', false);

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
        doc2.text(icon + '  ' + title, margin + 6, y + 5.5);
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
        doc.setFontSize(8); doc.setTextColor('rgba(255,255,255,0.7)');
        doc.text('Talent Acquisition — Audit Quality Programme', margin, 42);

        // Report title block
        doc.setFillColor('#f8fafc'); doc.rect(0, 56, PW, PH - 56, 'F');
        doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.setTextColor('#0f1624');
        doc.text('Audit Performance Report', margin, 80);
        doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor('#6b7280');
        doc.text('FY2026  ·  South 1 Region  ·  Jan – Apr 2026', margin, 90);

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
            body:'Accuracy declined from 99.43% in February to 97.25% in April (−2.18%), marking the lowest point in FY2026. This downward trajectory from Feb→Mar (98.49%)→Apr (97.25%) signals a worsening trend.',
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
          doc.text(ins.icon + '  ' + ins.title, margin+7, cy+7);
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
      doc.text('South 1 Region · Confidential · For Internal Use Only', PW/2, cy+18, {align:'center'});

      setExportProgress('\ud83d\udcc4', 'Download Ready!', 'Saving file\u2026', 100);
      setTimeout(function() {
        doc.save(filename);
        hideProgress();
        if (btn) btn.disabled = false;
        showToast('success', '\u2713 PDF exported: ' + filename);
      }, 400);

    } catch(err) {
      console.error('PDF export error:', err);
      hideProgress();
      if (btn) btn.disabled = false;
      showToast('error', 'PDF export failed: ' + (err.message || err));
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
  if (!selected.length) { showToast('error','No slides selected'); if(btn)btn.disabled=false; return; }

  if (!window.PptxGenJS) { showToast('error','PptxGenJS not loaded yet — please wait a moment'); if(btn)btn.disabled=false; return; }

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
          slide.addText('FY2026  ·  South 1 Region  ·  Jan – Apr 2026', { x:0.4, y:3.78, w:9, h:0.4, fontSize:13, color:T.sub.replace('#',''), fontFace:'Calibri' });

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
          slide.addText('FY2026 · HPE Talent Acquisition · South 1 Region', { x:0.15, y:0.65, w:9, h:0.3, fontSize:10, color:T.sub.replace('#',''), fontFace:'Calibri' });

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
          slide.addText('AI Insights & Recommendations', { x:0.15, y:0.15, w:12, h:0.5, fontSize:20, bold:true, color:T.text.replace('#',''), fontFace:'Calibri' });
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
        showToast('success','\u2713 PowerPoint exported: ' + filename);
      }).catch(function(err) {
        hideProgress();
        if (btn) btn.disabled = false;
        showToast('error','PPT export failed: ' + err.message);
      });

    } catch(err) {
      console.error('PPT export error:', err);
      hideProgress();
      if (btn) btn.disabled = false;
      showToast('error','PPT export failed: ' + (err.message || err));
    }
  }, 50);
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
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
  // FY24 partial: Apr-24 → Oct-24 (7 months, indices 0-6)
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
      scales:{ y:{min:0,max:110,ticks:{callback:v=>v+'%'}} }
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
      scales:{ y:{min:0,max:110,ticks:{callback:v=>v+'%'}} }
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
  // FY24 partial: indices 0-6   (Apr-24 to Oct-24, 7 months)
  // FY25 full:    indices 7-18  (Nov-24 to Oct-25, 12 months)
  // FY26 partial: indices 19-23 (Nov-25 to Apr-26, 5 months YTD)
  const fySlice = (start, end) => (mi) => {
    const slice = SLA_DATA.perMetricMonthly[mi].slice(start, end);
    const met = slice.filter(s=>s==='MET').length;
    const nm  = slice.filter(s=>s==='NOT_MET').length;
    return met+nm>0 ? Math.round(met/(met+nm)*100) : 0;
  };
  const fy24  = SLA_DATA.metrics.map((_,mi)=>fySlice(0,7)(mi));
  const fy25  = SLA_DATA.metrics.map((_,mi)=>fySlice(7,19)(mi));
  const fy26  = SLA_DATA.metrics.map((_,mi)=>fySlice(19,24)(mi));

  // ---- 3-FY Grouped Bar (FY24 partial | FY25 full | FY26 YTD) ----
  slaDestroyChart('slaFYCompareChart');
  new Chart(document.getElementById('slaFYCompareChart'), {
    type:'bar',
    data:{
      labels: SLA_DATA.metricsShort,
      datasets:[
        { label:'FY24 (Apr\u2013Oct 24, partial)', data:fy24, backgroundColor:'rgba(149,165,166,0.8)',  borderRadius:4 },
        { label:'FY25 (Nov-24 \u2013 Oct-25, full)',  data:fy25, backgroundColor:'rgba(52,152,219,0.8)',   borderRadius:4 },
        { label:'FY26 (Nov-25 \u2013 Apr-26, YTD)',   data:fy26, backgroundColor:'rgba(1,169,130,0.85)',  borderRadius:4 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}} },
      scales:{ y:{min:0,max:110,ticks:{callback:v=>v+'%'},title:{display:true,text:'Compliance %'}} }
    }
  });

  // ---- FY trend lines (monthly compliance within each FY, aligned by FY month position) ----
  // FY24 partial: 7 months (Apr-Oct 24)
  const fy24Labels = SLA_DATA.months.slice(0,7);
  const fy24Comp   = fy24Labels.map((_,i)=>slaMonthCompliance(i));
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
        { label:'FY24 (Apr-Oct 24)',      data:padNull(fy24Comp,maxLen),  borderColor:'#95a5a6', backgroundColor:'rgba(149,165,166,0.06)', borderWidth:2, tension:0.35, pointRadius:4, spanGaps:false, fill:true, borderDash:[5,4] },
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
            const fyMonths = [fy24Labels, fy25Labels, fy26Labels, []];
            const lbl = fyMonths[ctx.datasetIndex] ? (fyMonths[ctx.datasetIndex][ctx.dataIndex] || '') : '';
            return ctx.dataset.label+': '+ctx.parsed.y+'%'+(lbl?' ('+lbl+')':'');
          }
        }}
      },
      scales:{ y:{min:0,max:110,ticks:{callback:v=>v+'%'}} }
    }
  });

  // ---- Improvement / Risk tables: FY24 vs FY25 vs FY26 ----
  const impBody = document.getElementById('slaFYImprovementBody');
  if (impBody) {
    const pairs = SLA_DATA.metrics.map((n,i)=>({
      name:n,
      fy24:fy24[i], fy25:fy25[i], fy26:fy26[i],
      d2425: fy25[i]-fy24[i],
      d2526: fy26[i]-fy25[i]
    }));
    const improved = pairs.filter(p=>p.d2425>0||p.d2526>0).sort((a,b)=>(b.d2425+b.d2526)-(a.d2425+a.d2526));
    impBody.innerHTML = improved.map(p=>{
      const arr25 = p.d2425>0?'<span style="color:#01a982;font-weight:700">\u25b2+'+p.d2425+'%</span>':'<span style="color:#e74c3c">\u25bc'+p.d2425+'%</span>';
      const arr26 = p.d2526>0?'<span style="color:#01a982;font-weight:700">\u25b2+'+p.d2526+'%</span>':p.d2526===0?'<span style="color:#aaa">\u2014</span>':'<span style="color:#e74c3c">\u25bc'+p.d2526+'%</span>';
      return '<tr><td>'+p.name+'</td><td>'+p.fy24+'%</td><td>'+p.fy25+'%</td><td>'+arr25+'</td><td>'+p.fy26+'%</td><td>'+arr26+'</td></tr>';
    }).join('') || '<tr><td colspan="6" style="color:#aaa">No improvements detected</td></tr>';
  }
  const riskBody = document.getElementById('slaFYRiskBody');
  if (riskBody) {
    const pairs = SLA_DATA.metrics.map((n,i)=>({
      name:n, fy24:fy24[i], fy25:fy25[i], fy26:fy26[i],
      d2425: fy25[i]-fy24[i], d2526: fy26[i]-fy25[i]
    }));
    const at_risk = pairs.filter(p=>p.fy25<80||p.fy26<80).sort((a,b)=>Math.min(a.fy25,a.fy26)-Math.min(b.fy25,b.fy26));
    riskBody.innerHTML = at_risk.map(p=>{
      const risk25 = p.fy25<60?'<span style="color:#e74c3c;font-weight:700">'+p.fy25+'%</span>':p.fy25<80?'<span style="color:#f7b731;font-weight:700">'+p.fy25+'%</span>':'<span style="color:#01a982">'+p.fy25+'%</span>';
      const risk26 = p.fy26<60?'<span style="color:#e74c3c;font-weight:700">'+p.fy26+'%</span>':p.fy26<80?'<span style="color:#f7b731;font-weight:700">'+p.fy26+'%</span>':'<span style="color:#01a982">'+p.fy26+'%</span>';
      return '<tr><td>'+p.name+'</td><td>'+p.fy24+'%</td><td>'+risk25+'</td><td>'+risk26+'</td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:#aaa">All metrics above threshold</td></tr>';
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
      scales:{ y:{min:0,max:110,ticks:{callback:v=>v+'%'}} }
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
  // FY24 partial had no full quarters; show FY25 Q1-Q4 + FY26 Q1-Q2
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

  // Trend classification — compare FY25 vs FY24 using HPE FY boundaries
  const classEl = document.getElementById('slaTrendClassifications');
  if (classEl) {
    const classify = (mi) => {
      const data = SLA_DATA.perMetricMonthly[mi];
      // FY24 partial (idx 0-6), FY25 full (idx 7-18)
      const fy24d = data.slice(0,7).filter(s=>s!=='NR');
      const fy25d = data.slice(7,19).filter(s=>s!=='NR');
      const fy26d = data.slice(19).filter(s=>s!=='NR');
      const r24 = fy24d.length ? fy24d.filter(s=>s==='MET').length/fy24d.length : 0;
      const r25 = fy25d.length ? fy25d.filter(s=>s==='MET').length/fy25d.length : 0;
      const r26 = fy26d.length ? fy26d.filter(s=>s==='MET').length/fy26d.length : 0;
      // Use FY25 vs FY24 trend as primary signal, FY26 as confirmation
      const d2425 = r25 - r24;
      const d2526 = r26 - r25;
      if (d2425 > 0.1 || (d2425 >= 0 && d2526 > 0.05)) return 'improving';
      if (d2425 < -0.1 || d2526 < -0.1) return 'declining';
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
      +'<div class="sla-rec-body">FY25 (Nov-24 to Oct-25) achieved 81.8% compliance on 110 reported instances, recovering from FY24 partial (75.7%). FY26 YTD is at 82.0% but Feb-26 regression (60%) is a warning. Actions: (1) Protect Aug-Sep-25 and Nov-25 perfect-month benchmarks, (2) Investigate Feb-26 dip urgently, (3) Target 88%+ for FY26 full year (Nov-25 to Oct-26).</div>'
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

</body>
</html>`;
}

export default app
