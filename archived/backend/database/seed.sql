-- Sample data for testing and development

-- Insert Division users (reporting to admin)
INSERT INTO users (username, password_hash, name, email, role, parent_id, office_name, office_code)
VALUES 
    ('div_north', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'North Division', 'div.north@highways.gov', 'DIVISION', 1, 'Northern Division Office', 'NDO001'),
    ('div_south', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'South Division', 'div.south@highways.gov', 'DIVISION', 1, 'Southern Division Office', 'SDO001'),
    ('div_east', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'East Division', 'div.east@highways.gov', 'DIVISION', 1, 'Eastern Division Office', 'EDO001'),
    ('div_west', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'West Division', 'div.west@highways.gov', 'DIVISION', 1, 'Western Division Office', 'WDO001');

-- Insert Sub-Division users (reporting to divisions)
INSERT INTO users (username, password_hash, name, email, role, parent_id, office_name, office_code)
VALUES 
    ('subdiv_n1', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'North Sub-Division 1', 'subdiv.n1@highways.gov', 'SUB_DIVISION', 2, 'North Sub-Division 1', 'NSD001'),
    ('subdiv_n2', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'North Sub-Division 2', 'subdiv.n2@highways.gov', 'SUB_DIVISION', 2, 'North Sub-Division 2', 'NSD002'),
    ('subdiv_s1', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'South Sub-Division 1', 'subdiv.s1@highways.gov', 'SUB_DIVISION', 3, 'South Sub-Division 1', 'SSD001'),
    ('subdiv_e1', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'East Sub-Division 1', 'subdiv.e1@highways.gov', 'SUB_DIVISION', 4, 'East Sub-Division 1', 'ESD001'),
    ('subdiv_w1', '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6', 'West Sub-Division 1', 'subdiv.w1@highways.gov', 'SUB_DIVISION', 5, 'West Sub-Division 1', 'WSD001');

-- Insert sample highways with realistic coordinates
-- NH-1: Delhi to Amritsar (simplified route)
INSERT INTO highways (road_name, road_code, from_location, to_location, geom, division_id, sub_division_id, created_by, status)
VALUES (
    'National Highway 1',
    'NH-1',
    'Delhi',
    'Amritsar',
    ST_GeomFromText('LINESTRING(77.2090 28.6139, 77.1025 29.5816, 76.7794 30.7333, 75.8573 30.9010, 74.8723 31.6340)', 4326),
    2,
    6,
    2,
    'ACTIVE'
);

-- NH-2: Delhi to Kolkata (simplified route)
INSERT INTO highways (road_name, road_code, from_location, to_location, geom, division_id, sub_division_id, created_by, status)
VALUES (
    'National Highway 2',
    'NH-2',
    'Delhi',
    'Kolkata',
    ST_GeomFromText('LINESTRING(77.2090 28.6139, 78.0081 27.1767, 81.8463 25.4358, 84.1279 23.6102, 88.3639 22.5726)', 4326),
    4,
    8,
    4,
    'ACTIVE'
);

-- NH-8: Delhi to Mumbai (simplified route)
INSERT INTO highways (road_name, road_code, from_location, to_location, geom, division_id, sub_division_id, created_by, status)
VALUES (
    'National Highway 8',
    'NH-8',
    'Delhi',
    'Mumbai',
    ST_GeomFromText('LINESTRING(77.2090 28.6139, 76.6394 28.5355, 75.7873 26.9124, 73.8567 18.5204, 72.8777 19.0760)', 4326),
    5,
    9,
    5,
    'ACTIVE'
);

-- NH-7: Varanasi to Kanyakumari (simplified route)
INSERT INTO highways (road_name, road_code, from_location, to_location, geom, division_id, sub_division_id, created_by, status)
VALUES (
    'National Highway 7',
    'NH-7',
    'Varanasi',
    'Kanyakumari',
    ST_GeomFromText('LINESTRING(82.9739 25.3176, 81.6296 21.2514, 78.4867 17.3850, 77.5946 12.9716, 77.5385 8.0883)', 4326),
    3,
    7,
    3,
    'ACTIVE'
);

-- State Highway: Chennai to Bangalore
INSERT INTO highways (road_name, road_code, from_location, to_location, geom, division_id, sub_division_id, created_by, status)
VALUES (
    'State Highway 20',
    'SH-20',
    'Chennai',
    'Bangalore',
    ST_GeomFromText('LINESTRING(80.2707 13.0827, 79.4192 12.8184, 78.3762 12.6532, 77.5946 12.9716)', 4326),
    3,
    7,
    7,
    'ACTIVE'
);

-- Under construction highway
INSERT INTO highways (road_name, road_code, from_location, to_location, geom, division_id, sub_division_id, created_by, status)
VALUES (
    'Express Highway EH-1',
    'EH-1',
    'Pune',
    'Goa',
    ST_GeomFromText('LINESTRING(73.8567 18.5204, 73.9876 17.6599, 73.8278 15.2993)', 4326),
    5,
    9,
    5,
    'UNDER_CONSTRUCTION'
);

COMMENT ON TABLE highways IS 'Sample highways data with realistic Indian coordinates';
