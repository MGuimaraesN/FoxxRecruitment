import { Router } from 'express';
import { RoleController } from '../controllers/role.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';

const roleRoutes = Router();
const roleController = new RoleController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware();

roleRoutes.post(
    '/',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    roleController.create
);
roleRoutes.get(
    '/',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    roleController.getAll
);
roleRoutes.get(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    roleController.getById
);
roleRoutes.put(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    roleController.update
);
roleRoutes.delete(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    roleController.delete
);

export { roleRoutes };