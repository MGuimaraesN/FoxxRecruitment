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
            const { type } = req.query;
            const whereClause: any = {};
            if (type) whereClause.type = String(type);

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

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name } = req.body;

         if (!name) {
            return res.status(400).json({ error: 'O nome é obrigatório para atualização' });
        }

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            const updatedInstitution = await prisma.institution.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                },
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

    async reactivate(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            // Atualiza isActive para true
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

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID da instituição é obrigatório' });
        }

        try {
            // Em vez de delete, fazemos update para isActive = false
            const updated = await prisma.institution.update({
                where: { id: parseInt(id) },
                data: { isActive: false } 
            });

            // Retornamos a instituição atualizada para confirmar o status
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
            // O padrão é 'university', então buscamos tudo que for 'university' ou nulo (para legado)
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
}