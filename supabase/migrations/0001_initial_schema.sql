-- Migration 0001: Initial Production Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/painfnxuqzwtmowddogt/sql)

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'DIVISION_OFFICER', 'SUB_DIVISION_OFFICER');
    CREATE TYPE highway_status AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'UNDER_CONSTRUCTION', 'CLOSED');
    CREATE TYPE dlp_status AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'COMPLETED');
    CREATE TYPE blackspot_severity AS ENUM ('FATAL', 'HIGH', 'MEDIUM', 'LOW');
    CREATE TYPE legal_case_status AS ENUM ('PENDING', 'ONGOING', 'DISPOSED', 'STAYED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. HIGHWAYS TABLE
CREATE TABLE IF NOT EXISTS public.highways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    road_code VARCHAR(100) UNIQUE NOT NULL,
    road_name VARCHAR(255) NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    length_km DECIMAL(10, 3) NOT NULL CHECK (length_km > 0),
    lanes INTEGER DEFAULT 2 CHECK (lanes > 0),
    district VARCHAR(100) NOT NULL,
    division_name VARCHAR(100) NOT NULL,
    status highway_status DEFAULT 'ACTIVE',
    geom GEOMETRY(LINESTRING, 4326),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HIGHWAY SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.highway_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highway_id UUID REFERENCES public.highways(id) ON DELETE CASCADE NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    start_km DECIMAL(10, 3) NOT NULL CHECK (start_km >= 0),
    end_km DECIMAL(10, 3) NOT NULL CHECK (end_km > start_km),
    lane_count INTEGER DEFAULT 2,
    carriageway_type VARCHAR(100),
    pavement_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DLP CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.dlp_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highway_id UUID REFERENCES public.highways(id) ON DELETE CASCADE NOT NULL,
    contractor_name VARCHAR(255) NOT NULL,
    contract_mode VARCHAR(50) DEFAULT 'EPC',
    work_description TEXT,
    completion_date DATE NOT NULL,
    dlp_expiry_date DATE NOT NULL,
    status dlp_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ACCIDENT BLACKSPOTS TABLE
CREATE TABLE IF NOT EXISTS public.accident_blackspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highway_id UUID REFERENCES public.highways(id) ON DELETE CASCADE NOT NULL,
    chainage_km DECIMAL(10, 3) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    severity blackspot_severity DEFAULT 'HIGH',
    accidents_count INTEGER DEFAULT 1 CHECK (accidents_count >= 0),
    fatalities_count INTEGER DEFAULT 0 CHECK (fatalities_count >= 0),
    mitigation_status VARCHAR(100) DEFAULT 'PROPOSED',
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. LAWYERS TABLE
CREATE TABLE IF NOT EXISTS public.lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bar_council_no VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    specialization VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LEGAL CASES TABLE
CREATE TABLE IF NOT EXISTS public.legal_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    court_name VARCHAR(150) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    status legal_case_status DEFAULT 'PENDING',
    petitioner VARCHAR(255),
    respondent VARCHAR(255) DEFAULT 'NHAI / Highways Dept',
    lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,
    next_hearing_date DATE,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.highways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highway_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accident_blackspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;

-- Read policies for public/anon/authenticated users
CREATE POLICY "Enable select for all users" ON public.highways FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.highway_sections FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.dlp_contracts FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.accident_blackspots FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.lawyers FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.legal_cases FOR SELECT USING (true);

-- Insert/Update/Delete policies for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON public.highways FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.highways FOR UPDATE TO authenticated USING (true);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_highways_road_code ON public.highways(road_code);
CREATE INDEX IF NOT EXISTS idx_highways_district ON public.highways(district);
CREATE INDEX IF NOT EXISTS idx_sections_highway ON public.highway_sections(highway_id);
CREATE INDEX IF NOT EXISTS idx_dlp_expiry ON public.dlp_contracts(dlp_expiry_date);
CREATE INDEX IF NOT EXISTS idx_blackspots_severity ON public.accident_blackspots(severity);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON public.legal_cases(status);
