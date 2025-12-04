import app from './app.js';
import { startCronJobs } from './cron/jobs.js';

const port = process.env.PORT || 5000;

// Inicia os Jobs agendados
startCronJobs();

// --- Iniciar Servidor ---
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
