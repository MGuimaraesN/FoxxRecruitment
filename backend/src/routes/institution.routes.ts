import { Router } from 'express';
import { InstitutionController } from '../controllers/institution.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';
import { upload } from '../middlewares/upload.middleware.js'; // Importar upload

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
// --- ATUALIZADO COM UPLOAD ---
institutionRoutes.put(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin', 'admin']), // Permite admin local entrar, o controller barra se for ID errado
    upload.single('logo'),
    institutionController.update
);
// -----------------------------
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