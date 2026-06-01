import { Router } from 'express';
import { AuthClientController } from './auth-client.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { clientLoginSchema } from './auth-client.validation.js';

const router = Router();
const controller = new AuthClientController();

// POST /api/auth/client/login
router.post('/login', validate(clientLoginSchema), controller.login);

// POST /api/auth/client/refresh
router.post('/refresh', controller.refresh);

// POST /api/auth/client/logout
router.post('/logout', controller.logout);

export default router;
