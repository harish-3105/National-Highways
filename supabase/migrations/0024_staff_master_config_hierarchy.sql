-- Migration 0024: Staff Master Config Relational Parent-Child Hierarchy Schema & Initial Seed

-- 1. Add parent_category and parent_value columns to staff_master_config
ALTER TABLE public.staff_master_config ADD COLUMN IF NOT EXISTS parent_category TEXT;
ALTER TABLE public.staff_master_config ADD COLUMN IF NOT EXISTS parent_value TEXT;

-- 2. Create index for fast parent-child hierarchical lookup
CREATE INDEX IF NOT EXISTS idx_staff_master_config_parent ON public.staff_master_config(parent_category, parent_value);
CREATE INDEX IF NOT EXISTS idx_staff_master_config_category ON public.staff_master_config(category);

-- 3. Seed Standard Tamil Nadu Highway Offices
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
('office', 'Office of the Director General, Highways', NULL, NULL),
('office', 'Office of the Chief Engineer (NH), Chennai', NULL, NULL),
('office', 'Office of the Superintending Engineer (NH)', NULL, NULL),
('office', 'Office of the Divisional Engineer (NH)', NULL, NULL),
('office', 'Office of the Assistant Divisional Engineer (NH)', NULL, NULL),
('office', 'Office of the Assistant Engineer (NH)', NULL, NULL),
('office', 'Quality Control & Research Wing', NULL, NULL),
('office', 'Planning, Designs & Investigation Wing', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 4. Seed Circles (Tier 2)
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
('circle', 'Chennai', NULL, NULL),
('circle', 'Salem', NULL, NULL),
('circle', 'Madurai', NULL, NULL),
('circle', 'Coimbatore', NULL, NULL),
('circle', 'Tiruchirappalli', NULL, NULL),
('circle', 'Tirunelveli', NULL, NULL),
('circle', 'Villupuram', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 5. Seed Divisions with Parent Circle (Tier 3 -> Tier 2)
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
-- Chennai Circle
('division', 'Chennai', 'circle', 'Chennai'),
('division', 'Chengalpattu', 'circle', 'Chennai'),
('division', 'Tiruvallur', 'circle', 'Chennai'),
-- Salem Circle
('division', 'Salem', 'circle', 'Salem'),
('division', 'Namakkal', 'circle', 'Salem'),
('division', 'Dharmapuri', 'circle', 'Salem'),
('division', 'Krishnagiri', 'circle', 'Salem'),
-- Madurai Circle
('division', 'Madurai', 'circle', 'Madurai'),
('division', 'Dindigul', 'circle', 'Madurai'),
('division', 'Theni', 'circle', 'Madurai'),
('division', 'Ramanathapuram', 'circle', 'Madurai'),
('division', 'Sivagangai', 'circle', 'Madurai'),
-- Coimbatore Circle
('division', 'Coimbatore', 'circle', 'Coimbatore'),
('division', 'Tiruppur', 'circle', 'Coimbatore'),
('division', 'Erode', 'circle', 'Coimbatore'),
-- Tiruchirappalli Circle
('division', 'Tiruchirappalli', 'circle', 'Tiruchirappalli'),
('division', 'Thanjavur', 'circle', 'Tiruchirappalli'),
('division', 'Karur', 'circle', 'Tiruchirappalli'),
('division', 'Pudukkottai', 'circle', 'Tiruchirappalli'),
-- Tirunelveli Circle
('division', 'Tirunelveli', 'circle', 'Tirunelveli'),
('division', 'Thoothukudi', 'circle', 'Tirunelveli'),
('division', 'Nagercoil', 'circle', 'Tirunelveli'),
-- Villupuram Circle
('division', 'Villupuram', 'circle', 'Villupuram'),
('division', 'Cuddalore', 'circle', 'Villupuram'),
('division', 'Vellore', 'circle', 'Villupuram')
ON CONFLICT DO NOTHING;

-- 6. Seed Sub-Divisions with Parent Division (Tier 4 -> Tier 3)
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
-- Chennai Division
('sub_division', 'Chennai South', 'division', 'Chennai'),
('sub_division', 'Chennai North', 'division', 'Chennai'),
('sub_division', 'Guindy', 'division', 'Chennai'),
('sub_division', 'Tambaram', 'division', 'Chennai'),
('sub_division', 'Poonamallee', 'division', 'Chennai'),
-- Chengalpattu Division
('sub_division', 'Chengalpattu', 'division', 'Chengalpattu'),
('sub_division', 'Madurantakam', 'division', 'Chengalpattu'),
('sub_division', 'Kancheepuram', 'division', 'Chengalpattu'),
('sub_division', 'Sriperumbudur', 'division', 'Chengalpattu'),
-- Tiruvallur Division
('sub_division', 'Tiruvallur', 'division', 'Tiruvallur'),
('sub_division', 'Ponneri', 'division', 'Tiruvallur'),
('sub_division', 'Tiruttani', 'division', 'Tiruvallur'),
('sub_division', 'Gummidipoondi', 'division', 'Tiruvallur'),
-- Salem Division
('sub_division', 'Salem', 'division', 'Salem'),
('sub_division', 'Omalur', 'division', 'Salem'),
('sub_division', 'Attur', 'division', 'Salem'),
('sub_division', 'Sankari', 'division', 'Salem'),
('sub_division', 'Mettur', 'division', 'Salem'),
-- Namakkal Division
('sub_division', 'Namakkal', 'division', 'Namakkal'),
('sub_division', 'Rasipuram', 'division', 'Namakkal'),
('sub_division', 'Tiruchengode', 'division', 'Namakkal'),
('sub_division', 'Paramathi Velur', 'division', 'Namakkal'),
-- Dharmapuri Division
('sub_division', 'Dharmapuri', 'division', 'Dharmapuri'),
('sub_division', 'Harur', 'division', 'Dharmapuri'),
('sub_division', 'Palacode', 'division', 'Dharmapuri'),
('sub_division', 'Pennagaram', 'division', 'Dharmapuri'),
-- Krishnagiri Division
('sub_division', 'Krishnagiri', 'division', 'Krishnagiri'),
('sub_division', 'Hosur', 'division', 'Krishnagiri'),
('sub_division', 'Pochampalli', 'division', 'Krishnagiri'),
('sub_division', 'Uthangarai', 'division', 'Krishnagiri'),
-- Madurai Division
('sub_division', 'Madurai North', 'division', 'Madurai'),
('sub_division', 'Madurai South', 'division', 'Madurai'),
('sub_division', 'Usilampatti', 'division', 'Madurai'),
('sub_division', 'Melur', 'division', 'Madurai'),
('sub_division', 'Thirumangalam', 'division', 'Madurai'),
-- Dindigul Division
('sub_division', 'Dindigul', 'division', 'Dindigul'),
('sub_division', 'Palani', 'division', 'Dindigul'),
('sub_division', 'Kodaikanal', 'division', 'Dindigul'),
('sub_division', 'Nilakkottai', 'division', 'Dindigul'),
-- Theni Division
('sub_division', 'Theni', 'division', 'Theni'),
('sub_division', 'Periyakulam', 'division', 'Theni'),
('sub_division', 'Uthamapalayam', 'division', 'Theni'),
('sub_division', 'Bodinayakanur', 'division', 'Theni'),
-- Ramanathapuram Division
('sub_division', 'Ramanathapuram', 'division', 'Ramanathapuram'),
('sub_division', 'Paramakudi', 'division', 'Ramanathapuram'),
('sub_division', 'Rameswaram', 'division', 'Ramanathapuram'),
('sub_division', 'Tiruvadanai', 'division', 'Ramanathapuram'),
-- Sivagangai Division
('sub_division', 'Sivagangai', 'division', 'Sivagangai'),
('sub_division', 'Karaikudi', 'division', 'Sivagangai'),
('sub_division', 'Devakottai', 'division', 'Sivagangai'),
('sub_division', 'Manamadurai', 'division', 'Sivagangai'),
-- Coimbatore Division
('sub_division', 'Coimbatore North', 'division', 'Coimbatore'),
('sub_division', 'Coimbatore South', 'division', 'Coimbatore'),
('sub_division', 'Pollachi', 'division', 'Coimbatore'),
('sub_division', 'Mettupalayam', 'division', 'Coimbatore'),
('sub_division', 'Sulur', 'division', 'Coimbatore'),
-- Tiruppur Division
('sub_division', 'Tiruppur', 'division', 'Tiruppur'),
('sub_division', 'Dharapuram', 'division', 'Tiruppur'),
('sub_division', 'Udumalpet', 'division', 'Tiruppur'),
('sub_division', 'Kangeyam', 'division', 'Tiruppur'),
-- Erode Division
('sub_division', 'Erode', 'division', 'Erode'),
('sub_division', 'Gobichettipalayam', 'division', 'Erode'),
('sub_division', 'Perundurai', 'division', 'Erode'),
('sub_division', 'Bhavani', 'division', 'Erode'),
('sub_division', 'Sathyamangalam', 'division', 'Erode'),
-- Tiruchirappalli Division
('sub_division', 'Tiruchirappalli', 'division', 'Tiruchirappalli'),
('sub_division', 'Musiri', 'division', 'Tiruchirappalli'),
('sub_division', 'Lalgudi', 'division', 'Tiruchirappalli'),
('sub_division', 'Manapparai', 'division', 'Tiruchirappalli'),
-- Thanjavur Division
('sub_division', 'Thanjavur', 'division', 'Thanjavur'),
('sub_division', 'Kumbakonam', 'division', 'Thanjavur'),
('sub_division', 'Pattukkottai', 'division', 'Thanjavur'),
('sub_division', 'Orathanadu', 'division', 'Thanjavur'),
-- Karur Division
('sub_division', 'Karur', 'division', 'Karur'),
('sub_division', 'Kulithalai', 'division', 'Karur'),
('sub_division', 'Aravakurichi', 'division', 'Karur'),
-- Pudukkottai Division
('sub_division', 'Pudukkottai', 'division', 'Pudukkottai'),
('sub_division', 'Aranthangi', 'division', 'Pudukkottai'),
('sub_division', 'Illuppur', 'division', 'Pudukkottai'),
-- Tirunelveli Division
('sub_division', 'Tirunelveli', 'division', 'Tirunelveli'),
('sub_division', 'Ambasamudram', 'division', 'Tirunelveli'),
('sub_division', 'Tenkasi', 'division', 'Tirunelveli'),
('sub_division', 'Sankarankoil', 'division', 'Tirunelveli'),
-- Thoothukudi Division
('sub_division', 'Thoothukudi', 'division', 'Thoothukudi'),
('sub_division', 'Kovilpatti', 'division', 'Thoothukudi'),
('sub_division', 'Tiruchendur', 'division', 'Thoothukudi'),
('sub_division', 'Srivaikuntam', 'division', 'Thoothukudi'),
-- Nagercoil Division
('sub_division', 'Nagercoil', 'division', 'Nagercoil'),
('sub_division', 'Thuckalay', 'division', 'Nagercoil'),
('sub_division', 'Kuzhithurai', 'division', 'Nagercoil'),
('sub_division', 'Boothapandi', 'division', 'Nagercoil'),
-- Villupuram Division
('sub_division', 'Villupuram', 'division', 'Villupuram'),
('sub_division', 'Tindivanam', 'division', 'Villupuram'),
('sub_division', 'Kallakurichi', 'division', 'Villupuram'),
('sub_division', 'Gingee', 'division', 'Villupuram'),
-- Cuddalore Division
('sub_division', 'Cuddalore', 'division', 'Cuddalore'),
('sub_division', 'Chidambaram', 'division', 'Cuddalore'),
('sub_division', 'Virudhachalam', 'division', 'Cuddalore'),
('sub_division', 'Panruti', 'division', 'Cuddalore'),
-- Vellore Division
('sub_division', 'Vellore', 'division', 'Vellore'),
('sub_division', 'Ranipet', 'division', 'Vellore'),
('sub_division', 'Tirupattur', 'division', 'Vellore'),
('sub_division', 'Arakkonam', 'division', 'Vellore'),
('sub_division', 'Gudiyattam', 'division', 'Vellore')
ON CONFLICT DO NOTHING;

-- 7. Seed Designations
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
('designation', 'Director General (Highways)', NULL, NULL),
('designation', 'Chief Engineer (Highways)', NULL, NULL),
('designation', 'Superintending Engineer (Highways)', NULL, NULL),
('designation', 'Divisional Engineer (Highways)', NULL, NULL),
('designation', 'Assistant Divisional Engineer (Highways)', NULL, NULL),
('designation', 'Assistant Engineer (Highways)', NULL, NULL),
('designation', 'Junior Engineer (Highways)', NULL, NULL),
('designation', 'Head Draughting Officer', NULL, NULL),
('designation', 'Senior Draughting Officer', NULL, NULL),
('designation', 'Draughting Officer', NULL, NULL),
('designation', 'Administrative Officer', NULL, NULL),
('designation', 'Superintendent', NULL, NULL),
('designation', 'Assistant', NULL, NULL),
('designation', 'Junior Assistant', NULL, NULL),
('designation', 'Typist / Steno-Typist', NULL, NULL),
('designation', 'Office Assistant / Record Clerk', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 8. Seed Default Sections
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
('section', 'Section I (Headquarters)', NULL, NULL),
('section', 'Section II (Field Maintenance)', NULL, NULL),
('section', 'Section III (Bridge & Structures)', NULL, NULL),
('section', 'Section IV (Quality Assurance)', NULL, NULL),
('section', 'Road Safety & Inspection Unit', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 9. Seed Default Sub-Sections
INSERT INTO public.staff_master_config (category, value, parent_category, parent_value) VALUES
('sub_section', 'Sub-Section 1A (North Stretch)', NULL, NULL),
('sub_section', 'Sub-Section 1B (South Stretch)', NULL, NULL),
('sub_section', 'Sub-Section 2A (Bypass & Junctions)', NULL, NULL),
('sub_section', 'Sub-Section 2B (Structures & Culverts)', NULL, NULL)
ON CONFLICT DO NOTHING;
