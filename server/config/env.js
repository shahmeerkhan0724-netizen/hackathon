import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.warn(`[WARN] Required environment variable "${key}" is not set in environment or .env file.`);
  }
}

export const env = {
  PORT:8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_development_secret_change_in_production_key_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'salmanali162009@gmail.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'salman_16',
  AI_API_KEY: process.env.GROQ_API_KEY|| '',
  AI_MODEL: process.env.AI_MODEL || 'openai/gpt-oss-120b',
  isProduction: process.env.NODE_ENV === 'production',
};
