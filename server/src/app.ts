import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';

// Route Imports — Authentication (Dual-Table)
import authInternalRoutes from './modules/auth-internal/auth-internal.routes.js';
import authClientRoutes from './modules/auth-client/auth-client.routes.js';

// Route Imports — Staff-Managed Modules
import staffAccountRoutes from './modules/staff-accounts/staff-accounts.routes.js';
import clientAccountRoutes from './modules/client-accounts/client-accounts.routes.js';
import applicationRoutes from './modules/applications/applications.routes.js';
import applicationDocumentRoutes from './modules/application-documents/application-documents.routes.js';
import auditLogRoutes from './modules/audit-logs/audit-logs.routes.js';

// Route Imports — Client-Facing Modules
import notificationRoutes from './modules/notifications/notifications.routes.js';

// Middleware Imports
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { AppError } from './utils/AppError.js';

const app: Application = express();

// Trust the first reverse proxy (Vercel / Nginx) so `req.ip` and the rate
// limiter resolve the real client IP for accurate audit logging.
app.set('trust proxy', 1);

// ==========================================
// GLOBAL SECURITY MIDDLEWARES
// ==========================================

// Helmet: Set secure HTTP headers
app.use(helmet());

// CORS: Explicit origin with credentials for HttpOnly cookie exchange
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Cookie Parser: Required for reading HttpOnly refresh token cookies
app.use(cookieParser());

// Rate Limiter: Brute-force API protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Max 100 requests per window per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Stricter rate limit for auth endpoints (login/refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Max 20 login attempts per window per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// ==========================================
// GLOBAL MIDDLEWARES
// ==========================================
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general rate limit to all API routes
app.use('/api', apiLimiter);

// ==========================================
// BASE ROUTE
// ==========================================
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Gudang Visa Tracking System API v2.0 🚀',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API ROUTES — Authentication (Separated Endpoints)
// ==========================================
app.use('/api/auth/internal', authLimiter, authInternalRoutes);
app.use('/api/auth/client', authLimiter, authClientRoutes);

// ==========================================
// API ROUTES — Internal Staff Modules
// ==========================================
app.use('/api/staff-accounts', staffAccountRoutes);
app.use('/api/client-accounts', clientAccountRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', applicationDocumentRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// ==========================================
// API ROUTES — Client-Facing Modules
// ==========================================
app.use('/api/notifications', notificationRoutes);

// ==========================================
// 404 CATCH-ALL
// ==========================================
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use(globalErrorHandler);

export default app;
