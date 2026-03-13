import express, { Request, Response } from 'express';
import cors from 'cors';
import { publishPost } from './workers/publisher';
import { supabase } from './config/supabase';
import { groq } from './config/groq';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Endpoint de publicação (já existente)
app.post('/api/publish', async (req: Request, res: Response) => {
    const { postId } = req.body;

    if (!postId) {
        res.status(400).json({ success: false, error: 'postId não fornecido' });
        return;
    }

    const result = await publishPost(postId);

    if (result?.success) {
        res.status(200).json(result);
    } else {
        res.status(500).json(result);
    }
});

// Endpoint do Agente IA (NOVO)
app.post('/api/agent', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
        res.status(400).json({ success: false, error: 'Mensagem não fornecida.' });
        return;
    }

    try {
        // 1. Usar Groq para interpretar a intenção do usuário
        const intentResponse = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `Você é o agente de IA do AI Content Studio. Sua função é interpretar comandos do usuário e executar ações.

Você tem as seguintes capacidades:
1. SEARCH - Pesquisar notícias sobre um tema específico nos feeds RSS cadastrados
2. ANALYZE - Analisar um tema e gerar insights de negócios
3. GENERATE - Gerar conteúdo (posts) a partir de um tema ou insight
4. STATUS - Mostrar estatísticas do sistema
5. CHAT - Responder perguntas gerais sobre conteúdo e estratégia

Responda SEMPRE em JSON com este formato:
{
  "action": "SEARCH" | "ANALYZE" | "GENERATE" | "STATUS" | "CHAT",
  "topic": "o tema principal extraído do comando (se aplicável)",
  "response": "sua resposta conversacional ao usuário",
  "details": {} // dados extras conforme a ação
}`
                },
                { role: 'user', content: message }
            ],
            response_format: { type: 'json_object' }
        });

        const aiResult = JSON.parse(intentResponse.choices[0]?.message?.content || '{}');

        // 2. Executar a ação com base na intenção
        let actionResult: any = {};

        switch (aiResult.action) {
            case 'SEARCH': {
                // Buscar notícias relacionadas ao tema no banco
                const { data: sources } = await supabase
                    .from('content_sources')
                    .select('title, url, source, created_at')
                    .ilike('title', `%${aiResult.topic}%`)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // Buscar também nas discussões
                const { data: discussions } = await supabase
                    .from('community_discussions')
                    .select('title, url, source, created_at')
                    .ilike('title', `%${aiResult.topic}%`)
                    .order('created_at', { ascending: false })
                    .limit(5);

                actionResult = {
                    sources: sources || [],
                    discussions: discussions || [],
                    total: (sources?.length || 0) + (discussions?.length || 0)
                };
                break;
            }

            case 'ANALYZE': {
                // Usar IA para analisar o tema e gerar insight
                const analysisResp = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{
                        role: 'user',
                        content: `Analise o tema "${aiResult.topic}" do ponto de vista de oportunidades de conteúdo para PMEs.
Gere um insight de negócios prático e estratégico.

Responda em JSON:
{
  "insight": "string",
  "content_angles": ["ângulo 1", "ângulo 2", "ângulo 3"],
  "target_audience": "string",
  "viral_potential": number (0-10)
}`
                    }],
                    response_format: { type: 'json_object' }
                });

                actionResult = JSON.parse(analysisResp.choices[0]?.message?.content || '{}');

                // Salvar o insight gerado
                if (actionResult.insight) {
                    await supabase.from('content_insights').insert({
                        business_insight: actionResult.insight,
                        score: actionResult.viral_potential || 8
                    });
                }
                break;
            }

            case 'GENERATE': {
                // Gerar um post rápido sobre o tema
                const genResp = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{
                        role: 'user',
                        content: `Crie um post de LinkedIn sobre "${aiResult.topic}" focado em gerar leads para consultoria de IA para PMEs.

Responda em JSON:
{
  "hook": "string",
  "body": "string",
  "cta": "string",
  "full_post": "string completo formatado"
}`
                    }],
                    response_format: { type: 'json_object' }
                });

                const postData = JSON.parse(genResp.choices[0]?.message?.content || '{}');

                if (postData.full_post) {
                    await supabase.from('generated_posts').insert({
                        platform: 'linkedin',
                        platform_type: 'agent_generated',
                        content_json: postData,
                        status: 'pending'
                    });
                    actionResult = { post_created: true, preview: postData.hook };
                }
                break;
            }

            case 'STATUS': {
                const [{ count: sources }, { count: insights }, { count: posts }] = await Promise.all([
                    supabase.from('content_sources').select('*', { count: 'exact', head: true }),
                    supabase.from('content_insights').select('*', { count: 'exact', head: true }),
                    supabase.from('generated_posts').select('*', { count: 'exact', head: true }).eq('status', 'pending')
                ]);
                actionResult = { sources, insights, pending_posts: posts };
                break;
            }

            default:
                actionResult = {};
        }

        res.json({
            success: true,
            action: aiResult.action,
            response: aiResult.response,
            data: actionResult
        });

    } catch (e: any) {
        console.error('Erro no agente:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API backend rodando na porta ${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  POST http://localhost:${PORT}/api/publish`);
    console.log(`  POST http://localhost:${PORT}/api/agent`);
});
