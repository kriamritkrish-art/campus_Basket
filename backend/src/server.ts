import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/environment';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Route Imports
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import laundryRoutes from './routes/laundryRoutes';
import adminRoutes from './routes/adminRoutes';
import providerRoutes from './routes/providerRoutes';
import paymentRoutes from './routes/paymentRoutes';
import imageRoutes from './routes/imageRoutes';
import campusRoutes from './routes/campusRoutes';

const app = express();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

const allowedOrigins = [
  env.FRONTEND_URL ? env.FRONTEND_URL.replace(/\/+$/, '') : '',
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.some((o) => o && o.replace(/\/+$/, '') === cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-student-lat', 'x-student-lng', 'x-razorpay-signature', 'x-razorpay-event-id']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.SESSION_SECRET));

// Healthcheck endpoint (Requirement #62 for Railway deployment)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'NIT Durgapur Campus Services REST API',
    brevoConfigured: Boolean(env.BREVO_API_KEY),
    sender: env.BREVO_SENDER_EMAIL,
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/campus', campusRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = env.PORT;
app.listen(PORT, async () => {
  console.info(`================================================================`);
  console.info(` NIT Durgapur Campus Services Platform REST API`);
  console.info(` Server running on http://localhost:${PORT}`);
  console.info(` Healthcheck available at http://localhost:${PORT}/health`);
  console.info(` Environment: ${env.NODE_ENV}`);
  console.info(`================================================================`);
  await connectDatabase();
});

export default app;
