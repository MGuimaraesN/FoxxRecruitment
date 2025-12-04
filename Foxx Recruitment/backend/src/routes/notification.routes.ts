import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';

const notificationRoutes = Router();
const notificationController = new NotificationController();
const authMiddleware = new AuthMiddleware();

notificationRoutes.use(authMiddleware.auth);

notificationRoutes.get(
    '/', 
    notificationController.list
);
notificationRoutes.patch(
    '/:id/read', 
    notificationController.markAsRead
);
notificationRoutes.patch(
    '/mark-all-read',
    notificationController.markAllAsRead
);

export { notificationRoutes };