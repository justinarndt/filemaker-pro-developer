# The Lancaster Hub — Build Walkthrough

## What Was Built

A fully functional FileMaker Pro 2026 portfolio simulation — "The Lancaster Hub" — designed to showcase FileMaker development mastery for the EPLS Pharmacy Benefit Management position.

### Application Architecture

| Component | Implementation |
|-----------|---------------|
| **Schema** | Anchor-Buoy relational model with UUID PKs/FKs |
| **Data** | 500 patients, 200 claims, 50 providers, 30 medications, 5 pharmacies, 500 audit entries |
| **Security** | 3-tier RBAC (Pharmacist / Technician / Auditor) |
| **Compliance** | ALCOA+ audit trail, 21 CFR Part 11 electronic signatures |
| **API** | OpenFDA NDC sync engine (simulated) |

### Files Created/Modified

#### Core Engine
- [app.js](file:///C:/Project/FMPro/app/js/app.js) — State management, RBAC, record navigation, audit trail, toast system, data loading, dashboard renderer, boot sequence
- [layouts.js](file:///C:/Project/FMPro/app/js/layouts.js) — 10 layout renderers (Patients, Providers, Medications, Claims, Audit, ERD, Scripts, Security, About)

#### Styling
- [lancaster.css](file:///C:/Project/FMPro/app/css/lancaster.css) — Added status badges, form grid, field rows, tab panel visibility, button variants, portal row selection, animations

#### HTML
- [index.html](file:///C:/Project/FMPro/app/index.html) — Added [layouts.js](file:///C:/Project/FMPro/app/js/layouts.js) script tag

### 10 Working Layouts

1. **Dashboard** — KPI cards (patients, claims, pending, total billed $88,926.19), claims status distribution chart, provider network summary, recent audit activity
2. **Patients** — Master-detail form with tab control (Detail/Claims/History), provider lookup, metadata, search
3. **Providers** — List view with sortable columns, search, NPI display
4. **Medications** — Form view with NDC, pricing, JSON payload viewer, drug search
5. **Claims** — Processing view with financial breakdown, Approve/Deny workflow (RBAC-gated), patient/medication/pharmacy lookups
6. **Audit Trail** — Read-only ALCOA+ compliant log (timestamp, account, table, action, field, old→new, IP, session)
7. **ERD** — Interactive SVG relationship graph (Anchor-Buoy model)
8. **Scripts** — Script Workspace with 6 scripts showing FM step equivalents
9. **Security** — Privilege set matrix with CRUD+Approve permissions, active account list
10. **About** — Developer info, architecture summary, compliance badges

### Key Features Demonstrated

- **Record Navigation** — First/Prev/Next/Last buttons with found set tracking
- **RBAC** — Layout access control, approve/deny buttons restricted by role
- **Audit Trail** — Every action logged with timestamp, account, IP, session ID
- **Electronic Signatures** — Claim approval captures signer + timestamp
- **Search/Filter** — Real-time filtering on Patients, Providers, Medications
- **Tab Control** — Patient Detail/Claims/History tabs
- **Portal Tables** — Sortable list views with row selection
- **Toast Notifications** — Success/error/warning/info feedback

## Verification Results

All tests passed in browser:

| Test | Result |
|------|--------|
| Dashboard KPIs show data | ✅ ($88,926.19 total billed, 500 patients, 200 claims) |
| Patient form shows real data | ✅ (name, DOB, gender, insurance, policy #, group #) |
| Claims shows financial breakdown | ✅ (total amount, drug price, copay, deductible, plan paid) |
| Approve/Deny buttons appear | ✅ (for Under Review claims, Pharmacist role only) |
| Record navigation works | ✅ (First/Prev/Next/Last cycle through found set) |
| All 10 layouts render | ✅ (no errors in console) |
| Field mapping correct | ✅ (all JSON fields match JS renderers) |

## Browser Recording

![Lancaster Hub Test](C:/Users/justi/.gemini/antigravity/brain/77c161bd-6277-44b6-af4a-19697d86b5b2/lancaster_final_test_1774403363884.webp)
