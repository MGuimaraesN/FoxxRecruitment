import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import bcrypt from 'bcrypt';

export class AdminController {

    async createUser(req: Request, res: Response) {
    try {
        const { firstName, lastName, email, password, institutionId, roleId } = req.body;
        
        if (!email || !password || !institutionId || !roleId) {
          return res.status(400).json(
            {error: 'Email, senha, instituição e cargo são obrigatórios'}
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
            ip: ipUser,
            // --- CORREÇÃO AQUI ---
            activeInstitutionId: institutionId // Define a primeira instituição como ativa
            // --- FIM DA CORREÇÃO ---
          }});

        await prisma.userInstitutionRole.create({
          data: {
            userId: newUser.id,
            institutionId,
            roleId,
          },
        });

        res.status(201).json(newUser);
      } catch (error) {
        console.error ('Erro ao registrar usuário:', error);
        return res.status(500).json({'Erro ao registrar usuário:': error});
      }
    }

  async getStats(req: Request, res: Response) {
    try {
      // --- INÍCIO DA ALTERAÇÃO ---
      const authorId = (req as any).user?.userId;
      if (!authorId) {
          return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      // 1. Buscar todos os cargos do usuário
      const userRoles = await prisma.userInstitutionRole.findMany({
          where: { userId: authorId },
          include: { role: true }
      });
      const roleNames = userRoles.map(ur => ur.role.name);

      // 2. Verificar se é admin ou superadmin
      const isGlobalAdmin = roleNames.includes('admin') || roleNames.includes('superadmin');

      if (isGlobalAdmin) {
          // Retorna estatísticas GLOBAIS
          const userCount = await prisma.user.count();
          const institutionCount = await prisma.institution.count();
          const jobCount = await prisma.job.count();
          
          res.json({
              type: 'global',
              userCount,
              institutionCount,
              jobCount,
          });
      } else {
          // Retorna estatísticas PESSOAIS (para professor, coordenador, empresa)
          const myJobs = await prisma.job.findMany({
              where: { authorId: authorId }
          });

          const totalMyJobs = myJobs.length;
          const publishedMyJobs = myJobs.filter(job => job.status === 'published' || job.status === 'open').length;
          const draftMyJobs = myJobs.filter(job => job.status === 'rascunho').length;

          res.json({
              type: 'personal',
              totalMyJobs,
              publishedMyJobs,
              draftMyJobs,
          });
      }
      // --- FIM DA ALTERAÇÃO ---
    } catch (error) {
      res.status(500).json({'Erro ao buscar estatísticas.': error});
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: {
          institutions: {
            include: {
              institution: true,
              role: true,
            },
          },
        },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({'Erro ao buscar usuários.': error});
    }
  }

  async getUserDetails(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(req.params.id) },
        include: {
          institutions: {
            include: {
              institution: true,
              role: true,
            },
          },
        },
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({'Erro ao buscar detalhes do usuário.': error});
    }
  }

    async assignRoleToUser(req: Request, res: Response) {
        try {
          const { userId, institutionId, roleId } = req.body;

          // Lógica de "upsert": atualiza se existir, cria se não existir
          const userInstitutionRole = await prisma.userInstitutionRole.upsert({
            where: {
              userId_institutionId: {
                userId,
                institutionId,
              },
            },
            update: {
              roleId,
            },
            create: {
              userId,
              institutionId,
              roleId,
            },
          });

          res.json(userInstitutionRole);
        } catch (error) {
            console.error('Erro ao atribuir/atualizar cargo:', error);
            res.status(500).json({'Erro ao atribuir cargo ao usuário.': error});
        }
    }

  async removeRoleFromUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.userInstitutionRole.delete({
        where: { id: Number(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({'Erro ao remover cargo do usuário.': error});
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // --- Adicionado para consistência de dados ---
      // 1. Deletar vínculos de UserInstitutionRole
      await prisma.userInstitutionRole.deleteMany({
        where: { userId: Number(id) },
      });

      // 2. Deletar Vagas Salvas
       await prisma.savedJob.deleteMany({
        where: { userId: Number(id) },
      });

      // 3. Deletar Vagas Criadas (ou anonimizar, mas deletar é mais simples)
       await prisma.job.deleteMany({
        where: { authorId: Number(id) },
      });
      // --- Fim da adição ---

      // 4. Deletar o usuário
      await prisma.user.delete({
        where: { id: Number(id) },
      });
      res.status(204).send();
    } catch (error) {
       if ((error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Usuário não encontrado' });
       }
      res.status(500).json({'Erro ao deletar usuário.': error});
    }
  }

// Adicione este método na classe AdminController
  async createUniversity(req: Request, res: Response) {
        try {
            const { 
                universityName, // Nome da Faculdade
                firstName, 
                lastName, 
                email, 
                password 
            } = req.body;

            // Validação básica
            if (!universityName || !email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            // 1. Verificar duplicidade
            const institutionExists = await prisma.institution.findUnique({ where: { name: universityName } });
            const userExists = await prisma.user.findUnique({ where: { email } });

            if (institutionExists) return res.status(409).json({ error: 'Faculdade já cadastrada' });
            if (userExists) return res.status(409).json({ error: 'Email do administrador já cadastrado' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const ipUser = req.ip || 'IP não disponível';

            // 2. Buscar o ID da role 'admin' (que será o admin da faculdade)
            const roleAdmin = await prisma.role.findUnique({ where: { name: 'admin' } });
            if (!roleAdmin) return res.status(500).json({ error: 'Cargo "admin" não configurado no sistema.' });

            // 3. Transação: Cria Faculdade -> Cria User -> Vincula
            const result = await prisma.$transaction(async (tx) => {
                // Cria a Faculdade
                const newInstitution = await tx.institution.create({
                  data: { 
                        name: universityName,
                        type: 'university' // Define explicitamente como universidade
                    }
                });

                // Cria o Usuário Admin
                const newUser = await tx.user.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                        password: hashedPassword,
                        ip: ipUser,
                        activeInstitutionId: newInstitution.id // Já loga no contexto dessa faculdade
                    }
                });

                // Cria o Vínculo (UserInstitutionRole)
                await tx.userInstitutionRole.create({
                    data: {
                        userId: newUser.id,
                        institutionId: newInstitution.id,
                        roleId: roleAdmin.id
                    }
                });

                return { university: newInstitution, adminUser: newUser };
            });

            res.status(201).json(result);

        } catch (error) {
            console.error('Erro ao criar faculdade:', error);
            res.status(500).json({ error: 'Erro interno ao criar faculdade.' });
        }
    }

  // Adicione este método na classe AdminController
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
      }

      // Verifica se o email já está em uso por OUTRO usuário
      if (email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });
        if (emailExists && emailExists.id !== Number(id)) {
          return res.status(409).json({ error: 'Este email já está em uso por outro usuário.' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: {
          firstName,
          lastName,
          email,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
    }
  }

async getInstitutionDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID da instituição é obrigatório.' });
            }
            
            const institution = await prisma.institution.findUnique({
                where: { id: Number(id) },
                include: {
                    // Buscar usuários vinculados através da tabela pivô
                    users: {
                        include: {
                            user: true,
                            role: true
                        }
                    },
                    // Buscar vagas vinculadas à instituição
                    jobs: {
                        include: {
                            author: {
                                select: { firstName: true, lastName: true, email: true }
                            },
                            area: true,
                            category: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!institution) {
                return res.status(404).json({ error: 'Instituição não encontrada' });
            }

            // --- Gerar um Log Unificado (Simulação baseada em dados existentes) ---
            // Num sistema real, criaríamos uma tabela 'AuditLog'
            const logs = [
                ...institution.users.map(u => ({
                    id: `usr-${u.id}`,
                    type: 'USER',
                    message: `Usuário ${u.user.firstName} ${u.user.lastName} associado como ${u.role.name}`,
                    date: u.user.createdAt, // Usando data de criação do user como ref
                    actor: 'Sistema'
                })),
                ...institution.jobs.map(j => ({
                    id: `job-${j.id}`,
                    type: 'JOB',
                    message: `Vaga "${j.title}" criada`,
                    date: j.createdAt,
                    actor: `${j.author.firstName} ${j.author.lastName}`
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ordenar por mais recente

            res.json({ institution, logs });

        } catch (error) {
            console.error('Erro ao buscar detalhes da instituição:', error);
            res.status(500).json({ error: 'Erro interno ao buscar detalhes.' });
        }
      }
}
