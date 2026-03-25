/* ============================================================================
   THE LANCASTER HUB — Layout Renderers (Part 2)
   ============================================================================
   Patients, Providers, Medications, Claims, Audit, ERD, Scripts, Security, About
   ============================================================================ */

/* ── Patients (Master-Detail Form View) ── */
function renderPatients(el) {
  const fs = APP.foundSet.patients;
  if (!fs.length) { el.innerHTML = '<div class="fm-card"><div class="fm-card-body">No records found.</div></div>'; return; }
  const rec = APP.data.patients[fs[APP.currentRecord.patients]];
  if (!rec) return;
  const provider = APP.data.providers.find(p => p.__pk_ProviderID === rec._fk_PrimaryProviderID);
  const claims = APP.data.claims.filter(c => c._fk_PatientID === rec.__pk_PatientID);

  el.innerHTML = `
    <div class="fm-tab-control">
      <div class="fm-tab-bar">
        <div class="fm-tab active" data-tab="pt-detail" onclick="switchTab(this)">Detail</div>
        <div class="fm-tab" data-tab="pt-claims" onclick="switchTab(this)">Claims (${claims.length})</div>
        <div class="fm-tab" data-tab="pt-history" onclick="switchTab(this)">History</div>
      </div>
      <div class="fm-tab-panel active" id="pt-detail">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="fm-card"><div class="fm-card-header">Patient Information</div><div class="fm-card-body">
            <div class="fm-form-grid">
              ${fieldRow('Patient ID', rec.__pk_PatientID, 'data', true)}
              ${fieldRow('First Name', rec.Name_First)}
              ${fieldRow('Last Name', rec.Name_Last)}
              ${fieldRow('Date of Birth', fmtDate(rec.DOB))}
              ${fieldRow('Gender', rec.Gender)}
              ${fieldRow('SSN (Last 4)', rec.SSN_Last4 ? '***-**-' + rec.SSN_Last4 : '—')}
            </div>
          </div></div>
          <div class="fm-card"><div class="fm-card-header">Contact & Insurance</div><div class="fm-card-body">
            <div class="fm-form-grid">
              ${fieldRow('Address', rec.Address_Street)}
              ${fieldRow('City / State / Zip', `${fmt(rec.Address_City)}, ${fmt(rec.Address_State)} ${fmt(rec.Address_Zip)}`)}
              ${fieldRow('Phone', rec.Phone)}
              ${fieldRow('Insurance', rec.Insurance_Provider)}
              ${fieldRow('Policy #', rec.Insurance_PolicyNum)}
              ${fieldRow('Group #', rec.Insurance_GroupNum)}
            </div>
          </div></div>
        </div>
        ${provider ? `<div class="fm-card" style="margin-top:12px;"><div class="fm-card-header">Primary Provider (Lookup)</div><div class="fm-card-body">
          <div class="fm-form-grid" style="grid-template-columns:repeat(3,1fr);">
            ${fieldRow('Practice', provider.Name_Practice)}
            ${fieldRow('Provider', 'Dr. ' + provider.Name_First + ' ' + provider.Name_Last)}
            ${fieldRow('Specialty', provider.Specialty)}
            ${fieldRow('NPI', provider.NPI, 'data')}
            ${fieldRow('Phone', provider.Phone)}
            ${fieldRow('Status', provider.Status)}
          </div>
        </div></div>` : ''}
        <div class="fm-card" style="margin-top:12px;"><div class="fm-card-header">Metadata</div><div class="fm-card-body">
          <div class="fm-form-grid" style="grid-template-columns:repeat(3,1fr);">
            ${fieldRow('Created', fmtDateTime(rec.z_CreatedTimestamp))}
            ${fieldRow('Modified', fmtDateTime(rec.z_ModifiedTimestamp))}
            ${fieldRow('Created By', rec.z_CreatedBy)}
          </div>
        </div></div>
      </div>
      <div class="fm-tab-panel" id="pt-claims">
        ${claims.length ? `<table class="fm-portal-table"><thead><tr><th>Claim ID</th><th>Type</th><th>Status</th><th>Billed</th><th>Date</th></tr></thead>
          <tbody>${claims.map(c => `<tr class="fm-portal-row" onclick="goToRecord('claims',${APP.data.claims.indexOf(c)});switchLayout('claims');">
            <td style="font-family:var(--font-data);font-size:11px;">${escHtml(c.__pk_ClaimID.substring(0,8))}…</td>
            <td>${escHtml(c.Claim_Type)}</td><td>${statusBadge(c.Approval_Status)}</td>
            <td>${fmtCurrency(c.Total_Claim_Amount)}</td><td>${fmtDate(c.Claim_Date)}</td>
          </tr>`).join('')}</tbody></table>` : '<p style="color:#888;padding:16px;">No claims linked to this patient.</p>'}
      </div>
      <div class="fm-tab-panel" id="pt-history">
        <p style="color:#888;padding:16px;">Audit history for patient ${escHtml(rec.Name_Last)}, ${escHtml(rec.Name_First)} — ${APP.data.audit_log.filter(a => a.Record_ID === rec.__pk_PatientID).length} events found.</p>
        <table class="fm-portal-table"><thead><tr><th>Time</th><th>Action</th><th>Field</th><th>Change</th></tr></thead>
          <tbody>${APP.data.audit_log.filter(a => a.Record_ID === rec.__pk_PatientID).slice(0,10).map(a => `<tr>
            <td style="font-family:var(--font-data);font-size:11px;">${fmtDateTime(a.Timestamp)}</td>
            <td>${statusBadge(a.Action)}</td><td>${escHtml(a.Field_Name||'—')}</td>
            <td style="font-size:11px;">${a.Old_Value ? escHtml(a.Old_Value)+' → '+escHtml(a.New_Value) : '—'}</td>
          </tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;">
      <input type="text" class="fm-field-input" id="patient-search" placeholder="Quick Find: type patient name..." style="flex:1;" oninput="filterPatients(this.value)">
    </div>`;
}

/* ── Providers (List View) ── */
function renderProviders(el) {
  const fs = APP.foundSet.providers;
  el.innerHTML = `
    <div class="fm-card"><div class="fm-card-header">Provider Network — ${fs.length} Records
      <input type="text" class="fm-field-input" placeholder="Search providers..." style="float:right;width:200px;height:22px;font-size:11px;" oninput="filterProviders(this.value)">
    </div><div class="fm-card-body" style="padding:0;max-height:calc(100vh - 200px);overflow-y:auto;">
      <table class="fm-portal-table"><thead><tr><th>Practice</th><th>Provider</th><th>NPI</th><th>Specialty</th><th>City</th><th>Phone</th><th>Status</th></tr></thead>
        <tbody>${fs.map((idx,i) => { const p = APP.data.providers[idx]; return `<tr class="fm-portal-row ${i===APP.currentRecord.providers?'selected':''}" onclick="goToRecord('providers',${i});renderProviders(document.getElementById('main-content'));">
          <td style="font-weight:500;">${escHtml(p.Name_Practice)}</td>
          <td>Dr. ${escHtml(p.Name_First)} ${escHtml(p.Name_Last)}</td>
          <td style="font-family:var(--font-data);font-size:11px;">${escHtml(p.NPI)}</td>
          <td>${escHtml(p.Specialty)}</td><td>${escHtml(p.Address_City)}</td>
          <td>${escHtml(p.Phone)}</td><td>${statusBadge(p.Status)}</td>
        </tr>`; }).join('')}</tbody></table>
    </div></div>`;
}

/* ── Medications (Form View) ── */
function renderMedications(el) {
  const fs = APP.foundSet.medications;
  if (!fs.length) { el.innerHTML = '<div class="fm-card"><div class="fm-card-body">No medications found.</div></div>'; return; }
  const rec = APP.data.medications[fs[APP.currentRecord.medications]];
  if (!rec) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
      <div class="fm-card"><div class="fm-card-header">Medication Detail — ${escHtml(rec.Brand_Name)}</div><div class="fm-card-body">
        <div class="fm-form-grid">
          ${fieldRow('Brand Name', rec.Brand_Name)}
          ${fieldRow('Generic Name', rec.Generic_Name)}
          ${fieldRow('NDC', rec.NDC, 'data')}
          ${fieldRow('Manufacturer', rec.Manufacturer)}
          ${fieldRow('Dosage Form', rec.Dosage_Form)}
          ${fieldRow('Strength', rec.Strength)}
          ${fieldRow('Route', rec.Route)}
          ${fieldRow('DEA Schedule', rec.DEA_Schedule || 'Non-Scheduled')}
          ${fieldRow('Price', fmtCurrency(rec.Current_Price))}
          ${fieldRow('Status', rec.Status)}
        </div>
      </div></div>
      <div>
        <div class="fm-card"><div class="fm-card-header">Indications</div><div class="fm-card-body">
          <p style="font-size:12px;line-height:1.5;color:#444;">${escHtml(rec.Indications_Text || '—')}</p>
        </div></div>
        <div class="fm-card" style="margin-top:12px;"><div class="fm-card-header">JSON Payload (API Cache)</div><div class="fm-card-body">
          <pre style="font-family:var(--font-data);font-size:10px;white-space:pre-wrap;background:#f5f5f5;padding:8px;border-radius:3px;max-height:120px;overflow-y:auto;">${escHtml(rec.JSON_Payload || '{}')}</pre>
        </div></div>
      </div>
    </div>
    <div style="margin-top:12px;">
      <input type="text" class="fm-field-input" id="med-search" placeholder="Drug Search: enter brand or generic name..." style="width:100%;" oninput="filterMedications(this.value)">
    </div>`;
}

/* ── Claims (Processing View) ── */
function renderClaims(el) {
  const fs = APP.foundSet.claims;
  if (!fs.length) { el.innerHTML = '<div class="fm-card"><div class="fm-card-body">No claims in found set.</div></div>'; return; }
  const rec = APP.data.claims[fs[APP.currentRecord.claims]];
  if (!rec) return;
  const patient = APP.data.patients.find(p => p.__pk_PatientID === rec._fk_PatientID);
  const provider = APP.data.providers.find(p => p.__pk_ProviderID === rec._fk_ProviderID);
  const med = APP.data.medications.find(m => m.__pk_MedID === rec._fk_ScriptID);
  const pharmacy = APP.data.pharmacies.find(p => p.__pk_PharmacyID === rec._fk_PharmacyID);
  const canApprove = RBAC[APP.currentRole].approve && (rec.Approval_Status === 'Pending' || rec.Approval_Status === 'Under Review');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="fm-card"><div class="fm-card-header">Claim ${escHtml(rec.__pk_ClaimID.substring(0,8))}… — ${statusBadge(rec.Approval_Status)}</div><div class="fm-card-body">
        <div class="fm-form-grid">
          ${fieldRow('Claim ID', rec.__pk_ClaimID, 'data', true)}
          ${fieldRow('Type', rec.Claim_Type)}
          ${fieldRow('Claim Date', fmtDate(rec.Claim_Date))}
          ${fieldRow('Status', rec.Status)}
          ${fieldRow('Total Amount', fmtCurrency(rec.Total_Claim_Amount))}
          ${fieldRow('Drug Price (Lookup)', fmtCurrency(rec.Lookup_DrugPrice))}
          ${fieldRow('Copay', fmtCurrency(rec.Copay_Amount))}
          ${fieldRow('Deductible', fmtCurrency(rec.Deductible_Applied))}
          ${fieldRow('Plan Paid', fmtCurrency(rec.Plan_Paid))}
          ${fieldRow('Patient Responsibility', fmtCurrency(rec.Patient_Responsibility))}
        </div>
        ${canApprove ? `<div style="margin-top:12px;display:flex;gap:8px;">
          <button class="fm-btn fm-btn-primary" onclick="approveClaim('${rec.__pk_ClaimID}')">✓ Approve</button>
          <button class="fm-btn fm-btn-danger" onclick="denyClaim('${rec.__pk_ClaimID}')">✕ Deny</button>
        </div>` : ''}
      </div></div>
      <div>
        ${patient ? `<div class="fm-card"><div class="fm-card-header">Patient (Lookup)</div><div class="fm-card-body">
          <div class="fm-form-grid">${fieldRow('Name', patient.Name_First + ' ' + patient.Name_Last)}${fieldRow('DOB', fmtDate(patient.DOB))}${fieldRow('Insurance', patient.Insurance_Provider)}${fieldRow('Policy #', patient.Insurance_PolicyNum)}</div>
        </div></div>` : ''}
        ${med ? `<div class="fm-card" style="margin-top:12px;"><div class="fm-card-header">Medication (Lookup)</div><div class="fm-card-body">
          <div class="fm-form-grid">${fieldRow('Drug', med.Brand_Name)}${fieldRow('Generic', med.Generic_Name)}${fieldRow('NDC', med.NDC, 'data')}${fieldRow('Price', fmtCurrency(med.Current_Price))}</div>
        </div></div>` : ''}
        ${pharmacy ? `<div class="fm-card" style="margin-top:12px;"><div class="fm-card-header">Pharmacy</div><div class="fm-card-body">
          <div class="fm-form-grid">${fieldRow('Name', pharmacy.Name)}${fieldRow('Type', pharmacy.Type)}${fieldRow('NCPDP', pharmacy.NCPDP_ID, 'data')}</div>
        </div></div>` : ''}
      </div>
    </div>`;
}

function approveClaim(id) {
  const claim = APP.data.claims.find(c => c.__pk_ClaimID === id);
  if (claim) {
    logAuditEntry('Claims', id, 'APPROVE', 'Approval_Status', 'Pending', 'Approved');
    claim.Approval_Status = 'Approved';
    claim.Approved_By = APP.currentRole + '@epls.com';
    claim.Approved_Timestamp = new Date().toISOString();
    showToast('Claim approved — electronic signature captured', 'success');
    renderLayout('claims');
  }
}
function denyClaim(id) {
  const claim = APP.data.claims.find(c => c.__pk_ClaimID === id);
  if (claim) {
    logAuditEntry('Claims', id, 'UPDATE', 'Approval_Status', 'Pending', 'Denied');
    claim.Approval_Status = 'Denied';
    showToast('Claim denied', 'warning');
    renderLayout('claims');
  }
}

/* ── Audit Trail (Read-Only List) ── */
function renderAudit(el) {
  const logs = APP.data.audit_log.slice(0, 100);
  el.innerHTML = `
    <div class="fm-card"><div class="fm-card-header">Audit Trail — ALCOA+ Compliant (${APP.data.audit_log.length} total entries)
      <span style="float:right;font-size:10px;color:#888;">Read-Only • Immutable • 21 CFR Part 11</span>
    </div><div class="fm-card-body" style="padding:0;max-height:calc(100vh - 200px);overflow-y:auto;">
      <table class="fm-portal-table"><thead><tr><th>Timestamp</th><th>Account</th><th>Table</th><th>Action</th><th>Field</th><th>Old Value</th><th>New Value</th><th>IP</th><th>Session</th></tr></thead>
        <tbody>${logs.map(a => `<tr>
          <td style="font-family:var(--font-data);font-size:10px;white-space:nowrap;">${fmtDateTime(a.Timestamp)}</td>
          <td style="font-size:11px;">${escHtml(a.Account_Name)}</td>
          <td>${escHtml(a.Table_Name)}</td>
          <td>${statusBadge(a.Action)}</td>
          <td>${escHtml(a.Field_Name||'—')}</td>
          <td style="font-size:11px;">${escHtml(a.Old_Value||'—')}</td>
          <td style="font-size:11px;">${escHtml(a.New_Value||'—')}</td>
          <td style="font-family:var(--font-data);font-size:10px;">${escHtml(a.IP_Address)}</td>
          <td style="font-family:var(--font-data);font-size:10px;">${escHtml(a.Session_ID)}</td>
        </tr>`).join('')}</tbody></table>
    </div></div>`;
}

/* ── ERD (Relationship Graph) ── */
function renderERD(el) {
  el.innerHTML = `
    <div class="fm-card"><div class="fm-card-header">Relationship Graph — Anchor-Buoy Model</div><div class="fm-card-body" style="text-align:center;padding:24px;">
      <svg viewBox="0 0 900 500" style="max-width:100%;height:auto;font-family:var(--font-ui);">
        ${erdBox(100, 50, 'Patients', ['__pk_PatientID','Name_First','Name_Last','DOB','Insurance_Provider','_fk_PrimaryProviderID'], '#0066cc')}
        ${erdBox(400, 30, 'Providers', ['__pk_ProviderID','Name_Practice','NPI','Specialty','Phone'], '#2d8a4e')}
        ${erdBox(100, 300, 'Claims', ['__pk_ClaimID','_fk_PatientID','_fk_ProviderID','_fk_MedicationID','Amount_Billed','Approval_Status'], '#cc8800')}
        ${erdBox(450, 300, 'Medications', ['__pk_MedID','NDC','Brand_Name','Generic_Name','Current_Price'], '#cc3333')}
        ${erdBox(700, 150, 'Pharmacies', ['__pk_PharmacyID','Name','NCPDP_ID','Type'], '#666')}
        ${erdBox(700, 350, 'Audit_Log', ['__pk_AuditID','Table_Name','Action','Field_Name','Old_Value'], '#8844aa')}
        <line x1="255" y1="120" x2="400" y2="100" stroke="#0066cc" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="190" y1="210" x2="190" y2="300" stroke="#cc8800" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="310" y1="370" x2="450" y2="370" stroke="#cc3333" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="310" y1="330" x2="400" y2="100" stroke="#2d8a4e" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)"/>
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#666"/></marker></defs>
      </svg>
      <p style="font-size:11px;color:#888;margin-top:12px;">FileMaker Relationship Graph equivalent — click table occurrences to navigate to layout</p>
    </div></div>`;
}
function erdBox(x, y, title, fields, color) {
  const h = 30 + fields.length * 16;
  return `<g onclick="switchLayout('${title.toLowerCase().replace('_','')}');" style="cursor:pointer;">
    <rect x="${x}" y="${y}" width="160" height="${h}" rx="4" fill="white" stroke="${color}" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="160" height="24" rx="4" fill="${color}"/>
    <text x="${x+80}" y="${y+16}" text-anchor="middle" fill="white" font-size="11" font-weight="600">${title}</text>
    ${fields.map((f,i) => `<text x="${x+8}" y="${y+40+i*16}" font-size="10" fill="#333">${f.startsWith('__pk')?'🔑 ':'  '}${f}</text>`).join('')}
  </g>`;
}

/* ── Scripts Workspace ── */
function renderScripts(el) {
  const scripts = [
    { name: 'Sync_Medication_Data', desc: 'Pull NDC data from OpenFDA API, parse JSON, upsert into Medications table', fm: 'Insert from URL + JSONGetElement + Set Field By Name', lines: 47 },
    { name: 'OnRecordCommit_AuditTrail', desc: 'Capture field changes, write to Audit_Log with timestamp and account', fm: 'OnRecordCommit trigger + Get(ModifiedFields)', lines: 28 },
    { name: 'Approve_Claim', desc: 'Validate privilege set, capture electronic signature, lock record', fm: 'If[Get(AccountPrivilegeSetName) = "Pharmacist"] + Set Field + Commit', lines: 35 },
    { name: 'Navigate_PatientDetail', desc: 'Go to related patient record from Claims layout', fm: 'Go to Related Record[From: Claims; Using layout: Patient Detail]', lines: 12 },
    { name: 'Generate_Report', desc: 'Build claims summary report grouped by status', fm: 'Sort Records + Go to Layout[Report] + Enter Preview Mode', lines: 22 },
    { name: 'RBAC_CheckAccess', desc: 'Evaluate current privilege set and restrict UI elements', fm: 'Get(AccountPrivilegeSetName) + If/Else branching', lines: 19 }
  ];
  el.innerHTML = `
    <div class="fm-card"><div class="fm-card-header">Script Workspace — ${scripts.length} Scripts</div><div class="fm-card-body" style="padding:0;">
      <table class="fm-portal-table"><thead><tr><th>Script Name</th><th>Description</th><th>FM Equivalent</th><th>Steps</th><th></th></tr></thead>
        <tbody>${scripts.map(s => `<tr class="fm-portal-row">
          <td style="font-weight:600;color:#0066cc;">⚡ ${escHtml(s.name)}</td>
          <td style="font-size:11px;">${escHtml(s.desc)}</td>
          <td style="font-family:var(--font-data);font-size:10px;">${escHtml(s.fm)}</td>
          <td style="text-align:center;">${s.lines}</td>
          <td><button class="fm-btn fm-btn-primary" style="font-size:10px;padding:2px 8px;" onclick="showToast('Running ${s.name}...','info')">▶ Run</button></td>
        </tr>`).join('')}</tbody></table>
    </div></div>`;
}

/* ── Security (Privilege Sets) ── */
function renderSecurity(el) {
  el.innerHTML = `
    <div class="fm-card"><div class="fm-card-header">Manage Security — Privilege Sets</div><div class="fm-card-body" style="padding:0;">
      <table class="fm-portal-table"><thead><tr><th>Privilege Set</th><th>Create</th><th>Read</th><th>Update</th><th>Delete</th><th>Approve</th><th>Layouts</th></tr></thead>
        <tbody>${Object.entries(RBAC).map(([k,v]) => `<tr class="fm-portal-row ${APP.currentRole===k?'selected':''}">
          <td style="font-weight:600;">${v.label}</td>
          <td>${v.create?'✅':'❌'}</td><td>${v.read?'✅':'❌'}</td>
          <td>${v.update===true?'✅':v.update==='limited'?'⚠️ Limited':'❌'}</td>
          <td>${v.delete?'✅':'❌'}</td><td>${v.approve?'✅':'❌'}</td>
          <td style="font-size:10px;">${v.layouts.length} layouts</td>
        </tr>`).join('')}</tbody></table>
    </div></div>
    <div class="fm-card" style="margin-top:12px;"><div class="fm-card-header">Active Accounts</div><div class="fm-card-body" style="padding:0;">
      <table class="fm-portal-table"><thead><tr><th>Account</th><th>Privilege Set</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>admin@epls.com</td><td>Pharmacist (Full Access)</td><td>${statusBadge('Active')}</td></tr>
          <tr><td>pharmacist@epls.com</td><td>Pharmacist (Full Access)</td><td>${statusBadge('Active')}</td></tr>
          <tr><td>tech1@epls.com</td><td>Technician (Limited)</td><td>${statusBadge('Active')}</td></tr>
          <tr><td>tech2@epls.com</td><td>Technician (Limited)</td><td>${statusBadge('Active')}</td></tr>
          <tr><td>auditor@epls.com</td><td>Auditor (Read-Only)</td><td>${statusBadge('Active')}</td></tr>
        </tbody></table>
    </div></div>`;
}

/* ── About ── */
function renderAbout(el) {
  el.innerHTML = `
    <div class="fm-card"><div class="fm-card-header">About This Solution</div><div class="fm-card-body" style="padding:24px;">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">The Lancaster Hub</h2>
      <p style="color:#888;margin-bottom:16px;">Pharmacy Benefit Management System — FileMaker Pro 2026</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <h3 style="font-size:13px;font-weight:600;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px;">Developer</h3>
          <p><strong>Justin Arndt</strong></p>
          <p style="font-size:12px;color:#666;">11x Claris Certified Developer</p>
          <p style="font-size:12px;color:#666;">FileMaker Pro • Server • Cloud • WebDirect</p>
          <p style="font-size:12px;color:#666;margin-top:8px;">Designed for EPLS — Lancaster, PA</p>
        </div>
        <div>
          <h3 style="font-size:13px;font-weight:600;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px;">Architecture</h3>
          <p style="font-size:12px;line-height:1.6;">
            <strong>Schema:</strong> Anchor-Buoy relational model<br>
            <strong>Security:</strong> RBAC + Electronic Signatures<br>
            <strong>Compliance:</strong> HIPAA • 21 CFR Part 11 • ALCOA+<br>
            <strong>API:</strong> OpenFDA NDC sync engine<br>
            <strong>Records:</strong> ${APP.data.patients.length} patients, ${APP.data.claims.length} claims, ${APP.data.medications.length} medications
          </p>
        </div>
      </div>
    </div></div>`;
}

/* ── Shared: Field Row Helper ── */
function fieldRow(label, value, font, readonly) {
  const fontStyle = font === 'data' ? 'font-family:var(--font-data);font-size:11px;' : '';
  const bgStyle = readonly ? 'background:#f5f5f5;' : '';
  return `<div class="fm-field-row">
    <label class="fm-field-label">${escHtml(label)}</label>
    <div class="fm-field-input" style="cursor:default;${fontStyle}${bgStyle}">${escHtml(fmt(value))}</div>
  </div>`;
}

/* ── Tab Control ── */
function switchTab(tabEl) {
  const tabId = tabEl.dataset.tab;
  const parent = tabEl.closest('.fm-tab-control');
  parent.querySelectorAll('.fm-tab').forEach(t => t.classList.remove('active'));
  parent.querySelectorAll('.fm-tab-panel').forEach(p => p.classList.remove('active'));
  tabEl.classList.add('active');
  const panel = parent.querySelector('#' + tabId);
  if (panel) panel.classList.add('active');
}

/* ── Search / Filter Functions ── */
function filterPatients(q) {
  q = q.toLowerCase().trim();
  if (!q) { APP.foundSet.patients = APP.data.patients.map((_,i)=>i); }
  else { APP.foundSet.patients = APP.data.patients.map((_,i)=>i).filter(i => {
    const p = APP.data.patients[i];
    return (p.Name_First+' '+p.Name_Last+' '+p.Insurance_Provider).toLowerCase().includes(q);
  }); }
  APP.currentRecord.patients = 0;
  updateRecordIndicator();
  renderPatients(document.getElementById('main-content'));
}
function filterProviders(q) {
  q = q.toLowerCase().trim();
  if (!q) { APP.foundSet.providers = APP.data.providers.map((_,i)=>i); }
  else { APP.foundSet.providers = APP.data.providers.map((_,i)=>i).filter(i => {
    const p = APP.data.providers[i];
    return (p.Name_Practice+' '+p.Name_Last+' '+p.Specialty+' '+p.NPI).toLowerCase().includes(q);
  }); }
  APP.currentRecord.providers = 0;
  renderProviders(document.getElementById('main-content'));
}
function filterMedications(q) {
  q = q.toLowerCase().trim();
  if (!q) { APP.foundSet.medications = APP.data.medications.map((_,i)=>i); }
  else { APP.foundSet.medications = APP.data.medications.map((_,i)=>i).filter(i => {
    const m = APP.data.medications[i];
    return (m.Brand_Name+' '+m.Generic_Name+' '+m.Manufacturer+' '+m.NDC).toLowerCase().includes(q);
  }); }
  APP.currentRecord.medications = 0;
  updateRecordIndicator();
  renderMedications(document.getElementById('main-content'));
}
