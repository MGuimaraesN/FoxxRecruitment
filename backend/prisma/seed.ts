// backend/prisma/seed.ts

import { PrismaClient, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Seed para Demonstração (Demo Mode)...');

  // ------------------------------------------------------------
  // 1. LIMPEZA (Opcional - remova os comentários se quiser resetar tudo)
  // ------------------------------------------------------------
  // await prisma.notification.deleteMany();
  // await prisma.savedJob.deleteMany();
  // await prisma.application.deleteMany();
  // await prisma.job.deleteMany();
  // await prisma.userInstitutionRole.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.institution.deleteMany();
  // console.log('🧹 Banco limpo (parcialmente) para garantir consistência.');

  // ------------------------------------------------------------
  // 2. CONFIGURAÇÕES BÁSICAS (Cargos, Áreas, Categorias)
  // ------------------------------------------------------------
  
  // Cargos
  const roles = ['superadmin', 'admin', 'professor', 'empresa', 'student'];
  const roleMap: Record<string, number> = {};
  for (const name of roles) {
    const r = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roleMap[name] = r.id;
  }

  // Áreas
  const areas = [
    'Tecnologia', 'Design', 'Administração', 'Saúde', 'Engenharia'
  ];
  const areaMap: Record<string, number> = {};
  for (const name of areas) {
    const a = await prisma.area.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    areaMap[name] = a.id;
  }

  // Categorias
  const categories = ['Estágio', 'Júnior', 'Pleno', 'Bolsa Pesquisa', 'Trainee'];
  const catMap: Record<string, number> = {};
  for (const name of categories) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    catMap[name] = c.id;
  }

  // ------------------------------------------------------------
  // 3. INSTITUIÇÕES (O Ecossistema)
  // ------------------------------------------------------------
  console.log('iu Criando Instituições...');

  // A Universidade Principal
  const university = await prisma.institution.upsert({
    where: { slug: 'uni-demo' }, // Usando slug como chave única lógica se disponível, ou name
    update: {},
    create: {
      name: 'Universidade Federal de Demonstração',
      slug: 'uni-demo',
      type: 'university',
      primaryColor: '#1d4ed8', // Azul institucional
      logoUrl: 'https://via.placeholder.com/150/1d4ed8/ffffff?text=UFD', // Placeholder
      isActive: true
    }
  });

  // Uma Empresa Parceira
  const company = await prisma.institution.upsert({
    where: { slug: 'tech-corp' },
    update: {},
    create: {
      name: 'Tech Corp Innovation',
      slug: 'tech-corp',
      type: 'company',
      primaryColor: '#7c3aed', // Roxo tech
      logoUrl: 'https://via.placeholder.com/150/7c3aed/ffffff?text=Tech',
      isActive: true
    }
  });

  // ------------------------------------------------------------
  // 4. USUÁRIOS (Personas)
  // ------------------------------------------------------------
  console.log('👤 Criando Personas de Acesso...');
  const password = await bcrypt.hash('123456', 10);

  // 4.1. Admin da Universidade (Coordenador)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      firstName: 'Alice', lastName: 'Admin', email: 'admin@demo.com', password,
      ip: '127.0.0.1', activeInstitutionId: university.id,
      bio: 'Coordenadora de Estágios da UFD.',
      institutions: {
        create: { institutionId: university.id, roleId: roleMap['admin'] }
      }
    }
  });

  // 4.2. Recrutador da Empresa
  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recrutador@tech.com' },
    update: {},
    create: {
      firstName: 'Roberto', lastName: 'Recruiter', email: 'recrutador@tech.com', password,
      ip: '127.0.0.1', activeInstitutionId: company.id,
      bio: 'Talent Acquisition na Tech Corp.',
      phone: '(11) 99999-8888',
      institutions: {
        create: { institutionId: company.id, roleId: roleMap['empresa'] }
      }
    }
  });

  // 4.3. Aluno "Estrela" (Perfil completo)
  const studentUser = await prisma.user.upsert({
    where: { email: 'aluno@demo.com' },
    update: {},
    create: {
      firstName: 'Bruno', lastName: 'Estudante', email: 'aluno@demo.com', password,
      ip: '127.0.0.1', activeInstitutionId: university.id,
      course: 'Ciência da Computação', graduationYear: 2025,
      bio: 'Apaixonado por React e Node.js.',
      linkedinUrl: 'https://linkedin.com/in/demo',
      githubUrl: 'https://github.com/demo', // Assumindo que exista ou possa ser adicionado
      portfolioUrl: 'https://bruno.dev',
      institutions: {
        create: { institutionId: university.id, roleId: roleMap['student'] }
      }
    }
  });

  // ------------------------------------------------------------
  // 5. VAGAS (Cenários de Vagas)
  // ------------------------------------------------------------
  console.log('💼 Criando Vagas para Demonstração...');

  // Vaga 1: Empresa Tech (Pública e Aberta)
  const jobTechFull = await prisma.job.upsert({
    where: { id: 1 }, // Tentativa de manter ID fixo (funciona melhor se DB limpo)
    update: {},
    create: {
      title: 'Desenvolvedor Full Stack Júnior',
      description: '<h1>Oportunidade Incrível</h1><p>Venha trabalhar com React e Node.js em projetos internacionais.</p>',
      authorId: recruiterUser.id,
      institutionId: company.id,
      areaId: areaMap['Tecnologia'],
      categoryId: catMap['Júnior'],
      status: 'published',
      isPublic: true,
      email: 'jobs@techcorp.com',
      telephone: '11999999999',
      ip: '127.0.0.1'
    }
  });

  // Vaga 2: Empresa Tech (Estágio)
  const jobTechIntern = await prisma.job.create({
    data: {
      title: 'Estágio em QA',
      description: '<p>Aprenda automação de testes.</p>',
      authorId: recruiterUser.id,
      institutionId: company.id,
      areaId: areaMap['Tecnologia'],
      categoryId: catMap['Estágio'],
      status: 'published',
      isPublic: true,
      email: 'jobs@techcorp.com',
      telephone: '11999999999',
      ip: '127.0.0.1'
    }
  });

  // Vaga 3: Universidade (Bolsa Interna)
  const jobResearch = await prisma.job.create({
    data: {
      title: 'Bolsa de Iniciação Científica - IA',
      description: '<p>Projeto de pesquisa em Redes Neurais.</p>',
      authorId: adminUser.id, // Admin postando como universidade
      institutionId: university.id,
      areaId: areaMap['Tecnologia'],
      categoryId: catMap['Bolsa Pesquisa'],
      status: 'published',
      isPublic: false, // Visível apenas para alunos da universidade
      email: 'pesquisa@ufd.edu.br',
      telephone: '1133334444',
      ip: '127.0.0.1'
    }
  });

  // ------------------------------------------------------------
  // 6. CANDIDATURAS (Para mostrar o Dashboard do Aluno/Empresa)
  // ------------------------------------------------------------
  console.log('📝 Gerando Candidaturas...');

  // Aluno aplicou para Full Stack -> ACEITO (Cenário de Sucesso)
  await prisma.application.upsert({
    where: { userId_jobId: { userId: studentUser.id, jobId: jobTechFull.id } },
    update: {},
    create: {
      userId: studentUser.id,
      jobId: jobTechFull.id,
      status: ApplicationStatus.ACCEPTED,
      resumeUrl: 'https://exemplo.com/curriculo.pdf'
    }
  });

  // Aluno aplicou para Estágio QA -> REJEITADO (Cenário de Frustração/Feedback)
  await prisma.application.create({
    data: {
      userId: studentUser.id,
      jobId: jobTechIntern.id,
      status: ApplicationStatus.REJECTED,
    }
  });

  // Aluno aplicou para Bolsa -> PENDENTE (Cenário de Espera)
  await prisma.application.create({
    data: {
      userId: studentUser.id,
      jobId: jobResearch.id,
      status: ApplicationStatus.REVIEWING,
    }
  });

  // ------------------------------------------------------------
  // 7. NOTIFICAÇÕES E FAVORITOS
  // ------------------------------------------------------------
  console.log('🔔 Criando Notificações...');

  await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: 'Parabéns! Você foi aprovado.',
      message: 'A empresa Tech Corp aceitou sua candidatura para Desenvolvedor Full Stack.',
      read: false,
      link: `/dashboard/applications`
    }
  });

  await prisma.savedJob.create({
    data: {
      userId: studentUser.id,
      jobId: jobResearch.id
    }
  });

  console.log('==============================================');
  console.log('✅ SEED DE DEMONSTRAÇÃO CONCLUÍDO!');
  console.log('==============================================');
  console.log('📋 Credenciais para teste:');
  console.log('   1. 🎓 ADMIN UNIV:   admin@demo.com      (123456)');
  console.log('   2. 🏢 RECRUTADOR:   recrutador@tech.com (123456)');
  console.log('   3. 🧑‍🎓 ALUNO:        aluno@demo.com      (123456)');
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
