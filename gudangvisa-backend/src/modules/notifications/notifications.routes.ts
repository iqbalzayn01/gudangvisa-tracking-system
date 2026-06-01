import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { requireClientAuth } from '../../middlewares/auth.middleware.js';

const router = Router();
const controller = new NotificationsController();

// All routes require client authentication
router.use(requireClientAuth);

// Get all notifications for the logged-in client
router.get('/', controller.getMyNotifications);

// Mark a notification as read
router.patch('/:id/read', controller.markAsRead);

export default router;
