import dotenv from 'dotenv';

dotenv.config();

const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL as string,
  jwt_secret: process.env.JWT_SECRET as string,
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
  stripe_secret_key: process.env.STRIPE_SECRET_KEY as string,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET as string,
  server_url: process.env.SERVER_URL || 'http://localhost:5000',
};

export default config;
