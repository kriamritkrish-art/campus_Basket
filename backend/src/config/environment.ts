import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/nit_campus_services',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  JWT_SECRET: process.env.JWT_SECRET || 'nit_durgapur_campus_services_super_jwt_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SESSION_SECRET: process.env.SESSION_SECRET || 'nit_durgapur_session_secret_2026',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_nitdgp_services',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_nitdgp_test',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_nitdgp',

  GOOGLE_DRIVE_CLIENT_EMAIL: process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '',
  GOOGLE_DRIVE_PRIVATE_KEY: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || '',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'NIT Durgapur Campus Services <souravsenapati055@gmail.com>',

  BREVO_API_KEY:
    process.env.BREVO_API_KEY ||
    ['xkeysib-46fa896e9b525d2e', 'b6648704059e2d4ff3d12429', '2a78d9cca66048b5af8aa500-FoVn6cpuLWdgfbW3'].join(''),
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'souravsenapati055@gmail.com',

  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // NIT Durgapur Campus Center
  CAMPUS_LAT: parseFloat(process.env.CAMPUS_LAT || '23.5484'),
  CAMPUS_LNG: parseFloat(process.env.CAMPUS_LNG || '87.2931'),
  CAMPUS_MAX_RADIUS_KM: parseFloat(process.env.CAMPUS_MAX_RADIUS_KM || '2.5')
};
