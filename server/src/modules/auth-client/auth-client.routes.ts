import { Router } from 'express';
import { AuthClientController } from './auth-client.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authLimiter } from '../../middlewares/rate-limit.middleware.js';
import { loginSchema } from '../../utils/validation.js';

const router = Router();
const controller = new AuthClientController();

// POST /api/auth/client/login (credential attempts are rate-limited)
router.post('/login', authLimiter, validate(loginSchema), controller.login);

// POST /api/auth/client/refresh
router.post('/refresh', controller.refresh);

// POST /api/auth/client/logout
router.post('/logout', controller.logout);

export default router;
