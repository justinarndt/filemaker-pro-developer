/* ============================================================================
   THE LANCASTER HUB — Core Application Engine
   ============================================================================
   FileMaker Pro 2026 Portfolio — Justin Arndt
   Simulates: Script Workspace, Layout Switching, Record Navigation, RBAC
   ============================================================================ */

"use strict";

/* ── Global State ── */
const APP = {
  data: { patients: [], claims: [], providers: [], medications: [], pharmacies: [], audit_log: [] },
  currentLayout: 'dashboard',
  currentRole: 'pharmacist',
  currentRecord: { patients: 0, claims: 0, providers: 0, medications: 0 },
  foundSet: { patients: [], claims: [], providers: [], medications: [] },
  mode: 'browse', // browse | find | preview
  ready: false
};

/* ── RBAC Privilege Matrix (mirrors FileMaker Privilege Sets) ── */
const RBAC = {
  pharmacist: { label: 'Pharmacist (Full Access)', create: true, read: true, update: true, delete: false, approve: true, layouts: ['dashboard','patients','providers','medications','claims','audit','erd','scripts','security','about'] },
  technician: { label: 'Technician (Limited)', create: true, read: true, update: 'limited', delete: false, approve: false, layouts: ['dashboard','patients','providers','medications','claims','about'] },
  auditor: { label: 'Auditor (Read-Only)', create: false, read: true, update: false, delete: false, approve: false, layouts: ['dashboard','patients','providers','medications','claims','audit','about'] }
};

/* ── Data Loading ── */
async function loadAllData() {
  const files = ['patients','claims','providers','medications','pharmacies','audit_log'];
  const results = await Promise.all(files.map(f =>
    fetch(`data/${f}.json`).then(r => r.json()).catch(() => [])
  ));
  files.forEach((f, i) => { APP.data[f] = results[i]; });
  // Initialize found sets (all records)
  ['patients','claims','providers','medications'].forEach(t => {
    APP.foundSet[t] = APP.data[t].map((_, i) => i);
  });
  updateSidebarBadges();
}

function updateSidebarBadges() {
  document.querySelectorAll('.fm-sidebar-item[data-layout]').forEach(el => {
    const layout = el.dataset.layout;
    const badge = el.querySelector('.badge');
    if (badge && APP.data[layout]) badge.textContent = APP.data[layout].length;
  });
}

/* ── Layout Switching (mirrors FM Go To Layout[]) ── */
function switchLayout(el) {
  const layout = typeof el === 'string' ? el : el.dataset.layout;

  // RBAC check
  if (!RBAC[APP.currentRole].layouts.includes(layout)) {
    showToast('Access denied for current privilege set', 'error');
    return;
  }

  // Update sidebar active state
  document.querySelectorAll('.fm-sidebar-item').forEach(s => s.classList.remove('active'));
  const sidebarEl = document.querySelector(`.fm-sidebar-item[data-layout="${layout}"]`);
  if (sidebarEl) sidebarEl.classList.add('active');

  APP.currentLayout = layout;
  document.getElementById('toolbar-layout-name').textContent = getLayoutTitle(layout);
  renderLayout(layout);
  updateRecordIndicator();
}

function getLayoutTitle(layout) {
  const titles = {
    dashboard: 'Dashboard', patients: 'Patients — Form View', providers: 'Providers — List View',
    medications: 'Medications — Form View', claims: 'Claims — Processing',
    audit: 'Audit Trail — Read Only', erd: 'Relationship Graph', scripts: 'Script Workspace',
    security: 'Security — Manage Privileges', about: 'About This Solution'
  };
  return titles[layout] || layout;
}

/* ── Record Navigation (mirrors FM Book/Slider) ── */
function getActiveTable() {
  const map = { patients: 'patients', providers: 'providers', medications: 'medications', claims: 'claims' };
  return map[APP.currentLayout] || null;
}

function navFirst() { const t = getActiveTable(); if (t) { APP.currentRecord[t] = 0; renderLayout(APP.currentLayout); updateRecordIndicator(); } }
function navPrev()  { const t = getActiveTable(); if (t && APP.currentRecord[t] > 0) { APP.currentRecord[t]--; renderLayout(APP.currentLayout); updateRecordIndicator(); } }
function navNext()  { const t = getActiveTable(); if (t && APP.currentRecord[t] < APP.foundSet[t].length - 1) { APP.currentRecord[t]++; renderLayout(APP.currentLayout); updateRecordIndicator(); } }
function navLast()  { const t = getActiveTable(); if (t) { APP.currentRecord[t] = APP.foundSet[t].length - 1; renderLayout(APP.currentLayout); updateRecordIndicator(); } }

function goToRecord(table, index) {
  APP.currentRecord[table] = index;
  if (APP.currentLayout === table) { renderLayout(table); updateRecordIndicator(); }
}

function updateRecordIndicator() {
  const t = getActiveTable();
  const el = document.getElementById('record-indicator');
  if (t && APP.foundSet[t].length > 0) {
    el.textContent = `Record ${APP.currentRecord[t] + 1} of ${APP.foundSet[t].length}`;
  } else if (t) {
    el.textContent = 'No Records';
  } else {
    el.textContent = '—';
  }
}

/* ── Role Switching (mirrors FM Re-Login) ── */
function switchRole(role) {
  APP.currentRole = role;
  const priv = RBAC[role];
  document.getElementById('user-role-display').textContent = priv.label;
  // Audit the role switch
  logAuditEntry('System', null, 'LOGIN', null, null, null);
  // Re-check current layout access
  if (!priv.layouts.includes(APP.currentLayout)) {
    switchLayout('dashboard');
  } else {
    renderLayout(APP.currentLayout);
  }
  showToast(`Switched to ${priv.label}`, 'info');
}

/* ── Audit Trail Engine (mirrors OnRecordCommit trigger) ── */
function logAuditEntry(tableName, recordId, action, fieldName, oldVal, newVal) {
  const entry = {
    __pk_AuditID: generateUUID(),
    Timestamp: new Date().toISOString(),
    Account_Name: APP.currentRole + '@epls.com',
    Table_Name: tableName,
    Record_ID: recordId || generateUUID(),
    Action: action,
    Field_Name: fieldName,
    Old_Value: oldVal,
    New_Value: newVal,
    IP_Address: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
    Session_ID: generateUUID().substring(0, 8).toUpperCase()
  };
  APP.data.audit_log.unshift(entry);
}

/* ── Toast Notifications ── */
function showToast(msg, type) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:40px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:6px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colors = { info: '#0066cc', error: '#cc3333', success: '#2d8a4e', warning: '#cc8800' };
  toast.style.cssText = `padding:8px 16px;border-radius:4px;color:#fff;font-size:12px;font-family:var(--font-ui);background:${colors[type]||colors.info};box-shadow:0 2px 8px rgba(0,0,0,.3);animation:fadeIn .2s;`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

/* ── Popover System (mirrors FM Popover buttons) ── */
function openPopover(title, bodyHtml) {
  document.getElementById('popover-title').textContent = title;
  document.getElementById('popover-body').innerHTML = bodyHtml;
  document.getElementById('popover-overlay').classList.add('active');
}
function closePopover() {
  document.getElementById('popover-overlay').classList.remove('active');
}

/* ── Utility Functions ── */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }).toUpperCase();
}

function fmt(val, fallback) { return val != null && val !== '' ? val : (fallback || '—'); }
function fmtDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); } catch { return iso; } }
function fmtDateTime(iso) { if (!iso) return '—'; try { const d = new Date(iso); return d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }); } catch { return iso; } }
function fmtCurrency(n) { if (n == null) return '—'; return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function statusBadge(status) {
  const map = { Approved: 'approved', Pending: 'pending', Denied: 'denied', Active: 'active', Inactive: 'inactive', 'In Review': 'review', 'Under Review': 'review', Open: 'pending', Closed: 'approved', INSERT: 'active', UPDATE: 'pending', LOGIN: 'review', APPROVE: 'approved' };
  const cls = map[status] || 'pending';
  return `<span class="fm-status-badge ${cls}">${escHtml(status || 'Unknown')}</span>`;
}

/* ── Clock ── */
function startClock() {
  const tick = () => {
    const el = document.getElementById('current-time');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}

/* ── New Record / Delete Record (toolbar buttons) ── */
function newRecord() {
  const t = getActiveTable();
  if (!t) { showToast('Select a data layout first', 'warning'); return; }
  if (!RBAC[APP.currentRole].create) { showToast('Create access denied', 'error'); return; }
  showToast(`New ${t.slice(0,-1)} record — (demo mode)`, 'info');
}

function deleteRecord() {
  showToast('Delete is restricted per EPLS policy', 'error');
}

function syncMedications() {
  showToast('Sync_Medication_Data — Fetching from OpenFDA...', 'info');
  setTimeout(() => showToast(`${APP.data.medications.length} medications in found set`, 'success'), 1500);
}

/* ── Master Layout Renderer (dispatcher) ── */
function renderLayout(layout) {
  const main = document.getElementById('main-content');
  const renderers = {
    dashboard: renderDashboard, patients: renderPatients, providers: renderProviders,
    medications: renderMedications, claims: renderClaims, audit: renderAudit,
    erd: renderERD, scripts: renderScripts, security: renderSecurity, about: renderAbout
  };
  const fn = renderers[layout];
  if (fn) fn(main); else main.innerHTML = `<div class="fm-card"><div class="fm-card-header">${escHtml(layout)}</div><div class="fm-card-body">Layout not implemented.</div></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT RENDERERS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Dashboard ── */
function renderDashboard(el) {
  const stats = {
    patients: APP.data.patients.length,
    providers: APP.data.providers.length,
    medications: APP.data.medications.length,
    claims: APP.data.claims.length,
    pendingClaims: APP.data.claims.filter(c => c.Approval_Status === 'Pending' || c.Approval_Status === 'Under Review').length,
    approvedClaims: APP.data.claims.filter(c => c.Approval_Status === 'Approved').length,
    deniedClaims: APP.data.claims.filter(c => c.Approval_Status === 'Denied').length,
    totalBilled: APP.data.claims.reduce((s, c) => s + (c.Total_Claim_Amount || 0), 0),
    recentAudit: APP.data.audit_log.slice(0, 8)
  };
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${kpiCard('👤', 'Active Patients', stats.patients, '#0066cc')}
      ${kpiCard('📋', 'Total Claims', stats.claims, '#cc8800')}
      ${kpiCard('⏳', 'Pending Approval', stats.pendingClaims, '#cc3333')}
      ${kpiCard('💰', 'Total Billed', fmtCurrency(stats.totalBilled), '#2d8a4e')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div class="fm-card"><div class="fm-card-header">Claims Status Distribution</div><div class="fm-card-body">
        <div style="display:flex;gap:8px;align-items:flex-end;height:120px;padding:8px 0;">
          ${barSegment('Approved', stats.approvedClaims, stats.claims, '#2d8a4e')}
          ${barSegment('Pending', stats.pendingClaims, stats.claims, '#cc8800')}
          ${barSegment('Denied', stats.deniedClaims, stats.claims, '#cc3333')}
          ${barSegment('In Review', stats.claims - stats.approvedClaims - stats.pendingClaims - stats.deniedClaims, stats.claims, '#0066cc')}
        </div>
      </div></div>
      <div class="fm-card"><div class="fm-card-header">Provider Network</div><div class="fm-card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          ${kpiMini('🏥', 'Practices', stats.providers)}
          ${kpiMini('💊', 'Medications', stats.medications)}
          ${kpiMini('🏪', 'Pharmacies', APP.data.pharmacies.length)}
          ${kpiMini('📜', 'Audit Entries', APP.data.audit_log.length)}
        </div>
      </div></div>
    </div>
    <div class="fm-card"><div class="fm-card-header">Recent Audit Activity (Last 8 Events)</div><div class="fm-card-body" style="padding:0;">
      <table class="fm-portal-table">
        <thead><tr><th>Time</th><th>User</th><th>Table</th><th>Action</th><th>Field</th><th>Old → New</th></tr></thead>
        <tbody>${stats.recentAudit.map(a => `<tr>
          <td style="font-family:var(--font-data);font-size:11px;">${fmtDateTime(a.Timestamp)}</td>
          <td>${escHtml(a.Account_Name)}</td>
          <td>${escHtml(a.Table_Name)}</td>
          <td>${statusBadge(a.Action)}</td>
          <td>${escHtml(a.Field_Name || '—')}</td>
          <td style="font-size:11px;">${a.Old_Value ? escHtml(a.Old_Value)+' → '+escHtml(a.New_Value) : '—'}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div></div>`;
}

function kpiCard(icon, label, value, color) {
  return `<div class="fm-card" style="cursor:pointer;" onmouseenter="this.style.borderColor='${color}'" onmouseleave="this.style.borderColor=''">
    <div class="fm-card-body" style="text-align:center;padding:16px 12px;">
      <div style="font-size:24px;margin-bottom:4px;">${icon}</div>
      <div style="font-size:22px;font-weight:700;color:${color};font-family:var(--font-data);">${typeof value==='number'?value.toLocaleString():value}</div>
      <div style="font-size:11px;color:#888;margin-top:2px;">${label}</div>
    </div></div>`;
}
function kpiMini(icon, label, value) {
  return `<div style="background:#f7f9fc;border-radius:4px;padding:8px;text-align:center;">
    <div style="font-size:16px;">${icon}</div>
    <div style="font-size:16px;font-weight:700;font-family:var(--font-data);">${value}</div>
    <div style="font-size:10px;color:#888;">${label}</div></div>`;
}
function barSegment(label, count, total, color) {
  const pct = total > 0 ? Math.max(5, (count / total) * 100) : 5;
  return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
    <div style="width:100%;background:#eee;border-radius:3px;position:relative;height:100%;display:flex;align-items:flex-end;">
      <div style="width:100%;height:${pct}%;background:${color};border-radius:3px;transition:height .5s;"></div>
    </div>
    <div style="font-size:11px;font-weight:600;color:${color};">${count}</div>
    <div style="font-size:10px;color:#888;">${label}</div></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATION BOOT SEQUENCE
   (mirrors FileMaker OnFirstWindowOpen trigger script)
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadAllData();
    APP.ready = true;

    // Dismiss loading screen, reveal app
    const loader = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    if (loader) { loader.style.opacity = '0'; loader.style.transition = 'opacity .4s'; setTimeout(() => loader.remove(), 400); }
    if (app) app.style.display = '';

    // Render initial layout
    renderLayout('dashboard');
    updateRecordIndicator();
    startClock();

    // Log session start
    logAuditEntry('System', null, 'LOGIN', null, null, null);

    console.log('[LancasterHub] Ready —', APP.data.patients.length, 'patients,', APP.data.claims.length, 'claims,', APP.data.medications.length, 'medications loaded.');
  } catch (err) {
    console.error('[LancasterHub] Boot failed:', err);
    document.getElementById('main-content').innerHTML = `<div class="fm-card"><div class="fm-card-body" style="color:#cc3333;">Error loading data: ${err.message}</div></div>`;
  }
});
