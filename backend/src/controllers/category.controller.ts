import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export class CategoryController {
    async getAll(req: Request, res: Response) {
        try {
            const categories = await prisma.category.findMany();
            return res.status(200).json(categories);
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const category = await prisma.category.findUnique({
                where: { id: Number(id) }
            });

            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            return res.status(200).json(category);
        } catch (error) {
            console.error('Erro ao buscar categoria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getByName(req: Request, res: Response) {
        try {
            const { name } = req.params;

            if (!name) {
                return res.status(400).json({ error: "Nome da catergoria é obrigatório" })
            }

            const category = await prisma.category.findUnique({
                where: { name: name }
            });

            if (!category) {
                return res.status(404).json({ error: "Categoria não encontrada" })
            }

            return res.status(200).json({
                id: category?.id,
                name: category?.name
            });
        } catch (error) {
            console.error("Erro ao buscar categoria:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Nome da catergoria é obrigatório" })
            }

            const isCategoryExist = await prisma.category.findUnique({
                where: { name: name }
            });

            if (isCategoryExist) {
                return res.status(409).json({ error: "Categoria já cadastrada" })
            }

            const newCategory = await prisma.category.create({
                data: { name: name }
            });

            return res.status(201).json(newCategory);
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
            }

            const category = await prisma.category.findUnique({
                where: { id: Number(id) }
            });

            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            const updatedCategory = await prisma.category.update({
                where: { id: Number(id) },
                data: { name }
            });

            return res.status(200).json(updatedCategory);
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const category = await prisma.category.findUnique({
                where: { id: Number(id) }
            });

            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            await prisma.category.delete({
                where: { id: Number(id) }
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao deletar categoria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};
