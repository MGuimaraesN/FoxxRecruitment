import { Router } from 'express';
import { InstitutionController } from '../controllers/institution.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';

const institutionRoutes = Router();
const institutionController = new InstitutionController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware();

institutionRoutes.get(
    '/public',
    institutionController.getPublic
);
institutionRoutes.post(
    '/',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    institutionController.create
);
institutionRoutes.get(
    '/',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    institutionController.getAll
);
institutionRoutes.get(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    institutionController.getById
);
institutionRoutes.put(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    institutionController.update
);
institutionRoutes.delete(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']),
    institutionController.delete
);
institutionRoutes.patch(
    '/:id/reactivate',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin']), // Apenas Super Admin
    institutionController.reactivate
);

export { institutionRoutes };