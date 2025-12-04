import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma.js';
import { sendPasswordResetEmail, sendWelcomeEmail, sendSecurityAlert } from '../services/mail.service.js';

export class UserController {

    async register(req: Request, res: Response) {
        try {
            const {firstName, lastName, email, password, institutionId} = req.body;

            if (!email || !password || !institutionId) {
                return res.status(400).json(
                    {error: 'Email, senha e instituição são obrigatórios'}
                )};

            const hashedPassword = await bcrypt.hash(password, 10);
            const ipUser = req.ip || 'IP não disponível';

            const userExist = await prisma.user.findUnique({
                where: {email: email}
            });

            if (userExist) {
                return res.status(409).json(
                    {error: 'Email já cadastrado'}
                )};

            const newUser = await prisma.user.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: hashedPassword,
                    ip: ipUser
                }});

            const userRole = await prisma.role.findUnique({ where: { name: 'student' } });
            if (!userRole) {
                return res.status(500).json({ error: 'Cargo "user" não encontrado' });
            }

            await prisma.userInstitutionRole.create({
                data: {
                    userId: newUser.id,
                    institutionId: institutionId,
                    roleId: userRole.id
                }
            });

            const updatedUser = await prisma.user.update({
                where: { id: newUser.id },
                data: { activeInstitutionId: institutionId }
            });

            // Envia e-mail de boas-vindas
            try {
                await sendWelcomeEmail(newUser.email, newUser.firstName);
            } catch (emailError) {
                console.error('Erro ao enviar e-mail de boas-vindas:', emailError);
                // Não bloqueia o registro se o e-mail falhar
            }

            const secret = process.env.JWT_SECRET;

            if (!secret) {
                // Se você esqueceu o .env, dará este erro
                throw new Error('Secret não está definido!');
            }

            const payload = {
                userId: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                activeInstitutionId: updatedUser.activeInstitutionId
            };

            const token = jwt.sign(payload, secret, { expiresIn: '8h' });

            return res.status(200).json({
                access_token: token
            });

        } catch (error) {
            console.error ('Erro ao registrar usuário:', error);
            return res.status(500).json({error: 'Erro interno do servidor'});
        };
    }

    async login(req: Request, res: Response) {
        try {
            const {email, password} = req.body;
            const ipUser = req.ip || 'IP não disponível';

            if (!email || !password) {
                return res.status(400).json(
                    {error: 'Email e senha são obrigatórios'}
                )};

            const user = await prisma.user.findUnique({
                where: {email: email}
            });

            if (!user) {
                return res.status(401).json(
                    {error: 'Email ou senha inválidos'}
                )};

            const matchedPassword = await bcrypt.compare(password, user.password);

            if (!matchedPassword) {
                return res.status(401).json(
                    {error: 'Email ou senha inválidos'}
                )};

            await prisma.user.update({
                    where: { id: user.id },
                    data: {
                    lastLogin: new Date(),
                    ip: ipUser
                    }
                });

            const secret = process.env.JWT_SECRET;

            if (!secret) {
                // Se você esqueceu o .env, dará este erro
                throw new Error('Secret não está definido!');
            }

            const payload = {
                userId: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                activeInstitutionId: user.activeInstitutionId
            };

            const token = jwt.sign(payload, secret, { expiresIn: '8h' });

            return res.status(200).json({
                access_token: token
            });

        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return res.status(500).json({error: 'Erro interno do servidor'});
            };
        }

// --- MÉTODO PARA SOLICITAR REDEFINIÇÃO ---
    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'E-mail é obrigatório' });
            }

            const user = await prisma.user.findUnique({
                where: { email: email }
            });

            // Por segurança, não informamos se o e-mail foi encontrado ou não.
            // Apenas enviamos o e-mail se o usuário existir.
            if (user) {
                const secret = process.env.JWT_RESET_SECRET;
                if (!secret) {
                    throw new Error('Segredo JWT de reset não definido!');
                }

                // Cria um token JWT curto (1h) contendo o ID do usuário
                const payload = { userId: user.id };
                const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // 1 hora

                // Salva o token no banco de dados
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        resetToken: token,
                        resetTokenExpiry: new Date(Date.now() + 3600000) // 1 hora a partir de agora
                    }
                });

                // Envia o e-mail
                await sendPasswordResetEmail(user.email, token);
            }

            return res.status(200).json({ 
                message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' 
            });

        } catch (error) {
            console.error('Erro no forgotPassword:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // --- MÉTODO PARA REDEFINIR A SENHA ---
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
            }

            const secret = process.env.JWT_RESET_SECRET;
            if (!secret) {
                throw new Error('Segredo JWT de reset não definido!');
            }

            // 1. Verifica a validade e expiração do JWT
            let payload: any;
            try {
                payload = jwt.verify(token, secret);
            } catch (error) {
                return res.status(401).json({ error: 'Token inválido ou expirado.' });
            }

            // 2. Verifica se o token ainda está no banco (não foi usado)
            const user = await prisma.user.findFirst({
                where: {
                    id: payload.userId,
                    resetToken: token,
                    resetTokenExpiry: {
                        gte: new Date() // Verifica se a data de expiração é maior ou igual a agora
                    }
                }
            });

            if (!user) {
                return res.status(401).json({ error: 'Token inválido, expirado ou já utilizado.' });
            }

            // 3. Atualiza a senha e invalida o token
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,       // Invalida o token
                    resetTokenExpiry: null  // Limpa a expiração
                }
            });

            // Envia alerta de segurança
            try {
                await sendSecurityAlert(user.email);
            } catch (emailError) {
                console.error('Erro ao enviar alerta de segurança (resetPassword):', emailError);
            }

            return res.status(200).json({ message: 'Senha redefinida com sucesso!' });

        } catch (error) {
            console.error('Erro no resetPassword:', error);
            // Pega erros de JWT expirado
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ error: 'Token expirado.' });
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ error: 'Token inválido.' });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
        
    async profile(req: Request, res: Response) {
        try {
            const userEmail = (req as any).user?.email;

            const userData = await prisma.user.findUnique({
                where: {email: userEmail},
                include: {
                    institutions: {
                        include: {
                            institution: true,
                            role: true
                        }
                    }
                }
            });

            res.status(200).json({
                userId: userData?.id,
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                email: userData?.email,
                avatarUrl: userData?.avatarUrl,
                institutions: userData?.institutions,
                activeInstitutionId: userData?.activeInstitutionId,
                bio: userData?.bio,
                linkedinUrl: userData?.linkedinUrl,
                githubUrl: userData?.githubUrl,
                portfolioUrl: userData?.portfolioUrl,
                course: userData?.course,
                graduationYear: userData?.graduationYear
            })
        } catch (error) {
            console.error('Erro detalhado ao obter perfil do usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor ao buscar perfil', details: (error as Error).message });
        }
    }

    async changePassword(req: Request, res: Response) {
        try {
            const userEmail = (req as any).user?.email;
            const { oldPassword, newPassword } = req.body;

            const user = await prisma.user.findUnique({
                where: { email: userEmail }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: 'Senha antiga incorreta' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { email: userEmail },
                data: { password: hashedPassword }
            });

            // Envia alerta de segurança
            try {
                await sendSecurityAlert(user.email);
            } catch (emailError) {
                console.error('Erro ao enviar alerta de segurança (changePassword):', emailError);
            }

            res.status(200).json({ message: 'Senha alterada com sucesso' });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async switchInstitution(req: Request, res: Response) {
        try {
            const userEmail = (req as any).user?.email;
            const { institutionId } = req.body;

            const user = await prisma.user.findUnique({
                where: { email: userEmail },
                include: { institutions: true }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const isMember = user.institutions.some(inst => inst.institutionId === institutionId);

            if (!isMember) {
                return res.status(403).json({ error: 'Usuário não pertence a esta instituição' });
            }

            const updatedUser = await prisma.user.update({
                where: { email: userEmail },
                data: { activeInstitutionId: institutionId }
            });

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('Secret não está definido!');
            }

            const payload = {
                userId: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                activeInstitutionId: updatedUser.activeInstitutionId
            };

            const token = jwt.sign(payload, secret, { expiresIn: '8h' });

            res.status(200).json({
                message: 'Instituição alterada com sucesso',
                access_token: token
            });
        } catch (error) {
            console.error('Erro ao trocar de instituição:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userEmail = (req as any).user?.email;
            const {
                bio,
                linkedinUrl,
                githubUrl,
                portfolioUrl,
                course,
                graduationYear
            } = req.body;

            const updatedUser = await prisma.user.update({
                where: { email: userEmail },
                data: {
                    bio,
                    linkedinUrl,
                    githubUrl,
                    portfolioUrl,
                    course,
                    graduationYear
                }
            });

            res.status(200).json(updatedUser);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async uploadAvatar(req: Request, res: Response) {
        try {
            const userEmail = (req as any).user?.email;
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const avatarUrl = `/uploads/${req.file.filename}`;

            await prisma.user.update({
                where: { email: userEmail },
                data: { avatarUrl }
            });

            res.status(200).json({ avatarUrl });
        } catch (error) {
            console.error('Erro ao fazer upload de avatar:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    // --- NOVO MÉTODO ---
    async uploadResume(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo PDF enviado' });
            
            const resumeUrl = `/uploads/${req.file.filename}`;
            await prisma.user.update({
                where: { id: userId },
                data: { resumeUrl }
            });
            res.status(200).json({ resumeUrl });
        } catch (error) {
            console.error('Erro upload CV:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    }
};
