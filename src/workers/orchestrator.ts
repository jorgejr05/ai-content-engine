import cron from 'node-cron';
import { runScraper } from './scraper';
import { runCurator } from './curator';
import { runContentGenerator } from './generator';
import { runSocialListener } from './social_listener';

console.log('🦾 AI Content Engine Orchestrator iniciado!');

// Agendamento: Roda o Scraper a cada 4 horas
// 0 */4 * * * -> Minuto 0 a cada 4 horas
cron.schedule('0 */4 * * *', async () => {
    console.log(`\n[${new Date().toISOString()}] 🕒 Iniciando ciclo do Scraper...`);
    await runScraper();
});

// Agendamento: Roda o Social Listener a cada 6 horas
cron.schedule('0 */6 * * *', async () => {
    console.log(`\n[${new Date().toISOString()}] 🕒 Iniciando ciclo do Social Listener (Reddit)...`);
    await runSocialListener();
});

// Agendamento: Roda o Curador a cada 2 horas
// 0 */2 * * * -> Minuto 0 a cada 2 horas
cron.schedule('0 */2 * * *', async () => {
    console.log(`\n[${new Date().toISOString()}] 🕒 Iniciando ciclo do Curator...`);
    await runCurator();
});

// Agendamento: Roda o Content Generator todo dia às 09:00 e 15:00
// 0 9,15 * * * -> Minuto 0 às 09 e 15h
cron.schedule('0 9,15 * * *', async () => {
    console.log(`\n[${new Date().toISOString()}] 🕒 Iniciando ciclo do Generator...`);
    await runContentGenerator();
});

console.log('Cron jobs configurados. Aguardando...');
