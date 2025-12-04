import { Router } from 'express';
import { AreaController } from '../controllers/area.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';

const areaRoutes = Router();
const areaController = new AreaController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware();

// --- NOVA ROTA PÚBLICA ---
areaRoutes.get(
    '/public',
    areaController.getAll
);
// -------------------------

areaRoutes.get(
    '/',
    authMiddleware.auth,
    areaController.getAll
);
areaRoutes.get(
    '/:id',
    authMiddleware.auth,
    areaController.getById
);
areaRoutes.post(
    '/',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin', 'professor', 'coordenador']),
    areaController.create
);
areaRoutes.put(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin', 'professor', 'coordenador']),
    areaController.update
);
areaRoutes.delete(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin', 'professor', 'coordenador']),
    areaController.delete
);

export { areaRoutes };
