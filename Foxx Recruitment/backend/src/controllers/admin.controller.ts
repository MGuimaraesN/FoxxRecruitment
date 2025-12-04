import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import bcrypt from 'bcrypt';

export class AdminController {

    // ... (Mantenha o método createUser e createUniversity iguais) ...

    async createUser(req: Request, res: Response) {
        // ... (Código existente do createUser mantido)
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
                activeInstitutionId: institutionId 
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

    async createUniversity(req: Request, res: Response) {
        // ... (Código existente do createUniversity mantido)
         try {
            const { 
                universityName, 
                firstName, 
                lastName, 
                email, 
                password 
            } = req.body;

            if (!universityName || !email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const institutionExists = await prisma.institution.findUnique({ where: { name: universityName } });
            const userExists = await prisma.user.findUnique({ where: { email } });

            if (institutionExists) return res.status(409).json({ error: 'Faculdade já cadastrada' });
            if (userExists) return res.status(409).json({ error: 'Email do administrador já cadastrado' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const ipUser = req.ip || 'IP não disponível';

            const roleAdmin = await prisma.role.findUnique({ where: { name: 'admin' } });
            if (!roleAdmin) return res.status(500).json({ error: 'Cargo "admin" não configurado no sistema.' });

            const result = await prisma.$transaction(async (tx) => {
                const newInstitution = await tx.institution.create({
                  data: { 
                        name: universityName,
                        type: 'university'
                    }
                });

                const newUser = await tx.user.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                        password: hashedPassword,
                        ip: ipUser,
                        activeInstitutionId: newInstitution.id
                    }
                });

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

  // --- MÉTODO GET STATS ATUALIZADO ---
  async getStats(req: Request, res: Response) {
    try {
      const authorId = (req as any).user?.userId;
      if (!authorId) {
          return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const userRoles = await prisma.userInstitutionRole.findMany({
          where: { userId: authorId },
          include: { role: true }
      });
      const roleNames = userRoles.map(ur => ur.role.name);
      const isGlobalAdmin = roleNames.includes('admin') || roleNames.includes('superadmin');

      if (isGlobalAdmin) {
          // GLOBAIS: Adicionado contagem de candidaturas
          const userCount = await prisma.user.count();
          const institutionCount = await prisma.institution.count();
          const jobCount = await prisma.job.count();
          const applicationCount = await prisma.application.count(); // <--- NOVO
          
          res.json({
              type: 'global',
              userCount,
              institutionCount,
              jobCount,
              applicationCount // <--- NOVO
          });
      } else {
          // PESSOAIS: Estatísticas mais detalhadas para o Tenant Admin/Professor
          const myJobs = await prisma.job.findMany({
              where: { authorId: authorId }
          });

          const totalMyJobs = myJobs.length;
          const publishedMyJobs = myJobs.filter(job => ['published', 'open'].includes(job.status)).length;
          const draftMyJobs = myJobs.filter(job => job.status === 'rascunho').length;
          
          // --- NOVAS MÉTRICAS ---
          const jobIds = myJobs.map(j => j.id);
          
          // Total de candidaturas recebidas nas minhas vagas
          const totalApplications = await prisma.application.count({
              where: { jobId: { in: jobIds } }
          });

          // Candidaturas pendentes de revisão (Ação necessária)
          const pendingApplications = await prisma.application.count({
              where: { jobId: { in: jobIds }, status: 'PENDING' }
          });

          res.json({
              type: 'personal',
              totalMyJobs,
              publishedMyJobs,
              draftMyJobs,
              totalApplications,   // <--- NOVO
              pendingApplications  // <--- NOVO
          });
      }
    } catch (error) {
      res.status(500).json({'Erro ao buscar estatísticas.': error});
    }
  }

  // ... (Mantenha getAllUsers, getUserDetails, assignRoleToUser, removeRoleFromUser, deleteUser, createCompany, updateUser, getInstitutionDetails iguais) ...
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
      await prisma.userInstitutionRole.deleteMany({
        where: { userId: Number(id) },
      });
       await prisma.savedJob.deleteMany({
        where: { userId: Number(id) },
      });
       await prisma.job.deleteMany({
        where: { authorId: Number(id) },
      });
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

    async createCompany(req: Request, res: Response) {
        try {
            const { 
                companyName,
                firstName, 
                lastName, 
                email, 
                password 
            } = req.body;

            if (!companyName || !email || !password || !firstName) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }
            const institutionExists = await prisma.institution.findUnique({ where: { name: companyName } });
            const userExists = await prisma.user.findUnique({ where: { email } });

            if (institutionExists) return res.status(409).json({ error: 'Nome da empresa já cadastrado' });
            if (userExists) return res.status(409).json({ error: 'Email do usuário já cadastrado' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const ipUser = req.ip || 'IP não disponível';
            const roleEmpresa = await prisma.role.findUnique({ where: { name: 'empresa' } });
            if (!roleEmpresa) return res.status(500).json({ error: 'Cargo "empresa" não configurado no sistema.' });

            const result = await prisma.$transaction(async (tx) => {
                const newInstitution = await tx.institution.create({
                  data: { 
                        name: companyName,
                        type: 'company' 
                    }
                });

                const newUser = await tx.user.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                        password: hashedPassword,
                        ip: ipUser,
                        activeInstitutionId: newInstitution.id
                    }
                });

                await tx.userInstitutionRole.create({
                    data: {
                        userId: newUser.id,
                        institutionId: newInstitution.id,
                        roleId: roleEmpresa.id
                    }
                });

                return { company: newInstitution, user: newUser };
            });

            res.status(201).json(result);

        } catch (error) {
            console.error('Erro ao criar empresa:', error);
            res.status(500).json({ error: 'Erro interno ao criar empresa.' });
        }
    }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
      }
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
            
            const institution = await prisma.institution.findUnique({
                where: { id: Number(id) },
                include: {
                    users: {
                        include: {
                            user: true,
                            role: true
                        }
                    },
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
            const logs = [
                ...institution.users.map(u => ({
                    id: `usr-${u.id}`,
                    type: 'USER',
                    message: `Usuário ${u.user.firstName} ${u.user.lastName} associado como ${u.role.name}`,
                    date: u.user.createdAt, 
                    actor: 'Sistema'
                })),
                ...institution.jobs.map(j => ({
                    id: `job-${j.id}`,
                    type: 'JOB',
                    message: `Vaga "${j.title}" criada`,
                    date: j.createdAt,
                    actor: `${j.author.firstName} ${j.author.lastName}`
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 

            res.json({ institution, logs });

        } catch (error) {
            console.error('Erro ao buscar detalhes da instituição:', error);
            res.status(500).json({ error: 'Erro interno ao buscar detalhes.' });
        }
    }
}