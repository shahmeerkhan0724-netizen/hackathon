import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// Import route modules
import setupRoutes from './routes/setup.routes.js';
import setupController from './controllers/setup.controller.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import companyRoutes from './routes/company.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import designationRoutes from './routes/designations.routes.js';
import leaveTypeRoutes from './routes/leaveTypes.routes.js';
import holidayRoutes from './routes/holidays.routes.js';
import employeeRoutes from './routes/employees.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRoutes from './routes/leaves.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import aiRoutes from './routes/ai.routes.js';
import announcementRoutes from './routes/announcements.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import auditRoutes from './routes/audit.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Global rate limiting
app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: 'HCM Lite Backend API is healthy',
    data: {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: env.NODE_ENV,
    },
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HCM Lite — AI-Assisted Human Capital Management System API is running',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Mount modular API routes
app.use('/api/setup', setupRoutes);
app.get('/api/setup-status', (req, res, next) => setupController.getStatus(req, res, next));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leaveTypes', leaveTypeRoutes); // Support camelCase alias
app.use('/api/holidays', holidayRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// Catch-all 404 handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

export default app;
