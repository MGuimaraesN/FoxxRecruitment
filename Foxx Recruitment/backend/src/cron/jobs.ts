import cron from 'node-cron';
import { prisma } from '../database/prisma.js';
import { sendSavedJobReminder } from '../services/mail.service.js';

export const startCronJobs = () => {
    // Roda todos os dias às 09:00
    cron.schedule('0 9 * * *', async () => {
        console.log('🕒 Iniciando cron job: Lembrete de vagas salvas...');

        try {
            // Data limite: 7 dias atrás
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Buscar SavedJobs criados há mais de 7 dias
            // e onde a vaga ainda está 'open' ou 'published'
            const oldSavedJobs = await prisma.savedJob.findMany({
                where: {
                    createdAt: {
                        lte: sevenDaysAgo
                    },
                    job: {
                        status: {
                            in: ['published', 'open']
                        }
                    }
                },
                include: {
                    user: {
                        select: { email: true }
                    },
                    job: {
                        select: { title: true }
                    }
                }
            });

            console.log(`🔎 Encontrados ${oldSavedJobs.length} lembretes para enviar.`);

            // Enviar e-mails (com throttle ou Promise.all limitado seria ideal, mas Promise.all simples serve pro MVP)
            await Promise.all(oldSavedJobs.map(async (savedJob) => {
                try {
                    await sendSavedJobReminder(savedJob.user.email, savedJob.job.title);
                } catch (err) {
                    console.error(`❌ Erro ao enviar lembrete para ${savedJob.user.email}:`, err);
                }
            }));

            console.log('✅ Cron job finalizado.');
        } catch (error) {
            console.error('🔥 Erro fatal no cron job:', error);
        }
    });
};
