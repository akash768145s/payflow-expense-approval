import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config(); // fallback to local

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/payflow?schema=public',
  cookieSecret: process.env.COOKIE_SECRET || 'super-secret-cookie-signing-key-32-chars-long',
  nodeEnv: process.env.NODE_ENV || 'development',
};
