// mguimaraesn/decola-vagas/Decola-Vagas-refactor-auth-logic/backend/src/middlewares/rbac.middlewares.ts

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.js';
import type { UserPayload } from '../types/express.js';

export class RbacMiddleware {
    checkRole = (allowedRoles: string[]) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const userPayload = (req as any).user as UserPayload;
                if (!userPayload?.userId) {
                    return res.status(401).json({ error: 'Acesso negado: Usuário não autenticado.' });
                }

                // --- INÍCIO DA LÓGICA CORRIGIDA ---

                // 1. Separar cargos globais (NÃO precisam de instituição ativa)
                const globalRoles = allowedRoles.filter(
                    role => role === 'superadmin' || role === 'admin'
                );

                if (globalRoles.length > 0) {
                    const userGlobalRole = await prisma.userInstitutionRole.findFirst({
                        where: {
                            userId: userPayload.userId,
                            role: { name: { in: globalRoles } },
                        },
                    });

                    // Se o usuário TEM um cargo global em qualquer instituição, PERMITA o acesso.
                    // Esta verificação ignora o 'activeInstitutionId' propositalmente.
                    if (userGlobalRole) {
                        return next();
                    }
                }

                // 2. Separar cargos de instituição (PRECISAM de instituição ativa)
                const institutionSpecificRoles = allowedRoles.filter(
                    role => role !== 'superadmin' && role !== 'admin'
                );

                if (institutionSpecificRoles.length > 0) {
                    // SÓ AQUI verificamos a instituição ativa.
                    if (!userPayload.activeInstitutionId) {
                        return res.status(403).json({ error: 'Acesso negado: Nenhuma instituição ativa.' });
                    }

                    const userRole = await prisma.userInstitutionRole.findFirst({
                        where: {
                            userId: userPayload.userId,
                            institutionId: userPayload.activeInstitutionId,
                        },
                        include: { role: true },
                    });

                    if (!userRole || !institutionSpecificRoles.includes(userRole.role.name)) {
                        return res.status(403).json({ error: 'Acesso negado: Permissões insuficientes para esta instituição.' });
                    }

                    // Se o usuário tem o cargo específico na instituição ativa, PERMITA.
                    return next();
                }

                // 3. Fallback: Se a rota exigia um cargo (ex: 'admin') e o usuário não o tem.
                return res.status(403).json({ error: 'Acesso negado: Permissões insuficientes.' });

                // --- FIM DA LÓGICA CORRIGIDA ---

            } catch (error) {
                res.status(500).json({ error: 'Erro interno ao verificar permissões.' });
            }
        }
    }
}
