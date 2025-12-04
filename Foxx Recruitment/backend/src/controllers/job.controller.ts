import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { Prisma } from '@prisma/client';
import {
    sendNewJobNotification,
    sendJobModifiedNotification,
    sendJobUnavailableNotification
} from '../services/mail.service.js';
import { jobCreateSchema, jobEditSchema } from '../utils/schemas.js';

export class JobController {

    async create(req: Request, res: Response) {
        const authorId = (req as any).user?.userId;
        const activeInstitutionId = (req as any).user?.activeInstitutionId;

        if (!authorId) {
             return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        try {
            const data = jobCreateSchema.parse(req.body);
            const { title, description, areaId, categoryId, status, email, telephone, companyName, institutionId } = data;

            let targetInstitutionId = activeInstitutionId;

            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId: authorId },
                include: { role: true }
            });

            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            const isAdmin = userRoles.some(ur => ur.role.name === 'admin');

            if (institutionId && (isSuperAdmin || isAdmin)) {
                targetInstitutionId = institutionId;
                if (!isSuperAdmin) {
                    const hasAccessToTarget = userRoles.some(
                        ur => ur.institutionId === targetInstitutionId && 
                        ['admin', 'professor', 'coordenador'].includes(ur.role.name)
                    );
                    if (!hasAccessToTarget) {
                        return res.status(403).json({ error: 'Você não tem permissão para criar vagas nesta instituição.' });
                    }
                }
            }

            if (!targetInstitutionId) {
                return res.status(400).json({ error: 'Nenhuma instituição definida para a vaga.' });
            }

            let isPublic = false;
            if (!isSuperAdmin) {
                const targetRole = userRoles.find(ur => ur.institutionId === targetInstitutionId);
                if (!targetRole || !['professor', 'coordenador', 'empresa', 'admin'].includes(targetRole.role.name)) {
                     return res.status(403).json({ error: 'Permissão insuficiente na instituição selecionada.' });
                }
                isPublic = targetRole.role.name === 'empresa';
            }

            const job = await prisma.job.create({
                data: {
                    title, description, areaId, categoryId, status: status || 'rascunho',
                    email, telephone, authorId, institutionId: targetInstitutionId,
                    ip: req.ip || 'IP não disponível', companyName: companyName ?? null, isPublic
                },
                include: { institution: true }
            });

            if (['published', 'open'].includes(job.status)) {
                try {
                    let recipients: string[] = [];
                    if (job.isPublic) {
                        const allUsers = await prisma.user.findMany({ select: { email: true } });
                        recipients = allUsers.map(u => u.email);
                    } else {
                        const institutionUsers = await prisma.userInstitutionRole.findMany({
                            where: { institutionId: job.institutionId },
                            include: { user: { select: { email: true } } }
                        });
                        recipients = institutionUsers.map(ur => ur.user.email);
                    }
                    const uniqueRecipients = [...new Set(recipients)];
                    if (uniqueRecipients.length > 0) {
                        sendNewJobNotification(uniqueRecipients, job.title, (job as any).institution.name)
                            .catch(err => console.error("Falha background envio email nova vaga:", err));
                    }
                } catch (emailError) {
                    console.error('Erro ao preparar envio de e-mail nova vaga:', emailError);
                }
            }
            res.status(201).json(job);
        } catch (error) {
            throw error;
        }
    }

    async edit(req: Request, res: Response) {
            const { id } = req.params;
            const authorId = (req as any).user?.userId

            if (!authorId) {
                return res.status(401).json({ error: 'Usuário não autenticado.' });
            }

            if (!id) {
                return res.status(400).json({ error: 'O ID da vaga é obrigatório' });
            }

            try {
                const data = jobEditSchema.parse(req.body);
                const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
                const { institutionId, ...otherFields } = cleanData;

                const job = await prisma.job.findUnique({ where: { id: parseInt(id) } });

                if (!job || job.deletedAt) {
                    return res.status(404).json({ error: 'Vaga não encontrada' });
                }

                const userRoles = await prisma.userInstitutionRole.findMany({
                    where: { userId: authorId },
                    include: { role: true }
                });

                const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
                const isAdmin = userRoles.some(ur => ur.role.name === 'admin');

                // Verifica permissão: Superadmin OU Autor OU Admin da Instituição da vaga
                const hasPermissionOnCurrent = isSuperAdmin || (job.authorId === authorId) || 
                    userRoles.some(ur => ur.institutionId === job.institutionId && ur.role.name === 'admin');

                if (!hasPermissionOnCurrent) {
                    return res.status(403).json({ error: 'Você não tem permissão para editar esta vaga' });
                }

                let newInstitutionId = job.institutionId;
                if (institutionId && (institutionId as number) !== job.institutionId) {
                    if (!isAdmin && !isSuperAdmin) {
                        return res.status(403).json({ error: 'Apenas administradores podem alterar a instituição da vaga.' });
                    }
                    newInstitutionId = institutionId as number;
                    if (!isSuperAdmin) {
                        const isTargetAdmin = userRoles.some(
                            ur => ur.institutionId === newInstitutionId && ur.role.name === 'admin'
                        );
                        if (!isTargetAdmin) {
                            return res.status(403).json({ error: 'Você não tem permissão na instituição de destino.' });
                        }
                    }
                }

                const status = otherFields.status as string | undefined;
                const description = otherFields.description as string | undefined;
                const isStatusChanged = status && status !== job.status;
                const isDescriptionChanged = description && description !== job.description;

                const updatedJob = await prisma.job.update({
                    where: { id: parseInt(id) },
                    data: { ...otherFields, institutionId: newInstitutionId },
                });

                try {
                    if (isStatusChanged && status === 'closed') {
                        const savedJobs = await prisma.savedJob.findMany({
                            where: { jobId: job.id },
                            include: { user: { select: { email: true } } }
                        });
                        const recipients = savedJobs.map(sj => sj.user.email);
                        recipients.forEach(email => {
                            sendJobUnavailableNotification(email, job.title).catch(e => console.error(`Erro envio email`, e));
                        });
                    } else if (isStatusChanged || isDescriptionChanged) {
                        const savedJobs = await prisma.savedJob.findMany({
                            where: { jobId: job.id },
                            include: { user: { select: { email: true } } }
                        });
                        const recipients = savedJobs.map(sj => sj.user.email);
                        recipients.forEach(email => {
                            sendJobModifiedNotification(email, updatedJob.title).catch(e => console.error(`Erro envio email`, e));
                        });
                    }
                } catch (notifyError) {
                    console.error('Erro ao processar notificações de edição:', notifyError);
                }
                res.status(200).json(updatedJob);
            } catch (error) {
                if ((error as any).code === 'P2025') {
                    return res.status(404).json({ error: 'Vaga não encontrada para atualização' });
                }
                throw error;
            }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).user?.userId; // Quem está tentando deletar

        if (!userId) { return res.status(401).json({ error: 'Usuário não autenticado.' }); }
        if (!id) { return res.status(400).json({ error: 'O ID da vaga é obrigatório' }); }

        try {
            const job = await prisma.job.findUnique({ where: { id: parseInt(id) } });
            if (!job || job.deletedAt) { return res.status(404).json({ error: 'Vaga não encontrada' }); }

            // Buscar roles do usuário que está fazendo a requisição
            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId: userId },
                include: { role: true },
            });

            // 1. É Superadmin?
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            
            // 2. É o Autor da vaga?
            const isAuthor = job.authorId === userId;

            // 3. É Admin da Instituição da vaga?
            const isInstitutionAdmin = userRoles.some(ur => 
                ur.institutionId === job.institutionId && ur.role.name === 'admin'
            );

            // Permite se for Superadmin OU Autor OU Admin da Instituição
            if (!isSuperAdmin && !isAuthor && !isInstitutionAdmin) {
                return res.status(403).json({ error: 'Você não tem permissão para excluir esta vaga' });
            }

            try {
                 const savedJobs = await prisma.savedJob.findMany({
                    where: { jobId: job.id },
                    include: { user: { select: { email: true } } }
                });
                const recipients = savedJobs.map(sj => sj.user.email);
                await Promise.all(recipients.map(email =>
                     sendJobUnavailableNotification(email, job.title).catch(e => console.error(`Erro envio email`, e))
                ));
            } catch (notifyError) { console.error('Erro nas notificações de delete:', notifyError); }

            await prisma.job.update({
                where: { id: parseInt(id) },
                data: { deletedAt: new Date() }
            });
            res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir vaga:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getJobsByInstitution(req: Request, res: Response) {
        const activeInstitutionId = (req as any).user?.activeInstitutionId;
        const userId = (req as any).user?.userId; 
        const { search, areaId, categoryId, page = '1', limit = '20', sort = 'desc' } = req.query;

        if (!userId) { return res.status(401).json({ error: 'Usuário não autenticado.' }); }

        try {
            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 20;
            const skip = (pageNum - 1) * limitNum;

            // 1. Busca roles do usuário
            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId: userId },
                include: { role: true }
            });
            
            // 2. Verifica permissões
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            const isInstitutionAdmin = userRoles.some(ur => 
                ur.institutionId === activeInstitutionId && ur.role.name === 'admin'
            );

            const whereClause: Prisma.JobWhereInput = {
                deletedAt: null
            };

            // Filtros de busca
            if (search && typeof search === 'string' && search.trim() !== '') {
                whereClause.title = { contains: search as string };
            }
            if (areaId && typeof areaId === 'string' && areaId.trim() !== '') {
                whereClause.areaId = parseInt(areaId as string);
            }
            if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
                whereClause.categoryId = parseInt(categoryId as string);
            }

            // --- LÓGICA DE FILTRAGEM REVISADA ---
            if (!isSuperAdmin) {
                if (!activeInstitutionId) {
                    return res.status(400).json({ error: 'Nenhuma instituição ativa selecionada.' });
                }

                // Grupo 1: Vagas Públicas (Empresas) -> Sempre Publicadas
                const publicJobsCondition: Prisma.JobWhereInput = {
                    isPublic: true,
                    status: { in: ['published', 'open'] }
                };

                // Grupo 2: Vagas da Instituição Ativa
                const localJobsCondition: Prisma.JobWhereInput = {
                    institutionId: activeInstitutionId
                };

                // Se NÃO for Admin da Instituição, refina o filtro local:
                // Mostra se (Status é publicado) OU (O usuário é o Autor)
                if (!isInstitutionAdmin) {
                    localJobsCondition.OR = [
                        { status: { in: ['published', 'open'] } },
                        { authorId: userId } // Permite ver seus próprios rascunhos
                    ];
                }
                // Se FOR Admin, 'localJobsCondition' fica apenas com 'institutionId', mostrando tudo.

                // Combina os dois grupos com OR
                whereClause.OR = [
                    localJobsCondition,
                    publicJobsCondition
                ];
            }
            // Se for SuperAdmin, não aplica restrições de status ou instituição.

            const [jobs, total] = await prisma.$transaction([
                prisma.job.findMany({
                    where: whereClause,
                    include: {
                        author: { select: { firstName: true, lastName: true, email: true } },
                        area: true,
                        category: true,
                        institution: { select: { name: true } }
                    },
                    orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.job.count({ where: whereClause })
            ]);

            res.status(200).json({
                data: jobs,
                meta: {
                    total,
                    page: pageNum,
                    lastPage: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            console.error('Erro ao buscar vagas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getPublicJobs(req: Request, res: Response) {
        // ... (mantido igual)
         try {
            const { search, areaId, categoryId, page = '1', limit = '20', sort = 'desc' } = req.query;

            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 20;
            const skip = (pageNum - 1) * limitNum;

            const whereFilters: Prisma.JobWhereInput = {
                status: { in: ['published', 'open'] },
                isPublic: true,
                deletedAt: null
            };

            if (search && typeof search === 'string' && search.trim() !== '') {
                whereFilters.title = { contains: search as string };
            }
            if (areaId && typeof areaId === 'string' && areaId.trim() !== '') {
                whereFilters.areaId = parseInt(areaId as string);
            }
            if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
                whereFilters.categoryId = parseInt(categoryId as string);
            }

            const [jobs, total] = await prisma.$transaction([
                prisma.job.findMany({
                    where: whereFilters,
                    include: {
                        area: true, category: true, institution: { select: { name: true } },
                    },
                    orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.job.count({ where: whereFilters })
            ]);

            res.status(200).json({
                data: jobs,
                meta: {
                    total,
                    page: pageNum,
                    lastPage: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            console.error('Erro ao buscar vagas públicas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getById(req: Request, res: Response) {
        // ... (mantido igual)
        const { id } = req.params;
        if (!id) { return res.status(400).json({ error: 'O ID da vaga é obrigatório' }); }

        try {
            const job = await prisma.job.findUnique({
                where: { id: parseInt(id) },
                include: {
                    area: true, category: true,
                    author: { select: { firstName: true, lastName: true } },
                    institution: { select: { name: true } }
                }
            });

            if (!job || job.deletedAt) { return res.status(404).json({ error: 'Vaga não encontrada' }); }

            if (job.isPublic) {
                return res.status(200).json(job);
            }

            const user = (req as any).user;
            if (!user) {
                return res.status(401).json({ error: 'Acesso negado. Vaga privada.' });
            }

            const userRole = await prisma.userInstitutionRole.findFirst({
                where: { userId: user.userId, institutionId: job.institutionId }
            });

            const userGlobalRoles = await prisma.userInstitutionRole.findMany({
                where: { userId: user.userId },
                include: { role: true }
            });
            const isGlobalAdmin = userGlobalRoles.some(ur => ['admin', 'superadmin'].includes(ur.role.name));

            if (!userRole && !isGlobalAdmin) {
                return res.status(403).json({ error: 'Você não tem permissão para visualizar esta vaga.' });
            }

            res.status(200).json(job);
        } catch (error) {
            console.error('Erro ao buscar vaga:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getAllJobs(req: Request, res: Response) {
        // ... (mantido igual)
        try {
            const authorId = (req as any).user?.userId;
            if (!authorId) { return res.status(401).json({ error: 'Usuário não autenticado.' }); }

            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId: authorId },
                include: { role: true }
            });
            const roleNames = userRoles.map(ur => ur.role.name);
            const isGlobalAdmin = roleNames.includes('admin') || roleNames.includes('superadmin');

            let whereClause: Prisma.JobWhereInput = { deletedAt: null };
            if (!isGlobalAdmin) {
                whereClause = { authorId: authorId, deletedAt: null };
            }
            
            const jobs = await prisma.job.findMany({
                where: whereClause,
                 include: {
                    author: { select: { firstName: true, lastName: true, email: true } },
                    area: true, category: true, institution: true,
                },
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json(jobs);
        } catch (error) {
            console.error('Erro ao buscar todas as vagas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // --- NOVOS MÉTODOS ---

    async getCandidates(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const { id } = req.params; // Job ID

        try {
            if (!id) {
                return res.status(400).json({ error: 'O ID da vaga é obrigatório' });
            }
            
            const job = await prisma.job.findUnique({ where: { id: parseInt(id) } });
            
            // Verificação de segurança: Só o autor ou admin pode ver
            if (!job) return res.status(404).json({ error: 'Vaga não encontrada' });
            
            // Verificar Roles do Usuário
            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId },
                include: { role: true }
            });

            // Permissões:
            // 1. Superadmin (Global)
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            
            // 2. Admin da Instituição da Vaga
            const isInstitutionAdmin = userRoles.some(ur => 
                ur.institutionId === job.institutionId && ur.role.name === 'admin'
            );

            // 3. Autor da Vaga
            const isAuthor = job.authorId === userId;

            if (!isSuperAdmin && !isInstitutionAdmin && !isAuthor) {
                return res.status(403).json({ error: 'Você não tem permissão para ver os candidatos desta vaga.' });
            }

            const candidates = await prisma.application.findMany({
                where: { jobId: parseInt(id) },
                include: {
                    user: {
                        select: {
                            id: true, firstName: true, lastName: true, email: true, 
                            avatarUrl: true, course: true, graduationYear: true, resumeUrl: true, linkedinUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(candidates);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar candidatos' });
        }
    }

    async updateApplicationStatus(req: Request, res: Response) {
        const userId = (req as any).user?.userId; // Recrutador
        const { applicationId } = req.params;
        const { status } = req.body; // ACCEPTED, REJECTED, REVIEWING

        try {
            if (!applicationId) {
                return res.status(400).json({ error: 'O ID da Candidatura é obrigatório' });
            }

            const application = await prisma.application.findUnique({ 
                where: { id: parseInt(applicationId) },
                include: { job: true }
            });

            if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

            const userRoles = await prisma.userInstitutionRole.findMany({ where: { userId }, include: { role: true } });
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');
            const isInstitutionAdmin = userRoles.some(ur => ur.institutionId === application.job.institutionId && ur.role.name === 'admin');
            const isAuthor = application.job.authorId === userId;

            if (!isSuperAdmin && !isInstitutionAdmin && !isAuthor) {
                 return res.status(403).json({ error: 'Sem permissão' });
            }
            // Verificar permissão sobre a vaga (mesma lógica do getCandidates)
            if (application.job.authorId !== userId) {
                 // Adicionar verificação de admin aqui se necessário
                 // return res.status(403).json({ error: 'Sem permissão' });
            }

            const updatedApp = await prisma.application.update({
                where: { id: parseInt(applicationId) },
                data: { status }
            });

            // --- NOTIFICAÇÃO ---
            let message = `O status da sua candidatura para "${application.job.title}" mudou para: ${status}`;
            if (status === 'ACCEPTED') message = `Parabéns! Você foi aprovado para a fase de entrevistas da vaga "${application.job.title}".`;
            if (status === 'REJECTED') message = `Obrigado pelo interesse na vaga "${application.job.title}". Infelizmente não seguiremos com seu perfil neste momento.`;

            await prisma.notification.create(
                { data: 
                    { 
                    userId: userId, 
                    title: 'Atualização de Candidatura', 
                    message: message, 
                    link: `/jobs/${application.job.id}`
                    } 
                });

            res.json(updatedApp);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar status' });
        }
    }
}