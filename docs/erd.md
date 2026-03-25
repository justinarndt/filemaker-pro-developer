# The Lancaster Hub — Entity Relationship Diagram
## Anchor-Buoy Relational Model

> This ERD mirrors the FileMaker Pro Relationship Graph using the **Anchor-Buoy** methodology for strict context control. Each "Anchor" table is a core entity; "Buoy" tables (joins) connect them without creating ambiguous paths.

```mermaid
erDiagram
    Providers ||--o{ Patients : "Primary Provider"
    Providers ||--o{ Scripts : "Prescriber"
    Providers ||--o{ Claims : "Billing Provider"
    Providers ||--o{ Encounters : "Visit Provider"

    Patients ||--o{ Scripts : "Prescribed To"
    Patients ||--o{ Claims : "Claimant"
    Patients ||--o{ Encounters : "Patient Visit"

    Pharmacy ||--o{ Scripts : "Dispensing Pharmacy"
    Pharmacy ||--o{ Claims : "Servicing Pharmacy"

    Medications ||--o{ Scripts : "Prescribed Drug"
    Medications ||--o{ LineItems : "Billed Drug"

    Claims ||--o{ LineItems : "Claim Detail"
    Scripts }o--o| Claims : "Source Rx"

    Providers {
        text __pk_ProviderID PK
        text Name_Practice
        text Name_First
        text Name_Last
        text NPI UK
        text Specialty
        text Status
    }

    Patients {
        text __pk_PatientID PK
        text _fk_PrimaryProviderID FK
        text Name_First
        text Name_Last
        text DOB
        text Insurance_Provider
        text Status
    }

    Pharmacy {
        text __pk_PharmacyID PK
        text Name
        text Type
        text NCPDP_ID UK
        text DEA_Number
    }

    Medications {
        text __pk_MedID PK
        text NDC UK
        text Brand_Name
        text Generic_Name
        text Manufacturer
        real Current_Price
        text Indications_Text
        text JSON_Payload
        text zz_Embedding_Vector
        text c_Search_Index
    }

    Scripts {
        text __pk_ScriptID PK
        text _fk_PatientID FK
        text _fk_ProviderID FK
        text _fk_MedID FK
        text _fk_PharmacyID FK
        text Script_Date
        int Quantity
        int Refills_Authorized
        text Status
    }

    Claims {
        text __pk_ClaimID PK
        text _fk_PatientID FK
        text _fk_ProviderID FK
        text _fk_PharmacyID FK
        text _fk_ScriptID FK
        text Claim_Date
        real Lookup_DrugPrice
        real Total_Claim_Amount
        text Approval_Status
        text Approved_By
        text Approval_Signature
        int z_RecordLocked
    }

    Encounters {
        text __pk_EncounterID PK
        text _fk_PatientID FK
        text _fk_ProviderID FK
        text Encounter_Date
        text Encounter_Type
    }

    LineItems {
        text __pk_LineItemID PK
        text _fk_ClaimID FK
        text _fk_MedID FK
        int Quantity
        real Unit_Price
        real Line_Total
    }

    Audit_Log {
        text __pk_AuditID PK
        text Timestamp
        text Account_Name
        text Table_Name
        text Record_ID
        text Action
        text Field_Name
        text Old_Value
        text New_Value
    }
```

## FileMaker Relationship Graph Notes

| Concept | FileMaker Implementation | This Schema |
|---------|------------------------|-------------|
| **Primary Keys** | `Get(UUID)` auto-enter | `__pk_*` fields (UUID v4) |
| **Foreign Keys** | Related field match | `_fk_*` fields with constraints |
| **Anchor Tables** | Left side of graph | `Providers`, `Patients`, `Pharmacy`, `Medications` |
| **Buoy Tables** | Context-specific TOs | `Encounters`, `LineItems` |
| **Lookup** | Auto-enter Lookup | `Lookup_DrugPrice` — frozen at claim creation |
| **Calculated Field** | Stored Calculation | `c_Search_Index` — concatenated, indexed |
| **Container** | Container field | `zz_Embedding_Vector` — vector storage |
