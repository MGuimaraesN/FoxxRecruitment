import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { JobController } from '../controllers/job.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';

const adminRoutes = Router();
const adminController = new AdminController();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware();

adminRoutes.get(
  '/stats',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['professor', 'coordenador', 'empresa', 'admin', 'superadmin']),
  adminController.getStats
);
adminRoutes.get(
  '/users',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.getAllUsers
);
adminRoutes.get(
  '/users/:id',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.getUserDetails
);
adminRoutes.post(
  '/users/assign-role',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.assignRoleToUser
);
adminRoutes.delete(
  '/users/remove-role/:id',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.removeRoleFromUser
);
adminRoutes.delete(
  '/users/:id',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.deleteUser
);
adminRoutes.post(
  '/users/create',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.createUser
);

// Job management for superadmin
adminRoutes.get(
    '/jobs',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['professor', 'coordenador', 'empresa', 'admin', 'superadmin']),
    jobController.getAllJobs
);
adminRoutes.delete(
    '/jobs/:id',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['professor', 'coordenador', 'empresa', 'admin', 'superadmin']),
    jobController.delete
);

// Adicione esta rota junto com as outras rotas do admin
adminRoutes.post(
  '/universities',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['superadmin']), // Apenas SuperAdmin pode criar faculdades
  adminController.createUniversity
);

// Adicione esta rota
adminRoutes.get(
  '/institutions/:id',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['superadmin']), // Apenas Super Admin
  adminController.getInstitutionDetails
);

// ... (certifique-se de que esta rota venha ANTES de rotas genéricas se houver conflito, mas aqui está ok)

// Adicione junto com as outras rotas de usuários
adminRoutes.put(
  '/users/:id',
  authMiddleware.auth,
  rbacMiddleware.checkRole(['admin', 'superadmin']),
  adminController.updateUser
);

export { adminRoutes };