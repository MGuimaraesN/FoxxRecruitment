import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/upload.middleware.js';

const userRoutes = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

userRoutes.post(
    '/register',
    userController.register
);
userRoutes.post(
    '/login',
    userController.login
);
userRoutes.post(
  '/forgot-password',
  userController.forgotPassword
);
userRoutes.post(
  '/reset-password',
  userController.resetPassword
);
userRoutes.get(
    '/profile',
    authMiddleware.auth,
    userController.profile
);
userRoutes.put(
    '/profile',
    authMiddleware.auth,
    userController.updateProfile
);
userRoutes.post(
    '/profile/avatar',
    authMiddleware.auth,
    upload.single('avatar'),
    userController.uploadAvatar
);
userRoutes.post(
    '/profile/resume',
    authMiddleware.auth,
    upload.single('resume'),
    userController.uploadResume);
userRoutes.post(
    '/change-password',
    authMiddleware.auth,
    userController.changePassword
);
userRoutes.post(
    '/switch-institution',
    authMiddleware.auth,
    userController.switchInstitution
);

export { userRoutes };