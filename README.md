# The Lancaster Hub — FileMaker Pro 2026 Portfolio

> Pharmacy Benefit Management System demonstrating enterprise FileMaker Pro development patterns

## Overview

**The Lancaster Hub** is a fully functional web-based simulation of a FileMaker Pro 2026 solution built for EPLS (Eastern Pennsylvania Logistical Services). It demonstrates every core FileMaker concept—relational schema design, script automation, RBAC security, and compliance—rendered as a pixel-accurate web application.

**Live Demo:** Open `app/index.html` in a browser (no build step required), or serve with any static file server.

## What This Demonstrates

| FileMaker Concept | Implementation |
|---|---|
| **Layout Switching** | 10 layouts with `Go to Layout[]` equivalent navigation |
| **Relationship Graph** | Anchor-Buoy model with interactive SVG ERD |
| **Script Workspace** | 6 documented scripts with FM step equivalents |
| **Privilege Sets** | 3-tier RBAC (Pharmacist / Technician / Auditor) |
| **Audit Trail** | ALCOA+ compliant with 21 CFR Part 11 electronic signatures |
| **Record Navigation** | Book/slider with found set tracking |
| **Portals** | Related record display with click-through navigation |
| **Tab Controls** | Patient Detail/Claims/History tabbed interface |
| **Script Triggers** | OnRecordCommit audit logging, OnFirstWindowOpen boot |
| **Value Lists** | Status badges, role dropdowns, search filters |

## Architecture

```
Patients ──── Claims ──── Medications
    │              │
    └── Providers   └── Pharmacies
                         │
                    Audit_Log
```

- **Schema:** Anchor-Buoy relational model with UUID primary/foreign keys
- **Data:** 500 patients, 200 claims, 50 providers, 30 medications, 5 pharmacies, 500 audit entries
- **Security:** Role-based layout access, field-level restrictions, electronic signature capture
- **Compliance:** HIPAA-aware data handling, ALCOA+ audit trail, 21 CFR Part 11

## Quick Start

```bash
# Option 1: Python
cd app && python -m http.server 8080
# Open http://localhost:8080

# Option 2: Node
npx serve app

# Option 3: Just open the file
open app/index.html
```

## Project Structure

```
FMPro/
├── app/
│   ├── index.html          # Main application shell (FileMaker window chrome)
│   ├── css/
│   │   └── lancaster.css   # Complete design system (900+ lines)
│   ├── js/
│   │   ├── app.js          # Core engine: state, RBAC, nav, audit, boot
│   │   └── layouts.js      # 10 layout renderers
│   ├── data/
│   │   ├── patients.json   # 500 HIPAA-safe patient records
│   │   ├── claims.json     # 200 pharmacy benefit claims
│   │   ├── providers.json  # 50 Lancaster-area providers
│   │   ├── medications.json # 30 NDC drugs with API payloads
│   │   ├── pharmacies.json # 5 NCPDP-registered pharmacies
│   │   └── audit_log.json  # 500 ALCOA+ audit entries
│   └── assets/
│       └── epls-logo.svg   # Company logo
└── seed/
    └── generate_seed.py    # Data generation script
```

## Key Features

### RBAC Privilege Sets
Switch between roles to see access control in action:
- **Pharmacist** — Full access, can approve/deny claims
- **Technician** — Limited write access, no approval authority
- **Auditor** — Read-only access to all data layouts

### Claims Processing Workflow
- View claim financial breakdown (drug price, copay, deductible, plan paid)
- Approve or deny claims with electronic signature capture
- Audit trail records every state change with timestamp and account

### Relationship Graph
Interactive SVG visualization of the Anchor-Buoy data model showing all table occurrences and their relationships.

## Developer

**Justin Arndt**  
11x Claris Certified Developer  
FileMaker Pro • Server • Cloud • WebDirect

---

*Built to demonstrate enterprise FileMaker Pro development expertise for the EPLS position.*
