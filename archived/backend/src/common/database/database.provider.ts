import { Pool, PoolConfig } from 'pg';

export function createDbPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
    });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const config: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'highways_db',
    ssl: isProduction || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  return new Pool(config);
}
