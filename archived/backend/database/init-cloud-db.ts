import { createDbPool } from '../src/common/database/database.provider';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function initCloudDatabase() {
  const pool = createDbPool();
  console.log('🚀 Connecting to Cloud PostgreSQL database...');

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL cloud database!');

    console.log('🧩 Ensuring PostGIS extension is enabled...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ PostGIS extension ready.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const migrationPath = path.join(__dirname, 'migration_v2_sample_modules.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📜 Executing core schema (schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Core schema applied.');
    }

    if (fs.existsSync(migrationPath)) {
      console.log('📜 Executing module extensions (migration_v2_sample_modules.sql)...');
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      await client.query(migrationSql);
      console.log('✅ Module tables created (dlp_contracts, highway_chainages, accident_blackspots, lawyers, legal_cases).');
    }

    // Check if Admin user exists, if not, seed admin user securely
    const adminCheck = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      console.log('🌱 Seeding initial production admin user...');
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO users (username, password_hash, name, email, role, office_name, office_code, is_active)
        VALUES ('admin', $1, 'System Administrator', 'admin@highways.gov', 'ADMIN', 'Central Highway Authority', 'CHA001', true)
      `, [adminPasswordHash]);

      const divPasswordHash = await bcrypt.hash('div123', 10);
      const adminIdRes = await client.query("SELECT id FROM users WHERE username = 'admin'");
      const adminId = adminIdRes.rows[0].id;

      await client.query(`
        INSERT INTO users (username, password_hash, name, email, role, parent_id, office_name, office_code, is_active)
        VALUES ('div_north', $1, 'North Division', 'div.north@highways.gov', 'DIVISION', $2, 'Northern Division Office', 'NDO001', true)
      `, [divPasswordHash, adminId]);

      console.log('✅ Initial Admin & Division users seeded successfully.');
    } else {
      console.log('ℹ️ Admin user already exists in cloud database.');
    }

    client.release();
    console.log('🎉 Cloud Database initialization completed cleanly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cloud Database initialization failed:', error);
    process.exit(1);
  }
}

initCloudDatabase();
