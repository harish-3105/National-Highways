-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'DIVISION', 'SUB_DIVISION');

-- Create enum for highway status
CREATE TYPE highway_status AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'CLOSED');

-- Create users table with hierarchical structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    office_name VARCHAR(255),
    office_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_parent_hierarchy CHECK (
        (role = 'ADMIN' AND parent_id IS NULL) OR
        (role = 'DIVISION' AND parent_id IS NOT NULL) OR
        (role = 'SUB_DIVISION' AND parent_id IS NOT NULL)
    )
);

-- Create highways table with PostGIS geometry
CREATE TABLE highways (
    id SERIAL PRIMARY KEY,
    road_name VARCHAR(255) NOT NULL,
    road_code VARCHAR(100) UNIQUE NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    geom GEOMETRY(LINESTRING, 4326) NOT NULL,
    length_km DECIMAL(10, 3),
    division_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    sub_division_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    status highway_status DEFAULT 'ACTIVE',
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table for tracking all operations
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization

-- Users indexes
CREATE INDEX idx_users_parent_id ON users(parent_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);

-- Highways indexes
CREATE INDEX idx_highways_geom ON highways USING GIST(geom);
CREATE INDEX idx_highways_division_id ON highways(division_id);
CREATE INDEX idx_highways_sub_division_id ON highways(sub_division_id);
CREATE INDEX idx_highways_created_by ON highways(created_by);
CREATE INDEX idx_highways_road_code ON highways(road_code);
CREATE INDEX idx_highways_status ON highways(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highways_updated_at
    BEFORE UPDATE ON highways
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate highway length automatically
CREATE OR REPLACE FUNCTION calculate_highway_length()
RETURNS TRIGGER AS $$
BEGIN
    NEW.length_km = ST_Length(NEW.geom::geography) / 1000;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic length calculation
CREATE TRIGGER calculate_highway_length_trigger
    BEFORE INSERT OR UPDATE OF geom ON highways
    FOR EACH ROW
    EXECUTE FUNCTION calculate_highway_length();

-- Insert default admin user (password: admin123)
-- Note: This hash is for 'admin123' using bcrypt with 10 rounds
INSERT INTO users (username, password_hash, name, email, role, office_name, office_code)
VALUES (
    'admin',
    '$2b$10$pTGw8oCm6RT3YxGym.8Vl.WWfPFtAzTqnUFGaVMH7kNJX/6i0Kut6',
    'System Administrator',
    'admin@highways.gov',
    'ADMIN',
    'Central Highway Authority',
    'CHA001'
);

-- Create view for user hierarchy tree
CREATE OR REPLACE VIEW user_hierarchy AS
WITH RECURSIVE hierarchy AS (
    SELECT 
        id,
        username,
        name,
        role,
        parent_id,
        office_name,
        office_code,
        is_active,
        ARRAY[id] AS path,
        0 AS level
    FROM users
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT 
        u.id,
        u.username,
        u.name,
        u.role,
        u.parent_id,
        u.office_name,
        u.office_code,
        u.is_active,
        h.path || u.id,
        h.level + 1
    FROM users u
    INNER JOIN hierarchy h ON u.parent_id = h.id
)
SELECT * FROM hierarchy;

-- Create view for highways with creator and office details
CREATE OR REPLACE VIEW highways_detailed AS
SELECT 
    h.id,
    h.road_name,
    h.road_code,
    h.from_location,
    h.to_location,
    ST_AsGeoJSON(h.geom) AS geometry,
    h.length_km,
    h.status,
    h.created_at,
    h.updated_at,
    creator.name AS created_by_name,
    creator.role AS created_by_role,
    div.name AS division_name,
    div.office_code AS division_code,
    subdiv.name AS sub_division_name,
    subdiv.office_code AS sub_division_code
FROM highways h
LEFT JOIN users creator ON h.created_by = creator.id
LEFT JOIN users div ON h.division_id = div.id
LEFT JOIN users subdiv ON h.sub_division_id = subdiv.id;

COMMENT ON TABLE users IS 'Stores user information with hierarchical role-based structure';
COMMENT ON TABLE highways IS 'Stores highway and road segment data with PostGIS geometry';
COMMENT ON TABLE audit_logs IS 'Tracks all CRUD operations for audit and compliance';
COMMENT ON COLUMN highways.geom IS 'PostGIS LINESTRING geometry with SRID 4326 (WGS84)';
COMMENT ON COLUMN highways.length_km IS 'Automatically calculated length in kilometers';
