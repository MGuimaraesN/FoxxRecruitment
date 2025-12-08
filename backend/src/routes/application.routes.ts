import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js'; // Importar RBAC

const applicationRoutes = Router();
const applicationController = new ApplicationController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware(); // Instanciar

applicationRoutes.post(
    '/apply',
    authMiddleware.auth,
    applicationController.apply
);
applicationRoutes.get(
    '/my-applications',
    authMiddleware.auth,
    applicationController.listMyApplications
);
applicationRoutes.get(
    '/my-applications',
    authMiddleware.auth,
    applicationController.listMyApplications
);

// --- NOVAS ROTAS ADMIN ---
applicationRoutes.get(
    '/manage/all',
    authMiddleware.auth,
    // Permite acesso a quem tem papel de gestão
    rbacMiddleware.checkRole(['superadmin', 'admin', 'professor', 'coordenador', 'empresa']),
    applicationController.getAllManagedApplications
);
applicationRoutes.get(
    '/manage/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin', 'admin', 'professor', 'coordenador', 'empresa']),
    applicationController.getManagedApplicationById
);
applicationRoutes.patch(
    '/manage/:id/status',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['superadmin', 'admin', 'professor', 'coordenador', 'empresa']),
    applicationController.updateStatus
);
applicationRoutes.delete(
    '/:id',
    authMiddleware.auth,
    applicationController.cancelApplication
);
export { applicationRoutes };
