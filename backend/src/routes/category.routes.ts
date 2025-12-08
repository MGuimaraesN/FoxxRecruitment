import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';

const categoryRoutes = Router();
const categoryController = new CategoryController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware();

// --- NOVA ROTA PÚBLICA ---
categoryRoutes.get(
    '/public',
    categoryController.getAll
);
// -------------------------

categoryRoutes.get(
    '/',
    authMiddleware.auth,
    categoryController.getAll
);
categoryRoutes.get(
    '/:id',
    authMiddleware.auth,
    categoryController.getById
);
categoryRoutes.post(
    '/',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin', 'professor', 'coordenador']),
    categoryController.create
);
categoryRoutes.put(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin', 'professor', 'coordenador']),
    categoryController.update
);
categoryRoutes.delete(
    '/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin', 'professor', 'coordenador']),
    categoryController.delete
);

export { categoryRoutes };
