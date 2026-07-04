import { Router } from 'express';
import { AuthInternalController } from './auth-internal.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authLimiter } from '../../middlewares/rate-limit.middleware.js';
import { loginSchema } from '../../utils/validation.js';

const router = Router();
const controller = new AuthInternalController();

// POST /api/auth/internal/login (credential attempts are rate-limited)
router.post('/login', authLimiter, validate(loginSchema), controller.login);

// POST /api/auth/internal/refresh
router.post('/refresh', controller.refresh);

// POST /api/auth/internal/logout
router.post('/logout', controller.logout);

export default router;
