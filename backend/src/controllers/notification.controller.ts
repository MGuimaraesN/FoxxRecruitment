import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export class NotificationController {
    async list(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        try {
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 20
            });
            // Conta não lidas
            const unreadCount = await prisma.notification.count({
                where: { userId, read: false }
            });
            
            res.json({ notifications, unreadCount });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar notificações' });
        }
    }

    async markAsRead(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        try {
            if (!id) {
                return res.status(400).json({ error: 'O ID da notificação é obrigatório' });
            }

            await prisma.notification.updateMany({
                where: { id: parseInt(id), userId },
                data: { read: true }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar notificação' });
        }
    }

    async markAllAsRead(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        try {
            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar notificações' });
        }
    }
}