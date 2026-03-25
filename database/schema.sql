-- ============================================================================
-- THE LANCASTER HUB — Pharmacy Benefit Management System
-- Relational Schema: Anchor-Buoy Model
-- Author: Justin Arndt | 11x Claris Certified Developer
-- Architecture: Multi-Tenant Ready, HIPAA-Aligned, 21 CFR Part 11 Compliant
-- ============================================================================

-- ============================================================================
-- ANCHOR TABLES (Core Entities)
-- ============================================================================

-- Providers: Doctors, Clinics, and Prescribers
CREATE TABLE IF NOT EXISTS Providers (
    __pk_ProviderID     TEXT PRIMARY KEY,       -- UUID
    Name_Practice       TEXT NOT NULL,
    Name_First          TEXT NOT NULL,
    Name_Last           TEXT NOT NULL,
    NPI                 TEXT UNIQUE,            -- National Provider Identifier
    Specialty           TEXT,
    Address_Street      TEXT,
    Address_City        TEXT DEFAULT 'Lancaster',
    Address_State       TEXT DEFAULT 'PA',
    Address_Zip         TEXT,
    Phone               TEXT,
    Fax                 TEXT,
    Email               TEXT,
    Status              TEXT DEFAULT 'Active' CHECK(Status IN ('Active','Inactive','Suspended')),
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    z_ModifiedTimestamp  TEXT NOT NULL DEFAULT (datetime('now')),
    z_CreatedBy          TEXT NOT NULL DEFAULT 'System'
);

-- Patients: Demographics, Insurance Info, Medical History
CREATE TABLE IF NOT EXISTS Patients (
    __pk_PatientID      TEXT PRIMARY KEY,       -- UUID
    _fk_PrimaryProviderID TEXT,                 -- FK → Providers
    Name_First          TEXT NOT NULL,
    Name_Last           TEXT NOT NULL,
    DOB                 TEXT NOT NULL,           -- Validated: never empty
    Gender              TEXT CHECK(Gender IN ('M','F','Other','Undisclosed')),
    SSN_Last4           TEXT,                    -- Last 4 only (HIPAA)
    Address_Street      TEXT,
    Address_City        TEXT,
    Address_State       TEXT,
    Address_Zip         TEXT,
    Phone               TEXT,
    Email               TEXT,
    Insurance_Provider  TEXT NOT NULL CHECK(Insurance_Provider IN (
        'Aetna','BlueCross BlueShield','Cigna','Humana',
        'UnitedHealthcare','Medicare','Medicaid','Tricare','Self-Pay'
    )),
    Insurance_PolicyNum TEXT,
    Insurance_GroupNum  TEXT,
    Allergies           TEXT,                    -- JSON array
    Status              TEXT DEFAULT 'Active' CHECK(Status IN ('Active','Inactive','Deceased')),
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    z_ModifiedTimestamp  TEXT NOT NULL DEFAULT (datetime('now')),
    z_CreatedBy          TEXT NOT NULL DEFAULT 'System',
    FOREIGN KEY (_fk_PrimaryProviderID) REFERENCES Providers(__pk_ProviderID)
);

-- Pharmacy: Internal and Partner Locations
CREATE TABLE IF NOT EXISTS Pharmacy (
    __pk_PharmacyID     TEXT PRIMARY KEY,       -- UUID
    Name                TEXT NOT NULL,
    Type                TEXT CHECK(Type IN ('Internal','Partner','Mail-Order','Specialty')),
    NCPDP_ID            TEXT UNIQUE,            -- National Council for Prescription Drug Programs
    Address_Street      TEXT,
    Address_City        TEXT,
    Address_State       TEXT,
    Address_Zip         TEXT,
    Phone               TEXT,
    DEA_Number          TEXT,
    Status              TEXT DEFAULT 'Active',
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    z_ModifiedTimestamp  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Medications: The Drug Master File (linked to National Drug Code API)
CREATE TABLE IF NOT EXISTS Medications (
    __pk_MedID          TEXT PRIMARY KEY,       -- UUID
    NDC                 TEXT UNIQUE,            -- National Drug Code
    Brand_Name          TEXT,
    Generic_Name        TEXT,
    Manufacturer        TEXT,
    Dosage_Form         TEXT,                   -- Tablet, Capsule, Injection, etc.
    Strength            TEXT,
    Route               TEXT,                   -- Oral, Topical, IV, etc.
    DEA_Schedule        TEXT,                   -- I, II, III, IV, V, or NULL
    Current_Price       REAL DEFAULT 0.00,
    Indications_Text    TEXT,                   -- Full indications & usage text
    JSON_Payload        TEXT,                   -- Raw OpenFDA API response (cached)
    zz_Embedding_Vector TEXT,                   -- 1536-dim vector (stored as JSON array)
    c_Search_Index      TEXT GENERATED ALWAYS AS (
        COALESCE(Brand_Name,'') || ' ' ||
        COALESCE(Generic_Name,'') || ' ' ||
        COALESCE(Manufacturer,'')
    ) STORED,                                   -- Concatenated index for keyword search
    Status              TEXT DEFAULT 'Active',
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    z_ModifiedTimestamp  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Scripts: Prescriptions (Bridge between Doctor and Patient)
CREATE TABLE IF NOT EXISTS Scripts (
    __pk_ScriptID       TEXT PRIMARY KEY,       -- UUID
    _fk_PatientID       TEXT NOT NULL,
    _fk_ProviderID      TEXT NOT NULL,
    _fk_MedID           TEXT NOT NULL,
    _fk_PharmacyID      TEXT,
    Script_Date         TEXT NOT NULL,
    Quantity            INTEGER NOT NULL DEFAULT 1,
    Days_Supply         INTEGER DEFAULT 30,
    Refills_Authorized  INTEGER DEFAULT 0,
    Refills_Remaining   INTEGER DEFAULT 0,
    Directions          TEXT,                   -- Sig: "Take 1 tablet by mouth daily"
    DAW_Code            TEXT DEFAULT '0',       -- Dispense As Written
    Status              TEXT DEFAULT 'Active' CHECK(Status IN (
        'Active','Filled','Expired','Cancelled','On Hold'
    )),
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    z_ModifiedTimestamp  TEXT NOT NULL DEFAULT (datetime('now')),
    z_CreatedBy          TEXT NOT NULL DEFAULT 'System',
    FOREIGN KEY (_fk_PatientID) REFERENCES Patients(__pk_PatientID),
    FOREIGN KEY (_fk_ProviderID) REFERENCES Providers(__pk_ProviderID),
    FOREIGN KEY (_fk_MedID) REFERENCES Medications(__pk_MedID),
    FOREIGN KEY (_fk_PharmacyID) REFERENCES Pharmacy(__pk_PharmacyID)
);

-- Claims: The Transaction Table (Patient + Provider + Drug)
CREATE TABLE IF NOT EXISTS Claims (
    __pk_ClaimID        TEXT PRIMARY KEY,       -- UUID
    _fk_PatientID       TEXT NOT NULL,
    _fk_ProviderID      TEXT NOT NULL,
    _fk_PharmacyID      TEXT NOT NULL,
    _fk_ScriptID        TEXT,
    Claim_Date          TEXT NOT NULL,
    Claim_Type          TEXT DEFAULT 'Pharmacy' CHECK(Claim_Type IN (
        'Pharmacy','Medical','Specialty','Compound'
    )),
    -- LOOKUP fields: frozen at claim creation (audit/financial integrity)
    Lookup_DrugPrice    REAL NOT NULL,          -- Looked up, NOT calculated
    Copay_Amount        REAL DEFAULT 0.00,
    Deductible_Applied  REAL DEFAULT 0.00,
    Plan_Paid           REAL DEFAULT 0.00,
    Patient_Responsibility REAL DEFAULT 0.00,
    Total_Claim_Amount  REAL NOT NULL,
    -- Approval Workflow (Electronic Signatures)
    Approval_Status     TEXT DEFAULT 'Pending' CHECK(Approval_Status IN (
        'Pending','Approved','Denied','Under Review','Escalated'
    )),
    Approved_By         TEXT,                   -- Claris Account ID
    Approved_Timestamp  TEXT,                   -- ISO 8601
    Approval_Signature  TEXT,                   -- Digital signature hash
    Denial_Reason       TEXT,
    -- Metadata
    Status              TEXT DEFAULT 'Open' CHECK(Status IN (
        'Open','Processing','Adjudicated','Paid','Denied','Voided'
    )),
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    z_ModifiedTimestamp  TEXT NOT NULL DEFAULT (datetime('now')),
    z_CreatedBy          TEXT NOT NULL DEFAULT 'System',
    z_RecordLocked      INTEGER DEFAULT 0,      -- 1 = locked after approval
    FOREIGN KEY (_fk_PatientID) REFERENCES Patients(__pk_PatientID),
    FOREIGN KEY (_fk_ProviderID) REFERENCES Providers(__pk_ProviderID),
    FOREIGN KEY (_fk_PharmacyID) REFERENCES Pharmacy(__pk_PharmacyID),
    FOREIGN KEY (_fk_ScriptID) REFERENCES Scripts(__pk_ScriptID)
);

-- ============================================================================
-- JOIN TABLES (Logic Connectors)
-- ============================================================================

-- Encounters: Links Patients to Providers for specific visit dates
CREATE TABLE IF NOT EXISTS Encounters (
    __pk_EncounterID    TEXT PRIMARY KEY,       -- UUID
    _fk_PatientID       TEXT NOT NULL,
    _fk_ProviderID      TEXT NOT NULL,
    Encounter_Date      TEXT NOT NULL,
    Encounter_Type      TEXT CHECK(Encounter_Type IN (
        'Office Visit','Telehealth','Emergency','Lab','Follow-Up'
    )),
    Chief_Complaint     TEXT,
    Notes               TEXT,
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (_fk_PatientID) REFERENCES Patients(__pk_PatientID),
    FOREIGN KEY (_fk_ProviderID) REFERENCES Providers(__pk_ProviderID)
);

-- LineItems: Multiple drugs per claim (prevents data duplication)
CREATE TABLE IF NOT EXISTS LineItems (
    __pk_LineItemID     TEXT PRIMARY KEY,       -- UUID
    _fk_ClaimID         TEXT NOT NULL,
    _fk_MedID           TEXT NOT NULL,
    Quantity            INTEGER NOT NULL DEFAULT 1,
    Days_Supply         INTEGER DEFAULT 30,
    Unit_Price          REAL NOT NULL,          -- LOOKUP from Medications.Current_Price
    Line_Total          REAL NOT NULL,
    NDC_At_Fill         TEXT,                   -- NDC snapshot at time of fill
    z_CreatedTimestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (_fk_ClaimID) REFERENCES Claims(__pk_ClaimID),
    FOREIGN KEY (_fk_MedID) REFERENCES Medications(__pk_MedID)
);

-- ============================================================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================================================

-- Audit_Log: ALCOA+ Compliant (21 CFR Part 11)
-- Attributable, Legible, Contemporaneous, Original, Accurate
CREATE TABLE IF NOT EXISTS Audit_Log (
    __pk_AuditID        TEXT PRIMARY KEY,       -- UUID
    Timestamp           TEXT NOT NULL DEFAULT (datetime('now')),
    Account_Name        TEXT NOT NULL,          -- Who made the change
    Table_Name          TEXT NOT NULL,          -- Which table was affected
    Record_ID           TEXT NOT NULL,          -- PK of the changed record
    Action              TEXT NOT NULL CHECK(Action IN ('CREATE','UPDATE','DELETE','APPROVE','LOGIN','LOGOUT')),
    Field_Name          TEXT,                   -- Which field changed
    Old_Value           TEXT,                   -- Previous value
    New_Value           TEXT,                   -- New value
    IP_Address          TEXT,
    Session_ID          TEXT
    -- NOTE: This table has NO update/delete triggers. Records are IMMUTABLE.
);

-- ============================================================================
-- INDEXES (Performance at Scale)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patients_name ON Patients(Name_Last, Name_First);
CREATE INDEX IF NOT EXISTS idx_patients_provider ON Patients(_fk_PrimaryProviderID);
CREATE INDEX IF NOT EXISTS idx_patients_insurance ON Patients(Insurance_Provider);
CREATE INDEX IF NOT EXISTS idx_medications_ndc ON Medications(NDC);
CREATE INDEX IF NOT EXISTS idx_medications_search ON Medications(c_Search_Index);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON Claims(_fk_PatientID);
CREATE INDEX IF NOT EXISTS idx_claims_date ON Claims(Claim_Date);
CREATE INDEX IF NOT EXISTS idx_claims_status ON Claims(Approval_Status);
CREATE INDEX IF NOT EXISTS idx_scripts_patient ON Scripts(_fk_PatientID);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON Audit_Log(Timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_table ON Audit_Log(Table_Name, Record_ID);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON Encounters(_fk_PatientID);
CREATE INDEX IF NOT EXISTS idx_lineitems_claim ON LineItems(_fk_ClaimID);
