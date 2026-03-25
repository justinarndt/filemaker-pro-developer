"""
THE LANCASTER HUB — Data Seed Generator
========================================
Generates realistic, HIPAA-safe patient and provider data for the PBM portfolio.
This script demonstrates the same logic that would be implemented in FileMaker Pro
using Insert from URL, JSON parsing, and looping record creation.

FileMaker Equivalent:
    - Sync_Medication_Data script (Insert from URL → JSON parsing → Loop/New Record)
    - Mockaroo-style patient generation with Field Validation
    - Provider network creation with value list constraints

Author: Justin Arndt | 11x Claris Certified Developer
"""

import json
import uuid
import random
import hashlib
from datetime import datetime, timedelta

# ============================================================================
# UUID GENERATOR — Mirrors FileMaker's Get(UUID) function
# ============================================================================
def fm_uuid():
    """Generate a UUID matching FileMaker's Get(UUID) format."""
    return str(uuid.uuid4()).upper()

# ============================================================================
# PROVIDER DATA — 50 Lancaster-Area Practices
# ============================================================================
SPECIALTIES = [
    'Family Medicine', 'Internal Medicine', 'Pediatrics', 'Cardiology',
    'Dermatology', 'Orthopedics', 'Neurology', 'Psychiatry',
    'Obstetrics/Gynecology', 'Endocrinology', 'Pulmonology',
    'Gastroenterology', 'Oncology', 'Rheumatology', 'Urology',
    'Ophthalmology', 'ENT', 'Nephrology', 'Pain Management', 'Geriatrics'
]

LANCASTER_PRACTICES = [
    {"practice": "Lancaster General Health", "street": "555 N Duke St", "zip": "17602"},
    {"practice": "Penn Medicine Lancaster", "street": "2100 Harrisburg Pike", "zip": "17604"},
    {"practice": "UPMC Lititz", "street": "1500 Highlands Dr", "zip": "17543"},
    {"practice": "WellSpan Ephrata", "street": "169 Martin Ave", "zip": "17522"},
    {"practice": "Hometown Family Health", "street": "694 Good Dr", "zip": "17601"},
    {"practice": "Lancaster Family Medicine", "street": "1635 W Main St", "zip": "17603"},
    {"practice": "Manheim Township Medical", "street": "2106 Harrisburg Pike", "zip": "17601"},
    {"practice": "Neffsville Family Practice", "street": "2550 Lititz Pike", "zip": "17601"},
    {"practice": "Lititz Family Medicine", "street": "51 Peters Rd", "zip": "17543"},
    {"practice": "Columbia Medical Center", "street": "121 Locust St", "zip": "17512"},
    {"practice": "Elizabethtown Family Health", "street": "723 S Market St", "zip": "17022"},
    {"practice": "Mount Joy Medical Group", "street": "600 E Main St", "zip": "17552"},
    {"practice": "Strasburg Family Practice", "street": "200 Gap Rd", "zip": "17579"},
    {"practice": "New Holland Medical", "street": "446 W Main St", "zip": "17557"},
    {"practice": "Quarryville Medical Center", "street": "25 S Church St", "zip": "17566"},
    {"practice": "East Petersburg Health", "street": "5944 Main St", "zip": "17520"},
    {"practice": "Millersville Family Med", "street": "101 Manor Ave", "zip": "17551"},
    {"practice": "Willow Street Medical", "street": "313 W Willow Rd", "zip": "17584"},
    {"practice": "Brownstown Family Practice", "street": "4875 W Main St", "zip": "17508"},
    {"practice": "Rothsville Medical Group", "street": "218 W Main St", "zip": "17573"},
    {"practice": "Bird-in-Hand Family Med", "street": "2717 Old Philadelphia Pike", "zip": "17505"},
    {"practice": "Paradise Medical Center", "street": "101 Belmont Rd", "zip": "17562"},
    {"practice": "Leola Family Health", "street": "23 W Main St", "zip": "17540"},
    {"practice": "Smoketown Medical", "street": "2472 Old Philadelphia Pike", "zip": "17576"},
    {"practice": "Denver Family Practice", "street": "501 Main St", "zip": "17517"},
    {"practice": "Terre Hill Medical", "street": "100 Broad St", "zip": "17581"},
    {"practice": "Adamstown Health Center", "street": "3422 N Reading Rd", "zip": "19501"},
    {"practice": "Gap Family Medicine", "street": "801 Houston Run Dr", "zip": "17527"},
    {"practice": "Christiana Medical", "street": "10 Green Acre Rd", "zip": "17509"},
    {"practice": "Akron Family Health", "street": "312 S 7th St", "zip": "17501"},
    {"practice": "Marietta Medical Group", "street": "411 W Market St", "zip": "17547"},
    {"practice": "Mountville Family Practice", "street": "125 College Ave", "zip": "17554"},
    {"practice": "Conestoga Valley Medical", "street": "2110 Horseshoe Rd", "zip": "17602"},
    {"practice": "Oregon Medical Center", "street": "555 Greenfield Rd", "zip": "17602"},
    {"practice": "Lampeter Family Health", "street": "1600 Book Rd", "zip": "17537"},
    {"practice": "Hempfield Medical Group", "street": "900 Centerville Rd", "zip": "17601"},
    {"practice": "Warwick Family Practice", "street": "40 N Broad St", "zip": "17543"},
    {"practice": "Manor Township Health", "street": "950 W Lancaster Ave", "zip": "17603"},
    {"practice": "Clay Township Medical", "street": "870 Durlach Rd", "zip": "17543"},
    {"practice": "West Lampeter Medical", "street": "852 Village Rd", "zip": "17537"},
    {"practice": "Pequea Valley Health", "street": "166 S New Holland Rd", "zip": "17557"},
    {"practice": "Earl Township Medical", "street": "517 Grist Mill Rd", "zip": "17557"},
    {"practice": "East Hempfield Medical", "street": "1577 Marietta Ave", "zip": "17601"},
    {"practice": "Rapho Township Health", "street": "971 N Colebrook Rd", "zip": "17545"},
    {"practice": "Penn Township Medical", "street": "689 E Main St", "zip": "17545"},
    {"practice": "Donegal Family Practice", "street": "129 S Market St", "zip": "17552"},
    {"practice": "Manheim Central Health", "street": "71 N Main St", "zip": "17545"},
    {"practice": "Cocalico Medical Group", "street": "245 N Reading Rd", "zip": "17517"},
    {"practice": "Solanco Family Health", "street": "121 S Lime St", "zip": "17566"},
    {"practice": "Conoy Township Medical", "street": "211 Falmouth Rd", "zip": "17502"},
]

FIRST_NAMES_M = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Christopher',
    'Daniel','Matthew','Anthony','Mark','Steven','Paul','Andrew','Joshua','Kenneth','Kevin',
    'Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary']
FIRST_NAMES_F = ['Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
    'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily','Donna',
    'Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia']
LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
    'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
    'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
    'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts']

INSURANCE_PROVIDERS = [
    'Aetna','BlueCross BlueShield','Cigna','Humana',
    'UnitedHealthcare','Medicare','Medicaid','Tricare','Self-Pay'
]

ALLERGIES = [None, '["Penicillin"]', '["Sulfa"]', '["Codeine"]',
    '["Aspirin"]', '["Latex"]', '["Penicillin","Sulfa"]',
    '["Ibuprofen"]', '["Amoxicillin"]', None, None, None]

def generate_providers():
    """Generate 50 Lancaster-area medical providers."""
    providers = []
    for i, loc in enumerate(LANCASTER_PRACTICES):
        gender = random.choice(['M','F'])
        fname = random.choice(FIRST_NAMES_M if gender == 'M' else FIRST_NAMES_F)
        lname = random.choice(LAST_NAMES)
        npi = f"1{random.randint(100000000, 999999999)}"
        providers.append({
            "__pk_ProviderID": fm_uuid(),
            "Name_Practice": loc["practice"],
            "Name_First": fname,
            "Name_Last": lname,
            "NPI": npi,
            "Specialty": random.choice(SPECIALTIES),
            "Address_Street": loc["street"],
            "Address_City": "Lancaster" if "Lancaster" in loc["practice"] else loc["practice"].split()[0],
            "Address_State": "PA",
            "Address_Zip": loc["zip"],
            "Phone": f"(717) {random.randint(200,999)}-{random.randint(1000,9999)}",
            "Fax": f"(717) {random.randint(200,999)}-{random.randint(1000,9999)}",
            "Email": f"dr.{lname.lower()}@{loc['practice'].lower().replace(' ','')}.com",
            "Status": "Active",
            "z_CreatedTimestamp": datetime.now().isoformat(),
            "z_ModifiedTimestamp": datetime.now().isoformat(),
            "z_CreatedBy": "System_Seed"
        })
    return providers

def generate_patients(providers, count=500):
    """Generate realistic HIPAA-safe patient records."""
    patients = []
    provider_ids = [p["__pk_ProviderID"] for p in providers]
    for i in range(count):
        gender = random.choice(['M','F'])
        fname = random.choice(FIRST_NAMES_M if gender == 'M' else FIRST_NAMES_F)
        lname = random.choice(LAST_NAMES)
        # DOB: ages 1-95
        age = random.randint(1, 95)
        dob = (datetime.now() - timedelta(days=age*365 + random.randint(0,364))).strftime('%Y-%m-%d')
        patients.append({
            "__pk_PatientID": fm_uuid(),
            "_fk_PrimaryProviderID": random.choice(provider_ids),
            "Name_First": fname,
            "Name_Last": lname,
            "DOB": dob,
            "Gender": gender,
            "SSN_Last4": f"{random.randint(1000,9999)}",
            "Address_Street": f"{random.randint(100,9999)} {random.choice(['Oak','Maple','Main','Elm','Cedar','Pine','Walnut','Cherry'])} {random.choice(['St','Ave','Rd','Ln','Dr','Ct'])}",
            "Address_City": random.choice(["Lancaster","Lititz","Ephrata","Manheim","Columbia","Elizabethtown","Mount Joy","Strasburg"]),
            "Address_State": "PA",
            "Address_Zip": random.choice(["17601","17602","17603","17604","17543","17522","17545","17512","17022","17552"]),
            "Phone": f"(717) {random.randint(200,999)}-{random.randint(1000,9999)}",
            "Email": f"{fname.lower()}.{lname.lower()}{random.randint(1,99)}@email.com",
            "Insurance_Provider": random.choice(INSURANCE_PROVIDERS),
            "Insurance_PolicyNum": f"POL{random.randint(100000,999999)}",
            "Insurance_GroupNum": f"GRP{random.randint(10000,99999)}",
            "Allergies": random.choice(ALLERGIES),
            "Status": random.choices(["Active","Inactive"], weights=[95,5])[0],
            "z_CreatedTimestamp": datetime.now().isoformat(),
            "z_ModifiedTimestamp": datetime.now().isoformat(),
            "z_CreatedBy": "System_Seed"
        })
    return patients

def generate_pharmacies():
    """Generate pharmacy locations."""
    return [
        {"__pk_PharmacyID": fm_uuid(), "Name": "EPLS Specialty Pharmacy - Main", "Type": "Internal",
         "NCPDP_ID": f"NCPDP{random.randint(100000,999999)}", "Address_Street": "2250 Erin Ct",
         "Address_City": "Lancaster", "Address_State": "PA", "Address_Zip": "17601",
         "Phone": "(717) 555-0100", "DEA_Number": f"AE{random.randint(1000000,9999999)}", "Status": "Active"},
        {"__pk_PharmacyID": fm_uuid(), "Name": "EPLS Specialty Pharmacy - East", "Type": "Internal",
         "NCPDP_ID": f"NCPDP{random.randint(100000,999999)}", "Address_Street": "1080 N Plum St",
         "Address_City": "Lancaster", "Address_State": "PA", "Address_Zip": "17602",
         "Phone": "(717) 555-0200", "DEA_Number": f"AE{random.randint(1000000,9999999)}", "Status": "Active"},
        {"__pk_PharmacyID": fm_uuid(), "Name": "EPLS Mail-Order Fulfillment", "Type": "Mail-Order",
         "NCPDP_ID": f"NCPDP{random.randint(100000,999999)}", "Address_Street": "500 Commerce Dr",
         "Address_City": "Lancaster", "Address_State": "PA", "Address_Zip": "17603",
         "Phone": "(717) 555-0300", "DEA_Number": f"AE{random.randint(1000000,9999999)}", "Status": "Active"},
        {"__pk_PharmacyID": fm_uuid(), "Name": "CVS Pharmacy #4821", "Type": "Partner",
         "NCPDP_ID": f"NCPDP{random.randint(100000,999999)}", "Address_Street": "1603 Lincoln Hwy E",
         "Address_City": "Lancaster", "Address_State": "PA", "Address_Zip": "17602",
         "Phone": "(717) 555-0400", "DEA_Number": None, "Status": "Active"},
        {"__pk_PharmacyID": fm_uuid(), "Name": "Rite Aid #1237", "Type": "Partner",
         "NCPDP_ID": f"NCPDP{random.randint(100000,999999)}", "Address_Street": "878 E Main St",
         "Address_City": "Ephrata", "Address_State": "PA", "Address_Zip": "17522",
         "Phone": "(717) 555-0500", "DEA_Number": None, "Status": "Active"},
    ]

# ============================================================================
# SAMPLE MEDICATIONS (Pre-baked — simulates OpenFDA sync results)
# ============================================================================
SAMPLE_MEDICATIONS = [
    {"Brand_Name": "Lipitor", "Generic_Name": "Atorvastatin Calcium", "Manufacturer": "Pfizer", "Dosage_Form": "Tablet", "Strength": "20 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 15.99, "Indications_Text": "Treatment of hyperlipidemia and mixed dyslipidemia. Reduces LDL cholesterol, total cholesterol, and triglycerides. Prevention of cardiovascular disease in patients with multiple risk factors."},
    {"Brand_Name": "Lisinopril", "Generic_Name": "Lisinopril", "Manufacturer": "Lupin", "Dosage_Form": "Tablet", "Strength": "10 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 8.50, "Indications_Text": "Treatment of hypertension, heart failure, and to improve survival after acute myocardial infarction. ACE inhibitor that works by relaxing blood vessels."},
    {"Brand_Name": "Metformin HCl", "Generic_Name": "Metformin Hydrochloride", "Manufacturer": "Teva", "Dosage_Form": "Tablet", "Strength": "500 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 6.25, "Indications_Text": "Improvement of glycemic control in adults with type 2 diabetes mellitus. First-line pharmacotherapy for diabetes management."},
    {"Brand_Name": "Amlodipine", "Generic_Name": "Amlodipine Besylate", "Manufacturer": "Mylan", "Dosage_Form": "Tablet", "Strength": "5 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 9.75, "Indications_Text": "Treatment of hypertension and coronary artery disease including chronic stable angina and vasospastic angina. Calcium channel blocker."},
    {"Brand_Name": "Omeprazole", "Generic_Name": "Omeprazole", "Manufacturer": "Dr. Reddy's", "Dosage_Form": "Capsule", "Strength": "20 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 11.00, "Indications_Text": "Treatment of gastroesophageal reflux disease (GERD), erosive esophagitis, and pathological hypersecretory conditions. Proton pump inhibitor."},
    {"Brand_Name": "Levothyroxine", "Generic_Name": "Levothyroxine Sodium", "Manufacturer": "Synthroid/AbbVie", "Dosage_Form": "Tablet", "Strength": "50 mcg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 22.50, "Indications_Text": "Replacement therapy in hypothyroidism. Treatment of pituitary TSH suppression in thyroid cancer management."},
    {"Brand_Name": "Gabapentin", "Generic_Name": "Gabapentin", "Manufacturer": "Greenstone", "Dosage_Form": "Capsule", "Strength": "300 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 12.00, "Indications_Text": "Management of postherpetic neuralgia in adults. Adjunctive therapy for partial seizures with and without secondary generalization."},
    {"Brand_Name": "Sertraline", "Generic_Name": "Sertraline Hydrochloride", "Manufacturer": "Aurobindo", "Dosage_Form": "Tablet", "Strength": "50 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 10.25, "Indications_Text": "Treatment of major depressive disorder, obsessive-compulsive disorder, panic disorder, PTSD, and social anxiety disorder. Selective serotonin reuptake inhibitor (SSRI)."},
    {"Brand_Name": "Amoxicillin", "Generic_Name": "Amoxicillin", "Manufacturer": "Sandoz", "Dosage_Form": "Capsule", "Strength": "500 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 7.99, "Indications_Text": "Treatment of infections due to susceptible organisms including ear, nose, throat, lower respiratory tract, skin, and urinary tract infections."},
    {"Brand_Name": "Metoprolol", "Generic_Name": "Metoprolol Tartrate", "Manufacturer": "Zydus", "Dosage_Form": "Tablet", "Strength": "25 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 8.00, "Indications_Text": "Treatment of hypertension, angina pectoris, and heart failure. Beta-adrenergic blocker that reduces heart rate and blood pressure."},
    {"Brand_Name": "Losartan", "Generic_Name": "Losartan Potassium", "Manufacturer": "Torrent", "Dosage_Form": "Tablet", "Strength": "50 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 13.50, "Indications_Text": "Treatment of hypertension, diabetic nephropathy with elevated serum creatinine, and stroke risk reduction in patients with hypertension and left ventricular hypertrophy."},
    {"Brand_Name": "Albuterol", "Generic_Name": "Albuterol Sulfate", "Manufacturer": "Cipla", "Dosage_Form": "Inhalation Aerosol", "Strength": "90 mcg/inh", "Route": "Inhalation", "DEA_Schedule": None, "Current_Price": 35.00, "Indications_Text": "Treatment and prevention of bronchospasm in patients with reversible obstructive airway disease, including asthma. Short-acting beta-2 agonist."},
    {"Brand_Name": "Hydrochlorothiazide", "Generic_Name": "Hydrochlorothiazide", "Manufacturer": "Amneal", "Dosage_Form": "Tablet", "Strength": "25 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 5.50, "Indications_Text": "Treatment of hypertension and edema associated with congestive heart failure, hepatic cirrhosis, and corticosteroid and estrogen therapy. Thiazide diuretic."},
    {"Brand_Name": "Atorvastatin", "Generic_Name": "Atorvastatin Calcium", "Manufacturer": "Ranbaxy", "Dosage_Form": "Tablet", "Strength": "40 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 18.75, "Indications_Text": "Treatment of primary hyperlipidemia and mixed dyslipidemia. HMG-CoA reductase inhibitor for cardiovascular risk reduction."},
    {"Brand_Name": "Prednisone", "Generic_Name": "Prednisone", "Manufacturer": "Hikma", "Dosage_Form": "Tablet", "Strength": "10 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 6.00, "Indications_Text": "Treatment of inflammatory and autoimmune conditions including allergic disorders, dermatologic conditions, rheumatic disorders, and respiratory diseases. Corticosteroid."},
    {"Brand_Name": "Furosemide", "Generic_Name": "Furosemide", "Manufacturer": "Mylan", "Dosage_Form": "Tablet", "Strength": "40 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 5.25, "Indications_Text": "Treatment of edema associated with congestive heart failure, hepatic cirrhosis, and renal disease including nephrotic syndrome. Loop diuretic for fluid retention."},
    {"Brand_Name": "Tramadol", "Generic_Name": "Tramadol Hydrochloride", "Manufacturer": "Sun Pharma", "Dosage_Form": "Tablet", "Strength": "50 mg", "Route": "Oral", "DEA_Schedule": "IV", "Current_Price": 14.50, "Indications_Text": "Management of pain severe enough to require an opioid analgesic. Centrally acting synthetic opioid analgesic."},
    {"Brand_Name": "Alprazolam", "Generic_Name": "Alprazolam", "Manufacturer": "Greenstone", "Dosage_Form": "Tablet", "Strength": "0.5 mg", "Route": "Oral", "DEA_Schedule": "IV", "Current_Price": 11.25, "Indications_Text": "Management of anxiety disorders and short-term relief of anxiety symptoms. Treatment of panic disorder with or without agoraphobia."},
    {"Brand_Name": "Pantoprazole", "Generic_Name": "Pantoprazole Sodium", "Manufacturer": "Aurobindo", "Dosage_Form": "Tablet", "Strength": "40 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 16.00, "Indications_Text": "Short-term treatment of erosive esophagitis associated with GERD. Maintenance of healing of erosive esophagitis. Proton pump inhibitor."},
    {"Brand_Name": "Cephalexin", "Generic_Name": "Cephalexin", "Manufacturer": "Lupin", "Dosage_Form": "Capsule", "Strength": "500 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 9.99, "Indications_Text": "Treatment of respiratory tract infections, otitis media, skin and skin structure infections, bone infections, and genitourinary tract infections."},
    {"Brand_Name": "Escitalopram", "Generic_Name": "Escitalopram Oxalate", "Manufacturer": "Teva", "Dosage_Form": "Tablet", "Strength": "10 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 12.75, "Indications_Text": "Treatment of major depressive disorder and generalized anxiety disorder. Selective serotonin reuptake inhibitor (SSRI)."},
    {"Brand_Name": "Duloxetine", "Generic_Name": "Duloxetine Hydrochloride", "Manufacturer": "Dr. Reddy's", "Dosage_Form": "Capsule", "Strength": "30 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 19.50, "Indications_Text": "Treatment of major depressive disorder, generalized anxiety disorder, diabetic peripheral neuropathic pain, fibromyalgia, and chronic musculoskeletal pain."},
    {"Brand_Name": "Montelukast", "Generic_Name": "Montelukast Sodium", "Manufacturer": "Torrent", "Dosage_Form": "Tablet", "Strength": "10 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 15.00, "Indications_Text": "Prophylaxis and chronic treatment of asthma. Relief of symptoms of allergic rhinitis. Prevention of exercise-induced bronchospasm."},
    {"Brand_Name": "Rosuvastatin", "Generic_Name": "Rosuvastatin Calcium", "Manufacturer": "Hikma", "Dosage_Form": "Tablet", "Strength": "10 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 14.25, "Indications_Text": "Treatment of primary hyperlipidemia and mixed dyslipidemia. Slowing of atherosclerosis progression. Primary prevention of cardiovascular disease."},
    {"Brand_Name": "Meloxicam", "Generic_Name": "Meloxicam", "Manufacturer": "Lupin", "Dosage_Form": "Tablet", "Strength": "15 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 8.75, "Indications_Text": "Treatment of osteoarthritis and rheumatoid arthritis. Nonsteroidal anti-inflammatory drug (NSAID) for pain and inflammation relief."},
    {"Brand_Name": "Insulin Glargine", "Generic_Name": "Insulin Glargine", "Manufacturer": "Sanofi", "Dosage_Form": "Injection", "Strength": "100 units/mL", "Route": "Subcutaneous", "DEA_Schedule": None, "Current_Price": 285.00, "Indications_Text": "Improvement of glycemic control in adults and pediatric patients with type 1 diabetes mellitus and adults with type 2 diabetes mellitus. Long-acting insulin analog."},
    {"Brand_Name": "Humira", "Generic_Name": "Adalimumab", "Manufacturer": "AbbVie", "Dosage_Form": "Injection", "Strength": "40 mg/0.8mL", "Route": "Subcutaneous", "DEA_Schedule": None, "Current_Price": 5800.00, "Indications_Text": "Treatment of rheumatoid arthritis, psoriatic arthritis, ankylosing spondylitis, Crohn's disease, ulcerative colitis, plaque psoriasis, and juvenile idiopathic arthritis."},
    {"Brand_Name": "Eliquis", "Generic_Name": "Apixaban", "Manufacturer": "Bristol-Myers Squibb", "Dosage_Form": "Tablet", "Strength": "5 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 520.00, "Indications_Text": "Reduction of risk of stroke and systemic embolism in nonvalvular atrial fibrillation. Treatment and prevention of deep vein thrombosis and pulmonary embolism."},
    {"Brand_Name": "Jardiance", "Generic_Name": "Empagliflozin", "Manufacturer": "Boehringer Ingelheim", "Dosage_Form": "Tablet", "Strength": "10 mg", "Route": "Oral", "DEA_Schedule": None, "Current_Price": 550.00, "Indications_Text": "Treatment of type 2 diabetes mellitus. Reduction of risk of cardiovascular death in adults with type 2 diabetes and established cardiovascular disease. SGLT2 inhibitor."},
    {"Brand_Name": "Ozempic", "Generic_Name": "Semaglutide", "Manufacturer": "Novo Nordisk", "Dosage_Form": "Injection", "Strength": "1 mg/dose", "Route": "Subcutaneous", "DEA_Schedule": None, "Current_Price": 935.00, "Indications_Text": "Adjunct to diet and exercise to improve glycemic control in adults with type 2 diabetes mellitus. Reduction of risk of major adverse cardiovascular events. GLP-1 receptor agonist."},
]

def generate_medications():
    """Generate medication records with NDC codes and search index."""
    meds = []
    for i, med in enumerate(SAMPLE_MEDICATIONS):
        ndc = f"{random.randint(10000,99999)}-{random.randint(100,999)}-{random.randint(10,99)}"
        med_record = {
            "__pk_MedID": fm_uuid(),
            "NDC": ndc,
            **med,
            "c_Search_Index": f"{med['Brand_Name']} {med['Generic_Name']} {med['Manufacturer']}",
            "JSON_Payload": json.dumps({"source": "OpenFDA", "sync_date": datetime.now().isoformat(), "ndc": ndc}),
            "zz_Embedding_Vector": None,
            "Status": "Active",
            "z_CreatedTimestamp": datetime.now().isoformat(),
            "z_ModifiedTimestamp": datetime.now().isoformat()
        }
        meds.append(med_record)
    return meds

def generate_claims(patients, providers, pharmacies, medications, count=200):
    """Generate realistic claim records with lookup pricing."""
    claims = []
    statuses = ['Approved','Approved','Approved','Pending','Denied','Under Review']
    for i in range(count):
        patient = random.choice(patients)
        provider = random.choice(providers)
        pharmacy = random.choice(pharmacies)
        med = random.choice(medications)
        drug_price = med["Current_Price"]
        copay = round(random.choice([10, 15, 20, 25, 30, 35, 50]), 2)
        total = round(drug_price * random.uniform(1.0, 1.5), 2)
        plan_paid = round(total - copay, 2)
        approval = random.choice(statuses)
        days_ago = random.randint(1, 365)
        claim_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        claim = {
            "__pk_ClaimID": fm_uuid(),
            "_fk_PatientID": patient["__pk_PatientID"],
            "_fk_ProviderID": provider["__pk_ProviderID"],
            "_fk_PharmacyID": pharmacy["__pk_PharmacyID"],
            "_fk_ScriptID": None,
            "Claim_Date": claim_date,
            "Claim_Type": random.choice(["Pharmacy","Pharmacy","Pharmacy","Specialty"]),
            "Lookup_DrugPrice": drug_price,
            "Copay_Amount": copay,
            "Deductible_Applied": round(random.choice([0, 0, 0, 50, 100, 250]), 2),
            "Plan_Paid": max(plan_paid, 0),
            "Patient_Responsibility": copay,
            "Total_Claim_Amount": total,
            "Approval_Status": approval,
            "Approved_By": "pharmacist@epls.com" if approval == "Approved" else None,
            "Approved_Timestamp": datetime.now().isoformat() if approval == "Approved" else None,
            "Approval_Signature": hashlib.sha256(f"SIG-{fm_uuid()}".encode()).hexdigest()[:32] if approval == "Approved" else None,
            "Denial_Reason": "Prior authorization required" if approval == "Denied" else None,
            "Status": "Adjudicated" if approval == "Approved" else "Open",
            "z_CreatedTimestamp": claim_date + "T08:00:00",
            "z_ModifiedTimestamp": datetime.now().isoformat(),
            "z_CreatedBy": random.choice(["tech1@epls.com","tech2@epls.com","tech3@epls.com"]),
            "z_RecordLocked": 1 if approval == "Approved" else 0,
            # Denormalized for display convenience
            "_patient_name": f"{patient['Name_Last']}, {patient['Name_First']}",
            "_provider_name": f"Dr. {provider['Name_Last']}",
            "_drug_name": med["Brand_Name"],
            "_pharmacy_name": pharmacy["Name"]
        }
        claims.append(claim)
    return claims

def generate_audit_log(claims):
    """Generate realistic audit trail entries."""
    log = []
    actions = [
        ("CREATE", "Claims", "Claim_Type", None, "Pharmacy"),
        ("UPDATE", "Claims", "Approval_Status", "Pending", "Approved"),
        ("UPDATE", "Claims", "Approval_Status", "Pending", "Denied"),
        ("UPDATE", "Patients", "Insurance_Provider", "Aetna", "BlueCross BlueShield"),
        ("UPDATE", "Patients", "Phone", "(717) 555-0000", "(717) 555-1234"),
        ("CREATE", "Patients", None, None, None),
        ("APPROVE", "Claims", "Approval_Status", "Pending", "Approved"),
        ("LOGIN", None, None, None, None),
    ]
    accounts = ["pharmacist@epls.com", "tech1@epls.com", "tech2@epls.com", "auditor@epls.com", "admin@epls.com"]
    for i in range(300):
        action = random.choice(actions)
        days_ago = random.randint(0, 90)
        ts = (datetime.now() - timedelta(days=days_ago, hours=random.randint(0,23), minutes=random.randint(0,59))).isoformat()
        entry = {
            "__pk_AuditID": fm_uuid(),
            "Timestamp": ts,
            "Account_Name": random.choice(accounts),
            "Table_Name": action[1] if action[1] else "System",
            "Record_ID": random.choice(claims)["__pk_ClaimID"] if claims and action[1] else fm_uuid(),
            "Action": action[0],
            "Field_Name": action[2],
            "Old_Value": action[3],
            "New_Value": action[4],
            "IP_Address": f"192.168.1.{random.randint(10,254)}",
            "Session_ID": fm_uuid()[:8]
        }
        log.append(entry)
    # Sort by timestamp
    log.sort(key=lambda x: x["Timestamp"], reverse=True)
    return log

# ============================================================================
# MAIN: Generate all data and write to JSON files
# ============================================================================
if __name__ == "__main__":
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  THE LANCASTER HUB — Data Seed Generator               ║")
    print("║  FileMaker Equivalent: Sync_Medication_Data + Mockaroo  ║")
    print("╚══════════════════════════════════════════════════════════╝")

    random.seed(42)  # Reproducible data

    print("\n[1/6] Generating 50 Lancaster-area providers...")
    providers = generate_providers()

    print("[2/6] Generating 500 HIPAA-safe patient records...")
    patients = generate_patients(providers, 500)

    print("[3/6] Generating pharmacy locations...")
    pharmacies = generate_pharmacies()

    print("[4/6] Generating 30 medications (OpenFDA sync simulation)...")
    medications = generate_medications()

    print("[5/6] Generating 200 claim records...")
    claims = generate_claims(patients, providers, pharmacies, medications, 200)

    print("[6/6] Generating 300 audit trail entries (ALCOA+)...")
    audit_log = generate_audit_log(claims)

    # Write all data
    data_dir = "app/data"
    datasets = {
        "providers": providers,
        "patients": patients,
        "pharmacies": pharmacies,
        "medications": medications,
        "claims": claims,
        "audit_log": audit_log
    }

    for name, data in datasets.items():
        filepath = f"{data_dir}/{name}.json"
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"   ✓ {filepath} ({len(data)} records)")

    # Summary stats
    total = sum(len(d) for d in datasets.values())
    print(f"\n{'='*58}")
    print(f"  TOTAL: {total} records across {len(datasets)} tables")
    print(f"{'='*58}")
    print("\nData files written to app/data/")
    print("Ready for GitHub Pages deployment.")
