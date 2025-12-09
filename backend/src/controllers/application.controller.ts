import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { sendApplicationFeedback } from '../services/mail.service.js';

export class ApplicationController {
    async apply(req: Request, res: Response) {
        const user = (req as any).user;
        const userId = user?.userId;
        const userEmail = user?.email; 
        
        // Recebendo dados extras do formulário
        const { jobId, phone, linkedinUrl, lattesUrl } = req.body;

        if (!userId) return res.status(401).json({ error: 'Não autenticado' });
        if (!jobId) return res.status(400).json({ error: 'Job ID é obrigatório' });

        try {
            const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });
            if (!job || job.deletedAt) return res.status(404).json({ error: 'Vaga não encontrada' });

            if (!['published', 'open'].includes(job.status)) {
                 return res.status(400).json({ error: 'Vaga não está aceitando candidaturas' });
            }

            const existing = await prisma.application.findUnique({
                where: { userId_jobId: { userId, jobId: parseInt(jobId) } }
            });

            if (existing) {
                return res.status(409).json({ error: 'Você já se candidatou para esta vaga' });
            }

            // --- LÓGICA DE PERSISTÊNCIA INTELIGENTE (ATUALIZAÇÃO DE PERFIL) ---
            const currentUserData = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { phone: true, linkedinUrl: true, lattesUrl: true }
            });

            const dataToUpdate: any = {};
            let shouldUpdate = false;

            // Só atualiza se o dado veio na request E (o campo está vazio no banco OU é diferente)
            if (phone && (!currentUserData?.phone || currentUserData.phone !== phone)) {
                dataToUpdate.phone = phone;
                shouldUpdate = true;
            }
            if (linkedinUrl && (!currentUserData?.linkedinUrl || currentUserData.linkedinUrl !== linkedinUrl)) {
                dataToUpdate.linkedinUrl = linkedinUrl;
                shouldUpdate = true;
            }
            if (lattesUrl && (!currentUserData?.lattesUrl || currentUserData.lattesUrl !== lattesUrl)) {
                dataToUpdate.lattesUrl = lattesUrl;
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                await prisma.user.update({
                    where: { id: userId },
                    data: dataToUpdate
                });
                console.log(`Perfil do usuário ${userId} atualizado automaticamente via candidatura.`);
            }
            // ------------------------------------------------------------------

            const application = await prisma.application.create({
                data: {
                    userId,
                    jobId: parseInt(jobId),
                    status: 'PENDING'
                }
            });

            if (userEmail) {
                sendApplicationFeedback(userEmail, job.title)
                    .catch(err => console.error(`❌ Falha ao enviar e-mail de candidatura para ${userEmail}:`, err));
            }

            res.status(201).json(application);
        } catch (error) {
            console.error('Erro ao candidatar-se:', error);
            res.status(500).json({ error: 'Erro ao processar candidatura' });
        }
    }

    // ... (Mantenha os outros métodos: listMyApplications, getAllManagedApplications, etc. inalterados)
    async listMyApplications(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        try {
            const applications = await prisma.application.findMany({
                where: { userId },
                include: {
                    job: {
                        include: {
                            institution: { select: { name: true } },
                            area: true,
                            category: true, // Adicionado
                            author: { select: { firstName: true, lastName: true } } // Adicionado
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(applications);
        } catch (error) {
             console.error('Erro ao listar candidaturas:', error);
             res.status(500).json({ error: 'Erro ao listar candidaturas' });
        }
    }

    // --- NOVO MÉTODO: Listar candidaturas para gestão (Admin/Recrutador) ---
    async getAllManagedApplications(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const activeInstitutionId = (req as any).user?.activeInstitutionId;

        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        try {
            // 1. Verificar roles do usuário
            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId },
                include: { role: true }
            });

            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            const isAdmin = userRoles.some(ur => 
                ur.institutionId === activeInstitutionId && ur.role.name === 'admin'
            );

            // 2. Construir filtro dinâmico
            let whereClause: any = {};

            if (isSuperAdmin) {
                // SuperAdmin vê TUDO (sem filtro)
                whereClause = {}; 
            } else if (isAdmin) {
                // Admin vê tudo da SUA instituição
                if (!activeInstitutionId) return res.status(400).json({ error: 'Nenhuma instituição ativa' });
                whereClause = {
                    job: { institutionId: activeInstitutionId }
                };
            } else {
                // Recrutadores (Professor/Empresa/Coordenador) veem apenas SUAS vagas
                whereClause = {
                    job: { authorId: userId }
                };
            }

            // 3. Buscar dados
            const applications = await prisma.application.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatarUrl: true,
                            resumeUrl: true,
                            course: true,
                            educationLevel: true // <--- ADICIONE ESTA LINHA
                        }
                    },
                    job: {
                        select: {
                            id: true,
                            title: true,
                            institution: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(applications);
        } catch (error) {
            console.error('Erro ao buscar candidaturas administrativas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // --- NOVO MÉTODO: Atualizar status (Aprovar/Rejeitar) ---
    async updateStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).user?.userId;

        // Validar status permitido
        if (!['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        try {
            // Verificar se a candidatura existe e carregar dados para permissão
            const application = await prisma.application.findUnique({
                where: { id: Number(id) },
                include: { job: true }
            });

            if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

            // Verificar permissões (Lógica simplificada: SuperAdmin, Admin da Inst ou Autor da Vaga)
            const userRoles = await prisma.userInstitutionRole.findMany({ where: { userId }, include: { role: true } });
            
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            const isInstAdmin = userRoles.some(ur => ur.institutionId === application.job.institutionId && ur.role.name === 'admin');
            const isAuthor = application.job.authorId === userId;

            if (!isSuperAdmin && !isInstAdmin && !isAuthor) {
                return res.status(403).json({ error: 'Sem permissão para gerenciar esta candidatura' });
            }

            // Atualizar
            const updated = await prisma.application.update({
                where: { id: Number(id) },
                data: { status }
            });

            // Criar Notificação para o candidato
            let message = `O status da sua candidatura para "${application.job.title}" mudou para: ${status}`;
            if (status === 'ACCEPTED') message = `Parabéns! Você foi aprovado para a vaga "${application.job.title}".`;
            if (status === 'REJECTED') message = `Atualização sobre a vaga "${application.job.title}": Perfil não selecionado.`;

            await prisma.notification.create({
                data: {
                    userId: application.userId,
                    title: 'Status da Candidatura',
                    message,
                    link: `/jobs/${application.jobId}`
                }
            });

            res.json(updated);
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            res.status(500).json({ error: 'Erro ao atualizar status' });
        }
    }

// --- NOVO MÉTODO: Detalhes de uma candidatura específica ---
    async getManagedApplicationById(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).user?.userId;
        const activeInstitutionId = (req as any).user?.activeInstitutionId;

        try {
            const application = await prisma.application.findUnique({
                where: { id: Number(id) },
                include: {
                    user: {
                        select: {
                            id: true, firstName: true, lastName: true, email: true,
                            avatarUrl: true, resumeUrl: true, // CV do perfil
                            linkedinUrl: true, lattesUrl: true, portfolioUrl: true,
                            course: true, graduationYear: true, bio: true
                        }
                    },
                    job: {
                        include: {
                            institution: { select: { name: true } },
                            area: true,
                            category: true
                        }
                    }
                }
            });

            if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

            // --- Verificação de Segurança (Cópia da lógica do updateStatus) ---
            const userRoles = await prisma.userInstitutionRole.findMany({ 
                where: { userId }, include: { role: true } 
            });
            
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            
            // Admin da Instituição da vaga?
            const isInstAdmin = userRoles.some(ur => 
                ur.institutionId === application.job.institutionId && ur.role.name === 'admin'
            );
            
            // Autor da Vaga?
            const isAuthor = application.job.authorId === userId;

            if (!isSuperAdmin && !isInstAdmin && !isAuthor) {
                return res.status(403).json({ error: 'Sem permissão para visualizar esta candidatura' });
            }

            res.json(application);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar detalhes' });
        }
    }

// --- NOVO MÉTODO: Cancelar Candidatura (Aluno) ---
    async cancelApplication(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        try {
            const application = await prisma.application.findUnique({
                where: { id: Number(id) }
            });

            if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

            // Verifica se a candidatura pertence ao usuário logado
            if (application.userId !== userId) {
                return res.status(403).json({ error: 'Permissão negada' });
            }

            // Opcional: Regra de negócio - Só pode cancelar se ainda estiver Pendente
            if (application.status !== 'PENDING') {
                return res.status(400).json({ error: 'Não é possível cancelar uma candidatura que já foi analisada.' });
            }

            await prisma.application.delete({
                where: { id: Number(id) }
            });

            res.status(204).send();
        } catch (error) {
            console.error('Erro ao cancelar candidatura:', error);
            res.status(500).json({ error: 'Erro interno ao cancelar' });
        }
    }

    // --- NOVO MÉTODO: Verificar se já aplicou ---
    async checkApplication(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const { jobId } = req.params;

        if (!userId) return res.json({ hasApplied: false });
        if (!jobId) return res.status(400).json({ error: 'Job ID é obrigatório' });

        try {
            const application = await prisma.application.findFirst({
                where: {
                    userId: userId,
                    jobId: parseInt(jobId)
                }
            });

            res.json({ hasApplied: !!application });
        } catch (error) {
            console.error('Erro ao verificar candidatura:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    }
}