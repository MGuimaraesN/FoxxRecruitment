import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export class AreaController {

    async getAll(req: Request, res: Response) {
        try {
            const areas = await prisma.area.findMany();
            return res.status(200).json(areas);
        } catch (error) {
            console.error('Erro ao buscar areas:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'O ID da area é obrigatório' });
            }

            const area = await prisma.area.findUnique({
                where: { id: parseInt(id) }
            });

            if (!area) {
                return res.status(404).json({ error: 'Area não encontrada' });
            }

            return res.status(200).json(area);
        } catch (error) {
            console.error('Erro ao buscar area:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nome da area é obrigatório' });
            }

            const isAreaExist = await prisma.area.findUnique({
                where: { name: name }
            });

            if (isAreaExist) {
                return res.status(409).json({ error: 'Area já cadastrada' });
            }

            const newArea = await prisma.area.create({
                data: { name: name }
            });

            return res.status(201).json(newArea);
        } catch (error) {
            console.error('Erro ao criar area:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nome da area é obrigatório' });
            }

            if (!id) {
                return res.status(400).json({ error: 'O ID da area é obrigatório' });
            }

            const area = await prisma.area.findUnique({
                where: { id: parseInt(id) }
            });

            if (!area) {
                return res.status(404).json({ error: 'Area não encontrada' });
            }

            const updatedArea = await prisma.area.update({
                where: { id: parseInt(id) },
                data: { name }
            });

            return res.status(200).json(updatedArea);
        } catch (error) {
            console.error('Erro ao atualizar area:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'O ID da area é obrigatório' });
            }

            const area = await prisma.area.findUnique({
                where: { id: parseInt(id) }
            });

            if (!area) {
                return res.status(404).json({ error: 'Area não encontrada' });
            }

            await prisma.area.delete({
                where: { id: parseInt(id) }
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao deletar area:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
