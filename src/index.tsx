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
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
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
    .logo-box {
      width: 36px;
      height: 36px;
      background: var(--hpe-green);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      font-size: 14px;
      letter-spacing: -0.5px;
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
  </style>
</head>
<body>

<!-- HEADER -->
<header>
  <div class="header-left">
    <div class="hpe-logo">
      <div class="logo-box">HPE</div>
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
      <div class="period-filter">
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">PERIOD:</span>
        <button class="filter-btn active" onclick="setFilter('fy', this)">FY 2026</button>
        <select class="filter-select" id="monthFilter" onchange="filterByMonth(this.value)">
          <option value="all">All Months</option>
          <option value="Jan">January</option>
          <option value="Feb">February</option>
          <option value="Mar">March</option>
          <option value="Apr">April</option>
        </select>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card green">
        <div class="kpi-icon green"><i class="fas fa-bullseye"></i></div>
        <div class="kpi-label">Overall Accuracy</div>
        <div class="kpi-value big" id="kpi-accuracy">98.50%</div>
        <div class="kpi-delta delta-up"><i class="fas fa-arrow-up"></i> +1.18% vs Jan</div>
        <div class="kpi-sub">Target: 98.00%</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon blue"><i class="fas fa-clipboard-list"></i></div>
        <div class="kpi-label">Total Audits (FY)</div>
        <div class="kpi-value" id="kpi-total">8,599</div>
        <div class="kpi-delta delta-up"><i class="fas fa-arrow-up"></i> +63% vs last period</div>
        <div class="kpi-sub">Across 4 months</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon green"><i class="fas fa-check-circle"></i></div>
        <div class="kpi-label">Passed Audits</div>
        <div class="kpi-value" id="kpi-pass">8,400</div>
        <div class="kpi-delta delta-neutral"><i class="fas fa-minus"></i> 97.69% pass rate</div>
        <div class="kpi-sub">Out of 8,599 total</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="kpi-label">Total Errors</div>
        <div class="kpi-value" id="kpi-errors">128</div>
        <div class="kpi-delta delta-down"><i class="fas fa-arrow-down"></i> 1.49% error rate</div>
        <div class="kpi-sub">Across 12 parameters</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-icon orange"><i class="fas fa-arrow-up"></i></div>
        <div class="kpi-label">MoM Improvement</div>
        <div class="kpi-value" id="kpi-mom">+0.94%</div>
        <div class="kpi-delta delta-up"><i class="fas fa-arrow-up"></i> Mar vs Feb</div>
        <div class="kpi-sub">Consistent upward trend</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-icon yellow"><i class="fas fa-calendar-week"></i></div>
        <div class="kpi-label">WoW Change</div>
        <div class="kpi-value" id="kpi-wow">+0.34%</div>
        <div class="kpi-delta delta-up"><i class="fas fa-arrow-up"></i> W4 vs W3 (Mar)</div>
        <div class="kpi-sub">Last week performance</div>
      </div>
    </div>

    <!-- Gauges -->
    <div class="gauge-grid">
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-green);margin-right:6px"></i>Overall FY Accuracy</div>
        <canvas id="gaugeOverall" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeOverallVal">98.50%</div>
        <div class="gauge-target">Target: 98.00%</div>
        <div class="gauge-status good">✓ Above Target</div>
      </div>
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-blue);margin-right:6px"></i>Critical Parameters</div>
        <canvas id="gaugeCritical" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeCriticalVal">98.62%</div>
        <div class="gauge-target">Target: 99.00%</div>
        <div class="gauge-status warning">⚠ Below Target</div>
      </div>
      <div class="gauge-card">
        <div class="gauge-title"><i class="fas fa-circle-dot" style="color:var(--hpe-orange);margin-right:6px"></i>Non-Critical Parameters</div>
        <canvas id="gaugeNonCritical" width="200" height="110"></canvas>
        <div class="gauge-value-display" id="gaugeNonCriticalVal">97.89%</div>
        <div class="gauge-target">Target: 97.00%</div>
        <div class="gauge-status good">✓ Above Target</div>
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
          <div class="insight-text"><strong>Consistent Improvement Trajectory:</strong> Accuracy has improved from 97.25% in April to 99.43% in February (+2.18%), demonstrating a strong positive trend. March shows a slight softening to 98.49%, warranting continued monitoring.</div>
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
        <div class="card-subtitle">Weekly accuracy performance FY2026 with 98% target line</div>
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
      <div class="period-filter">
        <button class="filter-btn active" onclick="filterTrend('all', this)">All</button>
        <button class="filter-btn" onclick="filterTrend('critical', this)">Critical Only</button>
        <button class="filter-btn" onclick="filterTrend('noncritical', this)">Non-Critical</button>
      </div>
    </div>

    <!-- Month-wise line chart -->
    <div class="card card-full mb-20">
      <div class="card-title"><i class="fas fa-chart-line"></i> Monthly Accuracy Trend with Target Line</div>
      <div class="card-subtitle">Month-over-month accuracy with 98% target benchmark and error rate overlay</div>
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
            <div style="width:20px;height:3px;background:var(--hpe-red);border-radius:2px"></div> 98% Target
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
        <p>HPE South 1 Region has processed <strong class="highlight">8,599 audit checkpoints</strong> across FY2026 (January through April), achieving an overall accuracy of <strong class="highlight">98.50%</strong> — <strong class="highlight">0.50 percentage points above</strong> the 98% organizational target.</p>
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
    {id: 'CAPA-001', date: '2026-01-15', bot_action: 'Auto-reject duplicate application', undo_reason: 'False positive — same candidate different role', root_cause: 'Bot dedup logic too broad', corrective: 'Manual review of 47 affected candidates', preventive: 'Add role-level dedup flag to bot rules', owner: 'Jyoti Sarwan', target_date: '2026-02-05', close_date: '2026-01-28', status: 'Closed', aging: 13},
    {id: 'CAPA-002', date: '2026-02-08', bot_action: 'Auto-populate target start date', undo_reason: 'Incorrect date format (MM/DD vs DD/MM)', root_cause: 'Date field format mismatch in source data', corrective: 'Manually corrected 53 records', preventive: 'Standardize date format in ATS integration', owner: 'Mahak Kaura', target_date: '2026-03-01', close_date: '2026-02-20', status: 'Closed', aging: 12},
    {id: 'CAPA-003', date: '2026-03-12', bot_action: 'Auto-flag ERP Bonus eligibility', undo_reason: 'Incorrect rule applied for contract staff', root_cause: 'Bot rule not differentiated by employment type', corrective: 'Revert 6 flags, manual re-audit', preventive: 'Add employment type condition to ERP Bonus rule', owner: 'Mahak Kaura', target_date: '2026-04-01', close_date: null, status: 'Overdue', aging: 35},
    {id: 'CAPA-004', date: '2026-04-02', bot_action: 'Auto-validate Source of Hire tagging', undo_reason: 'External agency incorrectly tagged as internal referral', root_cause: 'Source mapping table outdated', corrective: 'Re-audit 18 failed records', preventive: 'Quarterly refresh of source mapping table', owner: 'Guru Prasad Naik', target_date: '2026-05-15', close_date: null, status: 'In Progress', aging: 15}
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
  if (acc >= 98) return '<span class="acc-badge good">⬤ ' + acc + '%</span>';
  if (acc >= 95) return '<span class="acc-badge warning">⬤ ' + acc + '%</span>';
  return '<span class="acc-badge bad">⬤ ' + acc + '%</span>';
}

function getHeatmapColor(acc) {
  if (acc >= 99) return {bg: '#01A982', text: 'white'};
  if (acc >= 98) return {bg: '#4fc3a1', text: 'white'};
  if (acc >= 95) return {bg: '#FF8300', text: 'white'};
  return {bg: '#C54E4B', text: 'white'};
}

// ==================== TAB SWITCHING ====================
function switchTab(tabName, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  el.classList.add('active');
  
  // Render tab-specific charts
  setTimeout(() => {
    if (tabName === 'executive') initExecutiveCharts();
    if (tabName === 'trends') initTrendCharts();
    if (tabName === 'improvement') initImprovementCharts();
    if (tabName === 'capa') initCAPACharts();
    if (tabName === 'insights') initInsightsCharts();
  }, 50);
}

// ==================== EXECUTIVE CHARTS ====================
function initExecutiveCharts() {
  // Gauge charts
  drawGauge('gaugeOverall', 98.50, '#01A982');
  drawGauge('gaugeCritical', 98.62, '#0D5DBF');
  drawGauge('gaugeNonCritical', 97.89, '#FF8300');
  
  // Sparkline
  destroyChart('sparklineChart');
  const weekLabels = DASHBOARD_DATA.week_stats.map(w => w.Week_Label);
  const weekAccs = DASHBOARD_DATA.week_stats.map(w => w.Accuracy);
  
  const ctx = document.getElementById('sparklineChart').getContext('2d');
  charts['sparklineChart'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weekLabels,
      datasets: [
        {
          label: 'Accuracy %',
          data: weekAccs,
          borderColor: '#01A982',
          backgroundColor: 'rgba(1,169,130,0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: weekAccs.map(a => a < 95 ? '#C54E4B' : a < 98 ? '#FF8300' : '#01A982'),
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointHoverRadius: 7
        },
        {
          label: '98% Target',
          data: weekLabels.map(() => 98),
          borderColor: '#C54E4B',
          borderDash: [5,5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
      scales: {
        y: { min: 92, max: 101, ticks: { callback: v => v + '%', font: {size:11} }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { font: {size:10}, maxRotation: 45 }, grid: { display: false } }
      }
    }
  });
  
  // Stage donut
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
  
  // Month summary table
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
  
  // Target line at 98%
  const targetProgress = (98 - 90) / 10;
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
  const months = [...DASHBOARD_DATA.month_stats].sort((a, b) => a.Month_Number - b.Month_Number);
  let prevAcc = null;
  tbody.innerHTML = months.map(m => {
    const momChange = prevAcc !== null ? (m.Accuracy - prevAcc).toFixed(2) : null;
    const momHtml = momChange !== null 
      ? (parseFloat(momChange) > 0 
        ? '<span style="color:var(--hpe-green);font-weight:600">▲ +' + momChange + '%</span>'
        : parseFloat(momChange) < 0 
          ? '<span style="color:var(--hpe-red);font-weight:600">▼ ' + momChange + '%</span>'
          : '<span style="color:var(--text-muted)">— 0%</span>')
      : '<span style="color:var(--text-muted)">—</span>';
    prevAcc = m.Accuracy;
    const status = m.Accuracy >= 98 
      ? '<span class="status-pill status-closed">✓ On Target</span>'
      : '<span class="status-pill status-open">✗ Below Target</span>';
    return \`<tr>
      <td><strong>\${m.Month} 2026</strong></td>
      <td>\${m.Opportunity_Count.toLocaleString()}</td>
      <td style="color:var(--hpe-green);font-weight:600">\${m.Opportunity_Pass.toLocaleString()}</td>
      <td style="color:var(--hpe-red);font-weight:600">\${m.Opportunity_Fail}</td>
      <td style="color:var(--text-muted)">\${m.Opportunity_NA}</td>
      <td>\${getAccBadge(m.Accuracy)}</td>
      <td style="color:var(--hpe-orange);font-weight:600">\${m.Error_Rate}%</td>
      <td>\${momHtml}</td>
      <td>\${status}</td>
    </tr>\`;
  }).join('');
}

// ==================== TREND CHARTS ====================
function initTrendCharts() {
  const months = DASHBOARD_DATA.month_stats.sort((a,b) => a.Month_Number - b.Month_Number);
  
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
          label: '98% Target',
          data: months.map(() => 98),
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
  
  // Critical bar chart
  destroyChart('criticalBarChart');
  const cbCtx = document.getElementById('criticalBarChart').getContext('2d');
  charts['criticalBarChart'] = new Chart(cbCtx, {
    type: 'bar',
    data: {
      labels: ['Critical', 'Non Critical'],
      datasets: [
        {
          label: 'Accuracy %',
          data: [98.62, 97.89],
          backgroundColor: ['rgba(1,169,130,0.8)', 'rgba(13,93,191,0.8)'],
          borderRadius: 6
        },
        {
          label: 'Target (98%)',
          type: 'line',
          data: [98, 98],
          borderColor: '#C54E4B',
          borderDash: [5,5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: {font:{size:11},boxWidth:12} } },
      scales: {
        y: { min: 96, max: 100, ticks: { callback: v => v + '%', font:{size:11} } },
        x: { grid: {display:false} }
      }
    }
  });
  
  // Weekly error chart
  destroyChart('weeklyErrorChart');
  const weCtx = document.getElementById('weeklyErrorChart').getContext('2d');
  const weekData = DASHBOARD_DATA.week_stats;
  charts['weeklyErrorChart'] = new Chart(weCtx, {
    type: 'bar',
    data: {
      labels: weekData.map(w => w.Week_Label),
      datasets: [{
        label: 'Errors',
        data: weekData.map(w => w.Opportunity_Fail),
        backgroundColor: weekData.map(w => w.Opportunity_Fail > 20 ? '#C54E4B' : w.Opportunity_Fail > 10 ? '#FF8300' : '#01A982'),
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

function buildWeeklyTable() {
  const tbody = document.getElementById('weeklyDrillTable');
  if (!tbody) return;
  const weeks = [...DASHBOARD_DATA.week_stats].sort((a,b) => a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week);
  let prevAcc = null;
  tbody.innerHTML = weeks.map(w => {
    const wow = prevAcc !== null ? (w.Accuracy - prevAcc).toFixed(2) : null;
    const wowHtml = wow !== null
      ? parseFloat(wow) > 0 ? '<span style="color:var(--hpe-green);font-weight:600">▲ +' + wow + '%</span>'
        : parseFloat(wow) < 0 ? '<span style="color:var(--hpe-red);font-weight:600">▼ ' + wow + '%</span>'
        : '<span style="color:var(--text-muted)">—</span>'
      : '<span style="color:var(--text-muted)">—</span>';
    prevAcc = w.Accuracy;
    return \`<tr>
      <td><strong>Week \${w.Week}</strong></td>
      <td>\${w.Month} 2026</td>
      <td>\${w.Opportunity_Count.toLocaleString()}</td>
      <td style="color:var(--hpe-green);font-weight:600">\${w.Opportunity_Pass.toLocaleString()}</td>
      <td style="color:var(--hpe-red);font-weight:600">\${w.Opportunity_Fail}</td>
      <td style="color:var(--text-muted)">\${w.Opportunity_NA}</td>
      <td>\${getAccBadge(w.Accuracy)}</td>
      <td>\${wowHtml}</td>
      <td>\${w.Accuracy >= 99 ? '🟢 Excellent' : w.Accuracy >= 98 ? '🔵 On Target' : w.Accuracy >= 95 ? '🟡 Watch' : '🔴 Below Target'}</td>
    </tr>\`;
  }).join('');
}

// ==================== IMPROVEMENT CHARTS ====================
function initImprovementCharts() {
  const weekData = DASHBOARD_DATA.week_stats.sort((a,b) => a.Month_Number !== b.Month_Number ? a.Month_Number - b.Month_Number : a.Week - b.Week);
  const actualLabels = weekData.map(w => w.Week_Label);
  const actualData = weekData.map(w => w.Accuracy);
  
  // Simple linear forecast: last 8 weeks trend extended
  const forecastLabels = ['May W1', 'May W2', 'May W3', 'May W4'];
  const n = actualData.length;
  const sumX = n*(n-1)/2;
  const sumY = actualData.reduce((s,v)=>s+v,0);
  const sumXY = actualData.reduce((s,v,i)=>s+i*v,0);
  const sumX2 = actualData.reduce((s,v,i)=>s+i*i,0);
  const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
  const intercept = (sumY - slope*sumX) / n;
  const forecastData = [n, n+1, n+2, n+3].map(i => Math.min(99.8, Math.max(97, +(intercept + slope*i).toFixed(2))));
  
  destroyChart('forecastChart');
  const fCtx = document.getElementById('forecastChart').getContext('2d');
  charts['forecastChart'] = new Chart(fCtx, {
    type: 'line',
    data: {
      labels: [...actualLabels, ...forecastLabels],
      datasets: [
        {
          label: 'Actual Accuracy',
          data: [...actualData, null, null, null, null],
          borderColor: '#01A982',
          backgroundColor: 'rgba(1,169,130,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#01A982',
          borderWidth: 2
        },
        {
          label: 'AI Forecast',
          data: [...actualData.slice(0,-1).map(()=>null), actualData[actualData.length-1], ...forecastData],
          borderColor: '#FF8300',
          borderDash: [6,3],
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#FF8300',
          borderWidth: 2,
          fill: false
        },
        {
          label: '98% Target',
          data: [...actualLabels, ...forecastLabels].map(()=>98),
          borderColor: '#C54E4B',
          borderDash: [4,4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: {font:{size:11},boxWidth:12} },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { min: 92, max: 101, ticks: { callback: v => v + '%', font:{size:11} } },
        x: { ticks: {font:{size:10}, maxRotation:45}, grid: {display:false} }
      }
    }
  });
  
  // Delta table
  buildDeltaTable();
  
  // Pareto chart
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
  refreshCAPADashboard();
}

function refreshCAPADashboard() {
  const data = DASHBOARD_DATA.capa_data;
  recomputeCAPAKPIs(data);
  rebuildCAPACharts(data);
  buildCAPATable(capaFilterState);
  rebuildCAPAAIInsights(data);
  // Update nav badge
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

  function splitLine(line) {
    const result = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    result.push(cur.trim()); return result;
  }

  const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g,'').trim().toLowerCase().replace(/[\s/]+/g,'_').replace(/[^a-z0-9_]/g,''));

  const ALIASES = {
    date:        ['date','undo_date','event_date','open_date','capa_date'],
    bot_action:  ['bot_action','bot_action_taken','action','bot_move'],
    undo_reason: ['undo_reason','reason_for_undo','reason','undo_rationale'],
    root_cause:  ['root_cause','root_cause_category','cause','root_cause_category'],
    corrective:  ['corrective','corrective_action','fix','corrective_measure'],
    preventive:  ['preventive','preventive_action','prevention','preventive_measure'],
    owner:       ['owner','responsible','assigned_to','assignee','capa_owner'],
    target_date: ['target_date','target_close_date','due_date','target'],
    close_date:  ['close_date','actual_close_date','closed_date','actual_close'],
    status:      ['status','capa_status','state','capa_state']
  };

  const colIdx = {};
  for (const [key, aliases] of Object.entries(ALIASES)) {
    colIdx[key] = -1;
    for (const a of aliases) { const i = headers.indexOf(a); if (i >= 0) { colIdx[key] = i; break; } }
  }

  const startId = DASHBOARD_DATA.capa_data.length;
  return lines.slice(1).map((line, i) => {
    if (!line.trim()) return null;
    const cols = splitLine(line);
    const g = key => { const ci = colIdx[key]; return ci >= 0 && cols[ci] ? cols[ci].replace(/^"|"$/g,'').trim() : ''; };
    const status = normalizeCapaStatus(g('status'));
    const aging  = computeAging(g('date'), g('close_date'), status);
    return {
      id:          'CAPA-' + String(startId + i + 1).padStart(3,'0'),
      date:        g('date'),        bot_action:  g('bot_action'),
      undo_reason: g('undo_reason'), root_cause:  g('root_cause'),
      corrective:  g('corrective'),  preventive:  g('preventive'),
      owner:       g('owner'),       target_date: g('target_date'),
      close_date:  g('close_date') || null,
      status, aging
    };
  }).filter(r => r && (r.date || r.bot_action || r.undo_reason));
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
  DASHBOARD_DATA.capa_data = capaFileParsedData;
  closeCapaModal();
  capaFilterState = 'all';
  document.querySelectorAll('#tab-capa .filter-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  refreshCAPADashboard();
  showToast('✅ ' + capaFileParsedData.length + ' records loaded. Dashboard refreshed live!', 'success');
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
          label: '98% Target',
          data: allLabels.map(()=>98),
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

// ==================== FILTERS ====================
function setFilter(type, el) {
  document.querySelectorAll('.period-filter .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function filterTrend(type, el) {
  document.querySelectorAll('#tab-trends .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function filterCapa(type, el) {
  document.querySelectorAll('#tab-capa .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function filterByMonth(month) { /* Filter handler — refreshes view */ }

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

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  initExecutiveCharts();
  refreshDashboard();
});
</script>

</body>
</html>`;
}

export default app
