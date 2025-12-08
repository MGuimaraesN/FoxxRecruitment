import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export class InstitutionController {

    async create(req: Request, res: Response) {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'O nome da instituição é obrigatório' });
        }

        try {
            const institutionExists = await prisma.institution.findUnique({
                where: { name: name },
            });

            if (institutionExists) {
                return res.status(409).json({ error: 'Instituição já cadastrada' });
            }

            const institution = await prisma.institution.create({
                data: {
                    name: name,
                },
            });
            res.status(201).json(institution);
        } catch (error) {
            console.error('Erro ao criar instituição:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            // Pega o parâmetro 'type' da URL (ex: ?type=company)
            const { type } = req.query;

            // Monta o filtro dinamicamente
            const whereClause: any = {};
            if (type) {
                whereClause.type = String(type);
            }

            const institutions = await prisma.institution.findMany({
                where: whereClause,
                orderBy: { name: 'asc' }
            });
            
            res.status(200).json(institutions);
        } catch (error) {
            console.error('Erro ao buscar instituições:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            const institution = await prisma.institution.findUnique({
                where: { id: parseInt(id) },
            });

            if (!institution) {
                return res.status(404).json({ error: 'Instituição não encontrada' });
            }

            res.status(200).json(institution);
        } catch (error) {
            console.error('Erro ao buscar instituição por ID:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

// --- MÉTODO UPDATE ATUALIZADO (COM SLUG E SEGURANÇA) ---
    async update(req: Request, res: Response) {
        const { id } = req.params;
        // 1. Adicionamos slug e isActive na desestruturação
        const { name, primaryColor, slug, isActive } = req.body; 
        const file = req.file;

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            const requestUser = (req as any).user;
            
            // --- SEGURANÇA (MANTIDA) ---
            const userRoles = await prisma.userInstitutionRole.findMany({
                where: { userId: requestUser.userId },
                include: { role: true }
            });

            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'superadmin');

            if (!isSuperAdmin) {
                const targetId = parseInt(id);
                
                if (requestUser.activeInstitutionId !== targetId) {
                    return res.status(403).json({ error: 'Acesso negado: Você só pode alterar sua própria instituição.' });
                }

                const isAdminOfTarget = userRoles.some(ur => 
                    ur.institutionId === targetId && ur.role.name === 'admin'
                );

                if (!isAdminOfTarget) {
                    return res.status(403).json({ error: 'Acesso negado: Permissões insuficientes para editar esta instituição.' });
                }
            }
            // ---------------------------

            // --- VALIDAÇÃO DE SLUG (NOVO) ---
            // Se o usuário enviou um slug, verifica se já existe em OUTRA instituição
            if (slug) {
                const slugExists = await prisma.institution.findFirst({
                    where: { 
                        slug: slug, 
                        NOT: { id: parseInt(id) } // Ignora a própria instituição
                    }
                });

                if (slugExists) {
                    return res.status(400).json({ error: 'Este domínio (slug) já está em uso por outra instituição.' });
                }
            }

            // --- PREPARAÇÃO DOS DADOS ---
            const dataToUpdate: any = {};
            
            if (name) dataToUpdate.name = name;
            if (primaryColor) dataToUpdate.primaryColor = primaryColor;
            if (slug) dataToUpdate.slug = slug; // Salva o slug
            if (file) dataToUpdate.logoUrl = `/uploads/${file.filename}`;
            
            // Tratamento especial para booleanos (útil se vier de FormData)
            if (isActive !== undefined) {
                // Se vier como string 'true'/'false' converte, senão usa o booleano direto
                dataToUpdate.isActive = String(isActive) === 'true';
            }

            const updatedInstitution = await prisma.institution.update({
                where: { id: parseInt(id) },
                data: dataToUpdate,
            });

            res.status(200).json(updatedInstitution);
        } catch (error) {
            if ((error as any).code === 'P2025') {
                 return res.status(404).json({ error: 'Instituição não encontrada para atualização' });
            }
            console.error('Erro ao atualizar instituição:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            // Soft Delete: Apenas desativa
            const updated = await prisma.institution.update({
                where: { id: parseInt(id) },
                data: { isActive: false } 
            });

            res.status(200).json({ message: 'Instituição desativada com sucesso', institution: updated });
        } catch (error) {
            if ((error as any).code === 'P2025') {
                 return res.status(404).json({ error: 'Instituição não encontrada' });
            }
            console.error('Erro ao desativar instituição:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getPublic(req: Request, res: Response) {
        try {
            // Busca apenas instituições que NÃO são do tipo 'company'
            const institutions = await prisma.institution.findMany({
                where: {
                    type: 'university'
                }
            });
            res.status(200).json(institutions);
        } catch (error) {
            console.error('Erro ao buscar instituições públicas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async reactivate(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            const updated = await prisma.institution.update({
                where: { id: parseInt(id) },
                data: { isActive: true } 
            });

            res.status(200).json({ message: 'Instituição reativada com sucesso', institution: updated });
        } catch (error) {
            if ((error as any).code === 'P2025') {
                 return res.status(404).json({ error: 'Instituição não encontrada' });
            }
            console.error('Erro ao reativar instituição:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // Adicione dentro da classe
    async getBySlug(req: Request, res: Response) {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ error: 'O slug da instituição é obrigatório' });
        }

        try {
            const institution = await prisma.institution.findUnique({
                where: { slug },
                include: { _count: { select: { jobs: true } } }
            });

            if (!institution) {
                return res.status(404).json({ error: 'Instituição não encontrada' });
            }

            res.json(institution);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar instituição' });
        }
    }
}