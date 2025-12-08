import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';
import { RbacMiddleware } from '../middlewares/rbac.middlewares.js';

const jobRoutes = Router();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();
const rbacMiddleware = new RbacMiddleware();

// --- NOVA ROTA PÚBLICA ---
jobRoutes.get(
    '/public',
    jobController.getPublicJobs
);
// --- FIM DA NOVA ROTA ---

jobRoutes.post(
    '/create',
    authMiddleware.auth,
    jobController.create
);
jobRoutes.put(
    '/edit/:id',
    authMiddleware.auth,
    jobController.edit
);
jobRoutes.delete(
    '/delete/:id',
    authMiddleware.auth,
    jobController.delete
);
jobRoutes.get(
    '/my-institution',
    authMiddleware.auth,
    jobController.getJobsByInstitution
);
jobRoutes.get(
    '/admin',
    authMiddleware.auth,
    rbacMiddleware.checkRole(['admin', 'superadmin']),
    jobController.getAllJobs
);
jobRoutes.get(
    '/:id',
    authMiddleware.optionalAuth,
    jobController.getById
);

// --- NOVAS ROTAS ---
jobRoutes.get(
    '/:id/candidates', 
    authMiddleware.auth, 
    jobController.getCandidates
);
// Alterar status da candidatura
jobRoutes.patch(
    '/application/:applicationId/status',
    authMiddleware.auth,
    jobController.updateApplicationStatus
);

jobRoutes.get(
    '/:id',
    authMiddleware.optionalAuth,
    jobController.getById
);


export { jobRoutes };