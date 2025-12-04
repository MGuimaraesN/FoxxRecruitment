import { Router } from 'express';
import { SavedJobController } from '../controllers/savedjob.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middlewares.js';

const savedJobRoutes = Router();
const savedJobController = new SavedJobController();
const authMiddleware = new AuthMiddleware();

// Todas as rotas aqui exigem autenticação
savedJobRoutes.use(authMiddleware.auth);

savedJobRoutes.post('/:jobId', savedJobController.save);
savedJobRoutes.delete('/:jobId', savedJobController.unsave);
savedJobRoutes.get('/my-saved', savedJobController.getMySavedJobs);
savedJobRoutes.get('/my-saved/ids', savedJobController.getMySavedJobIds);

export { savedJobRoutes };
