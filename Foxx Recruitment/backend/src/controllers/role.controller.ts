import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export class RoleController {

    async create(req: Request, res: Response) {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'O nome do cargo é obrigatório' });
        }

        try {
            const roleExists = await prisma.role.findUnique({
                where: { name: name },
            });

            if (roleExists) {
                return res.status(409).json({ error: 'Cargo já cadastrado' });
            }

            const role = await prisma.role.create({
                data: {
                    name,
                },
            });
            res.status(201).json(role);
        } catch (error) {
            console.error('Erro ao criar cargo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const roles = await prisma.role.findMany();
            res.status(200).json(roles);
        } catch (error) {
            console.error('Erro ao buscar cargos:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID do cargo é obrigatório' });
        }

        try {
            const role = await prisma.role.findUnique({
                where: { id: parseInt(id) },
            });

            if (!role) {
                return res.status(404).json({ error: 'Cargo não encontrado' });
            }

            res.status(200).json(role);
        } catch (error) {
            console.error('Erro ao buscar cargo por ID:', error);
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
            return res.status(400).json({ error: 'O ID do cargo é obrigatório' });
        }

        try {
            const updatedRole = await prisma.role.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                },
            });
            res.status(200).json(updatedRole);
        } catch (error) {
            if ((error as any).code === 'P2025') {
                 return res.status(404).json({ error: 'Cargo não encontrado para atualização' });
            }
            console.error('Erro ao atualizar cargo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'O ID do cargo é obrigatório' });
        }

        try {
            await prisma.role.delete({
                where: { id: parseInt(id) },
            });

            res.status(204).send();
        } catch (error) {
            if ((error as any).code === 'P2025') {
                 return res.status(404).json({ error: 'Cargo não encontrado para exclusão' });
            }
            console.error('Erro ao excluir cargo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}