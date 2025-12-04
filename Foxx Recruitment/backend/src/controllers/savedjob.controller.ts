import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js'; // Usando a importação do seu padrão

export class SavedJobController {

    /**
     * Salvar uma vaga
     */
    async save(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const { jobId } = req.params;

        // Validação de autenticação (lógica específica deste controller)
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // Validação de ID (do seu padrão)
        if (!jobId) {
            return res.status(400).json({ error: 'O ID da vaga é obrigatório' });
        }

        try {
            const savedJob = await prisma.savedJob.create({
                data: {
                    userId: userId,
                    jobId: parseInt(jobId), // Usando parseInt do seu padrão
                },
            });
            res.status(201).json(savedJob);
        } catch (error: any) {
            // Tratamento de erro P2002 (do seu padrão)
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Esta vaga já está salva' });
            }
            // Tratamento de erro 500 (do seu padrão)
            console.error('Erro ao salvar vaga:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Desfazer o salvamento de uma vaga
     */
    async unsave(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const { jobId } = req.params;

        // Validação de autenticação
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // Validação de ID
        if (!jobId) {
            return res.status(400).json({ error: 'O ID da vaga é obrigatório' });
        }

        try {
            await prisma.savedJob.delete({
                where: {
                    userId_jobId: {
                        userId: userId,
                        jobId: parseInt(jobId), // Usando parseInt
                    },
                },
            });
            res.status(204).send();
        } catch (error: any) {
            // Tratamento de erro P2025 (do seu padrão)
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Vaga salva não encontrada para exclusão' });
            }
            // Tratamento de erro 500
            console.error('Erro ao remover vaga salva:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Obter todas as vagas salvas por um usuário (com detalhes)
     */
    async getMySavedJobs(req: Request, res: Response) {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        try {
            const savedJobs = await prisma.savedJob.findMany({
                where: { userId: userId },
                include: {
                    job: {
                        include: {
                            author: true,
                            area: true,
                            category: true,
                            institution: {
                                select: { name: true }
                            }
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            // Mantendo a lógica de retornar apenas o objeto 'job'
            res.status(200).json(savedJobs.map(sj => sj.job));
        } catch (error) {
            console.error('Erro ao buscar vagas salvas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Obter apenas os IDs das vagas salvas por um usuário
     */
    async getMySavedJobIds(req: Request, res: Response) {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        try {
            const savedJobs = await prisma.savedJob.findMany({
                where: { userId: userId },
                select: {
                    jobId: true,
                },
            });
             // Mantendo a lógica de retornar apenas o array de IDs
            res.status(200).json(savedJobs.map(sj => sj.jobId));
        } catch (error) {
            console.error('Erro ao buscar IDs de vagas salvas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}