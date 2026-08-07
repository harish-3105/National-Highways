-- Migration V2: Add Sample Data Modules (DLP Contracts, Chainage Bar Chart, Blackspots, Legal Cases & Lawyers)

-- 1. Create DLP Contracts table
CREATE TABLE IF NOT EXISTS dlp_contracts (
    id SERIAL PRIMARY KEY,
    highway_id INTEGER REFERENCES highways(id) ON DELETE CASCADE,
    highway_code VARCHAR(50) NOT NULL,
    stretch_name VARCHAR(255) NOT NULL,
    from_km DECIMAL(10, 3) NOT NULL,
    to_km DECIMAL(10, 3) NOT NULL,
    length_km DECIMAL(10, 3) NOT NULL,
    contractor_name VARCHAR(255) NOT NULL,
    contract_mode VARCHAR(50) DEFAULT 'EPC', -- EPC, STMC, PBMC, Annual Plan
    work_description TEXT,
    doc_date DATE NOT NULL, -- Date of Completion
    dlp_expiry_date DATE NOT NULL, -- DLP Expiry Date (typically 5 years)
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRING_SOON, EXPIRED, COMPLETED
    division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sub_division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Highway Chainages table (for linear bar chart milestone view)
CREATE TABLE IF NOT EXISTS highway_chainages (
    id SERIAL PRIMARY KEY,
    highway_id INTEGER REFERENCES highways(id) ON DELETE CASCADE,
    highway_code VARCHAR(50) NOT NULL,
    chainage_km DECIMAL(10, 3) NOT NULL,
    town_name VARCHAR(255),
    traffic_pcu INTEGER,
    row_width VARCHAR(50),
    carriageway_spec VARCHAR(100),
    remarks TEXT,
    active_work_desc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Accident Blackspots table
CREATE TABLE IF NOT EXISTS accident_blackspots (
    id SERIAL PRIMARY KEY,
    highway_id INTEGER REFERENCES highways(id) ON DELETE CASCADE,
    highway_code VARCHAR(50) NOT NULL,
    chainage_km DECIMAL(10, 3) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    severity VARCHAR(50) DEFAULT 'HIGH', -- FATAL, HIGH, MEDIUM, LOW
    accidents_count INTEGER DEFAULT 1,
    fatalities_count INTEGER DEFAULT 0,
    injuries_count INTEGER DEFAULT 0,
    accident_date DATE,
    time_of_day VARCHAR(50), -- DAYTIME, NIGHTTIME
    weather_condition VARCHAR(50), -- CLEAR, MONSOON, FOG
    division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sub_division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bar_council_no VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    specialization VARCHAR(100),
    office_address TEXT,
    assigned_sub_division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Legal Cases table
CREATE TABLE IF NOT EXISTS legal_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    court_name VARCHAR(150) NOT NULL, -- Supreme Court, High Court, NGT, Arbitral Tribunal, District Court
    case_type VARCHAR(100) NOT NULL, -- Land Acquisition, Arbitration, Environmental, Contractor Claim, Public Interest
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ONGOING, DISPOSED, STAYED
    petitioner VARCHAR(255),
    respondent VARCHAR(255) DEFAULT 'NHAI / Ministry of Road Transport',
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE SET NULL,
    division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sub_division_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    next_hearing_date DATE,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_dlp_expiry ON dlp_contracts(dlp_expiry_date);
CREATE INDEX IF NOT EXISTS idx_dlp_division ON dlp_contracts(division_id);
CREATE INDEX IF NOT EXISTS idx_chainages_highway ON highway_chainages(highway_id, chainage_km);
CREATE INDEX IF NOT EXISTS idx_blackspots_division ON accident_blackspots(division_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_lawyer ON legal_cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_subdiv ON legal_cases(sub_division_id);
