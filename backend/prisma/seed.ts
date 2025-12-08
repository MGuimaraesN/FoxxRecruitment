import { PrismaClient, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- DADOS REAIS PARA GERAÇÃO ---

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Quintino', 'Rafael', 'Sofia', 'Thiago',
  'Ursula', 'Vinicius', 'Wanessa', 'Xavier', 'Yasmin', 'Zeca', 'Amanda', 'Bernardo', 'Camila', 'Diogo'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
];

const JOB_DESCRIPTIONS_HTML = [
  `
    <p><strong>Sobre a vaga:</strong></p>
    <p>Estamos em busca de um talento para compor nosso time. Você terá a oportunidade de trabalhar em projetos desafiadores.</p>
    <p><strong>Responsabilidades:</strong></p>
    <ul>
      <li>Auxiliar no desenvolvimento de soluções;</li>
      <li>Participar de reuniões de planejamento;</li>
      <li>Documentar processos.</li>
    </ul>
    <p><strong>Requisitos:</strong></p>
    <ul>
      <li>Proatividade;</li>
      <li>Vontade de aprender;</li>
      <li>Conhecimento básico na área.</li>
    </ul>
  `,
  `
    <p>Venha fazer parte da nossa equipe! Buscamos pessoas criativas e inovadoras.</p>
    <p><strong>O que oferecemos:</strong></p>
    <ul>
      <li>Bolsa auxílio compatível com o mercado;</li>
      <li>Vale transporte e refeição;</li>
      <li>Ambiente descontraído e flexível (Híbrido).</li>
    </ul>
    <p>Se você quer crescer profissionalmente, essa é sua chance!</p>
  `,
  `
    <p><strong>Descrição:</strong></p>
    <p>Atuar no suporte direto à gestão, elaborando relatórios e planilhas.</p>
    <p><strong>Diferenciais:</strong></p>
    <ul>
      <li>Inglês intermediário;</li>
      <li>Domínio do pacote Office/Google Workspace.</li>
    </ul>
  `
];

// --- FUNÇÕES AUXILIARES ---

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName() {
  return {
    first: getRandomItem(FIRST_NAMES),
    last: getRandomItem(LAST_NAMES)
  };
}

// --- FUNÇÃO PRINCIPAL ---

async function main() {
  console.log('🚀 Iniciando Seed Seguro (Upsert)...');

  // =================================================
  // 1. ROLES (Papéis do Sistema)
  // =================================================
  console.log('👤 Verificando Cargos...');
  const rolesList = ['superadmin', 'admin', 'professor', 'coordenador', 'empresa', 'student'];
  const roleMap: Record<string, number> = {};
  
  for (const name of rolesList) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {}, // Não faz nada se já existir
      create: { name },
    });
    roleMap[name] = role.id;
  }

  // =================================================
  // 2. AREAS
  // =================================================
  console.log('📚 Verificando Áreas de Atuação...');
  const areasData = [
    'Tecnologia da Informação', 'Saúde e Enfermagem', 'Engenharia Civil', 'Direito', 
    'Administração', 'Marketing e Comunicação', 'Design e Artes', 'Recursos Humanos', 
    'Finanças e Contabilidade', 'Educação e Pedagogia'
  ];
  const areaIds: number[] = [];
  
  for (const name of areasData) {
    const area = await prisma.area.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    areaIds.push(area.id);
  }

  // =================================================
  // 3. CATEGORIES
  // =================================================
  console.log('🏷️ Verificando Categorias...');
  const categoriesData = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Trainee', 'Iniciação Científica', 'Voluntariado'];
  const catIds: number[] = [];
  
  for (const name of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    catIds.push(cat.id);
  }

  // =================================================
  // 4. INSTITUTIONS
  // =================================================
  console.log('iu Verificando Instituições e Empresas...');
  const institutionsData = [
    { name: 'Universidade Federal do Estado (UF)', type: 'university' },
    { name: 'Pontifícia Universidade Católica (PUC)', type: 'university' },
    { name: 'Instituto Tecnológico (FATEC)', type: 'university' },
    { name: 'Universidade Estácio de Sá', type: 'university' },
    { name: 'Tech Solutions Ltda', type: 'company' },
    { name: 'Banco Financeiro S.A.', type: 'company' },
    { name: 'Agência Criativa Marketing', type: 'company' },
    { name: 'Hospital Central', type: 'company' },
    { name: 'Construtora Horizonte', type: 'company' }
  ];

  const instMap: Record<string, number> = {};

  for (const inst of institutionsData) {
    const created = await prisma.institution.upsert({
      where: { name: inst.name },
      update: { type: inst.type }, // Garante que o tipo esteja correto caso mude
      create: { name: inst.name, type: inst.type },
    });
    instMap[inst.name] = created.id;
  }

  // ID de referência para relacionamentos
  const mainUniversityId = instMap['Universidade Federal do Estado (UF)'];
  const mainCompanyId = instMap['Tech Solutions Ltda'];

  // =================================================
  // 5. USERS (Contas Fixas e Aleatórias)
  // =================================================
  console.log('🔑 Gerenciando Usuários (Senha padrão: 123456)...');
  const password = await bcrypt.hash('123456', 10);

  // Lista de usuários fixos para teste
  const fixedUsers = [
    { email: 'superadmin@decola.com', first: 'Super', last: 'Admin', role: 'superadmin', instId: mainUniversityId },
    { email: 'admin@decola.com', first: 'Admin', last: 'UF', role: 'admin', instId: mainUniversityId },
    { email: 'professor@decola.com', first: 'Roberto', last: 'Professor', role: 'professor', instId: mainUniversityId },
    { email: 'coordenador@decola.com', first: 'Sandra', last: 'Coordenadora', role: 'coordenador', instId: mainUniversityId },
    { email: 'aluno@decola.com', first: 'João', last: 'Aluno', role: 'student', instId: mainUniversityId, course: 'Engenharia de Software' },
    { email: 'recrutador@tech.com', first: 'Carlos', last: 'Recruiter', role: 'empresa', instId: mainCompanyId }
  ];

  // Gera lista de usuários aleatórios (alunos e recrutadores)
  const bulkUsers = [];
  
  // 40 Alunos Aleatórios
  for (let i = 0; i < 40; i++) {
    const nameData = generateName();
    const instId = getRandomItem(Object.values(instMap).slice(0, 4)); // Apenas universidades
    bulkUsers.push({
      email: `aluno${i}@teste.com`,
      first: nameData.first,
      last: nameData.last,
      role: 'student',
      instId,
      course: getRandomItem(['Sistemas de Informação', 'Direito', 'Administração', 'Enfermagem']),
      graduationYear: getRandomInt(2025, 2029)
    });
  }

  // 10 Recrutadores Aleatórios
  for (let i = 0; i < 10; i++) {
    const nameData = generateName();
    const isCompany = Math.random() > 0.5;
    const role = isCompany ? 'empresa' : 'professor';
    // Se empresa, pega uma das empresas, senão uma das universidades
    const instId = isCompany 
        ? getRandomItem(institutionsData.filter(i => i.type === 'company').map(c => instMap[c.name]))
        : getRandomItem(institutionsData.filter(i => i.type === 'university').map(u => instMap[u.name]));
    
    bulkUsers.push({
      email: `${role}${i}@teste.com`,
      first: nameData.first,
      last: nameData.last,
      role,
      instId
    });
  }

  const allUsersToProcess = [...fixedUsers, ...bulkUsers];
  
  const userIds: number[] = [];
  const recruiterIds: number[] = [];
  const studentIds: number[] = [];

  for (const u of allUsersToProcess) {
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        activeInstitutionId: u.instId,
        // Atualiza campos opcionais apenas se não existirem (ou sobrescreve, dependendo da sua preferência)
        course: u.course || undefined
      },
      create: {
        firstName: u.first, lastName: u.last, email: u.email, password, ip: '127.0.0.1',
        activeInstitutionId: u.instId, course: u.course, 
        bio: `Bio gerada automaticamente para ${u.first}.`,
        linkedinUrl: 'https://linkedin.com',
        graduationYear: u.graduationYear
      }
    });

    // 2. Upsert Role (Vínculo)
    await prisma.userInstitutionRole.upsert({
      where: { 
        userId_institutionId: { 
          userId: user.id, 
          institutionId: u.instId 
        } 
      },
      update: { roleId: roleMap[u.role] },
      create: { userId: user.id, institutionId: u.instId, roleId: roleMap[u.role] }
    });

    userIds.push(user.id);
    if (u.role === 'student') studentIds.push(user.id);
    if (['professor', 'coordenador', 'admin', 'empresa', 'superadmin'].includes(u.role)) recruiterIds.push(user.id);
  }

  // =================================================
  // 6. JOBS (Vagas) - Upsert Logico
  // =================================================
  console.log('💼 Gerenciando Vagas...');
  const jobTitles = [
    'Desenvolvedor Front-end', 'Analista de Marketing', 'Estagiário de Direito', 'Auxiliar Administrativo',
    'Enfermeiro Júnior', 'Designer Gráfico', 'DevOps Engineer', 'Analista Financeiro', 'Técnico de Suporte',
    'Gerente de Projetos', 'Pesquisador Bolsista', 'Redator Publicitário'
  ];

  // Como Job não tem chave única natural além do ID, vamos usar uma estratégia de "criar se não existir título similar para o autor".
  // Ou simplesmente criar novos, mas vamos tentar evitar duplicação massiva se rodar o seed 2x.
  
  const jobsCreatedIds: number[] = [];

  for (let i = 0; i < 80; i++) {
    const authorId = getRandomItem(recruiterIds);
    const author = await prisma.user.findUnique({ 
        where: { id: authorId }, 
        include: { institutions: { include: { institution: true, role: true } } } 
    });
    
    if (!author || !author.activeInstitutionId) continue;
    
    // Pega o papel ativo do usuário nessa instituição
    const activeRole = author.institutions.find(ur => ur.institutionId === author.activeInstitutionId);
    if (!activeRole) continue;

    const isCompany = activeRole.role.name === 'empresa';
    const institutionId = author.activeInstitutionId;
    const companyName = isCompany ? activeRole.institution.name : (Math.random() > 0.7 ? 'Empresa Parceira S.A.' : null);
    
    const titleBase = getRandomItem(jobTitles);
    const title = `${titleBase} ${i % 2 === 0 ? 'I' : 'II'}`; // Variação simples
    
    const status = Math.random() > 0.2 ? 'published' : (Math.random() > 0.5 ? 'closed' : 'rascunho');
    const isPublic = isCompany || Math.random() > 0.8;

    // Verificar se já existe uma vaga com este título para este autor nesta instituição (para evitar flood no seed)
    const existingJob = await prisma.job.findFirst({
        where: {
            title: title,
            authorId: authorId,
            institutionId: institutionId
        }
    });

    let jobId;

    if (existingJob) {
        // Se já existe, atualiza (opcional, apenas para garantir dados frescos)
        const updated = await prisma.job.update({
            where: { id: existingJob.id },
            data: { status, isPublic } 
        });
        jobId = updated.id;
    } else {
        // Se não existe, cria
        const created = await prisma.job.create({
            data: {
                title,
                description: getRandomItem(JOB_DESCRIPTIONS_HTML),
                email: author.email,
                telephone: `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
                status,
                isPublic,
                authorId,
                institutionId,
                areaId: getRandomItem(areaIds),
                categoryId: getRandomItem(catIds),
                companyName,
                ip: '127.0.0.1',
                createdAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000) // Data retroativa
            }
        });
        jobId = created.id;
    }
    
    if (status === 'published' || status === 'open') {
        jobsCreatedIds.push(jobId);
    }
  }

  // =================================================
  // 7. APPLICATIONS (Candidaturas) - Upsert
  // =================================================
  console.log('📝 Gerenciando Candidaturas...');
  
  if (jobsCreatedIds.length > 0) {
      for (const studentId of studentIds) {
        // Cada aluno aplica para 1 a 3 vagas aleatórias
        const numApps = getRandomInt(1, 3);
        
        for (let k = 0; k < numApps; k++) {
            const jobId = getRandomItem(jobsCreatedIds);
            const statusOptions: ApplicationStatus[] = ['PENDING', 'PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'];
            
            // Upsert usando a chave composta @@unique([userId, jobId]) definida no schema
            await prisma.application.upsert({
                where: {
                    userId_jobId: {
                        userId: studentId,
                        jobId: jobId
                    }
                },
                update: {}, // Não altera se já existir
                create: {
                    userId: studentId,
                    jobId: jobId,
                    status: getRandomItem(statusOptions),
                    resumeUrl: `/uploads/fake-resume-${studentId}.pdf`
                }
            });
        }
      }
  }

  // =================================================
  // 8. SAVED JOBS (Favoritos) - Upsert
  // =================================================
  console.log('❤️ Gerenciando Favoritos...');
  if (jobsCreatedIds.length > 0) {
      for (const studentId of studentIds) {
        const jobId = getRandomItem(jobsCreatedIds);
        
        // Upsert usando a chave composta @@unique([userId, jobId])
        await prisma.savedJob.upsert({
            where: {
                userId_jobId: {
                    userId: studentId,
                    jobId: jobId
                }
            },
            update: {}, 
            create: {
                userId: studentId,
                jobId: jobId
            }
        });
      }
  }

  // =================================================
  // 9. NOTIFICATIONS (Opcional, Create apenas)
  // =================================================
  // Notificações geralmente não têm unique key complexa, então podemos criar apenas se o user não tiver nenhuma, ou sempre criar.
  // Para evitar flood, vamos verificar se o usuário já tem notificações.
  console.log('🔔 Gerenciando Notificações...');
  for (const studentId of studentIds) {
      const count = await prisma.notification.count({ where: { userId: studentId } });
      if (count === 0) {
        await prisma.notification.create({
            data: {
                userId: studentId,
                title: 'Bem-vindo ao Decola Vagas!',
                message: 'Complete seu perfil para ter mais chances nas candidaturas.',
                read: false,
                link: '/dashboard/profile'
            }
        });
      }
  }

  console.log('✅ SEED FINALIZADO COM SUCESSO! 🚀');
  console.log('   O banco de dados foi populado/atualizado sem duplicidades.');
  console.log('   Teste com: admin@decola.com (senha: 123456)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });