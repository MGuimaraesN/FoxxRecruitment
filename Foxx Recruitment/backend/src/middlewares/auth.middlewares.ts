import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma.js'; // Importe o prisma
import type { UserPayload } from '../types/express.js';

export class AuthMiddleware {

  async auth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ error: 'Token inválido' });
        }

        const token = parts[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('Secret não está definido!');
        }

        const payload = jwt.verify(token as string, secret) as UserPayload;
        
        // --- NOVA VERIFICAÇÃO DE INSTITUIÇÃO ATIVA ---
        if (payload.activeInstitutionId) {
            const institution = await prisma.institution.findUnique({
                where: { id: payload.activeInstitutionId },
                select: { isActive: true }
            });

            if (institution && !institution.isActive) {
                // Se a instituição existe mas está desativada (isActive = false)
                return res.status(403).json({ 
                    error: 'Acesso suspenso: Sua instituição foi desativada temporariamente.' 
                });
            }
        }
        // ----------------------------------------------

        (req as any).user = payload;

        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
             // Formato inválido, ignora e segue como guest
             return next();
        }

        const token = parts[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            // Se não tem secret configurado, erro 500
             console.error("JWT_SECRET não definido");
             return next();
        }

        const payload = jwt.verify(token as string, secret) as UserPayload;
        (req as any).user = payload;

        next();
    } catch (error) {
        // Token inválido/expirado -> Segue como guest
        next();
    }
  }

};
